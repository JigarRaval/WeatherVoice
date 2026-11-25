import { useState } from 'react';

function Settings({ preferences, onUpdate, onClose }) {
  const [localPreferences, setLocalPreferences] = useState(preferences);

  const handleSubmit = (e) => {
    e.preventDefault();
    onUpdate(localPreferences);
  };

  const handleChange = (field, value) => {
    setLocalPreferences(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-bold text-gray-800">Settings</h3>
        <button
          onClick={onClose}
          className="text-gray-500 hover:text-gray-700"
          aria-label="Close settings"
        >
          ✕
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Units */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Temperature Units
          </label>
          <select
            value={localPreferences.units}
            onChange={(e) => handleChange('units', e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="celsius">Celsius (°C)</option>
            <option value="fahrenheit">Fahrenheit (°F)</option>
          </select>
        </div>

        {/* Weather Provider */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Weather Provider
          </label>
          <select
            value={localPreferences.weatherProvider}
            onChange={(e) => handleChange('weatherProvider', e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="open-meteo">Open-Meteo (Free, no API key)</option>
            <option value="openweathermap">OpenWeatherMap (Requires API key)</option>
          </select>
          <p className="text-xs text-gray-500 mt-1">
            Open-Meteo works without configuration. OpenWeatherMap requires an API key.
          </p>
        </div>

        {/* Speech */}
        <div>
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={localPreferences.speechEnabled}
              onChange={(e) => handleChange('speechEnabled', e.target.checked)}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <span className="text-sm font-medium text-gray-700">
              Enable Text-to-Speech for AI responses
            </span>
          </label>
          <p className="text-xs text-gray-500 mt-1">
            AI responses will be spoken aloud if supported by your browser.
          </p>
        </div>

        <div className="flex gap-2 pt-4">
          <button
            type="submit"
            className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
          >
            Save Settings
          </button>
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}

export default Settings;
