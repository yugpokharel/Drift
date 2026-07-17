import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { classifyMood } from './services/classifier.js';
import { computeUserState } from './services/stateHeuristic.js';
import { getRecommendations } from './services/matcher.js';
import { fetchTMDBRecommendations } from './services/tmdbService.js';
import { fetchLastFMTrack } from './services/lastfmService.js';
import { connectDB } from './db.js';
import sessionRouter from './routes/sessionRoutes.js';
import { getHybridRecommendation } from './services/recommenderService.js';


dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type']
}));

app.use(express.json());

// Session persistence routes
app.use('/api/sessions', sessionRouter);

// Logging middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// Endpoint 1: Classify mood from free-text
app.post('/api/mood', async (req, res) => {
  const { text } = req.body;
  if (typeof text !== 'string') {
    res.status(400).json({ error: 'Field "text" is required and must be a string.' });
    return;
  }

  try {
    const result = await classifyMood(text);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Error classifying mood' });
  }
});

// Endpoint 2: Compute user-state from mood, available time, energy level, and hour
app.post('/api/state', (req, res) => {
  const { mood, timeAvailable, energyLevel, hour } = req.body;

  if (!mood || !timeAvailable || !energyLevel) {
    res.status(400).json({ 
      error: 'Fields "mood", "timeAvailable", and "energyLevel" are required.' 
    });
    return;
  }

  const parsedHour = typeof hour === 'number' ? hour : new Date().getHours();

  try {
    const userState = computeUserState(mood, timeAvailable, energyLevel, parsedHour);
    res.json(userState);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Error computing user state' });
  }
});

// Endpoint 3: Match user-state to live TMDB + Last.fm recommendations (seed-data fallback)
// The movie slot is additionally enriched by the hybrid ALS + sentence-embedding recommender.
app.post('/api/recommendations', async (req, res) => {
  const { userState, moodText, moodLabel } = req.body;

  if (!userState ||
      typeof userState.stressLevel !== 'number' ||
      typeof userState.calmLevel !== 'number' ||
      typeof userState.attentionCapacity !== 'number') {
    res.status(400).json({
      error: 'Field "userState" is required and must contain stressLevel, calmLevel, and attentionCapacity numbers.'
    });
    return;
  }

  // Derive tone/context from userState for the hybrid recommender
  const hybridTone = userState.stressLevel > 60 ? 'comfort'
    : userState.attentionCapacity > 65 ? 'stimulation'
    : 'escapism';
  const hybridContext = userState.attentionCapacity < 35 ? 'background'
    : userState.attentionCapacity > 65 ? 'focused'
    : 'alone';

  try {
    // Fire all data sources in parallel
    const [liveMedia, liveMusic, hybridResult] = await Promise.allSettled([
      fetchTMDBRecommendations(userState),
      fetchLastFMTrack(userState),
      getHybridRecommendation(undefined, {
        moodText,
        moodLabel,
        attentionCapacity: userState.attentionCapacity,
        tone: hybridTone,
        context: hybridContext,
      }),
    ]);

    // Seed-data fallback for any category that fails
    const seedFallback = getRecommendations(userState);

    const tmdbResult = liveMedia.status === 'fulfilled' ? liveMedia.value : null;
    const lastfmResult = liveMusic.status === 'fulfilled' ? liveMusic.value : null;
    const hybrid = hybridResult.status === 'fulfilled' ? hybridResult.value : null;

    // Movie: hybrid (ALS + mood) > TMDB > seed fallback
    let movie: any;
    if (hybrid) {
      movie = {
        ...seedFallback.movie,
        title: hybrid.title,
        extraInfo: hybrid.overview,
        genres: hybrid.genres,
        imdbRating: hybrid.imdbRating,
        rottenTomatoes: hybrid.rottenTomatoes,
        whyThisPick: hybrid.whyThisPick,
      };
    } else if (tmdbResult?.movie) {
      movie = { ...seedFallback.movie, title: tmdbResult.movie.title, extraInfo: tmdbResult.movie.extraInfo };
    } else {
      movie = seedFallback.movie;
    }

    const tv_show = (tmdbResult?.tv_show)
      ? { ...seedFallback.tv_show, title: tmdbResult.tv_show.title, extraInfo: tmdbResult.tv_show.extraInfo }
      : seedFallback.tv_show;

    const music = lastfmResult
      ? { ...seedFallback.music, title: lastfmResult.title, extraInfo: lastfmResult.extraInfo }
      : seedFallback.music;

    console.log(`[Recommendations] Hybrid: ${hybrid ? 'live' : 'fallback'} | TMDB: ${tmdbResult ? 'live' : 'fallback'} | LastFM: ${lastfmResult ? 'live' : 'fallback'}`);
    res.json({ movie, tv_show, music });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Error getting recommendations' });

  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'healthy', time: new Date().toISOString() });
});

/**
 * Endpoint 4: Hybrid movie recommendation
 * POST /api/recommend
 *
 * Body:
 *   userId?          – numeric MovieLens userId (optional; uses popularity fallback if absent)
 *   moodText?        – raw free-text mood description
 *   moodLabel?       – pre-classified label from /api/mood (sadness|joy|anger|fear|...)
 *   attentionCapacity? – 0–100 slider value
 *   tone?            – "comfort" | "stimulation" | "escapism"
 *   context?         – "alone" | "background" | "focused"
 *
 * Returns one movie with title, overview, genres, IMDb/RT ratings, and a
 * natural-language "why this pick" explanation.
 */
app.post('/api/recommend', async (req, res) => {
  const { userId, moodText, moodLabel, attentionCapacity, tone, context } = req.body;

  try {
    const result = await getHybridRecommendation(
      typeof userId === 'number' ? userId : undefined,
      { moodText, moodLabel, attentionCapacity, tone, context },
    );

    if (!result) {
      res.status(503).json({ error: 'Hybrid recommender assets not available. Run the training pipeline first.' });
      return;
    }

    res.json(result);
  } catch (error: any) {
    console.error('[/api/recommend]', error.message);
    res.status(500).json({ error: error.message || 'Hybrid recommendation failed.' });
  }
});


// Connect to MongoDB then start server
(async () => {
  try {
    await connectDB();
    app.listen(PORT, () => {
      console.log(`Drift Backend listening on port ${PORT}`);
    });
  } catch (err: any) {
    console.error('[Startup] Failed to connect to MongoDB:', err.message);
    process.exit(1);
  }
})();
