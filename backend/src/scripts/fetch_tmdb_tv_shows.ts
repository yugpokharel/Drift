import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

const TMDB_BASE = 'https://api.themoviedb.org/3';
const token = () => process.env.TMDB_API_READ_TOKEN ?? '';

interface TMDBShowRaw {
  id: number;
  name: string;
  overview: string;
  vote_average: number;
  vote_count: number;
  genre_ids: number[];
  first_air_date?: string;
  backdrop_path?: string;
}

// Map TMDB genre IDs to standard string names matching our system
const GENRE_MAP: Record<number, string> = {
  10759: 'Action & Adventure',
  16: 'Animation',
  35: 'Comedy',
  80: 'Crime',
  99: 'Documentary',
  18: 'Drama',
  10751: 'Family',
  10762: 'Kids',
  9648: 'Mystery',
  10763: 'News',
  10764: 'Reality',
  10765: 'Sci-Fi & Fantasy',
  10766: 'Soap',
  10767: 'Talk',
  10768: 'War & Politics',
  37: 'Western',
};

async function fetchPage(type: 'popular' | 'top_rated', page: number): Promise<TMDBShowRaw[]> {
  const url = `${TMDB_BASE}/tv/${type}?page=${page}`;
  try {
    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token()}`,
        'Content-Type': 'application/json',
      },
    });
    if (!res.ok) {
      console.error(`[TMDB] Failed to fetch ${type} page ${page}: ${res.status}`);
      return [];
    }
    const data = await res.json() as { results: TMDBShowRaw[] };
    return data.results || [];
  } catch (err: any) {
    console.error(`[TMDB] Error fetching ${type} page ${page}:`, err.message);
    return [];
  }
}

async function main() {
  console.log('=== Fetching TMDB TV Shows ===');
  const showsMap = new Map<number, any>();

  // Fetch 150 pages of top_rated and 150 pages of popular (each page has 20 shows)
  // Total 300 pages = 6,000 potential shows
  const pagesPerType = 150;

  console.log(`Fetching ${pagesPerType} pages of popular TV shows...`);
  for (let p = 1; p <= pagesPerType; p++) {
    const results = await fetchPage('popular', p);
    for (const s of results) {
      if (s.name && s.overview) {
        showsMap.set(s.id, s);
      }
    }
    // Respect TMDB guidelines (no strict rate limit, but keep it friendly)
    if (p % 30 === 0) {
      console.log(`  Fetched page ${p}/${pagesPerType}... Unique shows collected: ${showsMap.size}`);
    }
    await new Promise((resolve) => setTimeout(resolve, 50));
  }

  console.log(`Fetching ${pagesPerType} pages of top rated TV shows...`);
  for (let p = 1; p <= pagesPerType; p++) {
    const results = await fetchPage('top_rated', p);
    for (const s of results) {
      if (s.name && s.overview) {
        showsMap.set(s.id, s);
      }
    }
    if (p % 30 === 0) {
      console.log(`  Fetched page ${p}/${pagesPerType}... Unique shows collected: ${showsMap.size}`);
    }
    await new Promise((resolve) => setTimeout(resolve, 50));
  }

  const allShows = Array.from(showsMap.values()).map((s) => {
    const genres = s.genre_ids.map((id: number) => GENRE_MAP[id] || 'Drama');
    return {
      tmdbId: s.id,
      title: s.name,
      overview: s.overview,
      genres: genres.length > 0 ? genres : ['Drama'],
      vote_average: s.vote_average,
      vote_count: s.vote_count,
      releaseDate: s.first_air_date || '2020',
      backdrop_path: s.backdrop_path,
    };
  });

  console.log(`Completed fetching. Total unique TV shows: ${allShows.length}`);

  const outputDir = path.resolve('src/data');
  fs.mkdirSync(outputDir, { recursive: true });
  const outputPath = path.join(outputDir, 'tmdb_tv_shows.json');
  fs.writeFileSync(outputPath, JSON.stringify(allShows, null, 2));
  console.log(`Saved ${allShows.length} TV shows to ${outputPath}`);
}

main().catch(console.error);
