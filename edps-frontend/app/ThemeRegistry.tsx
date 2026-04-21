"use client";

import * as React from "react";
import { ThemeProvider, CssBaseline } from "@mui/material";
import { createTheme } from '@mui/material/styles';
import { store } from "./service/store";
import { Provider } from "react-redux";

const theme = createTheme({
  palette: {
    primary: {
      main: '#800607',
      light: '#FEE9E7',
      dark: '#5a0405',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#dc004e',
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        containedPrimary: {
          backgroundColor: '#800607',
          '&:hover': {
            backgroundColor: '#5a0405',
          },
        },
      },
    },
  },
});


export default function ThemeRegistry({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Provider store={store}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </Provider>
  );
}
