import React, { createContext, useContext, useState, useEffect, useRef, useMemo, ReactNode } from 'react';
import {
  TrafficSignal,
  Corridor,
  AmbulanceUnit,
  EmergencyTrip,
  RouteOption,
  SignalInteractionLog,
  PriorityLevel,
  CallType,
  ActiveAppView,
  SignalPhase,
  ReportedIncident
} from '../types';
import {
  METRO_CORRIDORS,
  INITIAL_TRAFFIC_SIGNALS,
  INITIAL_UNITS,
  SAMPLE_ROUTE_OPTIONS,
  INITIAL_INCIDENTS,
  generateHistoricalTrips
} from '../data/mockData';
import { optimizeRoutes } from '../services/routeOptimizer';
import { soundManager } from '../services/audioService';

interface AppContextValue {
  signals: TrafficSignal[];
  corridors: Corridor[];
  units: AmbulanceUnit[];
  trips: EmergencyTrip[];
  activeTrip: EmergencyTrip | null;
  activeView: ActiveAppView;
  currentWaypointIndex: number;
  vehicleSpeedKmH: number;
  isPaused: boolean;
  simulationSpeed: number;
  currentApproachingSignal: TrafficSignal | null;
  currentStoppageDurationSec: number;
  activeIncidentSignalId: string | null;
  incidents: ReportedIncident[];
  soundEnabled: boolean;
  liveNotifications: { id: string; time: string; message: string; type: 'info' | 'success' | 'warning' }[];
  
  // Actions
  setActiveView: (view: ActiveAppView) => void;
  setSoundEnabled: (enabled: boolean) => void;
  setSimulationSpeed: (speed: number) => void;
  dispatchNewTrip: (params: {
    priorityLevel: PriorityLevel;
    callType: CallType;
    originName: string;
    originCoords: [number, number];
    destinationName: string;
    destinationCoords: [number, number];
    unitId: string;
    routeId: string;
  }) => void;
  startTrip: () => void;
  pauseTrip: () => void;
  resumeTrip: () => void;
  endTrip: () => void;
  triggerRouteReroute: () => void;
  triggerIncidentOnSignal: (signalId: string) => void;
  reportIncident: (incidentData: Omit<ReportedIncident, 'id' | 'timestamp' | 'status'>) => void;
  resolveIncident: (incidentId: string, resolvedBy?: string) => void;
  clearIncident: () => void;
  toggleSignalPriorityCapability: (signalId: string) => void;
  manuallyPreemptSignal: (signalId: string) => void;
  resetAllToDefaults: () => void;
}

const AppContext = createContext<AppContextValue | undefined>(undefined);

// Helper for distance between coordinates in meters (Haversine)
export function getDistanceMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3;
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
  const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [signals, setSignals] = useState<TrafficSignal[]>(INITIAL_TRAFFIC_SIGNALS);
  const [corridors, setCorridors] = useState<Corridor[]>(METRO_CORRIDORS);
  const [units, setUnits] = useState<AmbulanceUnit[]>(INITIAL_UNITS);
  const [trips, setTrips] = useState<EmergencyTrip[]>(() => generateHistoricalTrips());
  const [activeTrip, setActiveTrip] = useState<EmergencyTrip | null>(null);
  const [activeView, setActiveView] = useState<ActiveAppView>('dispatcher_cad');

  // Simulation state
  const [currentWaypointIndex, setCurrentWaypointIndex] = useState<number>(0);
  const [vehicleSpeedKmH, setVehicleSpeedKmH] = useState<number>(0);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [simulationSpeed, setSimulationSpeed] = useState<number>(1); // 1x, 2x, 4x
  const [currentApproachingSignal, setCurrentApproachingSignal] = useState<TrafficSignal | null>(null);
  const [currentStoppageDurationSec, setCurrentStoppageDurationSec] = useState<number>(0);
  const [activeIncidentSignalId, setActiveIncidentSignalId] = useState<string | null>(null);
  const [incidents, setIncidents] = useState<ReportedIncident[]>(INITIAL_INCIDENTS);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [liveNotifications, setLiveNotifications] = useState<{ id: string; time: string; message: string; type: 'info' | 'success' | 'warning' }[]>([
    {
      id: 'notif-init',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      message: 'EM-Corridor Companion online. 3 corridors monitored, 14 traffic signal controllers connected.',
      type: 'info'
    }
  ]);

  const addNotification = (message: string, type: 'info' | 'success' | 'warning' = 'info') => {
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    setLiveNotifications(prev => [
      { id: `notif-${Date.now()}-${Math.random()}`, time, message, type },
      ...prev.slice(0, 24)
    ]);
  };

  const currentStoppageRef = useRef(0);
  currentStoppageRef.current = currentStoppageDurationSec;

  const currentSignalRef = useRef<TrafficSignal | null>(null);
  currentSignalRef.current = currentApproachingSignal;

  // Sync sound manager mute status
  useEffect(() => {
    soundManager.isMuted = !soundEnabled;
  }, [soundEnabled]);

  // Periodic normal signal phase cycling for all non-preempted signals
  useEffect(() => {
    const phaseInterval = setInterval(() => {
      setSignals(prevSignals =>
        prevSignals.map(sig => {
          if (sig.currentPhase === 'PREEMPTED_GREEN') {
            return sig; // Held green by emergency vehicle
          }
          let remaining = sig.phaseTimeRemainingSec - 1;
          let phase: SignalPhase = sig.currentPhase;

          if (remaining <= 0) {
            if (phase === 'GREEN') {
              phase = 'YELLOW';
              remaining = 4;
            } else if (phase === 'YELLOW') {
              phase = 'RED';
              remaining = Math.max(15, sig.cycleTimeSec - 40);
            } else {
              phase = 'GREEN';
              remaining = 35;
            }
          }
          return {
            ...sig,
            currentPhase: phase,
            phaseTimeRemainingSec: remaining
          };
        })
      );
    }, 1000);

    return () => clearInterval(phaseInterval);
  }, []);

  // Main Vehicle and Route Simulation Loop
  useEffect(() => {
    if (!activeTrip || activeTrip.status !== 'active' || isPaused) {
      return;
    }

    const intervalMs = Math.max(250, 1000 / simulationSpeed);

    const timer = setInterval(() => {
      const waypoints = activeTrip.plannedRoute.waypoints;
      if (currentWaypointIndex >= waypoints.length - 1) {
        // Arrived at destination hospital!
        endTrip();
        return;
      }

      const currWp = waypoints[currentWaypointIndex];
      const nextWp = waypoints[currentWaypointIndex + 1];

      // Calculate distance to nearest upcoming signal
      const signalCandidates = signals.map(s => {
        const dist = getDistanceMeters(currWp[0], currWp[1], s.latitude, s.longitude);
        return { signal: s, distance: dist };
      }).sort((a, b) => a.distance - b.distance);

      const closest = signalCandidates[0];
      const isWithinApproach = closest && closest.distance <= 280;
      const isAtIntersection = closest && closest.distance <= 45;

      let nextSpeed = 55; // Default cruising speed in km/h

      if (isWithinApproach && closest) {
        const sig = closest.signal;
        setCurrentApproachingSignal(sig);

        // Check if corridor notification has been sent for this signal
        const existingInteraction = activeTrip.interactions.find(i => i.signalId === sig.id);

        if (!existingInteraction) {
          // Send Emergency Corridor Notification!
          const canPreempt = sig.priorityCapable;

          if (canPreempt) {
            // Signal switches to PREEMPTED_GREEN
            setSignals(prev =>
              prev.map(s => s.id === sig.id ? { ...s, currentPhase: 'PREEMPTED_GREEN', phaseTimeRemainingSec: 45 } : s)
            );
            soundManager.playPriorityGreenChime();
            addNotification(`Emergency corridor preemption granted at ${sig.name} (${sig.code}). Green wave scheduled.`, 'success');
          } else {
            soundManager.playWarningStopBeep();
            addNotification(`Approaching ${sig.name} (${sig.code}) - Legacy controller. Preemption unavailable, delay expected.`, 'warning');
          }

          const newInteraction: SignalInteractionLog = {
            id: `log-${Date.now()}`,
            tripId: activeTrip.id,
            signalId: sig.id,
            signalName: sig.name,
            arrivalTimestamp: Date.now(),
            departureTimestamp: 0,
            stoppageDurationSec: 0,
            speedOnArrivalKmH: vehicleSpeedKmH,
            emergencyCorridorNotified: true,
            priorityGranted: canPreempt,
            phaseOnApproach: sig.currentPhase,
            outcome: canPreempt ? 'green_wave_pass' : (sig.currentPhase === 'RED' ? 'severe_stoppage' : 'minor_delay')
          };

          setActiveTrip(prev => prev ? {
            ...prev,
            corridorNotifiedCount: prev.corridorNotifiedCount + 1,
            prioritySuccessCount: prev.prioritySuccessCount + (canPreempt ? 1 : 0),
            interactions: [...prev.interactions, newInteraction]
          } : null);
        }

        // At intersection check: if still red, vehicle must halt!
        if (isAtIntersection && (sig.currentPhase === 'RED' || sig.currentPhase === 'YELLOW')) {
          nextSpeed = 0;
          setCurrentStoppageDurationSec(prev => prev + 1);

          // Update interaction stoppage in active trip
          setActiveTrip(prev => {
            if (!prev) return null;
            const updatedLogs = prev.interactions.map(item => {
              if (item.signalId === sig.id) {
                return {
                  ...item,
                  stoppageDurationSec: item.stoppageDurationSec + 1,
                  outcome: (item.stoppageDurationSec > 20 ? 'severe_stoppage' : 'minor_delay') as SignalInteractionLog['outcome']
                };
              }
              return item;
            });
            return {
              ...prev,
              totalStoppageTimeSec: (prev.totalStoppageTimeSec || 0) + 1,
              interactions: updatedLogs
            };
          });

          // After waiting 6-8 seconds at legacy red, simulated traffic moves or clearance opens
          if (currentStoppageRef.current >= 8) {
            // Signal phase advances to green to let ambulance pass
            setSignals(prev =>
              prev.map(s => s.id === sig.id ? { ...s, currentPhase: 'GREEN', phaseTimeRemainingSec: 25 } : s)
            );
          }
        } else {
          // Green or moving
          setCurrentStoppageDurationSec(0);
          nextSpeed = sig.currentPhase === 'PREEMPTED_GREEN' ? 62 : 48;
        }
      } else {
        // Outside any intersection radius
        setCurrentApproachingSignal(null);
        setCurrentStoppageDurationSec(0);
        nextSpeed = 58;
      }

      setVehicleSpeedKmH(nextSpeed);

      // Only advance position if moving
      if (nextSpeed > 0) {
        setCurrentWaypointIndex(prev => prev + 1);

        // Update assigned vehicle coordinates
        setUnits(prevUnits =>
          prevUnits.map(u => {
            if (u.id === activeTrip.unitId) {
              return {
                ...u,
                latitude: nextWp[0],
                longitude: nextWp[1],
                speedKmH: nextSpeed,
                status: 'en_route_scene'
              };
            }
            return u;
          })
        );
      }
    }, intervalMs);

    return () => clearInterval(timer);
  }, [activeTrip, currentWaypointIndex, isPaused, simulationSpeed, signals, vehicleSpeedKmH]);

  const dispatchNewTrip = (params: {
    priorityLevel: PriorityLevel;
    callType: CallType;
    originName: string;
    originCoords: [number, number];
    destinationName: string;
    destinationCoords: [number, number];
    unitId: string;
    routeId: string;
  }) => {
    const selectedRoute = SAMPLE_ROUTE_OPTIONS.find(r => r.id === params.routeId) || SAMPLE_ROUTE_OPTIONS[0];
    const unit = units.find(u => u.id === params.unitId) || units[0];

    const newTripId = `trip-${Date.now()}`;
    const newTrip: EmergencyTrip = {
      id: newTripId,
      callNumber: `CAD-${Math.floor(100000 + Math.random() * 900000)}`,
      priorityLevel: params.priorityLevel,
      callType: params.callType,
      originName: params.originName,
      originCoords: params.originCoords,
      destinationName: params.destinationName,
      destinationCoords: params.destinationCoords,
      unitId: unit.id,
      assignedDriver: unit.driverName,
      plannedRoute: selectedRoute,
      status: 'dispatched',
      startTime: Date.now(),
      totalTravelTimeSec: 0,
      totalStoppageTimeSec: 0,
      signalsEncountered: selectedRoute.signalCount,
      interactions: [],
      gpsTrace: [
        {
          latitude: selectedRoute.waypoints[0][0],
          longitude: selectedRoute.waypoints[0][1],
          timestamp: Date.now(),
          speedKmH: 0,
          heading: 120
        }
      ],
      corridorNotifiedCount: 0,
      prioritySuccessCount: 0
    };

    setActiveTrip(newTrip);
    setCurrentWaypointIndex(0);
    setVehicleSpeedKmH(0);
    setIsPaused(false);
    setCurrentApproachingSignal(null);
    setCurrentStoppageDurationSec(0);

    // Update unit status
    setUnits(prev =>
      prev.map(u => u.id === unit.id ? { ...u, status: 'en_route_scene', assignedTripId: newTripId } : u)
    );

    addNotification(`Emergency CAD call created: ${params.callType} (${params.priorityLevel}). Assigned ${unit.callSign} via ${selectedRoute.name}.`, 'info');
  };

  const startTrip = () => {
    if (!activeTrip) return;
    setActiveTrip(prev => prev ? { ...prev, status: 'active', startTime: Date.now() } : null);
    setIsPaused(false);
    setVehicleSpeedKmH(45);
    addNotification(`Trip started for ${activeTrip.callNumber}. GPS telemetry and signal corridor logging active.`, 'success');
  };

  const pauseTrip = () => {
    setIsPaused(true);
    setVehicleSpeedKmH(0);
    addNotification(`Trip paused by operator.`, 'warning');
  };

  const resumeTrip = () => {
    setIsPaused(false);
    setVehicleSpeedKmH(45);
    addNotification(`Trip resumed.`, 'info');
  };

  const endTrip = () => {
    if (!activeTrip) return;

    soundManager.playArrivalChime();
    const completedTrip: EmergencyTrip = {
      ...activeTrip,
      status: 'completed',
      endTime: Date.now(),
      totalTravelTimeSec: Math.round((Date.now() - activeTrip.startTime) / 1000),
      totalStoppageTimeSec: activeTrip.interactions.reduce((acc, curr) => acc + curr.stoppageDurationSec, 0)
    };

    // Save to historical trips list
    setTrips(prev => [completedTrip, ...prev]);

    // Reset unit
    setUnits(prev =>
      prev.map(u => u.id === activeTrip.unitId ? { ...u, status: 'idle', speedKmH: 0, assignedTripId: undefined } : u)
    );

    // Revert any preempted signals to normal green/yellow cycle
    setSignals(prev =>
      prev.map(s => s.currentPhase === 'PREEMPTED_GREEN' ? { ...s, currentPhase: 'GREEN', phaseTimeRemainingSec: 20 } : s)
    );

    addNotification(`Trip ${completedTrip.callNumber} completed at ${completedTrip.destinationName}. Total stoppage: ${completedTrip.totalStoppageTimeSec}s across ${completedTrip.interactions.length} signals. Log stored.`, 'success');

    setActiveTrip(completedTrip);
    setVehicleSpeedKmH(0);
    setCurrentApproachingSignal(null);
    setCurrentStoppageDurationSec(0);
  };

  const triggerRouteReroute = () => {
    if (!activeTrip) return;
    // Reroute to secondary route (e.g. Parkway Bravo)
    const altRoute = SAMPLE_ROUTE_OPTIONS.find(r => r.id !== activeTrip.plannedRoute.id) || SAMPLE_ROUTE_OPTIONS[1];
    setActiveTrip(prev => prev ? {
      ...prev,
      plannedRoute: altRoute,
      deviationDetected: true
    } : null);
    setCurrentWaypointIndex(0);
    addNotification(`Dynamic re-routing executed: diverted to ${altRoute.name} to avoid gridlock. New ETA: ${altRoute.adjustedLifeSafetyEtaMinutes}m.`, 'warning');
  };

  const triggerIncidentOnSignal = (signalId: string) => {
    setActiveIncidentSignalId(signalId);
    const sig = signals.find(s => s.id === signalId);
    addNotification(`Gridlock / Accident incident flagged at ${sig?.name || signalId}. Signal delay penalties updated.`, 'warning');
  };

  const clearIncident = () => {
    setActiveIncidentSignalId(null);
    addNotification('Active intersection incidents cleared. Standard signal routing models restored.', 'info');
  };

  const toggleSignalPriorityCapability = (signalId: string) => {
    setSignals(prev =>
      prev.map(s => {
        if (s.id === signalId) {
          const next = !s.priorityCapable;
          addNotification(`${s.name} (${s.code}) priority capability set to ${next ? 'ENABLED (V2X / NEMA Preemption)' : 'DISABLED (Legacy Fixed)'}.`, 'info');
          return {
            ...s,
            priorityCapable: next,
            controllerType: next ? 'NEMA TS2' : 'Legacy Electromechanical'
          };
        }
        return s;
      })
    );
  };

  const manuallyPreemptSignal = (signalId: string) => {
    setSignals(prev =>
      prev.map(s => {
        if (s.id === signalId) {
          addNotification(`Manual emergency green wave preemption dispatched to ${s.name} (${s.code}). Phase locked for 60s.`, 'success');
          return {
            ...s,
            currentPhase: 'PREEMPTED_GREEN',
            phaseTimeRemainingSec: 60
          };
        }
        return s;
      })
    );
  };

  const reportIncident = (incidentData: Omit<ReportedIncident, 'id' | 'timestamp' | 'status'>) => {
    const newIncident: ReportedIncident = {
      ...incidentData,
      id: `inc-${Date.now()}`,
      timestamp: Date.now(),
      status: 'active'
    };

    setIncidents(prev => [newIncident, ...prev]);
    soundManager.playWarningStopBeep();
    addNotification(
      `🚨 INCIDENT REPORTED by ${newIncident.unitCallSign}: ${newIncident.type} at ${newIncident.locationName}. Route optimization delay penalties updated (+${newIncident.delayPenaltySec}s).`,
      'warning'
    );

    // If active trip's planned route intersects this signal, flag deviation / dynamic reroute advice
    if (activeTrip && newIncident.associatedSignalId) {
      if (activeTrip.plannedRoute.associatedSignalIds.includes(newIncident.associatedSignalId)) {
        addNotification(
          `⚠️ CAUTION: Active trip ${activeTrip.callNumber} corridor is compromised by driver report at ${newIncident.locationName}! Rerouting recommended.`,
          'warning'
        );
      }
    }
  };

  const resolveIncident = (incidentId: string, resolvedBy: string = 'Traffic Operations Dispatch') => {
    setIncidents(prev =>
      prev.map(inc => {
        if (inc.id === incidentId) {
          addNotification(`Incident at ${inc.locationName} (${inc.type}) marked RESOLVED by ${resolvedBy}. Standard corridor response times restored.`, 'info');
          return {
            ...inc,
            status: 'resolved',
            resolvedAt: Date.now(),
            resolvedBy
          };
        }
        return inc;
      })
    );
  };

  const resetAllToDefaults = () => {
    setSignals(INITIAL_TRAFFIC_SIGNALS);
    setCorridors(METRO_CORRIDORS);
    setUnits(INITIAL_UNITS);
    setIncidents(INITIAL_INCIDENTS);
    setActiveTrip(null);
    setCurrentWaypointIndex(0);
    setVehicleSpeedKmH(0);
    setActiveIncidentSignalId(null);
    addNotification('All signals, fleet units, and simulator state reset to default benchmark.', 'info');
  };

  return (
    <AppContext.Provider
      value={{
        signals,
        corridors,
        units,
        trips,
        activeTrip,
        activeView,
        currentWaypointIndex,
        vehicleSpeedKmH,
        isPaused,
        simulationSpeed,
        currentApproachingSignal,
        currentStoppageDurationSec,
        activeIncidentSignalId,
        incidents,
        soundEnabled,
        liveNotifications,
        setActiveView,
        setSoundEnabled,
        setSimulationSpeed,
        dispatchNewTrip,
        startTrip,
        pauseTrip,
        resumeTrip,
        endTrip,
        triggerRouteReroute,
        triggerIncidentOnSignal,
        reportIncident,
        resolveIncident,
        clearIncident,
        toggleSignalPriorityCapability,
        manuallyPreemptSignal,
        resetAllToDefaults
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
