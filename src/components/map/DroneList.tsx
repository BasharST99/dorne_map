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
} from "@mui/material";
import { useState } from "react";
import { useDroneStore } from "@/store/useDroneStore";
import CancelTwoToneIcon from '@mui/icons-material/CancelTwoTone';

export default function DroneList({
  open,
  onToggle,
}: {
  open: boolean;
  onToggle: () => void;
}) {
  const [tabIndex, setTabIndex] = useState(0);
  const drones = useDroneStore((state) => state.drones);
  const selectedSerial = useDroneStore((state) => state.selectedSerial);
  const setSelectedSerial = useDroneStore((state) => state.setSelectedSerial);

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
        padding: 2,
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

      {tabIndex === 0 && (
        <List>
          {Object.values(drones).map((drone) => {
            const isAllowed = drone.properties.registration.startsWith("SD-B");
            const isSelected = selectedSerial === drone.properties.serial;

            return (
              <ListItem key={drone.properties.serial} disablePadding>
                <ListItemButton
                  selected={isSelected}
                  onClick={() => setSelectedSerial(drone.properties.serial)}
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
                        {drone.properties.Name}
                      </Typography>
                      <Chip
                        size="small"
                        color={isAllowed ? "warning" : "error"}
                        sx={{
                          borderRadius: "50%",
                          height: "20px",
                          width: "20px",
                          padding: 0,
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
                          {drone.properties.serial}
                        </Typography>
                        <Typography fontSize="0.75rem" color="#ffffff">
                          Pilot:
                        </Typography>
                        <Typography fontSize="0.75rem" color="#ffffff">
                          {drone.properties.pilot || "Unknown"}
                        </Typography>
                      </Stack>
                      <Stack spacing={0.5}>
                        <Typography fontSize="0.75rem" color="#ffffff">
                          Registration:
                        </Typography>
                        <Typography fontSize="0.75rem" color="#ffffff">
                          {drone.properties.registration}
                        </Typography>
                        <Typography fontSize="0.75rem" color="#ffffff">
                          Organization:
                        </Typography>
                        <Typography fontSize="0.75rem" color="#ffffff">
                          {drone.properties.organization || "Unknown"}
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

      {tabIndex === 1 && (
        <Box sx={{ p: 1 }}>
          <Typography variant="body2" color="#ccc">
            Flights history is not implemented yet.
          </Typography>
        </Box>
      )}
    </Box>
  );
}
