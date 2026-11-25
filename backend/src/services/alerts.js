import axios from 'axios';

// ─────────────────────────────────────────────────────────────
// Safety guidance library — curated from NWS preparedness pages
// ─────────────────────────────────────────────────────────────
const SAFETY_GUIDANCE = {
  tornado: {
    extreme: [
      'TAKE COVER NOW in a basement, storm shelter, or interior room on the lowest floor.',
      'Stay away from windows and cover your head with your hands or a helmet.',
      'Do not wait to see the tornado — act immediately on the warning.',
      'Avoid mobile homes and vehicles; they are the worst options.'
    ],
    moderate: [
      'Review your safe place now (basement, interior hall, storm shelter).',
      'Keep your phone charged and monitor local alerts.',
      'Be ready to act quickly if a warning is issued.'
    ]
  },
  thunderstorm: {
    extreme: [
      'Move indoors to a sturdy building and stay away from windows.',
      'Do not shelter under trees or in open areas.',
      'A vehicle with a hard top is safer than being outdoors.'
    ],
    moderate: [
      'Secure loose outdoor objects that could become projectiles.',
      'Stay alert for rapidly changing conditions and lightning.',
      'Avoid using corded electronics during the storm.'
    ]
  },
  flood: {
    extreme: [
      'Move to higher ground immediately — do not wait for instructions.',
      'Never drive or walk through floodwater: turn around, don\'t drown.',
      'Avoid basements and underground parking during flash flooding.',
      'Stay off bridges over fast-moving water.'
    ],
    moderate: [
      'Monitor water levels and be ready to evacuate.',
      'Move valuables and important documents to higher floors.',
      'Do not camp or park near streams or rivers.'
    ]
  },
  heat: {
    extreme: [
      'Stay in air conditioning if possible; avoid strenuous outdoor activity.',
      'Drink water frequently — do not wait until you are thirsty.',
      'Check on elderly neighbours, children, and pets.',
      'Never leave people or pets in a parked vehicle.'
    ],
    moderate: [
      'Limit outdoor exertion during the hottest part of the day.',
      'Wear light, loose clothing and use sun protection.',
      'Know the signs of heat exhaustion and heat stroke.'
    ]
  },
  cold: {
    extreme: [
      'Stay indoors and dress in layers if you must go out.',
      'Protect pipes from freezing and keep heating sources safe.',
      'Check on vulnerable neighbours and pets.',
      'Avoid travel on icy roads unless absolutely necessary.'
    ],
    moderate: [
      'Cover exposed skin and limit time outdoors.',
      'Keep emergency supplies in your vehicle if travelling.',
      'Bring pets indoors.'
    ]
  },
  wind: {
    extreme: [
      'Stay indoors and away from windows.',
      'Secure or bring in loose outdoor objects.',
      'Avoid driving high-profile vehicles in strong crosswinds.',
      'Watch for downed power lines — treat them as live.'
    ],
    moderate: [
      'Secure loose items and check for weak tree limbs.',
      'Be cautious on bridges and open roads while driving.'
    ]
  },
  winter: {
    extreme: [
      'Avoid travel; if you must drive, carry blankets, food, and a charged phone.',
      'Stay indoors and keep dry; change out of wet clothing immediately.',
      'Watch for signs of frostbite and hypothermia.'
    ],
    moderate: [
      'Allow extra travel time and reduce speed.',
      'Keep your fuel tank full and your phone charged.'
    ]
  },
  lightning: {
    extreme: [
      'When thunder roars, go indoors — no place outdoors is safe.',
      'Stay inside for at least 30 minutes after the last thunder.',
      'Avoid open fields, hilltops, and tall isolated objects.'
    ],
    moderate: [
      'Move indoors at the first sound of thunder.',
      'Avoid plumbing and corded electronics during storms.'
    ]
  },
  default: {
    extreme: [
      'Follow instructions from local authorities immediately.',
      'Avoid unnecessary travel and stay tuned to official updates.',
      'Check on vulnerable people around you.'
    ],
    moderate: [
      'Stay informed through official channels.',
      'Review your emergency plan and supplies.'
    ]
  }
};

function classifyEvent(event = '', headline = '') {
  const text = `${event} ${headline}`.toLowerCase();
  if (text.includes('tornado')) return 'tornado';
  if (text.includes('thunderstorm')) return 'thunderstorm';
  if (text.includes('flood') || text.includes('rain')) return 'flood';
  if (text.includes('heat')) return 'heat';
  if (text.includes('cold') || text.includes('freeze')) return 'cold';
  if (text.includes('wind')) return 'wind';
  if (text.includes('winter') || text.includes('snow') || text.includes('ice')) return 'winter';
  if (text.includes('lightning')) return 'lightning';
  return 'default';
}

function getSafetyActions(event, headline, severity) {
  const category = classifyEvent(event, headline);
  const level = ['Extreme', 'Severe'].includes(severity) ? 'extreme' : 'moderate';
  return (
    SAFETY_GUIDANCE[category]?.[level] ||
    SAFETY_GUIDANCE[category]?.extreme ||
    SAFETY_GUIDANCE.default[level]
  );
}

function normaliseSeverity(raw = '') {
  const s = String(raw).toLowerCase();
  if (s.includes('extreme')) return 'Extreme';
  if (s.includes('severe')) return 'Severe';
  if (s.includes('moderate')) return 'Moderate';
  if (s.includes('minor')) return 'Minor';
  return 'Unknown';
}

// ─────────────────────────────────────────────────────────────
// NWS provider (US only, no API key)
// ─────────────────────────────────────────────────────────────
async function fetchNwsAlerts(lat, lon) {
  const url = `https://api.weather.gov/alerts/active?point=${lat.toFixed(4)},${lon.toFixed(4)}`;
  const res = await axios.get(url, {
    headers: {
      'User-Agent': '(WeatherVoice Weather App, contact@weathervoice.local)',
      Accept: 'application/geo+json'
    },
    timeout: 8000
  });

  const features = res.data?.features || [];
  return features.map((f) => {
    const p = f.properties || {};
    const severity = normaliseSeverity(p.severity);
    return {
      id: p.id || f.id,
      event: p.event || 'Weather Alert',
      severity,
      urgency: p.urgency || 'Unknown',
      certainty: p.certainty || 'Unknown',
      headline: p.headline || p.event || 'Weather Alert',
      description: p.description || '',
      instruction: p.instruction || '',
      safetyActions: getSafetyActions(p.event, p.headline, severity),
      onset: p.onset || p.effective || null,
      expires: p.expires || p.ends || null,
      senderName: p.senderName || 'National Weather Service',
      source: 'NWS',
      official: true,
      area: p.areaDesc || ''
    };
  });
}

// ─────────────────────────────────────────────────────────────
// OpenWeatherMap One Call 3.0 (global, API key required)
// ─────────────────────────────────────────────────────────────
async function fetchOwmAlerts(lat, lon, apiKey) {
  const url =
    `https://api.openweathermap.org/data/3.0/onecall` +
    `?lat=${lat}&lon=${lon}&appid=${apiKey}&exclude=current,minutely,hourly,daily`;

  const res = await axios.get(url, { timeout: 8000 });
  const alerts = res.data?.alerts || [];

  return alerts.map((a, i) => {
    const severity =
      /tornado|extreme|hurricane/i.test(a.event || '') ? 'Extreme'
      : /warning|severe/i.test(a.event || '') ? 'Severe'
      : 'Moderate';

    return {
      id: `owm-${lat}-${lon}-${i}-${a.start}`,
      event: a.event || 'Weather Alert',
      severity,
      urgency: 'Unknown',
      certainty: 'Unknown',
      headline: a.event || 'Weather Alert',
      description: a.description || '',
      instruction: '',
      safetyActions: getSafetyActions(a.event, a.description, severity),
      onset: a.start ? new Date(a.start * 1000).toISOString() : null,
      expires: a.end ? new Date(a.end * 1000).toISOString() : null,
      senderName: a.sender_name || 'OpenWeatherMap',
      source: 'OpenWeatherMap',
      official: true,
      area: ''
    };
  });
}

// ─────────────────────────────────────────────────────────────
// Open-Meteo deterministic advisories (no official feed)
// ─────────────────────────────────────────────────────────────
async function fetchDeterministicAdvisories(lat, lon) {
  const url =
    `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}` +
    `&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,wind_speed_10m_max,uv_index_max` +
    `&timezone=auto&forecast_days=3`;

  const res = await axios.get(url, { timeout: 8000 });
  const d = res.data?.daily;
  if (!d) return [];

  const out = [];
  const push = (event, severity, headline, actions) => {
    out.push({
      id: `advisory-${event}-${d.time[0]}`,
      event,
      severity,
      urgency: 'Expected',
      certainty: 'Likely',
      headline,
      description: `Based on the current forecast for ${res.data.timezone || 'your area'}.`,
      instruction: '',
      safetyActions: actions,
      onset: `${d.time[0]}T00:00:00`,
      expires: `${d.time[0]}T23:59:59`,
      senderName: 'WeatherVoice Forecast Advisory',
      source: 'WeatherVoice Advisory',
      official: false,
      area: ''
    });
  };

  if (d.wind_speed_10m_max?.[0] >= 20) {
    push('High Wind Advisory', 'Severe',
      `Forecast wind gusts up to ${d.wind_speed_10m_max[0]} m/s`,
      SAFETY_GUIDANCE.wind.extreme);
  }
  if (d.precipitation_sum?.[0] >= 50) {
    push('Heavy Rain Advisory', 'Severe',
      `Forecast rainfall of ${d.precipitation_sum[0]} mm`,
      SAFETY_GUIDANCE.flood.extreme);
  }
  if (d.temperature_2m_max?.[0] >= 38) {
    push('Extreme Heat Advisory', 'Severe',
      `Forecast high of ${d.temperature_2m_max[0]}°C`,
      SAFETY_GUIDANCE.heat.extreme);
  }
  if (d.temperature_2m_min?.[0] <= -15) {
    push('Extreme Cold Advisory', 'Severe',
      `Forecast low of ${d.temperature_2m_min[0]}°C`,
      SAFETY_GUIDANCE.cold.extreme);
  }
  if (d.uv_index_max?.[0] >= 8) {
    push('Very High UV Advisory', 'Moderate',
      `Forecast UV index up to ${d.uv_index_max[0]}`,
      SAFETY_GUIDANCE.heat.moderate);
  }
  return out;
}

// ─────────────────────────────────────────────────────────────
// Public API
// ─────────────────────────────────────────────────────────────
export async function getAlerts({ lat, lon, provider }) {
  const results = [];

  // 1. Try NWS for US coordinates (lat 18-72, lon -180 to -66 roughly)
  const isUS = lat >= 18 && lat <= 72 && lon >= -180 && lon <= -66;
  if (isUS) {
    try {
      results.push(...(await fetchNwsAlerts(lat, lon)));
    } catch (err) {
      console.warn('[alerts] NWS failed:', err.message);
    }
  }

  // 2. Try OWM if key is configured (global coverage)
  const owmKey = process.env.OPENWEATHERMAP_API_KEY;
  if (owmKey) {
    try {
      results.push(...(await fetchOwmAlerts(lat, lon, owmKey)));
    } catch (err) {
      console.warn('[alerts] OWM failed:', err.message);
    }
  }

  // 3. Fallback: deterministic advisories from Open-Meteo
  if (results.length === 0) {
    try {
      results.push(...(await fetchDeterministicAdvisories(lat, lon)));
    } catch (err) {
      console.warn('[alerts] advisory fallback failed:', err.message);
    }
  }

  // Deduplicate by event+expires, sort by severity
  const severityRank = { Extreme: 0, Severe: 1, Moderate: 2, Minor: 3, Unknown: 4 };
  const seen = new Set();
  return results
    .filter((a) => {
      const key = `${a.event}|${a.expires}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .sort((a, b) => (severityRank[a.severity] ?? 4) - (severityRank[b.severity] ?? 4));
}