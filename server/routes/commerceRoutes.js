const crypto = require('node:crypto');
const { resolvePagination, paginateRows } = require('../utils/pagination');
const { toCents, fromCents } = require('../utils/currency');

const registerCommerceRoutes = (app, deps) => {
  const {
    database,
    uuidv4,
    productCatalogService,
    paymentService,
    sanitizePlainText,
    sanitizeEmail,
    isValidEmail,
    checkContactRateLimit,
    orderStatuses,
    registrationStatuses,
    paymentStatuses,
  } = deps;

  if (!productCatalogService || typeof productCatalogService.getProductById !== 'function') {
    throw new Error('productCatalogService is required for commerce routes');
  }

  const effectivePaymentStatuses = paymentStatuses instanceof Set
    ? paymentStatuses
    : new Set(['pending', 'paid', 'failed', 'refunded']);
  const fulfillmentStatusesRequiringPaid = new Set(['preparing', 'shipping', 'delivered']);
  const manualFulfillmentStatuses = new Set(['received', 'preparing', 'shipping']);
  const carrierStatusToOrderStatus = {
    shipping: 'shipping',
    in_transit: 'shipping',
    out_for_delivery: 'shipping',
    delivered: 'delivered',
  };
  const allowedCarrierStatuses = new Set(Object.keys(carrierStatusToOrderStatus));
  const manualFulfillmentOverrideEnabled = process.env.ENABLE_MANUAL_FULFILLMENT_OVERRIDE === 'true';
  const manualPaymentOverrideEnabled = process.env.ENABLE_MANUAL_PAYMENT_OVERRIDE === 'true';
  const carrierWebhookSecret = sanitizePlainText(process.env.CARRIER_WEBHOOK_SECRET, 256);
  const CARRIER_WEBHOOK_MAX_CLOCK_SKEW_MS = 5 * 60 * 1000;
  const CARRIER_WEBHOOK_WINDOW_MS = Number.isFinite(Number(process.env.CARRIER_WEBHOOK_WINDOW_MS)) && Number(process.env.CARRIER_WEBHOOK_WINDOW_MS) > 0
    ? Number(process.env.CARRIER_WEBHOOK_WINDOW_MS)
    : 60 * 1000;
  const CARRIER_WEBHOOK_MAX_ATTEMPTS = Number.isFinite(Number(process.env.CARRIER_WEBHOOK_MAX_ATTEMPTS)) && Number(process.env.CARRIER_WEBHOOK_MAX_ATTEMPTS) > 0
    ? Number(process.env.CARRIER_WEBHOOK_MAX_ATTEMPTS)
    : 120;
  const CARRIER_WEBHOOK_RATE_LIMIT_MAX_ENTRIES = Number.isFinite(Number(process.env.CARRIER_WEBHOOK_RATE_LIMIT_MAX_ENTRIES)) && Number(process.env.CARRIER_WEBHOOK_RATE_LIMIT_MAX_ENTRIES) > 0
    ? Number(process.env.CARRIER_WEBHOOK_RATE_LIMIT_MAX_ENTRIES)
    : 50000;
  const carrierWebhookAttempts = new Map();
  const superAdminEmailSet = new Set(
    String(process.env.SUPER_ADMIN_EMAILS || process.env.DEFAULT_ADMIN_EMAIL || '')
      .split(',')
      .map((email) => sanitizeEmail(email))
      .filter(Boolean)
  );

  const isSuperAdmin = (user) => {
    if (!user || !user.isAdmin) {
      return false;
    }

    const normalizedEmail = sanitizeEmail(user.email);
    return normalizedEmail ? superAdminEmailSet.has(normalizedEmail) : false;
  };

  const toSingleHeaderValue = (headerValue) => {
    if (Array.isArray(headerValue)) {
      return headerValue[0] || '';
    }

    return typeof headerValue === 'string' ? headerValue : '';
  };

  const getClientIp = (req) => {
    return req.ip || req.socket?.remoteAddress || 'unknown';
  };

  const pruneRateLimitMap = (attemptMap, now, maxEntries) => {
    for (const [key, record] of attemptMap.entries()) {
      if (!record || typeof record.resetAt !== 'number' || now > record.resetAt) {
        attemptMap.delete(key);
      }
    }

    if (attemptMap.size <= maxEntries) {
      return;
    }

    const sortedEntries = [...attemptMap.entries()].sort((a, b) => {
      return a[1].resetAt - b[1].resetAt;
    });

    const removeCount = attemptMap.size - maxEntries;
    for (let index = 0; index < removeCount; index += 1) {
      attemptMap.delete(sortedEntries[index][0]);
    }
  };

  const checkCarrierWebhookRateLimit = async (req, res, next) => {
    const clientIp = getClientIp(req);

    if (typeof database.incrementRateLimit === 'function') {
      try {
        const key = `ip:${clientIp}`;
        const state = await database.incrementRateLimit(
          'carrier_webhook',
          key,
          CARRIER_WEBHOOK_WINDOW_MS,
          CARRIER_WEBHOOK_RATE_LIMIT_MAX_ENTRIES
        );

        if (state.count > CARRIER_WEBHOOK_MAX_ATTEMPTS) {
          return res.status(429).json({ error: 'Too many webhook requests. Please try again later.' });
        }

        return next();
      } catch (error) {
        console.error('Carrier webhook rate-limit error:', error);
        return res.status(500).json({ error: 'Internal server error' });
      }
    }

    const now = Date.now();
    pruneRateLimitMap(carrierWebhookAttempts, now, CARRIER_WEBHOOK_RATE_LIMIT_MAX_ENTRIES);

    const record = carrierWebhookAttempts.get(clientIp);
    if (!record || now > record.resetAt) {
      if (carrierWebhookAttempts.size >= CARRIER_WEBHOOK_RATE_LIMIT_MAX_ENTRIES) {
        return res.status(429).json({ error: 'Too many webhook requests. Please try again later.' });
      }

      carrierWebhookAttempts.set(clientIp, {
        count: 1,
        resetAt: now + CARRIER_WEBHOOK_WINDOW_MS,
      });

      return next();
    }

    if (record.count >= CARRIER_WEBHOOK_MAX_ATTEMPTS) {
      return res.status(429).json({ error: 'Too many webhook requests. Please try again later.' });
    }

    record.count += 1;
    carrierWebhookAttempts.set(clientIp, record);
    return next();
  };

  const resolveCarrierWebhookTimestamp = (rawHeaderValue) => {
    const raw = sanitizePlainText(rawHeaderValue, 32);
    if (!raw || !/^\d{10,16}$/.test(raw)) {
      return null;
    }

    const numeric = Number(raw);
    if (!Number.isFinite(numeric) || numeric <= 0) {
      return null;
    }

    return raw.length <= 10 ? numeric * 1000 : numeric;
  };

  const isFreshCarrierWebhookTimestamp = (timestampMs) => {
    if (!Number.isFinite(timestampMs)) {
      return false;
    }

    return Math.abs(Date.now() - timestampMs) <= CARRIER_WEBHOOK_MAX_CLOCK_SKEW_MS;
  };

  const computeCarrierWebhookSignature = ({ timestampMs, rawBody }) => {
    return crypto
      .createHmac('sha256', carrierWebhookSecret)
      .update(`${timestampMs}.${rawBody}`)
      .digest('hex');
  };

  const isValidCarrierWebhookSignature = ({ providedSignature, timestampMs, rawBody }) => {
    if (!carrierWebhookSecret) {
      return false;
    }

    const normalizedProvidedSignature = sanitizePlainText(providedSignature, 256).toLowerCase();
    if (!/^[a-f0-9]{64}$/.test(normalizedProvidedSignature)) {
      return false;
    }

    const expectedSignature = computeCarrierWebhookSignature({ timestampMs, rawBody });
    const expectedBuffer = Buffer.from(expectedSignature, 'utf8');
    const providedBuffer = Buffer.from(normalizedProvidedSignature, 'utf8');

    if (expectedBuffer.length !== providedBuffer.length) {
      return false;
    }

    return crypto.timingSafeEqual(expectedBuffer, providedBuffer);
  };

  const calculateOrderTotalCents = (items) => {
    return items.reduce((sum, item) => {
      return sum + (toCents(item.price) * item.quantity);
    }, 0);
  };

  const normalizeOrderItemImage = (rawImage) => {
    const image = sanitizePlainText(rawImage, 500);
    if (image.startsWith('/assets/')) {
      return image;
    }

    return '';
  };

  app.get('/api/orders', async (req, res) => {
    try {
      const pagination = resolvePagination(req.query);
      const orders = await database.getAllOrders(pagination.limit, pagination.offset);
      res.json(orders);
    } catch (error) {
      console.error('Error getting orders:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  app.get('/api/orders/my', async (req, res) => {
    try {
      const pagination = resolvePagination(req.query);
      const orders = await database.getOrdersByUserId(req.user.id);
      res.json(paginateRows(orders, pagination));
    } catch (error) {
      console.error('Error getting current user orders:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  app.post('/api/orders', async (req, res) => {
    try {
      const items = Array.isArray(req.body?.items) ? req.body.items : [];
      const totalAmount = Number(req.body?.totalAmount);
      const shippingAddress = req.body?.shippingAddress;
      const customerName = sanitizePlainText(req.body?.customerName, 120);
      const customerEmail = sanitizeEmail(req.body?.customerEmail);
      const orderNotes = sanitizePlainText(req.body?.orderNotes || '', 1000);

      if (!items.length || !Number.isFinite(totalAmount) || totalAmount <= 0 || !shippingAddress || typeof shippingAddress !== 'object' || !customerName || !customerEmail || !isValidEmail(customerEmail)) {
        return res.status(400).json({ error: 'Invalid order payload' });
      }

      const normalizedShippingAddress = {
        name: sanitizePlainText(shippingAddress.name, 120),
        phone: sanitizePlainText(shippingAddress.phone, 40),
        email: sanitizeEmail(shippingAddress.email),
        address: sanitizePlainText(shippingAddress.address, 300),
        city: sanitizePlainText(shippingAddress.city, 120),
        province: sanitizePlainText(shippingAddress.province, 120),
        zipCode: sanitizePlainText(shippingAddress.zipCode, 32),
        country: sanitizePlainText(shippingAddress.country, 120),
      };

      if (!normalizedShippingAddress.name || !normalizedShippingAddress.phone || !normalizedShippingAddress.address || !normalizedShippingAddress.city || !normalizedShippingAddress.zipCode || !normalizedShippingAddress.country) {
        return res.status(400).json({ error: 'Invalid shipping address payload' });
      }

      if (normalizedShippingAddress.email && !isValidEmail(normalizedShippingAddress.email)) {
        return res.status(400).json({ error: 'Invalid shipping address email' });
      }

      const normalizedItems = [];
      let hasInvalidOrderItem = false;

      for (const rawItem of items) {
        if (!rawItem || typeof rawItem !== 'object') {
          hasInvalidOrderItem = true;
          break;
        }

        const productId = sanitizePlainText(String(rawItem.id || ''), 80);
        const quantity = Number(rawItem.quantity);

        if (!productId || !Number.isInteger(quantity) || quantity <= 0 || quantity > 100) {
          hasInvalidOrderItem = true;
          break;
        }

        const catalogProduct = productCatalogService.getProductById(productId);
        if (!catalogProduct) {
          hasInvalidOrderItem = true;
          break;
        }

        normalizedItems.push({
          id: catalogProduct.id,
          name: catalogProduct.name,
          quantity,
          price: catalogProduct.price,
          image: normalizeOrderItemImage(rawItem.image),
        });
      }

      if (hasInvalidOrderItem || !normalizedItems.length) {
        return res.status(400).json({ error: 'Order must include valid items' });
      }

      const requestedTotalCents = toCents(totalAmount);
      const calculatedTotalCents = calculateOrderTotalCents(normalizedItems);

      if (!Number.isFinite(requestedTotalCents) || !Number.isFinite(calculatedTotalCents) || calculatedTotalCents <= 0) {
        return res.status(400).json({ error: 'Invalid order total' });
      }

      if (Math.abs(requestedTotalCents - calculatedTotalCents) > 1) {
        return res.status(400).json({ error: 'Order total does not match items' });
      }

      const newOrder = {
        id: uuidv4(),
        userId: req.user.id,
        items: normalizedItems,
        totalAmount: fromCents(calculatedTotalCents),
        status: 'received',
        paymentStatus: 'pending',
        paymentProvider: null,
        paymentReference: null,
        paymentAmount: fromCents(calculatedTotalCents),
        paymentCurrency: 'USD',
        paymentFailedReason: null,
        paidAt: null,
        shippingAddress: normalizedShippingAddress,
        customerName,
        customerEmail,
        orderNotes,
        createdAt: new Date().toISOString(),
      };

      const order = await database.createOrder(newOrder);

      if (paymentService && typeof paymentService.createPendingAttempt === 'function') {
        try {
          await paymentService.createPendingAttempt({
            orderId: order.id,
            provider: 'unassigned',
            amount: order.paymentAmount,
            currency: order.paymentCurrency,
            metadata: {
              source: 'order-create',
              actorUserId: req.user.id,
            },
          });
        } catch (paymentAttemptError) {
          console.error('Error creating pending payment attempt:', paymentAttemptError);
        }
      }

      res.status(201).json(order);
    } catch (error) {
      console.error('Error creating order:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  app.put('/api/orders/:id/status', async (req, res) => {
    try {
      const id = sanitizePlainText(req.params.id, 64);
      const status = sanitizePlainText(req.body?.status, 40);
      const shipmentProvider = sanitizePlainText(req.body?.shipmentProvider, 120);
      const shipmentTrackingNumber = sanitizePlainText(req.body?.shipmentTrackingNumber, 200);
      const overrideReason = sanitizePlainText(req.body?.overrideReason, 500);

      if (!orderStatuses.has(status)) {
        return res.status(400).json({ error: 'Invalid order status' });
      }

      const existingOrder = await database.getOrderById(id);
      if (!existingOrder) {
        return res.status(404).json({ error: 'Order not found' });
      }

      if (existingOrder.status === 'delivered' && status !== 'delivered') {
        return res.status(400).json({ error: 'Delivered orders are carrier managed and cannot be changed manually' });
      }

      if (existingOrder.status === 'shipping' && status !== 'delivered') {
        return res.status(400).json({ error: 'Shipping orders are carrier managed after handoff' });
      }

      if (fulfillmentStatusesRequiringPaid.has(status) && existingOrder.paymentStatus !== 'paid') {
        return res.status(400).json({ error: 'Order payment must be completed before fulfillment' });
      }

      if (status === 'delivered') {
        if (!manualFulfillmentOverrideEnabled) {
          return res.status(403).json({ error: 'Manual fulfillment override is disabled' });
        }

        if (!isSuperAdmin(req.user)) {
          return res.status(403).json({ error: 'Super admin access required for manual delivered override' });
        }

        if (!overrideReason) {
          return res.status(400).json({ error: 'Override reason is required for manual delivered override' });
        }

        const order = await database.updateOrderFulfillment(id, {
          status,
          fulfillmentSource: 'manual-override',
          fulfillmentUpdatedAt: new Date().toISOString(),
        });

        if (!order) {
          return res.status(404).json({ error: 'Order not found' });
        }

        await database.createFulfillmentEvent({
          id: uuidv4(),
          orderId: id,
          source: 'manual-override',
          fromStatus: existingOrder.status,
          toStatus: order.status,
          shipmentProvider: order.shipmentProvider || null,
          shipmentTrackingNumber: order.shipmentTrackingNumber || null,
          providerEventId: null,
          reason: overrideReason,
          actorUserId: req.user.id,
          actorEmail: req.user.email,
          payload: {
            source: 'admin-manual-override',
          },
          createdAt: new Date().toISOString(),
        });

        return res.json(order);
      }

      if (!manualFulfillmentStatuses.has(status)) {
        return res.status(400).json({ error: 'Status can only be updated manually to received, preparing, or shipping' });
      }

      const effectiveShipmentProvider = shipmentProvider || existingOrder.shipmentProvider || '';
      const effectiveTrackingNumber = shipmentTrackingNumber || existingOrder.shipmentTrackingNumber || '';

      if (status === 'shipping' && (!effectiveShipmentProvider || !effectiveTrackingNumber)) {
        return res.status(400).json({ error: 'Shipment provider and tracking number are required when setting shipping status' });
      }

      const order = await database.updateOrderFulfillment(id, {
        status,
        shipmentProvider: status === 'shipping' ? effectiveShipmentProvider : existingOrder.shipmentProvider || null,
        shipmentTrackingNumber: status === 'shipping' ? effectiveTrackingNumber : existingOrder.shipmentTrackingNumber || null,
        fulfillmentSource: status === 'shipping' ? 'carrier' : 'manual',
        fulfillmentUpdatedAt: new Date().toISOString(),
      });
      if (!order) {
        return res.status(404).json({ error: 'Order not found' });
      }

      await database.createFulfillmentEvent({
        id: uuidv4(),
        orderId: id,
        source: 'admin-manual',
        fromStatus: existingOrder.status,
        toStatus: order.status,
        shipmentProvider: order.shipmentProvider || null,
        shipmentTrackingNumber: order.shipmentTrackingNumber || null,
        providerEventId: null,
        reason: status === 'shipping' ? 'admin-marked-shipped' : 'admin-status-update',
        actorUserId: req.user.id,
        actorEmail: req.user.email,
        payload: {
          source: 'admin-manual',
        },
        createdAt: new Date().toISOString(),
      });

      res.json(order);
    } catch (error) {
      console.error('Error updating order status:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  app.get('/api/orders/:id/payment-status', async (req, res) => {
    try {
      const id = sanitizePlainText(req.params.id, 64);
      const order = await database.getOrderById(id);
      if (!order) {
        return res.status(404).json({ error: 'Order not found' });
      }

      if (!req.user.isAdmin && req.user.id !== order.userId) {
        return res.status(403).json({ error: 'Not authorized for this action' });
      }

      const attempts = await database.getPaymentAttemptsByOrderId(id);
      res.json({
        orderId: order.id,
        paymentStatus: order.paymentStatus,
        paymentProvider: order.paymentProvider,
        paymentReference: order.paymentReference,
        paymentAmount: order.paymentAmount,
        paymentCurrency: order.paymentCurrency,
        paymentFailedReason: order.paymentFailedReason,
        paidAt: order.paidAt,
        attempts,
      });
    } catch (error) {
      console.error('Error getting order payment status:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  app.put('/api/orders/:id/payment-status', async (req, res) => {
    try {
      if (!req.user.isAdmin) {
        return res.status(403).json({ error: 'Admin access required' });
      }

      if (!manualPaymentOverrideEnabled) {
        return res.status(403).json({ error: 'Manual payment status update is disabled' });
      }

      const id = sanitizePlainText(req.params.id, 64);
      const paymentStatus = sanitizePlainText(req.body?.paymentStatus, 40);

      if (!effectivePaymentStatuses.has(paymentStatus)) {
        return res.status(400).json({ error: 'Invalid payment status' });
      }

      const order = await database.getOrderById(id);
      if (!order) {
        return res.status(404).json({ error: 'Order not found' });
      }

      const paymentProvider = sanitizePlainText(req.body?.paymentProvider, 120) || order.paymentProvider || 'manual';
      const paymentReference = sanitizePlainText(req.body?.paymentReference, 200) || null;
      const paymentCurrency = sanitizePlainText(req.body?.paymentCurrency, 16).toUpperCase() || order.paymentCurrency || 'USD';

      const rawPaymentAmount = req.body?.paymentAmount;
      const paymentAmount = rawPaymentAmount === undefined
        ? Number(order.paymentAmount || order.totalAmount)
        : Number(rawPaymentAmount);

      if (!Number.isFinite(paymentAmount) || paymentAmount <= 0) {
        return res.status(400).json({ error: 'Invalid payment amount' });
      }

      if (paymentStatus === 'paid' && Math.abs(toCents(paymentAmount) - toCents(order.totalAmount)) > 1) {
        return res.status(400).json({ error: 'Paid amount must match order total' });
      }

      const paymentFailedReason = paymentStatus === 'failed'
        ? sanitizePlainText(req.body?.paymentFailedReason, 500) || 'manual-update'
        : null;

      const paidAt = paymentStatus === 'paid'
        ? (sanitizePlainText(req.body?.paidAt, 64) || new Date().toISOString())
        : null;

      let updatedOrder = null;

      if (paymentService && typeof paymentService.markOrderAsPaid === 'function' && paymentStatus === 'paid') {
        updatedOrder = await paymentService.markOrderAsPaid({
          orderId: id,
          provider: paymentProvider,
          providerReference: paymentReference,
          amount: paymentAmount,
          currency: paymentCurrency,
        });
      } else if (paymentService && typeof paymentService.markOrderAsFailed === 'function' && paymentStatus === 'failed') {
        updatedOrder = await paymentService.markOrderAsFailed({
          orderId: id,
          provider: paymentProvider,
          providerReference: paymentReference,
          amount: paymentAmount,
          currency: paymentCurrency,
          failureReason: paymentFailedReason,
        });
      } else {
        updatedOrder = await database.updateOrderPayment(id, {
          paymentStatus,
          paymentProvider,
          paymentReference,
          paymentAmount,
          paymentCurrency,
          paymentFailedReason,
          paidAt,
        });

        const attemptStatusByPaymentStatus = {
          pending: 'pending',
          refunded: 'cancelled',
        };

        await database.createPaymentAttempt({
          id: uuidv4(),
          orderId: id,
          provider: paymentProvider,
          providerReference: paymentReference,
          amount: paymentAmount,
          currency: paymentCurrency,
          status: attemptStatusByPaymentStatus[paymentStatus] || 'pending',
          failureReason: paymentFailedReason,
          metadata: {
            source: 'manual-admin-update',
            actorUserId: req.user.id,
          },
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      }

      if (!updatedOrder) {
        return res.status(404).json({ error: 'Order not found' });
      }

      res.json(updatedOrder);
    } catch (error) {
      console.error('Error updating order payment status:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  app.post('/webhooks/carrier/orders/:id/status', checkCarrierWebhookRateLimit, async (req, res) => {
    try {
      if (!carrierWebhookSecret) {
        return res.status(503).json({ error: 'Carrier webhook secret is not configured' });
      }

      const providedTimestamp = toSingleHeaderValue(req.headers['x-carrier-webhook-timestamp']);
      const providedSignature = toSingleHeaderValue(req.headers['x-carrier-webhook-signature']);

      const timestampMs = resolveCarrierWebhookTimestamp(providedTimestamp);
      if (!timestampMs || !isFreshCarrierWebhookTimestamp(timestampMs)) {
        return res.status(401).json({ error: 'Invalid carrier webhook timestamp' });
      }

      const rawBody = typeof req.rawBody === 'string'
        ? req.rawBody
        : JSON.stringify(req.body || {});

      if (!isValidCarrierWebhookSignature({ providedSignature, timestampMs, rawBody })) {
        return res.status(401).json({ error: 'Invalid carrier webhook signature' });
      }

      const id = sanitizePlainText(req.params.id, 64);
      const shipmentProvider = sanitizePlainText(req.body?.provider, 120).toLowerCase();
      const providerEventId = sanitizePlainText(req.body?.providerEventId, 200);
      const carrierStatus = sanitizePlainText(req.body?.status, 40).toLowerCase();
      const shipmentTrackingNumber = sanitizePlainText(req.body?.trackingNumber, 200);
      const occurredAtRaw = sanitizePlainText(req.body?.occurredAt, 64);
      const occurredAtMs = Date.parse(occurredAtRaw);
      const occurredAt = Number.isFinite(occurredAtMs)
        ? new Date(occurredAtMs).toISOString()
        : new Date(timestampMs).toISOString();

      if (!shipmentProvider || !providerEventId || !allowedCarrierStatuses.has(carrierStatus) || !shipmentTrackingNumber) {
        return res.status(400).json({ error: 'Invalid carrier webhook payload' });
      }

      const existingOrder = await database.getOrderById(id);
      if (!existingOrder) {
        return res.status(404).json({ error: 'Order not found' });
      }

      if (existingOrder.shipmentTrackingNumber && existingOrder.shipmentTrackingNumber !== shipmentTrackingNumber) {
        return res.status(409).json({ error: 'Tracking number does not match the order tracking number' });
      }

      const duplicateEvent = await database.getFulfillmentEventByProviderEvent(shipmentProvider, providerEventId);
      if (duplicateEvent) {
        return res.json({
          duplicated: true,
          order: existingOrder,
        });
      }

      const mappedOrderStatus = carrierStatusToOrderStatus[carrierStatus];
      const statusRank = {
        received: 0,
        preparing: 1,
        shipping: 2,
        delivered: 3,
      };

      const currentRank = statusRank[existingOrder.status] ?? 0;
      const mappedRank = statusRank[mappedOrderStatus] ?? 0;
      const nextStatus = mappedRank < currentRank ? existingOrder.status : mappedOrderStatus;

      if (fulfillmentStatusesRequiringPaid.has(nextStatus) && existingOrder.paymentStatus !== 'paid') {
        return res.status(400).json({ error: 'Order payment must be completed before fulfillment' });
      }

      const shouldUpdateOrder =
        existingOrder.status !== nextStatus ||
        existingOrder.shipmentProvider !== shipmentProvider ||
        existingOrder.shipmentTrackingNumber !== shipmentTrackingNumber ||
        existingOrder.fulfillmentSource !== 'carrier';

      const updatedOrder = shouldUpdateOrder
        ? await database.updateOrderFulfillment(id, {
          status: nextStatus,
          shipmentProvider,
          shipmentTrackingNumber,
          fulfillmentSource: 'carrier',
          fulfillmentUpdatedAt: occurredAt,
        })
        : existingOrder;

      if (!updatedOrder) {
        return res.status(404).json({ error: 'Order not found' });
      }

      await database.createFulfillmentEvent({
        id: uuidv4(),
        orderId: id,
        source: 'carrier-webhook',
        fromStatus: existingOrder.status,
        toStatus: updatedOrder.status,
        shipmentProvider,
        shipmentTrackingNumber,
        providerEventId,
        reason: mappedRank < currentRank ? `${carrierStatus}:ignored-regression` : carrierStatus,
        actorUserId: null,
        actorEmail: null,
        payload: typeof req.body === 'object' && req.body !== null ? req.body : {},
        createdAt: occurredAt,
      });

      return res.json({
        duplicated: false,
        order: updatedOrder,
      });
    } catch (error) {
      console.error('Error processing carrier webhook:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  });

  app.get('/api/registrations', async (req, res) => {
    try {
      const pagination = resolvePagination(req.query);
      const registrations = await database.getAllRegistrations(pagination.limit, pagination.offset);
      res.json(registrations);
    } catch (error) {
      console.error('Error getting registrations:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  app.get('/api/registrations/my', async (req, res) => {
    try {
      const pagination = resolvePagination(req.query);
      const registrations = await database.getRegistrationsByUserId(req.user.id);
      res.json(paginateRows(registrations, pagination));
    } catch (error) {
      console.error('Error getting current user registrations:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  app.post('/api/registrations', async (req, res) => {
    try {
      const {
        courseName,
        registrationData,
        customerName,
        customerEmail,
        customerPhone,
        shippingAddress,
        shippingCity,
        shippingState,
        shippingZipCode,
        billingAddress,
        billingCity,
        billingState,
        billingZipCode,
      } = req.body;

      const sanitizedCourseName = sanitizePlainText(courseName, 200);
      const sanitizedCustomerName = sanitizePlainText(customerName, 120);
      const sanitizedCustomerEmail = sanitizeEmail(customerEmail);
      const sanitizedCustomerPhone = sanitizePlainText(customerPhone, 40);

      if (!sanitizedCourseName || !sanitizedCustomerName || !sanitizedCustomerEmail || !isValidEmail(sanitizedCustomerEmail) || !sanitizedCustomerPhone) {
        return res.status(400).json({ error: 'Invalid registration payload' });
      }

      // Sanitize registrationData: validate type, sanitize string values, enforce size limit
      let sanitizedRegistrationData = {};
      if (registrationData && typeof registrationData === 'object' && !Array.isArray(registrationData)) {
        const MAX_REGISTRATION_DATA_KEYS = 50;
        const entries = Object.entries(registrationData).slice(0, MAX_REGISTRATION_DATA_KEYS);
        for (const [key, value] of entries) {
          const safeKey = sanitizePlainText(key, 64);
          if (!safeKey) continue;
          if (typeof value === 'string') {
            sanitizedRegistrationData[safeKey] = sanitizePlainText(value, 1000);
          } else if (typeof value === 'number' && Number.isFinite(value)) {
            sanitizedRegistrationData[safeKey] = value;
          } else if (typeof value === 'boolean') {
            sanitizedRegistrationData[safeKey] = value;
          }
          // Skip non-primitive values (nested objects, arrays, null, etc.)
        }
      }

      const registrationDataJson = JSON.stringify(sanitizedRegistrationData);
      if (registrationDataJson.length > 10240) {
        return res.status(400).json({ error: 'Registration data too large' });
      }

      const newRegistration = {
        id: uuidv4(),
        userId: req.user.id,
        courseName: sanitizedCourseName,
        registrationData: sanitizedRegistrationData,
        status: 'registered',
        customerName: sanitizedCustomerName,
        customerEmail: sanitizedCustomerEmail,
        customerPhone: sanitizedCustomerPhone,
        shippingAddress: sanitizePlainText(shippingAddress, 300),
        shippingCity: sanitizePlainText(shippingCity, 120),
        shippingState: sanitizePlainText(shippingState, 120),
        shippingZipCode: sanitizePlainText(shippingZipCode, 32),
        billingAddress: sanitizePlainText(billingAddress, 300),
        billingCity: sanitizePlainText(billingCity, 120),
        billingState: sanitizePlainText(billingState, 120),
        billingZipCode: sanitizePlainText(billingZipCode, 32),
        createdAt: new Date().toISOString(),
      };

      const registration = await database.createRegistration(newRegistration);
      res.status(201).json(registration);
    } catch (error) {
      console.error('Error creating registration:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  app.put('/api/registrations/:id/status', async (req, res) => {
    try {
      const id = sanitizePlainText(req.params.id, 64);
      const status = sanitizePlainText(req.body?.status, 40);

      if (!registrationStatuses.has(status)) {
        return res.status(400).json({ error: 'Invalid registration status' });
      }

      const registration = await database.updateRegistrationStatus(id, status);
      if (!registration) {
        return res.status(404).json({ error: 'Registration not found' });
      }

      res.json(registration);
    } catch (error) {
      console.error('Error updating registration status:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  app.get('/api/contacts', async (req, res) => {
    try {
      const pagination = resolvePagination(req.query);
      const contacts = await database.getAllContacts(pagination.limit, pagination.offset);
      res.json(contacts);
    } catch (error) {
      console.error('Error getting contacts:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  app.post('/api/contacts', checkContactRateLimit, async (req, res) => {
    try {
      const allowedTypes = new Set(['general', 'support', 'training', 'sales']);
      const type = sanitizePlainText(req.body?.type, 40);
      const name = sanitizePlainText(req.body?.name, 120);
      const email = sanitizeEmail(req.body?.email);
      const subject = sanitizePlainText(req.body?.subject, 200);
      const message = sanitizePlainText(req.body?.message, 5000);

      if (!allowedTypes.has(type) || !name || !email || !isValidEmail(email) || !subject || !message) {
        return res.status(400).json({ error: 'Invalid contact payload' });
      }

      const newContact = {
        id: uuidv4(),
        type,
        name,
        email,
        subject,
        message,
        status: 'new',
        createdAt: new Date().toISOString(),
      };

      const contact = await database.createContact(newContact);
      res.status(201).json(contact);
    } catch (error) {
      console.error('Error creating contact:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  app.put('/api/contacts/:id/status', async (req, res) => {
    try {
      const id = sanitizePlainText(req.params.id, 64);
      const status = sanitizePlainText(req.body?.status, 40);
      const allowedStatuses = new Set(['new', 'reviewing', 'answered', 'closed']);

      if (!allowedStatuses.has(status)) {
        return res.status(400).json({ error: 'Invalid contact status' });
      }

      const contact = await database.updateContactStatus(id, status);
      if (!contact) {
        return res.status(404).json({ error: 'Contact not found' });
      }

      res.json(contact);
    } catch (error) {
      console.error('Error updating contact status:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  app.delete('/api/orders/:id', async (req, res) => {
    try {
      const id = sanitizePlainText(req.params.id, 64);

      const result = await database.deleteOrder(id);
      if (result.changes === 0) {
        return res.status(404).json({ error: 'Order not found' });
      }

      res.json({ message: 'Order deleted successfully' });
    } catch (error) {
      console.error('Error deleting order:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  app.delete('/api/registrations/:id', async (req, res) => {
    try {
      const id = sanitizePlainText(req.params.id, 64);

      const result = await database.deleteRegistration(id);
      if (result.changes === 0) {
        return res.status(404).json({ error: 'Registration not found' });
      }

      res.json({ message: 'Registration deleted successfully' });
    } catch (error) {
      console.error('Error deleting registration:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  app.delete('/api/contacts/:id', async (req, res) => {
    try {
      const id = sanitizePlainText(req.params.id, 64);

      const result = await database.deleteContact(id);
      if (result.changes === 0) {
        return res.status(404).json({ error: 'Contact not found' });
      }

      res.json({ message: 'Contact deleted successfully' });
    } catch (error) {
      console.error('Error deleting contact:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });
};

module.exports = registerCommerceRoutes;
