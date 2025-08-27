"use client";

import { useEffect, useRef, useState, useMemo } from "react";
import { Box, Snackbar, Typography, useMediaQuery, useTheme, IconButton } from "@mui/material";
import mapboxgl, { GeoJSONSource, Marker } from "mapbox-gl";
import DroneList from "@/components/map/DroneList";
import DronePopup from "@/components/map/DronePopup";
import { ChevronRight } from "@mui/icons-material";
import "mapbox-gl/dist/mapbox-gl.css";
import { useDroneStore } from "@/store/useDroneStore";

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN!;

const MAX_PATH_LENGTH = 200;

type Feature = {
  type: "Feature";
  properties: {
    serial: string;
    registration: string; // e.g. SD-CB
    Name?: string;
    altitude?: number;
    pilot?: string;
    organization?: string;
    yaw?: number;
  };
  geometry: {
    type: "Point";
    coordinates: [number, number]; // [lng, lat]
  };
  path?: [number, number][]; // optional (not used for grouping)
  startTime?: number;
};

export default function MapBox() {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);

  // Key by REGISTRATION now (one marker & path per registration)
  const markersRef = useRef<Record<string, Marker>>({});
  const sourcesRef = useRef<Record<string, boolean>>({});

  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapInteracting, setMapInteracting] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [snackOpen, setSnackOpen] = useState(false);
  const toggleSidebar = () => setSidebarOpen((v) => !v);

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  // ==== STORE ==== //
  const dronesFromStore = useDroneStore((s) => s.drones);
  const selectedSerial = useDroneStore((s) => s.selectedSerial); // kept for backwards-compat
  const setSelectedSerial = useDroneStore((s) => s.setSelectedSerial);
  const setHoveredDrone = useDroneStore((s) => s.setHoveredDrone);
  const setPopupPosition = useDroneStore((s) => s.setPopupPosition);

  // Normalize to array whatever the store shape is (array or object map)
  const droneFeatures: Feature[] = useMemo(() => {
    if (!dronesFromStore) return [] as Feature[];
    if (Array.isArray(dronesFromStore)) return dronesFromStore as Feature[];
    return Object.values(dronesFromStore as Record<string, Feature>);
  }, [dronesFromStore]);

  // Group by registration: each registration can have many records (the path)
  const fleets = useMemo(() => {
    const byReg = new Map<string, Feature[]>();
    for (const f of droneFeatures) {
      const reg = f.properties.registration;
      if (!byReg.has(reg)) byReg.set(reg, []);
      byReg.get(reg)!.push(f);
    }

    // Sort each registration's points by startTime (fallback to insertion order)
    const result = Array.from(byReg.entries()).map(([registration, features]) => {
      features.sort((a, b) => (a.startTime ?? 0) - (b.startTime ?? 0));
      const latest = features[features.length - 1];
      const pathCoords = features
        .slice(-MAX_PATH_LENGTH)
        .map((f) => f.geometry.coordinates);
      return { registration, latest, pathCoords };
    });
    return result;
  }, [droneFeatures]);

  // Active count now based on unique registrations that start with SD-B
  const activeCount = useMemo(
    () => fleets.filter((f) => f.latest.properties.registration.startsWith("SD-B")).length,
    [fleets]
  );

  // ====== INIT MAP ======
  useEffect(() => {
    if (!containerRef.current) return;

    const centerLngLat: [number, number] = fleets.length
      ? fleets[0].latest.geometry.coordinates
      : [35.957, 31.906];

    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: "mapbox://styles/mapbox/dark-v11",
      center: centerLngLat,
      zoom: 12,
    });

    mapRef.current = map;
    map.on("load", () => setMapLoaded(true));

    // Map interaction state — set once
    map.on("dragstart", () => setMapInteracting(true));
    map.on("dragend", () => setMapInteracting(false));
    map.on("zoomstart", () => setMapInteracting(true));
    map.on("zoomend", () => setMapInteracting(false));

    return () => {
      map.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ====== RENDER / UPDATE MARKERS & PATHS (BY REGISTRATION) ======
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapLoaded) return;

    const currentRegs = new Set(fleets.map((f) => f.registration));

    // Remove markers/sources for registrations that disappeared
    Object.keys(markersRef.current).forEach((reg) => {
      if (!currentRegs.has(reg)) {
        markersRef.current[reg].remove();
        delete markersRef.current[reg];
      }
    });
    Object.keys(sourcesRef.current).forEach((reg) => {
      if (!currentRegs.has(reg)) {
        const srcId = `path-${reg}`;
        const layerId = `path-${reg}`;
        if (map.getLayer(layerId)) map.removeLayer(layerId);
        if (map.getSource(srcId)) map.removeSource(srcId);
        delete sourcesRef.current[reg];
      }
    });

    // Create / update per registration
    fleets.forEach(({ registration, latest, pathCoords }) => {
      const isAllowed = registration.startsWith("SD-B");
      const [lng, lat] = latest.geometry.coordinates;
      const yaw = latest.properties.yaw ?? 0;

      // Marker (per registration)
      if (!markersRef.current[registration]) {
        const el = document.createElement("div");
        el.className = "drone-marker";
        el.style.cssText = `width:32px;height:32px;border-radius:50%;background:${
          isAllowed ? "#FFD700" : "#FF0000"
        };display:flex;align-items:center;justify-content:center`;

        const icon = document.createElement("div");
        icon.style.cssText =
          "width:18px;height:18px;background:url(/drone.svg) no-repeat center/contain;filter:brightness(0) invert(1)";
        icon.style.transform = `rotate(${yaw}deg)`;
        el.appendChild(icon);

        el.addEventListener("mouseenter", () => {
          const screen = map.project([lng, lat]);
          // Pass the LATEST feature for this registration to the popup/hover
          setHoveredDrone(latest as any);
          setPopupPosition({ x: screen.x, y: screen.y });
        });
        el.addEventListener("mouseleave", () => {
          setHoveredDrone(null as any);
          setPopupPosition(null as any);
        });
        el.addEventListener("click", () => {
          // Keep API: we still set the serial, but from the latest point in this registration
          setSelectedSerial(latest.properties.serial);
        });

        markersRef.current[registration] = new mapboxgl.Marker({ element: el })
          .setLngLat([lng, lat])
          .addTo(map);
      } else {
        markersRef.current[registration].setLngLat([lng, lat]);
        const icon = markersRef.current[registration].getElement().firstChild as HTMLElement;
        if (icon) icon.style.transform = `rotate(${yaw}deg)`;
      }

      // Path source + layer (per registration)
      const srcId = `path-${registration}`;
      const layerId = `path-${registration}`;
      const data = {
        type: "Feature" as const,
        geometry: { type: "LineString" as const, coordinates: pathCoords },
        properties: {},
      };

      if (!sourcesRef.current[registration]) {
        if (!map.getSource(srcId)) {
          map.addSource(srcId, { type: "geojson", data });
        }
        if (!map.getLayer(layerId)) {
          map.addLayer({
            id: layerId,
            type: "line",
            source: srcId,
            layout: { "line-join": "round", "line-cap": "round" },
            paint: {
              "line-color": isAllowed ? "#FFD700" : "#FF0000",
              "line-width": 2,
              "line-opacity": 0.6,
            },
          });
        }
        sourcesRef.current[registration] = true;
      } else {
        (map.getSource(srcId) as GeoJSONSource)?.setData(data as any);
      }
    });
  }, [fleets, mapLoaded, setHoveredDrone, setPopupPosition, setSelectedSerial]);

  // Fly to the LATEST point of whichever serial was selected from the list
  // (If you prefer, change the store to selectedRegistration and use that here.)
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapLoaded || !selectedSerial || mapInteracting) return;

    // Find the registration that currently contains this serial (latest point)
    const fleet = fleets.find((f) => f.latest.properties.serial === selectedSerial);
    const target = fleet?.latest?.geometry.coordinates;
    if (!target) return;

    requestAnimationFrame(() => {
      map.flyTo({ center: target, zoom: 15, speed: 1.2, essential: true });
    });
  }, [selectedSerial, fleets, mapLoaded, mapInteracting]);

  // Show snackbar whenever activeCount changes
  useEffect(() => {
    setSnackOpen(true);
  }, [activeCount]);

  return (
    <Box sx={{ display: "flex", height: "100vh" }}>
      <Box ref={containerRef} sx={{ flexGrow: 1, height: "100%" }} />

      {!sidebarOpen && (
        <Box sx={{ position: "absolute", top: 80, left: 0, zIndex: 1300 }}>
          <IconButton
            onClick={toggleSidebar}
            sx={{
              backgroundColor: "#1F2327",
              borderRadius: "0 8px 8px 0",
              color: "#fff",
              width: "36px",
              height: "36px",
              boxShadow: 3,
              "&:hover": { backgroundColor: "#333" },
            }}
          >
            <ChevronRight />
          </IconButton>
        </Box>
      )}

      <DroneList open={sidebarOpen} onToggle={toggleSidebar} />
      <DronePopup />

      <Snackbar
        open={snackOpen}
        autoHideDuration={3000}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            backgroundColor: "#D9D9D9",
            padding: 1,
            borderRadius: 1,
            gap: 1,
          }}
        >
          <Box
            sx={{
              bgcolor: "#1F2327",
              width: "32px",
              height: "32px",
              borderRadius: "50%",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              fontSize: "14px",
              color: "#fff",
              ml: 2,
            }}
          >
            {activeCount}
          </Box>
          <Typography variant="body2" color="#3C4248">
            Drone Flying
          </Typography>
        </Box>
      </Snackbar>
    </Box>
  );
}
