import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { TacticalMap } from '../common/TacticalMap';
import { TrafficSignal, HeatmapFilterState } from '../../types';
import {
  Flame,
  Filter,
  Layers,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Sliders,
  TrendingUp,
  Cpu,
  Zap,
  Info
} from 'lucide-react';

export const HeatmapView: React.FC = () => {
  const { signals, corridors, units, incidents, activeTrip, toggleSignalPriorityCapability, manuallyPreemptSignal } = useApp();

  const [filter, setFilter] = useState<HeatmapFilterState>({
    timeOfDay: 'all',
    dayOfWeek: 'all',
    tripType: 'all',
    corridorId: 'all',
    metric: 'avg_stoppage'
  });

  const [selectedSignal, setSelectedSignal] = useState<TrafficSignal | null>(null);

  // Filter signals based on corridor selection
  const filteredSignals = useMemo(() => {
    return signals.filter(sig => {
      if (filter.corridorId !== 'all' && sig.corridorId !== filter.corridorId) {
        return false;
      }
      return true;
    });
  }, [signals, filter.corridorId]);

  // Problem spots (>25s stop or >40% failure)
  const problematicSignals = useMemo(() => {
    return [...signals].sort((a, b) => b.avgStoppageSec - a.avgStoppageSec);
  }, [signals]);

  return (
    <div className="flex flex-col lg:flex-row h-[calc(100vh-80px)] p-4 sm:p-6 max-w-7xl mx-auto gap-6 overflow-hidden">
      
      {/* Left Column: Filter Bar & Hotspot Ranking List */}
      <div className="w-full lg:w-[400px] flex flex-col gap-4 shrink-0 overflow-y-auto pr-1">
        
        {/* Heatmap Overview Header */}
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2 shadow-lg">
          <div className="flex items-center gap-2 text-rose-400">
            <Flame className="w-4 h-4" />
            <h1 className="text-base font-bold text-slate-100">Signal Stoppage Heatmap</h1>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Spatial aggregation of 40+ emergency runs identifying chronic signal delay bottlenecks and priority failures across city corridors.
          </p>
        </div>

        {/* Filter Controls Panel */}
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-3 shadow-lg">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-300 border-b border-slate-800 pb-2">
            <span className="flex items-center gap-1.5"><Filter className="w-3.5 h-3.5 text-cyan-400" /> Heatmap Filters</span>
            <button
              onClick={() => setFilter({
                timeOfDay: 'all',
                dayOfWeek: 'all',
                tripType: 'all',
                corridorId: 'all',
                metric: 'avg_stoppage'
              })}
              className="text-[10px] text-cyan-400 hover:underline"
            >
              Reset
            </button>
          </div>

          {/* Metric Selector (Segmented buttons) */}
          <div>
            <label className="text-[11px] font-semibold text-slate-400 block mb-1">Visualization Metric</label>
            <div className="grid grid-cols-3 gap-1 p-1 bg-slate-950 rounded-lg border border-slate-800 text-[11px]">
              <button
                onClick={() => setFilter(prev => ({ ...prev, metric: 'avg_stoppage' }))}
                className={`py-1.5 px-2 rounded-md font-medium transition-all ${
                  filter.metric === 'avg_stoppage' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Avg Stop (s)
              </button>
              <button
                onClick={() => setFilter(prev => ({ ...prev, metric: 'fail_rate' }))}
                className={`py-1.5 px-2 rounded-md font-medium transition-all ${
                  filter.metric === 'fail_rate' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                &gt;20s Delay %
              </button>
              <button
                onClick={() => setFilter(prev => ({ ...prev, metric: 'total_volume' }))}
                className={`py-1.5 px-2 rounded-md font-medium transition-all ${
                  filter.metric === 'total_volume' ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Trip Volume
              </button>
            </div>
          </div>

          {/* Time of Day */}
          <div>
            <label className="text-[11px] font-semibold text-slate-400 block mb-1">Time of Day</label>
            <select
              value={filter.timeOfDay}
              onChange={(e) => setFilter(prev => ({ ...prev, timeOfDay: e.target.value as HeatmapFilterState['timeOfDay'] }))}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none"
            >
              <option value="all">All Hours (24/7 Consolidated)</option>
              <option value="morning_peak">Morning Peak (07:00 - 09:30)</option>
              <option value="midday">Midday Normal (10:00 - 15:30)</option>
              <option value="evening_rush">Evening Rush Hour (16:00 - 19:30)</option>
              <option value="night">Night Emergency (20:00 - 06:00)</option>
            </select>
          </div>

          {/* Corridor Selection */}
          <div>
            <label className="text-[11px] font-semibold text-slate-400 block mb-1">Corridor Filter</label>
            <select
              value={filter.corridorId}
              onChange={(e) => setFilter(prev => ({ ...prev, corridorId: e.target.value }))}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none"
            >
              <option value="all">All Monitored Corridors (Entire Metro)</option>
              {corridors.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Top Delay Hotspots List */}
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2 flex-1">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <span className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
              Highest Stoppage Hotspots
            </span>
            <span className="text-[10px] text-slate-400 font-mono">Ranked</span>
          </div>

          <div className="space-y-1.5 max-h-72 overflow-y-auto pr-1">
            {problematicSignals.map((sig, idx) => {
              const isSelected = selectedSignal?.id === sig.id;
              return (
                <div
                  key={sig.id}
                  onClick={() => setSelectedSignal(sig)}
                  className={`p-2.5 rounded-lg border cursor-pointer transition-all text-xs flex items-center justify-between ${
                    isSelected
                      ? 'bg-cyan-950/40 border-cyan-400 text-cyan-200 ring-1 ring-cyan-400/40'
                      : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-2.5 truncate">
                    <span className="font-mono text-[10px] text-slate-500 w-4">{idx + 1}.</span>
                    <div className="truncate">
                      <span className="font-semibold text-slate-200 block truncate">{sig.name}</span>
                      <span className="text-[10px] text-slate-500 font-mono">{sig.code} · {sig.controllerType}</span>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className={`font-mono font-bold text-xs ${
                      sig.avgStoppageSec > 25 ? 'text-rose-400' : sig.avgStoppageSec > 12 ? 'text-amber-400' : 'text-emerald-400'
                    }`}>
                      {sig.avgStoppageSec.toFixed(1)}s
                    </span>
                    <span className="block text-[9px] font-mono text-slate-400">
                      {sig.failureRatePct.toFixed(0)}% stop &gt;20s
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>

      {/* Center & Right: Tactical Map with Heatmap Overlays and Detail Drawer */}
      <div className="flex-1 flex flex-col rounded-2xl overflow-hidden border border-slate-800 bg-slate-950 relative shadow-xl">
        <TacticalMap
          signals={filteredSignals}
          corridors={corridors}
          units={units}
          activeTrip={activeTrip}
          incidents={incidents}
          showHeatmapLayers={true}
          heatmapMetric={filter.metric}
          highlightSignalId={selectedSignal?.id}
          onSelectSignal={(sig) => setSelectedSignal(sig)}
          className="w-full h-full"
        />

        {/* Selected Signal Inspection Drawer */}
        {selectedSignal && (
          <div className="absolute top-4 right-4 max-w-sm w-full bg-slate-950/95 border border-slate-800 rounded-2xl p-4 backdrop-blur-md shadow-2xl z-[400] space-y-3 animate-in fade-in slide-in-from-right-4 duration-200">
            <div className="flex items-start justify-between border-b border-slate-800 pb-2">
              <div>
                <span className="text-[10px] font-mono text-cyan-400">{selectedSignal.code} · {selectedSignal.corridorName}</span>
                <h3 className="text-sm font-bold text-slate-100">{selectedSignal.name}</h3>
              </div>
              <button
                onClick={() => setSelectedSignal(null)}
                className="text-slate-400 hover:text-white p-1 text-xs"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2 rounded bg-slate-900 border border-slate-800">
                <span className="text-[10px] text-slate-400 block">Avg Stoppage</span>
                <span className="font-mono text-base font-bold text-slate-100">{selectedSignal.avgStoppageSec.toFixed(1)}s</span>
              </div>
              <div className="p-2 rounded bg-slate-900 border border-slate-800">
                <span className="text-[10px] text-slate-400 block">&gt;20s Failure Rate</span>
                <span className={`font-mono text-base font-bold ${
                  selectedSignal.failureRatePct > 40 ? 'text-rose-400' : 'text-slate-100'
                }`}>
                  {selectedSignal.failureRatePct.toFixed(1)}%
                </span>
              </div>
            </div>

            <div className="space-y-1.5 text-xs text-slate-300">
              <div className="flex justify-between text-[11px]">
                <span className="text-slate-400">Controller Cabinet:</span>
                <span className="font-mono text-slate-200">{selectedSignal.controllerType}</span>
              </div>
              <div className="flex justify-between text-[11px]">
                <span className="text-slate-400">Cycle Time:</span>
                <span className="font-mono text-slate-200">{selectedSignal.cycleTimeSec}s</span>
              </div>
              <div className="flex justify-between text-[11px]">
                <span className="text-slate-400">Priority Capability:</span>
                <span className={`font-semibold ${selectedSignal.priorityCapable ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {selectedSignal.priorityCapable ? 'Active (V2X / NEMA)' : 'No Preemption'}
                </span>
              </div>
            </div>

            {selectedSignal.notes && (
              <div className="p-2 rounded bg-slate-900/60 border border-slate-800 text-[11px] text-slate-400 leading-snug">
                {selectedSignal.notes}
              </div>
            )}

            {/* Quick Actions to Test / Toggle Priority */}
            <div className="pt-2 border-t border-slate-800 flex gap-2">
              <button
                onClick={() => toggleSignalPriorityCapability(selectedSignal.id)}
                className={`flex-1 py-1.5 px-2 rounded-lg text-[11px] font-semibold border transition-colors ${
                  selectedSignal.priorityCapable
                    ? 'bg-rose-500/10 text-rose-300 border-rose-500/30 hover:bg-rose-500/20'
                    : 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/25'
                }`}
              >
                {selectedSignal.priorityCapable ? 'Disable V2X' : 'Enable V2X Priority'}
              </button>
              <button
                onClick={() => manuallyPreemptSignal(selectedSignal.id)}
                className="py-1.5 px-3 rounded-lg text-[11px] font-semibold bg-cyan-400 hover:bg-cyan-300 text-slate-950 transition-colors"
              >
                Force Green
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
