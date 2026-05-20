'use client';
import { EmbaNotes, JawabanUser } from "@/model/Jawaban";
import { Pertanyaan } from "@/model/Pertanyaan";
import { Box, Typography, Paper, Grid, Tabs, Tab, TextField } from "@mui/material";
import { styled } from "@mui/material/styles";
import { useState, useEffect } from "react";

const StyledTabs = styled(Tabs)({
    minHeight: 0,
    '& .MuiTabs-indicator': {
        display: 'none',
    },
});

const StyledTab = styled(Tab)(({ theme }) => ({
    textTransform: "none",
    fontWeight: 600,
    minHeight: 40,
    padding: "8px 20px",
    marginRight: 4,
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    backgroundColor: "#e0e0e0",
    color: "#555",

    '&.Mui-selected': {
        backgroundColor: "#8B0000",
        color: "#fff",
    },
}));

interface RecapPageProps {
    pertanyaan: Pertanyaan[];
    answers: Record<number, number>;
    getAnswer: Record<number, JawabanUser>;
    role: 'PRODI' | 'LPMI' | 'Asessor';
    status: string;
    recapData: EmbaNotes;
    setRecapData: React.Dispatch<
        React.SetStateAction<EmbaNotes>
    >;
}

function RecapPage({
    pertanyaan,
    answers,
    getAnswer,
    role,
    status,
    recapData,
    setRecapData
}: RecapPageProps) {
    const [tab, setTab] = useState<'PRODI' | 'LPMI' | 'Asessor'>("PRODI");

    useEffect(() => {
        if (role) {
            setTab(role);
        }
    }, [role]);

    const handleRecapChange = (
        field: keyof EmbaNotes,
        value: string
    ) => {
        setRecapData((prev) => ({
            ...prev,
            [field]: value,
        }));
    };

    const getValue = (q_no: number) => {
        if (tab === role) {
            return answers[q_no] ?? 0;
        }

        const data = getAnswer[q_no];
        if (!data) return 0;

        switch (tab) {
            case "PRODI":
                return data.jawaban_prodi ?? 0;
            case "LPMI":
                return data.jawaban_lpmi ?? 0;
            case "Asessor":
                return data.jawaban_assesor ?? 0;
            default:
                return 0;
        }
    };

    const totalQuestions = pertanyaan.length;

    const melampaui = pertanyaan.filter((q: any) => {
        return getValue(q.q_no) === 1;
    }).length;

    const tidakMelampaui = totalQuestions - melampaui;

    const hasMandatoryZero = pertanyaan.some((q: any) => {
        return q.mandatory && getValue(q.q_no) === 0;
    });

    const mandatoryQuestionLength = pertanyaan.filter((q: any) => {
        return q.mandatory;
    }).length;

    const isActiveAssessor = tab === "Asessor" && role === "Asessor" && status != 'Reviewed';
    return (
        <Box
            sx={{
                px: 2,
            }}
        >
            <Typography variant="h4" mb={3}>
                Rekapitulasi Penilaian Asesmen Kecukupan
            </Typography>
            <Box
                sx={{ width: 900, mx: "auto" }}
            >
                {(status != 'In Progress') &&
                    <StyledTabs value={tab} onChange={(_, v) => setTab(v)}>
                        <StyledTab label="PRODI" value="PRODI" />

                        {(role == 'LPMI' || ["Validated", "Reviewed", "Reviewing"].includes(status)) && (
                            <StyledTab label="LPMI" value="LPMI" />
                        )}

                        {(role == 'Asessor' || status == 'Reviewed') && (
                            <StyledTab label="Asessor" value="Asessor" />
                        )}
                    </StyledTabs>
                }
                <Paper sx={{ p: 6 }}>
                    <Typography variant="h5" mb={4}>
                        HASIL PENILAIAN ASSESSMENT KECUKUPAN
                    </Typography>
                    <Paper sx={{ p: 5 }}>
                        <Grid container spacing={2}>

                            <Grid size={5}>
                                <Typography>Indikator Melampaui</Typography>
                            </Grid>
                            <Grid size={7}>
                                <Typography>
                                    : {melampaui} ({((melampaui / totalQuestions) * 100).toFixed(0)}%)
                                </Typography>
                            </Grid>

                            <Grid size={5}>
                                <Typography>Indikator Tidak Melampaui</Typography>
                            </Grid>
                            <Grid size={7}>
                                <Typography>
                                    : {tidakMelampaui} ({((tidakMelampaui / totalQuestions) * 100).toFixed(0)}%)
                                </Typography>
                            </Grid>

                            <Grid size={5}>
                                <Typography>Pemenuhan {mandatoryQuestionLength} Indikator</Typography>
                            </Grid>
                            <Grid size={7}>
                                <Typography>
                                    : {hasMandatoryZero ? "Tidak Melampaui" : "Melampaui"}
                                </Typography>
                            </Grid>

                            <Grid size={5}>
                                <Typography>Evaluasi Terintegrasi</Typography>
                            </Grid>
                            <Grid size={7}>
                                {isActiveAssessor ? (
                                    <TextField
                                        fullWidth
                                        multiline
                                        minRows={4}
                                        value={recapData.evaluasi_integrasi || ""}
                                        onChange={(e) => handleRecapChange( "evaluasi_integrasi", e.target.value)}
                                    />
                                ) : (
                                    <Typography>
                                        : {recapData.evaluasi_integrasi || '-'}
                                    </Typography>
                                )}
                            </Grid>

                            <Grid size={5}>
                                <Typography>Rekomendasi Hasil AK</Typography>
                            </Grid>
                            <Grid size={7}>
                                {isActiveAssessor ? (
                                    <TextField
                                        fullWidth
                                        multiline
                                        minRows={4}
                                        value={recapData.rekomendasi_ak || ""}
                                        onChange={(e) => handleRecapChange( "rekomendasi_ak", e.target.value)}
                                    />
                                ) : (
                                    <Typography>
                                        : {recapData.rekomendasi_ak || '-'}
                                    </Typography>
                                )}
                            </Grid>

                            <Grid size={5}>
                                <Typography>Catatan Asesor</Typography>
                            </Grid>
                            <Grid size={7}>
                                {isActiveAssessor ? (
                                    <TextField
                                        fullWidth
                                        multiline
                                        minRows={4}
                                        value={recapData.catatan_assesor || ""}
                                        onChange={(e) => handleRecapChange( "catatan_assesor", e.target.value)}
                                    />
                                ) : (
                                    <Typography>
                                        : {recapData.catatan_assesor || '-'}
                                    </Typography>
                                )}
                            </Grid>

                        </Grid>
                    </Paper>
                </Paper>
            </Box>
        </Box>
    );
}

export default RecapPage;