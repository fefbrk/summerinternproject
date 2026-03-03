import React from 'react';
import { Contact } from '@/services/apiService';

interface ContactEditModalProps {
  isOpen: boolean;
  contact: Contact | null;
  onClose: () => void;
  onContactStatusChange: (status: Contact['status']) => void;
  onSave: () => void | Promise<void>;
}

const ContactEditModal: React.FC<ContactEditModalProps> = ({
  isOpen,
  contact,
  onClose,
  onContactStatusChange,
  onSave,
}) => {
  if (!isOpen || !contact) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Edit Contact</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            ✕
          </button>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
              <input
                type="text"
                value={contact.name}
                readOnly
                className="w-full p-2 border border-gray-300 rounded bg-gray-100 text-gray-600"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                value={contact.email}
                readOnly
                className="w-full p-2 border border-gray-300 rounded bg-gray-100 text-gray-600"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
              <input
                type="text"
                value={contact.type}
                readOnly
                className="w-full p-2 border border-gray-300 rounded bg-gray-100 text-gray-600"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                value={contact.status}
                onChange={(e) => onContactStatusChange(e.target.value as Contact['status'])}
                className="w-full p-2 border border-gray-300 rounded bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="new">New</option>
                <option value="reviewing">Reviewing</option>
                <option value="answered">Answered</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
            <input
              type="text"
              value={contact.subject}
              readOnly
              className="w-full p-2 border border-gray-300 rounded bg-gray-100 text-gray-600"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
            <textarea
              value={contact.message}
              readOnly
              rows={6}
              className="w-full p-2 border border-gray-300 rounded bg-gray-100 text-gray-600 resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
            <input
              type="text"
              value={new Date(contact.createdAt).toLocaleString()}
              readOnly
              className="w-full p-2 border border-gray-300 rounded bg-gray-100 text-gray-600"
            />
          </div>
        </div>

        <div className="mt-6 flex justify-end space-x-2">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onSave}
            className="px-6 py-3 rounded-lg border border-kibo-purple text-kibo-purple hover:bg-kibo-orange hover:text-kibo-purple active:bg-kibo-orange active:text-kibo-purple transition-colors cursor-pointer"
          >
            Update Status
          </button>
        </div>
      </div>
    </div>
  );
};

export default ContactEditModal;
