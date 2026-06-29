import { ContentItem, seedData } from '../data/seedData.js';
import { UserState } from './stateHeuristic.js';

export function scoreItem(item: ContentItem, state: UserState): number {
  let score = 0;

  // 1. Stress Alignment
  if (state.stressLevel > 60) {
    // User is highly stressed; favor stress-reducing content, penalize stressful content
    if (item.stress === '-') score += 20;
    else if (item.stress === 'neutral') score += 5;
    else if (item.stress === '+') score -= 25; // severe penalty
  } else if (state.stressLevel < 35) {
    // User has low stress; can handle high-intensity stimulating content
    if (item.stress === '+') score += 15;
    else if (item.stress === 'neutral') score += 10;
    else if (item.stress === '-') score += 5;
  } else {
    // Medium stress; favor neutral stress content
    if (item.stress === 'neutral') score += 15;
    else score += 8;
  }

  // 2. Calm Alignment
  if (state.calmLevel < 35) {
    // User is low on calm (agitated/restless); favor calming content to soothe them
    if (item.calm === '+') score += 20;
    else if (item.calm === 'neutral') score += 5;
    else if (item.calm === '-') score -= 15;
  } else if (state.calmLevel > 65) {
    // User is highly calm; matches well with peaceful or neutral content
    if (item.calm === '+') score += 15;
    else if (item.calm === 'neutral') score += 12;
    else if (item.calm === '-') score += 2;
  } else {
    // Medium calm
    if (item.calm === 'neutral' || item.calm === '+') score += 15;
    else score += 5;
  }

  // 3. Attention Capacity Alignment
  if (state.attentionCapacity < 40) {
    // Low attention capacity; strictly avoid complex or heavy content
    if (item.attention === '-') score += 25;
    else if (item.attention === 'neutral') score += 5;
    else if (item.attention === '+') score -= 30; // heavy penalty
  } else if (state.attentionCapacity > 70) {
    // High attention capacity; favor complex/engaging content, slightly penalize brainless content
    if (item.attention === '+') score += 25;
    else if (item.attention === 'neutral') score += 8;
    else if (item.attention === '-') score -= 5;
  } else {
    // Medium attention capacity
    if (item.attention === 'neutral') score += 20;
    else score += 5;
  }

  return score;
}

export function getRecommendations(userState: UserState): {
  tv_show: ContentItem;
  music: ContentItem;
  movie: ContentItem;
} {
  // Score all items
  const scoredItems = seedData.map(item => ({
    item,
    score: scoreItem(item, userState)
  }));

  // Helper to extract top recommendation for a category with random tie-breaking
  const getTopForCategory = (category: 'tv_show' | 'movie' | 'music'): ContentItem => {
    const categoryScored = scoredItems.filter(si => si.item.category === category);
    
    // Sort descending by score
    categoryScored.sort((a, b) => b.score - a.score);

    if (categoryScored.length === 0) {
      throw new Error(`No seed data found for category: ${category}`);
    }

    const maxScore = categoryScored[0].score;
    const topScorers = categoryScored.filter(si => si.score === maxScore);

    // Pick one at random from the top scorers for variety
    const randomIndex = Math.floor(Math.random() * topScorers.length);
    return topScorers[randomIndex].item;
  };

  return {
    tv_show: getTopForCategory('tv_show'),
    movie: getTopForCategory('movie'),
    music: getTopForCategory('music')
  };
}
