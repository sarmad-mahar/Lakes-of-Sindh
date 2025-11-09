// Initialize map
const map = L.map('map', {
  center: [25.0, 68.5],
  zoom: 6
});

// Define basemap layers
const osm = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  maxZoom: 18,
  attribution: '© OpenStreetMap contributors'
});

const esriWorld = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
  maxZoom: 18,
  attribution: 'Tiles © Esri — Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
});

// Add default basemap
osm.addTo(map);

// Small custom control with two visible buttons
const mapControls = L.control({ position: 'bottomleft' });
mapControls.onAdd = function () {
  const container = L.DomUtil.create('div', 'map-controls');
  container.innerHTML = `
    <button class="map-btn active" id="osmBtn" title="Street Map">
      <i class="fas fa-map"></i><span>Street Map</span>
    </button>
    <button class="map-btn" id="satelliteBtn" title="Satellite">
      <i class="fas fa-satellite"></i><span>Satellite Map</span>
    </button>
  `;

  const osmBtn = container.querySelector('#osmBtn');
  const satBtn = container.querySelector('#satelliteBtn');

  osmBtn.addEventListener('click', function (e) {
    e.stopPropagation();
    osmBtn.classList.add('active');
    satBtn.classList.remove('active');
    if (map.hasLayer(esriWorld)) map.removeLayer(esriWorld);
    if (!map.hasLayer(osm)) map.addLayer(osm);
  });

  satBtn.addEventListener('click', function (e) {
    e.stopPropagation();
    satBtn.classList.add('active');
    osmBtn.classList.remove('active');
    if (map.hasLayer(osm)) map.removeLayer(osm);
    if (!map.hasLayer(esriWorld)) map.addLayer(esriWorld);
  });

  L.DomEvent.disableClickPropagation(container);
  L.DomEvent.disableScrollPropagation(container);
  return container;
};
mapControls.addTo(map);

// Lake marker style
function lakeStyle() {
  return {
    radius: 5,
    fillColor: '#ffffff',
    color: '#08519c',
    weight: 2,
    opacity: 1,
    fillOpacity: 0.8
  };
}

// Format coordinates helper
function formatCoords(latlng) {
  if (!latlng) return '';
  const lat = latlng.lat ? latlng.lat.toFixed(5) : (latlng[1] ? latlng[1].toFixed(5) : '');
  const lon = latlng.lng ? latlng.lng.toFixed(5) : (latlng[0] ? latlng[0].toFixed(5) : '');
  return `${lat}, ${lon}`;
}

// Load and display lakes
fetch('lakes_sindh.geojson')
  .then(response => {
    if (!response.ok) throw new Error('GeoJSON load failed');
    return response.json();
  })
  .then(data => {
    // Add lakes layer
    const lakesLayer = L.geoJSON(data, {
      pointToLayer: (feature, latlng) => L.circleMarker(latlng, lakeStyle()),
      onEachFeature: (feature, layer) => {
        const props = feature.properties || {};
        const name = props.name || 'Unknown lake';
        const area = props.area_km2 ? `${props.area_km2} km²` : 'Area: unknown';
        const coords = formatCoords(layer.getLatLng());
        layer.bindPopup(`<strong>${name}</strong><br>${area}<br><em>Coordinates:</em> ${coords}`);
      }
    }).addTo(map);

    // Fit map to lakes
    const bounds = lakesLayer.getBounds();
    if (bounds.isValid()) {
      map.fitBounds(bounds.pad(0.2));
    }

    // Add panel control
    const panelControl = L.control({ position: 'topright' });
    panelControl.onAdd = function () {
      const container = L.DomUtil.create('div', 'lake-panel');
      container.innerHTML = `
        <div class="panel-header">
          <div class="panel-title">
            Description of lakes
          </div>
          <button class="btn btn-toggle" title="Collapse/Expand">
            <i class="fas fa-chevron-up"></i>
          </button>
        </div>
        <div class="panel-body"></div>
      `;

      const body = container.querySelector('.panel-body');

      // Add lake items (name + info icon immediately after)
      lakesLayer.eachLayer(layer => {
        const props = layer.feature?.properties || {};
        const name = props.name || 'Unknown Lake';

        const item = L.DomUtil.create('div', 'lake-item', body);

        // lake name
        const nameEl = document.createElement('strong');
        nameEl.textContent = name;

        // info button with icon
        const infoBtn = document.createElement('button');
        infoBtn.className = 'info-btn';
        infoBtn.title = 'More information';
        infoBtn.innerHTML = `<i class="fa-solid fa-circle-info"></i>`;

        item.appendChild(nameEl);
        item.appendChild(infoBtn);

        // clicking name zooms to lake
        nameEl.addEventListener('click', (e) => {
          L.DomEvent.stopPropagation(e);
          map.setView(layer.getLatLng(), 12);
          layer.openPopup();
          setTimeout(() => layer.closePopup(), 800);
        });

        // clicking info icon shows detailed modal
        infoBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          const latlng = layer.getLatLng();
          const properties = {
            name: props.name,
            area_km2: props.area_km2,
            note: props.note
          };
          window.showLakeInfo(properties, latlng);
        });
      });

      // Collapse toggle
      const btnToggle = container.querySelector('.btn-toggle');
      btnToggle.addEventListener('click', e => {
        e.stopPropagation();
        container.classList.toggle('collapsed');
        const icon = btnToggle.querySelector('i');
        icon.classList.toggle('fa-chevron-up');
        icon.classList.toggle('fa-chevron-up');
      });

      L.DomEvent.disableClickPropagation(container);
      L.DomEvent.disableScrollPropagation(container);
      return container;
    };
    panelControl.addTo(map);
  })
  .catch(err => {
    console.error('Failed to load lakes:', err);
    alert('Failed to load lakes data. See console for details.');
  });

// create a dedicated pane for the province boundary (below markers)
map.createPane('boundaryPane');
map.getPane('boundaryPane').style.zIndex = 350; // below markerPane (default ~600)

// Load Sindh boundary, draw outline in boundaryPane so markers stay on top
fetch('sindh_boundary.geojson')
  .then(resp => {
    if (!resp.ok) throw new Error('Failed to load Sindh boundary');
    return resp.json();
  })
  .then(geo => {
    const boundaryStyle = {
      color: '#08355a',    // dark-blue outline
      weight: 2,
      opacity: 1,
      fillOpacity: 0      // no fill
    };
    const sindhBoundary = L.geoJSON(geo, {
      style: boundaryStyle,
      pane: 'boundaryPane'
    }).addTo(map);

    // compute padded bounds and apply
    const bounds = sindhBoundary.getBounds();
    if (bounds.isValid()) {
      const padFactor = 0.12;               // ~12% padding around the province
      const padded = bounds.pad(padFactor);

      // set initial view to padded bounds
      map.fitBounds(padded);

      // lock map panning so user cannot move far outside the padded bounds
      map.setMaxBounds(padded.pad(0.03));

      // constrain zoom out reasonably
      const minZoom = map.getBoundsZoom(padded);
      map.setMinZoom(Math.max(minZoom - 1, 3));
    }
  })
  .catch(err => {
    console.warn('Sindh boundary not applied:', err);
  });

/* --- Info modal creation & helpers --- */
(function () {
  // create backdrop + modal once
  const backdrop = document.createElement('div');
  backdrop.className = 'lake-info-backdrop hidden';
  const modal = document.createElement('div');
  modal.className = 'lake-info-modal hidden';
  modal.innerHTML = `
    <div class="modal-header">
      <div class="modal-title"></div>
      <button class="modal-close" aria-label="Close">&times;</button>
    </div>
    <div class="modal-body">
      <div class="modal-subtitle area"></div>
      <div class="modal-subtitle coords"></div>
      <hr/>
      <div class="modal-note"></div>
    </div>
  `;
  document.body.appendChild(backdrop);
  document.body.appendChild(modal);

  const titleEl = modal.querySelector('.modal-title');
  const areaEl = modal.querySelector('.modal-subtitle.area');
  const coordsEl = modal.querySelector('.modal-subtitle.coords');
  const noteEl = modal.querySelector('.modal-note');
  const closeBtn = modal.querySelector('.modal-close');

  function showInfo(featureProps, latlng) {
    const name = featureProps?.name || 'Unknown Lake';
    const area = featureProps?.area_km2 ? String(featureProps.area_km2) : 'Area: unknown';
    const note = featureProps?.note || 'No additional information.';
    titleEl.textContent = name;
    areaEl.textContent = `Area: ${area}`;
    coordsEl.textContent = latlng ? `Coordinates: ${latlng.lat.toFixed(5)}, ${latlng.lng.toFixed(5)}` : '';
    noteEl.innerHTML = note; // note may contain simple HTML/markup from GeoJSON
    backdrop.classList.remove('hidden');
    modal.classList.remove('hidden');
    // focus for keyboard accessibility
    closeBtn.focus();
  }

  function hideInfo() {
    backdrop.classList.add('hidden');
    modal.classList.add('hidden');
  }

  // handlers
  backdrop.addEventListener('click', hideInfo);
  closeBtn.addEventListener('click', hideInfo);
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') hideInfo();
  });

  // expose helper to global scope for panel to call
  window.__showLakeInfo = showInfo;
})();

/* --- Panel control (place info icon per lake) --- */
const panelControl = L.control({ position: 'topright' });
panelControl.onAdd = function () {
  const container = L.DomUtil.create('div', 'lake-panel');
  container.innerHTML = `
    <div class="panel-header">
      <div class="panel-title">
        <i class="fas fa-info-circle panel-info" aria-hidden="true"></i>
        The 6 Major Lakes in Sindh
      </div>
      <button class="btn btn-toggle" title="Collapse/Expand">
        <i class="fas fa-chevron-up"></i>
      </button>
    </div>
    <div class="panel-body"></div>
  `;
  const body = container.querySelector('.panel-body');

  lakesLayer.eachLayer(layer => {
    const props = layer.feature?.properties || {};
    const name = props.name || 'Unknown Lake';
    const item = L.DomUtil.create('div', 'lake-item', body);
    // name area
    const nameEl = document.createElement('strong');
    nameEl.textContent = name;
    // info button (to the right)
    const infoBtn = document.createElement('button');
    infoBtn.className = 'info-btn';
    infoBtn.title = 'More info';
    infoBtn.innerHTML = `<i class="fas fa-info"></i>`;
    // assemble
    item.appendChild(nameEl);
    item.appendChild(infoBtn);

    // click on list item -> open popup briefly (existing behavior)
    item.addEventListener('click', (e) => {
      L.DomEvent.stopPropagation(e);
      map.setView(layer.getLatLng(), 12);
      layer.openPopup();
      setTimeout(() => layer.closePopup(), 800);
    });

    // info button click -> show modal with details
    infoBtn.addEventListener('click', (e) => {
      L.DomEvent.stopPropagation(e);
      const propsLocal = layer.feature?.properties || {};
      const latlng = layer.getLatLng ? layer.getLatLng() : null;
      // use global helper created above
      if (typeof window.__showLakeInfo === 'function') {
        window.__showLakeInfo(propsLocal, latlng);
      }
    });
  });

  const btnToggle = container.querySelector('.btn-toggle');
  btnToggle.addEventListener('click', e => {
    e.stopPropagation();
    container.classList.toggle('collapsed');
    const icon = btnToggle.querySelector('i');
    icon.classList.toggle('fa-chevron-up');
    icon.classList.toggle('fa-chevron-down');
  });

  L.DomEvent.disableClickPropagation(container);
  L.DomEvent.disableScrollPropagation(container);
  return container;
};
panelControl.addTo(map);