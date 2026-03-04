import { Component, type ErrorInfo, type ReactNode, useEffect, useState } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { apiService, Event } from "@/services/apiService";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { sanitizeRichContent } from "@/lib/sanitizeHtml";

class EventsErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean }> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): { hasError: boolean } {
    return { hasError: true };
  }

  componentDidCatch(error: Error, _errorInfo: ErrorInfo) {
    console.error("Events page render error:", error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-orange-50 px-4 text-center">
          <div>
            <h2 className="text-2xl font-bold text-kibo-purple">Events could not be displayed</h2>
            <p className="mt-3 text-gray-600">Please refresh this page. If the issue continues, check event data in the admin panel.</p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

const EventsContent = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeEvent, setActiveEvent] = useState<Event | null>(null);
  const [upcomingEvents, setUpcomingEvents] = useState<Event[]>([]);
  const [ongoingEvents, setOngoingEvents] = useState<Event[]>([]);
  const [pastEvents, setPastEvents] = useState<Event[]>([]);
  const [cancelledEvents, setCancelledEvents] = useState<Event[]>([]);
  const [activeFilter, setActiveFilter] = useState<'upcoming' | 'ongoing' | 'past' | 'cancelled'>('upcoming');
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      setIsLoading(true);
      setLoadError(null);
      const response = await apiService.getAllEvents({ limit: 1000 });
      const allEvents = Array.isArray(response) ? response : [];
      
      // Separate events into upcoming, ongoing, past, and cancelled based only on status
      const upcoming = allEvents.filter(event => event.status === 'upcoming');
      const ongoing = allEvents.filter(event => event.status === 'ongoing');
      const past = allEvents.filter(event => event.status === 'completed');
      const cancelled = allEvents.filter(event => event.status === 'cancelled');
      
      setUpcomingEvents(upcoming);
      setOngoingEvents(ongoing);
      setPastEvents(past);
      setCancelledEvents(cancelled);
    } catch (error) {
      console.error('Error fetching events:', error);
      setLoadError('Events could not be loaded right now. Please try again in a moment.');
      setUpcomingEvents([]);
      setOngoingEvents([]);
      setPastEvents([]);
      setCancelledEvents([]);
    } finally {
      setIsLoading(false);
    }
  };

  const openEventModal = (event: Event) => {
    setActiveEvent(event);
    setIsModalOpen(true);
  };

  const parseDate = (dateString: string) => {
    const date = new Date(dateString);
    return Number.isNaN(date.getTime()) ? null : date;
  };

  const formatYear = (dateString: string) => {
    const date = parseDate(dateString);
    return date ? date.getFullYear().toString() : 'N/A';
  };

  const formatDateTime = (dateString: string) => {
    const date = parseDate(dateString);
    if (!date) {
      return 'Date TBD';
    }

    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getEventDateInfo = (event: Event) => {
    const startDate = parseDate(event.startDate);

    if (!startDate) {
      return {
        month: 'TBD',
        day: '--',
        dayName: 'TBD',
        year: 'N/A',
        dateRange: `${formatDateTime(event.startDate)} - ${formatDateTime(event.endDate)}`
      };
    }
    
    return {
      month: startDate.toLocaleDateString('en-US', { month: 'short' }).toUpperCase(),
      day: startDate.getDate(),
      dayName: startDate.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase(),
      year: startDate.getFullYear(),
      dateRange: `${formatDateTime(event.startDate)} - ${formatDateTime(event.endDate)}`
    };
  };
  
  return (
    <div className="min-h-screen flex flex-col bg-orange-50">
      <Header />

      {/* --- Events Banner Section --- */}
      <div className="bg-gradient-to-r from-kibo-purple to-kibo-orange overflow-hidden">
        <div className="container mx-auto px-4 flex items-center h-64 overflow-hidden">
          <div className="w-full text-center">
            <h2 className="text-3xl font-bold text-white mb-4">Events</h2>
            <p className="text-white/90">
              Upcoming events and activities with KIBO
            </p>
          </div>
        </div>
      </div>

      {/* Content Section */}
      <div className="flex-1 py-16">
        <div className="container mx-auto px-4 max-w-4xl">

          {isLoading ? (
            <div className="text-center py-8">
              <p className="text-gray-500 text-lg">Loading events...</p>
            </div>
          ) : (
            <>
              {/* Event Filter Tabs */}
              <div className="mb-8">
                {loadError && (
                  <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {loadError}
                  </div>
                )}

                <Tabs value={activeFilter} onValueChange={(value: string) => setActiveFilter(value as 'upcoming' | 'ongoing' | 'past' | 'cancelled')}>
                  <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="upcoming">Upcoming Events ({upcomingEvents.length})</TabsTrigger>
                    <TabsTrigger value="ongoing">Ongoing Events ({ongoingEvents.length})</TabsTrigger>
                    <TabsTrigger value="past">Past Events ({pastEvents.length})</TabsTrigger>
                    <TabsTrigger value="cancelled">Cancelled Events ({cancelledEvents.length})</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="upcoming" className="mt-6">
                    {upcomingEvents.length > 0 ? (
                      upcomingEvents.map((event) => {
                        const dateInfo = getEventDateInfo(event);
                        return (
                          <div key={event.id} className="bg-purple-200 rounded-lg shadow-md overflow-hidden border border-gray-200 mb-6">
                            <div className="p-6">
                              <div className="flex flex-col md:flex-row gap-6">
                                {/* Date Section */}
                                <div className="flex-shrink-0 text-center">
                                  <div className="bg-orange-50 rounded-lg p-4 w-20 h-full flex flex-col justify-center items-center">
                                    <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">{dateInfo.month}</div>
                                    <div className="text-2xl font-bold text-gray-800 mb-1">{dateInfo.day}</div>
                                    <div className="text-sm font-bold text-gray-700">
                                      {dateInfo.dayName}
                                    </div>
                                    <div className="text-xs font-semibold text-gray-600 mt-1">
                                      {dateInfo.year}
                                    </div>
                                  </div>
                                </div>

                                {/* Event Details */}
                                <div className="flex-1">
                                  <div className="text-sm text-gray-600 mb-2">
                                    {dateInfo.dateRange}
                                  </div>

                                  <h3
                                    className="text-2xl font-bold text-kibo-purple mb-4 cursor-pointer hover:text-kibo-orange transition-colors"
                                    onClick={() => openEventModal(event)}
                                  >
                                    {event.title}
                                  </h3>

                                  <div className="text-gray-700 mb-4">
                                    <strong>{event.venueName}</strong>
                                    {event.venueAddress && <span>{event.venueAddress}</span>}
                                    {event.venueCity && <span>, {event.venueCity}</span>}
                                    {event.venueState && <span>, {event.venueState}</span>}
                                    {event.venueCountry && <span>, {event.venueCountry}</span>}
                                  </div>

                                  <p className="text-gray-600 leading-relaxed">
                                    {event.excerpt}
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="text-center py-8">
                        <p className="text-gray-500 text-lg">No upcoming events found.</p>
                      </div>
                    )}
                  </TabsContent>
                  
                  <TabsContent value="ongoing" className="mt-6">
                    {ongoingEvents.length > 0 ? (
                      ongoingEvents.map((event) => {
                        const dateInfo = getEventDateInfo(event);
                        return (
                          <div key={event.id} className="bg-purple-200 rounded-lg shadow-md overflow-hidden border border-gray-200 mb-6">
                            <div className="p-6">
                              <div className="flex flex-col md:flex-row gap-6">
                                {/* Date Section */}
                                <div className="flex-shrink-0 text-center">
                                  <div className="bg-orange-50 rounded-lg p-4 w-20 h-full flex flex-col justify-center items-center">
                                    <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">{dateInfo.month}</div>
                                    <div className="text-2xl font-bold text-gray-800 mb-1">{dateInfo.day}</div>
                                    <div className="text-sm font-bold text-gray-700">
                                      {dateInfo.dayName}
                                    </div>
                                    <div className="text-xs font-semibold text-gray-600 mt-1">
                                      {dateInfo.year}
                                    </div>
                                  </div>
                                </div>

                                {/* Event Details */}
                                <div className="flex-1">
                                  <div className="text-sm text-gray-600 mb-2">
                                    {dateInfo.dateRange}
                                  </div>

                                  <h3
                                    className="text-2xl font-bold text-kibo-purple mb-4 cursor-pointer hover:text-kibo-orange transition-colors"
                                    onClick={() => openEventModal(event)}
                                  >
                                    {event.title}
                                  </h3>

                                  <div className="text-gray-700 mb-4">
                                    <strong>{event.venueName}</strong>
                                    {event.venueAddress && <span>{event.venueAddress}</span>}
                                    {event.venueCity && <span>, {event.venueCity}</span>}
                                    {event.venueState && <span>, {event.venueState}</span>}
                                    {event.venueCountry && <span>, {event.venueCountry}</span>}
                                  </div>

                                  <p className="text-gray-600 leading-relaxed">
                                    {event.excerpt}
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="text-center py-8">
                        <p className="text-gray-500 text-lg">No ongoing events found.</p>
                      </div>
                    )}
                  </TabsContent>
                  
                  <TabsContent value="past" className="mt-6">
                    {pastEvents.length > 0 ? (
                      pastEvents.map((event) => {
                        const dateInfo = getEventDateInfo(event);
                        return (
                          <div key={event.id} className="bg-purple-200 rounded-lg shadow-md overflow-hidden border border-gray-200 mb-6">
                            <div className="p-6">
                              <div className="flex flex-col md:flex-row gap-6">
                                {/* Date Section */}
                                <div className="flex-shrink-0 text-center">
                                  <div className="bg-orange-50 rounded-lg p-4 w-20 h-full flex flex-col justify-center items-center">
                                    <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">{dateInfo.month}</div>
                                    <div className="text-2xl font-bold text-gray-800 mb-1">{dateInfo.day}</div>
                                    <div className="text-sm font-bold text-gray-700">
                                      {dateInfo.dayName}
                                    </div>
                                    <div className="text-xs font-semibold text-gray-600 mt-1">
                                      {dateInfo.year}
                                    </div>
                                  </div>
                                </div>

                                {/* Event Details */}
                                <div className="flex-1">
                                  <div className="text-sm text-gray-600 mb-2">
                                    {dateInfo.dateRange}
                                  </div>

                                  <h3
                                    className="text-2xl font-bold text-kibo-purple mb-4 cursor-pointer hover:text-kibo-orange transition-colors"
                                    onClick={() => openEventModal(event)}
                                  >
                                    {event.title}
                                  </h3>

                                  <div className="text-gray-700 mb-4">
                                    <strong>{event.venueName}</strong>
                                    {event.venueAddress && <span>{event.venueAddress}</span>}
                                    {event.venueCity && <span>, {event.venueCity}</span>}
                                    {event.venueState && <span>, {event.venueState}</span>}
                                    {event.venueCountry && <span>, {event.venueCountry}</span>}
                                  </div>

                                  <p className="text-gray-600 leading-relaxed">
                                    {event.excerpt}
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="text-center py-8">
                        <p className="text-gray-500 text-lg">No past events found.</p>
                      </div>
                    )}
                  </TabsContent>
                  
                  <TabsContent value="cancelled" className="mt-6">
                    {cancelledEvents.length > 0 ? (
                      cancelledEvents.map((event) => {
                        const dateInfo = getEventDateInfo(event);
                        return (
                          <div key={event.id} className="bg-purple-200 rounded-lg shadow-md overflow-hidden border border-gray-200 mb-6">
                            <div className="p-6">
                              <div className="flex flex-col md:flex-row gap-6">
                                {/* Date Section */}
                                <div className="flex-shrink-0 text-center">
                                  <div className="bg-orange-50 rounded-lg p-4 w-20 h-full flex flex-col justify-center items-center">
                                    <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">{dateInfo.month}</div>
                                    <div className="text-2xl font-bold text-gray-800 mb-1">{dateInfo.day}</div>
                                    <div className="text-sm font-bold text-gray-700">
                                      {dateInfo.dayName}
                                    </div>
                                    <div className="text-xs font-semibold text-gray-600 mt-1">
                                      {dateInfo.year}
                                    </div>
                                  </div>
                                </div>

                                {/* Event Details */}
                                <div className="flex-1">
                                  <div className="text-sm text-gray-600 mb-2">
                                    {dateInfo.dateRange}
                                  </div>

                                  <h3
                                    className="text-2xl font-bold text-kibo-purple mb-4 cursor-pointer hover:text-kibo-orange transition-colors"
                                    onClick={() => openEventModal(event)}
                                  >
                                    {event.title}
                                  </h3>

                                  <div className="text-gray-700 mb-4">
                                    <strong>{event.venueName}</strong>
                                    {event.venueAddress && <span>{event.venueAddress}</span>}
                                    {event.venueCity && <span>, {event.venueCity}</span>}
                                    {event.venueState && <span>, {event.venueState}</span>}
                                    {event.venueCountry && <span>, {event.venueCountry}</span>}
                                  </div>

                                  <p className="text-gray-600 leading-relaxed">
                                    {event.excerpt}
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="text-center py-8">
                        <p className="text-gray-500 text-lg">No cancelled events found.</p>
                      </div>
                    )}
                  </TabsContent>
                </Tabs>
              </div>
            </>
          )}
        </div>
      </div>

      <Footer />

      {/* Modal */}
      {isModalOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={() => setIsModalOpen(false)}
        >
          <div
            className="bg-purple-200 rounded-lg w-[1400px] h-[900px] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {activeEvent && (
              <>
                {/* Modal Header */}
                <div className="flex justify-between items-start px-6 py-4 border-b border-kibo-purple">
                  <div className="flex-1">
                    <div className="text-sm text-gray-500 mb-1">
                      {activeEvent.status === 'completed' ? 'This event has passed.' :
                       activeEvent.status === 'upcoming' ? 'This event is upcoming.' :
                       activeEvent.status === 'ongoing' ? 'This event is currently ongoing.' :
                       'This event has been cancelled.'}
                    </div>
                    <h2 className="text-2xl font-bold text-kibo-purple">
                      {activeEvent.title}
                    </h2>
                    <div className="text-sm text-gray-600">
                      {formatDateTime(activeEvent.startDate)} - {formatDateTime(activeEvent.endDate)} ({formatYear(activeEvent.startDate)})
                    </div>
                  </div>
                  <button
                    onClick={() => setIsModalOpen(false)}
                    className="text-gray-400 hover:text-gray-600 text-2xl font-bold ml-4 flex-shrink-0"
                  >
                    ×
                  </button>
                </div>

                {/* Modal Content */}
                <div className="p-6">
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                    {/* Left Column - Event Image and Description */}
                    <div className="lg:col-span-2">
                      {activeEvent.imageUrl && (
                        <img
                          src={activeEvent.imageUrl}
                          alt={activeEvent.title}
                          className="w-full h-48 object-cover rounded-lg mb-6"
                        />
                      )}

                      <div className="space-y-4">
                        <div
                          className="text-gray-700"
                          dangerouslySetInnerHTML={{ __html: sanitizeRichContent(activeEvent.description) }}
                        />
                      </div>
                    </div>

                    {/* Right Column - Event Details */}
                    <div className="lg:col-span-1">
                      <div className="bg-orange-50 rounded-lg p-6">
                        <h3 className="text-lg font-bold text-gray-800 mb-4">Event Details</h3>
                         
                         <div className="space-y-4">
                           <div>
                             <h4 className="font-semibold text-gray-700 mb-1">Dates</h4>
                             <p className="text-gray-600">
                               {formatDateTime(activeEvent.startDate)} - {formatDateTime(activeEvent.endDate)}
                             </p>
                             <p className="text-gray-600">
                               <strong>Year:</strong> {formatYear(activeEvent.startDate)}
                             </p>
                           </div>
                           
                           {activeEvent.eventWebsite && (
                             <div>
                               <h4 className="font-semibold text-gray-700 mb-1">Website</h4>
                              <p className="text-gray-600">
                                <a 
                                  href={activeEvent.eventWebsite}
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="text-kibo-orange hover:underline"
                                >
                                  {activeEvent.eventWebsite}
                                </a>
                              </p>
                            </div>
                          )}
                          
                          <div>
                            <h4 className="font-semibold text-gray-700 mb-1">Venue</h4>
                            <p className="text-gray-600">
                              {activeEvent.venueName}
                            </p>
                            <p className="text-gray-600">
                              {activeEvent.venueAddress}
                              {activeEvent.venueCity && <span>, {activeEvent.venueCity}</span>}
                              {activeEvent.venueState && <span>, {activeEvent.venueState}</span>}
                              {activeEvent.venueZipCode && <span>, {activeEvent.venueZipCode}</span>}
                              {activeEvent.venueCountry && <span>, {activeEvent.venueCountry}</span>}
                            </p>
                            
                            {/* Venue Website */}
                            {activeEvent.venueWebsite && (
                              <div className="mt-2">
                                <a
                                  href={activeEvent.venueWebsite}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-kibo-orange hover:underline text-sm flex items-center"
                                >
                                  <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                    <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
                                  </svg>
                                  Visit Venue Website
                                </a>
                              </div>
                            )}
                            
                            {/* Google Maps Link */}
                            {activeEvent.googleMapsLink ? (
                              <div className="mt-2">
                                <a
                                  href={activeEvent.googleMapsLink}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-kibo-orange hover:underline text-sm flex items-center"
                                >
                                  <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                                  </svg>
                                  View on Google Maps
                                </a>
                              </div>
                            ) : (activeEvent.venueAddress || activeEvent.venueCity) && (
                              <div className="mt-2">
                                <a
                                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                                    `${activeEvent.venueAddress || ''} ${activeEvent.venueCity || ''} ${activeEvent.venueState || ''} ${activeEvent.venueZipCode || ''} ${activeEvent.venueCountry || ''}`
                                  )}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-kibo-orange hover:underline text-sm flex items-center"
                                >
                                  <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                                  </svg>
                                  View on Google Maps
                                </a>
                              </div>
                            )}
                          </div>
                          
                          {activeEvent.organizerName && (
                            <div>
                              <h4 className="font-semibold text-gray-700 mb-1">Organizer</h4>
                              <p className="text-gray-600">
                                {activeEvent.organizerName}
                                {activeEvent.organizerWebsite && (
                                  <a
                                    href={activeEvent.organizerWebsite}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-kibo-orange hover:underline ml-2"
                                  >
                                    (Website)
                                  </a>
                                )}
                              </p>
                            </div>
                          )}
                          
                          <div>
                            <h4 className="font-semibold text-gray-700 mb-1">Category</h4>
                            <p className="text-gray-600 capitalize">{activeEvent.category}</p>
                          </div>
                          
                          <div>
                            <h4 className="font-semibold text-gray-700 mb-1">Status</h4>
                            <p className="text-gray-600 capitalize">{activeEvent.status}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const Events = () => (
  <EventsErrorBoundary>
    <EventsContent />
  </EventsErrorBoundary>
);

export default Events;
