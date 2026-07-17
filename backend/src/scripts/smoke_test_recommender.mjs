#!/usr/bin/env node
/**
 * smoke_test_recommender.mjs
 *
 * Run this with: node --experimental-vm-modules smoke_test_recommender.mjs
 * or:            tsx src/scripts/smoke_test_recommender.ts
 *
 * Calls the hybrid recommender directly (no HTTP server needed) and prints
 * the top recommendation for three different mood profiles.
 */

import { getHybridRecommendation } from '../services/recommenderService.js';

const profiles = [
  {
    label: 'Exhausted, wants comfort',
    input: { moodLabel: 'sadness', attentionCapacity: 20, tone: 'comfort', context: 'alone' },
  },
  {
    label: 'High energy, wants action',
    input: { moodLabel: 'excitement', attentionCapacity: 85, tone: 'stimulation', context: 'focused' },
  },
  {
    label: 'Free text mood description',
    input: {
      moodText: "I'm feeling a bit stressed but want to escape into something imaginative and fun",
      attentionCapacity: 55,
    },
  },
];

console.log('='.repeat(60));
console.log('Drift Hybrid Recommender — Smoke Test');
console.log('='.repeat(60));

for (const profile of profiles) {
  console.log(`\n▸ Profile: ${profile.label}`);
  console.log(`  Input: ${JSON.stringify(profile.input)}`);

  const t0 = Date.now();
  try {
    const result = await getHybridRecommendation(undefined, profile.input);
    const elapsed = Date.now() - t0;

    if (!result) {
      console.log('  ⚠️  No result returned (assets may not be loaded)');
    } else {
      console.log(`  ✅ [${elapsed}ms] "${result.title}"`);
      console.log(`     Genres: ${result.genres.join(', ')}`);
      console.log(`     IMDb: ${result.imdbRating}  | RT: ${result.rottenTomatoes}`);
      console.log(`     Why: ${result.whyThisPick}`);
    }
  } catch (err) {
    console.error(`  ❌ Error: ${err.message}`);
  }
}

console.log('\n' + '='.repeat(60));
console.log('Smoke test complete.');
