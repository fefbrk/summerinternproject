const DEFAULT_PAYMENT_CURRENCY = 'USD';

const createPaymentService = ({ database, uuidv4 }) => {
  if (!database) {
    throw new Error('database dependency is required');
  }

  if (typeof uuidv4 !== 'function') {
    throw new Error('uuidv4 dependency is required');
  }

  const createPendingAttempt = async ({ orderId, provider = 'unassigned', amount, currency = DEFAULT_PAYMENT_CURRENCY, metadata = {} }) => {
    const now = new Date().toISOString();

    return database.createPaymentAttempt({
      id: uuidv4(),
      orderId,
      provider,
      providerReference: null,
      amount,
      currency,
      status: 'pending',
      failureReason: null,
      metadata,
      createdAt: now,
      updatedAt: now,
    });
  };

  const markOrderAsPaid = async ({
    orderId,
    provider,
    providerReference,
    amount,
    currency = DEFAULT_PAYMENT_CURRENCY,
    providerEventId,
    providerEventType = 'payment.succeeded',
    providerPayload = {},
  }) => {
    const now = new Date().toISOString();

    if (providerEventId) {
      await database.savePaymentEvent({
        id: uuidv4(),
        provider,
        providerEventId,
        eventType: providerEventType,
        orderId,
        payload: providerPayload,
        processedAt: now,
      });
    }

    await database.createPaymentAttempt({
      id: uuidv4(),
      orderId,
      provider,
      providerReference: providerReference || null,
      amount,
      currency,
      status: 'succeeded',
      failureReason: null,
      metadata: { source: 'payment_service' },
      createdAt: now,
      updatedAt: now,
    });

    return database.updateOrderPayment(orderId, {
      paymentStatus: 'paid',
      paymentProvider: provider,
      paymentReference: providerReference || null,
      paymentAmount: amount,
      paymentCurrency: currency,
      paymentFailedReason: null,
      paidAt: now,
    });
  };

  const markOrderAsFailed = async ({
    orderId,
    provider,
    providerReference,
    amount,
    currency = DEFAULT_PAYMENT_CURRENCY,
    failureReason,
    providerEventId,
    providerEventType = 'payment.failed',
    providerPayload = {},
  }) => {
    const now = new Date().toISOString();

    if (providerEventId) {
      await database.savePaymentEvent({
        id: uuidv4(),
        provider,
        providerEventId,
        eventType: providerEventType,
        orderId,
        payload: providerPayload,
        processedAt: now,
      });
    }

    await database.createPaymentAttempt({
      id: uuidv4(),
      orderId,
      provider,
      providerReference: providerReference || null,
      amount,
      currency,
      status: 'failed',
      failureReason: failureReason || 'unknown',
      metadata: { source: 'payment_service' },
      createdAt: now,
      updatedAt: now,
    });

    return database.updateOrderPayment(orderId, {
      paymentStatus: 'failed',
      paymentProvider: provider,
      paymentReference: providerReference || null,
      paymentAmount: amount,
      paymentCurrency: currency,
      paymentFailedReason: failureReason || 'unknown',
      paidAt: null,
    });
  };

  return {
    createPendingAttempt,
    markOrderAsPaid,
    markOrderAsFailed,
  };
};

module.exports = createPaymentService;
