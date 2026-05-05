// Mock parts catalog - realistic HVAC parts with Grainger-style data
// In production, replace lookupParts() with real Grainger or Ferguson API calls

export const MOCK_PARTS_DB = [
  // Capacitors
  { sku: 'CAP-35-5-370', name: 'Dual Run Capacitor 35+5 MFD 370V', brand: 'Titan Pro', price: 18.47, category: 'Capacitors', unit: 'EA', inStock: true, leadTime: 'Same day' },
  { sku: 'CAP-45-5-370', name: 'Dual Run Capacitor 45+5 MFD 370V', brand: 'Titan Pro', price: 19.83, category: 'Capacitors', unit: 'EA', inStock: true, leadTime: 'Same day' },
  { sku: 'CAP-55-5-440', name: 'Dual Run Capacitor 55+5 MFD 440V', brand: 'Titan Pro', price: 22.15, category: 'Capacitors', unit: 'EA', inStock: true, leadTime: 'Same day' },
  { sku: 'CAP-40-5-370', name: 'Dual Run Capacitor 40+5 MFD 370V', brand: 'Titan Pro', price: 19.12, category: 'Capacitors', unit: 'EA', inStock: true, leadTime: 'Same day' },
  { sku: 'CAP-50-7-440', name: 'Dual Run Capacitor 50+7.5 MFD 440V', brand: 'Titan Pro', price: 23.40, category: 'Capacitors', unit: 'EA', inStock: true, leadTime: 'Same day' },

  // Contactors
  { sku: 'CONT-2P-30A', name: 'Contactor 2-Pole 30 Amp 24V Coil', brand: 'Honeywell', price: 14.72, category: 'Contactors', unit: 'EA', inStock: true, leadTime: 'Same day' },
  { sku: 'CONT-2P-40A', name: 'Contactor 2-Pole 40 Amp 24V Coil', brand: 'Honeywell', price: 16.38, category: 'Contactors', unit: 'EA', inStock: true, leadTime: 'Same day' },
  { sku: 'CONT-3P-30A', name: 'Contactor 3-Pole 30 Amp 24V Coil', brand: 'Honeywell', price: 28.90, category: 'Contactors', unit: 'EA', inStock: true, leadTime: 'Same day' },

  // TXV / Metering
  { sku: 'TXV-R410-2T', name: 'TXV Expansion Valve R-410A 2-Ton', brand: 'Sporlan', price: 87.50, category: 'Metering Devices', unit: 'EA', inStock: true, leadTime: '1-2 days' },
  { sku: 'TXV-R410-3T', name: 'TXV Expansion Valve R-410A 3-Ton', brand: 'Sporlan', price: 94.25, category: 'Metering Devices', unit: 'EA', inStock: true, leadTime: '1-2 days' },
  { sku: 'TXV-R410-4T', name: 'TXV Expansion Valve R-410A 4-Ton', brand: 'Sporlan', price: 102.80, category: 'Metering Devices', unit: 'EA', inStock: true, leadTime: '1-2 days' },
  { sku: 'TXV-R22-2T', name: 'TXV Expansion Valve R-22 2-Ton', brand: 'Sporlan', price: 79.40, category: 'Metering Devices', unit: 'EA', inStock: false, leadTime: '3-5 days' },

  // Filter Driers
  { sku: 'FD-083-S', name: 'Filter Drier 1/4" Flare Hermetic', brand: 'Emerson', price: 8.92, category: 'Filter Driers', unit: 'EA', inStock: true, leadTime: 'Same day' },
  { sku: 'FD-163-S', name: 'Filter Drier 3/8" Flare Hermetic', brand: 'Emerson', price: 11.47, category: 'Filter Driers', unit: 'EA', inStock: true, leadTime: 'Same day' },
  { sku: 'FD-413-S', name: 'Filter Drier 1/2" Sweat Hermetic', brand: 'Emerson', price: 14.20, category: 'Filter Driers', unit: 'EA', inStock: true, leadTime: 'Same day' },

  // Refrigerant
  { sku: 'REF-R410A-25', name: 'R-410A Refrigerant 25 lb Cylinder', brand: 'Chemours', price: 124.00, category: 'Refrigerant', unit: 'CYL', inStock: true, leadTime: 'Same day' },
  { sku: 'REF-R22-30', name: 'R-22 Refrigerant 30 lb Cylinder', brand: 'Chemours', price: 398.00, category: 'Refrigerant', unit: 'CYL', inStock: true, leadTime: '1 day' },
  { sku: 'REF-R32-11', name: 'R-32 Refrigerant 11 lb Cylinder', brand: 'Chemours', price: 67.50, category: 'Refrigerant', unit: 'CYL', inStock: true, leadTime: 'Same day' },

  // Fan Motors
  { sku: 'FAN-1/4HP-825', name: 'Condenser Fan Motor 1/4 HP 825 RPM', brand: 'AO Smith', price: 98.40, category: 'Fan Motors', unit: 'EA', inStock: true, leadTime: 'Same day' },
  { sku: 'FAN-1/3HP-1075', name: 'Condenser Fan Motor 1/3 HP 1075 RPM', brand: 'AO Smith', price: 112.75, category: 'Fan Motors', unit: 'EA', inStock: true, leadTime: 'Same day' },
  { sku: 'FAN-1/2HP-1075', name: 'Condenser Fan Motor 1/2 HP 1075 RPM', brand: 'AO Smith', price: 134.20, category: 'Fan Motors', unit: 'EA', inStock: true, leadTime: '1 day' },
  { sku: 'BLFAN-3/4HP', name: 'Blower Motor 3/4 HP 4-Speed PSC', brand: 'AO Smith', price: 187.50, category: 'Fan Motors', unit: 'EA', inStock: true, leadTime: '1-2 days' },

  // Pressure Switches
  { sku: 'PS-HP-600', name: 'High Pressure Switch 600 PSI Cutout', brand: 'Alco', price: 24.80, category: 'Pressure Switches', unit: 'EA', inStock: true, leadTime: 'Same day' },
  { sku: 'PS-LP-20', name: 'Low Pressure Switch 20 PSI Cutout', brand: 'Alco', price: 22.40, category: 'Pressure Switches', unit: 'EA', inStock: true, leadTime: 'Same day' },

  // Transformers
  { sku: 'XFMR-40VA', name: 'Control Transformer 40VA 240/24V', brand: 'Honeywell', price: 28.60, category: 'Transformers', unit: 'EA', inStock: true, leadTime: 'Same day' },
  { sku: 'XFMR-75VA', name: 'Control Transformer 75VA 240/24V', brand: 'Honeywell', price: 42.30, category: 'Transformers', unit: 'EA', inStock: true, leadTime: 'Same day' },

  // Reversing Valves
  { sku: 'RV-R410-3T', name: 'Reversing Valve R-410A 3-Ton with Coil', brand: 'Sporlan', price: 187.00, category: 'Reversing Valves', unit: 'EA', inStock: false, leadTime: '2-3 days' },
  { sku: 'RV-COIL-24V', name: 'Reversing Valve Solenoid Coil 24V', brand: 'Sporlan', price: 24.50, category: 'Reversing Valves', unit: 'EA', inStock: true, leadTime: 'Same day' },

  // Defrost Boards
  { sku: 'DEFROST-UNIV', name: 'Universal Defrost Control Board', brand: 'ICM Controls', price: 68.40, category: 'Control Boards', unit: 'EA', inStock: true, leadTime: 'Same day' },
];

// Keyword-to-category mapping for smart search
const KEYWORD_MAP = {
  capacitor: ['Capacitors'],
  cap: ['Capacitors'],
  contactor: ['Contactors'],
  txv: ['Metering Devices'],
  expansion: ['Metering Devices'],
  metering: ['Metering Devices'],
  drier: ['Filter Driers'],
  filter: ['Filter Driers'],
  refrigerant: ['Refrigerant'],
  'r-410a': ['Refrigerant'],
  'r-22': ['Refrigerant'],
  fan: ['Fan Motors'],
  motor: ['Fan Motors'],
  blower: ['Fan Motors'],
  pressure: ['Pressure Switches'],
  switch: ['Pressure Switches'],
  transformer: ['Transformers'],
  reversing: ['Reversing Valves'],
  defrost: ['Control Boards'],
  board: ['Control Boards'],
};

export async function lookupParts(partNames) {
  const provider = import.meta.env.VITE_PARTS_PROVIDER || 'demo';

  if (provider === 'demo') {
    return mockLookup(partNames);
  }

  if (provider === 'grainger') {
    return graingerLookup(partNames);
  }

  return mockLookup(partNames);
}

function mockLookup(partNames) {
  const results = [];
  const seen = new Set();

  for (const partName of partNames) {
    const lower = partName.toLowerCase();
    const matchedCategories = new Set();

    for (const [keyword, cats] of Object.entries(KEYWORD_MAP)) {
      if (lower.includes(keyword)) {
        cats.forEach(c => matchedCategories.add(c));
      }
    }

    const matches = MOCK_PARTS_DB.filter(p => {
      if (matchedCategories.size > 0 && matchedCategories.has(p.category)) return true;
      return p.name.toLowerCase().includes(lower) || p.category.toLowerCase().includes(lower);
    });

    for (const match of matches.slice(0, 3)) {
      if (!seen.has(match.sku)) {
        seen.add(match.sku);
        results.push({ ...match, searchTerm: partName });
      }
    }
  }

  return results;
}

// Grainger API integration (requires account setup)
async function graingerLookup(partNames) {
  const apiKey = import.meta.env.VITE_GRAINGER_API_KEY;
  const account = import.meta.env.VITE_GRAINGER_ACCOUNT;
  const results = [];

  for (const part of partNames) {
    try {
      const res = await fetch(
        `https://api.grainger.com/v1/products/search?q=${encodeURIComponent(part)}&limit=3`,
        { headers: { 'Authorization': `Bearer ${apiKey}`, 'Account': account } }
      );
      const data = await res.json();
      if (data.products) {
        results.push(...data.products.map(p => ({
          sku: p.itemNumber,
          name: p.description,
          brand: p.brand,
          price: p.price?.unitPrice,
          category: p.category,
          unit: p.unitOfMeasure,
          inStock: p.availability === 'IN_STOCK',
          leadTime: p.availability === 'IN_STOCK' ? 'Same day' : '1-3 days',
          searchTerm: part,
        })));
      }
    } catch (e) {
      console.warn('Grainger API error for', part, e);
    }
  }

  return results;
}
