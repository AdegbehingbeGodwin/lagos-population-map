document.addEventListener('DOMContentLoaded', () => {
    const loader = document.getElementById('loader');
    loader.style.display = 'block';

    const map = L.map('map').setView([6.5244, 3.3792], 10);

    const carto = L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
        subdomains: 'abcd',
        maxZoom: 19
    }).addTo(map);

    const satellite = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
        attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
    });

    const baseMaps = {
        "Carto Light": carto,
        "Satellite": satellite
    };

    let geojson;
    let info = L.control();

    info.onAdd = function (map) {
        this._div = L.DomUtil.create('div', 'info');
        this.update();
        return this._div;
    };

    info.update = function (props) {
        this._div.innerHTML = '<h4>Lagos Population</h4>' + (props ?
            '<b>' + props.lganame + '</b><br />' +
            'Total Population: ' + props.Total.toLocaleString() + '<br />' +
            'Male: ' + props.Male.toLocaleString() + '<br />' +
            'Female: ' + props.Female.toLocaleString() + '<br />' +
            'Density: ' + Math.round(props.density).toLocaleString() + ' people / mi<sup>2</sup>'
            : 'Hover over a LGA');
    };

    info.addTo(map);

    function getColor(d, breaks) {
        return d > breaks[6] ? '#800026' :
            d > breaks[5] ? '#BD0026' :
            d > breaks[4] ? '#E31A1C' :
            d > breaks[3] ? '#FC4E2A' :
            d > breaks[2] ? '#FD8D3C' :
            d > breaks[1] ? '#FEB24C' :
            d > breaks[0] ? '#FED976' :
            '#FFEDA0';
    }

    function style(feature, breaks) {
        return {
            fillColor: getColor(feature.properties.density, breaks),
            weight: 2,
            opacity: 1,
            color: 'white',
            dashArray: '3',
            fillOpacity: 0.7
        };
    }

    function highlightFeature(e) {
        var layer = e.target;

        layer.setStyle({
            weight: 5,
            color: '#666',
            dashArray: '',
            fillOpacity: 0.7
        });

        if (!L.Browser.ie && !L.Browser.opera && !L.Browser.edge) {
            layer.bringToFront();
        }

        info.update(layer.feature.properties);
    }

    function resetHighlight(e) {
        geojson.resetStyle(e.target);
        info.update();
    }

    function zoomToFeature(e) {
        map.fitBounds(e.target.getBounds());
    }

    function onEachFeature(feature, layer) {
        layer.on({
            mouseover: highlightFeature,
            mouseout: resetHighlight,
            click: zoomToFeature
        });
    }

    function createChoroplethLayer(property, breaks) {
        return L.geoJson(null, {
            style: function (feature) {
                return {
                    fillColor: getColor(feature.properties[property], breaks),
                    weight: 2,
                    opacity: 1,
                    color: 'white',
                    dashArray: '3',
                    fillOpacity: 0.7
                };
            },
            onEachFeature: onEachFeature
        });
    }

    fetch('data/lagos_population.geojson')
        .then(response => response.json())
        .then(data => {
            loader.style.display = 'none';

            const densityValues = data.features.map(feat => feat.properties.density).sort((a, b) => a - b);
            const totalValues = data.features.map(feat => feat.properties.Total).sort((a, b) => a - b);
            const maleValues = data.features.map(feat => feat.properties.Male).sort((a, b) => a - b);
            const femaleValues = data.features.map(feat => feat.properties.Female).sort((a, b) => a - b);

            // ...existing code...
            // Calculate breaks using d3.quantileSorted for each quantile
            const densityBreaks = [
                d3.quantileSorted(densityValues, 0.1),
                d3.quantileSorted(densityValues, 0.2),
                d3.quantileSorted(densityValues, 0.4),
                d3.quantileSorted(densityValues, 0.6),
                d3.quantileSorted(densityValues, 0.8),
                d3.quantileSorted(densityValues, 0.9),
                d3.quantileSorted(densityValues, 1)
            ];
            const totalBreaks = [
                d3.quantileSorted(totalValues, 0.1),
                d3.quantileSorted(totalValues, 0.2),
                d3.quantileSorted(totalValues, 0.4),
                d3.quantileSorted(totalValues, 0.6),
                d3.quantileSorted(totalValues, 0.8),
                d3.quantileSorted(totalValues, 0.9),
                d3.quantileSorted(totalValues, 1)
            ];
            const maleBreaks = [
                d3.quantileSorted(maleValues, 0.1),
                d3.quantileSorted(maleValues, 0.2),
                d3.quantileSorted(maleValues, 0.4),
                d3.quantileSorted(maleValues, 0.6),
                d3.quantileSorted(maleValues, 0.8),
                d3.quantileSorted(maleValues, 0.9),
                d3.quantileSorted(maleValues, 1)
            ];
            const femaleBreaks = [
                d3.quantileSorted(femaleValues, 0.1),
                d3.quantileSorted(femaleValues, 0.2),
                d3.quantileSorted(femaleValues, 0.4),
                d3.quantileSorted(femaleValues, 0.6),
                d3.quantileSorted(femaleValues, 0.8),
                d3.quantileSorted(femaleValues, 0.9),
                d3.quantileSorted(femaleValues, 1)
            ];
            const densityLayer = createChoroplethLayer('density', densityBreaks);
            const totalLayer = createChoroplethLayer('Total', totalBreaks);
            const maleLayer = createChoroplethLayer('Male', maleBreaks);
            const femaleLayer = createChoroplethLayer('Female', femaleBreaks);

            densityLayer.addData(data);
            totalLayer.addData(data);
            maleLayer.addData(data);
            femaleLayer.addData(data);

            const overlayMaps = {
                "Population Density": densityLayer,
                "Total Population": totalLayer,
                "Male Population": maleLayer,
                "Female Population": femaleLayer
            };

            L.control.layers(baseMaps, overlayMaps, { collapsed: false }).addTo(map);

            geojson = densityLayer;
            map.addLayer(densityLayer);

            const legend = L.control({ position: 'bottomright' });

            legend.onAdd = function (map) {
                this._div = L.DomUtil.create('div', 'info legend');
                this.update('density', densityBreaks);
                return this._div;
            };

            legend.update = function (property, breaks) {
                const grades = [0, ...breaks];
                const labels = ['<strong>' + getTitle(property) + '</strong>'];
                let from, to;

                for (let i = 0; i < grades.length; i++) {
                    from = grades[i];
                    to = grades[i + 1];
                    labels.push(
                        '<i style="background:' + getColor(from + 1, breaks) + '"></i> ' +
                        from.toLocaleString() + (to ? '&ndash;' + to.toLocaleString() : '+'));
                }

                this._div.innerHTML = labels.join('<br>');
            };

            legend.addTo(map);

            map.on('overlayadd', function (e) {
                if (e.name === 'Population Density') {
                    legend.update('density', densityBreaks);
                } else if (e.name === 'Total Population') {
                    legend.update('Total', totalBreaks);
                } else if (e.name === 'Male Population') {
                    legend.update('Male', maleBreaks);
                } else if (e.name === 'Female Population') {
                    legend.update('Female', femaleBreaks);
                }
            });

            function getTitle(property) {
                if (property === 'density') {
                    return 'Population Density';
                } else if (property === 'Total') {
                    return 'Total Population';
                } else if (property === 'Male') {
                    return 'Male Population';
                } else if (property === 'Female') {
                    return 'Female Population';
                }
            }

            const searchControl = new L.Control.Search({
                layer: densityLayer,
                propertyName: 'lganame',
                initial: false,
                zoom: 12,
                marker: false
            });

            map.addControl(searchControl);

            L.control.scale().addTo(map);

            const githubControl = L.control({ position: 'bottomleft' });
            githubControl.onAdd = function (map) {
                const div = L.DomUtil.create('div', 'info');
                div.innerHTML = '<a href="https://github.com/AdegbehingbeGodwin/lagos-population-map" target="_blank">View on GitHub</a>';
                return div;
            };
            githubControl.addTo(map);
        });
});
