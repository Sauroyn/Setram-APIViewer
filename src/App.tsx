import { useEffect, useState, useCallback } from 'react';
import { Spin, Card, Text, ThemeProvider } from '@gravity-ui/uikit';
import MapComponent from './MapComponent';
import VehicleSidebar from './VehicleSidebar';
import { fetchVehiclePositions, fetchTripUpdates, mergeVehicleData } from './gtfsService';
import type { Vehicle } from './types';
import { useTheme } from './useTheme';

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
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [updatedCount, setUpdatedCount] = useState<number>(0);
  const { theme, toggleTheme } = useTheme();

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
        let updateCount = 0;
        
        // Traiter les véhicules précédents
        prevVehicles.forEach((prevVehicle) => {
          if (vehicleMap.has(prevVehicle.id)) {
            // Le véhicule est présent dans la nouvelle mise à jour -> on prend la nouvelle version
            const newVehicle = vehicleMap.get(prevVehicle.id)!;
            updatedVehicles.push(newVehicle);
            // Compter seulement si la position a changé
            if (prevVehicle.latitude !== newVehicle.latitude || prevVehicle.longitude !== newVehicle.longitude) {
              updateCount++;
            }
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
          updateCount++; // Nouveau véhicule = mis à jour
        });
        
        // Mettre à jour les stats
        setLastUpdate(new Date());
        setUpdatedCount(updateCount);
        
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

  // Utiliser useCallback pour éviter de recréer la fonction à chaque render
  const handleThemeToggle = useCallback(() => {
    toggleTheme();
  }, [toggleTheme]);

  return (
    <ThemeProvider theme={theme}>
      <div className="g-root w-screen h-screen relative" style={{ 
        backgroundColor: 'var(--g-color-base-background)',
        color: 'var(--g-color-text-primary)'
      }}>
        {/* Carte */}
        <MapComponent
          vehicles={vehicles}
          vehicleHistory={vehicleHistory}
          selectedVehicleId={selectedVehicleId}
          onVehicleClick={handleVehicleClick}
          theme={theme}
          onThemeToggle={handleThemeToggle}
        />

        {/* Sidebar */}
        <VehicleSidebar
          vehicles={vehicles}
          isOpen={isSidebarOpen}
          onToggle={() => setIsSidebarOpen(!isSidebarOpen)}
          onVehicleSelect={handleVehicleSelect}
          onVehicleSelectMobile={() => setIsSidebarOpen(false)}
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
            zIndex: 100,
            padding: '12px 16px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            minWidth: '200px',
            backgroundColor: 'var(--g-color-base-background)',
            borderColor: 'var(--g-color-line-generic)'
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <Text variant="body-2">
              <span style={{ fontWeight: 600, color: 'var(--g-color-text-brand)' }}>
                {vehicles.length}
              </span>
              {' '}véhicule{vehicles.length > 1 ? 's' : ''} en circulation
            </Text>
            {updatedCount > 0 && (
              <Text variant="caption-2" color="secondary">
                {updatedCount} mis à jour
              </Text>
            )}
            {lastUpdate && (
              <Text variant="caption-2" color="hint">
                Dernier refresh: {lastUpdate.toLocaleTimeString('fr-FR')}
              </Text>
            )}
          </div>
        </Card>
      )}
      </div>
    </ThemeProvider>
  );
}

export default App;

