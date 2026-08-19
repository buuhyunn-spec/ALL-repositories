import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Zap, Shield, Clock } from 'lucide-react';
import { mockCourts } from '../data/mockCourts';
import { CourtCard } from '../components/courts/CourtCard';
import { SportBadge } from '../components/ui/SportBadge';
import { Button } from '../components/ui/Button';
import type { SportType } from '../types';

const SPORTS: SportType[] = ['tennis', 'basketball', 'pickleball', 'padel', 'squash'];

export function HomePage() {
  const [query, setQuery] = useState('');
  const navigate = useNavigate();
  const featured = mockCourts.slice(0, 3);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    navigate(`/courts${query ? `?q=${encodeURIComponent(query)}` : ''}`);
  }

  return (
    <div>
      {/* Hero */}
      <section className="bg-gradient-to-br from-[#1B6547] to-[#0f3f2b] text-white py-20 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <p className="text-green-300 font-mono text-xs tracking-widest uppercase mb-4">
            Book in seconds
          </p>
          <h1 className="font-display text-4xl sm:text-5xl font-semibold leading-tight mb-4">
            Your court is waiting
          </h1>
          <p className="text-green-100 text-lg mb-10 max-w-xl mx-auto">
            Find and book tennis, pickleball, basketball, padel, and squash courts near you.
          </p>

          {/* Search */}
          <form onSubmit={handleSearch} className="flex gap-2 max-w-xl mx-auto">
            <div className="relative flex-1">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search courts, locations…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-white text-gray-900 placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
              />
            </div>
            <Button type="submit" size="lg">
              Search
            </Button>
          </form>

          {/* Sport filter pills */}
          <div className="flex flex-wrap justify-center gap-2 mt-6">
            {SPORTS.map((s) => (
              <button
                key={s}
                onClick={() => navigate(`/courts?sport=${s}`)}
                className="transition-transform hover:scale-105"
              >
                <SportBadge sport={s} size="md" />
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Why CourtBook */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-14">
        <div className="grid sm:grid-cols-3 gap-6">
          {[
            { icon: <Zap size={20} />, title: 'Instant booking', body: 'Pick your slot and confirm in under a minute — no phone calls, no back-and-forth.' },
            { icon: <Clock size={20} />, title: 'Real-time availability', body: 'See live availability across all courts and dates, updated continuously.' },
            { icon: <Shield size={20} />, title: 'Free cancellation', body: 'Plans change. Cancel up to 24 hours before your booking with no fees.' },
          ].map((f) => (
            <div key={f.title} className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
              <div className="w-10 h-10 rounded-xl bg-green-50 text-[#1B6547] flex items-center justify-center mb-4">
                {f.icon}
              </div>
              <h3 className="font-semibold text-gray-900 mb-1.5">{f.title}</h3>
              <p className="text-sm text-gray-500 leading-relaxed">{f.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Featured courts */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 pb-16">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-display text-2xl font-semibold text-gray-900">
            Featured courts
          </h2>
          <Button variant="ghost" size="sm" onClick={() => navigate('/courts')}>
            See all →
          </Button>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {featured.map((court) => (
            <CourtCard key={court.id} court={court} />
          ))}
        </div>
      </section>
    </div>
  );
}
