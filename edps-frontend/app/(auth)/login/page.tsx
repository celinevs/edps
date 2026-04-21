"use client";

import {
  Box,
  Button,
  Paper,
  Typography,
  Avatar,
} from "@mui/material";
import SchoolOutlinedIcon from '@mui/icons-material/SchoolOutlined';
import GoogleIcon from '@mui/icons-material/Google';
import { useCallback } from "react";

const LoginPage = () => {
  const handleGoogleLogin = useCallback(() => {
    window.location.href = "http://localhost:5000/login/google";
  }, []);

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Paper
        elevation={6}
        sx={{
          p: 4,
          width: 350,
          borderRadius: 3,
          textAlign: "center",
        }}
      >
        <Avatar
          sx={{
            bgcolor: "#f5d6d6",
            color: "#8b0000",
            mx: "auto",
            mb: 2,
          }}
        >
          <SchoolOutlinedIcon />
        </Avatar>

        <Typography variant="h6" color="#8b0000">
          EDPS CIT
        </Typography>

        <Typography variant="body2" color="text.secondary" mb={3}>
          Sistem Evaluasi Diri Program Studi CIT
        </Typography>

        <Button
          fullWidth
          variant="contained"
          onClick={handleGoogleLogin}
          startIcon={<GoogleIcon />}
        >
          Sign in with Google
        </Button>
      </Paper>
    </Box>
  );
};

export default LoginPage;