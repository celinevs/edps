import {
  Paper,
  Typography,
  Box,
} from "@mui/material"
import { RadarReport } from "@/model/Akreditasi"
import {
  RadarChart,
} from "@mui/x-charts/RadarChart"

interface Props {
  data: RadarReport
}

export default function AccreditationRadarChart({
  data,
}: Props) {

  return (
    <Paper
      elevation={2}
      sx={{
        p: 3,
        borderRadius: 3,
        height: 550,
      }}
    >
      <Typography
        variant="h6"
        fontWeight={700}
        mb={3}
      >
        Accreditation Indicator Radar
      </Typography>

      <Box
        sx={{
          width: "100%",
        }}
      >
        <RadarChart
          height={450}

          series={[
            {
              label: "Unggul",
              data: data.datasets.u,
            },
            {
              label: "Memenuhi",
              data: data.datasets.m,
            },
            {
              label: "Belum Memenuhi",
              data: data.datasets.bm,
            },
          ]}

          radar={{
            metrics: data.labels.map((label) => ({
              name: label,
              max: 100,
            })),
          }}
        />
      </Box>
    </Paper>
  )
}