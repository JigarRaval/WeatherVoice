# WeatherVoice - Database Documentation

## Overview
WeatherVoice uses MongoDB as its primary database for persistent data storage. The database stores user preferences, saved locations, and commute profiles. MongoDB is chosen for its flexibility, scalability, and JSON-like document structure that aligns well with the application's data needs.

## Database Configuration

### Connection String
**Environment Variable:** `MONGODB_URI`
**Default:** `mongodb://localhost:27017/weathervoice`
**Format:** `mongodb://[username:password@]host:port/database`

### Connection Handling
- Graceful degradation: Application continues without MongoDB if connection fails
- Connection pooling: Managed by Mongoose
- Automatic reconnection: Mongoose handles reconnection attempts
- Development vs Production: Different connection strings via environment variables

### Database Name
**Default:** `weathervoice`
**Docker:** `weathervoice` (configured in docker-compose.yml)

## Collections (Tables)

MongoDB organizes data into collections, which are equivalent to tables in relational databases. WeatherVoice has three main collections:

### 1. Locations Collection
**Model File:** `backend/src/models/Location.js`
**Collection Name:** `locations`

#### Schema Definition

```javascript
{
  name: String (required, max 100 chars),
  country: String (optional, max 100 chars),
  lat: Number (required, -90 to 90),
  lon: Number (required, -180 to 180),
  createdAt: Date (auto-generated)
}
```

#### Field Descriptions

| Field | Type | Required | Constraints | Description |
|-------|------|----------|-------------|-------------|
| `name` | String | Yes | Max 100 chars, trimmed | City or location name (e.g., "London", "New York") |
| `country` | String | No | Max 100 chars, trimmed | Country name (e.g., "United Kingdom", "USA") |
| `lat` | Number | Yes | -90 to 90 | Latitude coordinate (negative = south, positive = north) |
| `lon` | Number | Yes | -180 to 180 | Longitude coordinate (negative = west, positive = east) |
| `createdAt` | Date | Auto | Auto-generated | Timestamp when location was saved |

#### Validation Rules
- **Name:** Must be provided, trimmed of whitespace, maximum 100 characters
- **Country:** Optional, trimmed, maximum 100 characters
- **Latitude:** Must be between -90 and 90 (valid Earth coordinates)
- **Longitude:** Must be between -180 and 180 (valid Earth coordinates)

#### Indexes
```javascript
{ name: 1, country: 1 }
```
**Purpose:** Composite index on name and country for efficient location searches

#### Example Document
```json
{
  "_id": "65a1b2c3d4e5f6g7h8i9j0k1",
  "name": "London",
  "country": "United Kingdom",
  "lat": 51.5074,
  "lon": -0.1278,
  "createdAt": "2024-01-15T10:30:00.000Z"
}
```

#### Use Cases
- Save frequently searched locations
- Quick access to favorite cities
- Location-based weather history
- User personalization

#### API Endpoints
- `GET /api/locations` - Retrieve all saved locations
- `POST /api/locations` - Save a new location
- `DELETE /api/locations/:id` - Delete a location

#### Business Logic
- **Duplicate Prevention:** Checks if location with same coordinates already exists
- **Limit Enforcement:** Maximum 10 saved locations per user
- **Auto-cleanup:** Removes oldest location when limit is exceeded

---

### 2. Preferences Collection
**Model File:** `backend/src/models/Preferences.js`
**Collection Name:** `preferences`

#### Schema Definition

```javascript
{
  units: String (enum: 'celsius', 'fahrenheit', default: 'celsius'),
  weatherProvider: String (enum: 'open-meteo', 'openweathermap', default: 'open-meteo'),
  speechEnabled: Boolean (default: false),
  forecastDays: Number (min: 7, max: 14, default: 7),
  hourlyHours: Number (min: 12, max: 48, default: 24),
  timeFormat: String (enum: '12h', '24h', default: '24h'),
  createdAt: Date (auto-generated),
  updatedAt: Date (auto-updated on save)
}
```

#### Field Descriptions

| Field | Type | Required | Default | Constraints | Description |
|-------|------|----------|---------|-------------|-------------|
| `units` | String | No | celsius | Enum: celsius, fahrenheit | Temperature display unit |
| `weatherProvider` | String | No | open-meteo | Enum: open-meteo, openweathermap | Weather data source |
| `speechEnabled` | Boolean | No | false | - | Enable/disable voice features |
| `forecastDays` | Number | No | 7 | Min: 7, Max: 14 | Number of forecast days to display |
| `hourlyHours` | Number | No | 24 | Min: 12, Max: 48 | Number of hourly forecast hours |
| `timeFormat` | String | No | 24h | Enum: 12h, 24h | Time display format |
| `createdAt` | Date | Auto | Auto | - | Initial creation timestamp |
| `updatedAt` | Date | Auto | Auto | - | Last update timestamp |

#### Validation Rules
- **units:** Must be either 'celsius' or 'fahrenheit'
- **weatherProvider:** Must be either 'open-meteo' or 'openweathermap'
- **forecastDays:** Must be between 7 and 14 days
- **hourlyHours:** Must be between 12 and 48 hours
- **timeFormat:** Must be either '12h' or '24h'

#### Pre-Save Hook
```javascript
PreferencesSchema.pre('save', function (next) {
  this.updatedAt = new Date();
  next();
});
```
**Purpose:** Automatically updates the `updatedAt` field before every save operation

#### Example Document
```json
{
  "_id": "65a1b2c3d4e5f6g7h8i9j0k2",
  "units": "celsius",
  "weatherProvider": "open-meteo",
  "speechEnabled": true,
  "forecastDays": 14,
  "hourlyHours": 24,
  "timeFormat": "24h",
  "createdAt": "2024-01-15T10:30:00.000Z",
  "updatedAt": "2024-01-20T14:45:00.000Z"
}
```

#### Use Cases
- User personalization
- Remember user settings across sessions
- Configure app behavior
- Accessibility features (speech)

#### API Endpoints
- `GET /api/preferences` - Retrieve user preferences
- `PUT /api/preferences` - Update user preferences

#### Business Logic
- **Single Document:** Only one preferences document exists per user
- **Auto-creation:** Creates default preferences if none exist
- **Partial Updates:** Allows updating individual fields without affecting others
- **Fallback:** Returns default preferences if database unavailable

---

### 3. CommuteProfile Collection
**Model File:** `backend/src/models/CommuteProfile.js`
**Collection Name:** `commuteprofiles`

#### Schema Definition

```javascript
{
  name: String (required, trimmed),
  origin: {
    name: String (optional),
    lat: Number (required),
    lon: Number (required)
  },
  destination: {
    name: String (optional),
    lat: Number (required),
    lon: Number (required)
  },
  mode: String (enum: 'driving', 'transit', 'walking', 'cycling', default: 'driving'),
  typicalDeparture: String (optional, format: HH:MM),
  createdAt: Date (auto-generated)
}
```

#### Field Descriptions

| Field | Type | Required | Constraints | Description |
|-------|------|----------|-------------|-------------|
| `name` | String | Yes | Trimmed | Human-readable name for the commute (e.g., "Home to Work") |
| `origin.name` | String | No | - | Origin location name (e.g., "Home") |
| `origin.lat` | Number | Yes | - | Origin latitude coordinate |
| `origin.lon` | Number | Yes | - | Origin longitude coordinate |
| `destination.name` | String | No | - | Destination location name (e.g., "Office") |
| `destination.lat` | Number | Yes | - | Destination latitude coordinate |
| `destination.lon` | Number | Yes | - | Destination longitude coordinate |
| `mode` | String | No | Enum: driving, transit, walking, cycling | Transportation mode |
| `typicalDeparture` | String | No | Format: HH:MM (24h) | Typical departure time (e.g., "08:30") |
| `createdAt` | Date | Auto | - | Timestamp when commute profile was created |

#### Validation Rules
- **name:** Must be provided, trimmed of whitespace
- **origin/destination coordinates:** Both lat and lon must be provided
- **mode:** Must be one of: driving, transit, walking, cycling
- **typicalDeparture:** If provided, must match format HH:MM (24-hour format)

#### Embedded Schema (PlaceSchema)
```javascript
{
  name: String,
  lat: Number,
  lon: Number
}
```
**Purpose:** Reusable schema for origin and destination locations
**No _id:** Embedded documents don't have their own _id

#### Example Document
```json
{
  "_id": "65a1b2c3d4e5f6g7h8i9j0k3",
  "name": "Home to Office",
  "origin": {
    "name": "Home",
    "lat": 51.5074,
    "lon": -0.1278
  },
  "destination": {
    "name": "Office",
    "lat": 51.5155,
    "lon": -0.1419
  },
  "mode": "driving",
  "typicalDeparture": "08:30",
  "createdAt": "2024-01-15T10:30:00.000Z"
}
```

#### Use Cases
- Weather-aware commute planning
- Save frequently used routes
- Optimize departure times based on weather
- Multiple commute profiles (work, gym, etc.)

#### API Endpoints
- `GET /api/planner/commutes` - Retrieve all saved commutes
- `POST /api/planner/commutes` - Save a new commute profile
- `DELETE /api/planner/commutes/:id` - Delete a commute profile
- `POST /api/planner/commute` - Get weather for a specific commute (one-time)

#### Business Logic
- **Multiple Profiles:** User can save multiple commute routes
- **Transport Modes:** Supports different travel methods with weather-specific advice
- **Time Optimization:** Uses typical departure time for weather forecasting
- **Weather Integration:** Fetches weather for both origin and destination

---

## Database Relationships

### No Explicit Relationships
WeatherVoice uses a document-oriented approach without explicit foreign key relationships. Each collection is independent, and relationships are maintained at the application level.

### Implicit Relationships
1. **User → Locations:** One user can have multiple locations (enforced at app level)
2. **User → Preferences:** One user has one preferences document
3. **User → CommuteProfiles:** One user can have multiple commute profiles

### Data Consistency
- Application-level validation ensures data integrity
- No cascade deletes (each collection is independent)
- IDs are used for references in API calls

---

## Indexes

### Locations Collection
```javascript
{ name: 1, country: 1 }
```
**Purpose:** Optimize queries that search by location name and country
**Use Case:** Finding locations when user searches or selects from saved list

### Geospatial Indexes (Not Currently Implemented)
**Future Enhancement:** Could add 2dsphere index for location-based queries
```javascript
{ loc: "2dsphere" }
```
**Use Case:** Find locations within a certain radius

---

## MongoDB vs localStorage Fallback

### MongoDB (Primary)
- **Advantages:**
  - Persistent across devices
  - Server-side storage
  - Can be backed up
  - Supports complex queries
  - Better for production

- **Disadvantages:**
  - Requires MongoDB server
  - Network latency
  - Infrastructure complexity

### localStorage (Fallback)
- **Advantages:**
  - No server required
  - Fast access
  - Works offline
  - Simple implementation

- **Disadvantages:**
  - Browser-specific only
  - Limited storage (~5MB)
  - Not syncable across devices
  - Can be cleared by user

### Implementation
The application uses MongoDB when available and falls back to localStorage when MongoDB is unavailable. This is handled in the frontend (`App.jsx`):

```javascript
// Try MongoDB first
try {
  const data = await getLocations();
  setSavedLocations(data.data);
} catch (err) {
  // Fallback to localStorage
  const localLocations = localStorage.getItem('weathervoice_locations');
  if (localLocations) {
    setSavedLocations(JSON.parse(localLocations));
  }
}
```

---

## Database Operations

### Create (Insert)
```javascript
// Mongoose
const location = await Location.create({ name, country, lat, lon });

// MongoDB Shell
db.locations.insertOne({ name: "London", country: "UK", lat: 51.5, lon: -0.1 })
```

### Read (Find)
```javascript
// Mongoose - All locations
const locations = await Location.find().sort({ createdAt: -1 });

// Mongoose - Single location
const location = await Location.findById(id);

// MongoDB Shell
db.locations.find().sort({ createdAt: -1 })
db.locations.findOne({ _id: ObjectId("...") })
```

### Update
```javascript
// Mongoose
const preferences = await Preferences.findOne();
preferences.units = 'fahrenheit';
await preferences.save();

// MongoDB Shell
db.preferences.updateOne(
  { _id: ObjectId("...") },
  { $set: { units: "fahrenheit" } }
)
```

### Delete
```javascript
// Mongoose
await Location.findByIdAndDelete(id);

// MongoDB Shell
db.locations.deleteOne({ _id: ObjectId("...") })
```

---

## Data Migration

### Schema Evolution
When schemas change, migrations may be needed:

**Example: Adding new field to Preferences**
```javascript
// Migration script
db.preferences.updateMany(
  { timeFormat: { $exists: false } },
  { $set: { timeFormat: "24h" } }
)
```

### Backup Strategies
```bash
# Export all data
mongodump --db weathervoice --out /backup

# Import data
mongorestore --db weathervoice /backup/weathervoice
```

---

## Performance Considerations

### Query Optimization
- Use indexes on frequently queried fields
- Limit returned fields (projection)
- Use pagination for large datasets
- Implement caching for frequently accessed data

### Connection Pooling
- Mongoose manages connection pool automatically
- Default pool size: 10 connections
- Can be configured in connection options

### Scaling
- **Vertical:** Increase server resources
- **Horizontal:** Use MongoDB replica sets
- **Sharding:** For very large datasets (not needed for this app)

---

## Security Considerations

### Data Protection
- **Environment Variables:** Store MongoDB credentials in `.env` (not committed)
- **Network:** Use MongoDB in secure network or VPN
- **Authentication:** Enable MongoDB authentication in production
- **Encryption:** Use TLS/SSL for connections in production

### Input Validation
- All inputs validated at model level
- Coordinate range validation (-90 to 90, -180 to 180)
- String length limits
- Enum validation for categorical fields

### Access Control
- Currently no user authentication (single-user app)
- Future enhancement: Add user authentication and authorization
- Future enhancement: Implement role-based access control

---

## Monitoring and Maintenance

### Health Checks
```javascript
// Server health check
mongoose.connection.readyState
// 0 = disconnected, 1 = connected, 2 = connecting, 3 = disconnecting
```

### Logging
- Connection errors logged to console
- Query errors logged with details
- Performance metrics can be added

### Regular Maintenance
- Index rebuilds (if needed)
- Database compaction
- Archive old data (if implementing history)
- Update statistics

---

## Troubleshooting

### Common Issues

#### Connection Refused
**Symptom:** `ECONNREFUSED ::1:27017`
**Solution:** 
- Ensure MongoDB is running
- Check MongoDB service status
- Verify connection string in `.env`

#### Database Lock
**Symptom:** Operations hang or timeout
**Solution:**
- Check for long-running operations
- Review active connections
- Restart MongoDB if necessary

#### Out of Memory
**Symptom:** Database crashes or slow performance
**Solution:**
- Increase MongoDB memory limit
- Implement data archiving
- Add indexes to optimize queries

---

## Development vs Production

### Development
- Local MongoDB instance
- Default connection: `mongodb://localhost:27017/weathervoice`
- No authentication required
- Debug logging enabled

### Production
- Cloud MongoDB (MongoDB Atlas, AWS DocumentDB, etc.)
- Authentication required
- TLS/SSL encryption
- Connection pooling configured
- Monitoring and alerting
- Regular backups

---

## Future Enhancements

### Potential Additions
1. **User Authentication:** Add users collection for multi-user support
2. **Weather History:** Store historical weather data for locations
3. **Search History:** Track user searches for analytics
4. **Alert Subscriptions:** Store user alert preferences
5. **Favorites:** Separate from saved locations (quick access)
6. **Geofencing:** Store location-based rules
7. **User Activity:** Track app usage patterns

### Schema Extensions
```javascript
// Example: User collection
{
  username: String,
  email: String,
  passwordHash: String,
  createdAt: Date,
  lastLogin: Date
}

// Example: WeatherHistory collection
{
  locationId: ObjectId,
  timestamp: Date,
  temperature: Number,
  conditions: String,
  alerts: Array
}
```

---

## Summary

WeatherVoice uses MongoDB with three main collections:
1. **Locations** - Saved user locations with coordinates
2. **Preferences** - User settings and app configuration
3. **CommuteProfile** - Saved commute routes for weather planning

The database is designed for:
- Flexibility with document-oriented storage
- Graceful degradation with localStorage fallback
- Easy scalability with MongoDB
- Simple maintenance and backup

The application works with or without MongoDB, providing a robust user experience in all scenarios.
