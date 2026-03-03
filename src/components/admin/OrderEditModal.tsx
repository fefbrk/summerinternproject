import React from 'react';
import { Order, OrderPaymentStatus } from '@/services/apiService';
import {
  formatCurrency,
  OrderPaymentFormState,
  paymentStatusBadgeClass,
} from '@/components/admin/orderAdminShared';

interface OrderEditModalProps {
  isOpen: boolean;
  order: Order | null;
  paymentDetails: OrderPaymentStatus | null;
  isLoadingPaymentDetails: boolean;
  isUpdatingPayment: boolean;
  paymentForm: OrderPaymentFormState;
  onClose: () => void;
  onOrderStatusChange: (status: Order['status']) => void;
  onPaymentFormChange: (updates: Partial<OrderPaymentFormState>) => void;
  onUpdatePayment: () => void | Promise<void>;
  onUpdateFulfillment: () => void | Promise<void>;
}

const OrderEditModal: React.FC<OrderEditModalProps> = ({
  isOpen,
  order,
  paymentDetails,
  isLoadingPaymentDetails,
  isUpdatingPayment,
  paymentForm,
  onClose,
  onOrderStatusChange,
  onPaymentFormChange,
  onUpdatePayment,
  onUpdateFulfillment,
}) => {
  if (!isOpen || !order) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Order & Payment Details</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            ✕
          </button>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Order ID</label>
              <input
                type="text"
                value={order.id}
                readOnly
                className="w-full p-2 border border-gray-300 rounded bg-gray-100 text-gray-600"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">User ID</label>
              <input
                type="text"
                value={order.userId}
                readOnly
                className="w-full p-2 border border-gray-300 rounded bg-gray-100 text-gray-600"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                value={order.status}
                onChange={(e) => onOrderStatusChange(e.target.value as Order['status'])}
                className="w-full p-2 border border-gray-300 rounded bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="received">Order Received</option>
                <option value="preparing">Preparing</option>
                <option value="shipping">Shipping</option>
                <option value="delivered">Delivered</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Customer Name</label>
              <input
                type="text"
                value={order.customerName}
                readOnly
                className="w-full p-2 border border-gray-300 rounded bg-gray-100 text-gray-600"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Customer Email</label>
              <input
                type="email"
                value={order.customerEmail}
                readOnly
                className="w-full p-2 border border-gray-300 rounded bg-gray-100 text-gray-600"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Total Amount</label>
              <input
                type="text"
                value={formatCurrency(order.totalAmount, order.paymentCurrency || 'USD')}
                readOnly
                className="w-full p-2 border border-gray-300 rounded bg-gray-100 text-gray-600"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Order Date</label>
              <input
                type="text"
                value={new Date(order.createdAt).toLocaleString()}
                readOnly
                className="w-full p-2 border border-gray-300 rounded bg-gray-100 text-gray-600"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Shipping Address</label>
            <textarea
              value={
                order.shippingAddress
                  ? `${order.shippingAddress.address || ''}\n${order.shippingAddress.city || ''}, ${order.shippingAddress.province || ''} ${order.shippingAddress.zipCode || ''}`
                  : 'No address information'
              }
              readOnly
              rows={3}
              className="w-full p-2 border border-gray-300 rounded bg-gray-100 text-gray-600 resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Order Items</label>
            <div className="border border-gray-300 rounded p-4 bg-gray-50 max-h-60 overflow-y-auto">
              {order.items.length > 0 ? (
                <div className="space-y-3">
                  {order.items.map((item, idx) => (
                    <div key={idx} className="bg-white p-3 rounded border">
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-2 text-sm">
                        <div>
                          <span className="font-medium text-gray-700">Product:</span>
                          <div className="text-gray-900">{item.name || 'Unknown Product'}</div>
                        </div>
                        <div>
                          <span className="font-medium text-gray-700">Quantity:</span>
                          <div className="text-gray-900">{item.quantity}</div>
                        </div>
                        <div>
                          <span className="font-medium text-gray-700">Unit Price:</span>
                          <div className="text-gray-900">{formatCurrency(item.price, order.paymentCurrency || 'USD')}</div>
                        </div>
                        <div>
                          <span className="font-medium text-gray-700">Total:</span>
                          <div className="text-gray-900 font-semibold">{formatCurrency(item.quantity * item.price, order.paymentCurrency || 'USD')}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-gray-500 text-center py-4">No items found</div>
              )}
            </div>
          </div>

          <div className="border border-gray-200 rounded p-4 bg-gray-50 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-gray-800">Payment Management</h3>
              <span className={`${paymentStatusBadgeClass[paymentForm.paymentStatus]} px-2 py-1 rounded-full text-xs`}>
                {paymentForm.paymentStatus}
              </span>
            </div>

            {isLoadingPaymentDetails ? (
              <div className="text-sm text-gray-500">Loading payment details...</div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Payment Status</label>
                    <select
                      value={paymentForm.paymentStatus}
                      onChange={(e) => onPaymentFormChange({ paymentStatus: e.target.value as Order['paymentStatus'] })}
                      className="w-full p-2 border border-gray-300 rounded bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="pending">Pending</option>
                      <option value="paid">Paid</option>
                      <option value="failed">Failed</option>
                      <option value="refunded">Refunded</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Provider</label>
                    <input
                      type="text"
                      value={paymentForm.paymentProvider}
                      onChange={(e) => onPaymentFormChange({ paymentProvider: e.target.value })}
                      className="w-full p-2 border border-gray-300 rounded bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Reference</label>
                    <input
                      type="text"
                      value={paymentForm.paymentReference}
                      onChange={(e) => onPaymentFormChange({ paymentReference: e.target.value })}
                      className="w-full p-2 border border-gray-300 rounded bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Payment Amount</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={paymentForm.paymentAmount}
                      onChange={(e) => onPaymentFormChange({ paymentAmount: e.target.value })}
                      className="w-full p-2 border border-gray-300 rounded bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Currency</label>
                    <input
                      type="text"
                      value={paymentForm.paymentCurrency}
                      onChange={(e) => onPaymentFormChange({ paymentCurrency: e.target.value.toUpperCase() })}
                      className="w-full p-2 border border-gray-300 rounded bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Paid At</label>
                    <input
                      type="text"
                      readOnly
                      value={paymentDetails?.paidAt ? new Date(paymentDetails.paidAt).toLocaleString() : '-'}
                      className="w-full p-2 border border-gray-300 rounded bg-gray-100 text-gray-600"
                    />
                  </div>
                </div>

                {paymentForm.paymentStatus === 'failed' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Failure Reason</label>
                    <textarea
                      rows={2}
                      value={paymentForm.paymentFailedReason}
                      onChange={(e) => onPaymentFormChange({ paymentFailedReason: e.target.value })}
                      className="w-full p-2 border border-gray-300 rounded bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                )}

                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Payment Attempts</h4>
                  {paymentDetails && paymentDetails.attempts.length > 0 ? (
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {paymentDetails.attempts.map((attempt) => {
                        const attemptClass =
                          attempt.status === 'succeeded'
                            ? 'bg-green-100 text-green-800'
                            : attempt.status === 'failed'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-yellow-100 text-yellow-800';

                        return (
                          <div key={attempt.id} className="p-2 rounded border bg-white text-xs">
                            <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
                              <span>{new Date(attempt.createdAt).toLocaleString()}</span>
                              <span className={`${attemptClass} px-2 py-1 rounded-full`}>{attempt.status}</span>
                            </div>
                            <div>
                              {attempt.provider} / {attempt.providerReference || '-'} / {formatCurrency(attempt.amount, attempt.currency)}
                            </div>
                            {attempt.failureReason && <div className="text-red-700 mt-1">Reason: {attempt.failureReason}</div>}
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-sm text-gray-500">No payment attempts yet.</div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>

        <div className="mt-6 flex justify-end space-x-2">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onUpdatePayment}
            disabled={isUpdatingPayment || isLoadingPaymentDetails}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors disabled:opacity-50"
          >
            {isUpdatingPayment ? 'Updating Payment...' : 'Update Payment'}
          </button>
          <button
            onClick={onUpdateFulfillment}
            className="px-6 py-3 rounded-lg border border-kibo-purple text-kibo-purple hover:bg-kibo-orange hover:text-kibo-purple active:bg-kibo-orange active:text-kibo-purple transition-colors cursor-pointer"
          >
            Update Fulfillment
          </button>
        </div>
      </div>
    </div>
  );
};

export default OrderEditModal;
