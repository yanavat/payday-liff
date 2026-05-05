"use client";

import { useEffect, useMemo, useState } from "react";
import {
  type ColumnDef,
  type RowSelectionState,
  type SortingState,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  ArrowUpDown,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { EmptyState } from "./empty-state";

interface DataTableProps<TData extends object> {
  columns: ColumnDef<TData>[];
  data: TData[];
  isLoading?: boolean;
  onRowClick?: (row: TData) => void;
  selectable?: boolean;
  onSelectChange?: (rows: TData[]) => void;
  pageSize?: number;
  totalCount?: number;
  emptyMessage?: string;
  className?: string;
}

export function DataTable<TData extends object>({
  columns,
  data,
  isLoading = false,
  onRowClick,
  selectable = false,
  onSelectChange,
  pageSize = 20,
  totalCount,
  emptyMessage = "No data",
  className,
}: DataTableProps<TData>) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});

  const selectableColumns = useMemo<ColumnDef<TData>[]>(() => {
    if (!selectable) return columns;

    return [
      {
        id: "select",
        header: ({ table }) => (
          <input
            type="checkbox"
            aria-label="Select all rows"
            checked={table.getIsAllPageRowsSelected()}
            onChange={table.getToggleAllPageRowsSelectedHandler()}
            className="h-4 w-4 rounded border-border accent-primary"
          />
        ),
        cell: ({ row }) => (
          <input
            type="checkbox"
            aria-label="Select row"
            checked={row.getIsSelected()}
            onClick={(event) => event.stopPropagation()}
            onChange={row.getToggleSelectedHandler()}
            className="h-4 w-4 rounded border-border accent-primary"
          />
        ),
        enableSorting: false,
      },
      ...columns,
    ];
  }, [columns, selectable]);

  const table = useReactTable({
    data,
    columns: selectableColumns,
    state: { sorting, rowSelection },
    onSortingChange: setSorting,
    onRowSelectionChange: setRowSelection,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize } },
    enableRowSelection: selectable,
  });

  useEffect(() => {
    onSelectChange?.(
      table.getSelectedRowModel().rows.map((row) => row.original),
    );
  }, [onSelectChange, rowSelection, table]);

  const page = table.getState().pagination.pageIndex + 1;
  const pageCount = table.getPageCount();
  const visibleRows = table.getRowModel().rows;
  const count = totalCount ?? data.length;
  const start =
    count === 0 ? 0 : table.getState().pagination.pageIndex * pageSize + 1;
  const end = Math.min(start + visibleRows.length - 1, count);

  return (
    <div
      className={cn(
        "overflow-hidden rounded-lg border border-border bg-bg-canvas shadow-card",
        className,
      )}
    >
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-left">
          <thead className="bg-bg-secondary">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id} className="h-10 border-b border-border">
                {headerGroup.headers.map((header) => {
                  const canSort = header.column.getCanSort();
                  const sorted = header.column.getIsSorted();
                  const SortIcon =
                    sorted === "asc"
                      ? ArrowUp
                      : sorted === "desc"
                        ? ArrowDown
                        : ArrowUpDown;

                  return (
                    <th
                      key={header.id}
                      className="px-4 text-[11px] font-semibold uppercase text-text-muted"
                    >
                      {header.isPlaceholder ? null : (
                        <button
                          type="button"
                          onClick={
                            canSort
                              ? header.column.getToggleSortingHandler()
                              : undefined
                          }
                          className={cn(
                            "inline-flex items-center gap-1",
                            canSort && "cursor-pointer hover:text-text-primary",
                          )}
                        >
                          {flexRender(
                            header.column.columnDef.header,
                            header.getContext(),
                          )}
                          {canSort && (
                            <SortIcon className="h-3 w-3" aria-hidden />
                          )}
                        </button>
                      )}
                    </th>
                  );
                })}
              </tr>
            ))}
          </thead>
          <tbody>
            {isLoading &&
              Array.from({ length: Math.min(pageSize, 5) }).map((_, index) => (
                <tr
                  key={index}
                  className="h-[52px] border-b border-border-light"
                >
                  {selectableColumns.map((_, columnIndex) => (
                    <td key={columnIndex} className="px-4">
                      <div className="h-3 rounded-full bg-bg-secondary animate-pulse" />
                    </td>
                  ))}
                </tr>
              ))}
            {!isLoading &&
              visibleRows.map((row) => (
                <tr
                  key={row.id}
                  onClick={() => onRowClick?.(row.original)}
                  className={cn(
                    "h-[52px] border-b border-border-light transition last:border-b-0",
                    onRowClick && "cursor-pointer hover:bg-primary-subtle",
                  )}
                >
                  {row.getVisibleCells().map((cell) => (
                    <td
                      key={cell.id}
                      className="px-4 text-sm text-text-primary"
                    >
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </td>
                  ))}
                </tr>
              ))}
          </tbody>
        </table>
      </div>
      {!isLoading && visibleRows.length === 0 && (
        <EmptyState message={emptyMessage} className="m-4" />
      )}
      {pageCount > 1 && (
        <div className="flex items-center justify-between gap-3 border-t border-border px-4 py-3 text-caption text-text-muted">
          <span>
            Showing {start}-{end} of {count}
          </span>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
              className="flex h-8 w-8 items-center justify-center rounded-md border border-border bg-bg-canvas transition-colors duration-150 hover:border-primary hover:bg-bg-secondary disabled:opacity-40"
              aria-label="Previous page"
            >
              <ArrowLeft className="h-4 w-4" aria-hidden />
            </button>
            <span className="px-2 font-medium text-text-primary">
              {page} / {pageCount}
            </span>
            <button
              type="button"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
              className="flex h-8 w-8 items-center justify-center rounded-md border border-border bg-bg-canvas transition-colors duration-150 hover:border-primary hover:bg-bg-secondary disabled:opacity-40"
              aria-label="Next page"
            >
              <ArrowRight className="h-4 w-4" aria-hidden />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
