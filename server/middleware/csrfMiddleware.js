const crypto = require('node:crypto');

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

const parseCookies = (cookieHeader) => {
  if (typeof cookieHeader !== 'string' || cookieHeader.trim().length === 0) {
    return {};
  }

  return cookieHeader.split(';').reduce((cookies, segment) => {
    const [rawName, ...rawValueParts] = segment.split('=');
    const name = typeof rawName === 'string' ? rawName.trim() : '';
    if (!name) {
      return cookies;
    }

    const rawValue = rawValueParts.join('=');
    try {
      cookies[name] = decodeURIComponent(rawValue.trim());
    } catch (_error) {
      cookies[name] = rawValue.trim();
    }

    return cookies;
  }, {});
};

const normalizeOrigin = (value) => {
  if (typeof value !== 'string' || value.trim().length === 0) {
    return '';
  }

  try {
    return new URL(value).origin;
  } catch (_error) {
    return '';
  }
};

const matchesOrigin = (expectedOrigin, candidateOrigin) => {
  if (!expectedOrigin || !candidateOrigin) {
    return false;
  }

  return expectedOrigin.toLowerCase() === candidateOrigin.toLowerCase();
};

const timingSafeEqualString = (left, right) => {
  if (typeof left !== 'string' || typeof right !== 'string') {
    return false;
  }

  const leftBuffer = Buffer.from(left, 'utf8');
  const rightBuffer = Buffer.from(right, 'utf8');

  if (leftBuffer.length !== rightBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(leftBuffer, rightBuffer);
};

const createCsrfMiddleware = ({
  csrfCookieName = 'csrf_token',
  csrfHeaderName = 'x-csrf-token',
  csrfCookieOptions = {},
  authCookieName = 'auth_token',
  allowedOrigins = [],
}) => {
  const normalizedAllowedOrigins = new Set(
    (Array.isArray(allowedOrigins) ? allowedOrigins : [])
      .map((origin) => normalizeOrigin(origin))
      .filter(Boolean)
  );

  const issueCsrfToken = (res) => {
    const token = crypto.randomBytes(32).toString('base64url');
    res.cookie(csrfCookieName, token, csrfCookieOptions);
    return token;
  };

  const getRequestOrigin = (req) => {
    const hostHeader = typeof req.headers.host === 'string' ? req.headers.host.trim() : '';
    if (!hostHeader) {
      return '';
    }

    const protocol = req.protocol === 'https' ? 'https' : 'http';
    return `${protocol}://${hostHeader}`;
  };

  const hasTrustedOrigin = (req) => {
    const requestOrigin = normalizeOrigin(getRequestOrigin(req));
    const originHeader = normalizeOrigin(req.headers.origin);

    if (originHeader) {
      if (matchesOrigin(requestOrigin, originHeader)) {
        return true;
      }

      return normalizedAllowedOrigins.has(originHeader);
    }

    const refererOrigin = normalizeOrigin(req.headers.referer);
    if (refererOrigin) {
      if (matchesOrigin(requestOrigin, refererOrigin)) {
        return true;
      }

      return normalizedAllowedOrigins.has(refererOrigin);
    }

    return false;
  };

  const requiresCsrfValidation = (req, cookies) => {
    if (SAFE_METHODS.has(req.method)) {
      return false;
    }

    const hasBearerToken =
      typeof req.headers.authorization === 'string' && req.headers.authorization.startsWith('Bearer ');
    const hasAuthCookie = typeof cookies[authCookieName] === 'string' && cookies[authCookieName].length > 0;

    return hasAuthCookie || !hasBearerToken;
  };

  const validateCsrfRequest = (req, res, next) => {
    const cookies = parseCookies(req.headers.cookie);

    if (!requiresCsrfValidation(req, cookies)) {
      return next();
    }

    if (!hasTrustedOrigin(req)) {
      return res.status(403).json({
        error: 'Request origin validation failed',
        code: 'CSRF_ORIGIN_INVALID',
      });
    }

    const cookieToken = typeof cookies[csrfCookieName] === 'string' ? cookies[csrfCookieName] : '';
    const rawHeaderToken = req.headers[csrfHeaderName.toLowerCase()];
    const headerToken = Array.isArray(rawHeaderToken) ? rawHeaderToken[0] : rawHeaderToken;

    if (!cookieToken || typeof headerToken !== 'string' || !timingSafeEqualString(cookieToken, headerToken)) {
      return res.status(403).json({
        error: 'Invalid CSRF token',
        code: 'CSRF_TOKEN_INVALID',
      });
    }

    return next();
  };

  return {
    issueCsrfToken,
    validateCsrfRequest,
  };
};

module.exports = createCsrfMiddleware;
