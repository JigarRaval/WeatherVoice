import { z } from 'zod';

export const validate = (schema) => (req, res, next) => {
  try {
    schema.parse(req.body);
    next();
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation error', details: error.errors });
    }
    next(error);
  }
};

export const validateQuery = (schema) => (req, res, next) => {
  try {
    schema.parse(req.query);
    next();
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation error', details: error.errors });
    }
    next(error);
  }
};

// ─── Weather query schemas ───────────────────────────────────
const coordString = z.string().regex(/^-?\d+(\.\d+)?$/, 'Must be a numeric string');

const baseWeatherQuery = z.object({
  location: z.string().min(1).max(200).optional(),
  lat: coordString.optional(),
  lon: coordString.optional(),
  provider: z.enum(['open-meteo', 'openweathermap']).optional()
}).refine(
  (d) => Boolean(d.location) || (d.lat !== undefined && d.lon !== undefined),
  { message: 'Either location or lat+lon required', path: ['location'] }
);

export const weatherQuerySchema = baseWeatherQuery;

export const forecastQuerySchema = z.object({
  location: z.string().min(1).max(200).optional(),
  lat: coordString.optional(),
  lon: coordString.optional(),
  provider: z.enum(['open-meteo', 'openweathermap']).optional(),
  days: z.string().regex(/^\d+$/).optional()
}).refine(
  (d) => Boolean(d.location) || (d.lat !== undefined && d.lon !== undefined),
  { message: 'Either location or lat+lon required', path: ['location'] }
);

export const hourlyQuerySchema = z.object({
  location: z.string().min(1).max(200).optional(),
  lat: coordString.optional(),
  lon: coordString.optional(),
  provider: z.enum(['open-meteo', 'openweathermap']).optional(),
  hours: z.string().regex(/^\d+$/).optional()
}).refine(
  (d) => Boolean(d.location) || (d.lat !== undefined && d.lon !== undefined),
  { message: 'Either location or lat+lon required', path: ['location'] }
);

// Append to existing file
const placeSchema = z.any().refine((v) => {
  if (typeof v === 'string') return v.trim().length > 0;
  if (v && typeof v === 'object')
    return Boolean(v.name) || (typeof v.lat === 'number' && typeof v.lon === 'number');
  return false;
}, 'place must be a name string, { name } or { lat, lon }');

export const commuteBodySchema = z.object({
  origin: placeSchema,
  destination: placeSchema,
  departureTime: z.string().regex(/^\d{2}:\d{2}$/).nullable().optional(),
  mode: z.enum(['driving', 'transit', 'walking', 'cycling']).optional(),
  provider: z.enum(['open-meteo', 'openweathermap']).optional()
});

export const commuteSaveSchema = z.object({
  name: z.string().min(1).max(80),
  origin: z.object({ name: z.string().optional(), lat: z.number(), lon: z.number() }),
  destination: z.object({ name: z.string().optional(), lat: z.number(), lon: z.number() }),
  mode: z.enum(['driving', 'transit', 'walking', 'cycling']).optional(),
  typicalDeparture: z.string().regex(/^\d{2}:\d{2}$/).nullable().optional()
});