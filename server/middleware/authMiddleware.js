const crypto = require('node:crypto');

const createAuthMiddleware = ({
  verifyAuthToken,
  database,
  loginWindowMs,
  loginMaxAttempts,
  registrationWindowMs = 15 * 60 * 1000,
  registrationMaxAttempts = 20,
  demoEndpointsEnabled,
  loginRateLimitMaxEntries = 10000,
  registrationRateLimitMaxEntries = 10000,
  contactWindowMs = 10 * 60 * 1000,
  contactMaxAttempts = 20,
  contactRateLimitMaxEntries = 20000,
  accountLockoutWindowMs = 30 * 60 * 1000,
  accountLockoutMaxAttempts = 5,
  accountLockoutRateLimitMaxEntries = 50000,
  securityAlertLoginFailureThreshold = 5,
  logSecurityEvent = async () => {},
}) => {
  const loginAttempts = new Map();
  const registrationAttempts = new Map();
  const contactAttempts = new Map();
  const accountLockouts = new Map();
  const hasPersistentRateLimitStore = Boolean(
    database &&
    typeof database.getRateLimitState === 'function' &&
    typeof database.incrementRateLimit === 'function' &&
    typeof database.resetRateLimit === 'function'
  );

  const parseCookies = (cookieHeader) => {
    if (typeof cookieHeader !== 'string' || cookieHeader.trim().length === 0) {
      return {};
    }

    return cookieHeader.split(';').reduce((result, cookiePart) => {
      const [rawName, ...rawValueParts] = cookiePart.split('=');
      const name = typeof rawName === 'string' ? rawName.trim() : '';
      if (!name) {
        return result;
      }

      const rawValue = rawValueParts.join('=');
      try {
        result[name] = decodeURIComponent(rawValue.trim());
      } catch (_error) {
        result[name] = rawValue.trim();
      }

      return result;
    }, {});
  };

  const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const ROLE_SET = new Set(['super_admin', 'admin', 'content_manager', 'support', 'user']);
  const FULL_ADMIN_ROLES = new Set(['super_admin', 'admin']);
  const CONTENT_ROLES = new Set(['super_admin', 'admin', 'content_manager']);
  const SUPPORT_ROLES = new Set(['super_admin', 'admin', 'support']);

  const normalizeUserRole = (role, isAdmin) => {
    if (typeof role === 'string') {
      const normalized = role.trim().toLowerCase();
      if (ROLE_SET.has(normalized)) {
        if (!isAdmin && normalized !== 'user') {
          return 'user';
        }

        return normalized;
      }
    }

    return isAdmin ? 'admin' : 'user';
  };

  const hasAnyRole = (user, roleSet) => {
    if (!user || !roleSet || typeof roleSet.has !== 'function') {
      return false;
    }

    return roleSet.has(normalizeUserRole(user.role, Boolean(user.isAdmin)));
  };

  const normalizeRateLimitEmail = (value) => {
    if (typeof value !== 'string') {
      return '';
    }

    const normalized = value.trim().toLowerCase();
    return EMAIL_PATTERN.test(normalized) ? normalized : '';
  };

  const buildRateLimitKey = (type, value) => {
    if (!value) {
      return '';
    }

    if (type === 'email') {
      const digest = crypto.createHash('sha256').update(value).digest('hex');
      return `email:${digest}`;
    }

    return `${type}:${value}`;
  };

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

  const buildAccountLockoutKeyFromEmail = (email) => {
    const normalizedEmail = normalizeRateLimitEmail(email);
    if (!normalizedEmail) {
      return '';
    }

    return buildRateLimitKey('email', normalizedEmail);
  };

  const resolveRateLimitKeyType = (key) => {
    if (typeof key !== 'string') {
      return 'unknown';
    }

    if (key.startsWith('ip:')) {
      return 'ip';
    }

    if (key.startsWith('email:')) {
      return 'email_hash';
    }

    return 'unknown';
  };

  const emitRateLimitExceededEvent = ({ req, scope, key, count, resetAt, severity = 'high' }) => {
    emitSecurityEvent({
      eventType: 'RATE_LIMIT_EXCEEDED',
      severity,
      userId: req.user?.id || null,
      email: req.body?.email || req.user?.email || '',
      req,
      details: {
        scope,
        keyType: resolveRateLimitKeyType(key),
        count,
        resetAt,
      },
      alerted: true,
    });
  };

  const getRateLimitKeysForRequest = (req, includeEmail = false) => {
    const clientIp = getClientIp(req);
    const keys = [];

    const ipKey = buildRateLimitKey('ip', clientIp);
    if (ipKey) {
      keys.push(ipKey);
    }

    if (includeEmail) {
      const email = normalizeRateLimitEmail(req.body?.email);
      const emailKey = buildRateLimitKey('email', email);
      if (emailKey) {
        keys.push(emailKey);
      }
    }

    return keys;
  };

  const extractBearerToken = (req) => {
    const authorizationHeader = req.headers.authorization;
    if (!authorizationHeader || !authorizationHeader.startsWith('Bearer ')) {
      const cookies = parseCookies(req.headers.cookie);
      return cookies.auth_token || null;
    }

    return authorizationHeader.slice(7);
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

  const checkLoginRateLimit = async (req, res, next) => {
    const rateLimitKeys = getRateLimitKeysForRequest(req, true);

    if (hasPersistentRateLimitStore) {
      try {
        for (const key of rateLimitKeys) {
          const state = await database.getRateLimitState('login', key, loginWindowMs, loginRateLimitMaxEntries);
          if (state.count >= loginMaxAttempts) {
            emitRateLimitExceededEvent({
              req,
              scope: 'login',
              key,
              count: state.count,
              resetAt: state.resetAt,
            });
            return res.status(429).json({ error: 'Too many login attempts. Please try again later.' });
          }
        }

        return next();
      } catch (error) {
        console.error('Persistent login rate-limit error:', error);
        return res.status(500).json({ error: 'Internal server error' });
      }
    }

    const now = Date.now();
    pruneRateLimitMap(loginAttempts, now, loginRateLimitMaxEntries);

    for (const key of rateLimitKeys) {
      const record = loginAttempts.get(key);

      if (!record || now > record.resetAt) {
        if (loginAttempts.size >= loginRateLimitMaxEntries) {
          return res.status(429).json({ error: 'Too many login attempts. Please try again later.' });
        }

        loginAttempts.set(key, { count: 0, resetAt: now + loginWindowMs });
        continue;
      }

      if (record.count >= loginMaxAttempts) {
        emitRateLimitExceededEvent({
          req,
          scope: 'login',
          key,
          count: record.count,
          resetAt: record.resetAt,
        });
        return res.status(429).json({ error: 'Too many login attempts. Please try again later.' });
      }
    }

    return next();
  };

  const recordLoginAttempt = async (req, success) => {
    const rateLimitKeys = getRateLimitKeysForRequest(req, true);

    if (hasPersistentRateLimitStore) {
      try {
        for (const key of rateLimitKeys) {
          if (success) {
            await database.resetRateLimit('login', key);
          } else {
            const state = await database.incrementRateLimit('login', key, loginWindowMs, loginRateLimitMaxEntries);
            if (
              key.startsWith('ip:')
              && state.count === securityAlertLoginFailureThreshold
            ) {
              emitSecurityEvent({
                eventType: 'AUTH_LOGIN_FAILURE_THRESHOLD',
                severity: 'high',
                email: req.body?.email || '',
                req,
                details: {
                  attempts: state.count,
                  threshold: securityAlertLoginFailureThreshold,
                  resetAt: state.resetAt,
                },
                alerted: true,
              });
            }
          }
        }

        return;
      } catch (error) {
        console.error('Persistent login attempt recording error:', error);
        return;
      }
    }

    const now = Date.now();
    pruneRateLimitMap(loginAttempts, now, loginRateLimitMaxEntries);

    for (const key of rateLimitKeys) {
      const record = loginAttempts.get(key) || { count: 0, resetAt: now + loginWindowMs };

      if (now > record.resetAt) {
        record.count = 0;
        record.resetAt = now + loginWindowMs;
      }

      if (success) {
        loginAttempts.delete(key);
        continue;
      }

      if (!loginAttempts.has(key) && loginAttempts.size >= loginRateLimitMaxEntries) {
        continue;
      }

      record.count += 1;
      loginAttempts.set(key, record);

      if (key.startsWith('ip:') && record.count === securityAlertLoginFailureThreshold) {
        emitSecurityEvent({
          eventType: 'AUTH_LOGIN_FAILURE_THRESHOLD',
          severity: 'high',
          email: req.body?.email || '',
          req,
          details: {
            attempts: record.count,
            threshold: securityAlertLoginFailureThreshold,
            resetAt: record.resetAt,
          },
          alerted: true,
        });
      }
    }
  };

  const getLoginAttemptCount = async (req) => {
    const rateLimitKeys = getRateLimitKeysForRequest(req, true);
    if (!rateLimitKeys.length) {
      return 0;
    }

    if (hasPersistentRateLimitStore) {
      try {
        let maxCount = 0;
        for (const key of rateLimitKeys) {
          const state = await database.getRateLimitState('login', key, loginWindowMs, loginRateLimitMaxEntries);
          const count = Number.isFinite(Number(state?.count)) ? Number(state.count) : 0;
          maxCount = Math.max(maxCount, count);
        }

        return maxCount;
      } catch (_error) {
        return 0;
      }
    }

    const now = Date.now();
    pruneRateLimitMap(loginAttempts, now, loginRateLimitMaxEntries);

    let maxCount = 0;
    for (const key of rateLimitKeys) {
      const record = loginAttempts.get(key);
      if (!record || now > record.resetAt) {
        continue;
      }

      if (Number.isFinite(Number(record.count))) {
        maxCount = Math.max(maxCount, Number(record.count));
      }
    }

    return maxCount;
  };

  const checkContactRateLimit = async (req, res, next) => {
    const clientIp = getClientIp(req);

    if (hasPersistentRateLimitStore) {
      try {
        const state = await database.incrementRateLimit('contact', clientIp, contactWindowMs, contactRateLimitMaxEntries);
        if (state.count > contactMaxAttempts) {
          emitRateLimitExceededEvent({
            req,
            scope: 'contact',
            key: `ip:${clientIp}`,
            count: state.count,
            resetAt: state.resetAt,
          });
          return res.status(429).json({ error: 'Too many requests. Please try again later.' });
        }

        return next();
      } catch (error) {
        console.error('Persistent contact rate-limit error:', error);
        return res.status(500).json({ error: 'Internal server error' });
      }
    }

    const now = Date.now();
    pruneRateLimitMap(contactAttempts, now, contactRateLimitMaxEntries);

    const record = contactAttempts.get(clientIp);
    if (!record || now > record.resetAt) {
      if (contactAttempts.size >= contactRateLimitMaxEntries) {
        return res.status(429).json({ error: 'Too many requests. Please try again later.' });
      }

      contactAttempts.set(clientIp, { count: 1, resetAt: now + contactWindowMs });
      return next();
    }

    if (record.count >= contactMaxAttempts) {
      emitRateLimitExceededEvent({
        req,
        scope: 'contact',
        key: `ip:${clientIp}`,
        count: record.count,
        resetAt: record.resetAt,
      });
      return res.status(429).json({ error: 'Too many requests. Please try again later.' });
    }

    record.count += 1;
    contactAttempts.set(clientIp, record);
    return next();
  };

  const checkRegistrationRateLimit = async (req, res, next) => {
    const rateLimitKeys = getRateLimitKeysForRequest(req, true);

    if (hasPersistentRateLimitStore) {
      try {
        for (const key of rateLimitKeys) {
          const state = await database.incrementRateLimit('register', key, registrationWindowMs, registrationRateLimitMaxEntries);
          if (state.count > registrationMaxAttempts) {
            emitRateLimitExceededEvent({
              req,
              scope: 'register',
              key,
              count: state.count,
              resetAt: state.resetAt,
            });
            return res.status(429).json({ error: 'Too many registration attempts. Please try again later.' });
          }
        }

        return next();
      } catch (error) {
        console.error('Persistent registration rate-limit error:', error);
        return res.status(500).json({ error: 'Internal server error' });
      }
    }

    const now = Date.now();
    pruneRateLimitMap(registrationAttempts, now, registrationRateLimitMaxEntries);

    for (const key of rateLimitKeys) {
      const record = registrationAttempts.get(key);
      if (!record || now > record.resetAt) {
        if (registrationAttempts.size >= registrationRateLimitMaxEntries) {
          return res.status(429).json({ error: 'Too many registration attempts. Please try again later.' });
        }

        registrationAttempts.set(key, { count: 1, resetAt: now + registrationWindowMs });
        continue;
      }

      if (record.count >= registrationMaxAttempts) {
        emitRateLimitExceededEvent({
          req,
          scope: 'register',
          key,
          count: record.count,
          resetAt: record.resetAt,
        });
        return res.status(429).json({ error: 'Too many registration attempts. Please try again later.' });
      }

      record.count += 1;
      registrationAttempts.set(key, record);
    }

    return next();
  };

  const checkAccountLockout = async (req, res, next) => {
    const email = normalizeRateLimitEmail(req.body?.email);
    const accountLockoutKey = buildAccountLockoutKeyFromEmail(email);

    if (!accountLockoutKey) {
      return next();
    }

    if (hasPersistentRateLimitStore) {
      try {
        const state = await database.getRateLimitState(
          'login_lockout',
          accountLockoutKey,
          accountLockoutWindowMs,
          accountLockoutRateLimitMaxEntries
        );

        if (state.count >= accountLockoutMaxAttempts) {
          const retryAfterMs = Math.max(0, Number(state.resetAt) - Date.now());
          emitSecurityEvent({
            eventType: 'AUTH_ACCOUNT_LOCKED',
            severity: 'high',
            email,
            ipAddress: getClientIp(req),
            details: {
              scope: 'login_lockout',
              retryAfterMs,
            },
            alerted: true,
          });

          return res.status(423).json({
            error: 'Account temporarily locked due to repeated failed login attempts. Please try again later.',
          });
        }

        return next();
      } catch (error) {
        console.error('Persistent account lockout check error:', error);
        return res.status(500).json({ error: 'Internal server error' });
      }
    }

    const now = Date.now();
    pruneRateLimitMap(accountLockouts, now, accountLockoutRateLimitMaxEntries);
    const record = accountLockouts.get(accountLockoutKey);

    if (record && now <= record.resetAt && record.count >= accountLockoutMaxAttempts) {
      const retryAfterMs = Math.max(0, Number(record.resetAt) - now);
      emitSecurityEvent({
        eventType: 'AUTH_ACCOUNT_LOCKED',
        severity: 'high',
        email,
        ipAddress: getClientIp(req),
        details: {
          scope: 'login_lockout',
          retryAfterMs,
        },
        alerted: true,
      });

      return res.status(423).json({
        error: 'Account temporarily locked due to repeated failed login attempts. Please try again later.',
      });
    }

    return next();
  };

  const recordAccountLoginAttempt = async (email, success) => {
    const normalizedEmail = normalizeRateLimitEmail(email);
    const accountLockoutKey = buildAccountLockoutKeyFromEmail(normalizedEmail);

    if (!accountLockoutKey) {
      return;
    }

    if (hasPersistentRateLimitStore) {
      try {
        if (success) {
          await database.resetRateLimit('login_lockout', accountLockoutKey);
          return;
        }

        const state = await database.incrementRateLimit(
          'login_lockout',
          accountLockoutKey,
          accountLockoutWindowMs,
          accountLockoutRateLimitMaxEntries
        );

        if (state.count === accountLockoutMaxAttempts) {
          emitSecurityEvent({
            eventType: 'AUTH_ACCOUNT_LOCKOUT_TRIGGERED',
            severity: 'high',
            email: normalizedEmail,
            details: {
              scope: 'login_lockout',
              attempts: state.count,
              retryAfterMs: Math.max(0, Number(state.resetAt) - Date.now()),
            },
            alerted: true,
          });
        }

        return;
      } catch (error) {
        console.error('Persistent account lockout recording error:', error);
        return;
      }
    }

    const now = Date.now();
    pruneRateLimitMap(accountLockouts, now, accountLockoutRateLimitMaxEntries);

    if (success) {
      accountLockouts.delete(accountLockoutKey);
      return;
    }

    const record = accountLockouts.get(accountLockoutKey) || {
      count: 0,
      resetAt: now + accountLockoutWindowMs,
    };

    if (now > record.resetAt) {
      record.count = 0;
      record.resetAt = now + accountLockoutWindowMs;
    }

    if (!accountLockouts.has(accountLockoutKey) && accountLockouts.size >= accountLockoutRateLimitMaxEntries) {
      return;
    }

    record.count += 1;
    accountLockouts.set(accountLockoutKey, record);

    if (record.count === accountLockoutMaxAttempts) {
      emitSecurityEvent({
        eventType: 'AUTH_ACCOUNT_LOCKOUT_TRIGGERED',
        severity: 'high',
        email: normalizedEmail,
        details: {
          scope: 'login_lockout',
          attempts: record.count,
          retryAfterMs: Math.max(0, Number(record.resetAt) - now),
        },
        alerted: true,
      });
    }
  };

  const authenticateApiRequest = async (req, res, next) => {
    const normalizedPath = req.path.replace(/\/+$/, '') || '/';
    const publicGetPattern = /^\/(blog|press-releases|media-coverage|events)(\/[^/]+)?$/;
    const isPublicRequest =
      (req.method === 'POST' && (normalizedPath === '/login' || normalizedPath === '/register' || normalizedPath === '/contacts' || normalizedPath === '/refresh')) ||
      (req.method === 'GET' && (normalizedPath === '/csrf-token' || publicGetPattern.test(normalizedPath)));

    if (isPublicRequest) {
      return next();
    }

    const token = extractBearerToken(req);
    if (!token) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const payload = verifyAuthToken(token);
    if (!payload) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }

    if (payload.jti && typeof database?.isTokenRevoked === 'function') {
      try {
        const tokenRevoked = await database.isTokenRevoked(payload.jti);
        if (tokenRevoked) {
          return res.status(401).json({ error: 'Token has been revoked' });
        }
      } catch (error) {
        console.error('Token revocation check failed:', error);
        return res.status(500).json({ error: 'Internal server error' });
      }
    }

    let currentUser = null;
    try {
      currentUser = await database.getUserById(payload.sub);
    } catch (error) {
      console.error('Authentication user lookup failed:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }

    if (!currentUser) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }

    const userUpdatedAtMs = Date.parse(currentUser.updatedAt || currentUser.createdAt || '');
    if (Number.isFinite(userUpdatedAtMs) && typeof payload.iat === 'number' && payload.iat < userUpdatedAtMs) {
      return res.status(401).json({ error: 'Token is no longer valid. Please log in again.' });
    }

    const resolvedRole = normalizeUserRole(currentUser.role, Boolean(currentUser.isAdmin));
    req.user = {
      id: currentUser.id,
      email: currentUser.email,
      isAdmin: resolvedRole !== 'user',
      role: resolvedRole,
    };
    req.authToken = token;
    req.authPayload = payload;

    const cmsWritePaths = ['/blog', '/press-releases', '/media-coverage', '/events'];
    for (const cmsPath of cmsWritePaths) {
      if (normalizedPath.startsWith(cmsPath) && req.method !== 'GET' && !hasAnyRole(req.user, CONTENT_ROLES)) {
        return res.status(403).json({ error: 'Admin access required' });
      }
    }

    if (normalizedPath.startsWith('/admin/')) {
      const adminContentPaths = ['/admin/blog', '/admin/press-releases', '/admin/media-coverage', '/admin/events'];
      const adminSupportPaths = ['/admin/orders', '/admin/registrations', '/admin/contacts'];

      if (adminContentPaths.some((pathPrefix) => normalizedPath.startsWith(pathPrefix))) {
        if (!hasAnyRole(req.user, CONTENT_ROLES)) {
          return res.status(403).json({ error: 'Admin access required' });
        }
      } else if (adminSupportPaths.some((pathPrefix) => normalizedPath.startsWith(pathPrefix))) {
        if (!hasAnyRole(req.user, SUPPORT_ROLES)) {
          return res.status(403).json({ error: 'Admin access required' });
        }
      } else if (!hasAnyRole(req.user, FULL_ADMIN_ROLES)) {
        return res.status(403).json({ error: 'Admin access required' });
      }
    }

    if (normalizedPath.startsWith('/contacts') && req.method !== 'POST' && !hasAnyRole(req.user, SUPPORT_ROLES)) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    if (normalizedPath === '/users' && !hasAnyRole(req.user, FULL_ADMIN_ROLES)) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    if (normalizedPath === '/users' && req.method === 'POST' && !hasAnyRole(req.user, FULL_ADMIN_ROLES)) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const adminOnlyGetPaths = ['/orders', '/registrations'];
    if (adminOnlyGetPaths.includes(normalizedPath) && req.method === 'GET' && !hasAnyRole(req.user, SUPPORT_ROLES)) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    if (
      ((/^\/orders\/[^/]+\/status$/.test(normalizedPath) || (/^\/orders\/[^/]+$/.test(normalizedPath) && normalizedPath !== '/orders/my')) && req.method !== 'POST') &&
      !hasAnyRole(req.user, FULL_ADMIN_ROLES)
    ) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    if (
      ((/^\/registrations\/[^/]+\/status$/.test(normalizedPath) || (/^\/registrations\/[^/]+$/.test(normalizedPath) && normalizedPath !== '/registrations/my')) && req.method !== 'POST') &&
      !hasAnyRole(req.user, FULL_ADMIN_ROLES)
    ) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const demoEndpoints = ['/load-demo-data', '/clear-all-data'];
    if (demoEndpoints.includes(normalizedPath)) {
      if (!demoEndpointsEnabled) {
        return res.status(404).json({ error: 'Endpoint not available' });
      }
      if (!hasAnyRole(req.user, FULL_ADMIN_ROLES)) {
        return res.status(403).json({ error: 'Admin access required' });
      }
    }

    if (/^\/users\/[^/]+\/password$/.test(normalizedPath) && req.method === 'PUT') {
      const targetUserId = normalizedPath.split('/')[2];
      if (req.user.id !== targetUserId && !hasAnyRole(req.user, FULL_ADMIN_ROLES)) {
        return res.status(403).json({ error: 'Not authorized for this action' });
      }
    }

    if (/^\/users\/[^/]+\/role$/.test(normalizedPath) && req.method === 'PUT' && !hasAnyRole(req.user, FULL_ADMIN_ROLES)) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    if (/^\/users\/[^/]+$/.test(normalizedPath) && req.method === 'DELETE') {
      const targetUserId = normalizedPath.split('/')[2];
      if (req.user.id !== targetUserId && !hasAnyRole(req.user, FULL_ADMIN_ROLES)) {
        return res.status(403).json({ error: 'Not authorized for this action' });
      }
    }

    return next();
  };

  return {
    authenticateApiRequest,
    checkLoginRateLimit,
    recordLoginAttempt,
    checkRegistrationRateLimit,
    checkContactRateLimit,
    checkAccountLockout,
    recordAccountLoginAttempt,
    getLoginAttemptCount,
  };
};

module.exports = createAuthMiddleware;
