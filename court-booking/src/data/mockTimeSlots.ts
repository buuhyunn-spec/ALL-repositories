import type { TimeSlot } from '../types';
import { addDays, format } from 'date-fns';

const HOURS = ['07:00', '08:00', '09:00', '10:00', '11:00', '12:00',
               '13:00', '14:00', '15:00', '16:00', '17:00', '18:00',
               '19:00', '20:00', '21:00'];

function nextHour(time: string): string {
  const [h, m] = time.split(':').map(Number);
  return `${String(h + 1).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

// Deterministic "randomness" so the same slot is always available/unavailable
function isAvailable(courtId: string, date: string, hour: string): boolean {
  const seed = courtId + date + hour;
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) & 0xffffffff;
  }
  return Math.abs(hash) % 3 !== 0; // ~67% available
}

export function generateTimeSlotsForCourt(courtId: string, daysAhead = 14): TimeSlot[] {
  const slots: TimeSlot[] = [];
  const today = new Date();

  for (let d = 0; d < daysAhead; d++) {
    const date = format(addDays(today, d), 'yyyy-MM-dd');
    HOURS.forEach((hour) => {
      slots.push({
        id: `${courtId}-${date}-${hour}`,
        courtId,
        date,
        startTime: hour,
        endTime: nextHour(hour),
        isAvailable: isAvailable(courtId, date, hour),
      });
    });
  }

  return slots;
}
