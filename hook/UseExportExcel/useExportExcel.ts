// hooks/useExportExcel.ts
import { useCallback } from 'react';
import * as XLSX from 'xlsx';

export interface ExcelColumn {
  header: string;
  accessorKey: string;
  formatter?: (value: any) => string;
}

export interface ExportExcelOptions {
  filename?: string;
  sheetName?: string;
  title?: string;
  columns: ExcelColumn[];
  data: any[];
  showSerialNumber?: boolean;
  serialNumberHeader?: string;
  projectName?: string;
  exportDate?: boolean;
  showTotalCount?: boolean;
  searchQuery?: string;
  userRole?: string;
}

export const useExportExcel = () => {
  const exportToExcel = useCallback((options: ExportExcelOptions) => {
    const {
      filename = 'export.xlsx',
      sheetName = 'Sheet1',
      title = 'Data Export',
      columns,
      data,
      showSerialNumber = true,
      serialNumberHeader = 'S.NO.',
      projectName = 'E-Police',
      exportDate = true,
      showTotalCount = true,
      searchQuery,
      userRole,
    } = options;

    try {
      // Create a new workbook
      const workbook = XLSX.utils.book_new();

      // Prepare metadata rows
      const metadataRows: any[] = [];

      // Add title
      metadataRows.push([title]);
      metadataRows.push([]); // Empty row

      // Add metadata information
      if (showTotalCount) {
        metadataRows.push([`Total Records: ${data.length}`]);
      }

      if (searchQuery) {
        metadataRows.push([`Search: ${searchQuery}`]);
      }

      if (userRole) {
        metadataRows.push([`Role: ${userRole}`]);
      }

      if (exportDate) {
        const dateStr = new Date().toLocaleDateString('en-GB', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
        });
        metadataRows.push([`Generated: ${dateStr}`]);
      }

      metadataRows.push([`Project: ${projectName}`]);
      metadataRows.push([]); // Empty row before table

      // Prepare table headers
      const tableHeaders = showSerialNumber
        ? [serialNumberHeader, ...columns.map(col => col.header)]
        : columns.map(col => col.header);

      // Prepare table body with proper data extraction
      const tableBody = data.map((row, index) => {
        const rowData = columns.map(col => {
          const value = row[col.accessorKey];

          // Handle empty or null values
          if (value === null || value === undefined || value === '') {
            return '--';
          }

          // Use formatter if provided
          if (col.formatter) {
            return col.formatter(value);
          }

          return value;
        });

        return showSerialNumber ? [index + 1, ...rowData] : rowData;
      });

      // Combine metadata and table data
      const worksheetData = [...metadataRows, tableHeaders, ...tableBody];

      // Create worksheet
      const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);

      // Set column widths
      const colWidths = tableHeaders.map((header: string) => ({
        wch: Math.max(header.length + 2, 12),
      }));
      worksheet['!cols'] = colWidths;

      // Style the title row (first row)
      const titleCellRef = XLSX.utils.encode_cell({ r: 0, c: 0 });
      if (!worksheet[titleCellRef]) worksheet[titleCellRef] = {};
      worksheet[titleCellRef].s = {
        font: { bold: true, size: 16, color: { rgb: '9A65C2' } },
      };

      // Style the header row (table headers)
      const headerRowIndex = metadataRows.length;
      for (let i = 0; i < tableHeaders.length; i++) {
        const cellRef = XLSX.utils.encode_cell({ r: headerRowIndex, c: i });
        if (!worksheet[cellRef]) worksheet[cellRef] = {};
        worksheet[cellRef].s = {
          font: { bold: true, color: { rgb: 'FFFFFF' } },
          fill: { fgColor: { rgb: '9A65C2' } },
          alignment: { horizontal: 'center', vertical: 'center' },
        };
      }

      // Alternate row colors for data rows
      const dataStartRow = headerRowIndex + 1;
      for (let i = 0; i < tableBody.length; i++) {
        const rowIndex = dataStartRow + i;
        for (let j = 0; j < tableHeaders.length; j++) {
          const cellRef = XLSX.utils.encode_cell({ r: rowIndex, c: j });
          if (!worksheet[cellRef]) worksheet[cellRef] = {};

          // Alternate row colors
          if (i % 2 === 0) {
            worksheet[cellRef].s = {
              fill: { fgColor: { rgb: 'F5F5F5' } },
              alignment: { horizontal: 'center', vertical: 'middle' },
            };
          } else {
            worksheet[cellRef].s = {
              fill: { fgColor: { rgb: 'FFFFFF' } },
              alignment: { horizontal: 'center', vertical: 'middle' },
            };
          }
        }
      }

      // Add the worksheet to the workbook
      XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

      // Generate filename with timestamp if not provided
      const finalFilename = filename.endsWith('.xlsx') 
        ? filename 
        : `${filename}.xlsx`;

      // Save the file
      XLSX.writeFile(workbook, finalFilename);

      return { success: true, message: 'Excel exported successfully' };
    } catch (error) {
      console.error('Error exporting Excel:', error);
      return { success: false, message: 'Failed to export Excel', error };
    }
  }, []);

  return { exportToExcel };
};

// Example usage helper for common scenarios
export const createDistrictExcelConfig = (
  districts: any[],
  title: string = 'Districts Management Report'
): ExportExcelOptions => ({
  filename: `districts-report-${new Date()
    .toLocaleDateString('en-GB')
    .replace(/\//g, '-')}.xlsx`,
  sheetName: 'Districts',
  title,
  columns: [
    { header: 'District Name', accessorKey: 'district_name' },
    { header: 'Country', accessorKey: 'country_name' },
    { header: 'State', accessorKey: 'state_name' },
    { header: 'Distance (km)', accessorKey: 'min_distance' },
    {
      header: 'Status',
      accessorKey: 'status',
      formatter: (value) => (value === 'Active' ? 'Active' : 'Inactive'),
    },
  ],
  data: districts,
  showSerialNumber: true,
  serialNumberHeader: 'S.NO.',
  projectName: 'E-Police',
  exportDate: true,
  showTotalCount: true,
});