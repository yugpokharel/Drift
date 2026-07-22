/**
 * recommenderService.ts
 *
 * Loads the pre-computed hybrid recommender assets (CF candidates +
 * sentence embeddings + alpha) and exposes a single `getHybridRecommendation`
 * function that:
 *
 *   1. Retrieves top-50 CF candidates for a known userId (or falls back to
 *      the popularity list for anonymous users).
 *   2. Builds a mood-context query vector from the mood/context inputs.
 *   3. Re-ranks the candidates using:
 *        final_score = alpha * CF_score_norm + (1 - alpha) * cosine_similarity
 *   4. Returns the rank-1 movie with title, overview, a short "why" explanation,
 *      and optionally IMDb / RT scores from OMDb (rate-limited, graceful fallback).
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { pipeline } from '@xenova/transformers';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface MoodInput {
  /** Free-text description of how the user feels (e.g. "I'm exhausted and anxious") */
  moodText?: string;
  /**
   * Pre-classified mood label from the existing classifier.ts pipeline.
   * One of: sadness | joy | anger | fear | surprise | disgust | excitement | neutral
   */
  moodLabel?: string;
  /** 0–100, maps to capacity bucket: <35 = low, 35–65 = medium, >65 = high */
  attentionCapacity?: number;
  /** Desired tone chip: "comfort" | "stimulation" | "escapism" */
  tone?: string;
  /** Context chip: "alone" | "background" | "focused" */
  context?: string;
}

export interface HybridRecommendation {
  /** Internal item ID (MovieLens movieId mapped to a TV show) */
  movieId: number;
  title: string;
  overview: string;
  genres: string[];
  imdbRating: string;
  rottenTomatoes: string;
  whyThisPick: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

/**
 * All TV show genres used in the feature vector (must match evaluate_hybrid_v2.py and generate_embeddings.ts).
 * These are the MovieLens genre labels that were mapped to TV show content via the TMDB TV show cache.
 */
const ALL_GENRES = [
  'Action & Adventure', 'Animation', 'Comedy', 'Crime', 'Documentary',
  'Drama', 'Family', 'Kids', 'Mystery', 'Reality',
  'Sci-Fi & Fantasy', 'Soap', 'War & Politics', 'Western',
  // Legacy MovieLens genres (some still appear in mapped data)
  'Action', 'Adventure', 'Thriller', 'Romance',
];
const GENRE_TO_IDX = Object.fromEntries(ALL_GENRES.map((g, i) => [g, i]));

// ─── Asset loading ────────────────────────────────────────────────────────────

interface MovieFeature {
  movieId: number;
  title: string;
  genres: string[];
  runtime: number;
  overview: string;
  keywords: string[];
  embedding: number[];
  releaseDate: string;
}

interface CandidateEntry {
  movieId: number;
  score: number;
}

interface RecommenderAssets {
  alpha: number;
  genres: string[];
  movie_features: Record<string, MovieFeature>;
  candidates: Record<string, CandidateEntry[]>;
  popularity_fallback: CandidateEntry[];
  user_to_idx: Record<string, number>;
  movie_to_idx: Record<string, number>;
  user_factors_path?: string;
  item_factors_path?: string;
}

let assets: RecommenderAssets | null = null;
let userFactors: Float32Array | null = null;
let itemFactors: Float32Array | null = null;
/** Pre-built combined feature vectors keyed by movieId */
const movieVectors: Map<number, Float32Array> = new Map();

function loadNpy(filePath: string): Float32Array {
  const buf = fs.readFileSync(filePath);
  const major = buf.readUInt8(6);
  let headerLen = 0;
  let dataOffset = 0;
  if (major === 1) {
    headerLen = buf.readUInt16LE(8);
    dataOffset = 10 + headerLen;
  } else if (major === 2) {
    headerLen = buf.readUInt32LE(8);
    dataOffset = 12 + headerLen;
  } else {
    throw new Error(`Unsupported Npy version: ${major}`);
  }
  const floatBuf = buf.subarray(dataOffset);
  const arrayBuf = new ArrayBuffer(floatBuf.length);
  new Uint8Array(arrayBuf).set(floatBuf);
  return new Float32Array(arrayBuf);
}

function loadAssets() {
  if (assets) return;

  // Resolve asset file regardless of whether running in dev (tsx from src/)
  // or production (node from dist/). Walk up candidate paths.
  const __filename = fileURLToPath(import.meta.url);
  const __dirname  = path.dirname(__filename);

  const candidates = [
    path.resolve(__dirname, '../data/recommender_assets.json'),        // dev: src/data/
    path.resolve(__dirname, '../../data/recommender_assets.json'),     // prod: dist/data/ (if copied)
    path.resolve(__dirname, '../../src/data/recommender_assets.json'), // prod fallback to src
  ];

  const assetPath = candidates.find(p => fs.existsSync(p));

  if (!assetPath) {
    console.warn('[Recommender] recommender_assets.json not found — hybrid mode disabled.');
    return;
  }

  try {
    const raw = fs.readFileSync(assetPath, 'utf-8');
    assets = JSON.parse(raw) as RecommenderAssets;
    console.log(
      `[Recommender] Loaded assets: alpha=${assets.alpha}, ` +
      `${Object.keys(assets.movie_features).length} movies, ` +
      `${Object.keys(assets.candidates).length} user candidate lists.`
    );

    // Load ALS factors if available
    if (assets.user_factors_path && assets.item_factors_path) {
      const baseDir = path.dirname(assetPath);
      const uPath = path.resolve(baseDir, path.basename(assets.user_factors_path));
      const iPath = path.resolve(baseDir, path.basename(assets.item_factors_path));
      if (fs.existsSync(uPath) && fs.existsSync(iPath)) {
        try {
          userFactors = loadNpy(uPath);
          itemFactors = loadNpy(iPath);
          console.log(`[Recommender] Loaded ALS factors: userFactors (${userFactors.length / 128}x128), itemFactors (${itemFactors.length / 128}x128)`);
        } catch (factorErr: any) {
          console.warn('[Recommender] Failed to parse ALS factors, using candidates fallback:', factorErr.message);
        }
      } else {
        console.warn(`[Recommender] ALS factor files not found at ${uPath} or ${iPath}`);
      }
    }

    // Pre-build movie vectors: [genre_one_hot(18), runtime_norm(1), embedding(384)]
    for (const [midStr, feats] of Object.entries(assets.movie_features)) {
      const mid = parseInt(midStr);
      const vec = buildMovieVector(feats);
      movieVectors.set(mid, vec);
    }
    console.log(`[Recommender] Pre-built ${movieVectors.size} movie feature vectors.`);
  } catch (err: any) {
    console.error('[Recommender] Failed to load assets:', err.message);
  }

}

// ─── Vector helpers ───────────────────────────────────────────────────────────

function buildMovieVector(feats: MovieFeature): Float32Array {
  const dim = ALL_GENRES.length + 1 + 384; // 18 + 1 + 384 = 403
  const vec = new Float32Array(dim);

  // Genre one-hot
  for (const g of feats.genres) {
    const idx = GENRE_TO_IDX[g];
    if (idx !== undefined) vec[idx] = 1.0;
  }

  // Normalised runtime (scaled down by 0.2 to match training)
  const norm_runtime = Math.min(feats.runtime, 200) / 200.0;
  vec[ALL_GENRES.length] = norm_runtime * 0.2;

  // Sentence embedding
  const emb = feats.embedding;
  for (let i = 0; i < Math.min(emb.length, 384); i++) {
    vec[ALL_GENRES.length + 1 + i] = emb[i];
  }

  return vec;
}

function cosine(a: Float32Array, b: Float32Array): number {
  let dot = 0, na = 0, nb = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  if (na === 0 || nb === 0) return 0;
  return dot / (Math.sqrt(na) * Math.sqrt(nb));
}

// ─── Query vector construction ────────────────────────────────────────────────

/**
 * Builds the 403-dim query vector from mood inputs.
 * Uses @xenova/transformers to embed the free-text mood description.
 */
let embedder: any = null;

async function getEmbedder() {
  if (!embedder) {
    embedder = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
  }
  return embedder;
}

async function buildQueryVector(mood: MoodInput): Promise<Float32Array> {
  const dim = ALL_GENRES.length + 1 + 384;
  const vec = new Float32Array(dim);

  // 1. Capacity bucket → runtime preference
  let capacity: 'low' | 'medium' | 'high';
  if (mood.attentionCapacity !== undefined) {
    capacity = mood.attentionCapacity < 35 ? 'low' : mood.attentionCapacity > 65 ? 'high' : 'medium';
  } else {
    // Derive from mood label
    const label = mood.moodLabel ?? 'neutral';
    capacity = ['sadness', 'fear', 'exhaustion'].includes(label) ? 'low' :
               ['joy', 'excitement'].includes(label) ? 'high' : 'medium';
  }

  // 2. Tone → genre preference weights
  const tone = mood.tone ?? deriveTone(mood.moodLabel);
  const genreWeights = genreWeightsForTone(tone);
  for (let i = 0; i < ALL_GENRES.length; i++) vec[i] = genreWeights[i];

  // 3. Context-based boosts
  const context = mood.context ?? 'alone';
  applyContextBoosts(vec, context);

  // Normalize genre part
  let gNorm = 0;
  for (let i = 0; i < ALL_GENRES.length; i++) gNorm += vec[i] * vec[i];
  gNorm = Math.sqrt(gNorm);
  if (gNorm > 0) {
    for (let i = 0; i < ALL_GENRES.length; i++) vec[i] /= gNorm;
  }

  // 4. Runtime preference
  const runtimePref = capacity === 'low' ? 0.2 : capacity === 'medium' ? 0.5 : 0.9;
  vec[ALL_GENRES.length] = runtimePref * 0.2;

  // 5. Text embedding from mood text or synthesised label text
  const textToEmbed = mood.moodText
    ? mood.moodText
    : `I'm feeling ${mood.moodLabel ?? 'okay'}. I want ${tone} content.`;

  try {
    const model = await getEmbedder();
    const out = await model(textToEmbed, { pooling: 'mean', normalize: true });
    const embArr: number[] = Array.from(out.data);
    for (let i = 0; i < Math.min(embArr.length, 384); i++) {
      vec[ALL_GENRES.length + 1 + i] = embArr[i];
    }
  } catch (err: any) {
    console.warn('[Recommender] Embedding failed, using zero text component:', err.message);
  }

  return vec;
}

function deriveTone(label?: string): string {
  if (!label) return 'comfort';
  if (['anger', 'fear', 'excitement'].includes(label)) return 'stimulation';
  if (['joy', 'surprise'].includes(label)) return 'escapism';
  return 'comfort'; // sadness, neutral, disgust → comfort
}

function genreWeightsForTone(tone: string): number[] {
  const w = new Array(ALL_GENRES.length).fill(0);
  if (tone === 'comfort') {
    for (const g of ['Comedy', 'Children', 'Animation', 'Romance', 'Musical']) {
      if (GENRE_TO_IDX[g] !== undefined) w[GENRE_TO_IDX[g]] = 1.0;
    }
  } else if (tone === 'stimulation') {
    for (const g of ['Action', 'Thriller', 'Crime', 'Sci-Fi']) {
      if (GENRE_TO_IDX[g] !== undefined) w[GENRE_TO_IDX[g]] = 1.0;
    }
  } else { // escapism
    for (const g of ['Adventure', 'Fantasy', 'Sci-Fi', 'Animation']) {
      if (GENRE_TO_IDX[g] !== undefined) w[GENRE_TO_IDX[g]] = 1.0;
    }
  }
  return w;
}

function applyContextBoosts(vec: Float32Array, context: string) {
  if (context === 'background') {
    for (const g of ['Comedy', 'Animation']) {
      if (GENRE_TO_IDX[g] !== undefined) vec[GENRE_TO_IDX[g]] += 0.5;
    }
  } else if (context === 'focused') {
    for (const g of ['Drama', 'Mystery', 'Crime', 'Documentary']) {
      if (GENRE_TO_IDX[g] !== undefined) vec[GENRE_TO_IDX[g]] += 1.0;
    }
  } else { // alone
    for (const g of ['Drama', 'Romance']) {
      if (GENRE_TO_IDX[g] !== undefined) vec[GENRE_TO_IDX[g]] += 0.5;
    }
  }
}

/**
 * Look up IMDb rating + Rotten Tomatoes score from OMDb using title + year.
 * The OMDb API accepts ?t=<title>&y=<year> which avoids needing an IMDb ID.
 * Falls back to 'N/A' on any error (OMDB_API_KEY env var must be set).
 */
async function fetchOMDbDetails(
  title: string,
  releaseDate: string,
): Promise<{ imdbRating: string; rottenTomatoes: string }> {
  const apiKey = process.env.OMDB_API_KEY;
  if (!apiKey) return { imdbRating: 'N/A', rottenTomatoes: 'N/A' };

  // Extract year from MovieLens title format "Movie Name (YYYY)" or from releaseDate
  const yearFromTitle = title.match(/\((\d{4})\)$/);
  const year = yearFromTitle ? yearFromTitle[1]
    : releaseDate ? releaseDate.slice(0, 4)
    : '';

  // Strip the year suffix from the title before querying
  const cleanTitle = title.replace(/\s*\(\d{4}\)$/, '').trim();

  try {
    const params = new URLSearchParams({ t: cleanTitle, apikey: apiKey });
    if (year) params.set('y', year);
    const url = `https://www.omdbapi.com/?${params.toString()}`;
    const res = await fetch(url, { signal: AbortSignal.timeout(4000) });
    if (!res.ok) return { imdbRating: 'N/A', rottenTomatoes: 'N/A' };

    const data: any = await res.json();
    if (data.Response === 'False') return { imdbRating: 'N/A', rottenTomatoes: 'N/A' };

    const imdbRating = data.imdbRating ?? 'N/A';
    const rt = (data.Ratings ?? []).find((r: any) => r.Source === 'Rotten Tomatoes');
    return { imdbRating, rottenTomatoes: rt?.Value ?? 'N/A' };
  } catch {
    return { imdbRating: 'N/A', rottenTomatoes: 'N/A' };
  }
}


// ─── Why-this-pick explanation ────────────────────────────────────────────────

function buildExplanation(movie: MovieFeature, mood: MoodInput, alpha: number): string {
  const tone = mood.tone ?? deriveTone(mood.moodLabel);
  const capacity = mood.attentionCapacity !== undefined
    ? (mood.attentionCapacity < 35 ? 'low' : mood.attentionCapacity > 65 ? 'high' : 'medium')
    : 'medium';

  const genreStr = movie.genres.slice(0, 3).join(', ');
  const runtimeNote = movie.runtime < 30
    ? 'bite-sized episodes for easy watching'
    : movie.runtime > 55
      ? 'longer episodes for deep immersion'
      : 'standard episode length for a comfortable session';

  const toneNote = tone === 'comfort'
    ? 'matches your need for something warm and reassuring'
    : tone === 'stimulation'
      ? 'provides the stimulation and pace you\'re looking for'
      : 'offers the imaginative escape your mood calls for';

  return `"${movie.title}" (${genreStr}) was selected because it ${toneNote}. ` +
    `With ${runtimeNote} and strong collaborative filtering signals, ` +
    `it scores highest when your attention capacity is ${capacity}.`;
}

// ─── Main export ──────────────────────────────────────────────────────────────

/**
 * Returns a single hybrid movie recommendation for the given user and mood.
 *
 * @param userId  Optional numeric userId (from MovieLens). If not provided or
 *                not in the candidate list, the popularity fallback is used.
 * @param mood    Mood/context input from the real-time frontend.
 */
export async function getHybridRecommendation(
  userId: number | undefined,
  mood: MoodInput,
): Promise<HybridRecommendation | null> {
  loadAssets();
  if (!assets) return null;

  // 1. Get CF candidate list
  const candidateList: CandidateEntry[] =
    (userId !== undefined && assets.candidates[String(userId)]?.length)
      ? assets.candidates[String(userId)]
      : assets.popularity_fallback;

  if (!candidateList.length) return null;

  // 2. Build mood query vector
  const queryVec = await buildQueryVector(mood);

  // 3. Compute CF scores using factors if available, or fall back to candidate list precomputed scores
  const cfScores = new Map<number, number>();
  let hasFactors = false;
  if (userFactors && itemFactors && userId !== undefined) {
    const uIdx = assets.user_to_idx[String(userId)];
    if (uIdx !== undefined) {
      const uOffset = uIdx * 128;
      const uVec = userFactors.subarray(uOffset, uOffset + 128);
      hasFactors = true;
      for (const c of candidateList) {
        const mIdx = assets.movie_to_idx[String(c.movieId)];
        if (mIdx !== undefined) {
          const mOffset = mIdx * 128;
          const mVec = itemFactors.subarray(mOffset, mOffset + 128);
          let dot = 0;
          for (let i = 0; i < 128; i++) dot += uVec[i] * mVec[i];
          cfScores.set(c.movieId, dot);
        } else {
          cfScores.set(c.movieId, 0.0);
        }
      }
    }
  }

  if (!hasFactors) {
    for (const c of candidateList) {
      cfScores.set(c.movieId, c.score);
    }
  }

  const scores = Array.from(cfScores.values());
  const minS = Math.min(...scores);
  const maxS = Math.max(...scores);
  const range = maxS - minS || 1;

  // 4. Score each candidate
  const alpha = assets.alpha;
  const ranked: Array<{ mid: number; finalScore: number }> = candidateList.map(c => {
    const cfRawScore = cfScores.get(c.movieId) ?? 0.0;
    const cfNorm = (cfRawScore - minS) / range;
    const movieVec = movieVectors.get(c.movieId);
    const moodSim = movieVec ? cosine(queryVec, movieVec) : 0;
    const finalScore = alpha * cfNorm + (1 - alpha) * moodSim;
    return { mid: c.movieId, finalScore };
  });

  ranked.sort((a, b) => b.finalScore - a.finalScore);

  // 5. Find first candidate with full feature data
  let topFeature: MovieFeature | undefined;
  let topMid = 0;
  for (const r of ranked) {
    const feats = assets.movie_features[String(r.mid)];
    if (feats) {
      topFeature = feats;
      topMid = r.mid;
      break;
    }
  }

  if (!topFeature) return null;

  // 6. OMDb enrichment (best-effort, non-blocking — gracefully returns N/A if key absent)
  const { imdbRating, rottenTomatoes } = await fetchOMDbDetails(
    topFeature.title,
    topFeature.releaseDate,
  );


  // 7. Build response
  return {
    movieId: topMid,
    title: topFeature.title,
    overview: topFeature.overview,
    genres: topFeature.genres,
    imdbRating,
    rottenTomatoes,
    whyThisPick: buildExplanation(topFeature, mood, alpha),
  };
}
