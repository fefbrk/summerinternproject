import { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MapPin, Plus, Edit, Trash2, Home, Building2 } from 'lucide-react';
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
import { useUserData, type Address } from '@/context/UserDataContext';

const COUNTRIES = ['Turkey', 'United States'];
const PROVINCES: Record<string, string[]> = {
  Turkey: ['Adana', 'Ankara', 'Antalya', 'Bursa', 'Istanbul', 'Izmir', 'Konya', 'Samsun', 'Trabzon'],
  'United States': ['California', 'Florida', 'Illinois', 'Massachusetts', 'New York', 'Pennsylvania', 'Texas', 'Virginia', 'Washington'],
};

const EMPTY_FORM = {
  title: '',
  type: 'delivery' as Address['type'],
  recipientName: '',
  phone: '',
  email: '',
  address: '',
  apartment: '',
  district: '',
  city: '',
  postalCode: '',
  country: 'Turkey',
  province: '',
};

const Addresses = () => {
  const { addresses, addAddress, updateAddress, deleteAddress, setDefaultAddress } = useUserData();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);
  const [formData, setFormData] = useState(EMPTY_FORM);

  const provinceOptions = useMemo(() => PROVINCES[formData.country] || [], [formData.country]);

  const resetForm = () => {
    setFormData(EMPTY_FORM);
    setEditingAddress(null);
  };

  const openEditDialog = (address: Address) => {
    setEditingAddress(address);
    setFormData({
      title: address.title,
      type: address.type,
      recipientName: address.recipientName,
      phone: address.phone,
      email: address.email || '',
      address: address.address,
      apartment: address.apartment || '',
      district: address.district,
      city: address.city,
      postalCode: address.postalCode,
      country: address.country || 'Turkey',
      province: address.province || '',
    });
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    const payload = {
      ...formData,
      email: formData.email || undefined,
      apartment: formData.apartment || undefined,
      province: formData.province || undefined,
      isDefault: editingAddress ? editingAddress.isDefault : addresses.length === 0,
    };

    if (editingAddress) {
      await updateAddress(editingAddress.id, payload);
    } else {
      await addAddress(payload);
    }

    setIsDialogOpen(false);
    resetForm();
  };

  const getAddressIcon = (type: Address['type']) => {
    return type === 'delivery' ? Home : Building2;
  };

  return (
    <Card className="bg-purple-200">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            My Addresses
          </CardTitle>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={resetForm} className="px-6 py-3 rounded-lg border border-kibo-purple text-kibo-purple bg-transparent hover:bg-kibo-orange hover:text-kibo-purple active:bg-kibo-orange active:text-kibo-purple transition-colors cursor-pointer">
                <Plus className="h-4 w-4 mr-2" />
                Add New Address
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg bg-purple-200">
              <DialogHeader>
                <DialogTitle>{editingAddress ? 'Edit Address' : 'Add New Address'}</DialogTitle>
              </DialogHeader>
              <div className="grid grid-cols-1 gap-4">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <Label htmlFor="title">Address Title</Label>
                    <Input id="title" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} className="bg-orange-50" />
                  </div>
                  <div>
                    <Label htmlFor="type">Address Type</Label>
                    <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value as Address['type'] })}>
                      <SelectTrigger className="bg-orange-50">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-orange-50">
                        <SelectItem value="delivery">Delivery</SelectItem>
                        <SelectItem value="billing">Billing</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <Label htmlFor="recipientName">Recipient Name</Label>
                    <Input id="recipientName" value={formData.recipientName} onChange={(e) => setFormData({ ...formData, recipientName: e.target.value })} className="bg-orange-50" />
                  </div>
                  <div>
                    <Label htmlFor="phone">Phone</Label>
                    <Input id="phone" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} className="bg-orange-50" />
                  </div>
                </div>

                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className="bg-orange-50" />
                </div>

                <div>
                  <Label htmlFor="address">Street Address</Label>
                  <Input id="address" value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} className="bg-orange-50" />
                </div>

                <div>
                  <Label htmlFor="apartment">Apartment / Suite</Label>
                  <Input id="apartment" value={formData.apartment} onChange={(e) => setFormData({ ...formData, apartment: e.target.value })} className="bg-orange-50" />
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <Label htmlFor="country">Country / Region</Label>
                    <Select value={formData.country} onValueChange={(value) => setFormData({ ...formData, country: value, province: '' })}>
                      <SelectTrigger className="bg-orange-50">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-orange-50">
                        {COUNTRIES.map((country) => (
                          <SelectItem key={country} value={country}>{country}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="province">Province / State</Label>
                    <Select value={formData.province} onValueChange={(value) => setFormData({ ...formData, province: value })}>
                      <SelectTrigger className="bg-orange-50">
                        <SelectValue placeholder="Select province" />
                      </SelectTrigger>
                      <SelectContent className="bg-orange-50">
                        {provinceOptions.map((province) => (
                          <SelectItem key={province} value={province}>{province}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                  <div>
                    <Label htmlFor="district">District</Label>
                    <Input id="district" value={formData.district} onChange={(e) => setFormData({ ...formData, district: e.target.value })} className="bg-orange-50" />
                  </div>
                  <div>
                    <Label htmlFor="city">City</Label>
                    <Input id="city" value={formData.city} onChange={(e) => setFormData({ ...formData, city: e.target.value })} className="bg-orange-50" />
                  </div>
                  <div>
                    <Label htmlFor="postalCode">Postal Code</Label>
                    <Input id="postalCode" value={formData.postalCode} onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })} className="bg-orange-50" />
                  </div>
                </div>

                <div className="flex gap-2 pt-4">
                  <Button onClick={() => void handleSave()} className="flex-1 px-6 py-3 rounded-lg border border-kibo-purple text-kibo-purple bg-transparent hover:bg-kibo-orange hover:text-kibo-purple active:bg-kibo-orange active:text-kibo-purple transition-colors cursor-pointer">
                    {editingAddress ? 'Update' : 'Save'}
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
        {addresses.length === 0 ? (
          <div className="text-center py-8">
            <MapPin className="h-16 w-16 mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-semibold mb-2">No addresses yet</h3>
            <p className="text-gray-600 mb-4">Add a delivery or billing address to speed up checkout.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {addresses.map((address) => {
              const Icon = getAddressIcon(address.type);
              return (
                <Card key={address.id} className={`border-l-4 bg-orange-50 ${address.isDefault ? 'border-l-kibo-orange' : 'border-l-kibo-purple/40'}`}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Icon className="h-4 w-4 text-gray-500" />
                        <span className="font-semibold">{address.title}</span>
                      </div>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="sm" onClick={() => openEditDialog(address)} className="px-3 py-2 rounded border border-kibo-purple text-kibo-purple bg-transparent hover:bg-kibo-orange hover:text-kibo-purple transition-colors">
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => void deleteAddress(address.id)} className="px-3 py-2 rounded border border-kibo-purple text-kibo-purple bg-transparent hover:bg-kibo-orange hover:text-kibo-purple transition-colors">
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-1 text-sm text-gray-700">
                      <p className="font-medium">{address.recipientName}</p>
                      <p>{address.phone}</p>
                      {address.email && <p>{address.email}</p>}
                      <p>{address.address}</p>
                      {address.apartment && <p>{address.apartment}</p>}
                      <p>{address.district}, {address.city} {address.postalCode}</p>
                      <p>{address.province}, {address.country}</p>
                      <p className="text-xs uppercase tracking-wide text-kibo-purple">{address.type}</p>
                    </div>

                    {!address.isDefault && (
                      <Button onClick={() => void setDefaultAddress(address.id)} variant="outline" size="sm" className="mt-4 px-6 py-3 rounded-lg border border-kibo-purple text-kibo-purple bg-transparent hover:bg-kibo-orange hover:text-kibo-purple active:bg-kibo-orange active:text-kibo-purple transition-colors cursor-pointer">
                        Set as Default
                      </Button>
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

export default Addresses;
