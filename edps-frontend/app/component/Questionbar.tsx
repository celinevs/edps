'use client';

import { AppBar, Toolbar, Typography, Box, IconButton } from '@mui/material';
import { useState, useEffect } from 'react';
import { useRouter } from "next/navigation";
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

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

  return (
    <Box>
      <AppBar position="static"
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
          </Box>
          <Box sx={{ display: "flex", alignItems: "center" }}>
            <Typography variant="h6">
              Due: {formatDate(dueDate)}
            </Typography>
          </Box>
        </Toolbar>
      </AppBar>

      <Box sx={{ p: 2 }}>
        {children}
      </Box>
    </Box>
  );
}