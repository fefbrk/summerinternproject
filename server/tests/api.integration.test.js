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
process.env.CARRIER_WEBHOOK_SECRET = 'carrier-webhook-test-secret';
process.env.ENABLE_MANUAL_FULFILLMENT_OVERRIDE = 'false';
process.env.SUPER_ADMIN_EMAILS = process.env.DEFAULT_ADMIN_EMAIL;

const { startServer } = require('../server');
const database = require('../database/database');

let server;
let baseUrl;

const requestJson = async (endpoint, options = {}) => {
  const headers = {
    ...(options.body ? { 'Content-Type': 'application/json' } : {}),
    ...(options.token ? { Authorization: `Bearer ${options.token}` } : {}),
    ...(options.headers || {}),
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
  assert.equal(createAddress.data.userId, firstUserId);
  assert.equal(createAddress.data.isDefault, 1);

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
  assert.equal(updatedAddressWithoutDefaultPayload.data.isDefault, 1);

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
  assert.equal(createPaymentMethod.data.userId, firstUserId);
  assert.equal(createPaymentMethod.data.isDefault, 1);

  const updatePaymentWithoutDefaultPayload = await requestJson(`/api/payment-methods/${createPaymentMethod.data.id}`, {
    method: 'PUT',
    token: firstUserToken,
    body: {
      cardTitle: 'Main Card Updated',
    },
  });

  assert.equal(updatePaymentWithoutDefaultPayload.status, 200);
  assert.equal(updatePaymentWithoutDefaultPayload.data.isDefault, 1);

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

test('content and status endpoints return full entities', async () => {
  const adminLogin = await requestJson('/api/login', {
    method: 'POST',
    body: {
      email: process.env.DEFAULT_ADMIN_EMAIL,
      password: process.env.DEFAULT_ADMIN_PASSWORD,
    },
  });

  assert.equal(adminLogin.status, 200);
  const adminToken = adminLogin.data.token;

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
  const adminToken = adminLogin.data.token;

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
  const nonAdminToken = regularUserRegister.data.token;

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
  const userToken = registerResponse.data.token;

  const orderPayload = {
    items: [
      { id: '2', name: 'Tampered Name', quantity: 1, price: 1, image: '/img-1.png' },
      { id: '209', name: 'Tampered Marker', quantity: 1, price: 1, image: '/img-2.png' },
    ],
    shippingAddress: {
      name: 'Order Integrity User',
      phone: '+1-555-100-2000',
      email: 'order_integrity@example.com',
      address: 'Integrity Street 1',
      city: 'Istanbul',
      province: 'Istanbul',
      zipCode: '34000',
      country: 'Turkey',
    },
    customerName: 'Order Integrity User',
    customerEmail: 'order_integrity@example.com',
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
  assert.equal(validTotalResponse.data.paymentStatus, 'pending');
  assert.equal(validTotalResponse.data.paymentAmount, 544);
  assert.equal(validTotalResponse.data.paymentCurrency, 'USD');
  assert.equal(validTotalResponse.data.items[0].name, 'KIBO 15 Kit');
  assert.equal(validTotalResponse.data.items[0].price, 495);
  assert.equal(validTotalResponse.data.items[1].name, 'Marker Extension Set');
  assert.equal(validTotalResponse.data.items[1].price, 49);

  const adminLogin = await requestJson('/api/login', {
    method: 'POST',
    body: {
      email: process.env.DEFAULT_ADMIN_EMAIL,
      password: process.env.DEFAULT_ADMIN_PASSWORD,
    },
  });

  assert.equal(adminLogin.status, 200);
  const adminToken = adminLogin.data.token;

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
  const anotherUserToken = anotherUserRegister.data.token;

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

  const carrierWebhookDelivered = await requestJson(`/webhooks/carrier/orders/${validTotalResponse.data.id}/status`, {
    method: 'POST',
    headers: {
      'x-carrier-webhook-secret': process.env.CARRIER_WEBHOOK_SECRET,
    },
    body: {
      provider: 'ups',
      providerEventId: 'carrier-event-1',
      status: 'delivered',
      trackingNumber: '1Z999AA10123456784',
    },
  });

  assert.equal(carrierWebhookDelivered.status, 200);
  assert.equal(carrierWebhookDelivered.data.duplicated, false);
  assert.equal(carrierWebhookDelivered.data.order.status, 'delivered');
  assert.equal(carrierWebhookDelivered.data.order.fulfillmentSource, 'carrier');

  const carrierWebhookDeliveredDuplicate = await requestJson(`/webhooks/carrier/orders/${validTotalResponse.data.id}/status`, {
    method: 'POST',
    headers: {
      'x-carrier-webhook-secret': process.env.CARRIER_WEBHOOK_SECRET,
    },
    body: {
      provider: 'ups',
      providerEventId: 'carrier-event-1',
      status: 'delivered',
      trackingNumber: '1Z999AA10123456784',
    },
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
});
