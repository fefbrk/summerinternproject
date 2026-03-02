const assert = require('node:assert/strict');
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

const { startServer } = require('../server');
const database = require('../database/database');

let server;
let baseUrl;

const requestJson = async (endpoint, options = {}) => {
  const headers = {
    ...(options.body ? { 'Content-Type': 'application/json' } : {}),
    ...(options.token ? { Authorization: `Bearer ${options.token}` } : {}),
  };

  const response = await fetch(`${baseUrl}${endpoint}`, {
    method: options.method || 'GET',
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

  return {
    status: response.status,
    data,
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
  assert.ok(adminLogin.data && adminLogin.data.token);
  assert.equal(adminLogin.data.user.email, process.env.DEFAULT_ADMIN_EMAIL);
  assert.equal(adminLogin.data.user.isAdmin, true);

  const adminToken = adminLogin.data.token;

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
  assert.ok(firstUserRegister.data && firstUserRegister.data.token);
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

  const firstUserToken = firstUserRegister.data.token;
  const firstUserId = firstUserRegister.data.user.id;

  const firstUserMe = await requestJson('/api/me', { token: firstUserToken });
  assert.equal(firstUserMe.status, 200);
  assert.equal(firstUserMe.data.id, firstUserId);

  const usersAsNormalUser = await requestJson('/api/users', { token: firstUserToken });
  assert.equal(usersAsNormalUser.status, 403);

  const createAddress = await requestJson('/api/addresses', {
    method: 'POST',
    token: firstUserToken,
    body: {
      userId: firstUserId,
      title: 'Home',
      type: 'delivery',
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
  assert.equal(createAddress.data.user_id, firstUserId);
  assert.equal(createAddress.data.is_default, 1);

  const updatedAddressWithoutDefaultPayload = await requestJson(`/api/addresses/${createAddress.data.id}`, {
    method: 'PUT',
    token: firstUserToken,
    body: {
      title: 'Home Updated',
      type: 'delivery',
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
  assert.equal(updatedAddressWithoutDefaultPayload.data.is_default, 1);

  const ownAddresses = await requestJson(`/api/addresses/${firstUserId}`, { token: firstUserToken });
  assert.equal(ownAddresses.status, 200);
  assert.ok(Array.isArray(ownAddresses.data));
  assert.equal(ownAddresses.data.length, 1);

  const createPaymentMethod = await requestJson('/api/payment-methods', {
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

  assert.equal(createPaymentMethod.status, 201);
  assert.ok(createPaymentMethod.data && typeof createPaymentMethod.data.id === 'string');
  assert.equal(createPaymentMethod.data.user_id, firstUserId);
  assert.equal(createPaymentMethod.data.is_default, 1);

  const updatePaymentWithoutDefaultPayload = await requestJson(`/api/payment-methods/${createPaymentMethod.data.id}`, {
    method: 'PUT',
    token: firstUserToken,
    body: {
      cardTitle: 'Main Card Updated',
    },
  });

  assert.equal(updatePaymentWithoutDefaultPayload.status, 200);
  assert.equal(updatePaymentWithoutDefaultPayload.data.is_default, 1);

  const secondUserRegister = await requestJson('/api/register', {
    method: 'POST',
    body: {
      name: 'Integration User Two',
      email: `integration_user_2_${Date.now()}@example.com`,
      password: 'UserPass456A',
    },
  });

  assert.equal(secondUserRegister.status, 201);

  const secondUserToken = secondUserRegister.data.token;
  const firstUserAddressesAsOtherUser = await requestJson(`/api/addresses/${firstUserId}`, {
    token: secondUserToken,
  });
  assert.equal(firstUserAddressesAsOtherUser.status, 403);

  const firstUserPaymentMethodsAsOtherUser = await requestJson(`/api/payment-methods/${firstUserId}`, {
    token: secondUserToken,
  });
  assert.equal(firstUserPaymentMethodsAsOtherUser.status, 403);

  const usersAsAdmin = await requestJson('/api/users', { token: adminToken });
  assert.equal(usersAsAdmin.status, 200);
  assert.ok(Array.isArray(usersAsAdmin.data));
  assert.ok(usersAsAdmin.data.length >= 3);

  const ordersAsNormalUser = await requestJson('/api/orders', { token: firstUserToken });
  assert.equal(ordersAsNormalUser.status, 403);

  const ordersAsAdmin = await requestJson('/api/orders', { token: adminToken });
  assert.equal(ordersAsAdmin.status, 200);
  assert.ok(Array.isArray(ordersAsAdmin.data));

  const loadDemoAsAdminWhenDisabled = await requestJson('/api/load-demo-data', {
    method: 'POST',
    token: adminToken,
  });
  assert.equal(loadDemoAsAdminWhenDisabled.status, 404);
});
