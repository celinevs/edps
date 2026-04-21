"use client"

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { GetPeriode } from "@/model/Periode";
// import { getPeriode } from "@/api/api_test";
import { useGetPeriodeQuery, useLazyGetPeriodeQuery } from "@/api/periode";
import {
  Container,
  Typography,
  Button,
  Stack,
} from "@mui/material";
import DataTable, { Column } from "@/app/component/table/DataTable";
import PeriodeDialog from "./(dashboard)/acc-management/AkreditasiDialog";

function HomePage() {
  const router = useRouter();
  const [totalData, setTotalData] = useState(0)
  const [page, setPage] = useState(0)
  const [perPage, setPerPage] = useState(5)
  const [periode, setPeriode] = useState<GetPeriode[]>([])
  const [openDialog, setOpenDialog] = useState<boolean>(false)
  const { data, isLoading } = useGetPeriodeQuery({
    page: page + 1,
    per_page: perPage,
  });

  useEffect(() => {
    if (data?.data) {
      setPeriode(data?.data.results)
      setTotalData(data?.data.totalCount)
    }
  }, [data]);

  const handleView = (row: GetPeriode) => {
    sessionStorage.setItem('formData', JSON.stringify({
      id_regulasi: row.id_versi,
      id_periode: row.id_periode,
      status: row.status_prodi,
    }));

    router.push('/form');
  };

  const handleReview = (row: GetPeriode) => {
    sessionStorage.setItem('reviewData', JSON.stringify({
      id_regulasi: row.id_versi,
      id_periode: row.id_periode,
      status: row.status_lpmi
    }));

    router.push('/lpmi');
  };

  const columns: Column<GetPeriode>[] = [
    { id: 'nama_periode', label: 'Event Name' },
    { id: 'tanggal_mulai', label: 'Start Date' },
    { id: 'tanggal_selesai', label: 'End Date' },
    { id: 'status_prodi', label: 'Status Prodi' },
    { id: 'status_lpmi', label: 'Status LPMI' },
    {
      id: 'actions',
      label: 'Actions',
      render: (row) => (
        <Stack direction="row" spacing={1}>
          <Button
            variant="outlined"
            size="small"
            onClick={() => handleView(row)}
          >
            View Form
          </Button>
          <Button
            variant="outlined"
            size="small"
            onClick={() => handleReview(row)}
          >
            Review
          </Button>
        </Stack>
      ),
    },
  ];


  const handleChangePage = (_: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setPerPage(+event.target.value);
    setPage(0);
  };

  const handleOpenDialog = () => {
    setOpenDialog(true)
  }

  const handleCloseDialog = () => {
    setOpenDialog(false)
  }

  // useEffect(() => {
  //   const fetchData = async () => {
  //     try {
  //       const res = await getPeriode(page + 1, perPage)
  //       setPeriode(res?.data?.results)
  //       setTotalData(res.data?.totalCount)
  //     } catch (err) {
  //       console.error("Failed to load periode:", err);
  //     }
  //   }
  //   fetchData()
  // }, [page, perPage])

  return (
    <Container>
      <Typography
        variant="h3"
        component="h1"
        gutterBottom
        sx={{
          fontWeight: 700,
          mb: 3
        }}
      >
        Welcome to our Web Demo
      </Typography>

      <Stack
        direction="column"
        spacing={2}
        sx={{ width: "100%", mb: 4 }}
      >
        {/* <Button
              variant="contained"
              size="large"
              onClick={() => router.push("/quiz")}
              sx={{
                py: 2,
                borderRadius: 2,
                textTransform: "none",
                fontSize: "1.1rem",
                fontWeight: 600,
              }}
              fullWidth
            >
              Start Quiz
            </Button> */}

        <Button
          variant="contained"
          size="large"
          onClick={handleOpenDialog}
          sx={{
            py: 2,
            borderRadius: 2,
            textTransform: "none",
            fontSize: "1.1rem",
            fontWeight: 600,
          }}
          fullWidth
        >
          Create New Period
        </Button>

        <DataTable
          columns={columns}
          rows={periode}
          page={page}
          rowsPerPage={perPage}
          totalData={totalData}
          handleChangePage={handleChangePage}
          handleChangeRowsPerPage={handleChangeRowsPerPage}
        />
      </Stack>
      <PeriodeDialog
        open={openDialog}
        onClose={handleCloseDialog}
      />
    </Container>
  );
};

export default HomePage;