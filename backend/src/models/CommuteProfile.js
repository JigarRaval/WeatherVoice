import mongoose from 'mongoose';

const PlaceSchema = new mongoose.Schema({
  name: String,
  lat: Number,
  lon: Number
}, { _id: false });

const CommuteProfileSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  origin: { type: PlaceSchema, required: true },
  destination: { type: PlaceSchema, required: true },
  mode: {
    type: String,
    enum: ['driving', 'transit', 'walking', 'cycling'],
    default: 'driving'
  },
  typicalDeparture: { type: String, match: /^\d{2}:\d{2}$/ },
  createdAt: { type: Date, default: Date.now }
});

export const CommuteProfile = mongoose.model('CommuteProfile', CommuteProfileSchema);