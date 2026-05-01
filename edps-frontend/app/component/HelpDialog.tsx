'use client';

import {
    Dialog,
    DialogContent,
    DialogTitle,
    IconButton,
    Typography,
    Divider,
    Box,
    Link,
    Grid
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { AkreditasiHelp } from '@/model/Akreditasi';

interface HelpDialogProps {
    open: boolean;
    onClose: () => void;
    data?: AkreditasiHelp;
}

function HelpDialog(props: HelpDialogProps) {
    const { open, onClose, data } = props;
    const BASE_URL = process.env.NEXT_PUBLIC_API_URL;

    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth="md"
            fullWidth
            PaperProps={{
                sx: {
                    height: '100vh',
                    maxHeight: '100vh',
                }
            }}
        >
            <DialogTitle sx={{ fontWeight: 600 }}>
                Help
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

            <Typography variant="body2" color="text.secondary" mb={2} ml={3}>
                Information about accreditation
            </Typography>
            <Divider />

            <DialogContent>
                {data?.email_pengisi &&
                    <Box mb={2}>
                        <Typography variant="body1">
                            <strong>EDPS Submitted By:</strong> {data?.email_pengisi}
                        </Typography>
                        <Typography variant="body1">
                            <strong>EDPS Submission Date:</strong> {data?.tanggal_pengisian}
                        </Typography>
                    </Box>
                }

                <Grid container>
                    <Grid size={4}>
                        <Typography variant="body1">
                            <strong>Akreditasi mengacu kepada :</strong>
                        </Typography>
                    </Grid>
                    <Grid size={8}>
                        <Link
                            href={data?.link}
                            target="_blank"
                            rel="noopener"
                            underline="hover"
                            sx={{
                                display: 'inline-block',
                                wordBreak: 'break-word'
                            }}
                        >
                            {data?.label_link}
                        </Link>
                    </Grid>
                </Grid>

                <Grid container mt={3}>
                    <Grid size={4}>
                        <Typography variant="body1" fontWeight={600}>
                            Overview Bobot Bagian / Kriteria :
                        </Typography>
                    </Grid>
                    <Grid size={8}>
                        <Box
                            component="img"
                            src={data?.gambar_path ? `${BASE_URL}${data?.gambar_path.substring(4)}` : ''}
                            alt="Akreditasi Table"
                            sx={{
                                width: '100%',
                                height: 'auto',
                            }}
                            mb={2}
                        />
                        <Typography variant='body2' color="text.secondary">{data?.deskripsi_gambar}</Typography>
                    </Grid>
                </Grid>
            </DialogContent>
        </Dialog>
    );
}

export default HelpDialog;