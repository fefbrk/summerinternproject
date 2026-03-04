const { z } = require('zod');

const nonEmptyString = (maxLength) => z.string().trim().min(1).max(maxLength);
const optionalTrimmedString = (maxLength) => z.string().trim().max(maxLength).optional().or(z.literal(''));

const loginSchema = z.object({
  email: z.string().trim().email().max(254),
  password: z.string().min(1).max(256),
  captchaToken: z.string().trim().max(4096).optional(),
});

const registerSchema = z.object({
  email: z.string().trim().email().max(254),
  name: nonEmptyString(120),
  password: z.string().min(8).max(128),
});

const userCreateSchema = z.object({
  email: z.string().trim().email().max(254),
  name: nonEmptyString(120),
  password: z.string().min(8).max(128),
  role: z.enum(['super_admin', 'admin', 'content_manager', 'support', 'user']).optional(),
});

const userRoleUpdateSchema = z.object({
  role: z.enum(['super_admin', 'admin', 'content_manager', 'support', 'user']),
});

const passwordChangeSchema = z.object({
  currentPassword: z.string().min(1).max(256),
  newPassword: z.string().min(8).max(128),
});

const orderItemSchema = z.object({
  id: nonEmptyString(80),
  quantity: z.number().int().min(1).max(100),
  image: z.string().trim().max(500).optional(),
}).passthrough();

const orderCreateSchema = z.object({
  items: z.array(orderItemSchema).min(1).max(100),
  totalAmount: z.number().positive().max(1000000),
  shippingAddress: z.object({
    name: nonEmptyString(120),
    phone: nonEmptyString(40),
    email: z.string().trim().email().max(254).optional().or(z.literal('')),
    address: nonEmptyString(300),
    city: nonEmptyString(120),
    province: optionalTrimmedString(120),
    zipCode: nonEmptyString(32),
    country: nonEmptyString(120),
  }),
  customerName: nonEmptyString(120),
  customerEmail: z.string().trim().email().max(254),
  orderNotes: z.string().trim().max(1000).optional(),
});

const registrationCreateSchema = z.object({
  courseName: nonEmptyString(200),
  registrationData: z.record(z.union([z.string().max(1000), z.number(), z.boolean()])).optional(),
  customerName: nonEmptyString(120),
  customerEmail: z.string().trim().email().max(254),
  customerPhone: nonEmptyString(40),
  shippingAddress: nonEmptyString(300),
  shippingCity: nonEmptyString(120),
  shippingState: optionalTrimmedString(120),
  shippingZipCode: nonEmptyString(32),
  billingAddress: nonEmptyString(300),
  billingCity: nonEmptyString(120),
  billingState: optionalTrimmedString(120),
  billingZipCode: nonEmptyString(32),
});

const contactCreateSchema = z.object({
  type: z.enum(['general', 'support', 'training', 'sales']),
  name: nonEmptyString(120),
  email: z.string().trim().email().max(254),
  subject: nonEmptyString(200),
  message: nonEmptyString(5000),
});

const addressCreateSchema = z.object({
  userId: nonEmptyString(64),
  title: nonEmptyString(120),
  type: z.enum(['delivery', 'billing']),
  address: nonEmptyString(300),
  apartment: optionalTrimmedString(120),
  district: nonEmptyString(120),
  city: nonEmptyString(120),
  postalCode: nonEmptyString(32),
  province: optionalTrimmedString(120),
  country: optionalTrimmedString(120),
  isDefault: z.boolean().optional(),
});

const addressUpdateSchema = addressCreateSchema.omit({ userId: true });

const paymentMethodCreateSchema = z.object({
  userId: nonEmptyString(64),
  cardTitle: nonEmptyString(120),
  cardNumber: z.string().trim().min(12).max(32),
  expiryMonth: z.string().trim().min(1).max(2),
  expiryYear: z.string().trim().min(2).max(4),
  holderName: nonEmptyString(120),
  isDefault: z.boolean().optional(),
});

const paymentMethodUpdateSchema = z.object({
  cardTitle: z.string().trim().max(120).optional(),
  cardNumber: z.string().trim().max(32).optional(),
  expiryMonth: z.string().trim().max(2).optional(),
  expiryYear: z.string().trim().max(4).optional(),
  holderName: z.string().trim().max(120).optional(),
  isDefault: z.boolean().optional(),
});

const privacyDeletionRequestSchema = z.object({
  reason: z.string().trim().max(500).optional(),
});

const validateRequestBody = (schema, payload) => {
  const parsed = schema.safeParse(payload);
  if (parsed.success) {
    return {
      success: true,
      data: parsed.data,
      errorMessage: '',
    };
  }

  const firstIssue = parsed.error.issues[0];
  const issuePath = firstIssue?.path?.length ? firstIssue.path.join('.') : 'payload';
  const message = firstIssue?.message || 'Invalid request payload';
  return {
    success: false,
    data: null,
    errorMessage: `${issuePath}: ${message}`,
  };
};

module.exports = {
  addressCreateSchema,
  addressUpdateSchema,
  contactCreateSchema,
  loginSchema,
  orderCreateSchema,
  passwordChangeSchema,
  paymentMethodCreateSchema,
  paymentMethodUpdateSchema,
  privacyDeletionRequestSchema,
  registerSchema,
  registrationCreateSchema,
  userCreateSchema,
  userRoleUpdateSchema,
  validateRequestBody,
};
