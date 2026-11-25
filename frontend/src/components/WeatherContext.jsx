// ── Category helpers ────────────────────────────────────────
const UV_CATEGORIES = [
  { max: 2, label: 'Low', color: 'bg-green-100 text-green-800 border-green-300', bar: 'bg-green-500' },
  { max: 5, label: 'Moderate', color: 'bg-yellow-100 text-yellow-800 border-yellow-300', bar: 'bg-yellow-500' },
  { max: 7, label: 'High', color: 'bg-orange-100 text-orange-800 border-orange-300', bar: 'bg-orange-500' },
  { max: 10, label: 'Very High', color: 'bg-red-100 text-red-800 border-red-300', bar: 'bg-red-500' },
  { max: Infinity, label: 'Extreme', color: 'bg-purple-100 text-purple-800 border-purple-300', bar: 'bg-purple-600' }
];

const AQI_CATEGORIES = [
  { max: 20, label: 'Good', color: 'bg-green-100 text-green-800 border-green-300', bar: 'bg-green-500' },
  { max: 40, label: 'Fair', color: 'bg-yellow-100 text-yellow-800 border-yellow-300', bar: 'bg-yellow-500' },
  { max: 60, label: 'Moderate', color: 'bg-orange-100 text-orange-800 border-orange-300', bar: 'bg-orange-500' },
  { max: 80, label: 'Poor', color: 'bg-red-100 text-red-800 border-red-300', bar: 'bg-red-500' },
  { max: 100, label: 'Very Poor', color: 'bg-purple-100 text-purple-800 border-purple-300', bar: 'bg-purple-600' },
  { max: Infinity, label: 'Extremely Poor', color: 'bg-fuchsia-100 text-fuchsia-800 border-fuchsia-300', bar: 'bg-fuchsia-700' }
];

const POLLEN_CATEGORIES = [
  { max: 10, label: 'Low', color: 'bg-green-100 text-green-800 border-green-300', bar: 'bg-green-500' },
  { max: 50, label: 'Moderate', color: 'bg-yellow-100 text-yellow-800 border-yellow-300', bar: 'bg-yellow-500' },
  { max: 150, label: 'High', color: 'bg-orange-100 text-orange-800 border-orange-300', bar: 'bg-orange-500' },
  { max: Infinity, label: 'Very High', color: 'bg-red-100 text-red-800 border-red-300', bar: 'bg-red-500' }
];

// Returns { label, color, bar } for a given value and category table
function categorize(value, table) {
  if (value == null || Number.isNaN(value)) return null;
  return table.find((c) => value <= c.max) || table[table.length - 1];
}

// Simple horizontal gauge (0–max) with a marker at the value
function Gauge({ value, max, barColor }) {
  if (value == null) return null;
  const pct = Math.min(100, Math.max(0, (value / max) * 100));
  return (
    <div className="relative h-2 bg-gray-200 rounded-full overflow-hidden">
      <div className={`h-2 rounded-full ${barColor}`} style={{ width: `${pct}%` }} />
    </div>
  );
}

// ── Individual card ─────────────────────────────────────────
function ContextCard({ icon, title, value, unit, category, gauge, detail }) {
  return (
    <div className={`rounded-lg border p-4 ${category?.color || 'bg-gray-50 border-gray-200'}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xl" aria-hidden="true">{icon}</span>
          <p className="text-sm font-semibold">{title}</p>
        </div>
        {category && (
          <span className="px-2 py-0.5 rounded text-[11px] font-bold uppercase tracking-wide">
            {category.label}
          </span>
        )}
      </div>

      <p className="text-2xl font-bold mt-2">
        {value != null ? value.toFixed?.(1) ?? value : '—'}
        {unit && <span className="text-base font-normal ml-1">{unit}</span>}
      </p>

      {gauge && <div className="mt-2">{gauge}</div>}
      {detail && <p className="text-xs mt-2 opacity-80">{detail}</p>}
    </div>
  );
}

// ── Main panel ──────────────────────────────────────────────
function WeatherContext({ env, feelsLike, visibility, units }) {
  if (!env && feelsLike == null && visibility == null) return null;

  const uvCat = env?.uvIndex != null ? categorize(env.uvIndex, UV_CATEGORIES) : null;
  const aqiCat = env?.europeanAqi != null ? categorize(env.europeanAqi, AQI_CATEGORIES) : null;
  const pollenCat = env?.pollen?.overall != null
    ? categorize(env.pollen.overall, POLLEN_CATEGORIES)
    : null;

  const tempUnit = units === 'fahrenheit' ? '°F' : '°C';
  const fmtTemp = (t) => {
    if (t == null) return null;
    return units === 'fahrenheit' ? (t * 9) / 5 + 32 : t;
  };

  return (
    <section className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-xl font-bold text-gray-800 mb-4">Comfort & Health</h3>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Feels Like (already in weatherData) */}
        {feelsLike != null && (
          <ContextCard
            icon="🌡️"
            title="Feels Like"
            value={fmtTemp(feelsLike)}
            unit={tempUnit}
            category={null}
            detail={
              Math.abs(feelsLike - (env?.rawTemp ?? feelsLike)) > 3
                ? 'Noticeably different from the actual temperature'
                : undefined
            }
          />
        )}

        {/* UV Index */}
        <ContextCard
          icon="☀️"
          title="UV Index"
          value={env?.uvIndex}
          category={uvCat}
          gauge={<Gauge value={env?.uvIndex} max={12} barColor={uvCat?.bar} />}
          detail={uvCat ? `Clear-sky UV: ${env?.uvIndexClearSky ?? '—'}` : 'Unavailable'}
        />

        {/* Air Quality */}
        <ContextCard
          icon="🌫️"
          title="Air Quality"
          value={env?.europeanAqi}
          category={aqiCat}
          gauge={<Gauge value={env?.europeanAqi} max={100} barColor={aqiCat?.bar} />}
          detail={
            env?.pollutants?.pm2_5 != null
              ? `PM2.5: ${env.pollutants.pm2_5.toFixed(1)} µg/m³ · US AQI: ${env.usAqi ?? '—'}`
              : 'Unavailable'
          }
        />

        {/* Visibility (already in weatherData) */}
        {visibility != null && (
          <ContextCard
            icon="👁️"
            title="Visibility"
            value={(visibility / 1000).toFixed(1)}
            unit="km"
            category={
              visibility >= 10000
                ? { label: 'Clear', color: 'bg-green-100 text-green-800 border-green-300', bar: 'bg-green-500' }
                : visibility >= 4000
                ? { label: 'Moderate', color: 'bg-yellow-100 text-yellow-800 border-yellow-300', bar: 'bg-yellow-500' }
                : { label: 'Poor', color: 'bg-red-100 text-red-800 border-red-300', bar: 'bg-red-500' }
            }
            detail={visibility < 1000 ? 'Fog or heavy precipitation likely' : undefined}
          />
        )}

        {/* Pollen */}
        {env?.pollenAvailable ? (
          <ContextCard
            icon="🌿"
            title="Pollen"
            value={env.pollen.overall}
            unit="grains/m³"
            category={pollenCat}
            gauge={<Gauge value={env.pollen.overall} max={200} barColor={pollenCat?.bar} />}
            detail={
              env.pollen.dominantSpecies && env.pollen.dominantSpecies !== 'none'
                ? `Dominant: ${env.pollen.dominantSpecies}`
                : 'No dominant species'
            }
          />
        ) : (
          <ContextCard
            icon="🌿"
            title="Pollen"
            value="—"
            category={null}
            detail="Pollen data is currently available for Europe only"
          />
        )}
      </div>
    </section>
  );
}

export default WeatherContext;