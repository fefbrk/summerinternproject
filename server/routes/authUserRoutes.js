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
    checkAccountLockout = (_req, _res, next) => next(),
    recordAccountLoginAttempt = async () => {},
    checkRegistrationRateLimit,
    logSecurityEvent = async () => {},
    authCookieName = 'auth_token',
    authCookieOptions = {},
  } = deps;

  const setAuthCookie = (res, token) => {
    res.cookie(authCookieName, token, authCookieOptions);
  };

  const clearAuthCookie = (res) => {
    res.clearCookie(authCookieName, {
      path: authCookieOptions.path || '/',
      sameSite: authCookieOptions.sameSite || 'lax',
      secure: Boolean(authCookieOptions.secure),
    });
  };

  const MAX_LOGIN_PASSWORD_LENGTH = 256;
  const MAX_CURRENT_PASSWORD_LENGTH = 256;

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

  app.post('/api/login', checkLoginRateLimit, checkAccountLockout, async (req, res) => {
    const email = sanitizeEmail(req.body?.email);
    const password = typeof req.body?.password === 'string' ? req.body.password : '';

    if (!email || !password || !isValidEmail(email)) {
      await recordLoginAttempt(req, false);
      emitSecurityEvent({
        eventType: 'AUTH_LOGIN_INVALID_PAYLOAD',
        severity: 'medium',
        email,
        req,
      });
      return res.status(400).json({ error: 'Valid email and password are required' });
    }

    if (password.length > MAX_LOGIN_PASSWORD_LENGTH) {
      await recordLoginAttempt(req, false);
      emitSecurityEvent({
        eventType: 'AUTH_LOGIN_PASSWORD_TOO_LONG',
        severity: 'medium',
        email,
        req,
      });
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    try {
      const user = await database.getUserByEmail(email);
      if (!user || !verifyPassword(password, user.password)) {
        await recordLoginAttempt(req, false);
        if (user) {
          await recordAccountLoginAttempt(user.email, false);
        }
        emitSecurityEvent({
          eventType: 'AUTH_LOGIN_FAILED',
          severity: 'medium',
          userId: user?.id || null,
          email,
          req,
        });
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      if (!isHashedPassword(user.password)) {
        await database.updateUserPassword(user.id, hashPassword(password));
      }

      await recordLoginAttempt(req, true);
      await recordAccountLoginAttempt(user.email, true);
      const safeUser = toSafeUser(user);
      const token = createAuthToken(safeUser);
      setAuthCookie(res, token);

      emitSecurityEvent({
        eventType: 'AUTH_LOGIN_SUCCESS',
        severity: 'low',
        userId: safeUser.id,
        email: safeUser.email,
        req,
      });

      res.json({
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

  app.post('/api/register', checkRegistrationRateLimit, async (req, res) => {
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
        return res.status(400).json({ error: 'Unable to process registration request' });
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
      setAuthCookie(res, token);

      emitSecurityEvent({
        eventType: 'AUTH_REGISTER_SUCCESS',
        severity: 'low',
        userId: safeUser.id,
        email: safeUser.email,
        req,
      });
      res.status(201).json({ user: safeUser });
    } catch (error) {
      console.error('Registration error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  app.post('/api/logout', async (req, res) => {
    try {
      if (req.authPayload?.jti && typeof database.revokeToken === 'function') {
        await database.revokeToken({
          jti: req.authPayload.jti,
          expiresAt: req.authPayload.exp,
          reason: 'logout',
        });
      }

      emitSecurityEvent({
        eventType: 'AUTH_LOGOUT',
        severity: 'low',
        userId: req.user?.id || null,
        email: req.user?.email || '',
        req,
      });

      clearAuthCookie(res);
      return res.json({ message: 'Logged out successfully' });
    } catch (error) {
      console.error('Logout error:', error);
      return res.status(500).json({ error: 'Internal server error' });
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

      if (currentPassword.length > MAX_CURRENT_PASSWORD_LENGTH) {
        return res.status(400).json({ error: 'Current password is incorrect' });
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
        emitSecurityEvent({
          eventType: 'AUTH_PASSWORD_CHANGE_FAILED',
          severity: 'medium',
          userId: user.id,
          email: user.email,
          req,
        });
        return res.status(400).json({ error: 'Current password is incorrect' });
      }

      await database.updateUserPassword(id, hashPassword(newPassword));

      emitSecurityEvent({
        eventType: 'AUTH_PASSWORD_CHANGED',
        severity: 'high',
        userId: user.id,
        email: user.email,
        req,
      });

      res.json({ message: 'Password updated successfully' });
    } catch (error) {
      console.error('Error changing password:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  app.get('/api/users', async (req, res) => {
    try {
      const pagination = resolvePagination(req.query);
      const users = await database.getAllUsers(pagination.limit, pagination.offset);
      res.json(users);
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
