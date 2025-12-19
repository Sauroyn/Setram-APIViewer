import { useEffect, useState } from 'react';
import MapComponent from './MapComponent';
import VehicleSidebar from './VehicleSidebar';
import { fetchVehiclePositions, fetchTripUpdates, mergeVehicleData } from './gtfsService';
import type { Vehicle } from './types';

function App() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
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
        
        // Garder les véhicules existants s'ils sont toujours présents
        prevVehicles.forEach((prevVehicle) => {
          if (vehicleMap.has(prevVehicle.id)) {
            updatedVehicles.push(vehicleMap.get(prevVehicle.id)!);
            vehicleMap.delete(prevVehicle.id);
          }
        });
        
        // Ajouter les nouveaux véhicules
        vehicleMap.forEach((vehicle) => {
          updatedVehicles.push(vehicle);
        });
        
        return updatedVehicles;
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
        <div className="fixed top-20 left-1/2 transform -translate-x-1/2 bg-white px-4 py-2 rounded-lg shadow-lg z-50">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            <span className="text-sm text-gray-700">Chargement des véhicules...</span>
          </div>
        </div>
      )}

      {/* Message d'erreur */}
      {error && (
        <div className="fixed top-20 left-1/2 transform -translate-x-1/2 bg-red-500 text-white px-4 py-2 rounded-lg shadow-lg z-50">
          <p className="text-sm">{error}</p>
        </div>
      )}

      {/* Compteur de véhicules */}
      {!isLoading && !error && (
        <div className="fixed bottom-4 right-4 bg-white px-4 py-2 rounded-lg shadow-lg z-40">
          <p className="text-sm text-gray-700">
            <span className="font-bold text-blue-600">{vehicles.length}</span> véhicule
            {vehicles.length > 1 ? 's' : ''} en circulation
          </p>
        </div>
      )}
    </div>
  );
}

export default App;

