'use client';

import * as React from 'react';
import Paper from '@mui/material/Paper';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';

export interface Column<T> {
  id: keyof T | string;
  label: string;
  minWidth?: number;
  align?: 'right' | 'center' | 'left';
  render?: (row: T, index?: number) => React.ReactNode;
  group?: string;
  groupLabel?: string;
  groupAlign?: 'right' | 'center' | 'left';
}

export interface NoPaginationTableProps<T extends Record<string, any>> {
  columns: Column<T>[];
  rows: T[];
  enableGrouping?: boolean;
  showRowNumber?: boolean;
  rowNumberLabel?: string;
}

export default function NoPaginationTable<T extends Record<string, any>>({
  columns,
  rows,
  enableGrouping = false,
  showRowNumber = false,
  rowNumberLabel = 'No',
}: NoPaginationTableProps<T>) {
  
  const processedColumns = React.useMemo(() => {
    if (!showRowNumber) return columns;

    return [
      {
        id: 'rowNumber',
        label: rowNumberLabel,
        render: (_row: T, index?: number) =>
          index !== undefined ? index + 1 : 0,
      } as Column<T>,
      ...columns,
    ];
  }, [columns, showRowNumber, rowNumberLabel]);

  const renderTableHeader = () => {
    if (!enableGrouping) {
      return (
        <TableRow>
          {processedColumns.map((column) => (
            <TableCell
              key={String(column.id)}
              align={column.align}
              sx={{
                fontWeight: 'bold',
                minWidth: column.minWidth,
              }}
            >
              {column.label}
            </TableCell>
          ))}
        </TableRow>
      );
    }

    const topRow: React.ReactNode[] = [];
    const bottomRow: React.ReactNode[] = [];

    let i = 0;

    while (i < processedColumns.length) {
      const col = processedColumns[i];

      if (!col.group) {
        topRow.push(
          <TableCell
            key={`top-${String(col.id)}`}
            rowSpan={2}
            align={col.align}
            sx={{
              fontWeight: 'bold',
              verticalAlign: 'middle',
              minWidth: col.minWidth,
            }}
          >
            {col.label}
          </TableCell>
        );
        i++;
        continue;
      }

      const groupId = col.group;
      const groupLabel = col.groupLabel;

      let span = 0;
      let j = i;

      while (
        j < processedColumns.length &&
        processedColumns[j].group === groupId
      ) {
        span++;
        j++;
      }

      topRow.push(
        <TableCell
          key={`group-${groupId}-${i}`}
          colSpan={span}
          align={col.groupAlign || 'center'}
          sx={{
            fontWeight: 'bold',
          }}
        >
          {groupLabel}
        </TableCell>
      );

      for (let k = i; k < j; k++) {
        const child = processedColumns[k];
        bottomRow.push(
          <TableCell
            key={`sub-${String(child.id)}`}
            align={child.align}
            sx={{
              backgroundColor: '#f5f5f5',
              fontWeight: 'bold',
              minWidth: child.minWidth,
            }}
          >
            {child.label}
          </TableCell>
        );
      }

      i = j;
    }

    return (
      <>
        <TableRow>{topRow}</TableRow>
        <TableRow>{bottomRow}</TableRow>
      </>
    );
  };

  const renderCellContent = (
    column: Column<T>,
    row: T,
    rowIndex: number
  ) => {
    if (column.render) {
      return column.render(row, rowIndex);
    }

    if (column.id === 'rowNumber') {
      return rowIndex + 1;
    }

    const value =
      typeof column.id === 'string'
        ? row[column.id as keyof T]
        : row[column.id];

    return value !== undefined && value !== null
      ? String(value)
      : '-';
  };

  return (
    <Paper sx={{ width: '100%', overflow: 'hidden' }}>
      <TableContainer sx={{ maxHeight: 440 }}>
        <Table stickyHeader>
          <TableHead>{renderTableHeader()}</TableHead>

          <TableBody>
            {rows.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={processedColumns.length}
                  align="center"
                  sx={{ py: 4 }}
                >
                  No data available
                </TableCell>
              </TableRow>
            ) : (
              rows.map((row, rowIndex) => (
                <TableRow hover key={rowIndex}>
                  {processedColumns.map((column) => (
                    <TableCell
                      key={String(column.id)}
                      align={column.align}
                    >
                      {renderCellContent(column, row, rowIndex)}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  );
}