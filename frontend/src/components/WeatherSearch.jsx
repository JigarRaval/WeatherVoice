import { useState } from 'react';

function WeatherSearch({ onSearch, loading }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [usingLocation, setUsingLocation] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      onSearch(searchTerm.trim());
    }
  };

  const handleGeolocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser');
      return;
    }

    setUsingLocation(true);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        onSearch(`${latitude},${longitude}`);
        setUsingLocation(false);
      },
      (error) => {
        console.error('Geolocation error:', error);
        alert('Unable to retrieve your location. Please search manually.');
        setUsingLocation(false);
      }
    );
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
      <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 sm:gap-4">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search city or enter lat,lon"
          className="flex-1 px-3 sm:px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
          disabled={loading}
          aria-label="Search location"
        />
        <div className="flex gap-2 sm:gap-3">
          <button
            type="submit"
            disabled={loading || !searchTerm.trim()}
            className="flex-1 sm:flex-none px-4 sm:px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition text-sm sm:text-base"
          >
            Search
          </button>
          <button
            type="button"
            onClick={handleGeolocation}
            disabled={loading || usingLocation}
            className="flex-1 sm:flex-none px-4 sm:px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition text-sm sm:text-base"
            aria-label="Use my location"
          >
            {usingLocation ? 'Locating...' : '📍 My Location'}
          </button>
        </div>
      </form>
    </div>
  );
}

export default WeatherSearch;
