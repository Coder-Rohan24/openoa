# 🌬️ OpenOA Cloud Analyst

[![Live Demo](https://img.shields.io/badge/demo-live-brightgreen)](https://openoa-website.vercel.app)
[![Backend API](https://img.shields.io/badge/API-online-blue)](https://openoa-backend.onrender.com)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

> **Professional wind energy analytics platform powered by [OpenOA](https://github.com/NREL/OpenOA)** — Perform Monte Carlo AEP analysis, data quality assessment, and comprehensive wind plant performance evaluation through an intuitive SaaS interface.

---

## ✨ Features

- **📊 Monte Carlo AEP Analysis** – Statistical simulation with configurable parameters (50-10,000 iterations)
- **📈 Interactive Dashboards** – Real-time visualization with Chart.js histograms and KPI cards
- **✅ Data Quality Metrics** – Automated validation of SCADA and meter data integrity
- **🌐 Wind Resource Analysis** – Speed distributions, directional analysis, and turbulence metrics
- **⚡ Energy Analysis** – Power curve assessment, capacity factor calculations, and loss estimations
- **🎯 Executive Summaries** – Auto-generated insights with P50/P90 estimates and confidence intervals
- **🚀 Cloud-Optimized** – Fast processing with scalable backend infrastructure

---

## 🏗️ Tech Stack

### Frontend
- **[React 19.2](https://react.dev)** + **[TypeScript](https://www.typescriptlang.org)** – Modern UI framework
- **[Vite 7.3](https://vite.dev)** – Lightning-fast build tool
- **[Tailwind CSS 4](https://tailwindcss.com)** – Utility-first styling with custom animations
- **[React Router 7](https://reactrouter.com)** – Client-side routing
- **[Chart.js 4](https://www.chartjs.org)** – Interactive data visualizations
- **[React Icons](https://react-icons.github.io/react-icons)** – Heroicons v2 icon library
- **[Axios](https://axios-http.com)** – HTTP client for API communication

### Backend
- **[FastAPI](https://fastapi.tiangolo.com)** – High-performance Python API framework
- **[OpenOA](https://github.com/NREL/OpenOA)** – NREL's operational analysis toolkit
- **[Pandas](https://pandas.pydata.org)** + **[NumPy](https://numpy.org)** – Data processing
- **[Scikit-learn](https://scikit-learn.org)** – Machine learning utilities
- **[Uvicorn](https://www.uvicorn.org)** – ASGI server

### Deployment
- **Frontend**: [Vercel](https://vercel.com) – Edge network with automatic deployments
- **Backend**: [Render](https://render.com) – Managed Python hosting

---

## 🚀 Quick Start

### Prerequisites
- **Node.js** 18+ and **npm/pnpm**
- **Python** 3.9+ with **pip**
- **Git**

### Installation

```bash
# Clone repository
git clone https://github.com/yourusername/openoa-website.git
cd openoa-website

# Install frontend dependencies
cd frontend
npm install

# Install backend dependencies
cd ../backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### Running Locally

**Terminal 1 - Backend:**
```bash
cd backend
.\venv\Scripts\python.exe main.py
# Server runs on http://localhost:8000
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
# App runs on http://localhost:5173
```

### Environment Variables

Create `.env` in backend directory:
```env
CORS_ORIGINS=http://localhost:5173
PORT=8000
```

---

## 📁 Project Structure

```
openoa-website/
├── frontend/
│   ├── src/
│   │   ├── components/       # Reusable UI components
│   │   │   ├── tabs/         # Analysis result tabs
│   │   │   ├── AlertMessage.tsx
│   │   │   ├── ExecutiveSummary.tsx
│   │   │   ├── FileUploadBox.tsx
│   │   │   ├── HistogramChart.tsx
│   │   │   ├── KPICard.tsx
│   │   │   └── Navbar.tsx
│   │   ├── hooks/            # Custom React hooks
│   │   ├── pages/            # Route pages
│   │   │   ├── Home.tsx      # Upload & configuration
│   │   │   └── Results.tsx   # Analysis dashboard
│   │   ├── types/            # TypeScript definitions
│   │   ├── utils/            # Helper functions
│   │   └── index.css         # Global styles + animations
│   ├── public/               # Static assets
│   └── package.json
│
├── backend/
│   ├── main.py               # FastAPI application
│   ├── openoa/               # OpenOA library modules
│   │   ├── analysis/         # AEP, wake, electrical losses
│   │   ├── schema/           # Validation schemas
│   │   └── utils/            # Data processing utilities
│   ├── services/
│   │   └── openoa_services.py  # Analysis orchestration
│   ├── storage/uploads/      # Temporary file storage
│   └── requirements.txt
│
└── README.md
```

---

## 📖 Usage

1. **Upload Data Files**
   - Navigate to the home page
   - Upload SCADA data CSV (turbine operational data)
   - Upload Meter data CSV (energy production measurements)

2. **Configure Analysis**
   - Set number of Monte Carlo simulations (50-10,000)
   - Specify turbine rated capacity (kW)
   - Choose confidence level (80-99%)

3. **Run Analysis**
   - Click "Run Analysis" to start processing
   - Backend performs Monte Carlo simulation
   - Results display in interactive dashboard

4. **Explore Results**
   - **Dashboard Tab**: Executive summary + AEP histogram
   - **AEP Analysis**: Detailed P50/P90 estimates
   - **Data Quality**: Completeness and validity metrics
   - **Wind Resource**: Speed/direction distributions
   - **Energy Analysis**: Power curves and capacity factors

---

## 🔗 API Endpoints

### `POST /analyze`
Performs comprehensive AEP analysis on uploaded data.

**Request:**
```bash
curl -X POST http://localhost:8000/analyze \
  -F "scada_file=@scada.csv" \
  -F "meter_file=@meter.csv" \
  -F "num_simulations=1000"
```

**Response:**
```json
{
  "aep_results": {
    "p50_gwh": 120.5,
    "p90_gwh": 110.2,
    "samples": [115.3, 118.7, ...]
  },
  "data_quality": {...},
  "wind_stats": {...},
  "energy_analysis": {...}
}
```

### `GET /health`
Health check endpoint for monitoring.

---

## 🎨 UI Features

- **🎭 Smooth Animations** – Fade-in, slide-in, and hover effects
- **🎯 Responsive Design** – Mobile-friendly layout with Tailwind
- **🌈 Professional Theme** – Blue-cyan gradient color scheme
- **⚡ Micro-interactions** – Hover lift, scale transforms, shadow transitions
- **📱 Sticky Navigation** – Persistent header with animated route indicators

---

## 🧪 Sample Data Format

### SCADA CSV Structure
```csv
time,power_kw,wind_speed_ms,wind_direction_deg
2023-01-01 00:00:00,1500.5,8.2,180
2023-01-01 00:10:00,1650.3,8.5,185
```

### Meter CSV Structure
```csv
time,energy_kwh
2023-01-01 00:00:00,250.5
2023-01-01 00:10:00,275.3
```

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📜 License

This project is licensed under the **MIT License** – see [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- **[NREL OpenOA](https://github.com/NREL/OpenOA)** – Operational analysis framework
- **[FastAPI](https://fastapi.tiangolo.com)** – API framework
- **[Vercel](https://vercel.com)** & **[Render](https://render.com)** – Deployment platforms

---

## 📧 Contact

**Project Maintainer** – [Anirban Halder](mailto:halder.anirban@gmail.com)

**Live Demo** – [openoa-website.vercel.app](https://openoa-kfit.vercel.app/)

**Issues** – [GitHub Issues](https://github.com/Coder-Rohan24/openoa/issues)

---

<div align="center">
  <strong>Built with ❤️ using React, FastAPI, and OpenOA</strong>
</div>

