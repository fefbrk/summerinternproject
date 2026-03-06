const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');

const tempDbPath = path.join(
  os.tmpdir(),
  `kinderlab-api-test-${Date.now()}-${Math.random().toString(16).slice(2)}.db`
);

process.env.NODE_ENV = 'test';
process.env.PORT = '0';
process.env.SQLITE_DB_PATH = tempDbPath;
process.env.AUTH_TOKEN_SECRET = 'integration-test-secret-1234567890';
process.env.AUTH_TOKEN_TTL_MS = '3600000';
process.env.DEFAULT_ADMIN_EMAIL = 'admin.integration@example.com';
process.env.DEFAULT_ADMIN_PASSWORD = 'StrongPass123A';
process.env.CORS_ORIGINS = 'http://localhost:5173';
process.env.ENABLE_DEMO_ENDPOINTS = 'false';
process.env.CARRIER_WEBHOOK_SECRET = 'carrier-webhook-test-secret';
process.env.CARRIER_WEBHOOK_MAX_ATTEMPTS = '5';
process.env.CARRIER_WEBHOOK_WINDOW_MS = '60000';
process.env.LOGIN_LOCKOUT_MAX_ATTEMPTS = '3';
process.env.LOGIN_LOCKOUT_WINDOW_MS = '600000';
process.env.SECURITY_ALERT_LOGIN_FAILURE_THRESHOLD = '2';
const currentHour = new Date().getHours();
process.env.SECURITY_ALERT_BUSINESS_HOUR_START = String((currentHour + 1) % 24);
process.env.SECURITY_ALERT_BUSINESS_HOUR_END = String((currentHour + 2) % 24);
process.env.ENABLE_MANUAL_FULFILLMENT_OVERRIDE = 'false';
process.env.ENABLE_MANUAL_PAYMENT_OVERRIDE = 'true';
process.env.SUPER_ADMIN_EMAILS = process.env.DEFAULT_ADMIN_EMAIL;

const { startServer } = require('../server');
const database = require('../database/database');
const { hashPassword } = require('../security/password');

let server;
let baseUrl;
const TEST_ORIGIN = 'http://localhost:5173';
let csrfState = null;
const PAYMENT_METHODS_DISABLED_ERROR = 'Payment method management is disabled until a payment provider is connected';

const createCarrierWebhookHeaders = (payload, timestamp = Date.now()) => {
  const timestampValue = String(timestamp);
  const rawBody = JSON.stringify(payload || {});
  const signature = crypto
    .createHmac('sha256', process.env.CARRIER_WEBHOOK_SECRET)
    .update(`${timestampValue}.${rawBody}`)
    .digest('hex');

  return {
    'x-carrier-webhook-timestamp': timestampValue,
    'x-carrier-webhook-signature': signature,
  };
};

const getSetCookieValues = (headers) => {
  if (headers && typeof headers.getSetCookie === 'function') {
    return headers.getSetCookie();
  }

  const singleValue = headers.get('set-cookie');
  return singleValue ? [singleValue] : [];
};

const extractCookieValue = (setCookieHeaders, cookieName) => {
  if (!Array.isArray(setCookieHeaders)) {
    return '';
  }

  for (const setCookieHeader of setCookieHeaders) {
    if (typeof setCookieHeader !== 'string') {
      continue;
    }

    const [cookiePair] = setCookieHeader.split(';');
    const [name, ...valueParts] = cookiePair.split('=');
    if (name && name.trim() === cookieName) {
      return valueParts.join('=').trim();
    }
  }

  return '';
};

const ensureCsrfState = async (forceRefresh = false) => {
  if (!forceRefresh && csrfState && csrfState.token && csrfState.cookie) {
    return csrfState;
  }

  const response = await fetch(`${baseUrl}/api/csrf-token`, {
    method: 'GET',
    headers: {
      Origin: TEST_ORIGIN,
    },
  });

  assert.equal(response.status, 200);

  const payload = await response.json().catch(() => ({}));
  const setCookieHeaders = getSetCookieValues(response.headers);
  const csrfCookieValue = extractCookieValue(setCookieHeaders, 'csrf_token');

  assert.equal(typeof payload.csrfToken, 'string');
  assert.ok(payload.csrfToken.length > 0);
  assert.ok(csrfCookieValue.length > 0);

  csrfState = {
    token: payload.csrfToken,
    cookie: `csrf_token=${csrfCookieValue}`,
  };

  return csrfState;
};

const requestJson = async (endpoint, options = {}) => {
  const method = (options.method || 'GET').toUpperCase();
  const requiresCsrf = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method);

  let csrfHeaders = {};
  if (requiresCsrf) {
    const resolvedCsrfState = await ensureCsrfState(options.forceCsrfRefresh === true);
    csrfHeaders = {
      'x-csrf-token': resolvedCsrfState.token,
      Cookie: options.cookie ? `${options.cookie}; ${resolvedCsrfState.cookie}` : resolvedCsrfState.cookie,
    };
  }

  const headers = {
    ...(options.body ? { 'Content-Type': 'application/json' } : {}),
    ...(options.token ? { Authorization: `Bearer ${options.token}` } : {}),
    Origin: options.origin || TEST_ORIGIN,
    ...csrfHeaders,
    ...(options.headers || {}),
  };

  const response = await fetch(`${baseUrl}${endpoint}`, {
    method,
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  const text = await response.text();
  let data = null;

  if (text) {
    try {
      data = JSON.parse(text);
    } catch (_error) {
      data = { raw: text };
    }
  }

  if (
    requiresCsrf &&
    response.status === 403 &&
    data &&
    data.code === 'CSRF_TOKEN_INVALID' &&
    options._csrfRetried !== true
  ) {
    csrfState = null;
    return requestJson(endpoint, {
      ...options,
      _csrfRetried: true,
      forceCsrfRefresh: true,
    });
  }

  const setCookieHeaders = getSetCookieValues(response.headers);
  const authToken = extractCookieValue(setCookieHeaders, 'auth_token');

  return {
    status: response.status,
    data,
    authToken,
    setCookieHeaders,
  };
};

test.before(async () => {
  server = await startServer(0);
  const address = server.address();
  const port = address && typeof address === 'object' ? address.port : 3001;
  baseUrl = `http://127.0.0.1:${port}`;
});

test.after(async () => {
  if (server) {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }

  await database.close();

  const tempPaths = [
    tempDbPath,
    `${tempDbPath}-wal`,
    `${tempDbPath}-shm`,
    `${tempDbPath}-journal`,
  ];

  for (const tempPath of tempPaths) {
    if (fs.existsSync(tempPath)) {
      fs.unlinkSync(tempPath);
    }
  }
});

test('critical auth and authorization flow works end-to-end', async () => {
  const adminLogin = await requestJson('/api/login', {
    method: 'POST',
    body: {
      email: process.env.DEFAULT_ADMIN_EMAIL,
      password: process.env.DEFAULT_ADMIN_PASSWORD,
    },
  });

  assert.equal(adminLogin.status, 200);
  assert.ok(adminLogin.authToken);
  assert.equal(adminLogin.data.user.email, process.env.DEFAULT_ADMIN_EMAIL);
  assert.equal(adminLogin.data.user.isAdmin, true);

  const adminToken = adminLogin.authToken;

  const adminMe = await requestJson('/api/me', { token: adminToken });
  assert.equal(adminMe.status, 200);
  assert.equal(adminMe.data.email, process.env.DEFAULT_ADMIN_EMAIL);

  const firstUserEmail = `integration_user_${Date.now()}@example.com`;
  const firstUserRegister = await requestJson('/api/register', {
    method: 'POST',
    body: {
      name: 'Integration User One',
      email: firstUserEmail,
      password: 'UserPass123A',
    },
  });

  assert.equal(firstUserRegister.status, 201);
  assert.ok(firstUserRegister.authToken);
  assert.equal(firstUserRegister.data.user.isAdmin, false);

  const duplicateRegister = await requestJson('/api/register', {
    method: 'POST',
    body: {
      name: 'Integration User One',
      email: firstUserEmail,
      password: 'UserPass123A',
    },
  });

  assert.equal(duplicateRegister.status, 400);

  const firstUserToken = firstUserRegister.authToken;
  const firstUserId = firstUserRegister.data.user.id;

  const firstUserMe = await requestJson('/api/me', { token: firstUserToken });
  assert.equal(firstUserMe.status, 200);
  assert.equal(firstUserMe.data.id, firstUserId);

  const profileResponse = await requestJson('/api/account/profile', { token: firstUserToken });
  assert.equal(profileResponse.status, 200);
  assert.equal(profileResponse.data.email, firstUserEmail);

  const updatedProfileResponse = await requestJson('/api/account/profile', {
    method: 'PUT',
    token: firstUserToken,
    body: {
      fullName: 'Integration User One Updated',
      email: firstUserEmail,
      phone: '+90-555-111-1111',
      companyName: 'KinderLab Test Org',
    },
  });

  assert.equal(updatedProfileResponse.status, 200);
  assert.equal(updatedProfileResponse.data.fullName, 'Integration User One Updated');
  assert.equal(updatedProfileResponse.data.phone, '+90-555-111-1111');
  assert.equal(updatedProfileResponse.data.companyName, 'KinderLab Test Org');

  const usersAsNormalUser = await requestJson('/api/users', { token: firstUserToken });
  assert.equal(usersAsNormalUser.status, 403);

  const createAddress = await requestJson('/api/addresses', {
    method: 'POST',
    token: firstUserToken,
    body: {
      userId: firstUserId,
      title: 'Home',
      type: 'delivery',
      recipientName: 'Integration User One',
      phone: '+90-555-100-2000',
      email: 'integration.user.one@example.com',
      address: 'Example Street 42',
      apartment: '3A',
      district: 'Kadikoy',
      city: 'Istanbul',
      postalCode: '34710',
      province: 'Istanbul',
      country: 'Turkey',
      isDefault: true,
    },
  });

  assert.equal(createAddress.status, 201);
  assert.ok(createAddress.data && typeof createAddress.data.id === 'string');
  assert.equal(createAddress.data.userId, firstUserId);
  assert.equal(createAddress.data.isDefault, 1);

  const updatedAddressWithoutDefaultPayload = await requestJson(`/api/addresses/${createAddress.data.id}`, {
    method: 'PUT',
    token: firstUserToken,
    body: {
      title: 'Home Updated',
      type: 'delivery',
      recipientName: 'Integration User One',
      phone: '+90-555-100-2000',
      email: 'integration.user.one@example.com',
      address: 'Example Street 43',
      apartment: '3A',
      district: 'Kadikoy',
      city: 'Istanbul',
      postalCode: '34710',
      province: 'Istanbul',
      country: 'Turkey',
    },
  });

  assert.equal(updatedAddressWithoutDefaultPayload.status, 200);
  assert.equal(updatedAddressWithoutDefaultPayload.data.isDefault, 1);

  const ownAddresses = await requestJson(`/api/addresses/${firstUserId}`, { token: firstUserToken });
  assert.equal(ownAddresses.status, 200);
  assert.ok(Array.isArray(ownAddresses.data));
  assert.equal(ownAddresses.data.length, 1);

  const paymentMethodsDisabled = await requestJson('/api/payment-methods', {
    method: 'POST',
    token: firstUserToken,
    body: {
      userId: firstUserId,
      cardTitle: 'Main Card',
      cardNumber: '4242424242424242',
      expiryMonth: '10',
      expiryYear: '2030',
      holderName: 'Integration User One',
      isDefault: true,
    },
  });

  assert.equal(paymentMethodsDisabled.status, 503);
  assert.equal(paymentMethodsDisabled.data.error, PAYMENT_METHODS_DISABLED_ERROR);

  const secondUserRegister = await requestJson('/api/register', {
    method: 'POST',
    body: {
      name: 'Integration User Two',
      email: `integration_user_2_${Date.now()}@example.com`,
      password: 'UserPass456A',
    },
  });

  assert.equal(secondUserRegister.status, 201);

  const secondUserToken = secondUserRegister.authToken;
  const firstUserAddressesAsOtherUser = await requestJson(`/api/addresses/${firstUserId}`, {
    token: secondUserToken,
  });
  assert.equal(firstUserAddressesAsOtherUser.status, 403);

  const paymentMethodsGetDisabled = await requestJson(`/api/payment-methods/${firstUserId}`, {
    token: secondUserToken,
  });
  assert.equal(paymentMethodsGetDisabled.status, 503);
  assert.equal(paymentMethodsGetDisabled.data.error, PAYMENT_METHODS_DISABLED_ERROR);

  const usersAsAdmin = await requestJson('/api/users', { token: adminToken });
  assert.equal(usersAsAdmin.status, 200);
  assert.ok(Array.isArray(usersAsAdmin.data));
  assert.ok(usersAsAdmin.data.length >= 3);

  const ordersAsNormalUser = await requestJson('/api/orders', { token: firstUserToken });
  assert.equal(ordersAsNormalUser.status, 403);

  const ordersAsAdmin = await requestJson('/api/orders', { token: adminToken });
  assert.equal(ordersAsAdmin.status, 200);
  assert.ok(Array.isArray(ordersAsAdmin.data));

  const logoutResponse = await requestJson('/api/logout', {
    method: 'POST',
    token: firstUserToken,
  });
  assert.equal(logoutResponse.status, 200);

  const meAfterLogout = await requestJson('/api/me', { token: firstUserToken });
  assert.equal(meAfterLogout.status, 401);

  const loadDemoAsAdminWhenDisabled = await requestJson('/api/load-demo-data', {
    method: 'POST',
    token: adminToken,
  });
  assert.equal(loadDemoAsAdminWhenDisabled.status, 404);
});

test('password change revokes previously issued token access', async () => {
  const email = `password_change_${Date.now()}@example.com`;
  const initialPassword = 'StartPass123A';
  const nextPassword = 'NextPass123A';

  const registerResponse = await requestJson('/api/register', {
    method: 'POST',
    body: {
      name: 'Password Change User',
      email,
      password: initialPassword,
    },
  });

  assert.equal(registerResponse.status, 201);
  const tokenBeforePasswordChange = registerResponse.authToken;
  const userId = registerResponse.data.user.id;

  const changePasswordResponse = await requestJson(`/api/users/${userId}/password`, {
    method: 'PUT',
    token: tokenBeforePasswordChange,
    body: {
      currentPassword: initialPassword,
      newPassword: nextPassword,
    },
  });

  assert.equal(changePasswordResponse.status, 200);

  const meWithOldToken = await requestJson('/api/me', {
    token: tokenBeforePasswordChange,
  });
  assert.equal(meWithOldToken.status, 401);

  const loginWithNewPassword = await requestJson('/api/login', {
    method: 'POST',
    body: {
      email,
      password: nextPassword,
    },
  });

  assert.equal(loginWithNewPassword.status, 200);
});

test('refresh token endpoint rotates tokens and blocks token reuse', async () => {
  const email = `refresh_flow_${Date.now()}@example.com`;
  const password = 'RefreshFlow123A';

  const registerResponse = await requestJson('/api/register', {
    method: 'POST',
    body: {
      name: 'Refresh Flow User',
      email,
      password,
    },
  });

  assert.equal(registerResponse.status, 201);
  const firstRefreshToken = extractCookieValue(registerResponse.setCookieHeaders, 'refresh_token');
  assert.ok(firstRefreshToken.length > 0);

  const firstRefreshResponse = await requestJson('/api/refresh', {
    method: 'POST',
    body: {
      refreshToken: firstRefreshToken,
    },
  });

  assert.equal(firstRefreshResponse.status, 200);
  assert.ok(firstRefreshResponse.authToken);
  const secondRefreshToken = extractCookieValue(firstRefreshResponse.setCookieHeaders, 'refresh_token');
  assert.ok(secondRefreshToken.length > 0);
  assert.notEqual(secondRefreshToken, firstRefreshToken);

  const reusedRefreshResponse = await requestJson('/api/refresh', {
    method: 'POST',
    body: {
      refreshToken: firstRefreshToken,
    },
  });

  assert.equal(reusedRefreshResponse.status, 401);

  const rotatedRefreshResponse = await requestJson('/api/refresh', {
    method: 'POST',
    body: {
      refreshToken: secondRefreshToken,
    },
  });

  assert.equal(rotatedRefreshResponse.status, 200);
});

test('tampered access tokens are rejected', async () => {
  const adminLogin = await requestJson('/api/login', {
    method: 'POST',
    body: {
      email: process.env.DEFAULT_ADMIN_EMAIL,
      password: process.env.DEFAULT_ADMIN_PASSWORD,
    },
  });

  assert.equal(adminLogin.status, 200);
  assert.ok(adminLogin.authToken);

  const baseToken = adminLogin.authToken;
  const tamperedToken = `${baseToken.slice(0, -1)}${baseToken.endsWith('a') ? 'b' : 'a'}`;

  const tamperedTokenResponse = await requestJson('/api/me', {
    token: tamperedToken,
  });

  assert.equal(tamperedTokenResponse.status, 401);
});

test('privacy export and deletion request endpoints work end-to-end', async () => {
  const email = `privacy_flow_${Date.now()}@example.com`;
  const password = 'PrivacyFlow123A';

  const registerResponse = await requestJson('/api/register', {
    method: 'POST',
    body: {
      name: 'Privacy Flow User',
      email,
      password,
    },
  });

  assert.equal(registerResponse.status, 201);
  const userToken = registerResponse.authToken;

  const exportWithoutAuth = await requestJson('/api/account/privacy/export');
  assert.equal(exportWithoutAuth.status, 401);

  const exportResponse = await requestJson('/api/account/privacy/export', {
    token: userToken,
  });

  assert.equal(exportResponse.status, 200);
  assert.equal(exportResponse.data.user.id, registerResponse.data.user.id);
  assert.ok(Array.isArray(exportResponse.data.orders));
  assert.ok(Array.isArray(exportResponse.data.privacyRequests));

  const deletionResponse = await requestJson('/api/account/privacy/deletion-request', {
    method: 'POST',
    token: userToken,
    body: {
      reason: 'Please process GDPR deletion request for test account',
    },
  });

  assert.equal(deletionResponse.status, 202);
  assert.equal(deletionResponse.data.status, 'requested');
  assert.ok(typeof deletionResponse.data.id === 'string');

  const requestsResponse = await requestJson('/api/account/privacy/requests', {
    token: userToken,
  });

  assert.equal(requestsResponse.status, 200);
  assert.ok(Array.isArray(requestsResponse.data));
  assert.equal(
    requestsResponse.data.some((request) => request.id === deletionResponse.data.id),
    true
  );
  assert.equal(
    requestsResponse.data.some((request) => request.requestType === 'export'),
    true
  );
});

test('content and status endpoints return full entities', async () => {
  const adminLogin = await requestJson('/api/login', {
    method: 'POST',
    body: {
      email: process.env.DEFAULT_ADMIN_EMAIL,
      password: process.env.DEFAULT_ADMIN_PASSWORD,
    },
  });

  assert.equal(adminLogin.status, 200);
  const adminToken = adminLogin.authToken;

  const createdEvent = await requestJson('/api/events', {
    method: 'POST',
    token: adminToken,
    body: {
      title: 'Integration Event',
      description: '<p>Integration event description</p>',
      excerpt: 'Integration event excerpt',
      startDate: '2026-01-10T10:00:00.000Z',
      endDate: '2026-01-10T18:00:00.000Z',
      venueName: 'Integration Venue',
      venueAddress: 'Integration Street 1',
      venueCity: 'Istanbul',
      venueState: 'Istanbul',
      venueZipCode: '34000',
      venueCountry: 'Turkey',
      organizerName: 'Integration Team',
      eventWebsite: 'https://example.com/event',
      status: 'upcoming',
      category: 'conference',
    },
  });

  assert.equal(createdEvent.status, 201);
  assert.ok(createdEvent.data && typeof createdEvent.data.id === 'string');
  assert.equal(createdEvent.data.status, 'upcoming');

  const invalidEventUrlPayload = await requestJson('/api/events', {
    method: 'POST',
    token: adminToken,
    body: {
      title: 'Integration Event Invalid URL',
      description: '<p>Invalid URL check</p>',
      excerpt: 'Invalid event URL excerpt',
      startDate: '2026-02-10T10:00:00.000Z',
      endDate: '2026-02-10T18:00:00.000Z',
      venueName: 'Integration Venue',
      venueAddress: 'Integration Street 1',
      venueCity: 'Istanbul',
      venueState: 'Istanbul',
      venueZipCode: '34000',
      venueCountry: 'Turkey',
      organizerName: 'Integration Team',
      eventWebsite: 'javascript:alert(1)',
      status: 'upcoming',
      category: 'conference',
    },
  });

  assert.equal(invalidEventUrlPayload.status, 400);
  assert.equal(invalidEventUrlPayload.data.error, 'Invalid event website URL');

  const updatedEventStatus = await requestJson(`/api/events/${createdEvent.data.id}/status`, {
    method: 'PUT',
    token: adminToken,
    body: {
      status: 'ongoing',
    },
  });

  assert.equal(updatedEventStatus.status, 200);
  assert.equal(updatedEventStatus.data.id, createdEvent.data.id);
  assert.equal(updatedEventStatus.data.status, 'ongoing');

  const createdMediaCoverage = await requestJson('/api/media-coverage', {
    method: 'POST',
    token: adminToken,
    body: {
      title: 'Integration Media Coverage',
      content: '<p>Media coverage body</p>',
      excerpt: 'Media coverage excerpt',
      author: 'Integration Editor',
      status: 'draft',
      images: [],
    },
  });

  assert.equal(createdMediaCoverage.status, 201);
  assert.ok(createdMediaCoverage.data && typeof createdMediaCoverage.data.id === 'string');
  assert.equal(createdMediaCoverage.data.status, 'draft');

  const invalidMediaSourceUrl = await requestJson('/api/media-coverage', {
    method: 'POST',
    token: adminToken,
    body: {
      title: 'Integration Media Invalid URL',
      content: '<p>Media coverage body</p>',
      excerpt: 'Media coverage excerpt',
      sourceUrl: 'javascript:alert(1)',
      author: 'Integration Editor',
      status: 'draft',
      images: [],
    },
  });

  assert.equal(invalidMediaSourceUrl.status, 400);
  assert.equal(invalidMediaSourceUrl.data.error, 'Invalid source URL');

  const updatedMediaStatus = await requestJson(`/api/media-coverage/${createdMediaCoverage.data.id}/status`, {
    method: 'PUT',
    token: adminToken,
    body: {
      status: 'published',
    },
  });

  assert.equal(updatedMediaStatus.status, 200);
  assert.equal(updatedMediaStatus.data.id, createdMediaCoverage.data.id);
  assert.equal(updatedMediaStatus.data.status, 'published');
});

test('public CMS endpoints hide drafts while admin endpoints can access them', async () => {
  const adminLogin = await requestJson('/api/login', {
    method: 'POST',
    body: {
      email: process.env.DEFAULT_ADMIN_EMAIL,
      password: process.env.DEFAULT_ADMIN_PASSWORD,
    },
  });

  assert.equal(adminLogin.status, 200);
  const adminToken = adminLogin.authToken;

  const createdDraftBlog = await requestJson('/api/blog', {
    method: 'POST',
    token: adminToken,
    body: {
      title: 'Draft Visibility Test',
      excerpt: 'Should stay private',
      author: 'Integration Admin',
      content: '<p>Draft body</p>',
      status: 'draft',
      images: [],
    },
  });

  assert.equal(createdDraftBlog.status, 201);
  assert.ok(createdDraftBlog.data && typeof createdDraftBlog.data.id === 'string');

  const publicBlogList = await requestJson('/api/blog');
  assert.equal(publicBlogList.status, 200);
  assert.ok(Array.isArray(publicBlogList.data));
  assert.equal(publicBlogList.data.some((post) => post.id === createdDraftBlog.data.id), false);

  const publicDraftDetail = await requestJson(`/api/blog/${createdDraftBlog.data.id}`);
  assert.equal(publicDraftDetail.status, 404);

  const adminBlogList = await requestJson('/api/admin/blog', { token: adminToken });
  assert.equal(adminBlogList.status, 200);
  assert.ok(Array.isArray(adminBlogList.data));
  assert.equal(adminBlogList.data.some((post) => post.id === createdDraftBlog.data.id), true);

  const regularUserRegister = await requestJson('/api/register', {
    method: 'POST',
    body: {
      name: 'Non Admin Reader',
      email: `reader_${Date.now()}@example.com`,
      password: 'ReaderPass123A',
    },
  });

  assert.equal(regularUserRegister.status, 201);
  const nonAdminToken = regularUserRegister.authToken;

  const nonAdminAdminRoute = await requestJson('/api/admin/blog', { token: nonAdminToken });
  assert.equal(nonAdminAdminRoute.status, 403);
});

test('order creation enforces backend catalog prices and totals', async () => {
  const registerResponse = await requestJson('/api/register', {
    method: 'POST',
    body: {
      name: 'Order Integrity User',
      email: `order_integrity_${Date.now()}@example.com`,
      password: 'OrderPass123A',
    },
  });

  assert.equal(registerResponse.status, 201);
  const userToken = registerResponse.authToken;

  const orderPayload = {
    items: [
      { id: '2', name: 'Tampered Name', quantity: 1, price: 1, image: '/img-1.png' },
      { id: '209', name: 'Tampered Marker', quantity: 1, price: 1, image: '/img-2.png' },
    ],
    customer: {
      name: 'Order Integrity User',
      email: 'order_integrity@example.com',
    },
    shipping: {
      recipientName: 'Order Integrity User',
      phone: '+1-555-100-2000',
      email: 'order_integrity@example.com',
      address: 'Integrity Street 1',
      apartment: '',
      district: 'Kadikoy',
      city: 'Istanbul',
      postalCode: '34000',
      province: 'Istanbul',
      country: 'Turkey',
    },
    billing: {
      recipientName: 'Order Integrity Billing',
      phone: '+1-555-100-2001',
      email: 'billing_integrity@example.com',
      address: 'Billing Street 2',
      apartment: '4B',
      district: 'Besiktas',
      city: 'Istanbul',
      postalCode: '34353',
      province: 'Istanbul',
      country: 'Turkey',
    },
    paymentMode: 'pending',
  };

  const tamperedTotalResponse = await requestJson('/api/orders', {
    method: 'POST',
    token: userToken,
    body: {
      ...orderPayload,
      totalAmount: 1,
    },
  });

  assert.equal(tamperedTotalResponse.status, 400);
  assert.equal(tamperedTotalResponse.data.error, 'Order total does not match items');

  const validTotalResponse = await requestJson('/api/orders', {
    method: 'POST',
    token: userToken,
    body: {
      ...orderPayload,
      totalAmount: 544,
    },
  });

  assert.equal(validTotalResponse.status, 201);
  assert.equal(validTotalResponse.data.totalAmount, 544);
  assert.equal(validTotalResponse.data.paymentMode, 'pending');
  assert.equal(validTotalResponse.data.paymentStatus, 'pending');
  assert.equal(validTotalResponse.data.paymentAmount, 544);
  assert.equal(validTotalResponse.data.paymentCurrency, 'USD');
  assert.equal(validTotalResponse.data.items[0].name, 'KIBO 15 Kit');
  assert.equal(validTotalResponse.data.items[0].price, 495);
  assert.equal(validTotalResponse.data.items[1].name, 'Marker Extension Set');
  assert.equal(validTotalResponse.data.items[1].price, 49);

  const purchaseOrderResponse = await requestJson('/api/orders', {
    method: 'POST',
    token: userToken,
    body: {
      ...orderPayload,
      totalAmount: 544,
      paymentMode: 'purchase_order',
      purchaseOrderNumber: 'PO-2026-0001',
    },
  });

  assert.equal(purchaseOrderResponse.status, 201);
  assert.equal(purchaseOrderResponse.data.paymentMode, 'purchase_order');
  assert.equal(purchaseOrderResponse.data.purchaseOrderNumber, 'PO-2026-0001');

  const adminLogin = await requestJson('/api/login', {
    method: 'POST',
    body: {
      email: process.env.DEFAULT_ADMIN_EMAIL,
      password: process.env.DEFAULT_ADMIN_PASSWORD,
    },
  });

  assert.equal(adminLogin.status, 200);
  const adminToken = adminLogin.authToken;

  const unpaidFulfillmentUpdate = await requestJson(`/api/orders/${validTotalResponse.data.id}/status`, {
    method: 'PUT',
    token: adminToken,
    body: {
      status: 'preparing',
    },
  });

  assert.equal(unpaidFulfillmentUpdate.status, 400);
  assert.equal(unpaidFulfillmentUpdate.data.error, 'Order payment must be completed before fulfillment');

  const updatePaymentStatusAsAdmin = await requestJson(`/api/orders/${validTotalResponse.data.id}/payment-status`, {
    method: 'PUT',
    token: adminToken,
    body: {
      paymentStatus: 'paid',
      paymentProvider: 'manual-test',
      paymentReference: 'manual-ref-1',
      paymentAmount: 544,
      paymentCurrency: 'USD',
    },
  });
  assert.equal(updatePaymentStatusAsAdmin.status, 200);
  assert.equal(updatePaymentStatusAsAdmin.data.paymentStatus, 'paid');

  const invalidPaymentStatusUpdate = await requestJson(`/api/orders/${validTotalResponse.data.id}/payment-status`, {
    method: 'PUT',
    token: adminToken,
    body: {
      paymentStatus: 'invalid-status',
    },
  });
  assert.equal(invalidPaymentStatusUpdate.status, 400);

  const paymentStatusAsOwner = await requestJson(`/api/orders/${validTotalResponse.data.id}/payment-status`, {
    token: userToken,
  });
  assert.equal(paymentStatusAsOwner.status, 200);
  assert.equal(paymentStatusAsOwner.data.paymentStatus, 'paid');
  assert.ok(Array.isArray(paymentStatusAsOwner.data.attempts));
  assert.ok(paymentStatusAsOwner.data.attempts.length >= 1);

  const anotherUserRegister = await requestJson('/api/register', {
    method: 'POST',
    body: {
      name: 'Another Payment User',
      email: `another_payment_user_${Date.now()}@example.com`,
      password: 'AnotherPass123A',
    },
  });

  assert.equal(anotherUserRegister.status, 201);
  const anotherUserToken = anotherUserRegister.authToken;

  const paymentStatusAsOtherUser = await requestJson(`/api/orders/${validTotalResponse.data.id}/payment-status`, {
    token: anotherUserToken,
  });
  assert.equal(paymentStatusAsOtherUser.status, 403);

  const updatePaymentStatusAsUser = await requestJson(`/api/orders/${validTotalResponse.data.id}/payment-status`, {
    method: 'PUT',
    token: userToken,
    body: {
      paymentStatus: 'paid',
    },
  });
  assert.equal(updatePaymentStatusAsUser.status, 403);

  const paidFulfillmentUpdate = await requestJson(`/api/orders/${validTotalResponse.data.id}/status`, {
    method: 'PUT',
    token: adminToken,
    body: {
      status: 'preparing',
    },
  });

  assert.equal(paidFulfillmentUpdate.status, 200);
  assert.equal(paidFulfillmentUpdate.data.status, 'preparing');

  const shippingWithoutTracking = await requestJson(`/api/orders/${validTotalResponse.data.id}/status`, {
    method: 'PUT',
    token: adminToken,
    body: {
      status: 'shipping',
      shipmentProvider: 'ups',
    },
  });
  assert.equal(shippingWithoutTracking.status, 400);
  assert.equal(
    shippingWithoutTracking.data.error,
    'Shipment provider and tracking number are required when setting shipping status'
  );

  const shippedUpdate = await requestJson(`/api/orders/${validTotalResponse.data.id}/status`, {
    method: 'PUT',
    token: adminToken,
    body: {
      status: 'shipping',
      shipmentProvider: 'ups',
      shipmentTrackingNumber: '1Z999AA10123456784',
    },
  });

  assert.equal(shippedUpdate.status, 200);
  assert.equal(shippedUpdate.data.status, 'shipping');
  assert.equal(shippedUpdate.data.shipmentProvider, 'ups');
  assert.equal(shippedUpdate.data.shipmentTrackingNumber, '1Z999AA10123456784');
  assert.equal(shippedUpdate.data.fulfillmentSource, 'carrier');

  const manualDeliveredAttempt = await requestJson(`/api/orders/${validTotalResponse.data.id}/status`, {
    method: 'PUT',
    token: adminToken,
    body: {
      status: 'delivered',
      overrideReason: 'manual-check',
    },
  });

  assert.equal(manualDeliveredAttempt.status, 403);
  assert.equal(manualDeliveredAttempt.data.error, 'Manual fulfillment override is disabled');

  const carrierWebhookUnauthorized = await requestJson(`/webhooks/carrier/orders/${validTotalResponse.data.id}/status`, {
    method: 'POST',
    body: {
      provider: 'ups',
      providerEventId: 'carrier-event-1',
      status: 'delivered',
      trackingNumber: '1Z999AA10123456784',
    },
  });

  assert.equal(carrierWebhookUnauthorized.status, 401);

  const carrierWebhookPayload = {
    provider: 'ups',
    providerEventId: 'carrier-event-1',
    status: 'delivered',
    trackingNumber: '1Z999AA10123456784',
  };

  const carrierWebhookDelivered = await requestJson(`/webhooks/carrier/orders/${validTotalResponse.data.id}/status`, {
    method: 'POST',
    headers: createCarrierWebhookHeaders(carrierWebhookPayload),
    body: carrierWebhookPayload,
  });

  assert.equal(carrierWebhookDelivered.status, 200);
  assert.equal(carrierWebhookDelivered.data.duplicated, false);
  assert.equal(carrierWebhookDelivered.data.order.status, 'delivered');
  assert.equal(carrierWebhookDelivered.data.order.fulfillmentSource, 'carrier');

  const carrierWebhookDeliveredDuplicate = await requestJson(`/webhooks/carrier/orders/${validTotalResponse.data.id}/status`, {
    method: 'POST',
    headers: createCarrierWebhookHeaders(carrierWebhookPayload),
    body: carrierWebhookPayload,
  });

  assert.equal(carrierWebhookDeliveredDuplicate.status, 200);
  assert.equal(carrierWebhookDeliveredDuplicate.data.duplicated, true);
  assert.equal(carrierWebhookDeliveredDuplicate.data.order.status, 'delivered');

  const regressAfterShippingAttempt = await requestJson(`/api/orders/${validTotalResponse.data.id}/status`, {
    method: 'PUT',
    token: adminToken,
    body: {
      status: 'preparing',
    },
  });

  assert.equal(regressAfterShippingAttempt.status, 400);
  assert.equal(
    regressAfterShippingAttempt.data.error,
    'Delivered orders are carrier managed and cannot be changed manually'
  );

  const unknownProductResponse = await requestJson('/api/orders', {
    method: 'POST',
    token: userToken,
    body: {
      ...orderPayload,
      items: [
        { id: 'unknown-product', name: 'Unknown', quantity: 1, price: 1, image: '/img-x.png' },
      ],
      totalAmount: 1,
    },
  });

  assert.equal(unknownProductResponse.status, 400);
  assert.equal(unknownProductResponse.data.error, 'Order must include valid items');
});

test('public contact endpoint is rate-limited', async () => {
  const baseBody = {
    type: 'general',
    name: 'Rate Limit Test',
    email: 'ratelimit@example.com',
    subject: 'Contact throttle check',
    message: 'Checking contact endpoint rate limiter.',
  };

  let lastResponse = null;
  for (let attempt = 0; attempt < 21; attempt += 1) {
    lastResponse = await requestJson('/api/contacts', {
      method: 'POST',
      body: {
        ...baseBody,
        subject: `${baseBody.subject} #${attempt}`,
      },
    });
  }

  assert.ok(lastResponse);
  assert.equal(lastResponse.status, 429);
});

test('helmet-based security headers are returned', async () => {
  const response = await fetch(`${baseUrl}/api/csrf-token`, {
    method: 'GET',
    headers: {
      Origin: TEST_ORIGIN,
    },
  });

  assert.equal(response.status, 200);
  assert.equal(response.headers.get('x-frame-options'), 'DENY');
  assert.equal(response.headers.get('x-content-type-options'), 'nosniff');
  assert.equal(response.headers.get('cross-origin-opener-policy'), 'same-origin');

  const cspHeader = response.headers.get('content-security-policy') || '';
  assert.ok(cspHeader.includes("default-src 'self'"));
  assert.ok(cspHeader.includes("frame-ancestors 'none'"));
});

test('csrf protection rejects missing token and untrusted origins', async () => {
  const missingCsrfResponse = await fetch(`${baseUrl}/api/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Origin: TEST_ORIGIN,
    },
    body: JSON.stringify({
      email: process.env.DEFAULT_ADMIN_EMAIL,
      password: process.env.DEFAULT_ADMIN_PASSWORD,
    }),
  });

  assert.equal(missingCsrfResponse.status, 403);
  const missingCsrfPayload = await missingCsrfResponse.json();
  assert.equal(missingCsrfPayload.code, 'CSRF_TOKEN_INVALID');

  const trustedCsrfState = await ensureCsrfState(true);
  const untrustedOriginResponse = await fetch(`${baseUrl}/api/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Referer: 'https://attacker.example/phishing-form',
      'x-csrf-token': trustedCsrfState.token,
      Cookie: trustedCsrfState.cookie,
    },
    body: JSON.stringify({
      email: process.env.DEFAULT_ADMIN_EMAIL,
      password: process.env.DEFAULT_ADMIN_PASSWORD,
    }),
  });

  assert.equal(untrustedOriginResponse.status, 403);
  const untrustedOriginPayload = await untrustedOriginResponse.json();
  assert.equal(untrustedOriginPayload.code, 'CSRF_ORIGIN_INVALID');
});

test('register endpoint is rate-limited', async () => {
  let hitRateLimit = false;

  for (let attempt = 0; attempt < 40; attempt += 1) {
    const response = await requestJson('/api/register', {
      method: 'POST',
      body: {
        name: `Register Rate Limit ${attempt}`,
        email: `register_rate_${Date.now()}_${attempt}@example.com`,
        password: 'RegisterPass123A',
      },
    });

    if (response.status === 429) {
      hitRateLimit = true;
      assert.equal(response.data.error, 'Too many registration attempts. Please try again later.');
      break;
    }

    assert.equal(response.status, 201);
  }

  assert.equal(hitRateLimit, true);

  const rateLimitAlert = await database.get(
    `SELECT event_type as eventType, alerted
     FROM security_events
     WHERE event_type = ?
     ORDER BY created_at DESC
     LIMIT 1`,
    ['RATE_LIMIT_EXCEEDED']
  );

  assert.ok(rateLimitAlert);
  assert.equal(rateLimitAlert.eventType, 'RATE_LIMIT_EXCEEDED');
  assert.equal(rateLimitAlert.alerted, 1);
});

test('login endpoint applies account lockout after repeated failures', async () => {
  const email = `lockout_${Date.now()}@example.com`;
  const password = 'LockoutPass123A';
  await database.createUser({
    id: crypto.randomUUID(),
    email,
    name: 'Lockout User',
    password: hashPassword(password),
    isAdmin: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  for (let attempt = 0; attempt < 3; attempt += 1) {
    const failedLogin = await requestJson('/api/login', {
      method: 'POST',
      body: {
        email,
        password: 'WrongPass123A',
      },
    });

    assert.equal(failedLogin.status, 401);
  }

  const lockedLogin = await requestJson('/api/login', {
    method: 'POST',
    body: {
      email,
      password,
    },
  });

  assert.equal(lockedLogin.status, 423);
  assert.equal(
    lockedLogin.data.error,
    'Account temporarily locked due to repeated failed login attempts. Please try again later.'
  );

  const failureThresholdAlert = await database.get(
    `SELECT event_type as eventType, alerted
     FROM security_events
     WHERE event_type = ?
     ORDER BY created_at DESC
     LIMIT 1`,
    ['AUTH_LOGIN_FAILURE_THRESHOLD']
  );

  assert.ok(failureThresholdAlert);
  assert.equal(failureThresholdAlert.eventType, 'AUTH_LOGIN_FAILURE_THRESHOLD');
  assert.equal(failureThresholdAlert.alerted, 1);
});

test('prototype-pollution style payloads are rejected', async () => {
  const freshCsrf = await ensureCsrfState(true);
  const maliciousEmail = `proto_${Date.now()}@example.com`;
  const maliciousPayload = `{"name":"Prototype Attack","email":"${maliciousEmail}","password":"ProtoPass123A","__proto__":{"polluted":"yes"}}`;

  const response = await fetch(`${baseUrl}/api/register`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Origin: TEST_ORIGIN,
      'x-csrf-token': freshCsrf.token,
      Cookie: freshCsrf.cookie,
    },
    body: maliciousPayload,
  });

  assert.equal(response.status, 400);
  const payload = await response.json().catch(() => ({}));
  assert.equal(payload.error, 'Invalid request payload structure');
  assert.equal(({}).polluted, undefined);
});

test('admin mutating actions are written to audit logs', async () => {
  const adminLogin = await requestJson('/api/login', {
    method: 'POST',
    body: {
      email: process.env.DEFAULT_ADMIN_EMAIL,
      password: process.env.DEFAULT_ADMIN_PASSWORD,
    },
  });

  assert.equal(adminLogin.status, 200);
  const adminToken = adminLogin.authToken;
  const adminUserId = adminLogin.data.user.id;

  const createBlogResponse = await requestJson('/api/blog', {
    method: 'POST',
    token: adminToken,
    body: {
      title: `Audit Log Test ${Date.now()}`,
      excerpt: 'Audit log coverage',
      author: 'Integration Admin',
      content: '<p>Audit log content</p>',
      status: 'draft',
      images: [],
    },
  });

  assert.equal(createBlogResponse.status, 201);

  const deadline = Date.now() + 2000;
  let auditLogRow = null;
  while (!auditLogRow && Date.now() < deadline) {
    auditLogRow = await database.get(
      `SELECT user_id as userId, action, resource_type as resourceType, new_value as newValue
       FROM audit_logs
       WHERE user_id = ? AND action = ?
       ORDER BY created_at DESC
       LIMIT 1`,
      [adminUserId, 'POST /blog']
    );

    if (!auditLogRow) {
      await new Promise((resolve) => setTimeout(resolve, 50));
    }
  }

  assert.ok(auditLogRow);
  assert.equal(auditLogRow.userId, adminUserId);
  assert.equal(auditLogRow.resourceType, 'blog');

  const parsedNewValue = JSON.parse(auditLogRow.newValue || '{}');
  assert.equal(parsedNewValue.statusCode, 201);

  const businessHourAlert = await database.get(
    `SELECT event_type as eventType, alerted
     FROM security_events
     WHERE event_type = ? AND user_id = ?
     ORDER BY created_at DESC
     LIMIT 1`,
    ['ADMIN_ACTION_OUTSIDE_BUSINESS_HOURS', adminUserId]
  );

  assert.ok(businessHourAlert);
  assert.equal(businessHourAlert.eventType, 'ADMIN_ACTION_OUTSIDE_BUSINESS_HOURS');
  assert.equal(businessHourAlert.alerted, 1);
});

test('malformed JSON and oversized request payloads are rejected safely', async () => {
  const freshCsrf = await ensureCsrfState(true);

  const malformedJsonResponse = await fetch(`${baseUrl}/api/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Origin: TEST_ORIGIN,
      'x-csrf-token': freshCsrf.token,
      Cookie: freshCsrf.cookie,
    },
    body: '{"email":"broken@example.com",',
  });

  assert.equal(malformedJsonResponse.status, 400);
  const malformedJsonPayload = await malformedJsonResponse.json().catch(() => ({}));
  assert.equal(malformedJsonPayload.error, 'Invalid JSON payload');

  const oversizedBody = JSON.stringify({
    type: 'general',
    name: 'Payload Limit Test',
    email: 'payload-limit@example.com',
    subject: 'Payload limit check',
    message: 'a'.repeat(300 * 1024),
  });

  const oversizedPayloadResponse = await fetch(`${baseUrl}/api/contacts`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Origin: TEST_ORIGIN,
      'x-csrf-token': freshCsrf.token,
      Cookie: freshCsrf.cookie,
    },
    body: oversizedBody,
  });

  assert.equal(oversizedPayloadResponse.status, 413);
  const oversizedPayload = await oversizedPayloadResponse.json().catch(() => ({}));
  assert.equal(oversizedPayload.error, 'Request payload too large');
});

test('carrier webhook endpoint applies rate limiting', async () => {
  await database.run('DELETE FROM rate_limits WHERE scope = ?', ['carrier_webhook']);

  const webhookPayload = {
    provider: 'ups',
    providerEventId: 'rate-limit-check',
    status: 'shipping',
    trackingNumber: '1ZRATECHECK123456',
  };

  const responses = [];
  for (let attempt = 0; attempt < 6; attempt += 1) {
    const response = await requestJson('/webhooks/carrier/orders/non-existent-order/status', {
      method: 'POST',
      body: {
        ...webhookPayload,
        providerEventId: `${webhookPayload.providerEventId}-${attempt}`,
      },
    });

    responses.push(response.status);
  }

  assert.equal(responses[0], 401);
  assert.equal(responses[5], 429);
});
