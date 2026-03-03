import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Event } from '@/services/apiService';

interface AdminEventsTabProps {
  events: Event[];
  onCreateEvent: () => void;
  onEditEvent: (event: Event) => void;
  onDeleteEvent: (event: Event) => void;
}

const AdminEventsTab: React.FC<AdminEventsTabProps> = ({
  events,
  onCreateEvent,
  onEditEvent,
  onDeleteEvent,
}) => {
  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Events</CardTitle>
          <button
            onClick={onCreateEvent}
            className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition-colors"
          >
            + New Event
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
                <th className="border p-2 text-left">Start Date</th>
                <th className="border p-2 text-left">End Date</th>
                <th className="border p-2 text-left">Venue</th>
                <th className="border p-2 text-left">Status</th>
                <th className="border p-2 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {events.length === 0 ? (
                <tr>
                  <td colSpan={7} className="border p-4 text-center text-gray-500">No events found yet</td>
                </tr>
              ) : (
                events.map((event) => (
                  <tr key={event.id} className="hover:bg-gray-50">
                    <td className="border p-2">{event.id}</td>
                    <td className="border p-2">
                      <div className="max-w-xs truncate" title={event.title}>
                        {event.title}
                      </div>
                    </td>
                    <td className="border p-2">{new Date(event.startDate).toLocaleDateString('en-US')}</td>
                    <td className="border p-2">{new Date(event.endDate).toLocaleDateString('en-US')}</td>
                    <td className="border p-2">
                      <div className="max-w-xs truncate" title={event.venueName}>
                        {event.venueName}
                        {event.venueWebsite && (
                          <div className="text-sm text-blue-600">
                            <a href={event.venueWebsite} target="_blank" rel="noopener noreferrer" className="hover:underline">
                              Venue Website
                            </a>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="border p-2">
                      <span
                        className={
                          event.status === 'upcoming'
                            ? 'bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs'
                            : event.status === 'ongoing'
                              ? 'bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs'
                              : event.status === 'completed'
                                ? 'bg-gray-100 text-gray-800 px-2 py-1 rounded-full text-xs'
                                : 'bg-red-100 text-red-800 px-2 py-1 rounded-full text-xs'
                        }
                      >
                        {event.status}
                      </span>
                    </td>
                    <td className="border p-2">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => onEditEvent(event)}
                          className="px-3 py-1 bg-blue-500 text-white text-sm rounded hover:bg-blue-600 transition-colors"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => onDeleteEvent(event)}
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

export default AdminEventsTab;
