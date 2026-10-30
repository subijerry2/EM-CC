import { Corridor, TrafficSignal, AmbulanceUnit, EmergencyTrip, SignalInteractionLog, RouteOption, ReportedIncident } from '../types';

export const INITIAL_INCIDENTS: ReportedIncident[] = [
  {
    id: 'inc-901',
    callNumber: 'CAD-2026110',
    unitId: 'unit-med-04',
    unitCallSign: 'MEDIC-04',
    driverName: 'Officer Marcus Cole',
    type: 'Intersection Gridlock / Dense Civilian Queue',
    severity: 'major',
    description: 'Blocked right turn pocket and bus breakdown spilling across 8th St interchange. Stoppage exceed 90 seconds.',
    locationName: 'Central Blvd & 8th St Interchange',
    latitude: 37.7731,
    longitude: -122.4120,
    associatedSignalId: 'sig-103',
    corridorId: 'corridor-alpha',
    timestamp: Date.now() - 15 * 60 * 1000,
    status: 'active',
    delayPenaltySec: 135
  },
  {
    id: 'inc-902',
    callNumber: 'CAD-2026095',
    unitId: 'unit-res-09',
    unitCallSign: 'RESCUE-09',
    driverName: 'Paramedic Sarah Jenkins',
    type: 'Signal Stuck Red / Hardware Malfunction',
    severity: 'critical',
    description: 'Legacy electromechanical drum controller stuck on red cycle during heavy cross-traffic flow.',
    locationName: 'Market St & 11th Street',
    latitude: 37.7760,
    longitude: -122.4260,
    associatedSignalId: 'sig-301',
    corridorId: 'corridor-charlie',
    timestamp: Date.now() - 140 * 60 * 1000,
    status: 'investigating',
    delayPenaltySec: 180
  },
  {
    id: 'inc-903',
    callNumber: 'CAD-2026082',
    unitId: 'unit-amb-12',
    unitCallSign: 'AMBULANCE-12',
    driverName: 'Driver Alex Rivera',
    type: 'Opticom / V2X Sensor Obstructed',
    severity: 'moderate',
    description: 'Optical receiver lens obscured by construction scaffold netting. Preemption did not trigger automatically.',
    locationName: 'Central Blvd & 6th St Gateway',
    latitude: 37.7710,
    longitude: -122.4060,
    associatedSignalId: 'sig-104',
    corridorId: 'corridor-alpha',
    timestamp: Date.now() - 24 * 3600 * 1000,
    status: 'resolved',
    delayPenaltySec: 45,
    resolvedAt: Date.now() - 20 * 3600 * 1000,
    resolvedBy: 'Traffic Signal Maintenance Crew #3'
  }
];

export const METRO_CORRIDORS: Corridor[] = [
  {
    id: 'corridor-alpha',
    name: 'Spine Alpha (Central Blvd)',
    code: 'SPINE-A',
    description: 'Direct 4.2 km arterial connecting North EMS Station 4 to General Trauma Hospital.',
    totalSignals: 6,
    priorityEnabledSignals: 5,
    reliabilityScore: 84,
    lengthKm: 4.2,
    avgResponseSpeedKmH: 48,
    historicalTripCount: 128,
    color: '#06b6d4',
    waypoints: [
      [37.7790, -122.4280],
      [37.7772, -122.4230],
      [37.7750, -122.4180],
      [37.7731, -122.4120],
      [37.7710, -122.4060],
      [37.7685, -122.4010]
    ]
  },
  {
    id: 'corridor-bravo',
    name: 'Parkway Bravo (River Bypass)',
    code: 'PKWY-B',
    description: 'Higher speed expressway bypass around high-density commercial district.',
    totalSignals: 4,
    priorityEnabledSignals: 2,
    reliabilityScore: 68,
    lengthKm: 5.4,
    avgResponseSpeedKmH: 54,
    historicalTripCount: 94,
    color: '#3b82f6',
    waypoints: [
      [37.7790, -122.4280],
      [37.7830, -122.4250],
      [37.7810, -122.4150],
      [37.7760, -122.4070],
      [37.7685, -122.4010]
    ]
  },
  {
    id: 'corridor-charlie',
    name: 'Metro Link Charlie (Commercial Cross)',
    code: 'LINK-C',
    description: 'High-density downtown sector with legacy uncoordinated signal systems.',
    totalSignals: 5,
    priorityEnabledSignals: 1,
    reliabilityScore: 42,
    lengthKm: 3.8,
    avgResponseSpeedKmH: 32,
    historicalTripCount: 86,
    color: '#f43f5e',
    waypoints: [
      [37.7790, -122.4280],
      [37.7760, -122.4260],
      [37.7740, -122.4210],
      [37.7715, -122.4140],
      [37.7690, -122.4080],
      [37.7685, -122.4010]
    ]
  }
];

export const INITIAL_TRAFFIC_SIGNALS: TrafficSignal[] = [
  {
    id: 'sig-101',
    name: 'Central Blvd & Van Ness Ave',
    code: 'INT-101',
    latitude: 37.7772,
    longitude: -122.4230,
    corridorId: 'corridor-alpha',
    corridorName: 'Spine Alpha (Central Blvd)',
    priorityCapable: true,
    controllerType: 'NEMA TS2',
    currentPhase: 'GREEN',
    phaseTimeRemainingSec: 24,
    cycleTimeSec: 90,
    avgStoppageSec: 6.2,
    failureRatePct: 8.5,
    totalInteractions: 142,
    speedLimitKmH: 50,
    notes: 'Fiber-connected NEMA TS2 controller with active V2X preemption loop.'
  },
  {
    id: 'sig-102',
    name: 'Central Blvd & 10th St',
    code: 'INT-102',
    latitude: 37.7750,
    longitude: -122.4180,
    corridorId: 'corridor-alpha',
    corridorName: 'Spine Alpha (Central Blvd)',
    priorityCapable: true,
    controllerType: 'NEMA TS2',
    currentPhase: 'YELLOW',
    phaseTimeRemainingSec: 4,
    cycleTimeSec: 90,
    avgStoppageSec: 9.8,
    failureRatePct: 14.2,
    totalInteractions: 138,
    speedLimitKmH: 50,
    notes: 'Preemption clears queue within 7 seconds of notification.'
  },
  {
    id: 'sig-103',
    name: 'Central Blvd & 8th St Interchange',
    code: 'INT-103',
    latitude: 37.7731,
    longitude: -122.4120,
    corridorId: 'corridor-alpha',
    corridorName: 'Spine Alpha (Central Blvd)',
    priorityCapable: true,
    controllerType: 'ATC 2070',
    currentPhase: 'RED',
    phaseTimeRemainingSec: 18,
    cycleTimeSec: 100,
    avgStoppageSec: 12.4,
    failureRatePct: 18.0,
    totalInteractions: 135,
    speedLimitKmH: 50,
    notes: 'Dual left turn phase occasionally delays green window by 10s.'
  },
  {
    id: 'sig-104',
    name: 'Central Blvd & 6th St Gateway',
    code: 'INT-104',
    latitude: 37.7710,
    longitude: -122.4060,
    corridorId: 'corridor-alpha',
    corridorName: 'Spine Alpha (Central Blvd)',
    priorityCapable: true,
    controllerType: 'NEMA TS2',
    currentPhase: 'GREEN',
    phaseTimeRemainingSec: 32,
    cycleTimeSec: 80,
    avgStoppageSec: 7.1,
    failureRatePct: 9.1,
    totalInteractions: 140,
    speedLimitKmH: 50,
    notes: 'High reliability corridor green-wave waypoint.'
  },
  {
    id: 'sig-105',
    name: 'Central Blvd & 4th St Terminal',
    code: 'INT-105',
    latitude: 37.7695,
    longitude: -122.4030,
    corridorId: 'corridor-alpha',
    corridorName: 'Spine Alpha (Central Blvd)',
    priorityCapable: false,
    controllerType: 'Legacy Electromechanical',
    currentPhase: 'RED',
    phaseTimeRemainingSec: 42,
    cycleTimeSec: 90,
    avgStoppageSec: 36.5,
    failureRatePct: 62.4,
    totalInteractions: 130,
    speedLimitKmH: 45,
    notes: 'Legacy cabinet without preemption card. Causes frequent 30-50s emergency vehicle delays.'
  },
  {
    id: 'sig-106',
    name: 'Hospital Way & Emergency Bay Gate',
    code: 'INT-106',
    latitude: 37.7685,
    longitude: -122.4010,
    corridorId: 'corridor-alpha',
    corridorName: 'Spine Alpha (Central Blvd)',
    priorityCapable: true,
    controllerType: 'V2X Connected Hub',
    currentPhase: 'GREEN',
    phaseTimeRemainingSec: 50,
    cycleTimeSec: 60,
    avgStoppageSec: 3.4,
    failureRatePct: 2.1,
    totalInteractions: 165,
    speedLimitKmH: 35,
    notes: 'Direct hospital ingress gate with automated emergency bar hold.'
  },
  {
    id: 'sig-201',
    name: 'Parkway North & Marina Blvd',
    code: 'INT-201',
    latitude: 37.7830,
    longitude: -122.4250,
    corridorId: 'corridor-bravo',
    corridorName: 'Parkway Bravo (River Bypass)',
    priorityCapable: true,
    controllerType: 'ATC 2070',
    currentPhase: 'GREEN',
    phaseTimeRemainingSec: 28,
    cycleTimeSec: 110,
    avgStoppageSec: 11.2,
    failureRatePct: 15.3,
    totalInteractions: 98,
    speedLimitKmH: 60,
    notes: 'High speed arterial transition point.'
  },
  {
    id: 'sig-202',
    name: 'Parkway & Harbor Connector',
    code: 'INT-202',
    latitude: 37.7810,
    longitude: -122.4150,
    corridorId: 'corridor-bravo',
    corridorName: 'Parkway Bravo (River Bypass)',
    priorityCapable: false,
    controllerType: 'Legacy Electromechanical',
    currentPhase: 'RED',
    phaseTimeRemainingSec: 35,
    cycleTimeSec: 100,
    avgStoppageSec: 29.8,
    failureRatePct: 48.7,
    totalInteractions: 92,
    speedLimitKmH: 60,
    notes: 'Long red phase for cross river pedestrian and port freight traffic.'
  },
  {
    id: 'sig-203',
    name: 'Parkway & 7th River Bridge',
    code: 'INT-203',
    latitude: 37.7760,
    longitude: -122.4070,
    corridorId: 'corridor-bravo',
    corridorName: 'Parkway Bravo (River Bypass)',
    priorityCapable: true,
    controllerType: 'NEMA TS2',
    currentPhase: 'GREEN',
    phaseTimeRemainingSec: 15,
    cycleTimeSec: 90,
    avgStoppageSec: 14.5,
    failureRatePct: 22.0,
    totalInteractions: 95,
    speedLimitKmH: 55,
    notes: 'Bridge approach with variable lane control.'
  },
  {
    id: 'sig-301',
    name: 'Market St & 11th Street',
    code: 'INT-301',
    latitude: 37.7760,
    longitude: -122.4260,
    corridorId: 'corridor-charlie',
    corridorName: 'Metro Link Charlie (Commercial Cross)',
    priorityCapable: false,
    controllerType: 'Legacy Electromechanical',
    currentPhase: 'RED',
    phaseTimeRemainingSec: 40,
    cycleTimeSec: 120,
    avgStoppageSec: 41.2,
    failureRatePct: 69.8,
    totalInteractions: 90,
    speedLimitKmH: 40,
    notes: 'Severe pedestrian conflicts and transit streetcar priority conflicts.'
  },
  {
    id: 'sig-302',
    name: 'Market St & 9th Street',
    code: 'INT-302',
    latitude: 37.7740,
    longitude: -122.4210,
    corridorId: 'corridor-charlie',
    corridorName: 'Metro Link Charlie (Commercial Cross)',
    priorityCapable: false,
    controllerType: 'Legacy Electromechanical',
    currentPhase: 'RED',
    phaseTimeRemainingSec: 25,
    cycleTimeSec: 120,
    avgStoppageSec: 38.6,
    failureRatePct: 64.5,
    totalInteractions: 88,
    speedLimitKmH: 40,
    notes: 'No preemption capability. Uncoordinated cycle splits.'
  },
  {
    id: 'sig-303',
    name: 'Market St & 7th Street',
    code: 'INT-303',
    latitude: 37.7715,
    longitude: -122.4140,
    corridorId: 'corridor-charlie',
    corridorName: 'Metro Link Charlie (Commercial Cross)',
    priorityCapable: true,
    controllerType: 'ATC 2070',
    currentPhase: 'YELLOW',
    phaseTimeRemainingSec: 5,
    cycleTimeSec: 110,
    avgStoppageSec: 22.4,
    failureRatePct: 37.2,
    totalInteractions: 84,
    speedLimitKmH: 40,
    notes: 'Recently upgraded controller, optical sensor occasionally obstructed.'
  },
  {
    id: 'sig-304',
    name: 'Market St & 5th Street Mall',
    code: 'INT-304',
    latitude: 37.7690,
    longitude: -122.4080,
    corridorId: 'corridor-charlie',
    corridorName: 'Metro Link Charlie (Commercial Cross)',
    priorityCapable: false,
    controllerType: 'Legacy Electromechanical',
    currentPhase: 'RED',
    phaseTimeRemainingSec: 48,
    cycleTimeSec: 130,
    avgStoppageSec: 46.1,
    failureRatePct: 74.2,
    totalInteractions: 82,
    speedLimitKmH: 35,
    notes: 'Critical bottleneck. Average 46 seconds lost per emergency response.'
  }
];

export const INITIAL_UNITS: AmbulanceUnit[] = [
  {
    id: 'unit-med-04',
    callSign: 'MEDIC-04',
    driverName: 'Officer Marcus Cole',
    station: 'Station 4 (North Civic)',
    status: 'idle',
    latitude: 37.7790,
    longitude: -122.4280,
    speedKmH: 0,
    heading: 125
  },
  {
    id: 'unit-res-09',
    callSign: 'RESCUE-09',
    driverName: 'Paramedic Sarah Jenkins',
    station: 'Station 9 (Metro Waterfront)',
    status: 'idle',
    latitude: 37.7845,
    longitude: -122.4200,
    speedKmH: 0,
    heading: 90
  },
  {
    id: 'unit-amb-12',
    callSign: 'AMBULANCE-12',
    driverName: 'Driver Alex Rivera',
    station: 'Station 12 (South Mission)',
    status: 'idle',
    latitude: 37.7650,
    longitude: -122.4150,
    speedKmH: 0,
    heading: 340
  },
  {
    id: 'unit-alp-02',
    callSign: 'ALPHA-02',
    driverName: 'EMT David Vance',
    station: 'Station 2 (Westside Depot)',
    status: 'idle',
    latitude: 37.7720,
    longitude: -122.4350,
    speedKmH: 0,
    heading: 85
  }
];

// Realistic route options for candidate trip from Station 4 / Civic Center to Metro General Trauma Hospital
export const SAMPLE_ROUTE_OPTIONS: RouteOption[] = [
  {
    id: 'route-opt-1',
    name: 'Spine Alpha (Central Corridor)',
    corridorSummary: 'Via Central Blvd · 5 Priority-Ready Signals',
    distanceKm: 4.2,
    baseEtaMinutes: 6.8,
    signalDelayPenaltyMinutes: 1.1,
    adjustedLifeSafetyEtaMinutes: 7.9,
    signalCount: 5,
    priorityCapableCount: 4,
    predictedStoppageSec: 28,
    safetyScore: 92,
    recommended: true,
    associatedSignalIds: ['sig-101', 'sig-102', 'sig-103', 'sig-104', 'sig-105', 'sig-106'],
    waypoints: [
      [37.7790, -122.4280],
      [37.7780, -122.4255],
      [37.7772, -122.4230], // sig-101
      [37.7761, -122.4205],
      [37.7750, -122.4180], // sig-102
      [37.7740, -122.4150],
      [37.7731, -122.4120], // sig-103
      [37.7720, -122.4090],
      [37.7710, -122.4060], // sig-104
      [37.7702, -122.4045],
      [37.7695, -122.4030], // sig-105
      [37.7685, -122.4010]  // sig-106 (Hospital)
    ],
    turnInstructions: [
      {
        id: 'turn-1',
        instruction: 'Head southeast on Central Blvd from Station 4',
        streetName: 'Central Blvd',
        distanceM: 400,
        approxDurationSec: 35,
        icon: 'straight'
      },
      {
        id: 'turn-2',
        instruction: 'Continue through Van Ness Ave (Approaching Signal #101)',
        streetName: 'Central Blvd',
        distanceM: 700,
        approxDurationSec: 50,
        signalId: 'sig-101',
        icon: 'straight'
      },
      {
        id: 'turn-3',
        instruction: 'Maintain course toward 10th St (Approaching Signal #102)',
        streetName: 'Central Blvd',
        distanceM: 650,
        approxDurationSec: 48,
        signalId: 'sig-102',
        icon: 'straight'
      },
      {
        id: 'turn-4',
        instruction: 'Pass 8th St Interchange (Approaching Signal #103)',
        streetName: 'Central Blvd',
        distanceM: 750,
        approxDurationSec: 55,
        signalId: 'sig-103',
        icon: 'straight'
      },
      {
        id: 'turn-5',
        instruction: 'Approach 6th St Gateway (Approaching Signal #104)',
        streetName: 'Central Blvd',
        distanceM: 700,
        approxDurationSec: 50,
        signalId: 'sig-104',
        icon: 'straight'
      },
      {
        id: 'turn-6',
        instruction: 'CAUTION: Approaching 4th St (Signal #105 - Legacy Uncoordinated)',
        streetName: 'Central Blvd',
        distanceM: 450,
        approxDurationSec: 45,
        signalId: 'sig-105',
        icon: 'slight_right'
      },
      {
        id: 'turn-7',
        instruction: 'Arrive at Metro General Hospital Trauma Bay (Signal #106)',
        streetName: 'Hospital Way',
        distanceM: 250,
        approxDurationSec: 25,
        signalId: 'sig-106',
        icon: 'destination'
      }
    ]
  },
  {
    id: 'route-opt-2',
    name: 'Parkway Bravo (River Bypass)',
    corridorSummary: 'Via Waterfront Expressway · Fast Free-flow, 1 Long Stop Risk',
    distanceKm: 5.4,
    baseEtaMinutes: 7.2,
    signalDelayPenaltyMinutes: 2.2,
    adjustedLifeSafetyEtaMinutes: 9.4,
    signalCount: 4,
    priorityCapableCount: 2,
    predictedStoppageSec: 58,
    safetyScore: 74,
    recommended: false,
    associatedSignalIds: ['sig-201', 'sig-202', 'sig-203', 'sig-106'],
    waypoints: [
      [37.7790, -122.4280],
      [37.7815, -122.4265],
      [37.7830, -122.4250], // sig-201
      [37.7820, -122.4200],
      [37.7810, -122.4150], // sig-202
      [37.7785, -122.4110],
      [37.7760, -122.4070], // sig-203
      [37.7720, -122.4040],
      [37.7685, -122.4010]  // sig-106
    ],
    turnInstructions: [
      {
        id: 'tb-1',
        instruction: 'Turn left onto Parkway Connector',
        streetName: 'Marina Blvd',
        distanceM: 600,
        approxDurationSec: 45,
        icon: 'turn_left'
      },
      {
        id: 'tb-2',
        instruction: 'Continue east past Marina Blvd (Signal #201)',
        streetName: 'Parkway North',
        distanceM: 1100,
        approxDurationSec: 75,
        signalId: 'sig-201',
        icon: 'straight'
      },
      {
        id: 'tb-3',
        instruction: 'Warning: Harbor Connector (Signal #202 - Known High Delay)',
        streetName: 'Parkway North',
        distanceM: 950,
        approxDurationSec: 90,
        signalId: 'sig-202',
        icon: 'straight'
      },
      {
        id: 'tb-4',
        instruction: 'Cross 7th River Bridge approach (Signal #203)',
        streetName: 'River Bridge Way',
        distanceM: 1400,
        approxDurationSec: 95,
        signalId: 'sig-203',
        icon: 'turn_right'
      },
      {
        id: 'tb-5',
        instruction: 'Turn into Trauma Ingress Gate (Signal #106)',
        streetName: 'Hospital Way',
        distanceM: 400,
        approxDurationSec: 35,
        signalId: 'sig-106',
        icon: 'destination'
      }
    ]
  },
  {
    id: 'route-opt-3',
    name: 'Metro Link Charlie (Commercial Cross)',
    corridorSummary: 'Via Market Commercial District · 4 Legacy Signals (NOT RECOMMENDED)',
    distanceKm: 3.8,
    baseEtaMinutes: 6.2,
    signalDelayPenaltyMinutes: 5.4,
    adjustedLifeSafetyEtaMinutes: 11.6,
    signalCount: 5,
    priorityCapableCount: 1,
    predictedStoppageSec: 165,
    safetyScore: 38,
    recommended: false,
    associatedSignalIds: ['sig-301', 'sig-302', 'sig-303', 'sig-304', 'sig-106'],
    waypoints: [
      [37.7790, -122.4280],
      [37.7775, -122.4270],
      [37.7760, -122.4260], // sig-301
      [37.7750, -122.4235],
      [37.7740, -122.4210], // sig-302
      [37.7725, -122.4175],
      [37.7715, -122.4140], // sig-303
      [37.7700, -122.4110],
      [37.7690, -122.4080], // sig-304
      [37.7685, -122.4010]  // sig-106
    ],
    turnInstructions: [
      {
        id: 'tc-1',
        instruction: 'Turn right onto Market Commercial Street',
        streetName: 'Market St',
        distanceM: 450,
        approxDurationSec: 50,
        icon: 'turn_right'
      },
      {
        id: 'tc-2',
        instruction: 'Proceed through 11th St (Signal #301 - High Stop Probability)',
        streetName: 'Market St',
        distanceM: 600,
        approxDurationSec: 85,
        signalId: 'sig-301',
        icon: 'straight'
      },
      {
        id: 'tc-3',
        instruction: 'Transit corridor crossing at 9th St (Signal #302)',
        streetName: 'Market St',
        distanceM: 700,
        approxDurationSec: 90,
        signalId: 'sig-302',
        icon: 'straight'
      },
      {
        id: 'tc-4',
        instruction: 'Pass 7th St (Signal #303)',
        streetName: 'Market St',
        distanceM: 650,
        approxDurationSec: 75,
        signalId: 'sig-303',
        icon: 'straight'
      },
      {
        id: 'tc-5',
        instruction: 'Severe congestion zone: 5th St Mall (Signal #304)',
        streetName: 'Market St',
        distanceM: 800,
        approxDurationSec: 120,
        signalId: 'sig-304',
        icon: 'straight'
      },
      {
        id: 'tc-6',
        instruction: 'Arrive at Hospital Bay (Signal #106)',
        streetName: 'Hospital Way',
        distanceM: 300,
        approxDurationSec: 30,
        icon: 'destination'
      }
    ]
  }
];

// Pre-seeded historical trips (42 trips) representing past 30 days of data for rich analysis
export function generateHistoricalTrips(): EmergencyTrip[] {
  const trips: EmergencyTrip[] = [];
  const now = Date.now();
  const DAY_MS = 24 * 3600 * 1000;

  const samplePriorities: EmergencyTrip['priorityLevel'][] = ['Code 3 (Critical)', 'Code 3 (Critical)', 'Code 2 (Urgent)', 'Code 1 (Standard)'];
  const sampleTypes: EmergencyTrip['callType'][] = ['Cardiac Arrest', 'Trauma / MVA', 'Respiratory Distress', 'Stroke Alert', 'Pediatric Emergency'];

  for (let i = 1; i <= 42; i++) {
    const daysAgo = (i % 30) + (i / 45);
    const tripTimestamp = now - Math.floor(daysAgo * DAY_MS);
    const hour = (i * 3 + 7) % 24;
    const isPeak = (hour >= 7 && hour <= 9) || (hour >= 16 && hour <= 19);

    const isCorridorA = i % 3 !== 0;
    const isCorridorB = i % 3 === 0;

    const baseTravelSec = isCorridorA ? 480 : isCorridorB ? 560 : 720;
    const stoppageSec = isCorridorA ? (isPeak ? 38 : 14) : isCorridorB ? (isPeak ? 72 : 36) : (isPeak ? 175 : 120);

    const tripId = `hist-trip-${1000 + i}`;
    const callNum = `CAD-${2026000 + i}`;

    const interactions: SignalInteractionLog[] = [];
    if (isCorridorA) {
      interactions.push(
        {
          id: `log-${i}-1`,
          tripId,
          signalId: 'sig-101',
          signalName: 'Central Blvd & Van Ness Ave',
          arrivalTimestamp: tripTimestamp + 60000,
          departureTimestamp: tripTimestamp + 65000,
          stoppageDurationSec: isPeak ? 6 : 0,
          speedOnArrivalKmH: 46,
          emergencyCorridorNotified: true,
          priorityGranted: true,
          phaseOnApproach: 'PREEMPTED_GREEN',
          outcome: 'green_wave_pass'
        },
        {
          id: `log-${i}-2`,
          tripId,
          signalId: 'sig-102',
          signalName: 'Central Blvd & 10th St',
          arrivalTimestamp: tripTimestamp + 140000,
          departureTimestamp: tripTimestamp + 148000,
          stoppageDurationSec: isPeak ? 8 : 2,
          speedOnArrivalKmH: 44,
          emergencyCorridorNotified: true,
          priorityGranted: true,
          phaseOnApproach: 'PREEMPTED_GREEN',
          outcome: 'green_wave_pass'
        },
        {
          id: `log-${i}-3`,
          tripId,
          signalId: 'sig-103',
          signalName: 'Central Blvd & 8th St Interchange',
          arrivalTimestamp: tripTimestamp + 220000,
          departureTimestamp: tripTimestamp + 234000,
          stoppageDurationSec: isPeak ? 14 : 4,
          speedOnArrivalKmH: 42,
          emergencyCorridorNotified: true,
          priorityGranted: true,
          phaseOnApproach: 'GREEN',
          outcome: isPeak ? 'minor_delay' : 'green_wave_pass'
        },
        {
          id: `log-${i}-4`,
          tripId,
          signalId: 'sig-104',
          signalName: 'Central Blvd & 6th St Gateway',
          arrivalTimestamp: tripTimestamp + 310000,
          departureTimestamp: tripTimestamp + 318000,
          stoppageDurationSec: isPeak ? 7 : 0,
          speedOnArrivalKmH: 48,
          emergencyCorridorNotified: true,
          priorityGranted: true,
          phaseOnApproach: 'PREEMPTED_GREEN',
          outcome: 'green_wave_pass'
        },
        {
          id: `log-${i}-5`,
          tripId,
          signalId: 'sig-105',
          signalName: 'Central Blvd & 4th St Terminal',
          arrivalTimestamp: tripTimestamp + 400000,
          departureTimestamp: tripTimestamp + 438000,
          stoppageDurationSec: isPeak ? 42 : 28,
          speedOnArrivalKmH: 35,
          emergencyCorridorNotified: true,
          priorityGranted: false,
          phaseOnApproach: 'RED',
          outcome: 'severe_stoppage',
          notes: 'Legacy cabinet could not respond to corridor priority beacon.'
        },
        {
          id: `log-${i}-6`,
          tripId,
          signalId: 'sig-106',
          signalName: 'Hospital Way & Emergency Bay Gate',
          arrivalTimestamp: tripTimestamp + 470000,
          departureTimestamp: tripTimestamp + 472000,
          stoppageDurationSec: 2,
          speedOnArrivalKmH: 30,
          emergencyCorridorNotified: true,
          priorityGranted: true,
          phaseOnApproach: 'PREEMPTED_GREEN',
          outcome: 'green_wave_pass'
        }
      );
    } else {
      // Legacy Charlie corridor or Bravo
      interactions.push(
        {
          id: `log-${i}-1`,
          tripId,
          signalId: 'sig-301',
          signalName: 'Market St & 11th Street',
          arrivalTimestamp: tripTimestamp + 70000,
          departureTimestamp: tripTimestamp + 115000,
          stoppageDurationSec: 45,
          speedOnArrivalKmH: 34,
          emergencyCorridorNotified: true,
          priorityGranted: false,
          phaseOnApproach: 'RED',
          outcome: 'severe_stoppage'
        },
        {
          id: `log-${i}-2`,
          tripId,
          signalId: 'sig-304',
          signalName: 'Market St & 5th Street Mall',
          arrivalTimestamp: tripTimestamp + 320000,
          departureTimestamp: tripTimestamp + 372000,
          stoppageDurationSec: 52,
          speedOnArrivalKmH: 26,
          emergencyCorridorNotified: true,
          priorityGranted: false,
          phaseOnApproach: 'RED',
          outcome: 'severe_stoppage'
        }
      );
    }

    trips.push({
      id: tripId,
      callNumber: callNum,
      priorityLevel: samplePriorities[i % samplePriorities.length],
      callType: sampleTypes[i % sampleTypes.length],
      originName: i % 2 === 0 ? 'Civic Center Station 4' : 'Civic Plaza 8th Ave',
      originCoords: [37.7790, -122.4280],
      destinationName: 'Metro General Trauma Hospital',
      destinationCoords: [37.7685, -122.4010],
      unitId: INITIAL_UNITS[i % INITIAL_UNITS.length].id,
      assignedDriver: INITIAL_UNITS[i % INITIAL_UNITS.length].driverName,
      plannedRoute: SAMPLE_ROUTE_OPTIONS[isCorridorA ? 0 : 2],
      status: 'completed',
      startTime: tripTimestamp,
      endTime: tripTimestamp + (baseTravelSec + stoppageSec) * 1000,
      totalTravelTimeSec: baseTravelSec + stoppageSec,
      totalStoppageTimeSec: stoppageSec,
      signalsEncountered: interactions.length,
      interactions,
      gpsTrace: [],
      corridorNotifiedCount: interactions.filter(x => x.emergencyCorridorNotified).length,
      prioritySuccessCount: interactions.filter(x => x.priorityGranted).length
    });
  }

  return trips;
}
