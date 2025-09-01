import geopandas as gpd

# Load your file (UTM CRS)
gdf = gpd.read_file("lagos_population.geojson")

# Reproject to WGS84 (EPSG:4326)
gdf = gdf.to_crs(epsg=4326)

# Save new GeoJSON
gdf.to_file("lagos_population_wgs84.geojson", driver="GeoJSON")