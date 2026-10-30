import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import { TrafficSignal, Corridor, AmbulanceUnit, EmergencyTrip, ReportedIncident } from '../../types';

interface TacticalMapProps {
  signals: TrafficSignal[];
  corridors: Corridor[];
  units: AmbulanceUnit[];
  activeTrip: EmergencyTrip | null;
  incidents?: ReportedIncident[];
  currentWaypointIndex?: number;
  highlightSignalId?: string | null;
  showHeatmapLayers?: boolean;
  heatmapMetric?: 'avg_stoppage' | 'fail_rate' | 'total_volume';
  onSelectSignal?: (signal: TrafficSignal) => void;
  className?: string;
  compact?: boolean;
}

export const TacticalMap: React.FC<TacticalMapProps> = ({
  signals,
  corridors,
  units,
  activeTrip,
  incidents = [],
  currentWaypointIndex = 0,
  highlightSignalId,
  showHeatmapLayers = false,
  heatmapMetric = 'avg_stoppage',
  onSelectSignal,
  className = 'h-full w-full',
  compact = false
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const layersRef = useRef<{
    routesGroup: L.LayerGroup;
    signalsGroup: L.LayerGroup;
    unitsGroup: L.LayerGroup;
    heatmapGroup: L.LayerGroup;
    incidentsGroup: L.LayerGroup;
  }>({
    routesGroup: L.layerGroup(),
    signalsGroup: L.layerGroup(),
    unitsGroup: L.layerGroup(),
    heatmapGroup: L.layerGroup(),
    incidentsGroup: L.layerGroup()
  });

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: [37.7745, -122.4150],
      zoom: compact ? 13 : 14,
      zoomControl: !compact,
      attributionControl: false
    });

    // Dark tactical basemap tiles
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      maxZoom: 19,
      subdomains: 'abcd'
    }).addTo(map);

    layersRef.current.routesGroup.addTo(map);
    layersRef.current.heatmapGroup.addTo(map);
    layersRef.current.signalsGroup.addTo(map);
    layersRef.current.unitsGroup.addTo(map);
    layersRef.current.incidentsGroup.addTo(map);

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, [compact]);

  // Handle map resize on container layout change
  useEffect(() => {
    const timer = setTimeout(() => {
      mapInstanceRef.current?.invalidateSize();
    }, 200);
    return () => clearTimeout(timer);
  }, [compact]);

  // Update Corridors and Active Route Lines
  useEffect(() => {
    const { routesGroup } = layersRef.current;
    routesGroup.clearLayers();

    // 1. Draw subtle background corridors
    corridors.forEach(corr => {
      L.polyline(corr.waypoints, {
        color: corr.color,
        weight: 3,
        opacity: 0.35,
        dashArray: '4, 8'
      }).addTo(routesGroup);
    });

    // 2. Draw active emergency route
    if (activeTrip) {
      const waypoints = activeTrip.plannedRoute.waypoints;

      // Outer glow line
      L.polyline(waypoints, {
        color: '#06b6d4',
        weight: 8,
        opacity: 0.3,
        lineCap: 'round'
      }).addTo(routesGroup);

      // Core route line
      L.polyline(waypoints, {
        color: '#22d3ee',
        weight: 4,
        opacity: 0.95,
        lineCap: 'round'
      }).addTo(routesGroup);

      // Traveled route line in emerald
      if (currentWaypointIndex > 0 && currentWaypointIndex < waypoints.length) {
        const traveledWp = waypoints.slice(0, currentWaypointIndex + 1);
        L.polyline(traveledWp, {
          color: '#10b981',
          weight: 4,
          opacity: 0.9
        }).addTo(routesGroup);
      }

      // Origin Marker
      const originIcon = L.divIcon({
        className: 'custom-pin-origin',
        html: `
          <div class="flex items-center justify-center w-6 h-6 rounded-full bg-blue-500/20 border-2 border-blue-400 text-blue-200 text-[10px] font-bold shadow-lg">
            S
          </div>
        `,
        iconSize: [24, 24],
        iconAnchor: [12, 12]
      });
      L.marker(activeTrip.originCoords, { icon: originIcon }).addTo(routesGroup);

      // Destination Hospital Marker
      const destIcon = L.divIcon({
        className: 'custom-pin-dest',
        html: `
          <div class="flex items-center justify-center w-7 h-7 rounded-full bg-rose-500/20 border-2 border-rose-500 text-rose-300 text-[11px] font-bold shadow-lg animate-pulse">
            H
          </div>
        `,
        iconSize: [28, 28],
        iconAnchor: [14, 14]
      });
      L.marker(activeTrip.destinationCoords, { icon: destIcon }).addTo(routesGroup);
    }
  }, [corridors, activeTrip, currentWaypointIndex]);

  // Update Heatmap Circles (if enabled)
  useEffect(() => {
    const { heatmapGroup } = layersRef.current;
    heatmapGroup.clearLayers();

    if (!showHeatmapLayers) return;

    signals.forEach(sig => {
      let radius = 70;
      let fillColor = '#10b981'; // Green: low stop
      let opacity = 0.45;

      if (heatmapMetric === 'avg_stoppage') {
        if (sig.avgStoppageSec > 30) {
          fillColor = '#ef4444'; // Red: > 30s
          radius = 160;
          opacity = 0.6;
        } else if (sig.avgStoppageSec > 15) {
          fillColor = '#f59e0b'; // Amber: 15-30s
          radius = 115;
          opacity = 0.5;
        } else {
          fillColor = '#10b981';
          radius = 65;
          opacity = 0.35;
        }
      } else if (heatmapMetric === 'fail_rate') {
        if (sig.failureRatePct > 50) {
          fillColor = '#ef4444';
          radius = 175;
          opacity = 0.65;
        } else if (sig.failureRatePct > 25) {
          fillColor = '#f59e0b';
          radius = 120;
          opacity = 0.5;
        } else {
          fillColor = '#10b981';
          radius = 65;
          opacity = 0.35;
        }
      } else {
        // total_volume
        radius = Math.min(180, Math.max(50, sig.totalInteractions));
        fillColor = '#06b6d4';
        opacity = 0.45;
      }

      L.circle([sig.latitude, sig.longitude], {
        radius,
        color: fillColor,
        weight: 1,
        fillColor,
        fillOpacity: opacity
      }).addTo(heatmapGroup);
    });
  }, [signals, showHeatmapLayers, heatmapMetric]);

  // Update Signals Markers
  useEffect(() => {
    const { signalsGroup } = layersRef.current;
    signalsGroup.clearLayers();

    signals.forEach(sig => {
      const isHighlighted = highlightSignalId === sig.id;
      const isPreempted = sig.currentPhase === 'PREEMPTED_GREEN';

      let phaseBadgeColor = 'bg-slate-700 text-slate-300';
      let ringColor = 'border-slate-600';
      let glow = '';

      if (sig.currentPhase === 'GREEN') {
        phaseBadgeColor = 'bg-emerald-500 text-slate-950 font-bold';
        ringColor = 'border-emerald-400';
      } else if (sig.currentPhase === 'YELLOW') {
        phaseBadgeColor = 'bg-amber-500 text-slate-950 font-bold';
        ringColor = 'border-amber-400';
      } else if (sig.currentPhase === 'RED') {
        phaseBadgeColor = 'bg-rose-500 text-white font-bold';
        ringColor = 'border-rose-500';
      } else if (isPreempted) {
        phaseBadgeColor = 'bg-cyan-400 text-slate-950 font-black animate-pulse';
        ringColor = 'border-cyan-300';
        glow = 'shadow-[0_0_15px_rgba(6,182,212,0.8)]';
      }

      const iconHtml = `
        <div class="relative flex flex-col items-center group cursor-pointer">
          ${
            isPreempted
              ? '<div class="absolute -inset-2 rounded-full bg-cyan-400/30 animate-ping"></div>'
              : ''
          }
          <div class="w-7 h-7 rounded-lg bg-slate-900 border ${ringColor} ${glow} flex items-center justify-center text-[10px] font-mono shadow-md transition-transform group-hover:scale-110 ${
        isHighlighted ? 'ring-2 ring-cyan-400 scale-125' : ''
      }">
            <span class="w-2.5 h-2.5 rounded-full ${
              sig.currentPhase === 'GREEN'
                ? 'bg-emerald-400'
                : sig.currentPhase === 'YELLOW'
                ? 'bg-amber-400'
                : sig.currentPhase === 'RED'
                ? 'bg-rose-500'
                : 'bg-cyan-400 animate-pulse'
            }"></span>
          </div>
          <span class="mt-0.5 px-1 py-0.2 text-[9px] font-mono bg-slate-950/90 text-slate-300 rounded border border-slate-800 whitespace-nowrap shadow pointer-events-none">
            ${sig.code}
          </span>
        </div>
      `;

      const customIcon = L.divIcon({
        className: 'custom-signal-icon',
        html: iconHtml,
        iconSize: [28, 42],
        iconAnchor: [14, 21]
      });

      const marker = L.marker([sig.latitude, sig.longitude], { icon: customIcon });

      // Click to select
      marker.on('click', () => {
        if (onSelectSignal) {
          onSelectSignal(sig);
        }
      });

      // Rich tactical tooltip popup
      const popupContent = `
        <div class="p-2 space-y-2 text-xs">
          <div class="flex items-center justify-between border-b border-slate-700/80 pb-1.5 gap-3">
            <div>
              <div class="font-bold text-slate-100 text-sm">${sig.name}</div>
              <div class="text-[10px] font-mono text-cyan-400">${sig.code} · ${sig.corridorName}</div>
            </div>
            <span class="px-1.5 py-0.5 rounded text-[10px] font-mono ${phaseBadgeColor}">
              ${sig.currentPhase} (${sig.phaseTimeRemainingSec}s)
            </span>
          </div>
          <div class="grid grid-cols-2 gap-2 text-[11px] pt-1">
            <div class="bg-slate-900/80 p-1.5 rounded border border-slate-800">
              <span class="text-slate-400 block text-[10px]">Avg Stoppage</span>
              <span class="font-mono text-slate-200 font-semibold text-xs">${sig.avgStoppageSec.toFixed(1)}s</span>
            </div>
            <div class="bg-slate-900/80 p-1.5 rounded border border-slate-800">
              <span class="text-slate-400 block text-[10px]">&gt;20s Delay Rate</span>
              <span class="font-mono ${sig.failureRatePct > 40 ? 'text-rose-400 font-bold' : 'text-slate-200'} text-xs">${sig.failureRatePct.toFixed(1)}%</span>
            </div>
          </div>
          <div class="flex items-center justify-between pt-1 text-[10px] text-slate-400">
            <span>Controller: <strong class="text-slate-300 font-mono">${sig.controllerType}</strong></span>
            <span>Priority: <strong class="${sig.priorityCapable ? 'text-emerald-400' : 'text-rose-400'}">${sig.priorityCapable ? 'ENABLED' : 'DISABLED'}</strong></span>
          </div>
        </div>
      `;

      marker.bindPopup(popupContent, { maxWidth: 300 });
      marker.addTo(signalsGroup);
    });
  }, [signals, highlightSignalId, onSelectSignal]);

  // Update Ambulance Units Markers
  useEffect(() => {
    const { unitsGroup } = layersRef.current;
    unitsGroup.clearLayers();

    units.forEach(unit => {
      const isAssignedToActive = activeTrip && activeTrip.unitId === unit.id;
      const isMoving = unit.speedKmH > 0;

      const vehicleIcon = L.divIcon({
        className: 'custom-ambulance-icon',
        html: `
          <div class="relative flex items-center justify-center cursor-pointer">
            ${
              isAssignedToActive
                ? '<div class="absolute -inset-2.5 rounded-full bg-rose-500/30 animate-ping"></div>'
                : ''
            }
            <div class="w-8 h-8 rounded-full ${
              isAssignedToActive
                ? 'bg-rose-600 border-2 border-white shadow-[0_0_20px_rgba(244,63,94,0.9)]'
                : 'bg-slate-800 border-2 border-slate-400'
            } flex items-center justify-center text-white shadow-xl transition-all">
              <svg class="w-4 h-4 fill-current text-white" viewBox="0 0 24 24">
                <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-1.1 0-2 .9-2 2v7c0 .6.4 1 1 1h2m0 0a2.5 2.5 0 0 0 5 0m7 0a2.5 2.5 0 0 0 5 0M9 8h4"/>
              </svg>
            </div>
            <div class="absolute -bottom-4 px-1 py-0.2 rounded bg-slate-950/90 border border-slate-700 text-[9px] font-mono font-bold text-white whitespace-nowrap shadow">
              ${unit.callSign} ${isMoving ? `· ${unit.speedKmH}km/h` : ''}
            </div>
          </div>
        `,
        iconSize: [32, 32],
        iconAnchor: [16, 16]
      });

      const marker = L.marker([unit.latitude, unit.longitude], { icon: vehicleIcon });
      marker.bindPopup(`
        <div class="p-1.5 text-xs">
          <div class="font-bold text-slate-100">${unit.callSign} (${unit.driverName})</div>
          <div class="text-[11px] text-slate-400">${unit.station} · Status: <span class="text-cyan-400 font-semibold">${unit.status}</span></div>
          <div class="text-[11px] font-mono text-slate-300 mt-1">Current Speed: ${unit.speedKmH} km/h</div>
        </div>
      `);
      marker.addTo(unitsGroup);
    });
  }, [units, activeTrip]);

  // Update Driver Reported Incidents Layer
  useEffect(() => {
    const { incidentsGroup } = layersRef.current;
    incidentsGroup.clearLayers();

    const activeIncidents = incidents.filter(i => i.status !== 'resolved');

    activeIncidents.forEach(inc => {
      const isCritical = inc.severity === 'critical';
      const isMajor = inc.severity === 'major';

      const hazardColor = isCritical ? '#ef4444' : isMajor ? '#f59e0b' : '#38bdf8';
      const borderClass = isCritical
        ? 'border-rose-500 bg-rose-950/90 text-rose-300 shadow-[0_0_15px_rgba(239,68,68,0.7)]'
        : 'border-amber-400 bg-amber-950/90 text-amber-200 shadow-[0_0_15px_rgba(245,158,11,0.6)]';

      const hazardIcon = L.divIcon({
        className: 'custom-incident-pin',
        html: `
          <div class="relative flex items-center justify-center cursor-pointer group">
            <div class="absolute -inset-2 rounded-full ${isCritical ? 'bg-rose-500/30' : 'bg-amber-400/20'} animate-ping"></div>
            <div class="w-8 h-8 rounded-lg border-2 ${borderClass} flex items-center justify-center text-xs font-black shadow-2xl transition-transform group-hover:scale-125">
              ⚠️
            </div>
            <div class="absolute -bottom-4 px-1 py-0.2 rounded bg-slate-950/90 border border-slate-700 text-[9px] font-mono font-bold text-amber-300 whitespace-nowrap shadow pointer-events-none">
              +${inc.delayPenaltySec}s DELAY
            </div>
          </div>
        `,
        iconSize: [32, 32],
        iconAnchor: [16, 16]
      });

      const marker = L.marker([inc.latitude, inc.longitude], { icon: hazardIcon });
      const timeAgoMins = Math.max(1, Math.round((Date.now() - inc.timestamp) / 60000));

      marker.bindPopup(`
        <div class="p-2 space-y-2 text-xs">
          <div class="flex items-center justify-between border-b border-slate-700/80 pb-1.5 gap-2">
            <div>
              <span class="text-[10px] font-mono font-bold uppercase text-amber-400">${inc.type}</span>
              <div class="font-bold text-slate-100 text-sm mt-0.5">${inc.locationName}</div>
            </div>
            <span class="px-1.5 py-0.5 rounded text-[9px] font-mono font-black ${
              isCritical ? 'bg-rose-500 text-slate-950' : 'bg-amber-400 text-slate-950'
            }">
              ${inc.severity.toUpperCase()}
            </span>
          </div>
          <p class="text-xs text-slate-300 leading-snug">${inc.description}</p>
          <div class="bg-slate-900/80 p-1.5 rounded border border-slate-800 flex items-center justify-between text-[11px] font-mono">
            <span class="text-slate-400">Delay Added to Routes:</span>
            <span class="text-rose-400 font-bold">+${inc.delayPenaltySec}s</span>
          </div>
          <div class="flex items-center justify-between text-[10px] text-slate-400 pt-1">
            <span>Reported by: <strong class="text-slate-200">${inc.unitCallSign}</strong></span>
            <span>${timeAgoMins} min ago</span>
          </div>
        </div>
      `, { maxWidth: 280 });

      marker.addTo(incidentsGroup);
    });
  }, [incidents]);

  return (
    <div className={`relative ${className} overflow-hidden rounded-xl border border-slate-800 bg-slate-950`}>
      <div ref={mapContainerRef} className="w-full h-full z-0" />
      {/* Map Attribution/Legend quiet overlay */}
      <div className="absolute bottom-2 left-2 z-[400] flex flex-wrap items-center gap-3 px-2.5 py-1 rounded-md bg-slate-950/85 border border-slate-800/80 text-[10px] text-slate-400 backdrop-blur-sm pointer-events-none">
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-cyan-400"></span> Preempted Green Wave
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-rose-500"></span> Signal Red / Stop
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-400"></span> Green Normal
        </span>
        <span className="flex items-center gap-1.5 text-amber-300">
          <span className="text-[11px]">⚠️</span> Driver Incident (+Delay)
        </span>
      </div>
    </div>
  );
};
