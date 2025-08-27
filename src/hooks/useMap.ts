import { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";

export const useMap = (containerRef: React.RefObject<HTMLDivElement>) => {
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);

  useEffect(() => {
    if (!containerRef.current) return;

    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: "mapbox://styles/mapbox/dark-v11",
      zoom: 2,
      center: [35.957, 31.906],
    });

    mapRef.current = map;
    map.on("load", () => setMapLoaded(true));

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  return { mapRef, mapLoaded };
};
