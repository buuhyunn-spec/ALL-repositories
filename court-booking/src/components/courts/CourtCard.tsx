import { Link } from 'react-router-dom';
import { MapPin, Star, Clock } from 'lucide-react';
import type { Court } from '../../types';
import { SportBadge } from '../ui/SportBadge';

// Sport-specific placeholder gradients (no external images needed)
const SPORT_GRADIENT: Record<string, string> = {
  tennis:     'from-green-600 to-green-800',
  basketball: 'from-orange-500 to-orange-700',
  pickleball: 'from-yellow-500 to-amber-700',
  padel:      'from-blue-500 to-blue-700',
  squash:     'from-purple-600 to-purple-800',
};

// Court line SVGs per sport (top-down view)
function CourtArt({ sport }: { sport: string }) {
  if (sport === 'tennis') {
    return (
      <svg viewBox="0 0 200 120" fill="none" className="absolute inset-0 w-full h-full opacity-20">
        <rect x="10" y="10" width="180" height="100" stroke="white" strokeWidth="2" />
        <line x1="100" y1="10" x2="100" y2="110" stroke="white" strokeWidth="1.5" />
        <line x1="10" y1="35" x2="100" y2="35" stroke="white" strokeWidth="1" />
        <line x1="10" y1="85" x2="100" y2="85" stroke="white" strokeWidth="1" />
        <line x1="55" y1="35" x2="55" y2="85" stroke="white" strokeWidth="1" />
        <line x1="100" y1="35" x2="190" y2="35" stroke="white" strokeWidth="1" />
        <line x1="100" y1="85" x2="190" y2="85" stroke="white" strokeWidth="1" />
        <line x1="145" y1="35" x2="145" y2="85" stroke="white" strokeWidth="1" />
        <line x1="10" y1="60" x2="190" y2="60" stroke="white" strokeWidth="2.5" strokeDasharray="4 3" />
      </svg>
    );
  }
  if (sport === 'basketball') {
    return (
      <svg viewBox="0 0 200 120" fill="none" className="absolute inset-0 w-full h-full opacity-20">
        <rect x="10" y="10" width="180" height="100" stroke="white" strokeWidth="2" />
        <line x1="100" y1="10" x2="100" y2="110" stroke="white" strokeWidth="1.5" />
        <circle cx="100" cy="60" r="18" stroke="white" strokeWidth="1.5" />
        <rect x="10" y="35" width="40" height="50" stroke="white" strokeWidth="1.5" />
        <rect x="150" y="35" width="40" height="50" stroke="white" strokeWidth="1.5" />
        <circle cx="30" cy="60" r="10" stroke="white" strokeWidth="1" />
        <circle cx="170" cy="60" r="10" stroke="white" strokeWidth="1" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 200 120" fill="none" className="absolute inset-0 w-full h-full opacity-20">
      <rect x="10" y="10" width="180" height="100" stroke="white" strokeWidth="2" />
      <line x1="100" y1="10" x2="100" y2="110" stroke="white" strokeWidth="2" />
      <rect x="10" y="25" width="180" height="70" stroke="white" strokeWidth="1" />
      <line x1="10" y1="60" x2="190" y2="60" stroke="white" strokeWidth="2" strokeDasharray="4 3" />
    </svg>
  );
}

interface Props {
  court: Court;
}

export function CourtCard({ court }: Props) {
  const gradient = SPORT_GRADIENT[court.sport] ?? 'from-gray-600 to-gray-800';

  return (
    <Link
      to={`/courts/${court.id}`}
      className="group block bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm hover:shadow-md transition-shadow"
    >
      {/* Visual */}
      <div className={`relative h-44 bg-gradient-to-br ${gradient} flex items-center justify-center overflow-hidden`}>
        <CourtArt sport={court.sport} />
        <span className="relative text-5xl" aria-hidden="true">
          {court.sport === 'basketball' ? '🏀'
           : court.sport === 'pickleball' ? '🏓'
           : court.sport === 'squash' ? '🟡'
           : court.sport === 'padel' ? '🎾'
           : '🎾'}
        </span>
      </div>

      {/* Info */}
      <div className="p-5">
        <div className="mb-2">
          <SportBadge sport={court.sport} />
        </div>

        <h3 className="font-semibold text-gray-900 text-base leading-snug group-hover:text-[#1B6547] transition-colors mb-1">
          {court.name}
        </h3>

        <div className="flex items-center gap-1 text-gray-500 text-sm mb-3">
          <MapPin size={13} className="flex-shrink-0" />
          <span>{court.location}</span>
        </div>

        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-1 text-gray-600">
            <Star size={13} className="fill-amber-400 text-amber-400" />
            <span className="font-medium">{court.rating}</span>
            <span className="text-gray-400">({court.reviewCount})</span>
          </div>
          <div className="flex items-center gap-1 text-gray-600">
            <Clock size={13} />
            <span>
              <span className="font-semibold text-gray-900">${court.pricePerHour}</span>
              <span className="text-gray-400">/hr</span>
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
