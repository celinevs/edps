'use client';

import { AppBar, Toolbar, Typography, Box, IconButton } from '@mui/material';
import { useState, useEffect } from 'react';
import { useRouter } from "next/navigation";
import { useGetAkreditasiHelpIdMutation } from "@/api/akreditasi";
import { AkreditasiHelp } from "@/model/Akreditasi";
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import HelpDialog from './HelpDialog';


interface FormData {
  id_regulasi: string;
  id_periode: string;
  status: string;
  nama_periode: string;
  tanggal_selesai: string;
}

export default function Questionbar({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [formData, setFormData] = useState<FormData | null>(null);
  const namaPeriode = formData?.nama_periode ?? '';
  const dueDate = formData?.tanggal_selesai ?? '';
  const [getAkreditasiHelp] = useGetAkreditasiHelpIdMutation();
  const [akreditasiHelp, setAkreditasiHelp] = useState<AkreditasiHelp>();
  const [openDialog, setOpenDialog] = useState<boolean>(false);

  useEffect(() => {
    const fetchHelpData = async () => {
      console.log('enter fetching...')
      if (formData?.id_periode || formData?.id_regulasi) {
        console.log('id_akreditasi exist! calling API....')
        const result = await getAkreditasiHelp({ id_akreditasi: formData?.id_periode, id_qs: formData?.id_regulasi });
        setAkreditasiHelp(result.data?.data)
      }
    }
    fetchHelpData();
  }, [formData]);

  useEffect(() => {
    const storedData = sessionStorage.getItem('formData');
    if (storedData) {
      const parsedData = JSON.parse(storedData);
      setFormData(parsedData);
    }
  }, [router]);

  const formatDate = (dateString: string) => {
    if (!dateString) return '';

    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };
  const handleOpenDialog = () => setOpenDialog(true);
  const handleCloseDialog = () => setOpenDialog(false);

  return (
    <>
      <Box>
        <AppBar position="sticky"
          sx={{
            backgroundImage: 'url("/red-bg.jpg")',
          }}>
          <Toolbar sx={{ display: "flex", justifyContent: "space-between" }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <IconButton
                edge="start"
                color="inherit"
                onClick={() => router.back()}
              >
                <ArrowBackIcon />
              </IconButton>
              <Typography variant="h6">
                {namaPeriode}
              </Typography>
              <IconButton
                color="inherit"
                onClick={handleOpenDialog}
                sx={{ ml: 0.5 }}
              >
                <HelpOutlineIcon />
              </IconButton>
            </Box>
            <Box sx={{ display: "flex", alignItems: "center" }}>
              {dueDate &&
                <Typography variant="h6">
                  Due: {formatDate(dueDate)}
                </Typography>
              }
            </Box>
          </Toolbar>
        </AppBar>

        <Box sx={{ p: 2 }}>
          {children}
        </Box>
      </Box>
      <HelpDialog
        open={openDialog}
        onClose={handleCloseDialog}
        data={akreditasiHelp}
      />
    </>
  );
}