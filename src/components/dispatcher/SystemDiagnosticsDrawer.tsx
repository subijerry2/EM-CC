import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import {
  X,
  Radio,
  Activity,
  Wifi,
  WifiOff,
  Server,
  RefreshCw,
  Play,
  Pause,
  Download,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Send,
  Zap,
  Filter,
  Trash2,
  Cpu,
  Layers,
  ArrowUpRight,
  ShieldCheck
} from 'lucide-react';

interface SystemDiagnosticsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export interface DiagnosticEvent {
  id: string;
  timestamp: Date;
  type: 'HEARTBEAT_ACK' | 'PREEMPTION_BEACON' | 'V2X_BSM' | 'QUEUE_SENSOR' | 'GATEWAY_METRIC' | 'LATENCY_SPIKE';
  source: string;
  corridorId?: string;
  latencyMs: number;
  status: 'ok' | 'warning' | 'alert';
  message: string;
  details?: string;
}

export interface CorridorHeartbeatState {
  id: string;
  name: string;
  code: string;
  protocol: string;
  lastHeartbeat: Date;
  latencyMs: number;
  packetLossPct: number;
  frequencySec: number;
  status: 'OPTIMAL' | 'NORMAL' | 'DEGRADED';
  nodesOnline: number;
  totalNodes: number;
  isPinging?: boolean;
}

const INITIAL_EVENTS: DiagnosticEvent[] = [
  {
    id: 'diag-init-1',
    timestamp: new Date(Date.now() - 8500),
    type: 'GATEWAY_METRIC',
    source: 'WSS-GATEWAY-CORE',
    latencyMs: 18,
    status: 'ok',
    message: 'WebSocket session established via TLS 1.3 to wss://v2x-gateway.its.metro.local/cad/stream/v2',
    details: 'Frame compression: permessage-deflate · Buffer: 64KB'
  },
  {
    id: 'diag-init-2',
    timestamp: new Date(Date.now() - 6200),
    type: 'HEARTBEAT_ACK',
    source: 'CORR-ALPHA-GW',
    corridorId: 'corridor-alpha',
    latencyMs: 16,
    status: 'ok',
    message: 'Corridor Spine Alpha: 6/6 NEMA TS2 controllers responded to sync pulse',
    details: 'DSRC 5.9 GHz broadcast ACK · Master clock sync jitter: ±1.2ms'
  },
  {
    id: 'diag-init-3',
    timestamp: new Date(Date.now() - 4100),
    type: 'V2X_BSM',
    source: 'AMB-MEDIC-04',
    corridorId: 'corridor-alpha',
    latencyMs: 22,
    status: 'ok',
    message: 'Vehicle OBU BSM (Basic Safety Message) telemetry received at 10Hz',
    details: 'Lat: 37.7772, Lng: -122.4230, Speed: 52km/h, Emergency Code: 3'
  },
  {
    id: 'diag-init-4',
    timestamp: new Date(Date.now() - 2500),
    type: 'PREEMPTION_BEACON',
    source: 'SIG-102 (Central & 10th)',
    corridorId: 'corridor-alpha',
    latencyMs: 19,
    status: 'ok',
    message: 'Preemption Wave broadcast: Green wave cycle advanced 18s ahead of vehicle arrival',
    details: 'Phase: PREEMPTED_GREEN · Vehicle clearance zone: 420m'
  },
  {
    id: 'diag-init-5',
    timestamp: new Date(Date.now() - 1100),
    type: 'HEARTBEAT_ACK',
    source: 'CORR-BRAVO-GW',
    corridorId: 'corridor-bravo',
    latencyMs: 24,
    status: 'ok',
    message: 'Parkway Bravo: 4/4 5G-V2X road side units reporting nominal cellular latency',
    details: '5G NR C-V2X PC5 Direct Sidelink Mode 4'
  }
];

export const SystemDiagnosticsDrawer: React.FC<SystemDiagnosticsDrawerProps> = ({ isOpen, onClose }) => {
  const { signals, corridors, activeTrip } = useApp();

  const [activeTab, setActiveTab] = useState<'stream' | 'corridors' | 'controllers'>('stream');
  const [filterType, setFilterType] = useState<string>('ALL');
  const [isLiveStreaming, setIsLiveStreaming] = useState<boolean>(true);
  const [autoScroll, setAutoScroll] = useState<boolean>(true);
  const [simulatedJitterMode, setSimulatedJitterMode] = useState<boolean>(false);
  const [events, setEvents] = useState<DiagnosticEvent[]>(INITIAL_EVENTS);
  const [wsLatencyMs, setWsLatencyMs] = useState<number>(18);
  const [packetCount, setPacketCount] = useState<number>(1420);
  const [isPingingGateway, setIsPingingGateway] = useState<boolean>(false);

  // Corridor heartbeats dynamic state
  const [corridorHeartbeats, setCorridorHeartbeats] = useState<CorridorHeartbeatState[]>([
    {
      id: 'corridor-alpha',
      name: 'Spine Alpha (Central Blvd)',
      code: 'SPINE-A',
      protocol: 'DSRC 5.9GHz + Dedicated Fiber Backhaul',
      lastHeartbeat: new Date(),
      latencyMs: 17,
      packetLossPct: 0.0,
      frequencySec: 1.0,
      status: 'OPTIMAL',
      nodesOnline: 6,
      totalNodes: 6
    },
    {
      id: 'corridor-bravo',
      name: 'Parkway Bravo (River Bypass)',
      code: 'PKWY-B',
      protocol: '5G NR C-V2X Direct Sidelink (PC5)',
      lastHeartbeat: new Date(Date.now() - 400),
      latencyMs: 23,
      packetLossPct: 0.4,
      frequencySec: 1.5,
      status: 'NORMAL',
      nodesOnline: 4,
      totalNodes: 4
    },
    {
      id: 'corridor-charlie',
      name: 'Metro Link Charlie (Commercial Cross)',
      code: 'LINK-C',
      protocol: 'RS-485 Serial Gateway + Cellular Backup',
      lastHeartbeat: new Date(Date.now() - 1200),
      latencyMs: 58,
      packetLossPct: 2.8,
      frequencySec: 2.0,
      status: 'DEGRADED',
      nodesOnline: 4,
      totalNodes: 5
    }
  ]);

  const streamEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll stream to bottom when events change
  useEffect(() => {
    if (autoScroll && streamEndRef.current && activeTab === 'stream') {
      streamEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [events, autoScroll, activeTab]);

  // Handle escape key to close drawer
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Real-time telemetry generator loop
  useEffect(() => {
    if (!isOpen || !isLiveStreaming) return;

    const interval = setInterval(() => {
      // Calculate fluctuating latency
      const baseLatency = simulatedJitterMode ? 85 : 18;
      const jitter = (Math.random() * 8) - 4;
      const currentLatency = Math.max(10, Math.round(baseLatency + jitter));
      setWsLatencyMs(currentLatency);
      setPacketCount(prev => prev + 1);

      // Randomly pick event type
      const eventTypes: DiagnosticEvent['type'][] = [
        'HEARTBEAT_ACK',
        'PREEMPTION_BEACON',
        'V2X_BSM',
        'QUEUE_SENSOR',
        'GATEWAY_METRIC'
      ];
      const selectedType = simulatedJitterMode && Math.random() > 0.6
        ? 'LATENCY_SPIKE'
        : eventTypes[Math.floor(Math.random() * eventTypes.length)];

      // Pick a random signal or corridor
      const randomSignal = signals[Math.floor(Math.random() * signals.length)];
      const randomCorridor = corridors[Math.floor(Math.random() * corridors.length)];

      let newEvent: DiagnosticEvent;

      if (selectedType === 'LATENCY_SPIKE') {
        newEvent = {
          id: `diag-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          timestamp: new Date(),
          type: 'LATENCY_SPIKE',
          source: randomCorridor ? randomCorridor.name : 'V2X-MESH-GATEWAY',
          corridorId: randomCorridor?.id,
          latencyMs: Math.round(95 + Math.random() * 80),
          status: 'warning',
          message: `Network packet latency jitter spiked to ${Math.round(95 + Math.random() * 80)}ms on mesh relay`,
          details: 'Retransmission requested · Buffer window expanded to avoid frame drop'
        };
      } else if (selectedType === 'HEARTBEAT_ACK') {
        const corrId = randomCorridor?.id || 'corridor-alpha';
        newEvent = {
          id: `diag-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          timestamp: new Date(),
          type: 'HEARTBEAT_ACK',
          source: `${randomCorridor?.code || 'CORR'}-HUB`,
          corridorId: corrId,
          latencyMs: currentLatency,
          status: 'ok',
          message: `Corridor heartbeat ACK: ${randomCorridor?.name || 'Active Corridor'} synchronizer pulse verified`,
          details: `Heartbeat sequence #${Math.floor(Math.random() * 9000 + 1000)} · Clock offset: ±0.${Math.floor(Math.random() * 8 + 1)}ms`
        };

        // Update corridor heartbeat state
        setCorridorHeartbeats(prev => prev.map(c => {
          if (c.id === corrId) {
            return {
              ...c,
              lastHeartbeat: new Date(),
              latencyMs: currentLatency,
              packetLossPct: simulatedJitterMode ? 3.4 : (c.id === 'corridor-charlie' ? 2.8 : 0.0),
              status: simulatedJitterMode ? 'DEGRADED' : (c.id === 'corridor-charlie' ? 'DEGRADED' : 'OPTIMAL')
            };
          }
          return c;
        }));
      } else if (selectedType === 'PREEMPTION_BEACON') {
        newEvent = {
          id: `diag-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          timestamp: new Date(),
          type: 'PREEMPTION_BEACON',
          source: randomSignal ? `${randomSignal.code} (${randomSignal.name})` : 'SIG-CONTROLLER',
          corridorId: randomSignal?.corridorId,
          latencyMs: currentLatency + 2,
          status: 'ok',
          message: `Signal preemption pulse: ${randomSignal ? randomSignal.name : 'Intersection'} beacon active`,
          details: `Controller: ${randomSignal?.controllerType || 'NEMA TS2'} · Current Phase: ${randomSignal?.currentPhase || 'GREEN'}`
        };
      } else if (selectedType === 'V2X_BSM') {
        newEvent = {
          id: `diag-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          timestamp: new Date(),
          type: 'V2X_BSM',
          source: activeTrip ? 'MEDIC-04-OBU' : 'FLEET-TELEMETRY-BROADCAST',
          corridorId: activeTrip ? 'corridor-alpha' : undefined,
          latencyMs: currentLatency - 1,
          status: 'ok',
          message: 'Vehicle OBU GPS telemetry packet received with cryptographic timestamp signature',
          details: `Heading: 142° · Latency to Cloud CAD: ${currentLatency - 1}ms`
        };
      } else if (selectedType === 'QUEUE_SENSOR') {
        newEvent = {
          id: `diag-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          timestamp: new Date(),
          type: 'QUEUE_SENSOR',
          source: randomSignal ? `${randomSignal.code}-INDUCTIVE` : 'LOOP-DETECTOR',
          corridorId: randomSignal?.corridorId,
          latencyMs: currentLatency + 5,
          status: 'ok',
          message: `Approach loop detector: Approach occupancy ${Math.floor(Math.random() * 35 + 5)}%`,
          details: `Estimated queue: ${Math.floor(Math.random() * 4)} vehicles · Green wave time sufficient`
        };
      } else {
        newEvent = {
          id: `diag-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          timestamp: new Date(),
          type: 'GATEWAY_METRIC',
          source: 'WSS-METRO-INGRESS',
          latencyMs: currentLatency,
          status: 'ok',
          message: `Ingress sync cycle: Throughput ${(0.8 + Math.random() * 0.4).toFixed(2)} MB/s · 0 frame drops`,
          details: 'Zero buffer overflows in 10-second sliding inspection window'
        };
      }

      setEvents(prev => [...prev.slice(-90), newEvent]);
    }, 1800);

    return () => clearInterval(interval);
  }, [isOpen, isLiveStreaming, simulatedJitterMode, signals, corridors, activeTrip]);

  // Trigger manual probe
  const handleSendGatewayPing = () => {
    setIsPingingGateway(true);
    const pingStart = performance.now();

    setTimeout(() => {
      const measuredRtt = Math.round(performance.now() - pingStart + (simulatedJitterMode ? 60 : 14));
      setIsPingingGateway(false);
      setWsLatencyMs(measuredRtt);
      setPacketCount(prev => prev + 1);

      const probeEvent: DiagnosticEvent = {
        id: `ping-${Date.now()}`,
        timestamp: new Date(),
        type: 'GATEWAY_METRIC',
        source: 'MANUAL-PING-PROBE',
        latencyMs: measuredRtt,
        status: measuredRtt > 50 ? 'warning' : 'ok',
        message: `Echo ping probe returned in ${measuredRtt}ms RTT (Round Trip Time)`,
        details: 'Sent 64 bytes ICMP/WSS probe to v2x-gateway.its.metro.local'
      };

      setEvents(prev => [...prev.slice(-90), probeEvent]);
    }, 280);
  };

  // Trigger manual probe for a specific corridor
  const handleProbeCorridor = (corridorId: string) => {
    setCorridorHeartbeats(prev => prev.map(c => c.id === corridorId ? { ...c, isPinging: true } : c));

    setTimeout(() => {
      const probeRtt = simulatedJitterMode ? 82 : (corridorId === 'corridor-charlie' ? 52 : 16);
      
      setCorridorHeartbeats(prev => prev.map(c => {
        if (c.id === corridorId) {
          return {
            ...c,
            lastHeartbeat: new Date(),
            latencyMs: probeRtt,
            isPinging: false,
            status: probeRtt > 60 ? 'DEGRADED' : 'OPTIMAL'
          };
        }
        return c;
      }));

      const targetCorridor = corridors.find(c => c.id === corridorId);
      const probeEvent: DiagnosticEvent = {
        id: `corr-ping-${Date.now()}`,
        timestamp: new Date(),
        type: 'HEARTBEAT_ACK',
        source: `${targetCorridor?.code || 'CORR'}-DIRECT-PROBE`,
        corridorId,
        latencyMs: probeRtt,
        status: probeRtt > 60 ? 'warning' : 'ok',
        message: `Direct heartbeat probe to ${targetCorridor?.name || 'Corridor'}: All local hubs ACKed in ${probeRtt}ms`,
        details: `Preemption Wave synch status: Nominal · Clock offset: ±0.8ms`
      };

      setEvents(prev => [...prev.slice(-90), probeEvent]);
    }, 450);
  };

  // Export diagnostic telemetry logs to CSV
  const handleExportLogs = () => {
    const csvHeader = 'Timestamp,Type,Source,Corridor,LatencyMs,Status,Message,Details\n';
    const csvRows = events.map(e => 
      `"${e.timestamp.toISOString()}","${e.type}","${e.source}","${e.corridorId || 'N/A'}",${e.latencyMs},"${e.status}","${e.message.replace(/"/g, '""')}","${(e.details || '').replace(/"/g, '""')}"`
    ).join('\n');

    const blob = new Blob([csvHeader + csvRows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `its-infrastructure-diagnostics-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  if (!isOpen) return null;

  // Filter events according to selected category
  const filteredEvents = events.filter(e => {
    if (filterType === 'ALL') return true;
    if (filterType === 'HEARTBEATS') return e.type === 'HEARTBEAT_ACK';
    if (filterType === 'PREEMPTION') return e.type === 'PREEMPTION_BEACON' || e.type === 'V2X_BSM';
    if (filterType === 'ANOMALIES') return e.status === 'warning' || e.status === 'alert' || e.type === 'LATENCY_SPIKE';
    return true;
  });

  return (
    <div className="fixed inset-0 z-50 overflow-hidden flex justify-end">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Slide-over Drawer Panel */}
      <div className="relative w-full max-w-3xl bg-slate-950 border-l border-slate-800 shadow-2xl flex flex-col z-50 h-full overflow-hidden">
        
        {/* Header Bar */}
        <div className="p-4 sm:p-5 border-b border-slate-800 bg-slate-900/90 backdrop-blur-md flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
              <Server className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm sm:text-base font-bold text-slate-100 font-mono tracking-tight">
                  SYSTEM INFRASTRUCTURE DIAGNOSTICS
                </h2>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  LIVE WSS
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5 font-mono">
                wss://v2x-gateway.its.metro.local/cad/stream/v2
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded-lg transition-colors"
              title="Close drawer (Esc)"
              aria-label="Close drawer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Real-Time WebSocket Telemetry Ribbon */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-3 bg-slate-900/40 border-b border-slate-800 text-xs shrink-0">
          <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
            <div className="flex items-center justify-between text-slate-400 text-[10px] font-mono">
              <span>WSS RTT LATENCY</span>
              <Activity className="w-3 h-3 text-cyan-400" />
            </div>
            <div className="mt-1 flex items-baseline gap-1.5">
              <span className={`text-xl font-bold font-mono tabular-nums ${
                wsLatencyMs > 50 ? 'text-amber-400' : 'text-emerald-400'
              }`}>
                {wsLatencyMs}
              </span>
              <span className="text-[10px] font-mono text-slate-500">ms</span>
            </div>
            <span className="text-[9px] text-slate-500 font-mono block mt-0.5">
              Jitter: ±{(wsLatencyMs * 0.12).toFixed(1)}ms
            </span>
          </div>

          <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
            <div className="flex items-center justify-between text-slate-400 text-[10px] font-mono">
              <span>TOTAL FRAMES</span>
              <Radio className="w-3 h-3 text-emerald-400" />
            </div>
            <div className="mt-1 flex items-baseline gap-1.5">
              <span className="text-xl font-bold font-mono text-slate-100 tabular-nums">
                {packetCount}
              </span>
              <span className="text-[10px] font-mono text-slate-500">pkts</span>
            </div>
            <span className="text-[9px] text-emerald-400 font-mono block mt-0.5">
              0.0% packet drop
            </span>
          </div>

          <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
            <div className="flex items-center justify-between text-slate-400 text-[10px] font-mono">
              <span>ACTIVE CORRIDORS</span>
              <ShieldCheck className="w-3 h-3 text-cyan-400" />
            </div>
            <div className="mt-1 flex items-baseline gap-1.5">
              <span className="text-xl font-bold font-mono text-cyan-400">
                3 / 3
              </span>
              <span className="text-[10px] font-mono text-slate-500">online</span>
            </div>
            <span className="text-[9px] text-slate-400 font-mono block mt-0.5">
              14 Controllers Synced
            </span>
          </div>

          <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-400 text-[10px] font-mono">
              <span>PROBE GATEWAY</span>
              <Zap className="w-3 h-3 text-amber-400" />
            </div>
            <button
              onClick={handleSendGatewayPing}
              disabled={isPingingGateway}
              className="mt-1 w-full py-1 px-2 rounded bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 text-[10px] font-mono font-semibold transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50"
            >
              {isPingingGateway ? (
                <>
                  <RefreshCw className="w-3 h-3 animate-spin" />
                  <span>MEASURING...</span>
                </>
              ) : (
                <>
                  <Send className="w-3 h-3" />
                  <span>SEND PING PROBE</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Tab Navigation & Stream Controls Bar */}
        <div className="px-4 py-2.5 border-b border-slate-800 bg-slate-950 flex flex-wrap items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-1 bg-slate-900 p-0.5 rounded-lg border border-slate-800 text-xs">
            <button
              onClick={() => setActiveTab('stream')}
              className={`px-3 py-1.5 rounded-md font-mono text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                activeTab === 'stream'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Activity className="w-3.5 h-3.5" />
              <span>Live Packet Stream</span>
              <span className="text-[9px] px-1 py-0.2 rounded bg-slate-800 text-slate-400 font-mono">
                {events.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('corridors')}
              className={`px-3 py-1.5 rounded-md font-mono text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                activeTab === 'corridors'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Wifi className="w-3.5 h-3.5" />
              <span>Corridor Heartbeats</span>
              <span className="text-[9px] px-1 py-0.2 rounded bg-slate-800 text-slate-400 font-mono">
                3
              </span>
            </button>

            <button
              onClick={() => setActiveTab('controllers')}
              className={`px-3 py-1.5 rounded-md font-mono text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                activeTab === 'controllers'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Cpu className="w-3.5 h-3.5" />
              <span>Signal Matrix</span>
              <span className="text-[9px] px-1 py-0.2 rounded bg-slate-800 text-slate-400 font-mono">
                {signals.length}
              </span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            {activeTab === 'stream' && (
              <>
                <button
                  onClick={() => setIsLiveStreaming(!isLiveStreaming)}
                  className={`p-1.5 rounded border text-xs flex items-center gap-1 font-mono transition-colors ${
                    isLiveStreaming
                      ? 'bg-slate-900 border-slate-700 text-emerald-400 hover:bg-slate-800'
                      : 'bg-amber-950/40 border-amber-500/40 text-amber-300 hover:bg-amber-950/60'
                  }`}
                  title={isLiveStreaming ? 'Pause streaming updates' : 'Resume streaming updates'}
                >
                  {isLiveStreaming ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                  <span className="text-[10px] hidden sm:inline">{isLiveStreaming ? 'PAUSE' : 'RESUME'}</span>
                </button>

                <button
                  onClick={() => setAutoScroll(!autoScroll)}
                  className={`px-2 py-1.5 rounded border text-[10px] font-mono transition-colors ${
                    autoScroll
                      ? 'bg-cyan-950/40 border-cyan-500/40 text-cyan-300'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                  title="Toggle auto-scrolling to newest events"
                >
                  AUTO-SCROLL: {autoScroll ? 'ON' : 'OFF'}
                </button>
              </>
            )}

            <button
              onClick={() => setSimulatedJitterMode(!simulatedJitterMode)}
              className={`px-2 py-1.5 rounded border text-[10px] font-mono font-semibold transition-colors flex items-center gap-1 ${
                simulatedJitterMode
                  ? 'bg-amber-950/60 border-amber-500 text-amber-300 animate-pulse'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
              title="Inject realistic wireless latency jitter to test CAD resilience"
            >
              <AlertTriangle className="w-3 h-3" />
              <span>{simulatedJitterMode ? 'JITTER ACTIVE' : 'TEST JITTER'}</span>
            </button>

            <button
              onClick={handleExportLogs}
              className="p-1.5 rounded bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-slate-100 transition-colors"
              title="Export CSV diagnostics report"
            >
              <Download className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Tab 1: Live Packet Stream */}
        {activeTab === 'stream' && (
          <div className="flex-1 flex flex-col min-h-0">
            {/* Filter Pills Bar */}
            <div className="px-4 py-2 bg-slate-950 border-b border-slate-900 flex items-center justify-between text-xs shrink-0">
              <div className="flex items-center gap-1.5 overflow-x-auto py-0.5">
                <span className="text-[10px] text-slate-500 font-mono uppercase mr-1">Filter:</span>
                {[
                  { id: 'ALL', label: 'All Events' },
                  { id: 'HEARTBEATS', label: 'Corridor Heartbeats' },
                  { id: 'PREEMPTION', label: 'Preemption & V2X' },
                  { id: 'ANOMALIES', label: 'Anomalies / Jitter' }
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setFilterType(tab.id)}
                    className={`px-2 py-0.5 rounded text-[10px] font-mono transition-colors ${
                      filterType === tab.id
                        ? 'bg-slate-800 text-cyan-400 font-bold border border-slate-700'
                        : 'text-slate-500 hover:text-slate-300'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              <button
                onClick={() => setEvents([])}
                className="text-[10px] text-slate-500 hover:text-rose-400 font-mono flex items-center gap-1 transition-colors"
                title="Clear current stream buffer"
              >
                <Trash2 className="w-3 h-3" />
                <span>Clear</span>
              </button>
            </div>

            {/* Event Console List */}
            <div className="flex-1 overflow-y-auto p-3 sm:p-4 font-mono text-xs space-y-2 bg-slate-950/90 selection:bg-cyan-500 selection:text-slate-950">
              {filteredEvents.length === 0 ? (
                <div className="text-center py-12 text-slate-500 font-mono text-xs">
                  No telemetry events match selected filter. Waiting for incoming infrastructure packets...
                </div>
              ) : (
                filteredEvents.map((event) => {
                  const timeStr = event.timestamp.toTimeString().split(' ')[0] + '.' + 
                    event.timestamp.getMilliseconds().toString().padStart(3, '0');

                  let typeBadgeBg = 'bg-slate-800 text-slate-300';
                  if (event.type === 'HEARTBEAT_ACK') typeBadgeBg = 'bg-emerald-950/80 text-emerald-300 border border-emerald-500/40';
                  if (event.type === 'PREEMPTION_BEACON') typeBadgeBg = 'bg-cyan-950/80 text-cyan-300 border border-cyan-500/40';
                  if (event.type === 'V2X_BSM') typeBadgeBg = 'bg-purple-950/80 text-purple-300 border border-purple-500/40';
                  if (event.type === 'LATENCY_SPIKE') typeBadgeBg = 'bg-rose-950/80 text-rose-300 border border-rose-500/40';
                  if (event.type === 'QUEUE_SENSOR') typeBadgeBg = 'bg-blue-950/80 text-blue-300 border border-blue-500/40';

                  return (
                    <div
                      key={event.id}
                      className={`p-2.5 rounded-lg border transition-all text-[11px] leading-relaxed ${
                        event.status === 'warning'
                          ? 'bg-amber-950/15 border-amber-500/30'
                          : event.status === 'alert'
                          ? 'bg-rose-950/20 border-rose-500/40'
                          : 'bg-slate-900/60 border-slate-800/80 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-slate-500 text-[10px] tabular-nums">{timeStr}</span>
                          <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold ${typeBadgeBg}`}>
                            {event.type}
                          </span>
                          <span className="text-slate-300 font-bold">{event.source}</span>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <span className={`text-[10px] tabular-nums font-semibold ${
                            event.latencyMs > 50 ? 'text-amber-400' : 'text-emerald-400'
                          }`}>
                            {event.latencyMs}ms RTT
                          </span>
                        </div>
                      </div>

                      <div className="text-slate-200 mt-0.5">
                        {event.message}
                      </div>

                      {event.details && (
                        <div className="text-[10px] text-slate-500 mt-1 pl-2 border-l border-slate-800">
                          {event.details}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
              <div ref={streamEndRef} />
            </div>
          </div>
        )}

        {/* Tab 2: Corridor Heartbeats Monitor */}
        {activeTab === 'corridors' && (
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
            <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-3.5 text-xs text-slate-400 leading-relaxed">
              <strong className="text-slate-200 block mb-1">Emergency Corridor Heartbeat Protocol:</strong>
              Continuous synchronous round-trip ping verification between the central CAD gateway and edge ITS road-side units (RSUs). Enables guaranteed green-wave clearance prior to ambulance approach.
            </div>

            <div className="space-y-3">
              {corridorHeartbeats.map(corridor => {
                const secondsSinceLastHeartbeat = ((Date.now() - corridor.lastHeartbeat.getTime()) / 1000).toFixed(1);

                return (
                  <div
                    key={corridor.id}
                    className="p-4 rounded-xl bg-slate-900 border border-slate-800 shadow-md space-y-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-slate-100">{corridor.name}</span>
                          <span className="px-1.5 py-0.2 rounded text-[10px] font-mono bg-cyan-950 text-cyan-300 border border-cyan-800">
                            {corridor.code}
                          </span>
                        </div>
                        <p className="text-[11px] font-mono text-slate-400 mt-1">
                          Protocol: {corridor.protocol}
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                          corridor.status === 'OPTIMAL'
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            : corridor.status === 'NORMAL'
                            ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                            : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        }`}>
                          {corridor.status}
                        </span>
                        <button
                          onClick={() => handleProbeCorridor(corridor.id)}
                          disabled={corridor.isPinging}
                          className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-mono font-semibold transition-colors flex items-center gap-1 disabled:opacity-50"
                          title="Send on-demand heartbeat probe to corridor"
                        >
                          {corridor.isPinging ? (
                            <RefreshCw className="w-3 h-3 animate-spin text-cyan-400" />
                          ) : (
                            <Zap className="w-3 h-3 text-cyan-400" />
                          )}
                          <span>Ping</span>
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-800/80 text-center">
                      <div className="p-2 rounded-lg bg-slate-950 border border-slate-800/80">
                        <span className="text-[10px] font-mono text-slate-500 block">LAST PULSE</span>
                        <div className="flex items-center justify-center gap-1.5 mt-0.5">
                          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                          <span className="text-xs font-mono font-bold text-slate-200 tabular-nums">
                            {secondsSinceLastHeartbeat}s ago
                          </span>
                        </div>
                      </div>

                      <div className="p-2 rounded-lg bg-slate-950 border border-slate-800/80">
                        <span className="text-[10px] font-mono text-slate-500 block">PULSE FREQ</span>
                        <span className="text-xs font-mono font-bold text-slate-200 mt-0.5 block">
                          Every {corridor.frequencySec}s
                        </span>
                      </div>

                      <div className="p-2 rounded-lg bg-slate-950 border border-slate-800/80">
                        <span className="text-[10px] font-mono text-slate-500 block">RTT LATENCY</span>
                        <span className={`text-xs font-mono font-bold mt-0.5 block tabular-nums ${
                          corridor.latencyMs > 50 ? 'text-amber-400' : 'text-cyan-400'
                        }`}>
                          {corridor.latencyMs}ms
                        </span>
                      </div>

                      <div className="p-2 rounded-lg bg-slate-950 border border-slate-800/80">
                        <span className="text-[10px] font-mono text-slate-500 block">CONTROLLERS</span>
                        <span className="text-xs font-mono font-bold text-emerald-400 mt-0.5 block">
                          {corridor.nodesOnline} / {corridor.totalNodes} Online
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Tab 3: Signal Controller Ping Matrix */}
        {activeTab === 'controllers' && (
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3">
            <div className="flex items-center justify-between text-xs text-slate-400 pb-1">
              <span>Traffic Signal Controller Status ({signals.length} intersections monitored):</span>
              <span className="font-mono text-emerald-400">100% Reachable</span>
            </div>

            <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-900 shadow-md">
              <table className="w-full text-left text-xs font-mono border-collapse">
                <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 text-[10px]">
                  <tr>
                    <th className="p-2.5">SIGNAL</th>
                    <th className="p-2.5">CORRIDOR</th>
                    <th className="p-2.5">CONTROLLER</th>
                    <th className="p-2.5">PING RTT</th>
                    <th className="p-2.5">PHASE</th>
                    <th className="p-2.5 text-right">PREEMPTION</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/70 text-slate-300 text-[11px]">
                  {signals.map((sig, idx) => {
                    const ping = Math.round(14 + (idx * 2.3) % 22);

                    return (
                      <tr key={sig.id} className="hover:bg-slate-800/50 transition-colors">
                        <td className="p-2.5 font-bold text-slate-200">
                          <div>{sig.name}</div>
                          <span className="text-[9px] text-slate-500">{sig.code}</span>
                        </td>
                        <td className="p-2.5 text-slate-400">
                          {sig.corridorName.split(' ')[0]}
                        </td>
                        <td className="p-2.5 text-slate-400">
                          {sig.controllerType}
                        </td>
                        <td className="p-2.5 tabular-nums">
                          <span className={ping > 30 ? 'text-amber-400' : 'text-emerald-400'}>
                            {ping}ms
                          </span>
                        </td>
                        <td className="p-2.5">
                          <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                            sig.currentPhase === 'PREEMPTED_GREEN'
                              ? 'bg-cyan-500/20 text-cyan-300'
                              : sig.currentPhase === 'GREEN'
                              ? 'bg-emerald-500/20 text-emerald-300'
                              : 'bg-rose-500/20 text-rose-300'
                          }`}>
                            {sig.currentPhase}
                          </span>
                        </td>
                        <td className="p-2.5 text-right">
                          <span className={`px-1.5 py-0.5 rounded text-[9px] font-semibold ${
                            sig.priorityCapable
                              ? 'bg-cyan-950 text-cyan-300 border border-cyan-800'
                              : 'bg-slate-800 text-slate-500'
                          }`}>
                            {sig.priorityCapable ? 'ENABLED' : 'MANUAL'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Bottom Drawer Footer */}
        <div className="p-3 bg-slate-900 border-t border-slate-800 flex items-center justify-between text-xs font-mono text-slate-400 shrink-0">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[11px] text-slate-300">
              Gateway: <strong className="text-slate-100 font-normal">v2x-node-cluster-04</strong>
            </span>
          </div>

          <div className="flex items-center gap-3 text-[11px]">
            <span>NTP Drift: <strong className="text-slate-200">±0.4ms</strong></span>
            <button
              onClick={onClose}
              className="px-3 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors"
            >
              Close
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
