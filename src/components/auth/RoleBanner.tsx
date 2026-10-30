import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { UserRole } from '../../types/auth';
import { Ambulance, Radio, BarChart3, Cpu, Shield, Key } from 'lucide-react';

export const RoleBanner: React.FC = () => {
  const { user, switchRole, setIsLoginModalOpen } = useAuth();

  if (!user) return null;

  const roleConfigs: Record<
    UserRole,
    {
      badgeColor: string;
      icon: React.ReactNode;
      label: string;
      scopeDescription: string;
    }
  > = {
    driver: {
      badgeColor: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
      icon: <Ambulance className="w-3.5 h-3.5 text-rose-400" />,
      label: 'AMBULANCE DRIVER PORTAL',
      scopeDescription: 'In-cab tactical HUD, live turn guidance, signal preemption status & obstruction logging.'
    },
    dispatcher: {
      badgeColor: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40',
      icon: <Radio className="w-3.5 h-3.5 text-cyan-400" />,
      label: 'HOSPITAL CAD DISPATCH PORTAL',
      scopeDescription: 'Active fleet CAD, multi-route delay penalty scoring, CAD call assignment & incident triage.'
    },
    coordinator: {
      badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
      icon: <BarChart3 className="w-3.5 h-3.5 text-amber-400" />,
      label: 'EMS OPERATIONS COORDINATOR PORTAL',
      scopeDescription: 'Aggregated signal heatmaps, life-safety KPI dashboards, worst intersections & inter-agency briefing export.'
    },
    authority: {
      badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
      icon: <Cpu className="w-3.5 h-3.5 text-emerald-400" />,
      label: 'TRAFFIC SIGNAL AUTHORITY PORTAL',
      scopeDescription: 'NEMA TS2 controller simulator, corridor preemption loop diagnostics & timing plan modernization.'
    }
  };

  const currentConfig = roleConfigs[user.role];

  return (
    <div className="bg-slate-900/70 border-b border-slate-800/80 px-6 py-2 flex flex-wrap items-center justify-between gap-3 text-xs">
      <div className="flex items-center gap-3">
        <span className={`flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border text-[11px] font-mono font-bold ${currentConfig.badgeColor}`}>
          {currentConfig.icon}
          <span>{currentConfig.label}</span>
        </span>
        <span className="hidden lg:inline text-slate-400 text-[11px]">
          {currentConfig.scopeDescription}
        </span>
      </div>

      <div className="flex items-center gap-2">
        <span className="text-slate-500 text-[11px] font-mono hidden sm:inline">Role Switcher:</span>
        {(['driver', 'dispatcher', 'coordinator', 'authority'] as UserRole[]).map((r) => {
          const isActive = user.role === r;
          return (
            <button
              key={r}
              onClick={() => switchRole(r)}
              className={`px-2 py-0.5 rounded text-[10px] font-mono font-medium transition-all ${
                isActive
                  ? 'bg-slate-100 text-slate-950 font-bold shadow-sm'
                  : 'bg-slate-950/80 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              {r === 'driver' && 'Driver'}
              {r === 'dispatcher' && 'Dispatcher'}
              {r === 'coordinator' && 'Coordinator'}
              {r === 'authority' && 'Traffic Authority'}
            </button>
          );
        })}
      </div>
    </div>
  );
};
