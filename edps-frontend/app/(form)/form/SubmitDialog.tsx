'use client';

import { Button, Dialog, DialogActions, DialogContent, DialogTitle, Divider, IconButton, Snackbar, Alert } from '@mui/material';
import { useRouter } from "next/navigation";
import { useState } from 'react';
import CloseIcon from '@mui/icons-material/Close';
import { useSubmitJawabanMutation, useSubmitValidationMutation, useSubmitReviewMutation } from '@/api/jawaban';
import { EmbaDosen, EmbaNotes, JawabanRequestItem, ValidationRequestItem } from '@/model/Jawaban';
import { Pertanyaan } from '@/model/Pertanyaan';

interface SubmitDialogProps {
    open: boolean;
    onClose: () => void;
    id_periode: string;
    id_regulasi: string;
    jawaban: JawabanRequestItem[] | ValidationRequestItem[];
    pertanyaan: Pertanyaan[];
    dosen?: EmbaDosen;
    role?: 'prodi' | 'lpmi' | 'assesor'
    recapData?: EmbaNotes;
    files?: { [key: number]: any[] };
    lembaga?: number;
}

function SubmitDialog(props: SubmitDialogProps) {
    const { open, onClose, id_periode, jawaban, pertanyaan, role, id_regulasi, dosen, recapData, files, lembaga } = props;
    const [submitJawaban] = useSubmitJawabanMutation();
    const [submitValidation] = useSubmitValidationMutation();
    const [submitReview] = useSubmitReviewMutation();
    const router = useRouter();
    const [snackbar, setSnackbar] = useState({
        open: false,
        message: '',
        severity: 'success' as 'success' | 'error'
    });

    const handleSave = async () => {
        if (id_periode && id_regulasi && jawaban && role) {
            try {

                const payload = {
                    id_akreditasi: id_periode,
                    id_qs: id_regulasi,
                    jawaban: jawaban,
                    dosen: dosen,
                    evaluasi_integrasi: recapData?.evaluasi_integrasi || '',
                    rekomendasi_ak: recapData?.rekomendasi_ak || '',
                    catatan_assesor: recapData?.catatan_assesor || '',
                };
                if (role == 'prodi') {
                    await submitJawaban(payload).unwrap();
                }
                else if (role == 'lpmi') {
                    await submitValidation(payload).unwrap();
                }
                else {
                    await submitReview(payload).unwrap();
                }
                setSnackbar({
                    open: true,
                    message: 'Evaluation saved successfully!',
                    severity: 'success'
                });
                router.back();
            } catch (error) {
                console.error("Error submitting quiz:", error);
                setSnackbar({
                    open: true,
                    message: 'Failed to save evaluation',
                    severity: 'error'
                });
            }
        }
    };

    const handleSubmit = async () => {
        if (id_periode && id_regulasi && jawaban) {

            const answeredIds = new Set(jawaban.map(j => j.q_no));
            const unanswered = pertanyaan.filter(q => !answeredIds.has(q.q_no));

            if (unanswered.length > 0) {
                const missingNumbers = unanswered.map((q, i) => `${i + 1} `).join("\n");
                alert(`❗ There are still unanswered questions:\n\n${missingNumbers}`);
                return;
            }

            if (lembaga === 1) {
                const missingFiles = jawaban.filter((j) => {
                    const uploadedFiles = files?.[j.q_no] || [];
                    return uploadedFiles.length === 0;
                });

                if (missingFiles.length > 0) {
                    const missingNumbers = missingFiles
                        .map((j) => {
                            const questionIndex = pertanyaan.findIndex(
                                (q) => q.q_no === j.q_no
                            );

                            return questionIndex + 1;
                        })
                        .join(", ");

                    alert(
                        `❗ Supporting documents are required for the following questions:\n\n${missingNumbers}`
                    );

                    return;
                }
            }

            try {
                const payload = {
                    id_akreditasi: id_periode || '',
                    id_qs: id_regulasi || '',
                    jawaban: jawaban,
                    is_submit: true
                };
                if (role == 'prodi') {
                    await submitJawaban(payload).unwrap();
                }
                else if (role == 'lpmi') {
                    await submitValidation(payload).unwrap();
                }
                else {
                    await submitReview(payload).unwrap();
                }
                setSnackbar({
                    open: true,
                    message: 'Evaluation submitted successfully!',
                    severity: 'success'
                });
                router.back();
            } catch (error) {
                console.error("Error submitting quiz:", error);
                setSnackbar({
                    open: true,
                    message: 'Failed to submit evaluation',
                    severity: 'error'
                });
            }
        }
    }
    return (
        <>
            <Dialog
                open={open}
                onClose={onClose}
            >
                <DialogTitle>Submit Self Evaluation</DialogTitle>
                <IconButton
                    aria-label="close"
                    onClick={onClose}
                    sx={(theme) => ({
                        position: 'absolute',
                        right: 8,
                        top: 8,
                        color: theme.palette.grey[500]
                    })}
                >
                    <CloseIcon />
                </IconButton>
                <Divider />
                <DialogContent>
                    Are you sure you want to submit this review? Once submitted, you will no longer be able to edit
                </DialogContent>
                <Divider />
                <DialogActions>
                    <Button
                        onClick={handleSave}
                        variant="outlined"
                    >
                        Save Only
                    </Button>
                    <Button
                        variant="contained"
                        color="primary"
                        onClick={handleSubmit}
                    >
                        Submit
                    </Button>
                </DialogActions>
            </Dialog >
            <Snackbar
                open={snackbar.open}
                autoHideDuration={3000}
                onClose={() => setSnackbar({ ...snackbar, open: false })}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            >
                <Alert
                    onClose={() => setSnackbar({ ...snackbar, open: false })}
                    severity={snackbar.severity}
                    variant="filled"
                    sx={{ width: '100%' }}
                >
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </>
    );
}

export default SubmitDialog;