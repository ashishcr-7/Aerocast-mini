 HEAD
# Delhi NCR Air Pollution–Weather Coupled Forecasting System (AeroCast)

An academic research prototype and full-stack operational web application that predicts **PM2.5 particulate matter concentrations for the next 72 hours** across **10 monitoring stations in Delhi NCR**, tightly coupled with surface meteorology and boundary layer dynamics.

---

## ⚠️ Scientific Honesty & Methodology Notice

> **Academic Disclaimer:** This application is a **weather-aware statistical machine learning forecasting prototype**, NOT a fully coupled 3-dimensional Eulerian chemical transport simulation such as **WRF-Chem**, **CHIMERE**, or **CMAQ**.

### Key Differences:
| Dimension | AeroCast (Our ML System) | 3D Chemical Transport (WRF-Chem / CMAQ) |
| :--- | :--- | :--- |
| **Atmospheric Physics** | Ingests surface & boundary layer covariates (PBL height, wind vectors, RH, temperature, pressure) as tabular features. | Numerically solves 3D Navier-Stokes equations and atmospheric thermodynamics across regional grid cells. |
| **Chemical Kinetics** | **Implicit:** Learns statistical non-linear relationships between meteorological covariates and observed PM2.5. | **Explicit:** Numerically integrates photochemical gas-phase reactions and secondary organic/inorganic aerosol formation (e.g. MOZART, ISORROPIA). |
| **Emission Inventories** | Station-level cyclical diurnals and lag encodings represent anthropogenic schedules. | Spatially gridded anthropogenic, agricultural, and biomass burning inventories (EDGAR, FINN). |
| **Compute Latency** | **< 50 milliseconds** on CPU inference. | **Hours to days** on High-Performance Computing (HPC) clusters. |

---

## 🏛️ System Architecture

```mermaid
flowchart TD
    subgraph DataSources["Public Data Sources"]
        OA["OpenAQ v3 API<br/>(CPCB Stations)"]
        OM["Open-Meteo Archive & Forecast<br/>(ERA5 / GFS)"]
    end

    subgraph Storage["Storage Layer"]
        PG[("PostgreSQL 18<br/>+ Prisma ORM")]
    end

    subgraph AI["AI Microservice (FastAPI :8000)"]
        FE["Feature Pipeline<br/>(Lags, Rolling, Solar Cycles)"]
        XGB["Multi-Output XGBoost Head<br/>(Lead 1h..72h + CI Bounds)"]
        RF["Random Forest Regressor"]
        PB["Persistence Baseline"]
    end

    subgraph Backend["Express API Backend (:5000)"]
        CRON["Data Refresh Cron<br/>(Overlap Guarded)"]
        AQI["CPCB Indian AQI Engine<br/>(Breakpoints & Health Advisories)"]
        TRAP["Trapping Risk Engine<br/>(Rule-Based Ventilation & BLH)"]
    end

    subgraph Frontend["Interactive Web UI (React 19 + Vite :5173)"]
        DASH["Atmospheric Overview<br/>& CPCB AQI Badge"]
        FC["72-Hour Forecast Chart<br/>(Uncertainty Band & CPCB Lines)"]
        COUP["Coupled Trends Chart<br/>(PM2.5 vs BLH / Wind Speed)"]
        MAP["Delhi NCR Leaflet Map<br/>(10 Station AQI Markers)"]
        MODAL["Model Evaluation & Scientific Notice"]
    end

    OA --> CRON
    OM --> CRON
    CRON --> PG
    PG --> FE
    FE --> XGB
    XGB --> Backend
    Backend --> Frontend
```

---

## 🔬 Atmospheric Coupling Theory (Delhi NCR Focus)

Delhi NCR's severe winter pollution episodes are characterized by extreme meteorological trapping:
1. **Nocturnal Planetary Boundary Layer (PBL) Collapse:** Radiative ground cooling creates a strong thermal inversion layer, compressing the mixing volume from >1,500m during midday to <200m at night. Surface emissions (vehicular, domestic, industrial) are compressed into this shallow volume.
2. **Calm Winds (< 2 m/s / < 7 km/h):** Prevents horizontal advection and ventilation out of the Indo-Gangetic airshed.
3. **Hygroscopic Aerosol Condensation:** Relative humidity > 70% accelerates secondary particulate formation and dense smog/haze.
4. **Daytime Convective Dispersion:** Midday solar heating breaks the surface inversion, lifting the boundary layer and lowering ground-level PM2.5 concentrations.

Our ML model explicitly ingests **Planetary Boundary Layer Height (BLH)**, **Wind U/V Components**, **Temperature**, **Relative Humidity**, and **Surface Pressure** to model these dynamics without lookahead leakage.

---

## 📊 Benchmark Evaluation Results

Evaluated on held-out chronological test datasets (70% Train, 15% Validation, 15% Test):

| Forecast Horizon | Persistence Baseline (MAE) | Random Forest (MAE) | **XGBoost Weather-Coupled (MAE)** | **XGBoost R²** | Gain vs Baseline |
| :---: | :---: | :---: | :---: | :---: | :---: |
| **+1 Hour** | 8.42 µg/m³ | 6.85 µg/m³ | **5.72 µg/m³** | **0.961** | +32.1% |
| **+6 Hours** | 24.15 µg/m³ | 16.40 µg/m³ | **14.10 µg/m³** | **0.869** | +41.6% |
| **+24 Hours** | 41.30 µg/m³ | 28.12 µg/m³ | **23.45 µg/m³** | **0.764** | **+43.2%** |
| **+48 Hours** | 53.60 µg/m³ | 38.45 µg/m³ | **32.80 µg/m³** | **0.638** | +38.8% |
| **+72 Hours** | 62.45 µg/m³ | 46.90 µg/m³ | **39.75 µg/m³** | **0.529** | +36.3% |

*Key finding: At +24h, weather-coupled XGBoost achieves a **43.2% lower MAE** than persistence, and retains predictive skill (R² = 0.529) even at +72 hours.*

---

## 🚀 Quickstart & Local Installation

### Prerequisites
- **Node.js**: v20 or v22
- **Python**: 3.11+
- **PostgreSQL**: 16, 17, or 18 running locally on port `5432`

### 1. Database Setup
```bash
# Verify database connection in backend/.env:
DATABASE_URL="postgresql://postgres:password@localhost:5432/airpollution"

cd backend
npm install
npx prisma generate
npx prisma migrate dev --name init
node src/utils/seed.js
```

### 2. AI Service (Python FastAPI)
```bash
cd ai-service
pip install -r requirements.txt
python -m app.models.train
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000
```

### 3. Backend (Node.js Express)
```bash
cd backend
npm start
# Server runs on http://localhost:5000
```

### 4. Frontend (React 19 + Vite)
```bash
cd frontend
npm install
npm run dev
# Dashboard opens on http://localhost:5173
```

---

## 🧪 Running Automated Tests

### Backend Test Suite (Jest + Supertest):
```bash
cd backend
npm test
# Runs 12 automated unit & API integration tests
```

### AI Service Test Suite (Python Unittest):
```bash
cd ai-service
python -m unittest discover tests
# Verifies zero-leakage feature engineering and 72h inference bounds
```

### Frontend Build Test:
```bash
cd frontend
npm run build
# Strict TypeScript & Vite production bundle validation
```

---

## 📡 REST API Reference

| Endpoint | Method | Description |
| :--- | :---: | :--- |
| `/api/health` | `GET` | Health check returning status of PostgreSQL, Express, and AI Service. |
| `/api/stations` | `GET` | Returns list of 10 Delhi NCR monitoring stations with coordinates. |
| `/api/forecast?stationId=:id&hours=72` | `GET` | Returns 72-hour hourly PM2.5 forecasts with uncertainty intervals. |
| `/api/analysis/trapping?stationId=:id` | `GET` | Returns Indian CPCB AQI calculation and rule-based atmospheric trapping risk indicator. |
| `/api/weather?stationId=:id&hours=48` | `GET` | Returns hourly meteorological observations (BLH, wind, temp, humidity). |
| `/api/model/metrics` | `GET` | Returns benchmark validation metrics (MAE, RMSE, R²) for all lead horizons. |

---

## 📚 Monitoring Stations Included
1. **Anand Vihar** (East Delhi, Industrial / Transport Hub)
2. **Punjabi Bagh** (West Delhi, Residential / Commercial)
3. **RK Puram** (South Delhi, Institutional)
4. **ITO** (Central Delhi, High Traffic)
5. **Mandir Marg** (Central Delhi, Urban Green)
6. **Lodhi Road** (South-Central Delhi, Background)
7. **Dwarka Sector 8** (South-West Delhi, Near IGI Airport)
8. **Rohini** (North-West Delhi, Suburban)
9. **Gurugram Sector 51** (NCR Haryana, Urban Industrial)
10. **Noida Sector 62** (NCR Uttar Pradesh, Tech & Traffic Corridor)

---

## 📄 License
Academic & Research Prototype — Licensed under the MIT License.

# Aerocast-mini
 25c391d14f3f62850a0239449b0ab9d067cc8bf6
