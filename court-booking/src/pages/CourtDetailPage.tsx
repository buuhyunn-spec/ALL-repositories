import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { MapPin, Star, ChevronLeft, CheckCircle2, DollarSign } from 'lucide-react';
import { format } from 'date-fns';
import { courtsService } from '../services/courtsService';
import { timeSlotsService } from '../services/timeSlotsService';
import type { Court, TimeSlot } from '../types';
import { SportBadge } from '../components/ui/SportBadge';
import { AvailabilityCalendar } from '../components/courts/AvailabilityCalendar';
import { TimeSlotPicker } from '../components/booking/TimeSlotPicker';
import { Button } from '../components/ui/Button';
import { Skeleton } from '../components/ui/Skeleton';

const SPORT_GRADIENT: Record<string, string> = {
  tennis:     'from-green-600 to-green-800',
  basketball: 'from-orange-500 to-orange-700',
  pickleball: 'from-yellow-500 to-amber-700',
  padel:      'from-blue-500 to-blue-700',
  squash:     'from-purple-600 to-purple-800',
};

export function CourtDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [court, setCourt] = useState<Court | null>(null);
  const [courtLoading, setCourtLoading] = useState(true);

  const [selectedDate, setSelectedDate] = useState(new Date());
  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);

  useEffect(() => {
    if (!id) return;
    courtsService.getById(id).then((c) => {
      setCourt(c);
      setCourtLoading(false);
    });
  }, [id]);

  useEffect(() => {
    if (!id) return;
    setSlotsLoading(true);
    setSelectedSlot(null);
    timeSlotsService
      .getForCourt(id, format(selectedDate, 'yyyy-MM-dd'))
      .then((data) => {
        setSlots(data);
        setSlotsLoading(false);
      });
  }, [id, selectedDate]);

  function handleBook() {
    if (!selectedSlot || !court) return;
    navigate(`/book/${court.id}`, {
      state: { slot: selectedSlot, court },
    });
  }

  if (courtLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        <Skeleton className="h-64 mb-6 rounded-2xl" />
        <Skeleton className="h-7 w-64 mb-2" />
        <Skeleton className="h-4 w-40 mb-6" />
        <Skeleton className="h-40" />
      </div>
    );
  }

  if (!court) {
    return (
      <div className="text-center py-24">
        <p className="text-gray-500 mb-4">Court not found.</p>
        <Link to="/courts" className="text-[#1B6547] underline text-sm">Back to courts</Link>
      </div>
    );
  }

  const gradient = SPORT_GRADIENT[court.sport] ?? 'from-gray-600 to-gray-800';

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      {/* Back */}
      <Link
        to="/courts"
        className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-900 mb-5 transition-colors"
      >
        <ChevronLeft size={16} /> All courts
      </Link>

      {/* Hero image */}
      <div className={`relative h-56 sm:h-72 rounded-2xl overflow-hidden bg-gradient-to-br ${gradient} mb-6 flex items-center justify-center`}>
        <span className="text-7xl" aria-hidden="true">
          {court.sport === 'basketball' ? '🏀' : court.sport === 'pickleball' ? '🏓' : '🎾'}
        </span>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Left: Court info */}
        <div className="lg:col-span-2 space-y-6">
          <div>
            <div className="flex items-start justify-between gap-4 flex-wrap mb-2">
              <h1 className="font-display text-2xl sm:text-3xl font-semibold text-gray-900">
                {court.name}
              </h1>
              <SportBadge sport={court.sport} size="md" />
            </div>

            <div className="flex items-center gap-4 text-sm text-gray-500 flex-wrap">
              <span className="flex items-center gap-1">
                <MapPin size={14} /> {court.address}
              </span>
              <span className="flex items-center gap-1">
                <Star size={14} className="fill-amber-400 text-amber-400" />
                <strong className="text-gray-700">{court.rating}</strong>
                <span>({court.reviewCount} reviews)</span>
              </span>
            </div>
          </div>

          <p className="text-gray-600 leading-relaxed">{court.description}</p>

          {/* Amenities */}
          <div>
            <h2 className="font-semibold text-gray-900 mb-3">Amenities</h2>
            <div className="flex flex-wrap gap-2">
              {court.amenities.map((a) => (
                <span key={a} className="inline-flex items-center gap-1.5 text-sm bg-green-50 text-green-700 px-3 py-1 rounded-full">
                  <CheckCircle2 size={13} />
                  {a}
                </span>
              ))}
            </div>
          </div>

          {/* Booking date / time selection (mobile: shown inline) */}
          <div className="lg:hidden">
            <BookingPanel
              court={court}
              selectedDate={selectedDate}
              onSelectDate={setSelectedDate}
              slots={slots}
              slotsLoading={slotsLoading}
              selectedSlot={selectedSlot}
              onSelectSlot={setSelectedSlot}
              onBook={handleBook}
            />
          </div>
        </div>

        {/* Right: Booking card (desktop) */}
        <div className="hidden lg:block">
          <div className="sticky top-24 bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
            <BookingPanel
              court={court}
              selectedDate={selectedDate}
              onSelectDate={setSelectedDate}
              slots={slots}
              slotsLoading={slotsLoading}
              selectedSlot={selectedSlot}
              onSelectSlot={setSelectedSlot}
              onBook={handleBook}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Booking panel (shared between mobile inline + desktop sticky) ── */
interface BookingPanelProps {
  court: Court;
  selectedDate: Date;
  onSelectDate: (d: Date) => void;
  slots: TimeSlot[];
  slotsLoading: boolean;
  selectedSlot: TimeSlot | null;
  onSelectSlot: (s: TimeSlot) => void;
  onBook: () => void;
}

function BookingPanel({
  court, selectedDate, onSelectDate, slots, slotsLoading, selectedSlot, onSelectSlot, onBook,
}: BookingPanelProps) {
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1 text-gray-600 text-sm">
          <DollarSign size={16} />
          <span className="font-bold text-gray-900 text-xl">${court.pricePerHour}</span>
          <span className="text-gray-400">/ hr</span>
        </div>
      </div>

      <div>
        <h3 className="text-sm font-semibold text-gray-700 mb-3">Select a date</h3>
        <AvailabilityCalendar selectedDate={selectedDate} onSelectDate={onSelectDate} />
      </div>

      <div>
        <h3 className="text-sm font-semibold text-gray-700 mb-3">
          Available times — {format(selectedDate, 'MMM d')}
        </h3>
        <TimeSlotPicker
          slots={slots}
          selectedSlot={selectedSlot}
          onSelect={onSelectSlot}
          isLoading={slotsLoading}
        />
      </div>

      {selectedSlot && (
        <div className="bg-green-50 rounded-xl p-3 text-sm text-green-800">
          <strong>{format(selectedDate, 'EEE, MMM d')}</strong> at{' '}
          <strong>{selectedSlot.startTime} – {selectedSlot.endTime}</strong>
        </div>
      )}

      <Button fullWidth size="lg" disabled={!selectedSlot} onClick={onBook}>
        {selectedSlot ? 'Book this slot' : 'Select a time slot'}
      </Button>
    </div>
  );
}
