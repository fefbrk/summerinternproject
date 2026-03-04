const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const sanitizeHtml = require('sanitize-html');
const { v4: uuidv4 } = require('uuid');
const database = require('./database/database');
const { hashPassword, verifyPassword, isHashedPassword } = require('./security/password');
const { createAuthToken, verifyAuthToken } = require('./security/token');
const createAuthMiddleware = require('./middleware/authMiddleware');
const createCsrfMiddleware = require('./middleware/csrfMiddleware');
const createBootstrapService = require('./services/bootstrapService');
const createProductCatalogService = require('./services/productCatalogService');
const createPaymentService = require('./services/paymentService');
const registerAuthUserRoutes = require('./routes/authUserRoutes');
const registerCommerceRoutes = require('./routes/commerceRoutes');
const registerAccountRoutes = require('./routes/accountRoutes');
const registerMaintenanceRoutes = require('./routes/maintenanceRoutes');
const registerContentRoutes = require('./routes/contentRoutes');
const registerContentUploadRoutes = require('./routes/contentUploadRoutes');
const registerDemoRoutes = require('./routes/demoRoutes');

const app = express();
app.disable('x-powered-by');
const PORT = process.env.PORT || 3001;
const DEMO_ENDPOINTS_ENABLED = process.env.ENABLE_DEMO_ENDPOINTS === 'true';
const TRUST_PROXY = process.env.TRUST_PROXY === 'true';
const BASE_IMAGE_DIR = path.resolve(__dirname, '../public/postimages');
const IMAGE_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/gif', 'image/webp']);
const IMAGE_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.gif', '.webp']);
const VALID_RESOURCE_ID = /^[a-zA-Z0-9_-]{1,64}$/;
const PASSWORD_PATTERN = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,128}$/;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const BLOG_STATUSES = new Set(['draft', 'published']);
const EVENT_STATUSES = new Set(['upcoming', 'ongoing', 'completed', 'cancelled']);
const ORDER_STATUSES = new Set(['received', 'preparing', 'shipping', 'delivered']);
const PAYMENT_STATUSES = new Set(['pending', 'paid', 'failed', 'refunded']);
const REGISTRATION_STATUSES = new Set(['registered', 'active', 'completed']);
const LOGIN_WINDOW_MS = 15 * 60 * 1000;
const LOGIN_MAX_ATTEMPTS = 10;
const LOGIN_RATE_LIMIT_MAX_ENTRIES = 10000;
const LOGIN_LOCKOUT_WINDOW_MS = Number.isFinite(Number(process.env.LOGIN_LOCKOUT_WINDOW_MS)) && Number(process.env.LOGIN_LOCKOUT_WINDOW_MS) > 0
  ? Number(process.env.LOGIN_LOCKOUT_WINDOW_MS)
  : 30 * 60 * 1000;
const LOGIN_LOCKOUT_MAX_ATTEMPTS = Number.isFinite(Number(process.env.LOGIN_LOCKOUT_MAX_ATTEMPTS)) && Number(process.env.LOGIN_LOCKOUT_MAX_ATTEMPTS) > 0
  ? Number(process.env.LOGIN_LOCKOUT_MAX_ATTEMPTS)
  : 5;
const LOGIN_LOCKOUT_RATE_LIMIT_MAX_ENTRIES = Number.isFinite(Number(process.env.LOGIN_LOCKOUT_RATE_LIMIT_MAX_ENTRIES)) && Number(process.env.LOGIN_LOCKOUT_RATE_LIMIT_MAX_ENTRIES) > 0
  ? Number(process.env.LOGIN_LOCKOUT_RATE_LIMIT_MAX_ENTRIES)
  : 50000;
const DEFAULT_AUTH_TOKEN_TTL_MS = 24 * 60 * 60 * 1000;
const MAX_PRODUCTION_AUTH_TOKEN_TTL_MS = 24 * 60 * 60 * 1000;
const API_JSON_BODY_LIMIT = (typeof process.env.API_JSON_BODY_LIMIT === 'string' && process.env.API_JSON_BODY_LIMIT.trim().length > 0)
  ? process.env.API_JSON_BODY_LIMIT.trim()
  : '256kb';
const API_FORM_BODY_LIMIT = (typeof process.env.API_FORM_BODY_LIMIT === 'string' && process.env.API_FORM_BODY_LIMIT.trim().length > 0)
  ? process.env.API_FORM_BODY_LIMIT.trim()
  : '256kb';
const REGISTRATION_WINDOW_MS = Number.isFinite(Number(process.env.REGISTRATION_WINDOW_MS)) && Number(process.env.REGISTRATION_WINDOW_MS) > 0
  ? Number(process.env.REGISTRATION_WINDOW_MS)
  : 15 * 60 * 1000;
const REGISTRATION_MAX_ATTEMPTS = Number.isFinite(Number(process.env.REGISTRATION_MAX_ATTEMPTS)) && Number(process.env.REGISTRATION_MAX_ATTEMPTS) > 0
  ? Number(process.env.REGISTRATION_MAX_ATTEMPTS)
  : 20;
const REGISTRATION_RATE_LIMIT_MAX_ENTRIES = Number.isFinite(Number(process.env.REGISTRATION_RATE_LIMIT_MAX_ENTRIES)) && Number(process.env.REGISTRATION_RATE_LIMIT_MAX_ENTRIES) > 0
  ? Number(process.env.REGISTRATION_RATE_LIMIT_MAX_ENTRIES)
  : 10000;
const CONTACT_WINDOW_MS = 10 * 60 * 1000;
const CONTACT_MAX_ATTEMPTS = 20;
const CONTACT_RATE_LIMIT_MAX_ENTRIES = 20000;
const MANUAL_FULFILLMENT_OVERRIDE_ENABLED = process.env.ENABLE_MANUAL_FULFILLMENT_OVERRIDE === 'true';
const MANUAL_PAYMENT_OVERRIDE_ENABLED = process.env.ENABLE_MANUAL_PAYMENT_OVERRIDE === 'true';
const CARRIER_WEBHOOK_SECRET = typeof process.env.CARRIER_WEBHOOK_SECRET === 'string'
  ? process.env.CARRIER_WEBHOOK_SECRET.trim()
  : '';
const AUTH_TOKEN_SECRET = typeof process.env.AUTH_TOKEN_SECRET === 'string'
  ? process.env.AUTH_TOKEN_SECRET.trim()
  : '';
const AUTH_TOKEN_TTL_MS = Number.isFinite(Number(process.env.AUTH_TOKEN_TTL_MS)) && Number(process.env.AUTH_TOKEN_TTL_MS) > 0
  ? Number(process.env.AUTH_TOKEN_TTL_MS)
  : DEFAULT_AUTH_TOKEN_TTL_MS;
const LEGACY_DEFAULT_ADMIN_EMAIL = 'admin@klr.com';
const IS_PRODUCTION = process.env.NODE_ENV === 'production';
const MIN_TOKEN_SECRET_LENGTH = 32;
const MIN_WEBHOOK_SECRET_LENGTH = 24;
const UNSAFE_OBJECT_KEYS = new Set(['__proto__', 'prototype', 'constructor']);
const MAX_PAYLOAD_VALIDATION_DEPTH = 12;
const MAX_AUDIT_DEPTH = 4;
const MAX_AUDIT_ITEMS = 40;
const MAX_AUDIT_STRING_LENGTH = 500;
const AUDIT_STATE_CHANGING_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);
const VALID_SECURITY_SEVERITIES = new Set(['low', 'medium', 'high', 'critical']);
const SENSITIVE_AUDIT_FIELDS = new Set([
  'password',
  'newpassword',
  'currentpassword',
  'token',
  'authtoken',
  'authorization',
  'csrf',
  'csrftoken',
  'cardnumber',
  'cvv',
  'paymentreference',
]);
const AUTH_COOKIE_NAME = 'auth_token';
const CSRF_COOKIE_NAME = 'csrf_token';
const CSRF_HEADER_NAME = 'x-csrf-token';
const AUTH_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: IS_PRODUCTION,
  sameSite: 'lax',
  path: '/',
  maxAge: AUTH_TOKEN_TTL_MS,
};
const CSRF_COOKIE_OPTIONS = {
  httpOnly: false,
  secure: IS_PRODUCTION,
  sameSite: 'lax',
  path: '/',
  maxAge: AUTH_TOKEN_TTL_MS,
};
const configuredAdminEmail = typeof process.env.DEFAULT_ADMIN_EMAIL === 'string'
  ? process.env.DEFAULT_ADMIN_EMAIL.trim().toLowerCase()
  : '';

let generatedAdminEmail = null;
let generatedAdminPassword = null;

if (!AUTH_TOKEN_SECRET) {
  if (IS_PRODUCTION) {
    throw new Error('AUTH_TOKEN_SECRET must be set in production.');
  }

  console.warn('AUTH_TOKEN_SECRET is not set. Set a strong secret in production.');
}

if (AUTH_TOKEN_SECRET && AUTH_TOKEN_SECRET.length < MIN_TOKEN_SECRET_LENGTH) {
  if (IS_PRODUCTION) {
    throw new Error(`AUTH_TOKEN_SECRET must be at least ${MIN_TOKEN_SECRET_LENGTH} characters in production.`);
  }

  console.warn(`AUTH_TOKEN_SECRET is shorter than ${MIN_TOKEN_SECRET_LENGTH} characters. Use a longer secret for non-production too.`);
}

if (IS_PRODUCTION && AUTH_TOKEN_TTL_MS > MAX_PRODUCTION_AUTH_TOKEN_TTL_MS) {
  throw new Error(`AUTH_TOKEN_TTL_MS cannot exceed ${MAX_PRODUCTION_AUTH_TOKEN_TTL_MS} ms in production.`);
}

if (!IS_PRODUCTION && AUTH_TOKEN_TTL_MS > MAX_PRODUCTION_AUTH_TOKEN_TTL_MS) {
  console.warn(`AUTH_TOKEN_TTL_MS is set above ${MAX_PRODUCTION_AUTH_TOKEN_TTL_MS} ms. Consider shorter-lived tokens.`);
}

if (IS_PRODUCTION && !configuredAdminEmail) {
  throw new Error('DEFAULT_ADMIN_EMAIL must be set in production.');
}

if (configuredAdminEmail && !EMAIL_PATTERN.test(configuredAdminEmail)) {
  throw new Error('DEFAULT_ADMIN_EMAIL must be a valid email address.');
}

if (IS_PRODUCTION && !process.env.DEFAULT_ADMIN_PASSWORD) {
  throw new Error('DEFAULT_ADMIN_PASSWORD must be set in production.');
}

if (IS_PRODUCTION && process.env.DEFAULT_ADMIN_PASSWORD && !PASSWORD_PATTERN.test(process.env.DEFAULT_ADMIN_PASSWORD)) {
  throw new Error('DEFAULT_ADMIN_PASSWORD must meet password complexity requirements in production.');
}

if (IS_PRODUCTION && !CARRIER_WEBHOOK_SECRET) {
  throw new Error('CARRIER_WEBHOOK_SECRET must be set in production.');
}

if (CARRIER_WEBHOOK_SECRET && CARRIER_WEBHOOK_SECRET.length < MIN_WEBHOOK_SECRET_LENGTH) {
  if (IS_PRODUCTION) {
    throw new Error(`CARRIER_WEBHOOK_SECRET must be at least ${MIN_WEBHOOK_SECRET_LENGTH} characters in production.`);
  }

  console.warn(`CARRIER_WEBHOOK_SECRET is shorter than ${MIN_WEBHOOK_SECRET_LENGTH} characters.`);
}

if (IS_PRODUCTION && DEMO_ENDPOINTS_ENABLED) {
  throw new Error('ENABLE_DEMO_ENDPOINTS must remain false in production.');
}

if (MANUAL_FULFILLMENT_OVERRIDE_ENABLED) {
  console.warn('ENABLE_MANUAL_FULFILLMENT_OVERRIDE is enabled. Use only for controlled emergency operations.');
}

if (MANUAL_PAYMENT_OVERRIDE_ENABLED) {
  console.warn('ENABLE_MANUAL_PAYMENT_OVERRIDE is enabled. Keep disabled for production unless emergency override is required.');
}

const getDefaultAdminEmail = () => {
  if (configuredAdminEmail) {
    return configuredAdminEmail;
  }

  if (!generatedAdminEmail) {
    generatedAdminEmail = `admin-${crypto.randomBytes(6).toString('hex')}@local.invalid`;
    console.warn('DEFAULT_ADMIN_EMAIL is not set. Generated one-time admin email for this runtime.');
  }

  return generatedAdminEmail;
};

const getDefaultAdminPassword = () => {
  if (process.env.DEFAULT_ADMIN_PASSWORD) {
    return process.env.DEFAULT_ADMIN_PASSWORD;
  }

  if (!generatedAdminPassword) {
    generatedAdminPassword = crypto.randomBytes(12).toString('base64url');
    console.warn('DEFAULT_ADMIN_PASSWORD is not set. Generated one-time admin password for this runtime.');
  }

  return generatedAdminPassword;
};

const adminEmail = getDefaultAdminEmail();

const sanitizePlainText = (value, maxLength = 255) => {
  if (typeof value !== 'string') {
    return '';
  }

  return value.trim().replace(/[\u0000-\u001f\u007f]/g, '').slice(0, maxLength);
};

const sanitizeEmail = (value) => {
  return sanitizePlainText(value, 254).toLowerCase();
};

const sanitizeUrl = (value, maxLength = 500, options = {}) => {
  const {
    allowRelative = true,
    allowedProtocols = ['http:', 'https:'],
  } = options;

  const normalized = sanitizePlainText(value, maxLength);
  if (!normalized) {
    return '';
  }

  if (allowRelative && normalized.startsWith('/')) {
    if (normalized.startsWith('//') || normalized.includes('\\')) {
      return '';
    }

    return normalized;
  }

  try {
    const parsed = new URL(normalized);
    if (!allowedProtocols.includes(parsed.protocol)) {
      return '';
    }

    return parsed.toString();
  } catch (_error) {
    return '';
  }
};

const sanitizeRichText = (value) => {
  return sanitizeHtml(typeof value === 'string' ? value : '', {
    allowedTags: [
      'p', 'br', 'strong', 'em', 'u', 's', 'blockquote', 'code', 'pre',
      'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'ul', 'ol', 'li', 'a', 'img',
      'span', 'div'
    ],
    allowedAttributes: {
      a: ['href', 'target', 'rel', 'title'],
      img: ['src', 'alt', 'title'],
    },
    allowedSchemes: ['http', 'https', 'mailto'],
    allowedSchemesAppliedToAttributes: ['href', 'src'],
    allowProtocolRelative: false,
    transformTags: {
      a: sanitizeHtml.simpleTransform('a', {
        rel: 'noopener noreferrer nofollow',
        target: '_blank'
      })
    }
  });
};

const sanitizeImagesPayload = (images) => {
  if (!Array.isArray(images)) {
    return [];
  }

  return images
    .filter((image) => image && typeof image === 'object')
    .map((image) => {
      const src = sanitizeUrl(image.src, 500, { allowRelative: true });
      return {
        src,
        alt: sanitizePlainText(image.alt, 200),
        title: sanitizePlainText(image.title || '', 200),
        description: sanitizePlainText(image.description || '', 500)
      };
    })
    .filter((image) => image.src.length > 0);
};

const resolveUploadPath = (...segments) => {
  const targetPath = path.resolve(BASE_IMAGE_DIR, ...segments);
  const basePathWithSeparator = `${BASE_IMAGE_DIR}${path.sep}`;

  if (targetPath !== BASE_IMAGE_DIR && !targetPath.startsWith(basePathWithSeparator)) {
    throw new Error('Invalid upload path');
  }

  return targetPath;
};

const sanitizeResourceId = (value) => {
  const sanitized = sanitizePlainText(String(value || ''), 64);
  if (!VALID_RESOURCE_ID.test(sanitized)) {
    return null;
  }

  return sanitized;
};

const isValidPassword = (value) => {
  return typeof value === 'string' && PASSWORD_PATTERN.test(value);
};

const isValidEmail = (value) => {
  return typeof value === 'string' && EMAIL_PATTERN.test(value);
};

const toSafeUser = (user) => {
  if (!user) {
    return null;
  }

  const { password: _password, ...safeUser } = user;
  return {
    ...safeUser,
    isAdmin: Boolean(safeUser.isAdmin)
  };
};

const isSelfOrAdmin = (requestUser, targetUserId) => {
  return Boolean(requestUser && (requestUser.isAdmin || requestUser.id === targetUserId));
};

const normalizeOrigin = (origin) => {
  if (typeof origin !== 'string' || origin.trim().length === 0) {
    return '';
  }

  try {
    return new URL(origin).origin;
  } catch (_error) {
    return '';
  }
};

const isPlainObject = (value) => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return false;
  }

  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
};

const hasUnsafePayloadStructure = (value, depth = 0) => {
  if (value === null || value === undefined) {
    return false;
  }

  if (depth > MAX_PAYLOAD_VALIDATION_DEPTH) {
    return true;
  }

  if (Array.isArray(value)) {
    for (const item of value) {
      if (hasUnsafePayloadStructure(item, depth + 1)) {
        return true;
      }
    }

    return false;
  }

  if (typeof value !== 'object') {
    return false;
  }

  if (!isPlainObject(value)) {
    return true;
  }

  for (const [key, nestedValue] of Object.entries(value)) {
    if (UNSAFE_OBJECT_KEYS.has(String(key).toLowerCase())) {
      return true;
    }

    if (hasUnsafePayloadStructure(nestedValue, depth + 1)) {
      return true;
    }
  }

  return false;
};

const sanitizeAuditValue = (value, depth = 0) => {
  if (value === null || value === undefined) {
    return value;
  }

  if (typeof value === 'string') {
    return sanitizePlainText(value, MAX_AUDIT_STRING_LENGTH);
  }

  if (typeof value === 'number' || typeof value === 'boolean') {
    return value;
  }

  if (Array.isArray(value)) {
    if (depth >= MAX_AUDIT_DEPTH) {
      return '[truncated]';
    }

    return value
      .slice(0, MAX_AUDIT_ITEMS)
      .map((item) => sanitizeAuditValue(item, depth + 1));
  }

  if (typeof value === 'object') {
    if (depth >= MAX_AUDIT_DEPTH) {
      return '[truncated]';
    }

    const result = {};
    const entries = Object.entries(value).slice(0, MAX_AUDIT_ITEMS);
    for (const [rawKey, nestedValue] of entries) {
      const key = sanitizePlainText(rawKey, 64);
      if (!key) {
        continue;
      }

      if (SENSITIVE_AUDIT_FIELDS.has(key.toLowerCase())) {
        result[key] = '[redacted]';
        continue;
      }

      result[key] = sanitizeAuditValue(nestedValue, depth + 1);
    }

    return result;
  }

  return sanitizePlainText(String(value), MAX_AUDIT_STRING_LENGTH);
};

const resolveAuditResourceFromPath = (normalizedPath) => {
  const segments = String(normalizedPath || '')
    .split('/')
    .map((segment) => segment.trim())
    .filter(Boolean);

  if (!segments.length) {
    return {
      resourceType: 'unknown',
      resourceId: null,
    };
  }

  return {
    resourceType: sanitizePlainText(segments[0], 80) || 'unknown',
    resourceId: segments[1] ? sanitizePlainText(segments[1], 80) : null,
  };
};

const getClientIp = (req) => {
  return req.ip || req.socket?.remoteAddress || 'unknown';
};

const getUserAgent = (req) => {
  return sanitizePlainText(req.headers['user-agent'], 255);
};

const logAuditEvent = async ({ req, action, resourceType, resourceId, oldValue, newValue }) => {
  if (!req?.user?.id || typeof database.createAuditLog !== 'function') {
    return;
  }

  try {
    await database.createAuditLog({
      id: uuidv4(),
      userId: req.user.id,
      action: sanitizePlainText(action, 180),
      resourceType: sanitizePlainText(resourceType, 80),
      resourceId: sanitizePlainText(resourceId || '', 80) || null,
      oldValue: sanitizeAuditValue(oldValue),
      newValue: sanitizeAuditValue(newValue),
      ipAddress: sanitizePlainText(getClientIp(req), 80),
      userAgent: getUserAgent(req),
      createdAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Audit logging error:', error);
  }
};

const logSecurityEvent = async ({
  eventType,
  severity = 'low',
  userId = null,
  email = '',
  details = {},
  req = null,
  ipAddress = '',
  userAgent = '',
  alerted = false,
}) => {
  if (typeof database.createSecurityEvent !== 'function') {
    return;
  }

  const normalizedSeverity = VALID_SECURITY_SEVERITIES.has(severity) ? severity : 'low';

  try {
    await database.createSecurityEvent({
      id: uuidv4(),
      eventType: sanitizePlainText(eventType, 120),
      severity: normalizedSeverity,
      userId: userId ? sanitizePlainText(userId, 80) : null,
      email: sanitizeEmail(email),
      details: sanitizeAuditValue(details),
      ipAddress: req ? sanitizePlainText(getClientIp(req), 80) : sanitizePlainText(ipAddress, 80),
      userAgent: req ? getUserAgent(req) : sanitizePlainText(userAgent, 255),
      createdAt: new Date().toISOString(),
      alerted: Boolean(alerted),
    });
  } catch (error) {
    console.error('Security event logging error:', error);
  }
};

// Middleware
if (TRUST_PROXY) {
  app.set('trust proxy', true);
}

const defaultAllowedOrigins = ['http://localhost:8080', 'http://localhost:3000', 'http://localhost:5173'];
const configuredOrigins = process.env.CORS_ORIGINS
  ? process.env.CORS_ORIGINS
    .split(',')
    .map((origin) => normalizeOrigin(origin))
    .filter(Boolean)
  : defaultAllowedOrigins
    .map((origin) => normalizeOrigin(origin))
    .filter(Boolean);

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin) {
      callback(null, true);
      return;
    }

    const normalizedOrigin = normalizeOrigin(origin);
    if (normalizedOrigin && configuredOrigins.includes(normalizedOrigin)) {
      callback(null, true);
      return;
    }

    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', CSRF_HEADER_NAME],
  maxAge: 600,
  optionsSuccessStatus: 200,
};

app.use(cors(corsOptions));
app.use(express.json({
  limit: API_JSON_BODY_LIMIT,
  strict: true,
  type: ['application/json', 'application/*+json'],
  verify: (req, _res, buffer) => {
    req.rawBody = buffer.toString('utf8');
  }
}));
app.use(express.urlencoded({
  extended: false,
  limit: API_FORM_BODY_LIMIT,
}));
app.use((req, res, next) => {
  const requestPath = typeof req.path === 'string' ? req.path : '';
  const isProtectedPayload = requestPath === '/api' || requestPath.startsWith('/api/') || requestPath.startsWith('/webhooks/');

  if (!isProtectedPayload) {
    return next();
  }

  if (hasUnsafePayloadStructure(req.body) || hasUnsafePayloadStructure(req.query)) {
    return res.status(400).json({ error: 'Invalid request payload structure' });
  }

  return next();
});
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'no-referrer');
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
  res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  res.setHeader('Permissions-Policy', 'accelerometer=(), camera=(), geolocation=(), gyroscope=(), microphone=(), payment=(), usb=()');
  res.setHeader('X-Permitted-Cross-Domain-Policies', 'none');
  if (IS_PRODUCTION) {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  }
  res.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self'; style-src 'self'; style-src-attr 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' https:; connect-src 'self'; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'");
  next();
});

const { issueCsrfToken, validateCsrfRequest } = createCsrfMiddleware({
  csrfCookieName: CSRF_COOKIE_NAME,
  csrfHeaderName: CSRF_HEADER_NAME,
  csrfCookieOptions: CSRF_COOKIE_OPTIONS,
  authCookieName: AUTH_COOKIE_NAME,
  allowedOrigins: configuredOrigins,
});

app.get('/api/csrf-token', (_req, res) => {
  const csrfToken = issueCsrfToken(res);
  res.setHeader('Cache-Control', 'no-store');
  res.json({ csrfToken });
});

// Serve static files from the public directory
app.use('/postimages', express.static(path.join(__dirname, '../public/postimages'), {
  dotfiles: 'deny',
  index: false,
  maxAge: '1d'
}));

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    try {
      let uploadPath;
      const resourceMappings = [
        { folderName: 'blog', urlSegment: '/blog/' },
        { folderName: 'press', urlSegment: '/press-releases/' },
        { folderName: 'media', urlSegment: '/media-coverage/' },
        { folderName: 'events', urlSegment: '/events/' },
      ];

      let resolved = false;
      const rawEntityId = req.params.entityId;
      if (rawEntityId) {
        const resourceId = sanitizeResourceId(rawEntityId);
        if (!resourceId) {
          cb(new Error('Invalid entity id'));
          return;
        }
        const matchedMapping = resourceMappings.find((m) => req.originalUrl.includes(m.urlSegment));
        if (matchedMapping) {
          uploadPath = resolveUploadPath(matchedMapping.folderName, resourceId, 'images');
          resolved = true;
        }
      }

      if (!resolved) {
        const tempMapping = resourceMappings.find((m) => req.originalUrl.includes(m.urlSegment));
        uploadPath = tempMapping
          ? resolveUploadPath(tempMapping.folderName, 'temp', 'images')
          : resolveUploadPath('uploads');
      }

      fs.promises
        .mkdir(uploadPath, { recursive: true })
        .then(() => cb(null, uploadPath))
        .catch((error) => cb(error));
    } catch (error) {
      cb(error);
    }
  },
  filename: function (req, file, cb) {
    // Generate unique filename
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + ext);
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024,
    files: 1
  },
  fileFilter: function (req, file, cb) {
    const extension = path.extname(file.originalname || '').toLowerCase();
    if (!IMAGE_MIME_TYPES.has(file.mimetype) || !IMAGE_EXTENSIONS.has(extension)) {
      return cb(new Error('Only image files are allowed!'), false);
    }
    cb(null, true);
  }
});

const { ensureDefaultAdminUser, initializeDatabase } = createBootstrapService({
  database,
  hashPassword,
  isHashedPassword,
  uuidv4,
  adminEmail,
  getDefaultAdminPassword,
  legacyDefaultAdminEmail: LEGACY_DEFAULT_ADMIN_EMAIL,
});

const productCatalogService = createProductCatalogService();
const paymentService = createPaymentService({ database, uuidv4 });

const {
  authenticateApiRequest,
  checkLoginRateLimit,
  recordLoginAttempt,
  checkRegistrationRateLimit,
  checkContactRateLimit,
  checkAccountLockout,
  recordAccountLoginAttempt,
} = createAuthMiddleware({
  verifyAuthToken,
  database,
  isSelfOrAdmin,
  loginWindowMs: LOGIN_WINDOW_MS,
  loginMaxAttempts: LOGIN_MAX_ATTEMPTS,
  loginRateLimitMaxEntries: LOGIN_RATE_LIMIT_MAX_ENTRIES,
  registrationWindowMs: REGISTRATION_WINDOW_MS,
  registrationMaxAttempts: REGISTRATION_MAX_ATTEMPTS,
  registrationRateLimitMaxEntries: REGISTRATION_RATE_LIMIT_MAX_ENTRIES,
  contactWindowMs: CONTACT_WINDOW_MS,
  contactMaxAttempts: CONTACT_MAX_ATTEMPTS,
  contactRateLimitMaxEntries: CONTACT_RATE_LIMIT_MAX_ENTRIES,
  accountLockoutWindowMs: LOGIN_LOCKOUT_WINDOW_MS,
  accountLockoutMaxAttempts: LOGIN_LOCKOUT_MAX_ATTEMPTS,
  accountLockoutRateLimitMaxEntries: LOGIN_LOCKOUT_RATE_LIMIT_MAX_ENTRIES,
  logSecurityEvent,
  demoEndpointsEnabled: DEMO_ENDPOINTS_ENABLED,
});

app.use((req, res, next) => {
  const startedAt = Date.now();

  res.on('finish', () => {
    const requestPath = typeof req.originalUrl === 'string' ? req.originalUrl : (req.path || '');
    const isSecurityRelevantPath = requestPath.startsWith('/api/') || requestPath === '/api' || requestPath.startsWith('/webhooks/');

    if (!isSecurityRelevantPath) {
      return;
    }

    if (![401, 403, 423, 429].includes(res.statusCode)) {
      return;
    }

    void logSecurityEvent({
      eventType: 'ACCESS_CONTROL_RESPONSE',
      severity: res.statusCode === 429 || res.statusCode === 423 ? 'high' : 'medium',
      userId: req.user?.id || null,
      email: req.user?.email || '',
      details: {
        method: req.method,
        path: requestPath,
        statusCode: res.statusCode,
        durationMs: Date.now() - startedAt,
      },
      req,
      alerted: res.statusCode === 423,
    });
  });

  return next();
});

app.use('/api', validateCsrfRequest);
app.use('/api', authenticateApiRequest);
app.use('/api', (req, res, next) => {
  if (!AUDIT_STATE_CHANGING_METHODS.has(req.method)) {
    return next();
  }

  if (!req.user || !req.user.isAdmin) {
    return next();
  }

  const startedAt = Date.now();
  const requestPath = req.path;
  const requestBodySnapshot = sanitizeAuditValue(req.body);
  const querySnapshot = sanitizeAuditValue(req.query);

  res.on('finish', () => {
    if (res.statusCode >= 500) {
      return;
    }

    const { resourceType, resourceId } = resolveAuditResourceFromPath(requestPath);
    void logAuditEvent({
      req,
      action: `${req.method} ${requestPath}`,
      resourceType,
      resourceId,
      oldValue: null,
      newValue: {
        statusCode: res.statusCode,
        durationMs: Date.now() - startedAt,
        query: querySnapshot,
        requestBody: requestBodySnapshot,
      },
    });
  });

  return next();
});

registerAuthUserRoutes(app, {
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
  checkAccountLockout,
  recordAccountLoginAttempt,
  checkRegistrationRateLimit,
  logSecurityEvent,
  authCookieName: AUTH_COOKIE_NAME,
  authCookieOptions: AUTH_COOKIE_OPTIONS,
});

registerCommerceRoutes(app, {
  database,
  uuidv4,
  productCatalogService,
  paymentService,
  sanitizePlainText,
  sanitizeEmail,
  isValidEmail,
  checkContactRateLimit,
  orderStatuses: ORDER_STATUSES,
  paymentStatuses: PAYMENT_STATUSES,
  registrationStatuses: REGISTRATION_STATUSES,
});

registerAccountRoutes(app, {
  database,
  uuidv4,
  sanitizePlainText,
  isSelfOrAdmin,
});

registerMaintenanceRoutes(app, {
  database,
  demoEndpointsEnabled: DEMO_ENDPOINTS_ENABLED,
  ensureDefaultAdminUser,
});

registerContentRoutes(app, {
  database,
  uuidv4,
  path,
  fs,
  baseImageDir: BASE_IMAGE_DIR,
  sanitizePlainText,
  sanitizeRichText,
  sanitizeImagesPayload,
  sanitizeUrl,
  sanitizeResourceId,
  blogStatuses: BLOG_STATUSES,
  eventStatuses: EVENT_STATUSES,
});

registerContentUploadRoutes(app, {
  upload,
  database,
  sanitizeResourceId,
});

registerDemoRoutes(app, {
  database,
  hashPassword,
  ensureDefaultAdminUser,
  demoEndpointsEnabled: DEMO_ENDPOINTS_ENABLED,
  adminEmail,
});

app.use((err, req, res, next) => {
  if (!err) {
    return next();
  }

  if (err.type === 'entity.too.large') {
    return res.status(413).json({ error: 'Request payload too large' });
  }

  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'Invalid JSON payload' });
  }

  if (err instanceof SyntaxError && err.status === 400 && Object.prototype.hasOwnProperty.call(err, 'body')) {
    return res.status(400).json({ error: 'Invalid JSON payload' });
  }

  if (err.message === 'Not allowed by CORS') {
    return res.status(403).json({ error: 'Origin is not allowed' });
  }

  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({ error: 'Uploaded image is too large' });
    }

    return res.status(400).json({ error: 'Invalid upload payload' });
  }

  if (err.message && err.message.toLowerCase().includes('image')) {
    return res.status(400).json({ error: err.message });
  }

  console.error('Unhandled server error:', err);
  return res.status(500).json({ error: 'Internal server error' });
});

const startServer = async (port = PORT) => {
  await initializeDatabase();

  return new Promise((resolve, reject) => {
    const server = app.listen(port, () => {
      const address = server.address();
      const activePort = address && typeof address === 'object' ? address.port : port;
      console.log(`Server running on http://localhost:${activePort}`);
      console.log(`SQLite database location: ${database.getDatabasePath()}`);
      resolve(server);
    });

    server.on('error', reject);
  });
};

if (require.main === module) {
  startServer().catch((error) => {
    console.error('Server startup error:', error);
    process.exit(1);
  });
}

module.exports = {
  app,
  startServer,
  initializeDatabase
};
