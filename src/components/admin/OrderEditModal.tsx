import React from 'react';
import { Order, OrderPaymentStatus } from '@/services/apiService';
import {
  formatCurrency,
  paymentStatusBadgeClass,
} from '@/components/admin/orderAdminShared';

interface OrderEditModalProps {
  isOpen: boolean;
  order: Order | null;
  initialStatus: Order['status'] | null;
  paymentDetails: OrderPaymentStatus | null;
  isLoadingPaymentDetails: boolean;
  onClose: () => void;
  onOrderStatusChange: (status: Order['status']) => void;
  onShipmentDetailsChange: (updates: Partial<Pick<Order, 'shipmentProvider' | 'shipmentTrackingNumber'>>) => void;
  onUpdateFulfillment: () => void | Promise<void>;
}

const OrderEditModal: React.FC<OrderEditModalProps> = ({
  isOpen,
  order,
  initialStatus,
  paymentDetails,
  isLoadingPaymentDetails,
  onClose,
  onOrderStatusChange,
  onShipmentDetailsChange,
  onUpdateFulfillment,
}) => {
  if (!isOpen || !order) {
    return null;
  }

  const shipmentProvider = order.shipmentProvider || '';
  const shipmentTrackingNumber = order.shipmentTrackingNumber || '';
  const isShippingStatus = order.status === 'shipping';
  const isTransitioningToShipping =
    isShippingStatus &&
    initialStatus !== 'shipping' &&
    initialStatus !== 'delivered';
  const isCarrierManaged =
    order.status === 'delivered' ||
    (isShippingStatus && !isTransitioningToShipping) ||
    (order.fulfillmentSource === 'carrier' && !isTransitioningToShipping);
  const shippingDetailsMissing = isShippingStatus && (!shipmentProvider.trim() || !shipmentTrackingNumber.trim());
  const isFulfillmentUpdateDisabled = isCarrierManaged || shippingDetailsMissing;
  const paymentSnapshot = paymentDetails || {
    paymentStatus: order.paymentStatus,
    paymentProvider: order.paymentProvider,
    paymentReference: order.paymentReference,
    paymentAmount: order.paymentAmount,
    paymentCurrency: order.paymentCurrency,
    paymentFailedReason: order.paymentFailedReason,
    paidAt: order.paidAt,
    attempts: [],
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Order Fulfillment Details</h2>
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
                disabled={isCarrierManaged}
                className="w-full p-2 border border-gray-300 rounded bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="received">Order Received</option>
                <option value="preparing">Preparing</option>
                <option value="shipping">Shipping</option>
              </select>
              {isCarrierManaged && (
                <p className="mt-1 text-xs text-blue-700">
                  Carrier managed after shipping handoff. Delivered updates are webhook-driven.
                </p>
              )}
            </div>
          </div>

          {(isShippingStatus || shipmentProvider || shipmentTrackingNumber) && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Carrier</label>
                <input
                  type="text"
                  value={shipmentProvider}
                  onChange={(e) => onShipmentDetailsChange({ shipmentProvider: e.target.value })}
                  readOnly={isCarrierManaged}
                  className="w-full p-2 border border-gray-300 rounded bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 read-only:bg-gray-100 read-only:text-gray-600"
                  placeholder="e.g. ups"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tracking Number</label>
                <input
                  type="text"
                  value={shipmentTrackingNumber}
                  onChange={(e) => onShipmentDetailsChange({ shipmentTrackingNumber: e.target.value })}
                  readOnly={isCarrierManaged}
                  className="w-full p-2 border border-gray-300 rounded bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 read-only:bg-gray-100 read-only:text-gray-600"
                  placeholder="e.g. 1Z999AA10123456784"
                />
              </div>
            </div>
          )}

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
                  ? `${order.shippingAddress.address || ''}\n${order.shippingAddress.city || ''}, ${order.shippingAddress.province || ''} ${order.shippingAddress.postalCode || ''}`
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
              <h3 className="font-semibold text-gray-800">Payment Snapshot (Read-only)</h3>
              <span className={`${paymentStatusBadgeClass[paymentSnapshot.paymentStatus]} px-2 py-1 rounded-full text-xs`}>
                {paymentSnapshot.paymentStatus}
              </span>
            </div>

            {isLoadingPaymentDetails ? (
              <div className="text-sm text-gray-500">Loading payment details...</div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div className="p-2 border border-gray-200 rounded bg-white">
                    <div className="text-gray-500">Payment Mode</div>
                    <div className="font-medium text-gray-900">{order.paymentMode === 'purchase_order' ? 'Purchase Order' : 'Pending'}</div>
                  </div>
                  <div className="p-2 border border-gray-200 rounded bg-white">
                    <div className="text-gray-500">Payment Provider</div>
                    <div className="font-medium text-gray-900">{paymentSnapshot.paymentProvider || '-'}</div>
                  </div>
                  <div className="p-2 border border-gray-200 rounded bg-white">
                    <div className="text-gray-500">Payment Reference</div>
                    <div className="font-medium text-gray-900">{paymentSnapshot.paymentReference || '-'}</div>
                  </div>
                  <div className="p-2 border border-gray-200 rounded bg-white">
                    <div className="text-gray-500">Paid At</div>
                    <div className="font-medium text-gray-900">
                      {paymentSnapshot.paidAt ? new Date(paymentSnapshot.paidAt).toLocaleString() : '-'}
                    </div>
                  </div>
                  <div className="p-2 border border-gray-200 rounded bg-white">
                    <div className="text-gray-500">PO Number</div>
                    <div className="font-medium text-gray-900">{order.purchaseOrderNumber || '-'}</div>
                  </div>
                  <div className="p-2 border border-gray-200 rounded bg-white">
                    <div className="text-gray-500">Payment Amount</div>
                    <div className="font-medium text-gray-900">
                      {formatCurrency(paymentSnapshot.paymentAmount || order.totalAmount, paymentSnapshot.paymentCurrency || 'USD')}
                    </div>
                  </div>
                  <div className="p-2 border border-gray-200 rounded bg-white">
                    <div className="text-gray-500">Currency</div>
                    <div className="font-medium text-gray-900">{paymentSnapshot.paymentCurrency || 'USD'}</div>
                  </div>
                  <div className="p-2 border border-gray-200 rounded bg-white">
                    <div className="text-gray-500">Failure Reason</div>
                    <div className="font-medium text-gray-900">{paymentSnapshot.paymentFailedReason || '-'}</div>
                  </div>
                </div>

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
            onClick={onUpdateFulfillment}
            disabled={isFulfillmentUpdateDisabled}
            className="px-6 py-3 rounded-lg border border-kibo-purple text-kibo-purple hover:bg-kibo-orange hover:text-kibo-purple active:bg-kibo-orange active:text-kibo-purple transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isCarrierManaged ? 'Carrier Managed' : 'Update Order'}
          </button>
        </div>
        {shippingDetailsMissing && (
          <p className="mt-2 text-right text-xs text-red-600">
            Carrier and tracking number are required before setting status to shipping.
          </p>
        )}
      </div>
    </div>
  );
};

export default OrderEditModal;
