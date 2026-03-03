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
  } = deps;

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
      const userId = sanitizePlainText(req.body?.userId, 64);
      const title = sanitizePlainText(req.body?.title, 120);
      const type = sanitizePlainText(req.body?.type, 40);
      const address = sanitizePlainText(req.body?.address, 300);
      const apartment = sanitizePlainText(req.body?.apartment, 120);
      const district = sanitizePlainText(req.body?.district, 120);
      const city = sanitizePlainText(req.body?.city, 120);
      const postalCode = sanitizePlainText(req.body?.postalCode, 32);
      const province = sanitizePlainText(req.body?.province, 120);
      const country = sanitizePlainText(req.body?.country, 120) || 'Turkey';
      const hasIsDefault = typeof req.body?.isDefault === 'boolean';
      const isDefault = hasIsDefault ? Boolean(req.body.isDefault) : undefined;

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

      const title = sanitizePlainText(req.body?.title, 120);
      const type = sanitizePlainText(req.body?.type, 40);
      const address = sanitizePlainText(req.body?.address, 300);
      const apartment = sanitizePlainText(req.body?.apartment, 120);
      const district = sanitizePlainText(req.body?.district, 120);
      const city = sanitizePlainText(req.body?.city, 120);
      const postalCode = sanitizePlainText(req.body?.postalCode, 32);
      const province = sanitizePlainText(req.body?.province, 120);
      const country = sanitizePlainText(req.body?.country, 120) || 'Turkey';
      const hasIsDefault = typeof req.body?.isDefault === 'boolean';
      const isDefault = hasIsDefault ? Boolean(req.body.isDefault) : undefined;

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
      const userId = sanitizePlainText(req.body?.userId, 64);
      const cardTitle = sanitizePlainText(req.body?.cardTitle, 120);
      const cardNumber = sanitizePlainText(req.body?.cardNumber, 32).replace(/\s+/g, '');
      const expiryMonth = sanitizePlainText(req.body?.expiryMonth, 2);
      const expiryYear = sanitizePlainText(req.body?.expiryYear, 4);
      const holderName = sanitizePlainText(req.body?.holderName, 120);
      const hasIsDefault = typeof req.body?.isDefault === 'boolean';
      const isDefault = hasIsDefault ? Boolean(req.body.isDefault) : undefined;

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

      const cardTitle = sanitizePlainText(req.body?.cardTitle, 120);
      const cardNumber = sanitizePlainText(req.body?.cardNumber, 32).replace(/\s+/g, '');
      const expiryMonth = sanitizePlainText(req.body?.expiryMonth, 2);
      const expiryYear = sanitizePlainText(req.body?.expiryYear, 4);
      const holderName = sanitizePlainText(req.body?.holderName, 120);
      const hasIsDefault = typeof req.body?.isDefault === 'boolean';
      const isDefault = hasIsDefault ? Boolean(req.body.isDefault) : undefined;

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
};

module.exports = registerAccountRoutes;
