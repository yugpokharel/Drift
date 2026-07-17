/**
 * generate_template_embeddings.ts
 *
 * Pre-computes one sentence embedding per (capacity × tone × context) triple
 * using the same model that produced movie embeddings (all-MiniLM-L6-v2).
 * Output: src/data/template_embeddings.json
 *
 * Run: npx tsx src/scripts/generate_template_embeddings.ts
 */

import { pipeline } from '@xenova/transformers';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// ─── 27 template sentences (capacity × tone × context) ───────────────────────
// Each sentence is a natural first-person statement about what the user
// wants to watch. Written independently of any specific movie.

const TEMPLATES: Record<string, string> = {
  // LOW capacity
  low_comfort_alone:      'something easy and comforting to watch alone',
  low_comfort_background: 'a gentle feel-good film playing softly in the background',
  low_comfort_focused:    'a short warm movie I can follow without much effort',
  low_stimulation_alone:      'a brief exciting film to watch by myself',
  low_stimulation_background: 'something fast-paced and lively to have on',
  low_stimulation_focused:    'a short action or thriller I can pay attention to',
  low_escapism_alone:      'something imaginative and easy to watch alone',
  low_escapism_background: 'a light adventure or fantasy movie in the background',
  low_escapism_focused:    'a short fantasy or sci-fi I can follow along',

  // MEDIUM capacity
  medium_comfort_alone:      'a heartwarming drama to enjoy by myself',
  medium_comfort_background: 'a pleasant feel-good film to have on',
  medium_comfort_focused:    'a comforting story I can properly sit and watch',
  medium_stimulation_alone:      'an engaging thriller or action film to watch solo',
  medium_stimulation_background: 'something energetic and entertaining playing in the background',
  medium_stimulation_focused:    'a gripping crime or suspense film to concentrate on',
  medium_escapism_alone:      'an adventure or fantasy film to watch on my own',
  medium_escapism_background: 'something colorful and imaginative to have on',
  medium_escapism_focused:    'an immersive sci-fi or fantasy world to properly explore',

  // HIGH capacity
  high_comfort_alone:      'a long emotional film to fully sink into alone',
  high_comfort_background: 'a slow romantic drama to have on while I relax',
  high_comfort_focused:    'a rich character-driven story I can fully concentrate on',
  high_stimulation_alone:      'an intense action-packed film to watch alone',
  high_stimulation_background: 'something high-energy and gripping to have on',
  high_stimulation_focused:    'a complex thriller I can fully engage with',
  high_escapism_alone:      'an epic adventure or science-fiction film to lose myself in',
  high_escapism_background: 'something grand and fantastical to have on in the background',
  high_escapism_focused:    'an immersive epic fantasy or sci-fi world to fully explore',
};

console.log('Loading sentence embedding model (Xenova/all-MiniLM-L6-v2)...');
const embedder = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
console.log('Model loaded.\n');

const result: Record<string, number[]> = {};

const entries = Object.entries(TEMPLATES);
for (let i = 0; i < entries.length; i++) {
  const [key, text] = entries[i];
  process.stdout.write(`[${i + 1}/${entries.length}] "${key}" ... `);
  const out = await embedder(text, { pooling: 'mean', normalize: true });
  result[key] = Array.from(out.data as Float32Array);
  console.log(`✓  (${result[key].length}-dim)`);
}

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outPath = path.resolve(__dirname, '../data/template_embeddings.json');
fs.writeFileSync(outPath, JSON.stringify(result));

console.log(`\n✅ Saved ${Object.keys(result).length} template embeddings → ${outPath}`);
