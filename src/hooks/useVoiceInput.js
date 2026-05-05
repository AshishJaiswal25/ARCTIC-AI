import { useState, useRef, useCallback } from 'react';

// Numeric field patterns for HVAC readings - extracts values from speech
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

// Extracts number from text like "suction pressure 118" or "amps twelve"
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
      const regex = new RegExp(`${pattern}\\s+([\\w\\s\\.]+?)(?:\\s+(?:${FIELD_PATTERNS.map(f => f.patterns[0]).join('|')})|$)`, 'i');
      const match = lower.match(regex);
      if (match) {
        const num = wordToNum(match[1].trim());
        if (num !== null) {
          updates[field] = String(num);
          break;
        }
      }
    }
  }

  return updates;
}

export function useVoiceInput() {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState('');
  const recognitionRef = useRef(null);

  const isSupported = typeof window !== 'undefined' &&
    ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);

  // Listen for free text (chat input)
  const startListening = useCallback((onResult) => {
    if (!isSupported) {
      setError('Voice input not supported in this browser. Use Chrome or Edge.');
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognitionRef.current = recognition;

    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onstart = () => { setIsListening(true); setError(''); setTranscript(''); };

    recognition.onresult = (event) => {
      const text = Array.from(event.results)
        .map(r => r[0].transcript)
        .join('');
      setTranscript(text);
      if (event.results[event.results.length - 1].isFinal) {
        onResult?.(text);
      }
    };

    recognition.onerror = (event) => {
      setError(`Voice error: ${event.error}`);
      setIsListening(false);
    };

    recognition.onend = () => { setIsListening(false); };

    recognition.start();
  }, [isSupported]);

  // Listen for readings dictation - parses values into readings object
  const startReadingsDictation = useCallback((onReadingsUpdate) => {
    if (!isSupported) {
      setError('Voice input not supported in this browser.');
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognitionRef.current = recognition;

    recognition.continuous = true;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onstart = () => { setIsListening(true); setError(''); };

    recognition.onresult = (event) => {
      const text = event.results[event.results.length - 1][0].transcript;
      setTranscript(prev => prev + ' ' + text);
      const updates = parseReadingsFromTranscript(text);
      if (Object.keys(updates).length > 0) {
        onReadingsUpdate?.(updates);
      }
    };

    recognition.onerror = (event) => {
      if (event.error !== 'no-speech') setError(`Voice error: ${event.error}`);
      setIsListening(false);
    };

    recognition.onend = () => { setIsListening(false); };

    recognition.start();
  }, [isSupported]);

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop();
    setIsListening(false);
  }, []);

  return {
    isListening,
    transcript,
    error,
    isSupported,
    startListening,
    startReadingsDictation,
    stopListening,
  };
}
