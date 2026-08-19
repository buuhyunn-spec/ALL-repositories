import { useLocation, useNavigate, Link } from 'react-router-dom';
import { useState } from 'react';
import { format, parseISO } from 'date-fns';
import { CheckCircle2, ChevronLeft, MapPin, Calendar, Clock, DollarSign } from 'lucide-react';
import type { Court, TimeSlot } from '../types';
import { bookingsService } from '../services/bookingsService';
import { Button } from '../components/ui/Button';
import { SportBadge } from '../components/ui/SportBadge';

interface LocationState {
  slot: TimeSlot;
  court: Court;
}

type Step = 'confirm' | 'success';

export function BookingPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const state = location.state as LocationState | null;

  const [step, setStep] = useState<Step>('confirm');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bookingId, setBookingId] = useState('');

  // Guard: if navigated to without state, go back
  if (!state?.slot || !state?.court) {
    return (
      <div className="text-center py-24 px-4">
        <p className="text-gray-500 mb-4">No booking in progress.</p>
        <Link to="/courts" className="text-[#1B6547] underline text-sm">Browse courts</Link>
      </div>
    );
  }

  const { slot, court } = state;
  const dateObj = parseISO(slot.date);
  const duration = 1; // 1 hour per slot
  const total = court.pricePerHour * duration;

  async function handleConfirm() {
    setIsSubmitting(true);
    try {
      const booking = await bookingsService.create({
        courtId: court.id,
        courtName: court.name,
        userId: 'guest',
        timeSlotId: slot.id,
        date: slot.date,
        startTime: slot.startTime,
        endTime: slot.endTime,
        status: 'confirmed',
        totalPrice: total,
      });
      setBookingId(booking.id);
      setStep('success');
    } finally {
      setIsSubmitting(false);
    }
  }

  if (step === 'success') {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center">
        <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-5">
          <CheckCircle2 size={32} className="text-[#1B6547]" />
        </div>
        <h1 className="font-display text-2xl font-semibold text-gray-900 mb-2">You're booked!</h1>
        <p className="text-gray-500 mb-1">
          {court.name}
        </p>
        <p className="text-[#1B6547] font-medium mb-6">
          {format(dateObj, 'EEEE, MMMM d')} · {slot.startTime} – {slot.endTime}
        </p>
        <div className="bg-gray-50 rounded-xl p-4 text-sm text-gray-600 mb-8 text-left">
          <div className="flex justify-between mb-1">
            <span>Booking ID</span>
            <span className="font-mono text-xs text-gray-400">{bookingId}</span>
          </div>
          <div className="flex justify-between">
            <span>Total charged</span>
            <span className="font-semibold text-gray-900">${total}</span>
          </div>
        </div>
        <div className="flex gap-3">
          <Button variant="secondary" fullWidth onClick={() => navigate('/bookings')}>
            View my bookings
          </Button>
          <Button fullWidth onClick={() => navigate('/courts')}>
            Book another
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto px-4 sm:px-6 py-8">
      <Link
        to={`/courts/${court.id}`}
        className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-900 mb-6 transition-colors"
      >
        <ChevronLeft size={16} /> Back to court
      </Link>

      <h1 className="font-display text-2xl sm:text-3xl font-semibold text-gray-900 mb-6">
        Confirm booking
      </h1>

      {/* Court summary */}
      <div className="bg-white border border-gray-100 rounded-2xl p-5 mb-5 shadow-sm">
        <div className="flex items-start justify-between gap-3 mb-4">
          <div>
            <SportBadge sport={court.sport} />
            <h2 className="font-semibold text-gray-900 mt-2 text-lg">{court.name}</h2>
          </div>
        </div>

        <div className="space-y-3 text-sm">
          <div className="flex items-center gap-3 text-gray-600">
            <MapPin size={15} className="text-gray-400 flex-shrink-0" />
            <span>{court.address}</span>
          </div>
          <div className="flex items-center gap-3 text-gray-600">
            <Calendar size={15} className="text-gray-400 flex-shrink-0" />
            <span>{format(dateObj, 'EEEE, MMMM d, yyyy')}</span>
          </div>
          <div className="flex items-center gap-3 text-gray-600">
            <Clock size={15} className="text-gray-400 flex-shrink-0" />
            <span>{slot.startTime} – {slot.endTime} ({duration} hour)</span>
          </div>
        </div>
      </div>

      {/* Price breakdown */}
      <div className="bg-white border border-gray-100 rounded-2xl p-5 mb-6 shadow-sm">
        <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <DollarSign size={16} /> Price breakdown
        </h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between text-gray-600">
            <span>${court.pricePerHour}/hr × {duration} hour</span>
            <span>${court.pricePerHour}</span>
          </div>
          <div className="flex justify-between text-gray-600">
            <span>Booking fee</span>
            <span className="text-green-600">Free</span>
          </div>
          <div className="border-t border-gray-100 pt-2 flex justify-between font-semibold text-gray-900">
            <span>Total</span>
            <span>${total}</span>
          </div>
        </div>

        {/* Payment placeholder */}
        <div className="mt-5 p-3 bg-gray-50 rounded-xl text-xs text-gray-400 text-center">
          💳 Payment integration coming soon — no card required yet
        </div>
      </div>

      <Button fullWidth size="lg" onClick={handleConfirm} disabled={isSubmitting}>
        {isSubmitting ? 'Confirming…' : 'Confirm booking'}
      </Button>

      <p className="text-center text-xs text-gray-400 mt-3">
        Free cancellation up to 24 hours before your slot
      </p>
    </div>
  );
}
