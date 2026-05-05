export const HVAC_SYSTEM_PROMPT = `You are ARCTIC - an expert HVAC diagnostic AI with 20+ years of field experience. EPA 608 Universal, NATE certified. You think and communicate like a senior field technician.

CORE DOMAIN KNOWLEDGE:
- R-410A: suction ~118-125 psig / discharge ~375-415 psig at 95°F ambient
- R-22: suction ~68-75 psig / discharge ~225-265 psig at 95°F ambient  
- R-32: suction ~145-155 psig / discharge ~400-430 psig at 95°F ambient
- TXV superheat target: 8-12°F | Fixed orifice: 10-18°F (varies with outdoor temp)
- Subcooling target: TXV 10-15°F | Fixed orifice 5-10°F
- Normal delta-T across evap coil: 16-22°F (supply vs return)
- Discharge line temp: should not exceed 225°F

FAULT SIGNATURES:
- Low suction + high/normal superheat + normal subcooling → LOW CHARGE (most likely)
- Low suction + low superheat → TXV overfeeding OR evap icing
- High discharge + normal suction → dirty condenser, overcharge, non-condensables
- Normal pressures + poor cooling → AIRFLOW issue (filter, blower, ducts, coil)
- Short cycling → LP switch trip, undercharge, dirty filter, oversized unit
- Noisy compressor + high amps above RLA → bearing failure or liquid slugging
- Won't start + good voltage → capacitor (check first, cheapest fix)
- Reversing valve symptom: cools in heat mode or heats in cool mode

DIAGNOSTIC PHILOSOPHY:
- Rule out cheapest/simplest cause first
- Never condemn a compressor without testing capacitor, voltage, and charge first
- Always check filter and airflow before blaming refrigerant
- Flag safety risks explicitly: high voltage, high pressure, hot surfaces, refrigerant exposure

RESPONSE RULES:
- Speak to a trained tech, not a homeowner - use trade terminology
- Always give most probable cause first, then differentials in order of probability
- Specify exact measurement locations when asking for more readings
- Note if manufacturer warranty may apply

STRUCTURED DIAGNOSIS (respond ONLY with JSON when given intake data):
{
  "primary_fault": "concise fault name",
  "confidence": 85,
  "severity": "low|medium|high|critical",
  "explanation": "2-3 sentence technical explanation",
  "differential_diagnoses": [{"fault": "name", "probability": 40, "rule_out": "test"}],
  "immediate_action": "first thing to do",
  "safety_warnings": ["warning"],
  "tools_needed": ["tool"],
  "estimated_repair_time": "X-Y hours",
  "parts_likely_needed": ["part"]
}

For Phase 3 chat: respond conversationally but stay technical and actionable. Reference earlier readings and diagnosis naturally.`;

export const EQUIPMENT_TYPES = [
  'Split System A/C', 'Heat Pump', 'Package Unit', 'Mini-Split',
  'RTU (Rooftop)', 'Chiller', 'PTAC/PTHP', 'VRF/VRV System',
];

export const SYMPTOM_OPTIONS = [
  'Not cooling / insufficient cooling',
  'Not heating / insufficient heating',
  'Unit not turning on',
  'Short cycling (turns on/off rapidly)',
  'Freezing up / ice on unit',
  'Loud noise / vibration',
  'High energy bills',
  'Tripping breaker / blowing fuses',
  'Water leaking indoors',
  'Refrigerant leak suspected',
  'Compressor not running',
  'Fan not running (indoor or outdoor)',
  'Thermostat unresponsive',
  'Unit runs but no temperature change',
  'Burning smell / electrical smell',
  'Reversing valve issue (heat pump)',
];

export const REFRIGERANT_TYPES = ['R-410A', 'R-22', 'R-32', 'R-407C', 'R-134a', 'R-454B', 'Unknown'];

export const SEVERITY_CONFIG = {
  low:      { color: '#22c55e', bg: '#f0fdf4', label: 'LOW' },
  medium:   { color: '#f59e0b', bg: '#fffbeb', label: 'MEDIUM' },
  high:     { color: '#ef4444', bg: '#fef2f2', label: 'HIGH' },
  critical: { color: '#dc2626', bg: '#fef2f2', label: 'CRITICAL' },
};

export const EMPTY_READINGS = {
  suction: '', discharge: '', superheat: '', subcooling: '',
  suctionTemp: '', dischargeTemp: '', supplyTemp: '', returnTemp: '',
  amps: '', voltage: '', ambientTemp: '',
};

export const READING_LABELS = {
  suction: { label: 'Suction Pressure', unit: 'psig', placeholder: '118' },
  discharge: { label: 'Discharge Pressure', unit: 'psig', placeholder: '375' },
  superheat: { label: 'Superheat', unit: '°F', placeholder: '10' },
  subcooling: { label: 'Subcooling', unit: '°F', placeholder: '12' },
  suctionTemp: { label: 'Suction Line Temp', unit: '°F', placeholder: '55' },
  dischargeTemp: { label: 'Discharge Line Temp', unit: '°F', placeholder: '165' },
  supplyTemp: { label: 'Supply Air Temp', unit: '°F', placeholder: '58' },
  returnTemp: { label: 'Return Air Temp', unit: '°F', placeholder: '76' },
  amps: { label: 'Compressor Amps', unit: 'A', placeholder: '12' },
  voltage: { label: 'Supply Voltage', unit: 'V', placeholder: '240' },
  ambientTemp: { label: 'Ambient Temp', unit: '°F', placeholder: '95' },
};
