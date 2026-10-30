import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AppProvider, useApp } from './context/AppContext';
import { Header } from './components/layout/Header';
import { RoleBanner } from './components/auth/RoleBanner';
import { LoginModal } from './components/auth/LoginModal';
import { DriverHUD } from './components/driver/DriverHUD';
import { DispatcherCAD } from './components/dispatcher/DispatcherCAD';
import { HeatmapView } from './components/heatmap/HeatmapView';
import { KpiDashboard } from './components/kpi/KpiDashboard';
import { SignalControllerSim } from './components/infrastructure/SignalControllerSim';
import { NewDispatchModal } from './components/dispatcher/NewDispatchModal';
import { Bell, X, ShieldAlert, CheckCircle2, AlertTriangle, Info, Lock } from 'lucide-react';

const AppContent: React.FC = () => {
  const { activeView, liveNotifications, setActiveView } = useApp();
  const { user, permissions, setIsLoginModalOpen } = useAuth();
  const [isDispatchModalOpen, setIsDispatchModalOpen] = useState(false);
  const [showNotificationToast, setShowNotificationToast] = useState(true);

  const latestNotif = liveNotifications[0];

  // Role Access Checker
  const isAuthorizedForCurrentView = () => {
    if (!user) return false;
    if (activeView === 'driver_hud') return permissions.canAccessDriverHUD;
    if (activeView === 'dispatcher_cad') return permissions.canAccessDispatcherCAD;
    if (activeView === 'heatmap_view') return permissions.canAccessHeatmap;
    if (activeView === 'kpi_dashboard') return permissions.canAccessKpiDashboard;
    if (activeView === 'infrastructure_sim') return permissions.canAccessSignalInfrastructure;
    return true;
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-cyan-500/30 selection:text-cyan-200">
      <Header onOpenNewDispatchModal={() => setIsDispatchModalOpen(true)} />
      <RoleBanner />

      <main className="flex-1 overflow-hidden">
        {isAuthorizedForCurrentView() ? (
          <>
            {activeView === 'dispatcher_cad' && (
              <DispatcherCAD onOpenDispatchModal={() => setIsDispatchModalOpen(true)} />
            )}
            {activeView === 'driver_hud' && <DriverHUD />}
            {activeView === 'heatmap_view' && <HeatmapView />}
            {activeView === 'kpi_dashboard' && <KpiDashboard />}
            {activeView === 'infrastructure_sim' && <SignalControllerSim />}
          </>
        ) : (
          <div className="flex flex-col items-center justify-center min-h-[500px] p-8 text-center bg-slate-900/30 rounded-2xl border border-slate-800 m-6">
            <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 mb-4 shadow-lg">
              <Lock className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-bold text-slate-100">Access Restricted by Role Policy</h2>
            <p className="text-sm text-slate-400 max-w-md mt-2">
              Your active role (<strong className="text-slate-200">{user?.roleTitle || 'Guest'}</strong>) is not authorized to access this module under department security protocol.
            </p>
            <div className="mt-6 flex items-center gap-3">
              <button
                onClick={() => setIsLoginModalOpen(true)}
                className="px-4 py-2 text-xs font-semibold bg-cyan-400 text-slate-950 rounded-lg hover:bg-cyan-300 transition-colors shadow-md"
              >
                Switch Role Profile
              </button>
            </div>
          </div>
        )}
      </main>

      {/* New Dispatch CAD Modal */}
      <NewDispatchModal
        isOpen={isDispatchModalOpen}
        onClose={() => setIsDispatchModalOpen(false)}
      />

      {/* Login & Security Profile Modal */}
      <LoginModal />

      {/* Floating System Telemetry Toast for Real-Time Incident / Corridor Sync */}
      {showNotificationToast && latestNotif && (
        <div className="fixed bottom-4 right-4 z-50 max-w-md bg-slate-900/95 border border-slate-800 rounded-xl p-3 shadow-2xl backdrop-blur-md flex items-start gap-2.5 animate-in slide-in-from-bottom-2 duration-200">
          <div className="mt-0.5">
            {latestNotif.type === 'warning' ? (
              <AlertTriangle className="w-4 h-4 text-amber-400" />
            ) : latestNotif.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            ) : (
              <Info className="w-4 h-4 text-cyan-400" />
            )}
          </div>
          <div className="flex-1 text-xs">
            <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
              <span>SYSTEM EVENT</span>
              <span>{latestNotif.time}</span>
            </div>
            <p className="text-slate-200 mt-0.5 leading-snug">{latestNotif.message}</p>
          </div>
          <button
            onClick={() => setShowNotificationToast(false)}
            className="text-slate-500 hover:text-slate-300 p-0.5"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <AppProvider>
        <AppContent />
      </AppProvider>
    </AuthProvider>
  );
}
