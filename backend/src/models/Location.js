import mongoose from 'mongoose';

const LocationSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  country: {
    type: String,
    trim: true,
    maxlength: 100
  },
  lat: {
    type: Number,
    required: true,
    min: -90,
    max: 90
  },
  lon: {
    type: Number,
    required: true,
    min: -180,
    max: 180
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Index for efficient queries
LocationSchema.index({ name: 1, country: 1 });

export const Location = mongoose.model('Location', LocationSchema);
