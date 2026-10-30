export type PriorityLevel = 'Code 3 (Critical)' | 'Code 2 (Urgent)' | 'Code 1 (Standard)';
export type CallType = 'Cardiac Arrest' | 'Trauma / MVA' | 'Respiratory Distress' | 'Stroke Alert' | 'Pediatric Emergency';
export type SignalPhase = 'RED' | 'YELLOW' | 'GREEN' | 'PREEMPTED_GREEN';
export type ControllerType = 'NEMA TS2' | 'ATC 2070' | 'Legacy Electromechanical' | 'V2X Connected Hub';

export interface TrafficSignal {
  id: string;
  name: string;
  code: string;
  latitude: number;
  longitude: number;
  corridorId: string;
  corridorName: string;
  priorityCapable: boolean;
  controllerType: ControllerType;
  currentPhase: SignalPhase;
  phaseTimeRemainingSec: number;
  cycleTimeSec: number;
  avgStoppageSec: number;
  failureRatePct: number; // % trips where ambulance stopped > 20s
  totalInteractions: number;
  speedLimitKmH: number;
  notes?: string;
}

export interface Corridor {
  id: string;
  name: string;
  code: string;
  description: string;
  totalSignals: number;
  priorityEnabledSignals: number;
  reliabilityScore: number; // 0 - 100
  lengthKm: number;
  avgResponseSpeedKmH: number;
  historicalTripCount: number;
  color: string;
  waypoints: [number, number][];
}

export interface AmbulanceUnit {
  id: string;
  callSign: string;
  driverName: string;
  station: string;
  status: 'idle' | 'en_route_scene' | 'at_scene' | 'transporting_hospital' | 'cleared';
  latitude: number;
  longitude: number;
  speedKmH: number;
  heading: number;
  assignedTripId?: string;
}

export interface TurnInstruction {
  id: string;
  instruction: string;
  streetName: string;
  distanceM: number;
  approxDurationSec: number;
  signalId?: string;
  icon: 'straight' | 'turn_right' | 'turn_left' | 'slight_right' | 'slight_left' | 'destination';
}

export interface RouteOption {
  id: string;
  name: string;
  corridorSummary: string;
  distanceKm: number;
  baseEtaMinutes: number;
  signalDelayPenaltyMinutes: number;
  adjustedLifeSafetyEtaMinutes: number;
  signalCount: number;
  priorityCapableCount: number;
  predictedStoppageSec: number;
  safetyScore: number; // 0 - 100 life-safety reliability score
  recommended: boolean;
  waypoints: [number, number][];
  turnInstructions: TurnInstruction[];
  associatedSignalIds: string[];
}

export interface SignalInteractionLog {
  id: string;
  tripId: string;
  signalId: string;
  signalName: string;
  arrivalTimestamp: number;
  departureTimestamp: number;
  stoppageDurationSec: number;
  speedOnArrivalKmH: number;
  emergencyCorridorNotified: boolean;
  priorityGranted: boolean;
  phaseOnApproach: SignalPhase;
  outcome: 'green_wave_pass' | 'minor_delay' | 'severe_stoppage' | 'priority_ignored';
  notes?: string;
}

export interface GpsSample {
  latitude: number;
  longitude: number;
  timestamp: number;
  speedKmH: number;
  heading: number;
}

export interface EmergencyTrip {
  id: string;
  callNumber: string;
  priorityLevel: PriorityLevel;
  callType: CallType;
  originName: string;
  originCoords: [number, number];
  destinationName: string;
  destinationCoords: [number, number];
  unitId: string;
  assignedDriver: string;
  plannedRoute: RouteOption;
  status: 'dispatched' | 'active' | 'completed' | 'cancelled';
  startTime: number;
  endTime?: number;
  totalTravelTimeSec?: number;
  totalStoppageTimeSec?: number;
  signalsEncountered: number;
  interactions: SignalInteractionLog[];
  gpsTrace: GpsSample[];
  deviationDetected?: boolean;
  corridorNotifiedCount: number;
  prioritySuccessCount: number;
}

export type IncidentType =
  | 'Signal Stuck Red / Hardware Malfunction'
  | 'Intersection Gridlock / Dense Civilian Queue'
  | 'Road Closure / Downed Utility'
  | 'Emergency Vehicle Collision / MVA'
  | 'Opticom / V2X Sensor Obstructed'
  | 'Construction / Lane Reduction';

export type IncidentSeverity = 'critical' | 'major' | 'moderate';

export interface ReportedIncident {
  id: string;
  tripId?: string;
  callNumber?: string;
  unitId: string;
  unitCallSign: string;
  driverName: string;
  type: IncidentType;
  severity: IncidentSeverity;
  description: string;
  locationName: string;
  latitude: number;
  longitude: number;
  associatedSignalId?: string;
  corridorId?: string;
  timestamp: number;
  status: 'active' | 'investigating' | 'resolved';
  delayPenaltySec: number;
  resolvedAt?: number;
  resolvedBy?: string;
}

export interface HeatmapFilterState {
  timeOfDay: 'all' | 'morning_peak' | 'midday' | 'evening_rush' | 'night';
  dayOfWeek: 'all' | 'weekdays' | 'weekends';
  tripType: 'all' | 'scene_response' | 'hospital_transport';
  corridorId: 'all' | string;
  metric: 'avg_stoppage' | 'fail_rate' | 'total_volume';
  showIncidents?: boolean;
}

export type ActiveAppView = 'driver_hud' | 'dispatcher_cad' | 'heatmap_view' | 'kpi_dashboard' | 'infrastructure_sim';
