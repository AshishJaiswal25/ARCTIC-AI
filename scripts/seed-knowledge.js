// ── Seed HVAC Knowledge Base to S3 ─────────────────────────────────────────────
// Run: node scripts/seed-knowledge.js
// Uploads all knowledge base JSON files to S3 for backup and future vector DB use

import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { readFileSync, readdirSync } from 'fs';
import { join, basename } from 'path';
import dotenv from 'dotenv';

dotenv.config();

const s3 = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

const BUCKET = process.env.AWS_S3_BUCKET || 'hvac-pro-jobs';
const KNOWLEDGE_DIR = join(import.meta.dirname, '..', 'src', 'data', 'knowledge');

async function seedKnowledge() {
  console.log('\n🧠 Seeding HVAC Knowledge Base to S3...');
  console.log(`   Bucket: ${BUCKET}`);
  console.log(`   Source: ${KNOWLEDGE_DIR}\n`);

  const files = readdirSync(KNOWLEDGE_DIR).filter(f => f.endsWith('.json'));

  for (const file of files) {
    const filePath = join(KNOWLEDGE_DIR, file);
    const content = readFileSync(filePath, 'utf-8');
    const key = `knowledge/${basename(file)}`;

    try {
      await s3.send(new PutObjectCommand({
        Bucket: BUCKET,
        Key: key,
        Body: content,
        ContentType: 'application/json',
      }));
      console.log(`   ✅ ${key} (${(content.length / 1024).toFixed(1)} KB)`);
    } catch (err) {
      console.error(`   ❌ ${key}: ${err.message}`);
    }
  }

  console.log('\n✨ Knowledge base seeded to S3!\n');
}

seedKnowledge();
