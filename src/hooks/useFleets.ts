import { useEffect, useMemo, useRef } from "react";
import { MAX_PATH_LENGTH } from "@/utils/constants";
import type { Feature, Fleet } from "@/types/types";

export function useFleets(dronesFromStore: unknown) {
  const droneFeatures: Feature[] = useMemo(() => {
    if (!dronesFromStore) return [];
    if (Array.isArray(dronesFromStore)) return dronesFromStore as Feature[];
    return Object.values(dronesFromStore as Record<string, Feature>);
  }, [dronesFromStore]);

  const fleets: Fleet[] = useMemo(() => {
    const byReg = new Map<string, Feature[]>();
    for (const f of droneFeatures) {
      const reg = f.properties.registration;
      if (!byReg.has(reg)) byReg.set(reg, []);
      byReg.get(reg)!.push(f);
    }
    const result: Fleet[] = [];
    for (const [registration, features] of byReg) {
      features.sort((a, b) => (a.startTime ?? 0) - (b.startTime ?? 0));
      const latest = features[features.length - 1];
      const pathCoords = features.slice(-MAX_PATH_LENGTH).map(f => f.geometry.coordinates);
      result.push({ registration, latest, pathCoords });
    }
    return result;
  }, [droneFeatures]);

  // ref to avoid stale closures in handlers
  const fleetsRef = useRef<Fleet[]>([]);
  useEffect(() => { fleetsRef.current = fleets; }, [fleets]);

  return { fleets, fleetsRef };
}
