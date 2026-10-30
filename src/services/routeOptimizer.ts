import { RouteOption, TrafficSignal, ReportedIncident } from '../types';
import { SAMPLE_ROUTE_OPTIONS } from '../data/mockData';

export interface RouteOptimizationResult {
  routes: RouteOption[];
  recommendedRouteId: string;
  reasoning: string;
  affectedByIncidentCount: number;
}

/**
 * Calculates adjusted life-safety ETA based on:
 * Base Travel Time + Sum of expected signal stoppage penalties + Active Driver Reported Incident Penalties
 */
export function optimizeRoutes(
  signals: TrafficSignal[],
  currentHour: number = new Date().getHours(),
  incidentSignalId?: string,
  activeIncidents: ReportedIncident[] = []
): RouteOptimizationResult {
  const isPeak = (currentHour >= 7 && currentHour <= 9) || (currentHour >= 16 && currentHour <= 19);
  const peakMultiplier = isPeak ? 1.45 : 0.85;

  const signalMap = new Map(signals.map(s => [s.id, s]));
  const activeUnresolvedIncidents = activeIncidents.filter(inc => inc.status !== 'resolved');

  let totalAffectedRoutes = 0;

  const updatedRoutes: RouteOption[] = SAMPLE_ROUTE_OPTIONS.map(route => {
    let routePredictedStoppageSec = 0;
    let priorityCapableCount = 0;
    let incidentPenaltySec = 0;
    const incidentDescriptions: string[] = [];

    route.associatedSignalIds.forEach(sigId => {
      const sig = signalMap.get(sigId);
      if (!sig) return;

      if (sig.priorityCapable) {
        priorityCapableCount++;
        // With V2X priority, stop probability drops to ~10-15%, avg stop 4-8s
        routePredictedStoppageSec += sig.avgStoppageSec * 0.35 * (isPeak ? 1.2 : 0.8);
      } else {
        // Legacy signal: full red delay, heavily exacerbated by peak congestion
        routePredictedStoppageSec += sig.avgStoppageSec * peakMultiplier;
      }

      // Check for driver reported incidents associated with this signal
      activeUnresolvedIncidents.forEach(inc => {
        if (inc.associatedSignalId === sigId) {
          incidentPenaltySec += inc.delayPenaltySec || 120;
          incidentDescriptions.push(`${inc.type} reported by ${inc.unitCallSign} at ${sig.name}`);
        }
      });

      // Legacy fallback flag
      if (incidentSignalId && sig.id === incidentSignalId) {
        incidentPenaltySec += 120;
      }
    });

    if (incidentPenaltySec > 0) {
      totalAffectedRoutes++;
    }

    const totalDelaySec = routePredictedStoppageSec + incidentPenaltySec;
    const signalDelayMinutes = Number((totalDelaySec / 60).toFixed(1));
    const adjustedLifeSafetyEta = Number((route.baseEtaMinutes + signalDelayMinutes).toFixed(1));

    // Life-safety reliability score (0-100)
    const priorityRatio = route.associatedSignalIds.length > 0
      ? priorityCapableCount / route.associatedSignalIds.length
      : 0.5;
    const stoppagePenalty = Math.min(60, totalDelaySec / 3);
    const calculatedScore = Math.max(5, Math.min(98, Math.round(100 - stoppagePenalty + (priorityRatio * 15))));

    let summary = route.corridorSummary;
    if (incidentDescriptions.length > 0) {
      summary = `⚠️ INCIDENT DELAY (+${Math.round(incidentPenaltySec)}s): ${incidentDescriptions[0]}`;
    }

    return {
      ...route,
      corridorSummary: summary,
      priorityCapableCount,
      predictedStoppageSec: Math.round(totalDelaySec),
      signalDelayPenaltyMinutes: signalDelayMinutes,
      adjustedLifeSafetyEtaMinutes: adjustedLifeSafetyEta,
      safetyScore: calculatedScore,
      recommended: false
    };
  });

  // Sort by lowest adjusted Life-Safety ETA
  const sorted = [...updatedRoutes].sort((a, b) => a.adjustedLifeSafetyEtaMinutes - b.adjustedLifeSafetyEtaMinutes);
  const bestRoute = sorted[0];

  // Mark the best route as recommended
  const finalRoutes = updatedRoutes.map(r => ({
    ...r,
    recommended: r.id === bestRoute.id
  }));

  let reasoning = `Optimal corridor: ${bestRoute.name} delivers fastest response with ${bestRoute.priorityCapableCount}/${bestRoute.signalCount} preemption-enabled intersections (${bestRoute.adjustedLifeSafetyEtaMinutes}m adjusted ETA).`;

  if (activeUnresolvedIncidents.length > 0) {
    const topInc = activeUnresolvedIncidents[0];
    reasoning = `Real-time reroute active: Driver ${topInc.unitCallSign} reported "${topInc.type}" at ${topInc.locationName}. Rerouting fleet to ${bestRoute.name} to avoid estimated ${Math.round(topInc.delayPenaltySec)}s delay.`;
  } else if (incidentSignalId) {
    reasoning = `Reroute triggered: Incident flagged at ${signalMap.get(incidentSignalId)?.name || 'active signal'}. Diverting to ${bestRoute.name}.`;
  }

  return {
    routes: finalRoutes,
    recommendedRouteId: bestRoute.id,
    reasoning,
    affectedByIncidentCount: totalAffectedRoutes
  };
}
