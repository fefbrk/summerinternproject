import React from 'react';
import { ROOT_URL, Event } from '@/services/apiService';
import RichTextEditor from '@/components/RichTextEditor';
import { EventFormState } from '@/components/admin/contentAdminShared';

interface EventEditModalProps {
  isOpen: boolean;
  editingEvent: Event | null;
  formData: EventFormState;
  setFormData: React.Dispatch<React.SetStateAction<EventFormState>>;
  onClose: () => void;
  onUploadImage: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onSubmit: () => void | Promise<void>;
}

const EventEditModal: React.FC<EventEditModalProps> = ({
  isOpen,
  editingEvent,
  formData,
  setFormData,
  onClose,
  onUploadImage,
  onSubmit,
}) => {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-bold text-gray-900">
              {editingEvent ? 'Edit Event' : 'Create New Event'}
            </h3>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700 focus:outline-none">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
                  className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter event title"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData((prev) => ({ ...prev, category: e.target.value }))}
                  className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="conference">Conference</option>
                  <option value="workshop">Workshop</option>
                  <option value="webinar">Webinar</option>
                  <option value="exhibition">Exhibition</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Excerpt</label>
              <textarea
                value={formData.excerpt}
                onChange={(e) => setFormData((prev) => ({ ...prev, excerpt: e.target.value }))}
                className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={2}
                placeholder="Enter a short excerpt for the event"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
              <RichTextEditor
                value={formData.description}
                onChange={(content: string) => setFormData((prev) => ({ ...prev, description: content }))}
                placeholder="Write event description..."
                height={300}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Start Date *</label>
                <input
                  type="datetime-local"
                  value={formData.startDate}
                  onChange={(e) => setFormData((prev) => ({ ...prev, startDate: e.target.value }))}
                  className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">End Date *</label>
                <input
                  type="datetime-local"
                  value={formData.endDate}
                  onChange={(e) => setFormData((prev) => ({ ...prev, endDate: e.target.value }))}
                  className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData((prev) => ({ ...prev, status: e.target.value as Event['status'] }))}
                className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="upcoming">Upcoming</option>
                <option value="ongoing">Ongoing</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Images</label>
              <div className="space-y-2">
                {formData.imageUrl && (
                  <div className="flex items-center space-x-2 p-2 bg-gray-50 rounded">
                    <img
                      src={formData.imageUrl.startsWith('http') ? formData.imageUrl : `${ROOT_URL}${formData.imageUrl}`}
                      alt="Event image"
                      className="w-16 h-16 object-cover rounded"
                      onError={(e) => {
                        e.currentTarget.src = '';
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                    <div className="flex-1">
                      <input
                        type="text"
                        value={formData.imageUrl}
                        onChange={(e) => setFormData((prev) => ({ ...prev, imageUrl: e.target.value }))}
                        className="w-full p-1 border border-gray-300 rounded text-sm"
                        placeholder="Image URL"
                        readOnly={formData.imageUrl.startsWith('/postimages/')}
                      />
                      <input
                        type="text"
                        value="Event image"
                        className="w-full p-1 border border-gray-300 rounded text-sm mt-1"
                        placeholder="Alt text"
                        readOnly
                      />
                    </div>
                    <button
                      onClick={() => setFormData((prev) => ({ ...prev, imageUrl: '' }))}
                      className="px-2 py-1 bg-red-500 text-white text-sm rounded hover:bg-red-600 transition-colors"
                    >
                      Remove
                    </button>
                  </div>
                )}

                <div className="flex space-x-2">
                  <button
                    type="button"
                    onClick={() => setFormData((prev) => ({ ...prev, imageUrl: '' }))}
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                  >
                    + Add Image URL
                  </button>

                  <div className="relative">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={onUploadImage}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                    <button
                      type="button"
                      className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
                    >
                      + Upload Image
                    </button>
                  </div>
                </div>

                {!formData.imageUrl && (
                  <div className="mt-2">
                    <input
                      type="text"
                      value={formData.imageUrl}
                      onChange={(e) => setFormData((prev) => ({ ...prev, imageUrl: e.target.value }))}
                      className="w-full p-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter image URL"
                    />
                  </div>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Venue</label>
              <input
                type="text"
                value={formData.venue}
                onChange={(e) => setFormData((prev) => ({ ...prev, venue: e.target.value }))}
                className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 font-bold"
                placeholder="Enter venue name and address"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Google Maps Link</label>
                <input
                  type="text"
                  value={formData.googleMapsLink}
                  onChange={(e) => setFormData((prev) => ({ ...prev, googleMapsLink: e.target.value }))}
                  className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter Google Maps link"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Venue Website</label>
                <input
                  type="text"
                  value={formData.venueWebsite}
                  onChange={(e) => setFormData((prev) => ({ ...prev, venueWebsite: e.target.value }))}
                  className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter venue website URL"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Event Website</label>
                <input
                  type="text"
                  value={formData.eventWebsite}
                  onChange={(e) => setFormData((prev) => ({ ...prev, eventWebsite: e.target.value }))}
                  className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter event website URL"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Organizer Name</label>
                <input
                  type="text"
                  value={formData.organizerName}
                  onChange={(e) => setFormData((prev) => ({ ...prev, organizerName: e.target.value }))}
                  className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter organizer name"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Organizer Website</label>
              <input
                type="text"
                value={formData.organizerWebsite}
                onChange={(e) => setFormData((prev) => ({ ...prev, organizerWebsite: e.target.value }))}
                className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter organizer website URL"
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
              onClick={onSubmit}
              className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition-colors"
            >
              {editingEvent ? 'Update Event' : 'Create Event'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventEditModal;
