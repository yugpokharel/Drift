import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { pipeline } from '@xenova/transformers';

dotenv.config();

interface NeededMovie {
  movieId: number;
  tmdbId: number;
  title: string;
  genres: string;
}

interface MovieFeatures {
  movieId: number;
  title: string;
  genres: string[];
  runtime: number;
  overview: string;
  keywords: string[];
  embedding: number[];
  releaseDate: string;
}

async function main() {
  console.log("=== Step 2: Content Feature Vector & Sentence Embedding Generation (Offline-Optimised) ===");
  
  const cfCandidatesFile = path.resolve('src/data/cf_candidates.json');
  const movieFeaturesFile = path.resolve('src/data/movie_features.json');
  const cacheFile = path.resolve('src/data/tmdb_cache.json');
  
  if (!fs.existsSync(cfCandidatesFile)) {
    console.error(`Error: CF candidates file not found at ${cfCandidatesFile}. Run train_cf.py first.`);
    process.exit(1);
  }
  
  const cfData = JSON.parse(fs.readFileSync(cfCandidatesFile, 'utf-8'));
  const neededMovies: Record<string, NeededMovie> = cfData.needed_movies;
  const movieIds = Object.keys(neededMovies);
  
  console.log(`Loaded ${movieIds.length} candidate movies to process.`);
  
  // Load caches if they exist
  let cache: Record<string, any> = {};
  if (fs.existsSync(cacheFile)) {
    try {
      cache = JSON.parse(fs.readFileSync(cacheFile, 'utf-8'));
      console.log(`Loaded ${Object.keys(cache).length} cached TMDB movie details.`);
    } catch (e) {}
  }
  
  let movieFeatures: Record<string, MovieFeatures> = {};
  if (fs.existsSync(movieFeaturesFile)) {
    try {
      movieFeatures = JSON.parse(fs.readFileSync(movieFeaturesFile, 'utf-8'));
      console.log(`Loaded ${Object.keys(movieFeatures).length} existing movie features.`);
    } catch (e) {}
  }
  
  console.log("Loading Xenova feature-extraction model (Xenova/all-MiniLM-L6-v2)...");
  const extractor = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
  console.log("Embedding model loaded successfully.");
  
  const idsToProcess = movieIds.filter(id => !movieFeatures[id]);
  console.log(`Processing ${idsToProcess.length} movies...`);
  
  const startTime = Date.now();
  
  // Since this is offline and CPU-intensive, we can process in batches of 50
  const batchSize = 50;
  
  for (let i = 0; i < idsToProcess.length; i += batchSize) {
    const batch = idsToProcess.slice(i, i + batchSize);
    
    await Promise.all(batch.map(async (movieIdStr) => {
      const movie = neededMovies[movieIdStr];
      const tmdbId = movie.tmdbId;
      
      const cachedData = cache[tmdbId.toString()];
      
      // Use cached overview & runtime if available, otherwise construct offline synthetic description
      const overview = cachedData?.overview || `A cinematic feature film titled ${movie.title} spanning genres like ${movie.genres.replace(/\|/g, ', ')}.`;
      const runtime = cachedData?.runtime || (movie.genres.includes('Action') || movie.genres.includes('Drama') ? 120 : 95);
      const releaseDate = cachedData?.release_date || movie.title.match(/\((\d{4})\)/)?.[1] || "2000";
      
      let keywords: string[] = [];
      if (cachedData?.keywords?.keywords) {
        keywords = cachedData.keywords.keywords.map((k: any) => k.name);
      } else {
        // Fallback keywords derived from genres and title words
        keywords = movie.genres.split('|').concat(movie.title.split(' ').slice(0, 3));
      }
      
      const genreArray = movie.genres.split('|');
      
      // Combine text fields for sentence embedding
      const textToEmbed = `${movie.title}. genres: ${genreArray.join(', ')}. synopsis: ${overview} keywords: ${keywords.join(', ')}`;
      
      let embedding: number[] = [];
      try {
        const output = await extractor(textToEmbed, { pooling: 'mean', normalize: true });
        embedding = Array.from(output.data);
      } catch (err: any) {
        console.error(`[Embedding] Failed for ${movie.title}: ${err.message}`);
        embedding = new Array(384).fill(0);
      }
      
      movieFeatures[movieIdStr] = {
        movieId: movie.movieId,
        title: movie.title,
        genres: genreArray,
        runtime: runtime,
        overview: overview,
        keywords: keywords,
        embedding: embedding,
        releaseDate: releaseDate
      };
    }));
    
    const processed = Math.min(i + batchSize, idsToProcess.length);
    const elapsed = (Date.now() - startTime) / 1000;
    const rate = processed / elapsed;
    const remaining = (idsToProcess.length - processed) / rate;
    console.log(`Processed ${processed}/${idsToProcess.length} movies... (${rate.toFixed(1)}/sec, remaining: ~${remaining.toFixed(0)}s)`);
    
    // Save periodically to avoid losing progress
    if (processed % 500 === 0 || processed === idsToProcess.length) {
      fs.writeFileSync(movieFeaturesFile, JSON.stringify(movieFeatures));
    }
  }
  
  fs.writeFileSync(movieFeaturesFile, JSON.stringify(movieFeatures));
  console.log(`Saved final movie features to ${movieFeaturesFile}`);
  console.log(`Step 2 completed successfully.`);
}

main().catch(console.error);
