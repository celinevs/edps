import {
  Box,
  Chip,
  Grid,
  Paper,
  Stack,
  Typography,
} from "@mui/material"
import { RiskPerMajor } from "@/model/Akreditasi"

interface Props {
  riskPerMajor: RiskPerMajor[]
}

export default function RiskOverview({
  riskPerMajor,
}: Props) {

  const highRiskData = riskPerMajor.filter(
    (item) => item.risk_level_combined === "High"
  )

  const midRiskData = riskPerMajor.filter(
    (item) => item.risk_level_combined === "Medium"
  )

  const lowRiskData = riskPerMajor.filter(
    (item) => item.risk_level_combined === "Low"
  )

  const renderRiskColumn = (
    title: string,
    data: RiskPerMajor[],
    lightColor: string,
    darkColor: string
  ) => (
    <Box>
      <Typography
        variant="subtitle1"
        fontWeight={600}
        textAlign="center"
        mb={2}
      >
        {title}
      </Typography>

      <Stack spacing={1.5}>
        {data.map((item) => (
          <Box
            key={item.major}
            display="flex"
            borderRadius={2}
            overflow="hidden"
            width="100%"
          >
            <Box
              flex={1}
              px={2}
              py={1}
              bgcolor={lightColor}
              alignItems="center"
            >
              <Typography fontWeight={600}>
                {item.major}
              </Typography>
            </Box>

            <Box
              px={2}
              py={1}
              bgcolor={darkColor}
              display="flex"
              alignItems="center"
              justifyContent="center"
              minWidth={60}
            >
              <Typography fontWeight={700}>
                {(item.risk_score_combined).toFixed(3)}
              </Typography>
            </Box>
          </Box>
        ))}
      </Stack>
    </Box>
  )

  return (
    <Paper
      elevation={2}
      sx={{
        p: 3,
        borderRadius: 3,
        mb: 3
      }}
    >
      <Grid container spacing={4} justifyContent='space-between'>

        <Grid size={{ xs: 12, md: 3 }}>
          {renderRiskColumn(
            "High Risk",
            highRiskData,
            "#f8d7da",
            "#f28b82"
          )}
        </Grid>

        <Grid size={{ xs: 12, md: 3 }}>
          {renderRiskColumn(
            "Mid Risk",
            midRiskData,
            "#fff3cd",
            "#fbc02d"
          )}
        </Grid>

        <Grid size={{ xs: 12, md: 3 }}>
          {renderRiskColumn(
            "Low Risk",
            lowRiskData,
            "#d4edda",
            "#81c784"
          )}
        </Grid>

      </Grid>
    </Paper>
  )
}