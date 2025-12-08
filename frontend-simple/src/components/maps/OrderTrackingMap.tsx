'use client';

import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

// Configurar token de Mapbox (usar variable de entorno o token público de desarrollo)
const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || 'pk.eyJ1IjoiY2FybmVzLXByZW1pdW0iLCJhIjoiY2xiMTIzNDU2In0.demo-token';

mapboxgl.accessToken = MAPBOX_TOKEN;

export interface MapMarker {
  id: string;
  longitude: number;
  latitude: number;
  type: 'driver' | 'destination' | 'origin';
  label?: string;
}

interface OrderTrackingMapProps {
  markers: MapMarker[];
  center?: [number, number];
  zoom?: number;
  onMapLoad?: (map: mapboxgl.Map) => void;
  showRoute?: boolean;
  routeCoordinates?: [number, number][];
}

export default function OrderTrackingMap({
  markers,
  center,
  zoom = 13,
  onMapLoad,
  showRoute = false,
  routeCoordinates = []
}: OrderTrackingMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<{ [key: string]: mapboxgl.Marker }>({});
  const [mapLoaded, setMapLoaded] = useState(false);

  // Calcular centro automático si no se proporciona
  const calculateCenter = (): [number, number] => {
    if (center) return center;
    if (markers.length === 0) return [-74.5, 40]; // NYC default
    
    const lngs = markers.map(m => m.longitude);
    const lats = markers.map(m => m.latitude);
    return [
      (Math.min(...lngs) + Math.max(...lngs)) / 2,
      (Math.min(...lats) + Math.max(...lats)) / 2
    ];
  };

  // Inicializar mapa
  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    const mapCenter = calculateCenter();

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: mapCenter,
      zoom: zoom
    });

    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');
    map.current.addControl(
      new mapboxgl.GeolocateControl({
        positionOptions: {
          enableHighAccuracy: true
        },
        trackUserLocation: true
      }),
      'top-right'
    );

    map.current.on('load', () => {
      setMapLoaded(true);
      if (onMapLoad && map.current) {
        onMapLoad(map.current);
      }
    });

    return () => {
      map.current?.remove();
      map.current = null;
    };
  }, []);

  // Actualizar marcadores
  useEffect(() => {
    if (!map.current || !mapLoaded) return;

    // Remover marcadores antiguos
    Object.values(markersRef.current).forEach(marker => marker.remove());
    markersRef.current = {};

    // Agregar nuevos marcadores
    markers.forEach(markerData => {
      const el = document.createElement('div');
      el.className = 'custom-marker';
      el.style.width = '40px';
      el.style.height = '40px';
      el.style.borderRadius = '50%';
      el.style.display = 'flex';
      el.style.alignItems = 'center';
      el.style.justifyContent = 'center';
      el.style.fontSize = '20px';
      el.style.cursor = 'pointer';
      el.style.boxShadow = '0 2px 8px rgba(0,0,0,0.3)';

      // Personalizar según el tipo
      if (markerData.type === 'driver') {
        el.style.backgroundColor = '#3B82F6';
        el.innerHTML = '🚗';
        el.title = 'Repartidor';
      } else if (markerData.type === 'destination') {
        el.style.backgroundColor = '#10B981';
        el.innerHTML = '📍';
        el.title = 'Destino';
      } else if (markerData.type === 'origin') {
        el.style.backgroundColor = '#F59E0B';
        el.innerHTML = '🏪';
        el.title = 'Origen';
      }

      const marker = new mapboxgl.Marker(el)
        .setLngLat([markerData.longitude, markerData.latitude])
        .addTo(map.current!);

      if (markerData.label) {
        const popup = new mapboxgl.Popup({ offset: 25 })
          .setText(markerData.label);
        marker.setPopup(popup);
      }

      markersRef.current[markerData.id] = marker;
    });

    // Ajustar vista para mostrar todos los marcadores
    if (markers.length > 0) {
      const bounds = new mapboxgl.LngLatBounds();
      markers.forEach(marker => {
        bounds.extend([marker.longitude, marker.latitude]);
      });
      map.current.fitBounds(bounds, { padding: 50, maxZoom: 15 });
    }
  }, [markers, mapLoaded]);

  // Dibujar ruta
  useEffect(() => {
    if (!map.current || !mapLoaded || !showRoute) return;

    if (routeCoordinates.length > 1) {
      // Agregar o actualizar capa de ruta
      if (map.current.getSource('route')) {
        (map.current.getSource('route') as mapboxgl.GeoJSONSource).setData({
          type: 'Feature',
          properties: {},
          geometry: {
            type: 'LineString',
            coordinates: routeCoordinates
          }
        });
      } else {
        map.current.addSource('route', {
          type: 'geojson',
          data: {
            type: 'Feature',
            properties: {},
            geometry: {
              type: 'LineString',
              coordinates: routeCoordinates
            }
          }
        });

        map.current.addLayer({
          id: 'route',
          type: 'line',
          source: 'route',
          layout: {
            'line-join': 'round',
            'line-cap': 'round'
          },
          paint: {
            'line-color': '#3B82F6',
            'line-width': 4,
            'line-opacity': 0.75
          }
        });
      }
    }
  }, [routeCoordinates, showRoute, mapLoaded]);

  return (
    <div className="relative w-full h-full">
      <div 
        ref={mapContainer} 
        className="w-full h-full rounded-lg"
        style={{ minHeight: '400px' }}
      />
      
      {/* Leyenda */}
      <div className="absolute bottom-4 left-4 bg-white rounded-lg shadow-lg p-3 text-sm">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs">
            🚗
          </div>
          <span>Repartidor</span>
        </div>
        <div className="flex items-center gap-2 mb-2">
          <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center text-white text-xs">
            📍
          </div>
          <span>Tu dirección</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-amber-500 flex items-center justify-center text-white text-xs">
            🏪
          </div>
          <span>Tienda</span>
        </div>
      </div>
    </div>
  );
}
