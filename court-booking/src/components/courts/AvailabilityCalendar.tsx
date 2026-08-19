import { useState } from 'react';
import { format, addDays, isSameDay, startOfDay } from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface Props {
  selectedDate: Date;
  onSelectDate: (date: Date) => void;
  daysAhead?: number;
}

export function AvailabilityCalendar({ selectedDate, onSelectDate, daysAhead = 14 }: Props) {
  const today = startOfDay(new Date());
  const [offset, setOffset] = useState(0); // scroll in 7-day windows

  const days = Array.from({ length: 7 }, (_, i) => addDays(today, offset * 7 + i));
  const maxOffset = Math.ceil(daysAhead / 7) - 1;

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <button
          onClick={() => setOffset((o) => Math.max(0, o - 1))}
          disabled={offset === 0}
          className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-30 disabled:pointer-events-none transition-colors"
          aria-label="Previous week"
        >
          <ChevronLeft size={18} />
        </button>
        <span className="text-sm font-medium text-gray-700">
          {format(days[0], 'MMM d')} – {format(days[6], 'MMM d, yyyy')}
        </span>
        <button
          onClick={() => setOffset((o) => Math.min(maxOffset, o + 1))}
          disabled={offset === maxOffset}
          className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-30 disabled:pointer-events-none transition-colors"
          aria-label="Next week"
        >
          <ChevronRight size={18} />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1">
        {days.map((day) => {
          const isSelected = isSameDay(day, selectedDate);
          const isToday = isSameDay(day, today);
          const isPast = day < today;

          return (
            <button
              key={day.toISOString()}
              onClick={() => !isPast && onSelectDate(day)}
              disabled={isPast}
              className={`flex flex-col items-center py-2 px-1 rounded-xl text-xs font-medium transition-colors
                ${isPast ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer'}
                ${isSelected
                  ? 'bg-[#1B6547] text-white'
                  : isToday
                  ? 'border-2 border-[#1B6547] text-[#1B6547] hover:bg-green-50'
                  : 'hover:bg-gray-100 text-gray-700'
                }`}
            >
              <span className="text-[10px] uppercase tracking-wide mb-1">
                {format(day, 'EEE')}
              </span>
              <span className="text-base font-semibold">{format(day, 'd')}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
