"use client"

import { Stack, Button, Typography, Grid, LinearProgress, Box } from "@mui/material";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { useAuth } from "@/app/service/hooks/useAuth";
import { Akreditasi, Summary } from "@/model/Akreditasi";
import { useGetAkreditasiQuery } from "@/api/akreditasi";
import DataTable, { Column } from "@/app/component/table/DataTable";
import { formatDate } from "@/app/service/utils/func";
import DescriptionOutlinedIcon from "@mui/icons-material/DescriptionOutlined";
import ManageSearchOutlinedIcon from "@mui/icons-material/ManageSearchOutlined";
import FactCheckOutlinedIcon from "@mui/icons-material/FactCheckOutlined";
import ArticleOutlinedIcon from "@mui/icons-material/ArticleOutlined";
import StatCard from "@/app/component/statCard";

function HomePage() {
    const router = useRouter();
    const { user } = useAuth();
    const [totalData, setTotalData] = useState(0)
    const [page, setPage] = useState(0)
    const [perPage, setPerPage] = useState(5)
    const [akreditasi, setAkreditasi] = useState<Akreditasi[]>([])
    const [summary, setSummary] = useState<Summary>()
    const isAdmin = user?.role === 'ADMIN';
    const isUPPS = user?.role === 'UPPS' || user?.role === 'SUPERADMIN';
    const { data } = useGetAkreditasiQuery({
        page: page + 1,
        per_page: perPage,
        available: true,
        ...(isAdmin && { only_null_assesor: true }),
    },
        {
            skip: !user
        });
    const columnVisibility = {
        admin: {
            hidden: ['actions', 'tanggal_validasi', 'status', 'status_assesor', 'fakultas']
        },
        upps: {
             hidden: ['actions', 'tanggal_validasi', 'status', 'fakultas']
        },
        nonAdmin: {
            hidden: ['status_prodi', 'status_lpmi', 'status_assesor']
        }
    };

    useEffect(() => {
        if (data?.data) {
            setAkreditasi(data?.data.results)
            setTotalData(data?.data.totalCount)
            setSummary(data?.data.summary)
        }
    }, [data]);

    const handleChangePage = (_: unknown, newPage: number) => {
        setPage(newPage);
    };

    const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
        setPerPage(+event.target.value);
        setPage(0);
    };

    const handleValidation = (row: Akreditasi) => {
        sessionStorage.setItem('formData', JSON.stringify({
            id_regulasi: row.question_set.id_qs,
            id_akreditasi: row.id_akreditasi,
            status: row.status,
            nama_akreditasi: row.nama_akreditasi,
            tanggal_selesai: row.tanggal_selesai,
            total_max_bobot: row.question_set.total_max_bobot,
            is_lpmi: true
        }));

        router.push('/form');
    };

    const columns: Column<Akreditasi>[] = [
        {
            id: 'prodi',
            label: 'Prodi',
            render: (row) => row.prodi?.kode_prodi ?? '-',
        },
        {
            id: 'fakultas',
            label: 'Faculty',
            render: (row) => row.prodi?.fakultas ?? '-',
        },
        {
            id: 'nama_lembaga',
            label: 'Assessor',
            render: (row) => row.question_set.nama_lembaga ?? '-',
        },
        {
            id: 'tanggal_selesai',
            label: 'Submission Due',
            render: (row) =>
                formatDate(row.tanggal_selesai),
        },
        { id: 'status', label: 'Status' },
        {
            id: 'status_prodi',
            label: 'Prodi Status',
            render: (row) => row.status != 'In Progress' ? 'Submitted' : row.status,
        },
        {
            id: 'status_lpmi',
            label: 'LPMI Status',
            render: (row) => row.status == 'In Progress' ? 'Awaiting Submission' : row.status == 'Reviewed' ? 'Validated' : row.status,
        },
        {
            id: 'status_assesor',
            label: 'Assesor Status',
            render: (row) => ['Submitted', 'In Progress', 'Validating', 'Validated'].includes(row.status) ? 'Awaiting Submission' : row.status,
        },
        {
            id: 'progress',
            label: 'Current Progress',
            minWidth: 150,
            align: 'center',
            render: (row) => {
                return (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Box sx={{ minWidth: 120 }}>
                            <LinearProgress variant="determinate" value={row.progress} sx={{ height: 6, borderRadius: 5 }} />
                        </Box>
                        <Box sx={{ minWidth: 35 }}>
                            <Typography
                                variant="body2"
                                sx={{ color: 'text.secondary' }}
                            >{`${row.progress}%`}</Typography>
                        </Box>
                    </Box>
                );
            },
        },
        {
            id: 'tanggal_validasi',
            label: 'Last Save',
            render: (row) =>
                formatDate(row.tanggal_validasi),
        },
        {
            id: 'actions',
            label: 'Actions',
            render: (row) => (
                <Stack direction="row" spacing={1}>
                    <Button
                        size="small"
                        variant="contained"
                        onClick={() => handleValidation(row)}
                    >
                        Edit Form
                    </Button>
                </Stack>
            ),
        },
    ];

    const filteredColumns = columns.filter(col => {
        if (isAdmin) {
            const hidden = columnVisibility.admin?.hidden || [];
            return !hidden.includes(col.id as string);
        }
        else if (isUPPS) {
            const hidden = columnVisibility.upps?.hidden || [];
            return !hidden.includes(col.id as string);
        }
        else {
            const hidden = columnVisibility.nonAdmin?.hidden || [];
            return !hidden.includes(col.id as string);
        }
    });

    const stats = [
        {
            title: "EDPS In Progress",
            value: summary?.in_progress || 0,
            icon: <DescriptionOutlinedIcon fontSize="inherit" />,
        },
        {
            title: "Awaiting Validation",
            value: summary?.submitted || 0,
            icon: <ManageSearchOutlinedIcon fontSize="inherit" />,
        },
        {
            title: "Validation Complete",
            value: summary?.validated || 0,
            icon: <FactCheckOutlinedIcon fontSize="inherit" />,
        },
        {
            title: "Reviewed by Assessor",
            value: summary?.reviewed || 0,
            icon: <ArticleOutlinedIcon fontSize="inherit" />,
        },
    ];

    return (
        <>
            <Typography
                variant="h4"
                gutterBottom
                sx={{
                    fontWeight: 600,
                    mb: 1,
                    color: 'primary.main',
                }}
            >
                Welcome, {user?.role}
            </Typography>
            <Grid container spacing={3} mb={3}>
                {stats.map((item, index) => (
                    <Grid size={3} key={index}>
                        <StatCard {...item} />
                    </Grid>
                ))}
            </Grid>
            <Typography
                variant="h5"
                gutterBottom
                sx={{
                    fontWeight: 600,
                    color: 'primary.main',
                }}
            >
                {(isAdmin || isUPPS)? 'Progress Overview': 'Validation Queue'}
            </Typography>
            <DataTable
                columns={filteredColumns}
                rows={akreditasi}
                page={page}
                rowsPerPage={perPage}
                totalData={totalData}
                handleChangePage={handleChangePage}
                handleChangeRowsPerPage={handleChangeRowsPerPage}
            />
        </>
    )
}

export default HomePage