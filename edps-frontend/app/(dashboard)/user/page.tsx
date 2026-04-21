"use client"

import { useState, useEffect } from "react";
import { User } from "@/model/User";
import { useGetusersQuery } from "@/api/user";
import {
    Typography,
    Button,
    Stack,
    IconButton,
    Box
} from "@mui/material";
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DataTable, { Column } from "@/app/component/table/DataTable";
import UserDialog from "./UserDialog";

function UserPage() {
    const [totalData, setTotalData] = useState(0);
    const [page, setPage] = useState(0);
    const [perPage, setPerPage] = useState(5);
    const [users, setUsers] = useState<User[]>([]);
    const [selectedUser, setSelectedUser] = useState<User>()
    const [openDialog, setOpenDialog] = useState<boolean>(false);
    const { data, isLoading } = useGetusersQuery({
        page: page + 1,
        per_page: perPage,
    });

    useEffect(() => {
        if (data?.data) {
            setUsers(data?.data.results)
            setTotalData(data?.data.totalCount)
        }
    }, [data]);

    const handleEdit = (userData: User) => {
        setSelectedUser(userData)
        setOpenDialog(true)
    }

    const columns: Column<User>[] = [
        { id: 'username', label: 'Username' },
        { id: 'email', label: 'Email' },
        { id: 'role', label: 'Role' },
        {id: 'nama_prodi', label:'Prodi',  render: (row) =>
               row.nama_prodi? row.nama_prodi : '-'},
        {
            id: 'is_active', label: 'Status' ,
            render: (row) =>
               row.is_active? 'Active' : 'Inactive'
        },
{
    id: 'actions',
        label: 'Actions',
            render: (row) => (
                <Stack direction="row">
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
    setSelectedUser(undefined)
}

return (
    <>
        <Box
            sx={{
                display: 'flex',
                justifyContent: 'space-between',
                mb: 2,
            }}
        >
            <Typography
                variant="h4"
                gutterBottom
                sx={{
                    fontWeight: 500,
                    color: 'primary.main',
                }}
            >
                User Management
            </Typography>
            <Button
                variant="contained"
                size="medium"
                onClick={handleOpenDialog}
                startIcon={<AddIcon />}
                sx={{
                    py: 1,
                    borderRadius: 4,
                    textTransform: "none",
                    fontWeight: 600,
                    width: 'auto',
                    height: '40px'
                }}
            >
                Add User
            </Button>
        </Box>

        <Stack
            direction="column"
            spacing={2}
            sx={{ width: "100%", mb: 4 }}
        >

            <DataTable
                columns={columns}
                rows={users}
                page={page}
                rowsPerPage={perPage}
                totalData={totalData}
                handleChangePage={handleChangePage}
                handleChangeRowsPerPage={handleChangeRowsPerPage}
            />
        </Stack>
        <UserDialog
            open={openDialog}
            onClose={handleCloseDialog}
            userData={selectedUser}
        />
    </>
);
}

export default UserPage