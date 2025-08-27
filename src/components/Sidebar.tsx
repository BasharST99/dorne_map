"use client";

import React from "react";
import { Box, List, ListItem, ListItemButton, ListItemIcon, ListItemText } from "@mui/material";
import MapIcon from './icons/MapIcon'; 
import DroneListIcon from './icons/DroneListIcon';


const Sidebar = React.memo(({ onClose }: { onClose?: () => void }) => {
    const menuItems = [
        { text: "Dashboard", icon: <DroneListIcon />, path: "/" },
        { text: "Map", icon: <MapIcon />, path: "/map" },
    ];

    return (
        <Box sx={{ backgroundColor: "#111111", color: "#fff", height: "100vh", width: 240 }}>
            <List>
                {menuItems.map((item) => (
                    <ListItem key={item.text} disablePadding>
                        <ListItemButton
                            href={item.path}
                            onClick={onClose} 
                        >
                            <ListItemIcon>{item.icon}</ListItemIcon>
                            <ListItemText primary={item.text} />
                        </ListItemButton>
                    </ListItem>
                ))}
            </List>
        </Box>
    );
});
Sidebar.displayName = "Sidebar";

export default Sidebar;