export type Feature = {
  type: "Feature";
  properties: {
    serial: string;
    registration: string;
    Name?: string;
    altitude?: number;
    pilot?: string;
    organization?: string;
    yaw?: number; // radians or degrees
  };
  geometry: { type: "Point"; coordinates: [number, number] };
  path?: [number, number][];
  startTime?: number;
};

export type Fleet = {
  registration: string;
  latest: Feature;
  pathCoords: [number, number][];
};
