import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { User } from '@/services/apiService';

interface AdminUsersTabProps {
  users: User[];
  onDeleteUser: (user: User) => void;
}

const AdminUsersTab: React.FC<AdminUsersTabProps> = ({ users, onDeleteUser }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>User List</CardTitle>
      </CardHeader>
      <CardContent className="p-2">
        <div className="overflow-x-auto w-full">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-100">
                <th className="border p-2 text-left">ID</th>
                <th className="border p-2 text-left">Full Name</th>
                <th className="border p-2 text-left">Email</th>
                <th className="border p-2 text-left">Registration Date</th>
                <th className="border p-2 text-left">Delete</th>
              </tr>
            </thead>
            <tbody>
              {users.length === 0 ? (
                <tr>
                  <td colSpan={5} className="border p-4 text-center text-gray-500">No users found yet</td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="border p-2">{user.id}</td>
                    <td className="border p-2">{user.name}</td>
                    <td className="border p-2">{user.email}</td>
                    <td className="border p-2">{new Date(user.createdAt).toLocaleDateString('en-US')}</td>
                    <td className="border p-2">
                      <button
                        onClick={() => onDeleteUser(user)}
                        className="px-3 py-1 bg-red-500 text-white text-sm rounded hover:bg-red-600 transition-colors"
                        disabled={Boolean(user.isAdmin)}
                      >
                        {user.isAdmin ? 'Admin' : 'Delete'}
                      </button>
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

export default AdminUsersTab;
