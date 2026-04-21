// DataTable.tsx
'use client';

import * as React from 'react';
import Paper from '@mui/material/Paper';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TablePagination from '@mui/material/TablePagination';
import TableRow from '@mui/material/TableRow';

export interface Column<T> {
  id: keyof T | string;
  label: string;
  minWidth?: number;
  align?: 'right' | 'center' | 'left';
  render?: (row: T, index?: number) => React.ReactNode;
}

export interface DataTableProps<T extends Record<string, any>> {
  columns: Column<T>[];
  rows: T[];
  page: number;
  rowsPerPage: number;
  totalData: number;
  handleChangePage: (event: unknown, newPage: number) => void;
  handleChangeRowsPerPage: (event: React.ChangeEvent<HTMLInputElement>) => void;
  showRowNumber?: boolean;
}

export default function DataTable<T extends Record<string, any>>({
  columns,
  rows,
  page,
  rowsPerPage,
  totalData,
  handleChangePage,
  handleChangeRowsPerPage,
  showRowNumber = false,
}: DataTableProps<T>) {
  const allColumns = showRowNumber
    ? [
      {
        id: 'rowNumber',
        label: 'No',
        render: (row: T, index: number) => {
          return page * rowsPerPage + index + 1;
        },
      } as Column<T>,
      ...columns,
    ]
    : columns;

  return (
    <Paper sx={{ width: '100%', overflow: 'hidden' }}>
      <TableContainer sx={{ maxHeight: 440 }}>
        <Table stickyHeader aria-label="sticky table">
          <TableHead>
            <TableRow>
              {allColumns.map((column) => (
                <TableCell
                  key={String(column.id)}
                  align={column.align}
                  sx={{ backgroundColor: '#f5f5f5', minWidth: column.minWidth }}
                >
                  {column.label}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>

          <TableBody>
            {rows.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={allColumns.length}
                  align="center"
                  sx={{ color: 'text.secondary' }}
                >
                  No data available
                </TableCell>
              </TableRow>
            ) : (
              rows.map((row, rowIndex) => (
                <TableRow hover role="checkbox" tabIndex={-1} key={rowIndex}>
                  {allColumns.map((column) => {
                    const cellValue =
                      typeof column.id === 'string'
                        ? row[column.id as keyof T]
                        : row[column.id];

                    return (
                      <TableCell
                        key={String(column.id)}
                        align={column.align}
                      >
                        {column.render
                          ? column.render(row, rowIndex)
                          : String(cellValue)}
                      </TableCell>
                    );
                  })}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <TablePagination
        rowsPerPageOptions={[5, 10, 25, 50]}
        component="div"
        count={totalData}
        rowsPerPage={rowsPerPage}
        page={page}
        onPageChange={handleChangePage}
        onRowsPerPageChange={handleChangeRowsPerPage}
      />
    </Paper>
  );
}