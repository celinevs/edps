"use client";

import { LineChart, BarChart } from "@mui/x-charts";
import { useGetDashboardMLQuery } from "@/api/akreditasi";
import {
    Box,
    Card,
    CardContent,
    Grid,
    Typography,
    Skeleton,
    Alert,
    Chip,
    Paper,
    Stack,
    alpha,
    useTheme,
} from "@mui/material";

// ── Types ─────────────────────────────────────────────────────────────────────

interface TreeDistributionBin {
    binStart: number;
    binEnd: number;
    binLabel: string;
    count: number;
    zone: "mean" | "inside_ci" | "outside_ci";
}

interface ActualVsPredictedPoint {
    label: string;
    year: number;
    major: string;
    exam: string;
    actual: number | null;
    predicted: number;
    lowerBound: number;
    upperBound: number;
    isHighlight: boolean;
}

interface PredictionMeta {
    model: string;
    nTrees: number;
    futureYear: number;
    totalRows: number;
    ciLowerPct: number;
    ciUpperPct: number;
    predMin: number;
    predMax: number;
    predMean: number;
    predMedian: number;
    highlightedLabel: string;
    highlightedScore: number;
    highlightedStdDev: number;
    highlightedLower: number;
    highlightedUpper: number;
    highlightedPercentile: number;
    highlightedTreePredictions: number[];
}

interface PredictionResponse {
    data: {
        data: {
            meta: PredictionMeta;
            treeDistribution: TreeDistributionBin[];
            actualVsPredicted: ActualVsPredictedPoint[];
        }
    };
    message: string;
}

// ── Zone colours ──────────────────────────────────────────────────────────────
const ZONE_COLOR: Record<TreeDistributionBin["zone"], { bg: string; light: string; label: string }> = {
    mean: { bg: "#3b82f6", light: "#dbeafe", label: "Mean Bin" },
    inside_ci: { bg: "#22c55e", light: "#dcfce7", label: "Inside CI" },
    outside_ci: { bg: "#ef4444", light: "#fee2e2", label: "Outside CI" },
};

// ── Component ─────────────────────────────────────────────────────────────────
export default function MLPage() {
    const theme = useTheme();
    const { data, isLoading, isError } = useGetDashboardMLQuery();

    if (isLoading) {
        return (
            <Box sx={{ p: 3 }}>
                <Skeleton variant="rectangular" height={200} sx={{ borderRadius: 2, mb: 3 }} />
                <Grid container spacing={3}>
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                        <Grid size={{ xs: 12, sm: 6, md: 4, lg: 2 }} key={i}>
                            <Skeleton variant="rounded" height={100} />
                        </Grid>
                    ))}
                </Grid>
                <Skeleton variant="rectangular" height={400} sx={{ borderRadius: 2, mt: 3 }} />
                <Skeleton variant="rectangular" height={400} sx={{ borderRadius: 2, mt: 3 }} />
            </Box>
        );
    }

    if (isError || !data) {
        return (
            <Box sx={{ p: 3 }}>
                <Alert severity="error" sx={{ borderRadius: 2 }}>
                    Failed to load prediction data. Please try again later.
                </Alert>
            </Box>
        );
    }

    const response = data as PredictionResponse;
    const { meta, treeDistribution, actualVsPredicted } = response?.data.data ?? {};

    if (!meta || !treeDistribution || !actualVsPredicted) {
        return (
            <Box sx={{ p: 3 }}>
                <Alert severity="warning" sx={{ borderRadius: 2 }}>
                    No prediction data available.
                </Alert>
            </Box>
        );
    }

    // ── Derived data for Chart 1 (tree distribution histogram) ───────────────
    const histLabels = treeDistribution.map((b) => b.binLabel);
    const histCounts = treeDistribution.map((b) => b.count);

    // ── Derived data for Chart 2 (actual vs predicted line) ──────────────────
    const avpLabels = actualVsPredicted.map((p) => String(p.year));
    const avpActual = actualVsPredicted.map((p) => p.actual);
    const avpPredicted = actualVsPredicted.map((p) => p.predicted);
    const avpLower = actualVsPredicted.map((p) => p.lowerBound);
    const avpUpper = actualVsPredicted.map((p) => p.upperBound);

    const statCards = [
        { label: "Selection", value: meta.highlightedLabel, icon: "📌" },
        { label: "Predicted", value: meta.highlightedScore.toFixed(3), icon: "🎯" },
        { label: "Std Dev", value: meta.highlightedStdDev.toFixed(3), icon: "📊" },
        { label: `CI ${meta.ciLowerPct}%`, value: meta.highlightedLower.toFixed(3), icon: "⬇️" },
        { label: `CI ${meta.ciUpperPct}%`, value: meta.highlightedUpper.toFixed(3), icon: "⬆️" },
        { label: "Percentile", value: `${meta.highlightedPercentile}%`, icon: "📈" },
    ];

    return (
        <Box sx={{ p: { xs: 2, sm: 3, md: 4 }, maxWidth: 1400, mx: "auto" }}>
            {/* ── Header Section ── */}
            <Card
                elevation={0}
                sx={{
                    borderRadius: 4,
                    mb: 4,
                    background: `linear-gradient(135deg, ${alpha(theme.palette.primary.dark, 0.05)} 0%, ${alpha(theme.palette.primary.light, 0.02)} 100%)`,
                    border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                }}
            >
                <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
                    <Typography
                        variant="h4"
                        fontWeight="700"
                        sx={{
                            background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
                            backgroundClip: "text",
                            WebkitBackgroundClip: "text",
                            WebkitTextFillColor: "transparent",
                            mb: 1,
                        }}
                    >
                        ML Prediction Dashboard
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        {meta.model.replace(/_/g, " ")} — Advanced Forecast Analysis
                    </Typography>
                    <Stack direction="row" flexWrap="wrap" spacing={2} useFlexGap>
                        <Chip
                            label={`Forecast Year: ${meta.futureYear}`}
                            size="small"
                            color="primary"
                            variant="outlined"
                        />
                        <Chip
                            label={`Trees: ${meta.nTrees}`}
                            size="small"
                            variant="outlined"
                        />
                        <Chip
                            label={`Rows: ${meta.totalRows}`}
                            size="small"
                            variant="outlined"
                        />
                        <Chip
                            label={`CI: ${meta.ciLowerPct}–${meta.ciUpperPct}%`}
                            size="small"
                            color="info"
                            variant="outlined"
                        />
                    </Stack>
                </CardContent>
            </Card>

            {/* ── Stats Grid ── */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
                {statCards.map(({ label, value, icon }) => (
                    <Grid size={{ xs: 12, sm: 6, md: 4, lg: 2 }} key={label}>
                        <Card
                            elevation={0}
                            sx={{
                                borderRadius: 3,
                                height: "100%",
                                border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                                transition: "all 0.2s ease",
                                "&:hover": {
                                    borderColor: alpha(theme.palette.primary.main, 0.3),
                                    boxShadow: theme.shadows[2],
                                },
                            }}
                        >
                            <CardContent>
                                <Typography variant="caption" color="text.secondary" sx={{ letterSpacing: 1 }}>
                                    {icon} {label}
                                </Typography>
                                <Typography
                                    variant="h6"
                                    fontWeight="600"
                                    sx={{
                                        mt: 1,
                                        wordBreak: "break-word",
                                        color: label === "Predicted" ? theme.palette.primary.main : "inherit",
                                    }}
                                >
                                    {value}
                                </Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                ))}
            </Grid>

            {/* ── Chart 1: Tree prediction distribution ── */}
            <Card
                elevation={0}
                sx={{
                    borderRadius: 4,
                    mb: 4,
                    border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                    overflow: "hidden",
                }}
            >
                <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
                    <Typography variant="h6" fontWeight="600" sx={{ mb: 0.5 }}>
                        Tree Prediction Distribution
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        How individual trees voted for <strong>{meta.highlightedLabel}</strong>
                    </Typography>

                    {/* Legend */}
                    <Stack direction="row" spacing={2} sx={{ mb: 3, flexWrap: "wrap", gap: 1 }}>
                        {Object.entries(ZONE_COLOR).map(([key, { bg, light, label }]) => (
                            <Chip
                                key={key}
                                label={label}
                                size="small"
                                sx={{
                                    bgcolor: light,
                                    color: bg,
                                    fontWeight: 500,
                                    "& .MuiChip-label": { px: 1 },
                                }}
                            />
                        ))}
                    </Stack>

                    <Box sx={{ width: "100%", overflowX: "auto" }}>
                        <BarChart
                            height={400}
                            xAxis={[{
                                scaleType: "band",
                                data: histLabels,
                                label: "Prediction Bin",
                                tickLabelStyle: {
                                    angle: 45,
                                    textAnchor: "start",
                                    fontSize: 11,
                                },
                                colorMap: {
                                    type: "ordinal",
                                    values: histLabels,
                                    colors: treeDistribution.map((b) => ZONE_COLOR[b.zone].bg),
                                },
                            }]}
                            yAxis={[{
                                label: "Number of Trees",
                            }]}
                            series={[{
                                id: "tree-dist",
                                label: "Tree Count",
                                data: histCounts,
                                valueFormatter: (value) => `${value} tree${value !== 1 ? "s" : ""}`,
                            }]}
                            margin={{ top: 40, right: 30, bottom: 80, left: 60 }}
                            grid={{ horizontal: true }}
                        />
                    </Box>
                </CardContent>
            </Card>

            {/* ── Chart 2: Actual vs Predicted ── */}
            <Card
                elevation={0}
                sx={{
                    borderRadius: 4,
                    mb: 4,
                    border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                    overflow: "hidden",
                }}
            >
                <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
                    <Typography variant="h6" fontWeight="600" sx={{ mb: 0.5 }}>
                        Actual vs Predicted — {meta.highlightedLabel}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                        Historical trend with {meta.ciLowerPct}–{meta.ciUpperPct}% confidence bounds.
                        The rightmost predicted point is the {meta.futureYear} forecast.
                    </Typography>

                    <Box sx={{ width: "100%", overflowX: "auto" }}>
                        <LineChart
                            height={450}
                            xAxis={[{
                                scaleType: "point",
                                data: avpLabels,
                                label: "Year",
                                tickLabelStyle: { fontSize: 11 },
                            }]}
                            yAxis={[{
                                label: "Score",
                            }]}
                            series={[
                                {
                                    id: "actual",
                                    label: "Actual",
                                    data: avpActual,
                                    showMark: true,
                                    color: theme.palette.primary.main,
                                    connectNulls: false,
                                    valueFormatter: (value) => value !== null ? value.toFixed(3) : "No data",
                                },
                                {
                                    id: "predicted",
                                    label: "Predicted",
                                    data: avpPredicted,
                                    showMark: true,
                                    curve: "linear",
                                    color: theme.palette.error.main,
                                    valueFormatter: (value) => value !== null ? value.toFixed(3) : "No data",
                                },
                                {
                                    id: "lower",
                                    label: `Lower CI (${meta.ciLowerPct}%)`,
                                    data: avpLower,
                                    showMark: false,
                                    curve: "linear",
                                    color: alpha(theme.palette.error.light, 0.7),
                                },
                                {
                                    id: "upper",
                                    label: `Upper CI (${meta.ciUpperPct}%)`,
                                    data: avpUpper,
                                    showMark: false,
                                    curve: "linear",
                                    color: alpha(theme.palette.error.light, 0.7),
                                },
                            ]}
                            margin={{ top: 50, right: 50, bottom: 40, left: 70 }}
                            grid={{ vertical: true, horizontal: true }}
                        />
                    </Box>
                </CardContent>
            </Card>

            {/* ── Overall Stats Footer ── */}
            <Paper
                elevation={0}
                sx={{
                    borderRadius: 3,
                    p: 3,
                    bgcolor: alpha(theme.palette.background.paper, 0.6),
                    border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                }}
            >
                <Typography variant="subtitle2" fontWeight="600" sx={{ mb: 2 }}>
                    Overall Statistics (All Rows)
                </Typography>
                <Grid container spacing={2}>
                    <Grid size={{ xs: 6, sm: 3 }}>
                        <Typography variant="caption" color="text.secondary">Min</Typography>
                        <Typography variant="body1" fontWeight="500">{meta.predMin}</Typography>
                    </Grid>
                    <Grid size={{ xs: 6, sm: 3 }}>
                        <Typography variant="caption" color="text.secondary">Max</Typography>
                        <Typography variant="body1" fontWeight="500">{meta.predMax}</Typography>
                    </Grid>
                    <Grid size={{ xs: 6, sm: 3 }}>
                        <Typography variant="caption" color="text.secondary">Mean</Typography>
                        <Typography variant="body1" fontWeight="500">{meta.predMean}</Typography>
                    </Grid>
                    <Grid size={{ xs: 6, sm: 3 }}>
                        <Typography variant="caption" color="text.secondary">Median</Typography>
                        <Typography variant="body1" fontWeight="500">{meta.predMedian}</Typography>
                    </Grid>
                </Grid>
            </Paper>
        </Box>
    );
}