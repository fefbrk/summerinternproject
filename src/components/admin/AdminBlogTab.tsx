import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BlogPost } from '@/services/apiService';

interface AdminBlogTabProps {
  blogPosts: BlogPost[];
  onCreateBlogPost: () => void;
  onEditBlogPost: (post: BlogPost) => void;
  onDeleteBlogPost: (post: BlogPost) => void;
}

const AdminBlogTab: React.FC<AdminBlogTabProps> = ({
  blogPosts,
  onCreateBlogPost,
  onEditBlogPost,
  onDeleteBlogPost,
}) => {
  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Blog Posts</CardTitle>
          <button
            onClick={onCreateBlogPost}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
          >
            + New Blog Post
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
                <th className="border p-2 text-left">Author</th>
                <th className="border p-2 text-left">Status</th>
                <th className="border p-2 text-left">Publish Date</th>
                <th className="border p-2 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {blogPosts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="border p-4 text-center text-gray-500">No blog posts found yet</td>
                </tr>
              ) : (
                blogPosts.map((post) => (
                  <tr key={post.id} className="hover:bg-gray-50">
                    <td className="border p-2">{post.id}</td>
                    <td className="border p-2">
                      <div className="max-w-xs truncate" title={post.title}>
                        {post.title}
                      </div>
                    </td>
                    <td className="border p-2">{post.author}</td>
                    <td className="border p-2">
                      <span
                        className={
                          post.status === 'draft'
                            ? 'bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-xs'
                            : 'bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs'
                        }
                      >
                        {post.status}
                      </span>
                    </td>
                    <td className="border p-2">{new Date(post.publishDate).toLocaleDateString('en-US')}</td>
                    <td className="border p-2">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => onEditBlogPost(post)}
                          className="px-3 py-1 bg-blue-500 text-white text-sm rounded hover:bg-blue-600 transition-colors"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => onDeleteBlogPost(post)}
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

export default AdminBlogTab;
