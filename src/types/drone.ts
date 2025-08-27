
export type Coordinates = [number, number];

export interface DroneProperties {
  serial: string;
  registration: string;
  Name: string;
  altitude: number;
  pilot: string;
  organization: string;
  yaw: number;
}

export interface DroneGeometry {
  type: "Point";
  coordinates: Coordinates;
}

export interface Drone {
  properties: DroneProperties;
  geometry: DroneGeometry;
  path?: Coordinates[];
  startTime?: number;
}
