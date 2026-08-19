export type SportType = 'tennis' | 'basketball' | 'pickleball' | 'padel' | 'squash';

export interface Court {
  id: string;
  name: string;
  sport: SportType;
  location: string;
  address: string;
  pricePerHour: number;
  amenities: string[];
  images: string[];
  rating: number;
  reviewCount: number;
  description: string;
}

export interface TimeSlot {
  id: string;
  courtId: string;
  date: string;        // ISO date: "2026-08-20"
  startTime: string;   // "09:00"
  endTime: string;     // "10:00"
  isAvailable: boolean;
}

export interface Booking {
  id: string;
  courtId: string;
  courtName: string;
  userId: string;      // "guest" until auth added
  timeSlotId: string;
  date: string;
  startTime: string;
  endTime: string;
  status: 'pending' | 'confirmed' | 'cancelled';
  totalPrice: number;
  createdAt: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
}
