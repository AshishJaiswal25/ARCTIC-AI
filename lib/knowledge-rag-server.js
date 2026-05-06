import { Pinecone } from '@pinecone-database/pinecone';
import { pipeline } from '@xenova/transformers';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const knowledgePath = join(__dirname, '../src/data/knowledge');

// ── Lazy-load knowledge JSONs ──────────────────────────────────────────────────
function loadJSON(file) {
  return JSON.parse(readFileSync(join(knowledgePath, file), 'utf8'));
}

const HF_KEY = process.env.HUGGINGFACE_API_KEY;
const PINECONE_KEY = process.env.PINECONE_API_KEY;
const PINECONE_INDEX = process.env.PINECONE_INDEX_NAME || 'hvac-knowledge';
// ── Local embedder singleton (Xenova/all-MiniLM-L6-v2, 384 dims) ─────────────
let _embedder = null;
async function getEmbedder() {
  if (!_embedder) {
    _embedder = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
  }
  return _embedder;
}

async function embedText(text) {
  const embedder = await getEmbedder();
  const output = await embedder(text, { pooling: 'mean', normalize: true });
  return Array.from(output.data);
}

export async function embedQuery(text) { return embedText(text); }
export async function embedDocument(text) { return embedText(text); }

// ── Build intake summary string for embedding ─────────────────────────────────
function buildIntakeSummary(intake = {}) {
  const parts = [];
  if (intake.equipType) parts.push(`Equipment: ${intake.equipType}`);
  if (intake.brand) parts.push(`Brand: ${intake.brand}`);
  if (intake.refrigerant) parts.push(`Refrigerant: ${intake.refrigerant}`);
  if (intake.symptoms?.length) parts.push(`Symptoms: ${intake.symptoms.join(', ')}`);
  if (intake.faultCode) parts.push(`Fault code: ${intake.faultCode}`);
  if (intake.techNotes) parts.push(`Tech notes: ${intake.techNotes}`);
  if (intake.readings) {
    const r = intake.readings;
    const readingParts = [];
    if (r.suction) readingParts.push(`suction ${r.suction} psig`);
    if (r.discharge) readingParts.push(`discharge ${r.discharge} psig`);
    if (r.superheat) readingParts.push(`superheat ${r.superheat}°F`);
    if (r.subcooling) readingParts.push(`subcooling ${r.subcooling}°F`);
    if (readingParts.length) parts.push(`Readings: ${readingParts.join(', ')}`);
  }
  return parts.join(' | ');
}

// ── Semantic retrieval via Pinecone ───────────────────────────────────────────
async function retrieveSemantic(intake) {
  const pc = new Pinecone({ apiKey: PINECONE_KEY });
  const index = pc.Index(PINECONE_INDEX);

  const queryText = buildIntakeSummary(intake);
  const queryVector = await embedQuery(queryText);

  const results = await index.query({
    vector: queryVector,
    topK: 8,
    includeMetadata: true,
  });

  return results.matches
    .filter(m => m.score > 0.3)
    .map(m => m.metadata);
}

// ── Format retrieved chunks into prompt context ────────────────────────────────
function formatChunks(chunks) {
  if (!chunks.length) return '';

  const sections = [];
  const seen = new Set();

  for (const chunk of chunks) {
    if (seen.has(chunk.id)) continue;
    seen.add(chunk.id);
    sections.push(chunk.text);
  }

  return (
    '\n\n' + '─'.repeat(60) +
    '\nHVAC KNOWLEDGE BASE (SEMANTIC RETRIEVAL — USE THIS DATA):' +
    '\n' + '─'.repeat(60) +
    '\n' + sections.join('\n\n') +
    '\n' + '─'.repeat(60) +
    '\nIMPORTANT: Ground your diagnosis in the above knowledge. Reference specific failure patterns, ' +
    'brand quirks, and procedures when relevant.' +
    '\n' + '─'.repeat(60)
  );
}

// ── Keyword fallback (used when Pinecone not configured) ──────────────────────
function retrieveKeyword(intake) {
  const commonFailures = loadJSON('common-failures.json');
  const equipmentSpecific = loadJSON('equipment-specific.json');
  const brandSpecific = loadJSON('brand-specific.json');
  const refrigerantData = loadJSON('refrigerant-data.json');

  const sections = [];
  const { equipType, brand, refrigerant, symptoms = [], faultCode, techNotes } = intake;

  // Equipment
  const equip = equipmentSpecific.equipment?.[equipType];
  if (equip) {
    sections.push(`EQUIPMENT: ${equipType}\n  Top failures: ${equip.topFailures?.join(', ')}`);
  }

  // Brand
  const brandData = brandSpecific.brands?.[brand];
  if (brandData) {
    sections.push(`BRAND: ${brand}\n  Known issues:\n${brandData.knownIssues?.map(i => `    • ${i}`).join('\n')}`);
  }

  // Refrigerant
  const refData = refrigerantData.refrigerants?.[refrigerant];
  if (refData) {
    sections.push(`REFRIGERANT: ${refData.name}\n  Pressures: Suction ${refData.operatingPressures?.suctionNormal}, Discharge ${refData.operatingPressures?.dischargeNormal}\n  Oil: ${refData.oilType}`);
  }

  // Top matching failures
  const keywords = [equipType, brand, faultCode, ...(symptoms || []), techNotes]
    .filter(Boolean).join(' ').toLowerCase();

  const failures = (commonFailures.entries || [])
    .map(e => {
      let score = 0;
      if (equipType && e.equipmentTypes?.includes(equipType)) score += 3;
      const overlap = (symptoms || []).filter(s => e.symptoms?.some(es => es.toLowerCase().includes(s.toLowerCase().slice(0, 20))));
      score += overlap.length * 2;
      if (e.fault && keywords.includes(e.fault.toLowerCase().slice(0, 10))) score += 1;
      return { e, score };
    })
    .filter(x => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 4)
    .map(x => x.e);

  if (failures.length) {
    sections.push('RELEVANT FAILURE PATTERNS:');
    failures.forEach(f => {
      sections.push(`  ▸ ${f.fault} (${f.frequency})\n    Root causes: ${f.rootCauses?.slice(0, 3).join(' | ')}\n    Repair: ${f.repairProcedure?.slice(0, 150)}`);
    });
  }

  if (!sections.length) return '';

  return (
    '\n\n' + '─'.repeat(60) +
    '\nHVAC KNOWLEDGE BASE (KEYWORD RETRIEVAL):' +
    '\n' + '─'.repeat(60) +
    '\n' + sections.join('\n\n') +
    '\n' + '─'.repeat(60)
  );
}

// ── Main export: retrieve knowledge for a given intake ────────────────────────
export async function retrieveKnowledge(intake = {}) {
  if (PINECONE_KEY && HF_KEY) {
    try {
      const chunks = await retrieveSemantic(intake);
      return formatChunks(chunks);
    } catch (err) {
      console.warn('Semantic retrieval failed, falling back to keyword:', err.message);
    }
  }
  return retrieveKeyword(intake);
}

// ── Build full system prompt with knowledge injected ──────────────────────────
export async function buildSystemPrompt(intake = {}, feedbackEntries = []) {
  const { HVAC_SYSTEM_PROMPT } = await import('../src/constants.js');
  const { getFaultCodeContext } = await import('../src/data/fault-codes.js');

  let prompt = HVAC_SYSTEM_PROMPT;

  if (intake.brand) {
    const faultCtx = getFaultCodeContext(intake.brand);
    if (faultCtx) prompt += `\n\nBRAND-SPECIFIC FAULT CODES FOR ${intake.brand.toUpperCase()}:${faultCtx}`;
  }

  const ragContext = await retrieveKnowledge(intake);
  if (ragContext) prompt += ragContext;

  if (feedbackEntries.length) {
    const corrections = feedbackEntries.filter(fb => fb.feedback?.wasCorrect !== 'yes').slice(0, 5);
    if (corrections.length) {
      prompt += '\n\n═══ PAST DIAGNOSTIC CORRECTIONS ═══';
      corrections.forEach((fb, i) => {
        prompt += `\nCase ${i + 1}: ${fb.input?.equipType || '?'} | ${fb.input?.brand || '?'} | AI said: ${fb.aiDiagnosis?.primaryFault || '?'} | Actual: ${fb.feedback?.actualDiagnosis || 'not provided'}`;
      });
    }
  }

  return prompt;
}
