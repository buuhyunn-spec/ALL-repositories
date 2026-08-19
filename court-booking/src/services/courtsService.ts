/**
 * Courts service — currently backed by mock data.
 * ★ Swap the return statements with `api.get(...)` calls when the backend is ready.
 */
import type { Court, SportType } from '../types';
import { mockCourts } from '../data/mockCourts';

function delay<T>(value: T, ms = 300): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}

export interface CourtsFilter {
  sport?: SportType;
  location?: string;
  maxPrice?: number;
  query?: string;
}

export const courtsService = {
  async getAll(filter?: CourtsFilter): Promise<Court[]> {
    let results = [...mockCourts];

    if (filter?.sport) {
      results = results.filter((c) => c.sport === filter.sport);
    }
    if (filter?.location) {
      const loc = filter.location.toLowerCase();
      results = results.filter((c) => c.location.toLowerCase().includes(loc));
    }
    if (filter?.maxPrice !== undefined) {
      results = results.filter((c) => c.pricePerHour <= filter.maxPrice!);
    }
    if (filter?.query) {
      const q = filter.query.toLowerCase();
      results = results.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.location.toLowerCase().includes(q) ||
          c.sport.toLowerCase().includes(q)
      );
    }

    return delay(results);
  },

  async getById(id: string): Promise<Court | null> {
    const court = mockCourts.find((c) => c.id === id) ?? null;
    return delay(court);
  },
};
