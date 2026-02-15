# OpenOA Cloud Analyst - Backend API

Production-ready FastAPI backend for wind plant performance analysis.

## Features

- ✅ FastAPI framework with async support
- ✅ Production-ready uvicorn configuration
- ✅ Environment-based configuration (development/production)
- ✅ Configurable host, port, and logging via environment variables
- ✅ CORS enabled for all origins (configurable)
- ✅ Comprehensive structured logging with startup/shutdown events
- ✅ Exception handling and error responses
- ✅ File upload processing (CSV)
- ✅ AEP analysis with Monte Carlo simulation
- ✅ Pydantic models for type safety
- ✅ Health check endpoint

## API Endpoints

### GET `/`
Health check endpoint.

**Response:**
```json
{
  "status": "OpenOA API running"
}
```

### POST `/analyze`
Run AEP analysis on uploaded wind plant data.

**Request:**
- `scada_file`: CSV file (multipart/form-data)
- `meter_file`: CSV file (multipart/form-data)

**Response:**
```json
{
  "p50": 150000.0,
  "p90": 130000.0,
  "samples": [149500.0, 151200.0, ...]
}
```

## Installation

1. Create a virtual environment:
```bash
python -m venv venv
```

2. Activate the virtual environment:
- Windows: `venv\Scripts\activate`
- Linux/Mac: `source venv/bin/activate`

3. Install dependencies:
```bash
pip install -r requirements.txt
```

## Running the API

### Development Mode
Simply run the main script (uses environment variables or defaults):
```bash
python main.py
```

This will start the server with:
- Host: 0.0.0.0 (or from `HOST` env var)
- Port: 8000 (or from `PORT` env var)
- Auto-reload: Enabled
- Workers: 1

### Production Mode
Set the `ENVIRONMENT` variable to production:
```bash
# Windows PowerShell
$env:ENVIRONMENT="production"; python main.py

# Linux/Mac
ENVIRONMENT=production python main.py
```

Or with uvicorn directly:
```bash
uvicorn main:app --host 0.0.0.0 --port 8000 --workers 4
```

Production mode automatically:
- Disables auto-reload
- Uses 4 workers (multi-process)
- Optimizes for performance

## API Documentation

Once running, visit:
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## Project Structure

```
backend/
├── main.py                 # FastAPI application
├── requirements.txt        # Python dependencies
├── services/
│   └── openoa_services.py # Analysis service layer
├── openoa/                 # OpenOA library modules
└── storage/
    └── uploads/           # Temporary file storage
```

## Environment Variables

Copy `.env.example` to `.env` and configure as needed:

| Variable | Description | Default | Options |
|----------|-------------|---------|----------|
| `HOST` | Server host address | `0.0.0.0` | Any valid host |
| `PORT` | Server port | `8000` | Any valid port number |
| `ENVIRONMENT` | Deployment environment | `development` | `development`, `production` |
| `LOG_LEVEL` | Logging verbosity | `INFO` | `DEBUG`, `INFO`, `WARNING`, `ERROR`, `CRITICAL` |

### Example Configuration

**Development** (`.env`):
```env
HOST=0.0.0.0
PORT=8000
ENVIRONMENT=development
LOG_LEVEL=DEBUG
```

**Production** (`.env`):
```env
HOST=0.0.0.0
PORT=8000
ENVIRONMENT=production
LOG_LEVEL=INFO
```

## Error Handling

The API provides detailed error responses:
- `400`: Bad request (invalid file format)
- `422`: Unprocessable entity (validation errors)
- `500`: Internal server error

## Deployment

For production deployment, consider:
- Using environment-specific CORS origins
- Setting up SSL/TLS certificates
- Using a production WSGI server (Gunicorn + Uvicorn workers)
- Implementing rate limiting
- Adding authentication/authorization
- Setting up monitoring and logging aggregation

### Docker Deployment (Optional)

Create a `Dockerfile`:
```dockerfile
FROM python:3.11-slim

WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

Build and run:
```bash
docker build -t openoa-api .
docker run -p 8000:8000 openoa-api
```

## License

MIT License
