'use client';

import { Button, Dialog, DialogActions, DialogContent, DialogTitle, Divider, IconButton, Typography, Grid, MenuItem, Snackbar, Alert } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { QuestionSetItem } from '@/model/QuestionSet';
import { GetProdi } from '@/model/Prodi';
import { Akreditasi } from '@/model/Akreditasi';
import { useLazyGetQuestionSetByProdiQuery } from '@/api/questionSet';
import { useGetProdiQuery } from '@/api/prodi';
import { usePostAkreditasiMutation, usePutAkreditasiMutation } from '@/api/akreditasi';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import dayjs from 'dayjs';
import { useState, useEffect } from 'react';
import TextInputController from '@/app/component/controller/TextInputController';
import DateInputController from '@/app/component/controller/DateInputController';
import DropdownInputController from '@/app/component/controller/DropdownInputController';

interface AkreditasiDialogProps {
    open: boolean;
    onClose: () => void;
    accData?: Akreditasi;
}

const formatDate = (date: string) => {
    if (!date) return '';
    return new Date(date).toISOString().split('T')[0];
};

export const AkreditasiRequestSchema = z.object({
    tanggal_mulai: z.string().min(1),
    tanggal_selesai_prodi: z.string().min(1),
    tanggal_selesai_lpmi: z.string().min(1),
    tahun_mulai: z.string().min(1),
    tahun_selesai: z.string().min(1),
    id_qs: z.string().min(1),
    id_prodi: z.string().min(1),
    nama_akreditasi: z.string().min(1)
});

type AkreditasiRequest = z.infer<typeof AkreditasiRequestSchema>

function AkreditasiDialog(props: AkreditasiDialogProps) {
    const { data } = useGetProdiQuery();
    const [getQuestionSet] = useLazyGetQuestionSetByProdiQuery();
    const { open, onClose, accData } = props;
    const [PostAkreditasi] = usePostAkreditasiMutation();
    const [UpdateAkreditasi] = usePutAkreditasiMutation();
    const [versiRegulasi, setVersiRegulasi] = useState<QuestionSetItem[]>([])
    const [prodi, setProdi] = useState<GetProdi[]>([]);
    const [snackbar, setSnackbar] = useState({
        open: false,
        message: '',
        severity: 'success' as 'success' | 'error'
    });

    useEffect(() => {
        if (data?.data) {
            setProdi(data.data)
        }
    }, [data])

    const defaultValues: AkreditasiRequest = {
        tanggal_mulai: '',
        tanggal_selesai_prodi: '',
        tanggal_selesai_lpmi: '',
        tahun_mulai: '',
        tahun_selesai: '',
        id_qs: '',
        id_prodi: '',
        nama_akreditasi: ''
    }

    const { control, formState, handleSubmit, setValue, setError, trigger, watch, reset } = useForm<AkreditasiRequest>({
        mode: 'onSubmit',
        defaultValues,
        resolver: zodResolver(AkreditasiRequestSchema)
    });

    useEffect(() => {
        if (accData) {
            const [tahun_mulai, tahun_selesai] = accData.tahun_berlaku
                ? accData.tahun_berlaku.split('/')
                : ['', ''];

            reset({
                tanggal_mulai: formatDate(accData.tanggal_mulai),
                tanggal_selesai_prodi: formatDate(accData.tanggal_selesai),
                tanggal_selesai_lpmi: formatDate(accData.tanggal_selesai_lpmi),
                tahun_mulai: tahun_mulai || '',
                tahun_selesai: tahun_selesai || '',
                id_qs: accData.question_set.id_qs || '',
                id_prodi: accData.prodi.id_prodi || '',
                nama_akreditasi: accData.nama_akreditasi ?? ''
            });
        } else {
            reset(defaultValues);
        }
    }, [accData, reset]);

    const selectedProdi = watch('id_prodi');
    const tanggalMulai = watch('tanggal_mulai');
    const tanggalSelesaiProdi = watch('tanggal_selesai_prodi');

    const getMinDate = (date: string) => {
        if (!date) return undefined;
        const d = new Date(date);
        d.setDate(d.getDate() + 1);
        return dayjs(d);
    };

    useEffect(() => {
        if (selectedProdi) {
            const fetchRegulasiByProdi = async () => {
                try {
                    const resReg = await getQuestionSet(selectedProdi);
                    setVersiRegulasi(resReg.data?.data ?? []);
                } catch (err) {
                    console.error("Failed to load regulasi:", err);
                }
            };

            fetchRegulasiByProdi();
        } else {
            setVersiRegulasi([]);
        }
    }, [selectedProdi]);

    const onFormSubmit = async (data: AkreditasiRequest) => {
        try {
            if (accData) {
                await UpdateAkreditasi({
                    id: accData.id_akreditasi,
                    data: {
                        tanggal_mulai: data.tanggal_mulai,
                        tanggal_selesai_prodi: data.tanggal_selesai_prodi,
                        tanggal_selesai_lpmi: data.tanggal_selesai_lpmi,
                        tahun_berlaku: `${data.tahun_mulai}/${data.tahun_selesai}`,
                        id_qs: data.id_qs,
                        nama_akreditasi: data.nama_akreditasi,
                        id_prodi: data.id_prodi
                    }
                }).unwrap();
                setSnackbar({
                    open: true,
                    message: 'Akreditasi berhasil diupdate!',
                    severity: 'success'
                });
            }
            else {
                await PostAkreditasi({
                    tanggal_mulai: data.tanggal_mulai,
                    tanggal_selesai_prodi: data.tanggal_selesai_prodi,
                    tanggal_selesai_lpmi: data.tanggal_selesai_lpmi,
                    tahun_berlaku: `${data.tahun_mulai}/${data.tahun_selesai}`,
                    id_qs: data.id_qs,
                    nama_akreditasi: data.nama_akreditasi,
                    id_prodi: data.id_prodi
                }).unwrap();
                setSnackbar({
                    open: true,
                    message: 'Akreditasi berhasil dibuat!',
                    severity: 'success'
                });
            }
            reset();
            onClose();
        } catch (error: any) {
            console.error('Error submitting form:', error);

            setSnackbar({
                open: true,
                message: 'Gagal membuat Akreditasi',
                severity: 'error'
            });
        }
    };


    return (
        <>
            <Dialog
                open={open}
                onClose={onClose}
            >
                <form onSubmit={handleSubmit(onFormSubmit)}>
                    <DialogTitle>{accData ? 'Edit Accreditation' : 'Create new Accreditation'}</DialogTitle>
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
                    <DialogContent
                        sx={{
                            display: "flex",
                            flexDirection: "column",
                            gap: 2,
                        }}>
                        <TextInputController
                            name="nama_akreditasi"
                            control={control}
                            label="Nama Akreditasi"
                            placeholder="Masukkan nama Akreditasi"
                        />
                        <Grid container spacing={2}>
                            <Grid size={6}>
                                <DateInputController
                                    name="tahun_mulai"
                                    control={control}
                                    label="Tahun Mulai"
                                    displayFormat="YYYY"
                                    dataFormat="YYYY"
                                    views={['year']}
                                />
                            </Grid>
                            <Grid size={6}>
                                <DateInputController
                                    name="tahun_selesai"
                                    control={control}
                                    label="Tahun Selesai"
                                    displayFormat="YYYY"
                                    dataFormat="YYYY"
                                    views={['year']}
                                />
                            </Grid>
                        </Grid>
                        <DateInputController
                            name="tanggal_mulai"
                            control={control}
                            label="Tanggal Mulai"
                        />
                        <DateInputController
                            name="tanggal_selesai_prodi"
                            control={control}
                            label="Tanggal Selesai Prodi"
                            disabled={!tanggalMulai}
                            minDate={getMinDate(tanggalMulai)}
                        />
                        <DateInputController
                            name="tanggal_selesai_lpmi"
                            control={control}
                            label="Tanggal Selesai LPMI"
                            disabled={!tanggalSelesaiProdi}
                            minDate={getMinDate(tanggalSelesaiProdi)}
                        />
                        <Grid container spacing={2}>
                            <Grid size={6}>
                                <DropdownInputController
                                    name="id_prodi"
                                    control={control}
                                    label="Prodi"
                                >
                                    {prodi.map((category) => (
                                        <MenuItem
                                            key={String(category.id_prodi)}
                                            value={String(category.id_prodi)}
                                        >
                                            {category.nama_prodi}
                                        </MenuItem>
                                    ))}
                                </DropdownInputController>
                            </Grid>
                            <Grid size={6}>
                                <DropdownInputController
                                    name="id_qs"
                                    control={control}
                                    label="Regulasi"
                                    disabled={!selectedProdi}
                                >
                                    {versiRegulasi.map((category) => (
                                        <MenuItem
                                            key={String(category.id_qs)}
                                            value={String(category.id_qs)}
                                        >
                                            {category.nama_lembaga + ' - ' + category.versi}
                                        </MenuItem>
                                    ))}
                                </DropdownInputController>
                            </Grid>
                        </Grid>
                    </DialogContent>
                    <Divider />
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
                            type='submit'
                        >
                            {accData ? 'Update' : 'Create'}
                        </Button>
                    </DialogActions>
                </form>
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

export default AkreditasiDialog;