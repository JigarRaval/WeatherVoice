import axios from 'axios';

// Open-Meteo Provider (no API key required)
export class OpenMeteoProvider {
  constructor() {
    this.baseUrl = 'https://api.open-meteo.com/v1';
    this.geocodingUrl = 'https://geocoding-api.open-meteo.com/v1';
  }

  async _resolveLocation(location) {
    if (typeof location === 'string') {
      const geoResponse = await axios.get(
        `${this.geocodingUrl}/search?name=${encodeURIComponent(location)}&count=1&language=en&format=json`
      );
      if (!geoResponse.data.results || geoResponse.data.results.length === 0) {
        throw new Error('Location not found');
      }
      const r = geoResponse.data.results[0];
      return { lat: r.latitude, lon: r.longitude, name: r.name, country: r.country };
    }
    return {
      lat: location.lat,
      lon: location.lon,
      name: `${location.lat.toFixed(2)}, ${location.lon.toFixed(2)}`,
      country: undefined
    };
  }

  async getCurrentWeather(location) {
    const { lat, lon, name, country } = await this._resolveLocation(location);

    const response = await axios.get(
      `${this.baseUrl}/forecast?latitude=${lat}&longitude=${lon}` +
        `&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,` +
        `wind_speed_10m,wind_direction_10m,precipitation,cloud_cover,visibility,surface_pressure` +
        `&daily=sunrise,sunset&timezone=auto&forecast_days=1`
    );

    const data = response.data.current;
    const daily = response.data.daily;
    const weatherCode = data.weather_code;

    return {
      location: { name, country, lat, lon },
      current: {
        temp: data.temperature_2m,
        feelsLike: data.apparent_temperature,
        humidity: data.relative_humidity_2m,
        windSpeed: data.wind_speed_10m,
        windDirection: data.wind_direction_10m,
        condition: this.getWeatherCondition(weatherCode),
        weatherCode,
        precipitation: data.precipitation,
        cloudCover: data.cloud_cover,
        visibility: data.visibility,
        pressure: data.surface_pressure,
        sunrise: daily?.sunrise?.[0] ? new Date(daily.sunrise[0]) : null,
        sunset: daily?.sunset?.[0] ? new Date(daily.sunset[0]) : null
      },
      timestamp: new Date()
    };
  }

  async getForecast(location, days = 7) {
    const { lat, lon, name, country } = await this._resolveLocation(location);

    const response = await axios.get(
      `${this.baseUrl}/forecast?latitude=${lat}&longitude=${lon}` +
        `&daily=weather_code,temperature_2m_max,temperature_2m_min,` +
        `precipitation_probability_max,precipitation_sum,relative_humidity_2m_mean,` +
        `wind_speed_10m_max,sunrise,sunset,uv_index_max` +
        `&timezone=auto&forecast_days=${days}`
    );

    const daily = response.data.daily;
    const forecast = daily.time.map((time, i) => ({
      date: new Date(`${time}T12:00:00`),
      tempMax: daily.temperature_2m_max[i],
      tempMin: daily.temperature_2m_min[i],
      weatherCode: daily.weather_code[i],
      condition: this.getWeatherCondition(daily.weather_code[i]),
      precipitationChance: daily.precipitation_probability_max?.[i] ?? null,
      precipitationAmount: daily.precipitation_sum[i],
      humidity: daily.relative_humidity_2m_mean[i],
      windSpeed: daily.wind_speed_10m_max[i],
      uvIndex: daily.uv_index_max?.[i] ?? null,
      sunrise: daily.sunrise?.[i] ? new Date(daily.sunrise[i]) : null,
      sunset: daily.sunset?.[i] ? new Date(daily.sunset[i]) : null
    }));

    return {
      location: { name, country, lat, lon },
      forecast,
      timestamp: new Date()
    };
  }

  async getHourlyForecast(location, hours = 24) {
    const { lat, lon, name, country } = await this._resolveLocation(location);
    const forecastDays = Math.ceil(hours / 24) + 1;

    const response = await axios.get(
      `${this.baseUrl}/forecast?latitude=${lat}&longitude=${lon}` +
        `&hourly=temperature_2m,apparent_temperature,relative_humidity_2m,` +
        `precipitation_probability,precipitation,weather_code,wind_speed_10m,is_day,uv_index` +
        `&timezone=auto&forecast_days=${forecastDays}`
    );

    const h = response.data.hourly;
    const cutoff = Date.now() - 60 * 60 * 1000; // include current hour
    const items = h.time
      .map((time, i) => ({
        time: new Date(time),
        temp: h.temperature_2m[i],
        feelsLike: h.apparent_temperature[i],
        humidity: h.relative_humidity_2m[i],
        precipitationChance: h.precipitation_probability?.[i] ?? null,
        precipitation: h.precipitation[i],
        weatherCode: h.weather_code[i],
        condition: this.getWeatherCondition(h.weather_code[i]),
        windSpeed: h.wind_speed_10m[i],
        isDay: h.is_day[i] === 1,
        uvIndex: h.uv_index?.[i] ?? null
      }))
      .filter((item) => item.time.getTime() >= cutoff)
      .slice(0, hours);

    return {
      location: { name, country, lat, lon },
      hourly: items,
      timestamp: new Date()
    };
  }

  getWeatherCondition(code) {
    const conditions = {
      0: 'Clear sky', 1: 'Mainly clear', 2: 'Partly cloudy', 3: 'Overcast',
      45: 'Fog', 48: 'Depositing rime fog',
      51: 'Light drizzle', 53: 'Moderate drizzle', 55: 'Dense drizzle',
      61: 'Slight rain', 63: 'Moderate rain', 65: 'Heavy rain',
      71: 'Slight snow', 73: 'Moderate snow', 75: 'Heavy snow', 77: 'Snow grains',
      80: 'Slight rain showers', 81: 'Moderate rain showers', 82: 'Violent rain showers',
      85: 'Slight snow showers', 86: 'Heavy snow showers',
      95: 'Thunderstorm', 96: 'Thunderstorm with hail', 99: 'Thunderstorm with heavy hail'
    };
    return conditions[code] || 'Unknown';
  }

  getCapabilities() {
    return {
      maxForecastDays: 16,
      maxHourlyHours: 48,
      hourlyResolution: '1h',
      supportsUV: true,
      supportsSunriseSunset: true,
      supportsPrecipitationProbability: true
    };
  }

  getName() { return 'open-meteo'; }
}

// OpenWeatherMap Provider (API key required)
export class OpenWeatherMapProvider {
  constructor(apiKey) {
    this.baseUrl = 'https://api.openweathermap.org/data/2.5';
    this.apiKey = apiKey;
  }

  async getCurrentWeather(location) {
    const url = typeof location === 'string'
      ? `${this.baseUrl}/weather?q=${encodeURIComponent(location)}&appid=${this.apiKey}&units=metric`
      : `${this.baseUrl}/weather?lat=${location.lat}&lon=${location.lon}&appid=${this.apiKey}&units=metric`;

    const response = await axios.get(url);
    const data = response.data;

    return {
      location: {
        name: data.name || 'Unknown',
        country: data.sys?.country,
        lat: data.coord.lat,
        lon: data.coord.lon
      },
      current: {
        temp: data.main.temp,
        feelsLike: data.main.feels_like,
        humidity: data.main.humidity,
        windSpeed: data.wind?.speed || 0,
        windDirection: data.wind?.deg || 0,
        condition: data.weather[0]?.description || 'Unknown',
        weatherCode: data.weather[0]?.id,
        icon: data.weather[0]?.icon,
        precipitation: data.rain?.['1h'] || data.snow?.['1h'] || 0,
        visibility: data.visibility,
        pressure: data.main.pressure,
        sunrise: data.sys?.sunrise ? new Date(data.sys.sunrise * 1000) : null,
        sunset: data.sys?.sunset ? new Date(data.sys.sunset * 1000) : null
      },
      timestamp: new Date()
    };
  }

  async getForecast(location, days = 5) {
    // OWM free tier: 5 days / 3-hour steps (max 40 entries)
    const url = typeof location === 'string'
      ? `${this.baseUrl}/forecast?q=${encodeURIComponent(location)}&appid=${this.apiKey}&units=metric&cnt=${days * 8}`
      : `${this.baseUrl}/forecast?lat=${location.lat}&lon=${location.lon}&appid=${this.apiKey}&units=metric&cnt=${days * 8}`;

    const response = await axios.get(url);
    const data = response.data;

    const dailyData = new Map();
    data.list.forEach((item) => {
      const date = new Date(item.dt * 1000).toDateString();
      if (!dailyData.has(date)) {
        dailyData.set(date, {
          temps: [], conditions: [], codes: [],
          precipitation: 0, pops: [], humidity: [], windSpeed: []
        });
      }
      const day = dailyData.get(date);
      day.temps.push(item.main.temp);
      day.conditions.push(item.weather[0]?.description);
      day.codes.push(item.weather[0]?.id);
      day.precipitation += (item.rain?.['3h'] || item.snow?.['3h'] || 0);
      day.pops.push(item.pop ?? 0);
      day.humidity.push(item.main.humidity);
      day.windSpeed.push(item.wind?.speed || 0);
    });

    const forecast = Array.from(dailyData.entries()).map(([dateStr, d], idx) => ({
      date: new Date(`${dateStr} 12:00:00`),
      tempMax: Math.max(...d.temps),
      tempMin: Math.min(...d.temps),
      condition: this.getMostCommonCondition(d.conditions),
      weatherCode: d.codes[0],
      precipitationChance: d.pops.length ? Math.round(Math.max(...d.pops) * 100) : null,
      precipitationAmount: d.precipitation,
      humidity: d.humidity.reduce((a, b) => a + b, 0) / d.humidity.length,
      windSpeed: Math.max(...d.windSpeed),
      uvIndex: null,
      // OWM only exposes city.sunrise/sunset for "today"
      sunrise: idx === 0 && data.city?.sunrise ? new Date(data.city.sunrise * 1000) : null,
      sunset: idx === 0 && data.city?.sunset ? new Date(data.city.sunset * 1000) : null
    }));

    return {
      location: {
        name: data.city?.name || 'Unknown',
        country: data.city?.country,
        lat: data.city?.coord?.lat || 0,
        lon: data.city?.coord?.lon || 0
      },
      forecast,
      timestamp: new Date()
    };
  }

  async getHourlyForecast(location, hours = 24) {
    // OWM only provides 3-hour steps on the free tier
    const cnt = Math.ceil(hours / 3);
    const url = typeof location === 'string'
      ? `${this.baseUrl}/forecast?q=${encodeURIComponent(location)}&appid=${this.apiKey}&units=metric&cnt=${cnt}`
      : `${this.baseUrl}/forecast?lat=${location.lat}&lon=${location.lon}&appid=${this.apiKey}&units=metric&cnt=${cnt}`;

    const response = await axios.get(url);
    const data = response.data;
    const city = data.city || {};
    const sunrise = city.sunrise ? new Date(city.sunrise * 1000) : null;
    const sunset = city.sunset ? new Date(city.sunset * 1000) : null;

    const hourly = data.list.map((item) => {
      const time = new Date(item.dt * 1000);
      const isDay = sunrise && sunset ? (time >= sunrise && time <= sunset) : true;
      return {
        time,
        temp: item.main.temp,
        feelsLike: item.main.feels_like,
        humidity: item.main.humidity,
        precipitationChance: item.pop != null ? Math.round(item.pop * 100) : null,
        precipitation: item.rain?.['3h'] || item.snow?.['3h'] || 0,
        condition: item.weather[0]?.description || 'Unknown',
        weatherCode: item.weather[0]?.id,
        windSpeed: item.wind?.speed || 0,
        isDay,
        uvIndex: null
      };
    });

    return {
      location: {
        name: city.name || 'Unknown',
        country: city.country,
        lat: city.coord?.lat || 0,
        lon: city.coord?.lon || 0
      },
      hourly: hourly.slice(0, hours),
      timestamp: new Date()
    };
  }

  getMostCommonCondition(conditions) {
    const counts = conditions.reduce((acc, c) => { acc[c] = (acc[c] || 0) + 1; return acc; }, {});
    return Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'Unknown';
  }

  getCapabilities() {
    return {
      maxForecastDays: 5,
      maxHourlyHours: 24,
      hourlyResolution: '3h',
      supportsUV: false,
      supportsSunriseSunset: 'today-only',
      supportsPrecipitationProbability: true
    };
  }

  getName() { return 'openweathermap'; }
}

export function createWeatherProvider(providerName) {
  switch (providerName) {
    case 'openweathermap': {
      const apiKey = process.env.OPENWEATHERMAP_API_KEY;
      if (!apiKey) throw new Error('OpenWeatherMap API key not configured');
      return new OpenWeatherMapProvider(apiKey);
    }
    case 'open-meteo':
    default:
      return new OpenMeteoProvider();
  }
}

export function getDefaultProvider() {
  return createWeatherProvider(process.env.WEATHER_PROVIDER || 'open-meteo');
}