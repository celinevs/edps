'use client';

import { Button, Dialog, DialogActions, DialogContent, DialogTitle, Divider, IconButton } from '@mui/material';
import { useRouter } from "next/navigation";
import CloseIcon from '@mui/icons-material/Close';
import { submitReview } from '@/api/api_test';
import { ReviewRequestItem } from '@/model/Jawaban';
import { Pertanyaan } from '@/model/Pertanyaan';

interface SubmitReviewDialogProps {
    open: boolean;
    onClose: () => void;
    id_periode: string;
    jawaban: ReviewRequestItem[];
    pertanyaan: Pertanyaan[];

}

function SubmitReviewDialog(props: SubmitReviewDialogProps) {
    const { open, onClose, id_periode, jawaban, pertanyaan } = props;
    const router = useRouter();

    const handleSave = async () => {
        if (id_periode) {
            try {

                const payload = {
                    id_periode: id_periode,
                    jawaban: jawaban,
                };

                await submitReview(payload);
                router.push("/")
            } catch (error) {
                console.error("Error submitting quiz:", error);
                alert("There was an error submitting your review. Please try again.");
            }
        }
    };

    const handleSubmit = async () => {
        if (!id_periode) return;

        const answeredIds = new Set(jawaban.map(j => j.id_pertanyaan));
        const unanswered = pertanyaan.filter(q => !answeredIds.has(q.id_pertanyaan));

        if (unanswered.length > 0) {
            const missingNumbers = unanswered.map((q, i) => `${i + 1}. ${q.deskripsi_pertanyaan}`).join("\n");
            alert(`❗ Masih ada pertanyaan yang belum direview:\n\n${missingNumbers}`);
            return;
        }

        try {
            const payload = {
                id_periode: id_periode,
                jawaban: jawaban,
                is_submit: true
            };
            await submitReview(payload);
            router.push("/");
        } catch (error) {
            console.error("Error submitting quiz:", error);
            alert("There was an error submitting your answer. Please try again.");
        }
    }
    return (
        <Dialog
            open={open}
            onClose={onClose}
        >
            <DialogTitle>Submit Review Confirmation</DialogTitle>
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
                    Submit Review
                </Button>
            </DialogActions>
        </Dialog >
    );
}

export default SubmitReviewDialog;