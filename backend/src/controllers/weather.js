import { getDefaultProvider, createWeatherProvider } from '../services/weather-providers.js';
import { asyncHandler, AppError } from '../middleware/error.js';
import { getAlerts } from '../services/alerts.js';
import { getEnvironmentalContext } from '../services/environment.js';
import axios from 'axios';
const handleProviderError = (error) => {
  if (error.message === 'Location not found') throw new AppError(404, 'Location not found');
  if (error.message === 'OpenWeatherMap API key not configured')
    throw new AppError(500, 'OpenWeatherMap provider not configured');
  if (error.response?.status === 401) throw new AppError(401, 'Invalid API key for weather provider');
  if (error.response?.status === 429) throw new AppError(429, 'Weather provider rate limit exceeded');
  throw error;
};

export const getCurrentWeather = asyncHandler(async (req, res) => {
  const { location, lat, lon, provider } = req.query;
  if (!location && (!lat || !lon)) {
    throw new AppError(400, 'Either location name or lat/lon coordinates are required');
  }
  try {
    const weatherProvider = provider ? createWeatherProvider(provider) : getDefaultProvider();
    const weatherData = location
      ? await weatherProvider.getCurrentWeather(location)
      : await weatherProvider.getCurrentWeather({ lat: parseFloat(lat), lon: parseFloat(lon) });

    res.json({
      success: true,
      data: weatherData,
      provider: weatherProvider.getName(),
      capabilities: weatherProvider.getCapabilities()
    });
  } catch (error) {
    handleProviderError(error);
  }
});
export const getMapConfig = asyncHandler(async (req, res) => {
  const owmKey = process.env.OPENWEATHERMAP_API_KEY;
  const hasOwm = Boolean(owmKey);

  let rainViewer = null;
  try {
    const rv = await axios.get(
      'https://api.rainviewer.com/public/weather-maps.json',
      { timeout: 5000 }
    );
    rainViewer = { host: rv.data.host, radar: rv.data.radar };
  } catch (err) {
    console.warn('[map] RainViewer config failed:', err.message);
  }

  const layers = [
    {
      id: 'radar',
      label: 'Radar (animated)',
      provider: 'rainviewer',
      available: Boolean(rainViewer),
    },
    {
      id: 'precipitation',
      label: 'Precipitation',
      provider: 'openweathermap',
      available: hasOwm,
      tileUrl: '/api/weather/map/tile/precipitation_new/{z}/{x}/{y}',
    },
    {
      id: 'clouds',
      label: 'Clouds',
      provider: 'openweathermap',
      available: hasOwm,
      tileUrl: '/api/weather/map/tile/clouds_new/{z}/{x}/{y}',
    },
    {
      id: 'temperature',
      label: 'Temperature',
      provider: 'openweathermap',
      available: hasOwm,
      tileUrl: '/api/weather/map/tile/temp_new/{z}/{x}/{y}',
    },
    {
      id: 'wind',
      label: 'Wind',
      provider: 'openweathermap',
      available: hasOwm,
      tileUrl: '/api/weather/map/tile/wind_new/{z}/{x}/{y}',
    },
  ];

  res.json({ success: true, data: { rainViewer, layers } });
});

// ── OWM tile proxy (keeps API key server-side) ────────────────
const ALLOWED_OWM_LAYERS = new Set([
  'clouds_new', 'precipitation_new', 'pressure_new', 'wind_new', 'temp_new',
]);

export const proxyMapTile = asyncHandler(async (req, res) => {
  const { layer, z, x, y } = req.params;

  if (!ALLOWED_OWM_LAYERS.has(layer)) {
    return res.status(400).end();
  }
  if (!/^\d+$/.test(z) || !/^\d+$/.test(x) || !/^\d+$/.test(y)) {
    return res.status(400).end();
  }
  const zi = parseInt(z, 10);
  if (zi < 0 || zi > 20) return res.status(400).end();

  const owmKey = process.env.OPENWEATHERMAP_API_KEY;
  if (!owmKey) {
    // 1×1 transparent PNG so the map degrades silently
    const png = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=',
      'base64'
    );
    res.set('Content-Type', 'image/png');
    return res.send(png);
  }

  try {
    const url = `https://tile.openweathermap.org/map/${layer}/${z}/${x}/${y}.png?appid=${owmKey}`;
    const upstream = await axios.get(url, {
      responseType: 'arraybuffer',
      timeout: 8000,
    });
    res.set('Content-Type', 'image/png');
    res.set('Cache-Control', 'public, max-age=300');
    res.send(Buffer.from(upstream.data));
  } catch (err) {
    console.warn('[map tile]', err.message);
    res.status(502).end();
  }
});

export const getForecast = asyncHandler(async (req, res) => {
  const { location, lat, lon, days, provider } = req.query;
  if (!location && (!lat || !lon)) {
    throw new AppError(400, 'Either location name or lat/lon coordinates are required');
  }
  const forecastDays = days ? Math.min(Math.max(parseInt(days, 10), 1), 14) : 7;

  try {
    const weatherProvider = provider ? createWeatherProvider(provider) : getDefaultProvider();
    const forecastData = location
      ? await weatherProvider.getForecast(location, forecastDays)
      : await weatherProvider.getForecast({ lat: parseFloat(lat), lon: parseFloat(lon) }, forecastDays);

    res.json({
      success: true,
      data: forecastData,
      provider: weatherProvider.getName(),
      capabilities: weatherProvider.getCapabilities()
    });
  } catch (error) {
    handleProviderError(error);
  }
});

export const getHourlyForecast = asyncHandler(async (req, res) => {
  const { location, lat, lon, hours, provider } = req.query;
  if (!location && (!lat || !lon)) {
    throw new AppError(400, 'Either location name or lat/lon coordinates are required');
  }
  const hoursNum = hours ? Math.min(Math.max(parseInt(hours, 10), 1), 48) : 24;

  try {
    const weatherProvider = provider ? createWeatherProvider(provider) : getDefaultProvider();
    const data = location
      ? await weatherProvider.getHourlyForecast(location, hoursNum)
      : await weatherProvider.getHourlyForecast({ lat: parseFloat(lat), lon: parseFloat(lon) }, hoursNum);

    res.json({
      success: true,
      data,
      provider: weatherProvider.getName(),
      capabilities: weatherProvider.getCapabilities()
    });
  } catch (error) {
    handleProviderError(error);
  }
});

export const getWeatherAlerts = asyncHandler(async (req, res) => {
  const { lat, lon, location, provider } = req.query;

  let resolvedLat = lat ? parseFloat(lat) : null;
  let resolvedLon = lon ? parseFloat(lon) : null;

  // If only location string was given, resolve it via the weather provider
  if ((resolvedLat == null || resolvedLon == null) && location) {
    const weatherProvider = provider ? createWeatherProvider(provider) : getDefaultProvider();
    const current = await weatherProvider.getCurrentWeather(location);
    resolvedLat = current.location.lat;
    resolvedLon = current.location.lon;
  }

  if (resolvedLat == null || resolvedLon == null) {
    throw new AppError(400, 'Either location name or lat/lon coordinates are required');
  }

  try {
    const alerts = await getAlerts({ lat: resolvedLat, lon: resolvedLon, provider });
    res.json({
      success: true,
      data: { alerts, timestamp: new Date() },
      location: { lat: resolvedLat, lon: resolvedLon }
    });
  } catch (error) {
    console.warn('[alerts controller]', error.message);
    res.json({ success: true, data: { alerts: [], timestamp: new Date() } });
  }
});

export const getEnvironment = asyncHandler(async (req, res) => {
  const { lat, lon, location, provider } = req.query;

  let resolvedLat = lat ? parseFloat(lat) : null;
  let resolvedLon = lon ? parseFloat(lon) : null;

  // Resolve a city name to coordinates via the existing provider
  if ((resolvedLat == null || resolvedLon == null) && location) {
    const weatherProvider = provider ? createWeatherProvider(provider) : getDefaultProvider();
    const current = await weatherProvider.getCurrentWeather(location);
    resolvedLat = current.location.lat;
    resolvedLon = current.location.lon;
  }

  if (resolvedLat == null || resolvedLon == null) {
    throw new AppError(400, 'Either location name or lat/lon coordinates are required');
  }

  try {
    const data = await getEnvironmentalContext(resolvedLat, resolvedLon);
    res.json({ success: true, data });
  } catch (err) {
    console.warn('[environment]', err.message);
    // Never break the app — return nulls so the UI can show "unavailable"
    res.json({ success: true, data: null });
  }
});