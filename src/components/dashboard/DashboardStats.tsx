"use client";

import { Box, Card, CardContent, Grid, Typography } from "@mui/material";
import { useDroneStore } from "@/store/useDroneStore";

export default function DashboardStats() {
  const drones = useDroneStore((s) => s.drones);
  const droneArray = Object.values(drones);

  const active = droneArray.filter((d) =>
    d.properties.registration.startsWith("SD-B")
  );
  const inactive = droneArray.length - active.length;

  const stats = [
    { label: "Total Drones", value: droneArray.length },
    { label: "Active Drones", value: active.length },
    { label: "Inactive Drones", value: inactive },
  ];

  return (
    <Grid container spacing={2}>
      {stats.map((stat) => (
        <Grid item xs={12} sm={4} key={stat.label}>
          <Card sx={{ backgroundColor: "#1e1e1e", color: "#fff" }}>
            <CardContent>
              <Typography variant="h6" color="gray">
                {stat.label}
              </Typography>
              <Typography variant="h4" fontWeight="bold">
                {stat.value}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      ))}
    </Grid>
  );
}
