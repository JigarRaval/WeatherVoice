import { Router } from 'express';
import * as weatherController from '../controllers/weather.js';
import * as aiController from '../controllers/ai.js';
import * as plannerController from '../controllers/planner.js';
import { validate, commuteBodySchema, commuteSaveSchema } from '../middleware/validation.js';
import * as persistenceController from '../controllers/persistence.js';
import {
  validateQuery,
  weatherQuerySchema,
  forecastQuerySchema,
  hourlyQuerySchema
} from '../middleware/validation.js';

const router = Router();

// Weather routes
router.get('/weather/current',
  validateQuery(weatherQuerySchema),
  weatherController.getCurrentWeather);
router.get('/weather/forecast',
  validateQuery(forecastQuerySchema),
  weatherController.getForecast);
router.get('/weather/hourly',
  validateQuery(hourlyQuerySchema),
  weatherController.getHourlyForecast);
router.get('/weather/alerts',
  validateQuery(weatherQuerySchema),   // reuse existing schema
  weatherController.getWeatherAlerts);
router.get('/weather/environment',
  validateQuery(weatherQuerySchema),
  weatherController.getEnvironment);

// Map routes
router.get('/weather/map/config', weatherController.getMapConfig);
router.get('/weather/map/tile/:layer/:z/:x/:y', weatherController.proxyMapTile);

// AI routes
router.post('/ai/explain', aiController.explainForecast);
router.post('/ai/question', aiController.answerQuestion);
router.get('/ai/availability', aiController.checkAvailability);

// Persistence routes
router.get('/locations', persistenceController.getLocations);
router.post('/locations', persistenceController.saveLocation);
router.delete('/locations/:id', persistenceController.deleteLocation);
router.get('/preferences', persistenceController.getPreferences);
router.put('/preferences', persistenceController.updatePreferences);

//Planning routes
router.get('/planner/best-times',
  validateQuery(weatherQuerySchema),
  plannerController.getBestTimes);

router.get('/weather/rain-watch',
  validateQuery(weatherQuerySchema),
  plannerController.getRainWatch);

router.post('/planner/commute',
  validate(commuteBodySchema),
  plannerController.getCommuteWeather);

router.get('/planner/commutes', plannerController.getCommutes);
router.post('/planner/commutes',
  validate(commuteSaveSchema),
  plannerController.saveCommute);
router.delete('/planner/commutes/:id', plannerController.deleteCommute);

export default router;