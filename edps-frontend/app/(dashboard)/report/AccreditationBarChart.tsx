import { BarChart } from "@mui/x-charts/BarChart"

import {
  Paper,
  Typography,
  Box,
  Grid,
} from "@mui/material"

import { BarReport } from "@/model/Akreditasi"

interface Props {
  data: BarReport[]
}

export default function AccreditationBarChart({
  data,
}: Props) {

  const renderChart = (
    title: string,
    chartData: BarReport[]
  ) => (
    <Paper
      elevation={2}
      sx={{
        p: 3,
        borderRadius: 3,
      }}
    >
      <Typography
        variant="h6"
        fontWeight={700}
        mb={3}
      >
        {title}
      </Typography>

      <Box sx={{ width: "100%", height: 500 }}>
        <BarChart
          dataset={chartData}
          xAxis={[
            {
              scaleType: "band",
              dataKey: "major",
              categoryGapRatio: 0.2,
              barGapRatio: -1, // overlap bars
            },
          ]}
          series={[
            {
              dataKey: "total_prodi",
              label: "Prodi",
            },
            {
              dataKey: "total_lpmi",
              label: "LPMI",
            },
            {
              dataKey: "total_assesor",
              label: "Assesor",
            },
          ]}
          height={450}
        />
      </Box>
    </Paper>
  )

  return (
    <Grid container spacing={3} mb={3}>
      <Grid size={{ xs: 12, md: 12 }}>
        {renderChart(
          "LAM Emba",
          data
        )}
      </Grid>
    </Grid>
  )
}