import { useState } from 'react';

// Map a weather code (Open-Meteo / OWM) or condition text to an emoji.
function getWeatherEmoji(weatherCode, condition = '') {
  if (weatherCode != null) {
    if (weatherCode === 0 || weatherCode === 1 || (weatherCode >= 800 && weatherCode < 802)) return '☀️';
    if (weatherCode === 2 || weatherCode === 801) return '⛅';
    if (weatherCode === 3 || weatherCode === 802 || weatherCode === 803 || weatherCode === 804) return '☁️';
    if (weatherCode === 45 || weatherCode === 48) return '🌫️';
    if (weatherCode >= 51 && weatherCode <= 57) return '🌦️';
    if (weatherCode >= 61 && weatherCode <= 67) return '🌧️';
    if (weatherCode >= 71 && weatherCode <= 77) return '🌨️';
    if (weatherCode >= 80 && weatherCode <= 82) return '🌧️';
    if (weatherCode === 85 || weatherCode === 86) return '🌨️';
    if (weatherCode >= 95) return '⛈️';
    if (weatherCode >= 300 && weatherCode < 600) return '🌧️';
    if (weatherCode >= 600 && weatherCode < 700) return '🌨️';
    if (weatherCode >= 700 && weatherCode < 800) return '🌫️';
  }
  const c = condition.toLowerCase();
  if (c.includes('thunder')) return '⛈️';
  if (c.includes('snow') || c.includes('sleet')) return '🌨️';
  if (c.includes('rain') || c.includes('drizzle') || c.includes('shower')) return '🌧️';
  if (c.includes('fog') || c.includes('mist') || c.includes('haze')) return '🌫️';
  if (c.includes('part') && c.includes('cloud')) return '⛅';
  if (c.includes('cloud') || c.includes('overcast')) return '☁️';
  if (c.includes('clear') || c.includes('sun')) return '☀️';
  return '🌤️';
}

const formatTime = (d) => {
  if (!d) return '—';
  return new Date(d).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const formatDay = (d, i) => {
  if (i === 0) return 'Today';
  return new Date(d).toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' });
};

// ─── Sun arc panel ──────────────────────────────────────────
function SunPanel({ sunrise, sunset }) {
  if (!sunrise || !sunset) return null;

  const rise = new Date(sunrise);
  const set = new Date(sunset);
  const now = new Date();
  const dayMs = set - rise;
  const raw = dayMs > 0 ? (now - rise) / dayMs : 0;
  const progress = Math.max(0, Math.min(1, raw));
  const isDay = now >= rise && now <= set;

  // Semi-circle of radius 50 centred at (50, 50)
  const angle = Math.PI * progress;
  const sunX = 50 - 50 * Math.cos(angle);
  const sunY = 50 - 50 * Math.sin(angle);

  return (
    <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
      <h3 className="text-lg sm:text-xl font-bold text-gray-800 mb-2">Sunrise & Sunset</h3>
      <svg viewBox="0 0 100 55" className="w-full h-20 sm:h-24" role="img" aria-label="Sun path">
        <line x1="0" y1="50" x2="100" y2="50" stroke="#cbd5e1" strokeWidth="1" strokeDasharray="2,2" />
        <path d="M 0 50 A 50 50 0 0 1 100 50" fill="none" stroke="#fbbf24" strokeWidth="1" strokeDasharray="2,2" />
        <circle cx={sunX} cy={sunY} r="4" fill={isDay ? '#f59e0b' : '#94a3b8'} />
      </svg>
      <div className="flex justify-between text-xs sm:text-sm font-medium text-gray-700 mt-1">
        <span>🌅 {formatTime(rise)}</span>
        <span>🌇 {formatTime(set)}</span>
      </div>
      <p className="text-[10px] sm:text-xs text-gray-500 mt-2 text-center">
        {isDay ? 'Daytime' : now < rise ? 'Before sunrise' : 'After sunset'}
      </p>
    </div>
  );
}

// ─── Hourly strip ───────────────────────────────────────────
function HourlyStrip({ hourly, convertTemp, getTempUnit }) {
  if (!hourly || hourly.length === 0) return null;
  return (
    <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
      <h3 className="text-lg sm:text-xl font-bold text-gray-800 mb-4">Next {hourly.length} Hours</h3>
      <div className="flex gap-2 sm:gap-3 overflow-x-auto pb-2">
        {hourly.map((h, i) => (
          <div
            key={i}
            className="min-w-[70px] sm:min-w-[86px] flex-shrink-0 bg-blue-50 rounded-lg p-2 sm:p-3 text-center"
          >
            <p className="text-[10px] sm:text-xs font-semibold text-gray-600">
              {new Date(h.time).toLocaleTimeString([], { hour: 'numeric' })}
            </p>
            <p className="text-lg sm:text-xl mt-1">{getWeatherEmoji(h.weatherCode, h.condition)}</p>
            <p className="text-base sm:text-lg font-bold text-blue-600 mt-1">
              {convertTemp(h.temp)}{getTempUnit()}
            </p>
            {h.precipitationChance != null && (
              <p className="text-[10px] sm:text-xs text-gray-500 mt-1">💧 {h.precipitationChance}%</p>
            )}
            <p className="text-[8px] sm:text-[10px] text-gray-400 mt-1">{h.isDay ? 'Day' : 'Night'}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Daily forecast list ────────────────────────────────────
function DailyForecastList({ forecast, forecastDays, onForecastDaysChange, convertTemp, getTempUnit }) {
  if (!forecast || forecast.length === 0) return null;

  const shown = forecast.slice(0, forecastDays);
  const rangeMax = Math.max(...shown.map((d) => d.tempMax));
  const rangeMin = Math.min(...shown.map((d) => d.tempMin));
  const span = Math.max(rangeMax - rangeMin, 1);

  return (
    <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-2">
        <h3 className="text-lg sm:text-xl font-bold text-gray-800">{shown.length}-Day Forecast</h3>
        {forecast.length > 7 && (
          <div className="flex gap-2">
            {[7, 14].map((n) => (
              <button
                key={n}
                onClick={() => onForecastDaysChange(n)}
                className={`px-2 sm:px-3 py-1 text-xs sm:text-sm rounded-lg transition ${
                  forecastDays === n
                    ? 'bg-blue-500 text-white'
                    : 'bg-blue-50 text-blue-700 hover:bg-blue-100'
                }`}
              >
                {n}d
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="divide-y">
        {shown.map((day, i) => {
          const leftPct = ((day.tempMin - rangeMin) / span) * 100;
          const rightPct = 100 - ((day.tempMax - rangeMin) / span) * 100;
          return (
            <div
              key={i}
              className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3 py-3 sm:py-2"
            >
              <div className="w-full sm:w-24 text-sm font-semibold text-gray-700">
                {formatDay(day.date, i)}
              </div>
              <div className="w-full sm:w-8 text-center text-xl sm:order-1">
                {getWeatherEmoji(day.weatherCode, day.condition)}
              </div>
              <div className="flex items-center gap-2 flex-1 min-w-[120px] sm:min-w-[180px] sm:order-2">
                <span className="text-sm text-gray-500 w-12 text-right">
                  {convertTemp(day.tempMin)}{getTempUnit()}
                </span>
                <div className="flex-1 h-2 bg-gray-200 rounded-full relative">
                  <div
                    className="absolute h-2 rounded-full bg-gradient-to-r from-blue-400 to-orange-400"
                    style={{ left: `${leftPct}%`, right: `${rightPct}%` }}
                  />
                </div>
                <span className="text-sm font-semibold text-gray-700 w-12">
                  {convertTemp(day.tempMax)}{getTempUnit()}
                </span>
              </div>
              <div className="w-full sm:w-16 text-xs text-gray-600 sm:order-3">
                {day.precipitationChance != null ? `💧 ${day.precipitationChance}%` : ''}
              </div>
              <div className="w-full sm:w-40 text-xs text-gray-500 flex gap-2 sm:order-4">
                {day.sunrise && <span>🌅 {formatTime(day.sunrise)}</span>}
                {day.sunset && <span>🌇 {formatTime(day.sunset)}</span>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Main component ─────────────────────────────────────────
function WeatherDisplay({
  weatherData,
  forecastData,
  hourlyData,
  units,
  onSaveLocation
}) {
  const [forecastDays, setForecastDays] = useState(7);

  const convertTemp = (temp) => {
    if (temp == null) return '—';
    const v = units === 'fahrenheit' ? (temp * 9) / 5 + 32 : temp;
    return v.toFixed(1);
  };
  const getTempUnit = () => (units === 'fahrenheit' ? '°F' : '°C');

  if (!weatherData) return null;

  const today = forecastData?.forecast?.[0];

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Current Weather */}
      <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-3">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-800">
              {weatherData.location.name}
              {weatherData.location.country && `, ${weatherData.location.country}`}
            </h2>
            <p className="text-xs sm:text-sm text-gray-500">
              Last updated: {new Date(weatherData.timestamp).toLocaleString()}
            </p>
          </div>
          <button
            onClick={onSaveLocation}
            className="px-3 py-2 sm:px-4 sm:py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition text-xs sm:text-sm"
            aria-label="Save location"
          >
            Save Location
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:gap-4">
          <div className="text-center p-3 sm:p-4 bg-blue-50 rounded-lg">
            <p className="text-3xl sm:text-4xl font-bold text-blue-600">
              {convertTemp(weatherData.current.temp)}{getTempUnit()}
            </p>
            <p className="text-xs sm:text-sm text-gray-600 mt-1">Temperature</p>
          </div>
          <div className="text-center p-3 sm:p-4 bg-blue-50 rounded-lg">
            <p className="text-3xl sm:text-4xl font-bold text-blue-600">
              {convertTemp(weatherData.current.feelsLike)}{getTempUnit()}
            </p>
            <p className="text-xs sm:text-sm text-gray-600 mt-1">Feels Like</p>
          </div>
          <div className="text-center p-3 sm:p-4 bg-blue-50 rounded-lg">
            <p className="text-3xl sm:text-4xl font-bold text-blue-600">{weatherData.current.humidity}%</p>
            <p className="text-xs sm:text-sm text-gray-600 mt-1">Humidity</p>
          </div>
          <div className="text-center p-3 sm:p-4 bg-blue-50 rounded-lg">
            <p className="text-3xl sm:text-4xl font-bold text-blue-600">
              {weatherData.current.windSpeed.toFixed(1)} m/s
            </p>
            <p className="text-xs sm:text-sm text-gray-600 mt-1">Wind Speed</p>
          </div>
        </div>

        <div className="mt-4 p-3 sm:p-4 bg-gray-50 rounded-lg">
          <p className="text-base sm:text-lg font-semibold text-gray-700 flex items-center gap-2">
            <span>{getWeatherEmoji(weatherData.current.weatherCode, weatherData.current.condition)}</span>
            {weatherData.current.condition}
          </p>
          {weatherData.current.precipitation !== undefined && (
            <p className="text-xs sm:text-sm text-gray-600 mt-1">
              Precipitation: {weatherData.current.precipitation}mm
            </p>
          )}
          {weatherData.current.visibility && (
            <p className="text-xs sm:text-sm text-gray-600 mt-1">
              Visibility: {(weatherData.current.visibility / 1000).toFixed(1)}km
            </p>
          )}
          {weatherData.current.pressure && (
            <p className="text-xs sm:text-sm text-gray-600 mt-1">
              Pressure: {weatherData.current.pressure}hPa
            </p>
          )}
        </div>
      </div>

      {/* Sunrise / Sunset for today */}
      {today?.sunrise && today?.sunset && (
        <SunPanel sunrise={today.sunrise} sunset={today.sunset} />
      )}

      {/* Hourly */}
      {hourlyData?.hourly && (
        <HourlyStrip
          hourly={hourlyData.hourly}
          convertTemp={convertTemp}
          getTempUnit={getTempUnit}
        />
      )}

      {/* Daily forecast */}
      {forecastData?.forecast && (
        <DailyForecastList
          forecast={forecastData.forecast}
          forecastDays={forecastDays}
          onForecastDaysChange={setForecastDays}
          convertTemp={convertTemp}
          getTempUnit={getTempUnit}
        />
      )}
    </div>
  );
}

export default WeatherDisplay;