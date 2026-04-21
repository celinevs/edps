import React from "react";
import { Card, CardContent, Typography, Box } from "@mui/material";

type StatCardProps = {
  title: string;
  value: number | string;
  icon: React.ReactNode;
  iconColor?: string;
};

export default function StatCard({
  title,
  value,
  icon,
  iconColor = "#5b0f0f",
}: StatCardProps) {
  return (
    <Card
      sx={{
        borderRadius: 3,
        boxShadow: "0px 2px 8px rgba(0,0,0,0.15)",
        border: "1px solid #e0e0e0",
        minHeight: 110,
      }}
    >
      <CardContent
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          height: "100%",
        }}
      >
        <Box>
          <Typography
            variant="body2"
            sx={{ color: "text.secondary", mb: 1 }}
          >
            {title}
          </Typography>

          <Typography variant="h4" fontWeight="bold">
            {value}
          </Typography>
        </Box>

        <Box sx={{ color: iconColor, fontSize: 50 }}>
          {icon}
        </Box>
      </CardContent>
    </Card>
  );
}