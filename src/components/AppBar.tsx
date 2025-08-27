"use client";

import {
  AppBar,
  Toolbar,
  IconButton,
  Typography,
  Box,
  Badge,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import { Notifications as NotificationsIcon, Menu as MenuIcon } from "@mui/icons-material";
import Image from "next/image";
import ScreenIcon from "@/components/icons/Screen";
import LanguageIcon from "@/components/icons/language";
import Logo from "@/components/icons/logo"; 

export default function AppBarComponent({ onMenuClick }: { onMenuClick?: () => void }) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  return (
    <Box sx={{ flexGrow: 1 }}>
      <AppBar position="sticky" sx={{ backgroundColor: "#0b0a0a", boxShadow: "none" }}>
        <Toolbar sx={{ px: isMobile ? 1 : 3, minHeight: isMobile ? 56 : 64 }}>
          {isMobile && onMenuClick && (
            <IconButton color="inherit" edge="start" onClick={onMenuClick} sx={{ mr: 1 }}>
              <MenuIcon />
            </IconButton>
          )}

            <Box sx={{ flexGrow: 1}}>
              <IconButton color="inherit">
                <Logo />
              </IconButton>
            </Box>

          <Box sx={{ display: "flex", alignItems: "center", gap: isMobile ? 1 : 2 }}>
            <IconButton color="inherit">
              <ScreenIcon />
            </IconButton>
            <IconButton color="inherit">
              <LanguageIcon />
            </IconButton>
            <IconButton color="inherit">
              <Badge badgeContent={8} color="error">
                <NotificationsIcon />
              </Badge>
            </IconButton>

            {!isMobile && (
              <div
                style={{
                  borderLeft: "2px solid #3C4248",
                  height: 40,
                  margin: "0 10px",
                }}
              />
            )}

            {!isMobile && (
              <Box>
                <Typography variant="body1" sx={{ color: "#fff" }}>
                  Hello <strong>Bashar Telfah</strong>
                </Typography>
                <Typography variant="body2" sx={{ color: "#ccc" }}>
                  Software Engineer
                </Typography>
              </Box>
            )}
          </Box>
        </Toolbar>
      </AppBar>
    </Box>
  );
}
