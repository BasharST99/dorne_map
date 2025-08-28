"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Box, Snackbar, Typography, IconButton } from "@mui/material";
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
import type { Drone } from "@/types/drone";

import type {
  Feature as GJFeature,
  FeatureCollection as GJFeatureCollection,
  Point as GJPoint,
  LineString as GJLineString,
  Geometry as GJGeometry,
} from "geojson";

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN!;

type DronePointProps = {
  id: string;
  registration: string;
  serial: string;
  allowed: 0 | 1;
  rotation: number; // degrees
};

// ⬇️ NEW: properties for the path (LineString)
type PathProps = {
  registration: string;
  allowed: 0 | 1;
};

export default function MapBox() {
  const containerRef = useRef<HTMLDivElement | null>(null);

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [snackOpen, setSnackOpen] = useState(false);
  const toggleSidebar = () => setSidebarOpen((v) => !v);

  const dronesFromStore = useDroneStore((s) => s.drones);
  const selectedSerial = useDroneStore((s) => s.selectedSerial);
  const setSelectedSerial = useDroneStore((s) => s.setSelectedSerial);
  const setHoveredDrone = useDroneStore((s) => s.setHoveredDrone);
  const setPopupPosition = useDroneStore((s) => s.setPopupPosition);
  const hoveredDrone = useDroneStore((s) => s.hoveredDrone);

  const { fleets, fleetsRef } = useFleets(dronesFromStore);
  const hoveredRef = useRef<Feature | null>(null);
  useEffect(() => {
    hoveredRef.current = (hoveredDrone as Feature | null) ?? null;
  }, [hoveredDrone]);

  const initialCenter = useMemo<[number, number]>(
    () =>
      fleets.length
        ? (fleets[0].latest.geometry.coordinates as [number, number])
        : DEFAULT_CENTER,
    [fleets]
  );
  const setHoveredDroneFromFeature = useCallback(
    (f: Feature | null) => {
      if (!f) {
        // your store expects Drone|null
        return setHoveredDrone(null as unknown as Drone | null);
      }
      // normalize Name to a required string for your store type
      const mapped: Drone = {
        ...f,
        properties: {
          ...f.properties,
          Name: f.properties.Name ?? "", // ensure string
        },
      } as Drone;

      setHoveredDrone(mapped);
    },
    [setHoveredDrone]
  );
const {
  mapRef,
  mapLoaded,
  dronesSourceRef,
  pathsSourceRef,
  dronesDataRef,
  pathsDataRef,
} = useMapbox({
  containerRef,
  initialCenter,
  fleetsRef,
  hoveredRef,
  setHoveredDrone: setHoveredDroneFromFeature, // ⬅️ use adapter here
  setPopupPosition,
  setSelectedSerial,
});

  const activeCount = useMemo(
    () => fleets.filter((f) => isAllowed(f.registration)).length,
    [fleets]
  );
  useEffect(() => {
    setSnackOpen(true);
  }, [activeCount]);

  const droneIndexRef = useRef<Map<string, number>>(new Map());
  const pathIndexRef = useRef<Map<string, number>>(new Map());
  const flush = useRef(makeScheduler()).current;

  // ⬇️ STRONGLY TYPED: upsert point
  const upsertDrone = useCallback(
    (
      reg: string,
      serial: string,
      lng: number,
      lat: number,
      yawDeg: number
    ) => {
      const dronesData = dronesDataRef.current;
      const index = droneIndexRef.current;
      let i = index.get(reg);

      const map = mapRef.current;
      const displayDeg = map ? yawDeg - map.getBearing() : yawDeg;

      if (i == null) {
        i =
          dronesData.features.push({
            type: "Feature",
            id: reg,
            properties: {
              id: reg,
              registration: reg,
              serial,
              allowed: isAllowed(reg) ? 1 : 0,
              rotation: displayDeg,
            },
            geometry: { type: "Point", coordinates: [lng, lat] },
          } satisfies GJFeature<GJPoint, DronePointProps>) - 1;
        index.set(reg, i);
      } else {
        const feature = dronesData.features[i] as GJFeature<
          GJPoint,
          DronePointProps
        >;
        feature.geometry.coordinates = [lng, lat];
        feature.properties.rotation = displayDeg;
      }
    },
    [dronesDataRef, droneIndexRef, mapRef]
  );

  // ⬇️ STRONGLY TYPED: upsert line
  const upsertPath = useCallback(
    (reg: string, coords: [number, number][]) => {
      const pathsData = pathsDataRef.current;
      const index = pathIndexRef.current;
      let i = index.get(reg);

      if (i == null) {
        i =
          pathsData.features.push({
            type: "Feature",
            id: reg,
            properties: { registration: reg, allowed: isAllowed(reg) ? 1 : 0 },
            geometry: {
              type: "LineString",
              coordinates: coords.slice(-MAX_PATH_LENGTH),
            },
          } satisfies GJFeature<GJLineString, PathProps>) - 1;
        index.set(reg, i);
      } else {
        const f = pathsData.features[i] as GJFeature<GJLineString, PathProps>;
        const arr = f.geometry.coordinates;
        arr.length = 0;
        const start = Math.max(0, coords.length - MAX_PATH_LENGTH);
        for (let k = start; k < coords.length; k++) arr.push(coords[k]);
      }
    },
    [pathsDataRef, pathIndexRef]
  );

  useEffect(() => {
    if (!mapLoaded) return;

    droneIndexRef.current.clear();
    pathIndexRef.current.clear();
    dronesDataRef.current.features = [];
    pathsDataRef.current.features = [];

    for (const f of fleets) {
      const [lng, lat] = f.latest.geometry.coordinates as [number, number];
      const yawDeg = toDegrees(f.latest.properties.yaw ?? 0);
      upsertDrone(
        f.registration,
        f.latest.properties.serial,
        lng,
        lat,
        yawDeg
      );
      upsertPath(f.registration, f.pathCoords);
    }

    flush(() => {
      dronesSourceRef.current?.setData(
        dronesDataRef.current as unknown as GJFeatureCollection<GJGeometry>
      );
      pathsSourceRef.current?.setData(
        pathsDataRef.current as unknown as GJFeatureCollection<GJGeometry>
      );
    });
  }, [
    fleets,
    mapLoaded,
    flush,
    dronesSourceRef,
    pathsSourceRef,
    dronesDataRef,
    pathsDataRef,
    upsertDrone,
    upsertPath,
  ]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapLoaded || !selectedSerial) return;
    const fleet = fleets.find(
      (f) => f.latest.properties.serial === selectedSerial
    );
    const target = fleet?.latest?.geometry.coordinates as
      | [number, number]
      | undefined;
    if (!target) return;
    requestAnimationFrame(() => {
      map.flyTo({ center: target, zoom: 15, speed: 1.2, essential: true });
    });
  }, [selectedSerial, mapLoaded, fleets, mapRef]);

  // ⬇️ STRONGLY TYPED: rotation updater
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapLoaded) return;

    const updateRotations = () => {
      for (const f of fleetsRef.current) {
        const yawDeg = toDegrees(f.latest.properties.yaw ?? 0);
        const displayDeg = yawDeg - map.getBearing();
        const i = droneIndexRef.current.get(f.registration);
        if (i !== undefined) {
          const feat = dronesDataRef.current.features[i] as GJFeature<
            GJPoint,
            DronePointProps
          >;
          feat.properties.rotation = displayDeg;
        }
      }
      dronesSourceRef.current?.setData(
        dronesDataRef.current as unknown as GJFeatureCollection<GJGeometry>
      );
    };

    updateRotations();
    map.on("rotate", updateRotations);
    return () => {
      map.off("rotate", updateRotations);
    };
  }, [mapLoaded, mapRef, fleetsRef, dronesSourceRef, dronesDataRef]);

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
              width: 36,
              height: 36,
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
            p: 1,
            borderRadius: 1,
            gap: 1,
          }}
        >
          <Box
            sx={{
              bgcolor: "#1F2327",
              width: 32,
              height: 32,
              borderRadius: "50%",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              fontSize: 14,
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
