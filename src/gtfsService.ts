import GtfsRealtimeBindings from 'gtfs-realtime-bindings';
import { type Vehicle, type TripUpdate } from './types';

// URLs des APIs GTFS Realtime du transport.data.gouv.fr
const VEHICLE_POSITIONS_URL = import.meta.env.PROD 
  ? 'https://proxy.transport.data.gouv.fr/resource/setram-lemans-gtfs-rt-vehicle-position'
  : '/api/vehicle-positions';

const TRIP_UPDATES_URL = import.meta.env.PROD
  ? 'https://proxy.transport.data.gouv.fr/resource/setram-lemans-gtfs-rt-trip-update'
  : '/api/trip-updates';

// Fonction pour récupérer et décoder les positions des véhicules
export async function fetchVehiclePositions(): Promise<Vehicle[]> {
  try {
    const response = await fetch(VEHICLE_POSITIONS_URL);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const buffer = await response.arrayBuffer();
    const feed = GtfsRealtimeBindings.transit_realtime.FeedMessage.decode(
      new Uint8Array(buffer)
    );
    
    const vehicles: Vehicle[] = [];
    
    for (const entity of feed.entity) {
      const vehicle = entity.vehicle;
      const position = vehicle?.position;
      
      if (vehicle && position?.latitude && position?.longitude) {
        vehicles.push({
          id: entity.id,
          latitude: position.latitude,
          longitude: position.longitude,
          bearing: position.bearing ?? undefined,
          speed: position.speed ?? undefined,
          tripId: vehicle.trip?.tripId ?? undefined,
          routeId: vehicle.trip?.routeId ?? undefined,
          label: vehicle.vehicle?.label ?? undefined,
          timestamp: typeof vehicle.timestamp === 'object' && vehicle.timestamp && 'low' in vehicle.timestamp ? (vehicle.timestamp as any).low : Date.now() / 1000,
          currentStatus: vehicle.currentStatus?.toString(),
          stopId: vehicle.stopId ?? undefined,
          currentStopSequence: vehicle.currentStopSequence ?? undefined,
        });
      }
    }
    
    return vehicles;
  } catch (error) {
    console.error('Erreur lors de la récupération des positions:', error);
    return [];
  }
}

// Fonction pour récupérer et décoder les mises à jour de trajet
export async function fetchTripUpdates(): Promise<TripUpdate[]> {
  try {
    const response = await fetch(TRIP_UPDATES_URL);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const buffer = await response.arrayBuffer();
    const feed = GtfsRealtimeBindings.transit_realtime.FeedMessage.decode(
      new Uint8Array(buffer)
    );
    
    const updates: TripUpdate[] = [];
    
    for (const entity of feed.entity) {
      if (entity.tripUpdate?.trip) {
        const tripUpdate = entity.tripUpdate;
        const trip = tripUpdate.trip;
        
        updates.push({
          tripId: trip.tripId || '',
          routeId: trip.routeId ?? undefined,
          delay: tripUpdate.delay ?? undefined,
          timestamp: typeof tripUpdate.timestamp === 'object' && tripUpdate.timestamp && 'low' in tripUpdate.timestamp ? (tripUpdate.timestamp as any).low : undefined,
          stopTimeUpdates: tripUpdate.stopTimeUpdate?.map((stu) => ({
            stopSequence: stu.stopSequence ?? undefined,
            stopId: stu.stopId ?? undefined,
            arrivalDelay: stu.arrival?.delay ?? undefined,
            departureDelay: stu.departure?.delay ?? undefined,
            scheduleRelationship: stu.scheduleRelationship?.toString(),
          })),
        });
      }
    }
    
    return updates;
  } catch (error) {
    console.error('Erreur lors de la récupération des mises à jour:', error);
    return [];
  }
}

// Fonction pour combiner les données des véhicules avec les retards
export function mergeVehicleData(
  vehicles: Vehicle[],
  tripUpdates: TripUpdate[]
): Vehicle[] {
  const tripUpdateMap = new Map(
    tripUpdates.map((update) => [update.tripId, update])
  );
  
  return vehicles.map((vehicle) => {
    const tripUpdate = vehicle.tripId
      ? tripUpdateMap.get(vehicle.tripId)
      : undefined;
    
    return {
      ...vehicle,
      delay: tripUpdate?.delay,
    };
  });
}
