import { EmergencyTrip, TrafficSignal, Corridor, ReportedIncident } from '../types';

/**
 * Generates and triggers download of CSV containing all driver-reported incident logs
 */
export function exportIncidentsCSV(incidents: ReportedIncident[]) {
  const headers = [
    'Incident ID',
    'Timestamp',
    'Reported Date Time',
    'Unit Call Sign',
    'Driver Name',
    'Incident Classification',
    'Severity',
    'Location / Intersection',
    'Associated Signal Code',
    'Delay Penalty (s)',
    'Status',
    'Description',
    'Resolved By'
  ];

  const rows = incidents.map(inc => [
    inc.id,
    String(inc.timestamp),
    `"${new Date(inc.timestamp).toISOString()}"`,
    inc.unitCallSign,
    `"${inc.driverName}"`,
    `"${inc.type}"`,
    inc.severity,
    `"${inc.locationName}"`,
    inc.associatedSignalId || 'N/A',
    String(inc.delayPenaltySec),
    inc.status,
    `"${inc.description.replace(/"/g, '""')}"`,
    inc.resolvedBy || 'Pending'
  ]);

  const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `driver_reported_incidents_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Generates and triggers download of CSV containing all trip logs & signal interaction logs
 */
export function exportTripLogsCSV(trips: EmergencyTrip[]) {
  const headers = [
    'Trip ID',
    'Call Number',
    'Priority Level',
    'Call Type',
    'Assigned Unit',
    'Route Name',
    'Total Travel Time (s)',
    'Total Stoppage Time (s)',
    'Signals Encountered',
    'Priority Granted Count',
    'Signal Name',
    'Stoppage Duration (s)',
    'Corridor Notified',
    'Priority Granted',
    'Phase On Approach',
    'Outcome'
  ];

  const rows: string[][] = [];

  trips.forEach(trip => {
    if (trip.interactions.length === 0) {
      rows.push([
        trip.id,
        trip.callNumber,
        trip.priorityLevel,
        trip.callType,
        trip.unitId,
        trip.plannedRoute.name,
        String(trip.totalTravelTimeSec || 0),
        String(trip.totalStoppageTimeSec || 0),
        String(trip.signalsEncountered),
        String(trip.prioritySuccessCount),
        'N/A',
        '0',
        'false',
        'false',
        'N/A',
        'no_signals'
      ]);
    } else {
      trip.interactions.forEach(inter => {
        rows.push([
          trip.id,
          trip.callNumber,
          `"${trip.priorityLevel}"`,
          `"${trip.callType}"`,
          trip.unitId,
          `"${trip.plannedRoute.name}"`,
          String(trip.totalTravelTimeSec || 0),
          String(trip.totalStoppageTimeSec || 0),
          String(trip.signalsEncountered),
          String(trip.prioritySuccessCount),
          `"${inter.signalName}"`,
          String(inter.stoppageDurationSec),
          String(inter.emergencyCorridorNotified),
          String(inter.priorityGranted),
          inter.phaseOnApproach,
          inter.outcome
        ]);
      });
    }
  });

  const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `em_corridor_trips_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Generates and triggers download of CSV containing traffic signal KPI performance
 */
export function exportSignalPerformanceCSV(signals: TrafficSignal[]) {
  const headers = [
    'Signal ID',
    'Signal Name',
    'Intersection Code',
    'Corridor',
    'Priority Capable',
    'Controller Type',
    'Avg Stoppage (s)',
    'Failure Rate (>20s Stop %)',
    'Total Interactions',
    'Speed Limit (km/h)',
    'Current Phase'
  ];

  const rows = signals.map(s => [
    s.id,
    `"${s.name}"`,
    s.code,
    `"${s.corridorName}"`,
    String(s.priorityCapable),
    `"${s.controllerType}"`,
    s.avgStoppageSec.toFixed(1),
    `${s.failureRatePct.toFixed(1)}%`,
    String(s.totalInteractions),
    String(s.speedLimitKmH),
    s.currentPhase
  ]);

  const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `traffic_signal_kpi_evidence_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
