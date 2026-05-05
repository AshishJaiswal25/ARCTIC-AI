// ── HVAC Knowledge RAG System ─────────────────────────────────────────────────
// Retrieves relevant knowledge from local knowledge base files and S3 feedback
// Injects into Claude's system prompt for domain-specific, grounded responses

import commonFailures from './knowledge/common-failures.json';
import diagnosticProcedures from './knowledge/diagnostic-procedures.json';
import equipmentSpecific from './knowledge/equipment-specific.json';
import brandSpecific from './knowledge/brand-specific.json';
import refrigerantData from './knowledge/refrigerant-data.json';
import safetyProtocols from './knowledge/safety-protocols.json';

// ── Relevance scoring helpers ──────────────────────────────────────────────────

function textMatchScore(text, keywords) {
  if (!text || !keywords.length) return 0;
  const lower = text.toLowerCase();
  return keywords.reduce((score, kw) => {
    if (lower.includes(kw.toLowerCase())) score += 1;
    return score;
  }, 0);
}

function extractKeywords(intake) {
  const keywords = [];
  if (intake.equipType) keywords.push(intake.equipType);
  if (intake.brand) keywords.push(intake.brand);
  if (intake.refrigerant) keywords.push(intake.refrigerant);
  if (intake.symptoms) {
    intake.symptoms.forEach(s => {
      // Extract key phrases from symptom strings
      const words = s.toLowerCase().split(/[\s/()]+/).filter(w => w.length > 3);
      keywords.push(...words);
    });
  }
  if (intake.faultCode) keywords.push(intake.faultCode);
  if (intake.techNotes) {
    const noteWords = intake.techNotes.toLowerCase().split(/\s+/).filter(w => w.length > 4);
    keywords.push(...noteWords);
  }
  return [...new Set(keywords)];
}

// ── Knowledge Retrieval Functions ──────────────────────────────────────────────

function getRelevantFailures(keywords, equipType, symptoms = []) {
  const entries = commonFailures.entries || [];
  const scored = entries.map(entry => {
    let score = 0;
    // Equipment type match
    if (equipType && entry.equipmentTypes?.includes(equipType)) score += 3;
    // Symptom overlap
    if (symptoms.length && entry.symptoms) {
      const overlap = symptoms.filter(s =>
        entry.symptoms.some(es => es.toLowerCase().includes(s.toLowerCase().slice(0, 20)))
      );
      score += overlap.length * 2;
    }
    // Keyword matches in fault name, root causes, etc.
    score += textMatchScore(entry.fault, keywords);
    score += textMatchScore(entry.repairProcedure || '', keywords);
    score += textMatchScore(JSON.stringify(entry.rootCauses || []), keywords);
    return { entry, score };
  });

  return scored
    .filter(s => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 4) // Top 4 most relevant
    .map(s => s.entry);
}

function getRelevantProcedures(keywords, equipType) {
  const procedures = diagnosticProcedures.procedures || [];
  const scored = procedures.map(proc => {
    let score = 0;
    if (equipType && proc.applicableTo?.includes(equipType)) score += 2;
    score += textMatchScore(proc.title, keywords);
    score += textMatchScore(JSON.stringify(proc.steps || []), keywords);
    return { proc, score };
  });

  return scored
    .filter(s => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map(s => s.proc);
}

function getEquipmentKnowledge(equipType) {
  if (!equipType) return null;
  return equipmentSpecific.equipment?.[equipType] || null;
}

function getBrandKnowledge(brand) {
  if (!brand) return null;
  // Direct match
  if (brandSpecific.brands?.[brand]) return { name: brand, ...brandSpecific.brands[brand] };
  // Check "alsoKnown" aliases
  for (const [key, val] of Object.entries(brandSpecific.brands || {})) {
    if (val.alsoKnown?.some(alias => alias.toLowerCase() === brand.toLowerCase())) {
      return { name: key, ...val };
    }
  }
  return null;
}

function getRefrigerantKnowledge(refrigerant) {
  if (!refrigerant || refrigerant === 'Unknown') return null;
  return refrigerantData.refrigerants?.[refrigerant] || null;
}

function getRelevantSafety(keywords, symptoms = []) {
  const allRules = [];
  const protocols = safetyProtocols.protocols || [];

  // Always include electrical safety
  const electricalSymptoms = ['tripping', 'breaker', 'fuses', 'voltage', 'not turning on', 'compressor not running'];
  const hasElectrical = symptoms.some(s => electricalSymptoms.some(es => s.toLowerCase().includes(es)));
  if (hasElectrical) {
    const elec = protocols.find(p => p.id === 'sp-001');
    if (elec) allRules.push(...elec.rules.slice(0, 3));
  }

  // Refrigerant safety for charge-related issues
  const refSymptoms = ['refrigerant', 'charge', 'leak', 'freezing', 'ice'];
  const hasRefIssue = keywords.some(k => refSymptoms.some(rs => k.toLowerCase().includes(rs)));
  if (hasRefIssue) {
    const ref = protocols.find(p => p.id === 'sp-002');
    if (ref) allRules.push(...ref.rules.slice(0, 3));
  }

  return allRules;
}

// ── Main RAG Function ──────────────────────────────────────────────────────────

/**
 * Retrieves relevant HVAC knowledge based on job intake data.
 * Returns a formatted string to inject into the system prompt.
 *
 * @param {Object} intake - Job intake data
 * @param {string} intake.equipType - Equipment type
 * @param {string} intake.brand - Brand name
 * @param {string} intake.refrigerant - Refrigerant type
 * @param {string[]} intake.symptoms - Selected symptoms
 * @param {string} intake.faultCode - Displayed fault code
 * @param {string} intake.techNotes - Technician notes
 * @param {Object} intake.readings - Pressure/temp readings
 * @returns {string} Formatted knowledge context for prompt injection
 */
export function retrieveKnowledge(intake = {}) {
  const keywords = extractKeywords(intake);
  if (keywords.length === 0) return '';

  const sections = [];

  // 1. Equipment-specific knowledge
  const equipKnowledge = getEquipmentKnowledge(intake.equipType);
  if (equipKnowledge) {
    sections.push(`\n═══ EQUIPMENT: ${intake.equipType} ═══`);
    sections.push(`Description: ${equipKnowledge.description}`);
    if (equipKnowledge.topFailures) {
      sections.push(`Top failures for this equipment type: ${equipKnowledge.topFailures.join(', ')}`);
    }
    if (equipKnowledge.criticalMeasurements) {
      sections.push(`Normal measurements:`);
      for (const [key, val] of Object.entries(equipKnowledge.criticalMeasurements)) {
        sections.push(`  ${key}: ${val}`);
      }
    }
    if (equipKnowledge.diagnosticDifferences) {
      sections.push(`Diagnostic notes: ${equipKnowledge.diagnosticDifferences.join(' | ')}`);
    }
  }

  // 2. Brand-specific knowledge
  const brandKnowledge = getBrandKnowledge(intake.brand);
  if (brandKnowledge) {
    sections.push(`\n═══ BRAND: ${brandKnowledge.name} ═══`);
    if (brandKnowledge.alsoKnown?.length) {
      sections.push(`Also known as: ${brandKnowledge.alsoKnown.join(', ')}`);
    }
    if (brandKnowledge.knownIssues?.length) {
      sections.push(`Known issues:`);
      brandKnowledge.knownIssues.forEach(issue => sections.push(`  • ${issue}`));
    }
    if (brandKnowledge.warrantyNotes) {
      sections.push(`Warranty: ${brandKnowledge.warrantyNotes}`);
    }
  }

  // 3. Refrigerant knowledge
  const refKnowledge = getRefrigerantKnowledge(intake.refrigerant);
  if (refKnowledge) {
    sections.push(`\n═══ REFRIGERANT: ${refKnowledge.name} ═══`);
    sections.push(`Type: ${refKnowledge.type} | Class: ${refKnowledge.classification}`);
    sections.push(`Status: ${refKnowledge.status}`);
    if (refKnowledge.operatingPressures) {
      sections.push(`Normal pressures: Suction ${refKnowledge.operatingPressures.suctionNormal}, Discharge ${refKnowledge.operatingPressures.dischargeNormal}`);
    }
    sections.push(`Oil: ${refKnowledge.oilType}`);
    sections.push(`Charging: ${refKnowledge.chargingMethod}`);
    if (refKnowledge.serviceNotes?.length) {
      sections.push(`Service notes:`);
      refKnowledge.serviceNotes.slice(0, 4).forEach(n => sections.push(`  • ${n}`));
    }
  }

  // 4. Relevant common failures (matched to symptoms)
  const failures = getRelevantFailures(keywords, intake.equipType, intake.symptoms);
  if (failures.length > 0) {
    sections.push(`\n═══ RELEVANT FAILURE PATTERNS ═══`);
    failures.forEach(f => {
      sections.push(`\n▸ ${f.fault} (frequency: ${f.frequency})`);
      if (f.diagnosticSteps) {
        sections.push(`  Diagnostic steps:`);
        f.diagnosticSteps.slice(0, 5).forEach(s => sections.push(`    ${s}`));
      }
      if (f.rootCauses) {
        sections.push(`  Root causes: ${f.rootCauses.slice(0, 3).join(' | ')}`);
      }
      if (f.commonMistakes) {
        sections.push(`  ⚠ Common mistakes: ${f.commonMistakes.slice(0, 2).join(' | ')}`);
      }
      if (f.repairProcedure) {
        sections.push(`  Repair: ${f.repairProcedure.slice(0, 200)}...`);
      }
    });
  }

  // 5. Relevant diagnostic procedures
  const procedures = getRelevantProcedures(keywords, intake.equipType);
  if (procedures.length > 0) {
    sections.push(`\n═══ DIAGNOSTIC PROCEDURES ═══`);
    procedures.forEach(p => {
      sections.push(`\n▸ ${p.title}`);
      p.steps.slice(0, 5).forEach(s => sections.push(`  ${s}`));
      if (p.targetRanges) {
        const ref = intake.refrigerant || 'R-410A';
        const range = p.targetRanges[ref];
        if (range) {
          sections.push(`  Target for ${ref}: ${JSON.stringify(range)}`);
        }
      }
    });
  }

  // 6. Safety warnings
  const safetyRules = getRelevantSafety(keywords, intake.symptoms);
  if (safetyRules.length > 0) {
    sections.push(`\n═══ SAFETY REMINDERS ═══`);
    safetyRules.forEach(r => sections.push(`  ⚠ ${r}`));
  }

  if (sections.length === 0) return '';

  return '\n\n' + '─'.repeat(60) +
    '\nHVAC KNOWLEDGE BASE (RAG-INJECTED CONTEXT - USE THIS DATA):' +
    '\n' + '─'.repeat(60) +
    sections.join('\n') +
    '\n' + '─'.repeat(60) +
    '\nIMPORTANT: Use the above knowledge base data to ground your diagnosis. ' +
    'Reference specific failure patterns, procedures, and brand quirks when relevant. ' +
    'Prioritize known common failures for this equipment/brand combination.' +
    '\n' + '─'.repeat(60);
}

/**
 * Format past feedback entries as learning context.
 * Shows the model what corrections have been made on similar cases.
 */
export function formatFeedbackContext(feedbackEntries = []) {
  if (!feedbackEntries.length) return '';

  const relevant = feedbackEntries
    .filter(fb => fb.feedback?.wasCorrect !== 'yes') // Only corrections
    .slice(0, 5); // Max 5

  if (!relevant.length) return '';

  const sections = ['\n\n═══ PAST DIAGNOSTIC CORRECTIONS (learn from these) ═══'];
  relevant.forEach((fb, i) => {
    sections.push(`\nCase ${i + 1}:`);
    sections.push(`  Input: ${fb.input?.equipType || '?'} | ${fb.input?.brand || '?'} | Symptoms: ${(fb.input?.symptoms || []).join(', ')}`);
    sections.push(`  AI diagnosed: ${fb.aiDiagnosis?.primaryFault || '?'}`);
    sections.push(`  Was correct: ${fb.feedback?.wasCorrect}`);
    if (fb.feedback?.actualDiagnosis) {
      sections.push(`  ACTUAL diagnosis: ${fb.feedback.actualDiagnosis}`);
    }
    if (fb.feedback?.techNotes) {
      sections.push(`  Tech notes: ${fb.feedback.techNotes}`);
    }
  });

  return sections.join('\n');
}

export default { retrieveKnowledge, formatFeedbackContext };
