import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { IncidentType, IncidentSeverity } from '../../types';
import { AlertTriangle, MapPin, X, Send, Siren, Radio, Check, Flame } from 'lucide-react';

interface ReportIncidentModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultSignalId?: string | null;
}

export const ReportIncidentModal: React.FC<ReportIncidentModalProps> = ({
  isOpen,
  onClose,
  defaultSignalId
}) => {
  const { signals, units, activeTrip, reportIncident } = useApp();

  const assignedUnit = activeTrip ? units.find(u => u.id === activeTrip.unitId) : units[0];

  const defaultSig = defaultSignalId ? signals.find(s => s.id === defaultSignalId) : signals[0];

  const [selectedType, setSelectedType] = useState<IncidentType>('Signal Stuck Red / Hardware Malfunction');
  const [severity, setSeverity] = useState<IncidentSeverity>('major');
  const [selectedSignalId, setSelectedSignalId] = useState<string>(defaultSig?.id || signals[0]?.id || 'sig-101');
  const [description, setDescription] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  if (!isOpen) return null;

  const currentSig = signals.find(s => s.id === selectedSignalId) || signals[0];

  const quickPresets = [
    'Signal drum cycle locked on red during peak flow',
    'Civilian queue blocked intersection box, emergency preemption ignored',
    'Optical V2X receiver sensor obscured by scaffolding / tree branches',
    'Downed utility pole and construction blocking two primary lanes'
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const penalty = severity === 'critical' ? 180 : severity === 'major' ? 120 : 60;

    reportIncident({
      tripId: activeTrip?.id,
      callNumber: activeTrip?.callNumber,
      unitId: assignedUnit?.id || 'unit-med-04',
      unitCallSign: assignedUnit?.callSign || 'MEDIC-04',
      driverName: assignedUnit?.driverName || 'Officer Marcus Cole',
      type: selectedType,
      severity,
      description: description.trim() || `Driver flagged ${selectedType} at ${currentSig.name}`,
      locationName: currentSig.name,
      latitude: currentSig.latitude,
      longitude: currentSig.longitude,
      associatedSignalId: currentSig.id,
      corridorId: currentSig.corridorId,
      delayPenaltySec: penalty
    });

    setIsSubmitting(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-150">
      <div className="w-full max-w-xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
              <AlertTriangle className="w-4 h-4 animate-bounce" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100">Report In-Cab Corridor Incident</h2>
              <p className="text-xs text-slate-400">Instantly broadcasts delay penalty to CAD & dynamic rerouting</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
          
          {/* Incident Type Grid */}
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-2">Incident Classification</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {(
                [
                  'Signal Stuck Red / Hardware Malfunction',
                  'Intersection Gridlock / Dense Civilian Queue',
                  'Opticom / V2X Sensor Obstructed',
                  'Road Closure / Downed Utility',
                  'Emergency Vehicle Collision / MVA',
                  'Construction / Lane Reduction'
                ] as IncidentType[]
              ).map((type) => {
                const isSelected = selectedType === type;
                return (
                  <button
                    type="button"
                    key={type}
                    onClick={() => setSelectedType(type)}
                    className={`p-2.5 rounded-xl border text-left text-xs font-medium transition-all ${
                      isSelected
                        ? 'bg-amber-500/20 border-amber-400 text-amber-200 ring-1 ring-amber-400/50'
                        : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    {type}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Location / Intersection Picker */}
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1.5 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-cyan-400" />
              Incident Location / Affected Intersection
            </label>
            <select
              value={selectedSignalId}
              onChange={(e) => setSelectedSignalId(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-cyan-400 font-mono"
            >
              {signals.map((sig) => (
                <option key={sig.id} value={sig.id}>
                  {sig.code} · {sig.name} ({sig.corridorName})
                </option>
              ))}
            </select>
          </div>

          {/* Severity & Delay Impact Selector */}
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1.5">
              Severity Level & Estimated Route Delay Penalty
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setSeverity('moderate')}
                className={`p-2 rounded-xl border text-center transition-all ${
                  severity === 'moderate'
                    ? 'bg-sky-500/20 border-sky-400 text-sky-200 ring-1 ring-sky-400'
                    : 'bg-slate-950 border-slate-800 text-slate-400'
                }`}
              >
                <span className="block text-xs font-bold">Moderate</span>
                <span className="font-mono text-[10px] text-sky-300">+60s Delay</span>
              </button>
              <button
                type="button"
                onClick={() => setSeverity('major')}
                className={`p-2 rounded-xl border text-center transition-all ${
                  severity === 'major'
                    ? 'bg-amber-500/20 border-amber-400 text-amber-200 ring-1 ring-amber-400'
                    : 'bg-slate-950 border-slate-800 text-slate-400'
                }`}
              >
                <span className="block text-xs font-bold">Major</span>
                <span className="font-mono text-[10px] text-amber-300">+120s Delay</span>
              </button>
              <button
                type="button"
                onClick={() => setSeverity('critical')}
                className={`p-2 rounded-xl border text-center transition-all ${
                  severity === 'critical'
                    ? 'bg-rose-500/20 border-rose-400 text-rose-200 ring-1 ring-rose-400'
                    : 'bg-slate-950 border-slate-800 text-slate-400'
                }`}
              >
                <span className="block text-xs font-bold">Critical</span>
                <span className="font-mono text-[10px] text-rose-300">+180s Delay</span>
              </button>
            </div>
          </div>

          {/* Quick Preset Buttons */}
          <div>
            <span className="text-[11px] font-semibold text-slate-400 block mb-1.5">Quick Incident Notes:</span>
            <div className="flex flex-wrap gap-1.5">
              {quickPresets.map((preset, idx) => (
                <button
                  type="button"
                  key={idx}
                  onClick={() => setDescription(preset)}
                  className="px-2.5 py-1 rounded-md bg-slate-800/80 hover:bg-slate-700 border border-slate-700/60 text-[11px] text-slate-300 transition-colors text-left"
                >
                  {preset}
                </button>
              ))}
            </div>
          </div>

          {/* Description Textarea */}
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1.5">
              Detailed Description / Driver Observations
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe what is causing the bottleneck (e.g., civil gridlock, traffic controller cabinet flashing red, lane blockage)..."
              rows={2}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-400"
            />
          </div>

          {/* Action Row */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-slate-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 text-xs font-semibold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-lg transition-all shadow-[0_0_15px_rgba(251,191,36,0.3)] flex items-center gap-2"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Broadcast Incident Alert</span>
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
