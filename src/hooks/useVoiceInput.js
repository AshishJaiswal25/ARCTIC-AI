import { useState, useRef, useCallback } from 'react';
import { API_BASE, authHeaders } from '../api.js';

// ── HVAC readings field patterns ───────────────────────────────────────────────
const FIELD_PATTERNS = [
  { field: 'suction',      patterns: ['suction pressure', 'suction', 'low side', 'low pressure'] },
  { field: 'discharge',    patterns: ['discharge pressure', 'discharge', 'high side', 'high pressure'] },
  { field: 'superheat',    patterns: ['superheat', 'super heat'] },
  { field: 'subcooling',   patterns: ['subcooling', 'sub cooling', 'subcool'] },
  { field: 'suctionTemp',  patterns: ['suction line temp', 'suction temperature', 'suction temp'] },
  { field: 'dischargeTemp',patterns: ['discharge line temp', 'discharge temperature', 'discharge temp'] },
  { field: 'supplyTemp',   patterns: ['supply air', 'supply temp', 'supply air temperature'] },
  { field: 'returnTemp',   patterns: ['return air', 'return temp', 'return air temperature'] },
  { field: 'amps',         patterns: ['amps', 'amperage', 'amp draw', 'current'] },
  { field: 'voltage',      patterns: ['voltage', 'volts'] },
  { field: 'ambientTemp',  patterns: ['ambient', 'outdoor temp', 'outside temp'] },
];

const WORD_NUMBERS = {
  zero:0, one:1, two:2, three:3, four:4, five:5, six:6, seven:7, eight:8, nine:9,
  ten:10, eleven:11, twelve:12, thirteen:13, fourteen:14, fifteen:15,
  sixteen:16, seventeen:17, eighteen:18, nineteen:19, twenty:20,
  thirty:30, forty:40, fifty:50, sixty:60, seventy:70, eighty:80, ninety:90,
  hundred:100,
};

function wordToNum(text) {
  let num = parseFloat(text.replace(/,/g, ''));
  if (!isNaN(num)) return num;
  let total = 0, current = 0;
  for (const word of text.toLowerCase().split(' ')) {
    const v = WORD_NUMBERS[word];
    if (v !== undefined) {
      if (v === 100) current *= 100;
      else current += v;
    } else if (word === 'thousand') {
      total += current * 1000; current = 0;
    }
  }
  return total + current || null;
}

function parseReadingsFromTranscript(transcript) {
  const lower = transcript.toLowerCase();
  const updates = {};
  for (const { field, patterns } of FIELD_PATTERNS) {
    for (const pattern of patterns) {
      const regex = new RegExp(
        `${pattern}\\s+([\\w\\s\\.]+?)(?:\\s+(?:${FIELD_PATTERNS.map(f => f.patterns[0]).join('|')})|$)`,
        'i'
      );
      const match = lower.match(regex);
      if (match) {
        const num = wordToNum(match[1].trim());
        if (num !== null) { updates[field] = String(num); break; }
      }
    }
  }
  return updates;
}

// ── Transcribe audio blob via Distil-Whisper backend ──────────────────────────
async function transcribeAudio(blob) {
  const formData = new FormData();
  formData.append('audio', blob, 'recording.webm');

  const response = await fetch(`${API_BASE}/api/transcribe`, {
    method: 'POST',
    headers: authHeaders(),
    body: formData,
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err?.error || 'Transcription failed');
  }

  const data = await response.json();
  return data.text || '';
}

// ── Main hook ─────────────────────────────────────────────────────────────────
export function useVoiceInput() {
  const [isListening, setIsListening] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState('');
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const streamRef = useRef(null);

  const isSupported = typeof window !== 'undefined' &&
    typeof MediaRecorder !== 'undefined' &&
    !!navigator.mediaDevices?.getUserMedia;

  const stopStream = () => {
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
  };

  // Free-text mode — used in chat
  const startListening = useCallback(async (onResult) => {
    setError('');
    setTranscript('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = async () => {
        stopStream();
        setIsListening(false);
        setIsTranscribing(true);
        try {
          const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
          const text = await transcribeAudio(blob);
          setTranscript(text);
          onResult?.(text);
        } catch (err) {
          setError(err.message);
        } finally {
          setIsTranscribing(false);
        }
      };

      mediaRecorder.start();
      setIsListening(true);
    } catch (err) {
      setError('Microphone access denied: ' + err.message);
    }
  }, []);

  // Readings dictation mode — parses transcript into readings fields
  const startReadingsDictation = useCallback(async (onReadingsUpdate) => {
    setError('');
    setTranscript('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = async () => {
        stopStream();
        setIsListening(false);
        setIsTranscribing(true);
        try {
          const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
          const text = await transcribeAudio(blob);
          setTranscript(text);
          const updates = parseReadingsFromTranscript(text);
          if (Object.keys(updates).length > 0) onReadingsUpdate?.(updates);
        } catch (err) {
          setError(err.message);
        } finally {
          setIsTranscribing(false);
        }
      };

      mediaRecorder.start();
      setIsListening(true);
    } catch (err) {
      setError('Microphone access denied: ' + err.message);
    }
  }, []);

  const stopListening = useCallback(() => {
    if (mediaRecorderRef.current?.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
  }, []);

  return {
    isListening,
    isTranscribing,
    transcript,
    error,
    isSupported,
    startListening,
    startReadingsDictation,
    stopListening,
  };
}
