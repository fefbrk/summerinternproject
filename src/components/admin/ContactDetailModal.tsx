import React from 'react';
import { Contact } from '@/services/apiService';

interface ContactDetailModalProps {
  isOpen: boolean;
  contact: Contact | null;
  onClose: () => void;
  onDeleteContact: (contact: Contact) => void;
  onUpdateStatus: (contactId: string, status: Contact['status']) => void | Promise<void>;
}

const ContactDetailModal: React.FC<ContactDetailModalProps> = ({
  isOpen,
  contact,
  onClose,
  onDeleteContact,
  onUpdateStatus,
}) => {
  if (!isOpen || !contact) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-bold text-gray-900">Contact Message Details</h3>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 focus:outline-none"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-gray-500">From</p>
                <p className="text-base">{contact.name} ({contact.email})</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Type</p>
                <p className="text-base capitalize">{contact.type}</p>
              </div>
            </div>

            <div>
              <p className="text-sm font-medium text-gray-500">Subject</p>
              <p className="text-base font-medium">{contact.subject}</p>
            </div>

            <div>
              <p className="text-sm font-medium text-gray-500">Message</p>
              <div className="mt-2 p-4 bg-gray-50 rounded-lg border border-gray-200">
                <p className="text-base whitespace-pre-wrap">{contact.message}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-gray-500">Status</p>
                <p className="text-base capitalize">{contact.status}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Date</p>
                <p className="text-base">{new Date(contact.createdAt).toLocaleString()}</p>
              </div>
            </div>
          </div>

          <div className="mt-6 flex justify-between">
            <select
              value={contact.status}
              onChange={(e) => {
                void onUpdateStatus(contact.id, e.target.value as Contact['status']);
                onClose();
              }}
              className="p-2 border border-gray-300 rounded bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="new">New</option>
              <option value="reviewing">Reviewing</option>
              <option value="answered">Answered</option>
              <option value="closed">Closed</option>
            </select>

            <div className="space-x-2">
              <button
                onClick={onClose}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 transition-colors"
              >
                Close
              </button>
              <button
                onClick={() => {
                  onDeleteContact(contact);
                  onClose();
                }}
                className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContactDetailModal;
