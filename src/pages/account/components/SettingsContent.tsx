import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { User, Shield, Eye, EyeOff, Trash2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useUserData } from '@/context/UserDataContext';
import { useNavigate } from 'react-router-dom';
import apiService from '@/services/apiService';

const getErrorMessage = (error: unknown, fallback: string): string => {
  return error instanceof Error ? error.message : fallback;
};

const SettingsContent = () => {
  const { user, logout } = useAuth();
  const { profileInfo, updateProfileInfo } = useUserData();
  const navigate = useNavigate();
  const { toast: uiToast } = useToast();
  const toast = {
    success: (message: string) => uiToast({ title: 'Success', description: message }),
    error: (message: string) => uiToast({ title: 'Error', description: message }),
    info: (message: string) => uiToast({ title: 'Info', description: message }),
  };
  const [showPassword, setShowPassword] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  // Update form data when profileInfo or user changes
  React.useEffect(() => {
    setFormData(prev => ({
      ...prev,
      fullName: profileInfo?.fullName || user?.name || '',
      email: profileInfo?.email || user?.email || '',
    }));
  }, [profileInfo, user]);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);



  const handleSave = () => {
    // Form validation
    if (!formData.fullName.trim()) {
      toast.error('Full name is required');
      return;
    }
    if (!formData.email.trim()) {
      toast.error('Email is required');
      return;
    }

    
    // Save profile information
    const profileData = {
      fullName: formData.fullName,
      email: formData.email,
      phone: '',
      companyName: ''
    };
    updateProfileInfo(profileData);
    console.log('Saving user settings:', formData);
    toast.success('Profile updated successfully!');
  };

  const handlePasswordChange = async () => {
    // Validation
    if (!formData.currentPassword.trim()) {
      toast.error('Current password is required');
      return;
    }
    if (!formData.newPassword.trim()) {
      toast.error('New password is required');
      return;
    }
    if (formData.newPassword.length < 8) {
      toast.error('New password must be at least 8 characters');
      return;
    }
    if (formData.newPassword !== formData.confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }
    
    if (!user) {
      toast.error('User not found');
      return;
    }
    
    setIsChangingPassword(true);
    
    try {
      // Backend API'yi kullanarak şifre değiştir
      await apiService.changePassword(user.id, formData.currentPassword, formData.newPassword);
      toast.success('Password changed successfully!');
      
      // Clear password fields
      setFormData(prev => ({
        ...prev,
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      }));
    } catch (error) {
      // Backend'den gelen hata mesajını göster
      const errorMessage = getErrorMessage(error, 'Failed to change password');
      toast.error(errorMessage);
    } finally {
      setIsChangingPassword(false);
    }
  };
  
  const handleDeleteAccount = async () => {
    if (!showDeleteConfirm) {
      setShowDeleteConfirm(true);
      return;
    }
    
    if (!user) {
      toast.error('User not found');
      return;
    }

    // Admin kullanıcısını silmeyi engelle
    if (user.isAdmin) {
      toast.error('Admin account cannot be deleted');
      setShowDeleteConfirm(false);
      return;
    }
    
    setIsDeletingAccount(true);
    
    try {
      // Backend API'yi kullanarak hesabı sil
      await apiService.deleteUser(user.id);
      toast.success('Account deleted successfully');
      
      // Log out the user and redirect to home page
      logout();
      navigate('/');
    } catch (error) {
      // Backend'den gelen hata mesajını göster
      const errorMessage = getErrorMessage(error, 'Failed to delete account');
      toast.error(errorMessage);
      setShowDeleteConfirm(false);
    } finally {
      setIsDeletingAccount(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Profile Settings */}
      <Card className="bg-purple-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Profile Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4">
            <div>
              <Label htmlFor="fullName">Full Name <span className="text-red-500">*</span></Label>
              <Input
                id="fullName"
                value={formData.fullName}
                onChange={(e) => setFormData({...formData, fullName: e.target.value})}
                placeholder="Enter your full name"
                autoComplete="off"
                required
                className="bg-orange-50"
              />
            </div>
            <div>
              <Label htmlFor="email">Email <span className="text-red-500">*</span></Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                placeholder="Enter your email address"
                autoComplete="off"
                required
                className="bg-orange-50"
              />
            </div>
          </div>
          <Button onClick={handleSave} className="px-6 py-3 rounded-lg border border-kibo-purple text-kibo-purple bg-transparent hover:bg-kibo-orange hover:text-kibo-purple active:bg-kibo-orange active:text-kibo-purple transition-colors cursor-pointer">
            Update Profile
          </Button>
        </CardContent>
      </Card>

      {/* Password Settings */}
      <Card className="bg-purple-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
Change Password
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="currentPassword">Current Password</Label>
            <div className="relative">
              <Input
                id="currentPassword"
                type={showPassword ? "text" : "password"}
                value={formData.currentPassword}
                onChange={(e) => setFormData({...formData, currentPassword: e.target.value})}
                placeholder="Enter your current password"
                autoComplete="off"
                className="bg-orange-50"
              />
              <Button
                variant="ghost"
                size="sm"
                className="absolute right-2 top-1/2 transform -translate-y-1/2"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="newPassword">New Password</Label>
              <Input
                id="newPassword"
                type="password"
                value={formData.newPassword}
                onChange={(e) => setFormData({...formData, newPassword: e.target.value})}
                placeholder="Enter your new password"
                autoComplete="off"
                className="bg-orange-50"
              />
            </div>
            <div>
              <Label htmlFor="confirmPassword">Confirm New Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={formData.confirmPassword}
                onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
                placeholder="Confirm your new password"
                autoComplete="off"
                className="bg-orange-50"
              />
            </div>
          </div>
          <Button onClick={handlePasswordChange} disabled={isChangingPassword} className="px-6 py-3 rounded-lg border border-kibo-purple text-kibo-purple bg-transparent hover:bg-kibo-orange hover:text-kibo-purple active:bg-kibo-orange active:text-kibo-purple transition-colors cursor-pointer">
            {isChangingPassword ? 'Changing Password...' : 'Change Password'}
          </Button>
        </CardContent>
      </Card>



      {/* Danger Zone */}
      <Card className="border-red-200 bg-purple-200">
        <CardHeader>
          <CardTitle className="text-red-600">Dangerous Operations</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 bg-red-50 rounded-lg">
            <h4 className="font-medium text-red-800 mb-2">Delete Account</h4>
            <p className="text-sm text-red-600 mb-3">
              This action cannot be undone. All your data will be permanently deleted.
            </p>
            <div className="flex items-center gap-2">
              <Button 
                variant={showDeleteConfirm ? "outline" : "destructive"} 
                size="sm"
                onClick={handleDeleteAccount}
                disabled={isDeletingAccount}
                className={showDeleteConfirm ? "px-6 py-3 rounded-lg border border-red-500 text-red-600 hover:bg-red-50 transition-colors cursor-pointer" : "px-6 py-3 rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors cursor-pointer"}
              >
                {isDeletingAccount ? (
                  "Deleting Account..."
                ) : showDeleteConfirm ? (
                  <>
                    <Trash2 className="h-4 w-4 mr-2" />
                    Confirm Delete Account
                  </>
                ) : (
                  "Delete My Account"
                )}
              </Button>
              {showDeleteConfirm && (
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setShowDeleteConfirm(false)}
                  disabled={isDeletingAccount}
                  className="px-6 py-3 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  Cancel
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SettingsContent;
