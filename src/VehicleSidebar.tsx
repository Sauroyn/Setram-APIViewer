import type { Vehicle } from './types';
import { getLineInfo } from './utils';

interface VehicleSidebarProps {
  vehicles: Vehicle[];
  isOpen: boolean;
  onToggle: () => void;
  onVehicleSelect: (vehicleId: string) => void;
}

export default function VehicleSidebar({
  vehicles,
  isOpen,
  onToggle,
  onVehicleSelect,
}: VehicleSidebarProps) {
  const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp * 1000);
    return date.toLocaleTimeString('fr-FR');
  };

  // Grouper les véhicules par ligne
  const vehiclesByRoute = vehicles.reduce((acc, vehicle) => {
    const routeId = vehicle.routeId || 'unknown';
    if (!acc[routeId]) {
      acc[routeId] = [];
    }
    acc[routeId].push(vehicle);
    return acc;
  }, {} as Record<string, Vehicle[]>);

  // Trier les lignes
  const sortedRoutes = Object.keys(vehiclesByRoute).sort((a, b) => {
    if (a === 'unknown') return 1;
    if (b === 'unknown') return -1;
    return a.localeCompare(b, undefined, { numeric: true });
  });

  return (
    <>
      {/* Bouton toggle */}
      <button
        onClick={(e) => {
          console.log('Button clicked!', isOpen);
          e.stopPropagation();
          onToggle();
        }}
        className="fixed z-[1000] bg-white hover:bg-gray-50 text-gray-800 shadow-lg transition-all border border-gray-300"
        title={isOpen ? 'Fermer le panneau' : 'Ouvrir le panneau'}
        style={{ 
          position: 'fixed',
          top: '16px',
          left: '16px',
          zIndex: 1000,
          width: '40px',
          height: '40px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: '4px',
          border: '1px solid rgba(0,0,0,0.1)',
          cursor: 'pointer',
          boxShadow: '0 0 0 2px rgba(0,0,0,0.1)',
          backgroundColor: 'white'
        }}
      >
        <svg
          width="20"
          height="20"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          style={{ display: 'block' }}
        >
          {isOpen ? (
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          ) : (
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 6h16M4 12h16M4 18h16"
            />
          )}
        </svg>
      </button>

      {/* Panneau latéral */}
      <div
        className={`fixed top-0 left-0 h-full bg-white shadow-2xl transform transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        style={{ 
          width: '400px',
          zIndex: 999,
          position: 'fixed',
          top: 0,
          left: 0,
          height: '100%',
          transform: isOpen ? 'translateX(0)' : 'translateX(-100%)',
          boxShadow: '2px 0 10px rgba(0,0,0,0.3)'
        }}
      >
        <div className="h-full flex flex-col">
          {/* En-tête */}
          <div className="bg-blue-600 text-white p-4">
            <h2 className="text-xl font-bold">Véhicules SETRAM</h2>
            <p className="text-sm text-blue-100">
              {vehicles.length} véhicule{vehicles.length > 1 ? 's' : ''} en circulation
            </p>
          </div>

          {/* Liste des véhicules */}
          <div className="flex-1 overflow-y-auto">
            {vehicles.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                <p>Aucun véhicule en circulation</p>
              </div>
            ) : (
              <div>
                {sortedRoutes.map((routeId) => {
                  const routeVehicles = vehiclesByRoute[routeId];
                  const { color, text } = getLineInfo(routeId);
                  
                  return (
                    <div key={routeId} className="border-b border-gray-200">
                      {/* En-tête de ligne */}
                      <div 
                        style={{ backgroundColor: color }} 
                        className="px-4 py-3 text-white sticky top-0 z-10 shadow-sm"
                      >
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center font-bold text-sm">
                            {text}
                          </div>
                          <div>
                            <div className="font-bold">
                              {routeId === 'unknown' ? 'Ligne inconnue' : `Ligne ${routeId}`}
                            </div>
                            <div className="text-xs opacity-90">
                              {routeVehicles.length} véhicule{routeVehicles.length > 1 ? 's' : ''}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Véhicules de cette ligne */}
                      <div className="divide-y divide-gray-100">
                        {routeVehicles.map((vehicle) => (
                          <button
                            key={vehicle.id}
                            onClick={() => onVehicleSelect(vehicle.id)}
                            className="w-full p-4 hover:bg-blue-50 transition-colors text-left"
                          >
                            <div className="flex items-start gap-3">
                              {/* Icône de véhicule */}
                              <div 
                                style={{ backgroundColor: color, padding: '8px' }} 
                                className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 text-white font-bold text-xs border-2 border-white shadow-sm"
                              >
                                {text}
                              </div>

                              {/* Infos du véhicule */}
                              <div className="flex-1 min-w-0">
                                <div className="font-semibold text-gray-900 truncate">
                                  {vehicle.label || `Véhicule ${vehicle.id.substring(0, 8)}`}
                                </div>

                                <div className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1 text-xs">
                                  {/* Vitesse */}
                                  {vehicle.speed !== undefined && (
                                    <div className="flex items-center gap-1">
                                      <span className="text-gray-500">🚀</span>
                                      <span className="font-medium text-gray-700">
                                        {Math.round(vehicle.speed * 3.6)} km/h
                                      </span>
                                    </div>
                                  )}

                                  {/* Retard */}
                                  {vehicle.delay !== undefined && (
                                    <div className="flex items-center gap-1">
                                      <span className="text-gray-500">⏱️</span>
                                      <span 
                                        className={`font-medium ${
                                          vehicle.delay > 60 
                                            ? 'text-red-600' 
                                            : vehicle.delay < -60 
                                            ? 'text-green-600' 
                                            : 'text-gray-700'
                                        }`}
                                      >
                                        {vehicle.delay > 0 ? '+' : ''}{Math.round(vehicle.delay / 60)} min
                                      </span>
                                    </div>
                                  )}

                                  {/* Prochain arrêt */}
                                  {vehicle.stopId && (
                                    <div className="col-span-2 flex items-start gap-1 mt-1">
                                      <span className="text-gray-500 mt-0.5">📍</span>
                                      <div className="flex-1 min-w-0">
                                        <span className="text-gray-500">Arrêt: </span>
                                        <span className="font-medium text-gray-700 truncate block">
                                          {vehicle.stopId}
                                        </span>
                                      </div>
                                    </div>
                                  )}

                                  {/* Statut */}
                                  {vehicle.currentStatus && (
                                    <div className="col-span-2 flex items-center gap-1">
                                      <span className="text-gray-500">
                                        {vehicle.currentStatus === '2' ? '🛑' : '🚍'}
                                      </span>
                                      <span className="text-gray-600">
                                        {vehicle.currentStatus === '2'
                                          ? 'En arrêt'
                                          : vehicle.currentStatus === '1'
                                          ? 'En transit'
                                          : 'Inconnu'}
                                      </span>
                                    </div>
                                  )}
                                </div>

                                <div className="mt-2 text-xs text-gray-400">
                                  MàJ: {formatTimestamp(vehicle.timestamp)}
                                </div>
                              </div>

                              {/* Flèche */}
                              <div className="flex-shrink-0 text-gray-400">
                                <svg
                                  className="w-5 h-5"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M9 5l7 7-7 7"
                                  />
                                </svg>
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
