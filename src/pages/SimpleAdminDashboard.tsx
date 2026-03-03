import React, { useState, useEffect, useCallback } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/context/AuthContext';
import { Navigate } from 'react-router-dom';
import apiService, { Order, User, Contact, BlogPost, PressRelease, Event, MediaCoverage, OrderPaymentStatus } from '@/services/apiService';
import AdminOrdersTab from '@/components/admin/AdminOrdersTab';
import OrderEditModal from '@/components/admin/OrderEditModal';
import AdminContactsTab from '@/components/admin/AdminContactsTab';
import ContactDetailModal from '@/components/admin/ContactDetailModal';
import ContactEditModal from '@/components/admin/ContactEditModal';
import { createInitialContentForm, createInitialEventForm, type ContentFormState, type EventFormState } from '@/components/admin/contentAdminShared';
import AdminUsersTab from '@/components/admin/AdminUsersTab';
import AdminBlogTab from '@/components/admin/AdminBlogTab';
import AdminPressReleasesTab from '@/components/admin/AdminPressReleasesTab';
import AdminMediaCoverageTab from '@/components/admin/AdminMediaCoverageTab';
import AdminEventsTab from '@/components/admin/AdminEventsTab';
import BlogEditModal from '@/components/admin/BlogEditModal';
import PressReleaseEditModal from '@/components/admin/PressReleaseEditModal';
import MediaCoverageEditModal from '@/components/admin/MediaCoverageEditModal';
import EventEditModal from '@/components/admin/EventEditModal';
import ConfirmDeleteModal, { type DeleteItem } from '@/components/admin/ConfirmDeleteModal';

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
  const [orderEditInitialStatus, setOrderEditInitialStatus] = useState<Order['status'] | null>(null);
  const [showOrderEditModal, setShowOrderEditModal] = useState(false);
  const [orderStatusFilter, setOrderStatusFilter] = useState<'all' | Order['status']>('all');
  const [orderPaymentFilter, setOrderPaymentFilter] = useState<'all' | Order['paymentStatus']>('all');
  const [orderPaymentDetails, setOrderPaymentDetails] = useState<OrderPaymentStatus | null>(null);
  const [isLoadingOrderPaymentDetails, setIsLoadingOrderPaymentDetails] = useState(false);
  
  // Delete confirmation state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteItem, setDeleteItem] = useState<DeleteItem | null>(null);

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
      const [
        allOrders,
        allUsers,
        allContacts,
        allBlogPosts,
        allPressReleases,
        allMediaCoverages,
        allEvents,
      ] = await Promise.all([
        apiService.getAllOrders({ limit: 1000 }),
        apiService.getAllUsers({ limit: 1000 }),
        apiService.getAllContacts({ limit: 1000 }),
        apiService.getAllBlogPostsForAdmin({ limit: 1000 }),
        apiService.getAllPressReleasesForAdmin({ limit: 1000 }),
        apiService.getAllMediaCoveragesForAdmin({ limit: 1000 }),
        apiService.getAllEventsForAdmin({ limit: 1000 }),
      ]);

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

  const getFilteredSortedOrders = () => {
    return getSortedOrders().filter((order) => {
      const fulfillmentMatch = orderStatusFilter === 'all' || order.status === orderStatusFilter;
      const paymentMatch = orderPaymentFilter === 'all' || order.paymentStatus === orderPaymentFilter;
      return fulfillmentMatch && paymentMatch;
    });
  };

  const filteredSortedOrders = getFilteredSortedOrders();
  
  // Get filtered contacts
  const getFilteredContacts = () => {
    if (contactTypeFilter === 'all') {
      return contacts;
    }
    return contacts.filter(contact => contact.type === contactTypeFilter);
  };

  const filteredContacts = getFilteredContacts();

  const closeOrderEditModal = () => {
    setShowOrderEditModal(false);
    setEditingOrder(null);
    setOrderEditInitialStatus(null);
    setOrderPaymentDetails(null);
    setIsLoadingOrderPaymentDetails(false);
  };

  const openOrderEditModal = async (order: Order) => {
    setEditingOrder(order);
    setOrderEditInitialStatus(order.status);
    setShowOrderEditModal(true);
    setOrderPaymentDetails(null);
    setIsLoadingOrderPaymentDetails(true);

    try {
      const paymentDetails = await apiService.getOrderPaymentStatus(order.id);
      setOrderPaymentDetails(paymentDetails);
    } catch (error) {
      toast.error('Could not load payment details: ' + getErrorMessage(error, 'Unknown error'));
    } finally {
      setIsLoadingOrderPaymentDetails(false);
    }
  };



  // Update order status
  const updateOrderStatus = async (
    orderId: string,
    status: Order['status'],
    payload?: {
      shipmentProvider?: string;
      shipmentTrackingNumber?: string;
      overrideReason?: string;
    }
  ) => {
    try {
      const updatedOrder = await apiService.updateOrderStatus(orderId, status, payload);
      await loadData(); // Refresh data
      toast.success('Order status updated!');
      return updatedOrder;
    } catch (error) {
      const message = getErrorMessage(error, 'Unknown error');
      if (message.toLowerCase().includes('payment must be completed')) {
        toast.error('Payment must be marked as paid before moving to fulfillment statuses.');
      } else if (message.toLowerCase().includes('shipment provider and tracking number')) {
        toast.error('Carrier and tracking number are required before marking an order as shipping.');
      } else if (message.toLowerCase().includes('carrier managed')) {
        toast.error('This order is now carrier-managed. Further fulfillment updates must come from carrier events.');
      } else {
        toast.error('Update error: ' + message);
      }
      return null;
    }
  };

  const handleEditingOrderStatusChange = (status: Order['status']) => {
    setEditingOrder((currentOrder) => {
      if (!currentOrder) {
        return currentOrder;
      }

      return {
        ...currentOrder,
        status,
      };
    });
  };

  const handleEditingOrderShipmentChange = (updates: Partial<Pick<Order, 'shipmentProvider' | 'shipmentTrackingNumber'>>) => {
    setEditingOrder((currentOrder) => {
      if (!currentOrder) {
        return currentOrder;
      }

      return {
        ...currentOrder,
        ...updates,
      };
    });
  };

  const handleUpdateOrderFulfillment = async () => {
    if (!editingOrder) {
      return;
    }

    const fulfillmentPayload = editingOrder.status === 'shipping'
      ? {
        shipmentProvider: (editingOrder.shipmentProvider || '').trim(),
        shipmentTrackingNumber: (editingOrder.shipmentTrackingNumber || '').trim(),
      }
      : undefined;

    const updatedOrder = await updateOrderStatus(editingOrder.id, editingOrder.status, fulfillmentPayload);
    if (updatedOrder) {
      setEditingOrder(updatedOrder);
      setOrderEditInitialStatus(updatedOrder.status);
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

  const openContactDetailModal = (contact: Contact) => {
    setSelectedContact(contact);
    setShowContactModal(true);
  };

  const closeContactDetailModal = () => {
    setShowContactModal(false);
    setSelectedContact(null);
  };

  const openContactEditModal = (contact: Contact) => {
    setEditingContact(contact);
    setShowContactEditModal(true);
  };

  const closeContactEditModal = () => {
    setShowContactEditModal(false);
    setEditingContact(null);
  };

  const handleEditingContactStatusChange = (status: Contact['status']) => {
    setEditingContact((currentContact) => {
      if (!currentContact) {
        return currentContact;
      }

      return {
        ...currentContact,
        status,
      };
    });
  };

  const handleSaveContactStatus = async () => {
    if (!editingContact) {
      return;
    }

    await updateContactStatus(editingContact.id, editingContact.status);
    closeContactEditModal();
  };

















  // Event creation/editing state
  const [showEventModal, setShowEventModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [eventFormData, setEventFormData] = useState<EventFormState>(createInitialEventForm());

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
      setEventFormData(createInitialEventForm());
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
      setEventFormData(createInitialEventForm());
    }
    setShowEventModal(true);
  };

  // Blog post creation/editing state
  const [showBlogModal, setShowBlogModal] = useState(false);
  const [editingBlogPost, setEditingBlogPost] = useState<BlogPost | null>(null);
  const [blogFormData, setBlogFormData] = useState<ContentFormState>(createInitialContentForm(user?.name || ''));
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
      setBlogFormData(createInitialContentForm(user?.name || ''));
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
      setBlogFormData(createInitialContentForm(user?.name || ''));
    }
    setShowBlogModal(true);
  };

  // Press release creation/editing state
  const [showPressReleaseModal, setShowPressReleaseModal] = useState(false);
  const [editingPressRelease, setEditingPressRelease] = useState<PressRelease | null>(null);
  const [pressReleaseFormData, setPressReleaseFormData] = useState<ContentFormState>(createInitialContentForm(user?.name || ''));
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

      if (editingPressRelease) {
        await apiService.updatePressRelease(editingPressRelease.id, pressReleaseFormData);
        toast.success('Press release updated successfully!');
      } else {
        await apiService.createPressRelease(pressReleaseFormData);
        toast.success('Press release created successfully!');
      }
      
      // Reload data and close modal
      await loadData();
      setShowPressReleaseModal(false);
      setEditingPressRelease(null);
      setPressReleaseFormData(createInitialContentForm(user?.name || ''));
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
      setPressReleaseFormData(createInitialContentForm(user?.name || ''));
    }
    setShowPressReleaseModal(true);
  };

  // Media coverage creation/editing state
  const [showMediaCoverageModal, setShowMediaCoverageModal] = useState(false);
  const [editingMediaCoverage, setEditingMediaCoverage] = useState<MediaCoverage | null>(null);
  const [mediaCoverageFormData, setMediaCoverageFormData] = useState<ContentFormState>(createInitialContentForm(user?.name || ''));
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

      if (editingMediaCoverage) {
        await apiService.updateMediaCoverage(editingMediaCoverage.id, mediaCoverageFormData);
        toast.success('Media coverage updated successfully!');
      } else {
        await apiService.createMediaCoverage(mediaCoverageFormData);
        toast.success('Media coverage created successfully!');
      }
      
      // Reload data and close modal
      await loadData();
      setShowMediaCoverageModal(false);
      setEditingMediaCoverage(null);
      setMediaCoverageFormData(createInitialContentForm(user?.name || ''));
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
      setMediaCoverageFormData(createInitialContentForm(user?.name || ''));
    }
    setShowMediaCoverageModal(true);
  };

  useEffect(() => {
    loadData();

    // Server bağlantısını kontrol et
    const checkServerConnection = async () => {
      try {
        await apiService.getAllUsers({ limit: 1 });
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
            <AdminOrdersTab
              orders={filteredSortedOrders}
              orderSortField={orderSortField}
              orderSortDirection={orderSortDirection}
              orderStatusFilter={orderStatusFilter}
              orderPaymentFilter={orderPaymentFilter}
              onSortOrders={sortOrders}
              onOrderStatusFilterChange={setOrderStatusFilter}
              onOrderPaymentFilterChange={setOrderPaymentFilter}
              onManageOrder={openOrderEditModal}
              onDeleteOrder={(order) => handleDeleteClick('order', order.id, `Order #${order.id}`)}
            />
          </TabsContent>


          {/* Users Tab */}
          <TabsContent value="users" className="mt-6">
            <AdminUsersTab
              users={users}
              onDeleteUser={(adminUser) => handleDeleteClick('user', adminUser.id, adminUser.name)}
            />
          </TabsContent>

          {/* Contacts Tab */}
          <TabsContent value="contacts" className="mt-6">
            <AdminContactsTab
              allContactsCount={contacts.length}
              contacts={filteredContacts}
              contactTypeFilter={contactTypeFilter}
              onContactTypeFilterChange={setContactTypeFilter}
              onViewContact={openContactDetailModal}
              onEditContact={openContactEditModal}
              onDeleteContact={(contact) => handleDeleteClick('contact', contact.id, contact.name)}
            />
          </TabsContent>

          {/* Blog Tab */}
          <TabsContent value="blog" className="mt-6">
            <AdminBlogTab
              blogPosts={blogPosts}
              onCreateBlogPost={() => openBlogModal()}
              onEditBlogPost={openBlogModal}
              onDeleteBlogPost={(post) => handleDeleteClick('blog', post.id, post.title)}
            />
          </TabsContent>

          {/* Press Releases Tab */}
          <TabsContent value="press-releases" className="mt-6">
            <AdminPressReleasesTab
              pressReleases={pressReleases}
              onCreatePressRelease={() => openPressReleaseModal()}
              onEditPressRelease={openPressReleaseModal}
              onDeletePressRelease={(release) => handleDeleteClick('press', release.id, release.title)}
            />
          </TabsContent>

          {/* Media Coverage Tab */}
          <TabsContent value="media-coverage" className="mt-6">
            <AdminMediaCoverageTab
              mediaCoverages={mediaCoverages}
              onCreateMediaCoverage={() => openMediaCoverageModal()}
              onEditMediaCoverage={openMediaCoverageModal}
              onDeleteMediaCoverage={(coverage) => handleDeleteClick('media', coverage.id, coverage.title)}
            />
          </TabsContent>

          {/* Events Tab */}
          <TabsContent value="events" className="mt-6">
            <AdminEventsTab
              events={events}
              onCreateEvent={() => openEventModal()}
              onEditEvent={openEventModal}
              onDeleteEvent={(event) => handleDeleteClick('event', event.id, event.title)}
            />
          </TabsContent>
        </Tabs>


      </div>

      {/* Contact Message Modal */}
      <ContactDetailModal
        isOpen={showContactModal}
        contact={selectedContact}
        onClose={closeContactDetailModal}
        onUpdateStatus={updateContactStatus}
        onDeleteContact={(contact) => handleDeleteClick('contact', contact.id, contact.name)}
      />

      {/* Blog Post Modal */}
      <BlogEditModal
        isOpen={showBlogModal}
        editingBlogPost={editingBlogPost}
        formData={blogFormData}
        setFormData={setBlogFormData}
        isUploadingImage={uploadingImage}
        onClose={() => setShowBlogModal(false)}
        onUploadImage={handleImageUpload}
        onSubmit={handleBlogSubmit}
      />

      {/* Press Release Modal */}
      <PressReleaseEditModal
        isOpen={showPressReleaseModal}
        editingPressRelease={editingPressRelease}
        formData={pressReleaseFormData}
        setFormData={setPressReleaseFormData}
        isUploadingImage={uploadingPressReleaseImage}
        onClose={() => setShowPressReleaseModal(false)}
        onUploadImage={handlePressReleaseImageUpload}
        onSubmit={handlePressReleaseSubmit}
      />

      {/* Media Coverage Modal */}
      <MediaCoverageEditModal
        isOpen={showMediaCoverageModal}
        editingMediaCoverage={editingMediaCoverage}
        formData={mediaCoverageFormData}
        setFormData={setMediaCoverageFormData}
        isUploadingImage={uploadingMediaCoverageImage}
        onClose={() => setShowMediaCoverageModal(false)}
        onUploadImage={handleMediaCoverageImageUpload}
        onSubmit={handleMediaCoverageSubmit}
      />

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
      <EventEditModal
        isOpen={showEventModal}
        editingEvent={editingEvent}
        formData={eventFormData}
        setFormData={setEventFormData}
        onClose={() => setShowEventModal(false)}
        onUploadImage={handleEventImageUpload}
        onSubmit={handleEventSubmit}
      />

      {/* Order Edit Modal */}
      <OrderEditModal
        isOpen={showOrderEditModal}
        order={editingOrder}
        initialStatus={orderEditInitialStatus}
        paymentDetails={orderPaymentDetails}
        isLoadingPaymentDetails={isLoadingOrderPaymentDetails}
        onClose={closeOrderEditModal}
        onOrderStatusChange={handleEditingOrderStatusChange}
        onShipmentDetailsChange={handleEditingOrderShipmentChange}
        onUpdateFulfillment={handleUpdateOrderFulfillment}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmDeleteModal
        isOpen={showDeleteModal}
        item={deleteItem}
        onClose={() => {
          setShowDeleteModal(false);
          setDeleteItem(null);
        }}
        onConfirm={confirmDelete}
      />

      {/* Contact Edit Modal */}
      <ContactEditModal
        isOpen={showContactEditModal}
        contact={editingContact}
        onClose={closeContactEditModal}
        onContactStatusChange={handleEditingContactStatusChange}
        onSave={handleSaveContactStatus}
      />

      <Footer />
    </div>
  );
};

export default SimpleAdminDashboard;
