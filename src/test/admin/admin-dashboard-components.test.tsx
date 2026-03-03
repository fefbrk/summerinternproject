import { useState } from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, test, vi } from 'vitest';
import type {
  BlogPost,
  Event,
  Order,
  OrderPaymentStatus,
  PressRelease,
  MediaCoverage,
} from '@/services/apiService';
import AdminOrdersTab from '@/components/admin/AdminOrdersTab';
import OrderEditModal from '@/components/admin/OrderEditModal';
import { createInitialOrderPaymentForm } from '@/components/admin/orderAdminShared';
import AdminBlogTab from '@/components/admin/AdminBlogTab';
import AdminPressReleasesTab from '@/components/admin/AdminPressReleasesTab';
import AdminMediaCoverageTab from '@/components/admin/AdminMediaCoverageTab';
import AdminEventsTab from '@/components/admin/AdminEventsTab';
import BlogEditModal from '@/components/admin/BlogEditModal';
import ConfirmDeleteModal from '@/components/admin/ConfirmDeleteModal';
import { createInitialContentForm, type ContentFormState } from '@/components/admin/contentAdminShared';

const sampleOrder: Order = {
  id: 'order-1',
  userId: 'user-1',
  items: [
    {
      id: 'item-1',
      name: 'KIBO Kit',
      quantity: 2,
      price: 99,
    },
  ],
  totalAmount: 198,
  status: 'received',
  paymentStatus: 'pending',
  paymentProvider: 'manual',
  paymentReference: null,
  paymentAmount: 198,
  paymentCurrency: 'USD',
  paymentFailedReason: null,
  paidAt: null,
  shippingAddress: {
    name: 'Jane Doe',
    address: 'Main Street 1',
    city: 'Boston',
    province: 'MA',
    zipCode: '02108',
  },
  customerName: 'Jane Doe',
  customerEmail: 'jane@example.com',
  createdAt: '2026-03-03T10:00:00.000Z',
};

const samplePaymentDetails: OrderPaymentStatus = {
  orderId: 'order-1',
  paymentStatus: 'pending',
  paymentProvider: 'manual',
  paymentReference: null,
  paymentAmount: 198,
  paymentCurrency: 'USD',
  paymentFailedReason: null,
  paidAt: null,
  attempts: [
    {
      id: 'attempt-1',
      orderId: 'order-1',
      provider: 'manual',
      providerReference: 'ref-1',
      amount: 198,
      currency: 'USD',
      status: 'pending',
      failureReason: null,
      metadata: {},
      createdAt: '2026-03-03T10:00:00.000Z',
      updatedAt: '2026-03-03T10:00:00.000Z',
    },
  ],
};

const sampleBlogPost: BlogPost = {
  id: 'blog-1',
  title: 'Robotics in Classrooms',
  content: '<p>Content</p>',
  excerpt: 'Excerpt',
  author: 'Admin',
  publishDate: '2026-03-01T10:00:00.000Z',
  status: 'draft',
  createdAt: '2026-03-01T10:00:00.000Z',
  updatedAt: '2026-03-01T10:00:00.000Z',
  images: [],
};

const samplePressRelease: PressRelease = {
  id: 'press-1',
  title: 'Press Release',
  content: '<p>Press</p>',
  excerpt: 'Press excerpt',
  author: 'Admin',
  publishDate: '2026-03-01T10:00:00.000Z',
  status: 'draft',
  createdAt: '2026-03-01T10:00:00.000Z',
  updatedAt: '2026-03-01T10:00:00.000Z',
  images: [],
};

const sampleMediaCoverage: MediaCoverage = {
  id: 'media-1',
  title: 'Media Coverage',
  content: '<p>Media</p>',
  excerpt: 'Media excerpt',
  sourceName: 'Tech Magazine',
  sourceUrl: 'https://example.com/story',
  author: 'Admin',
  publishDate: '2026-03-01T10:00:00.000Z',
  status: 'draft',
  createdAt: '2026-03-01T10:00:00.000Z',
  updatedAt: '2026-03-01T10:00:00.000Z',
  images: [],
};

const sampleEvent: Event = {
  id: 'event-1',
  title: 'STEM Workshop',
  description: '<p>Workshop</p>',
  excerpt: 'Event excerpt',
  startDate: '2026-03-10T09:00:00.000Z',
  endDate: '2026-03-10T11:00:00.000Z',
  venueName: 'Innovation Hall',
  venueAddress: 'Main Street 1',
  venueCity: 'Boston',
  venueState: 'MA',
  venueZipCode: '02108',
  venueCountry: 'US',
  venueWebsite: 'https://example.com/venue',
  googleMapsLink: 'https://maps.example.com',
  organizerName: 'KinderLab',
  organizerWebsite: 'https://example.com/organizer',
  eventWebsite: 'https://example.com/event',
  status: 'upcoming',
  category: 'workshop',
  imageUrl: '',
  createdAt: '2026-03-01T10:00:00.000Z',
  updatedAt: '2026-03-01T10:00:00.000Z',
};

describe('admin dashboard critical component flows', () => {
  afterEach(() => {
    cleanup();
  });

  test('orders tab triggers sort, filters, and row actions', () => {
    const onSortOrders = vi.fn();
    const onOrderStatusFilterChange = vi.fn();
    const onOrderPaymentFilterChange = vi.fn();
    const onManageOrder = vi.fn();
    const onDeleteOrder = vi.fn();

    render(
      <AdminOrdersTab
        orders={[sampleOrder]}
        orderSortField="createdAt"
        orderSortDirection="desc"
        orderStatusFilter="all"
        orderPaymentFilter="all"
        onSortOrders={onSortOrders}
        onOrderStatusFilterChange={onOrderStatusFilterChange}
        onOrderPaymentFilterChange={onOrderPaymentFilterChange}
        onManageOrder={onManageOrder}
        onDeleteOrder={onDeleteOrder}
      />
    );

    fireEvent.click(screen.getByText(/Order ID/i));
    expect(onSortOrders).toHaveBeenCalledWith('id');

    fireEvent.change(screen.getByLabelText(/Fulfillment/i), { target: { value: 'shipping' } });
    expect(onOrderStatusFilterChange).toHaveBeenCalledWith('shipping');

    fireEvent.change(screen.getByLabelText(/Payment/i), { target: { value: 'paid' } });
    expect(onOrderPaymentFilterChange).toHaveBeenCalledWith('paid');

    fireEvent.click(screen.getByRole('button', { name: 'Manage' }));
    expect(onManageOrder).toHaveBeenCalledWith(sampleOrder);

    fireEvent.click(screen.getByRole('button', { name: 'Delete' }));
    expect(onDeleteOrder).toHaveBeenCalledWith(sampleOrder);
  });

  test('order edit modal triggers payment and fulfillment callbacks', () => {
    const onClose = vi.fn();
    const onOrderStatusChange = vi.fn();
    const onPaymentFormChange = vi.fn();
    const onUpdatePayment = vi.fn();
    const onUpdateFulfillment = vi.fn();

    render(
      <OrderEditModal
        isOpen={true}
        order={sampleOrder}
        paymentDetails={samplePaymentDetails}
        isLoadingPaymentDetails={false}
        isUpdatingPayment={false}
        paymentForm={createInitialOrderPaymentForm()}
        onClose={onClose}
        onOrderStatusChange={onOrderStatusChange}
        onPaymentFormChange={onPaymentFormChange}
        onUpdatePayment={onUpdatePayment}
        onUpdateFulfillment={onUpdateFulfillment}
      />
    );

    const [orderStatusSelect, paymentStatusSelect] = screen.getAllByRole('combobox');

    fireEvent.change(orderStatusSelect, { target: { value: 'shipping' } });
    expect(onOrderStatusChange).toHaveBeenCalledWith('shipping');

    fireEvent.change(paymentStatusSelect, { target: { value: 'paid' } });
    expect(onPaymentFormChange).toHaveBeenCalledWith({ paymentStatus: 'paid' });

    fireEvent.click(screen.getByRole('button', { name: 'Update Payment' }));
    expect(onUpdatePayment).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole('button', { name: 'Update Fulfillment' }));
    expect(onUpdateFulfillment).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  test('blog tab triggers create, edit, and delete callbacks', () => {
    const onCreateBlogPost = vi.fn();
    const onEditBlogPost = vi.fn();
    const onDeleteBlogPost = vi.fn();

    render(
      <AdminBlogTab
        blogPosts={[sampleBlogPost]}
        onCreateBlogPost={onCreateBlogPost}
        onEditBlogPost={onEditBlogPost}
        onDeleteBlogPost={onDeleteBlogPost}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: '+ New Blog Post' }));
    expect(onCreateBlogPost).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole('button', { name: 'Edit' }));
    expect(onEditBlogPost).toHaveBeenCalledWith(sampleBlogPost);

    fireEvent.click(screen.getByRole('button', { name: 'Delete' }));
    expect(onDeleteBlogPost).toHaveBeenCalledWith(sampleBlogPost);
  });

  test('press releases tab triggers create, edit, and delete callbacks', () => {
    const onCreatePressRelease = vi.fn();
    const onEditPressRelease = vi.fn();
    const onDeletePressRelease = vi.fn();

    render(
      <AdminPressReleasesTab
        pressReleases={[samplePressRelease]}
        onCreatePressRelease={onCreatePressRelease}
        onEditPressRelease={onEditPressRelease}
        onDeletePressRelease={onDeletePressRelease}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: '+ New Press Release' }));
    expect(onCreatePressRelease).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole('button', { name: 'Edit' }));
    expect(onEditPressRelease).toHaveBeenCalledWith(samplePressRelease);

    fireEvent.click(screen.getByRole('button', { name: 'Delete' }));
    expect(onDeletePressRelease).toHaveBeenCalledWith(samplePressRelease);
  });

  test('media coverage tab triggers create, edit, and delete callbacks', () => {
    const onCreateMediaCoverage = vi.fn();
    const onEditMediaCoverage = vi.fn();
    const onDeleteMediaCoverage = vi.fn();

    render(
      <AdminMediaCoverageTab
        mediaCoverages={[sampleMediaCoverage]}
        onCreateMediaCoverage={onCreateMediaCoverage}
        onEditMediaCoverage={onEditMediaCoverage}
        onDeleteMediaCoverage={onDeleteMediaCoverage}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: '+ New Media Coverage' }));
    expect(onCreateMediaCoverage).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole('button', { name: 'Edit' }));
    expect(onEditMediaCoverage).toHaveBeenCalledWith(sampleMediaCoverage);

    fireEvent.click(screen.getByRole('button', { name: 'Delete' }));
    expect(onDeleteMediaCoverage).toHaveBeenCalledWith(sampleMediaCoverage);
  });

  test('events tab triggers create, edit, and delete callbacks', () => {
    const onCreateEvent = vi.fn();
    const onEditEvent = vi.fn();
    const onDeleteEvent = vi.fn();

    render(
      <AdminEventsTab
        events={[sampleEvent]}
        onCreateEvent={onCreateEvent}
        onEditEvent={onEditEvent}
        onDeleteEvent={onDeleteEvent}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: '+ New Event' }));
    expect(onCreateEvent).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole('button', { name: 'Edit' }));
    expect(onEditEvent).toHaveBeenCalledWith(sampleEvent);

    fireEvent.click(screen.getByRole('button', { name: 'Delete' }));
    expect(onDeleteEvent).toHaveBeenCalledWith(sampleEvent);
  });

  test('blog edit modal updates form state and submits', () => {
    const onSubmit = vi.fn();
    const onClose = vi.fn();
    const onUploadImage = vi.fn();

    const BlogModalHarness = () => {
      const [formData, setFormData] = useState<ContentFormState>(createInitialContentForm('Admin'));

      return (
        <BlogEditModal
          isOpen={true}
          editingBlogPost={null}
          formData={formData}
          setFormData={setFormData}
          isUploadingImage={false}
          onClose={onClose}
          onUploadImage={onUploadImage}
          onSubmit={onSubmit}
        />
      );
    };

    render(<BlogModalHarness />);

    fireEvent.change(screen.getByPlaceholderText('Enter blog post title'), {
      target: { value: 'Updated Blog Title' },
    });
    expect(screen.getByDisplayValue('Updated Blog Title')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Create Blog Post' }));
    expect(onSubmit).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  test('delete confirmation modal calls close and confirm actions', () => {
    const onClose = vi.fn();
    const onConfirm = vi.fn();

    render(
      <ConfirmDeleteModal
        isOpen={true}
        item={{ type: 'blog', id: 'blog-1', name: 'Robotics in Classrooms' }}
        onClose={onClose}
        onConfirm={onConfirm}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: 'İptal' }));
    expect(onClose).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole('button', { name: 'Sil' }));
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });
});
