"use client";

import { useEffect } from "react";
import { io, Socket } from "socket.io-client";
import { useDroneStore } from "@/store/useDroneStore";
import type { Drone } from "@/types/drone";

type SioPayload = { features?: Drone[] };

let socket: Socket | null = null;

export const useWebSocket = () => {
  const addDrone = useDroneStore((s) => s.addDrone);

  useEffect(() => {
    const base = (process.env.NEXT_PUBLIC_WEBSOCKET_URL || "").replace(/\/$/, "");
    if (!base) {
      console.warn("NEXT_PUBLIC_WEBSOCKET_URL is missing");
      return;
    }
    if (!socket) {
      socket = io(base, {
        path: "/socket.io",
        transports: ["polling"],
        withCredentials: false,
      });
      socket.on("connect", () => console.log("socket connected:", socket!.id));
      socket.on("disconnect", (r) => console.log("socket disconnected:", r));
      socket.on("connect_error", (e) => console.warn("socket connect_error:", e.message));
    }

    const onMessage = (data: SioPayload) => {
      const drone = data?.features?.[0];
      if (drone) addDrone(drone);
    };

    socket.off("message", onMessage);
    socket.on("message", onMessage);

    return () => {
      if (!socket) return;
      socket.off("message", onMessage);
    };
  }, [addDrone]);
};