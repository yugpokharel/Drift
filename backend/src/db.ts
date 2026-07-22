import mongoose from 'mongoose';

/**
 * Connects to MongoDB. Returns true on success, false if the URI is missing
 * or is still the placeholder value. Throws only on genuine connection errors
 * from a properly-formatted URI, so the server can start without MongoDB when
 * it hasn't been configured yet.
 */
export async function connectDB(): Promise<boolean> {
  const uri = process.env.MONGODB_URI;

  // Not configured or still a template placeholder — skip gracefully
  if (!uri || uri.includes('<username>') || uri.includes('<cluster>') || uri.includes('<password>')) {
    console.warn('[DB] MONGODB_URI not configured — session persistence disabled. Set a real Atlas URI in backend/.env to enable it.');
    return false;
  }

  try {
    await mongoose.connect(uri);
    console.log('[DB] MongoDB connected');
    return true;
  } catch (err: any) {
    console.error('[DB] MongoDB connection failed:', err.message);
    return false;
  }
}
