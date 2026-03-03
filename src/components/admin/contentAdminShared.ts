import { Event } from '@/services/apiService';

export type ContentImage = {
  src: string;
  alt: string;
};

export type ContentFormState = {
  title: string;
  content: string;
  excerpt: string;
  author: string;
  publishDate: string;
  status: 'draft' | 'published';
  images: ContentImage[];
};

export const createInitialContentForm = (author = ''): ContentFormState => ({
  title: '',
  content: '',
  excerpt: '',
  author,
  publishDate: new Date().toISOString(),
  status: 'draft',
  images: [],
});

export type EventFormState = {
  title: string;
  description: string;
  excerpt: string;
  startDate: string;
  endDate: string;
  venue: string;
  googleMapsLink: string;
  venueWebsite: string;
  eventWebsite: string;
  organizerName: string;
  organizerWebsite: string;
  category: string;
  status: Event['status'];
  imageUrl: string;
};

export const createInitialEventForm = (): EventFormState => ({
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
  imageUrl: '',
});
