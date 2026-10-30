import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { TacticalMap } from '../common/TacticalMap';
import { ReportIncidentModal } from './ReportIncidentModal';
import {
  Navigation,
  Radio,
  Clock,
  Gauge,
  AlertTriangle,
  Play,
  Pause,
  CheckCircle2,
  Volume2,
  VolumeX,
  Compass,
  Zap,
  ArrowUp,
  ArrowRight,
  ArrowLeft,
  Hospital,
  Flame,
  RotateCcw
} from 'lucide-react';

export const DriverHUD: React.FC = () => {
  const {
    activeTrip,
    signals,
    corridors,
    units,
    incidents,
    currentWaypointIndex,
    vehicleSpeedKmH,
    isPaused,
    currentApproachingSignal,
    currentStoppageDurationSec,
    soundEnabled,
    setSoundEnabled,
    startTrip,
    pauseTrip,
    resumeTrip,
    endTrip,
    triggerRouteReroute,
    triggerIncidentOnSignal
  } = useApp();

  const [incidentReported, setIncidentReported] = useState<string | null>(null);
  const [isReportModalOpen, setIsReportModalOpen] = useState<boolean>(false);

  if (!activeTrip) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[500px] p-8 text-center bg-slate-900/40 rounded-2xl border border-slate-800 m-6">
        <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 mb-4 shadow-lg">
          <Navigation className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-slate-100">Driver In-Cab Navigation Standby</h2>
        <p className="text-sm text-slate-400 max-w-md mt-2">
          No active emergency trip assigned to this vehicle console. Use the Dispatcher CAD console to assign an emergency call or launch a test corridor run.
        </p>
      </div>
    );
  }

  const plannedRoute = activeTrip.plannedRoute;
  const turnInstructions = plannedRoute.turnInstructions;
  const currentTurn = turnInstructions[Math.min(turnInstructions.length - 1, Math.floor((currentWaypointIndex / plannedRoute.waypoints.length) * turnInstructions.length))];

  const isStoppedAtSignal = vehicleSpeedKmH === 0 && activeTrip.status === 'active';
  const isPriorityGranted = currentApproachingSignal && currentApproachingSignal.priorityCapable;

  const handleReportIncident = (reason: string) => {
    setIncidentReported(reason);
    if (currentApproachingSignal) {
      triggerIncidentOnSignal(currentApproachingSignal.id);
    }
    setTimeout(() => {
      triggerRouteReroute();
      setIncidentReported(null);
    }, 1200);
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6 p-4 sm:p-6 max-w-7xl mx-auto h-[calc(100vh-80px)]">
      {/* Left Column: Driver In-Cab Primary Control Cockpit */}
      <div className="w-full lg:w-[420px] flex flex-col gap-4 shrink-0 overflow-y-auto pr-1">
        
        {/* Top Emergency Call Banner */}
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between shadow-lg">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono text-cyan-400">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
              <span>{activeTrip.callNumber}</span>
              <span>·</span>
              <span className="text-slate-400">{activeTrip.priorityLevel}</span>
            </div>
            <h1 className="text-base font-bold text-slate-100 mt-1">{activeTrip.callType}</h1>
            <div className="text-xs text-slate-400 flex items-center gap-1.5 mt-0.5">
              <Hospital className="w-3.5 h-3.5 text-rose-400" />
              <span>Dest: {activeTrip.destinationName}</span>
            </div>
          </div>
          <div className="text-right">
            <span className="text-[10px] font-mono text-slate-400 block">ASSIGNED UNIT</span>
            <span className="text-sm font-bold font-mono text-slate-100 bg-slate-800 px-2 py-1 rounded border border-slate-700">
              {units.find(u => u.id === activeTrip.unitId)?.callSign || 'MEDIC-04'}
            </span>
          </div>
        </div>

        {/* Turn-by-Turn Maneuver Guidance Card */}
        <div className="p-5 rounded-2xl bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-800 shadow-xl relative overflow-hidden">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-xl bg-cyan-500/15 border border-cyan-400/40 flex items-center justify-center text-cyan-400 shrink-0 shadow-md">
              {currentTurn.icon === 'turn_right' ? (
                <ArrowRight className="w-8 h-8" />
              ) : currentTurn.icon === 'turn_left' ? (
                <ArrowLeft className="w-8 h-8" />
              ) : currentTurn.icon === 'destination' ? (
                <Hospital className="w-8 h-8 text-rose-400" />
              ) : (
                <ArrowUp className="w-8 h-8" />
              )}
            </div>
            <div className="flex-1">
              <span className="text-[11px] font-mono text-cyan-400 tracking-wide font-medium">NEXT MANEUVER</span>
              <h2 className="text-lg font-bold text-slate-100 leading-snug mt-0.5">{currentTurn.instruction}</h2>
              <div className="text-xs text-slate-400 mt-1 flex items-center gap-2 font-mono">
                <span>{currentTurn.streetName}</span>
                <span>·</span>
                <span className="text-slate-300 font-semibold">{currentTurn.distanceM}m</span>
              </div>
            </div>
          </div>
        </div>

        {/* Emergency Corridor V2X & Signal Delay Telemetry Banner */}
        <div className={`p-4 rounded-xl border transition-all shadow-lg ${
          currentApproachingSignal
            ? isPriorityGranted
              ? 'bg-cyan-950/40 border-cyan-500/60 ring-1 ring-cyan-500/40'
              : 'bg-rose-950/40 border-rose-500/60 ring-1 ring-rose-500/40'
            : 'bg-slate-900 border-slate-800'
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Radio className={`w-4 h-4 ${
                currentApproachingSignal
                  ? isPriorityGranted ? 'text-cyan-400 animate-pulse' : 'text-rose-400 animate-bounce'
                  : 'text-slate-500'
              }`} />
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                {currentApproachingSignal ? 'Upcoming Intersection V2X' : 'Corridor Priority Status'}
              </span>
            </div>
            <span className="text-[10px] font-mono text-slate-400">
              {currentApproachingSignal ? currentApproachingSignal.code : 'MONITORING'}
            </span>
          </div>

          {currentApproachingSignal ? (
            <div className="mt-2.5">
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-slate-100">{currentApproachingSignal.name}</span>
                <span className={`px-2 py-0.5 rounded text-xs font-mono font-bold ${
                  currentApproachingSignal.currentPhase === 'PREEMPTED_GREEN'
                    ? 'bg-cyan-400 text-slate-950 shadow-[0_0_10px_rgba(6,182,212,0.6)]'
                    : currentApproachingSignal.currentPhase === 'GREEN'
                    ? 'bg-emerald-500 text-slate-950'
                    : currentApproachingSignal.currentPhase === 'YELLOW'
                    ? 'bg-amber-400 text-slate-950'
                    : 'bg-rose-500 text-white'
                }`}>
                  {currentApproachingSignal.currentPhase}
                </span>
              </div>
              <p className="text-xs mt-1.5 text-slate-300 leading-relaxed">
                {isPriorityGranted
                  ? 'Green-wave preemption active. Controller queue cleared for immediate emergency transit.'
                  : 'Legacy uncoordinated signal. High risk of red phase stoppage (historic avg 36s).'}
              </p>
            </div>
          ) : (
            <div className="mt-2 text-xs text-slate-400">
              Corridor active on <strong className="text-slate-200">{plannedRoute.name}</strong>. {plannedRoute.priorityCapableCount}/{plannedRoute.signalCount} intersections preemption-ready.
            </div>
          )}
        </div>

        {/* Speedometer & Stoppage Stopwatch Cluster */}
        <div className="grid grid-cols-2 gap-3">
          {/* Speedometer */}
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
              <span className="flex items-center gap-1.5"><Gauge className="w-3.5 h-3.5 text-cyan-400" /> SPEED</span>
              <span className="font-mono text-[11px] text-slate-500">KM/H</span>
            </div>
            <div className="mt-2 flex items-baseline gap-1">
              <span className="text-3xl font-bold font-mono text-slate-100 tabular-nums">
                {vehicleSpeedKmH}
              </span>
              <span className="text-xs text-slate-400 font-mono">km/h</span>
            </div>
            <div className="mt-2 w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-300 ${
                  vehicleSpeedKmH > 50 ? 'bg-cyan-400' : vehicleSpeedKmH > 20 ? 'bg-blue-400' : 'bg-rose-500'
                }`}
                style={{ width: `${Math.min(100, (vehicleSpeedKmH / 80) * 100)}%` }}
              />
            </div>
          </div>

          {/* Stoppage Stopwatch */}
          <div className={`p-4 rounded-xl border flex flex-col justify-between transition-colors ${
            isStoppedAtSignal && currentStoppageDurationSec > 0
              ? 'bg-rose-950/30 border-rose-500/50'
              : 'bg-slate-900 border-slate-800'
          }`}>
            <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
              <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5 text-rose-400" /> SIGNAL STOP</span>
              <span className="font-mono text-[11px] text-slate-500">TIME</span>
            </div>
            <div className="mt-2 flex items-baseline gap-1">
              <span className={`text-3xl font-bold font-mono tabular-nums ${
                currentStoppageDurationSec > 20 ? 'text-rose-400 animate-pulse' : currentStoppageDurationSec > 0 ? 'text-amber-400' : 'text-slate-400'
              }`}>
                {currentStoppageDurationSec}
              </span>
              <span className="text-xs text-slate-400 font-mono">sec</span>
            </div>
            <span className="text-[10px] text-slate-400 truncate">
              {currentStoppageDurationSec > 0 ? 'Active intersection delay' : 'Free flow clearance'}
            </span>
          </div>
        </div>

        {/* Real-Time Route Incident Warning Banner if any active incident affects this route */}
        {(() => {
          const activeRouteIncidents = incidents.filter(
            i => i.status !== 'resolved' && i.associatedSignalId && plannedRoute.associatedSignalIds.includes(i.associatedSignalId)
          );
          if (activeRouteIncidents.length === 0) return null;
          const top = activeRouteIncidents[0];
          return (
            <div className="p-3.5 rounded-xl bg-amber-500/15 border border-amber-500/40 text-xs text-amber-200 flex flex-col gap-2 shadow-lg">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-slate-100 block">{top.type}</span>
                    <span className="text-[11px] text-amber-300/90">{top.locationName} (+{top.delayPenaltySec}s route delay)</span>
                  </div>
                </div>
                <button
                  onClick={triggerRouteReroute}
                  className="px-2.5 py-1 text-[11px] font-bold bg-amber-400 text-slate-950 rounded-lg hover:bg-amber-300 transition-colors shrink-0 flex items-center gap-1"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Reroute</span>
                </button>
              </div>
              <p className="text-[11px] text-slate-300 italic">"{top.description}"</p>
            </div>
          );
        })()}

        {/* Quick Driver Action Controls */}
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex flex-col gap-3 shadow-lg">
          <div className="flex items-center gap-2">
            {activeTrip.status === 'dispatched' ? (
              <button
                onClick={startTrip}
                className="flex-1 py-3 px-4 rounded-xl font-bold text-sm bg-emerald-500 hover:bg-emerald-400 text-slate-950 transition-all flex items-center justify-center gap-2 shadow-lg"
              >
                <Play className="w-4 h-4 fill-current" />
                <span>START EMERGENCY TRIP</span>
              </button>
            ) : activeTrip.status === 'active' ? (
              <>
                <button
                  onClick={isPaused ? resumeTrip : pauseTrip}
                  className={`flex-1 py-2.5 px-3 rounded-lg text-xs font-semibold border flex items-center justify-center gap-1.5 transition-colors ${
                    isPaused
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                      : 'bg-slate-800 text-slate-200 border-slate-700 hover:bg-slate-700'
                  }`}
                >
                  {isPaused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
                  <span>{isPaused ? 'Resume' : 'Pause'}</span>
                </button>
                <button
                  onClick={endTrip}
                  className="py-2.5 px-4 rounded-lg text-xs font-semibold bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 transition-colors flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>End at Hospital</span>
                </button>
              </>
            ) : (
              <div className="text-xs text-slate-400 text-center w-full py-1">Trip completed. Logs archived.</div>
            )}
          </div>

          {/* Real-Time Driver Incident Reporting Hub */}
          <div className="pt-2 border-t border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-slate-300 font-semibold flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                Real-Time Incident Reporting
              </span>
              <span className="text-[10px] font-mono text-cyan-400">Updates CAD & Reroute</span>
            </div>

            {/* Primary Log Incident Button */}
            <button
              onClick={() => setIsReportModalOpen(true)}
              className="w-full py-2.5 px-3 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-200 text-xs font-bold transition-all shadow-md flex items-center justify-center gap-2"
            >
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              <span>Log Incident with Location & Details</span>
            </button>

            {/* Fast 1-Tap Shortcut Buttons */}
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => handleReportIncident('Signal Stuck Red / No Preemption')}
                disabled={!!incidentReported}
                className="p-2 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-[11px] text-slate-300 border border-slate-700 transition-colors text-left flex items-center gap-1.5"
              >
                <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0" />
                <span className="truncate">Signal Stuck Red</span>
              </button>
              <button
                onClick={() => handleReportIncident('Intersection Gridlock')}
                disabled={!!incidentReported}
                className="p-2 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-[11px] text-slate-300 border border-slate-700 transition-colors text-left flex items-center gap-1.5"
              >
                <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
                <span className="truncate">Civilian Gridlock</span>
              </button>
            </div>
            {incidentReported && (
              <div className="mt-1 p-2 rounded bg-amber-500/10 border border-amber-500/30 text-[11px] text-amber-300 flex items-center gap-1.5">
                <Zap className="w-3 h-3 animate-spin" />
                <span>Logged to CAD. Recalculating dynamic alternate route...</span>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Right Column: Full-Screen Tactical Map View with Signal Status Overlays */}
      <div className="flex-1 flex flex-col h-full rounded-2xl overflow-hidden border border-slate-800 bg-slate-950 shadow-2xl relative">
        <TacticalMap
          signals={signals}
          corridors={corridors}
          units={units}
          activeTrip={activeTrip}
          incidents={incidents}
          currentWaypointIndex={currentWaypointIndex}
          highlightSignalId={currentApproachingSignal?.id}
          className="w-full h-full"
        />

        {/* In-Cab Incident Reporting Modal */}
        <ReportIncidentModal
          isOpen={isReportModalOpen}
          onClose={() => setIsReportModalOpen(false)}
          defaultSignalId={currentApproachingSignal?.id}
        />

        {/* Floating In-Cab Upcoming Signals Strip */}
        <div className="absolute top-4 right-4 max-w-sm w-full bg-slate-950/90 border border-slate-800/90 rounded-xl p-3 backdrop-blur-md shadow-2xl z-[400] hidden sm:block">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-2">
            <span className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
              <Compass className="w-3.5 h-3.5 text-cyan-400" />
              Upcoming Corridor Signals ({plannedRoute.signalCount})
            </span>
            <span className="text-[10px] font-mono text-cyan-400">{plannedRoute.name}</span>
          </div>
          <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
            {plannedRoute.associatedSignalIds.map((sigId, idx) => {
              const sig = signals.find(s => s.id === sigId);
              if (!sig) return null;
              const isCurrent = currentApproachingSignal?.id === sig.id;
              return (
                <div
                  key={sig.id}
                  className={`flex items-center justify-between p-1.5 rounded-lg text-xs transition-colors ${
                    isCurrent
                      ? 'bg-cyan-500/15 border border-cyan-500/40 text-cyan-200'
                      : 'bg-slate-900/60 text-slate-400'
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-500" />
                    <span className="font-mono text-[10px] text-slate-400">{sig.code}</span>
                    <span className="truncate text-slate-200">{sig.name}</span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 font-mono text-[10px]">
                    <span className={`px-1 rounded text-[9px] ${
                      sig.priorityCapable ? 'text-emerald-400 bg-emerald-500/10' : 'text-rose-400 bg-rose-500/10'
                    }`}>
                      {sig.priorityCapable ? 'PREEMPT' : 'NO V2X'}
                    </span>
                    <span className="text-slate-400">~{sig.avgStoppageSec.toFixed(0)}s avg</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
