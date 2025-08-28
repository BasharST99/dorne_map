import mapboxgl from "mapbox-gl";
import type { Feature, Fleet } from "@/types/types";

type SetHovered = (f: Feature | null) => void;
type SetPopupPos = (p: { x: number; y: number } | null) => void;
type SetSelectedSerial = (s: string | null) => void;

export function createHandlers(params: {
  map: mapboxgl.Map;
  fleetsRef: React.MutableRefObject<Fleet[]>;
  hoveredRef: React.MutableRefObject<Feature | null>;
  setHoveredDrone: SetHovered;
  setPopupPosition: SetPopupPos;
  setSelectedSerial: SetSelectedSerial;
}) {
  const { map, fleetsRef, hoveredRef, setHoveredDrone, setPopupPosition, setSelectedSerial } = params;

  const onMouseMove = (e: mapboxgl.MapMouseEvent & mapboxgl.EventData) => {
    if (!map.getLayer("drones-layer")) return;
    const feats = map.queryRenderedFeatures(e.point, { layers: ["drones-layer"] });
    if (!feats?.length) {
      setHoveredDrone(null);
      setPopupPosition(null);
      return;
    }
    const id = feats[0].id as string; // registration
    const fleet = fleetsRef.current.find((x) => x.registration === id);
    const latest = fleet?.latest;
    if (!latest) {
      setHoveredDrone(null);
      setPopupPosition(null);
      return;
    }
    setHoveredDrone(latest);
    const pt = map.project(latest.geometry.coordinates);
    setPopupPosition({ x: pt.x, y: pt.y });
  };

  const onClick = (e: mapboxgl.MapMouseEvent & mapboxgl.EventData) => {
    if (!map.getLayer("drones-layer")) return;
    const feats = map.queryRenderedFeatures(e.point, { layers: ["drones-layer"] });
    if (!feats?.length) return;
    const id = feats[0].id as string;
    const fleet = fleetsRef.current.find((x) => x.registration === id);
    const serial = fleet?.latest?.properties?.serial ?? null;
    setSelectedSerial(serial);
  };

  const onMoveStart = () => setSelectedSerial(null);

  const onMove = () => {
    const h = hoveredRef.current;
    if (!h) return;
    const fleet = fleetsRef.current.find((f) => f.registration === h.properties.registration);
    if (!fleet) return;
    const pt = map.project(fleet.latest.geometry.coordinates);
    setPopupPosition({ x: pt.x, y: pt.y });
  };

  return { onMouseMove, onClick, onMoveStart, onMove };
}
