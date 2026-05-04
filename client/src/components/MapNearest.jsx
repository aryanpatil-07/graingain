import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { CENTRES } from '../data/centres';
import '../styles/map.css';

// Fix default marker icons (required for react-leaflet)
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

// Custom marker icons
const defaultIcon = L.icon({
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
  shadowSize: [41, 41]
});

// Haversine distance formula (km)
const haversine = (lat1, lng1, lat2, lng2) => {
  const toRad = (deg) => (deg * Math.PI) / 180;
  const R = 6371; // Earth radius in km
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const lat1Rad = toRad(lat1);
  const lat2Rad = toRad(lat2);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1Rad) * Math.cos(lat2Rad) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
};

export function MapNearest({
  userLocation,
  centres = CENTRES,
  restaurants = [],
  selectedCentreId,
  onNearestChange,
  onLocationChange,
  onCentreSelect
}) {
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const markersLayerRef = useRef(null);
  const [location, setLocation] = useState(userLocation || null);
  const [loading, setLoading] = useState(!userLocation);
  const [error, setError] = useState(null);
  const [mapReady, setMapReady] = useState(false);
  const [nearestList, setNearestList] = useState([]);

  // Request geolocation on mount if user location not provided
  useEffect(() => {
    if (userLocation) {
      setLocation(userLocation);
      setLoading(false);
      return;
    }

    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const { latitude, longitude } = pos.coords;
          const loc = { lat: latitude, lng: longitude };
          setLocation(loc);
          if (onLocationChange) onLocationChange(loc);
          setLoading(false);
        },
        (err) => {
          console.warn('Geolocation failed:', err);
          setError('Using default location (Pune)');
          setLocation({ lat: 18.5204, lng: 73.8567 });
          setLoading(false);
        }
      );
    } else {
      setError('Geolocation not supported');
      setLocation({ lat: 18.5204, lng: 73.8567 });
      setLoading(false);
    }
  }, [userLocation, onLocationChange]);

  // Create the Leaflet map once
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) {
      return undefined;
    }

    const map = L.map(mapContainerRef.current, {
      zoomControl: true,
      scrollWheelZoom: true
    }).setView([18.5204, 73.8567], 13);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map);

    const layerGroup = L.layerGroup().addTo(map);
    mapRef.current = map;
    markersLayerRef.current = layerGroup;
    setMapReady(true);

    return () => {
      map.remove();
      mapRef.current = null;
      markersLayerRef.current = null;
      setMapReady(false);
    };
  }, []);

  // Compute nearest centre and update map markers whenever location or centres change
  useEffect(() => {
    if (!location || !mapReady || !mapRef.current || !markersLayerRef.current || centres.length === 0) return;

    const distances = centres.map((centre) => ({
      centre,
      distance: haversine(location.lat, location.lng, centre.lat, centre.lng)
    }));

    const sorted = distances.slice().sort((a, b) => a.distance - b.distance);
    const nearestData = sorted[0];

    setNearestList(sorted.slice(0, 3).map((d) => ({ centre: d.centre, distance: d.distance })));

    if (onNearestChange) {
      onNearestChange(nearestData.centre, nearestData.distance);
    }

    const map = mapRef.current;
    const layerGroup = markersLayerRef.current;

    layerGroup.clearLayers();

    const userMarker = L.marker([location.lat, location.lng], { icon: defaultIcon })
      .addTo(layerGroup)
      .bindPopup('Your location');

    map.setView([location.lat, location.lng], 13, { animate: true });

    const distanceMap = new Map(distances.map((item) => [item.centre.id, item.distance]));
    const activeCentreId = selectedCentreId || nearestData.centre.id;
    const activeCentre = centres.find((centre) => centre.id === activeCentreId) || nearestData.centre;
    const highlightedRestaurants = restaurants
      .filter((restaurant) => restaurant.ngoId === activeCentre.id)
      .map((restaurant) => ({
        ...restaurant,
        selectedNgoDistanceKm: haversine(activeCentre.lat, activeCentre.lng, restaurant.lat, restaurant.lng)
      }))
      .sort((a, b) => a.selectedNgoDistanceKm - b.selectedNgoDistanceKm)
      .slice(0, 3);

    const createPinIcon = (className, accent = "#17d7e3") =>
      L.divIcon({
        className: `map-pin ${className}`,
        html: `<span style="--pin-color:${accent}"></span>`,
        iconSize: [24, 24],
        iconAnchor: [12, 12]
      });

    const ngoIcon = createPinIcon("map-pin-ngo", "#8da1c4");
    const activeNgoIcon = createPinIcon("map-pin-ngo-active", "#6e63ff");
    const restaurantActiveIcon = createPinIcon("map-pin-restaurant-active", "#2ee59d");

    centres.forEach((centre) => {
      const isNearest = nearestData.centre.id === centre.id;
      const isActive = activeCentreId === centre.id;
      const marker = L.marker([centre.lat, centre.lng], {
        icon: isActive ? activeNgoIcon : ngoIcon
      }).addTo(layerGroup);

      const popupHtml = `
        <div class="popup-content">
          <h4 style="margin:0 0 8px 0;color:#6e63ff;">${centre.name}</h4>
          <p style="margin:4px 0;font-size:12px;">Address: ${centre.address}</p>
          <p style="margin:4px 0;font-size:12px;">Capacity: ${centre.capacity} meals</p>
          ${typeof centre.wasteKgPerDay === 'number' ? `<p style="margin:4px 0;font-size:12px;">Estimated waste: ${centre.wasteKgPerDay.toFixed(1)} kg/day</p>` : ''}
          ${typeof centre.predictedSurplusMeals === 'number' ? `<p style="margin:4px 0;font-size:12px;">Predicted surplus: ${centre.predictedSurplusMeals} meals/day</p>` : ''}
          ${isNearest ? '<p style="margin:8px 0;color:#17d7e3;font-weight:bold;">Nearest NGO partner</p>' : ''}
        </div>
      `;

      marker.bindPopup(popupHtml);

      marker.on("click", () => {
        if (onCentreSelect) {
          onCentreSelect(centre, distanceMap.get(centre.id) || 0);
        }
      });

      if (isActive) {
        marker.openPopup();
      }
    });

    highlightedRestaurants.forEach((restaurant) => {
      const marker = L.marker([restaurant.lat, restaurant.lng], {
        icon: restaurantActiveIcon
      }).addTo(layerGroup);

      const popupHtml = `
        <div class="popup-content popup-restaurant">
          <h4 style="margin:0 0 8px 0;color:#17d7e3;">${restaurant.name}</h4>
          <p style="margin:4px 0;font-size:12px;">Area: ${restaurant.area}</p>
          <p style="margin:4px 0;font-size:12px;">Supporting NGO: ${activeCentre.name}</p>
          <p style="margin:4px 0;font-size:12px;">Projected surplus: ${restaurant.surplusMeals} meals/day</p>
          <p style="margin:4px 0;font-size:12px;">Possible waste: ${restaurant.wasteKg.toFixed(1)} kg/day</p>
          <p style="margin:4px 0;font-size:12px;">Methane risk: ${restaurant.methaneRiskKgCO2e.toFixed(1)} kg CO2e/day</p>
        </div>
      `;

      marker.bindPopup(popupHtml, {
        closeButton: false,
        autoClose: false,
        closeOnClick: false,
        className: 'restaurant-popup'
      });

      marker.on('mouseover', () => marker.openPopup());
      marker.on('mouseout', () => marker.closePopup());
    });

    if (!selectedCentreId) {
      userMarker.openPopup();
    }
    // expose nearest list for overlay
    // (already set via setNearestList above)
  }, [location, centres, restaurants, selectedCentreId, onNearestChange, onCentreSelect, mapReady]);

  return (
    <div className="map-container">
      <div className="map-overlay">
        <h4>Select an NGO near you</h4>
        <div className="nearby-list">
          {nearestList.map((n) => (
            <button
              key={n.centre.id}
              className="nearby-item"
              onClick={() => {
                if (onCentreSelect) onCentreSelect(n.centre, n.distance);
                // center map
                if (mapRef.current) mapRef.current.setView([n.centre.lat, n.centre.lng], 14, { animate: true });
              }}
            >
              <div className="name">{n.centre.name}</div>
              <div className="dist">{n.distance.toFixed(1)} km</div>
            </button>
          ))}
        </div>
      </div>
      <div ref={mapContainerRef} className="leaflet-map" />
      {loading && <div className="map-loading">Detecting your location...</div>}
      {!loading && !location && <div className="map-error">Unable to load map. Please refresh.</div>}
      {error && !loading && <div className="map-notice">{error}</div>}
    </div>
  );
}
