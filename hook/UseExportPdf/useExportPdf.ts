// hooks/useExportPdf.ts
import { useCallback } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// Extend jsPDF type to include autoTable
declare module 'jspdf' {
  interface jsPDF {
    lastAutoTable: {
      finalY: number;
    };
  }
}

export interface ExportColumn {
  header: string;
  accessorKey: string;
  formatter?: (value: any) => string;
}

export interface ExportPdfOptions {
  filename?: string;
  title?: string;
  orientation?: 'portrait' | 'landscape';
  pageSize?: 'a4' | 'a3' | 'letter';
  columns: ExportColumn[];
  data: any[];
  showSerialNumber?: boolean;
  serialNumberHeader?: string;
  projectName?: string;
  exportDate?: boolean;
  showTotalCount?: boolean;
  searchQuery?: string;
  userRole?: string;
}

export const useExportPdf = () => {
  const exportToPdf = useCallback((options: ExportPdfOptions) => {
    const {
      filename = 'export.pdf',
      title = 'Data Export',
      orientation = 'landscape',
      pageSize = 'a4',
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
      // Initialize jsPDF
      const doc = new jsPDF({
        orientation,
        unit: 'mm',
        format: pageSize,
      });

      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      let yPosition = 20;

      // Color theme - Only Purple #9A65C2
      const primaryColor = [154, 101, 194]; // #9A65C2
      const headerBgColor = [154, 101, 194]; // #9A65C2 for table header too
      const altRowColor = [255, 255, 255]; // White

        // Tiny rounded logo box (6x6) with project color background
        doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]); // fill with project purple

        // Draw rounded rectangle (6x6)
        doc.roundedRect(15, 14, 6, 6, 1.5, 1.5, 'F');  // fill

        // Black border
        doc.setDrawColor(0, 0, 0);
        doc.setLineWidth(0.6);
        doc.roundedRect(15, 14, 6, 6, 1.5, 1.5, 'S');  // stroke

        // Project name — MOVE CLOSER to logo
        doc.setFontSize(18);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(0, 0, 0);

        // Changed X: from 35 → 25 (moves text closer to box)
        doc.text(projectName, 25, 20);


      // Add generation date on the right
      if (exportDate) {
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        const dateStr = `Generated: ${new Date().toLocaleDateString('en-GB', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
        })}`;
        doc.text(dateStr, pageWidth - 15, 20, { align: 'right' });
      }

      yPosition = 32;

      // Add report title
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(0, 0, 0); // Black text
      doc.text(title, 15, yPosition);
      yPosition += 10;

      // Add metadata section
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');

        if (showTotalCount) {
        doc.text(`Total: ${data.length} records`, 15, yPosition);
        yPosition += 3;
        }

        if (searchQuery) {
        doc.text(`Search: ${searchQuery}`, 15, yPosition);
        yPosition += 3;
        }

        if (userRole) {
        doc.text(`Role: ${userRole}`, 15, yPosition);
        yPosition += 3;
        }

        yPosition += 2;  



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

      // Generate table using autoTable
      autoTable(doc, {
        head: [tableHeaders],
        body: tableBody,
        startY: yPosition,
        theme: 'grid',
        styles: {
          fontSize: 9,
          cellPadding: 2,
          overflow: 'linebreak',
          halign: 'center',
          valign: 'middle',
          lineColor: [200, 200, 200],
          lineWidth: 0.1,
        },
        headStyles: {
          fillColor: headerBgColor, // Purple header
          textColor: [255, 255, 255], // White text
          fontStyle: 'bold',
          halign: 'center',
          fontSize: 8,
        },
        alternateRowStyles: {
          fillColor: altRowColor, // White rows (no alternating color)
        },
        columnStyles: showSerialNumber
          ? {
              0: { cellWidth: 20, halign: 'center' }, 
            }
          : {},
        margin: { top: 15, left: 15, right: 15, bottom: 20 },
        didDrawPage: (data) => {
          // Footer with page numbers
          const pageCount = (doc as any).internal.getNumberOfPages();
          const currentPage = (doc as any).internal.getCurrentPageInfo().pageNumber;
          
          // Add footer line
          doc.setDrawColor(200, 200, 200);
          doc.line(15, pageHeight - 15, pageWidth - 15, pageHeight - 15);
          
          doc.setFontSize(9);
          doc.setFont('helvetica', 'normal');
          doc.setTextColor(100, 100, 100);
          
          // Page number on right
          doc.text(
            `Page ${currentPage} of ${pageCount}`,
            pageWidth - 15,
            pageHeight - 10,
            { align: 'right' }
          );
          
          // Project name on left
          doc.text(projectName, 15, pageHeight - 10);
        },
      });

      // Save the PDF
      doc.save(filename.endsWith('.pdf') ? filename : `${filename}.pdf`);

      return { success: true, message: 'PDF exported successfully' };
    } catch (error) {
      console.error('Error exporting PDF:', error);
      return { success: false, message: 'Failed to export PDF', error };
    }
  }, []);

  return { exportToPdf };
};

// Example usage helper for common scenarios
export const createStateExportConfig = (
  states: any[],
  title: string = 'States Management Report'
): ExportPdfOptions => ({
  filename: `states-report-${Date.now()}.pdf`,
  title,
  orientation: 'landscape',
  columns: [
    { header: 'Country Name', accessorKey: 'country_name' },
    { header: 'State Name', accessorKey: 'state_name' },
    { 
      header: 'Status', 
      accessorKey: 'status',
      formatter: (value) => value === 'Yes' ? 'Active' : 'Inactive'
    },
  ],
  data: states,
  showSerialNumber: true,
  projectName: 'E-Police',
  exportDate: true,
  showTotalCount: true,
});