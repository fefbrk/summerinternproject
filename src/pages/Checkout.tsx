import { type Dispatch, type SetStateAction, useEffect, useMemo, useState } from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { useCart } from '../context/CartContext';
import { useUserData, type Address } from '../context/UserDataContext';
import { useAuth } from '../context/AuthContext';
import apiService, { type CreateOrderPayload, type OrderAddress } from '@/services/apiService';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMapMarkerAlt, faFileInvoiceDollar } from '@fortawesome/free-solid-svg-icons';
import KiboPhoto from '../assets/shop/kibo-shop-removebg-preview.png';
import { useToast } from '@/components/ui/use-toast';

type CheckoutAddressForm = {
  recipientName: string;
  phone: string;
  email: string;
  address: string;
  apartment: string;
  district: string;
  city: string;
  postalCode: string;
  province: string;
  country: string;
};

const EMPTY_ADDRESS_FORM: CheckoutAddressForm = {
  recipientName: '',
  phone: '',
  email: '',
  address: '',
  apartment: '',
  district: '',
  city: '',
  postalCode: '',
  province: '',
  country: 'Turkey',
};

const COUNTRIES = ['Turkey', 'United States'];
const PROVINCES: Record<string, string[]> = {
  Turkey: ['Adana', 'Ankara', 'Antalya', 'Bursa', 'Istanbul', 'Izmir', 'Konya', 'Samsun', 'Trabzon'],
  'United States': ['California', 'Florida', 'Illinois', 'Massachusetts', 'New York', 'Pennsylvania', 'Texas', 'Virginia', 'Washington'],
};

const mapAddressToForm = (address: Address): CheckoutAddressForm => ({
  recipientName: address.recipientName,
  phone: address.phone,
  email: address.email || '',
  address: address.address,
  apartment: address.apartment || '',
  district: address.district,
  city: address.city,
  postalCode: address.postalCode,
  province: address.province || '',
  country: address.country || 'Turkey',
});

const mapFormToPayload = (address: CheckoutAddressForm): OrderAddress => ({
  recipientName: address.recipientName.trim(),
  phone: address.phone.trim(),
  email: address.email.trim(),
  address: address.address.trim(),
  apartment: address.apartment.trim(),
  district: address.district.trim(),
  city: address.city.trim(),
  postalCode: address.postalCode.trim(),
  province: address.province.trim(),
  country: address.country.trim(),
});

const Checkout = () => {
  const { cartItems, getCartTotal, clearCart } = useCart();
  const { addresses, profileInfo } = useUserData();
  const { user, isInitializing } = useAuth();
  const navigate = useNavigate();
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [shipToDifferent, setShipToDifferent] = useState(false);
  const [paymentMode, setPaymentMode] = useState<CreateOrderPayload['paymentMode']>('pending');
  const [purchaseOrderNumber, setPurchaseOrderNumber] = useState('');
  const [orderNotes, setOrderNotes] = useState('');
  const [billingForm, setBillingForm] = useState<CheckoutAddressForm>(EMPTY_ADDRESS_FORM);
  const [shippingForm, setShippingForm] = useState<CheckoutAddressForm>(EMPTY_ADDRESS_FORM);
  const { toast: uiToast } = useToast();
  const toast = {
    success: (message: string) => uiToast({ title: 'Success', description: message }),
    error: (message: string) => uiToast({ title: 'Error', description: message }),
    info: (message: string) => uiToast({ title: 'Info', description: message }),
  };

  const getErrorMessage = (error: unknown, fallback: string): string => {
    return error instanceof Error ? error.message : fallback;
  };

  const billingAddresses = useMemo(() => addresses.filter((address) => address.type === 'billing'), [addresses]);
  const deliveryAddresses = useMemo(() => addresses.filter((address) => address.type === 'delivery'), [addresses]);
  const defaultBillingAddress = billingAddresses.find((address) => address.isDefault) || billingAddresses[0] || deliveryAddresses[0] || null;
  const defaultShippingAddress = deliveryAddresses.find((address) => address.isDefault) || deliveryAddresses[0] || billingAddresses[0] || null;
  const profileFullName = `${profileInfo?.firstName || ''} ${profileInfo?.lastName || ''}`.trim() || user?.name || '';

  useEffect(() => {
    if (defaultBillingAddress) {
      setBillingForm(mapAddressToForm(defaultBillingAddress));
    } else {
      setBillingForm((current) => ({
        ...current,
        recipientName: profileFullName || current.recipientName,
        email: profileInfo?.email || user?.email || current.email,
        phone: profileInfo?.phone || current.phone,
      }));
    }
  }, [defaultBillingAddress, profileFullName, profileInfo?.email, profileInfo?.phone, user?.email]);

  useEffect(() => {
    if (defaultShippingAddress) {
      setShippingForm(mapAddressToForm(defaultShippingAddress));
    } else {
      setShippingForm((current) => ({
        ...current,
        recipientName: profileFullName || current.recipientName,
        email: profileInfo?.email || user?.email || current.email,
        phone: profileInfo?.phone || current.phone,
      }));
    }
  }, [defaultShippingAddress, profileFullName, profileInfo?.email, profileInfo?.phone, user?.email]);

  const updateAddressForm = (
    setter: Dispatch<SetStateAction<CheckoutAddressForm>>,
    field: keyof CheckoutAddressForm,
    value: string,
  ) => {
    setter((current) => ({ ...current, [field]: value }));
  };

  const handleSavedAddressSelect = (addressId: string, type: 'billing' | 'shipping') => {
    const address = addresses.find((item) => item.id === addressId);
    if (!address) {
      return;
    }

    if (type === 'billing') {
      setBillingForm(mapAddressToForm(address));
      return;
    }

    setShippingForm(mapAddressToForm(address));
  };

  const { subtotal, discount } = getCartTotal();
  const payableTotal = subtotal;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isPlacingOrder) {
      return;
    }

    if (!user) {
      toast.error('You must login to place an order!');
      navigate('/login');
      return;
    }

    try {
      setIsPlacingOrder(true);
      toast.info('Creating order...');

      const shipping = mapFormToPayload(shipToDifferent ? shippingForm : billingForm);
      const billing = mapFormToPayload(billingForm);
      const payload: CreateOrderPayload = {
        items: cartItems.map((item) => ({
          id: String(item.id),
          name: item.name,
          quantity: item.quantity,
          price: item.price,
          image: item.image,
        })),
        totalAmount: subtotal,
        customer: {
          name: billing.recipientName,
          email: billing.email || user.email,
        },
        shipping,
        billing,
        orderNotes: orderNotes || '',
        paymentMode,
        purchaseOrderNumber: paymentMode === 'purchase_order' ? purchaseOrderNumber : '',
      };

      const newOrder = await apiService.createOrder(payload);
      clearCart();
      toast.success(`Order created successfully. Payment is still pending. Order No: #${newOrder.id}`);
      navigate('/account/orders');
    } catch (error) {
      console.error('Order creation failed:', error);
      toast.error(getErrorMessage(error, 'An error occurred while creating the order.'));
    } finally {
      setIsPlacingOrder(false);
    }
  };

  const renderAddressSection = (
    title: string,
    form: CheckoutAddressForm,
    setter: Dispatch<SetStateAction<CheckoutAddressForm>>,
    savedAddresses: Address[],
    type: 'billing' | 'shipping',
  ) => {
    const provinceOptions = PROVINCES[form.country] || [];

    return (
      <div className="bg-purple-200 rounded-lg shadow-lg p-6">
        <h3 className="text-2xl font-bold mb-6 flex items-center">
          <FontAwesomeIcon icon={faMapMarkerAlt} className="mr-3 text-kibo-orange" />
          {title}
        </h3>

        {savedAddresses.length > 0 && (
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Select Saved Address</label>
            <Select onValueChange={(value) => handleSavedAddressSelect(value, type)}>
              <SelectTrigger className="w-full bg-orange-50 border-orange-200">
                <SelectValue placeholder="Choose a saved address" />
              </SelectTrigger>
              <SelectContent className="bg-orange-50">
                {savedAddresses.map((address) => (
                  <SelectItem key={address.id} value={address.id}>
                    {address.title} - {address.recipientName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Recipient Name</label>
            <Input value={form.recipientName} onChange={(e) => updateAddressForm(setter, 'recipientName', e.target.value)} className="bg-orange-50 border-orange-200" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
            <Input value={form.phone} onChange={(e) => updateAddressForm(setter, 'phone', e.target.value)} className="bg-orange-50 border-orange-200" />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
            <Input type="email" value={form.email} onChange={(e) => updateAddressForm(setter, 'email', e.target.value)} className="bg-orange-50 border-orange-200" />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">Street Address</label>
            <Input value={form.address} onChange={(e) => updateAddressForm(setter, 'address', e.target.value)} className="mb-2 bg-orange-50 border-orange-200" />
            <Input value={form.apartment} onChange={(e) => updateAddressForm(setter, 'apartment', e.target.value)} placeholder="Apartment / suite (optional)" className="bg-orange-50 border-orange-200" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Country / Region</label>
            <select
              value={form.country}
              onChange={(e) => setter((current) => ({ ...current, country: e.target.value, province: '' }))}
              className="w-full p-2 border border-orange-200 rounded-md bg-orange-50"
            >
              {COUNTRIES.map((country) => (
                <option key={country} value={country}>{country}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Province / State</label>
            <select
              value={form.province}
              onChange={(e) => updateAddressForm(setter, 'province', e.target.value)}
              className="w-full p-2 border border-orange-200 rounded-md bg-orange-50"
            >
              <option value="">Select Province</option>
              {provinceOptions.map((province) => (
                <option key={province} value={province}>{province}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">District</label>
            <Input value={form.district} onChange={(e) => updateAddressForm(setter, 'district', e.target.value)} className="bg-orange-50 border-orange-200" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">City</label>
            <Input value={form.city} onChange={(e) => updateAddressForm(setter, 'city', e.target.value)} className="bg-orange-50 border-orange-200" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Postal Code</label>
            <Input value={form.postalCode} onChange={(e) => updateAddressForm(setter, 'postalCode', e.target.value)} className="bg-orange-50 border-orange-200" />
          </div>
        </div>
      </div>
    );
  };

  if (isInitializing) {
    return (
      <div className="flex flex-col min-h-screen bg-orange-50">
        <Header />
        <main className="flex-grow container mx-auto px-4 py-8">
          <div className="text-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading...</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (cartItems.length === 0) {
    return (
      <div className="flex flex-col min-h-screen bg-orange-50">
        <Header />
        <main className="flex-grow container mx-auto px-4 py-8">
          <div className="text-center py-20">
            <p className="text-2xl text-gray-500 mb-4">Your cart is empty.</p>
            <Link to="/shop">
              <Button size="lg" className="bg-kibo-orange hover:bg-kibo-orange/90">Start Shopping</Button>
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-orange-50">
      <Header />
      <main className="flex-grow">
        <div className="bg-gradient-to-r from-kibo-purple to-kibo-orange overflow-hidden">
          <div className="container mx-auto px-4 flex items-center h-64 overflow-hidden">
            <div className="w-2/3">
              <h2 className="text-3xl font-bold text-white mb-4">Checkout</h2>
              <p className="text-white/90 mb-6">
                Orders are created now, but payment capture is intentionally disabled until a payment provider is selected.
                Your order will remain in <strong>payment pending</strong> status.
              </p>
            </div>
            <div className="w-1/3 flex justify-end items-center h-full">
              <img src={KiboPhoto} alt="KIBO Robot" className="max-h-[110%] w-auto object-contain" />
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 py-8 checkout-container">
          <div className="flex flex-col lg:flex-row gap-8 lg:items-start">
            <div className="flex-1 lg:w-2/3">
              <form id="checkout-form" onSubmit={handleSubmit} className="space-y-8">
                {renderAddressSection('Billing Contact', billingForm, setBillingForm, billingAddresses.length > 0 ? billingAddresses : addresses, 'billing')}

                <div className="bg-purple-200 rounded-lg shadow-lg p-6">
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={shipToDifferent}
                      onChange={(e) => setShipToDifferent(e.target.checked)}
                      className="mr-3 w-4 h-4 text-kibo-orange bg-orange-50 border-orange-200 rounded focus:ring-kibo-orange focus:ring-2"
                    />
                    <span className="text-sm font-medium text-kibo-purple">Ship to a different address</span>
                  </label>
                </div>

                {shipToDifferent && renderAddressSection('Shipping Contact', shippingForm, setShippingForm, deliveryAddresses.length > 0 ? deliveryAddresses : addresses, 'shipping')}

                <div className="bg-purple-200 rounded-lg shadow-lg p-6 space-y-6">
                  <h3 className="text-2xl font-bold flex items-center">
                    <FontAwesomeIcon icon={faFileInvoiceDollar} className="mr-3 text-kibo-orange" />
                    Payment Intent
                  </h3>

                  <div className="rounded-lg border border-orange-300 bg-orange-50 p-4 text-sm text-gray-800">
                    No credit card, CVV, PayPal, or stored payment data is collected before PSP selection.
                  </div>

                  <div className="space-y-3">
                    <label className="flex items-start gap-3 rounded-lg border border-orange-200 bg-orange-50 p-4 cursor-pointer">
                      <input type="radio" name="paymentMode" value="pending" checked={paymentMode === 'pending'} onChange={() => setPaymentMode('pending')} />
                      <div>
                        <p className="font-semibold text-kibo-purple">Payment Pending</p>
                        <p className="text-sm text-gray-600">Create the order now and complete payment after the provider goes live or via offline follow-up.</p>
                      </div>
                    </label>
                    <label className="flex items-start gap-3 rounded-lg border border-orange-200 bg-orange-50 p-4 cursor-pointer">
                      <input type="radio" name="paymentMode" value="purchase_order" checked={paymentMode === 'purchase_order'} onChange={() => setPaymentMode('purchase_order')} />
                      <div>
                        <p className="font-semibold text-kibo-purple">Purchase Order</p>
                        <p className="text-sm text-gray-600">Use this if your organization will send an offline purchase order or invoice reference.</p>
                      </div>
                    </label>
                  </div>

                  {paymentMode === 'purchase_order' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Purchase Order Number</label>
                      <Input value={purchaseOrderNumber} onChange={(e) => setPurchaseOrderNumber(e.target.value)} className="bg-orange-50 border-orange-200" />
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Order Notes</label>
                    <textarea
                      value={orderNotes}
                      onChange={(e) => setOrderNotes(e.target.value)}
                      rows={4}
                      className="w-full p-2 border border-orange-200 rounded-md bg-orange-50"
                      placeholder="Notes about your order, delivery, or internal reference"
                    />
                  </div>
                </div>
              </form>
            </div>

            <div className="w-full lg:w-1/3">
              <div className="bg-purple-200 rounded-lg shadow-lg p-6 lg:sticky lg:top-4 flex flex-col max-h-[calc(170vh-0rem)]">
                <h3 className="text-2xl font-bold mb-6 flex-shrink-0">Order Summary</h3>

                <div className="flex-grow space-y-4 mb-6 overflow-y-auto pr-2">
                  {cartItems.map((item) => (
                    <div key={item.id} className="flex items-start gap-3 p-2 border rounded-lg bg-orange-50">
                      <img src={item.image} alt={item.name} className="w-12 h-12 object-cover rounded flex-shrink-0" />
                      <div className="flex-grow min-w-0">
                        <h4 className="font-semibold text-sm leading-tight">{item.name}</h4>
                        <p className="text-gray-600 text-xs">Qty: {item.quantity}</p>
                        <p className="font-bold text-kibo-purple text-sm">${item.price.toFixed(2)}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex-shrink-0">
                  <div className="rounded-lg border border-orange-300 bg-orange-50 p-4 mb-4 text-sm text-gray-700">
                    Payment status after order creation: <strong>Pending</strong>
                  </div>
                  <div className="space-y-2 border-t pt-4">
                    <div className="flex justify-between"><span className="text-gray-600">Subtotal</span><span className="font-semibold">${subtotal.toFixed(2)}</span></div>
                    {discount > 0 && <div className="rounded border border-orange-200 bg-white px-3 py-2 text-xs text-orange-900">Coupon discounts are not finalized server-side yet and are excluded from the pending-payment order total.</div>}
                    <div className="flex justify-between"><span className="text-gray-600">Shipping</span><span className="font-semibold">Calculated offline</span></div>
                    <div className="flex justify-between"><span className="text-gray-600">Tax</span><span className="font-semibold">Calculated offline</span></div>
                    <div className="flex justify-between text-xl font-bold mt-4 pt-4 border-t"><span>Total</span><span>${payableTotal.toFixed(2)}</span></div>
                  </div>

                  <Button
                    type="submit"
                    form="checkout-form"
                    size="lg"
                    className="w-full py-3 mt-4 text-lg font-semibold bg-kibo-orange text-kibo-purple rounded-lg hover:bg-kibo-purple hover:text-white transition-colors duration-300"
                    disabled={isPlacingOrder}
                  >
                    {isPlacingOrder ? 'CREATING ORDER...' : 'CREATE ORDER'}
                  </Button>
                  <p className="text-xs text-gray-500 mt-4 text-center">
                    This flow creates the order only. Payment capture will be connected after PSP selection.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Checkout;
