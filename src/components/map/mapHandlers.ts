// mapHandlers.ts
import mapboxgl, { MapMouseEvent } from "mapbox-gl";
import type { Feature, Fleet } from "@/types/types";

export function createHandlers(params: {
  map: mapboxgl.Map;
  fleetsRef: React.MutableRefObject<Fleet[]>;
  hoveredRef: React.MutableRefObject<Feature | null>;
  setHoveredDrone: (f: Feature | null) => void;
  setPopupPosition: (p: { x: number; y: number } | null) => void;
  setSelectedSerial: (s: string | null) => void;
}) {
  const { map, fleetsRef, hoveredRef, setHoveredDrone, setPopupPosition, setSelectedSerial } = params;

  const onMouseMove = (e: MapMouseEvent) => {
    if (!map.getLayer("drones-layer")) return;

    const feats = map.queryRenderedFeatures(e.point, { layers: ["drones-layer"] });
    if (!feats?.length) {
      setHoveredDrone(null);
      setPopupPosition(null);
      return;
    }

    const f = feats[0];
    const id = f.id as string;
    const fleet = fleetsRef.current.find((x) => x.registration === id);
    const latest = fleet?.latest;
    if (!latest) return;

    setHoveredDrone(latest as Feature);

    const pt = map.project(latest.geometry.coordinates as [number, number]);
    setPopupPosition({ x: pt.x, y: pt.y });
  };

  const onClick = (e: MapMouseEvent) => {
    if (!map.getLayer("drones-layer")) return;
    const feats = map.queryRenderedFeatures(e.point, { layers: ["drones-layer"] });
    if (!feats?.length) return;

    const id = feats[0].id as string;
    const fleet = fleetsRef.current.find((x) => x.registration === id);
    const serial = fleet?.latest?.properties?.serial ?? null;
    setSelectedSerial(serial);
  };

  const onMoveStart = () => {
    setSelectedSerial(null);
  };

  const onMove = () => {
    const hovered = hoveredRef.current;
    if (!hovered) return;
    const fleet = fleetsRef.current.find(
      (f) => f.registration === hovered.properties.registration
    );
    if (!fleet) return;
    const pt = map.project(fleet.latest.geometry.coordinates as [number, number]);
    setPopupPosition({ x: pt.x, y: pt.y });
  };

  return { onMouseMove, onClick, onMoveStart, onMove };
}
