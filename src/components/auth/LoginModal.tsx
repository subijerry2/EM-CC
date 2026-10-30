import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { UserRole } from '../../types/auth';
import { PRE_SEEDED_USERS } from '../../data/authUsers';
import {
  Lock,
  Shield,
  Ambulance,
  Radio,
  BarChart3,
  Cpu,
  Check,
  AlertCircle,
  X,
  UserCheck
} from 'lucide-react';

export const LoginModal: React.FC = () => {
  const { isLoginModalOpen, setIsLoginModalOpen, login, switchRole, user } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isLoginModalOpen) return null;

  const handleManualLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setIsSubmitting(true);

    const res = await login(email, password);
    setIsSubmitting(false);

    if (!res.success) {
      setErrorMsg(res.error || 'Login failed. Please check credentials.');
    }
  };

  const handleFastRoleSelect = (role: UserRole) => {
    switchRole(role);
    setIsLoginModalOpen(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-150">
      <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/70">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
              <Shield className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100">EM-Corridor Agency Authentication</h2>
              <p className="text-xs text-slate-400">Role-Based Access Control & Session Verification</p>
            </div>
          </div>
          {user && (
            <button
              onClick={() => setIsLoginModalOpen(false)}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        <div className="p-6 space-y-6 overflow-y-auto">
          
          {/* 1-Click Fast Role Switcher */}
          <div>
            <div className="flex items-center justify-between mb-2.5">
              <span className="text-xs font-semibold text-slate-200">
                Accredited Personnel Sign-In (Select Role Profile):
              </span>
              <span className="text-[10px] font-mono text-cyan-400">One-Click Session Auth</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {PRE_SEEDED_USERS.map((usr) => {
                const isCurrent = user?.role === usr.role;
                return (
                  <button
                    key={usr.id}
                    type="button"
                    onClick={() => handleFastRoleSelect(usr.role)}
                    className={`p-3.5 rounded-xl border text-left transition-all relative flex flex-col justify-between ${
                      isCurrent
                        ? 'bg-cyan-950/40 border-cyan-400 ring-1 ring-cyan-400/50'
                        : 'bg-slate-950 border-slate-800 hover:border-slate-700 hover:bg-slate-900/50'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs text-slate-100 flex items-center gap-1.5">
                          {usr.role === 'driver' && <Ambulance className="w-3.5 h-3.5 text-rose-400" />}
                          {usr.role === 'dispatcher' && <Radio className="w-3.5 h-3.5 text-cyan-400" />}
                          {usr.role === 'coordinator' && <BarChart3 className="w-3.5 h-3.5 text-amber-400" />}
                          {usr.role === 'authority' && <Cpu className="w-3.5 h-3.5 text-emerald-400" />}
                          {usr.roleTitle}
                        </span>
                        {isCurrent && (
                          <span className="text-[9px] font-mono bg-cyan-400 text-slate-950 px-1.5 py-0.2 rounded font-black">
                            ACTIVE
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] font-semibold text-slate-300 mt-1">{usr.name}</div>
                      <div className="text-[10px] text-slate-400 truncate">{usr.agency}</div>
                    </div>

                    <div className="pt-2 mt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] font-mono text-slate-400">
                      <span>Badge: {usr.badgeNumber}</span>
                      <span className="text-cyan-400">Switch &rarr;</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="relative flex items-center justify-center">
            <div className="w-full border-t border-slate-800"></div>
            <span className="absolute bg-slate-900 px-3 text-[11px] text-slate-400 font-mono">
              OR MANUAL CREDENTIALS
            </span>
          </div>

          {/* Manual Credentials Form */}
          <form onSubmit={handleManualLogin} className="space-y-3.5">
            {errorMsg && (
              <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/40 text-rose-200 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Agency Email Address</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="e.g. driver@metroems.gov"
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-400 font-mono"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Access Passcode</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password (e.g. driver123, dispatch123)"
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-400 font-mono"
              />
            </div>

            <div className="flex items-center justify-between pt-2">
              <span className="text-[10px] text-slate-400 font-mono">
                Session token auto-renews every 12 hours
              </span>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2 text-xs font-bold text-slate-950 bg-cyan-400 hover:bg-cyan-300 rounded-lg transition-all shadow-md flex items-center gap-1.5"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>Verify & Sign In</span>
              </button>
            </div>
          </form>

        </div>
      </div>
    </div>
  );
};
