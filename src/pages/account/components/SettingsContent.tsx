import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { User, Shield, Eye, EyeOff, Trash2, Download } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useUserData } from '@/context/UserDataContext';
import apiService, { PrivacyRequest } from '@/services/apiService';

const getErrorMessage = (error: unknown, fallback: string): string => {
  return error instanceof Error ? error.message : fallback;
};

const SettingsContent = () => {
  const { user } = useAuth();
  const { profileInfo, updateProfileInfo } = useUserData();
  const { toast: uiToast } = useToast();
  const toast = {
    success: (message: string) => uiToast({ title: 'Success', description: message }),
    error: (message: string) => uiToast({ title: 'Error', description: message }),
    info: (message: string) => uiToast({ title: 'Info', description: message }),
  };
  const [showPassword, setShowPassword] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [isExportingPrivacyData, setIsExportingPrivacyData] = useState(false);
  const [isRequestingPrivacyDeletion, setIsRequestingPrivacyDeletion] = useState(false);
  const [isLoadingPrivacyRequests, setIsLoadingPrivacyRequests] = useState(false);
  const [privacyDeletionReason, setPrivacyDeletionReason] = useState('');
  const [privacyRequests, setPrivacyRequests] = useState<PrivacyRequest[]>([]);
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
      fullName: profileInfo
        ? `${profileInfo.firstName} ${profileInfo.lastName}`.trim()
        : user?.name || '',
      email: profileInfo?.email || user?.email || '',
    }));
  }, [profileInfo, user]);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  React.useEffect(() => {
    let isMounted = true;

    const fetchPrivacyRequests = async () => {
      if (!user) {
        if (isMounted) {
          setPrivacyRequests([]);
        }
        return;
      }

      setIsLoadingPrivacyRequests(true);
      try {
        const requests = await apiService.getPrivacyRequests();
        if (isMounted) {
          setPrivacyRequests(requests);
        }
      } catch (_error) {
        if (isMounted) {
          setPrivacyRequests([]);
        }
      } finally {
        if (isMounted) {
          setIsLoadingPrivacyRequests(false);
        }
      }
    };

    void fetchPrivacyRequests();

    return () => {
      isMounted = false;
    };
  }, [user]);

  const downloadJsonFile = (filename: string, payload: unknown) => {
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const objectUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = objectUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(objectUrl);
  };

  const handleExportPrivacyData = async () => {
    if (!user) {
      toast.error('User not found');
      return;
    }

    setIsExportingPrivacyData(true);

    try {
      const exportPayload = await apiService.exportPrivacyData();
      const exportDate = new Date().toISOString().slice(0, 10);
      downloadJsonFile(`kinderlab-privacy-export-${exportDate}.json`, exportPayload);
      toast.success('Privacy export downloaded successfully');

      const refreshedRequests = await apiService.getPrivacyRequests();
      setPrivacyRequests(refreshedRequests);
    } catch (error) {
      const errorMessage = getErrorMessage(error, 'Failed to export privacy data');
      toast.error(errorMessage);
    } finally {
      setIsExportingPrivacyData(false);
    }
  };

  const handleRequestPrivacyDeletion = async () => {
    if (!user) {
      toast.error('User not found');
      return;
    }

    setIsRequestingPrivacyDeletion(true);

    try {
      const response = await apiService.requestPrivacyDeletion(privacyDeletionReason);
      toast.info(`Deletion request submitted. Request ID: ${response.id}`);
      setPrivacyDeletionReason('');

      const refreshedRequests = await apiService.getPrivacyRequests();
      setPrivacyRequests(refreshedRequests);
    } catch (error) {
      const errorMessage = getErrorMessage(error, 'Failed to submit deletion request');
      toast.error(errorMessage);
    } finally {
      setIsRequestingPrivacyDeletion(false);
    }
  };



  const handleSave = async () => {
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
    const nameParts = formData.fullName.trim().split(/\s+/).filter(Boolean);
    const firstName = nameParts.shift() || '';
    const lastName = nameParts.join(' ');
    const profileData = {
      firstName,
      lastName,
      email: formData.email,
      phone: '',
      companyName: ''
    };
    try {
      await updateProfileInfo(profileData);
    } catch (_error) {
      // handled in context
    }
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

    if (user.isAdmin) {
      toast.error('Admin account cannot use self-service deletion');
      setShowDeleteConfirm(false);
      return;
    }

    setIsDeletingAccount(true);

    try {
      const reason = privacyDeletionReason.trim().length > 0
        ? privacyDeletionReason
        : 'Self-service deletion request initiated from account settings';
      const response = await apiService.requestPrivacyDeletion(reason);
      toast.info('Deletion request submitted. Request ID: ' + response.id);
      setPrivacyDeletionReason('');
      const refreshedRequests = await apiService.getPrivacyRequests();
      setPrivacyRequests(refreshedRequests);
      setShowDeleteConfirm(false);
    } catch (error) {
      const errorMessage = getErrorMessage(error, 'Failed to submit deletion request');
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
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
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
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
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
                onChange={(e) => setFormData({ ...formData, currentPassword: e.target.value })}
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
                onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
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
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
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

      {/* Privacy Controls */}
      <Card className="bg-purple-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Privacy Controls
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-gray-700">
            You can export your account data as JSON or submit a GDPR deletion request for manual processing.
          </p>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              onClick={handleExportPrivacyData}
              disabled={isExportingPrivacyData}
              className="px-6 py-3 rounded-lg border border-kibo-purple text-kibo-purple bg-transparent hover:bg-kibo-orange hover:text-kibo-purple active:bg-kibo-orange active:text-kibo-purple transition-colors cursor-pointer"
            >
              <Download className="h-4 w-4 mr-2" />
              {isExportingPrivacyData ? 'Exporting...' : 'Export My Data'}
            </Button>
          </div>

          <div className="space-y-2">
            <Label htmlFor="privacyDeletionReason">Deletion Request Reason (Optional)</Label>
            <Textarea
              id="privacyDeletionReason"
              value={privacyDeletionReason}
              onChange={(e) => setPrivacyDeletionReason(e.target.value)}
              placeholder="Share context for your request"
              className="bg-orange-50"
              maxLength={500}
            />
          </div>

          <Button
            onClick={handleRequestPrivacyDeletion}
            disabled={isRequestingPrivacyDeletion}
            variant="outline"
            className="px-6 py-3 rounded-lg border border-red-500 text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
          >
            {isRequestingPrivacyDeletion ? 'Submitting Request...' : 'Request Data Deletion'}
          </Button>

          <div className="rounded-lg border border-kibo-purple/20 bg-white/70 p-3 text-sm text-gray-700">
            <p className="font-medium text-kibo-purple mb-2">Recent Privacy Requests</p>
            {isLoadingPrivacyRequests ? (
              <p>Loading privacy requests...</p>
            ) : privacyRequests.length === 0 ? (
              <p>No privacy requests submitted yet.</p>
            ) : (
              <ul className="space-y-1">
                {privacyRequests.slice(0, 3).map((request) => (
                  <li key={request.id}>
                    {request.requestType} - {request.status}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </CardContent>
      </Card>



      {/* Danger Zone */}
      <Card className="border-red-200 bg-purple-200">
        <CardHeader>
          <CardTitle className="text-red-600">Dangerous Operations</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 bg-red-50 rounded-lg">
            <h4 className="font-medium text-red-800 mb-2">Request Account Deletion</h4>
            <p className="text-sm text-red-600 mb-3">
              This submits a privacy deletion request for manual processing. Business records are preserved until the request is reviewed.
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
                    Confirm Deletion Request
                  </>
                ) : (
                  "Request Account Deletion"
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
