import type { SportType } from '../../types';

const SPORT_CONFIG: Record<SportType, { label: string; emoji: string; colors: string }> = {
  tennis:     { label: 'Tennis',     emoji: '🎾', colors: 'bg-green-100 text-green-800' },
  basketball: { label: 'Basketball', emoji: '🏀', colors: 'bg-orange-100 text-orange-800' },
  pickleball: { label: 'Pickleball', emoji: '🏓', colors: 'bg-yellow-100 text-yellow-800' },
  padel:      { label: 'Padel',      emoji: '🎾', colors: 'bg-blue-100 text-blue-800' },
  squash:     { label: 'Squash',     emoji: '🟡', colors: 'bg-purple-100 text-purple-800' },
};

interface Props {
  sport: SportType;
  size?: 'sm' | 'md';
}

export function SportBadge({ sport, size = 'sm' }: Props) {
  const cfg = SPORT_CONFIG[sport];
  return (
    <span
      className={`inline-flex items-center gap-1 font-medium rounded-full ${cfg.colors} ${
        size === 'sm' ? 'text-xs px-2.5 py-0.5' : 'text-sm px-3 py-1'
      }`}
    >
      <span aria-hidden="true">{cfg.emoji}</span>
      {cfg.label}
    </span>
  );
}
