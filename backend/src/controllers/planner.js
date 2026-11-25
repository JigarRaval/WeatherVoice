import {
  ACTIVITIES, computeBestTimes, computeRainWatch,
  TRAVEL_MINUTES, resolveDeparture, closestHour,
  buildCommuteSummary, buildCommuteFlags
} from '../services/planner.js';
import { getEnvironmentalContext } from '../services/environment.js';
import { getDefaultProvider, createWeatherProvider } from '../services/weather-providers.js';
import { asyncHandler, AppError } from '../middleware/error.js';
import { CommuteProfile } from '../models/CommuteProfile.js';

const resolveProvider = (name) => (name ? createWeatherProvider(name) : getDefaultProvider());
const toLocationArg = (location, lat, lon) =>
  location ? location : { lat: parseFloat(lat), lon: parseFloat(lon) };

// ── Best times ──────────────────────────────────────────────
export const getBestTimes = asyncHandler(async (req, res) => {
  const { location, lat, lon, provider, activities } = req.query;

  const weatherProvider = resolveProvider(provider);
  const hourly = await weatherProvider.getHourlyForecast(
    toLocationArg(location, lat, lon), 24
  );

  let env = null;
  try {
    env = await getEnvironmentalContext(hourly.location.lat, hourly.location.lon);
  } catch (err) {
    console.warn('[best-times env]', err.message);
  }

  const requested = activities && activities !== 'all'
    ? activities.split(',').filter(a => ACTIVITIES[a])
    : Object.keys(ACTIVITIES);

  const result = {};
  for (const id of requested) {
    result[id] = {
      activity: id,
      ...ACTIVITIES[id],
      ...computeBestTimes(hourly, ACTIVITIES[id], env)
    };
  }

  res.json({
    success: true,
    data: { location: hourly.location, activities: result }
  });
});

// ── Rain watch ──────────────────────────────────────────────
export const getRainWatch = asyncHandler(async (req, res) => {
  const { location, lat, lon, provider } = req.query;

  const weatherProvider = resolveProvider(provider);
  const hourly = await weatherProvider.getHourlyForecast(
    toLocationArg(location, lat, lon), 6
  );

  res.json({
    success: true,
    data: {
      ...computeRainWatch(hourly),
      location: hourly.location,
      timestamp: new Date()
    }
  });
});

// ── Commute ─────────────────────────────────────────────────
export const getCommuteWeather = asyncHandler(async (req, res) => {
  const { origin, destination, departureTime, mode = 'driving', provider } = req.body;
  if (!origin || !destination) throw new AppError(400, 'origin and destination required');

  const weatherProvider = resolveProvider(provider);
  const [originHourly, destHourly] = await Promise.all([
    weatherProvider.getHourlyForecast(origin, 24),
    weatherProvider.getHourlyForecast(destination, 24)
  ]);

  const departure = resolveDeparture(departureTime);
  const travelMinutes = TRAVEL_MINUTES[mode] ?? 25;
  const arrival = new Date(departure.getTime() + travelMinutes * 60000);

  const originHour = closestHour(originHourly.hourly, departure);
  const destHour = closestHour(destHourly.hourly, arrival);

  if (!originHour || !destHour) {
    throw new AppError(500, 'Could not match forecast to commute times');
  }

  res.json({
    success: true,
    data: {
      origin: { location: originHourly.location, weather: originHour, at: departure.toISOString() },
      destination: { location: destHourly.location, weather: destHour, at: arrival.toISOString() },
      mode, travelMinutes,
      summary: buildCommuteSummary(originHour, destHour, mode),
      flags: buildCommuteFlags(originHour, destHour, mode)
    }
  });
});

// ── Commute persistence ─────────────────────────────────────
export const saveCommute = asyncHandler(async (req, res) => {
  const { name, origin, destination, mode, typicalDeparture } = req.body;
  if (!name || !origin?.lat || !destination?.lat) {
    throw new AppError(400, 'name, origin.lat/lon and destination.lat/lon required');
  }
  const doc = await CommuteProfile.create({ name, origin, destination, mode, typicalDeparture });
  res.json({ success: true, data: doc });
});

export const getCommutes = asyncHandler(async (req, res) => {
  const docs = await CommuteProfile.find().sort({ createdAt: -1 });
  res.json({ success: true, data: docs });
});

export const deleteCommute = asyncHandler(async (req, res) => {
  await CommuteProfile.findByIdAndDelete(req.params.id);
  res.json({ success: true });
});