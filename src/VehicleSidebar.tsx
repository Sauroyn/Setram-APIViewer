import { Button, Card, Text } from '@gravity-ui/uikit';
import { Bars, Xmark } from '@gravity-ui/icons';
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
      {/* Bouton d'ouverture (sous le panneau) */}
      {!isOpen && (
        <Button
          onClick={(e) => {
            e.stopPropagation();
            onToggle();
          }}
          view="normal"
          size="l"
          title="Ouvrir le panneau"
          style={{ 
            position: 'fixed',
            top: '16px',
            left: '16px',
            zIndex: 998,
            width: '44px',
            height: '44px',
            padding: 0,
            minWidth: '44px',
            borderRadius: '8px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.12), 0 0 0 1px rgba(0,0,0,0.05)',
            backgroundColor: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <Bars />
        </Button>
      )}

      {/* Panneau latéral */}
      <div
        style={{ 
          position: 'fixed',
          top: 0,
          left: 0,
          height: '100%',
          width: '400px',
          zIndex: 999,
          transform: isOpen ? 'translateX(0)' : 'translateX(-100%)',
          transition: 'transform 0.3s ease-in-out',
          backgroundColor: 'var(--g-color-base-background)',
          boxShadow: '2px 0 10px rgba(0,0,0,0.15)',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        {/* En-tête */}
        <div style={{ 
          padding: '16px',
          borderBottom: '1px solid var(--g-color-line-generic)',
          backgroundColor: 'var(--g-color-base-brand)',
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div>
            <Text variant="header-1" style={{ color: 'white', marginBottom: '4px', fontSize: '18px' }}>
              Véhicules SETRAM
            </Text>
            <Text variant="body-2" style={{ color: 'rgba(255,255,255,0.8)', fontSize: '12px' }}>
              {vehicles.length} véhicule{vehicles.length > 1 ? 's' : ''} en circulation
            </Text>
          </div>
          <Button
            onClick={(e) => {
              e.stopPropagation();
              onToggle();
            }}
            view="flat"
            size="m"
            title="Fermer le panneau"
            style={{ 
              color: 'white',
              minWidth: '32px',
              padding: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <Xmark />
          </Button>
        </div>

        {/* Liste des véhicules */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '8px' }}>
          {vehicles.length === 0 ? (
            <div style={{ padding: '32px', textAlign: 'center' }}>
              <Text variant="body-2" color="secondary">
                Aucun véhicule en circulation
              </Text>
            </div>
          ) : (
            <div>
              {sortedRoutes.map((routeId) => {
                const routeVehicles = vehiclesByRoute[routeId];
                const { color, text } = getLineInfo(routeId);
                
                return (
                  <div key={routeId} style={{ marginBottom: '16px' }}>
                    {/* En-tête de ligne */}
                    <div style={{ 
                      padding: '8px 12px',
                      backgroundColor: color,
                      borderRadius: '6px',
                      marginBottom: '4px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}>
                      <div style={{
                        width: '24px',
                        height: '24px',
                        borderRadius: '50%',
                        backgroundColor: 'rgba(255,255,255,0.25)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 'bold',
                        fontSize: '11px',
                        color: 'white'
                      }}>
                        {text}
                      </div>
                      <div style={{ flex: 1 }}>
                        <Text variant="body-2" style={{ color: 'white', fontWeight: 600, fontSize: '12px', lineHeight: '1.2' }}>
                          {routeId === 'unknown' ? 'Ligne inconnue' : `Ligne ${routeId}`}
                        </Text>
                        <Text variant="caption-1" style={{ color: 'rgba(255,255,255,0.8)', fontSize: '10px', lineHeight: '1.2' }}>
                          {routeVehicles.length} véhicule{routeVehicles.length > 1 ? 's' : ''}
                        </Text>
                      </div>
                    </div>

                    {/* Véhicules de cette ligne */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                      {routeVehicles.map((vehicle) => (
                        <Card
                          key={vehicle.id}
                          view="outlined"
                          style={{ cursor: 'pointer' }}
                          onClick={() => onVehicleSelect(vehicle.id)}
                        >
                          <div style={{ padding: '6px', display: 'flex', gap: '8px', alignItems: 'center' }}>
                            {/* Icône de véhicule */}
                            <div style={{
                              width: '28px',
                              height: '28px',
                              borderRadius: '50%',
                              backgroundColor: color,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontWeight: 'bold',
                              fontSize: '10px',
                              color: 'white',
                              flexShrink: 0,
                              border: '1.5px solid white',
                              boxShadow: '0 1px 2px rgba(0,0,0,0.1)'
                            }}>
                              {text}
                            </div>

                            {/* Infos du véhicule */}
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <Text variant="body-2" style={{ fontWeight: 600, marginBottom: '2px', fontSize: '12px', lineHeight: '1.2' }}>
                                {vehicle.label || `Véhicule ${vehicle.id.substring(0, 8)}`}
                              </Text>

                              <div style={{ 
                                display: 'flex',
                                flexWrap: 'wrap',
                                gap: '6px',
                                fontSize: '10px',
                                lineHeight: '1.2'
                              }}>
                                {/* Vitesse */}
                                {vehicle.speed !== undefined && (
                                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '2px', whiteSpace: 'nowrap' }}>
                                    🚀 {Math.round(vehicle.speed * 3.6)}km/h
                                  </span>
                                )}

                                {/* Retard */}
                                {vehicle.delay !== undefined && (
                                  <span style={{ 
                                    display: 'inline-flex', 
                                    alignItems: 'center', 
                                    gap: '2px',
                                    whiteSpace: 'nowrap',
                                    color: vehicle.delay > 60 
                                      ? 'var(--g-color-text-danger)' 
                                      : vehicle.delay < -60 
                                      ? 'var(--g-color-text-positive)' 
                                      : 'inherit'
                                  }}>
                                    ⏱️ {vehicle.delay > 0 ? '+' : ''}{Math.round(vehicle.delay / 60)}min
                                  </span>
                                )}

                                {/* Statut */}
                                {vehicle.currentStatus && (
                                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '2px', whiteSpace: 'nowrap' }}>
                                    {vehicle.currentStatus === '2' ? '🛑' : '🚍'}
                                    {vehicle.currentStatus === '2' ? 'Arrêt' : 'Transit'}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
