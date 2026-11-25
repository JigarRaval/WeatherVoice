import { useState } from 'react';

const SEVERITY_STYLES = {
  Extreme: {
    wrapper: 'bg-red-50 border-red-500',
    badge: 'bg-red-600 text-white',
    icon: '🚨',
    title: 'text-red-800',
    pulse: 'animate-pulse'
  },
  Severe: {
    wrapper: 'bg-orange-50 border-orange-500',
    badge: 'bg-orange-600 text-white',
    icon: '⚠️',
    title: 'text-orange-800',
    pulse: ''
  },
  Moderate: {
    wrapper: 'bg-yellow-50 border-yellow-500',
    badge: 'bg-yellow-600 text-white',
    icon: '⚡',
    title: 'text-yellow-800',
    pulse: ''
  },
  Minor: {
    wrapper: 'bg-blue-50 border-blue-400',
    badge: 'bg-blue-600 text-white',
    icon: 'ℹ️',
    title: 'text-blue-800',
    pulse: ''
  },
  Unknown: {
    wrapper: 'bg-gray-50 border-gray-400',
    badge: 'bg-gray-600 text-white',
    icon: '📢',
    title: 'text-gray-800',
    pulse: ''
  }
};

const formatRange = (onset, expires) => {
  if (!onset && !expires) return null;
  const fmt = (d) =>
    d ? new Date(d).toLocaleString([], { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }) : '—';
  if (onset && expires) return `${fmt(onset)} → ${fmt(expires)}`;
  return onset ? `From ${fmt(onset)}` : `Until ${fmt(expires)}`;
};

function AlertCard({ alert }) {
  const [expanded, setExpanded] = useState(false);
  const style = SEVERITY_STYLES[alert.severity] || SEVERITY_STYLES.Unknown;

  return (
    <div className={`rounded-lg border-l-4 p-3 sm:p-4 ${style.wrapper}`}>
      <div className="flex items-start gap-2 sm:gap-3">
        <span className={`text-xl sm:text-2xl ${style.pulse}`} aria-hidden="true">{style.icon}</span>
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`px-2 py-0.5 rounded text-[10px] sm:text-xs font-bold uppercase tracking-wide ${style.badge}`}>
              {alert.severity}
            </span>
            <h4 className={`font-bold text-sm sm:text-base ${style.title}`}>{alert.event}</h4>
            {!alert.official && (
              <span className="px-2 py-0.5 rounded bg-gray-200 text-gray-700 text-[10px] sm:text-xs">
                Forecast advisory
              </span>
            )}
          </div>
          <p className="text-xs sm:text-sm text-gray-700 mt-1 font-medium">{alert.headline}</p>
          {formatRange(alert.onset, alert.expires) && (
            <p className="text-[10px] sm:text-xs text-gray-500 mt-1">{formatRange(alert.onset, alert.expires)}</p>
          )}

          {/* Safety actions are always visible — this is the "practical guidance" the user asked for */}
          <ul className="mt-3 space-y-1 list-disc list-inside text-xs sm:text-sm text-gray-800">
            {(alert.safetyActions || []).map((action, i) => (
              <li key={i}>{action}</li>
            ))}
          </ul>

          {/* Expandable official text */}
          <button
            onClick={() => setExpanded(!expanded)}
            className="mt-3 text-xs sm:text-sm font-semibold text-blue-700 hover:underline"
            aria-expanded={expanded}
          >
            {expanded ? 'Hide official details' : 'Show official details'}
          </button>

          {expanded && (
            <div className="mt-2 text-xs sm:text-sm text-gray-700 space-y-2 bg-white/60 rounded p-3">
              {alert.description && (
                <div>
                  <p className="font-semibold text-gray-800">Description</p>
                  <p className="whitespace-pre-line">{alert.description}</p>
                </div>
              )}
              {alert.instruction && (
                <div>
                  <p className="font-semibold text-gray-800">Official instructions</p>
                  <p className="whitespace-pre-line">{alert.instruction}</p>
                </div>
              )}
              <p className="text-[10px] sm:text-xs text-gray-500">
                Source: {alert.source} · {alert.senderName}
                {alert.area && ` · ${alert.area}`}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function SevereAlerts({ alerts }) {
  if (!alerts || alerts.length === 0) return null;

  const topSeverity = alerts[0]?.severity || 'Unknown';
  const style = SEVERITY_STYLES[topSeverity] || SEVERITY_STYLES.Unknown;

  return (
    <section
      aria-label="Severe weather alerts"
      className={`rounded-lg border ${style.wrapper} p-3 sm:p-4 space-y-3`}
    >
      <div className="flex items-center gap-2">
        <span className={`text-lg sm:text-xl ${style.pulse}`} aria-hidden="true">{style.icon}</span>
        <h3 className={`font-bold text-sm sm:text-base ${style.title}`}>
          {alerts.length} Active Weather {alerts.length === 1 ? 'Alert' : 'Alerts'}
        </h3>
        {alerts.some((a) => a.severity === 'Extreme') && (
          <span className="ml-auto px-2 py-0.5 rounded bg-red-600 text-white text-[10px] sm:text-xs font-bold animate-pulse">
            IMMEDIATE ACTION
          </span>
        )}
      </div>

      <div className="space-y-3">
        {alerts.map((alert) => (
          <AlertCard key={alert.id} alert={alert} />
        ))}
      </div>
    </section>
  );
}

export default SevereAlerts;