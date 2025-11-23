export type Item = {
  id: string | number;
  type: 'lost' | 'found';
  category: string;
  title: string;
  description: string;
  date: string; // ISO date string
  location: string;
  image?: string | null;
  contact: string;
  status: 'active' | 'resolved' | 'inactive' | string;
  reward?: string;
  ownerId?: string;
  ownerName?: string;
  ownerEmail?: string;
};

export type Filter = {
  type: 'all' | 'lost' | 'found';
  category: 'all' | string;
};

export type View = 'browse' | 'post';

export type FormData = {
  type: 'lost' | 'found';
  category: string;
  title: string;
  description: string;
  date: string; // ISO date string
  location: string;
  contact: string;
  reward?: string;
  image: string | null; // data URL preview or server URL
  imageFile?: File | null; // original file for upload
};

export type User = {
  userId: string;
  name: string;
  email: string;
  apiKey: string;
};
