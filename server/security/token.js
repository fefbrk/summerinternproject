const crypto = require('crypto');

const DEFAULT_TOKEN_TTL_MS = 24 * 60 * 60 * 1000;
const IS_PRODUCTION = process.env.NODE_ENV === 'production';
const MAX_TOKEN_LENGTH = 4096;
let generatedDevelopmentTokenSecret = null;

const encodeBase64Url = (value) => {
  return Buffer.from(value, 'utf8').toString('base64url');
};

const decodeBase64Url = (value) => {
  return Buffer.from(value, 'base64url').toString('utf8');
};

const getTokenSecret = () => {
  const configuredSecret = process.env.AUTH_TOKEN_SECRET;
  if (typeof configuredSecret === 'string' && configuredSecret.trim()) {
    return configuredSecret;
  }

  if (IS_PRODUCTION) {
    throw new Error('AUTH_TOKEN_SECRET must be set in production');
  }

  if (!generatedDevelopmentTokenSecret) {
    generatedDevelopmentTokenSecret = crypto.randomBytes(64).toString('hex');
    console.warn('AUTH_TOKEN_SECRET is not configured; generated ephemeral secret for non-production runtime.');
  }

  return generatedDevelopmentTokenSecret;
};

const getTokenTtl = () => {
  const ttl = Number(process.env.AUTH_TOKEN_TTL_MS);
  if (Number.isFinite(ttl) && ttl > 0) {
    return ttl;
  }

  return DEFAULT_TOKEN_TTL_MS;
};

const signPayload = (encodedPayload) => {
  return crypto
    .createHmac('sha256', getTokenSecret())
    .update(encodedPayload)
    .digest('base64url');
};

const createAuthToken = (user) => {
  const issuedAt = Date.now();
  const payload = {
    sub: user.id,
    email: user.email,
    isAdmin: Boolean(user.isAdmin),
    jti: crypto.randomUUID(),
    iat: issuedAt,
    exp: issuedAt + getTokenTtl()
  };

  const encodedPayload = encodeBase64Url(JSON.stringify(payload));
  const signature = signPayload(encodedPayload);
  return `${encodedPayload}.${signature}`;
};

const verifyAuthToken = (token) => {
  if (!token || typeof token !== 'string') {
    return null;
  }

  if (token.length > MAX_TOKEN_LENGTH) {
    return null;
  }

  const parts = token.split('.');
  if (parts.length !== 2) {
    return null;
  }

  const [encodedPayload, signature] = parts;
  const expectedSignature = signPayload(encodedPayload);

  const providedSignatureBuffer = Buffer.from(signature);
  const expectedSignatureBuffer = Buffer.from(expectedSignature);

  if (providedSignatureBuffer.length !== expectedSignatureBuffer.length) {
    return null;
  }

  if (!crypto.timingSafeEqual(providedSignatureBuffer, expectedSignatureBuffer)) {
    return null;
  }

  try {
    const payload = JSON.parse(decodeBase64Url(encodedPayload));

    if (!payload || typeof payload !== 'object') {
      return null;
    }

    if (!payload.sub || typeof payload.sub !== 'string') {
      return null;
    }

    if (!payload.jti || typeof payload.jti !== 'string') {
      return null;
    }

    if (!payload.iat || typeof payload.iat !== 'number' || payload.iat <= 0) {
      return null;
    }

    if (!payload.exp || typeof payload.exp !== 'number' || payload.exp <= payload.iat || payload.exp < Date.now()) {
      return null;
    }

    return payload;
  } catch (_error) {
    return null;
  }
};

module.exports = {
  createAuthToken,
  verifyAuthToken
};
