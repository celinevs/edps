'use client';

import {
    Dialog,
    DialogContent,
    DialogTitle,
    IconButton,
    Divider,
    DialogActions,
    Button,
    Typography
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';

interface DeleteDialogProps {
    open: boolean;
    onClose: () => void;
    handleDelete: (id: string) => void;
    id: string;
}

function DeleteDialog(props: DeleteDialogProps) {
    const { open, onClose, handleDelete, id } = props;

    const onDelete = () => {
        handleDelete(id);
        onClose();
    };

    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth="xs"
            fullWidth
        >
            <DialogTitle sx={{ fontWeight: 600 }}>
                Delete Accreditation
            </DialogTitle>

            <IconButton
                onClick={onClose}
                sx={{
                    position: 'absolute',
                    right: 8,
                    top: 8,
                }}
            >
                <CloseIcon />
            </IconButton>

            <Divider />

            <DialogContent>
                <Typography>
                    Are you sure you want to delete this accreditation?
                    This action cannot be undone.
                </Typography>
            </DialogContent>

            <DialogActions sx={{ p: 2 }}>
                <Button onClick={onClose} color="inherit">
                    Cancel
                </Button>

                <Button
                    variant="contained"
                    color="error"
                    onClick={onDelete}
                >
                    Delete
                </Button>
            </DialogActions>
        </Dialog>
    );
}

export default DeleteDialog;