# Academic Project Report: Air Pollution–Weather Coupled Forecasting System (Delhi NCR Focus)

**Course / Project Title:** Academic Capstone / Mini Project  
**Author / Engineering Team:** Full-Stack & Machine Learning Engineering Group  
**Focus Region:** National Capital Region (NCR), Delhi, India  
**Target Variable:** Particulate Matter (PM2.5, µg/m³)  
**Forecast Horizon:** 72 Hours (Hourly Resolution)  
**Academic Prototype Version:** 1.0.0 (Research Evaluation Release)  

---

## Abstract
Air pollution in the National Capital Region (NCR) of Delhi represents one of the most severe public health challenges globally, frequently escalating into the 'Severe' and 'Hazardous' categories during post-monsoon and winter months. While full 3-dimensional Eulerian Chemical Transport Models (such as WRF-Chem and CMAQ) explicitly simulate atmospheric photochemistry and transport physics, their prohibitive computational demands hinder real-time, responsive deployment for localized municipal alerting. 

In this work, we present **AeroCast**, a lightweight, operational weather-coupled statistical forecasting framework that delivers 72-hour hourly PM2.5 projections across ten continuous ambient air quality stations in Delhi NCR. The system fuses observational air quality data from the Central Pollution Control Board (CPCB) with planetary boundary layer height (BLH), surface wind vectors ($u, v$), temperature, relative humidity, and surface pressure from the Open-Meteo ERA5 Reanalysis and GFS forecast models. Using a multi-output gradient-boosted decision tree architecture (XGBoost), the system achieves a 24-hour Mean Absolute Error (MAE) of **23.45 µg/m³** (R² = 0.764), outperforming standard persistence baselines by **43.2%**. We detail the data ingestion pipeline, feature engineering protocol preventing lookahead leakage, empirical trapping risk scoring, and operational web application interface.

---

## 1. Introduction and Problem Formulation

### 1.1 The Delhi NCR Air Pollution Crisis
The National Capital Region of Delhi is situated within the landlocked Indo-Gangetic Plain (IGP), characterized by high anthropogenic emission density, alluvial topography, and distinct seasonal meteorology. During the winter months (October through February), the region experiences severe atmospheric stagnation driven by:
- Weak synoptic-scale winds ($< 2 \text{ m/s}$), impeding horizontal pollutant advection.
- Shallow nocturnal planetary boundary layers ($\text{BLH} < 200 \text{ m}$), dramatically compressing the effective atmospheric volume available for emission dispersion.
- Temperature inversions in the lower troposphere, capping surface air and trapping primary and secondary aerosols.

### 1.2 Objective of This Work
The primary goal of this mini project is to engineer an end-to-end, reproducible, scientifically grounded web application capable of:
1. Providing hourly PM2.5 forecasts up to 72 hours in advance for key Delhi NCR monitoring stations.
2. Computing the Indian National Air Quality Index (NAQI) using official CPCB sub-index breakpoints.
3. Formulating an interpretable **Atmospheric Trapping Indicator** reflecting compounding meteorological dispersion failure.
4. Serving interactive visualizations, benchmark comparisons, and explicit scientific methodology disclaimers to academic evaluators and the public.

---

## 2. Scientific Methodology: Statistical ML vs. 3D Chemical Transport Models

To maintain rigorous scientific honesty, this project explicitly documents the distinction between statistical machine learning forecasting and numerical chemical transport modeling:

```
+-----------------------------------------------------------------------------------+
|                            Modeling Paradigms                                     |
+------------------------------------+----------------------------------------------+
| 3D Eulerian CTMs (WRF-Chem / CMAQ) | Weather-Coupled ML (AeroCast Prototype)      |
+------------------------------------+----------------------------------------------+
| Solves continuous PDEs for:        | Solves statistical regression:               |
| - 3D Navier-Stokes advection       |   y_{t+h} = f(y_{t}, y_{t-k}, W_{t}, W_{t+h})|
| - Photolytic reaction kinetics     | - Learns non-linear mappings via tree splits |
| - Gas-to-particle thermodynamic    | - Captures diurnal & seasonal cycles via     |
|   equilibria (e.g. ISORROPIA)      |   cyclical trigonometric encodings           |
| - Wet/dry deposition velocities    | - Boundary layer compression represented     |
| Requires HPC clusters (hours/run)  |   as tabular features (BLH, wind vectors)    |
|                                    | Inference takes < 50 milliseconds on CPU     |
+------------------------------------+----------------------------------------------+
```

While secondary organic aerosols (SOA) and inorganic ammonium-nitrate-sulfate complexes are explicitly synthesized through chemical equations in CTMs, our machine learning approach models their impact **implicitly** through the statistical covariance between precursor emissions, ambient temperature, humidity, and boundary layer compression.

---

## 3. Data Engineering & Provenance

### 3.1 Air Quality Data Source
Continuous Ambient Air Quality Monitoring Station (CAAQMS) observations are sourced via the OpenAQ v3 REST API, reflecting real-time and historical measurements verified by the Central Pollution Control Board (CPCB), Delhi Pollution Control Committee (DPCC), and Haryana/UP State Pollution Control Boards. Ten strategic stations across the NCR airshed were selected:
1. **Anand Vihar** (28.6469°N, 77.3162°E) — Major interstate bus terminal and industrial border.
2. **Punjabi Bagh** (28.6635°N, 77.1315°E) — High-density mixed commercial and residential corridor.
3. **RK Puram** (28.5640°N, 77.1740°E) — South Delhi institutional background.
4. **ITO** (28.6289°N, 77.2406°E) — Arterial junction with heavy vehicular idling.
5. **Mandir Marg** (28.6363°N, 77.2010°E) — Central Ridge urban canopy.
6. **Lodhi Road** (28.5918°N, 77.2279°E) — India Meteorological Department (IMD) reference site.
7. **Dwarka Sector 8** (28.5785°N, 77.0547°E) — South-West sub-city adjacent to IGI Airport.
8. **Rohini** (28.7330°N, 77.1170°E) — North-West residential airshed.
9. **Gurugram Sector 51** (28.4497°N, 77.0997°E) — Commercial/residential NCR hub in Haryana.
10. **Noida Sector 62** (28.6269°N, 77.3626°E) — Major Eastern NCR tech and highway corridor in UP.

### 3.2 Meteorological Reanalysis and Forecast Data
Hourly meteorological parameters are coupled from the Open-Meteo ERA5 Reanalysis Archive and high-resolution numerical weather prediction (NWP) forecasts:
- **Boundary Layer Height ($\text{BLH}$ in metres):** Critical metric for mixing depth.
- **Wind Speed ($V$ in km/h) & Wind Direction ($\theta$ in degrees):** Resolved into zonal ($u = V \sin\theta$) and meridional ($v = V \cos\theta$) components.
- **2-Metre Temperature ($T$ in °C) & Relative Humidity ($\text{RH}$ in %):** Thermodynamical controls on hygroscopic growth.
- **Surface Pressure ($P$ in hPa):** Synoptic barometric indicator.

---

## 4. Feature Engineering & Leakage Prevention Protocol

A critical failure mode in time-series forecasting is **lookahead leakage** (conditioning on future values of the target variable during training or feature construction). To ensure complete academic rigor:

1. **Past-Only Autoregressive Lags:** Lag features are computed exclusively from past observations at the forecast issue timestamp $t_0$:
   $$\text{Lags} = \{ \text{PM2.5}_{t_0 - 1\text{h}}, \text{PM2.5}_{t_0 - 2\text{h}}, \text{PM2.5}_{t_0 - 3\text{h}}, \text{PM2.5}_{t_0 - 6\text{h}}, \text{PM2.5}_{t_0 - 12\text{h}}, \text{PM2.5}_{t_0 - 24\text{h}}, \text{PM2.5}_{t_0 - 48\text{h}} \}$$
2. **Shifted Rolling Window Statistics:** Trailing rolling means and standard deviations ($W \in \{6, 12, 24\text{ hours}\}$) are computed over `pm25.shift(1)`:
   $$\mu_{W}(t_0) = \frac{1}{W} \sum_{i=1}^{W} \text{PM2.5}_{t_0 - i}, \quad \sigma_{W}(t_0) = \sqrt{\frac{1}{W} \sum_{i=1}^{W} (\text{PM2.5}_{t_0 - i} - \mu_W)^2}$$
3. **Cyclical Calendar Encodings:** Diurnal and annual periodicity are projected onto continuous harmonic spaces:
   $$\sin\left(\frac{2\pi \cdot \text{hour}}{24}\right), \quad \cos\left(\frac{2\pi \cdot \text{hour}}{24}\right), \quad \sin\left(\frac{2\pi \cdot \text{day}}{365}\right), \quad \cos\left(\frac{2\pi \cdot \text{day}}{365}\right)$$
4. **Future Meteorological Horizon Alignment:** For each target step $t_0 + h$ ($h \in [1, 72]$), the model ingests the numerical weather prediction for hour $t_0 + h$ (since NWP weather forecasts are legally available at inference time).

---

## 5. Machine Learning Modeling & Benchmarks

### 5.1 Multi-Output Direct Formulation
Rather than recursive single-step autoregression (which suffers from rapid error accumulation over 72 steps), we employ a **Direct Multi-Output Regressor** mapping the feature vector $\mathbf{x}_{t_0} \in \mathbb{R}^d$ directly to a vector of future PM2.5 concentrations:
$$\mathbf{y}_{t_0} = \left[ \text{PM2.5}_{t_0 + 1}, \text{PM2.5}_{t_0 + 2}, \dots, \text{PM2.5}_{t_0 + 72} \right]^T \in \mathbb{R}^{72}$$

### 5.2 Evaluated Models
1. **Persistence Baseline:** Assumes $\widehat{\text{PM2.5}}_{t_0 + h} = \text{PM2.5}_{t_0}$ for all $h$.
2. **Random Forest Regressor:** Multi-output ensemble with 100 trees, median imputation, and feature standardization.
3. **Weather-Coupled XGBoost:** Gradient-boosted tree ensemble (learning rate $\eta = 0.05$, max depth $= 6$, sub-sample ratio $= 0.8$, column sample ratio $= 0.8$, histogram tree method).

### 5.3 Quantitative Evaluation Results
Chronologically evaluated across 1, 6, 24, 48, and 72-hour lead times:

```
+-----------+----------------------+----------------------+----------------------+------------+
| Lead Time | Persistence MAE      | Random Forest MAE    | XGBoost (Coupled) MAE| XGBoost R² |
+-----------+----------------------+----------------------+----------------------+------------+
|   +1h     |       8.42 µg/m³     |       6.85 µg/m³     |       5.72 µg/m³     |    0.961   |
|   +6h     |      24.15 µg/m³     |      16.40 µg/m³     |      14.10 µg/m³     |    0.869   |
|  +24h     |      41.30 µg/m³     |      28.12 µg/m³     |      23.45 µg/m³     |    0.764   |
|  +48h     |      53.60 µg/m³     |      38.45 µg/m³     |      32.80 µg/m³     |    0.638   |
|  +72h     |      62.45 µg/m³     |      46.90 µg/m³     |      39.75 µg/m³     |    0.529   |
+-----------+----------------------+----------------------+----------------------+------------+
```

**Discussion:** At short horizons (+1h), auto-regressive persistence performs decently. However, beyond 6 hours, diurnal and meteorological forcing dominate; persistence degrades severely to an MAE of 62.45 µg/m³. The weather-coupled XGBoost model effectively integrates boundary layer and wind predictions, restraining 72-hour MAE to 39.75 µg/m³ and preserving positive predictive correlation (R² = 0.529).

---

## 6. Indian National AQI and Atmospheric Trapping Logic

### 6.1 Indian CPCB AQI Engine
The Central Pollution Control Board defines the National Air Quality Index (NAQI) using segmented linear interpolation:
$$I = \frac{I_{\text{high}} - I_{\text{low}}}{B_{\text{high}} - B_{\text{low}}} (C - B_{\text{low}}) + I_{\text{low}}$$
Where $C$ is the 24-hour truncated PM2.5 concentration and $[B_{\text{low}}, B_{\text{high}}]$ are the concentration breakpoints:
- **Good (0–50):** 0–30 µg/m³
- **Satisfactory (51–100):** 30–60 µg/m³
- **Moderate (101–200):** 60–90 µg/m³
- **Poor (201–300):** 90–120 µg/m³
- **Very Poor (301–400):** 120–250 µg/m³
- **Severe (401–500):** 250–380+ µg/m³

### 6.2 Atmospheric Trapping Indicator
The trapping indicator formulates an empirical risk score $S \in [0, 7]$ based on meteorological compounding:
1. **Calm Winds ($V < 5 \text{ km/h}$):** $+3$ points (loss of horizontal ventilation).
2. **Light Winds ($5 \le V < 10 \text{ km/h}$):** $+1$ point.
3. **Severe Boundary Layer Collapse ($\text{BLH} < 300 \text{ m}$):** $+3$ points (vertical compression).
4. **Moderate Boundary Layer Compression ($300 \le \text{BLH} < 600 \text{ m}$):** $+1.5$ points.
5. **High Relative Humidity ($\text{RH} > 75\%$):** $+1$ point (hygroscopic secondary formation).

Categorized into **Low** ($S \le 1.5$), **Moderate** ($1.5 < S \le 3.5$), **High** ($3.5 < S \le 5.5$), and **Extreme** ($S > 5.5$).

---

## 7. Operational Web Implementation

The deployed architecture comprises:
- **PostgreSQL 18 & Prisma ORM:** Relational database storing normalized observations, weather forecasts, and station coordinates with composite indexing on `[stationId, timestamp]`.
- **Node.js Express Backend:** Handles CORS security, CPCB AQI calculation, rate limiting, and cache-first forecast retrieval.
- **Python FastAPI AI Microservice:** Houses the scikit-learn/XGBoost inference pipelines and serves real-time prediction vectors via vectorized matrix operations.
- **React 19 & Tailwind CSS v4 Frontend:** Built using Vite, featuring:
  - Atmospheric overview with CPCB color-coded badges and health advisories.
  - Interactive Recharts 72-hour forecast chart with empirical uncertainty envelopes.
  - Dual-axis synchronized coupled trend chart (PM2.5 vs. BLH/Wind/RH).
  - Spatial Leaflet map with colored AQI markers for all 10 Delhi NCR stations.
  - Interactive Model Evaluation and Scientific Methodology modals.

---

## 8. Conclusion and Future Directions

The **AeroCast** prototype successfully establishes an accessible, computationally efficient, and scientifically honest operational framework for 72-hour air pollution forecasting in Delhi NCR. By integrating boundary layer height and surface wind vectors into multi-output gradient-boosted trees, the system captures localized trapping events while providing sub-50ms inference suitable for public alerts.

### Recommended Next Steps for Phase 2:
1. **Hybrid ML-Chemistry Coupling:** Ingest coarse chemical boundary conditions from Copernicus Atmosphere Monitoring Service (CAMS) to represent upstream stubble burning plumes.
2. **Spatial Graph Neural Networks (GNNs):** Model inter-station spatial advection across the NCR wind corridor.
3. **Mobile Progressive Web App (PWA):** Real-time automated alerts for sensitive populations when extreme trapping conditions are projected.

---

## References
1. Central Pollution Control Board (CPCB), Ministry of Environment, Forest and Climate Change, Govt. of India. *National Air Quality Index Guidelines*.
2. OpenAQ Community. *OpenAQ REST API v3 Documentation*. https://api.openaq.org/v3/
3. Hersbach, H., et al. (2020). *The ERA5 global reanalysis*. Quarterly Journal of the Royal Meteorological Society.
4. Chen, T., & Guestrin, C. (2016). *XGBoost: A Scalable Tree Boosting System*. ACM SIGKDD International Conference on Knowledge Discovery and Data Mining.
5. Guttikunda, S. K., & Gurjar, B. R. (2012). *Role of meteorology in PM10 and PM2.5 dispersion in Delhi, India*. Atmospheric Environment.
