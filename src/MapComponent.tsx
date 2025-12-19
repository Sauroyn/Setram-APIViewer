import { useEffect, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import type { Vehicle } from './types';

interface MapComponentProps {
  vehicles: Vehicle[];
  selectedVehicleId: string | null;
  onVehicleClick: (vehicle: Vehicle) => void;
}

export default function MapComponent({
  vehicles,
  selectedVehicleId,
  onVehicleClick,
}: MapComponentProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const markers = useRef<Map<string, maplibregl.Marker>>(new Map());
  const [mapLoaded, setMapLoaded] = useState(false);

  // Initialiser la carte
  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    map.current = new maplibregl.Map({
      container: mapContainer.current,
      style: 'https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json',
      center: [0.1991, 48.0061], // Centre sur Le Mans
      zoom: 12,
    });

    map.current.addControl(new maplibregl.NavigationControl(), 'top-right');

    map.current.on('load', () => {
      setMapLoaded(true);
    });

    return () => {
      map.current?.remove();
      map.current = null;
    };
  }, []);

  // Mettre à jour les marqueurs des véhicules
  useEffect(() => {
    if (!map.current || !mapLoaded) return;

    const currentVehicleIds = new Set(vehicles.map((v) => v.id));

    // Supprimer les marqueurs des véhicules qui n'existent plus
      markers.current.forEach((marker: maplibregl.Marker, id: string) => {
      if (!currentVehicleIds.has(id)) {
        marker.remove();
        markers.current.delete(id);
      }
    });

    // Ajouter ou mettre à jour les marqueurs
    vehicles.forEach((vehicle) => {
      let marker = markers.current.get(vehicle.id);

      if (!marker) {
        // Créer un nouveau marqueur
        const el = document.createElement('div');
        el.className = 'vehicle-marker';
        el.innerHTML = `
          <div class="w-8 h-8 bg-blue-600 rounded-full border-2 border-white shadow-lg flex items-center justify-center cursor-pointer hover:bg-blue-700 transition-colors">
            <svg class="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path d="M8 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM15 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z"/>
              <path d="M3 4a1 1 0 00-1 1v10a1 1 0 001 1h1.05a2.5 2.5 0 014.9 0H10a1 1 0 001-1V5a1 1 0 00-1-1H3z"/>
            </svg>
          </div>
        `;

        marker = new maplibregl.Marker({ element: el })
          .setLngLat([vehicle.longitude, vehicle.latitude]);

        // Créer une popup
        const popup = new maplibregl.Popup({ offset: 25 }).setHTML(`
          <div class="p-2">
            <h3 class="font-bold text-sm mb-1">Véhicule ${vehicle.label || vehicle.id}</h3>
            <div class="text-xs space-y-0.5">
              ${vehicle.routeId ? `<p><strong>Ligne:</strong> ${vehicle.routeId}</p>` : ''}
              ${vehicle.tripId ? `<p><strong>Trajet:</strong> ${vehicle.tripId}</p>` : ''}
              ${vehicle.speed !== undefined ? `<p><strong>Vitesse:</strong> ${Math.round(vehicle.speed * 3.6)} km/h</p>` : ''}
              ${vehicle.bearing !== undefined ? `<p><strong>Direction:</strong> ${Math.round(vehicle.bearing)}°</p>` : ''}
              <p><strong>Position:</strong> ${vehicle.latitude.toFixed(5)}, ${vehicle.longitude.toFixed(5)}</p>
            </div>
          </div>
        `);

        marker.setPopup(popup);

        el.addEventListener('click', () => {
          onVehicleClick(vehicle);
        });

        marker.addTo(map.current!);
        markers.current.set(vehicle.id, marker);
      } else {
        // Mettre à jour la position du marqueur existant
        marker.setLngLat([vehicle.longitude, vehicle.latitude]);

        // Mettre à jour la popup
        const popup = marker.getPopup();
        if (popup) {
          popup.setHTML(`
            <div class="p-2">
              <h3 class="font-bold text-sm mb-1">Véhicule ${vehicle.label || vehicle.id}</h3>
              <div class="text-xs space-y-0.5">
                ${vehicle.routeId ? `<p><strong>Ligne:</strong> ${vehicle.routeId}</p>` : ''}
                ${vehicle.tripId ? `<p><strong>Trajet:</strong> ${vehicle.tripId}</p>` : ''}
                ${vehicle.speed !== undefined ? `<p><strong>Vitesse:</strong> ${Math.round(vehicle.speed * 3.6)} km/h</p>` : ''}
                ${vehicle.bearing !== undefined ? `<p><strong>Direction:</strong> ${Math.round(vehicle.bearing)}°</p>` : ''}
                <p><strong>Position:</strong> ${vehicle.latitude.toFixed(5)}, ${vehicle.longitude.toFixed(5)}</p>
              </div>
            </div>
          `);
        }
      }
    });
  }, [vehicles, mapLoaded, onVehicleClick]);

  // Centrer sur un véhicule sélectionné
  useEffect(() => {
    if (!map.current || !selectedVehicleId) return;

    const vehicle = vehicles.find((v) => v.id === selectedVehicleId);
    if (vehicle) {
      map.current.flyTo({
        center: [vehicle.longitude, vehicle.latitude],
        zoom: 16,
        duration: 1000,
      });

      // Ouvrir la popup du marqueur
      const marker = markers.current.get(vehicle.id);
      if (marker) {
        marker.togglePopup();
      }
    }
  }, [selectedVehicleId, vehicles]);

  return (
    <div ref={mapContainer} className="w-full h-full" />
  );
}
