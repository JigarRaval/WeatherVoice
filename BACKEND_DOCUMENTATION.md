# WeatherVoice - Backend Documentation

## Overview
The backend is a Node.js/Express API server that provides weather data, AI insights, and persistence services. It uses MongoDB for data storage and integrates with multiple weather providers and AI services.

## Core Files

### 1. server.js
**Location:** `backend/src/server.js`
**Purpose:** Express server entry point and configuration
**Key Functions:**
- Initializes Express application
- Configures middleware (CORS, JSON parsing, URL encoding)
- Sets up MongoDB connection with graceful degradation
- Defines API route base path (`/api`)
- Configures error handling middleware
- Starts HTTP server on configured port (default: 3001)

**Configuration:**
- `BACKEND_PORT`: Server port (default: 3001)
- `BACKEND_HOST`: Server host (default: 0.0.0.0)
- `MONGODB_URI`: MongoDB connection string
- Graceful degradation: Continues without MongoDB if connection fails

**Middleware:**
- CORS: Cross-origin resource sharing
- express.json(): JSON body parsing
- express.urlencoded(): URL-encoded body parsing
- errorHandler: Global error handling

## Controllers Directory (`backend/src/controllers/`)

### 2. weather.js
**Purpose:** Weather data API endpoints
**Key Functions:**

**getCurrentWeather**
- Method: GET
- Route: `/api/weather/current`
- Parameters: `location` (string) or `lat`, `lon` (numbers)
- Returns: Current weather conditions for a location
- Features: Support for location name or coordinates, provider selection

**getForecast**
- Method: GET
- Route: `/api/weather/forecast`
- Parameters: `location` or `lat`, `lon`, `days` (1-14)
- Returns: Multi-day weather forecast
- Features: Configurable forecast duration, provider selection

**getHourlyForecast**
- Method: GET
- Route: `/api/weather/hourly`
- Parameters: `location` or `lat`, `lon`, `hours` (1-48)
- Returns: Hourly weather forecast
- Features: Configurable hourly range, provider selection

**getWeatherAlerts**
- Method: GET
- Route: `/api/weather/alerts`
- Parameters: `location` or `lat`, `lon`
- Returns: Severe weather alerts
- Features: Location resolution, provider-based alerts

**getEnvironment**
- Method: GET
- Route: `/api/weather/environment`
- Parameters: `location` or `lat`, `lon`
- Returns: Environmental context (UV, air quality, etc.)
- Features: Graceful fallback on unavailability

**getMapConfig**
- Method: GET
- Route: `/api/weather/map/config`
- Returns: Map layer configuration and availability
- Features: RainViewer integration, OpenWeatherMap tile support

**proxyMapTile**
- Method: GET
- Route: `/api/weather/map/tile/:layer/:z/:x/:y`
- Returns: Map tile images (proxied to hide API key)
- Features: OpenWeatherMap tile proxy, 1x1 transparent fallback

**Error Handling:**
- Location not found (404)
- API key not configured (500)
- Invalid API key (401)
- Rate limit exceeded (429)
- Generic provider errors

### 3. ai.js
**Purpose:** AI-powered weather insights endpoints
**Key Functions:**

**explainForecast**
- Method: POST
- Route: `/api/ai/explain`
- Body: Weather data to explain
- Returns: AI-generated explanation of forecast
- Features: Ollama integration, context-aware explanations

**answerQuestion**
- Method: POST
- Route: `/api/ai/question`
- Body: Question and weather context
- Returns: AI answer to weather-related question
- Features: Conversational AI, weather context awareness

**checkAvailability**
- Method: GET
- Route: `/api/ai/availability`
- Returns: AI service availability status
- Features: Ollama health check, model availability

**Error Handling:**
- AI service unavailable
- Model not found
- Timeout handling
- Graceful degradation

### 4. planner.js
**Purpose:** Weather-based planning endpoints
**Key Functions:**

**getBestTimes**
- Method: GET
- Route: `/api/planner/best-times`
- Parameters: `location` or `lat`, `lon`, `activities`
- Returns: Optimal times for outdoor activities
- Features: Activity-specific recommendations, environmental context

**getRainWatch**
- Method: GET
- Route: `/api/weather/rain-watch`
- Parameters: `location` or `lat`, `lon`
- Returns: Rain monitoring data (next 6 hours)
- Features: Precipitation probability, timing predictions

**getCommuteWeather**
- Method: POST
- Route: `/api/planner/commute`
- Body: `origin`, `destination`, `departureTime`, `mode`
- Returns: Weather conditions for commute route
- Features: Multi-mode support (driving, transit, walking, cycling), timing analysis

**saveCommute**
- Method: POST
- Route: `/api/planner/commutes`
- Body: Commute profile data
- Returns: Saved commute profile
- Features: MongoDB persistence

**getCommutes**
- Method: GET
- Route: `/api/planner/commutes`
- Returns: All saved commute profiles
- Features: Sorted by creation date

**deleteCommute**
- Method: DELETE
- Route: `/api/planner/commutes/:id`
- Returns: Success confirmation
- Features: MongoDB deletion

### 5. persistence.js
**Purpose:** Data persistence endpoints (locations, preferences)
**Key Functions:**

**getLocations**
- Method: GET
- Route: `/api/locations`
- Returns: All saved locations
- Features: MongoDB query, user-specific data

**saveLocation**
- Method: POST
- Route: `/api/locations`
- Body: Location data (name, country, lat, lon)
- Returns: Saved location
- Features: MongoDB create, validation

**deleteLocation**
- Method: DELETE
- Route: `/api/locations/:id`
- Returns: Success confirmation
- Features: MongoDB deletion

**getPreferences**
- Method: GET
- Route: `/api/preferences`
- Returns: User preferences
- Features: Default values, MongoDB fallback

**updatePreferences**
- Method: PUT
- Route: `/api/preferences`
- Body: Preference updates
- Returns: Updated preferences
- Features: Partial updates, merge with existing

## Services Directory (`backend/src/services/`)

### 6. weather-providers.js
**Purpose:** Weather provider implementations (Open-Meteo, OpenWeatherMap)
**Key Functions:**

**OpenMeteoProvider**
- Free weather API (no API key required)
- Methods: getCurrentWeather, getForecast, getHourlyForecast
- Features: Global coverage, no rate limits, 7-14 day forecasts

**OpenWeatherMapProvider**
- Requires API key
- Methods: getCurrentWeather, getForecast, getHourlyForecast
- Features: Additional data layers, map tiles, 5-day forecasts

**Provider Pattern:**
- Consistent interface across providers
- Automatic provider selection
- Fallback to default provider
- Capability reporting

**Helper Functions:**
- `getDefaultProvider()`: Returns configured default provider
- `createWeatherProvider(name)`: Factory for provider instances
- `resolveCoordinates()`: Converts location names to coordinates

### 7. alerts.js
**Purpose:** Severe weather alert fetching and processing
**Key Functions:**

**getAlerts**
- Parameters: `lat`, `lon`, `provider`
- Returns: Severe weather alerts for location
- Features: Multiple alert sources, severity classification

**Alert Sources:**
- NWS (National Weather Service - US only)
- Open-Meteo forecast-based alerts (global)
- OpenWeatherMap alerts (with API key)

**Alert Data Structure:**
- Severity: Extreme, Severe, Moderate, Minor
- Event type (storm, flood, etc.)
- Description and instructions
- Safety actions
- Timing (onset, expires)
- Source attribution

**Forecast-Based Alerts:**
- Generated from forecast data
- Wind speed thresholds
- Precipitation thresholds
- Temperature extremes

### 8. environment.js
**Purpose:** Environmental context data fetching
**Key Functions:**

**getEnvironmentalContext**
- Parameters: `lat`, `lon`
- Returns: UV index, air quality, pollen data
- Features: Open-Meteo environmental API integration
- Error handling: Returns null on failure

**Data Fields:**
- UV index
- Air quality index (AQI)
- Pollen count
- Other environmental metrics

### 9. planner.js
**Purpose:** Planning-related business logic
**Key Functions:**

**computeBestTimes**
- Parameters: Hourly forecast, activity criteria, environment
- Returns: Optimal time windows for activities
- Features: Activity-specific conditions, scoring algorithm

**computeRainWatch**
- Parameters: Hourly forecast (6 hours)
- Returns: Rain probability and timing
- Features: Precipitation analysis, notification triggers

**resolveDeparture**
- Parameters: Departure time string
- Returns: Date object
- Features: Time parsing, default handling

**closestHour**
- Parameters: Hourly array, target time
- Returns: Closest hourly forecast entry
- Features: Time matching, fallback handling

**buildCommuteSummary**
- Parameters: Origin weather, destination weather, mode
- Returns: Human-readable commute summary
- Features: Mode-specific advice, condition assessment

**buildCommuteFlags**
- Parameters: Origin weather, destination weather, mode
- Returns: Boolean flags for conditions
- Features: Hazard detection, warning flags

**Activity Criteria (ACTIVITIES):**
- Running: Temperature, precipitation, wind thresholds
- Cycling: Similar with bike-specific factors
- Walking: Milder thresholds
- Outdoor dining: Comfort conditions
- Gardening: Soil moisture considerations

**Travel Time Estimates (TRAVEL_MINUTES):**
- Driving: 25 minutes default
- Transit: 45 minutes default
- Walking: 15 minutes default
- Cycling: 20 minutes default

### 10. ollama.js
**Purpose:** Ollama AI service integration
**Key Functions:**

**checkAvailability**
- Returns: Boolean availability status
- Features: Health check, model verification

**generateExplanation**
- Parameters: Weather data, model
- Returns: AI-generated explanation
- Features: Contextual prompting, streaming support

**answerQuestion**
- Parameters: Question, weather context, model
- Returns: AI answer
- Features: Context injection, conversational responses

**Configuration:**
- `OLLAMA_URL`: Ollama server URL (default: http://localhost:11434)
- `OLLAMA_MODEL`: Model name (default: llama3.2)
- Timeout: 30 seconds

**Error Handling:**
- Service unavailable
- Model not found
- Timeout handling
- Response parsing errors

## Middleware Directory (`backend/src/middleware/`)

### 11. error.js
**Purpose:** Error handling middleware
**Key Functions:**

**asyncHandler**
- Wraps async route handlers
- Catches errors automatically
- Passes errors to error middleware
- Simplifies route handler code

**AppError**
- Custom error class
- Properties: statusCode, message
- Features: HTTP status code mapping

**errorHandler**
- Global error handling middleware
- Returns: JSON error responses
- Features: Production vs development error details
- CORS support for errors

**Error Response Format:**
```json
{
  "success": false,
  "error": "Error message",
  "stack": "Stack trace (dev only)"
}
```

### 12. validation.js
**Purpose:** Input validation middleware using Zod
**Key Functions:**

**validate**
- Validates request body against schema
- Returns: 400 error on validation failure
- Features: Zod schema validation, detailed error messages

**validateQuery**
- Validates request query parameters
- Returns: 400 error on validation failure
- Features: Zod schema validation, detailed error messages

**Schemas:**

**weatherQuerySchema**
- Fields: `location` (string), `lat` (string), `lon` (string), `provider` (enum)
- Validation: Either location OR lat+lon required
- Provider options: open-meteo, openweathermap

**forecastQuerySchema**
- Extends: weatherQuerySchema
- Additional: `days` (string, 1-14)

**hourlyQuerySchema**
- Extends: weatherQuerySchema
- Additional: `hours` (string, 1-48)

**commuteBodySchema**
- Fields: `origin`, `destination`, `departureTime`, `mode`, `provider`
- Validation: Origin and destination required
- Mode options: driving, transit, walking, cycling

**commuteSaveSchema**
- Fields: `name`, `origin`, `destination`, `mode`, `typicalDeparture`
- Validation: Name and coordinates required
- Origin/Destination: Object with lat, lon

**placeSchema**
- Validates: String name OR object with lat/lon
- Features: Flexible input formats

## Models Directory (`backend/src/models/`)

### 13. Location.js
**Purpose:** MongoDB schema for saved locations
**Schema Fields:**
- `name`: String (required)
- `country`: String
- `lat`: Number (required)
- `lon`: Number (required)
- `createdAt`: Date (auto)
- `updatedAt`: Date (auto)

**Indexes:**
- Name for search optimization
- Geospatial index for location queries

### 14. Preferences.js
**Purpose:** MongoDB schema for user preferences
**Schema Fields:**
- `units`: String (celsius/fahrenheit, default: celsius)
- `weatherProvider`: String (open-meteo/openweathermap, default: open-meteo)
- `speechEnabled`: Boolean (default: false)
- `forecastDays`: Number (default: 7)
- `createdAt`: Date (auto)
- `updatedAt`: Date (auto)

**Features:**
- Single document per user
- Default values on creation
- Automatic timestamp management

### 15. CommuteProfile.js
**Purpose:** MongoDB schema for saved commutes
**Schema Fields:**
- `name`: String (required)
- `origin`: Object (lat, lon, name) (required)
- `destination`: Object (lat, lon, name) (required)
- `mode`: String (driving/transit/walking/cycling)
- `typicalDeparture`: String (HH:MM format)
- `createdAt`: Date (auto)
- `updatedAt`: Date (auto)

**Features:**
- Multiple commutes per user
- Coordinate storage
- Time-based scheduling

## Routes Directory (`backend/src/routes/`)

### 16. index.js
**Purpose:** API route aggregation and configuration
**Route Groups:**

**Weather Routes**
- GET `/api/weather/current` - Current weather
- GET `/api/weather/forecast` - Multi-day forecast
- GET `/api/weather/hourly` - Hourly forecast
- GET `/api/weather/alerts` - Severe alerts
- GET `/api/weather/environment` - Environmental data
- GET `/api/weather/map/config` - Map configuration
- GET `/api/weather/map/tile/:layer/:z/:x/:y` - Map tiles

**AI Routes**
- POST `/api/ai/explain` - AI explanation
- POST `/api/ai/question` - AI Q&A
- GET `/api/ai/availability` - AI status

**Persistence Routes**
- GET `/api/locations` - Get saved locations
- POST `/api/locations` - Save location
- DELETE `/api/locations/:id` - Delete location
- GET `/api/preferences` - Get preferences
- PUT `/api/preferences` - Update preferences

**Planning Routes**
- GET `/api/planner/best-times` - Activity timing
- GET `/api/weather/rain-watch` - Rain monitoring
- POST `/api/planner/commute` - Commute weather
- GET `/api/planner/commutes` - Get saved commutes
- POST `/api/planner/commutes` - Save commute
- DELETE `/api/planner/commutes/:id` - Delete commute

**Middleware Application:**
- Validation on all input routes
- Error handling on all routes
- CORS on all routes

## Configuration Files

### 17. package.json
**Location:** `backend/package.json`
**Purpose:** Project dependencies and scripts
**Key Dependencies:**
- `express`: Web framework
- `cors`: CORS middleware
- `dotenv`: Environment variable loading
- `mongoose`: MongoDB ODM
- `axios`: HTTP client
- `zod`: Schema validation

**Scripts:**
- `dev`: Start with hot reload (node --watch)
- `start`: Start production server
- `test`: Run Jest tests
- `lint`: Run ESLint

### 18. .env
**Location:** Root directory
**Purpose:** Environment configuration
**Key Variables:**
- `WEATHER_PROVIDER`: Default weather provider (open-meteo)
- `OPENWEATHERMAP_API_KEY`: OpenWeatherMap API key
- `OLLAMA_URL`: Ollama server URL
- `OLLAMA_MODEL`: Default AI model
- `MONGODB_URI`: MongoDB connection string
- `BACKEND_PORT`: Server port (3001)
- `BACKEND_HOST`: Server host (0.0.0.0)
- `NODE_ENV`: Environment (development/production)
- `VITE_API_URL`: Frontend API URL
- `VITE_PORT`: Frontend port (5173)

## Data Flow

1. Client makes HTTP request to API endpoint
2. Express routes request to appropriate controller
3. Validation middleware validates input
4. Controller calls service layer for business logic
5. Service layer interacts with external APIs or database
6. Response is formatted and returned to client
7. Error middleware handles any errors

## Error Handling Strategy

- Validation errors: 400 with details
- Not found: 404
- Unauthorized: 401
- Rate limited: 429
- Server errors: 500
- Graceful degradation for non-critical services
- Detailed errors in development, generic in production

## Security Features

- CORS configuration
- Input validation with Zod
- API key protection (server-side only)
- Error message sanitization
- No sensitive data in responses

## Performance Optimizations

- MongoDB connection pooling
- HTTP client reuse (axios)
- Request timeouts
- Caching headers on map tiles
- Graceful degradation to prevent cascading failures

## Testing Considerations

- Mock external API calls
- Test validation schemas
- Test error scenarios
- Test database operations
- Test with and without MongoDB
- Test AI availability scenarios
