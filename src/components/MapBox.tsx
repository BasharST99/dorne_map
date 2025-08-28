"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Box, Snackbar, Typography, IconButton, useMediaQuery, useTheme } from "@mui/material";
import { ChevronRight } from "@mui/icons-material";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";

import DroneList from "@/components/map/DroneList";
import DronePopup from "@/components/map/DronePopup";
import { useDroneStore } from "@/store/useDroneStore";

import { useFleets } from "@/hooks/useFleets";
import { useMapbox } from "@/hooks/useMapbox";
import { isAllowed, makeScheduler, toDegrees } from "@/utils/mapUtils";
import { DEFAULT_CENTER, MAX_PATH_LENGTH } from "@/utils/constants";
import type { Feature } from "@/types/types";

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN!;

export default function MapBox() {
  const containerRef = useRef<HTMLDivElement>(null);

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [snackOpen, setSnackOpen] = useState(false);
  const toggleSidebar = () => setSidebarOpen(v => !v);

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  // ==== STORE ====
  const dronesFromStore  = useDroneStore(s => s.drones);
  const selectedSerial   = useDroneStore(s => s.selectedSerial);
  const setSelectedSerial = useDroneStore(s => s.setSelectedSerial);
  const setHoveredDrone   = useDroneStore(s => s.setHoveredDrone);
  const setPopupPosition  = useDroneStore(s => s.setPopupPosition);
  const hoveredDrone      = useDroneStore(s => s.hoveredDrone);

  // Fleets + refs (prevents stale closures inside map handlers)
  const { fleets, fleetsRef } = useFleets(dronesFromStore);
  const hoveredRef = useRef<Feature | null>(null);
  useEffect(() => { hoveredRef.current = (hoveredDrone as any) ?? null; }, [hoveredDrone]);

  const initialCenter = useMemo<[number, number]>(
    () => (fleets.length ? fleets[0].latest.geometry.coordinates : DEFAULT_CENTER),
    [fleets]
  );

  // Map setup (sources, layers, handlers)
  const { mapRef, mapLoaded, dronesSourceRef, pathsSourceRef, dronesDataRef, pathsDataRef } =
    useMapbox({
      containerRef,
      initialCenter,
      fleetsRef,
      hoveredRef,
      setHoveredDrone,
      setPopupPosition,
      setSelectedSerial,
    });

  // Counts + snackbar
  const activeCount = useMemo(() => fleets.filter(f => isAllowed(f.registration)).length, [fleets]);
  useEffect(() => { setSnackOpen(true); }, [activeCount]);

  // Batch buffers + upsert helpers
  const droneIndexRef = useRef<Map<string, number>>(new Map());
  const pathIndexRef  = useRef<Map<string, number>>(new Map());
  const flush = useRef(makeScheduler()).current;

  function upsertDrone(reg: string, serial: string, lng: number, lat: number, yawDeg: number) {
    const dronesData = dronesDataRef.current;
    const index = droneIndexRef.current;
    let i = index.get(reg);

    const map = mapRef.current;
    const displayDeg = map ? yawDeg - map.getBearing() : yawDeg;

    if (i == null) {
      i = dronesData.features.push({
        type: "Feature",
        id: reg,
        properties: { id: reg, registration: reg, serial, allowed: isAllowed(reg) ? 1 : 0, rotation: displayDeg },
        geometry: { type: "Point", coordinates: [lng, lat] },
      }) - 1;
      index.set(reg, i);
    } else {
      const feature = dronesData.features[i] as any;
      feature.geometry.coordinates = [lng, lat];
      feature.properties.rotation = displayDeg;
    }
  }

  function upsertPath(reg: string, coords: [number, number][]) {
    const pathsData = pathsDataRef.current;
    const index = pathIndexRef.current;
    let i = index.get(reg);

    if (i == null) {
      i = pathsData.features.push({
        type: "Feature",
        id: reg,
        properties: { registration: reg, allowed: isAllowed(reg) ? 1 : 0 },
        geometry: { type: "LineString", coordinates: coords.slice(-MAX_PATH_LENGTH) },
      }) - 1;
      index.set(reg, i);
    } else {
      const arr = (pathsData.features[i] as any).geometry.coordinates as [number, number][];
      arr.length = 0;
      const start = Math.max(0, coords.length - MAX_PATH_LENGTH);
      for (let k = start; k < coords.length; k++) arr.push(coords[k]);
    }
  }

  // Rebuild batches when fleets change
  useEffect(() => {
    if (!mapLoaded) return;

    droneIndexRef.current.clear();
    pathIndexRef.current.clear();
    dronesDataRef.current.features = [];
    pathsDataRef.current.features = [];

    for (const f of fleets) {
      const [lng, lat] = f.latest.geometry.coordinates;
      const yawDeg = toDegrees(f.latest.properties.yaw ?? 0);
      upsertDrone(f.registration, f.latest.properties.serial, lng, lat, yawDeg);
      upsertPath(f.registration, f.pathCoords);
    }

    flush(() => {
      dronesSourceRef.current?.setData(dronesDataRef.current as any);
      pathsSourceRef.current?.setData(pathsDataRef.current as any);
    });
  }, [fleets, mapLoaded, flush, dronesSourceRef, pathsSourceRef, dronesDataRef, pathsDataRef]);

  // Fly to selection
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapLoaded || !selectedSerial) return;
    const fleet = fleets.find(f => f.latest.properties.serial === selectedSerial);
    const target = fleet?.latest?.geometry.coordinates;
    if (!target) return;
    requestAnimationFrame(() => {
      map.flyTo({ center: target, zoom: 15, speed: 1.2, essential: true });
    });
  }, [selectedSerial, mapLoaded, fleets, mapRef]);

  // Keep icon rotation aligned with bearing
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapLoaded) return;

    const updateRotations = () => {
      for (const f of fleetsRef.current) {
        const yawDeg = toDegrees(f.latest.properties.yaw ?? 0);
        const displayDeg = yawDeg - map.getBearing();
        const i = droneIndexRef.current.get(f.registration);
        if (i !== undefined) (dronesDataRef.current.features[i] as any).properties.rotation = displayDeg;
      }
      dronesSourceRef.current?.setData(dronesDataRef.current as any);
    };

    updateRotations();
    map.on("rotate", updateRotations);
    return () => { map.off("rotate", updateRotations); };
  }, [mapLoaded, mapRef, fleetsRef, dronesSourceRef, dronesDataRef]);

  return (
    <Box sx={{ display: "flex", height: "100vh" }}>
      <Box ref={containerRef} sx={{ flexGrow: 1, height: "100%" }} />
      {!sidebarOpen && (
        <Box sx={{ position: "absolute", top: 80, left: 0, zIndex: 1300 }}>
          <IconButton
            onClick={toggleSidebar}
            sx={{ backgroundColor: "#1F2327", borderRadius: "0 8px 8px 0", color: "#fff", width: 36, height: 36, boxShadow: 3, "&:hover": { backgroundColor: "#333" } }}
          >
            <ChevronRight />
          </IconButton>
        </Box>
      )}
      <DroneList open={sidebarOpen} onToggle={toggleSidebar} />
      <DronePopup />
      <Snackbar open={snackOpen} autoHideDuration={3000} anchorOrigin={{ vertical: "bottom", horizontal: "right" }}>
        <Box sx={{ display: "flex", alignItems: "center", backgroundColor: "#D9D9D9", p: 1, borderRadius: 1, gap: 1 }}>
          <Box sx={{ bgcolor: "#1F2327", width: 32, height: 32, borderRadius: "50%", display: "flex", justifyContent: "center", alignItems: "center", fontSize: 14, color: "#fff", ml: 2 }}>
            {activeCount}
          </Box>
          <Typography variant="body2" color="#3C4248">Drone Flying</Typography>
        </Box>
      </Snackbar>
    </Box>
  );
}
