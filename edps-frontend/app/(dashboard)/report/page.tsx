"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
    Typography,
    Stack,
    Box,
    Grid,
    MenuItem,
    CircularProgress,
    Alert,
    Tooltip,
    Skeleton,
    IconButton
} from "@mui/material";
import InfoIcon from '@mui/icons-material/Info';
import { useForm } from 'react-hook-form';
import { useAuth } from "@/app/service/hooks/useAuth";
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ReportData, IndicatorTable, RadarReport } from "@/model/Akreditasi";
import { Lembaga } from "@/model/Lembaga";
import { useGetReportQuery, useGetTahunBerlakuQuery } from "@/api/akreditasi";
import { useGetLembagaQuery } from "@/api/lembaga";
import DropdownInputController from "@/app/component/controller/DropdownInputController";
import RiskOverview from "./RiskOverview";
import AccreditationBarChart from "./AccreditationBarChart";
import AccreditationRadarChart from "./AccreditationRadarChart";
import NoPaginationTable, { Column } from "@/app/component/table/NoPaginationTable";

export const ReportParamSchema = z.object({
    tahun_berlaku: z.string().min(1, "Tahun berlaku is required"),
    id_lembaga: z.number().optional(),
    id_prodi: z.array(z.string()).optional(),
});

export type ReportFilter = z.infer<typeof ReportParamSchema>;

const DEFAULT_FILTERS: ReportFilter = {
    tahun_berlaku: '',
    id_lembaga: undefined,
    id_prodi: []
};

const TABLE_COLUMNS: Column<IndicatorTable>[] = [
    { id: 'major', label: 'Prodi' },
    { id: 'indikator_u', label: 'Indikator U (%)', align: 'center' },
    { id: 'indikator_m', label: 'Indikator M (%)', align: 'center' },
    { id: 'indikator_bm', label: 'Indikator BM (%)', align: 'center' },
    { id: 'melampaui', label: 'Terlampaui', align: 'center' },
    { id: 'memenuhi', label: 'Memenuhi', align: 'center' },
    { id: 'belum_memenuhi', label: 'Belum Memenuhi', align: 'center' },
    { id: 'jumlah', label: 'Jumlah', align: 'center' },
    { id: 'LAM', label: 'LAM', align: 'center' },
];

const LoadingState: React.FC = () => (
    <Box sx={{ height: 400, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <CircularProgress />
    </Box>
);

const EmptyState: React.FC = () => (
    <Box sx={{ height: 400, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Typography variant="h6" color="text.secondary">
            No data yet, please select a year
        </Typography>
    </Box>
);

interface FilterBarProps {
    tahunOptions: string[];
    lembagaOptions: Lembaga[];
    prodiOptions: string[];
    control: any;
}

const FilterBar: React.FC<FilterBarProps> = ({ tahunOptions, lembagaOptions, prodiOptions, control }) => (
    <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size="auto">
            <DropdownInputController
                name="tahun_berlaku"
                control={control}
                label="Tahun Berlaku"
                size="small"
                showClearButton={false}
                sx={{ "& .MuiInputBase-root": { width: 200 } }}
            >
                {tahunOptions.map((year) => (
                    <MenuItem key={year} value={year}>
                        {year}
                    </MenuItem>
                ))}
            </DropdownInputController>
        </Grid>
        {/* <Grid size="auto">
            <DropdownInputController
                name="id_lembaga"
                control={control}
                label="Lembaga"
                size="small"
                sx={{ "& .MuiInputBase-root": { width: 200 } }}
            >
                {lembagaOptions.map((lembaga) => (
                    <MenuItem key={lembaga.id_lembaga} value={lembaga.id_lembaga}>
                        {lembaga.nama_lembaga}
                    </MenuItem>
                ))}
            </DropdownInputController>
        </Grid> */}
        <Grid size="auto">
            <DropdownInputController
                name="id_prodi"
                control={control}
                label="Program Studi"
                size="small"
                sx={{ "& .MuiInputBase-root": { width: 200 } }}
                multiple
                showClearButton={false}
            >
                {prodiOptions.map((prodi) => (
                    <MenuItem key={prodi} value={prodi}>
                        {prodi}
                    </MenuItem>
                ))}
            </DropdownInputController>
        </Grid>
    </Grid>
);

function ReportPage() {
    const { user, isLoading: authLoading } = useAuth();
    const [tahunOptions, setTahunOptions] = useState<string[]>([]);
    const [lembagaOptions, setLembagaOptions] = useState<Lembaga[]>([]);
    const [prodiOptions, setProdiOptions] = useState<string[]>([]);

    const { data: tahunData, isLoading: isLoadingTahun } = useGetTahunBerlakuQuery({ id_prodi: undefined });
    const { data: lembagaData, isLoading: isLoadingLembaga } = useGetLembagaQuery(undefined);

    const { control, watch, setValue } = useForm<ReportFilter>({
        mode: 'onSubmit',
        defaultValues: DEFAULT_FILTERS,
        resolver: zodResolver(ReportParamSchema)
    });

    const filters = watch();

    const { data: reportResponse, isLoading: isLoadingReport } = useGetReportQuery(
        {
            tahun_berlaku: filters.tahun_berlaku,
            id_lembaga: filters.id_lembaga,
            id_fakultas: user?.id_fakultas
        },
        { skip: !filters.tahun_berlaku || !user }
    );

    const reportData = reportResponse?.data;
    const hasSelectedYear = !!filters.tahun_berlaku;
    const isLoading = isLoadingTahun || isLoadingLembaga;

    useEffect(() => {
        if (reportData?.indicator_table) {
            const uniqueProdis = Array.from(
                new Set(reportData.indicator_table.map(item => item.major))
            ).sort();
            setProdiOptions(uniqueProdis);
        }
    }, [reportData]);

    const filteredReportData = useMemo(() => {
        if (!reportData) return null;

        const selectedProdis = filters.id_prodi || [];

        if (selectedProdis.length === 0) {
            return reportData;
        }

        const filteredIndicatorTable =
            reportData.indicator_table?.filter(item =>
                selectedProdis.includes(item.major)
            ) || [];

        const filteredRiskPerMajor =
            reportData.risk_per_major?.filter(item =>
                selectedProdis.includes(item.major)
            ) || [];

        const filteredBarData =
            reportData.bar_data?.filter(item =>
                selectedProdis.includes(item.major)
            ) || [];

        let filteredRadar = {
            labels: [],
            datasets: { u: [], m: [], bm: [] }
        };

        if (reportData.radar) {
            const indices = reportData.radar.labels
                .map((label, index) =>
                    selectedProdis.includes(label) ? index : -1
                )
                .filter(index => index !== -1);

            const filteredRadar: RadarReport = {
                labels: indices.map(i => reportData.radar.labels[i]),
                datasets: {
                    u: indices.map(i => reportData.radar.datasets.u?.[i]),
                    m: indices.map(i => reportData.radar.datasets.m?.[i]),
                    bm: indices.map(i => reportData.radar.datasets.bm?.[i]),
                }
            };
        }

        return {
            ...reportData,
            indicator_table: filteredIndicatorTable,
            risk_per_major: filteredRiskPerMajor,
            bar_data: filteredBarData,
            radar: filteredRadar
        };
    }, [reportData, filters.id_prodi]);

    useEffect(() => {
        if (tahunData?.data?.length) {
            setTahunOptions(tahunData.data);
            if (!watch("tahun_berlaku")) {
                setValue("tahun_berlaku", String(tahunData.data[0]));
            }
        }
    }, [tahunData, setValue, watch]);

    useEffect(() => {
        if (lembagaData?.data) {
            setLembagaOptions(lembagaData.data);
        }
    }, [lembagaData]);


    useEffect(() => {
        setValue("id_prodi", []);
    }, [filters.tahun_berlaku, filters.id_lembaga, setValue]);

    const tableColumns = useMemo(() => TABLE_COLUMNS, []);

    if (isLoading || authLoading) {
        return <LoadingState />;
    }

    return (
        <>
            <Typography
                variant="h4"
                gutterBottom
                sx={{
                    fontWeight: 600,
                    mb: 4,
                    color: 'primary.main',
                    pb: 1,
                }}
            >
                Dashboard Report
            </Typography>



            <FilterBar
                tahunOptions={tahunOptions}
                lembagaOptions={lembagaOptions}
                prodiOptions={prodiOptions}
                control={control}
            />

            {!hasSelectedYear ? (
                <EmptyState />
            ) : isLoadingReport ? (
                <LoadingState />
            ) : filteredReportData ? (
                <Stack spacing={4}>
                    <Box>
                        <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                            <Typography variant="h6" sx={{ fontWeight: 500 }}>
                                Risk Overview
                            </Typography>
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
                                        <br />
                                        <div><strong>Risk Level Ranges:</strong></div>
                                        <div>• Low: 0.00 - 0.33</div>
                                        <div>• Medium: 0.33 - 0.66</div>
                                        <div>• High: 0.66 - 1.00</div>
                                    </>
                                }
                                arrow
                            >
                                <IconButton size="small">
                                    <InfoIcon fontSize="small" />
                                </IconButton>
                            </Tooltip>
                        </Box>
                        <RiskOverview riskPerMajor={filteredReportData.risk_per_major || []} />
                    </Box>

                    {/* Bar Chart Section */}
                    <Box>
                        <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                            <Typography variant="h6" sx={{ fontWeight: 500 }}>
                                Accreditation Distribution
                            </Typography>
                            <Tooltip
                                title={
                                    <div>
                                        <div>
                                            Values are normalized using: <b>total score / total bobot</b>
                                        </div>
                                        <div>
                                            0 = lowest performance, 1 = highest possible score
                                        </div>
                                    </div>
                                }
                                arrow
                            >
                                <IconButton size="small">
                                    <InfoIcon fontSize="small" />
                                </IconButton>
                            </Tooltip>
                        </Box>
                        <AccreditationBarChart data={filteredReportData.bar_data || []} />
                    </Box>

                    <Grid container spacing={3}>
                        <Grid size={{ xs: 12, md: 4 }}>
                            <Typography variant="h6" gutterBottom sx={{ mb: 2, fontWeight: 500 }}>
                                Performance Radar
                            </Typography>
                            <AccreditationRadarChart
                                data={filteredReportData.radar || {
                                    labels: [],
                                    datasets: { u: [], m: [], bm: [] },
                                }}
                            />
                        </Grid>

                        <Grid size={{ xs: 12, md: 8 }}>
                            <Typography variant="h6" gutterBottom sx={{ mb: 2, fontWeight: 500 }}>
                                Indicator Summary
                            </Typography>
                            <NoPaginationTable
                                columns={tableColumns}
                                rows={filteredReportData.indicator_table || []}
                            />
                        </Grid>
                    </Grid>
                </Stack>
            ) : (
                <Alert severity="info" sx={{ mt: 2 }}>
                    No data available for the selected filters
                </Alert>
            )}
        </>
    );
}

export default ReportPage;