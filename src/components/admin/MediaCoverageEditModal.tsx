import React from 'react';
import { MediaCoverage } from '@/services/apiService';
import RichTextEditor from '@/components/RichTextEditor';
import { ContentFormState } from '@/components/admin/contentAdminShared';

interface MediaCoverageEditModalProps {
  isOpen: boolean;
  editingMediaCoverage: MediaCoverage | null;
  formData: ContentFormState;
  setFormData: React.Dispatch<React.SetStateAction<ContentFormState>>;
  isUploadingImage: boolean;
  onClose: () => void;
  onUploadImage: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onSubmit: () => void | Promise<void>;
}

const MediaCoverageEditModal: React.FC<MediaCoverageEditModalProps> = ({
  isOpen,
  editingMediaCoverage,
  formData,
  setFormData,
  isUploadingImage,
  onClose,
  onUploadImage,
  onSubmit,
}) => {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-bold text-gray-900">
              {editingMediaCoverage ? 'Edit Media Coverage' : 'Create New Media Coverage'}
            </h3>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700 focus:outline-none">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
                className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter media coverage title"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Publish Date</label>
              <input
                type="datetime-local"
                value={formData.publishDate ? new Date(formData.publishDate).toISOString().slice(0, 16) : ''}
                onChange={(e) => setFormData((prev) => ({ ...prev, publishDate: new Date(e.target.value).toISOString() }))}
                className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Excerpt</label>
              <textarea
                value={formData.excerpt}
                onChange={(e) => setFormData((prev) => ({ ...prev, excerpt: e.target.value }))}
                className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
                placeholder="Enter a short excerpt for the media coverage"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Content</label>
              <RichTextEditor
                value={formData.content}
                onChange={(content: string) => setFormData((prev) => ({ ...prev, content }))}
                placeholder="Write your media coverage content..."
                height={400}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData((prev) => ({ ...prev, status: e.target.value as ContentFormState['status'] }))}
                className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="draft">Draft</option>
                <option value="published">Published</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Images</label>
              <div className="space-y-2">
                {formData.images.map((image, index) => (
                  <div key={index} className="flex items-center space-x-2 p-2 bg-gray-50 rounded">
                    <img src={image.src} alt={image.alt} className="w-16 h-16 object-cover rounded" />
                    <div className="flex-1">
                      <input
                        type="text"
                        value={image.src}
                        onChange={(e) => {
                          const updatedImages = [...formData.images];
                          updatedImages[index] = { ...updatedImages[index], src: e.target.value };
                          setFormData((prev) => ({ ...prev, images: updatedImages }));
                        }}
                        className="w-full p-1 border border-gray-300 rounded text-sm"
                        placeholder="Image URL"
                      />
                      <input
                        type="text"
                        value={image.alt}
                        onChange={(e) => {
                          const updatedImages = [...formData.images];
                          updatedImages[index] = { ...updatedImages[index], alt: e.target.value };
                          setFormData((prev) => ({ ...prev, images: updatedImages }));
                        }}
                        className="w-full p-1 border border-gray-300 rounded text-sm mt-1"
                        placeholder="Alt text"
                      />
                    </div>
                    <button
                      onClick={() => {
                        const updatedImages = formData.images.filter((_, imageIndex) => imageIndex !== index);
                        setFormData((prev) => ({ ...prev, images: updatedImages }));
                      }}
                      className="px-2 py-1 bg-red-500 text-white text-sm rounded hover:bg-red-600 transition-colors"
                    >
                      Remove
                    </button>
                  </div>
                ))}

                <div className="flex space-x-2">
                  <button
                    type="button"
                    onClick={() => {
                      setFormData((prev) => ({
                        ...prev,
                        images: [...prev.images, { src: '', alt: '' }],
                      }));
                    }}
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                  >
                    + Add Image URL
                  </button>

                  <div className="relative">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={onUploadImage}
                      disabled={isUploadingImage}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                    <button
                      type="button"
                      disabled={isUploadingImage}
                      className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isUploadingImage ? 'Uploading...' : '+ Upload Image'}
                    </button>
                  </div>
                </div>
              </div>
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
              onClick={onSubmit}
              className="px-4 py-2 bg-cyan-600 text-white rounded hover:bg-cyan-700 transition-colors"
            >
              {editingMediaCoverage ? 'Update Media Coverage' : 'Create Media Coverage'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MediaCoverageEditModal;
