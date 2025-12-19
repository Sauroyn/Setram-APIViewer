// Types pour les véhicules SETRAM
export interface Vehicle {
  id: string;
  latitude: number;
  longitude: number;
  bearing?: number;
  speed?: number;
  tripId?: string;
  routeId?: string;
  label?: string;
  timestamp: number;
  currentStatus?: string;
  stopId?: string;
  currentStopSequence?: number;
  delay?: number;
}

export interface TripUpdate {
  tripId: string;
  routeId?: string;
  delay?: number;
  timestamp?: number;
  stopTimeUpdates?: StopTimeUpdate[];
}

export interface StopTimeUpdate {
  stopSequence?: number;
  stopId?: string;
  arrivalDelay?: number;
  departureDelay?: number;
  scheduleRelationship?: string;
}
