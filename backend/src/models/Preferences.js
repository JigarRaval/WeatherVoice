import mongoose from 'mongoose';

const PreferencesSchema = new mongoose.Schema({
  units: {
    type: String,
    enum: ['celsius', 'fahrenheit'],
    default: 'celsius'
  },
  weatherProvider: {
    type: String,
    enum: ['open-meteo', 'openweathermap'],
    default: 'open-meteo'
  },
  speechEnabled: {
    type: Boolean,
    default: false
  },
  // NEW: forecast / hourly display preferences
  forecastDays: {
    type: Number,
    min: 7,
    max: 14,
    default: 7
  },
  hourlyHours: {
    type: Number,
    min: 12,
    max: 48,
    default: 24
  },
  timeFormat: {
    type: String,
    enum: ['12h', '24h'],
    default: '24h'
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

PreferencesSchema.pre('save', function (next) {
  this.updatedAt = new Date();
  next();
});

export const Preferences = mongoose.model('Preferences', PreferencesSchema);