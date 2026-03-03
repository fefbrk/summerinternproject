const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');
const { v4: uuidv4 } = require('uuid');

const tempDbPath = path.join(
  os.tmpdir(),
  `kinderlab-db-transaction-test-${Date.now()}-${Math.random().toString(16).slice(2)}.db`
);

process.env.SQLITE_DB_PATH = tempDbPath;

const database = require('../database/database');

const testUser = {
  id: 'tx-user-1',
  email: 'tx-user@example.com',
  name: 'Transaction User',
  password: 'hashed-password-placeholder',
  isAdmin: 0,
  createdAt: new Date().toISOString(),
};

test.before(async () => {
  await database.connect();
  await database.runSchema();
  await database.createUser(testUser);
});

test.after(async () => {
  await database.close();

  const tempPaths = [
    tempDbPath,
    `${tempDbPath}-wal`,
    `${tempDbPath}-shm`,
    `${tempDbPath}-journal`,
  ];

  for (const filePath of tempPaths) {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  }
});

test('createOrder rolls back when any item insert fails', async () => {
  const orderId = uuidv4();

  await assert.rejects(() =>
    database.createOrder({
      id: orderId,
      userId: testUser.id,
      totalAmount: 149.9,
      status: 'received',
      customerName: 'Transaction User',
      customerEmail: testUser.email,
      shippingAddress: {
        name: 'Transaction User',
        phone: '+90-500-000-0000',
        address: 'Rollback Street 10',
        city: 'Istanbul',
        province: 'Istanbul',
        zipCode: '34000',
        country: 'Turkey',
      },
      createdAt: new Date().toISOString(),
      items: [
        {
          id: 'product-ok',
          name: 'Valid Product',
          quantity: 1,
          price: 99.9,
          image: '/image-1.png',
        },
        {
          id: 'product-bad',
          name: null,
          quantity: 1,
          price: 50,
          image: '/image-2.png',
        },
      ],
    })
  );

  const persistedOrder = await database.getOrderById(orderId);
  assert.equal(persistedOrder, undefined);

  const itemCount = await database.get('SELECT COUNT(*) as count FROM order_items WHERE order_id = ?', [orderId]);
  assert.equal(itemCount.count, 0);
});

test('createOrder commits order and all items when payload is valid', async () => {
  const orderId = uuidv4();

  await database.createOrder({
    id: orderId,
    userId: testUser.id,
    totalAmount: 229.8,
    status: 'received',
    customerName: 'Transaction User',
    customerEmail: testUser.email,
    shippingAddress: {
      name: 'Transaction User',
      phone: '+90-500-000-0000',
      address: 'Commit Street 42',
      city: 'Istanbul',
      province: 'Istanbul',
      zipCode: '34000',
      country: 'Turkey',
    },
    createdAt: new Date().toISOString(),
    items: [
      {
        id: 'product-1',
        name: 'KIBO Kit',
        quantity: 1,
        price: 199.9,
        image: '/image-3.png',
      },
      {
        id: 'product-2',
        name: 'Module Set',
        quantity: 1,
        price: 29.9,
        image: '/image-4.png',
      },
    ],
  });

  const persistedOrder = await database.getOrderById(orderId);
  assert.ok(persistedOrder);
  assert.equal(persistedOrder.id, orderId);
  assert.equal(Array.isArray(persistedOrder.items), true);
  assert.equal(persistedOrder.items.length, 2);
});

test('payment attempts and events are persisted with idempotent event logging', async () => {
  const orderId = uuidv4();

  const createdOrder = await database.createOrder({
    id: orderId,
    userId: testUser.id,
    totalAmount: 84,
    status: 'received',
    paymentStatus: 'pending',
    paymentAmount: 84,
    paymentCurrency: 'USD',
    customerName: 'Transaction User',
    customerEmail: testUser.email,
    shippingAddress: {
      name: 'Transaction User',
      phone: '+90-500-000-0000',
      address: 'Payment Street 99',
      city: 'Istanbul',
      province: 'Istanbul',
      zipCode: '34000',
      country: 'Turkey',
    },
    createdAt: new Date().toISOString(),
    items: [
      {
        id: 'learning-card',
        name: 'KIBO Coding Cards',
        quantity: 1,
        price: 84,
        image: '/image-5.png',
      },
    ],
  });

  assert.ok(createdOrder);
  assert.equal(createdOrder.paymentStatus, 'pending');

  const attemptId = uuidv4();
  const createdAttempt = await database.createPaymentAttempt({
    id: attemptId,
    orderId,
    provider: 'sandbox',
    providerReference: 'sandbox-ref-1',
    amount: 84,
    currency: 'USD',
    status: 'pending',
    failureReason: null,
    metadata: { source: 'test' },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  assert.ok(createdAttempt);
  assert.equal(createdAttempt.id, attemptId);
  assert.equal(createdAttempt.status, 'pending');

  const orderAttempts = await database.getPaymentAttemptsByOrderId(orderId);
  assert.equal(orderAttempts.length, 1);
  assert.equal(orderAttempts[0].id, attemptId);

  const firstEventSave = await database.savePaymentEvent({
    id: uuidv4(),
    provider: 'sandbox',
    providerEventId: 'event-123',
    eventType: 'payment.succeeded',
    orderId,
    payload: { paid: true },
    processedAt: new Date().toISOString(),
  });

  assert.equal(firstEventSave.created, true);
  assert.ok(firstEventSave.event);

  const duplicateEventSave = await database.savePaymentEvent({
    id: uuidv4(),
    provider: 'sandbox',
    providerEventId: 'event-123',
    eventType: 'payment.succeeded',
    orderId,
    payload: { paid: true },
    processedAt: new Date().toISOString(),
  });

  assert.equal(duplicateEventSave.created, false);
  assert.ok(duplicateEventSave.event);
  assert.equal(duplicateEventSave.event.providerEventId, 'event-123');
});
