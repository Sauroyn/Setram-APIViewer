import type { Vehicle } from './types';

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

  return (
    <>
      {/* Bouton toggle */}
      <button
        onClick={onToggle}
        className="fixed top-4 left-4 z-50 bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-lg shadow-lg transition-colors"
        title={isOpen ? 'Fermer le panneau' : 'Ouvrir le panneau'}
      >
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
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
        className={`fixed top-0 left-0 h-full bg-white shadow-2xl z-40 transform transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        style={{ width: '400px' }}
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
              <div className="divide-y divide-gray-200">
                {vehicles.map((vehicle) => (
                  <button
                    key={vehicle.id}
                    onClick={() => onVehicleSelect(vehicle.id)}
                    className="w-full p-4 hover:bg-blue-50 transition-colors text-left"
                  >
                    <div className="flex items-start gap-3">
                      {/* Icône de véhicule */}
                      <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                        <svg
                          className="w-5 h-5 text-white"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path d="M8 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM15 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" />
                          <path d="M3 4a1 1 0 00-1 1v10a1 1 0 001 1h1.05a2.5 2.5 0 014.9 0H10a1 1 0 001-1V5a1 1 0 00-1-1H3z" />
                        </svg>
                      </div>

                      {/* Infos du véhicule */}
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-gray-900 truncate">
                          {vehicle.label || `Véhicule ${vehicle.id.substring(0, 8)}`}
                        </div>

                        {vehicle.routeId && (
                          <div className="mt-1">
                            <span className="inline-block bg-blue-100 text-blue-800 text-xs font-medium px-2 py-0.5 rounded">
                              Ligne {vehicle.routeId}
                            </span>
                          </div>
                        )}

                        <div className="mt-2 space-y-1 text-xs text-gray-600">
                          {vehicle.tripId && (
                            <div className="truncate">
                              <span className="font-medium">Trajet:</span> {vehicle.tripId}
                            </div>
                          )}

                          {vehicle.speed !== undefined && (
                            <div>
                              <span className="font-medium">Vitesse:</span>{' '}
                              {Math.round(vehicle.speed * 3.6)} km/h
                            </div>
                          )}

                          {vehicle.bearing !== undefined && (
                            <div>
                              <span className="font-medium">Direction:</span>{' '}
                              {Math.round(vehicle.bearing)}°
                            </div>
                          )}

                          {vehicle.currentStatus && (
                            <div>
                              <span className="font-medium">Statut:</span>{' '}
                              {vehicle.currentStatus === '2'
                                ? 'En arrêt'
                                : vehicle.currentStatus === '1'
                                ? 'En transit'
                                : 'Inconnu'}
                            </div>
                          )}

                          <div className="text-gray-400">
                            Maj: {formatTimestamp(vehicle.timestamp)}
                          </div>
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
            )}
          </div>
        </div>
      </div>
    </>
  );
}
