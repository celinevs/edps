'use client';

import { Button, Dialog, DialogActions, DialogContent, DialogTitle, Divider, IconButton, Typography, Grid, MenuItem, Snackbar, Alert } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { usePostusersMutation, useUpdateusersMutation } from '@/api/user';
import { useGetProdiQuery } from '@/api/prodi';
import { GetProdi } from '@/model/Prodi';
import { User, Roles } from '@/model/User';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useState, useEffect } from 'react';
import TextInputController from '@/app/component/controller/TextInputController';
import DropdownInputController from '@/app/component/controller/DropdownInputController';

interface UserDialogProps {
    open: boolean;
    onClose: () => void;
    userData?: User;
}

export const UserRequestSchema = z.object({
    username: z.string().min(1),
    email: z.email("This is not a valid email.").min(1),
    role: z.string().min(1),
    id_prodi: z.string(),
    is_active: z.boolean()
});

type UserRequest = z.infer<typeof UserRequestSchema>

function UserDialog(props: UserDialogProps) {
    const { data } = useGetProdiQuery();
    const { open, onClose, userData } = props;
    const [PostUser] = usePostusersMutation();
    const [UpdateUser] = useUpdateusersMutation();
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

    const defaultValues: UserRequest = {
        username: '',
        email: '',
        role: '',
        id_prodi: '',
        is_active: true
    }

    const { control, formState, handleSubmit, setValue, setError, trigger, watch, reset } = useForm<UserRequest>({
        mode: 'onSubmit',
        defaultValues,
        resolver: zodResolver(UserRequestSchema)
    });

    useEffect(() => {
        if (userData) {
            reset({
                username: userData.username || '',
                email: userData.email || '',
                role: userData.role || '',
                id_prodi: userData.id_prodi || '',
                is_active: userData.is_active ?? true
            });
        } else {
            reset(defaultValues);
        }
    }, [userData, reset]);

    const role = watch('role')

    useEffect(() => {
        if (role !== 'PRODI') {
            setValue('id_prodi', '');
        }
    }, [role, setValue]);

    const onFormSubmit = async (data: UserRequest) => {
        try {
            if (userData) {
                await UpdateUser({
                    id_user: userData.id_user,
                    body: data
                }).unwrap();

                setSnackbar({
                    open: true,
                    message: 'User berhasil diupdate!',
                    severity: 'success'
                });
            } else {
                await PostUser(data).unwrap();

                setSnackbar({
                    open: true,
                    message: 'User berhasil dibuat!',
                    severity: 'success'
                });
            }
            setSnackbar({
                open: true,
                message: 'User berhasil dibuat!',
                severity: 'success'
            });
            reset();
            onClose();
        } catch (error) {
            console.error('Error submitting form:', error);
            setSnackbar({
                open: true,
                message: 'Gagal membuat user',
                severity: 'error'
            });
        }
    };


    return (
        <>
            <Dialog
                fullWidth
                open={open}
                onClose={onClose}
                maxWidth="sm"
            >
                <form onSubmit={handleSubmit(onFormSubmit)}>
                    <DialogTitle>{userData ? 'Update user' : 'Create user'}</DialogTitle>
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
                            name="username"
                            control={control}
                            label="Username"
                            placeholder="Masukkan username"
                        />
                        <TextInputController
                            name="email"
                            control={control}
                            label="Email"
                            placeholder="Masukkan email"
                        />
                        <DropdownInputController
                            name="role"
                            control={control}
                            label="Role"
                        >
                            {Object.values(Roles).map((role) => (
                                <MenuItem key={role} value={role}>
                                    {role}
                                </MenuItem>
                            ))}
                        </DropdownInputController>
                        {role === 'PRODI' &&
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
                            </DropdownInputController>}
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
                            {userData ? 'Update' : 'Create'}
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

export default UserDialog;