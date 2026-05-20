import {
  BarChart,
} from "@mui/x-charts/BarChart"

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

  const infokomData = data.filter(
    (item) => item.LAM === "Infokom"
  )

  const embaData = data.filter(
    (item) => item.LAM === "Emba"
  )

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
            },
          ]}

          series={[
            {
              dataKey: "total_prodi",
              label: "Prodi",
              stack: "total",
            },
            {
              dataKey: "total_lpmi",
              label: "LPMI",
              stack: "total",
            },
            {
              dataKey: "total_assesor",
              label: "Assesor",
              stack: "total",
            },
          ]}

          height={450}
        />
      </Box>
    </Paper>
  )

  return (
    <Grid container spacing={3} mb={3}>

      <Grid size={{ xs: 12, md: 6 }}>
        {renderChart(
          "LAM Infokom",
          infokomData
        )}
      </Grid>

      <Grid size={{ xs: 12, md: 6 }}>
        {renderChart(
          "LAM Emba",
          embaData
        )}
      </Grid>

    </Grid>
  )
}