'use client';

import { Button, Dialog, DialogActions, DialogContent, DialogTitle, Divider, IconButton, Typography, Box } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';

interface PagePaginationDialogProps {
    open: boolean;
    onClose: () => void;
    totalPage: number;
    currentPage: number;
    answers: { [key: number]: number };
    pertanyaan: any[];
    files: { [key: number]: any[] };
    lembaga?: number;
    onSelectPage: (page: number) => void;
}

function PagePaginationDialog(props: PagePaginationDialogProps) {
    const { open, onClose, totalPage, currentPage, answers, files, pertanyaan, onSelectPage, lembaga } = props;

    return (
        <>
            <Dialog
                open={open}
                onClose={onClose}
                maxWidth="sm"
                fullWidth
            >
                <DialogTitle>Page Navigation</DialogTitle>
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
                    <Box
                        sx={{
                            display: "grid",
                            gridTemplateColumns: "repeat(10, 1fr)",
                            gap: 1,
                            mt: 1,
                        }}
                    >
                        {Array.from({ length: totalPage }, (_, i) => {
                            const page = i + 1;
                            const isSelected = page === currentPage;
                            const qNo = pertanyaan[i]?.q_no;

                            const hasAnswer = qNo in answers;
                            const hasFile = (files[qNo]?.length || 0) > 0;

                            const isAnswered =
                                lembaga === 1
                                    ? hasAnswer && hasFile
                                    : hasAnswer;

                            const hasMissingFileError =
                                lembaga === 1 &&
                                hasAnswer &&
                                !hasFile;

                            return (
                                <Button
                                    key={page}
                                    onClick={() => onSelectPage(page)}
                                    color={isAnswered ? "success" : "primary"}
                                    disabled={isSelected}
                                    sx={{
                                        height: 50,
                                        minWidth: 0,
                                        p: 0,
                                        fontWeight: "bold",
                                        borderRadius: 2,
                                        position: "relative",
                                        display: "flex",
                                        alignItems: "flex-start",
                                        justifyContent: "center",
                                        pt: 1,
                                        border: "1px solid #ccc",
                                    }}
                                >
                                    {page}

                                    <Box
                                        sx={{
                                            position: "absolute",
                                            bottom: 0,
                                            left: 0,
                                            width: "100%",
                                            height: 10,
                                            backgroundColor: isAnswered
                                                ? "#4CAF50"
                                                : hasMissingFileError
                                                    ? "#f44336"
                                                    : "#d9d9d9",
                                            borderBottomLeftRadius: 6,
                                            borderBottomRightRadius: 6,
                                        }}
                                    />

                                    {/* {isAnswered && (
                                        <Box
                                            sx={{
                                                position: "absolute",
                                                top: 0,
                                                right: 0,
                                                width: 0,
                                                height: 0,
                                                borderTop: "12px solid #8B0000",
                                                borderLeft: "12px solid transparent",
                                            }}
                                        />
                                    )} */}
                                </Button>
                            );
                        })}
                    </Box>
                </DialogContent>
                {/* <Divider />
                <DialogActions>
                    <Button
                        onClick={onClose}
                        variant="outlined"
                    >
                        Cancel
                    </Button>
                    <Button
                        variant="contained"
                        color="primary"
                    >
                        View Question
                    </Button>
                </DialogActions> */}
            </Dialog >
        </>
    );
}

export default PagePaginationDialog;