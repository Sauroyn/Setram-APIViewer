import { useEffect, useState } from 'react';
import { Spin, Card, Text } from '@gravity-ui/uikit';
import MapComponent from './MapComponent';
import VehicleSidebar from './VehicleSidebar';
import { fetchVehiclePositions, fetchTripUpdates, mergeVehicleData } from './gtfsService';
import type { Vehicle } from './types';

// Type pour stocker l'historique des positions
export interface VehiclePosition {
  latitude: number;
  longitude: number;
  timestamp: number;
}

export interface VehicleHistory {
  [vehicleId: string]: VehiclePosition[];
}

function App() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [vehicleHistory, setVehicleHistory] = useState<VehicleHistory>({});
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fonction pour récupérer les données
  const fetchData = async () => {
    try {
      setError(null);
      const [vehiclePositions, tripUpdates] = await Promise.all([
        fetchVehiclePositions(),
        fetchTripUpdates(),
      ]);

      const mergedVehicles = mergeVehicleData(vehiclePositions, tripUpdates);
      
      // Mise à jour intelligente: garder les véhicules existants et mettre à jour seulement ceux qui ont changé
      setVehicles((prevVehicles) => {
        const vehicleMap = new Map(mergedVehicles.map((v) => [v.id, v]));
        const updatedVehicles: Vehicle[] = [];
        const now = Date.now() / 1000; // Timestamp actuel en secondes
        const MAX_AGE = 300; // 5 minutes en secondes
        
        // Traiter les véhicules précédents
        prevVehicles.forEach((prevVehicle) => {
          if (vehicleMap.has(prevVehicle.id)) {
            // Le véhicule est présent dans la nouvelle mise à jour -> on prend la nouvelle version
            updatedVehicles.push(vehicleMap.get(prevVehicle.id)!);
            vehicleMap.delete(prevVehicle.id);
          } else {
            // Le véhicule n'est PAS dans la nouvelle mise à jour
            // On le garde SEULEMENT s'il n'est pas trop vieux (pour éviter les fantômes)
            if (now - prevVehicle.timestamp < MAX_AGE) {
              updatedVehicles.push(prevVehicle);
            }
          }
        });
        
        // Ajouter les NOUVEAUX véhicules qui n'étaient pas là avant
        vehicleMap.forEach((vehicle) => {
          updatedVehicles.push(vehicle);
        });
        
        return updatedVehicles;
      });

      // Mise à jour de l'historique des positions
      setVehicleHistory((prevHistory) => {
        const newHistory = { ...prevHistory };
        const MAX_HISTORY_POINTS = 50; // Maximum 50 points par véhicule
        const MAX_HISTORY_AGE = 3600; // Garder l'historique pendant 1 heure (en secondes)
        const now = Date.now() / 1000;

        mergedVehicles.forEach((vehicle) => {
          // Créer un nouveau point de position
          const newPosition: VehiclePosition = {
            latitude: vehicle.latitude,
            longitude: vehicle.longitude,
            timestamp: vehicle.timestamp,
          };

          // Initialiser l'historique si nécessaire
          if (!newHistory[vehicle.id]) {
            newHistory[vehicle.id] = [];
          }

          // Vérifier si cette position est différente de la dernière enregistrée
          const lastPosition = newHistory[vehicle.id][newHistory[vehicle.id].length - 1];
          const isDifferent = !lastPosition || 
            lastPosition.latitude !== newPosition.latitude || 
            lastPosition.longitude !== newPosition.longitude;

          if (isDifferent) {
            // Ajouter la nouvelle position
            newHistory[vehicle.id] = [...newHistory[vehicle.id], newPosition];

            // Limiter le nombre de points
            if (newHistory[vehicle.id].length > MAX_HISTORY_POINTS) {
              newHistory[vehicle.id] = newHistory[vehicle.id].slice(-MAX_HISTORY_POINTS);
            }
          }

          // Nettoyer les vieux points
          newHistory[vehicle.id] = newHistory[vehicle.id].filter(
            (pos) => now - pos.timestamp < MAX_HISTORY_AGE
          );
        });

        // Nettoyer l'historique des véhicules qui n'existent plus
        const currentVehicleIds = new Set(mergedVehicles.map((v) => v.id));
        Object.keys(newHistory).forEach((vehicleId) => {
          if (!currentVehicleIds.has(vehicleId)) {
            // Garder l'historique pendant un certain temps même si le véhicule n'est plus actif
            const lastPosition = newHistory[vehicleId][newHistory[vehicleId].length - 1];
            if (lastPosition && now - lastPosition.timestamp > MAX_HISTORY_AGE) {
              delete newHistory[vehicleId];
            }
          }
        });

        return newHistory;
      });
      
      setIsLoading(false);
    } catch (err) {
      console.error('Erreur lors de la récupération des données:', err);
      setError('Impossible de récupérer les données des véhicules');
      setIsLoading(false);
    }
  };

  // Récupérer les données au chargement et toutes les 10 secondes
  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleVehicleSelect = (vehicleId: string) => {
    setSelectedVehicleId(vehicleId);
  };

  const handleVehicleClick = (vehicle: Vehicle) => {
    setSelectedVehicleId(vehicle.id);
  };

  return (
    <div className="w-screen h-screen relative">
      {/* Carte */}
      <MapComponent
        vehicles={vehicles}
        vehicleHistory={vehicleHistory}
        selectedVehicleId={selectedVehicleId}
        onVehicleClick={handleVehicleClick}
      />

      {/* Sidebar */}
      <VehicleSidebar
        vehicles={vehicles}
        isOpen={isSidebarOpen}
        onToggle={() => setIsSidebarOpen(!isSidebarOpen)}
        onVehicleSelect={handleVehicleSelect}
      />

      {/* Indicateur de chargement */}
      {isLoading && (
        <Card
          view="filled"
          style={{
            position: 'fixed',
            top: '80px',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 50,
            padding: '16px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
          }}
        >
          <Spin size="m" />
          <Text variant="body-2">Chargement des véhicules...</Text>
        </Card>
      )}

      {/* Message d'erreur */}
      {error && (
        <Card
          view="filled"
          style={{
            position: 'fixed',
            top: '80px',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 50,
            padding: '16px',
            backgroundColor: 'var(--g-color-base-danger)',
            color: 'white',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
          }}
        >
          <Text variant="body-2" style={{ color: 'white' }}>{error}</Text>
        </Card>
      )}

      {/* Compteur de véhicules */}
      {!isLoading && !error && (
        <Card
          view="outlined"
          style={{
            position: 'fixed',
            bottom: '16px',
            right: '16px',
            zIndex: 40,
            padding: '12px 16px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
          }}
        >
          <Text variant="body-2">
            <span style={{ fontWeight: 600, color: 'var(--g-color-text-brand)' }}>
              {vehicles.length}
            </span>
            {' '}véhicule{vehicles.length > 1 ? 's' : ''} en circulation
          </Text>
        </Card>
      )}
    </div>
  );
}

export default App;

