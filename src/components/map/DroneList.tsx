"use client";

import {
  Box,
  Chip,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  Stack,
  Typography,
  Tabs,
  Tab,
  ListSubheader,
  Divider,
} from "@mui/material";
import { useMemo, useState } from "react";
import { useDroneStore } from "@/store/useDroneStore";
import CancelTwoToneIcon from "@mui/icons-material/CancelTwoTone";

type Feature = {
  type: "Feature";
  properties: {
    serial: string;
    registration: string; // e.g. SD-CB
    Name?: string;
    altitude?: number;
    pilot?: string;
    organization?: string;
    yaw?: number;
  };
  geometry: {
    type: "Point";
    coordinates: [number, number]; // [lng, lat]
  };
  startTime?: number;
};

type Fleet = {
  registration: string;
  latest: Feature;
  all: Feature[]; // full history for this registration (sorted ascending by startTime)
};

export default function DroneList({
  open,
  onToggle,
}: {
  open: boolean;
  onToggle: () => void;
}) {
  const [tabIndex, setTabIndex] = useState(0);

  // Store
  const dronesFromStore = useDroneStore((s) => s.drones);
  const selectedSerial = useDroneStore((s) => s.selectedSerial);
  const setSelectedSerial = useDroneStore((s) => s.setSelectedSerial);

  // Normalize whatever shape the store uses into an array of Feature
  const droneFeatures: Feature[] = useMemo(() => {
    if (!dronesFromStore) return [];
    if (Array.isArray(dronesFromStore)) return dronesFromStore as Feature[];
    return Object.values(dronesFromStore as Record<string, Feature>);
  }, [dronesFromStore]);

  // Group by registration → build a Fleet per registration
  const fleets: Fleet[] = useMemo(() => {
    const byReg = new Map<string, Feature[]>();
    for (const f of droneFeatures) {
      const reg = f.properties.registration;
      if (!byReg.has(reg)) byReg.set(reg, []);
      byReg.get(reg)!.push(f);
    }
    const list: Fleet[] = [];
    byReg.forEach((features, registration) => {
      // sort by startTime ascending (fallback to insertion if absent)
      features.sort((a, b) => (a.startTime ?? 0) - (b.startTime ?? 0));
      const latest = features[features.length - 1];
      list.push({ registration, latest, all: features });
    });
    // sort fleets by registration (stable) or by latest time desc if you prefer:
    // list.sort((a, b) => (b.latest.startTime ?? 0) - (a.latest.startTime ?? 0));
    return list;
  }, [droneFeatures]);

  return (
    <Box
      sx={{
        position: "absolute",
        left: open ? 0 : "-100%",
        top: 0,
        zIndex: 1200,
        width: { xs: "100%", sm: 300 },
        height: "100vh",
        backgroundColor: "#111111",
        color: "#ffffff",
        p: 2,
        overflowY: "auto",
        transition: "left 0.3s ease",
        scrollbarWidth: "none",
        msOverflowStyle: "none",
        WebkitOverflowScrolling: "touch",
      }}
    >
      <Box>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mb: 1,
          }}
        >
          <Typography variant="h6" fontWeight="bold">
            DRONE FLYING
          </Typography>

          <IconButton onClick={onToggle} size="small" sx={{ color: "#fff" }}>
            <CancelTwoToneIcon />
          </IconButton>
        </Box>

        <Tabs
          value={tabIndex}
          onChange={(_, val) => setTabIndex(val)}
          textColor="inherit"
          indicatorColor="primary"
          variant="fullWidth"
          sx={{
            "& .MuiTab-root": { color: "#888" },
            "& .Mui-selected": { color: "#fff" },
            mb: 2,
          }}
        >
          <Tab label="Drones" />
          <Tab label="Flights History" />
        </Tabs>
      </Box>

      {/* One row per REGISTRATION (latest point) */}
      {tabIndex === 0 && (
        <List>
          {fleets.map(({ registration, latest }) => {
            const isAllowed = registration.startsWith("SD-B");
            const isSelected = selectedSerial === latest.properties.serial;
            const name = latest.properties.Name || registration;

            return (
              <ListItem key={registration} disablePadding>
                <ListItemButton
                  selected={isSelected}
                  onClick={() => setSelectedSerial(latest.properties.serial)}
                  sx={{
                    border: "1px solid",
                    borderColor: isSelected ? "primary.main" : "divider",
                    backgroundColor: isSelected ? "action.selected" : "transparent",
                    "&:hover": {
                      backgroundColor: "action.hover",
                    },
                  }}
                >
                  <Box width="100%">
                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                      <Typography fontWeight="medium" color="#ffffff">
                        {name}
                      </Typography>
                      <Chip
                        size="small"
                        color={isAllowed ? "warning" : "error"}
                        sx={{
                          borderRadius: "50%",
                          height: "20px",
                          width: "20px",
                          p: 0,
                          display: "flex",
                          justifyContent: "center",
                          alignItems: "center",
                          backgroundColor: isAllowed ? "#FFD700" : "#FF0000",
                        }}
                      />
                    </Stack>

                    <Stack spacing={0.5} mt={1} direction="row" justifyContent="space-between">
                      <Stack spacing={0.5}>
                        <Typography fontSize="0.75rem" color="#ffffff">
                          Serial:
                        </Typography>
                        <Typography fontSize="0.75rem" color="#ffffff">
                          {latest.properties.serial}
                        </Typography>
                        <Typography fontSize="0.75rem" color="#ffffff">
                          Pilot:
                        </Typography>
                        <Typography fontSize="0.75rem" color="#ffffff">
                          {latest.properties.pilot || "Unknown"}
                        </Typography>
                      </Stack>
                      <Stack spacing={0.5}>
                        <Typography fontSize="0.75rem" color="#ffffff">
                          Registration:
                        </Typography>
                        <Typography fontSize="0.75rem" color="#ffffff">
                          {registration}
                        </Typography>
                        <Typography fontSize="0.75rem" color="#ffffff">
                          Organization:
                        </Typography>
                        <Typography fontSize="0.75rem" color="#ffffff">
                          {latest.properties.organization || "Unknown"}
                        </Typography>
                      </Stack>
                    </Stack>
                  </Box>
                </ListItemButton>
              </ListItem>
            );
          })}
        </List>
      )}

      {/* Flights history per REGISTRATION */}
      {tabIndex === 1 && (
        <List
          sx={{
            width: "100%",
            bgcolor: "transparent",
            p: 0,
          }}
        >
          {fleets.map(({ registration, all }) => {
            const recent = [...all].reverse().slice(0, 20); // newest first (last 20 points)
            return (
              <Box key={registration} sx={{ mb: 2, border: "1px solid #222", borderRadius: 1 }}>
                <ListSubheader
                  disableSticky
                  sx={{
                    bgcolor: "transparent",
                    color: "#ddd",
                    fontWeight: "bold",
                    px: 2,
                    py: 1.5,
                  }}
                >
                  {registration} — {recent.length} recent points
                </ListSubheader>
                <Divider sx={{ borderColor: "#222" }} />
                <List dense sx={{ p: 0 }}>
                  {recent.map((f, idx) => {
                    const t =
                      typeof f.startTime === "number"
                        ? new Date(f.startTime).toLocaleString()
                        : "Unknown time";
                    const [lng, lat] = f.geometry.coordinates;
                    const alt = f.properties.altitude ?? "—";
                    return (
                      <ListItem key={`${registration}-${idx}`} sx={{ py: 1, px: 2 }}>
                        <Box sx={{ width: "100%" }}>
                          <Typography fontSize="0.8rem" color="#fff">
                            {t}
                          </Typography>
                          <Typography fontSize="0.75rem" color="#bbb">
                            Serial: {f.properties.serial}
                          </Typography>
                          <Typography fontSize="0.75rem" color="#bbb">
                            Pos: {lat.toFixed(5)}, {lng.toFixed(5)} • Alt: {alt}
                          </Typography>
                        </Box>
                      </ListItem>
                    );
                  })}
                </List>
              </Box>
            );
          })}
        </List>
      )}
    </Box>
  );
}
