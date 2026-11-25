import { useState, useEffect } from 'react';
import WeatherSearch from './components/WeatherSearch';
import WeatherDisplay from './components/WeatherDisplay';
import AIInsights from './components/AIInsights';
import SavedLocations from './components/SavedLocations';
import Settings from './components/Settings';
import InteractiveMap from './components/InteractiveMap';
import SevereAlerts from './components/SevereAlerts';
import WeatherContext from './components/WeatherContext';
import PlanningTools from './components/PlanningTools';
import { getWeatherAlerts } from './services/api';

import {
  getCurrentWeather,
  getForecast,
  getHourlyForecast,
  getLocations,
  saveLocation,
  deleteLocation,
  getPreferences,
  updatePreferences,
  getEnvironmentalContext
} from './services/api';

function App() {
  const [envData, setEnvData] = useState(null);
  const [alertsData, setAlertsData] = useState(null);
  const [weatherData, setWeatherData] = useState(null);
  const [forecastData, setForecastData] = useState(null);
  const [hourlyData, setHourlyData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [savedLocations, setSavedLocations] = useState([]);
  const [preferences, setPreferences] = useState({
    units: 'celsius',
    weatherProvider: 'open-meteo',
    speechEnabled: false,
    forecastDays: 7
  });
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    loadPreferences();
    loadSavedLocations();
  }, []);

  const loadPreferences = async () => {
    try {
      const data = await getPreferences();
      setPreferences((prev) => ({ ...prev, ...data.data }));
    } catch (err) {
      console.error('Failed to load preferences:', err);
    }
  };

  const loadSavedLocations = async () => {
    try {
      const data = await getLocations();
      setSavedLocations(data.data);
    } catch (err) {
      console.error('Failed to load saved locations:', err);
    }
  };

  const handleSearch = async (location) => {
  setLoading(true);
  setError(null);
  setWeatherData(null);
  setForecastData(null);
  setHourlyData(null);
  setAlertsData(null);
  setEnvData(null);
  const provider = preferences.weatherProvider;
  try {
    const [current, forecast, hourly, alerts, env] = await Promise.all([
      getCurrentWeather({ location, provider }),
      getForecast({ location, days: 14, provider }),
      getHourlyForecast({ location, hours: 24, provider }),
      getWeatherAlerts({ location, provider }),
      getEnvironmentalContext({ location, provider })  // fail-soft
    ]);

    setWeatherData(current.data);
    setForecastData(forecast.data);
    setHourlyData(hourly.data);
    setAlertsData(alerts.data);
    setEnvData(env.data);
  } catch (err) {
    setError(err.message);
  } finally {
    setLoading(false);
  }
};
  const handleLocationSelect = (location) => handleSearch(location.name);

  const handleSaveLocation = async () => {
    if (!weatherData) return;
    try {
      await saveLocation({
        name: weatherData.location.name,
        country: weatherData.location.country,
        lat: weatherData.location.lat,
        lon: weatherData.location.lon
      });
      loadSavedLocations();
    } catch (err) {
      console.error('Failed to save location:', err);
    }
  };

  const handleDeleteLocation = async (id) => {
    try {
      await deleteLocation(id);
      loadSavedLocations();
    } catch (err) {
      console.error('Failed to delete location:', err);
    }
  };

  const handleUpdatePreferences = async (newPreferences) => {
    try {
      const data = await updatePreferences(newPreferences);
      setPreferences((prev) => ({ ...prev, ...data.data }));
      setShowSettings(false);
    } catch (err) {
      console.error('Failed to update preferences:', err);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100">
      <header className="bg-white shadow-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-3 sm:py-4 flex justify-between items-center">
          <h1 className="text-xl sm:text-2xl font-bold text-blue-600">WeatherVoice</h1>
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="px-3 py-2 sm:px-4 sm:py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition text-sm sm:text-base"
            aria-label="Settings"
          >
            Settings
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-3 sm:px-4 py-4 sm:py-8">
        {showSettings && (
          <Settings
            preferences={preferences}
            onUpdate={handleUpdatePreferences}
            onClose={() => setShowSettings(false)}
          />
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          <div className="lg:col-span-2 space-y-4 sm:space-y-6 order-2 lg:order-1">
            <WeatherSearch onSearch={handleSearch} loading={loading} />

            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-3 sm:px-4 py-3 rounded text-sm sm:text-base">
                {error}
              </div>
            )}

            {loading && (
              <div className="text-center py-8">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                <p className="mt-4 text-gray-600 text-sm sm:text-base">Loading weather data...</p>
              </div>
            )}
{weatherData && alertsData?.alerts?.length > 0 && (
  <SevereAlerts alerts={alertsData.alerts} />
)}
            {weatherData && (
              <WeatherDisplay
                weatherData={weatherData}
                forecastData={forecastData}
                hourlyData={hourlyData}
                units={preferences.units}
                onSaveLocation={handleSaveLocation}
              />
            )}
            {weatherData && (
  <WeatherContext
    env={envData}
    feelsLike={weatherData.current.feelsLike}
    visibility={weatherData.current.visibility}
    units={preferences.units}
  />
)}

{weatherData && (
  <PlanningTools
    weatherData={weatherData}
    preferences={preferences}
  />
)}

            {weatherData && (
              <AIInsights
                weatherData={weatherData}
                forecastData={forecastData}
                speechEnabled={preferences.speechEnabled}
              />
            )}
            {weatherData && (
  <InteractiveMap
    lat={weatherData.location.lat}
    lon={weatherData.location.lon}
    locationName={weatherData.location.name}
  />
)}
          </div>

          <div className="order-1 lg:order-2">
            <SavedLocations
              locations={savedLocations}
              onSelect={handleLocationSelect}
              onDelete={handleDeleteLocation}
            />
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;