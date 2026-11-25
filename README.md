# WeatherVoice - Weather Application

A full-stack weather application with AI-powered insights, voice input/output, and persistent user preferences.

## 🌟 Features

- **Weather Data**: Current conditions and 7-day forecasts from multiple providers
- **Dual Weather Providers**: 
  - Open-Meteo (free, no API key required)
  - OpenWeatherMap (requires API key)
- **AI Insights**: Local AI via Ollama explains forecasts and answers weather questions
- **Voice Features**: Browser-based speech recognition and text-to-speech
- **Persistence**: Save favorite locations and preferences (units, provider, speech settings)
- **Responsive Design**: Works on desktop and mobile devices
- **Graceful Degradation**: All features work even when AI or voice are unavailable

## 📁 Project Structure

```
weathervoice/
├── backend/                      # Node.js + Express API
│   ├── src/
│   │   ├── controllers/         # API endpoint handlers
│   │   │   ├── weather.js       # Weather endpoints
│   │   │   ├── ai.js            # AI endpoints
│   │   │   └── persistence.js   # Locations & preferences
│   │   ├── services/            # Business logic
│   │   │   ├── weather-providers.js  # Weather provider implementations
│   │   │   └── ollama.js        # Ollama AI integration
│   │   ├── models/              # MongoDB schemas
│   │   │   ├── Location.js      # Saved locations
│   │   │   └── Preferences.js   # User preferences
│   │   ├── middleware/          # Express middleware
│   │   │   ├── error.js         # Error handling
│   │   │   └── validation.js    # Input validation
│   │   ├── routes/              # API routes
│   │   │   └── index.js         # Route aggregation
│   │   └── server.js            # Express server entry
│   ├── Dockerfile               # Backend container
│   └── package.json             # Dependencies
│
├── frontend/                     # React + Vite + Tailwind
│   ├── src/
│   │   ├── components/          # React components
│   │   │   ├── WeatherSearch.jsx
│   │   │   ├── WeatherDisplay.jsx
│   │   │   ├── AIInsights.jsx
│   │   │   ├── SavedLocations.jsx
│   │   │   └── Settings.jsx
│   │   ├── services/            # API client
│   │   │   └── api.js
│   │   ├── App.jsx              # Main app component
│   │   ├── main.jsx             # React entry
│   │   └── index.css            # Tailwind styles
│   ├── public/                   # Static assets
│   ├── Dockerfile               # Frontend container
│   ├── nginx.conf               # Nginx configuration
│   └── package.json             # Dependencies
│
├── evaluation/                   # Model evaluation tools
│   └── (evaluation scripts)
│
├── docker-compose.yml            # Container orchestration
├── .env.example                  # Environment variables template
├── .gitignore                    # Git ignore rules
├── package.json                  # Root workspace
└── README.md                     # This file
```

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm
- MongoDB (or use Docker)
- Docker and Docker Compose (optional, for containerized setup)
- Ollama (optional, for AI features)

### Option 1: Local Development (Recommended)

1. **Clone and setup**
```bash
cd "D:\PROJECTS\Industrial Application 4.0"
```

2. **Install dependencies**
```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

3. **Setup environment variables**
```bash
# Copy the example environment file
cp .env.example .env

# Edit .env and configure as needed
# Default configuration works for Open-Meteo (no API key needed)
```

4. **Start MongoDB**
```bash
# Using Docker (recommended)
docker run -d -p 27017:27017 --name mongodb mongo:7.0

# Or install MongoDB locally and start it
```

5. **Start the backend**
```bash
cd backend
npm run dev
```
Backend will run on http://localhost:3001

6. **Start the frontend**
```bash
cd frontend
npm run dev
```
Frontend will run on http://localhost:5173

7. **(Optional) Start Ollama for AI features**
```bash
# Install Ollama from https://ollama.ai
# Pull the default model
ollama pull llama3.2

# Ollama runs on http://localhost:11434 by default
```

### Option 2: Docker Compose

1. **Build and start all services**
```bash
# Start MongoDB, Backend, and Frontend
docker-compose up -d

# Start with Ollama (AI features)
docker-compose --profile ollama up -d
```

2. **Pull Ollama model (if using Ollama profile)**
```bash
docker exec -it weathervoice-ollama ollama pull llama3.2
```

3. **Access the application**
- Frontend: http://localhost:5173
- Backend API: http://localhost:3001
- MongoDB: localhost:27017
- Ollama: http://localhost:11434

## ⚙️ Configuration

### Environment Variables

Create a `.env` file in the root directory:

```env
# Weather Provider Configuration
WEATHER_PROVIDER=open-meteo
OPENWEATHERMAP_API_KEY=your_openweathermap_api_key_here

# Ollama AI Configuration
OLLAMA_URL=http://localhost:11434
OLLAMA_MODEL=llama3.2

# MongoDB Configuration
MONGODB_URI=mongodb://localhost:27017/weathervoice

# Backend Configuration
BACKEND_PORT=3001
BACKEND_HOST=0.0.0.0
NODE_ENV=development

# Frontend Configuration
VITE_API_URL=http://localhost:3001
VITE_PORT=5173
```

### Weather Provider Selection

**Open-Meteo (Default)**
- No API key required
- Free to use
- Good accuracy
- Configure: `WEATHER_PROVIDER=open-meteo`

**OpenWeatherMap**
- Requires free API key from https://openweathermap.org/api
- Additional features
- Configure: `WEATHER_PROVIDER=openweathermap` and add `OPENWEATHERMAP_API_KEY`

## 🤖 AI Features (Ollama)

### Setup Ollama

1. Download and install Ollama from https://ollama.ai
2. Pull a model (e.g., llama3.2):
```bash
ollama pull llama3.2
```
3. Ollama will run on http://localhost:11434 by default

### Using Different Models

Change the model in `.env`:
```env
OLLAMA_MODEL=mistral
```

Common models:
- `llama3.2` - Balanced speed and quality (recommended)
- `mistral` - Faster, lighter
- `codellama` - Code-focused

If Ollama is unavailable, the app will show a clear message and weather features continue to work normally.

## 🎤 Voice Features

Voice features use browser-native Web Speech API:

- **Speech Recognition**: Available in Chrome, Edge, Safari
- **Text-to-Speech**: Available in most modern browsers

If voice is not supported, text input is always available as a fallback.

## 📦 API Endpoints

### Weather
- `GET /api/weather/current?location={city}` - Get current weather
- `GET /api/weather/current?lat={lat}&lon={lon}` - Get weather by coordinates
- `GET /api/weather/forecast?location={city}&days={7}` - Get forecast

### AI
- `POST /api/ai/explain` - Get AI explanation of forecast
- `POST /api/ai/question` - Ask weather-related question
- `GET /api/ai/availability` - Check if AI service is available

### Persistence
- `GET /api/locations` - Get saved locations
- `POST /api/locations` - Save a location
- `DELETE /api/locations/:id` - Delete a location
- `GET /api/preferences` - Get user preferences
- `PUT /api/preferences` - Update preferences

## 🧪 Testing

### Manual Testing Checklist

- [ ] Search for a city by name
- [ ] Use geolocation to get current location
- [ ] View current weather conditions
- [ ] View 7-day forecast
- [ ] Toggle between Celsius and Fahrenheit
- [ ] Save a location
- [ ] Load a saved location
- [ ] Delete a saved location
- [ ] Change weather provider (if API key configured)
- [ ] Enable/disable text-to-speech
- [ ] Use "Explain This Forecast" AI feature
- [ ] Ask a weather question via AI
- [ ] Test voice input (if supported)
- [ ] Test with AI unavailable (stop Ollama)
- [ ] Test with MongoDB unavailable (stop MongoDB)
- [ ] Test on mobile viewport
- [ ] Test keyboard navigation

### Known Limitations

- Voice features require browser support (Chrome, Edge, Safari recommended)
- AI features require Ollama running locally
- OpenWeatherMap requires a free API key
- MongoDB required for persistence (app works without it, but no saved data)

## 🔧 Troubleshooting

### Backend won't start
- Check if MongoDB is running: `docker ps` or check MongoDB logs
- Verify port 3001 is not in use
- Check `.env` file configuration

### Frontend can't connect to backend
- Verify backend is running on http://localhost:3001
- Check `VITE_API_URL` in `.env`
- Check browser console for CORS errors

### AI features not working
- Verify Ollama is running: check http://localhost:11434
- Check if model is pulled: `ollama list`
- Verify `OLLAMA_URL` and `OLLAMA_MODEL` in `.env`
- Check backend logs for connection errors

### MongoDB connection issues
- Verify MongoDB is running: `docker ps` or check MongoDB service
- Check `MONGODB_URI` in `.env`
- If using Docker, check container logs: `docker logs weathervoice-mongodb`

### Voice features not available
- Voice requires modern browser (Chrome, Edge, Safari)
- Check browser permissions for microphone
- Text input is always available as fallback

## 📝 Development

### Backend Development
```bash
cd backend
npm run dev    # Start with hot reload
npm run build  # Build for production
npm start      # Start production server
```

### Frontend Development
```bash
cd frontend
npm run dev    # Start with hot reload
npm run build  # Build for production
npm run preview # Preview production build
```

### Docker Development
```bash
docker-compose up              # Start all services
docker-compose down           # Stop all services
docker-compose logs backend   # View backend logs
docker-compose logs frontend  # View frontend logs
```

## 🏗️ Architecture

### Backend Architecture
- **Express.js** - Web framework
- **MongoDB + Mongoose** - Data persistence
- **Axios** - HTTP client for weather APIs
- **Zod** - Input validation
- **Provider Pattern** - Pluggable weather providers

### Frontend Architecture
- **React 18** - UI framework
- **Vite** - Build tool and dev server
- **Tailwind CSS** - Styling
- **Axios** - API client
- **Web Speech API** - Voice features

### Data Flow
1. User searches for location via React UI
2. Frontend calls backend API endpoint
3. Backend fetches data from weather provider (Open-Meteo or OpenWeatherMap)
4. Backend returns JSON response to frontend
5. Frontend displays weather data
6. For AI features, backend sends weather data to Ollama
7. Ollama returns explanation/answer
8. Backend forwards to frontend for display

## 📄 License

This project is provided as-is for educational purposes.

## 🤝 Contributing

This is a demonstration project. Feel free to fork and modify for your needs.
