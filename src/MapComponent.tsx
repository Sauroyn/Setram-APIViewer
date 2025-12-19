import { useEffect, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import type { Vehicle } from './types';
import type { VehicleHistory } from './App';
import { getLineInfo } from './utils';

interface MapComponentProps {
  vehicles: Vehicle[];
  vehicleHistory: VehicleHistory;
  selectedVehicleId: string | null;
  onVehicleClick: (vehicle: Vehicle) => void;
}

export default function MapComponent({
  vehicles,
  vehicleHistory,
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
      const { color, text } = getLineInfo(vehicle.routeId);

      if (!marker) {
        // Créer un nouveau marqueur
        const el = document.createElement('div');
        el.className = 'vehicle-marker';
        el.innerHTML = `
          <div style="background-color: ${color}; border: 2px solid white; color: white; padding: 8px;" class="w-10 h-10 rounded-full shadow-lg flex items-center justify-center cursor-pointer hover:opacity-90 transition-opacity transform hover:scale-110 flex-shrink-0 box-border">
            <span style="color: white;" class="font-bold text-xs leading-none">${text}</span>
          </div>
        `;

        marker = new maplibregl.Marker({ element: el })
          .setLngLat([vehicle.longitude, vehicle.latitude]);

        // Créer une popup
        const popupContent = `
          <div class="p-2 min-w-[200px] max-h-[300px] overflow-y-auto">
            <div class="flex items-center gap-2 mb-3 pb-2 border-b border-gray-200">
              <div style="background-color: ${color};" class="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold shadow-sm">
                ${text}
              </div>
              <div>
                <h3 class="font-bold text-base">Véhicule ${vehicle.label || vehicle.id}</h3>
                <p class="text-xs text-gray-500">ID: ${vehicle.id}</p>
              </div>
            </div>
            
            <div class="space-y-2 text-sm">
              <div class="grid grid-cols-2 gap-x-2 gap-y-1">
                <div class="text-gray-600">Ligne:</div>
                <div class="font-medium">${vehicle.routeId || 'N/A'}</div>
                
                <div class="text-gray-600">Trajet:</div>
                <div class="font-medium truncate" title="${vehicle.tripId}">${vehicle.tripId || 'N/A'}</div>
                
                <div class="text-gray-600">Vitesse:</div>
                <div class="font-medium">${vehicle.speed !== undefined ? `${Math.round(vehicle.speed * 3.6)} km/h` : 'N/A'}</div>
                
                <div class="text-gray-600">Direction:</div>
                <div class="font-medium">${vehicle.bearing !== undefined ? `${Math.round(vehicle.bearing)}°` : 'N/A'}</div>
                
                <div class="text-gray-600">Retard:</div>
                <div class="font-medium">
                  ${vehicle.delay !== undefined 
                    ? `<span class="${vehicle.delay > 60 ? 'text-red-600' : 'text-green-600'}">${Math.round(vehicle.delay / 60)} min</span>` 
                    : 'N/A'}
                </div>
                
                <div class="text-gray-600">Statut:</div>
                <div class="font-medium">${vehicle.currentStatus || 'N/A'}</div>
                
                <div class="text-gray-600">Arrêt:</div>
                <div class="font-medium truncate" title="${vehicle.stopId}">${vehicle.stopId || 'N/A'}</div>
                
                <div class="text-gray-600">Seq. arrêt:</div>
                <div class="font-medium">${vehicle.currentStopSequence || 'N/A'}</div>
              </div>
              
              <div class="pt-2 mt-2 border-t border-gray-100 text-xs text-gray-400">
                <div>Lat: ${vehicle.latitude.toFixed(5)}</div>
                <div>Lon: ${vehicle.longitude.toFixed(5)}</div>
                <div>MàJ: ${new Date(vehicle.timestamp * 1000).toLocaleTimeString()}</div>
              </div>
            </div>
          </div>
        `;

        const popup = new maplibregl.Popup({ offset: 25, maxWidth: '300px' }).setHTML(popupContent);

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
          const popupContent = `
            <div class="p-2 min-w-[200px] max-h-[300px] overflow-y-auto">
              <div class="flex items-center gap-2 mb-3 pb-2 border-b border-gray-200">
                <div style="background-color: ${color};" class="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold shadow-sm">
                  ${text}
                </div>
                <div>
                  <h3 class="font-bold text-base">Véhicule ${vehicle.label || vehicle.id}</h3>
                  <p class="text-xs text-gray-500">ID: ${vehicle.id}</p>
                </div>
              </div>
              
              <div class="space-y-2 text-sm">
                <div class="grid grid-cols-2 gap-x-2 gap-y-1">
                  <div class="text-gray-600">Ligne:</div>
                  <div class="font-medium">${vehicle.routeId || 'N/A'}</div>
                  
                  <div class="text-gray-600">Trajet:</div>
                  <div class="font-medium truncate" title="${vehicle.tripId}">${vehicle.tripId || 'N/A'}</div>
                  
                  <div class="text-gray-600">Vitesse:</div>
                  <div class="font-medium">${vehicle.speed !== undefined ? `${Math.round(vehicle.speed * 3.6)} km/h` : 'N/A'}</div>
                  
                  <div class="text-gray-600">Direction:</div>
                  <div class="font-medium">${vehicle.bearing !== undefined ? `${Math.round(vehicle.bearing)}°` : 'N/A'}</div>
                  
                  <div class="text-gray-600">Retard:</div>
                  <div class="font-medium">
                    ${vehicle.delay !== undefined 
                      ? `<span class="${vehicle.delay > 60 ? 'text-red-600' : 'text-green-600'}">${Math.round(vehicle.delay / 60)} min</span>` 
                      : 'N/A'}
                  </div>
                  
                  <div class="text-gray-600">Statut:</div>
                  <div class="font-medium">${vehicle.currentStatus || 'N/A'}</div>
                  
                  <div class="text-gray-600">Arrêt:</div>
                  <div class="font-medium truncate" title="${vehicle.stopId}">${vehicle.stopId || 'N/A'}</div>
                  
                  <div class="text-gray-600">Seq. arrêt:</div>
                  <div class="font-medium">${vehicle.currentStopSequence || 'N/A'}</div>
                </div>
                
                <div class="pt-2 mt-2 border-t border-gray-100 text-xs text-gray-400">
                  <div>Lat: ${vehicle.latitude.toFixed(5)}</div>
                  <div>Lon: ${vehicle.longitude.toFixed(5)}</div>
                  <div>MàJ: ${new Date(vehicle.timestamp * 1000).toLocaleTimeString()}</div>
                </div>
              </div>
            </div>
          `;
          popup.setHTML(popupContent);
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
        // On s'assure que la popup est ouverte
        if (!marker.getPopup().isOpen()) {
          marker.togglePopup();
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedVehicleId]);

  // Afficher le trajet du véhicule sélectionné
  useEffect(() => {
    if (!map.current || !mapLoaded) return;

    const sourceId = 'vehicle-path';
    const layerId = 'vehicle-path-layer';

    // Supprimer la couche et la source existantes
    if (map.current.getLayer(layerId)) {
      map.current.removeLayer(layerId);
    }
    if (map.current.getSource(sourceId)) {
      map.current.removeSource(sourceId);
    }

    // Si un véhicule est sélectionné et qu'il a un historique
    if (selectedVehicleId && vehicleHistory[selectedVehicleId]) {
      const history = vehicleHistory[selectedVehicleId];
      
      // Avoir au moins 2 points pour tracer une ligne
      if (history.length >= 2) {
        const vehicle = vehicles.find((v) => v.id === selectedVehicleId);
        const { color } = vehicle ? getLineInfo(vehicle.routeId) : { color: '#3B82F6' };

        // Créer les coordonnées pour la ligne
        const coordinates = history.map((pos) => [pos.longitude, pos.latitude]);

        // Ajouter la source
        map.current.addSource(sourceId, {
          type: 'geojson',
          data: {
            type: 'Feature',
            properties: {},
            geometry: {
              type: 'LineString',
              coordinates: coordinates,
            },
          },
        });

        // Ajouter la couche (ligne)
        map.current.addLayer({
          id: layerId,
          type: 'line',
          source: sourceId,
          layout: {
            'line-join': 'round',
            'line-cap': 'round',
          },
          paint: {
            'line-color': color,
            'line-width': 4,
            'line-opacity': 0.7,
          },
        });
      }
    }
  }, [selectedVehicleId, vehicleHistory, vehicles, mapLoaded]);

  return (
    <div ref={mapContainer} className="w-full h-full" />
  );
}
