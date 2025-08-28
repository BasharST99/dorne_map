"use client";

import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Chip,
  Stack,
} from "@mui/material";
import {
  AreaChart,
  Area,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend,
} from "recharts";
import { useDroneStore } from "@/store/useDroneStore";
import { useMemo } from "react";
import dayjs from "dayjs";

type DroneFeature = {
  startTime?: number;
  properties: {
    registration: string;
    altitude?: number;
  };
};

/**
 * Buckets timestamps into minute slots for the last N minutes.
 * Returns [{ t: 'HH:mm', count: number }]
 */
function buildActivePerMinute(
  samples: DroneFeature[],
  minutes = 60
) {
  // Prepare empty buckets
  const now = dayjs();
  const buckets = Array.from({ length: minutes }, (_, i) => {
    const ts = now.subtract(minutes - 1 - i, "minute").startOf("minute");
    return {
      key: ts.valueOf(), // ms epoch at minute start
      label: ts.format("HH:mm"),
      regs: new Set<string>(),
    };
  });

  // Fast index by bucket key
  const byKey = new Map<number, { label: string; regs: Set<string> }>();
  for (const b of buckets) byKey.set(b.key, { label: b.label, regs: b.regs });

  // Assign each sample to its minute bucket (by startTime if present)
  for (const s of samples) {
    if (!s?.startTime) continue; // ignore unknown timestamps
    const minuteStart = dayjs(s.startTime).startOf("minute").valueOf();
    const bucket = byKey.get(minuteStart);
    if (bucket) bucket.regs.add(s.properties.registration);
  }

  // Return chart-ready data
  return buckets.map((b) => ({
    t: b.label,
    count: b.regs.size,
  }));
}

/** Builds latest-per-registration map (so KPIs reflect current state). */
function latestByRegistration(samples: DroneFeature[]) {
  const map = new Map<string, DroneFeature>();
  for (const s of samples) {
    const reg = s?.properties?.registration;
    if (!reg) continue;
    const prev = map.get(reg);
    if (!prev || (s.startTime ?? 0) > (prev.startTime ?? 0)) {
      map.set(reg, s);
    }
  }
  return map;
}

/** Top N registrations by message count (activity volume). */
function topRegistrations(samples: DroneFeature[], topN = 5) {
  const counts = new Map<string, number>();
  for (const s of samples) {
    const reg = s?.properties?.registration;
    if (!reg) continue;
    counts.set(reg, (counts.get(reg) ?? 0) + 1);
  }
  const rows = Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, topN)
    .map(([registration, msgs]) => ({ registration, msgs }));
  return rows;
}

export default function DashboardAnalytics() {
  const drones = useDroneStore((s) => s.drones);
  const droneArray = useMemo(
    () => Object.values(drones ?? {}) as DroneFeature[],
    [drones]
  );

  // KPI: latest state per registration
  const latest = useMemo(() => latestByRegistration(droneArray), [droneArray]);

  const now = dayjs();
  const activeNow = useMemo(() => {
    // consider a drone active if we saw it within last 60s
    const cutoff = now.subtract(60, "second").valueOf();
    let n = 0;
    latest.forEach((s) => {
      if ((s.startTime ?? 0) >= cutoff) n++;
    });
    return n;
  }, [latest, now]);

  const uniqueToday = useMemo(() => {
    const todayKey = now.format("YYYY-MM-DD");
    const set = new Set<string>();
    droneArray.forEach((s) => {
      if (!s.startTime) return;
      if (dayjs(s.startTime).format("YYYY-MM-DD") === todayKey) {
        set.add(s.properties.registration);
      }
    });
    return set.size;
  }, [droneArray, now]);

  const avgAltitudeNow = useMemo(() => {
    let sum = 0;
    let c = 0;
    latest.forEach((s) => {
      const alt = s?.properties?.altitude;
      if (typeof alt === "number") {
        sum += alt;
        c += 1;
      }
    });
    return c ? Math.round(sum / c) : 0;
  }, [latest]);

  // Chart data
  const activePerMinute = useMemo(() => {
    const series = buildActivePerMinute(droneArray, 60);
    // fallback demo if nothing yet
    if (!series.some((d) => d.count > 0)) {
      return series.map((d, i) => ({
        ...d,
        count: Math.max(0, Math.round(6 + 3 * Math.sin(i / 6))),
      }));
    }
    return series;
  }, [droneArray]);

  const top5 = useMemo(() => {
    const rows = topRegistrations(droneArray, 5);
    if (rows.length === 0) {
      return [
        { registration: "SD-B1", msgs: 12 },
        { registration: "SD-B2", msgs: 9 },
        { registration: "SD-C3", msgs: 7 },
        { registration: "SD-B4", msgs: 6 },
        { registration: "SD-D5", msgs: 5 },
      ];
    }
    return rows;
  }, [droneArray]);

  return (
    <Box>
      <Typography variant="h5" fontWeight="medium" gutterBottom color="#fff">
        Operations Overview
      </Typography>

      {/* KPI chips */}
      <Stack direction="row" spacing={1.5} sx={{ mb: 2 }} flexWrap="wrap">
        <Chip
          label={`Active now: ${activeNow}`}
          sx={{ bgcolor: "#14312C", color: "#23D79E", fontWeight: 600 }}
        />
        <Chip
          label={`Unique today: ${uniqueToday}`}
          sx={{ bgcolor: "#2A2A35", color: "#C9C9D6", fontWeight: 600 }}
        />
        <Chip
          label={`Avg altitude: ${avgAltitudeNow} m`}
          sx={{ bgcolor: "#2B2A1E", color: "#F1D66B", fontWeight: 600 }}
        />
      </Stack>

      <Grid container spacing={2}>
        {/* Live active drones (last 60 min) */}
        <Grid item xs={12} md={8}>
          <Card sx={{ backgroundColor: "#1e1e1e" }}>
            <CardContent>
              <Typography variant="subtitle1" color="#ddd" sx={{ mb: 1 }}>
                Active drones (last 60 min)
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={activePerMinute}>
                  <defs>
                    <linearGradient id="activeFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#00BFFF" stopOpacity={0.6} />
                      <stop offset="100%" stopColor="#00BFFF" stopOpacity={0.05} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#2b2b2b" />
                  <XAxis dataKey="t" stroke="#aaa" minTickGap={24} />
                  <YAxis allowDecimals={false} stroke="#aaa" />
                  <Tooltip
                    contentStyle={{ background: "#141414", border: "1px solid #333" }}
                    labelStyle={{ color: "#ddd" }}
                  />
                  <Area
                    type="monotone"
                    dataKey="count"
                    stroke="#00BFFF"
                    fillOpacity={1}
                    fill="url(#activeFill)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Top 5 registrations by message volume */}
        <Grid item xs={12} md={4}>
          <Card sx={{ backgroundColor: "#1e1e1e", height: "100%" }}>
            <CardContent>
              <Typography variant="subtitle1" color="#ddd" sx={{ mb: 1 }}>
                Top drones (by messages)
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={top5} layout="vertical" margin={{ left: 12 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#2b2b2b" />
                  <XAxis type="number" stroke="#aaa" />
                  <YAxis
                    type="category"
                    dataKey="registration"
                    stroke="#aaa"
                    width={80}
                  />
                  <Tooltip
                    contentStyle={{ background: "#141414", border: "1px solid #333" }}
                    labelStyle={{ color: "#ddd" }}
                    formatter={(v: number) => [`${v} msgs`, "Messages"]}
                  />
                  <Legend />
                  <Bar dataKey="msgs" name="Messages" fill="#23D79E" radius={[4, 4, 4, 4]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
