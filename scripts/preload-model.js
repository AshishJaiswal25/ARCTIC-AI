import { pipeline } from '@xenova/transformers';
console.log('Downloading Xenova/all-MiniLM-L6-v2 embedding model...');
await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
console.log('Model cached successfully.');
