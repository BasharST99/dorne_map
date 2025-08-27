import { create } from "zustand";
import { Drone } from "@/types/drone";

interface DroneStore {
  drones: Record<string, Drone>;
  addDrone: (drone: Drone) => void;
  selectedSerial: string | null;
  setSelectedSerial: (serial: string | null) => void;

  hoveredDrone: Drone | null;
  setHoveredDrone: (drone: Drone | null) => void;

  popupPosition: { x: number; y: number } | null;
  setPopupPosition: (pos: { x: number; y: number } | null) => void;
}

export const useDroneStore = create<DroneStore>((set) => ({
  drones: {},
  selectedSerial: null,
  setSelectedSerial: (serial) => set({ selectedSerial: serial }),

  hoveredDrone: null,
  setHoveredDrone: (drone) => set({ hoveredDrone: drone }),

  popupPosition: null,
  setPopupPosition: (pos) => set({ popupPosition: pos }),

  addDrone: (drone: Drone) =>
    set((state) => {
      const id = drone.properties.serial;
      const existing = state.drones[id];

      const updated: Drone = {
        ...drone,
        path: [...(existing?.path || []), drone.geometry.coordinates],
        startTime: existing?.startTime ?? Date.now(),
      };

      return {
        drones: {
          ...state.drones,
          [id]: updated,
        },
      };
    }),
}));
