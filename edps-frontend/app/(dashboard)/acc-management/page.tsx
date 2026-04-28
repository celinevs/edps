"use client"

import { useState, useEffect } from "react";
import { Akreditasi } from "@/model/Akreditasi";
import { useGetAkreditasiQuery } from "@/api/akreditasi";
import {
    Typography,
    Button,
    Stack,
    Box,
    IconButton
} from "@mui/material";
import DataTable, { Column } from "@/app/component/table/DataTable";
import EditIcon from '@mui/icons-material/Edit';
import AddIcon from '@mui/icons-material/Add';
import AkreditasiDialog from "./AkreditasiDialog";

function AccManagementPage() {
    const [totalData, setTotalData] = useState(0)
    const [page, setPage] = useState(0)
    const [perPage, setPerPage] = useState(5)
    const [akreditasi, setAkreditasi] = useState<Akreditasi[]>([])
    const [selectedAkreditasi, setSelectedAkreditasi] = useState<Akreditasi>()
    const [openDialog, setOpenDialog] = useState<boolean>(false)
    const { data } = useGetAkreditasiQuery({
        page: page + 1,
        per_page: perPage,
    });

    useEffect(() => {
        if (data?.data) {
            setAkreditasi(data?.data.results)
            setTotalData(data?.data.totalCount)
        }
    }, [data]);

    const handleEdit = (data: Akreditasi) => {
            setSelectedAkreditasi(data)
            setOpenDialog(true)
        }

    const columns: Column<Akreditasi>[] = [
        { id: 'nama_akreditasi', label: 'Event Name' },
        {
            id: 'status',
            label: 'Status',
            render: (row) => {
                const today = new Date();
                const dueDate = new Date(row.tanggal_selesai);

                const isClosed = today > dueDate;

                return (
                    <Box
                        sx={{
                            px: 1.5,
                            py: 0.5,
                            borderRadius: 2,
                            fontWeight: 600,
                            display: 'inline-block',
                            color: isClosed ? '#fff' : '#1b5e20',
                            backgroundColor: isClosed ? '#d32f2f' : '#c8e6c9',
                        }}
                    >
                        {isClosed ? 'Closed' : 'Open'}
                    </Box>
                );
            },
        },
        {
            id: 'tanggal_mulai',
            label: 'Start Date',
            render: (row) =>
                new Date(row.tanggal_mulai).toLocaleDateString("en-GB"),
        },
        {
            id: 'tanggal_selesai',
            label: 'End Date Prodi',
            render: (row) =>
                new Date(row.tanggal_selesai).toLocaleDateString("en-GB"),
        },
        {
            id: 'tanggal_selesai_lpmi',
            label: 'End Date LPMI',
            render: (row) =>
                new Date(row.tanggal_selesai_lpmi).toLocaleDateString("en-GB"),
        },
        {
            id: 'actions',
            label: 'Actions',
            render: (row) => (
                <Stack direction="row" spacing={1}>
                    <IconButton onClick={() => {handleEdit(row)}}>
                        <EditIcon />
                    </IconButton>
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
        setSelectedAkreditasi(undefined)
    }

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
                Accreditation Management
            </Typography>

            <Stack
                direction="column"
                spacing={2}
                sx={{ width: "100%", mb: 4 }}
            >


                <DataTable
                    columns={columns}
                    rows={akreditasi}
                    page={page}
                    rowsPerPage={perPage}
                    totalData={totalData}
                    handleChangePage={handleChangePage}
                    handleChangeRowsPerPage={handleChangeRowsPerPage}
                />
                <Box
                    sx={{
                        display: 'flex',
                        justifyContent: 'flex-start',
                        mb: 2,
                    }}
                >
                    <Button
                        variant="contained"
                        size="medium"
                        onClick={handleOpenDialog}
                        startIcon={<AddIcon />}
                        sx={{
                            borderRadius: 4,
                            textTransform: "none",
                            fontSize: "0.95rem",
                            fontWeight: 600,
                            px: 2.5,
                            py: 1,
                            width: 'auto',
                        }}
                    >
                        Create New Acreditation Page
                    </Button>
                </Box>
            </Stack>
            <AkreditasiDialog
                open={openDialog}
                onClose={handleCloseDialog}
                accData={selectedAkreditasi}
            />
        </>
    );
};

export default AccManagementPage;