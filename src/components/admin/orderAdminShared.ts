import { Order } from '@/services/apiService';

export type OrderPaymentFormState = {
  paymentStatus: Order['paymentStatus'];
  paymentProvider: string;
  paymentReference: string;
  paymentAmount: string;
  paymentCurrency: string;
  paymentFailedReason: string;
};

export const createInitialOrderPaymentForm = (): OrderPaymentFormState => ({
  paymentStatus: 'pending',
  paymentProvider: 'manual',
  paymentReference: '',
  paymentAmount: '',
  paymentCurrency: 'USD',
  paymentFailedReason: '',
});

export const formatCurrency = (value: number, currency = 'USD') => {
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  } catch (_error) {
    return `$${value.toFixed(2)}`;
  }
};

export const paymentStatusBadgeClass: Record<Order['paymentStatus'], string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  paid: 'bg-green-100 text-green-800',
  failed: 'bg-red-100 text-red-800',
  refunded: 'bg-gray-100 text-gray-800',
};

export const fulfillmentStatusBadgeClass: Record<Order['status'], string> = {
  received: 'bg-blue-100 text-blue-800',
  preparing: 'bg-yellow-100 text-yellow-800',
  shipping: 'bg-purple-100 text-purple-800',
  delivered: 'bg-green-100 text-green-800',
};
