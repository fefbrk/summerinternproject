const { resolvePagination, paginateRows } = require('../utils/pagination');

const registerAuthUserRoutes = (app, deps) => {
  const {
    database,
    uuidv4,
    hashPassword,
    verifyPassword,
    isHashedPassword,
    createAuthToken,
    toSafeUser,
    sanitizeEmail,
    sanitizePlainText,
    isValidEmail,
    isValidPassword,
    checkLoginRateLimit,
    recordLoginAttempt,
  } = deps;

  app.post('/api/login', checkLoginRateLimit, async (req, res) => {
    const email = sanitizeEmail(req.body?.email);
    const password = typeof req.body?.password === 'string' ? req.body.password : '';

    if (!email || !password || !isValidEmail(email)) {
      recordLoginAttempt(req, false);
      return res.status(400).json({ error: 'Valid email and password are required' });
    }

    try {
      const user = await database.getUserByEmail(email);
      if (!user || !verifyPassword(password, user.password)) {
        recordLoginAttempt(req, false);
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      if (!isHashedPassword(user.password)) {
        await database.updateUserPassword(user.id, hashPassword(password));
      }

      recordLoginAttempt(req, true);
      const safeUser = toSafeUser(user);
      const token = createAuthToken(safeUser);

      res.json({
        token,
        user: safeUser,
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  app.get('/api/me', async (req, res) => {
    try {
      const user = await database.getUserById(req.user.id);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      res.json(toSafeUser(user));
    } catch (error) {
      console.error('Error fetching current user:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  app.post('/api/register', async (req, res) => {
    try {
      const email = sanitizeEmail(req.body?.email);
      const name = sanitizePlainText(req.body?.name, 120);
      const password = typeof req.body?.password === 'string' ? req.body.password : '';

      if (!email || !name || !password || !isValidEmail(email)) {
        return res.status(400).json({ error: 'Email, name and password are required' });
      }

      if (!isValidPassword(password)) {
        return res.status(400).json({
          error: 'Password must be 8-128 chars and include at least one uppercase letter, one lowercase letter, and one number',
        });
      }

      const existingUser = await database.getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ error: 'User already exists' });
      }

      const newUser = {
        id: uuidv4(),
        email,
        name,
        password: hashPassword(password),
        isAdmin: 0,
        createdAt: new Date().toISOString(),
      };

      await database.createUser(newUser);

      const safeUser = toSafeUser(newUser);
      const token = createAuthToken(safeUser);
      res.status(201).json({ token, user: safeUser });
    } catch (error) {
      console.error('Registration error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  app.put('/api/users/:id/password', async (req, res) => {
    try {
      const id = sanitizePlainText(req.params.id, 64);
      const currentPassword = typeof req.body?.currentPassword === 'string' ? req.body.currentPassword : '';
      const newPassword = typeof req.body?.newPassword === 'string' ? req.body.newPassword : '';

      if (!currentPassword || !newPassword) {
        return res.status(400).json({ error: 'Current and new password are required' });
      }

      if (!isValidPassword(newPassword)) {
        return res.status(400).json({
          error: 'Password must be 8-128 chars and include at least one uppercase letter, one lowercase letter, and one number',
        });
      }

      const user = await database.getUserById(id);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      if (!verifyPassword(currentPassword, user.password)) {
        return res.status(400).json({ error: 'Current password is incorrect' });
      }

      await database.updateUserPassword(id, hashPassword(newPassword));

      res.json({ message: 'Password updated successfully' });
    } catch (error) {
      console.error('Error changing password:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  app.get('/api/users', async (req, res) => {
    try {
      const pagination = resolvePagination(req.query);
      const users = await database.getAllUsers();
      res.json(paginateRows(users, pagination));
    } catch (error) {
      console.error('Error getting users:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  app.post('/api/users', async (req, res) => {
    try {
      const email = sanitizeEmail(req.body?.email);
      const name = sanitizePlainText(req.body?.name, 120);
      const password = typeof req.body?.password === 'string' ? req.body.password : '';

      if (!email || !name || !password || !isValidEmail(email)) {
        return res.status(400).json({ error: 'Email, name and password are required' });
      }

      if (!isValidPassword(password)) {
        return res.status(400).json({
          error: 'Password must be 8-128 chars and include at least one uppercase letter, one lowercase letter, and one number',
        });
      }

      const existingUser = await database.getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ error: 'User already exists' });
      }

      const newUser = {
        id: uuidv4(),
        email,
        name,
        password: hashPassword(password),
        isAdmin: 0,
        createdAt: new Date().toISOString(),
      };

      await database.createUser(newUser);
      res.json(toSafeUser(newUser));
    } catch (error) {
      console.error('Error creating user:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  app.delete('/api/users/:id', async (req, res) => {
    try {
      const id = sanitizePlainText(req.params.id, 64);

      const user = await database.getUserById(id);
      if (user && user.isAdmin) {
        return res.status(403).json({ error: 'Admin user cannot be deleted' });
      }

      const result = await database.deleteUser(id);
      if (result.changes === 0) {
        return res.status(404).json({ error: 'User not found' });
      }

      res.json({ message: 'User deleted successfully' });
    } catch (error) {
      console.error('Error deleting user:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });
};

module.exports = registerAuthUserRoutes;
