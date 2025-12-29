// ======================================================
// SAR-based Temporal Monitoring of Liquid Bodies
// (Cassini SAR Methodology implemented using Sentinel-1 Analog in GEE)
// ======================================================

// ------------------------------
// 1. Area of Interest (AOI)
// ------------------------------
var aoi = ee.FeatureCollection('projects/gee-trial2/assets/Shapfile/WMH_Distric')
                                            .filter(ee.Filter.eq('dt_code', 521));
Map.centerObject(aoi);

Map.addLayer(aoi, {color: 'red'}, 'AOI');

// ------------------------------
// 2. Load Sentinel-1 SAR Data
// ------------------------------
var sar = ee.ImageCollection('COPERNICUS/S1_GRD')
  .filterBounds(aoi)
  .filterDate('2017-01-01', '2024-12-31')
  .filter(ee.Filter.eq('instrumentMode', 'IW'))
  .filter(ee.Filter.listContains('transmitterReceiverPolarisation', 'VV'))
  .select('VV');

// ------------------------------
// 3. SAR Pre-processing
// (Linear to dB + Speckle Filtering)
// ------------------------------
function preprocess(img) {
  var db = img.log10().multiply(10);
  var smooth = db.focal_mean(50, 'circle', 'meters');
  return smooth.copyProperties(img, ['system:time_start']);
}

var sar_db = sar.map(preprocess);

// ------------------------------
// 4. Liquid Surface Detection
// (Low backscatter threshold)
// ------------------------------
var threshold = -17; // dB

function extractLiquid(img) {
  var liquid = img.lt(threshold).selfMask();
  return liquid.copyProperties(img, ['system:time_start']);
}

var liquidMask = sar_db.map(extractLiquid);

// ------------------------------
// 5. Visualization
// ------------------------------
Map.addLayer(
  sar_db.median().clip(aoi),
  {min: -25, max: 0},
  'SAR Backscatter (dB)'
);

Map.addLayer(
  liquidMask.median().clip(aoi),
  {palette: ['0000ff']},
  'Detected Liquid Surface'
);

// ------------------------------
// 6. Area Calculation (km²)
// ------------------------------
var pixelArea = ee.Image.pixelArea();

var areaTimeSeries = liquidMask.map(function(img) {
  var area = img.multiply(pixelArea)
    .reduceRegion({
      reducer: ee.Reducer.sum(),
      geometry: aoi,
      scale: 30,
      maxPixels: 1e13
    });

  return ee.Feature(null, {
    'date': ee.Date(img.get('system:time_start')).format('YYYY-MM-dd'),
    'liquid_area_km2': ee.Number(area.get('VV')).divide(1e6)
  });
});

print('Liquid Area Time Series', areaTimeSeries);

// ------------------------------
// 7. Time-Series Chart
// ------------------------------
var chart = ui.Chart.feature.byFeature(
  areaTimeSeries,
  'date',
  'liquid_area_km2'
).setOptions({
  title: 'Temporal Monitoring of Liquid Surface Extent',
  hAxis: {title: 'Date'},
  vAxis: {title: 'Area (km²)'},
  lineWidth: 2,
  pointSize: 3
});

print(chart);



// ------------------------------
// 6. LEGEND (Two Classes Only)
// ------------------------------
var legend = ui.Panel({
  style: {
    position: 'bottom-left',
    padding: '8px 12px'
  }
});

var legendTitle = ui.Label({
  value: 'Legend',
  style: {fontWeight: 'bold', fontSize: '14px'}
});
legend.add(legendTitle);

// SAR Backscatter (White)
legend.add(
  ui.Panel([
    ui.Label({
      style: {
        backgroundColor: '#ffffff',
        padding: '8px',
        margin: '0 6px 0 0'
      }
    }),
    ui.Label('SAR Backscatter')
  ], ui.Panel.Layout.Flow('horizontal'))
);

// Detected Liquid Surface (Blue)
legend.add(
  ui.Panel([
    ui.Label({
      style: {
        backgroundColor: '#0000ff',
        padding: '8px',
        margin: '0 6px 0 0'
      }
    }),
    ui.Label('Detected Liquid Surface')
  ], ui.Panel.Layout.Flow('horizontal'))
);

Map.add(legend);
