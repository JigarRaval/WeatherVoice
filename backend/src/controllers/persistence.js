import { Location } from '../models/Location.js';
import { Preferences } from '../models/Preferences.js';
import { asyncHandler, AppError } from '../middleware/error.js';

// Saved Locations
export const getLocations = asyncHandler(async (req, res) => {
  try {
    const locations = await Location.find().sort({ createdAt: -1 });
    res.json({
      success: true,
      data: locations
    });
  } catch (error) {
    // If DB is not available, return empty array
    res.json({
      success: true,
      data: []
    });
  }
});

export const saveLocation = asyncHandler(async (req, res) => {
  const { name, country, lat, lon } = req.body;

  if (!name || lat === undefined || lon === undefined) {
    throw new AppError(400, 'Name, latitude, and longitude are required');
  }

  if (lat < -90 || lat > 90) {
    throw new AppError(400, 'Latitude must be between -90 and 90');
  }

  if (lon < -180 || lon > 180) {
    throw new AppError(400, 'Longitude must be between -180 and 180');
  }

  try {
    // Check if location already exists (by coordinates)
    const existing = await Location.findOne({ lat, lon });
    if (existing) {
      return res.json({
        success: true,
        data: existing,
        message: 'Location already saved'
      });
    }

    // Enforce limit of 10 saved locations
    const count = await Location.countDocuments();
    if (count >= 10) {
      // Remove oldest location
      await Location.findOneAndDelete({}, { sort: { createdAt: 1 } });
    }

    const location = await Location.create({
      name,
      country,
      lat,
      lon
    });

    res.json({
      success: true,
      data: location
    });
  } catch (error) {
    // If DB is not available, return error but don't crash
    res.json({
      success: false,
      error: 'Unable to save location. Database may be unavailable.'
    });
  }
});

export const deleteLocation = asyncHandler(async (req, res) => {
  const { id } = req.params;

  try {
    const location = await Location.findByIdAndDelete(id);
    
    if (!location) {
      throw new AppError(404, 'Location not found');
    }

    res.json({
      success: true,
      message: 'Location deleted'
    });
  } catch (error) {
    res.json({
      success: false,
      error: 'Unable to delete location'
    });
  }
});

// Preferences
export const getPreferences = asyncHandler(async (req, res) => {
  try {
    let preferences = await Preferences.findOne();
    
    if (!preferences) {
      // Create default preferences
      preferences = await Preferences.create({
        units: 'celsius',
        weatherProvider: 'open-meteo',
        speechEnabled: false
      });
    }

    res.json({
      success: true,
      data: preferences
    });
  } catch (error) {
    // If DB is not available, return default preferences
    res.json({
      success: true,
      data: {
        units: 'celsius',
        weatherProvider: 'open-meteo',
        speechEnabled: false
      }
    });
  }
});

export const updatePreferences = asyncHandler(async (req, res) => {
  const { units, weatherProvider, speechEnabled } = req.body;

  try {
    let preferences = await Preferences.findOne();
    
    if (!preferences) {
      preferences = await Preferences.create({
        units: units || 'celsius',
        weatherProvider: weatherProvider || 'open-meteo',
        speechEnabled: speechEnabled !== undefined ? speechEnabled : false
      });
    } else {
      if (units !== undefined) preferences.units = units;
      if (weatherProvider !== undefined) preferences.weatherProvider = weatherProvider;
      if (speechEnabled !== undefined) preferences.speechEnabled = speechEnabled;
      
      await preferences.save();
    }

    res.json({
      success: true,
      data: preferences
    });
  } catch (error) {
    res.json({
      success: false,
      error: 'Unable to update preferences'
    });
  }
});
