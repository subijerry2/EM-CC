export type UserRole = 'driver' | 'dispatcher' | 'coordinator' | 'authority';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  roleTitle: string;
  agency: string;
  badgeNumber: string;
  stationOrDept: string;
  avatarUrl?: string;
}

export interface AuthSession {
  token: string;
  user: User;
  loginTimestamp: number;
  expiresAt: number;
}

export interface RolePermissions {
  canAccessDriverHUD: boolean;
  canAccessDispatcherCAD: boolean;
  canCreateDispatchCalls: boolean;
  canReportIncidents: boolean;
  canResolveIncidents: boolean;
  canAccessHeatmap: boolean;
  canAccessKpiDashboard: boolean;
  canExportReports: boolean;
  canAccessSignalInfrastructure: boolean;
  canToggleSignalPreemption: boolean;
}

export const ROLE_PERMISSIONS_MAP: Record<UserRole, RolePermissions> = {
  driver: {
    canAccessDriverHUD: true,
    canAccessDispatcherCAD: false,
    canCreateDispatchCalls: false,
    canReportIncidents: true,
    canResolveIncidents: false,
    canAccessHeatmap: false,
    canAccessKpiDashboard: false,
    canExportReports: false,
    canAccessSignalInfrastructure: false,
    canToggleSignalPreemption: false
  },
  dispatcher: {
    canAccessDriverHUD: true,
    canAccessDispatcherCAD: true,
    canCreateDispatchCalls: true,
    canReportIncidents: true,
    canResolveIncidents: true,
    canAccessHeatmap: true,
    canAccessKpiDashboard: true,
    canExportReports: true,
    canAccessSignalInfrastructure: false,
    canToggleSignalPreemption: false
  },
  coordinator: {
    canAccessDriverHUD: false,
    canAccessDispatcherCAD: true,
    canCreateDispatchCalls: false,
    canReportIncidents: false,
    canResolveIncidents: true,
    canAccessHeatmap: true,
    canAccessKpiDashboard: true,
    canExportReports: true,
    canAccessSignalInfrastructure: true,
    canToggleSignalPreemption: false
  },
  authority: {
    canAccessDriverHUD: false,
    canAccessDispatcherCAD: false,
    canCreateDispatchCalls: false,
    canReportIncidents: false,
    canResolveIncidents: true,
    canAccessHeatmap: true,
    canAccessKpiDashboard: true,
    canExportReports: true,
    canAccessSignalInfrastructure: true,
    canToggleSignalPreemption: true
  }
};
