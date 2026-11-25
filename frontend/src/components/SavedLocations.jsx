function SavedLocations({ locations, onSelect, onDelete }) {
  if (!locations || locations.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
        <h3 className="text-lg sm:text-xl font-bold text-gray-800 mb-4">Saved Locations</h3>
        <p className="text-gray-500 text-sm">No saved locations yet</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
      <h3 className="text-lg sm:text-xl font-bold text-gray-800 mb-4">Saved Locations</h3>
      <div className="space-y-2">
        {locations.map((location) => (
          <div
            key={location._id}
            className="flex justify-between items-center p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition"
          >
            <button
              onClick={() => onSelect(location)}
              className="flex-1 text-left text-gray-700 hover:text-blue-600 transition"
              aria-label={`Select ${location.name}`}
            >
              <p className="font-semibold text-sm sm:text-base">{location.name}</p>
              {location.country && (
                <p className="text-xs sm:text-sm text-gray-500">{location.country}</p>
              )}
            </button>
            <button
              onClick={() => onDelete(location._id)}
              className="ml-2 px-2 sm:px-3 py-1 text-xs sm:text-sm text-red-500 hover:bg-red-50 rounded transition"
              aria-label={`Delete ${location.name}`}
            >
              Delete
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

export default SavedLocations;
