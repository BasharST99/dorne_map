"use client";

import { Stack, Typography, Divider } from "@mui/material";
import DashboardAnalytics from "@/components/dashboard/DashboardStats";
import RecentDrones from "@/components/dashboard/RecentDrones";
import DronePieChart from "@/components/dashboard/DronePieChart";
import { useWebSocket } from "@/hooks/useWebSocket";

export default function DashboardPage() {
    useWebSocket(); 
  return (
    <Stack>
      <Typography variant="h4" fontWeight="bold" gutterBottom>
        Drone Dashboard
      </Typography>

      {/* <DashboardStats /> */}
      <Divider sx={{ my: 4 }} />

      <RecentDrones />

        <DashboardAnalytics />
      <Stack direction="column" spacing={2} sx={{ mt: 4 }} width={"100%"}>
        <DronePieChart />
      </Stack>


    </Stack>
  );
}
