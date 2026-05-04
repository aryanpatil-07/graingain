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

const nearestIcon = L.icon({
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconSize: [30, 46],
  iconAnchor: [15, 46],
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
  onNearestChange,
  onLocationChange
}) {
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const markersLayerRef = useRef(null);
  const [location, setLocation] = useState(userLocation || null);
  const [loading, setLoading] = useState(!userLocation);
  const [error, setError] = useState(null);
  const [mapReady, setMapReady] = useState(false);

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

    const nearestData = distances.reduce((best, curr) =>
      curr.distance < best.distance ? curr : best
    );

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

    centres.forEach((centre) => {
      const isNearest = nearestData.centre.id === centre.id;
      const marker = L.marker([centre.lat, centre.lng], {
        icon: isNearest ? nearestIcon : defaultIcon
      }).addTo(layerGroup);

      const popupHtml = `
        <div class="popup-content">
          <h4 style="margin:0 0 8px 0;color:#2f7a36;">${centre.name}</h4>
          <p style="margin:4px 0;font-size:12px;">📍 ${centre.address}</p>
          <p style="margin:4px 0;font-size:12px;">🚚 Capacity: ${centre.capacity} meals</p>
          ${typeof centre.wasteKgPerDay === 'number' ? `<p style="margin:4px 0;font-size:12px;">♻️ AI waste estimate: ${centre.wasteKgPerDay.toFixed(1)} kg/day</p>` : ''}
          ${typeof centre.predictedSurplusMeals === 'number' ? `<p style="margin:4px 0;font-size:12px;">🥘 Predicted surplus: ${centre.predictedSurplusMeals} meals/day</p>` : ''}
          ${isNearest ? '<p style="margin:8px 0;color:#2f7a36;font-weight:bold;">✓ Nearest centre</p>' : ''}
        </div>
      `;

      marker.bindPopup(popupHtml);

      if (isNearest) {
        marker.openPopup();
      }
    });

    userMarker.openPopup();
  }, [location, centres, onNearestChange, mapReady]);

  return (
    <div className="map-container">
      <div ref={mapContainerRef} className="leaflet-map" />
      {loading && <div className="map-loading">📍 Detecting your location...</div>}
      {!loading && !location && <div className="map-error">Unable to load map. Please refresh.</div>}
      {error && !loading && <div className="map-notice">{error}</div>}
    </div>
  );
}
