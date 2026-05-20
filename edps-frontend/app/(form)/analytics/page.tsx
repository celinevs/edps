"use client";
import { Box, Typography, Grid, LinearProgress, Paper, Chip } from "@mui/material";
import CheckIcon from '@mui/icons-material/Check';
import ClearIcon from '@mui/icons-material/Clear';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { WeightSummary, WeightDetailInfokom, DetailQuestion, KriteriaDetail, KriteriaTable } from "@/model/Akreditasi";
import { useLazyGetWeightSummaryInfokomQuery, useLazyGetWeightSummaryEmbaQuery } from "@/api/akreditasi";
import { formatDate } from "@/app/service/utils/func";
import NoPaginationTable, { Column } from "@/app/component/table/NoPaginationTable";
import CollapsibleTable from "@/app/component/table/CollapsibleTable";

interface FormData {
    id_regulasi: string;
    id_periode: string;
    status: string;
    tanggal_selesai: string;
    total_max_bobot: number;
    is_lpmi?: boolean;
    is_admin?: boolean;
    lembaga?: number;
}

function AnalyticPage() {
    const [formData, setFormData] = useState<FormData | null>(null);
    const [weightSummary, setWeightSummary] = useState<WeightSummary>();
    const [loading, setLoading] = useState(true);
    const router = useRouter();
    const [getWeightSummaryInfokom] = useLazyGetWeightSummaryInfokomQuery();
    const [getWeightSummaryEmba] = useLazyGetWeightSummaryEmbaQuery();
    const [status, setStatus] = useState<{
        label: string;
        color: | "default" | "success" | "warning" | "info" | "error" | "primary" | "secondary";
    }>
        ({
            label: "",
            color: "default"
        });

    useEffect(() => {
        if (formData?.status == 'Reviewed') {
            setStatus({
                label: "Complete",
                color: "success"
            });
        } else {
            setStatus({
                label: formData?.status || "No Status",
                color: "warning"
            });
        }
    }, [formData]);
    const hiddenColumns: Record<number, { criteria: string[]; detail: string[] }> = {
        1: {
            criteria: ['mandatory_pass', 'predict'],
            detail: ['q_no', 'dimensi', 'warning', 'mandatory_pass', 'predict'],
        },
        2: {
            criteria: [],
            detail: ['elemen_kriteria', 'total_pertanyaan', 'percent', 'visual'],
        },
    };

    useEffect(() => {
        const storedData = sessionStorage.getItem('formData');
        if (storedData) {
            const parsedData = JSON.parse(storedData);
            setFormData(parsedData);
        }
    }, [router]);

    useEffect(() => {
        if (!formData?.id_periode) return;

        const fetchData = async () => {
            setLoading(true);
            try {
                if (formData?.lembaga == 1) {
                    const response = await getWeightSummaryInfokom(formData.id_periode).unwrap();
                    setWeightSummary(response.data);
                }
                else {
                    const response = await getWeightSummaryEmba(formData.id_periode).unwrap();
                    setWeightSummary(response.data);
                }
            } catch (err) {
                console.error("ERROR:", err);
                setWeightSummary(undefined);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [formData]);

    const columns: Column<WeightSummary>[] = [
        {
            id: 'total_points',
            label: 'Total Weight',
            align: 'center'
        },
        {
            id: 'answered_questions',
            label: 'Prodi Answered',
            align: 'center',
            render: (row) => `${row.answered_questions}/${row.total_questions}`
        },
        {
            id: 'lpmi_answered',
            label: 'LPMI Answered',
            align: 'center',
            render: (row) => `${row.lpmi_answered}/${row.total_questions}`
        },
        {
            id: 'assesor_answered',
            label: 'Assesor Answered',
            align: 'center',
            render: (row) => `${row.assesor_answered}/${row.total_questions}`
        },
        {
            id: 'total_prodi',
            label: 'Prodi Score',
            align: 'center',
            render: (row) =>
                row.total_prodi === undefined || row.total_prodi === null
                    ? '-'
                    : `${row.total_prodi}/${row.max_points}`,
        },
        {
            id: 'total_lpmi',
            label: 'LPMI Score',
            align: 'center',
            render: (row) =>
               row.total_lpmi === undefined || row.total_lpmi === null
                    ? '-'
                    : `${row.total_lpmi}/${row.max_points}`,
        },
        {
            id: 'total_assesor',
            label: 'Assesor Score',
            align: 'center',
            render: (row) =>
                row.total_assesor === undefined || row.total_assesor === null
                    ? '-'
                    : `${row.total_assesor}/${row.max_points}`,
        },
        {
            id: 'gap',
            label: 'Gap',
            align: 'center',
            render: (row) =>
                (row.total_lpmi === null || row.total_assesor === null)
                    ? '-'
                    : `${row.max_points - row.total_assesor}`,
        },
        {
            id: 'visual',
            label: 'Assessor Score (Visual)',
            align: 'center',
            render: (row) => {
                const max = row.max_points || 1;
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
                (row.total_assesor === 0)
                    ? '-'
                    : `${Number(((row.total_assesor / (row.max_points || 1)) * 100).toFixed(2))}%`,
        },
    ];

    const columnDetails: Column<WeightDetailInfokom>[] = [
        {
            id: 'weight',
            label: 'Weight',
            align: 'center'
        },
        { id: 'questions', label: 'Q(s)', align: 'center' },
        { id: 'max_weight', label: 'Max Weight', align: 'center' },
        {
            id: 'prodi',
            label: 'Prodi',
            align: 'center',
            render: (row) =>
                row.prodi === 0
                    ? '-'
                    : `${row.prodi}/${row.max_weight}`,
        },
        {
            id: 'lpmi',
            label: 'LPMI',
            align: 'center',
            render: (row) =>
                row.lpmi === undefined || row.lpmi === null
                    ? '-'
                    : `${row.lpmi}/${row.max_weight}`,
        },
        {
            id: 'assesor',
            label: 'Assesor',
            align: 'center',
            render: (row) =>
                row.assesor === undefined || row.assesor === null
                    ? '-'
                    : `${row.assesor}/${row.max_weight}`,
        },
        {
            id: 'assesor_lpmi',
            label: 'Assessor-LPMI',
            align: 'center',
            render: (row) =>
                row.assesor === undefined || row.assesor === null
                    ? '-'
                    : `${row.assesor_lpmi}/${row.max_weight}`,
        },
        {
            id: 'gap',
            label: 'Gap to Max',
            align: 'center',
            render: (row) =>
                row.assesor === undefined || row.assesor === null
                    ? '-'
                    : `${row.max_weight - row.assesor}`,
        },
        {
            id: 'visual',
            label: 'Assessor Score (Visual)',
            align: 'center',
            render: (row) => {
                const max = row.max_weight || 1;
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
                (row.assesor === undefined || row.assesor === null)
                    ? '-'
                    : `${Number((row.assesor / (row.max_weight || 1)) * 100).toFixed(2)}%`,
        },
    ];

    const criteriaColumn: Column<KriteriaTable>[] = [
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
                        {row.total_assesor === undefined || row.total_assesor === null ? '-'
                            :
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
                    row.total_lpmi == null || row.total_assesor == null ? (
                        <Typography>
                            -
                        </Typography>
                    ) : (
                        <Box
                            sx={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: 1
                            }}
                        >
                            {icon}
                            <Typography>
                                {label}
                            </Typography>
                        </Box>
                    )
                );
            },
        },
        {
            id: 'visual',
            label: 'Assessor Score (Visual)',
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

    const criteriaDetailColumn: Column<KriteriaDetail>[] = [
        {
            id: 'elemen_kriteria',
            label: '',
            align: 'center'
        },
        { id: 'total_pertanyaan', label: 'Questions', align: 'center' },
        { id: 'q_no', label: 'Q.No', align: 'center' },
        { id: 'dimensi', label: 'Dimensi', align: 'center' },
        {
            id: 'prodi',
            label: 'Prodi',
            align: 'center',
            render: (row) =>
                row.prodi === undefined || row.prodi === null
                    ? '-'
                    : `${row.prodi}/${row.weight}`,
        },
        {
            id: 'lpmi',
            label: 'LPMI',
            align: 'center',
            render: (row) =>
                row.lpmi === undefined || row.lpmi === null
                    ? '-'
                    : `${row.lpmi}/${row.weight}`,
        },
        {
            id: 'assesor',
            label: 'Assesor',
            align: 'center',
            render: (row) =>
                row.assesor === undefined || row.assesor === null
                    ? '-'
                    : `${row.assesor}/${row.weight}`,
        },
        {
            id: 'mandatory_pass',
            label: 'Assessment',
            align: 'center',
            render: (row) => {
                const isPass = row.mandatory_pass;

                return (
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                        {row.assesor === undefined || row.assesor === null ? '-'
                            : isPass ? (
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

                if (row.lpmi > row.assesor) {
                    label = 'Over';
                    icon = <ArrowUpwardIcon />;
                } else if (row.lpmi < row.assesor) {
                    label = 'Under';
                    icon = <ArrowDownwardIcon />;
                } else {
                    label = 'Match';
                    icon = <CheckIcon />;
                }

                return (
                    row.lpmi == null || row.assesor == null ? (
                        <Typography>
                            -
                        </Typography>
                    ) : (
                        <Box
                            sx={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: 1
                            }}
                        >
                            {icon}
                            <Typography>
                                {label}
                            </Typography>
                        </Box>
                    )
                );
            },
        },
        {
            id: 'visual',
            label: 'Assessor Score (Visual)',
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
        {
            id: 'warning',
            label: 'Warning',
            align: 'center',
            render: (row) =>
                row.mandatory_pass
                    ? '-'
                    : `* Mandatory Item Failed`,
        },
    ];

    const questionColumns: Column<DetailQuestion>[] = [
        {
            id: 'q_no',
            label: 'Question No.',
            minWidth: 100,
            align: 'center',
            render: (row) => row.q_no
        },
        {
            id: 'kode_kriteria',
            label: 'Criteria Id',
            minWidth: 120,
            align: 'center'
        },
        {
            id: 'max_weight',
            label: 'Max Weight',
            minWidth: 100,
            align: 'center',
            render: (row) => row.max_weight.toFixed(2)
        },
        {
            id: 'skor_prodi',
            label: 'Prodi',
            minWidth: 120,
            align: 'center',
            render: (row) =>
                row.skor_prodi === null
                    ? '-'
                    : `${row.skor_prodi.toFixed(2)}/${row.max_weight.toFixed(2)}`,
        },
        {
            id: 'skor_lpmi',
            label: 'LPMI',
            minWidth: 120,
            align: 'center',
            render: (row) =>
                row.skor_lpmi === null
                    ? '-'
                    : `${row.skor_lpmi.toFixed(2)}/${row.max_weight.toFixed(2)}`,
        },
        {
            id: 'skor_assesor',
            label: 'Assessor',
            minWidth: 120,
            align: 'center',
            render: (row) =>
                row.skor_assesor === null
                    ? '-'
                    : `${row.skor_assesor.toFixed(2)}/${row.max_weight.toFixed(2)}`,
        },
        {
            id: 'visual_question',
            label: 'Progress',
            minWidth: 150,
            align: 'center',
            render: (row) => {
                const max = row.max_weight || 1;
                const percent = (row.skor_assesor / max) * 100;
                return (
                    <Box sx={{ minWidth: 120 }}>
                        <LinearProgress variant="determinate" value={percent} />
                    </Box>
                );
            },
        },
        {
            id: 'percent_question',
            label: '%',
            minWidth: 80,
            align: 'center',
            render: (row) =>
                row.skor_assesor === 0
                    ? '-'
                    : `${Number((row.skor_assesor / (row.max_weight || 1)) * 100).toFixed(2)}%`,
        },
    ];

    const filteredCriteriaColumn = criteriaColumn.filter(col => {
        const hidden = hiddenColumns[formData?.lembaga ?? 0]?.criteria || [];
        return !hidden.includes(col.id as string);
    });

    const filteredDetailColumn = criteriaDetailColumn.filter(col => {
        const hidden = hiddenColumns[formData?.lembaga ?? 0]?.detail || [];
        return !hidden.includes(col.id as string);
    });

    if (loading) {
        return (
            <Box sx={{ p: 4 }}>
                <Typography variant="body1" color="text.secondary">
                    Loading...
                </Typography>
                <LinearProgress sx={{ mt: 2, width: "50%" }} />
            </Box>
        );
    }

    if (!weightSummary) {
        return (
            <Box sx={{ mx: "auto", p: 4 }}>
                <Typography
                    variant="h4"
                    gutterBottom
                    sx={{ mb: 3 }}
                >
                    Event Analytics
                </Typography>
                <Paper sx={{ p: 5, textAlign: 'center', bgcolor: '#fafafa' }}>
                    <Typography variant="h6" gutterBottom color="text.secondary">
                        No Data Yet
                    </Typography>
                    <Typography variant="body1" color="text.secondary">
                        There is no analytics data available for this period at the moment.
                        <br />
                        Please check back later or ensure that the assessment process has been completed.
                    </Typography>
                </Paper>
            </Box>
        );
    }

    const hasNoData = !weightSummary.kriteria_detail ||
        weightSummary.kriteria_detail.length === 0 ||
        (weightSummary.max_points === 0 && weightSummary.total_questions === 0);

    if (hasNoData) {
        return (
            <Box sx={{ mx: "auto", p: 4 }}>
                <Typography
                    variant="h4"
                    gutterBottom
                    sx={{ mb: 3 }}
                >
                    Event Analytics
                </Typography>
                <Paper sx={{ p: 5, textAlign: 'center', bgcolor: '#fafafa' }}>
                    <Typography variant="h6" gutterBottom color="text.secondary">
                        No Data Available
                    </Typography>
                    <Typography variant="body1" color="text.secondary">
                        The assessment data has not been filled out yet.
                        <br />
                        Please wait for the assessment process to begin or contact the administrator.
                    </Typography>
                </Paper>
            </Box>
        );
    }

    return (
        <Box sx={{ mx: "auto" }}>
            <Grid container gap={2} direction="row" alignItems="center" mb={3}>
                <Typography
                    variant="h4"
                >
                    Event Analytics
                </Typography>
                <Chip
                    label={status.label}
                    color={status.color}
                    size="medium"
                />
            </Grid>
            <Grid container justifyContent='space-between' sx={{ mb: 3, }}>
                <Grid container gap={1} direction="row">
                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>EDPS Submitted by: {weightSummary?.nama_pengisi || '-'}</Typography>
                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>LPMI Validator: {weightSummary?.nama_validator || '-'}</Typography>
                </Grid>
                <Grid container gap={1} direction="row">
                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>EDPS Last Saved Date: {formatDate(weightSummary?.tanggal_pengisian )}</Typography>
                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>LPMI Last Saved Date: {formatDate(weightSummary?.tanggal_validasi)}</Typography>
                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>Assessor Last Saved Date {formatDate(weightSummary?.tanggal_review)}</Typography>
                </Grid>
            </Grid>
            <Box sx={{
                backgroundColor: '#f5f5f5',
                px: 2,
                py: 1.5,
                mb: 3
            }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Box>
                        <Typography
                            variant="body2"
                            sx={{ color: 'text.secondary', whiteSpace: 'nowrap' }}>
                            Prodi
                        </Typography>
                    </Box>
                    <Box sx={{ width: '100%', mx: 1 }}>
                        <LinearProgress variant="determinate" value={((weightSummary?.total_prodi ?? 0) / (weightSummary?.max_points ?? 1)) * 100} />
                    </Box>
                    <Box>
                        <Typography
                            variant="body2"
                            sx={{ color: 'text.secondary' }}>
                            {weightSummary?.total_prodi ?? 0}/{weightSummary?.max_points ?? 1}
                        </Typography>
                    </Box>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Box>
                        <Typography
                            variant="body2"
                            sx={{ color: 'text.secondary', whiteSpace: 'nowrap' }}>
                            LPMI
                        </Typography>
                    </Box>
                    <Box sx={{ width: '100%', mx: 1 }}>
                        <LinearProgress variant="determinate" value={((weightSummary?.total_lpmi ?? 0) / (weightSummary?.max_points ?? 1)) * 100} />
                    </Box>
                    <Box>
                        <Typography
                            variant="body2"
                            sx={{ color: 'text.secondary' }}>
                            {weightSummary?.total_lpmi ?? 0}/{weightSummary?.max_points ?? 1}
                        </Typography>
                    </Box>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Box>
                        <Typography
                            variant="body2"
                            sx={{ color: 'text.secondary', whiteSpace: 'nowrap' }}>
                            Assesor
                        </Typography>
                    </Box>
                    <Box sx={{ width: '100%', mx: 1 }}>
                        <LinearProgress variant="determinate" value={((weightSummary?.total_assesor ?? 0) / (weightSummary?.max_points ?? 1)) * 100} />
                    </Box>
                    <Box>
                        <Typography
                            variant="body2"
                            sx={{ color: 'text.secondary' }}>
                            {weightSummary?.total_assesor ?? 0}/{weightSummary?.max_points ?? 1}
                        </Typography>
                    </Box>
                </Box>
            </Box>
            <Box sx={{ mb: 3 }}>
                <Typography
                    variant="h5"
                    gutterBottom
                    sx={{
                        fontWeight: 600
                    }}
                >
                    Overview Summary
                </Typography>
                <NoPaginationTable
                    columns={columns}
                    rows={weightSummary ? [weightSummary] : []}
                />
            </Box>
            <Box sx={{ mb: 3 }}>
                <Typography
                    variant="h5"
                    gutterBottom
                    sx={{
                        fontWeight: 600
                    }}
                >
                    Criteria Summary
                </Typography>
                <CollapsibleTable
                    columns={filteredCriteriaColumn}
                    rows={weightSummary?.kriteria_detail || []}
                    getSubTableData={(row: KriteriaTable) => row.detail || []}
                    subTableColumns={filteredDetailColumn}
                />
            </Box>
            {formData?.lembaga == 1 &&
                <Box sx={{ mb: 3 }}>
                    <Typography
                        variant="h5"
                        gutterBottom
                        sx={{
                            mb: 3,
                            fontWeight: 600
                        }}
                    >
                        Weight Summary
                    </Typography>
                    <CollapsibleTable
                        columns={columnDetails}
                        rows={weightSummary?.detail || []}
                        getSubTableData={(row: WeightDetailInfokom) => row.detail_question || []}
                        subTableColumns={questionColumns}
                    />
                </Box>
            }
        </Box>
    )
}

export default AnalyticPage;