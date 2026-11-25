export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
export const getEnvironmentalContext = ({ location, lat, lon, provider }) =>
  request(`/api/weather/environment?${qs({ location, lat, lon, provider })}`);

const request = async (path, options = {}) => {
  const res = await fetch(`${API_URL}${path}`, options);
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.success) {
    throw new Error(data.error || `Request failed (${res.status})`);
  }
  return data;
};

const qs = (obj) => {
  const p = new URLSearchParams();
  Object.entries(obj).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') p.set(k, v);
  });
  return p.toString();
};

// ─── Weather ────────────────────────────────────────────────
export const getCurrentWeather = ({ location, lat, lon, provider }) =>
  request(`/api/weather/current?${qs({ location, lat, lon, provider })}`);

export const getForecast = ({ location, lat, lon, days = 7, provider }) =>
  request(`/api/weather/forecast?${qs({ location, lat, lon, days, provider })}`);

export const getHourlyForecast = ({ location, lat, lon, hours = 24, provider }) =>
  request(`/api/weather/hourly?${qs({ location, lat, lon, hours, provider })}`);

// ─── Locations ──────────────────────────────────────────────
export const getLocations = () => request('/api/locations');

export const saveLocation = (location) =>
  request('/api/locations', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(location)
  });

export const deleteLocation = (id) =>
  request(`/api/locations/${id}`, { method: 'DELETE' });

// ─── Preferences ────────────────────────────────────────────
export const getPreferences = () => request('/api/preferences');

export const updatePreferences = (prefs) =>
  request('/api/preferences', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(prefs)
  });
export const getWeatherAlerts = ({ location, lat, lon, provider }) =>
  request(`/api/weather/alerts?${qs({ location, lat, lon, provider })}`);
export const getMapConfig = () => request('/api/weather/map/config');

// ─── Planner ────────────────────────────────────────────────
export const getBestTimes = ({ location, lat, lon, provider, activities }) =>
  request(`/api/planner/best-times?${qs({ location, lat, lon, provider, activities })}`);

export const getRainWatch = ({ location, lat, lon, provider }) =>
  request(`/api/weather/rain-watch?${qs({ location, lat, lon, provider })}`);

export const getCommuteWeather = (payload) =>
  request('/api/planner/commute', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

export const getCommutes = () => request('/api/planner/commutes');
export const saveCommute = (payload) =>
  request('/api/planner/commutes', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
export const deleteCommute = (id) =>
  request(`/api/planner/commutes/${id}`, { method: 'DELETE' });