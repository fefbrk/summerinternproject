const {
  addressCreateSchema,
  addressUpdateSchema,
  paymentMethodCreateSchema,
  paymentMethodUpdateSchema,
  privacyDeletionRequestSchema,
  validateRequestBody,
} = require('../utils/validationSchemas');

const getCardType = (cardNumber) => {
  const firstDigit = cardNumber.charAt(0);
  if (firstDigit === '4') return 'visa';
  if (firstDigit === '5') return 'mastercard';
  if (firstDigit === '3') return 'amex';
  return 'unknown';
};

const registerAccountRoutes = (app, deps) => {
  const {
    database,
    uuidv4,
    sanitizePlainText,
    isSelfOrAdmin,
    logSecurityEvent = async () => {},
  } = deps;

  const emitSecurityEvent = (payload) => {
    if (typeof logSecurityEvent !== 'function') {
      return;
    }

    try {
      void logSecurityEvent(payload);
    } catch (_error) {
      // no-op
    }
  };

  app.get('/api/addresses/:userId', async (req, res) => {
    try {
      const userId = sanitizePlainText(req.params.userId, 64);

      if (!isSelfOrAdmin(req.user, userId)) {
        return res.status(403).json({ error: 'Not authorized to view these addresses' });
      }

      const addresses = await database.getUserAddresses(userId);
      res.json(addresses);
    } catch (error) {
      console.error('Error fetching addresses:', error);
      res.status(500).json({ error: 'Failed to fetch addresses' });
    }
  });

  app.post('/api/addresses', async (req, res) => {
    try {
      const parsedBody = validateRequestBody(addressCreateSchema, req.body || {});
      if (!parsedBody.success) {
        return res.status(400).json({ error: parsedBody.errorMessage || 'Invalid address payload' });
      }

      const userId = sanitizePlainText(parsedBody.data.userId, 64);
      const title = sanitizePlainText(parsedBody.data.title, 120);
      const type = sanitizePlainText(parsedBody.data.type, 40);
      const address = sanitizePlainText(parsedBody.data.address, 300);
      const apartment = sanitizePlainText(parsedBody.data.apartment, 120);
      const district = sanitizePlainText(parsedBody.data.district, 120);
      const city = sanitizePlainText(parsedBody.data.city, 120);
      const postalCode = sanitizePlainText(parsedBody.data.postalCode, 32);
      const province = sanitizePlainText(parsedBody.data.province, 120);
      const country = sanitizePlainText(parsedBody.data.country, 120) || 'Turkey';
      const hasIsDefault = typeof parsedBody.data.isDefault === 'boolean';
      const isDefault = hasIsDefault ? Boolean(parsedBody.data.isDefault) : undefined;

      if (!isSelfOrAdmin(req.user, userId)) {
        return res.status(403).json({ error: 'Not authorized to create address for this user' });
      }

      if (!userId || !title || !address || !district || !city || !postalCode || !['delivery', 'billing'].includes(type)) {
        return res.status(400).json({ error: 'Invalid address payload' });
      }

      const newAddress = {
        id: uuidv4(),
        userId,
        title,
        type,
        isDefault: isDefault ? 1 : 0,
        address,
        apartment,
        district,
        city,
        postalCode,
        province,
        country,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await database.createUserAddress(newAddress);

      const createdAddress = await database.getUserAddressById(newAddress.id);
      if (!createdAddress) {
        return res.status(500).json({ error: 'Address created but could not be loaded' });
      }

      res.status(201).json(createdAddress);
    } catch (error) {
      console.error('Error creating address:', error);
      res.status(500).json({ error: 'Failed to create address' });
    }
  });

  app.put('/api/addresses/:id', async (req, res) => {
    try {
      const id = sanitizePlainText(req.params.id, 64);
      const existingAddress = await database.getUserAddressById(id);
      if (!existingAddress) {
        return res.status(404).json({ error: 'Address not found' });
      }

      if (!isSelfOrAdmin(req.user, existingAddress.userId)) {
        return res.status(403).json({ error: 'Not authorized to update this address' });
      }

      const parsedBody = validateRequestBody(addressUpdateSchema, req.body || {});
      if (!parsedBody.success) {
        return res.status(400).json({ error: parsedBody.errorMessage || 'Invalid address payload' });
      }

      const title = sanitizePlainText(parsedBody.data.title, 120);
      const type = sanitizePlainText(parsedBody.data.type, 40);
      const address = sanitizePlainText(parsedBody.data.address, 300);
      const apartment = sanitizePlainText(parsedBody.data.apartment, 120);
      const district = sanitizePlainText(parsedBody.data.district, 120);
      const city = sanitizePlainText(parsedBody.data.city, 120);
      const postalCode = sanitizePlainText(parsedBody.data.postalCode, 32);
      const province = sanitizePlainText(parsedBody.data.province, 120);
      const country = sanitizePlainText(parsedBody.data.country, 120) || 'Turkey';
      const hasIsDefault = typeof parsedBody.data.isDefault === 'boolean';
      const isDefault = hasIsDefault ? Boolean(parsedBody.data.isDefault) : undefined;

      if (!title || !address || !district || !city || !postalCode || !['delivery', 'billing'].includes(type)) {
        return res.status(400).json({ error: 'Invalid address payload' });
      }

      const finalIsDefault = isDefault === undefined
        ? Number(existingAddress.isDefault)
        : (isDefault ? 1 : 0);

      const updatedAddress = {
        title,
        type,
        isDefault: finalIsDefault,
        address,
        apartment,
        district,
        city,
        postalCode,
        province,
        country,
        updatedAt: new Date().toISOString(),
      };

      await database.updateUserAddress(id, updatedAddress);

      const refreshedAddress = await database.getUserAddressById(id);
      if (!refreshedAddress) {
        return res.status(404).json({ error: 'Address not found after update' });
      }

      res.json(refreshedAddress);
    } catch (error) {
      console.error('Error updating address:', error);
      res.status(500).json({ error: 'Failed to update address' });
    }
  });

  app.delete('/api/addresses/:id', async (req, res) => {
    try {
      const id = sanitizePlainText(req.params.id, 64);
      const existingAddress = await database.getUserAddressById(id);
      if (!existingAddress) {
        return res.status(404).json({ error: 'Address not found' });
      }

      if (!isSelfOrAdmin(req.user, existingAddress.userId)) {
        return res.status(403).json({ error: 'Not authorized to delete this address' });
      }

      await database.deleteUserAddress(id);
      res.json({ message: 'Address deleted successfully' });
    } catch (error) {
      console.error('Error deleting address:', error);
      res.status(500).json({ error: 'Failed to delete address' });
    }
  });

  app.get('/api/payment-methods/:userId', async (req, res) => {
    try {
      const userId = sanitizePlainText(req.params.userId, 64);

      if (!isSelfOrAdmin(req.user, userId)) {
        return res.status(403).json({ error: 'Not authorized to view these payment methods' });
      }

      const paymentMethods = await database.getUserPaymentMethods(userId);
      res.json(paymentMethods);
    } catch (error) {
      console.error('Error fetching payment methods:', error);
      res.status(500).json({ error: 'Failed to fetch payment methods' });
    }
  });

  app.post('/api/payment-methods', async (req, res) => {
    try {
      const parsedBody = validateRequestBody(paymentMethodCreateSchema, req.body || {});
      if (!parsedBody.success) {
        return res.status(400).json({ error: parsedBody.errorMessage || 'Invalid payment method payload' });
      }

      const userId = sanitizePlainText(parsedBody.data.userId, 64);
      const cardTitle = sanitizePlainText(parsedBody.data.cardTitle, 120);
      const cardNumber = sanitizePlainText(parsedBody.data.cardNumber, 32).replace(/\s+/g, '');
      const expiryMonth = sanitizePlainText(parsedBody.data.expiryMonth, 2);
      const expiryYear = sanitizePlainText(parsedBody.data.expiryYear, 4);
      const holderName = sanitizePlainText(parsedBody.data.holderName, 120);
      const hasIsDefault = typeof parsedBody.data.isDefault === 'boolean';
      const isDefault = hasIsDefault ? Boolean(parsedBody.data.isDefault) : undefined;

      if (!isSelfOrAdmin(req.user, userId)) {
        return res.status(403).json({ error: 'Not authorized to create payment method for this user' });
      }

      if (!userId || !cardTitle || !/^\d{12,19}$/.test(cardNumber) || !/^\d{1,2}$/.test(expiryMonth) || !/^\d{2,4}$/.test(expiryYear) || !holderName) {
        return res.status(400).json({ error: 'Invalid payment method payload' });
      }

      const newPaymentMethod = {
        id: uuidv4(),
        userId,
        cardTitle,
        cardLastFour: cardNumber.slice(-4),
        cardType: getCardType(cardNumber),
        expiryMonth,
        expiryYear,
        holderName,
        isDefault: isDefault ? 1 : 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await database.createUserPaymentMethod(newPaymentMethod);

      const createdPaymentMethod = await database.getUserPaymentMethodById(newPaymentMethod.id);
      if (!createdPaymentMethod) {
        return res.status(500).json({ error: 'Payment method created but could not be loaded' });
      }

      res.status(201).json(createdPaymentMethod);
    } catch (error) {
      console.error('Error creating payment method:', error);
      res.status(500).json({ error: 'Failed to create payment method' });
    }
  });

  app.put('/api/payment-methods/:id', async (req, res) => {
    try {
      const id = sanitizePlainText(req.params.id, 64);
      const existingPaymentMethod = await database.getUserPaymentMethodById(id);
      if (!existingPaymentMethod) {
        return res.status(404).json({ error: 'Payment method not found' });
      }

      if (!isSelfOrAdmin(req.user, existingPaymentMethod.userId)) {
        return res.status(403).json({ error: 'Not authorized to update this payment method' });
      }

      const parsedBody = validateRequestBody(paymentMethodUpdateSchema, req.body || {});
      if (!parsedBody.success) {
        return res.status(400).json({ error: parsedBody.errorMessage || 'Invalid payment method payload' });
      }

      const cardTitle = sanitizePlainText(parsedBody.data.cardTitle, 120);
      const cardNumber = sanitizePlainText(parsedBody.data.cardNumber, 32).replace(/\s+/g, '');
      const expiryMonth = sanitizePlainText(parsedBody.data.expiryMonth, 2);
      const expiryYear = sanitizePlainText(parsedBody.data.expiryYear, 4);
      const holderName = sanitizePlainText(parsedBody.data.holderName, 120);
      const hasIsDefault = typeof parsedBody.data.isDefault === 'boolean';
      const isDefault = hasIsDefault ? Boolean(parsedBody.data.isDefault) : undefined;

      const updatedPaymentMethod = {
        cardTitle: cardTitle || undefined,
        cardLastFour: cardNumber ? cardNumber.slice(-4) : undefined,
        cardType: cardNumber ? getCardType(cardNumber) : undefined,
        expiryMonth: expiryMonth || undefined,
        expiryYear: expiryYear || undefined,
        holderName: holderName || undefined,
        isDefault: isDefault === undefined ? undefined : (isDefault ? 1 : 0),
        updatedAt: new Date().toISOString(),
      };

      Object.keys(updatedPaymentMethod).forEach((key) => {
        if (updatedPaymentMethod[key] === undefined) {
          delete updatedPaymentMethod[key];
        }
      });

      await database.updateUserPaymentMethod(id, updatedPaymentMethod);

      const refreshedPaymentMethod = await database.getUserPaymentMethodById(id);
      if (!refreshedPaymentMethod) {
        return res.status(404).json({ error: 'Payment method not found after update' });
      }

      res.json(refreshedPaymentMethod);
    } catch (error) {
      console.error('Error updating payment method:', error);
      res.status(500).json({ error: 'Failed to update payment method' });
    }
  });

  app.delete('/api/payment-methods/:id', async (req, res) => {
    try {
      const id = sanitizePlainText(req.params.id, 64);
      const existingPaymentMethod = await database.getUserPaymentMethodById(id);
      if (!existingPaymentMethod) {
        return res.status(404).json({ error: 'Payment method not found' });
      }

      if (!isSelfOrAdmin(req.user, existingPaymentMethod.userId)) {
        return res.status(403).json({ error: 'Not authorized to delete this payment method' });
      }

      await database.deleteUserPaymentMethod(id);
      res.json({ message: 'Payment method deleted successfully' });
    } catch (error) {
      console.error('Error deleting payment method:', error);
      res.status(500).json({ error: 'Failed to delete payment method' });
    }
  });

  app.get('/api/account/privacy/export', async (req, res) => {
    try {
      const currentUser = await database.getUserById(req.user.id);
      if (!currentUser) {
        return res.status(404).json({ error: 'User not found' });
      }

      const [orders, registrations, addresses, paymentMethods, requests] = await Promise.all([
        database.getOrdersByUserId(req.user.id),
        database.getRegistrationsByUserId(req.user.id),
        database.getUserAddresses(req.user.id),
        database.getUserPaymentMethods(req.user.id),
        typeof database.getPrivacyRequestsByUserId === 'function'
          ? database.getPrivacyRequestsByUserId(req.user.id)
          : Promise.resolve([]),
      ]);

      const payload = {
        exportedAt: new Date().toISOString(),
        user: {
          id: currentUser.id,
          email: currentUser.email,
          name: currentUser.name,
          isAdmin: Boolean(currentUser.isAdmin),
          role: currentUser.role,
          createdAt: currentUser.createdAt,
          updatedAt: currentUser.updatedAt,
        },
        addresses,
        paymentMethods,
        orders,
        registrations,
        privacyRequests: requests,
      };

      if (typeof database.createPrivacyRequest === 'function') {
        const now = new Date().toISOString();
        await database.createPrivacyRequest({
          id: uuidv4(),
          userId: req.user.id,
          requestType: 'export',
          status: 'completed',
          reason: null,
          payload: {
            generatedAt: now,
          },
          createdAt: now,
          updatedAt: now,
        });
      }

      emitSecurityEvent({
        eventType: 'PRIVACY_EXPORT_COMPLETED',
        severity: 'medium',
        userId: req.user.id,
        email: req.user.email,
        req,
      });

      return res.json(payload);
    } catch (error) {
      console.error('Error exporting privacy data:', error);
      return res.status(500).json({ error: 'Failed to export privacy data' });
    }
  });

  app.post('/api/account/privacy/deletion-request', async (req, res) => {
    try {
      const parsedBody = validateRequestBody(privacyDeletionRequestSchema, req.body || {});
      if (!parsedBody.success) {
        return res.status(400).json({ error: parsedBody.errorMessage || 'Invalid deletion request payload' });
      }

      if (typeof database.createPrivacyRequest !== 'function') {
        return res.status(503).json({ error: 'Privacy requests are not available' });
      }

      const now = new Date().toISOString();
      const requestId = uuidv4();
      await database.createPrivacyRequest({
        id: requestId,
        userId: req.user.id,
        requestType: 'deletion',
        status: 'requested',
        reason: sanitizePlainText(parsedBody.data.reason || '', 500) || null,
        payload: {
          requestedBy: req.user.id,
        },
        createdAt: now,
        updatedAt: now,
      });

      emitSecurityEvent({
        eventType: 'PRIVACY_DELETION_REQUESTED',
        severity: 'high',
        userId: req.user.id,
        email: req.user.email,
        req,
        details: {
          requestId,
        },
        alerted: true,
      });

      return res.status(202).json({
        id: requestId,
        status: 'requested',
      });
    } catch (error) {
      console.error('Error creating deletion request:', error);
      return res.status(500).json({ error: 'Failed to create deletion request' });
    }
  });

  app.get('/api/account/privacy/requests', async (req, res) => {
    try {
      if (typeof database.getPrivacyRequestsByUserId !== 'function') {
        return res.json([]);
      }

      const requests = await database.getPrivacyRequestsByUserId(req.user.id);
      return res.json(requests);
    } catch (error) {
      console.error('Error fetching privacy requests:', error);
      return res.status(500).json({ error: 'Failed to fetch privacy requests' });
    }
  });
};

module.exports = registerAccountRoutes;
