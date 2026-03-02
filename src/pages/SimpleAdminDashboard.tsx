import React, { useState, useEffect, useCallback } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ROOT_URL } from '@/services/apiService';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/context/AuthContext';
import { Navigate } from 'react-router-dom';
import apiService, { Order, User, Contact, BlogPost, PressRelease, Event, MediaCoverage } from '@/services/apiService';
import RichTextEditor from '@/components/RichTextEditor';

const getErrorMessage = (error: unknown, fallback: string): string => {
  return error instanceof Error ? error.message : fallback;
};

const getErrorStatus = (error: unknown): number | null => {
  if (typeof error !== 'object' || error === null || !('response' in error)) {
    return null;
  }

  const response = (error as { response?: { status?: unknown } }).response;
  return typeof response?.status === 'number' ? response.status : null;
};

const SimpleAdminDashboard = () => {
  const { user, isInitializing } = useAuth();
  const { toast: uiToast } = useToast();
  const toast = {
    success: (message: string) => uiToast({ title: 'Success', description: message }),
    error: (message: string) => uiToast({ title: 'Error', description: message }),
    info: (message: string) => uiToast({ title: 'Info', description: message }),
  };
  const [isLoading, setIsLoading] = useState(true);
  const [orders, setOrders] = useState<Order[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [blogPosts, setBlogPosts] = useState<BlogPost[]>([]);
  const [pressReleases, setPressReleases] = useState<PressRelease[]>([]);
  const [mediaCoverages, setMediaCoverages] = useState<MediaCoverage[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [serverStatus, setServerStatus] = useState<'connected' | 'disconnected'>('disconnected');
  
  // Sorting states
  const [orderSortField, setOrderSortField] = useState<keyof Order>('createdAt');
  const [orderSortDirection, setOrderSortDirection] = useState<'asc' | 'desc'>('desc');
  
  // Contact filter
  const [contactTypeFilter, setContactTypeFilter] = useState<string>('all');
  
  // Selected contact for detailed view
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [showContactModal, setShowContactModal] = useState(false);
  
  // Contact editing state
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  const [showContactEditModal, setShowContactEditModal] = useState(false);
  
  // Order editing state
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [showOrderEditModal, setShowOrderEditModal] = useState(false);
  
  // Delete confirmation state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteItem, setDeleteItem] = useState<{type: string, id: string, name: string} | null>(null);

  // Delete confirmation handler
  const handleDeleteClick = (type: string, id: string, name: string) => {
    setDeleteItem({ type, id, name });
    setShowDeleteModal(true);
  };

  // Confirm delete action
  const confirmDelete = async () => {
    if (!deleteItem) return;
    
    try {
      switch (deleteItem.type) {
        case 'order':
          await apiService.deleteOrder(deleteItem.id);
          break;
        case 'contact':
          await apiService.deleteContact(deleteItem.id);
          break;
        case 'user':
          await apiService.deleteUser(deleteItem.id);
          break;
        case 'blog':
          await apiService.deleteBlogPost(deleteItem.id);
          break;
        case 'press':
          await apiService.deletePressRelease(deleteItem.id);
          break;
        case 'media':
          await apiService.deleteMediaCoverage(deleteItem.id);
          break;
        case 'event':
          await apiService.deleteEvent(deleteItem.id);
          break;
      }
      
      await loadData();
      uiToast({
        title: "Başarıyla Silindi",
        description: `${deleteItem.name} başarıyla silindi.`,
      });
      setShowDeleteModal(false);
      setDeleteItem(null);
    } catch (error) {
      uiToast({
        title: "Silme Hatası",
        description: `Hata: ${getErrorMessage(error, 'Bilinmeyen hata')}`,
      });
    }
  };

  // Load data
  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const allOrders = await apiService.getAllOrders();
      const allUsers = await apiService.getAllUsers();
      const allContacts = await apiService.getAllContacts();
      const allBlogPosts = await apiService.getAllBlogPosts();
      const allPressReleases = await apiService.getAllPressReleases();
      const allMediaCoverages = await apiService.getAllMediaCoverages();
      const allEvents = await apiService.getAllEvents();

      setOrders(allOrders);
      setUsers(allUsers);
      setContacts(allContacts);
      setBlogPosts(allBlogPosts);
      setPressReleases(allPressReleases);
      setMediaCoverages(allMediaCoverages);
      setEvents(allEvents);
      setServerStatus('connected');
      uiToast({ title: 'Success', description: 'Data loaded successfully!' });
    } catch (error) {
      console.error('Data loading error:', error);
      setServerStatus('disconnected');
      uiToast({
        title: 'Error',
        description: 'Data loading error: ' + getErrorMessage(error, 'Unknown error'),
      });
    } finally {
      setIsLoading(false);
    }
  }, [uiToast]);
  
  // Sort orders
  const sortOrders = (field: keyof Order) => {
    if (field === orderSortField) {
      setOrderSortDirection(orderSortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setOrderSortField(field);
      setOrderSortDirection('asc');
    }
  };
  
  // Get sorted orders
  const getSortedOrders = () => {
    return [...orders].sort((a, b) => {
      const aValue = a[orderSortField];
      const bValue = b[orderSortField];
      
      // Handle special cases for sorting
      if (orderSortField === 'totalAmount') {
        return orderSortDirection === 'asc' ? a.totalAmount - b.totalAmount : b.totalAmount - a.totalAmount;
      }
      
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return orderSortDirection === 'asc' 
          ? aValue.localeCompare(bValue) 
          : bValue.localeCompare(aValue);
      }
      
      return 0;
    });
  };
  
  // Get filtered contacts
  const getFilteredContacts = () => {
    if (contactTypeFilter === 'all') {
      return contacts;
    }
    return contacts.filter(contact => contact.type === contactTypeFilter);
  };



  // Update order status
  const updateOrderStatus = async (orderId: string, status: Order['status']) => {
    try {
      await apiService.updateOrderStatus(orderId, status);
      await loadData(); // Refresh data
      toast.success('Order status updated!');
    } catch (error) {
      toast.error('Update error: ' + getErrorMessage(error, 'Unknown error'));
    }
  };



  // Update contact status
  const updateContactStatus = async (contactId: string, status: Contact['status']) => {
    try {
      await apiService.updateContactStatus(contactId, status);
      await loadData(); // Refresh data
      toast.success('Contact status updated!');
    } catch (error) {
      toast.error('Update error: ' + getErrorMessage(error, 'Unknown error'));
    }
  };

















  // Event creation/editing state
  const [showEventModal, setShowEventModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [eventFormData, setEventFormData] = useState({
    title: '',
    description: '',
    excerpt: '',
    startDate: '',
    endDate: '',
    venue: '',
    googleMapsLink: '',
    venueWebsite: '',
    eventWebsite: '',
    organizerName: '',
    organizerWebsite: '',
    category: 'conference',
    status: 'upcoming' as 'upcoming' | 'ongoing' | 'completed' | 'cancelled',
    imageUrl: ''
  });

  const handleEventImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      let response;
      if (editingEvent) {
        // If editing an existing event, upload directly to the event
        response = await apiService.uploadEventImage(editingEvent.id, file);
      } else {
        // If creating a new event, upload to temp folder
        response = await apiService.uploadTempEventImage(file);
        toast.info('Image uploaded to temporary folder. It will be moved to the event folder after the event is created.');
      }
      
      setEventFormData({...eventFormData, imageUrl: response.imageUrl});
      toast.success('Image uploaded successfully!');
    } catch (error) {
      console.error('Error uploading image:', error);
      toast.error('Failed to upload image: ' + getErrorMessage(error, 'Unknown error'));
    }
  };

  const handleEventSubmit = async () => {
    try {
      // Validate required fields
      if (!eventFormData.title.trim()) {
        toast.error('Title is required!');
        return;
      }
      if (!eventFormData.description.trim()) {
        toast.error('Description is required!');
        return;
      }
      if (!eventFormData.startDate) {
        toast.error('Start date is required!');
        return;
      }
      if (!eventFormData.endDate) {
        toast.error('End date is required!');
        return;
      }


      // Transform form data to match API structure
      const apiData = {
        title: eventFormData.title,
        description: eventFormData.description,
        excerpt: eventFormData.excerpt,
        startDate: eventFormData.startDate,
        endDate: eventFormData.endDate,
        venueName: eventFormData.venue,
        venueAddress: '',
        venueCity: '',
        venueState: '',
        venueZipCode: '',
        venueCountry: '',
        venueWebsite: eventFormData.venueWebsite,
        googleMapsLink: eventFormData.googleMapsLink,
        organizerName: eventFormData.organizerName,
        organizerWebsite: eventFormData.organizerWebsite,
        eventWebsite: eventFormData.eventWebsite,
        category: eventFormData.category,
        status: eventFormData.status,
        imageUrl: eventFormData.imageUrl
      };

      if (editingEvent) {
        await apiService.updateEvent(editingEvent.id, apiData);
        toast.success('Event updated successfully!');
      } else {
        const newEvent = await apiService.createEvent(apiData);
        
        // Move image from temp folder to event folder if it's a temp image
        if (eventFormData.imageUrl && eventFormData.imageUrl.includes('/postimages/events/temp/images/')) {
          try {
            toast.info('Moving image to event folder...');
            // Create a File object from the blob
            const blob = await fetch(eventFormData.imageUrl).then(res => res.blob());
            const filename = eventFormData.imageUrl.split('/').pop() || 'image.jpg';
            const file = new File([blob], filename, { type: blob.type });
            
            await apiService.uploadEventImage(newEvent.id, file);
            // Update the event with the new image URL
            const updatedEvent = await apiService.getEvent(newEvent.id);
            if (updatedEvent.imageUrl) {
              setEventFormData(prev => ({...prev, imageUrl: updatedEvent.imageUrl || ''}));
            }
            toast.success('Image moved to event folder successfully!');
          } catch (error) {
            console.error('Error moving image to event folder:', error);
            toast.error('Failed to move image to event folder. Please try editing the event to add the image.');
          }
        }
        
        toast.success('Event created successfully!');
      }
      
      // Reload data and close modal
      await loadData();
      setShowEventModal(false);
      setEditingEvent(null);
      setEventFormData({
        title: '',
        description: '',
        excerpt: '',
        startDate: '',
        endDate: '',
        venue: '',
        googleMapsLink: '',
        venueWebsite: '',
        eventWebsite: '',
        organizerName: '',
        organizerWebsite: '',
        category: 'conference',
        status: 'upcoming',
        imageUrl: ''
      });
    } catch (error) {
      console.error('Event save error:', error);
      const status = getErrorStatus(error);
      if (status === 500) {
        toast.error('Server error. Please try again.');
      } else if (status === 400) {
        toast.error('Invalid data. Please check all fields.');
      } else {
        toast.error('Error: ' + getErrorMessage(error, 'An unknown error occurred.'));
      }
    }
  };

  const openEventModal = (event?: Event) => {
    if (event) {
      setEditingEvent(event);
      setEventFormData({
        title: event.title,
        description: event.description,
        excerpt: event.excerpt,
        startDate: event.startDate,
        endDate: event.endDate,
        venue: event.venueName, // Keep the original text with potential HTML
        googleMapsLink: event.googleMapsLink || '',
        venueWebsite: event.venueWebsite || '',
        eventWebsite: event.eventWebsite || '',
        organizerName: event.organizerName || '',
        organizerWebsite: event.organizerWebsite || '',
        category: event.category,
        status: event.status,
        imageUrl: event.imageUrl || ''
      });
    } else {
      setEditingEvent(null);
      setEventFormData({
        title: '',
        description: '',
        excerpt: '',
        startDate: '',
        endDate: '',
        venue: '',
        googleMapsLink: '',
        venueWebsite: '',
        eventWebsite: '',
        organizerName: '',
        organizerWebsite: '',
        category: 'conference',
        status: 'upcoming',
        imageUrl: ''
      });
    }
    setShowEventModal(true);
  };

  // Blog post creation/editing state
  const [showBlogModal, setShowBlogModal] = useState(false);
  const [editingBlogPost, setEditingBlogPost] = useState<BlogPost | null>(null);
  const [blogFormData, setBlogFormData] = useState({
    title: '',
    content: '',
    excerpt: '',
    author: user?.name || '',
    publishDate: new Date().toISOString(),
    status: 'draft' as 'draft' | 'published',
    images: [] as { src: string; alt: string }[]
  });
  const [uploadingImage, setUploadingImage] = useState(false);

  const handleBlogSubmit = async () => {
    try {
      // Validate required fields
      if (!blogFormData.title.trim()) {
        toast.error('Title is required!');
        return;
      }
      if (!blogFormData.content.trim()) {
        toast.error('Content is required!');
        return;
      }

      // Auto-fill author
      const formDataWithAuthor = {
        ...blogFormData,
        author: user?.name || 'Admin'
      };

      if (editingBlogPost) {
        await apiService.updateBlogPost(editingBlogPost.id, formDataWithAuthor);
        toast.success('Blog post updated successfully!');
      } else {
        await apiService.createBlogPost(formDataWithAuthor);
        toast.success('Blog post created successfully!');
      }
      
      // Reload data and close modal
      await loadData();
      setShowBlogModal(false);
      setEditingBlogPost(null);
      setBlogFormData({
        title: '',
        content: '',
        excerpt: '',
        author: user?.name || '',
        publishDate: new Date().toISOString(),
        status: 'draft',
        images: []
      });
    } catch (error) {
      console.error('Blog kaydetme hatası:', error);
      // More specific error handling
      const status = getErrorStatus(error);
      if (status === 500) {
        toast.error('Sunucu hatası. Lütfen tekrar deneyin.');
      } else if (status === 400) {
        toast.error('Geçersiz veri. Lütfen tüm alanları kontrol edin.');
      } else {
        toast.error('Hata: ' + getErrorMessage(error, 'Bilinmeyen bir hata oluştu.'));
      }
    }
  };

  // Handle image upload
  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    try {
      let result;
      if (editingBlogPost) {
        result = await apiService.uploadBlogImage(editingBlogPost.id, file);
      } else {
        result = await apiService.uploadTempBlogImage(file);
      }
      
      const newImage = {
        src: result.imageUrl,
        alt: file.name.replace(/\.[^/.]+$/, '') // Remove file extension
      };
      
      setBlogFormData({
        ...blogFormData,
        images: [...blogFormData.images, newImage]
      });
      
      toast.success('Image uploaded successfully!');
    } catch (error) {
      toast.error('Image upload failed: ' + getErrorMessage(error, 'Unknown error'));
    } finally {
      setUploadingImage(false);
      // Reset the file input
      event.target.value = '';
    }
  };

  const openBlogModal = (blogPost?: BlogPost) => {
    if (blogPost) {
      setEditingBlogPost(blogPost);
      setBlogFormData({
        title: blogPost.title,
        content: blogPost.content,
        excerpt: blogPost.excerpt,
        author: blogPost.author,
        publishDate: blogPost.publishDate || new Date().toISOString(),
        status: blogPost.status,
        images: blogPost.images || []
      });
    } else {
      setEditingBlogPost(null);
      setBlogFormData({
        title: '',
        content: '',
        excerpt: '',
        author: user?.name || '',
        publishDate: new Date().toISOString(),
        status: 'draft',
        images: []
      });
    }
    setShowBlogModal(true);
  };

  // Press release creation/editing state
  const [showPressReleaseModal, setShowPressReleaseModal] = useState(false);
  const [editingPressRelease, setEditingPressRelease] = useState<PressRelease | null>(null);
  const [pressReleaseFormData, setPressReleaseFormData] = useState({
    title: '',
    content: '',
    excerpt: '',
    author: user?.name || '',
    publishDate: new Date().toISOString(),
    status: 'draft' as 'draft' | 'published',
    images: [] as { src: string; alt: string }[]
  });
  const [uploadingPressReleaseImage, setUploadingPressReleaseImage] = useState(false);

  const handlePressReleaseSubmit = async () => {
    try {
      // Validate required fields
      if (!pressReleaseFormData.title.trim()) {
        toast.error('Title is required!');
        return;
      }
      if (!pressReleaseFormData.content.trim()) {
        toast.error('Content is required!');
        return;
      }


      let result;
      if (editingPressRelease) {
        result = await apiService.updatePressRelease(editingPressRelease.id, pressReleaseFormData);
        toast.success('Press release updated successfully!');
      } else {
        result = await apiService.createPressRelease(pressReleaseFormData);
        toast.success('Press release created successfully!');
      }
      
      // Reload data and close modal
      await loadData();
      setShowPressReleaseModal(false);
      setEditingPressRelease(null);
      setPressReleaseFormData({
        title: '',
        content: '',
        excerpt: '',
        author: user?.name || '',
        publishDate: new Date().toISOString(),
        status: 'draft',
        images: []
      });
    } catch (error) {
      console.error('Press release save error:', error);
      const status = getErrorStatus(error);
      if (status === 500) {
        toast.error('Server error. Please try again.');
      } else if (status === 400) {
        toast.error('Invalid data. Please check all fields.');
      } else {
        toast.error('Error: ' + getErrorMessage(error, 'An unknown error occurred.'));
      }
    }
  };

  const handlePressReleaseImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploadingPressReleaseImage(true);
    try {
      let result;
      if (editingPressRelease) {
        result = await apiService.uploadPressReleaseImage(editingPressRelease.id, file);
      } else {
        result = await apiService.uploadTempPressReleaseImage(file);
      }
      
      const newImage = {
        src: result.imageUrl,
        alt: file.name.replace(/\.[^/.]+$/, '') // Remove file extension
      };
      
      setPressReleaseFormData({
        ...pressReleaseFormData,
        images: [...pressReleaseFormData.images, newImage]
      });
      
      toast.success('Image uploaded successfully!');
    } catch (error) {
      toast.error('Image upload failed: ' + getErrorMessage(error, 'Unknown error'));
    } finally {
      setUploadingPressReleaseImage(false);
      // Reset the file input
      event.target.value = '';
    }
  };

  const openPressReleaseModal = (pressRelease?: PressRelease) => {
    if (pressRelease) {
      setEditingPressRelease(pressRelease);
      setPressReleaseFormData({
        title: pressRelease.title,
        content: pressRelease.content,
        excerpt: pressRelease.excerpt,
        author: pressRelease.author,
        publishDate: pressRelease.publishDate || new Date().toISOString(),
        status: pressRelease.status,
        images: pressRelease.images || []
      });
    } else {
      setEditingPressRelease(null);
      setPressReleaseFormData({
        title: '',
        content: '',
        excerpt: '',
        author: user?.name || '',
        publishDate: new Date().toISOString(),
        status: 'draft',
        images: []
      });
    }
    setShowPressReleaseModal(true);
  };

  // Media coverage creation/editing state
  const [showMediaCoverageModal, setShowMediaCoverageModal] = useState(false);
  const [editingMediaCoverage, setEditingMediaCoverage] = useState<MediaCoverage | null>(null);
  const [mediaCoverageFormData, setMediaCoverageFormData] = useState({
    title: '',
    content: '',
    excerpt: '',
    author: user?.name || '',
    publishDate: new Date().toISOString(),
    status: 'draft' as 'draft' | 'published',
    images: [] as { src: string; alt: string }[]
  });
  const [uploadingMediaCoverageImage, setUploadingMediaCoverageImage] = useState(false);

  const handleMediaCoverageSubmit = async () => {
    try {
      // Validate required fields
      if (!mediaCoverageFormData.title.trim()) {
        toast.error('Title is required!');
        return;
      }
      if (!mediaCoverageFormData.content.trim()) {
        toast.error('Content is required!');
        return;
      }

      let result;
      if (editingMediaCoverage) {
        result = await apiService.updateMediaCoverage(editingMediaCoverage.id, mediaCoverageFormData);
        toast.success('Media coverage updated successfully!');
      } else {
        result = await apiService.createMediaCoverage(mediaCoverageFormData);
        toast.success('Media coverage created successfully!');
      }
      
      // Reload data and close modal
      await loadData();
      setShowMediaCoverageModal(false);
      setEditingMediaCoverage(null);
      setMediaCoverageFormData({
        title: '',
        content: '',
        excerpt: '',
        author: user?.name || '',
        publishDate: new Date().toISOString(),
        status: 'draft',
        images: []
      });
    } catch (error) {
      console.error('Media coverage save error:', error);
      const status = getErrorStatus(error);
      if (status === 500) {
        toast.error('Server error. Please try again.');
      } else if (status === 400) {
        toast.error('Invalid data. Please check all fields.');
      } else {
        toast.error('Error: ' + getErrorMessage(error, 'An unknown error occurred.'));
      }
    }
  };

  const handleMediaCoverageImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploadingMediaCoverageImage(true);
    try {
      let result;
      if (editingMediaCoverage) {
        result = await apiService.uploadMediaCoverageImage(editingMediaCoverage.id, file);
      } else {
        result = await apiService.uploadTempMediaCoverageImage(file);
      }
      
      const newImage = {
        src: result.imageUrl,
        alt: file.name.replace(/\.[^/.]+$/, '') // Remove file extension
      };
      
      setMediaCoverageFormData({
        ...mediaCoverageFormData,
        images: [...mediaCoverageFormData.images, newImage]
      });
      
      toast.success('Image uploaded successfully!');
    } catch (error) {
      toast.error('Image upload failed: ' + getErrorMessage(error, 'Unknown error'));
    } finally {
      setUploadingMediaCoverageImage(false);
      // Reset the file input
      event.target.value = '';
    }
  };

  const openMediaCoverageModal = (mediaCoverage?: MediaCoverage) => {
    if (mediaCoverage) {
      setEditingMediaCoverage(mediaCoverage);
      setMediaCoverageFormData({
        title: mediaCoverage.title,
        content: mediaCoverage.content,
        excerpt: mediaCoverage.excerpt,
        author: mediaCoverage.author,
        publishDate: mediaCoverage.publishDate || new Date().toISOString(),
        status: mediaCoverage.status,
        images: mediaCoverage.images || []
      });
    } else {
      setEditingMediaCoverage(null);
      setMediaCoverageFormData({
        title: '',
        content: '',
        excerpt: '',
        author: user?.name || '',
        publishDate: new Date().toISOString(),
        status: 'draft',
        images: []
      });
    }
    setShowMediaCoverageModal(true);
  };

  useEffect(() => {
    loadData();

    // Server bağlantısını kontrol et
    const checkServerConnection = async () => {
      try {
        await apiService.getAllUsers();
        setServerStatus('connected');
      } catch (error) {
        setServerStatus('disconnected');
      }
    };

    checkServerConnection();
    const interval = setInterval(checkServerConnection, 30000); // Her 30 saniyede bir kontrol et

    return () => clearInterval(interval);
  }, [loadData]);

  const totalRevenue = orders.reduce((sum, order) => sum + order.totalAmount, 0);

  // Order statuses (4 categories)
  const receivedOrders = orders.filter(order => order.status === 'received').length;
  const preparingOrders = orders.filter(order => order.status === 'preparing').length;
  const shippingOrders = orders.filter(order => order.status === 'shipping').length;
  const deliveredOrders = orders.filter(order => order.status === 'delivered').length;



  // Contact status (answered contacts are automatically considered closed)
  const newContacts = contacts.filter(contact => contact.status === 'new').length;
  const reviewingContacts = contacts.filter(contact => contact.status === 'reviewing').length;
  const answeredContacts = contacts.filter(contact => contact.status === 'answered').length;

  // Blog status
  const draftBlogPosts = blogPosts.filter(post => post.status === 'draft').length;
  const publishedBlogPosts = blogPosts.filter(post => post.status === 'published').length;

  // Press Release status
  const draftPressReleases = pressReleases.filter(release => release.status === 'draft').length;
  const publishedPressReleases = pressReleases.filter(release => release.status === 'published').length;

  // Media Coverage status
  const draftMediaCoverages = mediaCoverages.filter(coverage => coverage.status === 'draft').length;
  const publishedMediaCoverages = mediaCoverages.filter(coverage => coverage.status === 'published').length;

  // Event status
  const upcomingEvents = events.filter(event => event.status === 'upcoming').length;
  const ongoingEvents = events.filter(event => event.status === 'ongoing').length;
  const completedEvents = events.filter(event => event.status === 'completed').length;
  const cancelledEvents = events.filter(event => event.status === 'cancelled').length;

  // Auth yüklenirken bekle
  if (isInitializing) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Admin kontrolü
  if (!user || !user.isAdmin) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="min-h-screen bg-orange-50 flex flex-col">
      <Header />

      <div className="flex-1 w-full px-2 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-purple-800">Admin Dashboard</h1>
          <div className="mt-2 flex items-center justify-between">
            <div className="flex items-center">
              <div className={`w-3 h-3 rounded-full mr-2 ${serverStatus === 'connected' ? 'bg-green-500' : 'bg-red-500'}`}></div>
              <span className="text-sm">
                {serverStatus === 'connected' ? 'Server connection active' : 'Server connection unavailable'}
              </span>
            </div>

          </div>
        </div>



        {/* Stats Cards - Vertical Column Layout */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3 mb-6">
          
          {/* Order Status Column */}
          <div className="space-y-2">
            <h3 className="text-sm font-bold text-purple-800 mb-2 text-center">Order Status</h3>
            <Card className="bg-blue-600 text-white">
              <CardHeader className="pb-1 px-3 pt-2">
                <CardTitle className="text-xs font-medium text-center">Received</CardTitle>
              </CardHeader>
              <CardContent className="px-3 pb-2">
                <div className="text-lg font-bold text-center">{receivedOrders}</div>
              </CardContent>
            </Card>
            <Card className="bg-blue-600 text-white">
              <CardHeader className="pb-1 px-3 pt-2">
                <CardTitle className="text-xs font-medium text-center">Preparing</CardTitle>
              </CardHeader>
              <CardContent className="px-3 pb-2">
                <div className="text-lg font-bold text-center">{preparingOrders}</div>
              </CardContent>
            </Card>
            <Card className="bg-blue-600 text-white">
              <CardHeader className="pb-1 px-3 pt-2">
                <CardTitle className="text-xs font-medium text-center">Shipping</CardTitle>
              </CardHeader>
              <CardContent className="px-3 pb-2">
                <div className="text-lg font-bold text-center">{shippingOrders}</div>
              </CardContent>
            </Card>
            <Card className="bg-blue-600 text-white">
              <CardHeader className="pb-1 px-3 pt-2">
                <CardTitle className="text-xs font-medium text-center">Delivered</CardTitle>
              </CardHeader>
              <CardContent className="px-3 pb-2">
                <div className="text-lg font-bold text-center">{deliveredOrders}</div>
              </CardContent>
            </Card>
          </div>

          {/* General Statistics Column */}
          <div className="space-y-2">
            <h3 className="text-sm font-bold text-purple-800 mb-2 text-center">General</h3>
            <Card className="bg-purple-600 text-white">
              <CardHeader className="pb-1 px-3 pt-2">
                <CardTitle className="text-xs font-medium text-center">Total Orders</CardTitle>
              </CardHeader>
              <CardContent className="px-3 pb-2">
                <div className="text-lg font-bold text-center">{orders.length}</div>
              </CardContent>
            </Card>
            <Card className="bg-purple-600 text-white">
              <CardHeader className="pb-1 px-3 pt-2">
                <CardTitle className="text-xs font-medium text-center">Revenue</CardTitle>
              </CardHeader>
              <CardContent className="px-3 pb-2">
                <div className="text-lg font-bold text-center">${totalRevenue.toFixed(0)}</div>
              </CardContent>
            </Card>
            <Card className="bg-purple-600 text-white">
              <CardHeader className="pb-1 px-3 pt-2">
                <CardTitle className="text-xs font-medium text-center">Total Users</CardTitle>
              </CardHeader>
              <CardContent className="px-3 pb-2">
                <div className="text-lg font-bold text-center">{users.length}</div>
              </CardContent>
            </Card>
          </div>

          {/* Contact Statistics Column */}
          <div className="space-y-2">
            <h3 className="text-sm font-bold text-purple-800 mb-2 text-center">Contacts</h3>
            <Card className="bg-orange-600 text-white">
              <CardHeader className="pb-1 px-3 pt-2">
                <CardTitle className="text-xs font-medium text-center">New</CardTitle>
              </CardHeader>
              <CardContent className="px-3 pb-2">
                <div className="text-lg font-bold text-center">{newContacts}</div>
              </CardContent>
            </Card>
            <Card className="bg-orange-600 text-white">
              <CardHeader className="pb-1 px-3 pt-2">
                <CardTitle className="text-xs font-medium text-center">Reviewing</CardTitle>
              </CardHeader>
              <CardContent className="px-3 pb-2">
                <div className="text-lg font-bold text-center">{reviewingContacts}</div>
              </CardContent>
            </Card>
            <Card className="bg-orange-600 text-white">
              <CardHeader className="pb-1 px-3 pt-2">
                <CardTitle className="text-xs font-medium text-center">Answered</CardTitle>
              </CardHeader>
              <CardContent className="px-3 pb-2">
                <div className="text-lg font-bold text-center">{answeredContacts}</div>
              </CardContent>
            </Card>
            <Card className="bg-orange-600 text-white">
              <CardHeader className="pb-1 px-3 pt-2">
                <CardTitle className="text-xs font-medium text-center">Total</CardTitle>
              </CardHeader>
              <CardContent className="px-3 pb-2">
                <div className="text-lg font-bold text-center">{contacts.length}</div>
              </CardContent>
            </Card>
          </div>

          {/* Blog Statistics Column */}
          <div className="space-y-2">
            <h3 className="text-sm font-bold text-purple-800 mb-2 text-center">Blog Posts</h3>
            <Card className="bg-green-600 text-white">
              <CardHeader className="pb-1 px-3 pt-2">
                <CardTitle className="text-xs font-medium text-center">Draft</CardTitle>
              </CardHeader>
              <CardContent className="px-3 pb-2">
                <div className="text-lg font-bold text-center">{draftBlogPosts}</div>
              </CardContent>
            </Card>
            <Card className="bg-green-600 text-white">
              <CardHeader className="pb-1 px-3 pt-2">
                <CardTitle className="text-xs font-medium text-center">Published</CardTitle>
              </CardHeader>
              <CardContent className="px-3 pb-2">
                <div className="text-lg font-bold text-center">{publishedBlogPosts}</div>
              </CardContent>
            </Card>
            <Card className="bg-green-600 text-white">
              <CardHeader className="pb-1 px-3 pt-2">
                <CardTitle className="text-xs font-medium text-center">Total</CardTitle>
              </CardHeader>
              <CardContent className="px-3 pb-2">
                <div className="text-lg font-bold text-center">{blogPosts.length}</div>
              </CardContent>
            </Card>
          </div>

          {/* Press Releases Column */}
          <div className="space-y-2">
            <h3 className="text-sm font-bold text-purple-800 mb-2 text-center">Press</h3>
            <Card className="bg-teal-600 text-white">
              <CardHeader className="pb-1 px-3 pt-2">
                <CardTitle className="text-xs font-medium text-center">Draft</CardTitle>
              </CardHeader>
              <CardContent className="px-3 pb-2">
                <div className="text-lg font-bold text-center">{draftPressReleases}</div>
              </CardContent>
            </Card>
            <Card className="bg-teal-600 text-white">
              <CardHeader className="pb-1 px-3 pt-2">
                <CardTitle className="text-xs font-medium text-center">Published</CardTitle>
              </CardHeader>
              <CardContent className="px-3 pb-2">
                <div className="text-lg font-bold text-center">{publishedPressReleases}</div>
              </CardContent>
            </Card>
            <Card className="bg-teal-600 text-white">
              <CardHeader className="pb-1 px-3 pt-2">
                <CardTitle className="text-xs font-medium text-center">Total</CardTitle>
              </CardHeader>
              <CardContent className="px-3 pb-2">
                <div className="text-lg font-bold text-center">{pressReleases.length}</div>
              </CardContent>
            </Card>
          </div>

          {/* Media Coverage Column */}
          <div className="space-y-2">
            <h3 className="text-sm font-bold text-purple-800 mb-2 text-center">Media</h3>
            <Card className="bg-cyan-600 text-white">
              <CardHeader className="pb-1 px-3 pt-2">
                <CardTitle className="text-xs font-medium text-center">Draft</CardTitle>
              </CardHeader>
              <CardContent className="px-3 pb-2">
                <div className="text-lg font-bold text-center">{draftMediaCoverages}</div>
              </CardContent>
            </Card>
            <Card className="bg-cyan-600 text-white">
              <CardHeader className="pb-1 px-3 pt-2">
                <CardTitle className="text-xs font-medium text-center">Published</CardTitle>
              </CardHeader>
              <CardContent className="px-3 pb-2">
                <div className="text-lg font-bold text-center">{publishedMediaCoverages}</div>
              </CardContent>
            </Card>
            <Card className="bg-cyan-600 text-white">
              <CardHeader className="pb-1 px-3 pt-2">
                <CardTitle className="text-xs font-medium text-center">Total</CardTitle>
              </CardHeader>
              <CardContent className="px-3 pb-2">
                <div className="text-lg font-bold text-center">{mediaCoverages.length}</div>
              </CardContent>
            </Card>
          </div>

          {/* Events Column */}
          <div className="space-y-2">
            <h3 className="text-sm font-bold text-purple-800 mb-2 text-center">Events</h3>
            <Card className="bg-indigo-600 text-white">
              <CardHeader className="pb-1 px-3 pt-2">
                <CardTitle className="text-xs font-medium text-center">Upcoming</CardTitle>
              </CardHeader>
              <CardContent className="px-3 pb-2">
                <div className="text-lg font-bold text-center">{upcomingEvents}</div>
              </CardContent>
            </Card>
            <Card className="bg-indigo-600 text-white">
              <CardHeader className="pb-1 px-3 pt-2">
                <CardTitle className="text-xs font-medium text-center">Ongoing</CardTitle>
              </CardHeader>
              <CardContent className="px-3 pb-2">
                <div className="text-lg font-bold text-center">{ongoingEvents}</div>
              </CardContent>
            </Card>
            <Card className="bg-indigo-600 text-white">
              <CardHeader className="pb-1 px-3 pt-2">
                <CardTitle className="text-xs font-medium text-center">Completed</CardTitle>
              </CardHeader>
              <CardContent className="px-3 pb-2">
                <div className="text-lg font-bold text-center">{completedEvents}</div>
              </CardContent>
            </Card>
            <Card className="bg-indigo-600 text-white">
              <CardHeader className="pb-1 px-3 pt-2">
                <CardTitle className="text-xs font-medium text-center">Cancelled</CardTitle>
              </CardHeader>
              <CardContent className="px-3 pb-2">
                <div className="text-lg font-bold text-center">{cancelledEvents}</div>
              </CardContent>
            </Card>
          </div>

        </div>

        {/* Main Content */}
        <Tabs defaultValue="orders" className="w-full">
          <TabsList className="grid w-full grid-cols-7">
            <TabsTrigger value="orders">Orders</TabsTrigger>
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="contacts">Contacts</TabsTrigger>
            <TabsTrigger value="blog">Blog Posts</TabsTrigger>
            <TabsTrigger value="press-releases">Press Releases</TabsTrigger>
            <TabsTrigger value="media-coverage">Media Coverage</TabsTrigger>
            <TabsTrigger value="events">Events</TabsTrigger>
          </TabsList>

          {/* Orders Tab */}
          <TabsContent value="orders" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Order List</CardTitle>
              </CardHeader>
              <CardContent className="p-2">
                <div className="overflow-x-auto w-full">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-gray-100">
                        <th className="border p-2 text-left cursor-pointer" onClick={() => sortOrders('id')}>
                          Order ID {orderSortField === 'id' && (orderSortDirection === 'asc' ? '↑' : '↓')}
                        </th>
                        <th className="border p-2 text-left">User ID</th>
                        <th className="border p-2 text-left cursor-pointer" onClick={() => sortOrders('customerName')}>
                          Full Name {orderSortField === 'customerName' && (orderSortDirection === 'asc' ? '↑' : '↓')}
                        </th>
                        <th className="border p-2 text-left cursor-pointer" onClick={() => sortOrders('customerEmail')}>
                          Email {orderSortField === 'customerEmail' && (orderSortDirection === 'asc' ? '↑' : '↓')}
                        </th>
                        <th className="border p-2 text-left cursor-pointer" onClick={() => sortOrders('totalAmount')}>
                          Amount {orderSortField === 'totalAmount' && (orderSortDirection === 'asc' ? '↑' : '↓')}
                        </th>
                        <th className="border p-2 text-left">Shipping Address</th>
                        <th className="border p-2 text-left cursor-pointer" onClick={() => sortOrders('status')}>
                          Status {orderSortField === 'status' && (orderSortDirection === 'asc' ? '↑' : '↓')}
                        </th>
                        <th className="border p-2 text-left cursor-pointer" onClick={() => sortOrders('createdAt')}>
                          Date {orderSortField === 'createdAt' && (orderSortDirection === 'asc' ? '↑' : '↓')}
                        </th>
                        <th className="border p-2 text-left">Items</th>
                        <th className="border p-2 text-left">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {orders.length === 0 ? (
                        <tr>
                          <td colSpan={9} className="border p-4 text-center text-gray-500">No orders found yet</td>
                        </tr>
                      ) : (
                        getSortedOrders().map(order => (
                          <tr key={order.id} className="hover:bg-gray-50">
                            <td className="border p-2">{order.id}</td>
                            <td className="border p-2">{order.userId}</td>
                            <td className="border p-2">{order.customerName}</td>
                            <td className="border p-2">{order.customerEmail}</td>
                            <td className="border p-2">${order.totalAmount.toFixed(2)}</td>
                            <td className="border p-2">
                              <div className="max-w-xs truncate" title={`${order.shippingAddress?.address || ''}, ${order.shippingAddress?.city || ''}, ${order.shippingAddress?.state || ''} ${order.shippingAddress?.zipCode || ''}`}>
                                {order.shippingAddress?.address || 'No address information'}
                              </div>
                            </td>
                            <td className="border p-2">
                              <span className={
                                order.status === 'received' ? 'bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs' :
                                  order.status === 'preparing' ? 'bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-xs' :
                                    order.status === 'shipping' ? 'bg-purple-100 text-purple-800 px-2 py-1 rounded-full text-xs' :
                                      'bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs'
                              }>
                                {order.status}
                              </span>
                            </td>
                            <td className="border p-2">{new Date(order.createdAt).toLocaleDateString('en-US')}</td>
                            <td className="border p-2">
                              <div className="max-h-20 overflow-y-auto text-xs">
                                {order.items && order.items.length > 0 ? order.items.map((item, idx) => (
                                  <div key={idx} className="mb-1 p-1 bg-gray-50 rounded">
                                    {item.quantity || 1}x {item.product_name || item.name || item.title || 'Unknown Product'} - ${(item.price || 0).toFixed(2)}
                                  </div>
                                )) : (
                                  <div className="text-gray-500">No items</div>
                                )}
                              </div>
                            </td>
                            <td className="border p-2">
                              <div className="flex space-x-2">
                                <button
                                  onClick={() => {
                                    setEditingOrder(order);
                                    setShowOrderEditModal(true);
                                  }}
                                  className="px-3 py-1 bg-blue-500 text-white text-sm rounded hover:bg-blue-600 transition-colors"
                                >
                                  Edit
                                </button>
                                <button
                                  onClick={() => handleDeleteClick('order', order.id, `Order #${order.id}`)}
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
          </TabsContent>


          {/* Users Tab */}
          <TabsContent value="users" className="mt-6">
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
                        users.map(user => (
                          <tr key={user.id} className="hover:bg-gray-50">
                            <td className="border p-2">{user.id}</td>
                            <td className="border p-2">{user.name}</td>
                            <td className="border p-2">{user.email}</td>
                            <td className="border p-2">{new Date(user.createdAt).toLocaleDateString('en-US')}</td>
                            <td className="border p-2">
                              <button
                                onClick={() => handleDeleteClick('user', user.id, user.name)}
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
          </TabsContent>

          {/* Contacts Tab */}
          <TabsContent value="contacts" className="mt-6">
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
                    onChange={(e) => setContactTypeFilter(e.target.value)}
                    className="p-2 border border-gray-300 rounded bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">All Types</option>
                    <option value="general">General</option>
                    <option value="support">Support</option>
                    <option value="feedback">Feedback</option>
                    <option value="partnership">Partnership</option>
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
                      {contacts.length === 0 ? (
                        <tr>
                          <td colSpan={9} className="border p-4 text-center text-gray-500">No contact messages found yet</td>
                        </tr>
                      ) : (
                        getFilteredContacts().map(contact => (
                          <tr key={contact.id} className="hover:bg-gray-50">
                            <td className="border p-2">{contact.id}</td>
                            <td className="border p-2">{contact.type}</td>
                            <td className="border p-2">{contact.name}</td>
                            <td className="border p-2">{contact.email}</td>
                            <td className="border p-2">{contact.subject}</td>
                            <td className="border p-2">
                              <div className="max-w-xs truncate text-gray-700">
                                {contact.message}
                              </div>
                            </td>
                            <td className="border p-2">
                              <span className={
                                contact.status === 'new' ? 'bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs' :
                                  contact.status === 'reviewing' ? 'bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-xs' :
                                    'bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs'
                              }>
                                {contact.status === 'answered' ? 'answered (closed)' : contact.status}
                              </span>
                            </td>
                            <td className="border p-2">{new Date(contact.createdAt).toLocaleDateString('en-US')}</td>
                            <td className="border p-2">
                              <div className="flex space-x-2">
                                <button
                                  onClick={() => {
                                    setEditingContact(contact);
                                    setShowContactEditModal(true);
                                  }}
                                  className="px-3 py-1 bg-blue-500 text-white text-sm rounded hover:bg-blue-600 transition-colors"
                                >
                                  Edit
                                </button>
                                <button
                                  onClick={() => handleDeleteClick('contact', contact.id, contact.name)}
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
          </TabsContent>

          {/* Blog Tab */}
          <TabsContent value="blog" className="mt-6">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>Blog Posts</CardTitle>
                  <button
                    onClick={() => openBlogModal()}
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
                        blogPosts.map(post => (
                          <tr key={post.id} className="hover:bg-gray-50">
                            <td className="border p-2">{post.id}</td>
                            <td className="border p-2">
                              <div className="max-w-xs truncate" title={post.title}>
                                {post.title}
                              </div>
                            </td>
                            <td className="border p-2">{post.author}</td>
                            <td className="border p-2">
                              <span className={
                                post.status === 'draft' ? 'bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-xs' :
                                  'bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs'
                              }>
                                {post.status}
                              </span>
                            </td>
                            <td className="border p-2">{new Date(post.publishDate).toLocaleDateString('en-US')}</td>
                            <td className="border p-2">
                              <div className="flex space-x-2">
                                <button
                                  onClick={() => openBlogModal(post)}
                                  className="px-3 py-1 bg-blue-500 text-white text-sm rounded hover:bg-blue-600 transition-colors"
                                >
                                  Edit
                                </button>
                                <button
                                  onClick={() => handleDeleteClick('blog', post.id, post.title)}
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
          </TabsContent>

          {/* Press Releases Tab */}
          <TabsContent value="press-releases" className="mt-6">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>Press Releases</CardTitle>
                  <button
                    onClick={() => openPressReleaseModal()}
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
                        pressReleases.map(release => (
                          <tr key={release.id} className="hover:bg-gray-50">
                            <td className="border p-2">{release.id}</td>
                            <td className="border p-2">
                              <div className="max-w-xs truncate" title={release.title}>
                                {release.title}
                              </div>
                            </td>
                            <td className="border p-2">
                              <span className={
                                release.status === 'draft' ? 'bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-xs' :
                                  'bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs'
                              }>
                                {release.status}
                              </span>
                            </td>
                            <td className="border p-2">{new Date(release.publishDate).toLocaleDateString('en-US')}</td>
                            <td className="border p-2">
                              <div className="flex space-x-2">
                                <button
                                  onClick={() => openPressReleaseModal(release)}
                                  className="px-3 py-1 bg-blue-500 text-white text-sm rounded hover:bg-blue-600 transition-colors"
                                >
                                  Edit
                                </button>
                                <button
                                  onClick={() => handleDeleteClick('press', release.id, release.title)}
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
          </TabsContent>

          {/* Media Coverage Tab */}
          <TabsContent value="media-coverage" className="mt-6">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>Media Coverage</CardTitle>
                  <button
                    onClick={() => openMediaCoverageModal()}
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
                        mediaCoverages.map(coverage => (
                          <tr key={coverage.id} className="hover:bg-gray-50">
                            <td className="border p-2">{coverage.id}</td>
                            <td className="border p-2">
                              <div className="max-w-xs truncate" title={coverage.title}>
                                {coverage.title}
                              </div>
                            </td>
                            <td className="border p-2">
                              <span className={
                                coverage.status === 'draft' ? 'bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-xs' :
                                  'bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs'
                              }>
                                {coverage.status}
                              </span>
                            </td>
                            <td className="border p-2">{new Date(coverage.publishDate).toLocaleDateString('en-US')}</td>
                            <td className="border p-2">
                              <div className="flex space-x-2">
                                <button
                                  onClick={() => openMediaCoverageModal(coverage)}
                                  className="px-3 py-1 bg-blue-500 text-white text-sm rounded hover:bg-blue-600 transition-colors"
                                >
                                  Edit
                                </button>
                                <button
                                  onClick={() => handleDeleteClick('media', coverage.id, coverage.title)}
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
          </TabsContent>

          {/* Events Tab */}
          <TabsContent value="events" className="mt-6">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>Events</CardTitle>
                  <button
                    onClick={() => openEventModal()}
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
                        events.map(event => (
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
                              <span className={
                                event.status === 'upcoming' ? 'bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs' :
                                event.status === 'ongoing' ? 'bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs' :
                                event.status === 'completed' ? 'bg-gray-100 text-gray-800 px-2 py-1 rounded-full text-xs' :
                                'bg-red-100 text-red-800 px-2 py-1 rounded-full text-xs'
                              }>
                                {event.status}
                              </span>
                            </td>
                            <td className="border p-2">
                              <div className="flex space-x-2">
                                <button
                                  onClick={() => openEventModal(event)}
                                  className="px-3 py-1 bg-blue-500 text-white text-sm rounded hover:bg-blue-600 transition-colors"
                                >
                                  Edit
                                </button>
                                <button
                                  onClick={() => handleDeleteClick('event', event.id, event.title)}
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
          </TabsContent>
        </Tabs>


      </div>

      {/* Contact Message Modal */}
      {showContactModal && selectedContact && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-gray-900">Contact Message Details</h3>
                <button 
                  onClick={() => setShowContactModal(false)}
                  className="text-gray-500 hover:text-gray-700 focus:outline-none"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-500">From</p>
                    <p className="text-base">{selectedContact.name} ({selectedContact.email})</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Type</p>
                    <p className="text-base capitalize">{selectedContact.type}</p>
                  </div>
                </div>
                
                <div>
                  <p className="text-sm font-medium text-gray-500">Subject</p>
                  <p className="text-base font-medium">{selectedContact.subject}</p>
                </div>
                
                <div>
                  <p className="text-sm font-medium text-gray-500">Message</p>
                  <div className="mt-2 p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <p className="text-base whitespace-pre-wrap">{selectedContact.message}</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Status</p>
                    <p className="text-base capitalize">{selectedContact.status}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Date</p>
                    <p className="text-base">{new Date(selectedContact.createdAt).toLocaleString()}</p>
                  </div>
                </div>
              </div>
              
              <div className="mt-6 flex justify-between">
                <select
                  value={selectedContact.status}
                  onChange={(e) => {
                    updateContactStatus(selectedContact.id, e.target.value as Contact['status']);
                    setShowContactModal(false);
                  }}
                  className="p-2 border border-gray-300 rounded bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="new">New</option>
                  <option value="reviewing">Reviewing</option>
                  <option value="answered">Answered</option>
                  <option value="closed">Closed</option>
                </select>
                
                <div className="space-x-2">
                  <button
                    onClick={() => setShowContactModal(false)}
                    className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 transition-colors"
                  >
                    Close
                  </button>
                  <button
                    onClick={() => {
                      handleDeleteClick('contact', selectedContact.id, selectedContact.name);
                      setShowContactModal(false);
                    }}
                    className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Blog Post Modal */}
      {showBlogModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-7xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-gray-900">
                  {editingBlogPost ? 'Edit Blog Post' : 'Create New Blog Post'}
                </h3>
                <button
                  onClick={() => setShowBlogModal(false)}
                  className="text-gray-500 hover:text-gray-700 focus:outline-none"
                >
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
                    value={blogFormData.title}
                    onChange={(e) => setBlogFormData({...blogFormData, title: e.target.value})}
                    className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter blog post title"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Publish Date</label>
                  <input
                    type="datetime-local"
                    value={blogFormData.publishDate ? new Date(blogFormData.publishDate).toISOString().slice(0, 16) : ''}
                    onChange={(e) => setBlogFormData({...blogFormData, publishDate: new Date(e.target.value).toISOString()})}
                    className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Excerpt</label>
                  <textarea
                    value={blogFormData.excerpt}
                    onChange={(e) => setBlogFormData({...blogFormData, excerpt: e.target.value})}
                    className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={3}
                    placeholder="Enter a short excerpt for the blog post"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Content</label>
                  <RichTextEditor
                    value={blogFormData.content}
                    onChange={(content: string) => setBlogFormData({...blogFormData, content})}
                    placeholder="Write your blog content..."
                    height={400}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select
                    value={blogFormData.status}
                    onChange={(e) => setBlogFormData({...blogFormData, status: e.target.value as 'draft' | 'published'})}
                    className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="draft">Taslak</option>
                    <option value="published">Yayınlandı</option>
                  </select>
                </div>
                
                {/* Images Section */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Images</label>
                  <div className="space-y-2">
                    {blogFormData.images.map((image, index) => (
                      <div key={index} className="flex items-center space-x-2 p-2 bg-gray-50 rounded">
                        <img
                          src={image.src.startsWith('http') ? image.src : `${ROOT_URL}${image.src}`}
                          alt={image.alt}
                          className="w-16 h-16 object-cover rounded"
                          onError={(e) => {
                            e.currentTarget.src = '';
                            e.currentTarget.style.display = 'none';
                          }}
                        />
                        <div className="flex-1">
                          <input
                            type="text"
                            value={image.src}
                            onChange={(e) => {
                              const newImages = [...blogFormData.images];
                              newImages[index] = {...newImages[index], src: e.target.value};
                              setBlogFormData({...blogFormData, images: newImages});
                            }}
                            className="w-full p-1 border border-gray-300 rounded text-sm"
                            placeholder="Image URL"
                            readOnly={image.src.startsWith('/postimages/')}
                          />
                          <input
                            type="text"
                            value={image.alt}
                            onChange={(e) => {
                              const newImages = [...blogFormData.images];
                              newImages[index] = {...newImages[index], alt: e.target.value};
                              setBlogFormData({...blogFormData, images: newImages});
                            }}
                            className="w-full p-1 border border-gray-300 rounded text-sm mt-1"
                            placeholder="Alt text"
                          />
                        </div>
                        <button
                          onClick={() => {
                            const newImages = blogFormData.images.filter((_, i) => i !== index);
                            setBlogFormData({...blogFormData, images: newImages});
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
                          const newImages = [...blogFormData.images, {
                            src: '',
                            alt: ''
                          }];
                          setBlogFormData({...blogFormData, images: newImages});
                        }}
                        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                      >
                        + Add Image URL
                      </button>
                      
                      <div className="relative">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageUpload}
                          disabled={uploadingImage}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        />
                        <button
                          type="button"
                          disabled={uploadingImage}
                          className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {uploadingImage ? 'Uploading...' : '+ Upload Image'}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="mt-6 flex justify-end space-x-2">
                <button
                  onClick={() => setShowBlogModal(false)}
                  className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleBlogSubmit}
                  className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
                >
                  {editingBlogPost ? 'Update Blog Post' : 'Create Blog Post'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Press Release Modal */}
      {showPressReleaseModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-gray-900">
                  {editingPressRelease ? 'Edit Press Release' : 'Create New Press Release'}
                </h3>
                <button 
                  onClick={() => setShowPressReleaseModal(false)}
                  className="text-gray-500 hover:text-gray-700 focus:outline-none"
                >
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
                    value={pressReleaseFormData.title}
                    onChange={(e) => setPressReleaseFormData({...pressReleaseFormData, title: e.target.value})}
                    className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter press release title"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Publish Date</label>
                  <input
                    type="datetime-local"
                    value={pressReleaseFormData.publishDate ? new Date(pressReleaseFormData.publishDate).toISOString().slice(0, 16) : ''}
                    onChange={(e) => setPressReleaseFormData({...pressReleaseFormData, publishDate: new Date(e.target.value).toISOString()})}
                    className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Excerpt</label>
                  <textarea
                    value={pressReleaseFormData.excerpt}
                    onChange={(e) => setPressReleaseFormData({...pressReleaseFormData, excerpt: e.target.value})}
                    className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={3}
                    placeholder="Enter a short excerpt for the press release"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Content</label>
                  <RichTextEditor
                    value={pressReleaseFormData.content}
                    onChange={(content: string) => setPressReleaseFormData({...pressReleaseFormData, content})}
                    placeholder="Write your press release content..."
                    height={400}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select
                    value={pressReleaseFormData.status}
                    onChange={(e) => setPressReleaseFormData({...pressReleaseFormData, status: e.target.value as 'draft' | 'published'})}
                    className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="draft">Draft</option>
                    <option value="published">Published</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Images</label>
                  <div className="space-y-2">
                    {pressReleaseFormData.images.map((image, index) => (
                      <div key={index} className="flex items-center space-x-2 p-2 bg-gray-50 rounded">
                        <img src={image.src} alt={image.alt} className="w-16 h-16 object-cover rounded" />
                        <div className="flex-1">
                          <input
                            type="text"
                            value={image.src}
                            onChange={(e) => {
                              const newImages = [...pressReleaseFormData.images];
                              newImages[index] = {...newImages[index], src: e.target.value};
                              setPressReleaseFormData({...pressReleaseFormData, images: newImages});
                            }}
                            className="w-full p-1 border border-gray-300 rounded text-sm"
                            placeholder="Image URL"
                          />
                          <input
                            type="text"
                            value={image.alt}
                            onChange={(e) => {
                              const newImages = [...pressReleaseFormData.images];
                              newImages[index] = {...newImages[index], alt: e.target.value};
                              setPressReleaseFormData({...pressReleaseFormData, images: newImages});
                            }}
                            className="w-full p-1 border border-gray-300 rounded text-sm mt-1"
                            placeholder="Alt text"
                          />
                        </div>
                        <button
                          onClick={() => {
                            const newImages = pressReleaseFormData.images.filter((_, i) => i !== index);
                            setPressReleaseFormData({...pressReleaseFormData, images: newImages});
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
                          const newImages = [...pressReleaseFormData.images, {
                            src: '',
                            alt: ''
                          }];
                          setPressReleaseFormData({...pressReleaseFormData, images: newImages});
                        }}
                        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                      >
                        + Add Image URL
                      </button>
                      
                      <div className="relative">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handlePressReleaseImageUpload}
                          disabled={uploadingPressReleaseImage}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        />
                        <button
                          type="button"
                          disabled={uploadingPressReleaseImage}
                          className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {uploadingPressReleaseImage ? 'Uploading...' : '+ Upload Image'}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="mt-6 flex justify-end space-x-2">
                <button
                  onClick={() => setShowPressReleaseModal(false)}
                  className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handlePressReleaseSubmit}
                  className="px-4 py-2 bg-teal-600 text-white rounded hover:bg-teal-700 transition-colors"
                >
                  {editingPressRelease ? 'Update Press Release' : 'Create Press Release'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Media Coverage Modal */}
      {showMediaCoverageModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-gray-900">
                  {editingMediaCoverage ? 'Edit Media Coverage' : 'Create New Media Coverage'}
                </h3>
                <button
                  onClick={() => setShowMediaCoverageModal(false)}
                  className="text-gray-500 hover:text-gray-700 focus:outline-none"
                >
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
                    value={mediaCoverageFormData.title}
                    onChange={(e) => setMediaCoverageFormData({...mediaCoverageFormData, title: e.target.value})}
                    className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter media coverage title"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Publish Date</label>
                  <input
                    type="datetime-local"
                    value={mediaCoverageFormData.publishDate ? new Date(mediaCoverageFormData.publishDate).toISOString().slice(0, 16) : ''}
                    onChange={(e) => setMediaCoverageFormData({...mediaCoverageFormData, publishDate: new Date(e.target.value).toISOString()})}
                    className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Excerpt</label>
                  <textarea
                    value={mediaCoverageFormData.excerpt}
                    onChange={(e) => setMediaCoverageFormData({...mediaCoverageFormData, excerpt: e.target.value})}
                    className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={3}
                    placeholder="Enter a short excerpt for the media coverage"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Content</label>
                  <RichTextEditor
                    value={mediaCoverageFormData.content}
                    onChange={(content: string) => setMediaCoverageFormData({...mediaCoverageFormData, content})}
                    placeholder="Write your media coverage content..."
                    height={400}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select
                    value={mediaCoverageFormData.status}
                    onChange={(e) => setMediaCoverageFormData({...mediaCoverageFormData, status: e.target.value as 'draft' | 'published'})}
                    className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="draft">Draft</option>
                    <option value="published">Published</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Images</label>
                  <div className="space-y-2">
                    {mediaCoverageFormData.images.map((image, index) => (
                      <div key={index} className="flex items-center space-x-2 p-2 bg-gray-50 rounded">
                        <img src={image.src} alt={image.alt} className="w-16 h-16 object-cover rounded" />
                        <div className="flex-1">
                          <input
                            type="text"
                            value={image.src}
                            onChange={(e) => {
                              const newImages = [...mediaCoverageFormData.images];
                              newImages[index] = {...newImages[index], src: e.target.value};
                              setMediaCoverageFormData({...mediaCoverageFormData, images: newImages});
                            }}
                            className="w-full p-1 border border-gray-300 rounded text-sm"
                            placeholder="Image URL"
                          />
                          <input
                            type="text"
                            value={image.alt}
                            onChange={(e) => {
                              const newImages = [...mediaCoverageFormData.images];
                              newImages[index] = {...newImages[index], alt: e.target.value};
                              setMediaCoverageFormData({...mediaCoverageFormData, images: newImages});
                            }}
                            className="w-full p-1 border border-gray-300 rounded text-sm mt-1"
                            placeholder="Alt text"
                          />
                        </div>
                        <button
                          onClick={() => {
                            const newImages = mediaCoverageFormData.images.filter((_, i) => i !== index);
                            setMediaCoverageFormData({...mediaCoverageFormData, images: newImages});
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
                          const newImages = [...mediaCoverageFormData.images, {
                            src: '',
                            alt: ''
                          }];
                          setMediaCoverageFormData({...mediaCoverageFormData, images: newImages});
                        }}
                        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                      >
                        + Add Image URL
                      </button>
                      
                      <div className="relative">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleMediaCoverageImageUpload}
                          disabled={uploadingMediaCoverageImage}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        />
                        <button
                          type="button"
                          disabled={uploadingMediaCoverageImage}
                          className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {uploadingMediaCoverageImage ? 'Uploading...' : '+ Upload Image'}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="mt-6 flex justify-end space-x-2">
                <button
                  onClick={() => setShowMediaCoverageModal(false)}
                  className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleMediaCoverageSubmit}
                  className="px-4 py-2 bg-cyan-600 text-white rounded hover:bg-cyan-700 transition-colors"
                >
                  {editingMediaCoverage ? 'Update Media Coverage' : 'Create Media Coverage'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Loading Overlay */}
      {isLoading && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl flex flex-col items-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mb-4"></div>
            <p className="text-gray-700 font-medium">Loading data...</p>
          </div>
        </div>
      )}

      {/* Event Modal */}
      {showEventModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-gray-900">
                  {editingEvent ? 'Edit Event' : 'Create New Event'}
                </h3>
                <button
                  onClick={() => setShowEventModal(false)}
                  className="text-gray-500 hover:text-gray-700 focus:outline-none"
                >
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
                      value={eventFormData.title}
                      onChange={(e) => setEventFormData({...eventFormData, title: e.target.value})}
                      className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter event title"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                    <select
                      value={eventFormData.category}
                      onChange={(e) => setEventFormData({...eventFormData, category: e.target.value as Event['category']})}
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
                    value={eventFormData.excerpt}
                    onChange={(e) => setEventFormData({...eventFormData, excerpt: e.target.value})}
                    className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={2}
                    placeholder="Enter a short excerpt for the event"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
                  <RichTextEditor
                    value={eventFormData.description}
                    onChange={(content: string) => setEventFormData({...eventFormData, description: content})}
                    placeholder="Write event description..."
                    height={300}
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Start Date *</label>
                    <input
                      type="datetime-local"
                      value={eventFormData.startDate}
                      onChange={(e) => setEventFormData({...eventFormData, startDate: e.target.value})}
                      className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">End Date *</label>
                    <input
                      type="datetime-local"
                      value={eventFormData.endDate}
                      onChange={(e) => setEventFormData({...eventFormData, endDate: e.target.value})}
                      className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select
                    value={eventFormData.status}
                    onChange={(e) => setEventFormData({...eventFormData, status: e.target.value as Event['status']})}
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
                    {eventFormData.imageUrl && (
                      <div className="flex items-center space-x-2 p-2 bg-gray-50 rounded">
                        <img
                          src={eventFormData.imageUrl.startsWith('http') ? eventFormData.imageUrl : `${ROOT_URL}${eventFormData.imageUrl}`}
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
                            value={eventFormData.imageUrl}
                            onChange={(e) => setEventFormData({...eventFormData, imageUrl: e.target.value})}
                            className="w-full p-1 border border-gray-300 rounded text-sm"
                            placeholder="Image URL"
                            readOnly={eventFormData.imageUrl.startsWith('/postimages/')}
                          />
                          <input
                            type="text"
                            value="Event image"
                            onChange={(e) => {
                              // Alt text could be added as a separate field if needed
                            }}
                            className="w-full p-1 border border-gray-300 rounded text-sm mt-1"
                            placeholder="Alt text"
                            readOnly
                          />
                        </div>
                        <button
                          onClick={() => setEventFormData({...eventFormData, imageUrl: ''})}
                          className="px-2 py-1 bg-red-500 text-white text-sm rounded hover:bg-red-600 transition-colors"
                        >
                          Remove
                        </button>
                      </div>
                    )}
                    
                    <div className="flex space-x-2">
                      <button
                        type="button"
                        onClick={() => {
                          setEventFormData({...eventFormData, imageUrl: ''});
                        }}
                        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                      >
                        + Add Image URL
                      </button>
                      
                      <div className="relative">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleEventImageUpload}
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
                    
                    {!eventFormData.imageUrl && (
                      <div className="mt-2">
                        <input
                          type="text"
                          value={eventFormData.imageUrl}
                          onChange={(e) => setEventFormData({...eventFormData, imageUrl: e.target.value})}
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
                    value={eventFormData.venue}
                    onChange={(e) => setEventFormData({...eventFormData, venue: e.target.value})}
                    className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 font-bold"
                    placeholder="Enter venue name and address"
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Google Maps Link</label>
                    <input
                      type="text"
                      value={eventFormData.googleMapsLink}
                      onChange={(e) => setEventFormData({...eventFormData, googleMapsLink: e.target.value})}
                      className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter Google Maps link"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Venue Website</label>
                    <input
                      type="text"
                      value={eventFormData.venueWebsite}
                      onChange={(e) => setEventFormData({...eventFormData, venueWebsite: e.target.value})}
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
                      value={eventFormData.eventWebsite}
                      onChange={(e) => setEventFormData({...eventFormData, eventWebsite: e.target.value})}
                      className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter event website URL"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Organizer Name</label>
                    <input
                      type="text"
                      value={eventFormData.organizerName}
                      onChange={(e) => setEventFormData({...eventFormData, organizerName: e.target.value})}
                      className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter organizer name"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Organizer Website</label>
                  <input
                    type="text"
                    value={eventFormData.organizerWebsite}
                    onChange={(e) => setEventFormData({...eventFormData, organizerWebsite: e.target.value})}
                    className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter organizer website URL"
                  />
                </div>
              </div>
              
              <div className="mt-6 flex justify-end space-x-2">
                <button
                  onClick={() => setShowEventModal(false)}
                  className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleEventSubmit}
                  className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition-colors"
                >
                  {editingEvent ? 'Update Event' : 'Create Event'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Order Edit Modal */}
      {showOrderEditModal && editingOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Order Details</h2>
              <button
                onClick={() => {
                  setShowOrderEditModal(false);
                  setEditingOrder(null);
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Order ID</label>
                  <input
                    type="text"
                    value={editingOrder.id}
                    readOnly
                    className="w-full p-2 border border-gray-300 rounded bg-gray-100 text-gray-600"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">User ID</label>
                  <input
                    type="text"
                    value={editingOrder.userId}
                    readOnly
                    className="w-full p-2 border border-gray-300 rounded bg-gray-100 text-gray-600"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select
                    value={editingOrder.status}
                    onChange={(e) => setEditingOrder({
                      ...editingOrder,
                      status: e.target.value as Order['status']
                    })}
                    className="w-full p-2 border border-gray-300 rounded bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="received">Order Received</option>
                    <option value="preparing">Preparing</option>
                    <option value="shipping">Shipping</option>
                    <option value="delivered">Delivered</option>
                  </select>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Customer Name</label>
                  <input
                    type="text"
                    value={editingOrder.customerName}
                    readOnly
                    className="w-full p-2 border border-gray-300 rounded bg-gray-100 text-gray-600"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Customer Email</label>
                  <input
                    type="email"
                    value={editingOrder.customerEmail}
                    readOnly
                    className="w-full p-2 border border-gray-300 rounded bg-gray-100 text-gray-600"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Total Amount</label>
                  <input
                    type="text"
                    value={`$${editingOrder.totalAmount.toFixed(2)}`}
                    readOnly
                    className="w-full p-2 border border-gray-300 rounded bg-gray-100 text-gray-600"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Order Date</label>
                  <input
                    type="text"
                    value={new Date(editingOrder.createdAt).toLocaleString()}
                    readOnly
                    className="w-full p-2 border border-gray-300 rounded bg-gray-100 text-gray-600"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Shipping Address</label>
                <textarea
                  value={editingOrder.shippingAddress ? 
                    `${editingOrder.shippingAddress.address || ''}\n${editingOrder.shippingAddress.city || ''}, ${editingOrder.shippingAddress.state || ''} ${editingOrder.shippingAddress.zipCode || ''}` 
                    : 'No address information'}
                  readOnly
                  rows={3}
                  className="w-full p-2 border border-gray-300 rounded bg-gray-100 text-gray-600 resize-none"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Order Items</label>
                <div className="border border-gray-300 rounded p-4 bg-gray-50 max-h-60 overflow-y-auto">
                  {editingOrder.items && editingOrder.items.length > 0 ? (
                    <div className="space-y-3">
                      {editingOrder.items.map((item, idx) => (
                        <div key={idx} className="bg-white p-3 rounded border">
                          <div className="grid grid-cols-1 md:grid-cols-4 gap-2 text-sm">
                            <div>
                              <span className="font-medium text-gray-700">Product:</span>
                              <div className="text-gray-900">{item.product_name || item.name || item.title || 'Unknown Product'}</div>
                            </div>
                            <div>
                              <span className="font-medium text-gray-700">Quantity:</span>
                              <div className="text-gray-900">{item.quantity}</div>
                            </div>
                            <div>
                              <span className="font-medium text-gray-700">Unit Price:</span>
                              <div className="text-gray-900">${item.price.toFixed(2)}</div>
                            </div>
                            <div>
                              <span className="font-medium text-gray-700">Total:</span>
                              <div className="text-gray-900 font-semibold">${(item.quantity * item.price).toFixed(2)}</div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-gray-500 text-center py-4">No items found</div>
                  )}
                </div>
              </div>
            </div>
            
            <div className="mt-6 flex justify-end space-x-2">
              <button
                onClick={() => {
                  setShowOrderEditModal(false);
                  setEditingOrder(null);
                }}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  try {
                    await updateOrderStatus(editingOrder.id, editingOrder.status);
                    setShowOrderEditModal(false);
                    setEditingOrder(null);
                  } catch (error) {
                    console.error('Error updating order:', error);
                  }
                }}
                className="px-6 py-3 rounded-lg border border-kibo-purple text-kibo-purple hover:bg-kibo-orange hover:text-kibo-purple active:bg-kibo-orange active:text-kibo-purple transition-colors cursor-pointer"
              >
                Update Status
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && deleteItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-red-600">Silme Onayı</h2>
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeleteItem(null);
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            
            <div className="mb-6">
              <p className="text-gray-700">
                <strong>{deleteItem.name}</strong> öğesini silmek istediğinizden emin misiniz?
              </p>
              <p className="text-sm text-gray-500 mt-2">
                Bu işlem geri alınamaz.
              </p>
            </div>
            
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeleteItem(null);
                }}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 transition-colors"
              >
                İptal
              </button>
              <button
                onClick={confirmDelete}
                className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
              >
                Sil
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Contact Edit Modal */}
      {showContactEditModal && editingContact && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Edit Contact</h2>
              <button
                onClick={() => {
                  setShowContactEditModal(false);
                  setEditingContact(null);
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                  <input
                    type="text"
                    value={editingContact.name}
                    readOnly
                    className="w-full p-2 border border-gray-300 rounded bg-gray-100 text-gray-600"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={editingContact.email}
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
                    value={editingContact.type}
                    readOnly
                    className="w-full p-2 border border-gray-300 rounded bg-gray-100 text-gray-600"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select
                    value={editingContact.status}
                    onChange={(e) => setEditingContact({
                      ...editingContact,
                      status: e.target.value as Contact['status']
                    })}
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
                  value={editingContact.subject}
                  readOnly
                  className="w-full p-2 border border-gray-300 rounded bg-gray-100 text-gray-600"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
                <textarea
                  value={editingContact.message}
                  readOnly
                  rows={6}
                  className="w-full p-2 border border-gray-300 rounded bg-gray-100 text-gray-600 resize-none"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                <input
                  type="text"
                  value={new Date(editingContact.createdAt).toLocaleString()}
                  readOnly
                  className="w-full p-2 border border-gray-300 rounded bg-gray-100 text-gray-600"
                />
              </div>
            </div>
            
            <div className="mt-6 flex justify-end space-x-2">
              <button
                onClick={() => {
                  setShowContactEditModal(false);
                  setEditingContact(null);
                }}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  try {
                    await updateContactStatus(editingContact.id, editingContact.status);
                    setShowContactEditModal(false);
                    setEditingContact(null);
                  } catch (error) {
                    console.error('Error updating contact:', error);
                  }
                }}
                className="px-6 py-3 rounded-lg border border-kibo-purple text-kibo-purple hover:bg-kibo-orange hover:text-kibo-purple active:bg-kibo-orange active:text-kibo-purple transition-colors cursor-pointer"
              >
                Update Status
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
};

export default SimpleAdminDashboard;
