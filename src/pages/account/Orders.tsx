import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Package } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import apiService, { Order } from '@/services/apiService';

const getStatusInfo = (status: string) => {
  const statusMap: { [key: string]: { label: string; color: string } } = {
    'received': { label: 'Order Received', color: 'bg-blue-100 text-blue-800' },
    'preparing': { label: 'Preparing', color: 'bg-orange-100 text-orange-800' },
    'shipping': { label: 'On the Way', color: 'bg-purple-100 text-purple-800' },
    'delivered': { label: 'Delivered', color: 'bg-green-100 text-green-800' },
  };
  return statusMap[status] || { label: 'Unknown', color: 'bg-gray-100 text-gray-800' };
};

const Orders = () => {
  const { user, isInitializing } = useAuth();
  const [selectedOrder, setSelectedOrder] = useState<string | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);

  // Load orders from backend
  useEffect(() => {
    const loadOrders = async () => {
      if (user && !isInitializing) {
        setLoading(true);
        try {
          const userOrders = await apiService.getMyOrders();
          setOrders(userOrders);
        } catch (error) {
          console.error('Error loading orders:', error);
        } finally {
          setLoading(false);
        }
      }
    };

    loadOrders();
  }, [user, isInitializing]);

  const formatDate = (dateString: string) => {
    if (!dateString) return 'No Date';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <Card className="bg-purple-200">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Package className="h-5 w-5" />
          My Orders
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isInitializing ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading orders...</p>
          </div>
        ) : loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading orders...</p>
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-8">
            <h3 className="text-lg font-semibold mb-2">No orders yet</h3>
            <p className="text-gray-600 mb-4">Visit our store to start shopping.</p>
            <Button 
              onClick={() => window.location.href = '/shop'}
              className="px-6 py-3 rounded-lg border border-kibo-purple text-kibo-purple bg-transparent hover:bg-kibo-orange hover:text-kibo-purple active:bg-kibo-orange active:text-kibo-purple transition-colors cursor-pointer"
            >
              Start Shopping
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            {orders.map((order) => {
              const statusInfo = getStatusInfo(order.status);
              
              return (
                <Card key={order.id} className="border-l-4 bg-orange-50 border-l-purple-500">
                  <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row md:items-center justify-between mb-4">
                      <div>
                        <h3 className="font-semibold text-lg text-purple-800">Order #{order.id.slice(-8)}</h3>
                        <p className="text-sm text-gray-600">{formatDate(order.createdAt)}</p>
                        <p className="text-sm text-gray-600">Customer: {order.customerName}</p>
                        <p className="text-sm text-gray-600">Payment: {order.paymentMode === 'purchase_order' ? 'Purchase Order' : 'Pending'}</p>
                      </div>
                      <div className="flex items-center gap-4 mt-2 md:mt-0">
                        <div className="flex flex-col items-end gap-2">
                          <Badge className={statusInfo.color}>
                            {statusInfo.label}
                          </Badge>
                          <Badge className={order.paymentStatus === 'paid' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}>
                            {order.paymentStatus}
                          </Badge>
                          <span className="font-semibold text-xl text-orange-600">${order.totalAmount.toFixed(2)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Status Progress Bar */}
                    <div className="my-6">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">Order Status</span>
                        <span className="text-sm text-gray-600">{statusInfo.label}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-purple-500 h-2 rounded-full transition-all duration-300"
                          style={{
                            width: order.status === 'received' ? '25%' :
                                   order.status === 'preparing' ? '50%' :
                                   order.status === 'shipping' ? '75%' :
                                   order.status === 'delivered' ? '100%' : '0%'
                          }}
                        ></div>
                      </div>
                      <div className="flex justify-between text-xs text-gray-500 mt-1">
                        <span>Order Received</span>
                        <span>Preparing</span>
                        <span>On the Way</span>
                        <span>Delivered</span>
                      </div>
                    </div>

                    <div className="space-y-2 mb-4">
                      <h4 className="font-medium text-gray-700">Order Contents:</h4>
                      {order.items.map((item, idx) => (
                        <div key={idx} className="flex justify-between items-center py-2 border-b last:border-b-0">
                          <div className="flex items-center">
                            <img src={item.image} alt={item.name} className="w-12 h-12 object-cover rounded mr-4" />
                            <div>
                              <span className="font-medium">{item.name}</span>
                              <span className="text-gray-600 ml-2 text-sm">x{item.quantity}</span>
                            </div>
                          </div>
                          <span className="font-medium">${(item.price * item.quantity).toFixed(2)}</span>
                        </div>
                      ))}
                    </div>

                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => setSelectedOrder(selectedOrder === order.id ? null : order.id)}
                        className="px-6 py-3 rounded-lg border border-kibo-purple text-kibo-purple bg-transparent hover:bg-kibo-orange hover:text-kibo-purple active:bg-kibo-orange active:text-kibo-purple transition-colors cursor-pointer"
                      >
                        {selectedOrder === order.id ? 'Hide Details' : 'View Details'}
                      </Button>
                    </div>

                    {selectedOrder === order.id && (
                      <div className="mt-4 p-4 bg-purple-50 rounded-lg border">
                        <h4 className="font-semibold mb-3 text-purple-800">Order Details</h4>
                        <div className="text-sm space-y-3">
                           <div className="bg-orange-50 p-3 rounded border">
                             <p className="font-semibold text-gray-700 mb-2">Delivery Address:</p>
                            <p><strong>Recipient:</strong> {order.shippingAddress.recipientName}</p>
                            <p><strong>Phone:</strong> {order.shippingAddress.phone}</p>
                            <p><strong>Email:</strong> {order.shippingAddress.email || '-'}</p>
                            <p><strong>Address:</strong> {order.shippingAddress.address}</p>
                            {order.shippingAddress.apartment && <p><strong>Apartment:</strong> {order.shippingAddress.apartment}</p>}
                            <p><strong>District:</strong> {order.shippingAddress.district}</p>
                            <p><strong>City:</strong> {order.shippingAddress.city}</p>
                            <p><strong>State:</strong> {order.shippingAddress.province}</p>
                            <p><strong>Postal Code:</strong> {order.shippingAddress.postalCode}</p>
                          </div>
                          
                          <div className="bg-orange-50 p-3 rounded border">
                            <p className="font-semibold text-gray-700 mb-2">Order Summary:</p>
                            <p><strong>Order ID:</strong> #{order.id}</p>
                            <p><strong>Order Date:</strong> {formatDate(order.createdAt)}</p>
                            <p><strong>Total Amount:</strong> ${order.totalAmount.toFixed(2)}</p>
                            <p><strong>Payment Mode:</strong> {order.paymentMode === 'purchase_order' ? 'Purchase Order' : 'Pending Payment'}</p>
                            <p><strong>Payment Status:</strong> {order.paymentStatus}</p>
                            {order.purchaseOrderNumber && <p><strong>PO Number:</strong> {order.purchaseOrderNumber}</p>}
                            <p><strong>Number of Items:</strong> {order.items.length}</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default Orders;
