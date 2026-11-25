import { useEffect, useState } from 'react';
import { getCommuteWeather, getCommutes, saveCommute, deleteCommute } from '../services/api';

const MODES = [
  { id: 'driving', label: 'Driving', icon: '🚗' },
  { id: 'transit', label: 'Transit', icon: '🚇' },
  { id: 'cycling', label: 'Cycling', icon: '🚴' },
  { id: 'walking', label: 'Walking', icon: '🚶' }
];

const fmtTime = (iso) =>
  new Date(iso).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });

const fmtDateTime = (iso) =>
  new Date(iso).toLocaleString([], { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });

function WeatherMini({ hour }) {
  return (
    <div className="space-y-1 text-sm">
      <p className="text-2xl font-bold">{hour.temp?.toFixed(0)}°C</p>
      <p className="text-gray-600">{hour.condition}</p>
      <p className="text-xs text-gray-500">
        💧 {hour.precipitationChance ?? '—'}% · 💨 {hour.windSpeed?.toFixed(1) ?? '—'} m/s
      </p>
    </div>
  );
}

function CommutePlanner({ weatherData, preferences }) {
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
  const [departureTime, setDepartureTime] = useState('');
  const [mode, setMode] = useState('driving');
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState([]);
  const [saveName, setSaveName] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getCommutes().then((res) => setSaved(res.data)).catch(() => {});
  }, []);

  // Prefill origin with the currently viewed city if empty
  useEffect(() => {
    if (!origin && weatherData?.location?.name) {
      setOrigin(weatherData.location.name);
    }
  }, [weatherData, origin]);

  const handleCalculate = async (e) => {
    e.preventDefault();
    if (!origin.trim() || !destination.trim()) {
      setError('Please enter both origin and destination');
      return;
    }
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await getCommuteWeather({
        origin: origin.trim(),
        destination: destination.trim(),
        departureTime: departureTime || null,
        mode,
        provider: preferences.weatherProvider
      });
      setResult(res.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!result || !saveName.trim()) return;
    setSaving(true);
    try {
      const doc = await saveCommute({
        name: saveName.trim(),
        origin: result.origin.location,
        destination: result.destination.location,
        mode: result.mode,
        typicalDeparture: departureTime || null
      });
      setSaved((prev) => [doc.data, ...prev]);
      setSaveName('');
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteCommute(id);
      setSaved((prev) => prev.filter((s) => s._id !== id));
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="space-y-5">
      <form onSubmit={handleCalculate} className="space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <label className="block">
            <span className="text-sm font-medium text-gray-700">From</span>
            <input
              value={origin}
              onChange={(e) => setOrigin(e.target.value)}
              placeholder="Home city"
              className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </label>
          <label className="block">
            <span className="text-sm font-medium text-gray-700">To</span>
            <input
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              placeholder="Work city"
              className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </label>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <label className="block">
            <span className="text-sm font-medium text-gray-700">Departure</span>
            <input
              type="time"
              value={departureTime}
              onChange={(e) => setDepartureTime(e.target.value)}
              className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2"
            />
            <span className="text-xs text-gray-500">
              Leave empty for "now + 30 min"
            </span>
          </label>
          <label className="block">
            <span className="text-sm font-medium text-gray-700">Mode</span>
            <div className="flex flex-wrap gap-1.5 mt-1">
              {MODES.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setMode(m.id)}
                  className={`px-2.5 py-1.5 rounded-lg text-sm flex items-center gap-1 ${
                    mode === m.id
                      ? 'bg-blue-600 text-white'
                      : 'bg-blue-50 text-blue-700 hover:bg-blue-100'
                  }`}
                >
                  <span aria-hidden="true">{m.icon}</span> {m.label}
                </button>
              ))}
            </div>
          </label>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-60"
        >
          {loading ? 'Calculating…' : 'Get commute weather'}
        </button>
      </form>

      {error && (
        <div className="text-sm bg-red-50 text-red-700 border border-red-300 rounded p-2">
          {error}
        </div>
      )}

      {result && (
        <div className="bg-blue-50 rounded-lg p-4 space-y-3">
          <p className="font-semibold text-gray-800">{result.summary}</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="bg-white rounded-lg p-3">
              <p className="text-xs font-semibold text-gray-500 uppercase">Departure</p>
              <p className="font-semibold text-gray-800">{result.origin.location.name}</p>
              <p className="text-xs text-gray-500">{fmtDateTime(result.origin.at)}</p>
              <WeatherMini hour={result.origin.weather} />
            </div>
            <div className="bg-white rounded-lg p-3">
              <p className="text-xs font-semibold text-gray-500 uppercase">Arrival</p>
              <p className="font-semibold text-gray-800">{result.destination.location.name}</p>
              <p className="text-xs text-gray-500">{fmtDateTime(result.destination.at)}</p>
              <WeatherMini hour={result.destination.weather} />
            </div>
          </div>
          {result.flags.length > 0 && (
            <ul className="flex flex-wrap gap-2">
              {result.flags.map((f, i) => (
                <li
                  key={i}
                  className="px-2 py-0.5 rounded bg-orange-100 text-orange-800 text-xs font-medium"
                >
                  {f.label}
                </li>
              ))}
            </ul>
          )}

          <div className="flex gap-2 items-center pt-2 border-t border-blue-200">
            <input
              value={saveName}
              onChange={(e) => setSaveName(e.target.value)}
              placeholder="Save as… (e.g. Morning to work)"
              className="flex-1 border border-gray-300 rounded-lg px-3 py-1.5 text-sm"
            />
            <button
              onClick={handleSave}
              disabled={saving || !saveName.trim()}
              className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg disabled:opacity-60"
            >
              {saving ? 'Saving…' : 'Save'}
            </button>
          </div>
        </div>
      )}

      {saved.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold text-gray-700 mb-2">Saved commutes</h4>
          <ul className="space-y-1">
            {saved.map((s) => (
              <li
                key={s._id}
                className="flex justify-between items-center bg-gray-50 rounded-lg px-3 py-2 text-sm"
              >
                <div>
                  <p className="font-medium text-gray-800">{s.name}</p>
                  <p className="text-xs text-gray-500">
                    {s.origin?.name} → {s.destination?.name}
                    {s.typicalDeparture ? ` at ${s.typicalDeparture}` : ''}
                  </p>
                </div>
                <button
                  onClick={() => handleDelete(s._id)}
                  className="text-red-600 hover:underline text-xs"
                >
                  Delete
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default CommutePlanner;