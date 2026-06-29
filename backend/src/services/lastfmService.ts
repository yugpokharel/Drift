/**
 * Last.fm Service — fetches top tracks by mood-mapped tags.
 * API: Last.fm (last.fm/api) — free, no OAuth required.
 *
 * Mood tag strategy:
 *   grief/sadness  → ambient, sad, melancholy, beautiful
 *   stress/fear    → chill, relaxing, ambient, calm
 *   joy/excitement → happy, uplifting, feel-good
 *   anger          → energetic, powerful, intense
 *   neutral        → chill, indie, alternative
 *   high attention → jazz, progressive, classical, complex
 */

import { UserState } from './stateHeuristic.js';

const LASTFM_BASE = 'https://ws.audioscrobbler.com/2.0';
const apiKey = () => process.env.LASTFM_API_KEY ?? '';

interface LastFMTrack {
  name: string;
  artist: { name: string } | string;
  url?: string;
}

/**
 * Maps UserState to a Last.fm mood tag to query.
 */
function moodTagForState(state: UserState): string {
  const isGrief = state.stressLevel > 65 && state.attentionCapacity < 30;

  if (isGrief) {
    const griefTags = ['ambient', 'beautiful', 'melancholy', 'sad'];
    return griefTags[Math.floor(Math.random() * griefTags.length)];
  }

  if (state.stressLevel > 65) {
    const calmTags = ['chill', 'relaxing', 'ambient', 'calm'];
    return calmTags[Math.floor(Math.random() * calmTags.length)];
  }

  if (state.calmLevel > 75 && state.attentionCapacity > 65) {
    const engagedTags = ['jazz', 'progressive rock', 'classical', 'post-rock'];
    return engagedTags[Math.floor(Math.random() * engagedTags.length)];
  }

  if (state.stressLevel < 30 && state.calmLevel > 65) {
    const happyTags = ['happy', 'uplifting', 'feel good', 'summer'];
    return happyTags[Math.floor(Math.random() * happyTags.length)];
  }

  if (state.stressLevel > 55) {
    // Stressed but not grief — might want to vent or relax
    const ventTags = ['energetic', 'indie', 'alternative'];
    return ventTags[Math.floor(Math.random() * ventTags.length)];
  }

  const defaultTags = ['chill', 'indie', 'alternative', 'acoustic'];
  return defaultTags[Math.floor(Math.random() * defaultTags.length)];
}

export async function fetchLastFMTrack(state: UserState): Promise<{
  title: string;
  extraInfo: string;
} | null> {
  const tag = moodTagForState(state);
  const url = `${LASTFM_BASE}/?method=tag.gettoptracks&tag=${encodeURIComponent(tag)}&api_key=${apiKey()}&format=json&limit=50`;

  try {
    const res = await fetch(url);
    if (!res.ok) {
      console.error('[LastFM] Fetch failed:', res.status);
      return null;
    }

    const data = await res.json() as { tracks?: { track?: LastFMTrack[] } };
    const tracks = data?.tracks?.track;
    if (!tracks || tracks.length === 0) return null;

    // Pick randomly from top 20 for variety
    const pool = tracks.slice(0, 20);
    const pick = pool[Math.floor(Math.random() * pool.length)];

    const artistName = typeof pick.artist === 'string' ? pick.artist : pick.artist?.name ?? 'Unknown Artist';

    return {
      title: pick.name,
      extraInfo: `${artistName} — Top track in the "${tag}" mood category on Last.fm.`
    };
  } catch (err) {
    console.error('[LastFM] Error:', err);
    return null;
  }
}
