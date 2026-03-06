const {
  addressCreateSchema,
  addressUpdateSchema,
  paymentMethodCreateSchema,
  paymentMethodUpdateSchema,
  privacyDeletionRequestSchema,
  profileUpdateSchema,
  validateRequestBody,
} = require('../utils/validationSchemas');

const PAYMENT_METHODS_DISABLED_ERROR = 'Payment method management is disabled until a payment provider is connected';

const splitFullName = (fullName) => {
  const parts = String(fullName || '').trim().split(/\s+/).filter(Boolean);
  const firstName = parts.shift() || '';
  return {
    firstName,
    lastName: parts.join(' '),
  };
};

const registerAccountRoutes = (app, deps) => {
  const {
    database,
    uuidv4,
    sanitizePlainText,
    isSelfOrAdmin,
    logSecurityEvent = async () => {},
  } = deps;

  const sanitizeEmail = (value) => sanitizePlainText(value, 254).toLowerCase();

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

  app.get('/api/account/profile', async (req, res) => {
    try {
      const currentUser = await database.getUserById(req.user.id);
      if (!currentUser) {
        return res.status(404).json({ error: 'User not found' });
      }

      const profile = typeof database.getUserProfile === 'function'
        ? await database.getUserProfile(req.user.id)
        : null;
      const { firstName, lastName } = splitFullName(currentUser.name);

      return res.json({
        fullName: currentUser.name,
        firstName,
        lastName,
        email: currentUser.email,
        phone: profile?.phone || '',
        companyName: profile?.companyName || '',
      });
    } catch (error) {
      console.error('Error fetching account profile:', error);
      return res.status(500).json({ error: 'Failed to fetch account profile' });
    }
  });

  app.put('/api/account/profile', async (req, res) => {
    try {
      const parsedBody = validateRequestBody(profileUpdateSchema, req.body || {});
      if (!parsedBody.success) {
        return res.status(400).json({ error: parsedBody.errorMessage || 'Invalid profile payload' });
      }

      const fullName = sanitizePlainText(parsedBody.data.fullName, 120);
      const email = sanitizeEmail(parsedBody.data.email);
      const phone = sanitizePlainText(parsedBody.data.phone || '', 40);
      const companyName = sanitizePlainText(parsedBody.data.companyName || '', 120);

      const currentUser = await database.getUserById(req.user.id);
      if (!currentUser) {
        return res.status(404).json({ error: 'User not found' });
      }

      if (email !== currentUser.email) {
        const existingUser = await database.getUserByEmail(email);
        if (existingUser && existingUser.id !== currentUser.id) {
          return res.status(400).json({ error: 'Email is already in use' });
        }
      }

      if (typeof database.updateUserProfileFields === 'function') {
        await database.updateUserProfileFields(currentUser.id, {
          email,
          name: fullName,
        });
      } else {
        await database.updateUser(currentUser.id, {
          email,
          name: fullName,
          password: currentUser.password,
          isAdmin: currentUser.isAdmin,
          role: currentUser.role,
          createdAt: currentUser.createdAt,
        });
      }

      if (typeof database.upsertUserProfile === 'function') {
        await database.upsertUserProfile(currentUser.id, {
          phone,
          companyName,
        });
      }

      emitSecurityEvent({
        eventType: 'ACCOUNT_PROFILE_UPDATED',
        severity: 'medium',
        userId: currentUser.id,
        email,
        req,
      });

      const updatedUser = await database.getUserById(currentUser.id);
      const updatedProfile = typeof database.getUserProfile === 'function'
        ? await database.getUserProfile(currentUser.id)
        : null;
      const { firstName, lastName } = splitFullName(updatedUser?.name || fullName);

      return res.json({
        fullName: updatedUser?.name || fullName,
        firstName,
        lastName,
        email: updatedUser?.email || email,
        phone: updatedProfile?.phone || phone,
        companyName: updatedProfile?.companyName || companyName,
      });
    } catch (error) {
      console.error('Error updating account profile:', error);
      return res.status(500).json({ error: 'Failed to update account profile' });
    }
  });

  app.get('/api/addresses/:userId', async (req, res) => {
    try {
      const userId = sanitizePlainText(req.params.userId, 64);

      if (!isSelfOrAdmin(req.user, userId)) {
        return res.status(403).json({ error: 'Not authorized to view these addresses' });
      }

      const addresses = await database.getUserAddresses(userId);
      return res.json(addresses);
    } catch (error) {
      console.error('Error fetching addresses:', error);
      return res.status(500).json({ error: 'Failed to fetch addresses' });
    }
  });

  app.post('/api/addresses', async (req, res) => {
    try {
      const parsedBody = validateRequestBody(addressCreateSchema, req.body || {});
      if (!parsedBody.success) {
        return res.status(400).json({ error: parsedBody.errorMessage || 'Invalid address payload' });
      }

      const userId = sanitizePlainText(parsedBody.data.userId, 64);
      if (!isSelfOrAdmin(req.user, userId)) {
        return res.status(403).json({ error: 'Not authorized to create address for this user' });
      }

      const newAddress = {
        id: uuidv4(),
        userId,
        title: sanitizePlainText(parsedBody.data.title, 120),
        type: sanitizePlainText(parsedBody.data.type, 40),
        isDefault: parsedBody.data.isDefault ? 1 : 0,
        recipientName: sanitizePlainText(parsedBody.data.recipientName, 120),
        phone: sanitizePlainText(parsedBody.data.phone, 40),
        email: sanitizeEmail(parsedBody.data.email || ''),
        address: sanitizePlainText(parsedBody.data.address, 300),
        apartment: sanitizePlainText(parsedBody.data.apartment || '', 120),
        district: sanitizePlainText(parsedBody.data.district, 120),
        city: sanitizePlainText(parsedBody.data.city, 120),
        postalCode: sanitizePlainText(parsedBody.data.postalCode, 32),
        province: sanitizePlainText(parsedBody.data.province || '', 120),
        country: sanitizePlainText(parsedBody.data.country || 'Turkey', 120),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await database.createUserAddress(newAddress);
      const createdAddress = await database.getUserAddressById(newAddress.id);
      if (!createdAddress) {
        return res.status(500).json({ error: 'Address created but could not be loaded' });
      }

      return res.status(201).json(createdAddress);
    } catch (error) {
      console.error('Error creating address:', error);
      return res.status(500).json({ error: 'Failed to create address' });
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

      await database.updateUserAddress(id, {
        title: sanitizePlainText(parsedBody.data.title, 120),
        type: sanitizePlainText(parsedBody.data.type, 40),
        isDefault: parsedBody.data.isDefault === undefined
          ? Number(existingAddress.isDefault)
          : (parsedBody.data.isDefault ? 1 : 0),
        recipientName: sanitizePlainText(parsedBody.data.recipientName, 120),
        phone: sanitizePlainText(parsedBody.data.phone, 40),
        email: sanitizeEmail(parsedBody.data.email || ''),
        address: sanitizePlainText(parsedBody.data.address, 300),
        apartment: sanitizePlainText(parsedBody.data.apartment || '', 120),
        district: sanitizePlainText(parsedBody.data.district, 120),
        city: sanitizePlainText(parsedBody.data.city, 120),
        postalCode: sanitizePlainText(parsedBody.data.postalCode, 32),
        province: sanitizePlainText(parsedBody.data.province || '', 120),
        country: sanitizePlainText(parsedBody.data.country || 'Turkey', 120),
        updatedAt: new Date().toISOString(),
      });

      const refreshedAddress = await database.getUserAddressById(id);
      if (!refreshedAddress) {
        return res.status(404).json({ error: 'Address not found after update' });
      }

      return res.json(refreshedAddress);
    } catch (error) {
      console.error('Error updating address:', error);
      return res.status(500).json({ error: 'Failed to update address' });
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
      return res.json({ message: 'Address deleted successfully' });
    } catch (error) {
      console.error('Error deleting address:', error);
      return res.status(500).json({ error: 'Failed to delete address' });
    }
  });

  app.get('/api/payment-methods/:userId', async (_req, res) => {
    return res.status(503).json({ error: PAYMENT_METHODS_DISABLED_ERROR });
  });

  app.post('/api/payment-methods', async (req, res) => {
    const parsedBody = validateRequestBody(paymentMethodCreateSchema, req.body || {});
    if (!parsedBody.success) {
      return res.status(400).json({ error: parsedBody.errorMessage || PAYMENT_METHODS_DISABLED_ERROR });
    }

    return res.status(503).json({ error: PAYMENT_METHODS_DISABLED_ERROR });
  });

  app.put('/api/payment-methods/:id', async (req, res) => {
    const parsedBody = validateRequestBody(paymentMethodUpdateSchema, req.body || {});
    if (!parsedBody.success) {
      return res.status(400).json({ error: parsedBody.errorMessage || PAYMENT_METHODS_DISABLED_ERROR });
    }

    return res.status(503).json({ error: PAYMENT_METHODS_DISABLED_ERROR });
  });

  app.delete('/api/payment-methods/:id', async (_req, res) => {
    return res.status(503).json({ error: PAYMENT_METHODS_DISABLED_ERROR });
  });

  app.get('/api/account/privacy/export', async (req, res) => {
    try {
      const currentUser = await database.getUserById(req.user.id);
      if (!currentUser) {
        return res.status(404).json({ error: 'User not found' });
      }

      const profile = typeof database.getUserProfile === 'function'
        ? await database.getUserProfile(req.user.id)
        : null;
      const [orders, registrations, addresses, requests] = await Promise.all([
        database.getOrdersByUserId(req.user.id),
        database.getRegistrationsByUserId(req.user.id),
        database.getUserAddresses(req.user.id),
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
        profile: {
          phone: profile?.phone || '',
          companyName: profile?.companyName || '',
        },
        addresses,
        paymentMethods: [],
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
