"use client";

import { Box, Card, CardContent, Typography, Grid } from "@mui/material";
import { useDroneStore } from "@/store/useDroneStore";

export default function RecentDrones() {
  const drones = useDroneStore((s) => s.drones);
  const droneArray = Object.values(drones ?? {});

  // Pick the latest sample for each registration
  const latestByReg = new Map<string, any>();
  for (const d of droneArray) {
    const reg = d.properties.registration;
    const ts = d.startTime ?? 0;
    const prev = latestByReg.get(reg);
    if (!prev || (ts > (prev.startTime ?? 0))) latestByReg.set(reg, d);
  }

  const recent = Array.from(latestByReg.values())
    .sort((a, b) => (b.startTime || 0) - (a.startTime || 0))
    .slice(0, 6);

  return (
    <Box>
      <Typography variant="h5" fontWeight="medium" gutterBottom>
        Recent Drones
      </Typography>
      <Grid container spacing={2}>
        {recent.map((drone: any) => (
          <Grid item xs={12} sm={6} md={4} key={drone.properties.registration}>
            <Card>
              <CardContent>
                <Typography variant="subtitle1" fontWeight="bold">
                  {drone.properties.Name}
                </Typography>
                <Typography variant="body2">
                  Registration: {drone.properties.registration}
                </Typography>
                <Typography variant="body2">
                  Serial: {drone.properties.serial}
                </Typography>
                <Typography variant="body2">
                  Pilot: {drone.properties.pilot || "Unknown"}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}
