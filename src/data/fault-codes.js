// Brand-specific fault/error codes for major HVAC manufacturers
// Used as RAG context injection into the AI system prompt

export const FAULT_CODES = {
  Carrier: {
    brand: 'Carrier',
    codes: [
      { code: '10', description: 'Indoor coil leaving air temperature sensor fault', action: 'Check sensor resistance at 77°F should be ~10kΩ. Inspect wiring harness for damage.' },
      { code: '11', description: 'Outdoor ambient temperature sensor fault', action: 'Verify sensor connection at control board. Replace if open or shorted.' },
      { code: '13', description: 'Outdoor coil temperature sensor fault', action: 'Check sensor at outdoor coil. Resistance should match NTC curve.' },
      { code: '14', description: 'Discharge temperature sensor fault', action: 'Inspect discharge line sensor near compressor outlet.' },
      { code: '21', description: 'High discharge temperature - compressor protection', action: 'Check refrigerant charge, airflow across condenser, and TXV operation. Compressor overheating.' },
      { code: '22', description: 'High pressure switch opened', action: 'Check: dirty condenser coil, refrigerant overcharge, non-condensables, failed condenser fan, high ambient.' },
      { code: '23', description: 'Low pressure switch opened', action: 'Check: low refrigerant charge, dirty evap coil, low airflow, restricted filter drier, TXV stuck closed.' },
      { code: '24', description: 'Compressor contactor stuck open or welded', action: 'Ohm across contactor contacts. Replace if failed.' },
      { code: '25', description: 'Crankcase heater fault', action: 'Check heater resistance. Should be 10-50Ω. Verify 24V control voltage present.' },
      { code: '31', description: 'Defrost thermostat stuck open', action: 'Check defrost thermostat continuity. Replace if open above 30°F.' },
      { code: '33', description: 'Outdoor fan motor fault', action: 'Check capacitor first (most common). Verify fan rotation correct. Check amp draw against nameplate.' },
      { code: '34', description: 'Freeze protection - indoor coil temperature too low', action: 'Check airflow (filter, blower speed). Low superheat may indicate TXV overfeeding or low load.' },
      { code: '41', description: 'Compressor high current trip', action: 'Check supply voltage, capacitor, refrigerant charge. Compressor may be failing.' },
      { code: '42', description: 'Compressor low current trip', action: 'Check contactor, wiring, capacitor. Compressor may have open winding.' },
      { code: '45', description: 'Control board failure', action: 'Replace control board. Verify 24V transformer output and all wiring before condemning board.' },
      { code: '46', description: 'Power brownout or low voltage lockout', action: 'Check supply voltage at disconnect. Should be +/-10% of nameplate voltage. Check for loose connections.' },
      { code: '54', description: 'Reversing valve stuck (heat pump)', action: 'Check 24V solenoid coil. Verify reversing valve shifts with power applied/removed. Replace valve if stuck.' },
      { code: '63', description: 'Modulating EEV fault', action: 'Check EEV stepper motor wiring. Verify EEV responds to commands from control board.' },
      { code: '91', description: 'Communication fault - indoor/outdoor', action: 'Check communication wire polarity and continuity. Verify no shorts to ground. Check board DIP switches.' },
    ],
  },
  Trane: {
    brand: 'Trane',
    codes: [
      { code: '1 flash', description: 'Normal operation', action: 'No action required.' },
      { code: '2 flash', description: 'High pressure lockout', action: 'Manual reset required. Check condenser coil, refrigerant charge, non-condensables, condenser fan.' },
      { code: '3 flash', description: 'Low pressure lockout', action: 'Check refrigerant charge, evap coil, filter, blower operation, TXV.' },
      { code: '4 flash', description: 'Compressor protection - locked rotor or high amps', action: 'Check capacitor, supply voltage, refrigerant charge. Compressor may be failing (check LRA vs RLA).' },
      { code: '5 flash', description: 'Freeze protection - evap coil', action: 'Low airflow or low refrigerant charge. Check filter, blower, and superheat readings.' },
      { code: '6 flash', description: 'High discharge temperature limit', action: 'Check refrigerant charge and condenser airflow. Discharge line temp should not exceed 225°F.' },
      { code: '7 flash', description: 'Communication failure', action: 'Check 24V communication bus between indoor/outdoor. Verify wire connections at both boards.' },
      { code: '8 flash', description: 'Defrost control fault', action: 'Check defrost thermostat and defrost board. Verify defrost initiates and terminates properly.' },
      { code: '9 flash', description: 'Outdoor fan fault', action: 'Verify fan motor rotation. Check capacitor (most common failure). Check amp draw.' },
      { code: 'E1', description: 'Indoor blower motor fault (ECM)', action: 'ECM motor fault. Check 24V control signal to ECM. Verify motor module is not overheating.' },
      { code: 'E2', description: 'Outdoor fan motor fault (ECM)', action: 'Check ECM module and motor. Verify control signals from board.' },
      { code: 'E3', description: 'Pressure sensor fault', action: 'Check suction and discharge pressure transducer wiring. Verify 5V reference voltage present.' },
      { code: 'E4', description: 'Outdoor coil sensor fault', action: 'Replace NTC temperature sensor on outdoor coil. Check wiring harness.' },
      { code: 'E5', description: 'Inverter/variable speed drive fault', action: 'Inverter overtemp or overvoltage. Check input voltage, ambient temp around inverter, and cooling fan.' },
    ],
  },
  Lennox: {
    brand: 'Lennox',
    codes: [
      { code: 'E1', description: 'Indoor coil temperature sensor fault', action: 'Check sensor resistance. At 77°F should read approximately 10kΩ for NTC type.' },
      { code: 'E2', description: 'Outdoor temperature sensor fault', action: 'Inspect sensor at outdoor unit control board connection.' },
      { code: 'E3', description: 'Discharge temperature sensor fault', action: 'High discharge temp protection. Check refrigerant, airflow across condenser.' },
      { code: 'E4', description: 'High pressure switch trip', action: 'Check for: dirty condenser, overcharge, non-condensables, failed condenser fan motor.' },
      { code: 'E5', description: 'Low pressure switch trip', action: 'Check refrigerant charge. Verify TXV operation. Check filter and evap coil for icing.' },
      { code: 'E6', description: 'Communication error', action: 'Verify communication wire connections. Check for 24V at both boards. Reset system.' },
      { code: 'E7', description: 'Demand defrost fault (heat pump)', action: 'Defrost board or sensor issue. Check defrost thermostat and timer operation.' },
      { code: 'E8', description: 'Outdoor fan motor overload', action: 'Check fan motor capacitor. Verify correct fan blade and rotation direction.' },
      { code: 'E9', description: 'Compressor overload trip', action: 'Check for locked rotor. Verify supply voltage. Check dual run capacitor.' },
      { code: 'EC', description: 'Control board memory fault', action: 'Power cycle system. If fault persists, replace control board.' },
      { code: 'EF', description: 'EEPROM fault', action: 'Replace control board. EEPROM data corrupted.' },
      { code: 'HP', description: 'High pressure alarm (informational)', action: 'Non-lockout alert. Monitor high side pressure. Check condenser condition.' },
    ],
  },
  York: {
    brand: 'York (Johnson Controls)',
    codes: [
      { code: '1-1', description: 'Internal control board fault', action: 'Reset power. If fault persists, replace control board.' },
      { code: '1-2', description: 'Indoor fan fault', action: 'Check indoor blower motor, capacitor, wiring. Verify correct speed tap selected.' },
      { code: '1-3', description: 'Outdoor fan fault', action: 'Check fan motor and capacitor. Verify correct rotation.' },
      { code: '2-1', description: 'High pressure switch trip', action: 'Check condenser coil cleanliness. Verify fan operation. Check refrigerant charge.' },
      { code: '2-2', description: 'Low pressure switch trip', action: 'Check refrigerant charge. Verify metering device operation. Check evap airflow.' },
      { code: '2-3', description: 'Freeze stat trip', action: 'Low airflow or refrigerant undercharge causing coil freeze. Check filter and blower.' },
      { code: '3-1', description: 'Compressor monitor fault - high amps', action: 'Check supply voltage and capacitor. Measure LRA vs nameplate.' },
      { code: '3-2', description: 'Discharge temperature limit trip', action: 'High discharge temp lockout. Check refrigerant, condenser cleanliness, TXV.' },
      { code: '3-3', description: 'Loss of charge / low pressure lockout', action: 'Refrigerant leak suspected. Check all connections with electronic leak detector.' },
      { code: '4-1', description: 'Defrost fault (heat pump)', action: 'Check defrost thermostat, outdoor coil sensor, defrost board.' },
      { code: '4-2', description: 'Reversing valve fault', action: 'Check 24V solenoid. Verify valve shifts. Check for refrigerant bypassing valve.' },
      { code: '5-1', description: 'Communication loss - thermostat', action: 'Check 24V transformer. Verify R, C, Y, G, W wire connections at both ends.' },
      { code: '5-2', description: 'Communication loss - outdoor unit', action: 'Inspect communication wiring between indoor and outdoor units.' },
    ],
  },
  Mitsubishi: {
    brand: 'Mitsubishi Electric',
    codes: [
      { code: 'E0', description: 'Remote controller signal error', action: 'Check wiring between remote and indoor unit. Verify polarity of A/B communication wires.' },
      { code: 'E1', description: 'Indoor/outdoor communication error', action: 'Check refrigerant piping length. Verify communication wire from indoor to outdoor.' },
      { code: 'E3', description: 'High pressure protection', action: 'Check outdoor unit fan, refrigerant charge, condenser coil cleanliness.' },
      { code: 'E4', description: 'Low pressure protection', action: 'Check refrigerant charge. Verify indoor unit airflow. Check for icing on indoor coil.' },
      { code: 'E6', description: 'Compressor overcurrent protection', action: 'Check supply voltage, capacitor (if applicable), refrigerant charge.' },
      { code: 'E7', description: 'Outdoor fan motor error', action: 'Check outdoor fan motor. Verify rotation. Inspect for obstructions.' },
      { code: 'E8', description: 'Input current protection', action: 'Check supply voltage. Verify wiring gauge adequate for amp draw.' },
      { code: 'E9', description: 'Inverter compressor startup failure', action: 'Check supply voltage. Verify refrigerant charge. Inverter module may be faulty.' },
      { code: 'F1', description: 'Indoor coil temperature sensor fault', action: 'Check thermistor connections on indoor PCB. Replace sensor if resistance out of spec.' },
      { code: 'F2', description: 'Outdoor coil sensor fault', action: 'Inspect outdoor coil thermistor and wiring harness.' },
      { code: 'F3', description: 'Discharge temperature sensor fault', action: 'Check discharge pipe sensor near compressor.' },
      { code: 'P8', description: 'Inverter module fault / IPM protection', action: 'Power down. Check for shorted compressor windings. Inspect IPM board for burn marks.' },
    ],
  },
  Daikin: {
    brand: 'Daikin',
    codes: [
      { code: 'A1', description: 'Indoor PCB fault', action: 'Replace indoor control board.' },
      { code: 'A3', description: 'Indoor drain sensor or float switch fault', action: 'Check condensate pan level. Clean drain line. Inspect float switch operation.' },
      { code: 'A5', description: 'Indoor freeze protection', action: 'Check filter, blower, and refrigerant charge. Ice on evap coil.' },
      { code: 'A6', description: 'Indoor fan motor fault', action: 'Check indoor fan motor and wiring. Verify motor runs freely.' },
      { code: 'C4', description: 'Thermistor fault - indoor heat exchanger', action: 'Replace indoor coil thermistor. Check harness for damage.' },
      { code: 'E1', description: 'Outdoor PCB fault', action: 'Replace outdoor control board.' },
      { code: 'E3', description: 'High pressure protection', action: 'Check condenser fan, coil cleanliness, refrigerant charge.' },
      { code: 'E4', description: 'Low pressure protection', action: 'Check refrigerant charge and metering device.' },
      { code: 'E5', description: 'Compressor overcurrent or OL trip', action: 'Check supply voltage. Measure compressor amp draw against nameplate.' },
      { code: 'E7', description: 'Outdoor fan motor fault', action: 'Inspect outdoor fan. Check motor and capacitor.' },
      { code: 'E9', description: 'Electronic expansion valve fault', action: 'Check EEV stepper motor and wiring. Verify EEV fully closes and opens on command.' },
      { code: 'H6', description: 'Indoor fan motor position sensor fault', action: 'DC motor position sensor failure. Replace fan motor assembly.' },
      { code: 'L4', description: 'Inverter radiator fin overheat', action: 'Check inverter fin heat sink. Clean dust. Ensure ventilation around outdoor unit.' },
      { code: 'P4', description: 'Inverter compressor overcurrent', action: 'Check compressor winding resistance. Verify refrigerant charge. Inspect IPM module.' },
    ],
  },
};

// Returns fault code context string for injection into AI system prompt
export function getFaultCodeContext(brand) {
  const entry = FAULT_CODES[brand];
  if (!entry) return '';

  const lines = entry.codes.map(c =>
    `  Code ${c.code}: ${c.description} → ${c.action}`
  ).join('\n');

  return `\n${brand} FAULT CODES:\n${lines}\n`;
}

// Lookup a specific code for a brand
export function lookupFaultCode(brand, code) {
  const entry = FAULT_CODES[brand];
  if (!entry) return null;
  const normalized = code.trim().toUpperCase();
  return entry.codes.find(c => c.code.toUpperCase() === normalized) || null;
}

export const SUPPORTED_BRANDS = Object.keys(FAULT_CODES);
