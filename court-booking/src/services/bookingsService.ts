/**
 * Bookings service — currently persisted to localStorage.
 * ★ When the backend is ready:
 *   - getAll()    → api.get('/bookings')
 *   - create()    → api.post('/bookings', booking)
 *   - cancel()    → api.patch('/bookings/:id', { status: 'cancelled' })
 */
import type { Booking } from '../types';

const STORAGE_KEY = 'court_bookings';

function delay<T>(value: T, ms = 200): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}

function readStorage(): Booking[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]');
  } catch {
    return [];
  }
}

function writeStorage(bookings: Booking[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(bookings));
}

export const bookingsService = {
  async getAll(): Promise<Booking[]> {
    return delay(readStorage());
  },

  async create(booking: Omit<Booking, 'id' | 'createdAt'>): Promise<Booking> {
    const full: Booking = {
      ...booking,
      id: `b-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    writeStorage([...readStorage(), full]);
    return delay(full);
  },

  async cancel(id: string): Promise<Booking> {
    const bookings = readStorage().map((b) =>
      b.id === id ? { ...b, status: 'cancelled' as const } : b
    );
    writeStorage(bookings);
    const cancelled = bookings.find((b) => b.id === id)!;
    return delay(cancelled);
  },
};
