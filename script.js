
let map = L.map('map').setView([18.5, -89.9], 8);

// Capa base original
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '© OpenStreetMap contributors'
}).addTo(map);

let csvData = {};
let allMarkers = [];
let layers = {
  puntos: L.layerGroup().addTo(map),
  lineas: null
};

// Leer CSV con PapaParse
Papa.parse("data/Listado_de_Puntos.csv", {
  download: true,
  header: true,
  complete: function(results) {
    results.data.forEach(row => {
      csvData[row.id] = row;
    });

    // Cargar puntos geojson
    fetch("data/puntos.geojson")
      .then(res => res.json())
      .then(geojson => {
        L.geoJSON(geojson, {
          pointToLayer: function(feature, latlng) {
            const id = feature.properties.id;
            const info = csvData[id] || {};
            const nombre = info.Nombre || "Sin nombre";
            const tipo = info.Tipo || "Sin tipo";
            const img = `https://via.placeholder.com/300x150.png?text=${encodeURIComponent(nombre)}`;
            const marker = L.marker(latlng, {
              icon: L.AwesomeMarkers.icon({ icon: 'info-sign', markerColor: 'blue' })
            }).bindPopup(\`
              <h4>\${nombre}</h4>
              <p><strong>Tipo:</strong> \${tipo}</p>
              <img src="\${img}" style="width:100%; border-radius:8px;" />
            \`);
            marker.tipo = tipo;
            allMarkers.push(marker);
            marker.addTo(layers.puntos);
            return marker;
          }
        });
        fitToPoints();
      });

    // Cargar líneas geojson
    fetch("data/lineas.geojson")
      .then(res => res.json())
      .then(geojson => {
        layers.lineas = L.geoJSON(geojson, {
          style: { color: '#666', weight: 2 }
        }).addTo(map);
      });
  }
});

function filterByType(tipo) {
  layers.puntos.clearLayers();
  if (tipo === 'all') {
    allMarkers.forEach(m => layers.puntos.addLayer(m));
  } else {
    allMarkers.forEach(m => {
      if (m.tipo === tipo) layers.puntos.addLayer(m);
    });
  }
}

function fitToPoints() {
  if (allMarkers.length > 0) {
    const group = new L.featureGroup(allMarkers);
    map.fitBounds(group.getBounds());
  }
}
