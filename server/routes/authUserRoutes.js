const { resolvePagination } = require('../utils/pagination');
const { verifyCaptchaToken } = require('../security/captcha');
const {
  loginSchema,
  registerSchema,
  passwordChangeSchema,
  userCreateSchema,
  userRoleUpdateSchema,
  validateRequestBody,
} = require('../utils/validationSchemas');

const ROLE_SET = new Set(['super_admin', 'admin', 'content_manager', 'support', 'user']);
const SUPER_ADMIN_EMAILS = new Set(
  String(process.env.SUPER_ADMIN_EMAILS || process.env.DEFAULT_ADMIN_EMAIL || '')
    .split(',')
    .map((email) => String(email || '').trim().toLowerCase())
    .filter(Boolean)
);

const normalizeRole = (value, fallback = 'user') => {
  if (typeof value !== 'string') {
    return fallback;
  }

  const normalized = value.trim().toLowerCase();
  return ROLE_SET.has(normalized) ? normalized : fallback;
};

const parseCookies = (cookieHeader) => {
  if (typeof cookieHeader !== 'string' || cookieHeader.trim().length === 0) {
    return {};
  }

  return cookieHeader.split(';').reduce((acc, cookiePart) => {
    const [rawName, ...rawValueParts] = cookiePart.split('=');
    const name = typeof rawName === 'string' ? rawName.trim() : '';
    if (!name) {
      return acc;
    }

    const rawValue = rawValueParts.join('=');
    try {
      acc[name] = decodeURIComponent(rawValue.trim());
    } catch (_error) {
      acc[name] = rawValue.trim();
    }

    return acc;
  }, {});
};

const getClientIp = (req) => {
  return req.ip || req.socket?.remoteAddress || '';
};

const registerAuthUserRoutes = (app, deps) => {
  const {
    database,
    uuidv4,
    hashPassword,
    verifyPassword,
    isHashedPassword,
    createAuthToken,
    createRefreshToken,
    verifyRefreshToken,
    hashToken,
    toSafeUser,
    sanitizeEmail,
    sanitizePlainText,
    isValidEmail,
    isValidPassword,
    checkLoginRateLimit,
    recordLoginAttempt,
    checkAccountLockout = (_req, _res, next) => next(),
    recordAccountLoginAttempt = async () => {},
    getLoginAttemptCount = async () => 0,
    checkRegistrationRateLimit,
    logSecurityEvent = async () => {},
    authCookieName = 'auth_token',
    authCookieOptions = {},
    refreshCookieName = 'refresh_token',
    refreshCookieOptions = {},
  } = deps;

  const LOGIN_CAPTCHA_THRESHOLD = Number.isFinite(Number(process.env.LOGIN_CAPTCHA_THRESHOLD))
    ? Math.max(0, Math.floor(Number(process.env.LOGIN_CAPTCHA_THRESHOLD)))
    : 3;

  const setAuthCookie = (res, token) => {
    res.cookie(authCookieName, token, authCookieOptions);
  };

  const setRefreshCookie = (res, token) => {
    res.cookie(refreshCookieName, token, refreshCookieOptions);
  };

  const clearAuthCookie = (res) => {
    res.clearCookie(authCookieName, {
      path: authCookieOptions.path || '/',
      sameSite: authCookieOptions.sameSite || 'lax',
      secure: Boolean(authCookieOptions.secure),
    });
  };

  const clearRefreshCookie = (res) => {
    res.clearCookie(refreshCookieName, {
      path: refreshCookieOptions.path || '/',
      sameSite: refreshCookieOptions.sameSite || 'lax',
      secure: Boolean(refreshCookieOptions.secure),
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

  const readRefreshTokenFromRequest = (req) => {
    const cookies = parseCookies(req.headers.cookie);
    if (typeof cookies[refreshCookieName] === 'string' && cookies[refreshCookieName].trim().length > 0) {
      return cookies[refreshCookieName].trim();
    }

    if (typeof req.body?.refreshToken === 'string' && req.body.refreshToken.trim().length > 0) {
      return req.body.refreshToken.trim();
    }

    return '';
  };

  const persistRefreshToken = async (token, payload) => {
    if (!payload || !payload.jti || !payload.sub) {
      return;
    }

    if (typeof database.storeRefreshToken !== 'function') {
      return;
    }

    await database.storeRefreshToken({
      jti: payload.jti,
      userId: payload.sub,
      tokenHash: hashToken(token),
      expiresAt: payload.exp,
      createdAt: payload.iat,
    });
  };

  const issueUserSession = async (res, safeUser) => {
    const authToken = createAuthToken(safeUser);
    const refreshToken = createRefreshToken(safeUser);
    const refreshPayload = verifyRefreshToken(refreshToken);
    if (!refreshPayload) {
      throw new Error('Failed to create refresh token payload');
    }

    await persistRefreshToken(refreshToken, refreshPayload);
    setAuthCookie(res, authToken);
    setRefreshCookie(res, refreshToken);

    return {
      authToken,
      refreshToken,
      refreshPayload,
    };
  };

  app.post('/api/login', checkLoginRateLimit, checkAccountLockout, async (req, res) => {
    const parsedBody = validateRequestBody(loginSchema, req.body || {});
    if (!parsedBody.success) {
      await recordLoginAttempt(req, false);
      emitSecurityEvent({
        eventType: 'AUTH_LOGIN_INVALID_PAYLOAD',
        severity: 'medium',
        email: sanitizeEmail(req.body?.email),
        req,
        details: { validationError: parsedBody.errorMessage },
      });
      return res.status(400).json({ error: parsedBody.errorMessage || 'Valid email and password are required' });
    }

    const email = sanitizeEmail(parsedBody.data.email);
    const password = parsedBody.data.password;

    if (!email || !password || !isValidEmail(email)) {
      await recordLoginAttempt(req, false);
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
      const attemptCount = await getLoginAttemptCount(req);
      if (attemptCount >= LOGIN_CAPTCHA_THRESHOLD) {
        const captchaResult = await verifyCaptchaToken({
          token: parsedBody.data.captchaToken,
          remoteIp: getClientIp(req),
        });

        if (!captchaResult.success) {
          await recordLoginAttempt(req, false);
          emitSecurityEvent({
            eventType: 'AUTH_LOGIN_CAPTCHA_FAILED',
            severity: 'high',
            email,
            req,
            details: {
              reason: captchaResult.reason,
              attempts: attemptCount,
            },
            alerted: true,
          });
          return res.status(403).json({ error: 'Captcha verification failed', code: 'CAPTCHA_REQUIRED' });
        }
      }

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
      await issueUserSession(res, safeUser);

      emitSecurityEvent({
        eventType: 'AUTH_LOGIN_SUCCESS',
        severity: 'low',
        userId: safeUser.id,
        email: safeUser.email,
        req,
      });

      res.json({ user: safeUser });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  app.post('/api/refresh', async (req, res) => {
    try {
      const refreshToken = readRefreshTokenFromRequest(req);
      if (!refreshToken) {
        return res.status(401).json({ error: 'Refresh token is required' });
      }

      const payload = verifyRefreshToken(refreshToken);
      if (!payload || !payload.jti || !payload.sub) {
        return res.status(401).json({ error: 'Invalid or expired refresh token' });
      }

      if (typeof database.getRefreshTokenByJti === 'function') {
        const storedToken = await database.getRefreshTokenByJti(payload.jti);
        if (!storedToken) {
          return res.status(401).json({ error: 'Refresh token not recognized' });
        }

        if (storedToken.revokedAt) {
          return res.status(401).json({ error: 'Refresh token has been revoked' });
        }

        if (storedToken.userId !== payload.sub) {
          return res.status(401).json({ error: 'Invalid refresh token' });
        }

        const tokenHash = hashToken(refreshToken);
        if (!tokenHash || tokenHash !== storedToken.tokenHash) {
          await database.revokeRefreshToken(payload.jti, 'token-hash-mismatch');
          return res.status(401).json({ error: 'Invalid refresh token' });
        }
      }

      const user = await database.getUserById(payload.sub);
      if (!user) {
        if (typeof database.revokeRefreshToken === 'function') {
          await database.revokeRefreshToken(payload.jti, 'user-not-found');
        }
        return res.status(401).json({ error: 'Invalid refresh token' });
      }

      const safeUser = toSafeUser(user);
      const authToken = createAuthToken(safeUser);
      const newRefreshToken = createRefreshToken(safeUser);
      const newRefreshPayload = verifyRefreshToken(newRefreshToken);
      if (!newRefreshPayload || !newRefreshPayload.jti) {
        return res.status(500).json({ error: 'Failed to rotate refresh token' });
      }

      if (typeof database.rotateRefreshToken === 'function') {
        await database.rotateRefreshToken({
          currentJti: payload.jti,
          newToken: {
            jti: newRefreshPayload.jti,
            userId: safeUser.id,
            tokenHash: hashToken(newRefreshToken),
            expiresAt: newRefreshPayload.exp,
            createdAt: newRefreshPayload.iat,
          },
        });
      } else if (typeof database.revokeRefreshToken === 'function' && typeof database.storeRefreshToken === 'function') {
        await database.revokeRefreshToken(payload.jti, 'rotated', newRefreshPayload.jti);
        await persistRefreshToken(newRefreshToken, newRefreshPayload);
      }

      setAuthCookie(res, authToken);
      setRefreshCookie(res, newRefreshToken);

      emitSecurityEvent({
        eventType: 'AUTH_REFRESH_SUCCESS',
        severity: 'low',
        userId: safeUser.id,
        email: safeUser.email,
        req,
      });

      return res.json({ user: safeUser });
    } catch (error) {
      console.error('Refresh token error:', error);
      return res.status(500).json({ error: 'Internal server error' });
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
      const parsedBody = validateRequestBody(registerSchema, req.body || {});
      if (!parsedBody.success) {
        return res.status(400).json({ error: parsedBody.errorMessage || 'Email, name and password are required' });
      }

      const email = sanitizeEmail(parsedBody.data.email);
      const name = sanitizePlainText(parsedBody.data.name, 120);
      const password = parsedBody.data.password;

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
        role: 'user',
        createdAt: new Date().toISOString(),
      };

      await database.createUser(newUser);

      const safeUser = toSafeUser(newUser);
      await issueUserSession(res, safeUser);

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

      const refreshToken = readRefreshTokenFromRequest(req);
      if (refreshToken) {
        const refreshPayload = verifyRefreshToken(refreshToken);
        if (refreshPayload?.jti && typeof database.revokeRefreshToken === 'function') {
          await database.revokeRefreshToken(refreshPayload.jti, 'logout');
        }
      }

      emitSecurityEvent({
        eventType: 'AUTH_LOGOUT',
        severity: 'low',
        userId: req.user?.id || null,
        email: req.user?.email || '',
        req,
      });

      clearAuthCookie(res);
      clearRefreshCookie(res);
      return res.json({ message: 'Logged out successfully' });
    } catch (error) {
      console.error('Logout error:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  });

  app.put('/api/users/:id/password', async (req, res) => {
    try {
      const id = sanitizePlainText(req.params.id, 64);
      const parsedBody = validateRequestBody(passwordChangeSchema, req.body || {});
      if (!parsedBody.success) {
        return res.status(400).json({ error: parsedBody.errorMessage || 'Current and new password are required' });
      }

      const currentPassword = parsedBody.data.currentPassword;
      const newPassword = parsedBody.data.newPassword;

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
      if (typeof database.revokeAllRefreshTokensForUser === 'function') {
        await database.revokeAllRefreshTokensForUser(id, 'password-changed');
      }

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
      const parsedBody = validateRequestBody(userCreateSchema, req.body || {});
      if (!parsedBody.success) {
        return res.status(400).json({ error: parsedBody.errorMessage || 'Invalid user payload' });
      }

      const email = sanitizeEmail(parsedBody.data.email);
      const name = sanitizePlainText(parsedBody.data.name, 120);
      const password = parsedBody.data.password;
      const requestedRole = normalizeRole(parsedBody.data.role, 'user');

      if (!email || !name || !password || !isValidEmail(email)) {
        return res.status(400).json({ error: 'Email, name and password are required' });
      }

      if (!isValidPassword(password)) {
        return res.status(400).json({
          error: 'Password must be 8-128 chars and include at least one uppercase letter, one lowercase letter, and one number',
        });
      }

      if (requestedRole === 'super_admin' && !SUPER_ADMIN_EMAILS.has(email)) {
        return res.status(403).json({ error: 'Email is not eligible for super admin role' });
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
        isAdmin: requestedRole !== 'user',
        role: requestedRole,
        createdAt: new Date().toISOString(),
      };

      await database.createUser(newUser);
      res.json(toSafeUser(newUser));
    } catch (error) {
      console.error('Error creating user:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  app.put('/api/users/:id/role', async (req, res) => {
    try {
      const userId = sanitizePlainText(req.params.id, 64);
      const parsedBody = validateRequestBody(userRoleUpdateSchema, req.body || {});
      if (!parsedBody.success) {
        return res.status(400).json({ error: parsedBody.errorMessage || 'Invalid role payload' });
      }

      const desiredRole = normalizeRole(parsedBody.data.role, 'user');
      const existingUser = await database.getUserById(userId);
      if (!existingUser) {
        return res.status(404).json({ error: 'User not found' });
      }

      if (desiredRole === 'super_admin') {
        if (req.user?.role !== 'super_admin') {
          return res.status(403).json({ error: 'Only super admins can assign super admin role' });
        }

        if (!SUPER_ADMIN_EMAILS.has(String(existingUser.email || '').trim().toLowerCase())) {
          return res.status(403).json({ error: 'User email is not allowed for super admin role' });
        }
      }

      await database.updateUser(userId, {
        email: existingUser.email,
        name: existingUser.name,
        password: existingUser.password,
        isAdmin: desiredRole !== 'user',
        role: desiredRole,
        createdAt: existingUser.createdAt,
      });

      const updatedUser = await database.getUserById(userId);
      emitSecurityEvent({
        eventType: 'AUTH_USER_ROLE_UPDATED',
        severity: 'high',
        userId: req.user?.id || null,
        email: req.user?.email || '',
        req,
        details: {
          targetUserId: userId,
          role: desiredRole,
        },
      });

      return res.json({ user: toSafeUser(updatedUser) });
    } catch (error) {
      console.error('Error updating user role:', error);
      return res.status(500).json({ error: 'Internal server error' });
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
