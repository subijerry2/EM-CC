import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { PriorityLevel, CallType } from '../../types';
import { SAMPLE_ROUTE_OPTIONS } from '../../data/mockData';
import { optimizeRoutes } from '../../services/routeOptimizer';
import { X, Siren, Hospital, Ambulance, ShieldAlert, Check } from 'lucide-react';

interface NewDispatchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NewDispatchModal: React.FC<NewDispatchModalProps> = ({ isOpen, onClose }) => {
  const { signals, units, dispatchNewTrip, setActiveView, activeIncidentSignalId } = useApp();

  const [priorityLevel, setPriorityLevel] = useState<PriorityLevel>('Code 3 (Critical)');
  const [callType, setCallType] = useState<CallType>('Cardiac Arrest');
  const [originName, setOriginName] = useState<string>('Civic Center EMS Station 4');
  const [destinationName, setDestinationName] = useState<string>('Metro General Trauma Hospital');
  const [selectedUnitId, setSelectedUnitId] = useState<string>(units[0]?.id || 'unit-med-04');
  const [selectedRouteId, setSelectedRouteId] = useState<string>('route-opt-1');

  if (!isOpen) return null;

  const optimization = optimizeRoutes(signals, new Date().getHours(), activeIncidentSignalId || undefined);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    dispatchNewTrip({
      priorityLevel,
      callType,
      originName,
      originCoords: [37.7790, -122.4280],
      destinationName,
      destinationCoords: [37.7685, -122.4010],
      unitId: selectedUnitId,
      routeId: selectedRouteId
    });

    onClose();
    setActiveView('driver_hud');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/40">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400">
              <Siren className="w-4 h-4 animate-pulse" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100">Create Emergency CAD Dispatch</h2>
              <p className="text-xs text-slate-400">Tuned for life-safety emergency corridor routing</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
          {/* Priority & Call Type Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1.5">Priority Triage Level</label>
              <select
                value={priorityLevel}
                onChange={(e) => setPriorityLevel(e.target.value as PriorityLevel)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-cyan-400 font-mono"
              >
                <option value="Code 3 (Critical)">Code 3 (Critical - Lights & Siren)</option>
                <option value="Code 2 (Urgent)">Code 2 (Urgent - Life Threatening)</option>
                <option value="Code 1 (Standard)">Code 1 (Standard Response)</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1.5">Incident Nature</label>
              <select
                value={callType}
                onChange={(e) => setCallType(e.target.value as CallType)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-cyan-400"
              >
                <option value="Cardiac Arrest">Cardiac Arrest</option>
                <option value="Trauma / MVA">Trauma / MVA Major Crash</option>
                <option value="Respiratory Distress">Respiratory Distress</option>
                <option value="Stroke Alert">Stroke Alert (Time Critical)</option>
                <option value="Pediatric Emergency">Pediatric Emergency</option>
              </select>
            </div>
          </div>

          {/* Origin & Destination Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1.5">Scene / Incident Location</label>
              <input
                type="text"
                value={originName}
                onChange={(e) => setOriginName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-cyan-400"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1.5">Destination Receiving Facility</label>
              <input
                type="text"
                value={destinationName}
                onChange={(e) => setDestinationName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-cyan-400"
              />
            </div>
          </div>

          {/* Assign Vehicle Unit */}
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1.5">Assigned Emergency Vehicle</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {units.map((unit) => {
                const isSelected = selectedUnitId === unit.id;
                return (
                  <button
                    type="button"
                    key={unit.id}
                    onClick={() => setSelectedUnitId(unit.id)}
                    className={`p-2.5 rounded-xl border text-left transition-all ${
                      isSelected
                        ? 'bg-cyan-950/40 border-cyan-400 ring-1 ring-cyan-400/40 text-cyan-200'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <div className="font-mono font-bold text-xs text-slate-100">{unit.callSign}</div>
                    <div className="text-[10px] text-slate-400 truncate">{unit.driverName}</div>
                    <span className="text-[9px] font-mono text-emerald-400 mt-1 block">READY</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Real-time Route Optimization Recommendations */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-slate-300">
                Corridor Route Optimization (Life-Safety Scoring)
              </label>
              <span className="text-[10px] font-mono text-cyan-400">Signal-Penalty Adjusted</span>
            </div>

            <div className="space-y-2">
              {optimization.routes.map((route) => {
                const isSelected = selectedRouteId === route.id;
                return (
                  <div
                    key={route.id}
                    onClick={() => setSelectedRouteId(route.id)}
                    className={`p-3.5 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                      isSelected
                        ? 'bg-cyan-950/40 border-cyan-400 ring-1 ring-cyan-400/50'
                        : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-100 text-xs">{route.name}</span>
                        {route.recommended && (
                          <span className="px-1.5 py-0.2 rounded text-[9px] font-mono bg-cyan-400 text-slate-950 font-black">
                            OPTIMAL
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-400">{route.corridorSummary}</p>
                      <div className="text-[10px] font-mono text-slate-400 flex items-center gap-3 pt-1">
                        <span>{route.signalCount} signals ({route.priorityCapableCount} V2X)</span>
                        <span>·</span>
                        <span>Pred. Stoppage: ~{route.predictedStoppageSec}s</span>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="text-lg font-bold font-mono text-cyan-400">
                        {route.adjustedLifeSafetyEtaMinutes}m
                      </div>
                      <div className="text-[10px] font-mono text-emerald-400 font-semibold">
                        Score: {route.safetyScore}/100
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-slate-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 text-xs font-semibold text-slate-950 bg-cyan-400 hover:bg-cyan-300 rounded-lg transition-all shadow-[0_0_15px_rgba(6,182,212,0.3)] flex items-center gap-2"
            >
              <Check className="w-4 h-4" />
              <span>Confirm & Dispatch Unit</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
