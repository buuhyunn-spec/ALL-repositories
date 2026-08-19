/**
 * Time-slots service — currently backed by generated mock data.
 * ★ Swap with `api.get('/courts/:id/slots?date=...')` when the backend is ready.
 */
import type { TimeSlot } from '../types';
import { generateTimeSlotsForCourt } from '../data/mockTimeSlots';

function delay<T>(value: T, ms = 200): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}

export const timeSlotsService = {
  async getForCourt(courtId: string, date: string): Promise<TimeSlot[]> {
    const all = generateTimeSlotsForCourt(courtId);
    const forDate = all.filter((s) => s.date === date);
    return delay(forDate);
  },
};
