"use client"

import { useState, useEffect } from "react";
import { useAuth } from "@/app/service/hooks/useAuth";
import { Akreditasi, DashboardInfokom, TableItem, TableItem2, DashboardEmba } from "@/model/Akreditasi";
import { Lembaga } from "@/model/Lembaga";
import { GetProdi } from "@/model/Prodi";
import { useLazyGetDashboardEmbaDetailQuery, useLazyGetDashboardInfokomDetailQuery, useGetAkreditasiDropdownQuery } from "@/api/akreditasi";
import { useGetLembagaQuery } from "@/api/lembaga";
import { useLazyGetProdiQuery } from "@/api/prodi";
import {
  Typography,
  Stack,
  Box,
  Grid,
  LinearProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Tooltip,
  IconButton
} from "@mui/material";
import CheckIcon from '@mui/icons-material/Check';
import ClearIcon from '@mui/icons-material/Clear';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import { RadarChart } from '@mui/x-charts/RadarChart';
import { BarChart } from "@mui/x-charts";
import NoPaginationTable, { Column } from "@/app/component/table/NoPaginationTable";

const heatmapColor = (value: number) => {
  if (value < 0) return "#e53935";
  if (value >= 1) return "#2e7d32";
  if (value >= 0.5) return "#66bb6a";
  if (value > 0) return "#cddc39";
  return "#9e9e9e";
};

function DashboardPage() {
  const { user, isLoading: authLoading } = useAuth();
  const [dashboardInfokom, setDashboardInfokom] = useState<DashboardInfokom>();
  const [dashboardEmba, setDashboardEmba] = useState<DashboardEmba>();
  const [akreditasi, setAkreditasi] = useState<Akreditasi[]>([]);
  const [lembaga, setLembaga] = useState<Lembaga[]>([]);
  const [prodi, setProdi] = useState<GetProdi[]>([]);
  const [selectedProdi, setSelectedProdi] = useState<string | undefined>();
  const [selectedLembaga, setSelectedLembaga] = useState<number | undefined>();
  const [selectedAkreditasi, setSelectedAkreditasi] = useState<string | undefined>();
  const [isDashboardLoading, setIsDashboardLoading] = useState(false);
  const [getProdi] = useLazyGetProdiQuery();
  const [getDashboardInfokom] = useLazyGetDashboardInfokomDetailQuery();
  const [getDashboardEmba] = useLazyGetDashboardEmbaDetailQuery();
  const { data: lembagaData } = useGetLembagaQuery(selectedProdi!, {skip: !selectedProdi,});
  const { data: akreditasiData } = useGetAkreditasiDropdownQuery({id_prodi: selectedProdi,id_lembaga: selectedLembaga,},{ skip: !selectedProdi || !selectedLembaga,});
  const dashboardData = dashboardInfokom || dashboardEmba;

  // Safe data extraction with validation
  const radarLabels = dashboardData?.radar?.labels ?? [];
  const radarDatasets = dashboardData?.radar?.datasets;
  const radarProdi = radarDatasets?.prodi ?? [];
  const radarLpmi = radarDatasets?.lpmi ?? [];
  const radarAssesor = radarDatasets?.assesor ?? [];

  const isRadarValid =
    radarLabels.length >= 2 &&
    radarProdi.length === radarLabels.length &&
    radarLpmi.length === radarLabels.length &&
    radarAssesor.length === radarLabels.length &&
    radarProdi.every(v => typeof v === 'number' && !isNaN(v)) &&
    radarLpmi.every(v => typeof v === 'number' && !isNaN(v)) &&
    radarAssesor.every(v => typeof v === 'number' && !isNaN(v));

  // Bar chart data validation
  const barLabels = dashboardData?.bar?.labels ?? [];
  const barDatasets = dashboardData?.bar?.datasets;
  const barProdi = barDatasets?.prodi ?? [];
  const barLpmi = barDatasets?.lpmi ?? [];
  const barAssesor = barDatasets?.assesor ?? [];

  const isBarValid =
    barLabels.length > 0 &&
    barProdi.length === barLabels.length &&
    barLpmi.length === barLabels.length &&
    barAssesor.length === barLabels.length &&
    barProdi.every(v => typeof v === 'number' && !isNaN(v)) &&
    barLpmi.every(v => typeof v === 'number' && !isNaN(v)) &&
    barAssesor.every(v => typeof v === 'number' && !isNaN(v));

  // Gap heatmap validation
  const gapHeatmap = dashboardData?.gap_heatmap;
  const isValidGapData = Array.isArray(gapHeatmap) && gapHeatmap.length > 0;

  useEffect(() => {
    if (lembagaData?.data) {
      setLembaga(lembagaData.data);
      if (lembagaData.data.length > 0) {
        setSelectedLembaga(lembagaData.data[0].id_lembaga);
      } else {
        setSelectedLembaga(undefined);
      }
    }
  }, [lembagaData]);

  useEffect(() => {
    if (akreditasiData?.data) {
      setAkreditasi(akreditasiData.data);
      if (akreditasiData.data.length > 0) {
        setSelectedAkreditasi(akreditasiData.data[0].id_akreditasi);
      } else {
        setSelectedAkreditasi(undefined);
      }
    }
  }, [akreditasiData]);

  useEffect(() => {
    if (authLoading) return;

    if (user?.role !== "PRODI") {
      getProdi().then((res) => {
        if (res.data?.data) {
          setProdi(res.data.data);
          if (res.data.data.length > 0) {
            setSelectedProdi(res.data.data[0].id_prodi);
          }
        }
      });
    } else {
      setSelectedProdi(user?.id_prodi);
    }
  }, [user, getProdi]);

  useEffect(() => {
    if (!selectedAkreditasi) return;

    const fetchDashboard = async () => {
      setIsDashboardLoading(true);
      try {
        if (selectedLembaga === 1) {
          const res = await getDashboardInfokom(selectedAkreditasi).unwrap();
          setDashboardInfokom(res.data);
          setDashboardEmba(undefined);
        } else if (selectedLembaga === 2) {
          const res = await getDashboardEmba(selectedAkreditasi).unwrap();
          setDashboardEmba(res.data);
          setDashboardInfokom(undefined);
        }
      } catch (err) {
        console.error("Failed to fetch dashboard:", err);
        setDashboardInfokom(undefined);
        setDashboardEmba(undefined);
      } finally {
        setIsDashboardLoading(false);
      }
    };

    fetchDashboard();
  }, [selectedAkreditasi, selectedLembaga, getDashboardInfokom, getDashboardEmba]);

  useEffect(() => {
    setDashboardInfokom(undefined);
    setDashboardEmba(undefined);
  }, [selectedAkreditasi, selectedLembaga, selectedProdi]);

  const columns: Column<TableItem>[] = [
    {
      id: 'weight',
      label: 'Weight',
      align: 'center'
    },
    {
      id: 'prodi',
      label: 'Prodi',
      align: 'center',
      render: (row) =>
        row.prodi === 0
          ? '-'
          : `${row.prodi}/${row.weight}`,
    },
    {
      id: 'lpmi',
      label: 'LPMI',
      align: 'center',
      render: (row) =>
        row.lpmi === 0
          ? '-'
          : `${row.lpmi}/${row.weight}`,
    },
    {
      id: 'assesor',
      label: 'Assessor',
      align: 'center',
      render: (row) =>
        row.assesor === 0
          ? '-'
          : `${row.assesor}/${row.weight}`,
    },
    {
      id: 'last_to_assesor',
      label: 'to Assessor',
      align: 'center',
      group: 'last_year',
      groupLabel: 'Last Year Gap',
      render: (row) =>
        row.last_to_assesor == null
          ? '-'
          : `${row.last_to_assesor}`,
    },
    {
      id: 'last_to_max',
      label: 'to Max',
      align: 'center',
      group: 'last_year',
      groupLabel: 'Last Year Gap',
      render: (row) =>
        row.last_to_max == null
          ? '-'
          : `${row.last_to_max}`,
    },
    {
      id: 'this_to_assesor',
      label: 'to Assessor',
      align: 'center',
      group: 'this_year',
      groupLabel: 'This Year Gap',
      render: (row) =>
        row.this_to_assesor == null
          ? '-'
          : `${row.this_to_assesor}`,
    },
    {
      id: 'this_to_max',
      label: 'to Max',
      align: 'center',
      group: 'this_year',
      groupLabel: 'This Year Gap',
      render: (row) =>
        row.this_to_max == null
          ? '-'
          : `${row.this_to_max}`,
    },
    {
      id: 'visual',
      label: 'Visual',
      align: 'center',
      render: (row) => {
        const max = row.weight || 1;
        const assessorPercent = (row.assesor / max) * 100;
        return (
          <Tooltip title={`Achievement: ${assessorPercent.toFixed(2)}%`} arrow>
            <Box>
              <LinearProgress variant="determinate" value={assessorPercent} />
            </Box>
          </Tooltip>
        );
      },
    },
    {
      id: 'percent',
      label: '%',
      minWidth: 50,
      align: 'center',
      render: (row) =>
        (row.assesor === 0)
          ? '-'
          : `${Number((row.assesor / (row.weight || 1)) * 100).toFixed(2)}%`,
    },
  ];

  const criteriaColumn: Column<TableItem2>[] = [
    {
      id: 'kriteria',
      label: 'Criteria',
      align: 'center'
    },
    { id: 'total_pertanyaan', label: 'Questions', align: 'center' },
    {
      id: 'prodi',
      label: 'Prodi',
      align: 'center',
      render: (row) =>
        row.total_prodi === null || row.total_prodi === undefined
          ? '-'
          : `${row.total_prodi}/${row.max_weight}`,
    },
    {
      id: 'lpmi',
      label: 'LPMI',
      align: 'center',
      render: (row) =>
        row.total_lpmi === null || row.total_lpmi === undefined
          ? '-'
          : `${row.total_lpmi}/${row.max_weight}`,
    },
    {
      id: 'assesor',
      label: 'Assessor',
      align: 'center',
      render: (row) =>
        row.total_assesor === null || row.total_assesor == undefined
          ? '-'
          : `${row.total_assesor}/${row.max_weight}`,
    },
    {
      id: 'mandatory_pass',
      label: 'Assessment',
      align: 'center',
      render: (row) => {
        const isPass = row.mandatory_pass;
        return (
          <Tooltip title={isPass ? "This criteria meets the passing standard" : "This criteria does not meet the passing standard"} arrow>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
              {row.total_assesor === null || row.total_lpmi == null
                ? '-' :
                isPass ? (
                  <>
                    <CheckIcon sx={{ color: 'success.main' }} />
                    <Typography sx={{ color: 'success.main', fontWeight: 500 }}>
                      Pass
                    </Typography>
                  </>
                ) : (
                  <>
                    <ClearIcon sx={{ color: 'error.main' }} />
                    <Typography sx={{ color: 'error.main', fontWeight: 500 }}>
                      Fail
                    </Typography>
                  </>
                )}
            </Box>
          </Tooltip>
        );
      },
    },
    {
      id: 'predict',
      label: 'LPMI Prediction',
      align: 'center',
      render: (row) => {
        let label = '';
        let icon = null;
        let tooltipText = '';

        if (row.total_lpmi > row.total_assesor) {
          label = 'Over';
          icon = <ArrowUpwardIcon />;
          tooltipText = `LPMI score is ${(row.total_lpmi - row.total_assesor).toFixed(2)} points higher than Assessor`;
        } else if (row.total_lpmi < row.total_assesor) {
          label = 'Under';
          icon = <ArrowDownwardIcon />;
          tooltipText = `LPMI score is ${(row.total_assesor - row.total_lpmi).toFixed(2)} points lower than Assessor`;
        } else {
          label = 'Match';
          icon = <CheckIcon />;
          tooltipText = 'LPMI score matches Assessor score';
        }

        return (
          row.total_lpmi == null || row.total_assesor == null ? (
            <Typography>-</Typography>
          ) : (
            <Tooltip title={tooltipText} arrow>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 1,
                  cursor: 'pointer'
                }}
              >
                {icon}
                <Typography>{label}</Typography>
              </Box>
            </Tooltip>
          )
        );
      },
    },
    {
      id: 'visual',
      label: 'Visual',
      align: 'center',
      render: (row) => {
        const max = row.max_weight || 1;
        const assessorPercent = (row.total_assesor / max) * 100;
        return (
          <Tooltip title={`Achievement: ${assessorPercent.toFixed(2)}%`} arrow>
            <Box>
              <LinearProgress variant="determinate" value={assessorPercent} />
            </Box>
          </Tooltip>
        );
      },
    },
    {
      id: 'percent',
      label: '%',
      minWidth: 50,
      align: 'center',
      render: (row) =>
        (row.total_assesor === null || row.total_assesor == undefined)
          ? '-'
          : `${Number((row.total_assesor / (row.max_weight || 1)) * 100).toFixed(2)}%`,
    },
  ];

  if (authLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <>
      <Grid container alignItems="center" spacing={2} justifyContent="space-between" mb={2}>
        <Grid size={5}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography
              variant="h4"
              sx={{
                fontWeight: 600,
                color: 'primary.main',
              }}
            >
              Dashboard {user?.nama_prodi? user?.nama_prodi: user?.role}
            </Typography>
          </Box>
        </Grid>

        <Grid size={7}>
          <Grid container spacing={1.5} justifyContent="flex-end">
            {user?.role !== "PRODI" && (
              <Grid size={3}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Prodi</InputLabel>
                    <Select
                      value={selectedProdi || ""}
                      label="Prodi"
                      onChange={(e) => setSelectedProdi(e.target.value)}
                    >
                      {prodi.map((p) => (
                        <MenuItem key={p.id_prodi} value={p.id_prodi}>
                          {p.nama_prodi}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
              </Grid>
            )}

            <Grid size={2.5}>
                <FormControl fullWidth size="small">
                  <InputLabel>Lembaga</InputLabel>
                  <Select
                    value={selectedLembaga || ""}
                    label="Lembaga"
                    onChange={(e) => setSelectedLembaga(e.target.value as number)}
                  >
                    {lembaga.map((l) => (
                      <MenuItem key={l.id_lembaga} value={l.id_lembaga}>
                        {l.nama_lembaga}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
            </Grid>

            <Grid size={2.5}>
                <FormControl fullWidth size="small">
                  <InputLabel>Akreditasi</InputLabel>
                  <Select
                    value={selectedAkreditasi || ""}
                    label="Akreditasi"
                    onChange={(e) => setSelectedAkreditasi(e.target.value)}
                  >
                    {akreditasi.map((a) => (
                      <MenuItem key={a.id_akreditasi} value={a.id_akreditasi}>
                        {a.nama_akreditasi}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
            </Grid>
          </Grid>
        </Grid>
      </Grid>

      <Stack direction="column" spacing={2} sx={{ width: "100%", mb: 3 }}>
        {isDashboardLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 350 }}>
            <CircularProgress />
          </Box>
        ) : (!dashboardInfokom && !dashboardEmba) ? (
          <Grid container spacing={1.5}>
            <Grid size={4.5}>
              <Tooltip title="Radar chart will appear once data is available" arrow>
                <Box
                  sx={{
                    background: "#fff",
                    borderRadius: 2,
                    p: 1.5,
                    border: "1px solid #e0e0e0",
                    height: "100%",
                  }}
                >
                  <Typography variant="subtitle1" fontWeight={600} mb={1}>
                    Assessment Radar
                  </Typography>
                  <Box
                    sx={{
                      height: 260,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexDirection: "column",
                      color: "text.secondary",
                    }}
                  >
                    <Typography variant="body2" fontWeight={600}>
                      No Radar Data
                    </Typography>
                    <Typography variant="caption">
                      Select accreditation data first
                    </Typography>
                  </Box>
                </Box>
              </Tooltip>
            </Grid>

            <Grid size={3}>
              <Tooltip title="Gap analysis will appear once data is available" arrow>
                <Box
                  sx={{
                    background: "#fff",
                    borderRadius: 2,
                    p: 1.5,
                    border: "1px solid #e0e0e0",
                    height: "100%",
                  }}
                >
                  <Typography variant="subtitle1" fontWeight={600} mb={1}>
                    Gap Heatmap
                  </Typography>
                  <Box
                    sx={{
                      height: 260,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexDirection: "column",
                      color: "text.secondary",
                    }}
                  >
                    <Typography variant="body2" fontWeight={600}>
                      No Gap Analysis
                    </Typography>
                    <Typography variant="caption">
                      Heatmap data unavailable
                    </Typography>
                  </Box>
                </Box>
              </Tooltip>
            </Grid>

            <Grid size={4.5}>
              <Tooltip title="Performance trends will appear once data is available" arrow>
                <Box
                  sx={{
                    background: "#fff",
                    borderRadius: 2,
                    p: 1.5,
                    border: "1px solid #e0e0e0",
                    height: "100%",
                  }}
                >
                  <Typography variant="subtitle1" fontWeight={600} mb={1}>
                    Performance Trend
                  </Typography>
                  <Box
                    sx={{
                      height: 260,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexDirection: "column",
                      color: "text.secondary",
                    }}
                  >
                    <Typography variant="body2" fontWeight={600}>
                      No Performance Data
                    </Typography>
                    <Typography variant="caption">
                      Historical trend unavailable
                    </Typography>
                  </Box>
                </Box>
              </Tooltip>
            </Grid>
          </Grid>
        ) : (
          <Grid container spacing={1.5}>
            <Grid size={4.5}>
              <Tooltip title="Radar chart comparing Prodi, LPMI, and Assessor scores across criteria" arrow>
                <Box
                  sx={{
                    background: "#fff",
                    borderRadius: 2,
                    p: 1.5,
                    height: "100%",
                    border: "1px solid #e0e0e0",
                  }}
                >
                  <Typography variant="subtitle1" fontWeight={600} mb={1}>
                    Assessment Radar
                  </Typography>
                  <Box sx={{ height: 260, width: '100%' }}>
                    {isRadarValid ? (
                      <RadarChart
                        key={selectedAkreditasi}
                        height={260}
                        series={[
                          {
                            label: "Prodi",
                            data: radarProdi,
                            fillArea: true,
                          },
                          {
                            label: "LPMI",
                            data: radarLpmi,
                            fillArea: true,
                          },
                          {
                            label: "Assessor",
                            data: radarAssesor,
                            fillArea: true,
                          },
                        ]}
                        radar={{
                          max: 100,
                          metrics: radarLabels,
                        }}
                      />
                    ) : (
                      <Box
                        sx={{
                          height: 260,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexDirection: "column",
                          color: "text.secondary",
                        }}
                      >
                        <Typography variant="body2" fontWeight={600}>
                          Not Enough Radar Data
                        </Typography>
                        <Typography variant="caption">
                          Radar chart requires at least 2 criteria with valid data
                        </Typography>
                      </Box>
                    )}
                  </Box>
                </Box>
              </Tooltip>
            </Grid>

            <Grid size={3}>
              <Tooltip title="Heatmap showing gaps between Prodi vs LPMI and LPMI vs Assessor (Green: Positive, Red: Negative)" arrow>
                <Box
                  sx={{
                    background: "#fff",
                    borderRadius: 2,
                    p: 1.5,
                    border: "1px solid #e0e0e0",
                    height: "100%",
                  }}
                >
                  <Typography variant="subtitle1" fontWeight={600} mb={1}>
                    Gap Heatmap
                  </Typography>
                  <Box sx={{ height: 260, overflowY: 'auto' }}>
                    {isValidGapData ? (
                      <>
                        <Stack spacing={0.5}>
                          {gapHeatmap.map((item: any, index: number) => (
                            <Grid container key={item.criteria || index} spacing={0.5}>
                              <Grid size={4}>
                                <Tooltip title={`Criteria: ${item.criteria || '-'}`} arrow>
                                  <Box
                                    sx={{
                                      p: 0.75,
                                      border: "1px solid #eee",
                                      fontSize: 12,
                                      whiteSpace: 'nowrap',
                                      overflow: 'hidden',
                                      textOverflow: 'ellipsis'
                                    }}
                                  >
                                    {item.criteria || '-'}
                                  </Box>
                                </Tooltip>
                              </Grid>
                              <Grid size={4}>
                                <Tooltip title={`Prodi vs LPMI gap: ${item.prodi_vs_lpmi > 0 ? '+' : ''}${item.prodi_vs_lpmi ?? 0} (Positive means Prodi scores higher)`} arrow>
                                  <Box
                                    sx={{
                                      p: 0.75,
                                      color: "#fff",
                                      textAlign: "center",
                                      background: heatmapColor(item.prodi_vs_lpmi ?? 0),
                                      fontWeight: 600,
                                      cursor: 'pointer',
                                      fontSize: 12
                                    }}
                                  >
                                    {item.prodi_vs_lpmi > 0 ? "+" : ""}
                                    {item.prodi_vs_lpmi ?? 0}
                                  </Box>
                                </Tooltip>
                              </Grid>
                              <Grid size={4}>
                                <Tooltip title={`LPMI vs Assessor gap: ${item.lpmi_vs_assesor > 0 ? '+' : ''}${item.lpmi_vs_assesor ?? 0} (Positive means LPMI scores higher)`} arrow>
                                  <Box
                                    sx={{
                                      p: 0.75,
                                      color: "#fff",
                                      textAlign: "center",
                                      background: heatmapColor(item.lpmi_vs_assesor ?? 0),
                                      fontWeight: 600,
                                      cursor: 'pointer',
                                      fontSize: 12
                                    }}
                                  >
                                    {item.lpmi_vs_assesor > 0 ? "+" : ""}
                                    {item.lpmi_vs_assesor ?? 0}
                                  </Box>
                                </Tooltip>
                              </Grid>
                            </Grid>
                          ))}
                        </Stack>
                        <Grid container mt={1}>
                          <Grid size={4}></Grid>
                          <Grid size={4}>
                            <Typography textAlign="center" fontSize={10}>
                              Prodi vs LPMI
                            </Typography>
                          </Grid>
                          <Grid size={4}>
                            <Typography textAlign="center" fontSize={10}>
                              LPMI vs Assessor
                            </Typography>
                          </Grid>
                        </Grid>
                      </>
                    ) : (
                      <Box
                        sx={{
                          height: 260,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexDirection: "column",
                          color: "text.secondary",
                        }}
                      >
                        <Typography variant="body2" fontWeight={600}>
                          No Gap Data Available
                        </Typography>
                        <Typography variant="caption">
                          Heatmap data unavailable for this selection
                        </Typography>
                      </Box>
                    )}
                  </Box>
                </Box>
              </Tooltip>
            </Grid>

            {/* BAR CHART - FIXED SIZE */}
            <Grid size={4.5}>
              <Tooltip title="Bar chart comparing performance trends across 5 years" arrow>
                <Box
                  sx={{
                    background: "#fff",
                    borderRadius: 2,
                    p: 1.5,
                    border: "1px solid #e0e0e0",
                    height: "100%",
                  }}
                >
                  <Typography variant="subtitle1" fontWeight={600} mb={1}>
                    Performance Trend
                  </Typography>
                  <Box sx={{ height: 260, width: '100%' }}>
                    {isBarValid ? (
                      <BarChart
                        height={260}
                        xAxis={[
                          {
                            scaleType: "band",
                            data: barLabels,
                          },
                        ]}
                        series={[
                          {
                            label: 'Prodi',
                            data: barProdi,
                          },
                          {
                            label: 'LPMI',
                            data: barLpmi,
                          },
                          {
                            label: 'Assessor',
                            data: barAssesor,
                          },
                        ]}
                      />
                    ) : (
                      <Box
                        sx={{
                          height: 260,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexDirection: "column",
                          color: "text.secondary",
                        }}
                      >
                        <Typography variant="body2" fontWeight={600}>
                          Insufficient Bar Chart Data
                        </Typography>
                        <Typography variant="caption">
                          Complete trend data unavailable
                        </Typography>
                      </Box>
                    )}
                  </Box>
                </Box>
              </Tooltip>
            </Grid>
          </Grid>
        )}

        {/* KPI Cards - Smaller */}
        <Grid container spacing={1.5} mt={0}>
          <Grid size={3}>
            <Tooltip title="Overall consistency percentage across all assessments" arrow>
              <Box
                sx={{
                  background: "linear-gradient(135deg,#0d47a1,#1565c0)",
                  color: "#fff",
                  borderRadius: 2,
                  p: 2,
                }}
              >
                <Typography variant="caption">Overall Consistency</Typography>
                <Typography variant="h5" fontWeight={700}>
                  {dashboardData?.consistency != null
                    ? `${Number(dashboardData.consistency).toFixed(2)}%`
                    : "-"}
                </Typography>
              </Box>
            </Tooltip>
          </Grid>

          <Grid size={3}>
            <Tooltip title="Largest gap identified in the assessment (higher values indicate more critical issues)" arrow>
              <Box
                sx={{
                  background: "linear-gradient(135deg,#b71c1c,#e53935)",
                  color: "#fff",
                  borderRadius: 2,
                  p: 2,
                }}
              >
                <Typography variant="caption">Critical Gap {dashboardData?.max_gap.source? `(${dashboardData?.max_gap.source})`: ''}</Typography>
                <Typography variant="h5" fontWeight={700}>
                  {dashboardData?.max_gap != null
                    ? Number(dashboardData.max_gap.value).toFixed(2)
                    : "-"}
                </Typography>
              </Box>
            </Tooltip>
          </Grid>

          <Grid size={3}>
            <Tooltip title="Predicted future assessor score based on last 3 years performance" arrow>
              <Box
                sx={{
                  background: "linear-gradient(135deg,#1b5e20,#43a047)",
                  color: "#fff",
                  borderRadius: 2,
                  p: 2,
                }}
              >
                <Typography variant="caption">Prediction Score {(dashboardData as any)?.prediction?.future_year? `in ${(dashboardData as any)?.prediction?.future_year}`: ''}</Typography>
                <Typography variant="h5" fontWeight={700}>
                  {(dashboardData as any)?.prediction?.predicted_score != null
                    ? Number((dashboardData as any).prediction.predicted_score).toFixed(3)
                    : "-"}
                </Typography>
              </Box>
            </Tooltip>
          </Grid>

          <Grid size={3}>
            <Tooltip
              title={
                <>
                  <div><strong>Risk Score Formula</strong></div>
                  <div>• 45% → Assessor score performance</div>
                  <div>• 20% → LPMI vs Assessor gap</div>
                  <div>• 15% → Agreement consistency</div>
                  <div>• 10% → Negative assessment trend</div>
                  <br />
                  <div>
                    Higher risk indicates lower assessor performance
                    and greater inconsistency.
                  </div>
                </>
              }
              arrow
            >
              <Box
                sx={{
                  background: "linear-gradient(135deg,#ef6c00,#ffa726)",
                  color: "#fff",
                  borderRadius: 2,
                  p: 2,
                }}
              >
                <Typography variant="caption">Risk Level</Typography>
                <Typography variant="h5" fontWeight={700}>
                  {dashboardData?.risk_major?.risk_level_combined || "-"}
                </Typography>
              </Box>
            </Tooltip>
          </Grid>
        </Grid>

        {selectedLembaga === 1 && dashboardInfokom && (
          <>
            <Typography
              variant="h6"
              gutterBottom
              sx={{
                fontWeight: 600,
                color: 'primary.main',
                mt: 1
              }}
            >
              Average Score by Weight
            </Typography>
            <NoPaginationTable
              columns={columns}
              rows={dashboardInfokom.table || []}
              enableGrouping={true}
            />
          </>
        )}

        {selectedLembaga === 2 && dashboardEmba && (
          <>
            <Typography
              variant="h6"
              gutterBottom
              sx={{
                fontWeight: 600,
                color: 'primary.main',
                mt: 1
              }}
            >
              Average Score by Criteria
            </Typography>
            <NoPaginationTable
              columns={criteriaColumn}
              rows={dashboardEmba.table || []}
              showRowNumber={true}
            />
          </>
        )}
      </Stack>
    </>
  );
}

export default DashboardPage;