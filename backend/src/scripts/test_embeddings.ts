import { pipeline } from '@xenova/transformers';

async function main() {
  console.log("Loading feature extraction model...");
  const extractor = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
  console.log("Encoding text...");
  const output = await extractor('Hello world', { pooling: 'mean', normalize: true });
  const embedding = Array.from(output.data);
  console.log("Embedding length:", embedding.length);
  console.log("First 5 values:", embedding.slice(0, 5));
}

main().catch(console.error);
