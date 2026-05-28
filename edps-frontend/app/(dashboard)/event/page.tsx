"use client"

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { Akreditasi } from "@/model/Akreditasi";
import { GetProdi } from "@/model/Prodi";
import { useGetAkreditasiQuery, useGetTahunBerlakuQuery } from "@/api/akreditasi";
import { useGetProdiQuery } from '@/api/prodi';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
    Typography,
    Button,
    Stack,
    Box,
    Grid,
    MenuItem,
    CircularProgress
} from "@mui/material";
import DataTable, { Column } from "@/app/component/table/DataTable";
import { useAuth } from "@/app/service/hooks/useAuth";
import DropdownInputController from "@/app/component/controller/DropdownInputController";

export const AkreditasiParamSchema = z.object({
    fakultas: z.string(),
    tahun_berlaku: z.string(),
    id_qs: z.string(),
    id_prodi: z.string(),
    id_lembaga: z.number().optional(),
});

export type AkreditasiFilter = z.infer<typeof AkreditasiParamSchema>

function EventPage() {
    const router = useRouter();
    const { user, isLoading: authLoading } = useAuth();
    const [totalData, setTotalData] = useState(0)
    const [page, setPage] = useState(0)
    const [perPage, setPerPage] = useState(5)
    const [akreditasi, setAkreditasi] = useState<Akreditasi[]>([]);
    const [prodi, setProdi] = useState<GetProdi[]>([]);
    const [tahun, setTahun] = useState<string[]>([]);
    const { data: prodiData } = useGetProdiQuery();
    const { data: tahunData } = useGetTahunBerlakuQuery({ id_prodi: user?.id_prodi || undefined });
    const today = new Date();

    const defaultValues: AkreditasiFilter = {
        tahun_berlaku: '',
        id_qs: '',
        id_prodi: '',
        fakultas: '',
        id_lembaga: undefined
    }

    const { control, formState, handleSubmit, setValue, setError, trigger, watch, reset } = useForm<AkreditasiFilter>({
        mode: 'onSubmit',
        defaultValues,
        resolver: zodResolver(AkreditasiParamSchema)
    });

    useEffect(() => {
        if (user?.id_prodi) {
            reset({
                ...defaultValues,
                id_prodi: user.id_prodi,
            });
        }
    }, [user, reset]);

    const filters = watch();

    const { data } = useGetAkreditasiQuery({
        page: page + 1,
        per_page: perPage,
        available: true,
        id_prodi: filters.id_prodi || undefined,
        tahun_berlaku: filters.tahun_berlaku || undefined,
        fakultas: filters.fakultas || undefined,
        id_qs: filters.id_qs || undefined,
    });

    useEffect(() => {
        setPage(0);
    }, [
        filters.id_prodi,
        filters.tahun_berlaku,
        filters.fakultas,
        filters.id_qs,
    ]);

    useEffect(() => {
        if (data?.data) {
            setAkreditasi(data?.data.results)
            setTotalData(data?.data.totalCount)
        }
    }, [data]);

    useEffect(() => {
        if (prodiData?.data) {
            setProdi(prodiData.data)
        }
    }, [prodiData])

    useEffect(() => {
        if (tahunData?.data) {
            setTahun(tahunData.data)
        }
    }, [tahunData]) // Added tahunData as dependency

    const handleView = (row: Akreditasi) => {
        sessionStorage.setItem('formData', JSON.stringify({
            id_regulasi: row.question_set.id_qs,
            id_periode: row.id_akreditasi,
            status: row.status,
            nama_periode: row.nama_akreditasi,
            tanggal_selesai: row.tanggal_selesai,
            total_max_bobot: row.question_set.total_max_bobot,
            lembaga: row.question_set.id_lembaga,
            closed: today > new Date(row.tanggal_selesai)
        }));

        router.push('/form');
    };

    const handleValidation = (row: Akreditasi) => {
        sessionStorage.setItem('formData', JSON.stringify({
            id_regulasi: row.question_set.id_qs,
            id_periode: row.id_akreditasi,
            status: row.status,
            nama_periode: row.nama_akreditasi,
            tanggal_selesai: row.tanggal_selesai,
            total_max_bobot: row.question_set.total_max_bobot,
            is_lpmi: true,
            lembaga: row.question_set.id_lembaga,
            closed: today > new Date(row.tanggal_selesai)
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
        { id: 'nama_akreditasi', label: 'Event Name' },
        {
            id: 'tanggal_selesai',
            label: 'Due',
            render: (row) =>
                new Date(row.tanggal_selesai).toLocaleDateString("en-GB"),
        },
        {
            id: 'total_skor_prodi',
            label: 'Prodi',
            render: (row) =>
                row.total_skor_prodi === 0
                    ? '-'
                    : `${row.total_skor_prodi}/${row.question_set.total_max_bobot}`,
        },
        {
            id: 'total_skor_lpmi',
            label: 'LPMI',
            render: (row) =>
                !["Validated", "Reviewed", "Reviewing"].includes(row.status || "")
                    ? '-'
                    : `${row.total_skor_lpmi}/${row.question_set.total_max_bobot}`,
        },
        {
            id: 'total_skor_assesor',
            label: 'Assesor',
            render: (row) =>
                !["Reviewed"].includes(row.status || "")
                    ? '-'
                    : `${row.total_skor_assesor}/${row.question_set.total_max_bobot}`,
        },
        {
            id: 'visual',
            label: 'Visual',
            render: (row) => {
                const max = row.question_set.total_max_bobot || 1;

                const prodiPercent = (row.total_skor_prodi / max) * 100;
                const lpmiPercent = (row.total_skor_lpmi / max) * 100;
                const assesorPercent = (row.total_skor_assesor / max) * 100;

                return (
                    <Stack spacing={0.5} sx={{ minWidth: 150 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Box sx={{ width: 60, fontSize: '0.7rem' }}>Prodi:</Box>
                            <Box sx={{ flex: 1, height: 6, bgcolor: '#eee', borderRadius: 1, overflow: 'hidden' }}>
                                <Box sx={{ width: `${prodiPercent}%`, height: '100%', bgcolor: '#8B0000' }} />
                            </Box>
                            <Box sx={{ fontSize: '0.7rem', minWidth: 40 }}>
                                {row.total_skor_prodi === 0 ? '-' : `${Math.round(prodiPercent)}%`}
                            </Box>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Box sx={{ width: 60, fontSize: '0.7rem' }}>LPMI:</Box>
                            <Box sx={{ flex: 1, height: 6, bgcolor: '#eee', borderRadius: 1, overflow: 'hidden' }}>
                                <Box sx={{ width: `${lpmiPercent}%`, height: '100%', bgcolor: '#E69F00' }} />
                            </Box>
                            <Box sx={{ fontSize: '0.7rem', minWidth: 40 }}>
                                {row.total_skor_lpmi === 0 ? '-' : `${Math.round(lpmiPercent)}%`}
                            </Box>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Box sx={{ width: 60, fontSize: '0.7rem' }}>Assesor:</Box>
                            <Box sx={{ flex: 1, height: 6, bgcolor: '#eee', borderRadius: 1, overflow: 'hidden' }}>
                                <Box sx={{ width: `${assesorPercent}%`, height: '100%', bgcolor: '#ccc' }} />
                            </Box>
                            <Box sx={{ fontSize: '0.7rem', minWidth: 40 }}>
                                {row.total_skor_assesor === 0 ? '-' : `${Math.round(assesorPercent)}%`}
                            </Box>
                        </Box>
                    </Stack>
                );
            },
        },
        {
            id: 'gap',
            label: 'Gap',
            render: (row) =>
                (row.total_skor_lpmi === 0 || row.total_skor_assesor === 0)
                    ? '-'
                    : `${row.total_skor_assesor - row.total_skor_lpmi}`,
        },
        { id: 'status', label: 'Status' },
        {
            id: 'deadline_status',
            label: 'Deadline Status',
            render: (row) => {
                const dueDate = new Date(row.tanggal_selesai);

                const isClosed = today > dueDate;

                return (
                    <Box
                        sx={{
                            px: 1.5,
                            py: 0.5,
                            borderRadius: 2,
                            fontWeight: 600,
                            display: 'inline-block',
                            color: isClosed ? '#fff' : '#1b5e20',
                            backgroundColor: isClosed ? '#d32f2f' : '#c8e6c9',
                        }}
                    >
                        {isClosed ? 'Closed' : 'Open'}
                    </Box>
                );
            },
        },
        {
            id: 'actions',
            label: 'Actions',
            render: (row) => (
                <Stack direction="row" spacing={1}>
                    {(user?.role == "SUPERADMIN" || user?.role == "PRODI") &&
                        <Button
                            size="small"
                            variant="contained"
                            onClick={() => handleView(row)}
                        >
                            {row.status == 'In Progress' && !(today > new Date(row.tanggal_selesai)) ? 'Edit Form' : 'Review'}
                        </Button>
                    }
                    {(user?.role == "SUPERADMIN" || user?.role == "LPMI" || user?.role == "UPPS") &&
                        <Button
                            size="small"
                            variant="contained"
                            onClick={() => handleValidation(row)}
                        >
                            {((row.status == 'Submitted' || row.status == 'Validating') && !(today > new Date(row.tanggal_selesai))) ? 'Validate Form' : 'Review'}
                        </Button>
                    }

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

    const handleChangePage = (_: unknown, newPage: number) => {
        setPage(newPage);
    };

    const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
        setPerPage(+event.target.value);
        setPage(0);
    };

    if (authLoading) {
        return (
            <Box 
                sx={{ 
                    display: 'flex', 
                    justifyContent: 'center', 
                    alignItems: 'center', 
                    minHeight: '100vh' 
                }}
            >
                <CircularProgress />
            </Box>
        );
    }

    return (
        <>
            <Grid container justifyContent="space-between" mb={1}>
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
                        Event
                    </Typography>
                </Grid>
                <Grid container gap={0.5}>
                    <Grid>
                        {!user?.nama_prodi &&
                            <DropdownInputController
                                name="id_prodi"
                                control={control}
                                label="Prodi"
                                size='small'
                                sx={{
                                    "& .MuiInputBase-root": {
                                        width: 200
                                    }
                                }}
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
                    </Grid>
                    <Grid>
                        <DropdownInputController
                            name="tahun_berlaku"
                            control={control}
                            label="Tahun Berlaku"
                            size='small'
                            sx={{
                                "& .MuiInputBase-root": {
                                    width: 200
                                }
                            }}
                        >
                            {tahun.map((category) => (
                                <MenuItem
                                    key={String(category)}
                                    value={String(category)}
                                >
                                    {category}
                                </MenuItem>
                            ))}
                        </DropdownInputController>
                    </Grid>
                </Grid>
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
};

export default EventPage;