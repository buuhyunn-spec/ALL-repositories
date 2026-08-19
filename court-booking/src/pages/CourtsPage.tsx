import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, SlidersHorizontal, X } from 'lucide-react';
import { courtsService, type CourtsFilter } from '../services/courtsService';
import type { Court, SportType } from '../types';
import { CourtCard } from '../components/courts/CourtCard';
import { CourtCardSkeleton } from '../components/ui/Skeleton';
import { SportBadge } from '../components/ui/SportBadge';
import { Button } from '../components/ui/Button';

const SPORTS: SportType[] = ['tennis', 'basketball', 'pickleball', 'padel', 'squash'];
const LOCATIONS = ['Brooklyn, NY', 'Manhattan, NY', 'Queens, NY', 'Hoboken, NJ'];

export function CourtsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [courts, setCourts] = useState<Court[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);

  const sportParam = searchParams.get('sport') as SportType | null;
  const queryParam = searchParams.get('q') ?? '';
  const locationParam = searchParams.get('location') ?? '';
  const maxPriceParam = searchParams.get('maxPrice');

  const [query, setQuery] = useState(queryParam);
  const [sport, setSport] = useState<SportType | ''>(sportParam ?? '');
  const [location, setLocation] = useState(locationParam);
  const [maxPrice, setMaxPrice] = useState(maxPriceParam ? Number(maxPriceParam) : 100);

  useEffect(() => {
    setIsLoading(true);
    const filter: CourtsFilter = {
      ...(sport ? { sport } : {}),
      ...(query ? { query } : {}),
      ...(location ? { location } : {}),
      ...(maxPrice < 100 ? { maxPrice } : {}),
    };
    courtsService.getAll(filter).then((data) => {
      setCourts(data);
      setIsLoading(false);
    });
  }, [sport, query, location, maxPrice]);

  function applyFilters() {
    const params: Record<string, string> = {};
    if (sport) params.sport = sport;
    if (query) params.q = query;
    if (location) params.location = location;
    if (maxPrice < 100) params.maxPrice = String(maxPrice);
    setSearchParams(params);
    setShowFilters(false);
  }

  function clearFilters() {
    setSport('');
    setQuery('');
    setLocation('');
    setMaxPrice(100);
    setSearchParams({});
  }

  const hasActiveFilters = !!(sport || query || location || maxPrice < 100);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="font-display text-3xl font-semibold text-gray-900 mb-1">Browse Courts</h1>
        <p className="text-gray-500 text-sm">
          {isLoading ? 'Loading…' : `${courts.length} court${courts.length !== 1 ? 's' : ''} available`}
        </p>
      </div>

      {/* Search + Filter bar */}
      <div className="flex gap-2 mb-4">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search courts or locations…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && applyFilters()}
            className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1B6547] focus:border-transparent bg-white"
          />
        </div>
        <Button
          variant="secondary"
          size="md"
          onClick={() => setShowFilters((f) => !f)}
          className="flex items-center gap-2"
        >
          <SlidersHorizontal size={15} />
          Filters
          {hasActiveFilters && (
            <span className="w-2 h-2 rounded-full bg-[#1B6547]" />
          )}
        </Button>
        {hasActiveFilters && (
          <Button variant="ghost" size="md" onClick={clearFilters} className="flex items-center gap-1 text-gray-500">
            <X size={14} /> Clear
          </Button>
        )}
      </div>

      {/* Sport pills */}
      <div className="flex flex-wrap gap-2 mb-4">
        {SPORTS.map((s) => (
          <button
            key={s}
            onClick={() => setSport((prev) => (prev === s ? '' : s))}
            className={`transition-all ${sport === s ? 'ring-2 ring-[#1B6547] ring-offset-1 rounded-full' : 'opacity-70 hover:opacity-100'}`}
          >
            <SportBadge sport={s} />
          </button>
        ))}
      </div>

      {/* Expanded filters */}
      {showFilters && (
        <div className="bg-white border border-gray-100 rounded-2xl p-5 mb-6 shadow-sm">
          <div className="grid sm:grid-cols-2 gap-4 mb-4">
            {/* Location */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                Location
              </label>
              <select
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B6547]"
              >
                <option value="">Any location</option>
                {LOCATIONS.map((l) => <option key={l} value={l}>{l}</option>)}
              </select>
            </div>

            {/* Max price */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                Max price: ${maxPrice === 100 ? 'Any' : `${maxPrice}/hr`}
              </label>
              <input
                type="range"
                min={15}
                max={100}
                step={5}
                value={maxPrice}
                onChange={(e) => setMaxPrice(Number(e.target.value))}
                className="w-full accent-[#1B6547]"
              />
              <div className="flex justify-between text-xs text-gray-400 mt-1">
                <span>$15</span><span>Any</span>
              </div>
            </div>
          </div>

          <div className="flex gap-2 justify-end">
            <Button variant="ghost" size="sm" onClick={() => setShowFilters(false)}>
              Cancel
            </Button>
            <Button size="sm" onClick={applyFilters}>
              Apply filters
            </Button>
          </div>
        </div>
      )}

      {/* Results grid */}
      {isLoading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {Array.from({ length: 6 }).map((_, i) => <CourtCardSkeleton key={i} />)}
        </div>
      ) : courts.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-4xl mb-4">🎾</p>
          <h3 className="font-semibold text-gray-700 mb-2">No courts found</h3>
          <p className="text-gray-400 text-sm mb-4">Try adjusting your filters or search term.</p>
          <Button variant="secondary" onClick={clearFilters}>Clear all filters</Button>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {courts.map((court) => (
            <CourtCard key={court.id} court={court} />
          ))}
        </div>
      )}
    </div>
  );
}
