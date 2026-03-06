import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { useAuth } from './AuthContext';
import apiService, { type UserAddress, type UserAddressPayload, type UserProfile } from '@/services/apiService';

export interface Address {
  id: string;
  title: string;
  type: 'delivery' | 'billing';
  recipientName: string;
  phone: string;
  email?: string;
  address: string;
  apartment?: string;
  district: string;
  city: string;
  postalCode: string;
  province?: string;
  country?: string;
  isDefault: boolean;
}

export interface PaymentMethod {
  id: string;
  title: string;
  isDefault: boolean;
}

export interface ProfileInfo {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  companyName?: string;
}

interface UserDataContextType {
  addresses: Address[];
  paymentMethods: PaymentMethod[];
  profileInfo: ProfileInfo | null;
  isLoading: boolean;
  addAddress: (address: Omit<Address, 'id'>) => Promise<string>;
  updateAddress: (id: string, address: Partial<Address>) => Promise<void>;
  deleteAddress: (id: string) => Promise<void>;
  setDefaultAddress: (id: string) => Promise<void>;
  addPaymentMethod: (_paymentMethod: Omit<PaymentMethod, 'id'>) => Promise<string>;
  updatePaymentMethod: (_id: string, _paymentMethod: Partial<PaymentMethod>) => Promise<void>;
  deletePaymentMethod: (_id: string) => Promise<void>;
  setDefaultPaymentMethod: (_id: string) => Promise<void>;
  updateProfileInfo: (profileInfo: ProfileInfo) => Promise<void>;
  getDefaultAddress: () => Address | null;
  getDefaultPaymentMethod: () => PaymentMethod | null;
  refreshUserData: () => Promise<void>;
}

const UserDataContext = createContext<UserDataContextType | undefined>(undefined);

const mapAddress = (address: UserAddress): Address => ({
  id: address.id,
  title: address.title,
  type: address.type,
  recipientName: address.recipientName,
  phone: address.phone,
  email: address.email,
  address: address.address,
  apartment: address.apartment,
  district: address.district,
  city: address.city,
  postalCode: address.postalCode,
  province: address.province,
  country: address.country,
  isDefault: Boolean(address.isDefault),
});

const mapProfile = (profile: UserProfile): ProfileInfo => ({
  firstName: profile.firstName,
  lastName: profile.lastName,
  email: profile.email,
  phone: profile.phone,
  companyName: profile.companyName,
});

const toProfilePayload = (profile: ProfileInfo) => ({
  fullName: `${profile.firstName} ${profile.lastName}`.trim(),
  email: profile.email,
  phone: profile.phone,
  companyName: profile.companyName || '',
});

export const UserDataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [profileInfo, setProfileInfo] = useState<ProfileInfo | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const refreshUserData = useCallback(async () => {
    if (!user?.id) {
      setAddresses([]);
      setProfileInfo(null);
      return;
    }

    setIsLoading(true);
    try {
      const [addressesData, profileData] = await Promise.all([
        apiService.getUserAddresses(user.id),
        apiService.getAccountProfile(),
      ]);

      setAddresses(addressesData.map(mapAddress));
      setProfileInfo(mapProfile(profileData));
    } catch (error) {
      console.error('Kullan�c� verileri y�klenirken hata:', error);
      toast.error('Veriler y�klenirken bir hata olu�tu');
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    void refreshUserData();
  }, [refreshUserData]);

  const addAddress = async (address: Omit<Address, 'id'>): Promise<string> => {
    if (!user?.id) {
      toast.error('Kullan�c� giri�i yapmal�s�n�z');
      return '';
    }

    try {
      const backendAddress: UserAddressPayload = {
        userId: user.id,
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
        province: address.province || '',
        country: address.country || 'Turkey',
        isDefault: address.isDefault,
      };

      const result = await apiService.createUserAddress(backendAddress);
      await refreshUserData();
      toast.success('Adres ba�ar�yla eklendi');
      return result.id;
    } catch (error) {
      console.error('Adres eklenirken hata:', error);
      toast.error('Adres eklenirken bir hata olu�tu');
      return '';
    }
  };

  const updateAddress = async (id: string, updatedAddress: Partial<Address>) => {
    const existingAddress = addresses.find((address) => address.id === id);
    if (!user?.id || !existingAddress) {
      toast.error('Adres bulunamad�');
      return;
    }

    try {
      const mergedAddress = { ...existingAddress, ...updatedAddress };
      const backendAddress: Partial<UserAddressPayload> = {
        title: mergedAddress.title,
        type: mergedAddress.type,
        recipientName: mergedAddress.recipientName,
        phone: mergedAddress.phone,
        email: mergedAddress.email || '',
        address: mergedAddress.address,
        apartment: mergedAddress.apartment || '',
        district: mergedAddress.district,
        city: mergedAddress.city,
        postalCode: mergedAddress.postalCode,
        province: mergedAddress.province || '',
        country: mergedAddress.country || 'Turkey',
        isDefault: mergedAddress.isDefault,
      };

      await apiService.updateUserAddress(id, backendAddress);
      await refreshUserData();
      toast.success('Adres ba�ar�yla g�ncellendi');
    } catch (error) {
      console.error('Adres g�ncellenirken hata:', error);
      toast.error('Adres g�ncellenirken bir hata olu�tu');
    }
  };

  const deleteAddress = async (id: string) => {
    if (!user?.id) {
      toast.error('Kullan�c� giri�i yapmal�s�n�z');
      return;
    }

    try {
      await apiService.deleteUserAddress(id);
      await refreshUserData();
      toast.success('Adres ba�ar�yla silindi');
    } catch (error) {
      console.error('Adres silinirken hata:', error);
      toast.error('Adres silinirken bir hata olu�tu');
    }
  };

  const setDefaultAddress = async (id: string) => {
    const address = addresses.find((item) => item.id === id);
    if (!address) {
      return;
    }

    await updateAddress(id, { ...address, isDefault: true });
  };

  const addPaymentMethod = async (): Promise<string> => {
    toast.info('Payment method management will be enabled after a payment provider is connected.');
    return '';
  };

  const updatePaymentMethod = async (): Promise<void> => {
    toast.info('Payment method management will be enabled after a payment provider is connected.');
  };

  const deletePaymentMethod = async (): Promise<void> => {
    toast.info('Payment method management will be enabled after a payment provider is connected.');
  };

  const setDefaultPaymentMethod = async (): Promise<void> => {
    toast.info('Payment method management will be enabled after a payment provider is connected.');
  };

  const updateProfileInfo = async (nextProfile: ProfileInfo) => {
    try {
      const updatedProfile = await apiService.updateAccountProfile(toProfilePayload(nextProfile));
      setProfileInfo(mapProfile(updatedProfile));
      toast.success('Profil ba�ar�yla g�ncellendi');
    } catch (error) {
      console.error('Profil g�ncellenirken hata:', error);
      toast.error('Profil g�ncellenirken bir hata olu�tu');
      throw error;
    }
  };

  const getDefaultAddress = useCallback((): Address | null => {
    return addresses.find((address) => address.isDefault) || addresses[0] || null;
  }, [addresses]);

  const getDefaultPaymentMethod = useCallback((): PaymentMethod | null => null, []);

  return (
    <UserDataContext.Provider
      value={{
        addresses,
        paymentMethods: [],
        profileInfo,
        isLoading,
        addAddress,
        updateAddress,
        deleteAddress,
        setDefaultAddress,
        addPaymentMethod,
        updatePaymentMethod,
        deletePaymentMethod,
        setDefaultPaymentMethod,
        updateProfileInfo,
        getDefaultAddress,
        getDefaultPaymentMethod,
        refreshUserData,
      }}
    >
      {children}
    </UserDataContext.Provider>
  );
};

export const useUserData = () => {
  const context = useContext(UserDataContext);
  if (context === undefined) {
    throw new Error('useUserData must be used within a UserDataProvider');
  }
  return context;
};
