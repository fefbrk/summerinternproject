import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CreditCard, Plus, Edit, Trash2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useUserData, type PaymentMethod } from '@/context/UserDataContext';

const PaymentMethods = () => {
  const { paymentMethods, addPaymentMethod, updatePaymentMethod, deletePaymentMethod, setDefaultPaymentMethod } = useUserData();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingMethod, setEditingMethod] = useState<PaymentMethod | null>(null);
  const [formData, setFormData] = useState({
    cardTitle: '',
    cardNumber: '',
    expiryMonth: '',
    expiryYear: '',
    cvv: '',
    holderName: '',
  });

  const resetForm = () => {
    setFormData({
      cardTitle: '',
      cardNumber: '',
      expiryMonth: '',
      expiryYear: '',
      cvv: '',
      holderName: '',
    });
    setEditingMethod(null);
  };

  const getCardType = (cardNumber: string): 'visa' | 'mastercard' | 'amex' | 'unknown' => {
    const firstDigit = cardNumber.charAt(0);
    if (firstDigit === '4') return 'visa';
    if (firstDigit === '5') return 'mastercard';
    if (firstDigit === '3') return 'amex';
    return 'unknown';
  };

  const getCardIcon = (type: 'visa' | 'mastercard' | 'amex' | 'unknown') => {
    // This will have card icons in a real application
    const icons = {
      visa: '💳',
      mastercard: '💳',
      amex: '💳',
      unknown: '💳'
    };
    return icons[type];
  };

  const handleSave = () => {
    if (editingMethod) {
      // Edit existing method
      updatePaymentMethod(editingMethod.id, {
        title: formData.cardTitle || `Card **** ${formData.cardNumber.slice(-4)}`,
        cardName: formData.holderName,
        expiryDate: `${formData.expiryMonth}/${formData.expiryYear}`,
        cvv: formData.cvv,
      });
    } else {
      // Add new method
      addPaymentMethod({
        type: 'card',
        title: formData.cardTitle || `Card **** ${formData.cardNumber.slice(-4)}`,
        cardNumber: formData.cardNumber,
        expiryDate: `${formData.expiryMonth}/${formData.expiryYear}`,
        cardName: formData.holderName,
        cvv: formData.cvv,
        isDefault: false,
      });
    }
    
    setIsDialogOpen(false);
    resetForm();
  };

  const handleDelete = (id: string) => {
    deletePaymentMethod(id);
  };

  const handleSetDefault = (id: string) => {
    setDefaultPaymentMethod(id);
  };

  const formatCardNumber = (value: string) => {
    // Remove all non-digit characters
    const digits = value.replace(/\D/g, '');
    
    // Add spaces every 4 digits
    const formatted = digits.replace(/(\d{4})(?=\d)/g, '$1 ');
    
    return formatted.trim();
  };

  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCardNumber(e.target.value);
    if (formatted.replace(/\s/g, '').length <= 16) {
      setFormData({...formData, cardNumber: formatted.replace(/\s/g, '')});
    }
  };

  const generateMonthOptions = () => {
    return Array.from({ length: 12 }, (_, i) => {
      const month = (i + 1).toString().padStart(2, '0');
      return <SelectItem key={month} value={month}>{month}</SelectItem>;
    });
  };

  const generateYearOptions = () => {
    const currentYear = new Date().getFullYear();
    return Array.from({ length: 10 }, (_, i) => {
      const year = (currentYear + i).toString();
      return <SelectItem key={year} value={year}>{year}</SelectItem>;
    });
  };

  return (
      <Card className="bg-purple-200">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Payment Methods
            </CardTitle>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={resetForm} className="px-6 py-3 rounded-lg border border-kibo-purple text-kibo-purple bg-transparent hover:bg-kibo-orange hover:text-kibo-purple active:bg-kibo-orange active:text-kibo-purple transition-colors cursor-pointer">
                  <Plus className="h-4 w-4 mr-2" />
                  Add New Card
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md bg-purple-200">
                <DialogHeader>
                  <DialogTitle>
                    {editingMethod ? 'Edit Card' : 'Add New Card'}
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="cardTitle">Card Title</Label>
                    <Input
                      id="cardTitle"
                      value={formData.cardTitle}
                      onChange={(e) => setFormData({...formData, cardTitle: e.target.value})}
                      placeholder="e.g: My Business Card, Personal Card"
                      className="bg-orange-50"
                    />
                  </div>
                  <div>
                    <Label htmlFor="cardNumber">Card Number</Label>
                    <Input
                      id="cardNumber"
                      value={formatCardNumber(formData.cardNumber)}
                      onChange={handleCardNumberChange}
                      placeholder="1234 5678 9012 3456"
                      maxLength={19}
                      className="bg-orange-50"
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="expiryMonth">Month</Label>
                      <Select value={formData.expiryMonth} onValueChange={(value) => setFormData({...formData, expiryMonth: value})}>
                        <SelectTrigger className="bg-orange-50">
                          <SelectValue placeholder="MM" />
                        </SelectTrigger>
                        <SelectContent className="bg-orange-50">
                          {generateMonthOptions()}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="expiryYear">Year</Label>
                      <Select value={formData.expiryYear} onValueChange={(value) => setFormData({...formData, expiryYear: value})}>
                        <SelectTrigger className="bg-orange-50">
                          <SelectValue placeholder="YYYY" />
                        </SelectTrigger>
                        <SelectContent className="bg-orange-50">
                          {generateYearOptions()}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="cvv">CVV</Label>
                      <Input
                        id="cvv"
                        type="password"
                        value={formData.cvv}
                        onChange={(e) => setFormData({...formData, cvv: e.target.value.replace(/\D/g, '').slice(0, 4)})}
                        placeholder="123"
                        maxLength={4}
                        className="bg-orange-50"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="holderName">Cardholder Name</Label>
                    <Input
                      id="holderName"
                      value={formData.holderName}
                      onChange={(e) => setFormData({...formData, holderName: e.target.value})}
                      placeholder="John Doe"
                      className="bg-orange-50"
                    />
                  </div>

                  <div className="flex gap-2 pt-4">
                    <Button onClick={handleSave} className="flex-1 px-6 py-3 rounded-lg border border-kibo-purple text-kibo-purple bg-transparent hover:bg-kibo-orange hover:text-kibo-purple active:bg-kibo-orange active:text-kibo-purple transition-colors cursor-pointer">
                      {editingMethod ? 'Update' : 'Save'}
                    </Button>
                    <Button variant="outline" onClick={() => setIsDialogOpen(false)} className="px-6 py-3 rounded-lg border border-kibo-purple text-kibo-purple bg-transparent hover:bg-kibo-orange hover:text-kibo-purple active:bg-kibo-orange active:text-kibo-purple transition-colors cursor-pointer">
                      Cancel
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {paymentMethods.length === 0 ? (
            <div className="text-center py-8">
              <CreditCard className="h-16 w-16 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-semibold mb-2">No cards yet</h3>
              <p className="text-gray-600 mb-4">Click the button above to add your first card.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {paymentMethods.map((method) => {
                const cardType = method.cardNumber ? getCardType(method.cardNumber) : 'unknown';
                const cardIcon = getCardIcon(cardType);
                 
                return (
                  <Card key={method.id} className={`relative overflow-hidden ${method.isDefault ? 'ring-2 ring-kibo-orange' : ''} bg-gradient-to-br from-slate-800 via-slate-700 to-slate-600 text-white shadow-xl`}>
                    <CardContent className="p-6 relative">
                      {/* Decorative elements */}
                      <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-16 translate-x-16"></div>
                      <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-12 -translate-x-12"></div>
                      
                      <div className="flex items-start justify-between mb-6 relative z-10">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-8 bg-gradient-to-r from-yellow-400 to-yellow-600 rounded-md flex items-center justify-center">
                            <span className="text-xl">{cardIcon}</span>
                          </div>
                          <div>
                            <span className="text-sm font-medium tracking-wider">{method.title}</span>
                            {method.isDefault && (
                              <Badge variant="secondary" className="text-xs bg-kibo-orange text-white ml-2">
                                Default
                              </Badge>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-white/80 hover:text-white hover:bg-white/10 transition-colors"
                            onClick={() => {
                              setEditingMethod(method);
                              setFormData({
                                cardTitle: method.title || '',
                                cardNumber: method.cardNumber || '',
                                expiryMonth: method.expiryDate?.split('/')[0] || '',
                                expiryYear: method.expiryDate?.split('/')[1] || '',
                                cvv: method.cvv || '',
                                holderName: method.cardName || '',
                              });
                              setIsDialogOpen(true);
                            }}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-white/80 hover:text-white hover:bg-white/10 transition-colors"
                            onClick={() => handleDelete(method.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                      <div className="space-y-3 mb-6 relative z-10">
                        <p className="text-xl font-mono tracking-[0.2em] font-light">
                          •••• •••• •••• {method.cardNumber?.slice(-4)}
                        </p>
                        <div className="flex justify-between items-end">
                          <div>
                            <p className="text-xs uppercase tracking-wide opacity-70 mb-1">Cardholder</p>
                            <p className="text-sm font-medium">{method.cardName}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-xs uppercase tracking-wide opacity-70 mb-1">Expiry Date</p>
                            <p className="text-sm font-mono">
                              {method.expiryDate}
                            </p>
                          </div>
                        </div>
                      </div>

                      {!method.isDefault && (
                        <div className="pt-4 border-t border-white/10 relative z-10">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleSetDefault(method.id)}
                            className="w-full px-6 py-3 rounded-lg border border-kibo-purple text-kibo-purple bg-transparent hover:bg-kibo-orange hover:text-kibo-purple active:bg-kibo-orange active:text-kibo-purple transition-colors cursor-pointer"
                          >
                            Set as Default
                          </Button>
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

export default PaymentMethods;
