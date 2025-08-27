"use client";

import { CssBaseline, ThemeProvider } from "@mui/material";

import AppBarComponent from "@/components/AppBar";
import Sidebar from "@/components/Sidebar";
import { Box } from "@mui/material";
import { useState } from "react";
import { Drawer, useMediaQuery } from "@mui/material";
import theme from "@/theme";


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const drawerWidth = 240;

  return (
    <html lang="en">
      <body>
        <ThemeProvider theme={theme}>
          <CssBaseline />

          <AppBarComponent onMenuClick={() => setMobileOpen(true)} />

          <Box sx={{ display: "flex", height: "100vh" }}>
            {!isMobile && (
              <Box sx={{ width: drawerWidth, flexShrink: 0 }}>
                <Sidebar />
              </Box>
            )}

            {isMobile && (
              <Drawer
                variant="temporary"
                open={mobileOpen}
                onClose={() => setMobileOpen(false)}
                ModalProps={{
                  keepMounted: true,
                }}
                sx={{
                  display: { xs: "block", sm: "none" },
                  "& .MuiDrawer-paper": {
                    width: 240,
                    height: "100%",
                    backgroundColor: "#111111",
                    color: "#fff",
                    boxSizing: "border-box",
                  },
                }}
              >
                <Sidebar onClose={() => setMobileOpen(false)} />
              </Drawer>
            )}

            <Box
              sx={{
                flexGrow: 1,

                transition: "padding-left 0.3s ease",
              }}
            >
              {children}
            </Box>
          </Box>
        </ThemeProvider>
      </body>
    </html>
  );
}
