"use client"

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { QuestionSetItem } from "@/model/QuestionSet";
import { useGetQuestionSetPaginatedQuery } from "@/api/questionSet";
import {
    Button,
    Stack,
    Grid,
    Typography,
    Box
} from "@mui/material";
import AddIcon from '@mui/icons-material/Add';
import DataTable, { Column } from "@/app/component/table/DataTable";
import { formatDate } from "@/app/service/utils/func";

function QuestionListPage() {
    const router = useRouter();
    const [totalData, setTotalData] = useState(0)
    const [page, setPage] = useState(0)
    const [perPage, setPerPage] = useState(5)
    const [questionSet, setQuestionSet] = useState<QuestionSetItem[]>([]);
    const { data } = useGetQuestionSetPaginatedQuery({
        page: page + 1,
        per_page: perPage,
    });

    useEffect(() => {
        if (data?.data) {
            setQuestionSet(data?.data.results)
            setTotalData(data?.data.totalCount)
        }
    }, [data]);

    const handleUploadPage = (row: QuestionSetItem) => {
        sessionStorage.setItem('uploadData', JSON.stringify({
            can_edit: row.can_edit
        }));

        router.push(`/question-list/upload?id_qs=${row.id_qs}`);
    };

    const columns: Column<QuestionSetItem>[] = [
        { id: 'nama_lembaga', label: 'Accreditor' },
        { id: 'versi', label: 'Version' },
        {
            id: 'tanggal_aktif',
            label: 'Active Date',
            render: (row) =>
                formatDate(row.tanggal_aktif),
        },
        {
            id: 'actions',
            label: 'Actions',
            render: (row) => (
                <Stack direction="row" spacing={1}>
                    <Button
                        size="small"
                        variant="contained"
                        // disabled={!row.can_edit || false}
                        onClick={() => handleUploadPage(row)}
                    >
                        Edit File
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

    return (
        <>
            <Grid container justifyContent="space-between">
                <Grid>
                    <Typography
                        variant="h4"
                        gutterBottom
                        sx={{
                            fontWeight: 500,
                            mb: 3,
                            color: 'primary.main',
                        }}
                    >
                        Accreditor’s Question List
                    </Typography>
                </Grid>
                {/* <Grid>
                    {!user?.nama_prodi &&
                        <DropdownInputController
                            name="id_prodi"
                            control={control}
                            label="Prodi"
                            sx={{ width: 100 }}
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
                    }
                </Grid> */}
            </Grid>

            <Stack
                direction="column"
                spacing={2}
                sx={{ width: "100%", mb: 4 }}
            >

                <DataTable
                    columns={columns}
                    rows={questionSet}
                    page={page}
                    rowsPerPage={perPage}
                    totalData={totalData}
                    handleChangePage={handleChangePage}
                    handleChangeRowsPerPage={handleChangeRowsPerPage}
                    showRowNumber={true}
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
                        onClick={() => router.push('/question-list/upload')}
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
                        Create
                    </Button>
                </Box>
            </Stack>
        </>
    );

}

export default QuestionListPage
