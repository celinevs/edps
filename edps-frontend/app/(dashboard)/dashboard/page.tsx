"use client"

import { useState, useEffect } from "react";
import { useAuth } from "@/app/service/hooks/useAuth";
import { Akreditasi, DashboardInfokom, TableItem, TableItem2, DashboardEmba } from "@/model/Akreditasi";
import { Lembaga } from "@/model/Lembaga";
import { GetProdi } from "@/model/Prodi";
import { useLazyGetDashboardEmbaDetailQuery, useLazyGetDashboardInfokomDetailQuery, useGetAkreditasiDropdownQuery} from "@/api/akreditasi";
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
  CircularProgress
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

  // Neutral
  return "#9e9e9e";
};

function DashboardPage() {
  const { user, isLoading: authLoading } = useAuth()
  const [dashboardInfokom, setDashboardInfokom] = useState<DashboardInfokom>();
  const [dashboardEmba, setDashboardEmba] = useState<DashboardEmba>();
  const [akreditasi, setAkreditasi] = useState<Akreditasi[]>([])
  const [lembaga, setLembaga] = useState<Lembaga[]>([]);
  const [prodi, setProdi] = useState<GetProdi[]>([]);
  const [selectedProdi, setSelectedProdi] = useState<string | undefined>();
  const [selectedLembaga, setSelectedLembaga] = useState<number | undefined>();
  const [selectedAkreditasi, setSelectedAkreditasi] = useState<string | undefined>();
  const [getProdi] = useLazyGetProdiQuery();
  const [getDashboardInfokom] = useLazyGetDashboardInfokomDetailQuery();
  const [getDashboardEmba] = useLazyGetDashboardEmbaDetailQuery();
  const { data: lembagaData } = useGetLembagaQuery(selectedProdi);
  const { data: akreditasiData } = useGetAkreditasiDropdownQuery({ id_prodi: selectedProdi, id_lembaga: selectedLembaga });
  const dashboardData = dashboardInfokom || dashboardEmba;

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
  }, [user]);

  useEffect(() => {
    if (!selectedAkreditasi) return;

    const fetchDashboard = async () => {
      try {

        if (selectedLembaga === 1) {
          const res = await getDashboardInfokom(selectedAkreditasi).unwrap();
          setDashboardInfokom(res.data);
        } else {
          const res = await getDashboardEmba(selectedAkreditasi).unwrap();
          setDashboardEmba(res.data);
        }
      } catch (err) {
        console.error("Failed to fetch dashboard:", err);
      }
    };

    fetchDashboard();
  }, [selectedAkreditasi, selectedLembaga]);

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
      label: 'Assesor',
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
        const assesorPercent = (row.assesor / max) * 100;

        return (
          <Box>
            <LinearProgress variant="determinate" value={assesorPercent} />
          </Box>
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
      label: 'Assesor',
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
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
            {isPass ? (
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

        if (row.total_lpmi > row.total_assesor) {
          label = 'Over';
          icon = <ArrowUpwardIcon />;
        } else if (row.total_lpmi < row.total_assesor) {
          label = 'Under';
          icon = <ArrowDownwardIcon />;
        } else {
          label = 'Match';
          icon = <CheckIcon />;
        }

        return (
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
            {icon}
            <Typography>
              {label}
            </Typography>
          </Box>
        );
      },
    },
    {
      id: 'visual',
      label: 'Visual',
      align: 'center',
      render: (row) => {
        const max = row.max_weight || 1;
        const assesorPercent = (row.total_assesor / max) * 100;

        return (
          <Box>
            <LinearProgress variant="determinate" value={assesorPercent} />
          </Box>
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
      <Grid container alignItems="center" spacing={2} justifyContent="space-between" mb={3}>

        <Grid size={3}>
          <Typography
            variant="h4"
            sx={{
              fontWeight: 500,
              color: 'primary.main',
            }}
          >
            Dashboard
          </Typography>
        </Grid>

        <Grid size={9}>
          <Grid container spacing={2} justifyContent="flex-end">

            {user?.role !== "PRODI" && (
              <Grid size={3}>
                <FormControl fullWidth>
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

            <Grid size={3}>
              <FormControl fullWidth>
                <InputLabel>Lembaga</InputLabel>
                <Select
                  value={selectedLembaga || ""}
                  label="Lembaga"
                  onChange={(e) => setSelectedLembaga(e.target.value)}
                >
                  {lembaga.map((l) => (
                    <MenuItem key={l.id_lembaga} value={l.id_lembaga}>
                      {l.nama_lembaga}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid size={3}>
              <FormControl fullWidth>
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

      <Stack
        direction="column"
        spacing={2}
        sx={{ width: "100%", mb: 4 }}
      >
        {/* Check if any dashboard data is available */}
        {(!dashboardInfokom && !dashboardEmba) ? (
          <Grid container spacing={2}>

            {/* RADAR EMPTY */}
            <Grid size={4}>
              <Box
                sx={{
                  background: "#fff",
                  borderRadius: 3,
                  p: 2,
                  border: "1px solid #e0e0e0",
                  height: "100%",
                }}
              >
                <Typography variant="h6" fontWeight={700} mb={2}>
                  Assessment Radar
                </Typography>

                <Box
                  sx={{
                    height: 300,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexDirection: "column",
                    color: "text.secondary",
                  }}
                >
                  <Typography variant="body1" fontWeight={600}>
                    No Radar Data
                  </Typography>

                  <Typography variant="body2">
                    Select accreditation data first
                  </Typography>
                </Box>
              </Box>
            </Grid>

            {/* GAP HEATMAP EMPTY */}
            <Grid size={4}>
              <Box
                sx={{
                  background: "#fff",
                  borderRadius: 3,
                  p: 2,
                  border: "1px solid #e0e0e0",
                  height: "100%",
                }}
              >
                <Typography variant="h6" fontWeight={700} mb={2}>
                  Gap Heatmap
                </Typography>

                <Box
                  sx={{
                    height: 300,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexDirection: "column",
                    color: "text.secondary",
                  }}
                >
                  <Typography variant="body1" fontWeight={600}>
                    No Gap Analysis
                  </Typography>

                  <Typography variant="body2">
                    Heatmap data unavailable
                  </Typography>
                </Box>
              </Box>
            </Grid>

            {/* BAR EMPTY */}
            <Grid size={4}>
              <Box
                sx={{
                  background: "#fff",
                  borderRadius: 3,
                  p: 2,
                  border: "1px solid #e0e0e0",
                  height: "100%",
                }}
              >
                <Typography variant="h6" fontWeight={700} mb={2}>
                  Performance Trend
                </Typography>

                <Box
                  sx={{
                    height: 300,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexDirection: "column",
                    color: "text.secondary",
                  }}
                >
                  <Typography variant="body1" fontWeight={600}>
                    No Performance Data
                  </Typography>

                  <Typography variant="body2">
                    Historical trend unavailable
                  </Typography>
                </Box>
              </Box>
            </Grid>

          </Grid>
        ) : (
          // <Grid container justifyContent='space-between'>
          //   <Grid size={5.8} sx={{ backgroundColor: "#f5f5f5", p: 2, }}>
          //     <RadarChart
          //       height={300}
          //       series={[
          //         { label: 'Prodi', data: dashboardInfokom?.radar?.datasets?.prodi || dashboardEmba?.radar?.datasets?.prodi || [], fillArea: true, },
          //         { label: 'LPMI', data: dashboardInfokom?.radar?.datasets?.lpmi || dashboardEmba?.radar?.datasets?.lpmi || [], fillArea: true, },
          //         { label: 'Assesor', data: dashboardInfokom?.radar?.datasets?.assesor || dashboardEmba?.radar?.datasets?.assesor || [], fillArea: true, },
          //       ]}
          //       radar={{
          //         max: 100,
          //         metrics: dashboardInfokom?.radar?.labels || dashboardEmba?.radar?.labels || []
          //       }}
          //     />
          //   </Grid>
          //   <Grid size={5.8} sx={{ backgroundColor: "#f5f5f5", p: 2, }}>
          //     <BarChart
          //       height={300}
          //       xAxis={[{
          //         scaleType: "band",
          //         data: dashboardInfokom?.bar?.labels || dashboardEmba?.bar?.labels || [],
          //       }]}
          //       series={[
          //         { label: 'Prodi', data: dashboardInfokom?.bar?.datasets?.prodi || dashboardEmba?.bar?.datasets?.prodi || [], barLabel: 'value' },
          //         { label: 'LPMI', data: dashboardInfokom?.bar?.datasets?.lpmi || dashboardEmba?.bar?.datasets?.lpmi || [], barLabel: 'value' },
          //         { label: 'Assesor', data: dashboardInfokom?.bar?.datasets?.assesor || dashboardEmba?.bar?.datasets?.assesor || [], barLabel: 'value' },
          //       ]}
          //     />
          //   </Grid>
          // </Grid>
          <Grid container spacing={2}>

            {/* RADAR */}
            <Grid size={4}>
              <Box
                sx={{
                  background: "#fff",
                  borderRadius: 3,
                  p: 2,
                  height: "100%",
                  border: "1px solid #e0e0e0",
                }}
              >
                <Typography variant="h6" fontWeight={700} mb={2}>
                  Assessment Radar
                </Typography>

                <RadarChart
                  height={300}
                  series={[
                    {
                      label: 'Prodi',
                      data: dashboardData?.radar?.datasets?.prodi || [],
                      fillArea: true,
                    },
                    {
                      label: 'LPMI',
                      data: dashboardData?.radar?.datasets?.lpmi || [],
                      fillArea: true,
                    },
                    {
                      label: 'Assesor',
                      data: dashboardData?.radar?.datasets?.assesor || [],
                      fillArea: true,
                    },
                  ]}
                  radar={{
                    max: 100,
                    metrics: dashboardData?.radar?.labels || []
                  }}
                />
              </Box>
            </Grid>

            {/* GAP HEATMAP */}
            <Grid size={4}>
              <Box
                sx={{
                  background: "#fff",
                  borderRadius: 3,
                  p: 2,
                  border: "1px solid #e0e0e0",
                  height: "100%",
                }}
              >
                <Typography variant="h6" fontWeight={700} mb={2}>
                  Gap Heatmap
                </Typography>

                <Stack spacing={1}>
                  {(dashboardData as any)?.gap_heatmap?.map((item: any) => (
                    <Grid container key={item.criteria}>
                      <Grid size={4}>
                        <Box
                          sx={{
                            p: 1,
                            border: "1px solid #eee",
                            fontSize: 14,
                          }}
                        >
                          {item.criteria}
                        </Box>
                      </Grid>

                      <Grid size={4}>
                        <Box
                          sx={{
                            p: 1,
                            color: "#fff",
                            textAlign: "center",
                            background: heatmapColor(item.prodi_vs_lpmi),
                            fontWeight: 700,
                          }}
                        >
                          {item.prodi_vs_lpmi > 0 ? "+" : ""}
                          {item.prodi_vs_lpmi}
                        </Box>
                      </Grid>

                      <Grid size={4}>
                        <Box
                          sx={{
                            p: 1,
                            color: "#fff",
                            textAlign: "center",
                            background: heatmapColor(item.lpmi_vs_assesor),
                            fontWeight: 700,
                          }}
                        >
                          {item.lpmi_vs_assesor > 0 ? "+" : ""}
                          {item.lpmi_vs_assesor}
                        </Box>
                      </Grid>
                    </Grid>
                  ))}
                </Stack>

                <Grid container mt={2}>
                  <Grid size={4}></Grid>

                  <Grid size={4}>
                    <Typography textAlign="center" fontSize={12}>
                      Prodi vs LPMI
                    </Typography>
                  </Grid>

                  <Grid size={4}>
                    <Typography textAlign="center" fontSize={12}>
                      LPMI vs Assesor
                    </Typography>
                  </Grid>
                </Grid>
              </Box>
            </Grid>

            {/* BAR CHART */}
            <Grid size={4}>
              <Box
                sx={{
                  background: "#fff",
                  borderRadius: 3,
                  p: 2,
                  border: "1px solid #e0e0e0",
                  height: "100%",
                }}
              >
                <Typography variant="h6" fontWeight={700} mb={2}>
                  Performance Trend
                </Typography>

                <BarChart
                  height={300}
                  xAxis={[
                    {
                      scaleType: "band",
                      data: dashboardData?.bar?.labels || [],
                    },
                  ]}
                  series={[
                    {
                      label: 'Prodi',
                      data: dashboardData?.bar?.datasets?.prodi || [],
                    },
                    {
                      label: 'LPMI',
                      data: dashboardData?.bar?.datasets?.lpmi || [],
                    },
                    {
                      label: 'Assesor',
                      data: dashboardData?.bar?.datasets?.assesor || [],
                    },
                  ]}
                />
              </Box>
            </Grid>

          </Grid>
        )}

        <Grid container spacing={2} mt={1}>

          <Grid size={3}>
            <Box
              sx={{
                background: "linear-gradient(135deg,#0d47a1,#1565c0)",
                color: "#fff",
                borderRadius: 3,
                p: 3,
              }}
            >
              <Typography variant="body2">
                Overall Consistency
              </Typography>

              <Typography variant="h4" fontWeight={700}>
                82%
              </Typography>
            </Box>
          </Grid>

          <Grid size={3}>
            <Box
              sx={{
                background: "linear-gradient(135deg,#b71c1c,#e53935)",
                color: "#fff",
                borderRadius: 3,
                p: 3,
              }}
            >
              <Typography variant="body2">
                Critical Gap
              </Typography>

              <Typography variant="h4" fontWeight={700}>
                -1.0
              </Typography>
            </Box>
          </Grid>

          <Grid size={3}>
            <Box
              sx={{
                background: "linear-gradient(135deg,#1b5e20,#43a047)",
                color: "#fff",
                borderRadius: 3,
                p: 3,
              }}
            >
              <Typography variant="body2">
                Prediction Score
              </Typography>

              <Typography variant="h4" fontWeight={700}>
                {(dashboardData as any)?.prediction?.predicted_score != null
                  ? Number(
                    (dashboardData as any).prediction.predicted_score
                  ).toFixed(2)
                  : "-"}
              </Typography>
            </Box>
          </Grid>

          <Grid size={3}>
            <Box
              sx={{
                background: "linear-gradient(135deg,#ef6c00,#ffa726)",
                color: "#fff",
                borderRadius: 3,
                p: 3,
              }}
            >
              <Typography variant="body2">
                Benchmark Status
              </Typography>

              <Typography variant="h4" fontWeight={700}>
                Good
              </Typography>
            </Box>
          </Grid>

        </Grid>

        {selectedLembaga == 1 &&
          <>
            <Typography
              variant="h5"
              gutterBottom
              sx={{
                fontWeight: 700,
                mb: 3,
                color: 'primary.main',
              }}
            >
              Average Score by Weight
            </Typography>

            <NoPaginationTable
              columns={columns}
              rows={dashboardInfokom?.table || []}
              enableGrouping={true}
            />
          </>
        }
        {selectedLembaga == 2 &&
          <>
            <Typography
              variant="h5"
              gutterBottom
              sx={{
                fontWeight: 700,
                mb: 3,
                color: 'primary.main',
              }}
            >
              Average Score by Criteria
            </Typography>

            <NoPaginationTable
              columns={criteriaColumn}
              rows={dashboardEmba?.table || []}
              showRowNumber={true}
            />
          </>
        }
      </Stack>
    </>
  );
};

export default DashboardPage;