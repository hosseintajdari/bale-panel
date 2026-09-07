import { LatencyHealthDetails, LatencyHealthLevel } from '../types';

export const LATENCY_THRESHOLDS = {
  OPTIMAL_MAX: 50,  // < 50ms: Optimal real-time responsiveness (Emerald)
  STABLE_MAX: 90,   // 50 - 89ms: Standard stable performance (Sky)
  WARNING_MAX: 140, // 90 - 139ms: High latency warning (Amber)
  // >= 140ms: Critical bottleneck connection (Rose)
} as const;

/**
 * Calculates connection health tier, visual warning cues, and styling classes
 * based on latencyMs and optional jitter thresholds.
 */
export function getLatencyHealth(latencyMs: number, jitterMs?: number): LatencyHealthDetails {
  // Critical Latency Alert (>= 140ms or severe jitter >= 20ms)
  if (latencyMs >= LATENCY_THRESHOLDS.WARNING_MAX || (jitterMs !== undefined && jitterMs >= 20)) {
    return {
      level: 'critical',
      label: 'Critical Latency',
      persianLabel: 'بحرانی (افت شدید اتصال)',
      iconColorClass: 'text-rose-400',
      containerBgClass: 'bg-rose-500/15',
      containerBorderClass: 'border-rose-500/40 shadow-[0_0_15px_rgba(244,63,94,0.25)]',
      statusDotClass: 'bg-rose-500 ring-2 ring-rose-500/40 animate-ping',
      badgeClass: 'bg-rose-500/15 text-rose-300 border-rose-500/35',
      cardBorderHighlight: 'border-rose-500/40 shadow-[0_0_24px_rgba(244,63,94,0.15)] ring-1 ring-rose-500/30',
      isAlert: true,
    };
  }

  // Warning Alert: Elevated / High Latency (90 - 139ms or jitter >= 8ms)
  if (latencyMs >= LATENCY_THRESHOLDS.STABLE_MAX || (jitterMs !== undefined && jitterMs >= 8)) {
    return {
      level: 'warning',
      label: 'High Latency Warning',
      persianLabel: 'هشدار تاخیر بالا',
      iconColorClass: 'text-amber-400',
      containerBgClass: 'bg-amber-500/15',
      containerBorderClass: 'border-amber-500/35 shadow-[0_0_12px_rgba(245,158,11,0.2)]',
      statusDotClass: 'bg-amber-400 ring-2 ring-amber-400/35 animate-pulse',
      badgeClass: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
      cardBorderHighlight: 'border-amber-500/30 shadow-[0_0_18px_rgba(245,158,11,0.12)] ring-1 ring-amber-500/25',
      isAlert: true,
    };
  }

  // Stable Normal Latency (50 - 89ms)
  if (latencyMs >= LATENCY_THRESHOLDS.OPTIMAL_MAX) {
    return {
      level: 'stable',
      label: 'Stable Connection',
      persianLabel: 'پایدار و استاندارد',
      iconColorClass: 'text-sky-400',
      containerBgClass: 'bg-sky-500/10',
      containerBorderClass: 'border-sky-500/25',
      statusDotClass: 'bg-sky-400 ring-2 ring-sky-400/20',
      badgeClass: 'bg-sky-500/10 text-sky-300 border-sky-500/20',
      cardBorderHighlight: 'border-white/[0.08]',
      isAlert: false,
    };
  }

  // Optimal Low Latency (< 50ms)
  return {
    level: 'optimal',
    label: 'Optimal Real-time',
    persianLabel: 'عالی و بهینه',
    iconColorClass: 'text-emerald-400',
    containerBgClass: 'bg-emerald-500/10',
    containerBorderClass: 'border-emerald-500/25',
    statusDotClass: 'bg-emerald-400 ring-2 ring-emerald-400/20',
    badgeClass: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20',
    cardBorderHighlight: 'border-white/[0.08]',
    isAlert: false,
  };
}
