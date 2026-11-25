# WeatherVoice - Project Structure Documentation

## Overview
WeatherVoice is a full-stack weather application with AI insights and voice features. The project is organized as a monorepo with separate frontend and backend workspaces.

## Root Directory Structure

```
Industrial Application 4.0/
├── backend/              # Backend API server
├── frontend/             # Frontend React application
├── evaluation/           # Model evaluation tools
├── node_modules/         # Root dependencies
├── .env                  # Environment variables (not committed)
├── .env.example          # Environment variables template
├── .gitignore            # Git ignore rules
├── docker-compose.yml    # Docker orchestration
├── package.json          # Root workspace configuration
├── package-lock.json     # Root dependency lock file
└── README.md             # Project documentation
```

## Root Files

### package.json
**Purpose:** Root workspace configuration using npm workspaces
**Functionality:**
- Defines workspace packages (frontend, backend)
- Shared scripts for running both frontend and backend
- Shared dev dependencies (concurrently for parallel execution)
- Manages root-level dependencies

**Scripts:**
- `npm run dev`: Start both frontend and backend in parallel
- `npm run dev:frontend`: Start frontend only
- `npm run dev:backend`: Start backend only
- `npm run build`: Build both frontend and backend
- `npm run test`: Run all tests
- `npm run lint`: Lint all code

### .env.example
**Purpose:** Template for environment variables
**Functionality:**
- Documents all required environment variables
- Provides default values
- Serves as reference for configuration
- Should be copied to `.env` for actual use

### .gitignore
**Purpose:** Git ignore patterns
**Functionality:**
- Excludes sensitive files (.env)
- Excludes dependencies (node_modules)
- Excludes build outputs (dist, build)
- Excludes IDE configurations
- Excludes OS-specific files

### docker-compose.yml
**Purpose:** Docker container orchestration
**Functionality:**
- Defines multi-container application setup
- Services: MongoDB, Backend, Frontend, Ollama (optional)
- Configures service dependencies
- Manages network and volumes
- Enables one-command deployment

**Services:**
- `mongodb`: MongoDB database
- `backend`: Node.js API server
- `frontend`: React application with nginx
- `ollama`: AI service (optional profile)

### README.md
**Purpose:** Project documentation
**Functionality:**
- Project overview and features
- Installation instructions
- Configuration guide
- API documentation
- Development guide
- Troubleshooting tips

## Backend Directory Structure

```
backend/
├── src/                  # Source code
│   ├── controllers/      # API endpoint handlers
│   ├── middleware/       # Express middleware
│   ├── models/           # MongoDB schemas
│   ├── routes/           # API route definitions
│   ├── services/         # Business logic
│   └── server.js         # Server entry point
├── Dockerfile            # Container build file
└── package.json          # Backend dependencies
```

### backend/src/
**Purpose:** Main source code directory
**Functionality:** Contains all backend application code

### backend/src/controllers/
**Purpose:** API endpoint handlers
**Functionality:**
- Handles HTTP requests and responses
- Calls service layer for business logic
- Implements validation and error handling
- Organized by feature (weather, ai, planner, persistence)

**Files:**
- `weather.js`: Weather data endpoints
- `ai.js`: AI insights endpoints
- `planner.js`: Planning tools endpoints
- `persistence.js`: Data persistence endpoints

### backend/src/middleware/
**Purpose:** Express middleware functions
**Functionality:**
- Request/response processing
- Input validation
- Error handling
- Authentication (future)

**Files:**
- `error.js`: Error handling middleware
- `validation.js`: Input validation with Zod

### backend/src/models/
**Purpose:** MongoDB data models/schemas
**Functionality:**
- Defines data structure
- Implements validation rules
- Provides database interaction methods
- Manages relationships

**Files:**
- `Location.js`: Saved locations schema
- `Preferences.js`: User preferences schema
- `CommuteProfile.js`: Commute profiles schema

### backend/src/routes/
**Purpose:** API route definitions
**Functionality:**
- Maps HTTP methods to controllers
- Applies middleware to routes
- Organizes routes by feature
- Groups related endpoints

**Files:**
- `index.js`: Main route aggregator

### backend/src/services/
**Purpose:** Business logic layer
**Functionality:**
- Implements core business rules
- Integrates with external APIs
- Provides data transformation
- Encapsulates complex operations

**Files:**
- `weather-providers.js`: Weather API integrations
- `alerts.js`: Severe weather alerts
- `environment.js`: Environmental data
- `planner.js`: Planning algorithms
- `ollama.js`: AI service integration

### backend/src/server.js
**Purpose:** Application entry point
**Functionality:**
- Initializes Express application
- Configures middleware
- Connects to MongoDB
- Starts HTTP server
- Defines health check endpoint

### backend/Dockerfile
**Purpose:** Container build configuration
**Functionality:**
- Defines base image (Node.js)
- Copies application files
- Installs dependencies
- Exposes server port
- Defines startup command

### backend/package.json
**Purpose:** Backend dependencies and scripts
**Functionality:**
- Lists npm dependencies
- Defines development scripts
- Configures package metadata
- Sets module type (ESM)

## Frontend Directory Structure

```
frontend/
├── public/               # Static assets
├── src/                  # Source code
│   ├── components/       # React components
│   ├── services/         # API client
│   ├── App.jsx           # Main application
│   ├── main.jsx          # Entry point
│   └── index.css         # Global styles
├── Dockerfile            # Container build file
├── nginx.conf            # Nginx configuration
├── package.json          # Frontend dependencies
└── vite.config.ts        # Vite configuration
```

### frontend/public/
**Purpose:** Static assets directory
**Functionality:**
- Serves static files directly
- Contains images, favicons, etc.
- Accessed at root URL

**Typical Contents:**
- Favicon files
- Logo images
- Static HTML files

### frontend/src/
**Purpose:** Main source code directory
**Functionality:** Contains all frontend application code

### frontend/src/components/
**Purpose:** React components
**Functionality:**
- Reusable UI components
- Feature-specific components
- Organized by functionality

**Files:**
- `WeatherSearch.jsx`: Search interface
- `WeatherDisplay.jsx`: Weather data display
- `WeatherContext.jsx`: Environmental context
- `AIInsights.jsx`: AI features
- `SavedLocations.jsx`: Location management
- `Settings.jsx`: User preferences
- `SevereAlerts.jsx`: Alert display
- `PlanningTools.jsx`: Planning features
- `BestTimes.jsx`: Activity timing
- `RainAlerts.jsx`: Rain notifications
- `CommutePlanner.jsx`: Commute planning
- `InteractiveMap.jsx`: Map display

### frontend/src/services/
**Purpose:** API client services
**Functionality:**
- Centralized API communication
- Request/response handling
- Error handling
- Configuration management

**Files:**
- `api.js`: Backend API client

### frontend/src/App.jsx
**Purpose:** Main application component
**Functionality:**
- Root React component
- Global state management
- Layout organization
- Component orchestration

### frontend/src/main.jsx
**Purpose:** React entry point
**Functionality:**
- Mounts React to DOM
- Renders App component
- Configures React (if needed)

### frontend/src/index.css
**Purpose:** Global styles
**Functionality:**
- Imports Tailwind CSS
- Custom global styles
- CSS variables
- Reset styles

### frontend/Dockerfile
**Purpose:** Container build configuration
**Functionality:**
- Multi-stage build (build + nginx)
- Optimizes production build
- Serves static files with nginx
- Configures nginx for SPA routing

### frontend/nginx.conf
**Purpose:** Nginx web server configuration
**Functionality:**
- Serves static files
- Handles SPA routing
- Configures caching
- Sets security headers

### frontend/package.json
**Purpose:** Frontend dependencies and scripts
**Functionality:**
- Lists npm dependencies
- Defines build scripts
- Configures Vite
- Sets module type (ESM)

### frontend/vite.config.ts
**Purpose:** Vite build tool configuration
**Functionality:**
- Configures React plugin
- Sets dev server options
- Defines build options
- Configures aliases

## Evaluation Directory

```
evaluation/
└── (evaluation scripts)
```

**Purpose:** Model evaluation and testing tools
**Functionality:**
- Evaluates AI model performance
- Tests weather prediction accuracy
- Benchmarks API responses
- Performance analysis

## Node Modules Directory

```
node_modules/
└── (npm packages)
```

**Purpose:** Installed npm packages
**Functionality:**
- Contains all project dependencies
- Managed by npm
- Should not be manually edited
- Excluded from git

**Note:** Separate node_modules in root, backend, and frontend due to workspaces

## File Organization Principles

### Separation of Concerns
- Frontend and backend are separate workspaces
- Each has its own dependencies
- Clear API contract between them
- Independent deployment capability

### Feature-Based Organization
- Controllers grouped by feature
- Components grouped by functionality
- Services organized by domain
- Routes grouped by API section

### Layered Architecture (Backend)
- Routes: HTTP interface
- Controllers: Request handling
- Services: Business logic
- Models: Data access
- Middleware: Cross-cutting concerns

### Component Hierarchy (Frontend)
- App: Root layout
- Components: Reusable UI
- Services: Data layer
- No state management library (simplified)

## Configuration Management

### Environment Variables
- Stored in `.env` file
- Template in `.env.example`
- Loaded via dotenv
- Different configs for dev/prod

### Build Configuration
- Frontend: Vite (fast, modern)
- Backend: Node.js native (no bundler)
- Docker: Multi-stage builds
- Production: Optimized builds

## Development Workflow

### Local Development
1. Install dependencies: `npm install`
2. Configure environment: Copy `.env.example` to `.env`
3. Start MongoDB: Docker or local installation
4. Start backend: `npm run dev:backend`
5. Start frontend: `npm run dev:frontend`
6. Or both: `npm run dev`

### Docker Development
1. Build containers: `docker-compose build`
2. Start services: `docker-compose up`
3. Access application: http://localhost:5173
4. Stop services: `docker-compose down`

## Deployment Considerations

### Frontend Deployment
- Static files can be served anywhere
- nginx configuration for SPA routing
- Environment variables at build time
- CDN-friendly assets

### Backend Deployment
- Requires Node.js runtime
- MongoDB connection required
- Environment variables at runtime
- Can run in containers or VMs

### Docker Deployment
- Single command deployment
- All services orchestrated
- Production-ready configuration
- Easy scaling

## File Naming Conventions

### JavaScript/JSX Files
- Components: PascalCase (WeatherDisplay.jsx)
- Services: camelCase (api.js)
- Utilities: camelCase (helpers.js)
- Constants: UPPER_SNAKE_CASE (API_URL.js)

### TypeScript Files
- Same conventions as JavaScript
- .ts extension for type definitions
- .tsx extension for React components

### Configuration Files
- Lowercase with dots (vite.config.ts)
- Descriptive names (docker-compose.yml)
- Standard extensions (.json, .md, .yml)

## Import Conventions

### Relative Imports
- Same directory: `./filename`
- Parent directory: `../filename`
- Subdirectory: `./directory/filename`

### Absolute Imports
- From services: `../services/api`
- From components: `./components/WeatherDisplay`
- Use absolute paths for clarity

### Third-Party Imports
- npm packages: `import express from 'express'`
- No path prefixes
- Managed by package.json

## Asset Management

### Images
- Frontend: Place in `public/` or `src/assets/`
- Backend: Not typically needed (API only)
- Use relative paths for imports

### Fonts
- Imported via CSS
- Or placed in public directory
- Optimized by build process

### Icons
- Emoji in text (weather app uses emojis)
- Or icon libraries (can be added)
- SVG icons (can be embedded)

## Testing Structure (Recommended)

### Backend Tests
```
backend/
├── tests/
│   ├── unit/              # Unit tests
│   ├── integration/       # Integration tests
│   └── e2e/               # End-to-end tests
```

### Frontend Tests
```
frontend/
├── tests/
│   ├── components/        # Component tests
│   ├── services/          # Service tests
│   └── e2e/               # End-to-end tests
```

## Documentation Files

### Generated Documentation
- `FRONTEND_DOCUMENTATION.md`: Frontend code details
- `BACKEND_DOCUMENTATION.md`: Backend code details
- `PROJECT_STRUCTURE.md`: This file

### Additional Documentation
- `README.md`: Project overview
- Code comments: Inline documentation
- JSDoc: Function documentation (can be added)
- API docs: Can be generated from routes

## Git Workflow

### Branches
- `main`: Production code
- `develop`: Development code
- Feature branches: For new features

### Commits
- Conventional commits recommended
- Clear commit messages
- Atomic changes per commit

### Ignore Rules
- Never commit: `.env`, `node_modules`, build outputs
- Commit: Source code, config templates, documentation
- LFS: Large files if needed (images, datasets)

## Security Considerations

### Sensitive Files
- `.env`: Never commit
- API keys: Store in environment
- Secrets: Use secret management in production

### Code Security
- Input validation on all endpoints
- Error message sanitization
- CORS configuration
- Dependency updates for security patches

## Performance Optimization

### Frontend
- Code splitting (can be added)
- Lazy loading (can be added)
- Image optimization (can be added)
- Bundle size monitoring

### Backend
- Database indexing
- Response caching
- Connection pooling
- Request compression

## Scalability Considerations

### Horizontal Scaling
- Backend: Can run multiple instances
- Frontend: Can be served from CDN
- Database: MongoDB replica sets

### Vertical Scaling
- Increase server resources
- Optimize database queries
- Cache frequently accessed data

## Maintenance

### Dependency Updates
- Regular security updates
- Check for outdated packages
- Test before major updates
- Use lock files for consistency

### Code Quality
- Linting (ESLint configured)
- Type checking (TypeScript available)
- Code formatting (Prettier can be added)
- Code reviews (team workflow)

## Monitoring and Logging

### Backend Logging
- Console logging (current)
- Structured logging (can be added)
- Error tracking (can be added)
- Performance monitoring (can be added)

### Frontend Monitoring
- Error tracking (can be added)
- Performance metrics (can be added)
- User analytics (can be added)
- A/B testing (can be added)
