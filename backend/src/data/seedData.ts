export interface ContentItem {
  id: string;
  title: string;
  category: 'tv_show' | 'movie' | 'music';
  extraInfo: string; // Artist, Director, or show details
  stress: '-' | 'neutral' | '+';
  calm: '-' | 'neutral' | '+';
  attention: '-' | 'neutral' | '+';
}

export const seedData: ContentItem[] = [
  // === TV SHOWS ===
  {
    id: 'tv-1',
    title: 'Ted Lasso',
    category: 'tv_show',
    extraInfo: 'A wholesome comedy about an optimistic football coach.',
    stress: '-',
    calm: '+',
    attention: 'neutral'
  },
  {
    id: 'tv-2',
    title: 'Black Mirror',
    category: 'tv_show',
    extraInfo: 'An intense, dark sci-fi anthology series exploring techno-paranoia.',
    stress: '+',
    calm: '-',
    attention: '+'
  },
  {
    id: 'tv-3',
    title: 'The Office',
    category: 'tv_show',
    extraInfo: 'A comfort mockumentary about everyday office workers.',
    stress: '-',
    calm: '+',
    attention: '-'
  },
  {
    id: 'tv-4',
    title: 'Succession',
    category: 'tv_show',
    extraInfo: 'A highly stressful, dramatic satire about a dysfunctional media empire.',
    stress: '+',
    calm: '-',
    attention: '+'
  },
  {
    id: 'tv-5',
    title: 'Friends',
    category: 'tv_show',
    extraInfo: 'A light, nostalgic sitcom following six friends in New York.',
    stress: '-',
    calm: '+',
    attention: '-'
  },
  {
    id: 'tv-6',
    title: 'Our Planet',
    category: 'tv_show',
    extraInfo: 'A stunningly beautiful, relaxing nature documentary series.',
    stress: '-',
    calm: '+',
    attention: 'neutral'
  },
  {
    id: 'tv-7',
    title: 'Breaking Bad',
    category: 'tv_show',
    extraInfo: 'A thrilling, suspenseful drama about a teacher-turned-drug-lord.',
    stress: '+',
    calm: '-',
    attention: '+'
  },
  {
    id: 'tv-8',
    title: 'Bob\'s Burgers',
    category: 'tv_show',
    extraInfo: 'A gentle, hilarious animated sitcom about a loving family.',
    stress: '-',
    calm: '+',
    attention: '-'
  },
  {
    id: 'tv-9',
    title: 'Stranger Things',
    category: 'tv_show',
    extraInfo: 'A suspenseful, supernatural adventure set in the 1980s.',
    stress: 'neutral',
    calm: 'neutral',
    attention: '+'
  },
  {
    id: 'tv-10',
    title: 'Chef\'s Table',
    category: 'tv_show',
    extraInfo: 'An inspiring, beautiful look into the world\'s greatest culinary artists.',
    stress: '-',
    calm: '+',
    attention: 'neutral'
  },
  {
    id: 'tv-11',
    title: 'The Great British Bake Off',
    category: 'tv_show',
    extraInfo: 'The ultimate comforting, low-stakes baking competition.',
    stress: '-',
    calm: '+',
    attention: '-'
  },
  {
    id: 'tv-12',
    title: 'Sherlock',
    category: 'tv_show',
    extraInfo: 'An intellectually engaging, modern adaptation of the detective mysteries.',
    stress: 'neutral',
    calm: 'neutral',
    attention: '+'
  },
  {
    id: 'tv-13',
    title: 'Planet Earth II',
    category: 'tv_show',
    extraInfo: 'Immersive nature footage with soothing narration by David Attenborough.',
    stress: '-',
    calm: '+',
    attention: '-'
  },
  {
    id: 'tv-14',
    title: 'Euphoria',
    category: 'tv_show',
    extraInfo: 'A visually stunning but intensely stressful teen drama.',
    stress: '+',
    calm: '-',
    attention: '+'
  },
  {
    id: 'tv-15',
    title: 'Brooklyn Nine-Nine',
    category: 'tv_show',
    extraInfo: 'A fast-paced, lighthearted police procedural comedy.',
    stress: '-',
    calm: 'neutral',
    attention: '-'
  },

  // === MOVIES ===
  {
    id: 'movie-1',
    title: 'My Neighbor Totoro',
    category: 'movie',
    extraInfo: 'A wholesome, calming, and magical Studio Ghibli masterpiece.',
    stress: '-',
    calm: '+',
    attention: '-'
  },
  {
    id: 'movie-2',
    title: 'Inception',
    category: 'movie',
    extraInfo: 'Christopher Nolan\'s mind-bending, high-attention dream heist.',
    stress: '+',
    calm: '-',
    attention: '+'
  },
  {
    id: 'movie-3',
    title: 'Spirited Away',
    category: 'movie',
    extraInfo: 'An enchanting, visually rich fantasy adventure.',
    stress: '-',
    calm: '+',
    attention: 'neutral'
  },
  {
    id: 'movie-4',
    title: 'Whiplash',
    category: 'movie',
    extraInfo: 'An incredibly tense, high-stress psychological drama about obsession.',
    stress: '+',
    calm: '-',
    attention: '+'
  },
  {
    id: 'movie-5',
    title: 'The Grand Budapest Hotel',
    category: 'movie',
    extraInfo: 'Wes Anderson\'s whimsical, symmetrically styled, quirky adventure.',
    stress: '-',
    calm: 'neutral',
    attention: 'neutral'
  },
  {
    id: 'movie-6',
    title: 'Interstellar',
    category: 'movie',
    extraInfo: 'An epic, grand-scale sci-fi adventure requiring high attention.',
    stress: 'neutral',
    calm: 'neutral',
    attention: '+'
  },
  {
    id: 'movie-7',
    title: 'A Quiet Place',
    category: 'movie',
    extraInfo: 'A suspenseful, silent horror film where sounds trigger monsters.',
    stress: '+',
    calm: '-',
    attention: 'neutral'
  },
  {
    id: 'movie-8',
    title: 'Amélie',
    category: 'movie',
    extraInfo: 'A charming, upbeat French romantic comedy with a warm aesthetic.',
    stress: '-',
    calm: '+',
    attention: 'neutral'
  },
  {
    id: 'movie-9',
    title: 'Pulp Fiction',
    category: 'movie',
    extraInfo: 'Tarantino\'s dialogue-heavy, stylish, and violent crime anthology.',
    stress: '+',
    calm: '-',
    attention: '+'
  },
  {
    id: 'movie-10',
    title: 'Superbad',
    category: 'movie',
    extraInfo: 'A hilarious, easy-watching teen comedy about high schoolers.',
    stress: '-',
    calm: 'neutral',
    attention: '-'
  },
  {
    id: 'movie-11',
    title: 'Paddington 2',
    category: 'movie',
    extraInfo: 'A heartwarming, pure, and delightfully comforting family movie.',
    stress: '-',
    calm: '+',
    attention: '-'
  },
  {
    id: 'movie-12',
    title: 'Shutter Island',
    category: 'movie',
    extraInfo: 'A highly dark, suspenseful, and stressful psychological thriller.',
    stress: '+',
    calm: '-',
    attention: '+'
  },
  {
    id: 'movie-13',
    title: 'The Matrix',
    category: 'movie',
    extraInfo: 'A groundbreaking, fast-paced action sci-fi film.',
    stress: 'neutral',
    calm: '-',
    attention: '+'
  },
  {
    id: 'movie-14',
    title: 'Wall-E',
    category: 'movie',
    extraInfo: 'A beautiful, quiet, and emotional Pixar film about a lonely robot.',
    stress: '-',
    calm: '+',
    attention: '-'
  },
  {
    id: 'movie-15',
    title: 'Midsommar',
    category: 'movie',
    extraInfo: 'An deeply unsettling, high-stress psychological folk horror film.',
    stress: '+',
    calm: '-',
    attention: '+'
  },

  // === MUSIC ===
  {
    id: 'music-1',
    title: 'Weightless',
    category: 'music',
    extraInfo: 'Marconi Union - Ambient track scientifically designed to calm anxiety.',
    stress: '-',
    calm: '+',
    attention: '-'
  },
  {
    id: 'music-2',
    title: 'Clair de Lune',
    category: 'music',
    extraInfo: 'Claude Debussy - Beautiful, soothing classical solo piano piece.',
    stress: '-',
    calm: '+',
    attention: '-'
  },
  {
    id: 'music-3',
    title: 'Lofi Hip Hop Radio',
    category: 'music',
    extraInfo: 'ChilledCow / Lofi Girl - Relaxing beats perfect for study or stress relief.',
    stress: '-',
    calm: '+',
    attention: '-'
  },
  {
    id: 'music-4',
    title: 'Breathe (In The Air)',
    category: 'music',
    extraInfo: 'Pink Floyd - Deeply atmospheric, chill progressive rock track.',
    stress: '-',
    calm: '+',
    attention: 'neutral'
  },
  {
    id: 'music-5',
    title: 'Doom Eternal OST (The Only Thing They Fear is You)',
    category: 'music',
    extraInfo: 'Mick Gordon - Aggressive, high-stress metal/industrial synth soundtrack.',
    stress: '+',
    calm: '-',
    attention: 'neutral'
  },
  {
    id: 'music-6',
    title: 'Strobe',
    category: 'music',
    extraInfo: 'deadmau5 - An epic, slow-building progressive electronic anthem.',
    stress: '-',
    calm: 'neutral',
    attention: 'neutral'
  },
  {
    id: 'music-7',
    title: 'Gymnopédie No.1',
    category: 'music',
    extraInfo: 'Erik Satie - Minimalist, melancholic, and deeply calming classical piano.',
    stress: '-',
    calm: '+',
    attention: '-'
  },
  {
    id: 'music-8',
    title: 'Blinding Lights',
    category: 'music',
    extraInfo: 'The Weeknd - High-energy, nostalgic 80s synth-pop hit.',
    stress: 'neutral',
    calm: 'neutral',
    attention: '-'
  },
  {
    id: 'music-9',
    title: 'Rhapsody in Blue',
    category: 'music',
    extraInfo: 'George Gershwin - Dynamic, complex, and dramatic jazz-orchestral fusion.',
    stress: 'neutral',
    calm: 'neutral',
    attention: '+'
  },
  {
    id: 'music-10',
    title: 'Spitfire',
    category: 'music',
    extraInfo: 'The Prodigy - A high-intensity, chaotic big beat electronic track.',
    stress: '+',
    calm: '-',
    attention: '-'
  },
  {
    id: 'music-11',
    title: 'Get Lucky',
    category: 'music',
    extraInfo: 'Daft Punk ft. Pharrell - Infectious, groove-filled uplifting disco-funk.',
    stress: '-',
    calm: 'neutral',
    attention: '-'
  },
  {
    id: 'music-12',
    title: 'Teardrop',
    category: 'music',
    extraInfo: 'Massive Attack - A mesmerizing, atmospheric trip-hop classic.',
    stress: '-',
    calm: '+',
    attention: 'neutral'
  },
  {
    id: 'music-13',
    title: 'So What',
    category: 'music',
    extraInfo: 'Miles Davis - Elegant, smooth, and relaxing modal jazz classic.',
    stress: '-',
    calm: '+',
    attention: 'neutral'
  },
  {
    id: 'music-14',
    title: 'Chop Suey!',
    category: 'music',
    extraInfo: 'System of a Down - Energetic, chaotic, and loud alternative metal.',
    stress: '+',
    calm: '-',
    attention: '-'
  },
  {
    id: 'music-15',
    title: 'Bohemian Rhapsody',
    category: 'music',
    extraInfo: 'Queen - Legendary progressive rock anthem with complex operatic shifts.',
    stress: 'neutral',
    calm: 'neutral',
    attention: '+'
  }
];
