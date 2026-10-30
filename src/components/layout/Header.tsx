import React, { useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { ActiveAppView } from '../../types';
import {
  Volume2,
  VolumeX,
  FastForward,
  Play,
  Pause,
  AlertTriangle,
  User as UserIcon,
  LogOut,
  ChevronDown,
  Shield,
  Siren
} from 'lucide-react';

export const Header: React.FC<{ onOpenNewDispatchModal: () => void }> = ({ onOpenNewDispatchModal }) => {
  const {
    activeView,
    setActiveView,
    activeTrip,
    soundEnabled,
    setSoundEnabled,
    simulationSpeed,
    setSimulationSpeed,
    isPaused,
    pauseTrip,
    resumeTrip,
    activeIncidentSignalId,
    clearIncident
  } = useApp();

  const { user, permissions, setIsLoginModalOpen, logout } = useAuth();

  const allNavItems: { id: ActiveAppView; label: string; allowed: boolean }[] = [
    { id: 'dispatcher_cad', label: 'Dispatcher CAD', allowed: permissions.canAccessDispatcherCAD },
    { id: 'driver_hud', label: 'Driver In-Cab', allowed: permissions.canAccessDriverHUD },
    { id: 'heatmap_view', label: 'Corridor Heatmap', allowed: permissions.canAccessHeatmap },
    { id: 'kpi_dashboard', label: 'KPI Evidence', allowed: permissions.canAccessKpiDashboard },
    { id: 'infrastructure_sim', label: 'Signal Controller', allowed: permissions.canAccessSignalInfrastructure }
  ];

  const allowedNavItems = allNavItems.filter(item => item.allowed);

  // If user switches role and current view is not permitted, auto-route to their primary permitted view
  useEffect(() => {
    if (!allowedNavItems.some(i => i.id === activeView)) {
      if (allowedNavItems.length > 0) {
        setActiveView(allowedNavItems[0].id);
      }
    }
  }, [permissions, activeView, allowedNavItems, setActiveView]);

  return (
    <header className="flex items-center justify-between gap-6 px-6 py-3 border-b border-slate-800 bg-slate-950/90 backdrop-blur-md sticky top-0 z-40">
      {/* Zone 1: Brand wordmark */}
      <div className="flex items-center gap-3 shrink-0">
        <a
          href="#"
          onClick={(e) => {
            e.preventDefault();
            if (allowedNavItems.length > 0) {
              setActiveView(allowedNavItems[0].id);
            }
          }}
          className="text-lg font-bold tracking-tight text-slate-100 whitespace-nowrap flex items-center gap-2 hover:text-cyan-400 transition-colors"
        >
          <span className="w-2.5 h-2.5 rounded-full bg-cyan-400"></span>
          EM-Corridor Companion
        </a>
      </div>

      {/* Zone 2: Tailored single-line text navigation links based on user role */}
      <nav className="hidden md:flex items-center gap-5 text-sm font-medium text-slate-400">
        {allowedNavItems.map((item) => {
          const isActive = activeView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveView(item.id)}
              className={`transition-colors whitespace-nowrap shrink-0 py-1 border-b-2 ${
                isActive
                  ? 'border-cyan-400 text-slate-100 font-semibold'
                  : 'border-transparent hover:text-slate-200'
              }`}
            >
              {item.label}
            </button>
          );
        })}
      </nav>

      {/* Zone 3: Authenticated User Profile + Actions */}
      <div className="flex items-center gap-2.5 shrink-0">
        {/* Active Incident Warning quick-clear button */}
        {activeIncidentSignalId && (
          <button
            onClick={clearIncident}
            className="hidden xl:flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-amber-300 bg-amber-500/15 border border-amber-500/30 rounded-lg hover:bg-amber-500/25 transition-colors"
          >
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
            <span>Clear Incident</span>
          </button>
        )}

        {/* Audio Mute/Unmute */}
        <button
          onClick={() => setSoundEnabled(!soundEnabled)}
          className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-100 transition-colors"
          title={soundEnabled ? 'Mute Driver Audio Cues' : 'Unmute Driver Audio Cues'}
        >
          {soundEnabled ? <Volume2 className="w-4 h-4 text-cyan-400" /> : <VolumeX className="w-4 h-4 text-slate-500" />}
        </button>

        {/* Role & User Profile Pill with Quick Role Switcher */}
        {user ? (
          <div className="flex items-center gap-2 pl-2 border-l border-slate-800">
            <button
              onClick={() => setIsLoginModalOpen(true)}
              className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800/80 border border-slate-800 text-left transition-colors group"
              title="Click to switch role or view security profile"
            >
              <div className="w-6 h-6 rounded-lg bg-cyan-500/20 border border-cyan-400/30 flex items-center justify-center text-cyan-300 text-xs font-bold shrink-0">
                {user.name.charAt(0)}
              </div>
              <div className="hidden sm:block text-xs truncate max-w-[140px]">
                <div className="font-semibold text-slate-200 truncate group-hover:text-cyan-300 transition-colors">
                  {user.name}
                </div>
                <div className="text-[10px] font-mono text-slate-400 truncate">
                  {user.badgeNumber} · {user.role.toUpperCase()}
                </div>
              </div>
              <ChevronDown className="w-3 h-3 text-slate-500 group-hover:text-slate-300 transition-colors" />
            </button>

            <button
              onClick={logout}
              className="p-1.5 rounded-lg bg-slate-900 hover:bg-rose-500/20 hover:text-rose-300 text-slate-400 border border-slate-800 transition-colors"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <button
            onClick={() => setIsLoginModalOpen(true)}
            className="px-3 py-1.5 text-xs font-semibold text-cyan-300 bg-cyan-500/15 border border-cyan-500/30 rounded-lg hover:bg-cyan-500/25 transition-colors"
          >
            Sign In
          </button>
        )}

        {/* Primary CTA (Shown only to Dispatchers with dispatch privileges) */}
        {permissions.canCreateDispatchCalls && (
          <button
            onClick={onOpenNewDispatchModal}
            className="px-3.5 py-1.5 text-xs font-semibold text-slate-950 bg-cyan-400 rounded-lg hover:bg-cyan-300 transition-all shadow-[0_0_12px_rgba(6,182,212,0.25)] whitespace-nowrap shrink-0 flex items-center gap-1.5"
          >
            <Siren className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Dispatch Call</span>
          </button>
        )}
      </div>
    </header>
  );
};
