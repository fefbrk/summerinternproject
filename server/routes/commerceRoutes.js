const registerCommerceRoutes = (app, deps) => {
  const {
    database,
    uuidv4,
    productCatalogService,
    sanitizePlainText,
    sanitizeEmail,
    isValidEmail,
    checkContactRateLimit,
    orderStatuses,
    registrationStatuses,
  } = deps;

  if (!productCatalogService || typeof productCatalogService.getProductById !== 'function') {
    throw new Error('productCatalogService is required for commerce routes');
  }

  const MAX_PAGE_SIZE = 1000;
  const DEFAULT_PAGE_SIZE = 1000;

  const resolvePagination = (query, defaultLimit = DEFAULT_PAGE_SIZE) => {
    const rawLimit = Number(query?.limit);
    const rawPage = Number(query?.page);

    const limit = Number.isFinite(rawLimit) && rawLimit > 0
      ? Math.min(Math.floor(rawLimit), MAX_PAGE_SIZE)
      : defaultLimit;

    const page = Number.isFinite(rawPage) && rawPage > 0
      ? Math.floor(rawPage)
      : 1;

    const offset = (page - 1) * limit;

    return { limit, page, offset };
  };

  const paginateRows = (rows, pagination) => {
    return rows.slice(pagination.offset, pagination.offset + pagination.limit);
  };

  const toCents = (amount) => Math.round(Number(amount) * 100);
  const fromCents = (amountInCents) => amountInCents / 100;

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
      const orders = await database.getAllOrders();
      res.json(paginateRows(orders, pagination));
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
        shippingAddress: normalizedShippingAddress,
        customerName,
        customerEmail,
        createdAt: new Date().toISOString(),
      };

      const order = await database.createOrder(newOrder);
      res.json(order);
    } catch (error) {
      console.error('Error creating order:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  app.put('/api/orders/:id/status', async (req, res) => {
    try {
      const id = sanitizePlainText(req.params.id, 64);
      const status = sanitizePlainText(req.body?.status, 40);

      if (!orderStatuses.has(status)) {
        return res.status(400).json({ error: 'Invalid order status' });
      }

      const order = await database.updateOrderStatus(id, status);
      if (!order) {
        return res.status(404).json({ error: 'Order not found' });
      }

      res.json(order);
    } catch (error) {
      console.error('Error updating order status:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  app.get('/api/registrations', async (req, res) => {
    try {
      const pagination = resolvePagination(req.query);
      const registrations = await database.getAllRegistrations();
      res.json(paginateRows(registrations, pagination));
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

      const newRegistration = {
        id: uuidv4(),
        userId: req.user.id,
        courseName: sanitizedCourseName,
        registrationData,
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
      res.json(registration);
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
      const contacts = await database.getAllContacts();
      res.json(paginateRows(contacts, pagination));
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
      res.json(contact);
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
