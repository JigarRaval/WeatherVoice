import axios from 'axios';

const AIR_QUALITY_URL = 'https://air-quality-api.open-meteo.com/v1/air-quality';

// Pollen variables supported by Open-Meteo (Europe-only coverage)
const POLLEN_VARS = [
  'alder_pollen', 'birch_pollen', 'grass_pollen',
  'mugwort_pollen', 'olive_pollen', 'ragweed_pollen'
];

// AQI + pollutant + UV variables
const CORE_VARS = [
  'european_aqi', 'us_aqi',
  'uv_index', 'uv_index_clear_sky',
  'pm2_5', 'pm10', 'ozone', 'nitrogen_dioxide'
];

export async function getEnvironmentalContext(lat, lon) {
  const variables = [...CORE_VARS, ...POLLEN_VARS].join(',');

  const response = await axios.get(AIR_QUALITY_URL, {
    params: {
      latitude: lat,
      longitude: lon,
      current: variables,
      timezone: 'auto',
      forecast_days: 1
    },
    timeout: 8000
  });

  const c = response.data.current || {};

  // Pick the "worst" pollen among the six species
  const pollenSpecies = POLLEN_VARS
    .map((key) => ({
      species: key.replace('_pollen', '').replace('_', ' '),
      value: c[key] ?? 0
    }))
    .filter((p) => p.value > 0);

  const maxPollen = pollenSpecies.reduce(
    (acc, p) => (p.value > acc.value ? p : acc),
    { species: 'none', value: 0 }
  );

  return {
    uvIndex: c.uv_index ?? null,
    uvIndexClearSky: c.uv_index_clear_sky ?? null,
    europeanAqi: c.european_aqi ?? null,
    usAqi: c.us_aqi ?? null,
    pollutants: {
      pm2_5: c.pm2_5 ?? null,
      pm10: c.pm10 ?? null,
      ozone: c.ozone ?? null,
      no2: c.nitrogen_dioxide ?? null
    },
    pollen: {
      overall: maxPollen.value,
      dominantSpecies: maxPollen.species,
      species: pollenSpecies
    },
    // Flag so the frontend can explain "no pollen data for this region"
    pollenAvailable: pollenSpecies.length > 0,
    timestamp: new Date()
  };
}