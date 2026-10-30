import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { TacticalMap } from '../common/TacticalMap';
import { SAMPLE_ROUTE_OPTIONS } from '../../data/mockData';
import { optimizeRoutes } from '../../services/routeOptimizer';
import {
  Radio,
  Clock,
  ShieldAlert,
  ArrowRight,
  TrendingDown,
  Navigation,
  CheckCircle2,
  AlertTriangle,
  Play,
  RotateCcw,
  Zap,
  Ambulance,
  Compass,
  FileText,
  Activity,
  Server
} from 'lucide-react';
import { PriorityLevel, CallType } from '../../types';
import { SystemDiagnosticsDrawer } from './SystemDiagnosticsDrawer';

export const DispatcherCAD: React.FC<{ onOpenDispatchModal: () => void }> = ({ onOpenDispatchModal }) => {
  const {
    activeTrip,
    signals,
    corridors,
    units,
    trips,
    incidents,
    resolveIncident,
    currentWaypointIndex,
    vehicleSpeedKmH,
    startTrip,
    endTrip,
    triggerRouteReroute,
    triggerIncidentOnSignal,
    setActiveView,
    activeIncidentSignalId,
    clearIncident
  } = useApp();

  const [selectedRouteId, setSelectedRouteId] = useState<string>('route-opt-1');
  const [isDiagnosticsOpen, setIsDiagnosticsOpen] = useState<boolean>(false);
  const optimizationResults = optimizeRoutes(signals, new Date().getHours(), activeIncidentSignalId || undefined, incidents);

  const activeUnit = activeTrip ? units.find(u => u.id === activeTrip.unitId) : null;
  const recentCompletedTrips = trips.filter(t => t.status === 'completed').slice(0, 5);
  const activeDriverIncidents = incidents.filter(i => i.status !== 'resolved');

  return (
    <div className="flex flex-col h-[calc(100vh-80px)] p-4 sm:p-6 max-w-7xl mx-auto gap-6 overflow-hidden">
      
      {/* Top Telemetry & CAD Overview Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 shrink-0">
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>ACTIVE EMERGENCY TRIPS</span>
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          </div>
          <div className="mt-2 text-2xl font-bold font-mono text-slate-100">
            {activeTrip && activeTrip.status === 'active' ? '1 ACTIVE' : '0 DISPATCHED'}
          </div>
          <span className="text-[11px] text-slate-500 font-mono mt-1 block">
            {units.filter(u => u.status === 'idle').length} units available in fleet
          </span>
        </div>

        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>CORRIDOR SIGNALS ACTIVE</span>
            <Radio className="w-3.5 h-3.5 text-cyan-400" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono text-cyan-400">
            {signals.filter(s => s.priorityCapable).length} / {signals.length}
          </div>
          <span className="text-[11px] text-slate-500 font-mono mt-1 block">
            V2X / Preemption Capable
          </span>
        </div>

        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>AVG SIGNAL STOPPAGE</span>
            <TrendingDown className="w-3.5 h-3.5 text-amber-400" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono text-slate-100">
            {(signals.reduce((acc, curr) => acc + curr.avgStoppageSec, 0) / signals.length).toFixed(1)}s
          </div>
          <span className="text-[11px] text-emerald-400 font-mono mt-1 block">
            -42% on V2X Corridors
          </span>
        </div>

        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-slate-400 text-xs block">SYSTEM & OPS</span>
            <div className="text-sm font-semibold text-slate-200 mt-1">CAD Controls</div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsDiagnosticsOpen(true)}
              className="px-2.5 py-2 text-xs font-semibold text-cyan-300 bg-cyan-950/70 hover:bg-cyan-900/80 border border-cyan-500/40 rounded-lg transition-colors flex items-center gap-1.5 shadow-sm"
              title="Open Infrastructure Connectivity & Corridor Heartbeat Diagnostics"
            >
              <Activity className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
              <span>Diagnostics</span>
            </button>
            <button
              onClick={onOpenDispatchModal}
              className="px-3 py-2 text-xs font-semibold text-slate-950 bg-cyan-400 hover:bg-cyan-300 rounded-lg transition-colors shadow-md"
            >
              + Call
            </button>
          </div>
        </div>
      </div>

      {/* Main Workspace Split: Map + Active Dispatch Console / Route Planner */}
      <div className="flex-1 flex flex-col lg:flex-row gap-6 min-h-0">
        
        {/* Left Side: Tactical Map of Fleet & Active Corridors */}
        <div className="flex-1 flex flex-col rounded-2xl overflow-hidden border border-slate-800 bg-slate-950 relative shadow-xl">
          <TacticalMap
            signals={signals}
            corridors={corridors}
            units={units}
            activeTrip={activeTrip}
            incidents={incidents}
            currentWaypointIndex={currentWaypointIndex}
            className="w-full h-full"
          />

          {/* Overlay System Diagnostics Trigger Pill */}
          <button
            onClick={() => setIsDiagnosticsOpen(true)}
            className="absolute top-3 right-3 z-[400] bg-slate-950/90 border border-slate-700/90 hover:border-cyan-500/80 hover:bg-slate-900 rounded-xl px-3 py-2 backdrop-blur-md shadow-2xl text-xs flex items-center gap-2.5 text-slate-200 transition-all group"
            title="Inspect V2X corridor websocket connectivity, latency, and heartbeats"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <div className="text-left">
              <span className="font-mono text-[11px] font-bold text-cyan-400 block group-hover:text-cyan-300">
                System Diagnostics
              </span>
              <span className="text-[10px] text-slate-400 font-mono block">
                Live Feed · 3 Corridors OK
              </span>
            </div>
            <Activity className="w-4 h-4 text-cyan-400 ml-1 group-hover:scale-110 transition-transform" />
          </button>

          {/* Overlay CAD Unit Status Tag */}
          <div className="absolute top-3 left-3 z-[400] bg-slate-950/90 border border-slate-800 rounded-xl p-2.5 backdrop-blur-md shadow-xl text-xs max-w-xs">
            <span className="text-[10px] font-mono text-slate-400 block mb-1">MONITORED FLEET</span>
            <div className="space-y-1">
              {units.map(u => (
                <div key={u.id} className="flex items-center justify-between gap-3 text-[11px]">
                  <span className="font-mono font-bold text-slate-200">{u.callSign}</span>
                  <span className={`px-1.5 py-0.2 rounded text-[10px] ${
                    u.status === 'en_route_scene'
                      ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30 font-semibold animate-pulse'
                      : 'bg-slate-800 text-slate-400'
                  }`}>
                    {u.status}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Overlay Active Driver Incidents Alert Pill */}
          {activeDriverIncidents.length > 0 && (
            <div className="absolute bottom-10 right-3 z-[400] bg-amber-950/90 border border-amber-500/60 rounded-xl p-2.5 backdrop-blur-md shadow-2xl text-xs max-w-sm flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5 animate-bounce" />
              <div>
                <div className="font-bold text-amber-200 text-[11px] flex items-center gap-1.5">
                  <span>{activeDriverIncidents.length} Active Driver Incident{activeDriverIncidents.length > 1 ? 's' : ''}</span>
                  <span className="text-[9px] px-1 py-0.2 rounded bg-amber-400/20 text-amber-300 font-mono">CAD SYNCED</span>
                </div>
                <div className="text-[10px] text-slate-300 mt-0.5 truncate">
                  Latest: {activeDriverIncidents[0].type} at {activeDriverIncidents[0].locationName}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Side: CAD Dispatch Control & Live Trip Inspector */}
        <div className="w-full lg:w-[460px] flex flex-col gap-4 shrink-0 overflow-y-auto pr-1">
          
          {/* Active Trip Telemetry Card */}
          {activeTrip ? (
            <div className="p-5 rounded-2xl bg-slate-900 border border-cyan-500/40 shadow-xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono text-cyan-400 font-bold">{activeTrip.callNumber}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30 font-semibold">
                      {activeTrip.priorityLevel}
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-slate-100 mt-1">{activeTrip.callType}</h3>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-mono text-slate-400 block">STATUS</span>
                  <span className="text-xs font-mono font-bold text-emerald-400 uppercase">{activeTrip.status}</span>
                </div>
              </div>

              {/* Trip stats breakdown */}
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="p-2.5 rounded-lg bg-slate-950/80 border border-slate-800">
                  <span className="text-[10px] text-slate-400 block">Speed</span>
                  <span className="text-base font-bold font-mono text-slate-100">{vehicleSpeedKmH} km/h</span>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-950/80 border border-slate-800">
                  <span className="text-[10px] text-slate-400 block">Stoppage Time</span>
                  <span className="text-base font-bold font-mono text-rose-400">{activeTrip.totalStoppageTimeSec || 0}s</span>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-950/80 border border-slate-800">
                  <span className="text-[10px] text-slate-400 block">V2X Preempted</span>
                  <span className="text-base font-bold font-mono text-cyan-400">
                    {activeTrip.prioritySuccessCount} / {activeTrip.plannedRoute.signalCount}
                  </span>
                </div>
              </div>

              {/* Planned Route Name and Life Safety Score */}
              <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800 flex items-center justify-between text-xs">
                <div>
                  <span className="text-[10px] text-slate-500 block font-mono">SELECTED CORRIDOR</span>
                  <span className="text-slate-200 font-semibold">{activeTrip.plannedRoute.name}</span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-500 block font-mono">RELIABILITY</span>
                  <span className="text-emerald-400 font-mono font-bold">{activeTrip.plannedRoute.safetyScore} / 100</span>
                </div>
              </div>

              {/* Live Signal Interactions Log list */}
              <div>
                <span className="text-xs font-semibold text-slate-300 block mb-2">Signal Interaction Real-Time Logs:</span>
                <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                  {activeTrip.interactions.length === 0 ? (
                    <div className="text-xs text-slate-500 py-2 text-center">Approaching initial corridor signals...</div>
                  ) : (
                    activeTrip.interactions.map((log) => (
                      <div key={log.id} className="flex items-center justify-between p-2 rounded bg-slate-950 border border-slate-800 text-xs">
                        <div className="truncate pr-2">
                          <span className="font-semibold text-slate-200 block truncate">{log.signalName}</span>
                          <span className="text-[10px] text-slate-500 font-mono">
                            Approach: {log.phaseOnApproach} · Notified V2X: {log.emergencyCorridorNotified ? 'Yes' : 'No'}
                          </span>
                        </div>
                        <div className="text-right shrink-0">
                          <span className={`px-1.5 py-0.5 rounded text-[10px] font-mono ${
                            log.priorityGranted ? 'text-cyan-300 bg-cyan-950' : 'text-rose-400 bg-rose-950'
                          }`}>
                            {log.priorityGranted ? 'PREEMPTED' : 'LEGACY RED'}
                          </span>
                          <span className="block text-[10px] font-mono text-slate-400 mt-0.5">
                            Stop: {log.stoppageDurationSec}s
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Controls */}
              <div className="flex gap-2 pt-1 border-t border-slate-800">
                {activeTrip.status === 'dispatched' && (
                  <button
                    onClick={startTrip}
                    className="flex-1 py-2 px-3 rounded-lg text-xs font-semibold bg-emerald-500 hover:bg-emerald-400 text-slate-950 transition-colors flex items-center justify-center gap-1.5"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>Start Run</span>
                  </button>
                )}
                <button
                  onClick={triggerRouteReroute}
                  className="flex-1 py-2 px-3 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors flex items-center justify-center gap-1.5"
                  title="Simulate incident to trigger dynamic alternate corridor recalculation"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Simulate Re-Route</span>
                </button>
                <button
                  onClick={() => setActiveView('driver_hud')}
                  className="py-2 px-3 rounded-lg text-xs font-semibold bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 hover:bg-cyan-500/30 transition-colors"
                >
                  Driver HUD &rarr;
                </button>
              </div>
            </div>
          ) : (
            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 text-center space-y-3">
              <Ambulance className="w-10 h-10 text-slate-600 mx-auto" />
              <h3 className="text-base font-bold text-slate-200">No Active Emergency Trip</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                All 4 ambulance units are in ready status. Create a new emergency dispatch call to test real-time life-safety routing and signal preemption.
              </p>
              <button
                onClick={onOpenDispatchModal}
                className="py-2 px-4 text-xs font-semibold bg-cyan-400 text-slate-950 hover:bg-cyan-300 rounded-lg transition-colors inline-flex items-center gap-2"
              >
                <span>Launch New Dispatch</span>
              </button>
            </div>
          )}

          {/* Active Driver Incidents Management Panel */}
          {activeDriverIncidents.length > 0 && (
            <div className="p-4 rounded-2xl bg-amber-950/20 border border-amber-500/40 space-y-2.5 shadow-xl">
              <div className="flex items-center justify-between border-b border-amber-500/20 pb-2">
                <span className="text-xs font-bold text-amber-200 flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                  Active Driver Reports ({activeDriverIncidents.length})
                </span>
                <span className="text-[10px] font-mono text-amber-300/80">Affecting Route Scoring</span>
              </div>

              <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                {activeDriverIncidents.map(inc => (
                  <div key={inc.id} className="p-2.5 rounded-xl bg-slate-950/90 border border-amber-500/30 text-xs space-y-1.5">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="font-bold text-slate-100 block">{inc.type}</span>
                        <span className="text-[10px] font-mono text-cyan-400">{inc.locationName}</span>
                      </div>
                      <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                        +{inc.delayPenaltySec}s
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-300 leading-snug">{inc.description}</p>
                    <div className="flex items-center justify-between pt-1 border-t border-slate-800 text-[10px] text-slate-400">
                      <span>Reported by: <strong className="text-slate-200">{inc.unitCallSign}</strong></span>
                      <button
                        onClick={() => resolveIncident(inc.id, 'Dispatcher Console')}
                        className="px-2 py-0.5 rounded bg-slate-800 hover:bg-emerald-500/20 hover:text-emerald-300 hover:border-emerald-500/40 border border-slate-700 text-[10px] font-semibold text-slate-300 transition-colors"
                      >
                        ✓ Mark Resolved
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Candidate Route Comparison Engine Preview */}
          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                <Compass className="w-3.5 h-3.5 text-cyan-400" />
                Real-Time Route Delay Optimization
              </span>
              <span className="text-[10px] font-mono text-emerald-400">AI Scoring Active</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Routes scored by life-safety criteria: base traffic travel time + historical signal delay penalties per corridor.
            </p>
            <div className="space-y-2">
              {optimizationResults.routes.map(route => (
                <div
                  key={route.id}
                  className={`p-3 rounded-xl border transition-all text-xs ${
                    route.recommended
                      ? 'bg-cyan-950/20 border-cyan-500/50 ring-1 ring-cyan-500/30'
                      : 'bg-slate-950 border-slate-800/80 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-100 flex items-center gap-1.5">
                      {route.name}
                      {route.recommended && (
                        <span className="px-1.5 py-0.2 rounded text-[9px] font-mono bg-cyan-400 text-slate-950 font-black">
                          RECOMMENDED
                        </span>
                      )}
                    </span>
                    <span className="font-mono font-bold text-cyan-400 text-sm">
                      {route.adjustedLifeSafetyEtaMinutes}m ETA
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1">{route.corridorSummary}</div>
                  <div className="flex items-center justify-between pt-2 mt-2 border-t border-slate-800/60 font-mono text-[10px] text-slate-400">
                    <span>Base: {route.baseEtaMinutes}m + Stop Delay: {route.signalDelayPenaltyMinutes}m</span>
                    <span className="text-emerald-400 font-semibold">Reliability: {route.safetyScore}/100</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Completed Trips Audit */}
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-200">Recent Completed Corridor Logs</span>
              <button
                onClick={() => setActiveView('kpi_dashboard')}
                className="text-[11px] text-cyan-400 hover:underline flex items-center gap-1"
              >
                <span>View Full KPI Hub</span> &rarr;
              </button>
            </div>
            <div className="space-y-1.5">
              {recentCompletedTrips.map(trip => (
                <div key={trip.id} className="flex items-center justify-between p-2 rounded bg-slate-950 border border-slate-800 text-[11px]">
                  <div>
                    <span className="font-mono text-slate-200 font-semibold">{trip.callNumber}</span>
                    <span className="text-slate-500 block text-[10px]">{trip.callType} · {trip.plannedRoute.name}</span>
                  </div>
                  <div className="text-right font-mono">
                    <span className="text-slate-300 font-semibold">{Math.round((trip.totalTravelTimeSec || 0) / 60)}m total</span>
                    <span className="block text-[10px] text-rose-400">{trip.totalStoppageTimeSec}s signal stop</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>

      {/* System Diagnostics Slide-Over Drawer */}
      <SystemDiagnosticsDrawer
        isOpen={isDiagnosticsOpen}
        onClose={() => setIsDiagnosticsOpen(false)}
      />
    </div>
  );
};
