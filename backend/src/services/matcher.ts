import { ContentItem, seedData } from '../data/seedData.js';
import { UserState } from './stateHeuristic.js';

export function scoreItem(item: ContentItem, state: UserState): number {
  let score = 0;

  // ─── Detect grief profile ─────────────────────────────────────────────────
  // High stress + very low attention = grief / heavy emotional distress state.
  // In this case, context (tags) overrides the generic stress/calm/attention math.
  const isGriefProfile = state.stressLevel > 65 && state.attentionCapacity < 30;

  if (isGriefProfile) {
    // Grief profile: only content explicitly tagged 'grief-safe' is appropriate.
    if (item.tags.includes('grief-safe')) score += 60;
    // Comedy during grief is tone-deaf — heavy penalty.
    if (item.tags.includes('comedy')) score -= 50;
    // Dark/thriller content adds to emotional load — penalise.
    if (item.tags.includes('dark') || item.tags.includes('thriller')) score -= 40;
    // Gentle/cathartic tags get extra boosts.
    if (item.tags.includes('melancholic')) score += 15;
    if (item.tags.includes('ambient')) score += 15;
    if (item.tags.includes('nature')) score += 10;
    if (item.tags.includes('mindless')) score += 10;
    // Early return — tag score dominates for grief.
    return score;
  }

  // ─── Standard scoring (stress / calm / attention matrix) ─────────────────

  // 1. Stress alignment
  if (state.stressLevel > 60) {
    if (item.stress === '-') score += 20;
    else if (item.stress === 'neutral') score += 5;
    else if (item.stress === '+') score -= 25;
  } else if (state.stressLevel < 35) {
    if (item.stress === '+') score += 15;
    else if (item.stress === 'neutral') score += 10;
    else if (item.stress === '-') score += 5;
  } else {
    if (item.stress === 'neutral') score += 15;
    else score += 8;
  }

  // 2. Calm alignment
  if (state.calmLevel < 35) {
    if (item.calm === '+') score += 20;
    else if (item.calm === 'neutral') score += 5;
    else if (item.calm === '-') score -= 15;
  } else if (state.calmLevel > 65) {
    if (item.calm === '+') score += 15;
    else if (item.calm === 'neutral') score += 12;
    else if (item.calm === '-') score += 2;
  } else {
    if (item.calm === 'neutral' || item.calm === '+') score += 15;
    else score += 5;
  }

  // 3. Attention capacity alignment
  if (state.attentionCapacity < 40) {
    if (item.attention === '-') score += 25;
    else if (item.attention === 'neutral') score += 5;
    else if (item.attention === '+') score -= 30;
  } else if (state.attentionCapacity > 70) {
    if (item.attention === '+') score += 25;
    else if (item.attention === 'neutral') score += 8;
    else if (item.attention === '-') score -= 5;
  } else {
    if (item.attention === 'neutral') score += 20;
    else score += 5;
  }

  // 4. Tag bonuses (contextual boosts on top of the matrix)
  if (state.stressLevel > 60 && item.tags.includes('comedy')) score -= 10;
  if (state.stressLevel > 70 && item.tags.includes('dark')) score -= 15;
  if (state.attentionCapacity < 35 && item.tags.includes('mindless')) score += 10;
  if (state.attentionCapacity > 65 && item.tags.includes('engaging')) score += 10;
  if (state.calmLevel > 70 && item.tags.includes('uplifting')) score += 8;

  return score;
}

export function getRecommendations(userState: UserState): {
  tv_show: ContentItem;
  music: ContentItem;
  movie: ContentItem;
} {
  const scoredItems = seedData.map(item => ({
    item,
    score: scoreItem(item, userState)
  }));

  const getTopForCategory = (category: 'tv_show' | 'movie' | 'music'): ContentItem => {
    const categoryScored = scoredItems
      .filter(si => si.item.category === category)
      .sort((a, b) => b.score - a.score);

    if (categoryScored.length === 0) {
      throw new Error(`No seed data found for category: ${category}`);
    }

    // Among top scorers, pick randomly for variety
    const maxScore = categoryScored[0].score;
    const topScorers = categoryScored.filter(si => si.score === maxScore);
    return topScorers[Math.floor(Math.random() * topScorers.length)].item;
  };

  return {
    tv_show: getTopForCategory('tv_show'),
    movie: getTopForCategory('movie'),
    music: getTopForCategory('music')
  };
}
