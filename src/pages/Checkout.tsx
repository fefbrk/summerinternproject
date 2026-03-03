import React, { useState, useEffect } from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { useCart } from '../context/CartContext';
import { useUserData } from '../context/UserDataContext';
import { useAuth } from '../context/AuthContext';
import apiService from '@/services/apiService';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMapMarkerAlt, faCreditCard } from '@fortawesome/free-solid-svg-icons';
import { library } from '@fortawesome/fontawesome-svg-core';
import { faCcVisa, faCcMastercard, faCcAmex, faCcDiscover, faCcPaypal } from '@fortawesome/free-brands-svg-icons';
import KiboPhoto from '../assets/shop/kibo-shop-removebg-preview.png';
import { useToast } from '@/components/ui/use-toast';

// FontAwesome ikonlarını kütüphaneye ekle
library.add(faCcVisa, faCcMastercard, faCcAmex, faCcDiscover, faCcPaypal);

const Checkout = () => {
  const { cartItems, getCartTotal, clearCart } = useCart();
  const { addresses, paymentMethods, profileInfo } = useUserData();
  const { user, isInitializing } = useAuth();
  const navigate = useNavigate();
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  // const [selectedAddressId, setSelectedAddressId] = useState<string>(''); // Unused
  // const [selectedPaymentMethodId, setSelectedPaymentMethodId] = useState<string>(''); // Unused
  const { toast: uiToast } = useToast();
  const toast = {
    success: (message: string) => uiToast({ title: 'Success', description: message }),
    error: (message: string) => uiToast({ title: 'Error', description: message }),
    info: (message: string) => uiToast({ title: 'Info', description: message }),
  };

  const getErrorMessage = (error: unknown, fallback: string): string => {
    return error instanceof Error ? error.message : fallback;
  };

  const profileFullName = `${profileInfo?.firstName || ''} ${profileInfo?.lastName || ''}`.trim();

  const handleAddressSelect = (addressId: string, type: 'billing' | 'shipping') => {
    const selectedAddress = addresses.find(addr => addr.id === addressId);
    if (selectedAddress) {
      if (type === 'billing') {
        setFormData(prev => ({
          ...prev,
          fullName: selectedAddress.name,
          phone: selectedAddress.phone,
          email: selectedAddress.email || '',
          address: selectedAddress.address,
          city: selectedAddress.city,
          zipCode: selectedAddress.postalCode,
          country: selectedAddress.country || 'Turkey',
          province: selectedAddress.province || selectedAddress.district
        }));
      } else if (type === 'shipping') {
        setFormData(prev => ({
          ...prev,
          shippingFullName: selectedAddress.name,
          shippingPhone: selectedAddress.phone,
          shippingEmail: selectedAddress.email || '',
          shippingAddress: selectedAddress.address,
          shippingCity: selectedAddress.city,
          shippingZipCode: selectedAddress.postalCode,
          shippingCountry: selectedAddress.country || 'Turkey',
          shippingProvince: selectedAddress.province || selectedAddress.district
        }));
      }
    }
  };

  const handlePaymentMethodSelect = (paymentMethodId: string) => {
    const selectedPaymentMethod = paymentMethods.find(pm => pm.id === paymentMethodId);
    if (selectedPaymentMethod && selectedPaymentMethod.type === 'card') {
      setFormData(prev => ({
        ...prev,
        cardNumber: selectedPaymentMethod.cardNumber || '',
        expiryDate: selectedPaymentMethod.expiryDate || '',
        cardName: selectedPaymentMethod.cardName || '',
        cvv: selectedPaymentMethod.cvv || '',
        paymentMethod: 'card'
      }));
    }
  };

  const [formData, setFormData] = useState({
    fullName: profileFullName || user?.name || '',
    email: profileInfo?.email || user?.email || '',
    phone: profileInfo?.phone || '',
    address: '',
    city: '',
    zipCode: '',
    country: '',
    province: '',
    cardNumber: '',
    expiryDate: '',
    cvv: '',
    cardName: '',
    companyName: profileInfo?.companyName || '',
    apartment: '',
    orderNotes: '',
    hearAbout: '',
    internalRequest: '',
    shipToDifferent: false,
    paymentMethod: 'card',
    savePaymentInfo: false,
    purchaseOrderNumber: '',
    // Shipping address fields
    shippingFullName: '',
    shippingCompanyName: '',
    shippingCountry: '',
    shippingAddress: '',
    shippingApartment: '',
    shippingCity: '',
    shippingProvince: '',
    shippingZipCode: '',
    shippingPhone: '',
    shippingEmail: ''
  });

  // Sadece Türkiye ve Amerika
  const countries = ['Turkey', 'United States'];

  // Province/State mapping for Turkey and USA
  const getProvinces = (country: string) => {
    const provinceMap: { [key: string]: string[] } = {
      'Turkey': ['Adana', 'Adıyaman', 'Afyonkarahisar', 'Ağrı', 'Amasya', 'Ankara', 'Antalya', 'Artvin', 'Aydın', 'Balıkesir', 'Bilecik', 'Bingöl', 'Bitlis', 'Bolu', 'Burdur', 'Bursa', 'Çanakkale', 'Çankırı', 'Çorum', 'Denizli', 'Diyarbakır', 'Edirne', 'Elazığ', 'Erzincan', 'Erzurum', 'Eskişehir', 'Gaziantep', 'Giresun', 'Gümüşhane', 'Hakkari', 'Hatay', 'Isparta', 'Mersin', 'İstanbul', 'İzmir', 'Kars', 'Kastamonu', 'Kayseri', 'Kırklareli', 'Kırşehir', 'Kocaeli', 'Konya', 'Kütahya', 'Malatya', 'Manisa', 'Kahramanmaraş', 'Mardin', 'Muğla', 'Muş', 'Nevşehir', 'Niğde', 'Ordu', 'Rize', 'Sakarya', 'Samsun', 'Siirt', 'Sinop', 'Sivas', 'Tekirdağ', 'Tokat', 'Trabzon', 'Tunceli', 'Şanlıurfa', 'Uşak', 'Van', 'Yozgat', 'Zonguldak', 'Aksaray', 'Bayburt', 'Karaman', 'Kırıkkale', 'Batman', 'Şırnak', 'Bartın', 'Ardahan', 'Iğdır', 'Yalova', 'Karabük', 'Kilis', 'Osmaniye', 'Düzce'],
      'United States': ['Alabama', 'Alaska', 'Arizona', 'Arkansas', 'California', 'Colorado', 'Connecticut', 'Delaware', 'Florida', 'Georgia', 'Hawaii', 'Idaho', 'Illinois', 'Indiana', 'Iowa', 'Kansas', 'Kentucky', 'Louisiana', 'Maine', 'Maryland', 'Massachusetts', 'Michigan', 'Minnesota', 'Mississippi', 'Missouri', 'Montana', 'Nebraska', 'Nevada', 'New Hampshire', 'New Jersey', 'New Mexico', 'New York', 'North Carolina', 'North Dakota', 'Ohio', 'Oklahoma', 'Oregon', 'Pennsylvania', 'Rhode Island', 'South Carolina', 'South Dakota', 'Tennessee', 'Texas', 'Utah', 'Vermont', 'Virginia', 'Washington', 'West Virginia', 'Wisconsin', 'Wyoming']
    };
    return provinceMap[country] || [];
  };

// Auto-fill form with saved address and payment data
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const { subtotal, discount, total } = getCartTotal();

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
      // Simulate payment processing
      toast.info('Processing order...');
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Create order in mock database
      const orderData = {
        items: cartItems.map(item => ({
          id: String(item.id),
          name: item.name,
          quantity: item.quantity,
          price: item.price,
          image: item.image
        })),
        totalAmount: total,
        shippingAddress: {
          name: formData.fullName,
          phone: formData.phone,
          email: formData.email,
          address: formData.address,
          city: formData.city,
          province: formData.province,
          zipCode: formData.zipCode,
          country: formData.country
        }
      };

      const newOrder = await apiService.createOrder({
        userId: user.id,
        items: orderData.items,
        totalAmount: orderData.totalAmount,
        shippingAddress: orderData.shippingAddress,
        customerName: formData.fullName,
        customerEmail: formData.email
      });

      // Clear cart
      clearCart();
      toast.success(`Order created successfully! Order No: #${newOrder.id}`);

      // Navigate to orders page
      navigate('/account/orders');
      
    } catch (error) {
      console.error('Order creation failed:', error);
      toast.error(getErrorMessage(error, 'An error occurred while creating the order.'));
    } finally {
      setIsPlacingOrder(false);
    }
  };

  // Auto-fill form with profile info when it changes
  useEffect(() => {
    if (profileInfo) {
      setFormData(prev => ({
        ...prev,
        fullName: profileFullName || prev.fullName,
        email: profileInfo.email || prev.email,
        phone: profileInfo.phone || prev.phone,
        companyName: profileInfo.companyName || prev.companyName,
      }));
    } else if (user) {
      // If no profile info but user is logged in, use user's name
      setFormData(prev => ({
        ...prev,
        fullName: user.name || prev.fullName,
        email: user.email || prev.email,
      }));
    }
  }, [profileInfo, profileFullName, user]);

  // Auto-fill form with saved address and payment method on component mount
  useEffect(() => {
    // Get first available address (not default)
    const firstAddress = addresses.length > 0 ? addresses[0] : null;
    const firstPaymentMethod = paymentMethods.length > 0 ? paymentMethods[0] : null;
    
    if (firstAddress) {
      setFormData(prev => ({
        ...prev,
        address: firstAddress.address,
        city: firstAddress.city,
        zipCode: firstAddress.postalCode,
        country: firstAddress.country || 'Turkey',
        province: firstAddress.province || firstAddress.district || ''
      }));
    }
    
    if (firstPaymentMethod && firstPaymentMethod.type === 'card') {
      setFormData(prev => ({
        ...prev,
        cardNumber: firstPaymentMethod.cardNumber || '',
        expiryDate: firstPaymentMethod.expiryDate || '',
        cardName: firstPaymentMethod.cardName || '',
        cvv: firstPaymentMethod.cvv || '',
        paymentMethod: 'card'
      }));
    }
  }, [addresses, paymentMethods]);

  // Show loading while checking authentication
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
              <Button size="lg" className="bg-kibo-orange hover:bg-kibo-orange/90">
                Start Shopping
              </Button>
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
        {/* Banner Section - Shop sayfasından alınan banner */}
        <div className="bg-gradient-to-r from-kibo-purple to-kibo-orange overflow-hidden">
          <div className="container mx-auto px-4 flex items-center h-64 overflow-hidden">
            <div className="w-2/3">
              <h2 className="text-3xl font-bold text-white mb-4">Secure Checkout</h2>
              <p className="text-white/90 mb-6">
                Complete your order securely. We use industry-standard encryption to protect your personal and payment information. Your KIBO robotics journey is just one step away!
              </p>

            </div>
            <div className="w-1/3 flex justify-end items-center h-full">
              <img src={KiboPhoto} alt="KIBO Robot" className="max-h-[110%] w-auto object-contain" />
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 py-8 checkout-container">
          <div className="flex flex-col lg:flex-row gap-8 lg:items-start">
            {/* Checkout Form */}
            <div className="flex-1 lg:w-2/3">
              <form onSubmit={handleSubmit} className="space-y-8">


                {/* Billing Details */}
                <div className="bg-purple-200 rounded-lg shadow-lg p-6">
                  <h3 className="text-2xl font-bold mb-6 flex items-center">
                    <FontAwesomeIcon icon={faMapMarkerAlt} className="mr-3 text-kibo-orange" />
                    Billing Details
                  </h3>
                  {addresses.length > 0 && (
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">Select Saved Billing Address</label>
                      <Select onValueChange={(value) => handleAddressSelect(value, 'billing')}>
                        <SelectTrigger className="w-full bg-orange-50 border-orange-200">
                          <SelectValue placeholder="Select Billing Address" />
                        </SelectTrigger>
                        <SelectContent className="bg-orange-50">
                          {addresses.map(addr => (
                            <SelectItem key={addr.id} value={addr.id}>
                              {addr.title} - {addr.address}, {addr.city}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                  
                  {/* Billing and delivery address same checkbox */}
                  <div className="mb-6 p-4 bg-orange-50 rounded-lg border-2 border-dashed border-orange-200">
                    <label className="flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={!formData.shipToDifferent}
                        onChange={(e) => setFormData(prev => ({ ...prev, shipToDifferent: !e.target.checked }))}
                        className="mr-3 w-4 h-4 text-kibo-orange bg-orange-50 border-orange-200 rounded focus:ring-kibo-orange focus:ring-2"
                      />
                      <span className="text-sm font-medium text-kibo-purple">My billing and shipping address are the same</span>
                    </label>
                    <p className="text-xs text-gray-600 mt-1 ml-7">Check this if your billing and shipping addresses are identical</p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">Full Name <span className="text-red-500">*</span></label>
                      <Input
                        type="text"
                        name="fullName"
                        value={formData.fullName}
                        onChange={handleInputChange}
                        required
                        className="w-full bg-orange-50 border-orange-200 focus:bg-orange-50 focus:border-orange-300"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Company Name</label>
                      <Input
                        type="text"
                        name="companyName"
                        value={formData.companyName}
                        onChange={handleInputChange}
                        className="w-full bg-orange-50 border-orange-200 focus:bg-orange-50 focus:border-orange-300"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Phone <span className="text-red-500">*</span></label>
                      <Input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        required
                        className="w-full bg-orange-50 border-orange-200 focus:bg-orange-50 focus:border-orange-300"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">Email <span className="text-red-500">*</span></label>
                      <Input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        required
                        className="w-full bg-orange-50 border-orange-200 focus:bg-orange-50 focus:border-orange-300"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Country / Region <span className="text-red-500">*</span></label>
                      <select
                        name="country"
                        value={formData.country}
                        onChange={(e) => {
                          const newCountry = e.target.value;
                          setFormData({...formData, country: newCountry, province: ''});
                          // Auto-fill province if Turkey is selected and we have address data
                          if (newCountry === 'Turkey' && addresses.length > 0) {
                            const firstAddress = addresses[0];
                            if (firstAddress.province || firstAddress.district) {
                              setFormData(prev => ({...prev, country: newCountry, province: firstAddress.province || firstAddress.district}));
                            }
                          }
                        }}
                        required
                        className="w-full p-2 border border-orange-200 rounded-md focus:ring-2 focus:ring-kibo-orange focus:border-transparent bg-orange-50"
                      >
                        <option value="">Select Country</option>
                        {countries.map(country => (
                          <option key={country} value={country}>{country}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Province <span className="text-red-500">*</span></label>
                      <select
                        name="province"
                        value={formData.province}
                        onChange={(e) => setFormData({...formData, province: e.target.value})}
                        required
                        disabled={!formData.country}
                        className="w-full p-2 border border-orange-200 rounded-md focus:ring-2 focus:ring-kibo-orange focus:border-transparent bg-orange-50"
                      >
                        <option value="">Select Province</option>
                        {getProvinces(formData.country).map(province => (
                          <option key={province} value={province}>{province}</option>
                        ))}
                      </select>
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">Street Address <span className="text-red-500">*</span></label>
                      <Input
                        type="text"
                        name="address"
                        value={formData.address}
                        onChange={handleInputChange}
                        placeholder="House number and street name"
                        required
                        className="w-full mb-2 bg-orange-50 border-orange-200 focus:bg-orange-50 focus:border-orange-300"
                      />
                      <Input
                        type="text"
                        name="apartment"
                        value={formData.apartment}
                        onChange={handleInputChange}
                        placeholder="Apartment, suite, unit, etc. (optional)"
                        className="w-full bg-orange-50 border-orange-200 focus:bg-orange-50 focus:border-orange-300"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Postcode / ZIP <span className="text-red-500">*</span></label>
                      <Input
                        type="text"
                        name="zipCode"
                        value={formData.zipCode}
                        onChange={handleInputChange}
                        required
                        className="w-full bg-orange-50 border-orange-200 focus:bg-orange-50 focus:border-orange-300"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Town / City <span className="text-red-500">*</span></label>
                      <Input
                        type="text"
                        name="city"
                        value={formData.city}
                        onChange={handleInputChange}
                        required
                        className="w-full bg-orange-50 border-orange-200 focus:bg-orange-50 focus:border-orange-300"
                      />
                    </div>

                  </div>
                </div>

                {/* Shipping Address - Only show if billing and shipping addresses are different */}
                {formData.shipToDifferent && (
                  <div className="bg-white rounded-lg shadow-lg p-6">
                    <h3 className="text-2xl font-bold mb-6 flex items-center">
                      <FontAwesomeIcon icon={faMapMarkerAlt} className="mr-3 text-kibo-orange" />
                      Shipping Address
                    </h3>
                      {addresses.length > 0 && (
                        <div className="mb-4">
                          <label className="block text-sm font-medium text-gray-700 mb-2">Select Saved Shipping Address</label>
                          <Select onValueChange={(value) => handleAddressSelect(value, 'shipping')}>
                            <SelectTrigger className="w-full bg-orange-50 border-orange-200">
                              <SelectValue placeholder="Select Shipping Address" />
                            </SelectTrigger>
                            <SelectContent className="bg-orange-50">
                              {addresses.map(addr => (
                                <SelectItem key={addr.id} value={addr.id}>
                                  {addr.title} - {addr.address}, {addr.city}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      )}
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="md:col-span-2">
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Full Name <span className="text-red-500">*</span>
                          </label>
                          <Input
                            type="text"
                            className="w-full bg-orange-50 border-orange-200 focus:bg-orange-50 focus:border-orange-300"
                            value={formData.shippingFullName}
                            onChange={(e) => setFormData({...formData, shippingFullName: e.target.value})}
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Company Name
                          </label>
                          <Input
                            type="text"
                            className="w-full bg-orange-50 border-orange-200 focus:bg-orange-50 focus:border-orange-300"
                            value={formData.shippingCompanyName}
                            onChange={(e) => setFormData({...formData, shippingCompanyName: e.target.value})}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Phone <span className="text-red-500">*</span>
                          </label>
                          <Input
                            type="tel"
                            className="w-full bg-orange-50 border-orange-200 focus:bg-orange-50 focus:border-orange-300"
                            value={formData.shippingPhone}
                            onChange={(e) => setFormData({...formData, shippingPhone: e.target.value})}
                            required
                          />
                        </div>
                        <div className="md:col-span-2">
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Email Address <span className="text-red-500">*</span>
                          </label>
                          <Input
                            type="email"
                            className="w-full bg-orange-50 border-orange-200 focus:bg-orange-50 focus:border-orange-300"
                            value={formData.shippingEmail}
                            onChange={(e) => setFormData({...formData, shippingEmail: e.target.value})}
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Country / Region <span className="text-red-500">*</span>
                          </label>
                          <select
                            className="w-full p-2 border border-orange-200 rounded-md focus:ring-2 focus:ring-kibo-orange focus:border-transparent bg-orange-50"
                            value={formData.shippingCountry}
                            onChange={(e) => {
                              setFormData({...formData, shippingCountry: e.target.value, shippingProvince: ''});
                            }}
                            required
                          >
                            <option value="">Select Country</option>
                            {countries.map(country => (
                              <option key={country} value={country}>{country}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Province <span className="text-red-500">*</span>
                          </label>
                          <select
                            className="w-full p-2 border border-orange-200 rounded-md focus:ring-2 focus:ring-kibo-orange focus:border-transparent bg-orange-50"
                            value={formData.shippingProvince}
                            onChange={(e) => setFormData({...formData, shippingProvince: e.target.value})}
                            required
                            disabled={!formData.shippingCountry}
                          >
                            <option value="">Select Province</option>
                            {getProvinces(formData.shippingCountry).map(province => (
                              <option key={province} value={province}>{province}</option>
                            ))}
                          </select>
                        </div>
                        <div className="md:col-span-2">
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Street Address <span className="text-red-500">*</span>
                          </label>
                          <Input
                            type="text"
                            placeholder="House number and street name"
                            className="w-full mb-2 bg-orange-50 border-orange-200 focus:bg-orange-50 focus:border-orange-300"
                            value={formData.shippingAddress}
                            onChange={(e) => setFormData({...formData, shippingAddress: e.target.value})}
                            required
                          />
                          <Input
                            type="text"
                            placeholder="Apartment, suite, unit, etc. (optional)"
                            className="w-full bg-orange-50 border-orange-200 focus:bg-orange-50 focus:border-orange-300"
                            value={formData.shippingApartment}
                            onChange={(e) => setFormData({...formData, shippingApartment: e.target.value})}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Postcode / ZIP <span className="text-red-500">*</span>
                          </label>
                          <Input
                            type="text"
                            className="w-full bg-orange-50 border-orange-200 focus:bg-orange-50 focus:border-orange-300"
                            value={formData.shippingZipCode}
                            onChange={(e) => setFormData({...formData, shippingZipCode: e.target.value})}
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Town / City <span className="text-red-500">*</span>
                          </label>
                          <Input
                            type="text"
                            className="w-full bg-orange-50 border-orange-200 focus:bg-orange-50 focus:border-orange-300"
                            value={formData.shippingCity}
                            onChange={(e) => setFormData({...formData, shippingCity: e.target.value})}
                            required
                          />
                        </div>
                      </div>
                  </div>
                )}

                {/* Order Notes */}
                <div className="bg-purple-200 rounded-lg shadow-lg p-6">
                  <h3 className="text-2xl font-bold mb-6">Order Notes</h3>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Order Notes</label>
                    <textarea
                      name="orderNotes"
                      value={formData.orderNotes}
                      onChange={(e) => setFormData(prev => ({ ...prev, orderNotes: e.target.value }))}
                      placeholder="Notes about your order, e.g. special notes for delivery."
                      rows={4}
                      className="w-full p-2 border border-orange-200 rounded-md focus:ring-2 focus:ring-kibo-orange focus:border-transparent bg-orange-50"
                    />
                  </div>
                  
                  <div className="mt-6 space-y-4 mb-6">
                    <div className="flex flex-col">
                      <label className="block text-sm font-medium text-gray-700 mb-2">How did you hear about KIBO? <span className="text-red-500">*</span></label>
                      <select
                        name="hearAbout"
                        value={formData.hearAbout}
                        onChange={handleInputChange}
                        required
                        className="w-full p-2 border border-orange-200 rounded-md focus:ring-2 focus:ring-kibo-orange focus:border-transparent h-10 bg-orange-50"
                      >
                        <option value="">| Select Option</option>
                        <option value="Advertisement">Advertisement</option>
                        <option value="Colleague">Colleague</option>
                        <option value="I'm not the decision maker">I'm not the decision maker</option>
                        <option value="Sales Person">Sales Person</option>
                        <option value="Tradeshow">Tradeshow</option>
                        <option value="Webinar">Webinar</option>
                        <option value="Unknown">Unknown</option>
                      </select>
                    </div>
                    <div className="flex flex-col">
                      <label className="block text-sm font-medium text-gray-700 mb-2">If this was an internal purchasing request, who requested it?</label>
                      <Input
                        type="text"
                        name="internalRequest"
                        value={formData.internalRequest}
                        onChange={handleInputChange}
                        className="w-full h-10 bg-orange-50 border-orange-200 focus:bg-orange-50 focus:border-orange-300"
                      />
                    </div>
                  </div>
                  
                  <div className="mt-6 p-4 bg-kibo-orange rounded-lg">
                    <h4 className="font-semibold text-white mb-2">Tax Exemption</h4>
                    <p className="text-sm text-white">
                      Tax exempt customers: We collect sales tax in MA, IL, and PA. If your organization is tax-exempt and you are in one of these states, you can register with us as tax exempt. To do so, please first create an account, then use the tools on the account page to upload your tax exempt number or certificate.
                    </p>
                  </div>
                </div>

                {/* Payment Information */}
                <div className="bg-purple-200 rounded-lg shadow-lg p-6">
                  <h3 className="text-2xl font-bold mb-6 flex items-center">
                    <FontAwesomeIcon icon={faCreditCard} className="mr-3 text-kibo-orange" />
                    Payment Information
                  </h3>
                  
                  {/* Saved Payment Methods Dropdown */}
                  {paymentMethods.length > 0 && (
                    <div className="mb-6">
                      <label className="block text-sm font-medium text-gray-700 mb-2">Select Saved Payment Method</label>
                      <Select onValueChange={(value) => handlePaymentMethodSelect(value)}>
                        <SelectTrigger className="w-full bg-orange-50 border-orange-200">
                          <SelectValue placeholder="Select Payment Method" />
                        </SelectTrigger>
                        <SelectContent className="bg-orange-50">
                          {paymentMethods.map(pm => (
                            <SelectItem key={pm.id} value={pm.id}>
                              {pm.title} {pm.cardNumber ? `(**** ${pm.cardNumber.slice(-4)})` : ''}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                  
                  {/* Payment Method Selection */}
                  <div className="space-y-4 mb-6">
                    <div className="flex items-center space-x-2">
                      <input
                        type="radio"
                        id="cards"
                        name="paymentMethod"
                        value="card"
                        checked={formData.paymentMethod === 'card'}
                        onChange={(e) => setFormData(prev => ({ ...prev, paymentMethod: e.target.value }))}
                        className="text-kibo-orange"
                      />
                      <label htmlFor="cards" className="text-sm font-medium text-gray-700">Cards</label>
                      <div className="flex space-x-2 ml-4">
                        <FontAwesomeIcon icon={['fab', 'cc-visa']} className="h-6 text-blue-600" />
                        <FontAwesomeIcon icon={['fab', 'cc-mastercard']} className="h-6 text-red-600" />
                        <FontAwesomeIcon icon={['fab', 'cc-amex']} className="h-6 text-blue-500" />
                        <FontAwesomeIcon icon={['fab', 'cc-discover']} className="h-6 text-orange-500" />
                      </div>
                    </div>
                  </div>
                  
                  {/* Card Payment Form */}
                  {formData.paymentMethod === 'card' && (
                    <div className="bg-kibo-orange p-6 rounded-lg mb-6">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-white mb-2">Card number</label>
                          <Input
                            type="text"
                            name="cardNumber"
                            value={formData.cardNumber}
                            onChange={handleInputChange}
                            placeholder="1234 1234 1234 1234"
                            required
                            className="w-full bg-orange-50 border-orange-200 focus:bg-orange-50 focus:border-orange-300"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-white mb-2">Expiration date</label>
                          <Input
                            type="text"
                            name="expiryDate"
                            value={formData.expiryDate}
                            onChange={handleInputChange}
                            placeholder="MM / YY"
                            required
                            className="w-full bg-orange-50 border-orange-200 focus:bg-orange-50 focus:border-orange-300"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-white mb-2">Security code</label>
                          <Input
                            type="password"
                            name="cvv"
                            value={formData.cvv}
                            onChange={handleInputChange}
                            placeholder="CVC"
                            required
                            className="w-full bg-orange-50 border-orange-200 focus:bg-orange-50 focus:border-orange-300"
                          />
                        </div>
                      </div>
                      
                      <div className="mt-4">
                        <label className="block text-sm font-medium text-white mb-2">Name on Card</label>
                        <Input
                          type="text"
                          name="cardName"
                          value={formData.cardName}
                          onChange={handleInputChange}
                          placeholder="John Doe"
                          required
                          className="w-full bg-orange-50 border-orange-200 focus:bg-orange-50 focus:border-orange-300"
                        />
                      </div>
                      
                      <div className="mt-4">
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            name="savePaymentInfo"
                            checked={formData.savePaymentInfo}
                            onChange={(e) => setFormData(prev => ({ ...prev, savePaymentInfo: e.target.checked }))}
                            className="mr-2"
                          />
                          <span className="text-sm text-white">Save payment information to my account for future purchases.</span>
                        </label>
                      </div>
                    </div>
                  )}
                  
                  {/* Purchase Order Option */}
                  <div className="flex items-center space-x-2 mb-4">
                    <input
                      type="radio"
                      id="purchase-order"
                      name="paymentMethod"
                      value="purchase-order"
                      checked={formData.paymentMethod === 'purchase-order'}
                      onChange={(e) => setFormData(prev => ({ ...prev, paymentMethod: e.target.value }))}
                      className="text-kibo-orange"
                    />
                    <label htmlFor="purchase-order" className="text-sm font-medium text-gray-700">Purchase Order (US Only)</label>
                  </div>
                  
                  {/* Purchase Order Form */}
                  {formData.paymentMethod === 'purchase-order' && (
                    <div className="bg-kibo-orange p-6 rounded-lg mb-6">
                      <p className="text-sm text-white mb-4">
                        Purchase orders are available for US customers only. After placing your order, please send a PDF of the purchase order to <a href="mailto:orders@kibocommerce.com" className="text-blue-200 underline">orders@kibocommerce.com</a>, or fax to 512.394.8001.
                      </p>
                      <div>
                        <label className="block text-sm font-medium text-white mb-2">
                          Purchase Order Number
                        </label>
                        <Input
                          type="text"
                          className="w-full"
                          value={formData.purchaseOrderNumber}
                          onChange={(e) => setFormData({...formData, purchaseOrderNumber: e.target.value})}
                          placeholder="Enter your PO number"
                        />
                      </div>
                    </div>
                  )}
                  
                  {/* PayPal Option */}
                  <div className="flex items-center space-x-2 mb-6">
                    <input
                      type="radio"
                      id="paypal"
                      name="paymentMethod"
                      value="paypal"
                      checked={formData.paymentMethod === 'paypal'}
                      onChange={(e) => setFormData(prev => ({ ...prev, paymentMethod: e.target.value }))}
                      className="text-kibo-orange"
                    />
                    <label htmlFor="paypal" className="text-sm font-medium text-gray-700 flex items-center">
                      PayPal
                      <FontAwesomeIcon icon={['fab', 'cc-paypal']} className="ml-2 h-5 text-blue-600" />
                    </label>
                  </div>
                  
                  {/* PayPal Form */}
                  {formData.paymentMethod === 'paypal' && (
                    <div className="bg-kibo-orange p-6 rounded-lg mb-6">
                      <p className="text-sm text-white mb-4">
                        You will be redirected to PayPal to complete your purchase securely.
                      </p>
                      <div className="flex items-center justify-center p-4 bg-white border border-gray-300 rounded-lg">
                         <FontAwesomeIcon icon={['fab', 'cc-paypal']} className="h-8 text-blue-600" />
                       </div>
                      <p className="text-xs text-white mt-2 text-center">
                        After clicking "Place Order", you will be redirected to PayPal to complete your payment.
                      </p>
                    </div>
                  )}
                  
                  {/* Privacy Policy */}
                  <div className="text-sm text-gray-600 mb-6">
                    Your personal data will be used to process your order, support your experience throughout this website, and for other purposes described in our{' '}
                    <a href="#" className="text-kibo-purple underline">privacy policy</a>.
                  </div>
                </div>
              </form>
            </div>

            {/* Order Summary */}
            <div className="w-full lg:w-1/3">
              <div className="bg-purple-200 rounded-lg shadow-lg p-6 lg:sticky lg:top-4 flex flex-col max-h-[calc(170vh-0rem)]">
                <h3 className="text-2xl font-bold mb-6 flex-shrink-0">Order Summary</h3>
                
                {/* Cart Items - Scrollable */}
                <div className="flex-grow space-y-4 mb-6 overflow-y-auto pr-2">
                  {cartItems.map(item => (
                    <div key={item.id} className="flex items-start gap-3 p-2 border rounded-lg">
                      <img src={item.image} alt={item.name} className="w-12 h-12 object-cover rounded flex-shrink-0" />
                      <div className="flex-grow min-w-0">
                        <h4 className="font-semibold text-sm leading-tight">{item.name}</h4>
                        <p className="text-gray-600 text-xs">Qty: {item.quantity}</p>
                        <p className="font-bold text-kibo-purple text-sm">${item.price.toFixed(2)}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Totals and Actions - Fixed at the bottom */}
                <div className="flex-shrink-0">
                  <div className="space-y-2 border-t pt-4">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Subtotal</span>
                      <span className="font-semibold">${subtotal.toFixed(2)}</span>
                    </div>
                    {discount > 0 && (
                      <div className="flex justify-between text-green-600">
                        <span>Discount</span>
                        <span className="font-semibold">-${discount.toFixed(2)}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-gray-600">Shipping</span>
                      <span className="font-semibold">FREE</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Tax</span>
                      <span className="font-semibold">FREE</span>
                    </div>
                    <div className="flex justify-between text-xl font-bold mt-4 pt-4 border-t">
                      <span>Total</span>
                      <span>${total.toFixed(2)}</span>
                    </div>
                  </div>

                  <Button 
                    type="submit" 
                    size="lg" 
                    className="w-full py-3 mt-4 text-lg font-semibold bg-kibo-orange text-kibo-purple rounded-lg hover:bg-kibo-purple hover:text-white transition-colors duration-300"
                    disabled={isPlacingOrder}
                  >
                    {isPlacingOrder ? 'PROCESSING...' : 'PLACE ORDER'}
                  </Button>
                  <p className="text-xs text-gray-500 mt-4 text-center">
                    By placing your order, you agree to our Terms of Service and Privacy Policy.
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
