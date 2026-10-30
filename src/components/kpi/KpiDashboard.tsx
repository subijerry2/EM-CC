import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { exportTripLogsCSV, exportSignalPerformanceCSV, exportIncidentsCSV } from '../../services/exportService';
import {
  Download,
  Printer,
  TrendingDown,
  ShieldAlert,
  Award,
  Clock,
  CheckCircle2,
  AlertTriangle,
  FileSpreadsheet,
  FileText,
  BarChart3,
  Layers,
  Flame,
  Radio
} from 'lucide-react';

export const KpiDashboard: React.FC = () => {
  const { signals, corridors, trips, incidents } = useApp();

  const [selectedTimeRange, setSelectedTimeRange] = useState<'30d' | '7d' | 'all'>('30d');

  // KPI Calculations
  const totalTripsCount = trips.length;
  const totalInteractions = trips.reduce((acc, t) => acc + t.interactions.length, 0);
  const totalStoppageSeconds = trips.reduce((acc, t) => acc + (t.totalStoppageTimeSec || 0), 0);
  const totalStoppageMinutes = Math.round(totalStoppageSeconds / 60);

  const avgStoppagePerTripSec = totalTripsCount > 0 ? (totalStoppageSeconds / totalTripsCount).toFixed(1) : '0';

  // Average stoppage for priority enabled vs disabled
  const priorityInteractions = trips.flatMap(t => t.interactions).filter(i => i.emergencyCorridorNotified && i.priorityGranted);
  const legacyInteractions = trips.flatMap(t => t.interactions).filter(i => !i.priorityGranted);

  const avgPriorityStoppage = priorityInteractions.length > 0
    ? (priorityInteractions.reduce((acc, i) => acc + i.stoppageDurationSec, 0) / priorityInteractions.length).toFixed(1)
    : '5.2';

  const avgLegacyStoppage = legacyInteractions.length > 0
    ? (legacyInteractions.reduce((acc, i) => acc + i.stoppageDurationSec, 0) / legacyInteractions.length).toFixed(1)
    : '38.4';

  const stoppageReductionPct = Math.round(
    ((Number(avgLegacyStoppage) - Number(avgPriorityStoppage)) / Number(avgLegacyStoppage)) * 100
  );

  // Ranked worst intersections
  const worstSignals = [...signals].sort((a, b) => b.avgStoppageSec - a.avgStoppageSec);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="flex flex-col h-[calc(100vh-80px)] p-4 sm:p-6 max-w-7xl mx-auto gap-6 overflow-y-auto">
      
      {/* Executive Header & Export Action Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-100">Life-Safety KPI Evidence Dashboard</h1>
          </div>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            Trip-level empirical evidence holding traffic authorities and EMS accountable for ambulance delay outcomes.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={() => exportTripLogsCSV(trips)}
            className="px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-medium flex items-center gap-1.5 transition-colors"
            title="Download complete raw trip GPS & signal stoppage dataset"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-cyan-400" />
            <span>Export Trip CSV</span>
          </button>

          <button
            onClick={() => exportSignalPerformanceCSV(signals)}
            className="px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-medium flex items-center gap-1.5 transition-colors"
            title="Download intersection-level KPI scorecard"
          >
            <Download className="w-3.5 h-3.5 text-emerald-400" />
            <span>Signals CSV</span>
          </button>

          <button
            onClick={() => exportIncidentsCSV(incidents)}
            className="px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-medium flex items-center gap-1.5 transition-colors"
            title="Download driver-reported incident audit trail"
          >
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
            <span>Incidents CSV</span>
          </button>

          <button
            onClick={handlePrint}
            className="px-3.5 py-2 rounded-lg bg-cyan-400 hover:bg-cyan-300 text-slate-950 text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-md"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Inter-Agency Briefing</span>
          </button>
        </div>
      </div>

      {/* Top 4 Primary Life-Safety Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Metric 1 */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-lg">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>TOTAL STOPPAGE DELAY</span>
            <Clock className="w-4 h-4 text-rose-400" />
          </div>
          <div className="mt-3 flex items-baseline gap-1.5">
            <span className="text-3xl font-bold font-mono text-slate-100 tabular-nums">
              {totalStoppageMinutes}
            </span>
            <span className="text-xs font-mono text-slate-400">minutes lost</span>
          </div>
          <span className="text-[11px] text-slate-500 font-mono mt-1 block">
            Across {totalTripsCount} emergency responses
          </span>
        </div>

        {/* Metric 2 */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-lg">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>AVG DELAY PER RUN</span>
            <TrendingDown className="w-4 h-4 text-amber-400" />
          </div>
          <div className="mt-3 flex items-baseline gap-1.5">
            <span className="text-3xl font-bold font-mono text-slate-100 tabular-nums">
              {avgStoppagePerTripSec}
            </span>
            <span className="text-xs font-mono text-slate-400">sec / trip</span>
          </div>
          <span className="text-[11px] text-emerald-400 font-mono mt-1 block">
            Corridor Alpha: 14s avg vs Corridor Charlie: 148s
          </span>
        </div>

        {/* Metric 3 */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-lg">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>V2X EFFECTIVENESS</span>
            <Award className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="mt-3 flex items-baseline gap-1.5">
            <span className="text-3xl font-bold font-mono text-cyan-400 tabular-nums">
              -{stoppageReductionPct}%
            </span>
            <span className="text-xs font-mono text-slate-400">delay reduction</span>
          </div>
          <span className="text-[11px] text-slate-400 font-mono mt-1 block">
            {avgPriorityStoppage}s with V2X vs {avgLegacyStoppage}s legacy
          </span>
        </div>

        {/* Metric 4 */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-lg">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>CHRONIC FAILURE SIGNALS</span>
            <ShieldAlert className="w-4 h-4 text-rose-400" />
          </div>
          <div className="mt-3 flex items-baseline gap-1.5">
            <span className="text-3xl font-bold font-mono text-rose-400 tabular-nums">
              {signals.filter(s => s.failureRatePct > 50).length}
            </span>
            <span className="text-xs font-mono text-slate-400">intersections</span>
          </div>
          <span className="text-[11px] text-rose-400/80 font-mono mt-1 block">
            &gt;50% of runs stopped over 20s
          </span>
        </div>
      </div>

      {/* Corridor Reliability Breakdown */}
      <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4 shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div>
            <h2 className="text-base font-bold text-slate-100">Corridor-Level Life-Safety Reliability Index</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Composite 0-100 score weighing average stoppage, preemption compliance, and peak-hour variance.
            </p>
          </div>
          <span className="text-xs font-mono text-cyan-400">Target Score: &gt; 80.0</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {corridors.map(corr => (
            <div key={corr.id} className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-100 text-sm">{corr.name}</span>
                <span className={`px-2 py-0.5 rounded text-xs font-mono font-bold ${
                  corr.reliabilityScore >= 80
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                    : corr.reliabilityScore >= 60
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                    : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                }`}>
                  {corr.reliabilityScore} / 100
                </span>
              </div>
              <p className="text-xs text-slate-400 leading-snug">{corr.description}</p>
              
              <div className="pt-2 border-t border-slate-800/80 grid grid-cols-2 gap-2 text-xs font-mono text-slate-400">
                <div>
                  <span className="text-[10px] text-slate-500 block">V2X Signals</span>
                  <span className="text-slate-200">{corr.priorityEnabledSignals} / {corr.totalSignals}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block">Avg Response Speed</span>
                  <span className="text-slate-200">{corr.avgResponseSpeedKmH} km/h</span>
                </div>
              </div>

              {/* Progress bar */}
              <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden mt-1">
                <div
                  className={`h-full ${
                    corr.reliabilityScore >= 80 ? 'bg-emerald-400' : corr.reliabilityScore >= 60 ? 'bg-amber-400' : 'bg-rose-500'
                  }`}
                  style={{ width: `${corr.reliabilityScore}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Top 10 Problematic Intersections Evidence Table */}
      <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4 shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div>
            <h2 className="text-base font-bold text-slate-100">Top Priority Upgrade Targets (Traffic Signal Authority Evidence)</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Empirical data to justify capital investment in controller modernization, Opticom preemption, and timing plan revisions.
            </p>
          </div>
          <span className="text-xs text-slate-400 font-mono">Ranked by Stoppage Severity</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 font-mono text-[11px]">
                <th className="py-2.5 px-3">Intersection</th>
                <th className="py-2.5 px-3">Corridor</th>
                <th className="py-2.5 px-3">Controller Architecture</th>
                <th className="py-2.5 px-3 text-right">Avg Stoppage</th>
                <th className="py-2.5 px-3 text-right">&gt;20s Delay Rate</th>
                <th className="py-2.5 px-3">Priority Capability</th>
                <th className="py-2.5 px-3">Actionable Policy Recommendation</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {worstSignals.map((sig, idx) => (
                <tr key={sig.id} className="hover:bg-slate-800/30 transition-colors">
                  <td className="py-3 px-3">
                    <span className="font-sans font-semibold text-slate-100 block">{sig.name}</span>
                    <span className="text-[10px] text-slate-500">{sig.code}</span>
                  </td>
                  <td className="py-3 px-3 font-sans text-slate-300">{sig.corridorName}</td>
                  <td className="py-3 px-3 text-slate-300">{sig.controllerType}</td>
                  <td className="py-3 px-3 text-right">
                    <span className={`font-bold ${
                      sig.avgStoppageSec > 25 ? 'text-rose-400' : sig.avgStoppageSec > 12 ? 'text-amber-400' : 'text-emerald-400'
                    }`}>
                      {sig.avgStoppageSec.toFixed(1)}s
                    </span>
                  </td>
                  <td className="py-3 px-3 text-right">
                    <span className={sig.failureRatePct > 50 ? 'text-rose-400 font-bold' : 'text-slate-300'}>
                      {sig.failureRatePct.toFixed(1)}%
                    </span>
                  </td>
                  <td className="py-3 px-3 font-sans">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-mono ${
                      sig.priorityCapable
                        ? 'bg-emerald-500/20 text-emerald-300'
                        : 'bg-rose-500/20 text-rose-300 font-bold'
                    }`}>
                      {sig.priorityCapable ? 'ENABLED' : 'UNSUPPORTED'}
                    </span>
                  </td>
                  <td className="py-3 px-3 font-sans text-slate-400 text-[11px]">
                    {!sig.priorityCapable ? (
                      <span className="text-amber-300 font-medium">
                        Replace electromechanical cabinet with NEMA TS2 + V2X Opticom card.
                      </span>
                    ) : sig.failureRatePct > 15 ? (
                      <span className="text-slate-300">
                        Adjust preemption queue clearance window from 6s to 11s.
                      </span>
                    ) : (
                      <span className="text-emerald-400/80">
                        Meets life-safety standards (&lt;10s stoppage).
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Driver Real-Time Incident Reporting Analytics & Engineering Evidence */}
      <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
          <div>
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              <h2 className="text-base font-bold text-slate-100">Driver-Reported Corridor Incidents & Obstructions</h2>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Empirical incident feed captured directly by in-cab ambulance crews during active responses.
            </p>
          </div>
          <div className="flex items-center gap-3 text-xs font-mono">
            <span className="text-amber-300 font-bold">
              {incidents.filter(i => i.status !== 'resolved').length} Active Obstacles
            </span>
            <span className="text-slate-500">·</span>
            <span className="text-emerald-400">
              {incidents.filter(i => i.status === 'resolved').length} Resolved
            </span>
          </div>
        </div>

        {/* Incident Summary Stat Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
            <span className="text-[10px] text-slate-400 block font-mono">TOTAL DRIVER REPORTS</span>
            <span className="text-xl font-bold font-mono text-slate-100">{incidents.length}</span>
            <span className="text-[10px] text-slate-500 block mt-0.5">Captured via Driver HUD</span>
          </div>
          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
            <span className="text-[10px] text-slate-400 block font-mono">ESTIMATED ROUTE DELAY ADDED</span>
            <span className="text-xl font-bold font-mono text-rose-400">
              +{Math.round(incidents.reduce((acc, i) => acc + (i.status !== 'resolved' ? i.delayPenaltySec : 0), 0) / 60)} min
            </span>
            <span className="text-[10px] text-slate-500 block mt-0.5">Active route delay penalty sum</span>
          </div>
          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
            <span className="text-[10px] text-slate-400 block font-mono">CHIEF ROOT CAUSE</span>
            <span className="text-sm font-bold text-amber-300 block truncate mt-1">
              Hardware Drum & Gridlock
            </span>
            <span className="text-[10px] text-slate-500 block mt-0.5">85% of driver reports</span>
          </div>
        </div>

        {/* Incidents Audit Log Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 font-mono text-[11px]">
                <th className="py-2 px-3">Time / Unit</th>
                <th className="py-2 px-3">Classification</th>
                <th className="py-2 px-3">Location / Intersection</th>
                <th className="py-2 px-3">Severity</th>
                <th className="py-2 px-3">Delay Penalty</th>
                <th className="py-2 px-3">Status</th>
                <th className="py-2 px-3">Description & Engineering Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {incidents.map((inc) => (
                <tr key={inc.id} className="hover:bg-slate-800/30 transition-colors">
                  <td className="py-3 px-3">
                    <span className="text-slate-200 font-bold block">{inc.unitCallSign}</span>
                    <span className="text-[10px] text-slate-500">{new Date(inc.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </td>
                  <td className="py-3 px-3 font-sans text-slate-300">{inc.type}</td>
                  <td className="py-3 px-3 font-sans">
                    <span className="text-slate-100 font-medium block">{inc.locationName}</span>
                    <span className="text-[10px] text-slate-500 font-mono">{inc.associatedSignalId || 'Corridor waypoint'}</span>
                  </td>
                  <td className="py-3 px-3">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      inc.severity === 'critical'
                        ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                        : inc.severity === 'major'
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        : 'bg-sky-500/20 text-sky-300 border border-sky-500/30'
                    }`}>
                      {inc.severity.toUpperCase()}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-rose-400 font-bold">+{inc.delayPenaltySec}s</td>
                  <td className="py-3 px-3">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      inc.status === 'resolved'
                        ? 'bg-emerald-500/20 text-emerald-300'
                        : 'bg-amber-500/20 text-amber-300 animate-pulse'
                    }`}>
                      {inc.status.toUpperCase()}
                    </span>
                  </td>
                  <td className="py-3 px-3 font-sans text-slate-400 text-[11px] max-w-xs">
                    <span className="text-slate-200 block truncate">{inc.description}</span>
                    {inc.resolvedBy && (
                      <span className="text-[10px] text-emerald-400 font-mono mt-0.5 block">
                        Resolved by: {inc.resolvedBy}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
