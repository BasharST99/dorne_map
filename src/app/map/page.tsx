"use client";

import dynamic from "next/dynamic";
import { useWebSocket } from "@/hooks/useWebSocket";
import { Box } from "@mui/material";

const MapBox = dynamic(() => import("@/components/MapBox"), {
  ssr: false,
});

export default function MapPage() {
  useWebSocket(); 

  return (
    <Box sx={{ position: "relative", width: "100%", height: "100%" }}>
      <MapBox />
    </Box>
  );
}
