import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MediaCoverage } from '@/services/apiService';

interface AdminMediaCoverageTabProps {
  mediaCoverages: MediaCoverage[];
  onCreateMediaCoverage: () => void;
  onEditMediaCoverage: (coverage: MediaCoverage) => void;
  onDeleteMediaCoverage: (coverage: MediaCoverage) => void;
}

const AdminMediaCoverageTab: React.FC<AdminMediaCoverageTabProps> = ({
  mediaCoverages,
  onCreateMediaCoverage,
  onEditMediaCoverage,
  onDeleteMediaCoverage,
}) => {
  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Media Coverage</CardTitle>
          <button
            onClick={onCreateMediaCoverage}
            className="px-4 py-2 bg-cyan-600 text-white rounded hover:bg-cyan-700 transition-colors"
          >
            + New Media Coverage
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
              {mediaCoverages.length === 0 ? (
                <tr>
                  <td colSpan={5} className="border p-4 text-center text-gray-500">No media coverage found yet</td>
                </tr>
              ) : (
                mediaCoverages.map((coverage) => (
                  <tr key={coverage.id} className="hover:bg-gray-50">
                    <td className="border p-2">{coverage.id}</td>
                    <td className="border p-2">
                      <div className="max-w-xs truncate" title={coverage.title}>
                        {coverage.title}
                      </div>
                    </td>
                    <td className="border p-2">
                      <span
                        className={
                          coverage.status === 'draft'
                            ? 'bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-xs'
                            : 'bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs'
                        }
                      >
                        {coverage.status}
                      </span>
                    </td>
                    <td className="border p-2">{new Date(coverage.publishDate).toLocaleDateString('en-US')}</td>
                    <td className="border p-2">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => onEditMediaCoverage(coverage)}
                          className="px-3 py-1 bg-blue-500 text-white text-sm rounded hover:bg-blue-600 transition-colors"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => onDeleteMediaCoverage(coverage)}
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

export default AdminMediaCoverageTab;
