# Moodle Integration Service

FastAPI service for integrating with Moodle platform. This service provides REST API endpoints for fetching course and assignment data from Moodle using Selenium web scraping.

## Features

- 🔐 API Key authentication
- 📚 Course listing and details
- 📝 Assignment tracking
- 🔄 Full sync functionality
- 📖 OpenAPI/Swagger documentation
- 🚀 Fast and async with FastAPI

## Prerequisites

- Python 3.8+
- Chrome/Chromium browser
- ChromeDriver

## Installation

1. **Create virtual environment:**
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

2. **Install dependencies:**
```bash
pip install -r requirements.txt
```

3. **Configure environment:**
```bash
cp .env.example .env
# Edit .env with your credentials
```

## Configuration

Edit `.env` file:

```env
# Server
HOST=0.0.0.0
PORT=8000
API_KEY=your-secret-api-key-here

# Moodle
MOODLE_BASE_URL=https://moodle45.nccu.edu.tw
MOODLE_USERNAME=your-student-id
MOODLE_PASSWORD=your-password

# Selenium
HEADLESS=true
CHROME_DRIVER_PATH=/usr/bin/chromedriver

# CORS
ALLOWED_ORIGINS=http://localhost:3000
```

## Running the Service

### Development Mode
```bash
python main.py
```

Or using uvicorn directly:
```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### Production Mode
```bash
uvicorn main:app --host 0.0.0.0 --port 8000 --workers 4
```

## API Endpoints

### Health Check
```bash
GET /health
```

### Login
```bash
POST /api/moodle/login
Content-Type: application/json
X-API-Key: your-api-key

{
  "username": "student-id",
  "password": "password"
}
```

### Get Courses
```bash
GET /api/moodle/courses
X-API-Key: your-api-key
```

### Get Course Detail
```bash
GET /api/moodle/courses/{course_id}
X-API-Key: your-api-key
```

### Get Assignments
```bash
GET /api/moodle/assignments
GET /api/moodle/assignments?course_id=123
X-API-Key: your-api-key
```

### Full Sync
```bash
POST /api/moodle/sync
Content-Type: application/json
X-API-Key: your-api-key

{
  "username": "student-id",
  "password": "password"
}
```

## API Documentation

Once the server is running, visit:
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc
- OpenAPI Schema: http://localhost:8000/openapi.json

## Testing

### Test with cURL
```bash
# Health check
curl http://localhost:8000/health

# Get courses (requires API key)
curl -H "X-API-Key: your-api-key" http://localhost:8000/api/moodle/courses

# Full sync
curl -X POST http://localhost:8000/api/moodle/sync \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your-api-key" \
  -d '{
    "username": "student-id",
    "password": "password"
  }'
```

### Test with Python requests
```python
import requests

API_URL = "http://localhost:8000"
API_KEY = "your-api-key"
headers = {"X-API-Key": API_KEY}

# Get courses
response = requests.get(f"{API_URL}/api/moodle/courses", headers=headers)
print(response.json())

# Sync
payload = {
    "username": "student-id",
    "password": "password"
}
response = requests.post(
    f"{API_URL}/api/moodle/sync",
    json=payload,
    headers=headers
)
print(response.json())
```

## Integration with Next.js

Add to your Next.js `.env.local`:
```env
MOODLE_SERVICE_URL=http://localhost:8000
MOODLE_SERVICE_API_KEY=your-secret-api-key-here
```

Example client code:
```typescript
// src/lib/moodle-client.ts
const MOODLE_SERVICE_URL = process.env.MOODLE_SERVICE_URL;
const API_KEY = process.env.MOODLE_SERVICE_API_KEY;

async function syncMoodleData(username: string, password: string) {
  const response = await fetch(`${MOODLE_SERVICE_URL}/api/moodle/sync`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': API_KEY!,
    },
    body: JSON.stringify({ username, password }),
  });

  return response.json();
}
```

## Docker Deployment (Optional)

Create `Dockerfile`:
```dockerfile
FROM python:3.11-slim

WORKDIR /app

# Install Chrome and ChromeDriver
RUN apt-get update && apt-get install -y \
    chromium \
    chromium-driver \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

Build and run:
```bash
docker build -t moodle-service .
docker run -p 8000:8000 --env-file .env moodle-service
```

## Development Status

- [x] Basic FastAPI setup
- [x] API key authentication
- [x] CORS configuration
- [x] Request/Response models
- [x] Endpoint structure
- [ ] Moodle scraper integration (TODO)
- [ ] Login implementation (TODO)
- [ ] Course fetching (TODO)
- [ ] Assignment fetching (TODO)
- [ ] Full sync implementation (TODO)

## Next Steps

1. Integrate Moodle scraper from `graduate_agent/moodle/`
2. Implement login endpoint
3. Implement course and assignment endpoints
4. Add comprehensive error handling
5. Add rate limiting
6. Add caching layer
7. Write tests

## Troubleshooting

### ChromeDriver issues
```bash
# Check Chrome version
google-chrome --version

# Install matching ChromeDriver
# Download from: https://chromedriver.chromium.org/
```

### Port already in use
```bash
# Find process using port 8000
lsof -i :8000

# Kill process
kill -9 <PID>
```

## License

MIT
