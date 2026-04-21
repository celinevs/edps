'use client';

import * as React from 'react';
import Paper from '@mui/material/Paper';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import IconButton from '@mui/material/IconButton';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import Collapse from '@mui/material/Collapse';
import Box from '@mui/material/Box';

export interface Column<T> {
  id: keyof T | string;
  label: string;
  minWidth?: number;
  align?: 'right' | 'center' | 'left';
  render?: (row: T) => React.ReactNode;
}

export interface SubTableColumn<T> {
  id: keyof T | string;
  label: string;
  minWidth?: number;
  align?: 'right' | 'center' | 'left';
  render?: (row: T) => React.ReactNode;
}

export interface CollapsibleTableProps<T extends Record<string, any>, S extends Record<string, any>> {
  columns: Column<T>[];
  rows: T[];
  getSubTableData: (row: T) => S[];
  subTableColumns: SubTableColumn<S>[];
  subTableTitle?: (row: T) => string;
}

export default function CollapsibleTable<T extends Record<string, any>, S extends Record<string, any>>({
  columns,
  rows,
  getSubTableData,
  subTableColumns,
  subTableTitle,
}: CollapsibleTableProps<T, S>) {
  const [openRows, setOpenRows] = React.useState<Set<number>>(new Set());

  const handleToggleRow = (rowIndex: number) => {
    setOpenRows(prev => {
      const newSet = new Set(prev);
      if (newSet.has(rowIndex)) {
        newSet.delete(rowIndex);
      } else {
        newSet.add(rowIndex);
      }
      return newSet;
    });
  };

  return (
    <TableContainer component={Paper}>
      <Table stickyHeader aria-label="collapsible table">
        <TableHead>
          <TableRow>
            <TableCell padding="checkbox" sx={{ width: 50 }} />
            {columns.map((column) => (
              <TableCell
                key={String(column.id)}
                align={column.align}
                sx={{ minWidth: column.minWidth }}
              >
                {column.label}
              </TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map((row, rowIndex) => {
            const subTableData = getSubTableData(row);
            const isOpen = openRows.has(rowIndex);

            return (
              <React.Fragment key={rowIndex}>
                {/* Main Row */}
                <TableRow hover role="checkbox" tabIndex={-1}>
                  <TableCell padding="checkbox">
                    <IconButton
                      aria-label="expand row"
                      size="small"
                      onClick={() => handleToggleRow(rowIndex)}
                    >
                      {isOpen ? <KeyboardArrowUpIcon />  : <KeyboardArrowDownIcon />}
                    </IconButton>
                  </TableCell>
                  {columns.map((column) => {
                    const cellValue = typeof column.id === 'string'
                      ? row[column.id as keyof T]
                      : row[column.id];

                    return (
                      <TableCell key={String(column.id)} align={column.align}>
                        {column.render ? column.render(row) : String(cellValue)}
                      </TableCell>
                    );
                  })}
                </TableRow>

                {/* Sub Table Row */}
                <TableRow>
                  <TableCell
                    style={{ paddingBottom: 0, paddingTop: 0 }}
                    colSpan={columns.length + 1}
                  >
                    <Collapse in={isOpen} timeout="auto" unmountOnExit>
                      <Box sx={{ margin: 2, }}>
                        {subTableTitle && (
                          <h4 style={{ marginTop: 0, marginBottom: 1 }}>
                            {subTableTitle(row)}
                          </h4>
                        )}
                        <Table size="small" aria-label="sub-table" sx={{ backgroundColor: '#f5f5f5', }}>
                          <TableHead>
                            <TableRow>
                              {subTableColumns.map((subColumn) => (
                                <TableCell
                                  key={String(subColumn.id)}
                                  align={subColumn.align}
                                >
                                  {subColumn.label}
                                </TableCell>
                              ))}
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {subTableData.map((subRow, subIndex) => (
                              <TableRow key={subIndex} hover>
                                {subTableColumns.map((subColumn) => {
                                  const subCellValue = typeof subColumn.id === 'string'
                                    ? subRow[subColumn.id as keyof S]
                                    : subRow[subColumn.id];

                                  return (
                                    <TableCell
                                      key={String(subColumn.id)}
                                      align={subColumn.align}
                                    >
                                      {subColumn.render
                                        ? subColumn.render(subRow)
                                        : String(subCellValue)}
                                    </TableCell>
                                  );
                                })}
                              </TableRow>
                            ))}
                            {subTableData.length === 0 && (
                              <TableRow>
                                <TableCell
                                  colSpan={subTableColumns.length}
                                  align="center"
                                >
                                  No data available
                                </TableCell>
                              </TableRow>
                            )}
                          </TableBody>
                        </Table>
                      </Box>
                    </Collapse>
                  </TableCell>
                </TableRow>
              </React.Fragment>
            );
          })}
        </TableBody>
      </Table>
    </TableContainer>
  );
}