"use client"

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
    Chip
} from "@mui/material";
import { useState, useEffect } from "react";
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ReportData, IndicatorTable } from "@/model/Akreditasi";
import { Lembaga } from "@/model/Lembaga";
import { useGetReportQuery, useGetTahunBerlakuQuery } from "@/api/akreditasi";
import { useGetLembagaQuery } from "@/api/lembaga";
import DropdownInputController from "@/app/component/controller/DropdownInputController";
import RiskOverview from "./RiskOverview";
import AccreditationBarChart from "./AccreditationBarChart";
import AccreditationRadarChart from "./AccreditationRadarChart";
import NoPaginationTable, { Column } from "@/app/component/table/NoPaginationTable";

export const ReportParamSchema = z.object({
    tahun_berlaku: z.string(),
    id_lembaga: z.number().optional(),
});

export type ReportFilter = z.infer<typeof ReportParamSchema>

function ReportPage() {
    const [reportData, setReportData] = useState<ReportData>();
    const [tahun, setTahun] = useState<string[]>([]);
    const [lembaga, setLembaga] = useState<Lembaga[]>([]);
    const { data: tahunData } = useGetTahunBerlakuQuery({ id_prodi: undefined });
    const { data: lembagaData } = useGetLembagaQuery(undefined);

    const defaultValues: ReportFilter = {
        tahun_berlaku: '',
        id_lembaga: undefined
    }

    const { control, formState, handleSubmit, setValue, setError, trigger, watch, reset } = useForm<ReportFilter>({
        mode: 'onSubmit',
        defaultValues,
        resolver: zodResolver(ReportParamSchema)
    });

    const filters = watch();
    const { data } = useGetReportQuery({ tahun_berlaku: filters.tahun_berlaku, id_lembaga: filters.id_lembaga }, {skip: !filters.tahun_berlaku})

    useEffect(() => {
        if (tahunData?.data) {
            setTahun(tahunData.data)
            if (!watch("tahun_berlaku")) {
                setValue("tahun_berlaku", String(tahunData.data[0]));
            }
        }
    }, [tahunData])
    useEffect(() => {
        if (data) {
            setReportData(data.data)
        }
    }, [data])

    useEffect(() => {
        if (lembagaData?.data) {
            setLembaga(lembagaData.data);
        }
    }, [lembagaData]);

    const columns: Column<IndicatorTable>[] = [
        {
            id: 'major',
            label: 'Prodi',
        },
        {
            id: 'indikator_u',
            label: 'Indikator U (%)',
            align: 'center',
        },
        {
            id: 'indikator_m',
            label: 'Indikator M (%)',
            align: 'center',
        },
        {
            id: 'indikator_bm',
            label: 'Indikator BM (%)',
            align: 'center',
        },
        {
            id: 'melampaui',
            label: 'Terlampaui',
            align: 'center',
        },
        {
            id: 'memenuhi',
            label: 'Memenuhi',
            align: 'center',
        },
        {
            id: 'belum_memenuhi',
            label: 'Belum Memenuhi',
            align: 'center',
        },
        {
            id: 'jumlah',
            label: 'Jumlah',
            align: 'center',
        },
        {
            id: 'LAM',
            label: 'LAM',
            align: 'center',
        },
    ]

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
                        Dashboard Report
                    </Typography>
                </Grid>
                <Grid container gap={2}>
                    <Grid>
                        <DropdownInputController
                            name="tahun_berlaku"
                            control={control}
                            label="Tahun Berlaku"
                            size='small'
                            showClearButton={false}
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
                    <Grid>
                        <DropdownInputController
                            name="id_lembaga"
                            control={control}
                            label="Lembaga"
                            size='small'
                            sx={{
                                "& .MuiInputBase-root": {
                                    width: 200
                                }
                            }}
                        >
                            {lembaga.map((l) => (
                                <MenuItem key={l.id_lembaga} value={l.id_lembaga}>
                                    {l.nama_lembaga}
                                </MenuItem>
                            ))}
                        </DropdownInputController>
                    </Grid>
                </Grid>
            </Grid>
            {!filters.tahun_berlaku ? (
                <Box
                    sx={{
                        height: 400,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                    }}
                >
                    <Typography variant="h6" color="text.secondary">
                        No data yet, please pick year
                    </Typography>
                </Box>
            ) : (
                <>
                    <RiskOverview
                        riskPerMajor={reportData?.risk_per_major || []}
                    />

                    <AccreditationBarChart
                        data={reportData?.bar_data || []}
                    />

                    <Grid container justifyContent="space-between">
                        <Grid size={4}>
                            <AccreditationRadarChart
                                data={
                                    reportData?.radar || {
                                        labels: [],
                                        datasets: {
                                            u: [],
                                            m: [],
                                            bm: [],
                                        },
                                    }
                                }
                            />
                        </Grid>

                        <Grid size={7.8}>
                            <NoPaginationTable
                                columns={columns}
                                rows={reportData?.indicator_table || []}
                            />
                        </Grid>
                    </Grid>
                </>
            )}
        </>
    )
}

export default ReportPage