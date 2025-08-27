"use client";

import { Box, Card, CardContent, Typography, Grid } from "@mui/material";
import { useDroneStore } from "@/store/useDroneStore";

export default function RecentDrones() {
  const drones = useDroneStore((s) => s.drones);
  const recent = Object.values(drones)
    .sort((a, b) => (b.startTime || 0) - (a.startTime || 0))
    .slice(0, 6);

  return (
    <Box>
      <Typography variant="h5" fontWeight="medium" gutterBottom>
        Recent Drones
      </Typography>
      <Grid container spacing={2}>
        {recent.map((drone) => (
          <Grid item xs={12} sm={6} md={4} key={drone.properties.serial}>
            <Card>
              <CardContent>
                <Typography variant="subtitle1" fontWeight="bold">
                  {drone.properties.Name}
                </Typography>
                <Typography variant="body2">Serial: {drone.properties.serial}</Typography>
                <Typography variant="body2">
                  Registration: {drone.properties.registration}
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
