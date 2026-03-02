import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MapPin, Plus, Edit, Trash2, Home, Building } from 'lucide-react';
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

const Addresses = () => {
  const { addresses, addAddress, updateAddress, deleteAddress } = useUserData();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    type: 'delivery',
    address: '',
    apartment: '',
    district: '',
    city: '',
    postalCode: '',
    country: 'Turkey',
    province: '',
  });

  const resetForm = () => {
    setFormData({
      title: '',
      type: 'delivery',
      address: '',
      apartment: '',
      district: '',
      city: '',
      postalCode: '',
      country: 'Turkey',
      province: '',
    });
    setEditingAddress(null);
  };

  const handleEdit = (address: Address) => {
    setEditingAddress(address);
    setFormData({
      title: address.title,
      type: address.type,
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

  const handleSave = () => {
    if (editingAddress) {
      // Edit existing address
      updateAddress(editingAddress.id, {
        ...formData,
        name: 'Address User',
        phone: '+90 555 000 0000',
        district: formData.district || formData.city,
        country: formData.country,
        province: formData.province,
        type: 'home' as const,
      });
    } else {
      // Add new address
      addAddress({
        ...formData,
        name: 'Address User',
        phone: '+90 555 000 0000',
        district: formData.district || formData.city,
        country: formData.country,
        province: formData.province,
        isDefault: false,
        type: 'home' as const,
      });
    }
    
    setIsDialogOpen(false);
    resetForm();
  };

  const handleDelete = (id: string) => {
    deleteAddress(id);
  };



  const getAddressIcon = (type: string) => {
    return type === 'delivery' ? Home : Building;
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
              <DialogContent className="max-w-md bg-purple-200">
                <DialogHeader>
                  <DialogTitle>
                    {editingAddress ? 'Edit Address' : 'Add New Address'}
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="title">Address Title</Label>
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={(e) => setFormData({...formData, title: e.target.value})}
                      placeholder="Home, Work, etc."
                      className="bg-orange-50"
                    />
                  </div>

                  <div>
                    <Label htmlFor="type">Address Type</Label>
                    <Select value={formData.type} onValueChange={(value) => setFormData({...formData, type: value})}>
                      <SelectTrigger className="bg-orange-50">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-orange-50">
                        <SelectItem value="delivery">Delivery Address</SelectItem>
                        <SelectItem value="billing">Billing Address</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>



                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="country">Country / Region <span className="text-red-500">*</span></Label>
                      <Select value={formData.country} onValueChange={(value) => setFormData({...formData, country: value, province: ''})}>
                        <SelectTrigger className="bg-orange-50">
                          <SelectValue placeholder="Select Country" />
                        </SelectTrigger>
                        <SelectContent className="bg-orange-50">
                          <SelectItem value="Turkey">Turkey</SelectItem>
                          <SelectItem value="United States">United States</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="province">Province <span className="text-red-500">*</span></Label>
                      <Select value={formData.province} onValueChange={(value) => setFormData({...formData, province: value})}>
                        <SelectTrigger className="bg-orange-50">
                          <SelectValue placeholder="Select Province" />
                        </SelectTrigger>
                        <SelectContent className="bg-orange-50">
                          {formData.country === 'Turkey' && [
                            <SelectItem key="Adana" value="Adana">Adana</SelectItem>,
                            <SelectItem key="Adıyaman" value="Adıyaman">Adıyaman</SelectItem>,
                            <SelectItem key="Afyonkarahisar" value="Afyonkarahisar">Afyonkarahisar</SelectItem>,
                            <SelectItem key="Ağrı" value="Ağrı">Ağrı</SelectItem>,
                            <SelectItem key="Amasya" value="Amasya">Amasya</SelectItem>,
                            <SelectItem key="Ankara" value="Ankara">Ankara</SelectItem>,
                            <SelectItem key="Antalya" value="Antalya">Antalya</SelectItem>,
                            <SelectItem key="Artvin" value="Artvin">Artvin</SelectItem>,
                            <SelectItem key="Aydın" value="Aydın">Aydın</SelectItem>,
                            <SelectItem key="Balıkesir" value="Balıkesir">Balıkesir</SelectItem>,
                            <SelectItem key="Bilecik" value="Bilecik">Bilecik</SelectItem>,
                            <SelectItem key="Bingöl" value="Bingöl">Bingöl</SelectItem>,
                            <SelectItem key="Bitlis" value="Bitlis">Bitlis</SelectItem>,
                            <SelectItem key="Bolu" value="Bolu">Bolu</SelectItem>,
                            <SelectItem key="Burdur" value="Burdur">Burdur</SelectItem>,
                            <SelectItem key="Bursa" value="Bursa">Bursa</SelectItem>,
                            <SelectItem key="Çanakkale" value="Çanakkale">Çanakkale</SelectItem>,
                            <SelectItem key="Çankırı" value="Çankırı">Çankırı</SelectItem>,
                            <SelectItem key="Çorum" value="Çorum">Çorum</SelectItem>,
                            <SelectItem key="Denizli" value="Denizli">Denizli</SelectItem>,
                            <SelectItem key="Diyarbakır" value="Diyarbakır">Diyarbakır</SelectItem>,
                            <SelectItem key="Edirne" value="Edirne">Edirne</SelectItem>,
                            <SelectItem key="Elazığ" value="Elazığ">Elazığ</SelectItem>,
                            <SelectItem key="Erzincan" value="Erzincan">Erzincan</SelectItem>,
                            <SelectItem key="Erzurum" value="Erzurum">Erzurum</SelectItem>,
                            <SelectItem key="Eskişehir" value="Eskişehir">Eskişehir</SelectItem>,
                            <SelectItem key="Gaziantep" value="Gaziantep">Gaziantep</SelectItem>,
                            <SelectItem key="Giresun" value="Giresun">Giresun</SelectItem>,
                            <SelectItem key="Gümüşhane" value="Gümüşhane">Gümüşhane</SelectItem>,
                            <SelectItem key="Hakkâri" value="Hakkâri">Hakkâri</SelectItem>,
                            <SelectItem key="Hatay" value="Hatay">Hatay</SelectItem>,
                            <SelectItem key="Isparta" value="Isparta">Isparta</SelectItem>,
                            <SelectItem key="Mersin" value="Mersin">Mersin</SelectItem>,
                            <SelectItem key="İstanbul" value="İstanbul">İstanbul</SelectItem>,
                            <SelectItem key="İzmir" value="İzmir">İzmir</SelectItem>,
                            <SelectItem key="Kars" value="Kars">Kars</SelectItem>,
                            <SelectItem key="Kastamonu" value="Kastamonu">Kastamonu</SelectItem>,
                            <SelectItem key="Kayseri" value="Kayseri">Kayseri</SelectItem>,
                            <SelectItem key="Kırklareli" value="Kırklareli">Kırklareli</SelectItem>,
                            <SelectItem key="Kırşehir" value="Kırşehir">Kırşehir</SelectItem>,
                            <SelectItem key="Kocaeli" value="Kocaeli">Kocaeli</SelectItem>,
                            <SelectItem key="Konya" value="Konya">Konya</SelectItem>,
                            <SelectItem key="Kütahya" value="Kütahya">Kütahya</SelectItem>,
                            <SelectItem key="Malatya" value="Malatya">Malatya</SelectItem>,
                            <SelectItem key="Manisa" value="Manisa">Manisa</SelectItem>,
                            <SelectItem key="Kahramanmaraş" value="Kahramanmaraş">Kahramanmaraş</SelectItem>,
                            <SelectItem key="Mardin" value="Mardin">Mardin</SelectItem>,
                            <SelectItem key="Muğla" value="Muğla">Muğla</SelectItem>,
                            <SelectItem key="Muş" value="Muş">Muş</SelectItem>,
                            <SelectItem key="Nevşehir" value="Nevşehir">Nevşehir</SelectItem>,
                            <SelectItem key="Niğde" value="Niğde">Niğde</SelectItem>,
                            <SelectItem key="Ordu" value="Ordu">Ordu</SelectItem>,
                            <SelectItem key="Rize" value="Rize">Rize</SelectItem>,
                            <SelectItem key="Sakarya" value="Sakarya">Sakarya</SelectItem>,
                            <SelectItem key="Samsun" value="Samsun">Samsun</SelectItem>,
                            <SelectItem key="Siirt" value="Siirt">Siirt</SelectItem>,
                            <SelectItem key="Sinop" value="Sinop">Sinop</SelectItem>,
                            <SelectItem key="Sivas" value="Sivas">Sivas</SelectItem>,
                            <SelectItem key="Tekirdağ" value="Tekirdağ">Tekirdağ</SelectItem>,
                            <SelectItem key="Tokat" value="Tokat">Tokat</SelectItem>,
                            <SelectItem key="Trabzon" value="Trabzon">Trabzon</SelectItem>,
                            <SelectItem key="Tunceli" value="Tunceli">Tunceli</SelectItem>,
                            <SelectItem key="Şanlıurfa" value="Şanlıurfa">Şanlıurfa</SelectItem>,
                            <SelectItem key="Uşak" value="Uşak">Uşak</SelectItem>,
                            <SelectItem key="Van" value="Van">Van</SelectItem>,
                            <SelectItem key="Yozgat" value="Yozgat">Yozgat</SelectItem>,
                            <SelectItem key="Zonguldak" value="Zonguldak">Zonguldak</SelectItem>,
                            <SelectItem key="Aksaray" value="Aksaray">Aksaray</SelectItem>,
                            <SelectItem key="Bayburt" value="Bayburt">Bayburt</SelectItem>,
                            <SelectItem key="Karaman" value="Karaman">Karaman</SelectItem>,
                            <SelectItem key="Kırıkkale" value="Kırıkkale">Kırıkkale</SelectItem>,
                            <SelectItem key="Batman" value="Batman">Batman</SelectItem>,
                            <SelectItem key="Şırnak" value="Şırnak">Şırnak</SelectItem>,
                            <SelectItem key="Bartın" value="Bartın">Bartın</SelectItem>,
                            <SelectItem key="Ardahan" value="Ardahan">Ardahan</SelectItem>,
                            <SelectItem key="Iğdır" value="Iğdır">Iğdır</SelectItem>,
                            <SelectItem key="Yalova" value="Yalova">Yalova</SelectItem>,
                            <SelectItem key="Karabük" value="Karabük">Karabük</SelectItem>,
                            <SelectItem key="Kilis" value="Kilis">Kilis</SelectItem>,
                            <SelectItem key="Osmaniye" value="Osmaniye">Osmaniye</SelectItem>,
                            <SelectItem key="Düzce" value="Düzce">Düzce</SelectItem>
                          ]}
                          {formData.country === 'United States' && [
                            <SelectItem key="Alabama" value="Alabama">Alabama</SelectItem>,
                            <SelectItem key="Alaska" value="Alaska">Alaska</SelectItem>,
                            <SelectItem key="Arizona" value="Arizona">Arizona</SelectItem>,
                            <SelectItem key="Arkansas" value="Arkansas">Arkansas</SelectItem>,
                            <SelectItem key="California" value="California">California</SelectItem>,
                            <SelectItem key="Colorado" value="Colorado">Colorado</SelectItem>,
                            <SelectItem key="Connecticut" value="Connecticut">Connecticut</SelectItem>,
                            <SelectItem key="Delaware" value="Delaware">Delaware</SelectItem>,
                            <SelectItem key="Florida" value="Florida">Florida</SelectItem>,
                            <SelectItem key="Georgia" value="Georgia">Georgia</SelectItem>,
                            <SelectItem key="Hawaii" value="Hawaii">Hawaii</SelectItem>,
                            <SelectItem key="Idaho" value="Idaho">Idaho</SelectItem>,
                            <SelectItem key="Illinois" value="Illinois">Illinois</SelectItem>,
                            <SelectItem key="Indiana" value="Indiana">Indiana</SelectItem>,
                            <SelectItem key="Iowa" value="Iowa">Iowa</SelectItem>,
                            <SelectItem key="Kansas" value="Kansas">Kansas</SelectItem>,
                            <SelectItem key="Kentucky" value="Kentucky">Kentucky</SelectItem>,
                            <SelectItem key="Louisiana" value="Louisiana">Louisiana</SelectItem>,
                            <SelectItem key="Maine" value="Maine">Maine</SelectItem>,
                            <SelectItem key="Maryland" value="Maryland">Maryland</SelectItem>,
                            <SelectItem key="Massachusetts" value="Massachusetts">Massachusetts</SelectItem>,
                            <SelectItem key="Michigan" value="Michigan">Michigan</SelectItem>,
                            <SelectItem key="Minnesota" value="Minnesota">Minnesota</SelectItem>,
                            <SelectItem key="Mississippi" value="Mississippi">Mississippi</SelectItem>,
                            <SelectItem key="Missouri" value="Missouri">Missouri</SelectItem>,
                            <SelectItem key="Montana" value="Montana">Montana</SelectItem>,
                            <SelectItem key="Nebraska" value="Nebraska">Nebraska</SelectItem>,
                            <SelectItem key="Nevada" value="Nevada">Nevada</SelectItem>,
                            <SelectItem key="New Hampshire" value="New Hampshire">New Hampshire</SelectItem>,
                            <SelectItem key="New Jersey" value="New Jersey">New Jersey</SelectItem>,
                            <SelectItem key="New Mexico" value="New Mexico">New Mexico</SelectItem>,
                            <SelectItem key="New York" value="New York">New York</SelectItem>,
                            <SelectItem key="North Carolina" value="North Carolina">North Carolina</SelectItem>,
                            <SelectItem key="North Dakota" value="North Dakota">North Dakota</SelectItem>,
                            <SelectItem key="Ohio" value="Ohio">Ohio</SelectItem>,
                            <SelectItem key="Oklahoma" value="Oklahoma">Oklahoma</SelectItem>,
                            <SelectItem key="Oregon" value="Oregon">Oregon</SelectItem>,
                            <SelectItem key="Pennsylvania" value="Pennsylvania">Pennsylvania</SelectItem>,
                            <SelectItem key="Rhode Island" value="Rhode Island">Rhode Island</SelectItem>,
                            <SelectItem key="South Carolina" value="South Carolina">South Carolina</SelectItem>,
                            <SelectItem key="South Dakota" value="South Dakota">South Dakota</SelectItem>,
                            <SelectItem key="Tennessee" value="Tennessee">Tennessee</SelectItem>,
                            <SelectItem key="Texas" value="Texas">Texas</SelectItem>,
                            <SelectItem key="Utah" value="Utah">Utah</SelectItem>,
                            <SelectItem key="Vermont" value="Vermont">Vermont</SelectItem>,
                            <SelectItem key="Virginia" value="Virginia">Virginia</SelectItem>,
                            <SelectItem key="Washington" value="Washington">Washington</SelectItem>,
                            <SelectItem key="West Virginia" value="West Virginia">West Virginia</SelectItem>,
                            <SelectItem key="Wisconsin" value="Wisconsin">Wisconsin</SelectItem>,
                            <SelectItem key="Wyoming" value="Wyoming">Wyoming</SelectItem>
                          ]}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="address">Street Address <span className="text-red-500">*</span></Label>
                    <Input
                      id="address"
                      value={formData.address}
                      onChange={(e) => setFormData({...formData, address: e.target.value})}
                      placeholder="Enter your street address"
                      className="bg-orange-50"
                    />
                  </div>

                  <div>
                    <Label htmlFor="apartment">Apartment, suite, unit, etc. (optional)</Label>
                    <Input
                      id="apartment"
                      value={formData.apartment}
                      onChange={(e) => setFormData({...formData, apartment: e.target.value})}
                      placeholder="Apt, suite, unit, etc."
                      className="bg-orange-50"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="postalCode">Postcode / ZIP <span className="text-red-500">*</span></Label>
                      <Input
                        id="postalCode"
                        value={formData.postalCode}
                        onChange={(e) => setFormData({...formData, postalCode: e.target.value})}
                        placeholder="Enter postal code"
                        className="bg-orange-50"
                      />
                    </div>
                    <div>
                      <Label htmlFor="city">Town / City <span className="text-red-500">*</span></Label>
                      <Input
                        id="city"
                        value={formData.city}
                        onChange={(e) => setFormData({...formData, city: e.target.value})}
                        placeholder="Enter city name"
                        className="bg-orange-50"
                      />
                    </div>
                  </div>

                  <div className="flex gap-2 pt-4">
                    <Button onClick={handleSave} className="flex-1 px-6 py-3 rounded-lg border border-kibo-purple text-kibo-purple bg-transparent hover:bg-kibo-orange hover:text-kibo-purple active:bg-kibo-orange active:text-kibo-purple transition-colors cursor-pointer">
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
              <p className="text-gray-600 mb-4">Click the button above to add your first address.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {addresses.map((address) => {
                const Icon = getAddressIcon(address.type);
                
                return (
                  <Card key={address.id} className="border-l-4 border-l-gray-300 bg-purple-200">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <Icon className="h-4 w-4 text-gray-500" />
                          <span className="font-semibold">{address.title}</span>

                        </div>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(address)}
                            className="px-3 py-2 rounded border border-kibo-purple text-kibo-purple bg-transparent hover:bg-kibo-orange hover:text-kibo-purple transition-colors"
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(address.id)}
                            className="px-3 py-2 rounded border border-kibo-purple text-kibo-purple bg-transparent hover:bg-kibo-orange hover:text-kibo-purple transition-colors"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>

                      <div className="space-y-1 text-sm">
                        <p className="font-medium">{address.name}</p>
                        <p className="text-gray-600">{address.phone}</p>
                        <p className="text-gray-600">{address.address}</p>
                        {address.apartment && (
                          <p className="text-gray-600">{address.apartment}</p>
                        )}
                        <p className="text-gray-600">
                          {address.district}, {address.city} {address.postalCode}
                        </p>
                        <p className="text-gray-600">
                          {address.province}, {address.country}
                        </p>
                      </div>


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
