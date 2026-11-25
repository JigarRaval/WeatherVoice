import { useEffect, useState } from 'react';
import { getRainWatch } from '../services/api';

const LS_ENABLED = 'weathervoice:rainEnabled';
const LS_LAST_NOTIFIED = 'weathervoice:rainLastNotified';
const NOTIFY_COOLDOWN_MS = 60 * 60 * 1000; // 60 min
const POLL_INTERVAL_MS = 10 * 60 * 1000;  // 10 min

function RainAlerts({ weatherData, preferences }) {
  const [enabled, setEnabled] = useState(
    () => typeof localStorage !== 'undefined' && localStorage.getItem(LS_ENABLED) === 'true'
  );
  const [permission, setPermission] = useState(
    typeof Notification !== 'undefined' ? Notification.permission : 'unsupported'
  );
  const [status, setStatus] = useState(null);
  const [error, setError] = useState(null);

  const requestPermission = async () => {
    if (typeof Notification === 'undefined') {
      setError('This browser does not support notifications.');
      return false;
    }
    if (Notification.permission === 'granted') return true;
    if (Notification.permission === 'denied') {
      setError('Notifications are blocked. Enable them in your browser settings.');
      return false;
    }
    const perm = await Notification.requestPermission();
    setPermission(perm);
    return perm === 'granted';
  };

  const handleToggle = async () => {
    setError(null);
    if (!enabled) {
      const granted = await requestPermission();
      if (!granted) return;
      localStorage.setItem(LS_ENABLED, 'true');
      setEnabled(true);
    } else {
      localStorage.setItem(LS_ENABLED, 'false');
      setEnabled(false);
      setStatus(null);
    }
  };

  // Poll for rain and fire notifications
  useEffect(() => {
    if (!enabled || !weatherData) return;
    let cancelled = false;

    const check = async () => {
      try {
        const res = await getRainWatch({
          lat: weatherData.location.lat,
          lon: weatherData.location.lon,
          provider: preferences.weatherProvider
        });
        if (cancelled) return;
        setStatus(res.data);

        if (res.data.shouldNotify) {
          const last = parseInt(localStorage.getItem(LS_LAST_NOTIFIED) || '0', 10);
          if (Date.now() - last > NOTIFY_COOLDOWN_MS) {
            try {
              new Notification('WeatherVoice Rain Alert', {
                body: res.data.summary,
                tag: 'weathervoice-rain',
                requireInteraction: false
              });
              localStorage.setItem(LS_LAST_NOTIFIED, String(Date.now()));
            } catch (notifyErr) {
              console.warn('Notification failed:', notifyErr);
            }
          }
        }
      } catch (err) {
        if (!cancelled) setError(err.message);
      }
    };

    check();
    const interval = setInterval(check, POLL_INTERVAL_MS);
    return () => { cancelled = true; clearInterval(interval); };
  }, [enabled, weatherData, preferences.weatherProvider]);

  if (!weatherData) {
    return (
      <p className="text-sm text-gray-600">Search a location first to enable rain alerts.</p>
    );
  }

  const recentNotified = (() => {
    const last = parseInt(localStorage.getItem(LS_LAST_NOTIFIED) || '0', 10);
    const diff = Date.now() - last;
    return diff < NOTIFY_COOLDOWN_MS ? Math.round(diff / 60000) : null;
  })();

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-4 bg-blue-50 rounded-lg p-4">
        <div>
          <p className="font-semibold text-gray-800">Rain notifications</p>
          <p className="text-sm text-gray-600 mt-1">
            We'll check the forecast every 10 minutes and notify you if rain is
            expected in the next 90 minutes for <strong>{weatherData.location.name}</strong>.
          </p>
        </div>
        <button
          onClick={handleToggle}
          className={`px-4 py-2 rounded-lg font-medium text-sm whitespace-nowrap ${
            enabled
              ? 'bg-red-500 text-white hover:bg-red-600'
              : 'bg-blue-600 text-white hover:bg-blue-700'
          }`}
        >
          {enabled ? 'Disable' : 'Enable'}
        </button>
      </div>

      {permission === 'denied' && (
        <p className="text-sm text-red-700 bg-red-50 border border-red-300 rounded p-2">
          Browser notifications are blocked. Update your site permissions to receive alerts.
        </p>
      )}

      {error && (
        <p className="text-sm text-red-700 bg-red-50 border border-red-300 rounded p-2">
          {error}
        </p>
      )}

      {status && (
        <div className={`rounded-lg p-3 border ${
          status.shouldNotify
            ? 'bg-orange-50 border-orange-300 text-orange-900'
            : 'bg-green-50 border-green-300 text-green-900'
        }`}>
          <p className="text-sm font-medium">
            {status.shouldNotify ? '🌧️ ' : '☀️ '}
            {status.summary}
          </p>
          {status.peakChance != null && (
            <p className="text-xs mt-1 opacity-80">
              Peak chance: {status.peakChance}%
            </p>
          )}
          {recentNotified != null && (
            <p className="text-xs mt-1 opacity-80">
              Last notification sent {recentNotified} minutes ago (cooldown 60 min).
            </p>
          )}
        </div>
      )}
    </div>
  );
}

export default RainAlerts;