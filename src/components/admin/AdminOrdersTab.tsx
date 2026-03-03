import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Order } from '@/services/apiService';
import {
  formatCurrency,
  fulfillmentStatusBadgeClass,
  paymentStatusBadgeClass,
} from '@/components/admin/orderAdminShared';

interface AdminOrdersTabProps {
  orders: Order[];
  orderSortField: keyof Order;
  orderSortDirection: 'asc' | 'desc';
  orderStatusFilter: 'all' | Order['status'];
  orderPaymentFilter: 'all' | Order['paymentStatus'];
  onSortOrders: (field: keyof Order) => void;
  onOrderStatusFilterChange: (value: 'all' | Order['status']) => void;
  onOrderPaymentFilterChange: (value: 'all' | Order['paymentStatus']) => void;
  onManageOrder: (order: Order) => void;
  onDeleteOrder: (order: Order) => void;
}

const AdminOrdersTab: React.FC<AdminOrdersTabProps> = ({
  orders,
  orderSortField,
  orderSortDirection,
  orderStatusFilter,
  orderPaymentFilter,
  onSortOrders,
  onOrderStatusFilterChange,
  onOrderPaymentFilterChange,
  onManageOrder,
  onDeleteOrder,
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Order Fulfillment Operations</CardTitle>
      </CardHeader>
      <CardContent className="p-2">
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <label htmlFor="orderStatusFilter" className="text-sm font-medium">Fulfillment:</label>
            <select
              id="orderStatusFilter"
              value={orderStatusFilter}
              onChange={(e) => onOrderStatusFilterChange(e.target.value as 'all' | Order['status'])}
              className="p-2 border border-gray-300 rounded bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All</option>
              <option value="received">Received</option>
              <option value="preparing">Preparing</option>
              <option value="shipping">Shipping</option>
              <option value="delivered">Delivered</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <label htmlFor="orderPaymentFilter" className="text-sm font-medium">Payment:</label>
            <select
              id="orderPaymentFilter"
              value={orderPaymentFilter}
              onChange={(e) => onOrderPaymentFilterChange(e.target.value as 'all' | Order['paymentStatus'])}
              className="p-2 border border-gray-300 rounded bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All</option>
              <option value="pending">Pending</option>
              <option value="paid">Paid</option>
              <option value="failed">Failed</option>
              <option value="refunded">Refunded</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto w-full">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-100">
                <th className="border p-2 text-left cursor-pointer" onClick={() => onSortOrders('id')}>
                  Order ID {orderSortField === 'id' && (orderSortDirection === 'asc' ? '↑' : '↓')}
                </th>
                <th className="border p-2 text-left cursor-pointer" onClick={() => onSortOrders('customerName')}>
                  Customer {orderSortField === 'customerName' && (orderSortDirection === 'asc' ? '↑' : '↓')}
                </th>
                <th className="border p-2 text-left cursor-pointer" onClick={() => onSortOrders('totalAmount')}>
                  Total {orderSortField === 'totalAmount' && (orderSortDirection === 'asc' ? '↑' : '↓')}
                </th>
                <th className="border p-2 text-left">Payment</th>
                <th className="border p-2 text-left">Payment Amount</th>
                <th className="border p-2 text-left">Payment Provider</th>
                <th className="border p-2 text-left">Carrier</th>
                <th className="border p-2 text-left">Tracking</th>
                <th className="border p-2 text-left cursor-pointer" onClick={() => onSortOrders('status')}>
                  Fulfillment {orderSortField === 'status' && (orderSortDirection === 'asc' ? '↑' : '↓')}
                </th>
                <th className="border p-2 text-left cursor-pointer" onClick={() => onSortOrders('createdAt')}>
                  Date {orderSortField === 'createdAt' && (orderSortDirection === 'asc' ? '↑' : '↓')}
                </th>
                <th className="border p-2 text-left">Items</th>
                <th className="border p-2 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {orders.length === 0 ? (
                <tr>
                  <td colSpan={12} className="border p-4 text-center text-gray-500">No orders found for selected filters</td>
                </tr>
              ) : (
                orders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50">
                    <td className="border p-2">{order.id}</td>
                    <td className="border p-2">
                      <div className="text-sm font-medium">{order.customerName}</div>
                      <div className="text-xs text-gray-500">{order.customerEmail}</div>
                    </td>
                    <td className="border p-2">{formatCurrency(order.totalAmount, order.paymentCurrency || 'USD')}</td>
                    <td className="border p-2">
                      <span className={`${paymentStatusBadgeClass[order.paymentStatus]} px-2 py-1 rounded-full text-xs`}>
                        {order.paymentStatus}
                      </span>
                    </td>
                    <td className="border p-2">{formatCurrency(order.paymentAmount || order.totalAmount, order.paymentCurrency || 'USD')}</td>
                    <td className="border p-2">{order.paymentProvider || '-'}</td>
                    <td className="border p-2">{order.shipmentProvider || '-'}</td>
                    <td className="border p-2">{order.shipmentTrackingNumber || '-'}</td>
                    <td className="border p-2">
                      <span className={`${fulfillmentStatusBadgeClass[order.status]} px-2 py-1 rounded-full text-xs`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="border p-2">{new Date(order.createdAt).toLocaleDateString('en-US')}</td>
                    <td className="border p-2">
                      <div className="max-h-20 overflow-y-auto text-xs">
                        {order.items.length > 0 ? (
                          order.items.map((item, idx) => (
                            <div key={idx} className="mb-1 p-1 bg-gray-50 rounded">
                              {item.quantity || 1}x {item.name || 'Unknown Product'} - {formatCurrency(item.price || 0, order.paymentCurrency || 'USD')}
                            </div>
                          ))
                        ) : (
                          <div className="text-gray-500">No items</div>
                        )}
                      </div>
                    </td>
                    <td className="border p-2">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => onManageOrder(order)}
                          className="px-3 py-1 bg-blue-500 text-white text-sm rounded hover:bg-blue-600 transition-colors"
                        >
                          Manage
                        </button>
                        <button
                          onClick={() => onDeleteOrder(order)}
                          className="px-3 py-1 bg-red-500 text-white text-sm rounded hover:bg-red-600 transition-colors"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
};

export default AdminOrdersTab;
