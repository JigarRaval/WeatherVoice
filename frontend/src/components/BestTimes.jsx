import { useEffect, useState } from 'react';
import { getBestTimes } from '../services/api';

const ACTIVITY_ORDER = ['running', 'cycling', 'hiking', 'picnic', 'dog_walk', 'stargazing'];
const SCORE_COLORS = [
  { min: 80, cls: 'bg-green-100 text-green-800 border-green-300', bar: 'bg-green-500' },
  { min: 60, cls: 'bg-yellow-100 text-yellow-800 border-yellow-300', bar: 'bg-yellow-500' },
  { min: 40, cls: 'bg-orange-100 text-orange-800 border-orange-300', bar: 'bg-orange-500' },
  { min: 0,  cls: 'bg-red-100 text-red-800 border-red-300',       bar: 'bg-red-500' }
];
const scoreStyle = (s) => SCORE_COLORS.find((c) => s >= c.min);

const fmtTime = (t) =>
  new Date(t).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });

function BestTimes({ weatherData, preferences }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeActivity, setActiveActivity] = useState('running');

  useEffect(() => {
    if (!weatherData) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    getBestTimes({
      lat: weatherData.location.lat,
      lon: weatherData.location.lon,
      provider: preferences.weatherProvider,
      activities: 'all'
    })
      .then((res) => { if (!cancelled) setData(res.data); })
      .catch((err) => { if (!cancelled) setError(err.message); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [weatherData, preferences.weatherProvider]);

  if (loading) return <p className="text-gray-500 text-sm">Analyzing best times…</p>;
  if (error) return <p className="text-red-600 text-sm">{error}</p>;
  if (!data) return null;

  const current = data.activities[activeActivity];
  if (!current) return null;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {ACTIVITY_ORDER.map((id) => {
          const a = data.activities[id];
          if (!a) return null;
          return (
            <button
              key={id}
              onClick={() => setActiveActivity(id)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition flex items-center gap-1 ${
                activeActivity === id
                  ? 'bg-blue-600 text-white'
                  : 'bg-blue-50 text-blue-700 hover:bg-blue-100'
              }`}
            >
              <span aria-hidden="true">{a.emoji}</span> {a.label}
            </button>
          );
        })}
      </div>

      {current.bestHours.length === 0 ? (
        <p className="text-sm text-gray-600 bg-gray-50 rounded p-3">
          No suitable hours for {current.label} in the next 24 h
          {current.preferNight ? ' (nighttime only)' : ''}.
        </p>
      ) : (
        <>
          <p className="text-sm text-gray-600">
            Best times for <strong>{current.label.toLowerCase()}</strong> over the next 24 hours:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {current.bestHours.map((h, i) => {
              const style = scoreStyle(h.score);
              return (
                <div
                  key={i}
                  className={`rounded-lg border p-4 ${style.cls}`}
                >
                  <div className="flex justify-between items-baseline">
                    <p className="font-bold text-lg">{fmtTime(h.time)}</p>
                    <span className="text-xs font-bold uppercase">
                      {h.score}/100
                    </span>
                  </div>
                  <div className="h-1.5 bg-white/50 rounded-full mt-2 overflow-hidden">
                    <div className={`h-1.5 ${style.bar}`} style={{ width: `${h.score}%` }} />
                  </div>
                  <p className="text-sm mt-2 flex items-center gap-1">
                    <span aria-hidden="true">
                      {h.isDay ? '☀️' : '🌙'}
                    </span>
                    {h.temp?.toFixed(0)}°C · {h.condition}
                  </p>
                  {h.reasons.length > 0 && (
                    <ul className="mt-2 space-y-0.5 text-xs opacity-90">
                      {h.reasons.map((r, j) => <li key={j}>• {r}</li>)}
                    </ul>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

export default BestTimes;