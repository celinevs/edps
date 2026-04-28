import React from "react";
import {
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
} from "@mui/material";

interface WeightRow {
    bobot: number;
    total: number;
    answered: number;
    points: number;
}

interface Props {
    data: WeightRow[];
    totalQuestions: number;
    totalPoints: number;
    maxPoints?: number;
}

const WeightSummaryTable: React.FC<Props> = ({
    data,
    totalQuestions,
    totalPoints,
    maxPoints,
}) => {
    return (
        <TableContainer component={Paper} sx={{ maxHeight: 655 }}>
            <Table size="small" stickyHeader>
                <TableHead>
                    <TableRow sx={{ backgroundColor: "#f5f5f5" }}>
                        <TableCell align="center"><b>Weight</b></TableCell>
                        <TableCell align="center"><b>Q(s)</b></TableCell>
                        <TableCell align="center"><b>Points</b></TableCell>
                    </TableRow>
                </TableHead>

                <TableBody>
                    {data.map((row) => (
                        <TableRow key={row.bobot}>
                            <TableCell align="center">{row.bobot}</TableCell>

                            <TableCell align="center">
                                {row.answered}/{row.total}
                            </TableCell>

                            <TableCell align="center">
                                {row.points}
                            </TableCell>
                        </TableRow>
                    ))}

                    {/* TOTAL ROW */}
                    <TableRow sx={{
                        position: "sticky",
                        bottom: 0,
                        backgroundColor: "#fafafa",
                        zIndex: 1
                    }}>
                        <TableCell align="center"><b>Total</b></TableCell>

                        <TableCell align="center">
                            <b>{totalQuestions}</b>
                        </TableCell>

                        <TableCell align="center">
                            <b>
                                {totalPoints}
                                {maxPoints ? `/${maxPoints}` : ""}
                            </b>
                        </TableCell>
                    </TableRow>
                </TableBody>
            </Table>
        </TableContainer>
    );
};

export default WeightSummaryTable;