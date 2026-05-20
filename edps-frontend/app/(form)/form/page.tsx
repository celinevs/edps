"use client";

import React, { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import {
    Box,
    Typography,
    RadioGroup,
    FormControlLabel,
    Radio,
    TextField,
    Divider,
    Button,
    Paper,
    LinearProgress,
    Pagination,
    Link,
    Chip,
    Grid,
} from "@mui/material";
import { useGetPertanyaanByRegulasiQuery } from "@/api/pertanyaan";
import { useGetJawabanUserByPeriodeQuery, useUploadFileMutation, useDeleteFileMutation, useSubmitJawabanMutation, useSubmitReviewMutation, useSubmitValidationMutation } from "@/api/jawaban";
import { downloadFile } from "@/api/downloadApi";
import { Pertanyaan } from "@/model/Pertanyaan";
import { JawabanRequestItem, FileJawaban, JawabanUser, ValidationRequestItem, EmbaDosen, EmbaNotes } from "@/model/Jawaban";
import UploadIcon from '@mui/icons-material/Upload';
import { useWeightCalculations } from "@/app/service/hooks/useWeightCalculations";
import { getIndicatorScore } from "@/app/service/utils/func";
import SubmitDialog from "./SubmitDialog";
import PagePaginationDialog from "@/app/component/pagePaginationDialog";
import WeightSummaryTable from "@/app/component/table/WeightSummaryTable";
import RecapPage from "./RecapPage";
import DosenPage from "./DosenPage";

interface FormData {
    id_regulasi: string;
    id_periode: string;
    status: string;
    tanggal_selesai: string;
    total_max_bobot: number;
    is_lpmi?: boolean;
    is_admin?: boolean;
    lembaga?: number;
    closed?: boolean;
}

function FormPage() {
    const router = useRouter();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [formData, setFormData] = useState<FormData | null>(null);
    const { data: dataPertanyaan } = useGetPertanyaanByRegulasiQuery(formData?.id_regulasi ?? "", { skip: !formData?.id_regulasi });
    const { data: dataJawaban } = useGetJawabanUserByPeriodeQuery(formData?.id_periode ?? "", { skip: !formData?.id_periode });
    const [uploadFile] = useUploadFileMutation();
    const [deleteFile] = useDeleteFileMutation();
    const [submitJawaban] = useSubmitJawabanMutation();
    const [submitValidation] = useSubmitValidationMutation();
    const [submitReview] = useSubmitReviewMutation();
    const [pertanyaan, setPertanyaan] = useState<Pertanyaan[]>([]);
    const [dosenAnswer, setDosenAnswer] = useState<EmbaDosen>();
    const [totalPage, setTotalPage] = useState(0);
    const [currentPage, setCurrentPage] = useState(1);
    const [answers, setAnswers] = useState<{ [key: number]: number }>({});
    const [recapData, setRecapData] = useState<EmbaNotes>({
        evaluasi_integrasi: '',
        rekomendasi_ak: '',
        catatan_assesor: '',
    });
    const [notes, setNotes] = useState<{ [key: number]: string }>({});
    const [initialAnswers, setInitialAnswers] = useState<{ [key: string]: number }>({});
    const [getAnswer, setGetAnswer] = useState<{ [key: number]: JawabanUser }>({});
    const [getDosen, setGetDosen] = useState<EmbaDosen[]>([]);
    const [jawaban, setJawaban] = useState<JawabanRequestItem[] | ValidationRequestItem[]>([]);
    const [files, setFiles] = useState<{ [key: number]: FileJawaban[] }>({});
    const [openDialog, setOpenDialog] = useState<boolean>(false);
    const [openPageDialog, setOpenPageDialog] = useState<boolean>(false);
    const q = pertanyaan[currentPage - 1];
    const isAnswersChanged = () => {
        return Object.entries(answers).some(([key, value]) => {
            const q_no = Number(key);
            return value !== initialAnswers[q_no];
        });
    };

    const currentRole =
        formData?.is_lpmi
            ? "LPMI"
            : formData?.is_admin
                ? "ASSESOR"
                : "PRODI";

    const {
        totalBobot,
        bobotProgress,
        weightSummary,
        answerProgress,
    } = useWeightCalculations({
        pertanyaan,
        answers,
        maxBobot: formData?.total_max_bobot,
        lembaga: formData?.lembaga
    });

    const openFileManager = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const files = event.target.files;
        if (!files || files.length === 0 || !formData || !q) return;

        const selectedFile = files[0];

        try {
            const formDataObj = new FormData();
            formDataObj.append('file', selectedFile);
            formDataObj.append('q_no', String(q.q_no));
            formDataObj.append('id_akreditasi', formData.id_periode);

            await uploadFile(formDataObj);

            console.log('File uploaded successfully');

            event.target.value = '';

        } catch (error) {
            console.error('Upload failed:', error);
        }
    };

    useEffect(() => {
        const storedData = sessionStorage.getItem('formData');
        if (storedData) {
            const parsedData = JSON.parse(storedData);
            setFormData(parsedData);
        }
    }, [router]);

    useEffect(() => {
        const fetchData = async () => {
            if (!dataPertanyaan) return;

            setPertanyaan(dataPertanyaan?.data.pertanyaan || []);

            const baseTotal = dataPertanyaan?.data.jumlah_pertanyaan || 0;

            const finalTotal = formData?.lembaga === 2
                ? baseTotal + 2
                : baseTotal;

            setTotalPage(finalTotal)
            const FullAnswersMap = dataJawaban?.data?.jawaban.reduce((acc, jawaban) => {
                acc[jawaban.q_no] = jawaban;
                return acc;
            }, {} as { [key: number]: JawabanUser });

            const dosenList = dataJawaban?.data?.emba_dosen || [];
            setGetDosen(dataJawaban?.data?.emba_dosen || [])
            setGetAnswer(FullAnswersMap || {})

            setRecapData({
                evaluasi_integrasi: dataJawaban?.data?.evaluasi_integrasi || '',
                rekomendasi_ak: dataJawaban?.data?.rekomendasi_ak || '',
                catatan_assesor: dataJawaban?.data?.catatan_assesor || '',
            });
            const isReviewer = formData?.is_lpmi || formData?.is_admin;

            const mapped = dataJawaban?.data?.jawaban.reduce(
                (acc, curr) => {
                    const qid = curr.q_no;

                    // pick correct indikator
                    const indikator = isReviewer
                        ? (formData?.is_lpmi
                            ? curr.jawaban_lpmi
                            : curr.jawaban_assesor)
                        : curr.jawaban_prodi;

                    if (indikator !== undefined && indikator !== null) {
                        acc.answers[qid] = indikator;
                    }

                    // notes only for reviewer
                    if (isReviewer) {
                        acc.notes[qid] = formData?.is_lpmi
                            ? (curr.note_lpmi ?? '')
                            : (curr.note_assesor ?? '');
                    }

                    // files always mapped
                    acc.files[qid] = curr.files;

                    return acc;
                },
                {
                    answers: {} as Record<number, number>,
                    notes: {} as Record<number, string>,
                    files: {} as Record<number, FileJawaban[]>,
                }
            );

            // apply state
            setAnswers(mapped?.answers || {});
            setInitialAnswers(mapped?.answers || {});
            setNotes(mapped?.notes || {});
            setFiles(mapped?.files || {});
            const mappedFiles = dataJawaban?.data?.jawaban.reduce(
                (acc, curr) => {
                    acc[curr.q_no] = curr.files;
                    return acc;
                },
                {} as { [key: string]: FileJawaban[] }
            );
            setFiles(mappedFiles || {});

            const selectedDosen = dosenList.find(
                (d) => d.user_role === currentRole
            );

            setDosenAnswer(selectedDosen);
        }

        fetchData();
    }, [formData, dataJawaban, dataPertanyaan]);

    const handleSelect = (questionId: number, choice: number) => {
        setAnswers((prev) => ({ ...prev, [questionId]: choice }));
    };

    const handleNoteChange = (questionId: number, value: string) => {
        setNotes((prev) => ({ ...prev, [questionId]: value }));
    };

    const saveAnswer = async (skipDosenSave: boolean = false) => {
        if (!isAnswersChanged() && !skipDosenSave) return
        if (formData?.is_lpmi || formData?.is_admin) {
            const jawabanArray = Object.entries(answers).map(
                ([key, value]) => {
                    const q_no = Number(key);

                    return {
                        q_no,
                        jawaban: Number(value),
                        note: notes[q_no] || "",
                    };
                }
            );
            const payload = {
                id_akreditasi: formData?.id_periode || '',
                id_qs: formData?.id_regulasi || '',
                jawaban: jawabanArray,
                dosen: dosenAnswer,
                evaluasi_integrasi: recapData.evaluasi_integrasi || '',
                rekomendasi_ak: recapData.rekomendasi_ak || '',
                catatan_assesor: recapData.catatan_assesor || '',
            };

            if (formData?.is_lpmi) {
                await submitValidation(payload).unwrap();
                setInitialAnswers(answers);
            }
            else {
                await submitReview(payload).unwrap();
                setInitialAnswers(answers);
            }

        }
        else {
            const jawabanArray = Object.entries(answers).map(
                ([q_no, jawaban]) => ({
                    q_no: Number(q_no),
                    jawaban: jawaban,
                })
            );
            const payload = {
                id_akreditasi: formData?.id_periode || '',
                id_qs: formData?.id_regulasi || '',
                jawaban: jawabanArray,
                dosen: dosenAnswer
            };
            await submitJawaban(payload).unwrap();
            setInitialAnswers(answers);
        }
    }

    const handlePageChange = (event: React.ChangeEvent<unknown>, value: number) => {
        saveAnswer()
        setCurrentPage(value);
    };

    const handleOpenDialog = () => {
        if (formData?.is_lpmi || formData?.is_admin) {
            const jawabanArray = Object.entries(answers).map(
                ([key, value]) => {
                    const q_no = Number(key);

                    return {
                        q_no,
                        jawaban: Number(value),
                        note: notes[q_no] || "",
                    };
                }
            );
            setJawaban(jawabanArray);
        }
        else {
            const jawabanArray = Object.entries(answers).map(
                ([key, value]) => {
                    const q_no = Number(key);

                    return {
                        q_no,
                        jawaban: Number(value),
                    };
                }
            );
            setJawaban(jawabanArray);
        }
        setOpenDialog(true);
    };

    const handleOpenPageDialog = () => {
        setOpenPageDialog(true);
    };


    const handleCloseDialog = () => setOpenDialog(false);
    const handleClosePageDialog = () => setOpenPageDialog(false);

    if (!formData) {
        return (
            <Box sx={{ p: 4 }}>
                <Typography variant="body1" color="text.secondary">
                    Loading form data...
                </Typography>
                <LinearProgress sx={{ mt: 2, width: "50%" }} />
            </Box>
        );
    }

    if (pertanyaan.length === 0) {
        return (
            <Box sx={{ p: 4 }}>
                <Typography variant="body1" color="text.secondary">
                    Loading questions...
                </Typography>
                <LinearProgress sx={{ mt: 2, width: "50%" }} />
            </Box>
        );
    }

    const isLPMI = formData?.is_lpmi || formData?.is_admin;
    const status = formData?.status;
    const shouldDisabled =
        status === "Reviewed" ||
        formData?.closed ||
        (status != 'In Progress' && !isLPMI) ||
        (status != "Submitted" && status != "Validating" && formData?.is_lpmi) ||
        (status != "Validated" && status != "Reviewing" && formData?.is_admin);
    const isRecapPage = formData?.lembaga == 2 && currentPage === pertanyaan.length + 2;
    const isDosenPage = formData?.lembaga == 2 && currentPage === pertanyaan.length + 1;
    
    return (
        <Box sx={{ mx: "auto" }}>
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
                            Questions Completed
                        </Typography>
                    </Box>
                    <Box sx={{ width: '100%', mx: 1 }}>
                        <LinearProgress variant="determinate" value={answerProgress} />
                    </Box>
                    <Box>
                        <Typography
                            variant="body2"
                            sx={{ color: 'text.secondary' }}>
                            {Object.keys(answers).length}/{pertanyaan.length}
                        </Typography>
                    </Box>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Box>
                        <Typography
                            variant="body2"
                            sx={{ color: 'text.secondary', whiteSpace: 'nowrap' }}>
                            Points Earned
                        </Typography>
                    </Box>
                    <Box sx={{ width: '100%', mx: 1 }}>
                        <LinearProgress variant="determinate" value={bobotProgress} />
                    </Box>
                    <Box>
                        <Typography
                            variant="body2"
                            sx={{ color: 'text.secondary' }}>
                            {totalBobot}/{formData?.total_max_bobot}
                        </Typography>
                    </Box>
                </Box>
            </Box>

            {isRecapPage ? (
                <RecapPage
                    pertanyaan={pertanyaan}
                    answers={answers}
                    getAnswer={getAnswer}
                    role={formData?.is_lpmi
                        ? "LPMI"
                        : formData?.is_admin
                            ? "Asessor"
                            : "PRODI"
                    }
                    status={formData?.status}
                    recapData={recapData}
                    setRecapData={setRecapData}
                />
            ) : (
                <>
                    <Typography variant="h4" sx={{ mb: 3 }}>{isDosenPage ? 'Pemenuhan Syarat Kualitikasi Dosen untuk Syarat Perlu Terakreditasi Unggul' : formData?.lembaga == 1 ? q.no_kriteria : `Kriteria ${q.kode_kriteria}:`} {!isDosenPage && q.kriteria}</Typography>

                    <Grid container spacing={2} gap={2}>
                        <Grid size={1.5}>
                            <Paper sx={{ backgroundColor: "#E9F3F5", height: 165, p: 3, alignItems: 'center' }}>
                                <Typography variant="h5" fontWeight="bold">Question {currentPage}</Typography>
                                {formData?.lembaga == 1 && <Typography variant="body1" sx={{ fontStyle: 'italic' }}>Weight: {q.bobot}</Typography>}
                            </Paper>
                        </Grid>
                        {isDosenPage ?
                            <DosenPage
                                dosenAnswer={dosenAnswer}
                                setDosenAnswer={setDosenAnswer}
                                role={currentRole}
                                getDosen={getDosen}
                                status={formData?.status}
                                saveAnswer={saveAnswer}
                            />
                            :
                            <Grid size={8.5}>
                                <Paper sx={{
                                    px: 3,
                                    py: 3,
                                }}>
                                    <Typography variant="h5" fontWeight="bold" sx={{ mb: 3 }}>
                                        {formData?.lembaga == 1 ? q.elemen_penilaian_lam : q.deskripsi_pertanyaan}
                                        {q.mandatory ? '*' : ''}
                                    </Typography>
                                    
                                    <Grid container spacing={2} sx={{ mb: 3 }}>
                                        <Grid size={{ xs: 12, sm: 2 }}>
                                            <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                                                {formData?.lembaga == 1 ? 'Deskriptor' : 'Dimensi'}
                                            </Typography>
                                        </Grid>
                                        <Grid size={{ xs: 12, sm: 10 }}>
                                            <Typography variant="body1">
                                                {formData?.lembaga == 1 ? q.deskripsi_pertanyaan : q.kriteria}
                                            </Typography>
                                        </Grid>
                                    </Grid>
                                    {formData?.lembaga == 1 && (
                                        <Grid container spacing={2} sx={{ mb: 3 }}>
                                            <Grid size={{ xs: 12, sm: 2 }}>
                                                <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                                                    Input
                                                </Typography>
                                            </Grid>
                                            <Grid size={{ xs: 12, sm: 10 }}>
                                                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                                    <Link
                                                        component="button"
                                                        onClick={openFileManager}
                                                        underline="none"
                                                        sx={{
                                                            display: "flex",
                                                            alignItems: "center",
                                                            gap: 0.5,
                                                            cursor: (formData?.status != 'In Progress' || formData?.is_lpmi || formData?.is_admin || formData?.closed) ? "not-allowed" : "pointer"
                                                        }}
                                                        disabled={(formData?.status != 'In Progress' || formData?.is_lpmi || formData?.is_admin || formData?.closed)}
                                                    >
                                                        <UploadIcon />
                                                        Dokumen Pendukung<span className="text-red-500">*</span>
                                                        <input
                                                            type="file"
                                                            hidden
                                                            ref={fileInputRef}
                                                            onChange={handleFileChange}
                                                            disabled={(formData?.status != 'In Progress' || formData?.is_lpmi || formData?.is_admin || formData?.closed)}
                                                        />
                                                    </Link>

                                                    {files[q.q_no]?.length > 0 && (
                                                        <Box sx={{ display: "flex", gap: 0.5, flexWrap: "wrap" }}>
                                                            {files[q.q_no].map((file) => (
                                                                <Chip
                                                                    key={file.id_file}
                                                                    label={file.file_name}
                                                                    size="small"
                                                                    color="primary"
                                                                    onClick={() => downloadFile(file.id_file)}
                                                                    onDelete={formData?.status === 'Submitted' || !formData?.is_lpmi || !formData?.is_admin || formData?.closed
                                                                        ? undefined
                                                                        : () => deleteFile(file.id_file)}
                                                                    sx={{ maxWidth: "150px" }}
                                                                />
                                                            ))}
                                                        </Box>
                                                    )}
                                                </Box>
                                            </Grid>
                                        </Grid>
                                    )}

                                    <Divider sx={{ mb: 2, borderBottom: '3px solid #ccc' }} />
                                    
                                    {isLPMI && (
                                        <Grid container spacing={2} sx={{ mb: 3 }}>
                                            <Grid size={{ xs: 12, sm: 2 }}>
                                                <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                                                    Prodi
                                                </Typography>
                                            </Grid>
                                            <Grid size={{ xs: 12, sm: 10 }}>
                                                <Typography variant="body1">
                                                    : {getIndicatorScore(q, getAnswer[q.q_no]?.jawaban_prodi)?.score || '-'}
                                                </Typography>
                                            </Grid>
                                        </Grid>
                                    )}
                                    
                                    {(!formData?.is_lpmi && (["Validated", "Reviewed", "Reviewing"].includes(status || ""))) && (
                                        <Grid container spacing={2} sx={{ mb: 3 }}>
                                            <Grid size={{ xs: 12, sm: 2 }}>
                                                <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                                                    LPMI
                                                </Typography>
                                            </Grid>
                                            <Grid size={{ xs: 12, sm: 10 }}>
                                                <Typography variant="body1">
                                                    : {getIndicatorScore(q, getAnswer[q.q_no]?.jawaban_lpmi)?.score || '-'}
                                                </Typography>
                                            </Grid>
                                        </Grid>
                                    )}
                                    
                                    {(!formData?.is_admin && (["Reviewed"].includes(status || ""))) && (
                                        <Grid container spacing={2} sx={{ mb: 3 }}>
                                            <Grid size={{ xs: 12, sm: 2 }}>
                                                <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                                                    Assesor
                                                </Typography>
                                            </Grid>
                                            <Grid size={{ xs: 12, sm: 10 }}>
                                                <Typography variant="body1">
                                                    : {getIndicatorScore(q, getAnswer[q.q_no]?.jawaban_assesor)?.score || '-'}
                                                </Typography>
                                            </Grid>
                                        </Grid>
                                    )}

                                    <Grid container spacing={2} sx={{ mb: 3 }}>
                                        <Grid size={{ xs: 12, sm: 2 }}>
                                            <Typography variant="subtitle1" fontWeight="bold">
                                                Answer
                                            </Typography>
                                        </Grid>
                                        <Grid size={{ xs: 12, sm: 10 }}>
                                            <Box sx={{
                                                backgroundColor: '#f5f5f5',
                                                px: 3,
                                                py: 2,
                                            }}>
                                                <RadioGroup
                                                    name={`question-${q.q_no}`}
                                                    value={answers[q.q_no] ?? ""}
                                                    onChange={(e) => handleSelect(q.q_no, Number(e.target.value))}
                                                >
                                                    {q.indikator_jawaban.map((choice) => (
                                                        <Box key={choice.skor} sx={{ mb: 1 }}>
                                                            <FormControlLabel
                                                                value={choice.skor}
                                                                control={<Radio color="primary" disabled={shouldDisabled} />}
                                                                label={
                                                                    <Box>
                                                                        <Typography variant="body1" fontWeight="medium">
                                                                            {formData?.lembaga == 1 ? `Skor ${choice.skor}` : choice.deskripsi}
                                                                        </Typography>
                                                                        {formData?.lembaga == 1 &&
                                                                            <Typography
                                                                                variant="body2"
                                                                                color="text.secondary"
                                                                                sx={{ ml: 1 }}
                                                                            >
                                                                                {choice.deskripsi}
                                                                            </Typography>
                                                                        }
                                                                    </Box>
                                                                }
                                                            />
                                                            <Divider sx={{ mt: 1, mb: 1 }} />
                                                        </Box>
                                                    ))}
                                                </RadioGroup>
                                            </Box>
                                        </Grid>
                                    </Grid>
                                    
                                    {(!formData?.is_lpmi && getAnswer[q.q_no]?.note_lpmi) && (
                                        <Grid container spacing={2} sx={{ mb: 3 }}>
                                            <Grid size={{ xs: 12, sm: 2 }}>
                                                <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                                                    Explanation (LPMI)
                                                </Typography>
                                            </Grid>
                                            <Grid size={{ xs: 12, sm: 10 }}>
                                                <TextField
                                                    value={getAnswer[q.q_no].note_lpmi}
                                                    multiline
                                                    minRows={4}
                                                    fullWidth
                                                    placeholder="Tuliskan umpan balik di sini..."
                                                    disabled
                                                    sx={{
                                                        "& .MuiOutlinedInput-root": {
                                                            borderRadius: 2,
                                                            backgroundColor: "white",
                                                        },
                                                    }}
                                                />
                                            </Grid>
                                        </Grid>
                                    )}
                                    
                                    {(!isLPMI && getAnswer[q.q_no]?.note_assesor) && (
                                        <Grid container spacing={2} sx={{ mb: 3 }}>
                                            <Grid size={{ xs: 12, sm: 2 }}>
                                                <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                                                    Explanation (Assesor)
                                                </Typography>
                                            </Grid>
                                            <Grid size={{ xs: 12, sm: 10 }}>
                                                <TextField
                                                    value={getAnswer[q.q_no].note_assesor}
                                                    multiline
                                                    minRows={4}
                                                    fullWidth
                                                    placeholder="Tuliskan umpan balik di sini..."
                                                    disabled
                                                    sx={{
                                                        "& .MuiOutlinedInput-root": {
                                                            borderRadius: 2,
                                                            backgroundColor: "white",
                                                        },
                                                    }}
                                                />
                                            </Grid>
                                        </Grid>
                                    )}
                                    
                                    {(formData?.is_lpmi || formData?.is_admin) && (
                                        <Grid container spacing={2} sx={{ mb: 3 }}>
                                            <Grid size={{ xs: 12, sm: 2 }}>
                                                <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                                                    Explanation
                                                </Typography>
                                            </Grid>
                                            <Grid size={{ xs: 12, sm: 10 }}>
                                                <TextField
                                                    value={notes[q.q_no]}
                                                    onChange={(e) => handleNoteChange(q.q_no, e.target.value)}
                                                    multiline
                                                    minRows={4}
                                                    fullWidth
                                                    placeholder="Tuliskan umpan balik di sini..."
                                                    disabled={shouldDisabled}
                                                    sx={{
                                                        "& .MuiOutlinedInput-root": {
                                                            borderRadius: 2,
                                                            backgroundColor: "white",
                                                        },
                                                    }}
                                                />
                                            </Grid>
                                        </Grid>
                                    )}
                                </Paper>
                            </Grid>
                        }
                        {formData?.lembaga == 1 && (
                            <Grid size={2}>
                                <WeightSummaryTable
                                    data={weightSummary}
                                    totalQuestions={pertanyaan.length}
                                    totalPoints={totalBobot}
                                    maxPoints={formData?.total_max_bobot}
                                />
                            </Grid>
                        )}
                    </Grid>
                </>
            )}

            <Box
                sx={{
                    position: "relative",
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    mt: 4,
                }}
            >
                <Pagination
                    count={totalPage}
                    page={currentPage}
                    onChange={handlePageChange}
                    color="primary"
                    shape="rounded"
                    showFirstButton
                    showLastButton
                />

                <Box
                    sx={{
                        position: "absolute",
                        right: 0,
                        display: "flex",
                        gap: 2,
                    }}
                >
                    <Button variant="contained" onClick={handleOpenPageDialog}>
                        Choose page
                    </Button>

                    {!shouldDisabled && (
                        <Button variant="contained" onClick={handleOpenDialog}>
                            Save / Submit
                        </Button>
                    )}
                </Box>
            </Box>

            <SubmitDialog
                open={openDialog}
                onClose={handleCloseDialog}
                id_periode={formData.id_periode}
                id_regulasi={formData.id_regulasi}
                jawaban={jawaban}
                pertanyaan={pertanyaan}
                role={formData?.is_lpmi ? 'lpmi' : formData?.is_admin ? 'assesor' : 'prodi'}
                dosen={dosenAnswer}
                recapData={recapData}
            />

            <PagePaginationDialog
                open={openPageDialog}
                onClose={handleClosePageDialog}
                totalPage={totalPage}
                currentPage={currentPage}
                answers={answers}
                pertanyaan={pertanyaan}
                onSelectPage={(page) => {
                    setCurrentPage(page);
                    saveAnswer()
                    handleClosePageDialog();
                }}
            />
        </Box >
    );
}

export default FormPage;