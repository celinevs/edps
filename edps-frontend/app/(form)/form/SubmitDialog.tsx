'use client';

import { Button, Dialog, DialogActions, DialogContent, DialogTitle, Divider, IconButton, Snackbar, Alert } from '@mui/material';
import { useRouter } from "next/navigation";
import { useState } from 'react';
import CloseIcon from '@mui/icons-material/Close';
import { useSubmitJawabanMutation, useSubmitValidationMutation, useSubmitReviewMutation } from '@/api/jawaban';
import { JawabanRequestItem, ValidationRequestItem} from '@/model/Jawaban';
import { Pertanyaan } from '@/model/Pertanyaan';

interface SubmitDialogProps {
    open: boolean;
    onClose: () => void;
    id_periode: string;
    id_regulasi: string;
    jawaban: JawabanRequestItem[] | ValidationRequestItem[];
    pertanyaan: Pertanyaan[];
    role?: 'prodi' | 'lpmi' | 'assesor'

}

function SubmitDialog(props: SubmitDialogProps) {
    const { open, onClose, id_periode, jawaban, pertanyaan, role, id_regulasi } = props;
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
                    message: 'Evaluasi berhasil disimpan!',
                    severity: 'success'
                });
                router.push("/dashboard")
            } catch (error) {
                console.error("Error submitting quiz:", error);
                setSnackbar({
                    open: true,
                    message: 'Gagal menyimpan evaluasi',
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
                alert(`❗ Masih ada pertanyaan yang belum dijawab:\n\n${missingNumbers}`);
                return;
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
                    message: 'Evaluasi berhasil disubmit!',
                    severity: 'success'
                });
                router.push("/dashboard");
            } catch (error) {
                console.error("Error submitting quiz:", error);
                setSnackbar({
                    open: true,
                    message: 'Gagal submit evaluasi',
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
                <DialogTitle>Submit Pengisian Evaluasi Diri</DialogTitle>
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
                    sx={{ width: '100%' }}
                >
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </>
    );
}

export default SubmitDialog;