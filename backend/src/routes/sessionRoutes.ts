import { Router, Request, Response } from 'express';
import { Session } from '../models/Session.js';

const router = Router();

// POST /api/sessions — save a new session
router.post('/', async (req: Request, res: Response) => {
  const { stress, calm, attention, bucket, moodLabel, moodText, recommendations } = req.body;

  if (
    typeof stress !== 'number' ||
    typeof calm !== 'number' ||
    typeof attention !== 'number' ||
    !bucket || !moodLabel || !moodText
  ) {
    res.status(400).json({ error: 'Missing required fields: stress, calm, attention, bucket, moodLabel, moodText' });
    return;
  }

  try {
    const session = new Session({ stress, calm, attention, bucket, moodLabel, moodText, recommendations });
    await session.save();
    res.status(201).json({ id: session._id, createdAt: session.createdAt });
  } catch (err: any) {
    console.error('[Sessions POST]', err.message);
    res.status(500).json({ error: 'Failed to save session.' });
  }
});

// GET /api/sessions — retrieve all sessions (newest first, max 100)
router.get('/', async (_req: Request, res: Response) => {
  try {
    const sessions = await Session.find().sort({ createdAt: -1 }).limit(100).lean();
    res.json(sessions);
  } catch (err: any) {
    console.error('[Sessions GET]', err.message);
    res.status(500).json({ error: 'Failed to retrieve sessions.' });
  }
});

export default router;
