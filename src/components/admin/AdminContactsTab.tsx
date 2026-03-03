import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Contact } from '@/services/apiService';
import { contactStatusBadgeClass, formatContactStatusLabel } from '@/components/admin/contactAdminShared';

interface AdminContactsTabProps {
  allContactsCount: number;
  contacts: Contact[];
  contactTypeFilter: string;
  onContactTypeFilterChange: (value: string) => void;
  onViewContact: (contact: Contact) => void;
  onEditContact: (contact: Contact) => void;
  onDeleteContact: (contact: Contact) => void;
}

const AdminContactsTab: React.FC<AdminContactsTabProps> = ({
  allContactsCount,
  contacts,
  contactTypeFilter,
  onContactTypeFilterChange,
  onViewContact,
  onEditContact,
  onDeleteContact,
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Contact Messages</CardTitle>
      </CardHeader>
      <CardContent className="p-2">
        <div className="mb-4 flex items-center space-x-2">
          <label htmlFor="contactTypeFilter" className="text-sm font-medium">Filter by Type:</label>
          <select
            id="contactTypeFilter"
            value={contactTypeFilter}
            onChange={(e) => onContactTypeFilterChange(e.target.value)}
            className="p-2 border border-gray-300 rounded bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Types</option>
            <option value="general">General</option>
            <option value="support">Support</option>
            <option value="training">Training</option>
            <option value="sales">Sales</option>
          </select>
        </div>

        <div className="overflow-x-auto w-full">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-100">
                <th className="border p-2 text-left">ID</th>
                <th className="border p-2 text-left">Type</th>
                <th className="border p-2 text-left">Full Name</th>
                <th className="border p-2 text-left">Email</th>
                <th className="border p-2 text-left">Subject</th>
                <th className="border p-2 text-left">Message</th>
                <th className="border p-2 text-left">Status</th>
                <th className="border p-2 text-left">Date</th>
                <th className="border p-2 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {allContactsCount === 0 ? (
                <tr>
                  <td colSpan={9} className="border p-4 text-center text-gray-500">No contact messages found yet</td>
                </tr>
              ) : contacts.length === 0 ? (
                <tr>
                  <td colSpan={9} className="border p-4 text-center text-gray-500">No contact messages found for selected type</td>
                </tr>
              ) : (
                contacts.map((contact) => (
                  <tr key={contact.id} className="hover:bg-gray-50">
                    <td className="border p-2">{contact.id}</td>
                    <td className="border p-2">{contact.type}</td>
                    <td className="border p-2">{contact.name}</td>
                    <td className="border p-2">{contact.email}</td>
                    <td className="border p-2">{contact.subject}</td>
                    <td className="border p-2">
                      <div className="max-w-xs truncate text-gray-700">{contact.message}</div>
                    </td>
                    <td className="border p-2">
                      <span className={`${contactStatusBadgeClass[contact.status]} px-2 py-1 rounded-full text-xs`}>
                        {formatContactStatusLabel(contact.status)}
                      </span>
                    </td>
                    <td className="border p-2">{new Date(contact.createdAt).toLocaleDateString('en-US')}</td>
                    <td className="border p-2">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => onViewContact(contact)}
                          className="px-3 py-1 bg-gray-500 text-white text-sm rounded hover:bg-gray-600 transition-colors"
                        >
                          View
                        </button>
                        <button
                          onClick={() => onEditContact(contact)}
                          className="px-3 py-1 bg-blue-500 text-white text-sm rounded hover:bg-blue-600 transition-colors"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => onDeleteContact(contact)}
                          className="px-3 py-1 bg-red-500 text-white text-sm rounded hover:bg-red-600 transition-colors"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
};

export default AdminContactsTab;
