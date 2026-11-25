# WeatherVoice - Frontend Documentation

## Overview
The frontend is a React application built with Vite, using Tailwind CSS for styling. It provides a user interface for viewing weather data, AI insights, and managing saved locations.

## Core Files

### 1. App.jsx
**Location:** `frontend/src/App.jsx`
**Purpose:** Main application component that orchestrates all features
**Key Functions:**
- Manages global state for weather data, forecasts, alerts, user preferences
- Handles search functionality and location selection
- Coordinates data fetching from backend API
- Manages saved locations CRUD operations
- Renders all weather-related components in a responsive layout

**State Management:**
- `weatherData`: Current weather information
- `forecastData`: Multi-day forecast
- `hourlyData`: Hourly weather forecast
- `alertsData`: Severe weather alerts
- `envData`: Environmental context data
- `savedLocations`: User's saved locations
- `preferences`: User settings (units, provider, speech)
- `loading`, `error`: UI state indicators

### 2. main.jsx
**Location:** `frontend/src/main.jsx`
**Purpose:** React application entry point
**Key Functions:**
- Renders the root App component
- Mounts React to the DOM element with id="root"

### 3. index.css
**Location:** `frontend/src/index.css`
**Purpose:** Global styles and Tailwind CSS imports
**Key Functions:**
- Imports Tailwind CSS directives
- Contains custom global styles
- Sets up base styling for the application

## Components Directory (`frontend/src/components/`)

### 4. WeatherSearch.jsx
**Purpose:** Search interface for weather locations
**Key Functions:**
- Provides text input for city names or coordinates
- Implements geolocation feature for current location
- Handles form submission and validation
- Loading state management during search

**Features:**
- City name search
- Lat/lon coordinate input
- GPS-based location detection
- Responsive button layout

### 5. WeatherDisplay.jsx
**Purpose:** Displays current weather and forecast data
**Key Functions:**
- Renders current weather conditions (temperature, humidity, wind, etc.)
- Displays multi-day forecast with temperature ranges
- Shows hourly weather forecast in horizontal scroll
- Visualizes sunrise/sunset with animated sun arc
- Converts temperatures between Celsius and Fahrenheit
- Maps weather codes to emoji icons

**Sub-components:**
- `SunPanel`: Animated sunrise/sunset visualization
- `HourlyStrip`: Horizontal scrollable hourly forecast
- `DailyForecastList`: Multi-day forecast with temperature bars

### 6. WeatherContext.jsx
**Purpose:** Displays environmental context and feels-like information
**Key Functions:**
- Shows environmental context data (UV index, air quality, etc.)
- Displays "feels like" temperature
- Shows visibility information
- Falls back gracefully if data unavailable

### 7. AIInsights.jsx
**Purpose:** AI-powered weather explanations and Q&A
**Key Functions:**
- Provides AI explanations of weather forecasts
- Enables voice/text questions about weather
- Integrates with Ollama for local AI processing
- Text-to-speech for AI responses
- Graceful degradation when AI unavailable

**Features:**
- "Explain This Forecast" button
- Interactive Q&A interface
- Speech recognition for voice input
- Speech synthesis for audio output

### 8. SavedLocations.jsx
**Purpose:** Manages user's saved locations
**Key Functions:**
- Displays list of saved locations
- Allows quick selection of saved locations
- Provides delete functionality
- Empty state handling

**Features:**
- Persistent storage via backend
- Quick weather reload for saved locations
- Clean UI with hover effects

### 9. Settings.jsx
**Purpose:** User preferences configuration
**Key Functions:**
- Temperature unit toggle (Celsius/Fahrenheit)
- Weather provider selection (Open-Meteo/OpenWeatherMap)
- Speech features enable/disable
- Forecast days configuration
- Persists preferences to backend

**Features:**
- Form-based settings interface
- Real-time preference updates
- Validation of settings

### 10. SevereAlerts.jsx
**Purpose:** Displays severe weather alerts
**Key Functions:**
- Renders weather alert cards with severity indicators
- Color-coded severity levels (Extreme, Severe, Moderate, Minor)
- Expandable official alert details
- Safety actions display
- Animation for extreme alerts

**Severity Levels:**
- Extreme: Red with pulse animation
- Severe: Orange
- Moderate: Yellow
- Minor: Blue
- Unknown: Gray

### 11. PlanningTools.jsx
**Purpose:** Weather-based planning tools
**Key Functions:**
- Provides access to planning-related features
- Likely integrates BestTimes, RainAlerts, CommutePlanner
- Organizes planning tools in one section

### 12. BestTimes.jsx
**Purpose:** Optimal timing recommendations for activities
**Key Functions:**
- Suggests best times for outdoor activities
- Weather-based activity recommendations
- Time-based optimization

### 13. RainAlerts.jsx
**Purpose:** Rain notification system
**Key Functions:**
- Monitors forecast for rain events
- Browser notification integration
- Configurable polling interval
- Cooldown between notifications
- LocalStorage for settings persistence

**Features:**
- Permission request handling
- 10-minute polling interval
- 60-minute notification cooldown
- Graceful degradation without notifications

### 14. CommutePlanner.jsx
**Purpose:** Weather-aware commute planning
**Key Functions:**
- Route-based weather forecasting
- Departure time optimization
- Multiple transport modes (driving, transit, walking, cycling)
- Commute profile management

### 15. InteractiveMap.jsx
**Purpose:** Interactive weather map
**Key Functions:**
- Displays weather on interactive map
- Uses Leaflet for map rendering
- Shows precipitation, clouds, temperature layers
- Tile-based map display
- Responsive map container

**Features:**
- Multiple weather layers
- Zoom and pan controls
- Location markers

## Services Directory (`frontend/src/services/`)

### 16. api.js
**Purpose:** API client for backend communication
**Key Functions:**
- Centralized API request handling
- Query string parameter construction
- Error handling and response validation
- Base URL configuration via environment variables

**API Functions:**
- `getCurrentWeather()`: Fetch current weather
- `getForecast()`: Fetch multi-day forecast
- `getHourlyForecast()`: Fetch hourly forecast
- `getWeatherAlerts()`: Fetch severe weather alerts
- `getEnvironmentalContext()`: Fetch environmental data
- `getMapConfig()`: Fetch map configuration
- `getLocations()`: Fetch saved locations
- `saveLocation()`: Save a location
- `deleteLocation()`: Delete a location
- `getPreferences()`: Fetch user preferences
- `updatePreferences()`: Update user preferences
- `getBestTimes()`: Fetch activity timing recommendations
- `getRainWatch()`: Fetch rain monitoring data
- `getCommuteWeather()`: Fetch commute weather
- `getCommutes()`: Fetch saved commutes
- `saveCommute()`: Save a commute
- `deleteCommute()`: Delete a commute

**Configuration:**
- `API_URL`: Backend API URL (from VITE_API_URL env var)
- Default: http://localhost:3001

## Configuration Files

### 17. package.json
**Location:** `frontend/package.json`
**Purpose:** Project dependencies and scripts
**Key Dependencies:**
- `react`: UI framework
- `react-dom`: React DOM renderer
- `vite`: Build tool and dev server
- `axios`: HTTP client
- `leaflet`: Map library
- `tailwindcss`: CSS framework
- `@vitejs/plugin-react`: React plugin for Vite

**Scripts:**
- `dev`: Start development server
- `build`: Build for production
- `preview`: Preview production build
- `lint`: Run ESLint

### 18. vite.config.ts
**Location:** `frontend/vite.config.ts`
**Purpose:** Vite build configuration
**Configuration:**
- React plugin integration
- Server port: 5173
- Host: true (network access enabled)

### 19. index.html
**Location:** `frontend/index.html`
**Purpose:** HTML entry point
**Meta Tags:**
- Viewport configuration for responsive design
- Theme color
- Application title

## Responsive Design Features

The frontend uses Tailwind CSS breakpoints:
- `sm`: 640px (small tablets)
- `md`: 768px (tablets)
- `lg`: 1024px (laptops)
- `xl`: 1280px (desktops)

All components are built with mobile-first responsive design principles.

## State Management

The application uses React's built-in state management:
- Local component state with `useState`
- Side effects with `useEffect`
- No external state management library (Redux, Context API)

## Data Flow

1. User interacts with UI (search, button click)
2. Component calls API function from `api.js`
3. API makes HTTP request to backend
4. Response updates component state
5. Component re-renders with new data
6. UI displays updated information

## Error Handling

- Try-catch blocks in async functions
- Error state display in UI
- Graceful degradation for missing features
- Console error logging for debugging

## Accessibility

- ARIA labels on interactive elements
- Semantic HTML structure
- Keyboard navigation support
- Screen reader friendly text
- High contrast color ratios
