"use client";

import React, { useState, useMemo, useCallback } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  flexRender,
  ColumnDef,
  PaginationState,
  SortingState,
  VisibilityState,
} from "@tanstack/react-table";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";

// ============================================
// INLINE UI COMPONENTS
// ============================================

const Table = React.forwardRef<HTMLTableElement, React.HTMLAttributes<HTMLTableElement>>(
  ({ className, ...props }, ref) => (
    <table
      ref={ref}
      className={`w-full caption-bottom text-sm border-collapse ${className || ""}`}
      {...props}
    />
  )
);
Table.displayName = "Table";

const TableHeader = React.forwardRef<HTMLTableSectionElement, React.HTMLAttributes<HTMLTableSectionElement>>(
  ({ className, ...props }, ref) => (
    <thead ref={ref} className={`${className || ""}`} {...props} />
  )
);
TableHeader.displayName = "TableHeader";

const TableBody = React.forwardRef<HTMLTableSectionElement, React.HTMLAttributes<HTMLTableSectionElement>>(
  ({ className, ...props }, ref) => (
    <tbody ref={ref} className={`${className || ""}`} {...props} />
  )
);
TableBody.displayName = "TableBody";

const TableRow = React.forwardRef<HTMLTableRowElement, React.HTMLAttributes<HTMLTableRowElement>>(
  ({ className, ...props }, ref) => (
    <tr
      ref={ref}
      className={`transition-colors ${className || ""}`}
      style={{ borderBottom: "1px solid #e5e7eb" }}
      {...props}
    />
  )
);
TableRow.displayName = "TableRow";

const TableHead = React.forwardRef<HTMLTableCellElement, React.ThHTMLAttributes<HTMLTableCellElement>>(
  ({ className, ...props }, ref) => (
    <th
      ref={ref}
      className={`h-12 px-4 text-left align-middle font-medium ${className || ""}`}
      {...props}
    />
  )
);
TableHead.displayName = "TableHead";

const TableCell = React.forwardRef<HTMLTableCellElement, React.TdHTMLAttributes<HTMLTableCellElement>>(
  ({ className, ...props }, ref) => (
    <td
      ref={ref}
      className={`p-4 align-middle ${className || ""}`}
      {...props}
    />
  )
);
TableCell.displayName = "TableCell";

const Skeleton = ({ className }: { className?: string }) => (
  <div className={`animate-pulse rounded-md bg-gray-200 ${className || ""}`} />
);

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "outline" | "ghost";
  size?: "default" | "sm" | "lg";
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "default", disabled, ...props }, ref) => {
    const base =
      "inline-flex items-center justify-center rounded-md font-medium transition-colors focus:outline-none disabled:opacity-50 disabled:pointer-events-none";
    const variants = {
      default: "bg-blue-600 text-white hover:bg-blue-700",
      outline: "border border-gray-200 bg-white hover:bg-gray-50 text-black",
      ghost: "hover:bg-gray-100",
    };
    const sizes = {
      default: "h-10 px-4 py-2",
      sm: "h-8 px-3 text-sm",
      lg: "h-12 px-6",
    };
    return (
      <button
        ref={ref}
        className={`${base} ${variants[variant]} ${sizes[size]} ${className || ""}`}
        disabled={disabled}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

interface SelectProps {
  value: string;
  onValueChange: (v: string) => void;
  children: React.ReactNode;
}

const SelectContext = React.createContext<{
  value: string;
  onValueChange: (v: string) => void;
  open: boolean;
  setOpen: (o: boolean) => void;
} | null>(null);

const Select = ({ value, onValueChange, children }: SelectProps) => {
  const [open, setOpen] = useState(false);

  const contextValue = useMemo(
    () => ({
      value,
      onValueChange,
      open,
      setOpen,
    }),
    [value, onValueChange, open]
  );

  return (
    <SelectContext.Provider value={contextValue}>
      <div className="relative">{children}</div>
    </SelectContext.Provider>
  );
};

const SelectTrigger = React.forwardRef<HTMLButtonElement, React.ButtonHTMLAttributes<HTMLButtonElement>>(
  ({ className, children, ...props }, ref) => {
    const ctx = React.useContext(SelectContext);

    const handleClick = useCallback(() => {
      if (!ctx) return;
      ctx.setOpen(!ctx.open);
    }, [ctx]);

    return (
      <button
        ref={ref}
        className={`flex items-center justify-between rounded-md border border-gray-200 bg-white px-3 py-2 text-sm text-black focus:outline-none hover:bg-gray-50 ${className || ""}`}
        onClick={handleClick}
        {...props}
      >
        {children}
        <svg className="h-4 w-4 ml-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
    );
  }
);
SelectTrigger.displayName = "SelectTrigger";

const SelectValue = ({ placeholder }: { placeholder?: string }) => {
  const ctx = React.useContext(SelectContext);
  return <span className="text-black">{ctx?.value || placeholder}</span>;
};

const SelectContent = ({ children, side }: { children: React.ReactNode; side?: string }) => {
  const ctx = React.useContext(SelectContext);

  if (!ctx?.open) return null;

  return (
    <div
      className={`absolute z-50 min-w-[8rem] rounded-md border border-gray-200 bg-white shadow-lg ${
        side === "top" ? "bottom-full mb-1" : "top-full mt-1"
      }`}
    >
      <div className="p-1">{children}</div>
    </div>
  );
};

const SelectItem = ({ value, children }: { value: string; children: React.ReactNode }) => {
  const ctx = React.useContext(SelectContext);

  const handleClick = useCallback(() => {
    if (!ctx) return;
    ctx.onValueChange(value);
    ctx.setOpen(false);
  }, [ctx, value]);

  return (
    <div
      className={`flex cursor-pointer items-center rounded-sm px-2 py-1.5 text-sm text-black hover:bg-gray-100 ${
        ctx?.value === value ? "bg-gray-100" : ""
      }`}
      onClick={handleClick}
    >
      {children}
    </div>
  );
};

// ============================================
// TYPES & INTERFACES
// ============================================

export type { ColumnDef, SortingState, PaginationState };
export type TextWrapOption = "wrap" | "nowrap" | "ellipsis" | "break-word" | "break-all";

export interface ColumnWrapConfig {
  wrap?: TextWrapOption;
  maxWidth?: string;
  minWidth?: string;
}

export interface DataTableProps<T> {
  data: T[];
  columns: ColumnDef<T>[];
  pagination?: PaginationState;
  totalCount: number;
  loading?: boolean;
  onPaginationChange?: (pagination: PaginationState) => void;
  onSortingChange?: (sorting: SortingState) => void;
  sorting?: SortingState;
  emptyMessage?: string;
  pageSizeOptions?: number[];
  enableSorting?: boolean;
  manualSorting?: boolean;
  manualPagination?: boolean;
  showSerialNumber?: boolean;
  serialNumberHeader?: string;
  maxHeight?: string;
  columnVisibility?: VisibilityState;
  onColumnVisibilityChange?: (visibility: VisibilityState) => void;
  onRowClick?: (row: T) => void;
  enableRowClick?: boolean;
  defaultTextWrap?: TextWrapOption;
  enableColumnWrapping?: boolean;
  selectedRowId?: number | string | null;
  getRowId?: (row: T & { id?: string | number }) => number | string;
  headerBgColor?: string;
  headerTextColor?: string;
}

// ============================================
// MAIN COMPONENT
// ============================================

export function CustomTable<T extends object>(
{
  data,
  columns,
  pagination: externalPagination,
  totalCount,
  loading = false,
  onPaginationChange,
  onSortingChange,
  sorting = [],
  emptyMessage = "No data available",
  pageSizeOptions = [10, 20, 30, 40, 50],
  enableSorting = true,
  manualSorting = true,
  manualPagination = true,
  showSerialNumber = true,
  serialNumberHeader = "S.NO.",
  maxHeight = "600px",
  columnVisibility,
  onColumnVisibilityChange,
  onRowClick,
  enableRowClick = true,
  defaultTextWrap = "nowrap",
  enableColumnWrapping = true,
  selectedRowId = null,
  getRowId = (row: T) =>
  (row as any).id ??
  (row as any).deviceId ??
  (row as any).key ??
  Math.random().toString(36);
  headerBgColor = "#E0E7FD",
  headerTextColor = "#000000",
}: DataTableProps<T>) {
  const defaultPagination: PaginationState = { pageIndex: 0, pageSize: 10 };
  const pagination = externalPagination ?? defaultPagination;

  const totalPages = useMemo(
    () => Math.ceil(totalCount / pagination.pageSize) || 1,
    [totalCount, pagination.pageSize]
  );

  const showingStart = useMemo(
    () => Math.min(pagination.pageIndex * pagination.pageSize + 1, totalCount),
    [pagination.pageIndex, pagination.pageSize, totalCount]
  );

  const showingEnd = useMemo(
    () => Math.min((pagination.pageIndex + 1) * pagination.pageSize, totalCount),
    [pagination.pageIndex, pagination.pageSize, totalCount]
  );

  const hasNext = pagination.pageIndex < totalPages - 1;
  const hasPrev = pagination.pageIndex > 0;

  const getWrapClasses = useCallback((opt: TextWrapOption): string => {
    const base = "leading-relaxed";
    switch (opt) {
      case "wrap":
        return `${base} whitespace-normal break-words`;
      case "nowrap":
        return `${base} whitespace-nowrap`;
      case "ellipsis":
        return `${base} whitespace-nowrap overflow-hidden text-ellipsis`;
      case "break-word":
        return `${base} whitespace-normal break-words`;
      case "break-all":
        return `${base} whitespace-normal break-all`;
      default:
        return `${base} whitespace-nowrap`;
    }
  }, []);

  const getWrapStyles = useCallback((cfg?: ColumnWrapConfig): React.CSSProperties => {
    if (!cfg) return {};
    return {
      maxWidth: cfg.maxWidth,
      minWidth: cfg.minWidth,
      width: cfg.maxWidth || cfg.minWidth,
    };
  }, []);

  const serialNumberColumn: ColumnDef<T> = useMemo(
    () => ({
      id: "serialNumber",
      header: serialNumberHeader,
      cell: ({ row }) => (
        <div className="text-center font-medium text-black">
          {pagination.pageIndex * pagination.pageSize + row.index + 1}
        </div>
      ),
      enableSorting: false,
      enableHiding: false,
      size: 80,
      meta: { wrapConfig: { wrap: "nowrap" } },
    }),
    [pagination.pageIndex, pagination.pageSize, serialNumberHeader]
  );

  const [internalColVis, setInternalColVis] = useState<VisibilityState>({});
  const currentColVis = columnVisibility ?? internalColVis;

  const handleColVisChange = useCallback(
    (visibility: VisibilityState) => {
      if (onColumnVisibilityChange) {
        onColumnVisibilityChange(visibility);
      } else {
        setInternalColVis(visibility);
      }
    },
    [onColumnVisibilityChange]
  );

  const tableColumns = useMemo(
    () => (showSerialNumber ? [serialNumberColumn, ...columns] : columns),
    [showSerialNumber, serialNumberColumn, columns]
  );

  const goToPage = useCallback(
    (idx: number) => {
      if (!onPaginationChange) return;
      onPaginationChange({
        ...pagination,
        pageIndex: Math.max(0, Math.min(idx, totalPages - 1)),
      });
    },
    [onPaginationChange, pagination, totalPages]
  );

  const changePageSize = useCallback(
    (size: string) => {
      if (!onPaginationChange) return;
      onPaginationChange({
        pageIndex: 0,
        pageSize: parseInt(size),
      });
    },
    [onPaginationChange]
  );

  const isExpandedRow = useCallback(
    (row: T) =>
      (row as any).isLoading || (row as any).isDetailTable || (row as any).isEmpty,
    []
  );

  const handleRowClick = useCallback(
    (row: any, e: React.MouseEvent) => {
      if ((e.target as HTMLElement).closest("button, a, input, select, [role='button']")) return;
      if (enableRowClick && onRowClick && !isExpandedRow(row.original)) {
        onRowClick(row.original);
      }
    },
    [enableRowClick, onRowClick, isExpandedRow]
  );

  const table = useReactTable({
    data,
    columns: tableColumns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    manualSorting,
    manualPagination,
    enableSorting,
    state: {
      sorting,
      pagination,
      columnVisibility: currentColVis,
    },
    onSortingChange,
    onPaginationChange,
    onColumnVisibilityChange: handleColVisChange,
    pageCount: totalPages,
  });

  const tableElement = useMemo(
    () => (
      <div className="space-y-4">
        <div
          className="rounded-xl overflow-hidden bg-white shadow-sm"
          style={{ border: "1px solid #A5A5A5" }}
        >
          <div className="overflow-x-auto overflow-y-auto" style={{ maxHeight }}>
            <Table>
              <TableHeader>
                {table.getHeaderGroups().map((hg) => (
                  <TableRow
                    key={hg.id}
                    style={{
                      backgroundColor: headerBgColor,
                      borderBottom: "2px solid #e5e7eb",
                    }}
                  >
                    {hg.headers.map((h) => (
                      <TableHead
                        key={h.id}
                        className="px-4 py-4 text-xs sm:text-sm font-semibold uppercase tracking-wider"
                        style={{
                          backgroundColor: headerBgColor,
                          color: headerTextColor,
                          width: h.id === "serialNumber" ? "80px" : "auto",
                          minWidth: h.id === "serialNumber" ? "80px" : "120px",
                          borderRight: "1px solid rgba(0,0,0,0.08)",
                        }}
                      >
                        {h.isPlaceholder ? null : (
                          <div
                            className={`flex items-center justify-center gap-2 w-full ${
                              h.column.getCanSort()
                                ? "cursor-pointer select-none hover:opacity-80"
                                : ""
                            }`}
                            onClick={h.column.getToggleSortingHandler()}
                          >
                            <span className="truncate">
                              {flexRender(h.column.columnDef.header, h.getContext())}
                            </span>
                          </div>
                        )}
                      </TableHead>
                    ))}
                  </TableRow>
                ))}
              </TableHeader>

              {loading ? (
                <TableBody>
                  {Array.from({ length: pagination.pageSize }).map((_, i) => (
                    <TableRow key={i} style={{ borderBottom: "1px solid #f3f4f6" }}>
                      {tableColumns.map((_, j) => (
                        <TableCell key={j} className="px-4 py-4">
                          <Skeleton className="h-4 w-full" />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              ) : (
                <TableBody>
                  {table.getRowModel().rows?.length ? (
                    table.getRowModel().rows.map((row, rowIndex) => {
                      const rowData = row.original;

                      if (isExpandedRow(rowData)) {
                        return (
                          <TableRow
                            key={row.id}
                            style={{ borderBottom: "1px solid #f3f4f6" }}
                            className="hover:bg-gray-50"
                          >
                            <TableCell colSpan={tableColumns.length} className="p-0">
                              <div className="w-full">
                                {(() => {
                                  const c = row
                                    .getVisibleCells()
                                    .find((c) => c.column.id === "vehicleNumber");
                                  return c
                                    ? flexRender(c.column.columnDef.cell, c.getContext())
                                    : null;
                                })()}
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      }

                      const rowId = getRowId(rowData);
                      const isSelected =
                        selectedRowId !== null && rowId === selectedRowId;
                      const isLastRow =
                        rowIndex === table.getRowModel().rows.length - 1;

                      return (
                        <TableRow
                          key={row.id}
                          className={`transition-colors hover:bg-gray-50 ${
                            enableRowClick && onRowClick ? "cursor-pointer" : ""
                          } ${isSelected ? "bg-blue-50" : "bg-white"}`}
                          style={{
                            borderBottom: isLastRow
                              ? "none"
                              : "1px solid #f3f4f6",
                          }}
                          onClick={(e) => handleRowClick(row, e)}
                          data-selected={isSelected}
                          data-row-id={rowId}
                        >
                          {row.getVisibleCells().map((cell) => {
                            const wrapCfg = enableColumnWrapping
                              ? (cell.column.columnDef.meta as any)?.wrapConfig
                              : undefined;

                            return (
                              <TableCell
                                key={cell.id}
                                className="px-4 py-4 text-xs sm:text-sm text-center text-black"
                                style={{
                                  width:
                                    cell.column.id === "serialNumber"
                                      ? "80px"
                                      : "auto",
                                  minWidth:
                                    cell.column.id === "serialNumber"
                                      ? "80px"
                                      : "auto",
                                  borderRight:
                                    "1px solid rgba(0,0,0,0.04)",
                                  ...getWrapStyles(wrapCfg),
                                }}
                              >
                                <div
                                  className={`w-full ${getWrapClasses(
                                    wrapCfg?.wrap || defaultTextWrap
                                  )}`}
                                >
                                  {flexRender(
                                    cell.column.columnDef.cell,
                                    cell.getContext()
                                  )}
                                </div>
                              </TableCell>
                            );
                          })}
                        </TableRow>
                      );
                    })
                  ) : (
                    <TableRow>
                      <TableCell
                        colSpan={tableColumns.length}
                        className="text-center py-12 text-black"
                      >
                        {emptyMessage}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              )}
            </Table>
          </div>

          <div
            className="flex flex-col md:flex-row items-center justify-between px-4 py-3 bg-white"
            style={{ borderTop: "1px solid #e5e7eb" }}
          >
            <div className="text-sm text-black">
              Showing <span className="font-medium">{showingStart}</span> to{" "}
              <span className="font-medium">{showingEnd}</span> of{" "}
              <span className="font-medium">{totalCount}</span> results
            </div>

            <div className="flex items-center gap-6 mt-3 md:mt-0">
              <div className="flex items-center gap-2">
                <span className="text-sm text-black">Rows per page:</span>
                <Select
                  value={pagination.pageSize.toString()}
                  onValueChange={changePageSize}
                >
                  <SelectTrigger className="h-8 w-[70px] rounded-md">
                    <SelectValue placeholder={pagination.pageSize.toString()} />
                  </SelectTrigger>
                  <SelectContent side="top">
                    {pageSizeOptions.map((s) => (
                      <SelectItem key={s} value={s.toString()}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => goToPage(0)}
                  disabled={!hasPrev}
                  className="h-10 w-10 p-0 rounded-md"
                >
                  <ChevronsLeft className="h-5 w-5" />
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => goToPage(pagination.pageIndex - 1)}
                  disabled={!hasPrev}
                  className="h-10 w-10 p-0 rounded-md"
                >
                  <ChevronLeft className="h-5 w-5" />
                </Button>

                <span className="text-sm text-black px-2">
                  Page{" "}
                  <span className="font-medium">
                    {pagination.pageIndex + 1}
                  </span>{" "}
                  of <span className="font-medium">{totalPages}</span>
                </span>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => goToPage(pagination.pageIndex + 1)}
                  disabled={!hasNext}
                  className="h-10 w-10 p-0 rounded-md"
                >
                  <ChevronRight className="h-5 w-5" />
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => goToPage(totalPages - 1)}
                  disabled={!hasNext}
                  className="h-10 w-10 p-0 rounded-md"
                >
                  <ChevronsRight className="h-5 w-5" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    ),
    [
      table,
      loading,
      pagination,
      tableColumns,
      isExpandedRow,
      getRowId,
      selectedRowId,
      enableRowClick,
      onRowClick,
      enableColumnWrapping,
      getWrapStyles,
      getWrapClasses,
      defaultTextWrap,
      headerBgColor,
      headerTextColor,
      maxHeight,
      showingStart,
      showingEnd,
      totalCount,
      pageSizeOptions,
      changePageSize,
      goToPage,
      hasPrev,
      hasNext,
      totalPages,
    ]
  );

  return {
    table,
    tableElement,
  };
}

export default CustomTable;
