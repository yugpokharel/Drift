import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { classifyMood } from './services/classifier.js';
import { computeUserState } from './services/stateHeuristic.js';
import { getRecommendations } from './services/matcher.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({
  origin: '*', // Allow all origins for the MVP
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type']
}));

app.use(express.json());

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

// Endpoint 3: Match user-state to seed dataset recommendations
app.post('/api/recommendations', (req, res) => {
  const { userState } = req.body;

  if (!userState || 
      typeof userState.stressLevel !== 'number' || 
      typeof userState.calmLevel !== 'number' || 
      typeof userState.attentionCapacity !== 'number') {
    res.status(400).json({ 
      error: 'Field "userState" is required and must contain stressLevel, calmLevel, and attentionCapacity numbers.' 
    });
    return;
  }

  try {
    const recommendations = getRecommendations(userState);
    res.json(recommendations);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Error getting recommendations' });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'healthy', time: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`Drift Backend listening on port ${PORT}`);
});
