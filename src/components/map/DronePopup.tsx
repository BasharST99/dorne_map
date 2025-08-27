"use client";

import { Box, Typography } from "@mui/material";
import { useDroneStore } from "@/store/useDroneStore";
import { useState, useEffect } from "react";

export default function DronePopup() {
  const hoveredDrone = useDroneStore((state) => state.hoveredDrone);
  const popupPosition = useDroneStore((state) => state.popupPosition);
  const [flightTime, setFlightTime] = useState("00:00");

  useEffect(() => {
    if (!hoveredDrone?.startTime) return;

    const update = () => {
      const seconds = Math.floor((Date.now() - (hoveredDrone.startTime ?? Date.now())) / 1000);
      const min = String(Math.floor(seconds / 60)).padStart(2, "0");
      const sec = String(seconds % 60).padStart(2, "0");
      setFlightTime(`${min}:${sec}`);
    };

    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [hoveredDrone?.startTime]);

  if (!hoveredDrone || !popupPosition) return null;

  return (
    <Box
      sx={{
        position: "absolute",
        left: popupPosition.x,
        top: popupPosition.y - 60,
        backgroundColor: "#0f0f0f",
        color: "#fff",
        padding: "10px 16px",
        borderRadius: "8px",
        pointerEvents: "none",
        zIndex: 999,
        width: 200,
        boxShadow: 5,
        transform: "translate(-50%, -100%)",
        border: "1px solid #333",
        fontFamily: "Arial, sans-serif",
        "&::after": {
          content: '""',
          position: "absolute",
          bottom: -8,
          left: "50%",
          transform: "translateX(-50%)",
          width: 0,
          height: 0,
          borderLeft: "8px solid transparent",
          borderRight: "8px solid transparent",
          borderTop: "8px solid #0f0f0f",
        },
      }}
    >
      <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 1 }}>
        {hoveredDrone.properties.Name}
      </Typography>
      <Box display="flex" justifyContent="space-between">
        <Box>
          <Typography variant="body2">Altitude</Typography>
          <Typography variant="body2">{hoveredDrone.properties.altitude.toFixed(2)} m</Typography>
        </Box>
        <Box>
          <Typography variant="body2">Flight Time</Typography>
          <Typography variant="body2">{flightTime}</Typography>
        </Box>
      </Box>
    </Box>
  );
}
