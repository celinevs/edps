"use client"
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useGetLembagaQuery } from "@/api/lembaga";
import { usePostQuestionSetMutation } from "@/api/questionSet";
import { Lembaga } from "@/model/Lembaga";
import {
    Typography,
    Button,
    MenuItem,
    Paper,
    Grid,
    Snackbar,
    Alert
} from "@mui/material";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import DropdownInputController from '@/app/component/controller/DropdownInputController';
import TextInputController from "@/app/component/controller/TextInputController";
import DateInputController from "@/app/component/controller/DateInputController";

export const UploadCSVSchema = z.object({
    file: z
        .instanceof(File)
        .optional()
        .refine((file) => file !== undefined, "File wajib diupload")
        .refine((file) => file !== undefined && file.name.endsWith(".csv"), "File harus CSV"),

    id_lembaga: z.string().min(1),
    question_set: z.string().min(1),
    tahun_mulai: z.string().min(1),
    tahun_akhir: z.string().min(1),
});

export type UploadCSVRequest = z.infer<typeof UploadCSVSchema>;

function UploadQuestionPage() {
    const [file, setFile] = useState<File>();
    const [lembaga, setLembaga] = useState<Lembaga[]>([]);
    const { data: lembagaData } = useGetLembagaQuery(undefined);
    const [postQuestionSet] = usePostQuestionSetMutation();
    const router = useRouter();
    const [snackbar, setSnackbar] = useState({
        open: false,
        message: "",
        severity: "success" as "success" | "error",
    });

    useEffect(() => {
        if (lembagaData?.data) {
            setLembaga(lembagaData.data);
        }
    }, [lembagaData]);

    const defaultValues: UploadCSVRequest = {
        file: undefined,
        id_lembaga: '',
        question_set: '',
        tahun_mulai: '',
        tahun_akhir: ''
    }

    const { control, formState, handleSubmit, setValue, setError, trigger, watch, reset } = useForm<UploadCSVRequest>({
        mode: 'onSubmit',
        defaultValues,
        resolver: zodResolver(UploadCSVSchema)
    });

    const handleFile = (selectedFile: File) => {
        setValue("file", selectedFile, { shouldValidate: true });
        setFile(selectedFile)
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        if (e.dataTransfer.files[0]) {
            handleFile(e.dataTransfer.files[0]);
        }
    };

    const onSubmit = async (data: UploadCSVRequest) => {
        if (!data.file) return;

        const formData = new FormData();
        formData.append("file", data.file);
        formData.append("id_lembaga", data.id_lembaga);
        formData.append("question_set", data.question_set);
        formData.append("tahun_mulai", data.tahun_mulai);
        formData.append("tahun_akhir", data.tahun_akhir);

        try {
            await postQuestionSet(formData).unwrap();

            setSnackbar({
                open: true,
                message: "Upload berhasil!",
                severity: "success",
            });
            setTimeout(() => {
                router.push("/question-list");
            }, 1000);

        } catch (err: any) {
            console.error(err);

            setSnackbar({
                open: true,
                message:
                    err?.data?.message ||
                    err?.error ||
                    "Terjadi kesalahan saat upload",
                severity: "error",
            });
        }
    };
    return (
        <>
            <Typography
                variant="h4"
                gutterBottom
                sx={{
                    fontWeight: 500,
                    mb: 3,
                    color: 'primary.main',
                }}
            >
                Upload Accreditor’s Questions
            </Typography>
            <Grid container spacing={8} mb={3}>
                <Grid size="auto">
                    <Typography variant="body1" sx={{ fontWeight: 'bold' }}>Accreditor*:</Typography>
                </Grid>
                <Grid size={6}>
                    <DropdownInputController
                        name="id_lembaga"
                        control={control}
                        label=""
                        sx={{
                            "& .MuiInputBase-root": {
                                height: 36,
                            },
                        }}
                    >
                        {lembaga.map((category) => (
                            <MenuItem
                                key={String(category.id_lembaga)}
                                value={String(category.id_lembaga)}
                            >
                                {category.nama_lembaga}
                            </MenuItem>
                        ))}
                    </DropdownInputController>
                </Grid>
            </Grid>
            <Grid container spacing={5.5} mb={3}>
                <Grid size="auto">
                    <Typography fontWeight="bold">Question Set*:</Typography>
                </Grid>

                <Grid size={5.9}>
                    <TextInputController
                        name="question_set"
                        control={control}
                        label=""
                        placeholder="e.g. 1.0"
                        type="number"
                        sx={{
                            "& .MuiInputBase-root": {
                                height: 36,
                            },
                        }}
                        inputProps={{
                            min: 0,
                            step: "0.1",
                        }}
                    />
                </Grid>
            </Grid>
            <Grid container spacing={4.8} mb={3}>
                <Grid size="auto">
                    <Typography fontWeight="bold">Tahun Berlaku*:</Typography>
                </Grid>
                <Grid container spacing={2}>
                    <Grid size={5}>
                        <DateInputController
                            name="tahun_mulai"
                            control={control}
                            label=""
                            displayFormat="YYYY"
                            dataFormat="YYYY"
                            views={['year']}
                            slotProps={{
                                textField: {
                                    size: "small",
                                    sx: {
                                        "& .MuiInputBase-root": {
                                            height: 36,
                                        },
                                    },
                                },
                            }}
                        />
                    </Grid>
                    <Typography variant="h4">/</Typography>
                    <Grid size={5}>
                        <DateInputController
                            name="tahun_akhir"
                            control={control}
                            label=""
                            displayFormat="YYYY"
                            dataFormat="YYYY"
                            views={['year']}
                            slotProps={{
                                textField: {
                                    size: "small",
                                    sx: {
                                        "& .MuiInputBase-root": {
                                            height: 36,
                                        },
                                    },
                                },
                            }}
                        />
                    </Grid>
                </Grid>
            </Grid>
            <Grid container spacing={5}>
                <Grid size="auto">
                    <Typography variant="body1" sx={{ fontWeight: 'bold' }}>Question File*:</Typography>
                </Grid>
                <Grid size={6}>
                    <Paper
                        variant="outlined"
                        sx={{
                            border: "2px dashed black",
                            p: 4,
                            textAlign: "center",
                            cursor: "pointer",
                        }}
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={handleDrop}
                    >
                        <CloudUploadIcon sx={{ fontSize: 40, mb: 1 }} />

                        {!file ? (
                            <>
                                <Typography>Drag and Drop here</Typography>
                                <Typography variant="body2">or</Typography>

                                <Button
                                    variant="contained"
                                    component="label"
                                    sx={{ mt: 2, backgroundColor: "#8B0000" }}
                                >
                                    Select file
                                    <input
                                        hidden
                                        type="file"
                                        accept=".csv"
                                        onChange={(e) => {
                                            if (e.target.files?.[0]) {
                                                handleFile(e.target.files[0]);
                                            }
                                        }}
                                    />
                                </Button>
                            </>
                        ) : (
                            <>
                                <Typography fontWeight="bold">{file.name}</Typography>
                                <Typography variant="body2">
                                    {(file.size / 1024).toFixed(2)} KB
                                </Typography>

                                <Button
                                    onClick={() => setValue("file", undefined)}
                                    color="error"
                                    size="small"
                                    sx={{ mt: 1 }}
                                >
                                    Remove
                                </Button>
                            </>
                        )}
                    </Paper>
                </Grid>
            </Grid>

            <Button
                variant="contained"
                sx={{ mt: 4 }}
                onClick={handleSubmit(onSubmit)}
            >
                + Create
            </Button>
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

export default UploadQuestionPage