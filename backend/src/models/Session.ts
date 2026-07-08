import mongoose from 'mongoose';

const SessionSchema = new mongoose.Schema({
  stress:    { type: Number, required: true },
  calm:      { type: Number, required: true },
  attention: { type: Number, required: true },
  bucket:    { type: String, required: true },
  moodLabel: { type: String, required: true },
  moodText:  { type: String, required: true },
  recommendations: {
    tv:    { title: String, note: String },
    music: { title: String, note: String },
    movie: { title: String, note: String }
  },
  createdAt: { type: Date, default: Date.now }
});

export const Session = mongoose.model('Session', SessionSchema);
