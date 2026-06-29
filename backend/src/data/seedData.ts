export interface ContentItem {
  id: string;
  title: string;
  category: 'tv_show' | 'movie' | 'music';
  extraInfo: string;
  stress: '-' | 'neutral' | '+';
  calm: '-' | 'neutral' | '+';
  attention: '-' | 'neutral' | '+';
  // Tags for contextual filtering:
  // 'grief-safe'  — appropriate for loss/bereavement (gentle, not comedic)
  // 'comedy'      — primarily comedic; penalised during grief
  // 'dark'        — disturbing/intense; penalised during grief + high stress
  // 'nostalgic'   — warm familiarity
  // 'nature'      — nature/travel; restorative
  // 'uplifting'   — emotionally hopeful
  // 'engaging'    — requires active cognitive attention
  // 'mindless'    — low cognitive demand, passive
  // 'melancholic' — sad-but-beautiful, cathartic
  // 'ambient'     — background/atmospheric
  // 'energizing'  — high energy, good for low mood needing a boost
  tags: string[];
}

// Curated content database.
// Sources: IMDB Top 250, Letterboxd, Spotify Editorial, Rolling Stone 500, Rotten Tomatoes.
export const seedData: ContentItem[] = [

  // ================================================================
  // TV SHOWS (30 items)
  // ================================================================
  { id: 'tv-1', title: 'Ted Lasso', category: 'tv_show',
    extraInfo: 'Apple TV+ — A wholesome comedy about an optimistic American football coach.',
    stress: '-', calm: '+', attention: 'neutral', tags: ['uplifting', 'comedy', 'nostalgic'] },

  { id: 'tv-2', title: 'Black Mirror', category: 'tv_show',
    extraInfo: 'Netflix — Dark sci-fi anthology exploring techno-paranoia.',
    stress: '+', calm: '-', attention: '+', tags: ['dark', 'engaging', 'thriller'] },

  { id: 'tv-3', title: 'The Office (US)', category: 'tv_show',
    extraInfo: 'NBC — Comfort mockumentary about everyday office workers.',
    stress: '-', calm: '+', attention: '-', tags: ['comedy', 'nostalgic', 'mindless'] },

  { id: 'tv-4', title: 'Succession', category: 'tv_show',
    extraInfo: 'HBO — Stressful satire about a dysfunctional media empire.',
    stress: '+', calm: '-', attention: '+', tags: ['dark', 'engaging', 'thriller'] },

  { id: 'tv-5', title: 'Friends', category: 'tv_show',
    extraInfo: 'NBC — Light nostalgic sitcom about six friends in New York.',
    stress: '-', calm: '+', attention: '-', tags: ['comedy', 'nostalgic', 'mindless'] },

  { id: 'tv-6', title: 'Our Planet', category: 'tv_show',
    extraInfo: 'Netflix — Stunning nature documentary narrated by Sir David Attenborough.',
    stress: '-', calm: '+', attention: 'neutral', tags: ['grief-safe', 'nature', 'uplifting'] },

  { id: 'tv-7', title: 'Breaking Bad', category: 'tv_show',
    extraInfo: 'AMC — Thrilling drama about a teacher-turned-drug-lord. IMDB #1 TV show.',
    stress: '+', calm: '-', attention: '+', tags: ['dark', 'engaging', 'thriller'] },

  { id: 'tv-8', title: "Bob's Burgers", category: 'tv_show',
    extraInfo: 'Fox — Gentle, hilarious animated sitcom about a loving family.',
    stress: '-', calm: '+', attention: '-', tags: ['comedy', 'mindless', 'uplifting'] },

  { id: 'tv-9', title: 'Stranger Things', category: 'tv_show',
    extraInfo: 'Netflix — Supernatural adventure set in 1980s Indiana.',
    stress: 'neutral', calm: 'neutral', attention: '+', tags: ['engaging', 'nostalgic', 'thriller'] },

  { id: 'tv-10', title: "Chef's Table", category: 'tv_show',
    extraInfo: "Netflix — Cinematic portrait of the world's greatest culinary artists.",
    stress: '-', calm: '+', attention: 'neutral', tags: ['grief-safe', 'uplifting', 'nature'] },

  { id: 'tv-11', title: 'The Great British Bake Off', category: 'tv_show',
    extraInfo: 'Channel 4 — The ultimate comforting, low-stakes baking competition.',
    stress: '-', calm: '+', attention: '-', tags: ['grief-safe', 'mindless', 'comedy', 'uplifting'] },

  { id: 'tv-12', title: 'Sherlock', category: 'tv_show',
    extraInfo: 'BBC — Intellectually engaging modern take on the detective classics.',
    stress: 'neutral', calm: 'neutral', attention: '+', tags: ['engaging', 'thriller'] },

  { id: 'tv-13', title: 'Planet Earth II', category: 'tv_show',
    extraInfo: 'BBC — Immersive nature footage with soothing David Attenborough narration.',
    stress: '-', calm: '+', attention: '-', tags: ['grief-safe', 'nature', 'mindless'] },

  { id: 'tv-14', title: 'Euphoria', category: 'tv_show',
    extraInfo: 'HBO — Visually stunning but intensely stressful teen drama.',
    stress: '+', calm: '-', attention: '+', tags: ['dark', 'engaging', 'melancholic'] },

  { id: 'tv-15', title: 'Brooklyn Nine-Nine', category: 'tv_show',
    extraInfo: 'NBC — Lighthearted police procedural comedy.',
    stress: '-', calm: 'neutral', attention: '-', tags: ['comedy', 'uplifting', 'mindless'] },

  { id: 'tv-16', title: "Schitt's Creek", category: 'tv_show',
    extraInfo: 'CBC/Netflix — A warm-hearted comedy about a wealthy family who loses everything.',
    stress: '-', calm: '+', attention: '-', tags: ['comedy', 'uplifting', 'nostalgic'] },

  { id: 'tv-17', title: 'Bluey', category: 'tv_show',
    extraInfo: 'ABC Kids/Disney+ — Deeply warm Australian animated series about a puppy family.',
    stress: '-', calm: '+', attention: '-', tags: ['grief-safe', 'uplifting', 'mindless'] },

  { id: 'tv-18', title: 'Fleabag', category: 'tv_show',
    extraInfo: 'BBC/Amazon — Sharp, darkly comedic and deeply emotional. Phoebe Waller-Bridge.',
    stress: 'neutral', calm: '-', attention: '+', tags: ['dark', 'melancholic', 'comedy', 'engaging'] },

  { id: 'tv-19', title: 'Abstract: The Art of Design', category: 'tv_show',
    extraInfo: 'Netflix — Beautifully made documentary profiling the world\'s most influential designers.',
    stress: '-', calm: '+', attention: 'neutral', tags: ['grief-safe', 'uplifting', 'nature'] },

  { id: 'tv-20', title: 'Avatar: The Last Airbender', category: 'tv_show',
    extraInfo: 'Nickelodeon — Masterful animated epic about a young boy saving the world.',
    stress: 'neutral', calm: 'neutral', attention: '+', tags: ['uplifting', 'engaging', 'nostalgic'] },

  { id: 'tv-21', title: 'Nailed It!', category: 'tv_show',
    extraInfo: 'Netflix — Joyful chaos as amateur bakers spectacularly fail to recreate cakes.',
    stress: '-', calm: 'neutral', attention: '-', tags: ['comedy', 'mindless', 'uplifting'] },

  { id: 'tv-22', title: 'Downton Abbey', category: 'tv_show',
    extraInfo: 'ITV/PBS — Sweeping period drama about a British aristocratic family.',
    stress: 'neutral', calm: '+', attention: 'neutral', tags: ['nostalgic', 'grief-safe', 'engaging'] },

  { id: 'tv-23', title: 'Peaky Blinders', category: 'tv_show',
    extraInfo: 'BBC — Stylish, intense gangster drama set in 1920s Birmingham.',
    stress: '+', calm: '-', attention: '+', tags: ['dark', 'engaging', 'thriller'] },

  { id: 'tv-24', title: 'Mindhunter', category: 'tv_show',
    extraInfo: 'Netflix — FBI agents profile serial killers. Deeply unsettling procedural.',
    stress: '+', calm: '-', attention: '+', tags: ['dark', 'engaging', 'thriller'] },

  { id: 'tv-25', title: 'Gravity Falls', category: 'tv_show',
    extraInfo: 'Disney — Charming, witty animated mystery about twins in a strange Oregon town.',
    stress: '-', calm: 'neutral', attention: 'neutral', tags: ['uplifting', 'comedy', 'nostalgic'] },

  { id: 'tv-26', title: 'The Bear', category: 'tv_show',
    extraInfo: 'FX/Hulu — Intensely stressful, critically acclaimed kitchen drama.',
    stress: '+', calm: '-', attention: '+', tags: ['dark', 'engaging', 'thriller'] },

  { id: 'tv-27', title: 'Narcos', category: 'tv_show',
    extraInfo: 'Netflix — Gripping crime drama about the rise of the Medellín cocaine cartel.',
    stress: '+', calm: '-', attention: '+', tags: ['dark', 'engaging', 'thriller'] },

  { id: 'tv-28', title: 'One Day at a Time (2017)', category: 'tv_show',
    extraInfo: 'Netflix — Heartfelt comedy-drama about a Cuban-American family.',
    stress: '-', calm: '+', attention: '-', tags: ['uplifting', 'comedy', 'grief-safe'] },

  { id: 'tv-29', title: 'Cosmos: A Spacetime Odyssey', category: 'tv_show',
    extraInfo: 'Nat Geo — Neil deGrasse Tyson\'s awe-inspiring journey through the universe.',
    stress: '-', calm: '+', attention: 'neutral', tags: ['grief-safe', 'uplifting', 'nature'] },

  { id: 'tv-30', title: 'Seinfeld', category: 'tv_show',
    extraInfo: 'NBC — The legendary show about nothing. Timeless observational comedy.',
    stress: '-', calm: 'neutral', attention: '-', tags: ['comedy', 'nostalgic', 'mindless'] },

  // ================================================================
  // MOVIES (30 items)
  // ================================================================
  { id: 'movie-1', title: 'My Neighbor Totoro', category: 'movie',
    extraInfo: 'Studio Ghibli — Wholesome, calming, magical masterpiece.',
    stress: '-', calm: '+', attention: '-', tags: ['grief-safe', 'uplifting', 'nostalgic'] },

  { id: 'movie-2', title: 'Inception', category: 'movie',
    extraInfo: 'Christopher Nolan — Mind-bending dream heist. IMDB Top 10.',
    stress: '+', calm: '-', attention: '+', tags: ['engaging', 'thriller', 'dark'] },

  { id: 'movie-3', title: 'Spirited Away', category: 'movie',
    extraInfo: 'Studio Ghibli — Enchanting fantasy adventure. IMDB #1 animated film.',
    stress: '-', calm: '+', attention: 'neutral', tags: ['grief-safe', 'uplifting', 'nostalgic'] },

  { id: 'movie-4', title: 'Whiplash', category: 'movie',
    extraInfo: 'Damien Chazelle — Tense psychological drama about obsession and drumming.',
    stress: '+', calm: '-', attention: '+', tags: ['dark', 'engaging', 'thriller'] },

  { id: 'movie-5', title: 'The Grand Budapest Hotel', category: 'movie',
    extraInfo: 'Wes Anderson — Whimsical, symmetrically styled quirky adventure.',
    stress: '-', calm: 'neutral', attention: 'neutral', tags: ['comedy', 'nostalgic', 'uplifting'] },

  { id: 'movie-6', title: 'Interstellar', category: 'movie',
    extraInfo: 'Christopher Nolan — Epic grand-scale sci-fi. IMDB Top 25.',
    stress: 'neutral', calm: 'neutral', attention: '+', tags: ['engaging', 'melancholic', 'uplifting'] },

  { id: 'movie-7', title: 'A Quiet Place', category: 'movie',
    extraInfo: 'John Krasinski — Suspenseful silent horror film.',
    stress: '+', calm: '-', attention: 'neutral', tags: ['dark', 'thriller', 'engaging'] },

  { id: 'movie-8', title: 'Amélie', category: 'movie',
    extraInfo: 'Jean-Pierre Jeunet — Charming French romantic comedy with warm aesthetic.',
    stress: '-', calm: '+', attention: 'neutral', tags: ['uplifting', 'nostalgic', 'grief-safe'] },

  { id: 'movie-9', title: 'Pulp Fiction', category: 'movie',
    extraInfo: "Quentin Tarantino — Dialogue-heavy, stylish, violent crime anthology.",
    stress: '+', calm: '-', attention: '+', tags: ['dark', 'engaging', 'thriller'] },

  { id: 'movie-10', title: 'Superbad', category: 'movie',
    extraInfo: 'Greg Mottola — Hilarious easy-watching teen comedy.',
    stress: '-', calm: 'neutral', attention: '-', tags: ['comedy', 'nostalgic', 'mindless'] },

  { id: 'movie-11', title: 'Paddington 2', category: 'movie',
    extraInfo: 'Paul King — Heartwarming, pure, and delightfully comforting family film.',
    stress: '-', calm: '+', attention: '-', tags: ['grief-safe', 'uplifting', 'mindless'] },

  { id: 'movie-12', title: 'Shutter Island', category: 'movie',
    extraInfo: 'Martin Scorsese — Dark, suspenseful psychological thriller.',
    stress: '+', calm: '-', attention: '+', tags: ['dark', 'thriller', 'engaging'] },

  { id: 'movie-13', title: 'The Matrix', category: 'movie',
    extraInfo: 'The Wachowskis — Groundbreaking action sci-fi. IMDB Top 50.',
    stress: 'neutral', calm: '-', attention: '+', tags: ['engaging', 'thriller'] },

  { id: 'movie-14', title: 'Wall-E', category: 'movie',
    extraInfo: 'Pixar — Beautiful, quiet, emotional story of a lonely robot.',
    stress: '-', calm: '+', attention: '-', tags: ['grief-safe', 'uplifting', 'mindless'] },

  { id: 'movie-15', title: 'Midsommar', category: 'movie',
    extraInfo: 'Ari Aster — Deeply unsettling folk horror in broad daylight.',
    stress: '+', calm: '-', attention: '+', tags: ['dark', 'thriller', 'engaging'] },

  { id: 'movie-16', title: 'Good Will Hunting', category: 'movie',
    extraInfo: 'Gus Van Sant — Moving drama about a troubled genius and his therapist.',
    stress: 'neutral', calm: '+', attention: 'neutral', tags: ['grief-safe', 'melancholic', 'uplifting'] },

  { id: 'movie-17', title: 'Coco', category: 'movie',
    extraInfo: 'Pixar — Visually stunning, emotionally profound film about family, memory, and loss.',
    stress: '-', calm: '+', attention: 'neutral', tags: ['grief-safe', 'uplifting', 'melancholic'] },

  { id: 'movie-18', title: 'Inside Out', category: 'movie',
    extraInfo: 'Pixar — Brilliant exploration of human emotions during a major life change.',
    stress: 'neutral', calm: 'neutral', attention: 'neutral', tags: ['grief-safe', 'uplifting', 'melancholic'] },

  { id: 'movie-19', title: 'The Secret Life of Walter Mitty', category: 'movie',
    extraInfo: 'Ben Stiller — Breathtaking, gently uplifting adventure about discovering life.',
    stress: '-', calm: '+', attention: 'neutral', tags: ['grief-safe', 'uplifting', 'nature'] },

  { id: 'movie-20', title: 'About Time', category: 'movie',
    extraInfo: 'Richard Curtis — Tender, life-affirming drama about a man who can time travel.',
    stress: '-', calm: '+', attention: 'neutral', tags: ['grief-safe', 'uplifting', 'melancholic'] },

  { id: 'movie-21', title: 'Little Miss Sunshine', category: 'movie',
    extraInfo: 'Dayton/Faris — Warm, quirky road-trip comedy-drama about a dysfunctional family.',
    stress: '-', calm: 'neutral', attention: 'neutral', tags: ['uplifting', 'comedy', 'nostalgic'] },

  { id: 'movie-22', title: 'Everything Everywhere All at Once', category: 'movie',
    extraInfo: 'Daniels — Chaotic multiverse action with a deeply emotional core.',
    stress: '+', calm: '-', attention: '+', tags: ['engaging', 'dark', 'uplifting'] },

  { id: 'movie-23', title: 'Parasite', category: 'movie',
    extraInfo: "Bong Joon-ho — Tense, darkly funny class-warfare thriller. Palme d'Or winner.",
    stress: '+', calm: '-', attention: '+', tags: ['dark', 'thriller', 'engaging'] },

  { id: 'movie-24', title: 'Lion', category: 'movie',
    extraInfo: 'Garth Davis — True story of an Indian boy adopted in Australia tracing his roots.',
    stress: 'neutral', calm: 'neutral', attention: 'neutral', tags: ['grief-safe', 'melancholic', 'uplifting'] },

  { id: 'movie-25', title: "Castle in the Sky", category: 'movie',
    extraInfo: 'Studio Ghibli — Light, adventurous animated fantasy about a floating city.',
    stress: '-', calm: 'neutral', attention: '-', tags: ['uplifting', 'nostalgic', 'mindless'] },

  { id: 'movie-26', title: 'The Shawshank Redemption', category: 'movie',
    extraInfo: 'Frank Darabont — Timeless story of hope and perseverance. IMDB #1 film.',
    stress: 'neutral', calm: '+', attention: 'neutral', tags: ['grief-safe', 'uplifting', 'engaging'] },

  { id: 'movie-27', title: 'Forrest Gump', category: 'movie',
    extraInfo: 'Robert Zemeckis — Beloved gentle journey through American history. IMDB Top 20.',
    stress: '-', calm: '+', attention: 'neutral', tags: ['grief-safe', 'uplifting', 'nostalgic'] },

  { id: 'movie-28', title: 'Chef', category: 'movie',
    extraInfo: 'Jon Favreau — Warm film about a chef rediscovering his passion via a food truck.',
    stress: '-', calm: '+', attention: '-', tags: ['grief-safe', 'uplifting', 'mindless'] },

  { id: 'movie-29', title: "Howl's Moving Castle", category: 'movie',
    extraInfo: 'Studio Ghibli — Gentle, dreamlike fantasy romance about transformation.',
    stress: '-', calm: '+', attention: 'neutral', tags: ['grief-safe', 'uplifting', 'nostalgic'] },

  { id: 'movie-30', title: 'Good Boy (Druk / Another Round)', category: 'movie',
    extraInfo: 'Thomas Vinterberg — Four teachers experiment with maintaining a constant blood alcohol level. Raw and human.',
    stress: 'neutral', calm: 'neutral', attention: '+', tags: ['melancholic', 'engaging', 'dark'] },

  // ================================================================
  // MUSIC (30 items)
  // ================================================================
  { id: 'music-1', title: 'Weightless', category: 'music',
    extraInfo: 'Marconi Union — Ambient track scientifically proven to reduce anxiety by 65%.',
    stress: '-', calm: '+', attention: '-', tags: ['grief-safe', 'ambient', 'mindless'] },

  { id: 'music-2', title: 'Clair de Lune', category: 'music',
    extraInfo: 'Claude Debussy — Beautiful, soothing classical solo piano.',
    stress: '-', calm: '+', attention: '-', tags: ['grief-safe', 'ambient', 'melancholic'] },

  { id: 'music-3', title: 'Lofi Hip Hop Radio', category: 'music',
    extraInfo: 'Lofi Girl — Relaxing beats for studying or unwinding.',
    stress: '-', calm: '+', attention: '-', tags: ['grief-safe', 'ambient', 'mindless'] },

  { id: 'music-4', title: 'Breathe (In The Air)', category: 'music',
    extraInfo: 'Pink Floyd — Deeply atmospheric chill progressive rock.',
    stress: '-', calm: '+', attention: 'neutral', tags: ['grief-safe', 'ambient', 'melancholic'] },

  { id: 'music-5', title: 'The Only Thing They Fear is You', category: 'music',
    extraInfo: 'Mick Gordon (DOOM Eternal OST) — Aggressive industrial metal for venting frustration.',
    stress: '+', calm: '-', attention: 'neutral', tags: ['energizing', 'dark'] },

  { id: 'music-6', title: 'Strobe', category: 'music',
    extraInfo: 'deadmau5 — Epic, slow-building progressive electronic anthem.',
    stress: '-', calm: 'neutral', attention: 'neutral', tags: ['ambient', 'uplifting'] },

  { id: 'music-7', title: 'Gymnopédie No. 1', category: 'music',
    extraInfo: 'Erik Satie — Minimalist, melancholic, deeply calming classical piano.',
    stress: '-', calm: '+', attention: '-', tags: ['grief-safe', 'ambient', 'melancholic'] },

  { id: 'music-8', title: 'Blinding Lights', category: 'music',
    extraInfo: 'The Weeknd — High-energy nostalgic 80s synth-pop hit.',
    stress: 'neutral', calm: 'neutral', attention: '-', tags: ['energizing', 'nostalgic'] },

  { id: 'music-9', title: 'Rhapsody in Blue', category: 'music',
    extraInfo: 'George Gershwin — Dynamic, complex jazz-orchestral fusion.',
    stress: 'neutral', calm: 'neutral', attention: '+', tags: ['engaging', 'uplifting'] },

  { id: 'music-10', title: 'Spitfire', category: 'music',
    extraInfo: 'The Prodigy — High-intensity chaotic big-beat electronic track.',
    stress: '+', calm: '-', attention: '-', tags: ['energizing', 'dark'] },

  { id: 'music-11', title: 'Get Lucky', category: 'music',
    extraInfo: 'Daft Punk ft. Pharrell — Infectious, groove-filled uplifting disco-funk.',
    stress: '-', calm: 'neutral', attention: '-', tags: ['uplifting', 'energizing'] },

  { id: 'music-12', title: 'Teardrop', category: 'music',
    extraInfo: 'Massive Attack — Mesmerising, atmospheric trip-hop classic.',
    stress: '-', calm: '+', attention: 'neutral', tags: ['grief-safe', 'ambient', 'melancholic'] },

  { id: 'music-13', title: 'So What', category: 'music',
    extraInfo: 'Miles Davis — Elegant, smooth, relaxing modal jazz classic.',
    stress: '-', calm: '+', attention: 'neutral', tags: ['grief-safe', 'ambient'] },

  { id: 'music-14', title: 'Chop Suey!', category: 'music',
    extraInfo: 'System of a Down — Energetic, chaotic alternative metal.',
    stress: '+', calm: '-', attention: '-', tags: ['energizing', 'dark'] },

  { id: 'music-15', title: 'Bohemian Rhapsody', category: 'music',
    extraInfo: 'Queen — Legendary progressive rock anthem with complex operatic shifts.',
    stress: 'neutral', calm: 'neutral', attention: '+', tags: ['uplifting', 'nostalgic', 'engaging'] },

  { id: 'music-16', title: 'Fix You', category: 'music',
    extraInfo: 'Coldplay — A gentle, cathartic anthem for processing grief and loss.',
    stress: '-', calm: '+', attention: '-', tags: ['grief-safe', 'melancholic', 'uplifting'] },

  { id: 'music-17', title: 'Holocene', category: 'music',
    extraInfo: 'Bon Iver — Sparse, atmospheric indie folk. Makes you feel small and peaceful.',
    stress: '-', calm: '+', attention: '-', tags: ['grief-safe', 'melancholic', 'ambient'] },

  { id: 'music-18', title: 'The Sound of Silence', category: 'music',
    extraInfo: 'Simon & Garfunkel — Timeless, quiet folk about loneliness and reflection.',
    stress: '-', calm: '+', attention: 'neutral', tags: ['grief-safe', 'melancholic', 'nostalgic'] },

  { id: 'music-19', title: 'Nuvole Bianche', category: 'music',
    extraInfo: 'Ludovico Einaudi — Sweeping emotional solo piano for quiet moments.',
    stress: '-', calm: '+', attention: '-', tags: ['grief-safe', 'ambient', 'melancholic'] },

  { id: 'music-20', title: 'River', category: 'music',
    extraInfo: 'Joni Mitchell — Melancholic, tender folk classic about loss and longing.',
    stress: '-', calm: '+', attention: 'neutral', tags: ['grief-safe', 'melancholic', 'nostalgic'] },

  { id: 'music-21', title: 'Here Comes the Sun', category: 'music',
    extraInfo: 'The Beatles — Warm, hopeful song written after a long difficult winter.',
    stress: '-', calm: '+', attention: '-', tags: ['grief-safe', 'uplifting', 'nostalgic'] },

  { id: 'music-22', title: 'Ambient 1: Music for Airports', category: 'music',
    extraInfo: 'Brian Eno — The founding album of ambient music. Designed to defocus the mind.',
    stress: '-', calm: '+', attention: '-', tags: ['grief-safe', 'ambient', 'mindless'] },

  { id: 'music-23', title: 'Pink Moon', category: 'music',
    extraInfo: 'Nick Drake — Spare, intimate, heartbreakingly beautiful folk album.',
    stress: '-', calm: '+', attention: 'neutral', tags: ['grief-safe', 'melancholic', 'ambient'] },

  { id: 'music-24', title: 'Mad World', category: 'music',
    extraInfo: 'Gary Jules — Painfully tender cover that turns sadness into something beautiful.',
    stress: '-', calm: 'neutral', attention: '-', tags: ['grief-safe', 'melancholic'] },

  { id: 'music-25', title: 'Float On', category: 'music',
    extraInfo: "Modest Mouse — Gently optimistic indie rock. It'll all be okay.",
    stress: '-', calm: '+', attention: '-', tags: ['uplifting', 'grief-safe', 'nostalgic'] },

  { id: 'music-26', title: 'Experience', category: 'music',
    extraInfo: 'Ludovico Einaudi — Sweeping cinematic piano inviting quiet reflection.',
    stress: '-', calm: '+', attention: 'neutral', tags: ['grief-safe', 'ambient', 'melancholic'] },

  { id: 'music-27', title: 'Afrika', category: 'music',
    extraInfo: 'Khruangbin — Mellow, hypnotic bass-heavy psych-soul from Houston.',
    stress: '-', calm: '+', attention: '-', tags: ['grief-safe', 'ambient', 'mindless'] },

  { id: 'music-28', title: 'The Night Will Always Win', category: 'music',
    extraInfo: 'Manchester Orchestra — Raw, cathartic post-rock for sitting with heavy feelings.',
    stress: 'neutral', calm: 'neutral', attention: 'neutral', tags: ['grief-safe', 'melancholic'] },

  { id: 'music-29', title: 'Aqueous Transmission', category: 'music',
    extraInfo: 'Incubus — 7-minute meditative ambient outro with Japanese flute.',
    stress: '-', calm: '+', attention: '-', tags: ['grief-safe', 'ambient', 'mindless'] },

  { id: 'music-30', title: 'Between the Bars', category: 'music',
    extraInfo: 'Elliott Smith — Hauntingly intimate acoustic song for introspective moments.',
    stress: '-', calm: '+', attention: '-', tags: ['grief-safe', 'melancholic', 'ambient'] }
];
