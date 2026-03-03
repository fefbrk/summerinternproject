import { Contact } from '@/services/apiService';

export const contactStatusBadgeClass: Record<Contact['status'], string> = {
  new: 'bg-blue-100 text-blue-800',
  reviewing: 'bg-yellow-100 text-yellow-800',
  answered: 'bg-green-100 text-green-800',
  closed: 'bg-gray-100 text-gray-800',
};

export const formatContactStatusLabel = (status: Contact['status']) => {
  if (status === 'answered') {
    return 'answered (closed)';
  }

  return status;
};
