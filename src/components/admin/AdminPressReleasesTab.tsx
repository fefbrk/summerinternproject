import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PressRelease } from '@/services/apiService';

interface AdminPressReleasesTabProps {
  pressReleases: PressRelease[];
  onCreatePressRelease: () => void;
  onEditPressRelease: (release: PressRelease) => void;
  onDeletePressRelease: (release: PressRelease) => void;
}

const AdminPressReleasesTab: React.FC<AdminPressReleasesTabProps> = ({
  pressReleases,
  onCreatePressRelease,
  onEditPressRelease,
  onDeletePressRelease,
}) => {
  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Press Releases</CardTitle>
          <button
            onClick={onCreatePressRelease}
            className="px-4 py-2 bg-teal-600 text-white rounded hover:bg-teal-700 transition-colors"
          >
            + New Press Release
          </button>
        </div>
      </CardHeader>
      <CardContent className="p-2">
        <div className="overflow-x-auto w-full">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-100">
                <th className="border p-2 text-left">ID</th>
                <th className="border p-2 text-left">Title</th>
                <th className="border p-2 text-left">Status</th>
                <th className="border p-2 text-left">Publish Date</th>
                <th className="border p-2 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {pressReleases.length === 0 ? (
                <tr>
                  <td colSpan={5} className="border p-4 text-center text-gray-500">No press releases found yet</td>
                </tr>
              ) : (
                pressReleases.map((release) => (
                  <tr key={release.id} className="hover:bg-gray-50">
                    <td className="border p-2">{release.id}</td>
                    <td className="border p-2">
                      <div className="max-w-xs truncate" title={release.title}>
                        {release.title}
                      </div>
                    </td>
                    <td className="border p-2">
                      <span
                        className={
                          release.status === 'draft'
                            ? 'bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-xs'
                            : 'bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs'
                        }
                      >
                        {release.status}
                      </span>
                    </td>
                    <td className="border p-2">{new Date(release.publishDate).toLocaleDateString('en-US')}</td>
                    <td className="border p-2">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => onEditPressRelease(release)}
                          className="px-3 py-1 bg-blue-500 text-white text-sm rounded hover:bg-blue-600 transition-colors"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => onDeletePressRelease(release)}
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

export default AdminPressReleasesTab;
