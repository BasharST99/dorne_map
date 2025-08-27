import { useEffect } from "react";
import { io, Socket } from "socket.io-client";
import { useDroneStore } from "@/store/useDroneStore";
import { Drone } from "@/types/drone";

let socket: Socket | null = null;

export const useWebSocket = () => {
  const addDrone = useDroneStore((state) => state.addDrone);

  useEffect(() => {
    if (!socket) {
      socket = io("http://localhost:9013", {
        transports: ["polling"],
      });
    }

    socket.on("message", (data: { features: Drone[] }) => {
      const drone = data.features[0];
      addDrone(drone);
    });

    return () => {
      socket?.disconnect();
    };
  }, [addDrone]);
};
