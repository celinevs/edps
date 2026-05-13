'use client';

import {
    Box,
    Typography,
    Paper,
    Grid,
    TextField,
    InputAdornment,
    Button,
    Tabs,
    Tab,
    Snackbar,
    Alert
} from "@mui/material";
import { styled } from "@mui/material/styles";
import PersonIcon from '@mui/icons-material/Person';
import { EmbaDosen } from "@/model/Jawaban";
import { useState, useEffect } from "react";

const StyledTabs = styled(Tabs)({
    minHeight: 0,
    '& .MuiTabs-indicator': {
        display: 'none',
    },
});

const StyledTab = styled(Tab)({
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
});

const canEdit = (
    role: 'PRODI' | 'LPMI' | 'ASSESOR' | undefined,
    status: string | undefined
) => {
    if (!role || !status) return false;

    switch (role) {
        case 'PRODI':
            return status === 'In Progress';

        case 'LPMI':
            return status === 'Submitted' || status === 'Validating';

        case 'ASSESOR':
            return status === 'Validated' || status === 'Reviewing';

        default:
            return false;
    }
};

type DosenPageProps = {
    dosenAnswer?: EmbaDosen;
    setDosenAnswer?: React.Dispatch<React.SetStateAction<EmbaDosen | undefined>>;
    getDosen?: EmbaDosen[];
    role?: 'PRODI' | 'LPMI' | 'ASSESOR';
    status?: string;
    saveAnswer?: (saveDosen: boolean) => Promise<void>;
};

function DosenPage({
    dosenAnswer,
    setDosenAnswer,
    getDosen,
    role,
    status,
    saveAnswer
}: DosenPageProps) {

    const [tab, setTab] = useState<'PRODI' | 'LPMI' | 'ASSESOR'>("PRODI");
    const isEditable = tab === role && canEdit(role, status);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [snackbar, setSnackbar] = useState({
        open: false,
        message: "",
        severity: "success" as "success" | "error"
    });

    useEffect(() => {
        if (role) {
            setTab(role);
        }
    }, [role]);

    const getValue = (field: keyof EmbaDosen) => {
        if (tab === role) {
            return (dosenAnswer as any)?.[field] ?? 0;
        }
        const getDosenByRole = (roleName: 'PRODI' | 'LPMI' | 'ASSESOR') => {
            return getDosen?.find(d => d.user_role === roleName);
        };
        const data = getDosenByRole(tab);

        return (data as any)?.[field] ?? 0;
    };

    const validateField = (field: keyof EmbaDosen, value: number, total: number): string => {
        if (field !== 'dosen_total' && total > 0 && value > total) {
            return `Cannot exceed Total Dosen (${total})`;
        }
        if (value < 0) {
            return "Value cannot be negative";
        }
        return "";
    };

    const handleChange = (field: keyof EmbaDosen, value: number) => {
        if (!setDosenAnswer || tab !== role) return;

        const total = getValue("dosen_total");

        // Don't allow negative values
        if (value < 0) return;

        // Validate the field
        const error = validateField(field, value, total);

        if (error) {
            setErrors(prev => ({ ...prev, [field]: error }));
            return;
        }

        // Clear error for this field
        setErrors(prev => {
            const newErrors = { ...prev };
            delete newErrors[field];
            return newErrors;
        });

        setDosenAnswer(prev => ({
            ...(prev || {}),
            [field]: value
        }));
    };

    const handleTotalChange = (value: number) => {
        if (!setDosenAnswer || tab !== role) return;

        if (value < 0) return;

        setDosenAnswer(prev => ({
            ...(prev || {}),
            dosen_total: value
        }));

        const fieldsToCheck = [
            'dosen_tetap', 'dosen_doktor', 'dosen_magister',
            'dosen_guru_besar', 'dosen_lektor_kepala', 'dosen_lektor',
            'dosen_publikasi', 'dosen_sertifikat'
        ];

        const newErrors: Record<string, string> = {};
        fieldsToCheck.forEach(field => {
            const fieldValue = getValue(field as keyof EmbaDosen);
            if (value > 0 && fieldValue > value) {
                newErrors[field] = `Cannot exceed Total Dosen (${value})`;
            }
        });

        setErrors(newErrors);
    };

    const renderNumberField = (
        label: string,
        field: keyof EmbaDosen,
        isTotal: boolean = false
    ) => {
        const total = getValue("dosen_total");
        const current = getValue(field);
        const error = errors[field];

        return (
            <>
                <Grid size={5}>
                    <Typography>{label}</Typography>
                </Grid>

                <Grid size={7} display="flex" gap={2}>
                    <TextField
                        type="number"
                        size="small"
                        value={current || ''}
                        onChange={(e) => {
                            const newValue = Number(e.target.value);
                            if (isTotal) {
                                handleTotalChange(newValue);
                            } else {
                                handleChange(field, newValue);
                            }
                        }}
                        inputProps={{
                            min: 0,
                            max: isTotal ? undefined : (total > 0 ? total : undefined)
                        }}
                        disabled={!isEditable}
                        sx={{ width: 240 }}
                        error={!!error}
                        helperText={error || ""}
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <PersonIcon fontSize="small" />
                                </InputAdornment>
                            ),
                        }}
                    />

                    {!isTotal && (
                        <TextField
                            type="number"
                            size="small"
                            value={total > 0 ? Math.round((current / total) * 100) : 0}
                            disabled
                            sx={{ width: 240 }}
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        %
                                    </InputAdornment>
                                ),
                            }}
                        />
                    )}
                </Grid>
            </>
        );
    };

    const isFormValid = () => {
        const total = getValue("dosen_total");
        const fieldsToCheck = [
            'dosen_tetap', 'dosen_doktor', 'dosen_magister',
            'dosen_guru_besar', 'dosen_lektor_kepala', 'dosen_lektor',
            'dosen_publikasi', 'dosen_sertifikat'
        ];

        for (const field of fieldsToCheck) {
            const value = getValue(field as keyof EmbaDosen);
            if (total > 0 && value > total) {
                return false;
            }
        }

        return Object.keys(errors).length === 0;
    };

    return (
        <>
            <Box sx={{ width: 1100, mx: "auto" }}>

                {(status !== 'In Progress') &&
                    <StyledTabs value={tab} onChange={(_, v) => setTab(v)}>
                        <StyledTab label="PRODI" value="PRODI" />
                        {(role === 'LPMI' || ["Validated", "Reviewed", "Reviewing"].includes(status || "")) &&
                            <StyledTab label="LPMI" value="LPMI" />
                        }
                        {(role === 'ASSESOR' || status === 'Reviewed') &&
                            <StyledTab label="Assesor" value="ASSESOR" />
                        }
                    </StyledTabs>
                }

                <Paper sx={{ p: 5 }}>
                    <Typography variant="h5" mb={3}>
                        Pemenuhan Syarat Kualifikasi Dosen untuk Akreditasi Unggul
                    </Typography>
                    <Paper sx={{ p: 5, mb: 3 }}>
                        <Grid container spacing={2}>

                            {renderNumberField("Total Dosen", "dosen_total", true)}
                            {renderNumberField("Jumlah Dosen Tetap", "dosen_tetap")}
                            {renderNumberField("Jumlah Doktor", "dosen_doktor")}
                            {renderNumberField("Jumlah Magister", "dosen_magister")}
                            {renderNumberField("Jumlah Guru Besar", "dosen_guru_besar")}
                            {renderNumberField("Jumlah Lektor Kepala", "dosen_lektor_kepala")}
                            {renderNumberField("Jumlah Lektor", "dosen_lektor")}
                            {renderNumberField("Jumlah Publikasi", "dosen_publikasi")}
                            {renderNumberField("Jumlah Sertifikat", "dosen_sertifikat")}

                        </Grid>
                    </Paper>

                    {isEditable && (
                        <Box display="flex" justifyContent="flex-end">
                            <Button
                                variant="outlined"
                                sx={{ width: 150 }}
                                disabled={!isFormValid()}
                                onClick={async () => {
                                    const total = getValue("dosen_total");
                                    const fieldsToCheck = [
                                        'dosen_tetap', 'dosen_doktor', 'dosen_magister', 
                                        'dosen_guru_besar', 'dosen_lektor_kepala', 'dosen_lektor',
                                        'dosen_publikasi', 'dosen_sertifikat'
                                    ];
                                    
                                    let hasError = false;
                                    for (const field of fieldsToCheck) {
                                        const value = getValue(field as keyof EmbaDosen);
                                        if (value > total) {
                                            hasError = true;
                                            break;
                                        }
                                    }
                                    
                                    if (hasError) {
                                        setSnackbar({
                                            open: true,
                                            message: "Please fix validation errors before saving",
                                            severity: "error"
                                        });
                                        return;
                                    }
                                    
                                    try {
                                        await saveAnswer?.(true);

                                        setSnackbar({
                                            open: true,
                                            message: "Data saved successfully",
                                            severity: "success"
                                        });
                                    } catch (err) {
                                        setSnackbar({
                                            open: true,
                                            message: "Failed to save the data",
                                            severity: "error"
                                        });
                                    }
                                }}>
                                Save
                            </Button>
                        </Box>
                    )}
                </Paper>
            </Box>
            <Snackbar
                open={snackbar.open}
                autoHideDuration={3000}
                onClose={() => setSnackbar({ ...snackbar, open: false })}
                anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
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

export default DosenPage;