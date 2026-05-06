/**
 * One-time script: embeds all HVAC knowledge JSON chunks with nomic-embed-text-v1.5
 * and upserts them into Pinecone.
 *
 * Usage:
 *   node scripts/seed-pinecone.js
 *
 * Required env vars:
 *   HUGGINGFACE_API_KEY
 *   PINECONE_API_KEY
 *   PINECONE_INDEX_NAME  (default: hvac-knowledge)
 */

import { Pinecone } from '@pinecone-database/pinecone';
import { pipeline } from '@xenova/transformers';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';

dotenv.config();

const __dirname = dirname(fileURLToPath(import.meta.url));
const knowledgePath = join(__dirname, '../src/data/knowledge');

const HF_KEY = process.env.HUGGINGFACE_API_KEY;
const PINECONE_KEY = process.env.PINECONE_API_KEY;
const PINECONE_INDEX = process.env.PINECONE_INDEX_NAME || 'hvac-knowledge';
const EMBED_MODEL = 'sentence-transformers/all-MiniLM-L6-v2';
const VECTOR_DIM = 384;

if (!HF_KEY || !PINECONE_KEY) {
  console.error('❌ HUGGINGFACE_API_KEY and PINECONE_API_KEY are required in .env');
  process.exit(1);
}

const pc = new Pinecone({ apiKey: PINECONE_KEY });

function loadJSON(file) {
  return JSON.parse(readFileSync(join(knowledgePath, file), 'utf8'));
}

// ── Local embedder singleton (downloaded once, cached) ────────────────────────
let _embedder = null;
async function getEmbedder() {
  if (!_embedder) {
    console.log('   📥 Loading embedding model (first run — downloads ~25MB)...');
    _embedder = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
    console.log('   ✅ Model loaded\n');
  }
  return _embedder;
}

async function embed(text) {
  const embedder = await getEmbedder();
  const output = await embedder(text, { pooling: 'mean', normalize: true });
  return Array.from(output.data);
}

// ── Sleep to avoid HF rate limits ─────────────────────────────────────────────
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

// ── Build text chunks from each knowledge file ─────────────────────────────────
function buildChunks() {
  const chunks = [];

  // common-failures.json
  const commonFailures = loadJSON('common-failures.json');
  for (const entry of commonFailures.entries || []) {
    const text = [
      `Fault: ${entry.fault}`,
      `Equipment types: ${entry.equipmentTypes?.join(', ')}`,
      `Frequency: ${entry.frequency}`,
      `Symptoms: ${entry.symptoms?.join(', ')}`,
      `Root causes: ${entry.rootCauses?.join(', ')}`,
      `Diagnostic steps: ${entry.diagnosticSteps?.join('. ')}`,
      `Repair procedure: ${entry.repairProcedure}`,
      `Common mistakes: ${entry.commonMistakes?.join('. ')}`,
    ].filter(Boolean).join('\n');

    chunks.push({
      id: entry.id,
      text,
      source: 'common-failures',
      equipmentTypes: entry.equipmentTypes || [],
      fault: entry.fault,
      frequency: entry.frequency,
    });
  }

  // equipment-specific.json
  const equipmentSpecific = loadJSON('equipment-specific.json');
  for (const [type, data] of Object.entries(equipmentSpecific.equipment || {})) {
    const text = [
      `Equipment type: ${type}`,
      `Description: ${data.description}`,
      `Top failures: ${data.topFailures?.join(', ')}`,
      data.criticalMeasurements ? `Normal measurements: ${Object.entries(data.criticalMeasurements).map(([k, v]) => `${k}: ${v}`).join(', ')}` : '',
      `Diagnostic notes: ${data.diagnosticDifferences?.join('. ')}`,
    ].filter(Boolean).join('\n');

    chunks.push({
      id: `equip-${type.replace(/\s+/g, '-').toLowerCase()}`,
      text,
      source: 'equipment-specific',
      equipmentType: type,
    });
  }

  // brand-specific.json
  const brandSpecific = loadJSON('brand-specific.json');
  for (const [brand, data] of Object.entries(brandSpecific.brands || {})) {
    const text = [
      `Brand: ${brand}`,
      data.alsoKnown?.length ? `Also known as: ${data.alsoKnown.join(', ')}` : '',
      `Known issues:\n${data.knownIssues?.map(i => `  • ${i}`).join('\n')}`,
      `Warranty: ${data.warrantyNotes}`,
      data.commonPlatforms ? `Platforms: ${Object.entries(data.commonPlatforms).map(([k, v]) => `${k}: ${v}`).join(' | ')}` : '',
    ].filter(Boolean).join('\n');

    chunks.push({
      id: `brand-${brand.toLowerCase()}`,
      text,
      source: 'brand-specific',
      brand,
      aliases: data.alsoKnown || [],
    });
  }

  // refrigerant-data.json
  const refrigerantData = loadJSON('refrigerant-data.json');
  for (const [ref, data] of Object.entries(refrigerantData.refrigerants || {})) {
    const text = [
      `Refrigerant: ${data.name}`,
      `Type: ${data.type} | Classification: ${data.classification}`,
      `Status: ${data.status}`,
      data.operatingPressures ? `Normal pressures: Suction ${data.operatingPressures.suctionNormal}, Discharge ${data.operatingPressures.dischargeNormal}` : '',
      `Oil type: ${data.oilType}`,
      `Charging method: ${data.chargingMethod}`,
      `Service notes: ${data.serviceNotes?.join('. ')}`,
    ].filter(Boolean).join('\n');

    chunks.push({
      id: `ref-${ref.replace(/-/g, '').toLowerCase()}`,
      text,
      source: 'refrigerant-data',
      refrigerant: ref,
    });
  }

  // diagnostic-procedures.json
  const diagnosticProcedures = loadJSON('diagnostic-procedures.json');
  for (const proc of diagnosticProcedures.procedures || []) {
    const text = [
      `Procedure: ${proc.title}`,
      `Applies to: ${proc.applicableTo?.join(', ')}`,
      `Steps:\n${proc.steps?.map((s, i) => `  ${i + 1}. ${s}`).join('\n')}`,
      proc.targetRanges ? `Target ranges: ${JSON.stringify(proc.targetRanges)}` : '',
    ].filter(Boolean).join('\n');

    chunks.push({
      id: proc.id,
      text,
      source: 'diagnostic-procedures',
      title: proc.title,
      applicableTo: proc.applicableTo || [],
    });
  }

  // safety-protocols.json
  const safetyProtocols = loadJSON('safety-protocols.json');
  for (const proto of safetyProtocols.protocols || []) {
    const text = [
      `Safety protocol: ${proto.title}`,
      `Category: ${proto.category}`,
      `Rules:\n${proto.rules?.map(r => `  • ${r}`).join('\n')}`,
    ].filter(Boolean).join('\n');

    chunks.push({
      id: proto.id,
      text,
      source: 'safety-protocols',
      category: proto.category,
    });
  }

  return chunks;
}

// ── Ensure Pinecone index exists ───────────────────────────────────────────────
async function ensureIndex() {
  const existing = await pc.listIndexes();
  const names = existing.indexes?.map(i => i.name) || [];

  if (!names.includes(PINECONE_INDEX)) {
    console.log(`📦 Creating Pinecone index: ${PINECONE_INDEX} (dim=${VECTOR_DIM}, metric=cosine)`);
    await pc.createIndex({
      name: PINECONE_INDEX,
      dimension: VECTOR_DIM,
      metric: 'cosine',
      spec: { serverless: { cloud: 'aws', region: 'us-east-1' } },
    });
    // Wait for index to be ready
    console.log('⏳ Waiting for index to initialize...');
    await sleep(20000);
  } else {
    console.log(`✅ Index "${PINECONE_INDEX}" already exists`);
  }
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  console.log('🌲 ARCTIC AI — Pinecone Knowledge Seeder');
  console.log(`   Model:  ${EMBED_MODEL}`);
  console.log(`   Index:  ${PINECONE_INDEX}`);
  console.log('');

  await ensureIndex();

  const chunks = buildChunks();
  console.log(`📚 Built ${chunks.length} knowledge chunks from JSON files\n`);

  const index = pc.Index(PINECONE_INDEX);
  const vectors = [];

  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];
    process.stdout.write(`   Embedding [${i + 1}/${chunks.length}] ${chunk.id}...`);

    try {
      const embedding = await embed(chunk.text);

      // Pinecone metadata values must be strings, numbers, booleans, or arrays of strings
      const metadata = { id: chunk.id, source: chunk.source, text: chunk.text };
      if (chunk.fault) metadata.fault = chunk.fault;
      if (chunk.brand) metadata.brand = chunk.brand;
      if (chunk.refrigerant) metadata.refrigerant = chunk.refrigerant;
      if (chunk.equipmentType) metadata.equipmentType = chunk.equipmentType;
      if (chunk.title) metadata.title = chunk.title;
      if (chunk.equipmentTypes) metadata.equipmentTypes = chunk.equipmentTypes;
      if (chunk.aliases) metadata.aliases = chunk.aliases;
      if (chunk.applicableTo) metadata.applicableTo = chunk.applicableTo;

      vectors.push({ id: chunk.id, values: embedding, metadata });
      console.log(' ✓');
    } catch (err) {
      console.log(` ✗ (${err.message})`);
    }

    // Rate limit buffer
    await sleep(300);
  }

  // Upsert in batches of 20
  const BATCH = 20;
  console.log(`\n⬆️  Upserting ${vectors.length} vectors to Pinecone...`);

  for (let i = 0; i < vectors.length; i += BATCH) {
    const batch = vectors.slice(i, i + BATCH);
    await index.upsert({ records: batch });
    console.log(`   Batch ${Math.floor(i / BATCH) + 1}/${Math.ceil(vectors.length / BATCH)} upserted`);
  }

  const stats = await index.describeIndexStats();
  console.log(`\n✅ Done! Pinecone index stats:`);
  console.log(`   Total vectors: ${stats.totalRecordCount}`);
  console.log(`   Dimension:     ${stats.dimension}`);
}

main().catch(err => {
  console.error('\n❌ Seeding failed:', err);
  process.exit(1);
});
