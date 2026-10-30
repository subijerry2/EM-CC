import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { TrafficSignal, SignalPhase } from '../../types';
import {
  Radio,
  Cpu,
  Zap,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Sliders,
  ShieldCheck,
  Server
} from 'lucide-react';

export const SignalControllerSim: React.FC = () => {
  const {
    signals,
    activeTrip,
    currentApproachingSignal,
    toggleSignalPriorityCapability,
    manuallyPreemptSignal,
    incidents
  } = useApp();

  const [selectedCorridorFilter, setSelectedCorridorFilter] = useState<string>('all');

  const filteredSignals = signals.filter(
    s => selectedCorridorFilter === 'all' || s.corridorId === selectedCorridorFilter
  );

  return (
    <div className="flex flex-col h-[calc(100vh-80px)] p-4 sm:p-6 max-w-7xl mx-auto gap-6 overflow-y-auto">
      
      {/* Infrastructure Top Overview */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl">
        <div>
          <div className="flex items-center gap-2">
            <Cpu className="w-5 h-5 text-cyan-400" />
            <h1 className="text-xl font-bold text-slate-100">Traffic Signal Infrastructure & V2X Simulator</h1>
          </div>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            Intelligent Transportation Systems (ITS) digital twin simulating real-time NEMA TS2 controllers, Opticom optical preemption, and connected vehicle corridor green waves.
          </p>
        </div>

        <div className="flex items-center gap-3 text-xs">
          <div className="px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 font-mono text-slate-300">
            <span className="text-slate-500 mr-2">V2X Mesh:</span>
            <span className="text-emerald-400 font-bold">DSRC 5.9 GHz ACTIVE</span>
          </div>
        </div>
      </div>

      {/* Signal Status Summary Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
          <span className="text-xs text-slate-400 block">TOTAL INTERSECTIONS</span>
          <div className="text-2xl font-bold font-mono text-slate-100 mt-1">{signals.length}</div>
          <span className="text-[11px] text-slate-500 font-mono">Metro Arterial Network</span>
        </div>
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
          <span className="text-xs text-slate-400 block">PREEMPTION ENABLED</span>
          <div className="text-2xl font-bold font-mono text-cyan-400 mt-1">
            {signals.filter(s => s.priorityCapable).length}
          </div>
          <span className="text-[11px] text-emerald-400 font-mono">Ready for Green Wave</span>
        </div>
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
          <span className="text-xs text-slate-400 block">LEGACY CABINETS</span>
          <div className="text-2xl font-bold font-mono text-rose-400 mt-1">
            {signals.filter(s => !s.priorityCapable).length}
          </div>
          <span className="text-[11px] text-rose-400/80 font-mono">Requires Hardware Upgrade</span>
        </div>
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
          <span className="text-xs text-slate-400 block">ACTIVE DRIVER INCIDENTS</span>
          <div className="text-2xl font-bold font-mono text-amber-400 mt-1">
            {incidents.filter(i => i.status !== 'resolved').length}
          </div>
          <span className="text-[11px] text-amber-300/80 font-mono">Obstacles in Field</span>
        </div>
      </div>

      {/* Corridor Filter Bar */}
      <div className="flex items-center justify-between p-2 rounded-xl bg-slate-900 border border-slate-800 text-xs">
        <div className="flex items-center gap-2">
          <span className="text-slate-400 font-medium ml-2">Filter Corridor:</span>
          <button
            onClick={() => setSelectedCorridorFilter('all')}
            className={`px-3 py-1 rounded-lg transition-colors ${
              selectedCorridorFilter === 'all' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-bold' : 'text-slate-400 hover:text-white'
            }`}
          >
            All Corridors
          </button>
          <button
            onClick={() => setSelectedCorridorFilter('corridor-alpha')}
            className={`px-3 py-1 rounded-lg transition-colors ${
              selectedCorridorFilter === 'corridor-alpha' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-bold' : 'text-slate-400 hover:text-white'
            }`}
          >
            Spine Alpha (Central)
          </button>
          <button
            onClick={() => setSelectedCorridorFilter('corridor-bravo')}
            className={`px-3 py-1 rounded-lg transition-colors ${
              selectedCorridorFilter === 'corridor-bravo' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-bold' : 'text-slate-400 hover:text-white'
            }`}
          >
            Parkway Bravo (River)
          </button>
          <button
            onClick={() => setSelectedCorridorFilter('corridor-charlie')}
            className={`px-3 py-1 rounded-lg transition-colors ${
              selectedCorridorFilter === 'corridor-charlie' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-bold' : 'text-slate-400 hover:text-white'
            }`}
          >
            Metro Link Charlie (Commercial)
          </button>
        </div>
        <span className="text-slate-400 font-mono mr-2">Showing {filteredSignals.length} Controllers</span>
      </div>

      {/* Grid of All Signal Controllers */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredSignals.map(sig => {
          const isApproaching = currentApproachingSignal?.id === sig.id;
          const isPreempted = sig.currentPhase === 'PREEMPTED_GREEN';
          const activeIncidentOnSig = incidents.find(i => i.status !== 'resolved' && i.associatedSignalId === sig.id);

          return (
            <div
              key={sig.id}
              className={`p-4 rounded-xl border transition-all space-y-3 ${
                isPreempted
                  ? 'bg-cyan-950/30 border-cyan-400 ring-2 ring-cyan-400/50 shadow-xl'
                  : isApproaching
                  ? 'bg-slate-900 border-amber-500/60'
                  : 'bg-slate-900/90 border-slate-800'
              }`}
            >
              {/* Header */}
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] font-mono text-cyan-400">{sig.code} · {sig.corridorName}</span>
                  <h3 className="text-sm font-bold text-slate-100 mt-0.5">{sig.name}</h3>
                </div>
                <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                  sig.currentPhase === 'PREEMPTED_GREEN'
                    ? 'bg-cyan-400 text-slate-950 animate-pulse'
                    : sig.currentPhase === 'GREEN'
                    ? 'bg-emerald-500 text-slate-950'
                    : sig.currentPhase === 'YELLOW'
                    ? 'bg-amber-400 text-slate-950'
                    : 'bg-rose-500 text-white'
                }`}>
                  {sig.currentPhase} ({sig.phaseTimeRemainingSec}s)
                </span>
              </div>

              {/* Active Incident Warning if reported here */}
              {activeIncidentOnSig && (
                <div className="p-2 rounded bg-amber-500/15 border border-amber-500/40 text-[11px] text-amber-200 flex items-start gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                  <div className="truncate">
                    <span className="font-bold block truncate">{activeIncidentOnSig.type}</span>
                    <span className="text-[10px] text-amber-300 font-mono">+{activeIncidentOnSig.delayPenaltySec}s penalty applied</span>
                  </div>
                </div>
              )}

              {/* Metrics */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2 rounded bg-slate-950/80 border border-slate-800">
                  <span className="text-[10px] text-slate-400 block font-mono">Avg Stop</span>
                  <span className="text-sm font-bold font-mono text-slate-200">{sig.avgStoppageSec.toFixed(1)}s</span>
                </div>
                <div className="p-2 rounded bg-slate-950/80 border border-slate-800">
                  <span className="text-[10px] text-slate-400 block font-mono">&gt;20s Delay %</span>
                  <span className={`text-sm font-bold font-mono ${sig.failureRatePct > 40 ? 'text-rose-400' : 'text-slate-200'}`}>
                    {sig.failureRatePct.toFixed(1)}%
                  </span>
                </div>
              </div>

              {/* Controller Specifications */}
              <div className="space-y-1 text-xs text-slate-400">
                <div className="flex justify-between">
                  <span>Cabinet Type:</span>
                  <span className="font-mono text-slate-200">{sig.controllerType}</span>
                </div>
                <div className="flex justify-between">
                  <span>Cycle Length:</span>
                  <span className="font-mono text-slate-200">{sig.cycleTimeSec}s</span>
                </div>
                <div className="flex justify-between">
                  <span>Preemption Hardware:</span>
                  <span className={`font-semibold ${sig.priorityCapable ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {sig.priorityCapable ? 'V2X Optical / DSRC' : 'None (Fixed)'}
                  </span>
                </div>
              </div>

              {/* Hardware Actions */}
              <div className="pt-2 border-t border-slate-800 flex gap-2">
                <button
                  onClick={() => toggleSignalPriorityCapability(sig.id)}
                  className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-semibold border transition-colors ${
                    sig.priorityCapable
                      ? 'bg-rose-500/10 text-rose-300 border-rose-500/30 hover:bg-rose-500/20'
                      : 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/25'
                  }`}
                >
                  {sig.priorityCapable ? 'Disable V2X' : 'Enable V2X'}
                </button>
                <button
                  onClick={() => manuallyPreemptSignal(sig.id)}
                  className="py-1.5 px-3 rounded-lg text-xs font-semibold bg-cyan-400 text-slate-950 hover:bg-cyan-300 transition-colors"
                >
                  Force Green
                </button>
              </div>
            </div>
          );
        })}
      </div>

    </div>
  );
};
