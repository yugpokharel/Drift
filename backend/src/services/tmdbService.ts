/**
 * TMDB Service — fetches top-rated movies and TV shows filtered by mood-mapped genres.
 * API: The Movie Database (themoviedb.org) — free tier, no rate limit issues at this scale.
 *
 * Genre IDs (TMDB):
 *   Drama:18  Documentary:99  Animation:16  Comedy:35
 *   Adventure:12  Sci-Fi:878  Romance:10749  Family:10751
 *   Thriller:53  Horror:27   Music:10402   Mystery:9648
 */

import { UserState } from './stateHeuristic.js';

const TMDB_BASE = 'https://api.themoviedb.org/3';

const token = () => process.env.TMDB_API_READ_TOKEN ?? '';

// Minimum quality bar for recommendations
const MIN_VOTE_AVERAGE = 7.4;
const MIN_VOTE_COUNT_MOVIE = 500;
const MIN_VOTE_COUNT_TV = 200;

// Exclude genres never appropriate as recommendations
const ALWAYS_EXCLUDE_MOVIE = [27, 53]; // Horror, Thriller
const ALWAYS_EXCLUDE_TV = [27, 53];    // same

export interface TMDBMovie {
  title: string;
  overview: string;
  vote_average: number;
  genre_ids: number[];
  release_date?: string;
}

export interface TMDBShow {
  name: string;
  overview: string;
  vote_average: number;
  genre_ids: number[];
  first_air_date?: string;
}

/**
 * Maps the current UserState to a prioritised list of TMDB genre IDs for movies.
 */
function movieGenresForState(state: UserState): number[] {
  const isGrief = state.stressLevel > 65 && state.attentionCapacity < 30;
  if (isGrief)            return [18, 16, 10751];         // Drama, Animation, Family
  if (state.stressLevel > 60) return [99, 18, 16];        // Documentary, Drama, Animation
  if (state.attentionCapacity > 70) return [878, 9648, 18]; // Sci-Fi, Mystery, Drama
  if (state.attentionCapacity < 35) return [16, 10751, 35]; // Animation, Family, Comedy
  if (state.calmLevel > 70)  return [10749, 18, 35];      // Romance, Drama, Comedy
  return [18, 878, 12];                                    // Default: Drama, Sci-Fi, Adventure
}

/**
 * Maps the current UserState to a prioritised list of TMDB genre IDs for TV shows.
 */
function tvGenresForState(state: UserState): number[] {
  const isGrief = state.stressLevel > 65 && state.attentionCapacity < 30;
  if (isGrief)            return [99, 16, 10751];         // Documentary, Animation, Family
  if (state.stressLevel > 60) return [99, 18, 16];
  if (state.attentionCapacity > 70) return [9648, 18, 10765]; // Mystery, Drama, Sci-Fi & Fantasy
  if (state.attentionCapacity < 35) return [16, 35, 10751];
  if (state.calmLevel > 70)  return [18, 10766, 35];      // Drama, Soap, Comedy
  return [18, 99, 9648];                                   // Default: Drama, Documentary, Mystery
}

async function fetchTopMovies(genreIds: number[]): Promise<TMDBMovie | null> {
  const genres = genreIds.join(',');
  // Exclude horror/thriller
  const withoutGenres = ALWAYS_EXCLUDE_MOVIE.join(',');
  const url = `${TMDB_BASE}/discover/movie?sort_by=vote_average.desc` +
    `&vote_count.gte=${MIN_VOTE_COUNT_MOVIE}` +
    `&vote_average.gte=${MIN_VOTE_AVERAGE}` +
    `&with_genres=${genres}` +
    `&without_genres=${withoutGenres}` +
    `&page=1`;

  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token()}`,
      'Content-Type': 'application/json'
    }
  });

  if (!res.ok) {
    console.error('[TMDB] Movie fetch failed:', res.status);
    return null;
  }

  const data = await res.json() as { results: TMDBMovie[] };
  if (!data.results || data.results.length === 0) return null;

  // Pick randomly from top 10 for variety
  const pool = data.results.slice(0, 10);
  return pool[Math.floor(Math.random() * pool.length)];
}

async function fetchTopShow(genreIds: number[]): Promise<TMDBShow | null> {
  const genres = genreIds.join(',');
  const withoutGenres = ALWAYS_EXCLUDE_TV.join(',');
  const url = `${TMDB_BASE}/discover/tv?sort_by=vote_average.desc` +
    `&vote_count.gte=${MIN_VOTE_COUNT_TV}` +
    `&vote_average.gte=${MIN_VOTE_AVERAGE}` +
    `&with_genres=${genres}` +
    `&without_genres=${withoutGenres}` +
    `&page=1`;

  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token()}`,
      'Content-Type': 'application/json'
    }
  });

  if (!res.ok) {
    console.error('[TMDB] TV fetch failed:', res.status);
    return null;
  }

  const data = await res.json() as { results: TMDBShow[] };
  if (!data.results || data.results.length === 0) return null;

  const pool = data.results.slice(0, 10);
  return pool[Math.floor(Math.random() * pool.length)];
}

export async function fetchTMDBRecommendations(state: UserState): Promise<{
  movie: { title: string; extraInfo: string } | null;
  tv_show: { title: string; extraInfo: string } | null;
}> {
  const [movie, tvShow] = await Promise.all([
    fetchTopMovies(movieGenresForState(state)),
    fetchTopShow(tvGenresForState(state))
  ]);

  return {
    movie: movie
      ? { title: movie.title, extraInfo: movie.overview.slice(0, 160) + (movie.overview.length > 160 ? '…' : '') }
      : null,
    tv_show: tvShow
      ? { title: tvShow.name, extraInfo: tvShow.overview.slice(0, 160) + (tvShow.overview.length > 160 ? '…' : '') }
      : null
  };
}
