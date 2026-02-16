# 🚀 Quick Start Guide - OpenOA Cloud Analyst API

## Step 1: Install Dependencies

```powershell
# Navigate to backend directory
cd backend

# Create virtual environment (recommended)
python -m venv venv

# Activate virtual environment
.\venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt
```

## Step 2: Run the API

```powershell
# Option 1: Run with Python
python main.py

# Option 2: Run with Uvicorn
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

The API will start on `http://localhost:8000`

## Step 3: Test the API

### Test Health Check
Visit: http://localhost:8000

Or use curl:
```powershell
curl http://localhost:8000
```

Expected response:
```json
{"status": "OpenOA API running"}
```

### Test Analysis Endpoint
Run the test script:
```powershell
python test_api.py
```

Or visit the interactive docs:
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## Step 4: Use the API

### Upload Files via Swagger UI
1. Go to http://localhost:8000/docs
2. Click on `POST /analyze`
3. Click "Try it out"
4. Upload your CSV files (scada_file and meter_file)
5. Click "Execute"

### Upload Files via cURL
```powershell
curl -X POST "http://localhost:8000/analyze" `
  -F "scada_file=@path/to/scada.csv" `
  -F "meter_file=@path/to/meter.csv"
```

## Expected Response

```json
{
  "p50": 150000.0,
  "p90": 130000.0,
  "samples": [149500.0, 151200.0, ...]
}
```

## Production Deployment

### Using Docker
```powershell
# Build image
docker build -t openoa-api .

# Run container
docker run -p 8000:8000 openoa-api
```

### Using Production Server
```powershell
# Install gunicorn (optional)
pip install gunicorn

# Run with multiple workers
uvicorn main:app --host 0.0.0.0 --port 8000 --workers 4
```

## Troubleshooting

- **Port already in use**: Change port with `--port 8001`
- **Import errors**: Ensure virtual environment is activated
- **CORS issues**: Check CORS middleware configuration in main.py

## Next Steps

- Configure environment variables (copy .env.example to .env)
- Implement authentication
- Add rate limiting
- Set up monitoring
- Configure production CORS origins
