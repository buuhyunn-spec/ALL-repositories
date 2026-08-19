import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { format, parseISO, isPast } from 'date-fns';
import { Calendar, MapPin, CheckCircle2, XCircle, Clock, ChevronRight } from 'lucide-react';
import { bookingsService } from '../services/bookingsService';
import type { Booking } from '../types';
import { Button } from '../components/ui/Button';
import { Skeleton } from '../components/ui/Skeleton';

type Tab = 'upcoming' | 'past';

export function MyBookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [tab, setTab] = useState<Tab>('upcoming');
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  useEffect(() => {
    bookingsService.getAll().then((data) => {
      setBookings(data);
      setIsLoading(false);
    });
  }, []);

  async function handleCancel(id: string) {
    setCancellingId(id);
    const updated = await bookingsService.cancel(id);
    setBookings((prev) => prev.map((b) => (b.id === id ? updated : b)));
    setCancellingId(null);
  }

  const upcoming = bookings.filter(
    (b) => b.status !== 'cancelled' && !isPast(parseISO(`${b.date}T${b.endTime}:00`))
  );
  const past = bookings.filter(
    (b) => b.status === 'cancelled' || isPast(parseISO(`${b.date}T${b.endTime}:00`))
  );

  const shown = tab === 'upcoming' ? upcoming : past;

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
      <div className="mb-6">
        <h1 className="font-display text-3xl font-semibold text-gray-900 mb-1">My Bookings</h1>
        <p className="text-gray-500 text-sm">Your court reservations in one place.</p>
      </div>

      {/* Auth nudge banner — remove once auth is wired */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-800 mb-6 flex items-center justify-between gap-3">
        <span>Sign in to sync bookings across devices.</span>
        <Link to="/login" className="font-medium underline whitespace-nowrap">Sign in</Link>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 mb-6">
        {(['upcoming', 'past'] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2.5 text-sm font-medium capitalize transition-colors border-b-2 -mb-px ${
              tab === t
                ? 'border-[#1B6547] text-[#1B6547]'
                : 'border-transparent text-gray-500 hover:text-gray-900'
            }`}
          >
            {t}
            {t === 'upcoming' && upcoming.length > 0 && (
              <span className="ml-2 bg-green-100 text-green-700 text-xs font-semibold px-1.5 py-0.5 rounded-full">
                {upcoming.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-white rounded-2xl border border-gray-100 p-5">
              <Skeleton className="h-5 w-48 mb-3" />
              <Skeleton className="h-4 w-64 mb-2" />
              <Skeleton className="h-4 w-40" />
            </div>
          ))}
        </div>
      )}

      {/* Empty state */}
      {!isLoading && shown.length === 0 && (
        <div className="text-center py-20">
          <p className="text-4xl mb-4">{tab === 'upcoming' ? '📅' : '🎾'}</p>
          <h3 className="font-semibold text-gray-700 mb-2">
            {tab === 'upcoming' ? 'No upcoming bookings' : 'No past bookings'}
          </h3>
          <p className="text-gray-400 text-sm mb-6">
            {tab === 'upcoming' ? 'Find a court and book your first session.' : 'Your completed bookings will appear here.'}
          </p>
          {tab === 'upcoming' && (
            <Link to="/courts">
              <Button>Browse courts</Button>
            </Link>
          )}
        </div>
      )}

      {/* Booking list */}
      {!isLoading && shown.length > 0 && (
        <div className="space-y-4">
          {shown.map((booking) => {
            const dateObj = parseISO(booking.date);
            const isCancelled = booking.status === 'cancelled';
            return (
              <div
                key={booking.id}
                className={`bg-white rounded-2xl border p-5 shadow-sm ${
                  isCancelled ? 'border-gray-100 opacity-60' : 'border-gray-100'
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      {isCancelled ? (
                        <span className="inline-flex items-center gap-1 text-xs text-red-600 bg-red-50 px-2 py-0.5 rounded-full">
                          <XCircle size={11} /> Cancelled
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs text-green-700 bg-green-50 px-2 py-0.5 rounded-full">
                          <CheckCircle2 size={11} /> Confirmed
                        </span>
                      )}
                    </div>

                    <h3 className="font-semibold text-gray-900 truncate">{booking.courtName}</h3>

                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-500 mt-2">
                      <span className="flex items-center gap-1">
                        <Calendar size={13} />
                        {format(dateObj, 'EEE, MMM d, yyyy')}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock size={13} />
                        {booking.startTime} – {booking.endTime}
                      </span>
                    </div>

                    <div className="flex items-center gap-1 text-sm text-gray-500 mt-1">
                      <MapPin size={13} />
                      <Link
                        to={`/courts/${booking.courtId}`}
                        className="hover:text-[#1B6547] hover:underline transition-colors flex items-center gap-1"
                      >
                        View court <ChevronRight size={12} />
                      </Link>
                    </div>
                  </div>

                  <div className="text-right flex-shrink-0">
                    <div className="font-semibold text-gray-900">${booking.totalPrice}</div>
                    {!isCancelled && tab === 'upcoming' && (
                      <button
                        onClick={() => handleCancel(booking.id)}
                        disabled={cancellingId === booking.id}
                        className="text-xs text-red-500 hover:text-red-700 mt-2 transition-colors disabled:opacity-50"
                      >
                        {cancellingId === booking.id ? 'Cancelling…' : 'Cancel'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
