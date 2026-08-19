import type { TimeSlot } from '../../types';

interface Props {
  slots: TimeSlot[];
  selectedSlot: TimeSlot | null;
  onSelect: (slot: TimeSlot) => void;
  isLoading?: boolean;
}

function formatTime(t: string): string {
  const [h, m] = t.split(':').map(Number);
  const period = h < 12 ? 'am' : 'pm';
  const hour = h % 12 === 0 ? 12 : h % 12;
  return `${hour}${m === 0 ? '' : ':' + String(m).padStart(2, '0')}${period}`;
}

export function TimeSlotPicker({ slots, selectedSlot, onSelect, isLoading }: Props) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
        {Array.from({ length: 12 }).map((_, i) => (
          <div key={i} className="animate-pulse h-10 bg-gray-200 rounded-lg" />
        ))}
      </div>
    );
  }

  if (slots.length === 0) {
    return (
      <p className="text-sm text-gray-500 py-4 text-center">
        No time slots available for this date.
      </p>
    );
  }

  return (
    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
      {slots.map((slot) => {
        const isSelected = selectedSlot?.id === slot.id;
        return (
          <button
            key={slot.id}
            onClick={() => slot.isAvailable && onSelect(slot)}
            disabled={!slot.isAvailable}
            className={`py-2 px-1 rounded-lg text-sm font-medium text-center transition-colors
              ${!slot.isAvailable
                ? 'bg-gray-100 text-gray-300 line-through cursor-not-allowed'
                : isSelected
                ? 'bg-[#1B6547] text-white'
                : 'border border-gray-200 hover:border-[#1B6547] hover:text-[#1B6547] text-gray-700'
              }`}
          >
            {formatTime(slot.startTime)}
          </button>
        );
      })}
    </div>
  );
}
