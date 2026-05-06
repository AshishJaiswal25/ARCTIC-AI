import express from 'express';
import cors from 'cors';
import multer from 'multer';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { S3Client, PutObjectCommand, GetObjectCommand, ListObjectsV2Command, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { existsSync } from 'fs';
import dotenv from 'dotenv';
import { buildSystemPrompt } from './lib/knowledge-rag-server.js';

dotenv.config();

const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3001;
const IS_PROD = process.env.NODE_ENV === 'production';

// ── CORS — allow local dev + production domain ────────────────────────────────
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:4173',
  process.env.FRONTEND_URL,
].filter(Boolean);

app.use(cors({ origin: IS_PROD ? true : allowedOrigins }));
app.use(express.json({ limit: '10mb' }));

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

// ── S3 Client ──────────────────────────────────────────────────────────────────
const s3 = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});
const BUCKET = process.env.AWS_S3_BUCKET || 'hvac-pro-jobs';

// ── SES Client (email) ────────────────────────────────────────────────────────
const ses = new SESClient({
  region: process.env.AWS_REGION || 'us-east-2',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});
const FROM_EMAIL = process.env.FROM_EMAIL || 'noreply@arctic-ai.org';

// Helper: generate 6-digit verification code
function generateVerificationCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Helper: send verification email via SES
async function sendVerificationEmail(toEmail, code, userName) {
  const params = {
    Source: `Arctic AI <${FROM_EMAIL}>`,
    Destination: { ToAddresses: [toEmail] },
    Message: {
      Subject: { Data: `${code} — Your Arctic AI Verification Code`, Charset: 'UTF-8' },
      Body: {
        Html: {
          Charset: 'UTF-8',
          Data: `
            <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 480px; margin: 0 auto; background: #0a0a0a; border-radius: 16px; overflow: hidden; border: 1px solid #262626;">
              <div style="background: linear-gradient(135deg, #f97316, #ea580c); padding: 32px; text-align: center;">
                <h1 style="margin: 0; color: #fff; font-size: 24px; letter-spacing: -0.02em;">❄️ Arctic AI</h1>
                <p style="margin: 8px 0 0; color: rgba(255,255,255,0.8); font-size: 13px;">AI HVAC Diagnostic System</p>
              </div>
              <div style="padding: 32px;">
                <p style="color: #d4d4d4; font-size: 15px; margin: 0 0 8px;">Hi ${userName},</p>
                <p style="color: #a3a3a3; font-size: 14px; margin: 0 0 24px;">Enter this verification code to complete your registration:</p>
                <div style="background: #141414; border: 1px solid #333; border-radius: 12px; padding: 20px; text-align: center; margin-bottom: 24px;">
                  <span style="font-size: 36px; font-weight: 700; letter-spacing: 8px; color: #f97316; font-family: 'JetBrains Mono', monospace;">${code}</span>
                </div>
                <p style="color: #666; font-size: 12px; margin: 0;">This code expires in 15 minutes. If you didn't create an account, ignore this email.</p>
              </div>
              <div style="padding: 16px 32px; background: #0f0f0f; border-top: 1px solid #1a1a1a; text-align: center;">
                <p style="margin: 0; font-size: 11px; color: #444;">© ${new Date().getFullYear()} Arctic AI · arctic-ai.org</p>
              </div>
            </div>
          `,
        },
        Text: {
          Charset: 'UTF-8',
          Data: `Hi ${userName},\n\nYour Arctic AI verification code is: ${code}\n\nThis code expires in 15 minutes.\n\nIf you didn't create an account, ignore this email.`,
        },
      },
    },
  };

  await ses.send(new SendEmailCommand(params));
  console.log(`📧 Verification email sent to ${toEmail}`);
}

// ── JWT / Auth Config ──────────────────────────────────────────────────────────
const JWT_SECRET = process.env.JWT_SECRET || 'arctic-ai-dev-secret-change-in-prod';
const JWT_EXPIRES = '7d';

// Helper: get user from S3 by email
async function getUserByEmail(email) {
  try {
    const res = await s3.send(new GetObjectCommand({
      Bucket: BUCKET,
      Key: `users/${email.toLowerCase()}.json`,
    }));
    return JSON.parse(await res.Body.transformToString());
  } catch (e) {
    if (e.name === 'NoSuchKey') return null;
    throw e;
  }
}

// Helper: save user to S3
async function saveUser(user) {
  await s3.send(new PutObjectCommand({
    Bucket: BUCKET,
    Key: `users/${user.email.toLowerCase()}.json`,
    Body: JSON.stringify(user, null, 2),
    ContentType: 'application/json',
  }));
}

// Helper: create JWT
function createToken(user) {
  return jwt.sign(
    { userId: user.id, email: user.email, name: user.name },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES }
  );
}

// Middleware: require auth — attach req.user
function requireAuth(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  try {
    const decoded = jwt.verify(header.split(' ')[1], JWT_SECRET);
    req.user = decoded;
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

// ── Auth Routes ────────────────────────────────────────────────────────────────
app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, password, company } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required' });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    // Check if user exists
    const existing = await getUserByEmail(email);
    if (existing) {
      return res.status(409).json({ error: 'An account with this email already exists' });
    }

    // Hash password and save
    const hashedPassword = await bcrypt.hash(password, 12);
    const user = {
      id: `user-${Date.now().toString(36)}`,
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password: hashedPassword,
      company: company || '',
      role: 'technician',
      emailVerified: true, // TODO: set to false once SES production access is approved
      createdAt: new Date().toISOString(),
    };

    await saveUser(user);

    const token = createToken(user);
    const { password: _, ...safeUser } = user;

    console.log(`✅ New user registered: ${user.email}`);
    res.status(201).json({ token, user: safeUser });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const user = await getUserByEmail(email);
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // TODO: re-enable once SES production access is approved
    // if (user.emailVerified === false) {
    //   return res.status(403).json({ ... pendingVerification ... });
    // }

    const token = createToken(user);
    const { password: _, ...safeUser } = user;

    console.log(`✅ User logged in: ${user.email}`);
    res.json({ token, user: safeUser });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Verify token (for frontend session check)
app.get('/api/auth/me', requireAuth, async (req, res) => {
  try {
    const user = await getUserByEmail(req.user.email);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const { password: _, verificationCode: _v, verificationExpires: _e, ...safeUser } = user;
    res.json(safeUser);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ── Email Verification Routes ──────────────────────────────────────────────────
app.post('/api/auth/verify', async (req, res) => {
  try {
    const { email, code } = req.body;
    if (!email || !code) {
      return res.status(400).json({ error: 'Email and verification code are required' });
    }

    const user = await getUserByEmail(email);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    if (user.emailVerified) {
      return res.status(400).json({ error: 'Email is already verified' });
    }

    // Check code and expiry
    if (user.verificationCode !== code) {
      return res.status(400).json({ error: 'Invalid verification code' });
    }
    if (new Date(user.verificationExpires) < new Date()) {
      return res.status(400).json({ error: 'Verification code has expired. Please request a new one.' });
    }

    // Mark verified and clean up
    user.emailVerified = true;
    delete user.verificationCode;
    delete user.verificationExpires;
    await saveUser(user);

    // Auto-login after verification
    const token = createToken(user);
    const { password: _, ...safeUser } = user;

    console.log(`✅ Email verified: ${user.email}`);
    res.json({ token, user: safeUser });
  } catch (error) {
    console.error('Verify error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/auth/resend-code', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    const user = await getUserByEmail(email);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    if (user.emailVerified) {
      return res.status(400).json({ error: 'Email is already verified' });
    }

    // Generate new code
    const newCode = generateVerificationCode();
    user.verificationCode = newCode;
    user.verificationExpires = new Date(Date.now() + 15 * 60 * 1000).toISOString();
    await saveUser(user);

    await sendVerificationEmail(user.email, newCode, user.name);

    res.json({ message: 'New verification code sent!' });
  } catch (error) {
    console.error('Resend code error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ── Health check ───────────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', bucket: BUCKET });
});

// ── Save job ───────────────────────────────────────────────────────────────────
app.post('/api/jobs', requireAuth, async (req, res) => {
  try {
    const job = req.body;
    if (!job.id) return res.status(400).json({ error: 'Job ID required' });

    job.userId = req.user.userId;
    job.techName = req.user.name;

    const key = `users/${req.user.userId}/jobs/${job.id}/metadata.json`;
    await s3.send(new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      Body: JSON.stringify(job, null, 2),
      ContentType: 'application/json',
    }));

    res.json({ success: true, key });
  } catch (error) {
    console.error('Save job error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ── Get single job ─────────────────────────────────────────────────────────────
app.get('/api/jobs/:jobId', requireAuth, async (req, res) => {
  try {
    const key = `users/${req.user.userId}/jobs/${req.params.jobId}/metadata.json`;
    const response = await s3.send(new GetObjectCommand({ Bucket: BUCKET, Key: key }));
    const body = await response.Body.transformToString();
    res.json(JSON.parse(body));
  } catch (error) {
    if (error.name === 'NoSuchKey') return res.status(404).json({ error: 'Job not found' });
    console.error('Get job error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ── List all jobs (user-scoped) ────────────────────────────────────────────────
app.get('/api/jobs', requireAuth, async (req, res) => {
  try {
    const prefix = `users/${req.user.userId}/jobs/`;
    const listResponse = await s3.send(new ListObjectsV2Command({
      Bucket: BUCKET,
      Prefix: prefix,
      Delimiter: '/',
    }));

    const jobFolders = (listResponse.CommonPrefixes || []).map(p =>
      p.Prefix.replace(prefix, '').replace('/', '')
    );

    // Fetch metadata for each job
    const jobs = [];
    for (const jobId of jobFolders) {
      try {
        const response = await s3.send(new GetObjectCommand({
          Bucket: BUCKET,
          Key: `users/${req.user.userId}/jobs/${jobId}/metadata.json`,
        }));
        const body = await response.Body.transformToString();
        jobs.push(JSON.parse(body));
      } catch (e) {
        console.warn(`Skipping job ${jobId}: ${e.message}`);
      }
    }

    // Sort by createdAt descending
    jobs.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
    res.json(jobs);
  } catch (error) {
    console.error('List jobs error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ── Update job status ──────────────────────────────────────────────────────────
app.patch('/api/jobs/:jobId/status', requireAuth, async (req, res) => {
  try {
    const { status } = req.body;
    const key = `users/${req.user.userId}/jobs/${req.params.jobId}/metadata.json`;

    // Get existing job
    const response = await s3.send(new GetObjectCommand({ Bucket: BUCKET, Key: key }));
    const body = await response.Body.transformToString();
    const job = JSON.parse(body);

    // Update status
    job.job_status = status;
    job.updated_at = new Date().toISOString();

    // Save back
    await s3.send(new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      Body: JSON.stringify(job, null, 2),
      ContentType: 'application/json',
    }));

    res.json({ success: true });
  } catch (error) {
    console.error('Update status error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ── Upload file (photo, PDF, etc) ──────────────────────────────────────────────
app.post('/api/jobs/:jobId/files', requireAuth, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

    const phase = req.body.phase || 'files';
    const fileName = `${Date.now()}-${req.file.originalname}`;
    const key = `users/${req.user.userId}/jobs/${req.params.jobId}/${phase}/${fileName}`;

    await s3.send(new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      Body: req.file.buffer,
      ContentType: req.file.mimetype,
    }));

    res.json({ success: true, key, fileName });
  } catch (error) {
    console.error('Upload file error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ── Delete job ─────────────────────────────────────────────────────────────────
app.delete('/api/jobs/:jobId', requireAuth, async (req, res) => {
  try {
    const key = `users/${req.user.userId}/jobs/${req.params.jobId}/metadata.json`;
    await s3.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: key }));
    res.json({ success: true });
  } catch (error) {
    console.error('Delete job error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ── Save feedback for fine-tuning ──────────────────────────────────────────────
app.post('/api/feedback', requireAuth, async (req, res) => {
  try {
    const feedback = req.body;
    const id = feedback.id || `fb-${Date.now()}`;
    feedback.id = id;
    feedback.userId = req.user.userId;
    feedback.timestamp = feedback.timestamp || new Date().toISOString();

    const key = `feedback/${id}.json`;
    await s3.send(new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      Body: JSON.stringify(feedback, null, 2),
      ContentType: 'application/json',
    }));

    console.log(`✅ Feedback saved: ${key}`);
    res.json({ success: true, id, key });
  } catch (error) {
    console.error('Save feedback error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ── List all feedback entries ──────────────────────────────────────────────────
app.get('/api/feedback', requireAuth, async (req, res) => {
  try {
    const list = await s3.send(new ListObjectsV2Command({
      Bucket: BUCKET,
      Prefix: 'feedback/',
      Delimiter: '/',
    }));

    const keys = (list.Contents || [])
      .map(obj => obj.Key)
      .filter(k => k.endsWith('.json'));

    const entries = [];
    for (const key of keys) {
      try {
        const response = await s3.send(new GetObjectCommand({ Bucket: BUCKET, Key: key }));
        const body = await response.Body.transformToString();
        entries.push(JSON.parse(body));
      } catch (e) {
        console.warn(`Skipping feedback ${key}: ${e.message}`);
      }
    }

    entries.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    res.json(entries);
  } catch (error) {
    console.error('List feedback error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ── Claude AI Proxy (keeps API key server-side) ────────────────────────────────
const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY || process.env.VITE_ANTHROPIC_API_KEY;
const HF_KEY = process.env.HUGGINGFACE_API_KEY;

app.post('/api/claude', requireAuth, async (req, res) => {
  try {
    if (!ANTHROPIC_KEY) return res.status(500).json({ error: 'Anthropic API key not configured on server' });

    const { messages, intake, isJson, maxTokens } = req.body;

    // Build system prompt server-side with semantic RAG (Pinecone + nomic) or keyword fallback
    let feedbackEntries = [];
    try {
      const list = await s3.send(new ListObjectsV2Command({ Bucket: BUCKET, Prefix: 'feedback/', Delimiter: '/' }));
      const keys = (list.Contents || []).map(o => o.Key).filter(k => k.endsWith('.json'));
      for (const key of keys.slice(0, 20)) {
        try {
          const r = await s3.send(new GetObjectCommand({ Bucket: BUCKET, Key: key }));
          feedbackEntries.push(JSON.parse(await r.Body.transformToString()));
        } catch { /* skip */ }
      }
    } catch { /* feedback is optional */ }

    const systemPrompt = await buildSystemPrompt(intake || {}, feedbackEntries);

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: process.env.CLAUDE_MODEL || 'claude-sonnet-4-20250514',
        max_tokens: maxTokens || 1500,
        system: systemPrompt,
        messages,
      }),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      return res.status(response.status).json({ error: err?.error?.message || `Claude API error ${response.status}` });
    }

    const data = await response.json();
    const text = data.content?.map(b => b.text || '').join('') || '';

    if (isJson) {
      try {
        const clean = text.replace(/```json|```/g, '').trim();
        return res.json({ result: JSON.parse(clean), type: 'json' });
      } catch {
        return res.status(422).json({ error: 'Failed to parse structured AI response. Try again.' });
      }
    }

    res.json({ result: text, type: 'text' });
  } catch (error) {
    console.error('Claude proxy error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ── Distil-Whisper transcription ───────────────────────────────────────────────
app.post('/api/transcribe', requireAuth, upload.single('audio'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No audio file provided' });
    if (!HF_KEY) return res.status(500).json({ error: 'HuggingFace API key not configured' });

    const response = await fetch(
      'https://api-inference.huggingface.co/models/distil-whisper/distil-large-v3',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${HF_KEY}`,
          'Content-Type': req.file.mimetype || 'audio/webm',
        },
        body: req.file.buffer,
      }
    );

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      return res.status(response.status).json({ error: err?.error || 'Transcription failed' });
    }

    const data = await response.json();
    res.json({ text: data.text?.trim() || '' });
  } catch (error) {
    console.error('Transcribe error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/claude/vision', requireAuth, async (req, res) => {
  try {
    if (!ANTHROPIC_KEY) return res.status(500).json({ error: 'Anthropic API key not configured on server' });

    const { imageBase64, mimeType, context } = req.body;

    const prompt = `You are an expert HVAC technician reviewing a field photo.
${context ? `Context: ${context}` : ''}

Analyze this photo and provide:
1. What component or label is shown
2. Key values visible (model number, serial, capacitor ratings, wire colors, fault codes, refrigerant type, etc.)
3. Condition assessment (any visible damage, burning, corrosion, frost, oil stains)
4. Relevant diagnostic information

Be specific and technical. Format as JSON:
{
  "component": "what this is",
  "extracted_values": { "key": "value" },
  "condition": "good/fair/poor",
  "condition_notes": "details",
  "diagnostic_relevance": "how this affects diagnosis",
  "recommended_action": "what to do based on what's visible"
}`;

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: process.env.CLAUDE_MODEL || 'claude-sonnet-4-20250514',
        max_tokens: 800,
        messages: [{
          role: 'user',
          content: [
            { type: 'image', source: { type: 'base64', media_type: mimeType, data: imageBase64 } },
            { type: 'text', text: prompt },
          ],
        }],
      }),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      return res.status(response.status).json({ error: err?.error?.message || `Vision API error ${response.status}` });
    }

    const data = await response.json();
    const text = data.content?.map(b => b.text || '').join('') || '';
    try {
      const clean = text.replace(/```json|```/g, '').trim();
      res.json(JSON.parse(clean));
    } catch {
      res.json({ component: 'Photo analyzed', diagnostic_relevance: text, extracted_values: {}, condition: 'unknown', condition_notes: '', recommended_action: '' });
    }
  } catch (error) {
    console.error('Vision proxy error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ── Production: serve frontend static files ────────────────────────────────────
const distPath = join(__dirname, 'dist');
if (IS_PROD && existsSync(distPath)) {
  app.use(express.static(distPath));
  app.get('{*path}', (req, res) => {
    if (!req.path.startsWith('/api')) {
      res.sendFile(join(distPath, 'index.html'));
    }
  });
  console.log('📦 Serving production frontend from /dist');
}

// ── Start server ───────────────────────────────────────────────────────────────
app.listen(PORT, '0.0.0.0', () => {
  console.log(`\n🚀 HVAC Pro API running on http://localhost:${PORT}`);
  console.log(`   Mode:      ${IS_PROD ? 'PRODUCTION' : 'DEVELOPMENT'}`);
  console.log(`   S3 Bucket: ${BUCKET}`);
  console.log(`   Region:    ${process.env.AWS_REGION || 'us-east-1'}`);
  console.log(`   Claude:    ${ANTHROPIC_KEY ? '✅ Key configured' : '❌ No API key'}\n`);
});
