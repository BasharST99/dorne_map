"use client";

import { useEffect } from "react";
import { io, Socket } from "socket.io-client";
import { useDroneStore } from "@/store/useDroneStore";
import type { Drone } from "@/types/drone";

let socket: Socket | null = null;

export const useWebSocket = () => {
  const addDrone = useDroneStore((s) => s.addDrone);

  useEffect(() => {

    const base =
      (process.env.NEXT_PUBLIC_WEBSOCKET_URL || "").replace(/\/$/, "");
    if (!base) {
      console.warn("NEXT_PUBLIC_WEBSOCKET_URL is missing");
      return;
    }

    if (!socket) {
      socket = io(base, {
        path: "/socket.io",      
        transports: ["polling"],
        withCredentials: false,
        autoConnect: true,
        reconnection: true,
        reconnectionAttempts: Infinity,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
      });

      socket.on("connect", () => console.log("socket connected:", socket!.id));
      socket.on("disconnect", (reason) =>
        console.log("socket disconnected:", reason)
      );
      socket.on("connect_error", (err) =>
        console.warn("socket connect_error:", err.message)
      );
    }

    const onMessage = (payload: { features?: Drone[] } | any) => {
      const d = payload?.features?.[0];
      if (d) addDrone(d);
    };
    socket.off("message", onMessage); 
    socket.on("message", onMessage);

    return () => {
      if (!socket) return;
      socket.off("message", onMessage);

    };
  }, [addDrone]);
};
