"use client";

import {
  Box,
  Typography,
  Card,
  CardContent,
  TextField,
} from "@mui/material";
import {
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { useDroneStore } from "@/store/useDroneStore";
import { useMemo, useState } from "react";
import dayjs from "dayjs";

export default function DashboardAnalytics() {
  const drones = useDroneStore((s) => s.drones);
  const droneArray = Object.values(drones);

  const [filterDate, setFilterDate] = useState("2025-07-20");

  const activityData = useMemo(() => {
    if (droneArray.length === 0) {
      return [
        { date: "2025-07-01", count: 2 },
        { date: "2025-07-05", count: 4 },
        { date: "2025-07-10", count: 1 },
        { date: "2025-07-15", count: 5 },
        { date: "2025-07-18", count: 3 },
        { date: "2025-07-20", count: 6 },
      ];
    }

    const grouped: Record<string, number> = {};

    droneArray.forEach((drone) => {
      const ts = drone.startTime ?? Date.now(); 
      const date = dayjs(ts).format("YYYY-MM-DD");
      grouped[date] = (grouped[date] || 0) + 1;
    });

    return Object.entries(grouped).map(([date, count]) => ({
      date,
      count,
    }));
  }, [droneArray]);

  const filtered = activityData.filter((d) =>
    d.date.includes(filterDate.slice(0, 7))
  );

  return (
    <Box>
      <Typography variant="h5" fontWeight="medium" gutterBottom color="#fff">
        Drone Activity Chart
      </Typography>

      <TextField
        type="month"
        label="Filter by Month"
        size="small"
        value={filterDate.slice(0, 7)}
        onChange={(e) => setFilterDate(e.target.value + "-01")}
        sx={{ mb: 2 }}
        InputLabelProps={{ style: { color: "#ccc" } }}
        InputProps={{ style: { color: "#fff" } }}
      />

      <Card sx={{ backgroundColor: "#1e1e1e" }}>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={filtered}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" stroke="#aaa" />
              <YAxis allowDecimals={false} stroke="#aaa" />
              <Tooltip />
              <Line type="monotone" dataKey="count" stroke="#00BFFF" />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </Box>
  );
}
