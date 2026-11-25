// ─────────────────────────────────────────────────────────────
// Activity scoring engine
// ─────────────────────────────────────────────────────────────
export const ACTIVITIES = {
  running: {
    label: 'Running', emoji: '🏃',
    tempRange: [8, 18], maxPrecip: 30, maxWind: 8, maxUV: 7,
    preferDay: true,
    weights: { temp: 0.35, precip: 0.30, wind: 0.15, uv: 0.10, air: 0.10 }
  },
  cycling: {
    label: 'Cycling', emoji: '🚴',
    tempRange: [12, 22], maxPrecip: 20, maxWind: 6, maxUV: 7,
    preferDay: true,
    weights: { temp: 0.30, precip: 0.30, wind: 0.25, uv: 0.10, air: 0.05 }
  },
  hiking: {
    label: 'Hiking', emoji: '🥾',
    tempRange: [8, 20], maxPrecip: 25, maxWind: 10, maxUV: 8,
    preferDay: true,
    weights: { temp: 0.30, precip: 0.30, wind: 0.15, uv: 0.15, air: 0.10 }
  },
  picnic: {
    label: 'Picnic', emoji: '🧺',
    tempRange: [18, 26], maxPrecip: 10, maxWind: 5, maxUV: 6,
    preferDay: true,
    weights: { temp: 0.40, precip: 0.35, wind: 0.15, uv: 0.10 }
  },
  dog_walk: {
    label: 'Dog Walk', emoji: '🐕',
    tempRange: [5, 25], maxPrecip: 30, maxWind: 10, maxUV: 8,
    weights: { temp: 0.35, precip: 0.35, wind: 0.15, uv: 0.15 }
  },
  stargazing: {
    label: 'Stargazing', emoji: '🌌',
    tempRange: [5, 20], maxPrecip: 5, maxWind: 5, maxUV: 0,
    preferNight: true,
    weights: { temp: 0.25, precip: 0.50, wind: 0.25 }
  }
};

const scoreTemp = (t, [lo, hi]) => {
  if (t == null) return 60;
  if (t >= lo && t <= hi) return 100;
  return Math.max(0, 100 - (t < lo ? lo - t : t - hi) * 10);
};
const scorePrecip = (c, max) => {
  if (c == null) return 70;
  if (c <= max) return 100;
  return Math.max(0, 100 - (c - max) * 2.5);
};
const scoreWind = (w, max) => {
  if (w == null) return 70;
  if (w <= max) return 100;
  return Math.max(0, 100 - (w - max) * 10);
};
const scoreUV = (uv, max) => {
  if (uv == null) return 80;
  if (uv <= max) return 100;
  return Math.max(0, 100 - (uv - max) * 15);
};
const scoreAir = (aqi) => {
  if (aqi == null) return 80;
  if (aqi <= 20) return 100;
  if (aqi <= 40) return 80;
  if (aqi <= 60) return 55;
  if (aqi <= 80) return 30;
  return 15;
};

function scoreHour(hour, profile, envAqi) {
  const s = {
    temp: scoreTemp(hour.temp, profile.tempRange),
    precip: scorePrecip(hour.precipitationChance, profile.maxPrecip),
    wind: scoreWind(hour.windSpeed, profile.maxWind),
    uv: scoreUV(hour.uvIndex, profile.maxUV),
    air: scoreAir(envAqi)
  };
  let total = 0, wsum = 0;
  for (const [k, w] of Object.entries(profile.weights)) {
    total += s[k] * w;
    wsum += w;
  }
  return Math.round(total / wsum);
}

function generateReasons(hour, profile, envAqi) {
  const out = [];
  const [lo, hi] = profile.tempRange;
  if (hour.temp >= lo && hour.temp <= hi) out.push(`Comfortable ${hour.temp.toFixed(0)}°C`);
  if (hour.precipitationChance != null && hour.precipitationChance <= profile.maxPrecip)
    out.push(`${hour.precipitationChance}% rain chance`);
  if (hour.windSpeed != null && hour.windSpeed <= profile.maxWind)
    out.push(`Light wind ${hour.windSpeed.toFixed(1)} m/s`);
  if (envAqi != null && envAqi <= 40) out.push('Good air quality');
  if (hour.uvIndex != null && hour.uvIndex <= profile.maxUV)
    out.push(`UV ${hour.uvIndex.toFixed(1)}`);
  return out.slice(0, 3);
}

function pickBestHours(scored) {
  const sorted = [...scored].sort((a, b) => b.score - a.score);
  const picked = [];
  for (const h of sorted) {
    if (picked.every(p => Math.abs(new Date(p.time) - new Date(h.time)) > 2 * 3600 * 1000)) {
      picked.push(h);
      if (picked.length === 3) break;
    }
  }
  return picked.sort((a, b) => new Date(a.time) - new Date(b.time));
}

export function computeBestTimes(hourlyData, profile, env) {
  const envAqi = env?.europeanAqi ?? null;
  const scored = hourlyData.hourly
    .map(h => {
      if (profile.preferNight && h.isDay) return null;
      if (profile.preferDay && !h.isDay) return null;
      const score = scoreHour(h, profile, envAqi);
      return {
        time: h.time, score,
        temp: h.temp, feelsLike: h.feelsLike,
        precipChance: h.precipitationChance,
        precipitation: h.precipitation,
        windSpeed: h.windSpeed, uvIndex: h.uvIndex,
        isDay: h.isDay, condition: h.condition, weatherCode: h.weatherCode,
        reasons: generateReasons(h, profile, envAqi)
      };
    })
    .filter(Boolean);

  return { bestHours: pickBestHours(scored), allHours: scored };
}

// ─────────────────────────────────────────────────────────────
// Rain-watch helpers
// ─────────────────────────────────────────────────────────────
export function computeRainWatch(hourlyData) {
  const upcoming = hourlyData.hourly.slice(0, 4);
  const firstRain = upcoming.find(h =>
    (h.precipitationChance ?? 0) >= 40 || (h.precipitation ?? 0) >= 0.1
  ) || null;

  const now = Date.now();
  const minutesUntilRain = firstRain
    ? Math.max(0, Math.round((new Date(firstRain.time) - now) / 60000))
    : null;

  return {
    shouldNotify: firstRain != null && minutesUntilRain != null && minutesUntilRain <= 90,
    minutesUntilRain,
    summary: firstRain
      ? `Rain expected in about ${minutesUntilRain} minutes (${firstRain.precipitationChance ?? '?'}% chance)`
      : 'No rain expected in the next few hours',
    peakChance: firstRain?.precipitationChance ?? null,
    firstRainAt: firstRain?.time ?? null,
    hours: upcoming
  };
}

// ─────────────────────────────────────────────────────────────
// Commute helpers
// ─────────────────────────────────────────────────────────────
export const TRAVEL_MINUTES = { driving: 25, transit: 35, walking: 30, cycling: 20 };

export function resolveDeparture(hhmm) {
  const now = new Date();
  if (!hhmm) return new Date(now.getTime() + 30 * 60000);
  const [h, m] = hhmm.split(':').map(Number);
  const d = new Date(now);
  d.setHours(h, m, 0, 0);
  if (d < now) d.setDate(d.getDate() + 1);
  return d;
}

export function closestHour(hourly, target) {
  return hourly.reduce(
    (best, h) =>
      !best || Math.abs(new Date(h.time) - target) < Math.abs(new Date(best.time) - target)
        ? h : best,
    null
  );
}

export function buildCommuteSummary(originH, destH, mode) {
  const parts = [];
  const rainO = (originH.precipitationChance ?? 0) >= 50;
  const rainD = (destH.precipitationChance ?? 0) >= 50;

  if (!rainO && !rainD) parts.push('No rain expected at either end.');
  else if (rainO && rainD) parts.push('Rain likely at both ends — bring an umbrella.');
  else if (rainO) parts.push('Rain at your departure point — take an umbrella.');
  else parts.push('Rain expected at your destination.');

  const tempDiff = Math.abs((originH.temp ?? 0) - (destH.temp ?? 0));
  if (tempDiff >= 5) parts.push(`Temperature differs by ${tempDiff.toFixed(0)}° between ends.`);

  const maxWind = Math.max(originH.windSpeed ?? 0, destH.windSpeed ?? 0);
  if (maxWind >= 8 && (mode === 'cycling' || mode === 'walking'))
    parts.push('Strong winds — consider transit instead.');

  return parts.join(' ');
}

export function buildCommuteFlags(originH, destH, mode) {
  const flags = [];
  const rainO = (originH.precipitationChance ?? 0) >= 50;
  const rainD = (destH.precipitationChance ?? 0) >= 50;
  if (rainO) flags.push({ type: 'rain-origin', label: 'Rain at departure point' });
  if (rainD) flags.push({ type: 'rain-destination', label: 'Rain at destination' });

  const maxWind = Math.max(originH.windSpeed ?? 0, destH.windSpeed ?? 0);
  if (maxWind >= 8 && (mode === 'cycling' || mode === 'walking'))
    flags.push({ type: 'wind', label: `Strong wind (${maxWind.toFixed(1)} m/s)` });

  const minTemp = Math.min(originH.temp ?? 20, destH.temp ?? 20);
  if (minTemp <= 2) flags.push({ type: 'cold', label: 'Freezing — watch for ice' });
  if (minTemp >= 32) flags.push({ type: 'heat', label: 'Extreme heat — hydrate' });

  return flags;
}