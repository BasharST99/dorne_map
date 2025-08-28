"use client";

import { useEffect, useRef, useState } from "react";
import mapboxgl, { GeoJSONSource } from "mapbox-gl";
import { MAP_STYLE, DEFAULT_CENTER } from "@/utils/constants";
import { addSourcesAndLayers } from "@/components/map/mapLayers";
import { createHandlers } from "@/components/map/mapHandlers";
import type { Feature, Fleet } from "@/types/types";

export function useMapbox(params: {
  containerRef: React.RefObject<HTMLDivElement | null>;
  // initialCenter is only used on first mount
  initialCenter?: [number, number];
  fleetsRef: React.MutableRefObject<Fleet[]>;
  hoveredRef: React.MutableRefObject<Feature | null>;
  setHoveredDrone: (f: Feature | null) => void;
  setPopupPosition: (p: { x: number; y: number } | null) => void;
  setSelectedSerial: (s: string | null) => void;
}) {
  const { containerRef, initialCenter, fleetsRef, hoveredRef, setHoveredDrone, setPopupPosition, setSelectedSerial } = params;

  const mapRef = useRef<mapboxgl.Map | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);

  const dronesSourceRef = useRef<GeoJSONSource | null>(null);
  const pathsSourceRef = useRef<GeoJSONSource | null>(null);

  const dronesDataRef = useRef<GeoJSON.FeatureCollection>({ type: "FeatureCollection", features: [] });
  const pathsDataRef = useRef<GeoJSON.FeatureCollection>({ type: "FeatureCollection", features: [] });


  useEffect(() => {
    if (mapRef.current) return;

    let cancelled = false;

    const init = () => {
      if (cancelled) return;

      const el = containerRef.current;
      if (!el) {
        // container not mounted yet — try next frame
        requestAnimationFrame(init);
        return;
      }

      const map = new mapboxgl.Map({
        container: el,
        style: MAP_STYLE,
        center: initialCenter ?? DEFAULT_CENTER, // only used once
        zoom: 12,
        failIfMajorPerformanceCaveat: true,
      });
      mapRef.current = map;

      map.on("load", async () => {
        try {
          const { drones, paths } = await addSourcesAndLayers(
            map,
            dronesDataRef.current,
            pathsDataRef.current
          );
          dronesSourceRef.current = drones;
          pathsSourceRef.current = paths;

          const { onMouseMove, onClick, onMoveStart, onMove } = createHandlers({
            map,
            fleetsRef,
            hoveredRef,
            setHoveredDrone,
            setPopupPosition,
            setSelectedSerial,
          });

          map.on("mousemove", onMouseMove);
          map.on("click", onClick);
          map.on("zoomstart", onMoveStart);
          map.on("dragstart", onMoveStart);
          map.on("move", onMove);

          setMapLoaded(true);
        } catch (err) {
          console.error("Map init failed:", err);
        }
      });
    };

    init();

    return () => {
      cancelled = true;
      try { mapRef.current?.remove(); } catch { }
      mapRef.current = null;
      dronesSourceRef.current = null;
      pathsSourceRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { mapRef, mapLoaded, dronesSourceRef, pathsSourceRef, dronesDataRef, pathsDataRef };
}
