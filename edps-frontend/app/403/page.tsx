"use client";

import { Box, Button, Typography } from "@mui/material";
import { useRouter } from "next/navigation";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";

export default function BlockPage() {
  const router = useRouter();

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        px: 2,
      }}
    >
      <Box textAlign="center">
        <LockOutlinedIcon
          sx={{
            fontSize: 80,
            color: "text.secondary",
            mb: 2,
          }}
        />

        <Typography variant="h2" fontWeight={700}>
          403
        </Typography>

        <Typography variant="h6" sx={{ mt: 1 }}>
          Access Denied
        </Typography>

        <Typography color="text.secondary" sx={{ mt: 1, mb: 3 }}>
          You don't have permission to access this page.
        </Typography>

        <Button
          variant="contained"
          onClick={() => router.push("/")}
        >
          Back to Home
        </Button>
      </Box>
    </Box>
  );
}