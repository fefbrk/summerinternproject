const createAuthMiddleware = ({
  verifyAuthToken,
  database,
  isSelfOrAdmin,
  loginWindowMs,
  loginMaxAttempts,
  demoEndpointsEnabled,
}) => {
  const loginAttempts = new Map();

  const extractBearerToken = (req) => {
    const authorizationHeader = req.headers.authorization;
    if (!authorizationHeader || !authorizationHeader.startsWith('Bearer ')) {
      return null;
    }

    return authorizationHeader.slice(7);
  };

  const getClientIp = (req) => {
    const forwarded = req.headers['x-forwarded-for'];
    if (typeof forwarded === 'string' && forwarded.length > 0) {
      return forwarded.split(',')[0].trim();
    }

    return req.ip || 'unknown';
  };

  const checkLoginRateLimit = (req, res, next) => {
    const clientIp = getClientIp(req);
    const now = Date.now();
    const record = loginAttempts.get(clientIp);

    if (!record || now > record.resetAt) {
      loginAttempts.set(clientIp, { count: 0, resetAt: now + loginWindowMs });
      return next();
    }

    if (record.count >= loginMaxAttempts) {
      return res.status(429).json({ error: 'Too many login attempts. Please try again later.' });
    }

    return next();
  };

  const recordLoginAttempt = (req, success) => {
    const clientIp = getClientIp(req);
    const now = Date.now();
    const record = loginAttempts.get(clientIp) || { count: 0, resetAt: now + loginWindowMs };

    if (now > record.resetAt) {
      record.count = 0;
      record.resetAt = now + loginWindowMs;
    }

    if (success) {
      loginAttempts.delete(clientIp);
      return;
    }

    record.count += 1;
    loginAttempts.set(clientIp, record);
  };

  const authenticateApiRequest = async (req, res, next) => {
    const normalizedPath = req.path.replace(/\/+$/, '') || '/';
    const publicGetPattern = /^\/(blog|press-releases|media-coverage|events)(\/[^/]+)?$/;
    const isPublicRequest =
      (req.method === 'POST' && (normalizedPath === '/login' || normalizedPath === '/register' || normalizedPath === '/contacts')) ||
      (req.method === 'GET' && publicGetPattern.test(normalizedPath));

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

    req.user = {
      id: currentUser.id,
      email: currentUser.email,
      isAdmin: Boolean(currentUser.isAdmin),
    };

    if (normalizedPath.startsWith('/blog') && req.method !== 'GET' && !req.user.isAdmin) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    if (normalizedPath.startsWith('/press-releases') && req.method !== 'GET' && !req.user.isAdmin) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    if (normalizedPath.startsWith('/media-coverage') && req.method !== 'GET' && !req.user.isAdmin) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    if (normalizedPath.startsWith('/events') && req.method !== 'GET' && !req.user.isAdmin) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    if (normalizedPath.startsWith('/contacts') && req.method !== 'POST' && !req.user.isAdmin) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    if (normalizedPath === '/users' && !req.user.isAdmin) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    if (normalizedPath === '/orders' && req.method === 'GET' && !req.user.isAdmin) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    if (normalizedPath === '/registrations' && req.method === 'GET' && !req.user.isAdmin) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    if (
      ((/^\/orders\/[^/]+\/status$/.test(normalizedPath) || (/^\/orders\/[^/]+$/.test(normalizedPath) && normalizedPath !== '/orders/my')) && req.method !== 'POST') &&
      !req.user.isAdmin
    ) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    if (
      ((/^\/registrations\/[^/]+\/status$/.test(normalizedPath) || (/^\/registrations\/[^/]+$/.test(normalizedPath) && normalizedPath !== '/registrations/my')) && req.method !== 'POST') &&
      !req.user.isAdmin
    ) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    if ((normalizedPath === '/load-demo-data' || normalizedPath === '/clear-all-data') && !demoEndpointsEnabled) {
      return res.status(404).json({ error: 'Endpoint not available' });
    }

    if ((normalizedPath === '/load-demo-data' || normalizedPath === '/clear-all-data') && !req.user.isAdmin) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    if (/^\/users\/[^/]+\/password$/.test(normalizedPath) && req.method === 'PUT') {
      const targetUserId = normalizedPath.split('/')[2];
      if (!isSelfOrAdmin(req.user, targetUserId)) {
        return res.status(403).json({ error: 'Not authorized for this action' });
      }
    }

    if (/^\/users\/[^/]+$/.test(normalizedPath) && req.method === 'DELETE') {
      const targetUserId = normalizedPath.split('/')[2];
      if (!isSelfOrAdmin(req.user, targetUserId)) {
        return res.status(403).json({ error: 'Not authorized for this action' });
      }
    }

    return next();
  };

  return {
    authenticateApiRequest,
    checkLoginRateLimit,
    recordLoginAttempt,
  };
};

module.exports = createAuthMiddleware;
