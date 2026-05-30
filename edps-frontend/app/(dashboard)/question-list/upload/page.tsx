"use client"
import React, { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from 'react-hook-form';
import { useSearchParams } from "next/navigation";
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useGetLembagaQuery } from "@/api/lembaga";
import { downloadCSV } from "@/api/downloadApi";
import { usePostQuestionSetMutation, useGetQuestionSetIDMutation, useUpdateQuestionSetMutation } from "@/api/questionSet";
import { Lembaga } from "@/model/Lembaga";
import {
    Typography,
    Button,
    MenuItem,
    Paper,
    Grid,
    Snackbar,
    Alert,
    Link
} from "@mui/material";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import DropdownInputController from '@/app/component/controller/DropdownInputController';
import TextInputController from "@/app/component/controller/TextInputController";
import DateInputController from "@/app/component/controller/DateInputController";

interface UploadData {
    can_edit?: boolean
}

export const UploadCSVSchema = z.object({
    file: z
        .instanceof(File)
        .optional()
        .refine((file) => !file || file.name.endsWith(".csv"), "File must be a CSV"),
    gambar: z
        .instanceof(File)
        .optional()
        .refine(
            (file) =>
                !file ||
                ["image/jpeg", "image/png", "image/jpg", "image/webp"].includes(file.type),
            "Image must be JPG, PNG, or WEBP"
        )
        .refine(
            (file) => !file || file.size <= 2 * 1024 * 1024,
            "Image must be less than 2MB"
        ),

    existingFile: z.any().optional(),
    existingGambar: z.any().optional(),

    id_lembaga: z.string().min(1),
    question_set: z.string().min(1),
    tahun_mulai: z.string().min(1),
    tahun_akhir: z.string().min(1),
    label_link: z.string().optional(),
    link: z
        .string()
        .optional()
        .refine(
            (val) => !val || /^https?:\/\/.+/.test(val),
            "Invalid URL format"
        ),
    deskripsi_gambar: z.string().optional(),
})
    .superRefine((data, ctx) => {
        if (!data.file && !data.existingFile) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                path: ["file"],
                message: "File is required",
            });
        }
    });

export type UploadCSVRequest = z.infer<typeof UploadCSVSchema>;

function UploadQuestionPage() {
    const BASE_URL = process.env.NEXT_PUBLIC_API_URL;
    const searchParams = useSearchParams();
    const [uploadData, setUploadData] = useState<UploadData | null>(null);
    const id_qs = searchParams.get("id_qs");
    const [file, setFile] = useState<File>();
    const [gambar, setGambar] = useState<File>();
    const [lembaga, setLembaga] = useState<Lembaga[]>([]);
    const { data: lembagaData } = useGetLembagaQuery(undefined);
    const [getIdQuestionSet] = useGetQuestionSetIDMutation();
    const [postQuestionSet] = usePostQuestionSetMutation();
    const [updateQuestionSet] = useUpdateQuestionSetMutation();
    const router = useRouter();
    const [snackbar, setSnackbar] = useState({
        open: false,
        message: "",
        severity: "success" as "success" | "error",
    });
    const [existingFile, setExistingFile] = useState<{
        name: string;
        url: string;
    } | null>(null);
    const [existingGambar, setExistingGambar] = useState<string>('')

    console.log(existingFile)

    useEffect(() => {
        const storedData = sessionStorage.getItem('uploadData');
        if (storedData) {
            const parsedData = JSON.parse(storedData);
            setUploadData(parsedData);
        }
    }, [router]);

    useEffect(() => {
        if (lembagaData?.data) {
            setLembaga(lembagaData.data);
        }
    }, [lembagaData]);

    const defaultValues: UploadCSVRequest = {
        file: undefined,
        gambar: undefined,
        id_lembaga: '',
        question_set: '',
        tahun_mulai: '',
        tahun_akhir: '',
        link: '',
        label_link: '',
        deskripsi_gambar: ''
    }

    const { control, formState, handleSubmit, setValue, setError, trigger, watch, reset } = useForm<UploadCSVRequest>({
        mode: 'onSubmit',
        defaultValues,
        resolver: zodResolver(UploadCSVSchema)
    });

    useEffect(() => {
        if (id_qs) {
            getIdQuestionSet(id_qs)
                .unwrap()
                .then((res) => {
                    const qs = res.data;

                    const [tahun_mulai, tahun_akhir] =
                        (qs.tahun_berlaku || "").split("/");

                    reset({
                        file: undefined,
                        id_lembaga: String(qs.id_lembaga || ""),
                        question_set: String(qs.versi || ""),
                        tahun_mulai: tahun_mulai || "",
                        tahun_akhir: tahun_akhir || "",
                        label_link: qs.label_link || "",
                        link: qs.link || "",
                        deskripsi_gambar: qs.deskripsi_gambar || "",
                        existingFile: qs.csv_path ? true : undefined,
                        existingGambar: qs.gambar_path ? true : undefined
                    });

                    if (qs.csv_path) {
                        setExistingFile({
                            name: qs.csv_name || "Existing File",
                            url: `${BASE_URL}${qs.csv_path}`,
                        });
                    }
                    if (qs.gambar_path) {
                        let imagePath = qs.gambar_path;
                        if (imagePath.startsWith('/app/')) {
                            imagePath = imagePath.substring(4);
                        }
                        setExistingGambar(`${BASE_URL}${imagePath}`);
                    }
                })
                .catch((err) => {
                    console.error("Failed to fetch question set:", err);
                });
        }
    }, [id_qs, getIdQuestionSet, reset]);

    const handleFile = (selectedFile: File) => {
        setValue("file", selectedFile, { shouldValidate: true });
        setFile(selectedFile)
    };

    const handleGambar = (selectedFile: File) => {
        setValue("gambar", selectedFile, { shouldValidate: true });
        setGambar(selectedFile)
    };

    const handleDropGambar = (e: React.DragEvent) => {
        e.preventDefault();
        if (e.dataTransfer.files[0]) {
            handleGambar(e.dataTransfer.files[0]);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        if (e.dataTransfer.files[0]) {
            handleFile(e.dataTransfer.files[0]);
        }
    };

    const onSubmit = async (data: UploadCSVRequest) => {
        if (!data.file && !data.existingFile) return;

        const formData = new FormData();
        if (data.file) {
            formData.append("file", data.file);
        }

        if (data.gambar) {
            formData.append("gambar", data.gambar);
        }
        formData.append("id_lembaga", data.id_lembaga);
        formData.append("question_set", data.question_set);
        formData.append("tahun_mulai", data.tahun_mulai);
        formData.append("tahun_akhir", data.tahun_akhir);

        if (data.label_link) {
            formData.append("label_link", data.label_link);
        }

        if (data.link) {
            formData.append("link", data.link);
        }

        if (data.deskripsi_gambar) {
            formData.append("deskripsi_gambar", data.deskripsi_gambar);
        }

        try {
            if (id_qs) {
                await updateQuestionSet({ id_qs: id_qs, body: formData }).unwrap();
            }
            else {
                await postQuestionSet(formData).unwrap();
            }

            setSnackbar({
                open: true,
                message: "Upload successful!",
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
                    "An error occurred during upload",
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
                {id_qs ? 'Edit Accreditor’s Questions' : 'Upload Accreditor’s Questions'}
            </Typography>

            {/* Accreditor */}
            <Grid container mb={3}>
                <Grid size={2}>
                    <Typography variant="body1" sx={{ fontWeight: 'bold' }}>Accreditor*:</Typography>
                </Grid>
                <Grid size={5}>
                    <DropdownInputController
                        name="id_lembaga"
                        control={control}
                        disabled={!uploadData?.can_edit}
                        label=""
                        showClearButton={false}
                        sx={{
                            "& .MuiInputBase-root": {
                                height: 35,
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

            {/* Version */}
            <Grid container mb={3}>
                <Grid size={2}>
                    <Typography fontWeight="bold">Version*:</Typography>
                </Grid>
                <Grid size={5}>
                    <TextInputController
                        name="question_set"
                        control={control}
                        label=""
                        placeholder="e.g. 1.0"
                        type="number"
                        sx={{
                            width: '100%',
                            "& .MuiInputBase-root": {
                                height: 35,
                            },
                        }}
                        inputProps={{
                            min: 0,
                            step: "0.1",
                        }}
                    />
                </Grid>
            </Grid>

            {/* Valid Year */}
            <Grid container mb={3}>
                <Grid size={2}>
                    <Typography fontWeight="bold">Valid Year*:</Typography>
                </Grid>
                <Grid size={5}>
                    <Grid container alignItems="center">
                        <Grid size={5.5}>
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
                                                height: 35,
                                            },
                                        },
                                    },
                                }}
                            />
                        </Grid>
                        <Grid size={1}>
                            <Typography variant="h4" textAlign="center">/</Typography>
                        </Grid>
                        <Grid size={5.5}>
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
                                                height: 35,
                                            },
                                        },
                                    },
                                }}
                            />
                        </Grid>
                    </Grid>
                </Grid>
            </Grid>

            {/* Label Link */}
            <Grid container mb={3}>
                <Grid size={2}>
                    <Typography fontWeight="bold">Label Link:</Typography>
                </Grid>
                <Grid size={5}>
                    <TextInputController
                        name="label_link"
                        control={control}
                        label=''
                        placeholder="e.g. Google Drive"
                        sx={{
                            width: '100%',
                            "& .MuiInputBase-root": {
                                height: 35,
                            },
                        }}
                    />
                </Grid>
            </Grid>

            {/* Link URL */}
            <Grid container mb={3}>
                <Grid size={2}>
                    <Typography fontWeight="bold">Link URL:</Typography>
                </Grid>
                <Grid size={5}>
                    <TextInputController
                        name="link"
                        control={control}
                        label=''
                        placeholder="https://example.com"
                        sx={{
                            width: '100%',
                            "& .MuiInputBase-root": {
                                height: 35,
                            },
                        }}
                    />
                </Grid>
            </Grid>

            {/* Image */}
            <Grid container mb={3}>
                <Grid size={2}>
                    <Typography variant="body1" sx={{ fontWeight: 'bold' }}>Image:</Typography>
                </Grid>
                <Grid size={5}>
                    <Paper
                        variant="outlined"
                        sx={{
                            border: "2px dashed black",
                            p: 4,
                            textAlign: "center",
                            cursor: "pointer",
                        }}
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={handleDropGambar}
                    >
                        {(!gambar && !existingGambar) ? (
                            <>
                                <CloudUploadIcon sx={{ fontSize: 40, mb: 1 }} />
                                <Typography>Drag and Drop image here</Typography>
                                <Typography variant="body2">or</Typography>

                                <Button
                                    variant="contained"
                                    component="label"
                                    sx={{ mt: 2, backgroundColor: "#5B0000" }}
                                >
                                    Select Image
                                    <input
                                        hidden
                                        type="file"
                                        accept="image/*"
                                        onChange={(e) => {
                                            if (e.target.files?.[0]) {
                                                handleGambar(e.target.files[0]);
                                            }
                                        }}
                                    />
                                </Button>
                            </>
                        ) : (
                            <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                                <img
                                    src={gambar ? URL.createObjectURL(gambar) : existingGambar}
                                    alt="Preview"
                                    style={{
                                        maxWidth: "100%",
                                        maxHeight: 200,
                                        marginBottom: 10,
                                        borderRadius: 5,
                                    }}
                                />

                                <Button
                                    onClick={() => {
                                        setValue("gambar", undefined);
                                        setValue("existingGambar", undefined);
                                        setGambar(undefined);
                                        setExistingGambar('');
                                    }}
                                    color="error"
                                    size="small"
                                >
                                    Remove
                                </Button>
                            </div>
                        )}
                        {formState.errors.gambar && (
                            <Typography color="error" variant="body2">
                                {formState.errors.gambar.message}
                            </Typography>
                        )}
                    </Paper>
                </Grid>
            </Grid>

            {/* Image Description */}
            <Grid container mb={3}>
                <Grid size={2}>
                    <Typography fontWeight="bold">Image Description:</Typography>
                </Grid>
                <Grid size={5}>
                    <TextInputController
                        name="deskripsi_gambar"
                        control={control}
                        label=''
                        multiline
                        placeholder="Image Description"
                        sx={{ width: '100%' }}
                    />
                </Grid>
            </Grid>

            <Grid container mb={3}>
                <Grid size={2}>
                    <Typography variant="body1" sx={{ fontWeight: 'bold' }}>Question File*:</Typography>
                </Grid>
                <Grid size={5}>
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

                        {(!file && !existingFile) ? (
                            <>
                                <Typography>Drag and Drop here</Typography>
                                <Typography variant="body2">or</Typography>

                                <Button
                                    variant="contained"
                                    component="label"
                                    sx={{ mt: 2, backgroundColor: "#5B0000" }}
                                    disabled={!uploadData?.can_edit}
                                >
                                    Select file
                                    <input
                                        hidden
                                        type="file"
                                        accept=".csv"
                                        disabled={!uploadData?.can_edit}
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
                                <Typography
                                    sx={{
                                        color: "primary.main",
                                        cursor: "pointer",
                                        textDecoration: "underline",
                                    }}
                                    onClick={() => {
                                        // Newly uploaded file (not saved yet)
                                        if (file) {
                                            const url = URL.createObjectURL(file);

                                            const link = document.createElement("a");
                                            link.href = url;
                                            link.download = file.name;

                                            document.body.appendChild(link);
                                            link.click();

                                            link.remove();
                                            URL.revokeObjectURL(url);
                                        }

                                        // Existing file from edit mode
                                        else if (existingFile && id_qs) {
                                            downloadCSV(id_qs);
                                        }
                                    }}
                                >
                                    {file
                                        ? file.name
                                        : existingFile
                                            ? existingFile.name
                                            : ""}
                                </Typography>
                                {file &&
                                    <Typography variant="body2">
                                        {(file.size / 1024).toFixed(2)} KB
                                    </Typography>
                                }
                                {uploadData?.can_edit &&

                                    <Button
                                        onClick={() => {
                                            setValue("file", undefined, { shouldValidate: true });
                                            setValue("existingFile", undefined, { shouldValidate: true });

                                            setFile(undefined);
                                            setExistingFile(null);
                                        }}
                                        color="error"
                                        size="small"
                                        sx={{ mt: 1 }}
                                    >
                                        Remove
                                    </Button>
                                }
                            </>
                        )}
                        <Typography
                            variant="caption"
                            sx={{
                                display: "block",
                                mt: 2,
                                color: "text.secondary",
                                textAlign: "left",
                            }}
                        >
                            Supported format: CSV only.
                            <br />
                            Template can be accessed{" "}
                            <Link
                                href="https://docs.google.com/spreadsheets/d/191qnEhTKPaVNZyIXjvrTRDj9Gqtk5IkZVwRnRn7Vah8/edit?usp=sharing"
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                here
                            </Link>
                        </Typography>
                        {formState.errors.file && (
                            <Typography color="error" variant="body2">
                                {formState.errors.file.message}
                            </Typography>
                        )}
                    </Paper>
                </Grid>
            </Grid>

            <Button
                variant="contained"
                sx={{ mt: 4 }}
                onClick={handleSubmit(onSubmit)}
            >
                {id_qs ? 'Update' : '+ Create'}
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
                    variant="filled"
                >
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </>
    );
}

export default UploadQuestionPage