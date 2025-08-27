"use client";

import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { useDroneStore } from "@/store/useDroneStore";
import {  Typography, Paper } from "@mui/material";

const COLORS = ["#00C49F", "#FF8042"];

const DronePieChart = () => {
  const drones = useDroneStore((s) => s.drones);

  const active = Object.values(drones).filter((d) => d.properties.registration.startsWith("SD-B"));
  const inactive = Object.values(drones).filter((d) => !d.properties.registration.startsWith("SD-B"));

  const data =
    active.length + inactive.length === 0
      ? [
          { name: "Active", value: 6 },
          { name: "Inactive", value: 3 },
        ]
      : [
          { name: "Active", value: active.length },
          { name: "Inactive", value: inactive.length },
        ];

  return (
    <Paper elevation={3} sx={{ backgroundColor: "#1e1e1e", p: 3, borderRadius: 2, overflow: "hidden" }}>
      <Typography variant="h6" color="#fff" mb={2}>
        Active vs Inactive Drones
      </Typography>
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            outerRadius={90}
            innerRadius={40}
            fill="#8884d8"
            dataKey="value"
            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
          >
            {data.map((_, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip formatter={(value: number) => `${value} drones`} />
          <Legend verticalAlign="bottom" height={36} />
        </PieChart>
      </ResponsiveContainer>
    </Paper>
  );
};

export default DronePieChart;
