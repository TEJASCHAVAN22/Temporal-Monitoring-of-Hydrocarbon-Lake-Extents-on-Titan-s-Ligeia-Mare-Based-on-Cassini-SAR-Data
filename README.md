# Temporal-Monitoring-of-Hydrocarbon-Lake-Extents-on-Titan-s-Ligeia-Mare-Based-on-Cassini-SAR-Data

# 🪐 Temporal Monitoring of Hydrocarbon Lake Extents on Titan — Ligeia Mare
> SAR-based monitoring (Cassini SAR methodology simulated using Sentinel-1 analog in Google Earth Engine)

[![Earth Engine](https://img.shields.io/badge/Platform-Google%20Earth%20Engine-blue?logo=google)](#)
[![Data](https://img.shields.io/badge/Data-Cassini%20SAR%20%7C%20Sentinel--1-lightgrey)](#)

---

🔭 Introduction
---------------
This project demonstrates a SAR-based workflow to detect and monitor liquid surface extents (hydrocarbon lakes) over an Area of Interest (AOI) inspired by Ligeia Mare on Saturn's moon Titan. The method uses Cassini SAR concepts but is implemented with Sentinel-1 GRD data as an analog within Google Earth Engine (GEE). The goal is to illustrate backscatter-based liquid detection, temporal area extraction, and visualization.

🎯 Aim
-------
Detect and produce a time series of liquid-surface extent (area in km²) using SAR backscatter thresholds and simple speckle smoothing — enabling temporal monitoring of lake/wet-surface dynamics.

🎯 Objectives
------------
- Identify low-backscatter areas indicative of calm liquid surfaces.
- Generate a time series of liquid surface area within the AOI.
- Visualize SAR backscatter, detected liquid mask, and area over time.
- Provide an easily reusable GEE script for further experimentation.

🛠️ Method
---------
1. Define AOI from a vector asset and center map on it.
2. Load Sentinel-1 GRD imagery (VV polarization, IW mode) and filter by date and AOI.
3. Preprocess: convert to dB and apply focal mean smoothing to reduce speckle.
4. Detect liquid: apply a dB threshold (example: -17 dB) and mask low-backscatter pixels.
5. Compute area: multiply masked pixels by pixel area and sum per date, converting to km².
6. Visualize: map SAR median backscatter, detected liquid mask, legend, and generate a time-series chart.

Example (Google Earth Engine) — core steps:
```javascript
// AOI (example asset & filter)
var aoi = ee.FeatureCollection('projects/gee-trial2/assets/Shapfile/WMH_Distric')
               .filter(ee.Filter.eq('dt_code', 521));
Map.centerObject(aoi);

// Sentinel-1 load & preprocess
var sar = ee.ImageCollection('COPERNICUS/S1_GRD')
  .filterBounds(aoi).filterDate('2017-01-01','2024-12-31')
  .filter(ee.Filter.eq('instrumentMode','IW'))
  .filter(ee.Filter.listContains('transmitterReceiverPolarisation','VV'))
  .select('VV');

function preprocess(img){ return img.log10().multiply(10).focal_mean(50,'circle','meters').copyProperties(img,['system:time_start']); }
var sar_db = sar.map(preprocess);

// Liquid mask (threshold)
var threshold = -17; // dB
function extractLiquid(img){ return img.lt(threshold).selfMask().copyProperties(img,['system:time_start']); }
var liquidMask = sar_db.map(extractLiquid);
```

📊 Analysis
-----------
- The workflow produces a per-date area estimate (km²) for the masked low-backscatter surface.
- Use ui.Chart.feature.byFeature to visualize temporal trends and detect seasonal/temporal changes.
- Validate threshold sensitivity: try values around -19 to -15 dB, and compare with known water/hydrocarbon analog signatures.
- Consider advanced steps: speckle-reducing filters (Lee, Gamma-MAP), dual-pol analysis (when available), and supervised classification for improved discrimination.

📚 References
-------------
- Elachi, C. et al., "Cassini RADAR observations of Titan" — Cassini mission literature.
- Copernicus Sentinel-1 User Guides (SAR principles).
- Google Earth Engine documentation: https://developers.google.com/earth-engine
- Relevant SAR processing literature (Lee filter, Gamma-MAP, thresholding methods).


⚠️ Notes & Tips
--------------
- The provided AOI asset path is: projects/gee-trial2/assets/Shapfile/WMH_Distric (filter dt_code = 521). Update asset path and dt_code to suit your AOI.
- Thresholding is an approximation — for rigorous science use radiometric calibration, incidence-angle correction, and more advanced classification.
- Pixel scale and reduceRegion scale should match the SAR resolution (e.g., 10–30 m depending on processing).

📄 License
---------
Specify an appropriate license (e.g., MIT) if you want others to reuse the code.

---

👤 Author  / Contact
---------

Tejas Chavan  
* GIS Expert at Government Of Maharashtra Revenue & Forest Department  
* tejaskchavan22@gmail.com  
* +91 7028338510  


If you'd like, I can:
- Commit this README.md to the repository,
- Add badges, screenshots, or example plots exported from GEE,
- Expand the Methods and References with full citations.
