"use client"

import { Stack, Button, Typography, Grid, LinearProgress, Box } from "@mui/material";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { useAuth } from "@/app/service/hooks/useAuth";
import { Akreditasi } from "@/model/Akreditasi";
import { useGetAkreditasiQuery } from "@/api/akreditasi";
import DataTable, { Column } from "@/app/component/table/DataTable";
import { formatDate } from "@/app/service/utils/func";

function AssesorPage() {
    const router = useRouter();
    const [page, setPage] = useState(0)
    const [perPage, setPerPage] = useState(5)
    const [totalData, setTotalData] = useState(0)
    const [akreditasi, setAkreditasi] = useState<Akreditasi[]>([]);
    const { data } = useGetAkreditasiQuery({
        page: page + 1,
        per_page: perPage,
        is_assesor_page: true
    });

    useEffect(() => {
        if (data?.data) {
            setAkreditasi(data?.data.results)
            setTotalData(data?.data.totalCount)
        }
    }, [data]);

    const handleChangePage = (_: unknown, newPage: number) => {
        setPage(newPage);
    };

    const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
        setPerPage(+event.target.value);
        setPage(0);
    };

    const handleReview = (row: Akreditasi) => {
        sessionStorage.setItem('formData', JSON.stringify({
            id_regulasi: row.question_set.id_qs,
            id_periode: row.id_akreditasi,
            status: row.status,
            nama_periode: row.nama_akreditasi,
            tanggal_selesai: row.tanggal_selesai,
            total_max_bobot: row.question_set.total_max_bobot,
            is_admin: true,
            lembaga: row.question_set.id_lembaga
        }));

        router.push('/form');
    };

    const handleAnalytic = (row: Akreditasi) => {
        sessionStorage.setItem('formData', JSON.stringify({
            id_periode: row.id_akreditasi,
            status: row.status,
            nama_periode: row.nama_akreditasi,
            tanggal_selesai: row.tanggal_selesai,
            lembaga: row.question_set.id_lembaga
        }));

        router.push('/analytics');
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
        { id: 'status', label: 'Status' },
        {
            id: 'progress',
            label: 'Validation Progress',
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
            id: 'tanggal_review',
            label: 'Last Save',
            render: (row) =>
                formatDate(row.tanggal_review),
        },
        {
            id: 'actions',
            label: 'Actions',
            render: (row) => (
                <Stack direction="row" spacing={1}>
                    <Button
                        size="small"
                        variant="contained"
                        onClick={() => handleReview(row)}
                    >
                        {(row.status == 'Reviewing' || row.status == 'Validated') ? 'Input Assessor Score': 'Review Form'}
                    </Button>
                    <Button
                        size="small"
                        variant="contained"
                        onClick={() => handleAnalytic(row)}
                    >
                        View Analytic
                    </Button>
                </Stack>
            ),
        },
    ];

    return (
        <>
            <Grid container justifyContent="space-between">
                <Grid>
                    <Typography
                        variant="h4"
                        gutterBottom
                        sx={{
                            fontWeight: 500,
                            mb: 3,
                            color: 'primary.main',
                        }}
                    >
                        Assessor Score Input Queue
                    </Typography>
                </Grid>
                {/* <Grid>
                    {!user?.nama_prodi &&
                        <DropdownInputController
                            name="id_prodi"
                            control={control}
                            label="Prodi"
                            sx={{ width: 100 }}
                        >
                            {prodi.map((category) => (
                                <MenuItem
                                    key={String(category.id_prodi)}
                                    value={String(category.id_prodi)}
                                >
                                    {category.nama_prodi}
                                </MenuItem>
                            ))}
                        </DropdownInputController>
                    }
                </Grid> */}
            </Grid>

            <Stack
                direction="column"
                spacing={2}
                sx={{ width: "100%", mb: 4 }}
            >

                <DataTable
                    columns={columns}
                    rows={akreditasi}
                    page={page}
                    rowsPerPage={perPage}
                    totalData={totalData}
                    handleChangePage={handleChangePage}
                    handleChangeRowsPerPage={handleChangeRowsPerPage}
                />
            </Stack>
        </>
    );
}

export default AssesorPage