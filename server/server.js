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

const app = express();
app.disable('x-powered-by');
const PORT = process.env.PORT || 3001;
const DEMO_ENDPOINTS_ENABLED = process.env.ENABLE_DEMO_ENDPOINTS === 'true';
const BASE_IMAGE_DIR = path.resolve(__dirname, '../public/postimages');
const IMAGE_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/gif', 'image/webp']);
const IMAGE_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.gif', '.webp']);
const VALID_RESOURCE_ID = /^[a-zA-Z0-9_-]{1,64}$/;
const PASSWORD_PATTERN = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,128}$/;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const BLOG_STATUSES = new Set(['draft', 'published']);
const EVENT_STATUSES = new Set(['upcoming', 'ongoing', 'completed', 'cancelled']);
const ORDER_STATUSES = new Set(['received', 'preparing', 'shipping', 'delivered']);
const REGISTRATION_STATUSES = new Set(['registered', 'active', 'completed']);
const LOGIN_WINDOW_MS = 15 * 60 * 1000;
const LOGIN_MAX_ATTEMPTS = 10;
const loginAttempts = new Map();
const IS_PRODUCTION = process.env.NODE_ENV === 'production';
const configuredAdminEmail = typeof process.env.DEFAULT_ADMIN_EMAIL === 'string'
  ? process.env.DEFAULT_ADMIN_EMAIL.trim().toLowerCase()
  : '';

let generatedAdminEmail = null;
let generatedAdminPassword = null;

if (!process.env.AUTH_TOKEN_SECRET) {
  if (IS_PRODUCTION) {
    throw new Error('AUTH_TOKEN_SECRET must be set in production.');
  }

  console.warn('AUTH_TOKEN_SECRET is not set. Set a strong secret in production.');
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

const getDefaultAdminEmail = () => {
  if (configuredAdminEmail) {
    return configuredAdminEmail;
  }

  if (!generatedAdminEmail) {
    generatedAdminEmail = `admin-${crypto.randomBytes(6).toString('hex')}@local.invalid`;
    console.warn('DEFAULT_ADMIN_EMAIL is not set. Generated one-time admin email:', generatedAdminEmail);
  }

  return generatedAdminEmail;
};

const getDefaultAdminPassword = () => {
  if (process.env.DEFAULT_ADMIN_PASSWORD) {
    return process.env.DEFAULT_ADMIN_PASSWORD;
  }

  if (!generatedAdminPassword) {
    generatedAdminPassword = crypto.randomBytes(12).toString('base64url');
    console.warn('DEFAULT_ADMIN_PASSWORD is not set. Generated one-time admin password:', generatedAdminPassword);
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
      '*': ['style']
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
    .map((image) => ({
      src: sanitizePlainText(image.src, 500),
      alt: sanitizePlainText(image.alt, 200),
      title: sanitizePlainText(image.title || '', 200),
      description: sanitizePlainText(image.description || '', 500)
    }))
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
    loginAttempts.set(clientIp, { count: 0, resetAt: now + LOGIN_WINDOW_MS });
    return next();
  }

  if (record.count >= LOGIN_MAX_ATTEMPTS) {
    return res.status(429).json({ error: 'Too many login attempts. Please try again later.' });
  }

  return next();
};

const recordLoginAttempt = (req, success) => {
  const clientIp = getClientIp(req);
  const now = Date.now();
  const record = loginAttempts.get(clientIp) || { count: 0, resetAt: now + LOGIN_WINDOW_MS };

  if (now > record.resetAt) {
    record.count = 0;
    record.resetAt = now + LOGIN_WINDOW_MS;
  }

  if (success) {
    loginAttempts.delete(clientIp);
    return;
  }

  record.count += 1;
  loginAttempts.set(clientIp, record);
};

// Middleware
const defaultAllowedOrigins = ['http://localhost:8080', 'http://localhost:3000', 'http://localhost:5173'];
const configuredOrigins = process.env.CORS_ORIGINS
  ? process.env.CORS_ORIGINS.split(',').map((origin) => origin.trim()).filter(Boolean)
  : defaultAllowedOrigins;

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin || configuredOrigins.includes(origin)) {
      callback(null, true);
      return;
    }

    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));
app.use(express.json({ limit: '1mb' }));
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'no-referrer');
  next();
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

      if (req.params.blogPostId || req.body.blogPostId) {
        const blogPostId = sanitizeResourceId(req.params.blogPostId || req.body.blogPostId);
        if (!blogPostId) {
          cb(new Error('Invalid blog post id'));
          return;
        }
        uploadPath = resolveUploadPath('blog', blogPostId, 'images');
      } else if (req.params.pressReleaseId || req.body.pressReleaseId) {
        const pressReleaseId = sanitizeResourceId(req.params.pressReleaseId || req.body.pressReleaseId);
        if (!pressReleaseId) {
          cb(new Error('Invalid press release id'));
          return;
        }
        uploadPath = resolveUploadPath('press', pressReleaseId, 'images');
      } else if (req.params.mediaCoverageId || req.body.mediaCoverageId) {
        const mediaCoverageId = sanitizeResourceId(req.params.mediaCoverageId || req.body.mediaCoverageId);
        if (!mediaCoverageId) {
          cb(new Error('Invalid media coverage id'));
          return;
        }
        uploadPath = resolveUploadPath('media', mediaCoverageId, 'images');
      } else if (req.params.eventId || req.body.eventId) {
        const eventId = sanitizeResourceId(req.params.eventId || req.body.eventId);
        if (!eventId) {
          cb(new Error('Invalid event id'));
          return;
        }
        uploadPath = resolveUploadPath('events', eventId, 'images');
      } else if (req.originalUrl.includes('/blog/')) {
        uploadPath = resolveUploadPath('blog', 'temp', 'images');
      } else if (req.originalUrl.includes('/press-releases/')) {
        uploadPath = resolveUploadPath('press', 'temp', 'images');
      } else if (req.originalUrl.includes('/media-coverage/')) {
        uploadPath = resolveUploadPath('media', 'temp', 'images');
      } else if (req.originalUrl.includes('/events/')) {
        uploadPath = resolveUploadPath('events', 'temp', 'images');
      } else {
        uploadPath = resolveUploadPath('uploads');
      }

      if (!fs.existsSync(uploadPath)) {
        fs.mkdirSync(uploadPath, { recursive: true });
      }

      cb(null, uploadPath);
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

// Veritabanını başlat
const ensureDefaultAdminUser = async () => {
  const existingAdmin = await database.getUserByEmail(adminEmail);
  if (existingAdmin) {
    return;
  }

  const adminPassword = getDefaultAdminPassword();
  await database.createUser({
    id: uuidv4(),
    email: adminEmail,
    name: 'Admin User',
    password: hashPassword(adminPassword),
    isAdmin: 1,
    createdAt: new Date().toISOString()
  });

  console.log(`Default admin user created for ${adminEmail}`);
};

const migrateLegacyPasswords = async () => {
  const users = await database.getAllUsersWithPasswords();

  for (const user of users) {
    if (!isHashedPassword(user.password)) {
      await database.updateUserPassword(user.id, hashPassword(user.password));
    }
  }
};

const initializeDatabase = async () => {
  try {
    await database.connect();
    await database.runSchema();
    await migrateLegacyPasswords();
    await ensureDefaultAdminUser();
    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Database initialization error:', error);
  }
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
    isAdmin: Boolean(currentUser.isAdmin)
  };

  // Admin-only route guards
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

  if ((/^\/orders\/[^/]+\/status$/.test(normalizedPath) || (/^\/orders\/[^/]+$/.test(normalizedPath) && normalizedPath !== '/orders/my')) && req.method !== 'POST' && !req.user.isAdmin) {
    return res.status(403).json({ error: 'Admin access required' });
  }

  if ((/^\/registrations\/[^/]+\/status$/.test(normalizedPath) || (/^\/registrations\/[^/]+$/.test(normalizedPath) && normalizedPath !== '/registrations/my')) && req.method !== 'POST' && !req.user.isAdmin) {
    return res.status(403).json({ error: 'Admin access required' });
  }

  if ((normalizedPath === '/load-demo-data' || normalizedPath === '/clear-all-data') && !DEMO_ENDPOINTS_ENABLED) {
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

app.use('/api', authenticateApiRequest);

// API Routes

// Login endpoint
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
      user: safeUser
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
        error: 'Password must be 8-128 chars and include at least one uppercase letter, one lowercase letter, and one number'
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
      createdAt: new Date().toISOString()
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

// Change password endpoint
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
        error: 'Password must be 8-128 chars and include at least one uppercase letter, one lowercase letter, and one number'
      });
    }
    
    const user = await database.getUserById(id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Verify current password
    if (!verifyPassword(currentPassword, user.password)) {
      return res.status(400).json({ error: 'Current password is incorrect' });
    }
    
    // Update password
    await database.updateUserPassword(id, hashPassword(newPassword));
    
    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error('Error changing password:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Kullanıcılar
app.get('/api/users', async (req, res) => {
  try {
    const users = await database.getAllUsers();
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
        error: 'Password must be 8-128 chars and include at least one uppercase letter, one lowercase letter, and one number'
      });
    }
    
    // Check if user already exists
    const existingUser = await database.getUserByEmail(email);
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }
    
    const newUser = {
      id: uuidv4(),
      email,
      name,
      password: hashPassword(password),
      isAdmin: 0, // Default olarak normal kullanıcı
      createdAt: new Date().toISOString()
    };
    
    await database.createUser(newUser);
    
    // Return user without password
    res.json(toSafeUser(newUser));
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Siparişler
app.get('/api/orders', async (req, res) => {
  try {
    const orders = await database.getAllOrders();
    res.json(orders);
  } catch (error) {
    console.error('Error getting orders:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/orders/my', async (req, res) => {
  try {
    const orders = await database.getOrdersByUserId(req.user.id);
    res.json(orders);
  } catch (error) {
    console.error('Error getting current user orders:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/orders', async (req, res) => {
  try {
    const items = Array.isArray(req.body?.items) ? req.body.items : [];
    const totalAmount = Number(req.body?.totalAmount);
    const shippingAddress = req.body?.shippingAddress;
    const customerName = sanitizePlainText(req.body?.customerName, 120);
    const customerEmail = sanitizeEmail(req.body?.customerEmail);

    if (!items.length || !Number.isFinite(totalAmount) || totalAmount <= 0 || !shippingAddress || typeof shippingAddress !== 'object' || !customerName || !customerEmail || !isValidEmail(customerEmail)) {
      return res.status(400).json({ error: 'Invalid order payload' });
    }

    const normalizedShippingAddress = {
      name: sanitizePlainText(shippingAddress.name, 120),
      phone: sanitizePlainText(shippingAddress.phone, 40),
      email: sanitizeEmail(shippingAddress.email),
      address: sanitizePlainText(shippingAddress.address, 300),
      city: sanitizePlainText(shippingAddress.city, 120),
      province: sanitizePlainText(shippingAddress.province, 120),
      zipCode: sanitizePlainText(shippingAddress.zipCode, 32),
      country: sanitizePlainText(shippingAddress.country, 120)
    };

    if (!normalizedShippingAddress.name || !normalizedShippingAddress.phone || !normalizedShippingAddress.address || !normalizedShippingAddress.city || !normalizedShippingAddress.zipCode || !normalizedShippingAddress.country) {
      return res.status(400).json({ error: 'Invalid shipping address payload' });
    }

    if (normalizedShippingAddress.email && !isValidEmail(normalizedShippingAddress.email)) {
      return res.status(400).json({ error: 'Invalid shipping address email' });
    }

    const normalizedItems = items
      .filter((item) => item && typeof item === 'object')
      .map((item) => ({
        id: sanitizePlainText(String(item.id || ''), 80),
        name: sanitizePlainText(item.name, 200),
        quantity: Number(item.quantity),
        price: Number(item.price),
        image: sanitizePlainText(item.image, 500)
      }))
      .filter((item) => item.id && item.name && Number.isFinite(item.quantity) && item.quantity > 0 && Number.isFinite(item.price) && item.price >= 0);

    if (!normalizedItems.length) {
      return res.status(400).json({ error: 'Order must include valid items' });
    }
    
    const newOrder = {
      id: uuidv4(),
      userId: req.user.id,
      items: normalizedItems,
      totalAmount,
      status: 'received',
      shippingAddress: normalizedShippingAddress,
      customerName,
      customerEmail,
      createdAt: new Date().toISOString()
    };
    
    const order = await database.createOrder(newOrder);
    res.json(order);
  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.put('/api/orders/:id/status', async (req, res) => {
  try {
    const id = sanitizePlainText(req.params.id, 64);
    const status = sanitizePlainText(req.body?.status, 40);

    if (!ORDER_STATUSES.has(status)) {
      return res.status(400).json({ error: 'Invalid order status' });
    }
    
    const order = await database.updateOrderStatus(id, status);
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }
    
    res.json(order);
  } catch (error) {
    console.error('Error updating order status:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Kurs kayıtları
app.get('/api/registrations', async (req, res) => {
  try {
    const registrations = await database.getAllRegistrations();
    res.json(registrations);
  } catch (error) {
    console.error('Error getting registrations:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/registrations/my', async (req, res) => {
  try {
    const registrations = await database.getRegistrationsByUserId(req.user.id);
    res.json(registrations);
  } catch (error) {
    console.error('Error getting current user registrations:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/registrations', async (req, res) => {
  try {
    const { courseName, registrationData, customerName, customerEmail, customerPhone, shippingAddress, shippingCity, shippingState, shippingZipCode, billingAddress, billingCity, billingState, billingZipCode } = req.body;

    const sanitizedCourseName = sanitizePlainText(courseName, 200);
    const sanitizedCustomerName = sanitizePlainText(customerName, 120);
    const sanitizedCustomerEmail = sanitizeEmail(customerEmail);
    const sanitizedCustomerPhone = sanitizePlainText(customerPhone, 40);

    if (!sanitizedCourseName || !sanitizedCustomerName || !sanitizedCustomerEmail || !isValidEmail(sanitizedCustomerEmail) || !sanitizedCustomerPhone) {
      return res.status(400).json({ error: 'Invalid registration payload' });
    }
    
    const newRegistration = {
      id: uuidv4(),
      userId: req.user.id,
      courseName: sanitizedCourseName,
      registrationData,
      status: 'registered',
      customerName: sanitizedCustomerName,
      customerEmail: sanitizedCustomerEmail,
      customerPhone: sanitizedCustomerPhone,
      shippingAddress: sanitizePlainText(shippingAddress, 300),
      shippingCity: sanitizePlainText(shippingCity, 120),
      shippingState: sanitizePlainText(shippingState, 120),
      shippingZipCode: sanitizePlainText(shippingZipCode, 32),
      billingAddress: sanitizePlainText(billingAddress, 300),
      billingCity: sanitizePlainText(billingCity, 120),
      billingState: sanitizePlainText(billingState, 120),
      billingZipCode: sanitizePlainText(billingZipCode, 32),
      createdAt: new Date().toISOString()
    };
    
    const registration = await database.createRegistration(newRegistration);
    res.json(registration);
  } catch (error) {
    console.error('Error creating registration:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.put('/api/registrations/:id/status', async (req, res) => {
  try {
    const id = sanitizePlainText(req.params.id, 64);
    const status = sanitizePlainText(req.body?.status, 40);

    if (!REGISTRATION_STATUSES.has(status)) {
      return res.status(400).json({ error: 'Invalid registration status' });
    }
    
    const registration = await database.updateRegistrationStatus(id, status);
    if (!registration) {
      return res.status(404).json({ error: 'Registration not found' });
    }
    
    res.json(registration);
  } catch (error) {
    console.error('Error updating registration status:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Contact Us Routes
app.get('/api/contacts', async (req, res) => {
  try {
    const contacts = await database.getAllContacts();
    res.json(contacts);
  } catch (error) {
    console.error('Error getting contacts:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/contacts', async (req, res) => {
  try {
    const allowedTypes = new Set(['general', 'support', 'training', 'sales']);
    const type = sanitizePlainText(req.body?.type, 40);
    const name = sanitizePlainText(req.body?.name, 120);
    const email = sanitizeEmail(req.body?.email);
    const subject = sanitizePlainText(req.body?.subject, 200);
    const message = sanitizePlainText(req.body?.message, 5000);

    if (!allowedTypes.has(type) || !name || !email || !isValidEmail(email) || !subject || !message) {
      return res.status(400).json({ error: 'Invalid contact payload' });
    }
    
    const newContact = {
      id: uuidv4(),
      type,
      name,
      email,
      subject,
      message,
      status: 'new',
      createdAt: new Date().toISOString()
    };
    
    const contact = await database.createContact(newContact);
    res.json(contact);
  } catch (error) {
    console.error('Error creating contact:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.put('/api/contacts/:id/status', async (req, res) => {
  try {
    const id = sanitizePlainText(req.params.id, 64);
    const status = sanitizePlainText(req.body?.status, 40);
    const allowedStatuses = new Set(['new', 'reviewing', 'answered', 'closed']);

    if (!allowedStatuses.has(status)) {
      return res.status(400).json({ error: 'Invalid contact status' });
    }
    
    const contact = await database.updateContactStatus(id, status);
    if (!contact) {
      return res.status(404).json({ error: 'Contact not found' });
    }
    
    res.json(contact);
  } catch (error) {
    console.error('Error updating contact status:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Silme endpoint'leri
app.delete('/api/users/:id', async (req, res) => {
  try {
    const id = sanitizePlainText(req.params.id, 64);
    
    const user = await database.getUserById(id);
    
    // Admin kullanıcısını silmeyi engelle
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

app.delete('/api/orders/:id', async (req, res) => {
  try {
    const id = sanitizePlainText(req.params.id, 64);
    
    const result = await database.deleteOrder(id);
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }
    
    res.json({ message: 'Order deleted successfully' });
  } catch (error) {
    console.error('Error deleting order:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.delete('/api/registrations/:id', async (req, res) => {
  try {
    const id = sanitizePlainText(req.params.id, 64);
    
    const result = await database.deleteRegistration(id);
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Registration not found' });
    }
    
    res.json({ message: 'Registration deleted successfully' });
  } catch (error) {
    console.error('Error deleting registration:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.delete('/api/contacts/:id', async (req, res) => {
  try {
    const id = sanitizePlainText(req.params.id, 64);
    
    const result = await database.deleteContact(id);
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Contact not found' });
    }
    
    res.json({ message: 'Contact deleted successfully' });
  } catch (error) {
    console.error('Error deleting contact:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Blog Posts Routes
app.get('/api/blog', async (req, res) => {
  try {
    const blogPosts = await database.getAllBlogPosts();
    const sanitizedBlogPosts = blogPosts.map((post) => ({
      ...post,
      title: sanitizePlainText(post.title, 200),
      excerpt: sanitizePlainText(post.excerpt, 600),
      author: sanitizePlainText(post.author, 120),
      content: sanitizeRichText(post.content),
      images: sanitizeImagesPayload(post.images)
    }));
    res.json(sanitizedBlogPosts);
  } catch (error) {
    console.error('Error getting blog posts:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/blog/:id', async (req, res) => {
  try {
    const id = sanitizePlainText(req.params.id, 64);
    const blogPost = await database.getBlogPostById(id);
    if (!blogPost) {
      return res.status(404).json({ error: 'Blog post not found' });
    }
    res.json({
      ...blogPost,
      title: sanitizePlainText(blogPost.title, 200),
      excerpt: sanitizePlainText(blogPost.excerpt, 600),
      author: sanitizePlainText(blogPost.author, 120),
      content: sanitizeRichText(blogPost.content),
      images: sanitizeImagesPayload(blogPost.images)
    });
  } catch (error) {
    console.error('Error getting blog post:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/blog', async (req, res) => {
  try {
    const title = sanitizePlainText(req.body?.title, 200);
    const excerpt = sanitizePlainText(req.body?.excerpt, 600);
    const author = sanitizePlainText(req.body?.author, 120);
    const content = sanitizeRichText(req.body?.content);
    const publishDate = sanitizePlainText(req.body?.publishDate, 64);
    const status = sanitizePlainText(req.body?.status, 40) || 'draft';
    const images = sanitizeImagesPayload(req.body?.images);

    if (!title || !excerpt || !author || !content || !BLOG_STATUSES.has(status)) {
      return res.status(400).json({ error: 'Invalid blog payload' });
    }
    
    // If publishDate is not provided or is empty, set it to current date/time
    const finalPublishDate = publishDate || new Date().toISOString();
    
    const newBlogPost = {
      id: uuidv4(),
      title,
      content,
      excerpt,
      author,
      publishDate: finalPublishDate,
      status,
      images,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    const blogPost = await database.createBlogPost(newBlogPost);
    
    // Move images from temp folder to the blog post folder
    const tempDir = path.join(__dirname, '../public/postimages/blog/temp/images');
    const targetDir = path.join(__dirname, '../public/postimages/blog', String(blogPost.id), 'images');
    
    if (fs.existsSync(tempDir)) {
      // Create target directory if it doesn't exist
      if (!fs.existsSync(targetDir)) {
        fs.mkdirSync(targetDir, { recursive: true });
      }
      
      // Move all files from temp to target directory
      const files = fs.readdirSync(tempDir);
      for (const file of files) {
        const tempPath = path.join(tempDir, file);
        const targetPath = path.join(targetDir, file);
        fs.renameSync(tempPath, targetPath);
        
        // Update image URLs in the blog post
        if (blogPost.images && Array.isArray(blogPost.images)) {
          blogPost.images = blogPost.images.map(img => {
            if (img.src && img.src.includes('/postimages/blog/temp/images/')) {
              return {
                ...img,
                src: img.src.replace('/postimages/blog/temp/images/', `/postimages/blog/${String(blogPost.id)}/images/`)
              };
            }
            return img;
          });
        }
      }
      
      // Update the blog post with corrected image URLs
      await database.updateBlogPost(blogPost.id, { images: blogPost.images });
    }
    
    res.json(blogPost);
  } catch (error) {
    console.error('Error creating blog post:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.put('/api/blog/:id', async (req, res) => {
  try {
    const id = sanitizePlainText(req.params.id, 64);
    const title = sanitizePlainText(req.body?.title, 200);
    const excerpt = sanitizePlainText(req.body?.excerpt, 600);
    const author = sanitizePlainText(req.body?.author, 120);
    const content = sanitizeRichText(req.body?.content);
    const publishDate = sanitizePlainText(req.body?.publishDate, 64);
    const status = sanitizePlainText(req.body?.status, 40);
    const images = sanitizeImagesPayload(req.body?.images);
    
    const existingPost = await database.getBlogPostById(id);
    if (!existingPost) {
      return res.status(404).json({ error: 'Blog post not found' });
    }
    
    const finalPublishDate = publishDate || existingPost.publishDate;
    const finalStatus = status || existingPost.status;

    if (!title || !excerpt || !author || !content || !BLOG_STATUSES.has(finalStatus)) {
      return res.status(400).json({ error: 'Invalid blog payload' });
    }
    
    const updatedBlogPost = {
      title,
      content,
      excerpt,
      author,
      publishDate: finalPublishDate,
      status: finalStatus,
      images,
      updatedAt: new Date().toISOString()
    };
    
    const blogPost = await database.updateBlogPost(id, updatedBlogPost);
    res.json(blogPost);
  } catch (error) {
    console.error('Error updating blog post:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.put('/api/blog/:id/status', async (req, res) => {
  try {
    const id = sanitizePlainText(req.params.id, 64);
    const status = sanitizePlainText(req.body?.status, 40);

    if (!BLOG_STATUSES.has(status)) {
      return res.status(400).json({ error: 'Invalid blog status' });
    }
    
    const blogPost = await database.updateBlogPostStatus(id, status);
    if (!blogPost) {
      return res.status(404).json({ error: 'Blog post not found' });
    }
    
    res.json(blogPost);
  } catch (error) {
    console.error('Error updating blog post status:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.delete('/api/blog/:id', async (req, res) => {
  try {
    const id = sanitizeResourceId(req.params.id);
    if (!id) {
      return res.status(400).json({ error: 'Invalid blog post id' });
    }
    
    const result = await database.deleteBlogPost(id);
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Blog post not found' });
    }
    
    // Delete the image directory if it exists
    const imageDir = path.join(__dirname, '../public/postimages/blog', id, 'images');
    if (fs.existsSync(imageDir)) {
      fs.rmSync(imageDir, { recursive: true, force: true });
    }
    
    res.json({ message: 'Blog post deleted successfully' });
  } catch (error) {
    console.error('Error deleting blog post:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Press Releases Routes
app.get('/api/press-releases', async (req, res) => {
  try {
    const pressReleases = await database.getAllPressReleases();
    res.json(pressReleases.map((release) => ({
      ...release,
      title: sanitizePlainText(release.title, 200),
      excerpt: sanitizePlainText(release.excerpt, 600),
      author: sanitizePlainText(release.author, 120),
      content: sanitizeRichText(release.content),
      images: sanitizeImagesPayload(release.images)
    })));
  } catch (error) {
    console.error('Error getting press releases:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/press-releases/:id', async (req, res) => {
  try {
    const id = sanitizePlainText(req.params.id, 64);
    const pressRelease = await database.getPressReleaseById(id);
    if (!pressRelease) {
      return res.status(404).json({ error: 'Press release not found' });
    }
    res.json({
      ...pressRelease,
      title: sanitizePlainText(pressRelease.title, 200),
      excerpt: sanitizePlainText(pressRelease.excerpt, 600),
      author: sanitizePlainText(pressRelease.author, 120),
      content: sanitizeRichText(pressRelease.content),
      images: sanitizeImagesPayload(pressRelease.images)
    });
  } catch (error) {
    console.error('Error getting press release:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/press-releases', async (req, res) => {
  try {
    const title = sanitizePlainText(req.body?.title, 200);
    const content = sanitizeRichText(req.body?.content);
    const excerpt = sanitizePlainText(req.body?.excerpt, 600);
    const author = sanitizePlainText(req.body?.author, 120);
    const publishDate = sanitizePlainText(req.body?.publishDate, 64) || new Date().toISOString();
    const status = sanitizePlainText(req.body?.status, 40) || 'draft';
    const images = sanitizeImagesPayload(req.body?.images);

    if (!title || !content || !excerpt || !author || !BLOG_STATUSES.has(status)) {
      return res.status(400).json({ error: 'Invalid press release payload' });
    }

    const newPressRelease = {
      id: Date.now().toString(),
      title,
      content,
      excerpt,
      author,
      publishDate,
      status,
      images,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const pressRelease = await database.createPressRelease(newPressRelease);

    // Move images from temp folder to the press release folder
    const tempDir = path.join(__dirname, '../public/postimages/press/temp/images');
    const targetDir = path.join(__dirname, '../public/postimages/press', String(pressRelease.id), 'images');
    
    if (fs.existsSync(tempDir)) {
      // Create target directory
      fs.mkdirSync(targetDir, { recursive: true });
      
      // Move files
      const files = fs.readdirSync(tempDir);
      for (const file of files) {
        const sourcePath = path.join(tempDir, file);
        const targetPath = path.join(targetDir, file);
        fs.renameSync(sourcePath, targetPath);
      }
      
      // Clean up temp directory
      fs.rmSync(tempDir, { recursive: true, force: true });
      
      // Update image URLs in the press release
      if (pressRelease.images && Array.isArray(pressRelease.images)) {
        pressRelease.images = pressRelease.images.map(img => {
          if (img.src && img.src.includes('/postimages/press/temp/images/')) {
            return {
              ...img,
              src: img.src.replace('/postimages/press/temp/images/', `/postimages/press/${String(pressRelease.id)}/images/`)
            };
          }
          return img;
        });
      }
      
      // Update the press release with corrected image URLs
      await database.updatePressRelease(pressRelease.id, { images: pressRelease.images });
    }

    res.json(pressRelease);
  } catch (error) {
    console.error('Error creating press release:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.put('/api/press-releases/:id', async (req, res) => {
  try {
    const id = sanitizePlainText(req.params.id, 64);
    const title = sanitizePlainText(req.body?.title, 200);
    const content = sanitizeRichText(req.body?.content);
    const excerpt = sanitizePlainText(req.body?.excerpt, 600);
    const author = sanitizePlainText(req.body?.author, 120);
    const publishDate = sanitizePlainText(req.body?.publishDate, 64);
    const status = sanitizePlainText(req.body?.status, 40);
    const images = sanitizeImagesPayload(req.body?.images);

    const existingPost = await database.getPressReleaseById(id);
    if (!existingPost) {
      return res.status(404).json({ error: 'Press release not found' });
    }

    const finalStatus = status || existingPost.status;

    if (!title || !content || !excerpt || !author || !BLOG_STATUSES.has(finalStatus)) {
      return res.status(400).json({ error: 'Invalid press release payload' });
    }

    const updatedPressRelease = {
      title,
      content,
      excerpt,
      author,
      publishDate: publishDate || existingPost.publishDate,
      status: finalStatus,
      images,
      updatedAt: new Date().toISOString()
    };

    const pressRelease = await database.updatePressRelease(id, updatedPressRelease);
    res.json(pressRelease);
  } catch (error) {
    console.error('Error updating press release:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.put('/api/press-releases/:id/status', async (req, res) => {
  try {
    const id = sanitizePlainText(req.params.id, 64);
    const status = sanitizePlainText(req.body?.status, 40);

    if (!BLOG_STATUSES.has(status)) {
      return res.status(400).json({ error: 'Invalid press release status' });
    }

    const pressRelease = await database.updatePressReleaseStatus(id, status);
    if (!pressRelease) {
      return res.status(404).json({ error: 'Press release not found' });
    }

    res.json(pressRelease);
  } catch (error) {
    console.error('Error updating press release status:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.delete('/api/press-releases/:id', async (req, res) => {
  try {
    const id = sanitizeResourceId(req.params.id);
    if (!id) {
      return res.status(400).json({ error: 'Invalid press release id' });
    }

    const result = await database.deletePressRelease(id);
    if (!result) {
      return res.status(404).json({ error: 'Press release not found' });
    }

    // Delete associated images
    const imageDir = path.join(__dirname, '../public/postimages/press', id, 'images');
    if (fs.existsSync(imageDir)) {
      fs.rmSync(imageDir, { recursive: true, force: true });
    }
    
    res.json({ message: 'Press release deleted successfully' });
  } catch (error) {
    console.error('Error deleting press release:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Media Coverage Routes
app.get('/api/media-coverage', async (req, res) => {
  try {
    const mediaCoverages = await database.getAllMediaCoverages();
    res.json(mediaCoverages.map((coverage) => ({
      ...coverage,
      title: sanitizePlainText(coverage.title, 200),
      excerpt: sanitizePlainText(coverage.excerpt, 600),
      author: sanitizePlainText(coverage.author, 120),
      content: sanitizeRichText(coverage.content),
      images: sanitizeImagesPayload(coverage.images)
    })));
  } catch (error) {
    console.error('Error getting media coverages:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/media-coverage/:id', async (req, res) => {
  try {
    const id = sanitizePlainText(req.params.id, 64);
    const mediaCoverage = await database.getMediaCoverageById(id);
    if (!mediaCoverage) {
      return res.status(404).json({ error: 'Media coverage not found' });
    }
    res.json({
      ...mediaCoverage,
      title: sanitizePlainText(mediaCoverage.title, 200),
      excerpt: sanitizePlainText(mediaCoverage.excerpt, 600),
      author: sanitizePlainText(mediaCoverage.author, 120),
      content: sanitizeRichText(mediaCoverage.content),
      images: sanitizeImagesPayload(mediaCoverage.images)
    });
  } catch (error) {
    console.error('Error getting media coverage:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/media-coverage', async (req, res) => {
  try {
    const title = sanitizePlainText(req.body?.title, 200);
    const content = sanitizeRichText(req.body?.content);
    const excerpt = sanitizePlainText(req.body?.excerpt, 600);
    const author = sanitizePlainText(req.body?.author, 120);
    const publishDate = sanitizePlainText(req.body?.publishDate, 64) || new Date().toISOString();
    const status = sanitizePlainText(req.body?.status, 40) || 'draft';
    const images = sanitizeImagesPayload(req.body?.images);

    if (!title || !content || !excerpt || !author || !BLOG_STATUSES.has(status)) {
      return res.status(400).json({ error: 'Invalid media coverage payload' });
    }

    const newMediaCoverage = {
      id: Date.now().toString(),
      title,
      content,
      excerpt,
      author,
      publishDate,
      status,
      images,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const mediaCoverage = await database.createMediaCoverage(newMediaCoverage);

    // Move images from temp folder to the media coverage folder
    const tempDir = path.join(__dirname, '../public/postimages/media/temp/images');
    const targetDir = path.join(__dirname, '../public/postimages/media', String(mediaCoverage.id), 'images');
    
    if (fs.existsSync(tempDir)) {
      // Create target directory
      fs.mkdirSync(targetDir, { recursive: true });
      
      // Move files
      const files = fs.readdirSync(tempDir);
      for (const file of files) {
        const sourcePath = path.join(tempDir, file);
        const targetPath = path.join(targetDir, file);
        fs.renameSync(sourcePath, targetPath);
      }
      
      // Clean up temp directory
      fs.rmSync(tempDir, { recursive: true, force: true });
      
      // Update image URLs in the media coverage
      if (mediaCoverage.images && Array.isArray(mediaCoverage.images)) {
        mediaCoverage.images = mediaCoverage.images.map(img => {
          if (img.src && img.src.includes('/postimages/media/temp/images/')) {
            return {
              ...img,
              src: img.src.replace('/postimages/media/temp/images/', `/postimages/media/${String(mediaCoverage.id)}/images/`)
            };
          }
          return img;
        });
      }
      
      // Update the media coverage with corrected image URLs
      await database.updateMediaCoverage(mediaCoverage.id, { images: mediaCoverage.images });
    }

    res.json(mediaCoverage);
  } catch (error) {
    console.error('Error creating media coverage:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.put('/api/media-coverage/:id', async (req, res) => {
  try {
    const id = sanitizePlainText(req.params.id, 64);
    const title = sanitizePlainText(req.body?.title, 200);
    const content = sanitizeRichText(req.body?.content);
    const excerpt = sanitizePlainText(req.body?.excerpt, 600);
    const author = sanitizePlainText(req.body?.author, 120);
    const publishDate = sanitizePlainText(req.body?.publishDate, 64);
    const status = sanitizePlainText(req.body?.status, 40);
    const images = sanitizeImagesPayload(req.body?.images);

    const existingPost = await database.getMediaCoverageById(id);
    if (!existingPost) {
      return res.status(404).json({ error: 'Media coverage not found' });
    }

    const finalStatus = status || existingPost.status;

    if (!title || !content || !excerpt || !author || !BLOG_STATUSES.has(finalStatus)) {
      return res.status(400).json({ error: 'Invalid media coverage payload' });
    }

    const updatedMediaCoverage = {
      title,
      content,
      excerpt,
      author,
      publishDate: publishDate || existingPost.publishDate,
      status: finalStatus,
      images,
      updatedAt: new Date().toISOString()
    };

    const mediaCoverage = await database.updateMediaCoverage(id, updatedMediaCoverage);
    res.json(mediaCoverage);
  } catch (error) {
    console.error('Error updating media coverage:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.put('/api/media-coverage/:id/status', async (req, res) => {
  try {
    const id = sanitizePlainText(req.params.id, 64);
    const status = sanitizePlainText(req.body?.status, 40);

    if (!BLOG_STATUSES.has(status)) {
      return res.status(400).json({ error: 'Invalid media coverage status' });
    }

    const mediaCoverage = await database.updateMediaCoverageStatus(id, status);
    if (!mediaCoverage) {
      return res.status(404).json({ error: 'Media coverage not found' });
    }

    res.json(mediaCoverage);
  } catch (error) {
    console.error('Error updating media coverage status:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.delete('/api/media-coverage/:id', async (req, res) => {
  try {
    const id = sanitizeResourceId(req.params.id);
    if (!id) {
      return res.status(400).json({ error: 'Invalid media coverage id' });
    }

    const result = await database.deleteMediaCoverage(id);
    if (!result) {
      return res.status(404).json({ error: 'Media coverage not found' });
    }

    // Delete associated images
    const imageDir = path.join(__dirname, '../public/postimages/media', id, 'images');
    if (fs.existsSync(imageDir)) {
      fs.rmSync(imageDir, { recursive: true, force: true });
    }
    
    res.json({ message: 'Media coverage deleted successfully' });
  } catch (error) {
    console.error('Error deleting media coverage:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Events Routes
app.get('/api/events', async (req, res) => {
  try {
    const events = await database.getAllEvents();
    res.json(events.map((event) => ({
      ...event,
      title: sanitizePlainText(event.title, 200),
      excerpt: sanitizePlainText(event.excerpt, 600),
      description: sanitizeRichText(event.description),
      venueName: sanitizePlainText(event.venueName, 200),
      venueAddress: sanitizePlainText(event.venueAddress, 300),
      venueCity: sanitizePlainText(event.venueCity, 120),
      venueState: sanitizePlainText(event.venueState, 120),
      venueZipCode: sanitizePlainText(event.venueZipCode, 32),
      venueCountry: sanitizePlainText(event.venueCountry, 120),
      organizerName: sanitizePlainText(event.organizerName, 120)
    })));
  } catch (error) {
    console.error('Error getting events:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/events/:id', async (req, res) => {
  try {
    const id = sanitizePlainText(req.params.id, 64);
    const event = await database.getEventById(id);
    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }
    res.json({
      ...event,
      title: sanitizePlainText(event.title, 200),
      excerpt: sanitizePlainText(event.excerpt, 600),
      description: sanitizeRichText(event.description),
      venueName: sanitizePlainText(event.venueName, 200),
      venueAddress: sanitizePlainText(event.venueAddress, 300),
      venueCity: sanitizePlainText(event.venueCity, 120),
      venueState: sanitizePlainText(event.venueState, 120),
      venueZipCode: sanitizePlainText(event.venueZipCode, 32),
      venueCountry: sanitizePlainText(event.venueCountry, 120),
      organizerName: sanitizePlainText(event.organizerName, 120)
    });
  } catch (error) {
    console.error('Error getting event:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/events', async (req, res) => {
  try {
    const title = sanitizePlainText(req.body?.title, 200);
    const description = sanitizeRichText(req.body?.description);
    const excerpt = sanitizePlainText(req.body?.excerpt, 600);
    const startDate = sanitizePlainText(req.body?.startDate, 64);
    const endDate = sanitizePlainText(req.body?.endDate, 64);
    const venueName = sanitizePlainText(req.body?.venueName, 200);
    const venueAddress = sanitizePlainText(req.body?.venueAddress, 300);
    const venueCity = sanitizePlainText(req.body?.venueCity, 120);
    const venueState = sanitizePlainText(req.body?.venueState, 120);
    const venueZipCode = sanitizePlainText(req.body?.venueZipCode, 32);
    const venueCountry = sanitizePlainText(req.body?.venueCountry, 120);
    const venueWebsite = sanitizePlainText(req.body?.venueWebsite, 500);
    const googleMapsLink = sanitizePlainText(req.body?.googleMapsLink, 500);
    const organizerName = sanitizePlainText(req.body?.organizerName, 120);
    const organizerWebsite = sanitizePlainText(req.body?.organizerWebsite, 500);
    const eventWebsite = sanitizePlainText(req.body?.eventWebsite, 500);
    const status = sanitizePlainText(req.body?.status, 40);
    const category = sanitizePlainText(req.body?.category, 120);
    const imageUrl = sanitizePlainText(req.body?.imageUrl, 500);

    if (!title || !description || !excerpt || !startDate || !endDate || !venueName || !venueAddress || !venueCity || !venueState || !venueZipCode || !venueCountry || !organizerName || !eventWebsite || !EVENT_STATUSES.has(status)) {
      return res.status(400).json({ error: 'Invalid event payload' });
    }
    
    const newEvent = {
      id: uuidv4(),
      title,
      description,
      excerpt,
      startDate,
      endDate,
      venueName,
      venueAddress,
      venueCity,
      venueState,
      venueZipCode,
      venueCountry,
      venueWebsite,
      googleMapsLink,
      organizerName,
      organizerWebsite,
      eventWebsite,
      status,
      category,
      imageUrl,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    const event = await database.createEvent(newEvent);
    res.json(event);
  } catch (error) {
    console.error('Error creating event:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.put('/api/events/:id', async (req, res) => {
  try {
    const id = sanitizePlainText(req.params.id, 64);
    const title = sanitizePlainText(req.body?.title, 200);
    const description = sanitizeRichText(req.body?.description);
    const excerpt = sanitizePlainText(req.body?.excerpt, 600);
    const startDate = sanitizePlainText(req.body?.startDate, 64);
    const endDate = sanitizePlainText(req.body?.endDate, 64);
    const venueName = sanitizePlainText(req.body?.venueName, 200);
    const venueAddress = sanitizePlainText(req.body?.venueAddress, 300);
    const venueCity = sanitizePlainText(req.body?.venueCity, 120);
    const venueState = sanitizePlainText(req.body?.venueState, 120);
    const venueZipCode = sanitizePlainText(req.body?.venueZipCode, 32);
    const venueCountry = sanitizePlainText(req.body?.venueCountry, 120);
    const venueWebsite = sanitizePlainText(req.body?.venueWebsite, 500);
    const googleMapsLink = sanitizePlainText(req.body?.googleMapsLink, 500);
    const organizerName = sanitizePlainText(req.body?.organizerName, 120);
    const organizerWebsite = sanitizePlainText(req.body?.organizerWebsite, 500);
    const eventWebsite = sanitizePlainText(req.body?.eventWebsite, 500);
    const status = sanitizePlainText(req.body?.status, 40);
    const category = sanitizePlainText(req.body?.category, 120);
    const imageUrl = sanitizePlainText(req.body?.imageUrl, 500);
    
    const existingEvent = await database.getEventById(id);
    if (!existingEvent) {
      return res.status(404).json({ error: 'Event not found' });
    }
    
    if (!title || !description || !excerpt || !startDate || !endDate || !venueName || !venueAddress || !venueCity || !venueState || !venueZipCode || !venueCountry || !organizerName || !eventWebsite || !EVENT_STATUSES.has(status)) {
      return res.status(400).json({ error: 'Invalid event payload' });
    }

    const updatedEvent = {
      title,
      description,
      excerpt,
      startDate,
      endDate,
      venueName,
      venueAddress,
      venueCity,
      venueState,
      venueZipCode,
      venueCountry,
      venueWebsite,
      googleMapsLink,
      organizerName,
      organizerWebsite,
      eventWebsite,
      status,
      category,
      imageUrl,
      updatedAt: new Date().toISOString()
    };
    
    const event = await database.updateEvent(id, updatedEvent);
    res.json(event);
  } catch (error) {
    console.error('Error updating event:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.put('/api/events/:id/status', async (req, res) => {
  try {
    const id = sanitizePlainText(req.params.id, 64);
    const status = sanitizePlainText(req.body?.status, 40);

    if (!EVENT_STATUSES.has(status)) {
      return res.status(400).json({ error: 'Invalid event status' });
    }
    
    const event = await database.updateEventStatus(id, status);
    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }
    
    res.json(event);
  } catch (error) {
    console.error('Error updating event status:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.delete('/api/events/:id', async (req, res) => {
  try {
    const id = sanitizeResourceId(req.params.id);
    if (!id) {
      return res.status(400).json({ error: 'Invalid event id' });
    }
    
    const result = await database.deleteEvent(id);
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Event not found' });
    }
    
    res.json({ message: 'Event deleted successfully' });
  } catch (error) {
    console.error('Error deleting event:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Blog image upload endpoint
app.post('/api/blog/:blogPostId/images', upload.single('image'), async (req, res) => {
  try {
    const blogPostId = sanitizeResourceId(req.params.blogPostId);
    if (!blogPostId) {
      return res.status(400).json({ error: 'Invalid blog post id' });
    }
    
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    
    // Check if blog post exists
    const blogPost = await database.getBlogPostById(blogPostId);
    if (!blogPost) {
      return res.status(404).json({ error: 'Blog post not found' });
    }
    
    // Create the image URL
    const imageUrl = `/postimages/blog/${blogPostId}/images/${req.file.filename}`;
    
    res.json({
      message: 'Image uploaded successfully',
      imageUrl: imageUrl,
      filename: req.file.filename
    });
  } catch (error) {
    console.error('Error uploading image:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Temporary image upload endpoint (for new blog posts)
app.post('/api/blog/temp/images', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    
    // Create the image URL
    const imageUrl = `/postimages/blog/temp/images/${req.file.filename}`;
    
    res.json({
      message: 'Image uploaded successfully',
      imageUrl: imageUrl,
      filename: req.file.filename
    });
  } catch (error) {
    console.error('Error uploading image:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Press Release image upload endpoint
app.post('/api/press-releases/:pressReleaseId/images', upload.single('image'), async (req, res) => {
  try {
    const pressReleaseId = sanitizeResourceId(req.params.pressReleaseId);
    if (!pressReleaseId) {
      return res.status(400).json({ error: 'Invalid press release id' });
    }
    
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    
    // Check if press release exists
    const pressRelease = await database.getPressReleaseById(pressReleaseId);
    if (!pressRelease) {
      return res.status(404).json({ error: 'Press release not found' });
    }
    
    // Create the image URL
    const imageUrl = `/postimages/press/${pressReleaseId}/images/${req.file.filename}`;
    
    res.json({
      message: 'Image uploaded successfully',
      imageUrl: imageUrl,
      filename: req.file.filename
    });
  } catch (error) {
    console.error('Error uploading image:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Temporary press release image upload endpoint
app.post('/api/press-releases/temp/images', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    
    // Create the image URL
    const imageUrl = `/postimages/press/temp/images/${req.file.filename}`;
    
    res.json({
      message: 'Image uploaded successfully',
      imageUrl: imageUrl,
      filename: req.file.filename
    });
  } catch (error) {
    console.error('Error uploading image:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Media Coverage image upload endpoint
app.post('/api/media-coverage/:mediaCoverageId/images', upload.single('image'), async (req, res) => {
  try {
    const mediaCoverageId = sanitizeResourceId(req.params.mediaCoverageId);
    if (!mediaCoverageId) {
      return res.status(400).json({ error: 'Invalid media coverage id' });
    }
    
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    
    // Check if media coverage exists
    const mediaCoverage = await database.getMediaCoverageById(mediaCoverageId);
    if (!mediaCoverage) {
      return res.status(404).json({ error: 'Media coverage not found' });
    }
    
    // Create the image URL
    const imageUrl = `/postimages/media/${mediaCoverageId}/images/${req.file.filename}`;
    
    res.json({
      message: 'Image uploaded successfully',
      imageUrl: imageUrl,
      filename: req.file.filename
    });
  } catch (error) {
    console.error('Error uploading image:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Temporary media coverage image upload endpoint
app.post('/api/media-coverage/temp/images', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    
    // Create the image URL
    const imageUrl = `/postimages/media/temp/images/${req.file.filename}`;
    
    res.json({
      message: 'Image uploaded successfully',
      imageUrl: imageUrl,
      filename: req.file.filename
    });
  } catch (error) {
    console.error('Error uploading image:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Event image upload endpoint
app.post('/api/events/:eventId/images', upload.single('image'), async (req, res) => {
  try {
    const eventId = sanitizeResourceId(req.params.eventId);
    if (!eventId) {
      return res.status(400).json({ error: 'Invalid event id' });
    }
    
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    
    // Check if event exists
    const event = await database.getEventById(eventId);
    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }
    
    // Create the image URL
    const imageUrl = `/postimages/events/${eventId}/images/${req.file.filename}`;
    
    res.json({
      message: 'Image uploaded successfully',
      imageUrl: imageUrl,
      filename: req.file.filename
    });
  } catch (error) {
    console.error('Error uploading image:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Temporary event image upload endpoint
app.post('/api/events/temp/images', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    
    // Create the image URL
    const imageUrl = `/postimages/events/temp/images/${req.file.filename}`;
    
    res.json({
      message: 'Image uploaded successfully',
      imageUrl: imageUrl,
      filename: req.file.filename
    });
  } catch (error) {
    console.error('Error uploading image:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Demo veri yükleme
app.post('/api/load-demo-data', async (req, res) => {
  try {
    if (!DEMO_ENDPOINTS_ENABLED) {
      return res.status(404).json({ error: 'Endpoint not available' });
    }

    const demoPassword = () => crypto.randomBytes(12).toString('base64url');

    const demoUsers = [
      {
        id: '1',
        email: adminEmail,
        name: 'Admin User',
        password: demoPassword(),
        isAdmin: 1,
        createdAt: '2024-01-15T10:30:00.000Z'
      },
      {
        id: '2',
        email: 'test@example.com',
        name: 'Test User',
        password: demoPassword(),
        createdAt: '2024-02-20T14:15:00.000Z'
      },
      {
        id: '3',
        email: 'ahmet.yilmaz@gmail.com',
        name: 'Ahmet Yılmaz',
        password: demoPassword(),
        createdAt: '2024-03-10T09:45:00.000Z'
      },
      {
        id: '4',
        email: 'fatma.kaya@hotmail.com',
        name: 'Fatma Kaya',
        password: demoPassword(),
        createdAt: '2024-04-05T16:20:00.000Z'
      },
      {
        id: '5',
        email: 'mehmet.demir@yahoo.com',
        name: 'Mehmet Demir',
        password: demoPassword(),
        createdAt: '2024-05-12T11:10:00.000Z'
      },
      {
        id: '6',
        email: 'ayse.ozkan@gmail.com',
        name: 'Ayşe Özkan',
        password: demoPassword(),
        createdAt: '2024-06-18T08:25:00.000Z'
      },
      {
        id: '7',
        email: 'ali.celik@outlook.com',
        name: 'Ali Çelik',
        password: demoPassword(),
        createdAt: '2024-07-22T15:40:00.000Z'
      },
      {
        id: '8',
        email: 'zeynep.arslan@gmail.com',
        name: 'Zeynep Arslan',
        password: demoPassword(),
        createdAt: '2024-08-14T12:55:00.000Z'
      },
      {
        id: '9',
        email: 'john.smith@gmail.com',
        name: 'John Smith',
        password: demoPassword(),
        createdAt: '2024-09-03T10:15:00.000Z'
      },
      {
        id: '10',
        email: 'maria.garcia@yahoo.com',
        name: 'Maria Garcia',
        password: demoPassword(),
        createdAt: '2024-10-07T14:30:00.000Z'
      }
    ];
    
    const demoOrders = [
      {
        id: '1001',
        userId: '2',
        items: [
          { id: 'kibo-10', name: 'KIBO 10 Kit', quantity: 1, price: 229.95, image: '/assets/shop/kibokits/KIBO-10-package.png' },
          { id: 'marker-set', name: 'Marker Extension Set', quantity: 2, price: 19.95, image: '/assets/shop/funextensionsets/Marker-Extension-Set.png' }
        ],
        totalAmount: 269.85,
        status: 'received',
        customerName: 'Test User',
        customerEmail: 'test@example.com',
        shippingAddress: {
          name: 'Test User',
          phone: '+1-555-0123',
          email: 'test@example.com',
          address: '123 Main Street, Apt 4B',
          city: 'New York',
          province: 'NY',
          zipCode: '10001',
          country: 'United States'
        },
        createdAt: '2025-01-20T14:30:00.000Z'
      },
      {
        id: '1002',
        userId: '3',
        items: [
          { id: 'kibo-15', name: 'KIBO 15 Kit', quantity: 1, price: 329.95, image: '/assets/shop/kibokits/KIBO-15-package.png' }
        ],
        totalAmount: 329.95,
        status: 'preparing',
        customerName: 'Ahmet Yılmaz',
        customerEmail: 'ahmet.yilmaz@gmail.com',
        shippingAddress: {
          name: 'Ahmet Yılmaz',
          phone: '+90-532-123-4567',
          email: 'ahmet.yilmaz@gmail.com',
          address: 'Atatürk Caddesi No:45 Daire:8',
          city: 'İstanbul',
          province: 'İstanbul',
          zipCode: '34000',
          country: 'Turkey'
        },
        createdAt: '2025-01-22T09:15:00.000Z'
      },
      {
        id: '1003',
        userId: '4',
        items: [
          { id: 'kibo-21', name: 'KIBO 21 Kit', quantity: 1, price: 429.95, image: '/assets/shop/kibokits/KIBO-21-package.png' },
          { id: 'building-brick', name: 'Building Brick Extension Set', quantity: 1, price: 39.95, image: '/assets/shop/funextensionsets/KIBO-buildingbrickb.png' }
        ],
        totalAmount: 469.90,
        status: 'shipping',
        customerName: 'Fatma Kaya',
        customerEmail: 'fatma.kaya@hotmail.com',
        shippingAddress: {
          name: 'Fatma Kaya',
          phone: '+90-505-987-6543',
          email: 'fatma.kaya@hotmail.com',
          address: 'Cumhuriyet Mahallesi 15. Sokak No:23',
          city: 'Ankara',
          province: 'Ankara',
          zipCode: '06000',
          country: 'Turkey'
        },
        createdAt: '2025-01-18T16:45:00.000Z'
      },
      {
        id: '1004',
        userId: '5',
        items: [
          { id: 'kibo-18', name: 'KIBO 18 Kit', quantity: 2, price: 379.95, image: '/assets/shop/kibokits/KIBO-18-package.png' }
        ],
        totalAmount: 759.90,
        status: 'delivered',
        customerName: 'Mehmet Demir',
        customerEmail: 'mehmet.demir@yahoo.com',
        shippingAddress: {
          name: 'Mehmet Demir',
          phone: '+90-542-111-2233',
          email: 'mehmet.demir@yahoo.com',
          address: 'Yeni Mahalle Okul Sokak No:67',
          city: 'İzmir',
          province: 'İzmir',
          zipCode: '35000',
          country: 'Turkey'
        },
        createdAt: '2025-01-15T12:20:00.000Z'
      },
      {
        id: '1005',
        userId: '6',
        items: [
          { id: 'expression-module', name: 'Expression Module', quantity: 1, price: 49.95, image: '/assets/shop/funextensionsets/KIBO-expressionmodule.png' },
          { id: 'sound-record', name: 'Sound & Record Module', quantity: 1, price: 59.95, image: '/assets/shop/funextensionsets/KIBO-sound.png' }
        ],
        totalAmount: 109.90,
        status: 'preparing',
        customerName: 'Ayşe Özkan',
        customerEmail: 'ayse.ozkan@gmail.com',
        shippingAddress: {
          name: 'Ayşe Özkan',
          phone: '+90-533-444-5566',
          email: 'ayse.ozkan@gmail.com',
          address: 'Bahçelievler Mahallesi 12. Cadde No:89',
          city: 'Bursa',
          province: 'Bursa',
          zipCode: '16000',
          country: 'Turkey'
        },
        createdAt: '2025-01-25T10:30:00.000Z'
      },
      {
        id: '1006',
        userId: '7',
        items: [
          { id: 'kibo-12', name: 'KIBO 12 Kit', quantity: 1, price: 279.95, image: '/assets/shop/kibokits/KIBO-12-package.png' },
          { id: 'art-module', name: 'Art Module', quantity: 1, price: 29.95, image: '/assets/shop/funextensionsets/KIBO-artmodule.png' }
        ],
        totalAmount: 309.90,
        status: 'received',
        customerName: 'Ali Çelik',
        customerEmail: 'ali.celik@outlook.com',
        shippingAddress: {
          name: 'Ali Çelik',
          phone: '+90-544-777-8899',
          email: 'ali.celik@outlook.com',
          address: 'Merkez Mahallesi Atatürk Bulvarı No:156',
          city: 'Antalya',
          province: 'Antalya',
          zipCode: '07000',
          country: 'Turkey'
        },
        createdAt: '2025-01-28T08:45:00.000Z'
      },
      {
        id: '1007',
        userId: '8',
        items: [
          { id: 'kibo-21', name: 'KIBO 21 Kit', quantity: 1, price: 429.95, image: '/assets/shop/kibokits/KIBO-21-package.png' }
        ],
        totalAmount: 429.95,
        status: 'shipping',
        customerName: 'Zeynep Arslan',
        customerEmail: 'zeynep.arslan@gmail.com',
        shippingAddress: {
          name: 'Zeynep Arslan',
          phone: '+90-555-123-9876',
          email: 'zeynep.arslan@gmail.com',
          address: 'Çankaya Mahallesi Tunalı Hilmi Caddesi No:78',
          city: 'Ankara',
          province: 'Ankara',
          zipCode: '06700',
          country: 'Turkey'
        },
        createdAt: '2025-01-26T13:20:00.000Z'
      },
      {
        id: '1008',
        userId: '9',
        items: [
          { id: 'kibo-15', name: 'KIBO 15 Kit', quantity: 1, price: 329.95, image: '/assets/shop/kibokits/KIBO-15-package.png' },
          { id: 'light-module', name: 'Light Module', quantity: 2, price: 24.95, image: '/assets/shop/funextensionsets/KIBO-lightmodule.png' }
        ],
        totalAmount: 379.85,
        status: 'delivered',
        customerName: 'John Smith',
        customerEmail: 'john.smith@gmail.com',
        shippingAddress: {
          name: 'John Smith',
          phone: '+1-555-987-6543',
          email: 'john.smith@gmail.com',
          address: '456 Oak Avenue, Suite 12',
          city: 'Los Angeles',
          province: 'CA',
          zipCode: '90210',
          country: 'United States'
        },
        createdAt: '2025-01-12T11:15:00.000Z'
      },
      {
        id: '1009',
        userId: '10',
        items: [
          { id: 'kibo-18', name: 'KIBO 18 Kit', quantity: 1, price: 379.95, image: '/assets/shop/kibokits/KIBO-18-package.png' },
          { id: 'sensor-module', name: 'Sensor Module', quantity: 1, price: 34.95, image: '/assets/shop/funextensionsets/KIBO-sensormodule.png' }
        ],
        totalAmount: 414.90,
        status: 'preparing',
        customerName: 'Maria Garcia',
        customerEmail: 'maria.garcia@yahoo.com',
        shippingAddress: {
          name: 'Maria Garcia',
          phone: '+1-555-246-8135',
          email: 'maria.garcia@yahoo.com',
          address: '789 Pine Street, Apt 5C',
          city: 'Miami',
          province: 'FL',
          zipCode: '33101',
          country: 'United States'
        },
        createdAt: '2025-01-29T16:40:00.000Z'
      }
    ];
    
    const demoRegistrations = [
      {
        id: '2001',
        userId: '3',
        courseName: 'KIBO Home Robotics Course',
        registrationData: {
          shippingInfo: {
            firstName: 'Ahmet',
            lastName: 'Yılmaz',
            address: 'Atatürk Caddesi No:45 Daire:8',
            city: 'İstanbul',
            state: 'İstanbul',
            zipCode: '34000',
            phone: '+90-532-123-4567',
            email: 'ahmet.yilmaz@gmail.com'
          },
          billingInfo: {
            firstName: 'Ahmet',
            lastName: 'Yılmaz',
            address: 'Atatürk Caddesi No:45 Daire:8',
            city: 'İstanbul',
            state: 'İstanbul',
            zipCode: '34000',
            phone: '+90-532-123-4567',
            email: 'ahmet.yilmaz@gmail.com'
          }
        },
        status: 'registered',
        customerName: 'Ahmet Yılmaz',
        customerEmail: 'ahmet.yilmaz@gmail.com',
        customerPhone: '+90-532-123-4567',
        shippingAddress: 'Atatürk Caddesi No:45 Daire:8',
        shippingCity: 'İstanbul',
        shippingState: 'İstanbul',
        shippingZipCode: '34000',
        billingAddress: 'Atatürk Caddesi No:45 Daire:8',
        billingCity: 'İstanbul',
        billingState: 'İstanbul',
        billingZipCode: '34000',
        createdAt: '2025-01-21T13:45:00.000Z'
      },
      {
        id: '2002',
        userId: '4',
        courseName: 'KIBO Home Robotics Course',
        registrationData: {
          shippingInfo: {
            firstName: 'Fatma',
            lastName: 'Kaya',
            address: 'Cumhuriyet Mahallesi 15. Sokak No:23',
            city: 'Ankara',
            state: 'Ankara',
            zipCode: '06000',
            phone: '+90-505-987-6543',
            email: 'fatma.kaya@hotmail.com'
          },
          billingInfo: {
            firstName: 'Fatma',
            lastName: 'Kaya',
            address: 'Cumhuriyet Mahallesi 15. Sokak No:23',
            city: 'Ankara',
            state: 'Ankara',
            zipCode: '06000',
            phone: '+90-505-987-6543',
            email: 'fatma.kaya@hotmail.com'
          }
        },
        status: 'active',
        customerName: 'Fatma Kaya',
        customerEmail: 'fatma.kaya@hotmail.com',
        customerPhone: '+90-505-987-6543',
        shippingAddress: 'Cumhuriyet Mahallesi 15. Sokak No:23',
        shippingCity: 'Ankara',
        shippingState: 'Ankara',
        shippingZipCode: '06000',
        billingAddress: 'Cumhuriyet Mahallesi 15. Sokak No:23',
        billingCity: 'Ankara',
        billingState: 'Ankara',
        billingZipCode: '06000',
        createdAt: '2025-01-19T11:20:00.000Z'
      },
      {
        id: '2003',
        userId: '5',
        courseName: 'KIBO Home Robotics Course',
        registrationData: {
          shippingInfo: {
            firstName: 'Mehmet',
            lastName: 'Demir',
            address: 'Yeni Mahalle Okul Sokak No:67',
            city: 'İzmir',
            state: 'İzmir',
            zipCode: '35000',
            phone: '+90-542-111-2233',
            email: 'mehmet.demir@yahoo.com'
          },
          billingInfo: {
            firstName: 'Mehmet',
            lastName: 'Demir',
            address: 'Yeni Mahalle Okul Sokak No:67',
            city: 'İzmir',
            state: 'İzmir',
            zipCode: '35000',
            phone: '+90-542-111-2233',
            email: 'mehmet.demir@yahoo.com'
          }
        },
        status: 'completed',
        customerName: 'Mehmet Demir',
        customerEmail: 'mehmet.demir@yahoo.com',
        customerPhone: '+90-542-111-2233',
        shippingAddress: 'Yeni Mahalle Okul Sokak No:67',
        shippingCity: 'İzmir',
        shippingState: 'İzmir',
        shippingZipCode: '35000',
        billingAddress: 'Yeni Mahalle Okul Sokak No:67',
        billingCity: 'İzmir',
        billingState: 'İzmir',
        billingZipCode: '35000',
        createdAt: '2025-01-16T15:10:00.000Z'
      },
      {
        id: '2004',
        userId: '6',
        courseName: 'KIBO Home Robotics Course',
        registrationData: {
          shippingInfo: {
            firstName: 'Ayşe',
            lastName: 'Özkan',
            address: 'Bahçelievler Mahallesi 12. Cadde No:89',
            city: 'Bursa',
            state: 'Bursa',
            zipCode: '16000',
            phone: '+90-533-444-5566',
            email: 'ayse.ozkan@gmail.com'
          },
          billingInfo: {
            firstName: 'Ayşe',
            lastName: 'Özkan',
            address: 'Bahçelievler Mahallesi 12. Cadde No:89',
            city: 'Bursa',
            state: 'Bursa',
            zipCode: '16000',
            phone: '+90-533-444-5566',
            email: 'ayse.ozkan@gmail.com'
          }
        },
        status: 'active',
        customerName: 'Ayşe Özkan',
        customerEmail: 'ayse.ozkan@gmail.com',
        customerPhone: '+90-533-444-5566',
        shippingAddress: 'Bahçelievler Mahallesi 12. Cadde No:89',
        shippingCity: 'Bursa',
        shippingState: 'Bursa',
        shippingZipCode: '16000',
        billingAddress: 'Bahçelievler Mahallesi 12. Cadde No:89',
        billingCity: 'Bursa',
        billingState: 'Bursa',
        billingZipCode: '16000',
        createdAt: '2025-01-23T08:30:00.000Z'
      },
      {
        id: '2005',
        userId: '9',
        courseName: 'KIBO Home Robotics Course',
        registrationData: {
          shippingInfo: {
            firstName: 'John',
            lastName: 'Smith',
            address: '456 Oak Avenue, Suite 12',
            city: 'Los Angeles',
            state: 'CA',
            zipCode: '90210',
            phone: '+1-555-987-6543',
            email: 'john.smith@gmail.com'
          },
          billingInfo: {
            firstName: 'John',
            lastName: 'Smith',
            address: '456 Oak Avenue, Suite 12',
            city: 'Los Angeles',
            state: 'CA',
            zipCode: '90210',
            phone: '+1-555-987-6543',
            email: 'john.smith@gmail.com'
          }
        },
        status: 'registered',
        customerName: 'John Smith',
        customerEmail: 'john.smith@gmail.com',
        customerPhone: '+1-555-987-6543',
        shippingAddress: '456 Oak Avenue, Suite 12',
        shippingCity: 'Los Angeles',
        shippingState: 'CA',
        shippingZipCode: '90210',
        billingAddress: '456 Oak Avenue, Suite 12',
        billingCity: 'Los Angeles',
        billingState: 'CA',
        billingZipCode: '90210',
        createdAt: '2025-01-27T14:25:00.000Z'
      }
    ];
    
    // Demo Contact Us verileri
    const demoContacts = [
      {
        id: '3001',
        type: 'general',
        name: 'Mehmet Demir',
        email: 'mehmet.demir@gmail.com',
        subject: 'KIBO Robotik Kiti Hakkında',
        message: 'Merhaba, KIBO 18 kiti hakkında daha fazla bilgi almak istiyorum. Fiyat ve teslimat süresi nedir?',
        status: 'new',
        createdAt: '2024-03-15T11:20:00.000Z'
      },
      {
        id: '3002',
        type: 'support',
        name: 'Ayşe Kaya',
        email: 'ayse.kaya@hotmail.com',
        subject: 'Teknik Destek Talebi',
        message: 'KIBO robotumun sensörleri düzgün çalışmıyor. Nasıl tamir edebilirim?',
        status: 'answered',
        createdAt: '2024-03-18T14:30:00.000Z'
      },
      {
        id: '3003',
        type: 'training',
        name: 'Mustafa Yıldız',
        email: 'mustafa.yildiz@gmail.com',
        subject: 'Eğitim Programları',
        message: 'Öğretmenler için KIBO eğitim programlarınız var mı? Okulumuzda kullanmak istiyoruz.',
        status: 'reviewing',
        createdAt: '2024-03-20T09:45:00.000Z'
      },
      {
        id: '3004',
        type: 'sales',
        name: 'Elif Şahin',
        email: 'elif.sahin@gmail.com',
        subject: 'Toplu Satış Talebi',
        message: 'Okulumuz için 20 adet KIBO 15 kit almak istiyoruz. Toplu alımda indirim var mı?',
        status: 'reviewing',
        createdAt: '2024-11-12T10:15:00.000Z'
      },
      {
        id: '3005',
        type: 'general',
        name: 'Can Özdemir',
        email: 'can.ozdemir@hotmail.com',
        subject: 'Ürün Karşılaştırması',
        message: 'KIBO 15 ile KIBO 18 arasındaki farklar nelerdir? Hangi yaş grubu için daha uygun?',
        status: 'answered',
        createdAt: '2024-12-05T16:30:00.000Z'
      },
      {
        id: '3006',
        type: 'support',
        name: 'Selin Yılmaz',
        email: 'selin.yilmaz@yahoo.com',
        subject: 'Kurulum Sorunu',
        message: 'KIBO yazılımını bilgisayarıma kuramıyorum. Yardım edebilir misiniz?',
        status: 'new',
        createdAt: '2025-01-08T13:45:00.000Z'
      },
      {
        id: '3007',
        type: 'training',
        name: 'Emre Kılıç',
        email: 'emre.kilic@gmail.com',
        subject: 'Öğretmen Eğitimi',
        message: 'KIBO kullanımı konusunda öğretmenlerimize eğitim verebilir misiniz? Ankara\'da bulunuyoruz.',
        status: 'reviewing',
        createdAt: '2025-01-15T09:20:00.000Z'
      },
      {
        id: '3008',
        type: 'general',
        name: 'Deniz Acar',
        email: 'deniz.acar@outlook.com',
        subject: 'Garanti Süresi',
        message: 'KIBO robotlarının garanti süresi ne kadar? Garanti kapsamında neler var?',
        status: 'answered',
        createdAt: '2025-01-20T11:10:00.000Z'
      },
      {
        id: '3009',
        type: 'sales',
        name: 'Burak Tekin',
        email: 'burak.tekin@gmail.com',
        subject: 'Bayi Başvurusu',
        message: 'KIBO ürünlerinin bayisi olmak istiyorum. Başvuru süreci nasıl işliyor?',
        status: 'reviewing',
        createdAt: '2025-01-25T14:55:00.000Z'
      },
      {
        id: '3010',
        type: 'support',
        name: 'Gizem Polat',
        email: 'gizem.polat@hotmail.com',
        subject: 'Yedek Parça Talebi',
        message: 'KIBO robotumun motor parçası bozuldu. Yedek parça temin edebilir miyim?',
        status: 'closed',
        createdAt: '2025-01-28T08:40:00.000Z'
      },
      {
        id: '3011',
        type: 'general',
        name: 'Oğuz Çetin',
        email: 'oguz.cetin@yahoo.com',
        subject: 'Kargo Süresi',
        message: 'Sipariş verdiğim KIBO kit ne zaman elime ulaşır? Kargo takip numarası var mı?',
        status: 'new',
        createdAt: '2025-01-30T12:25:00.000Z'
      },
      {
        id: '3012',
        type: 'training',
        name: 'Pınar Doğan',
        email: 'pinar.dogan@gmail.com',
        subject: 'Online Eğitim',
        message: 'KIBO kullanımı için online eğitim videoları var mı? Türkçe kaynak arıyorum.',
        status: 'answered',
        createdAt: '2025-01-31T15:50:00.000Z'
      }
    ];
    
    // Demo Blog Posts verileri
    const demoBlogPosts = [
      {
        id: '4001',
        title: 'KIBO ile Robotik Eğitimde Yeni Bir Dönem',
        content: 'KIBO robotik setleri, çocukların kodlama ve robotik öğrenirken aynı zamanda yaratıcılıklarını geliştirmelerini sağlar. Bu blog yazısında, KIBO\'nun eğitimdeki önemini ve nasıl kullanıldığını detaylı olarak inceliyoruz.\n\nKIBO, çocukların ekran olmadan kodlama öğrenmelerini sağlayan benzersiz bir robotik eğitim setidir. Çocuklar, ahşap blokları kullanarak robotun hareketlerini programlar ve bu sayede algoritmik düşünme becerilerini geliştirirler.\n\nEğitimciler için KIBO, STEM eğitiminde önemli bir araçtır. Öğrenciler problem çözme, işbirliği ve yaratıcılık becerilerini geliştirirken aynı zamanda eğlenirler.',
        excerpt: 'KIBO robotik setleri ile çocukların kodlama ve robotik öğrenirken yaratıcılıklarını nasıl geliştirebileceklerini keşfedin.',
        author: 'Dr. Ayşe Yılmaz',
        publishDate: '2025-01-15T10:00:00.000Z',
        status: 'published',
        createdAt: '2025-01-10T09:00:00.000Z',
        updatedAt: '2025-01-15T10:00:00.000Z'
      },
      {
        id: '4002',
        title: 'STEM Eğitiminde KIBO\'nun Rolü',
        content: 'STEM (Science, Technology, Engineering, Mathematics) eğitimi, 21. yüzyıl becerilerinin temelini oluşturur. KIBO, bu alanlarda çocukların ilgisini çekmek için tasarlanmış mükemmel bir araçtır.\n\nBu yazıda, KIBO\'nun STEM eğitimindeki rolünü ve öğrencilerin bu alanlardaki gelişimine nasıl katkı sağladığını ele alacağız.\n\nKIBO ile öğrenciler:\n- Matematiksel düşünme becerilerini geliştirir\n- Mühendislik tasarım sürecini öğrenir\n- Bilimsel merakı artırır\n- Teknolojiyi anlamlı bir şekilde kullanır\n\nÖğretmenler için KIBO, STEM derslerini daha etkileşimli ve eğlenceli hale getirir.',
        excerpt: 'KIBO\'nun STEM eğitimindeki önemini ve öğrencilerin bu alanlardaki gelişimine nasıl katkı sağladığını öğrenin.',
        author: 'Prof. Mehmet Demir',
        publishDate: '2025-01-20T14:30:00.000Z',
        status: 'published',
        createdAt: '2025-01-18T11:00:00.000Z',
        updatedAt: '2025-01-20T14:30:00.000Z'
      },
      {
        id: '4003',
        title: 'Erken Çocuklukta Kodlama Eğitimi',
        content: 'Erken çocukluk dönemi, çocukların öğrenme ve gelişiminde kritik bir öneme sahiptir. Bu dönemde kazanılan beceriler, çocuğun gelecekteki akademik ve sosyal başarısını etkiler.\n\nKodlama eğitimi, erken çocukluk döneminde şu becerileri geliştirir:\n\n1. Problem Çözme: Çocuklar, problemleri parçalara ayırmayı ve çözüm yolları bulmayı öğrenirler.\n2. Mantıksal Düşünme: Kodlama, mantıksal sıralama ve neden-sonuç ilişkisi kurmayı gerektirir.\n3. Yaratıcılık: Çocuklar, kendi projelerini yaratırken yaratıcılıklarını kullanırlar.\n4. İşbirliği: Grup çalışmalarıyla birlikte çalışma becerisi gelişir.\n\nKIBO, bu becerileri geliştirmek için tasarlanmış yaşa uygun bir robotik eğitim setidir.',
        excerpt: 'Erken çocukluk döneminde kodlama eğitiminin önemini ve KIBO\'nun bu süreçteki rolünü keşfedin.',
        author: 'Dr. Zeynep Arslan',
        publishDate: '2025-01-25T09:15:00.000Z',
        status: 'published',
        createdAt: '2025-01-22T08:00:00.000Z',
        updatedAt: '2025-01-25T09:15:00.000Z'
      },
      {
        id: '4004',
        title: 'KIBO ile Sınıf İçi Etkinlikler',
        content: 'KIBO robotik setleri, sınıf içinde birçok farklı etkinlik için kullanılabilir. Bu yazıda, öğretmenlerin sınıflarında uygulayabileceği pratik KIBO etkinliklerini paylaşacağız.\n\n1. Hikaye Anlatma: Öğrenciler, KIBO\'yu kullanarak kendi hikayelerini canlandırabilirler.\n2. Matematik Oyunları: KIBO ile şekil oluşturma, sayma ve ölçme etkinlikleri yapılabilir.\n3. Sanat Projesi: KIBO\'yu sanat eserleri oluşturmak için kullanmak.\n4. Fen Deneyleri: KIBO ile basit fen deneyleri yapmak.\n\nBu etkinlikler, öğrencilerin hem eğlenmesini hem de öğrenmesini sağlar. Öğretmenler, KIBO\'yu farklı derslerde entegre ederek öğrenmeyi daha etkileyici hale getirebilirler.',
        excerpt: 'Sınıfınızda KIBO ile uygulayabileceğiniz yaratıcı ve eğitici etkinlikleri keşfedin.',
        author: 'Öğr. Fatma Kaya',
        publishDate: '2025-02-01T11:45:00.000Z',
        status: 'draft',
        createdAt: '2025-01-28T13:00:00.000Z',
        updatedAt: '2025-02-01T11:45:00.000Z'
      },
      {
        id: '4005',
        title: 'Ebeveynler İçin KIBO Rehberi',
        content: 'Ebeveynler olarak, çocuklarınızın teknolojiyle sağlıklı bir ilişki kurmasını istersiniz. KIBO, çocuklarınıza teknolojiyi anlamlı bir şekilde kullanmayı öğreten harika bir araçtır.\n\nBu rehberde, ebeveynlerin KIBO\'yu evde nasıl kullanabileceğini ve çocuklarının gelişimine nasıl katkı sağlayacağını anlatacağız.\n\nKIBO ile Evde Eğitim:\n- Aile birlikte projeler yapabilir\n- Çocuğunuzun yaratıcılığını destekleyebilirsiniz\n- Ekran süresini azaltırken kaliteli zaman geçirebilirsiniz\n- Çocuğunuzun problem çözme becerilerini geliştirebilirsiniz\n\nKIBO, çocuklarınıza kodlama ve robotiği sevdirmek için harika bir başlangıç noktasıdır.',
        excerpt: 'Ebeveynler için KIBO rehberi: Çocuğunuzun teknolojiyle sağlıklı ilişki kurmasına yardımcı olun.',
        author: 'Dr. Ali Çelik',
        publishDate: '2025-02-05T16:20:00.000Z',
        status: 'draft',
        createdAt: '2025-02-02T10:00:00.000Z',
        updatedAt: '2025-02-05T16:20:00.000Z'
      }
    ];
    
    // Önce veritabanını temizle (bu işlem zaten admin kullanıcısını oluşturur)
    await database.clearAllData();
    
    const safeDemoUsers = demoUsers.map((user) => ({
      ...user,
      password: hashPassword(String(user.password || crypto.randomBytes(12).toString('base64url')))
    }));

    // Demo verilerini ekle (admin kullanıcısı hariç)
    for (const user of safeDemoUsers) {
      if (!user.isAdmin) {
        await database.createUser(user);
      }
    }

    await ensureDefaultAdminUser();
    
    for (const order of demoOrders) {
      await database.createOrder(order);
    }
    
    for (const registration of demoRegistrations) {
      await database.createRegistration(registration);
    }
    
    for (const contact of demoContacts) {
      await database.createContact(contact);
    }
    
    for (const blogPost of demoBlogPosts) {
      await database.createBlogPost(blogPost);
    }
    
    res.json({ message: 'Demo data loaded successfully' });
  } catch (error) {
    console.error('Error loading demo data:', error);
    res.status(500).json({ error: 'Failed to load demo data' });
  }
});

// User Addresses API
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
      updatedAt: new Date().toISOString()
    };

    const result = await database.createUserAddress(newAddress);
    res.status(201).json(result);
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

    if (!isSelfOrAdmin(req.user, existingAddress.user_id)) {
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
    const isDefault = Boolean(req.body?.isDefault);

    if (!title || !address || !district || !city || !postalCode || !['delivery', 'billing'].includes(type)) {
      return res.status(400).json({ error: 'Invalid address payload' });
    }
    
    const updatedAddress = {
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
      updatedAt: new Date().toISOString()
    };

    const result = await database.updateUserAddress(id, updatedAddress);
    res.json(result);
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

    if (!isSelfOrAdmin(req.user, existingAddress.user_id)) {
      return res.status(403).json({ error: 'Not authorized to delete this address' });
    }

    await database.deleteUserAddress(id);
    res.json({ message: 'Address deleted successfully' });
  } catch (error) {
    console.error('Error deleting address:', error);
    res.status(500).json({ error: 'Failed to delete address' });
  }
});

// User Payment Methods API
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
    
    // Kart tipini belirle
    const getCardType = (cardNumber) => {
      const firstDigit = cardNumber.charAt(0);
      if (firstDigit === '4') return 'visa';
      if (firstDigit === '5') return 'mastercard';
      if (firstDigit === '3') return 'amex';
      return 'unknown';
    };

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
      updatedAt: new Date().toISOString()
    };

    const result = await database.createUserPaymentMethod(newPaymentMethod);
    res.status(201).json(result);
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

    if (!isSelfOrAdmin(req.user, existingPaymentMethod.user_id)) {
      return res.status(403).json({ error: 'Not authorized to update this payment method' });
    }

    const cardTitle = sanitizePlainText(req.body?.cardTitle, 120);
    const cardNumber = sanitizePlainText(req.body?.cardNumber, 32).replace(/\s+/g, '');
    const expiryMonth = sanitizePlainText(req.body?.expiryMonth, 2);
    const expiryYear = sanitizePlainText(req.body?.expiryYear, 4);
    const holderName = sanitizePlainText(req.body?.holderName, 120);
    const isDefault = Boolean(req.body?.isDefault);
    
    const getCardType = (cardNumber) => {
      const firstDigit = cardNumber.charAt(0);
      if (firstDigit === '4') return 'visa';
      if (firstDigit === '5') return 'mastercard';
      if (firstDigit === '3') return 'amex';
      return 'unknown';
    };

    const updatedPaymentMethod = {
      cardTitle: cardTitle || undefined,
      cardLastFour: cardNumber ? cardNumber.slice(-4) : undefined,
      cardType: cardNumber ? getCardType(cardNumber) : undefined,
      expiryMonth: expiryMonth || undefined,
      expiryYear: expiryYear || undefined,
      holderName: holderName || undefined,
      isDefault: isDefault === undefined ? undefined : (isDefault ? 1 : 0),
      updatedAt: new Date().toISOString()
    };

    // Undefined değerleri temizle
    Object.keys(updatedPaymentMethod).forEach(key => {
      if (updatedPaymentMethod[key] === undefined) {
        delete updatedPaymentMethod[key];
      }
    });

    const result = await database.updateUserPaymentMethod(id, updatedPaymentMethod);
    res.json(result);
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

    if (!isSelfOrAdmin(req.user, existingPaymentMethod.user_id)) {
      return res.status(403).json({ error: 'Not authorized to delete this payment method' });
    }

    await database.deleteUserPaymentMethod(id);
    res.json({ message: 'Payment method deleted successfully' });
  } catch (error) {
    console.error('Error deleting payment method:', error);
    res.status(500).json({ error: 'Failed to delete payment method' });
  }
});

// Tüm verileri temizle
app.post('/api/clear-all-data', async (req, res) => {
  try {
    if (!DEMO_ENDPOINTS_ENABLED) {
      return res.status(404).json({ error: 'Endpoint not available' });
    }

    await database.clearAllData();
    await ensureDefaultAdminUser();
    res.json({ message: 'All data cleared successfully' });
  } catch (error) {
    console.error('Error clearing data:', error);
    res.status(500).json({ error: 'Failed to clear data' });
  }
});

app.use((err, req, res, next) => {
  if (!err) {
    return next();
  }

  if (err.message === 'Not allowed by CORS') {
    return res.status(403).json({ error: 'Origin is not allowed' });
  }

  if (err.message && err.message.toLowerCase().includes('image')) {
    return res.status(400).json({ error: err.message });
  }

  console.error('Unhandled server error:', err);
  return res.status(500).json({ error: 'Internal server error' });
});

// Server başlat
app.listen(PORT, async () => {
  await initializeDatabase();
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`SQLite database location: ${database.getDatabasePath()}`);
});
