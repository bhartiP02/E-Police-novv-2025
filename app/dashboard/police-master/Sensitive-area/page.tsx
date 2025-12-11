// File: @/app/sensitive-areas/page.tsx
"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  CustomTable,
  ColumnDef,
  PaginationState,
  SortingState,
} from "@/component/ui/Table/CustomTable";
import AddSection, { FieldConfig } from "@/component/ui/add-section/add-section";
import { api } from "@/services/api/apiServices";
import SearchComponent from "@/component/ui/SearchBar/searchBar";
import { ExportButtons } from "@/component/ui/Export-Buttons/export-Buttons";
import { ColumnVisibilitySelector } from "@/component/ui/Column-Visibility/column-visibility";
import { AlertPopover, Toast } from "@/component/ui/AlertPopover";
import EditModal from "@/component/ui/EditModal/editModal";
import { useExportPdf, ExportPdfOptions } from "@/hook/UseExportPdf/useExportPdf";
import { useExportExcel, ExportExcelOptions } from "@/hook/UseExportExcel/useExportExcel";
import { QrCode, MapPin, Eye, Printer, Download, Image as ImageIcon } from "lucide-react";
import { SensitiveAreaPrint } from "@/component/ui/SensitiveAreaPrint/SensitiveAreaPrint";
import ExcelUpload from "@/component/ui/SensitiveAreaExcelUpload/ExcelUpload";

interface SensitiveAreaRow {
  id: number;
  address: string;
  latitude: string;
  longitude: string;
  image: string;
  qrcode: string;
  image_url: string;
  qrcode_url: string;
  police_station_name?: string;
  district_name?: string;
  status?: string;
  district_id?: number;
  police_station_id?: number;
}

interface District {
  id: number;
  district_name: string;
}

interface PoliceStation {
  id: number;
  police_station_name: string;
  name?: string;
  district_id?: number;
}

interface DropdownState {
  districts: District[];
  policeStations: PoliceStation[];
  selectedDistrict: string;
  selectedPoliceStation: string;
  isLoadingDistricts: boolean;
  isLoadingPoliceStations: boolean;
}

export default function SensitiveAreaPage() {
  const router = useRouter();
  const [sensitiveAreas, setSensitiveAreas] = useState<SensitiveAreaRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingSensitiveArea, setEditingSensitiveArea] = useState<SensitiveAreaRow | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoadingAreaDetail, setIsLoadingAreaDetail] = useState(false);
  const [isPrintOpen, setIsPrintOpen] = useState(false);
  const [printingData, setPrintingData] = useState<SensitiveAreaRow | null>(null);
  const [toast, setToast] = useState({
    isVisible: false,
    message: "",
    type: "success" as "success" | "error",
  });

  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });
  const [sorting, setSorting] = useState<SortingState>([]);
  const [totalCount, setTotalCount] = useState(0);
  const { exportToPdf } = useExportPdf();
  const { exportToExcel } = useExportExcel();

  const BASE_URL = "http://104.251.216.83:4000";

  const [addDropdowns, setAddDropdowns] = useState<DropdownState>({
    districts: [],
    policeStations: [],
    selectedDistrict: "",
    selectedPoliceStation: "",
    isLoadingDistricts: false,
    isLoadingPoliceStations: false,
  });

  const [downloadDropdowns, setDownloadDropdowns] = useState<DropdownState>({
    districts: [],
    policeStations: [],
    selectedDistrict: "",
    selectedPoliceStation: "",
    isLoadingDistricts: false,
    isLoadingPoliceStations: false,
  });

  const [editDropdowns, setEditDropdowns] = useState<DropdownState>({
    districts: [],
    policeStations: [],
    selectedDistrict: "",
    selectedPoliceStation: "",
    isLoadingDistricts: false,
    isLoadingPoliceStations: false,
  });

  const constructImageUrl = useCallback((url: string): string => {
    if (!url) return "";
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url;
    }
    let cleanedUrl = url;
    if (cleanedUrl.includes('/uploads/qrcodes//uploads/qrcodes/')) {
      cleanedUrl = cleanedUrl.replace('/uploads/qrcodes//uploads/qrcodes/', '/uploads/qrcodes/');
    }
    if (cleanedUrl.includes('//uploads/')) {
      cleanedUrl = cleanedUrl.replace('//uploads/', '/uploads/');
    }
    if (!cleanedUrl.startsWith('/')) {
      cleanedUrl = '/' + cleanedUrl;
    }
    return `${BASE_URL}${cleanedUrl}`;
  }, [BASE_URL]);

  const extractQrCodeFromImagePath = useCallback((imagePath: string): string => {
    if (!imagePath) return "";
    const fileName = imagePath.split('/').pop() || "";
    let qrCode = fileName.replace('sensitive_area_', '').replace('.png', '');
    return qrCode || "";
  }, []);

  const showToast = useCallback((message: string, type: "success" | "error") => {
    setToast({ isVisible: true, message, type });
    setTimeout(() => {
      setToast({ isVisible: false, message: "", type: "success" });
    }, 3000);
  }, []);

  const fetchDistrictsList = useCallback(async (): Promise<District[]> => {
    try {
      const resp = await api.get("/districts");
      const districtsData = resp?.data?.data || resp?.data || resp || [];
      return Array.isArray(districtsData) ? districtsData : [];
    } catch (error) {
      console.error("Error fetching districts:", error);
      showToast("Failed to fetch districts", "error");
      return [];
    }
  }, [showToast]);

  const fetchPoliceStationsByDistrict = useCallback(async (districtId: string): Promise<PoliceStation[]> => {
    if (!districtId) return [];
    try {
      const resp = await api.get(`/police-stations/by-district/${districtId}`);
      const stationsData = resp?.data?.data || resp?.data || resp || [];
      return Array.isArray(stationsData) ? stationsData : [];
    } catch (error) {
      console.error("Error fetching police stations:", error);
      showToast("Failed to fetch police stations", "error");
      return [];
    }
  }, [showToast]);

  const fetchSensitiveAreas = useCallback(
    async (pageIndex: number, pageSize: number, search: string) => {
      try {
        setLoading(true);
        let url = `/sensitive-areas?page=${pageIndex + 1}&limit=${pageSize}`;
        if (search.trim()) {
          url += `&search=${encodeURIComponent(search.trim())}`;
        }
        const response = await api.get(url);
        const dataBlock = response?.data?.data || response?.data?.result || response?.data || response;
        const rows = Array.isArray(dataBlock?.data) ? dataBlock.data : Array.isArray(dataBlock) ? dataBlock : [];

        const validatedRows: SensitiveAreaRow[] = rows.map((area: any) => {
          let status = "Active";
          if (!area.latitude || !area.longitude || area.latitude === "0" || area.longitude === "0") {
            status = "Incomplete";
          }
          const qrcodeUrl = constructImageUrl(area.qrcode_url || area.image || "");
          const imageUrl = constructImageUrl(area.image_url || area.image || "");
          const qrCodeValue = extractQrCodeFromImagePath(area.image || "");

          return {
            id: area.id,
            address: area.address || "",
            latitude: area.latitude || "",
            longitude: area.longitude || "",
            image: area.image || "",
            qrcode: qrCodeValue || area.qrcode || "",
            image_url: imageUrl,
            qrcode_url: qrcodeUrl,
            police_station_name: area.policeStation?.name || area.police_station_name || "Not assigned",
            district_name: area.district?.district_name || area.district_name || "Not assigned",
            status,
            district_id: area.district_id || area.district?.id,
            police_station_id: area.police_station_id || area.policeStation?.id,
          };
        });

        setSensitiveAreas(validatedRows);
        const totalRecords = response?.data?.totalRecords || response?.data?.total || response?.totalRecords || validatedRows.length;
        setTotalCount(totalRecords);
      } catch (error: any) {
        console.error("Error fetching sensitive areas:", error);
        setSensitiveAreas([]);
        setTotalCount(0);
        showToast("Failed to fetch sensitive areas", "error");
      } finally {
        setLoading(false);
      }
    },
    [showToast, constructImageUrl, extractQrCodeFromImagePath]
  );

  const fetchSensitiveAreaById = useCallback(
    async (id: number): Promise<SensitiveAreaRow | null> => {
      try {
        const resp = await api.get(`/sensitive-areas/${id}`);
        const data = resp?.data?.data || resp?.data || resp || [];
        const area = Array.isArray(data) ? data[0] : data;
        if (!area) return null;

        const qrcodeUrl = constructImageUrl(area.qrcode_url || area.image || "");
        const imageUrl = constructImageUrl(area.image_url || area.image || "");
        const qrCodeValue = extractQrCodeFromImagePath(area.image || "");

        const norm: SensitiveAreaRow = {
          id: area.id,
          address: area.address || "",
          latitude: area.latitude || "",
          longitude: area.longitude || "",
          image: area.image || "",
          qrcode: qrCodeValue || area.qrcode || "",
          image_url: imageUrl,
          qrcode_url: qrcodeUrl,
          police_station_name: area.policeStation?.name || area.police_station_name || "Not assigned",
          district_name: area.district?.district_name || area.district_name || "Not assigned",
          district_id: area.district_id || area.district?.id,
          police_station_id: area.police_station_id || area.policeStation?.id,
        };
        return norm;
      } catch (err) {
        console.error("Error fetching sensitive area by id:", err);
        showToast("Failed to load sensitive area details", "error");
        return null;
      }
    },
    [showToast, constructImageUrl, extractQrCodeFromImagePath]
  );

  useEffect(() => {
    fetchSensitiveAreas(pagination.pageIndex, pagination.pageSize, searchQuery);
  }, [pagination.pageIndex, pagination.pageSize, searchQuery, fetchSensitiveAreas]);

  const handleDropdowns = useCallback(async (
    stateSetter: React.Dispatch<React.SetStateAction<DropdownState>>,
    dropdownType: 'districts' | 'policeStations',
    districtId?: string
  ) => {
    if (dropdownType === 'districts') {
      stateSetter(prev => {
        if (prev.districts.length > 0 || prev.isLoadingDistricts) return prev;
        return { ...prev, isLoadingDistricts: true };
      });
      const current = (await new Promise<DropdownState>(res => {
        res(downloadDropdowns);
      }));
      if (current.districts.length === 0) {
        const districts = await fetchDistrictsList();
        stateSetter(prev => ({ ...prev, districts, isLoadingDistricts: false }));
      } else {
        stateSetter(prev => ({ ...prev, isLoadingDistricts: false }));
      }
    } else if (dropdownType === 'policeStations' && districtId) {
      stateSetter(prev => {
        if (prev.policeStations.length > 0 || prev.isLoadingPoliceStations) return prev;
        return { ...prev, isLoadingPoliceStations: true };
      });
      const stations = await fetchPoliceStationsByDistrict(districtId);
      stateSetter(prev => ({ ...prev, policeStations: stations, isLoadingPoliceStations: false }));
    }
  }, [fetchDistrictsList, fetchPoliceStationsByDistrict, downloadDropdowns]);

  const handleDistrictChange = useCallback(async (
    stateSetter: React.Dispatch<React.SetStateAction<DropdownState>>,
    districtId: string
  ) => {
    stateSetter(prev => ({ 
      ...prev, 
      selectedDistrict: districtId,
      selectedPoliceStation: "",
      policeStations: []
    }));
    if (districtId) {
      await handleDropdowns(stateSetter, 'policeStations', districtId);
    }
  }, [handleDropdowns]);

  const pdfExportConfig: ExportPdfOptions = useMemo(() => ({
    filename: `sensitive-areas-report-${new Date().toLocaleDateString("en-GB").replace(/\//g, "-")}.pdf`,
    title: "Sensitive Areas Report",
    orientation: "landscape",
    pageSize: "a4",
    columns: [
      { header: "Image/QR", accessorKey: "qrcode" },
      { header: "Police Station", accessorKey: "police_station_name" },
      { header: "Address", accessorKey: "address" },
      { header: "District", accessorKey: "district_name" },
      { header: "Lat/Long", accessorKey: "coordinates" },
      { header: "Status", accessorKey: "status" },
    ],
    data: sensitiveAreas.map(area => ({
      ...area,
      coordinates: `${area.latitude}/${area.longitude}`
    })),
    showSerialNumber: true,
    serialNumberHeader: "S.NO.",
    projectName: "E-Police",
    exportDate: true,
    showTotalCount: true,
    searchQuery: searchQuery || "All sensitive areas",
    userRole: "admin",
  }), [sensitiveAreas, searchQuery]);

  const excelExportConfig: ExportExcelOptions = useMemo(() => ({
    filename: `sensitive-areas-report-${new Date().toLocaleDateString("en-GB").replace(/\//g, "-")}.xlsx`,
    sheetName: "Sensitive Areas",
    title: "Sensitive Areas Report",
    columns: [
      { header: "QR Code", accessorKey: "qrcode" },
      { header: "Police Station", accessorKey: "police_station_name" },
      { header: "Address", accessorKey: "address" },
      { header: "District", accessorKey: "district_name" },
      { header: "Latitude", accessorKey: "latitude" },
      { header: "Longitude", accessorKey: "longitude" },
      { header: "Status", accessorKey: "status" },
      { header: "Image URL", accessorKey: "image_url" },
    ],
    data: sensitiveAreas,
    showSerialNumber: true,
    serialNumberHeader: "S.NO.",
    projectName: "E-Police",
    exportDate: true,
    showTotalCount: true,
    searchQuery: searchQuery || "All sensitive areas",
    userRole: "admin",
  }), [sensitiveAreas, searchQuery]);

  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query.trim());
    setPagination(prev => ({ ...prev, pageIndex: 0 }));
  }, []);

  const handleAddSensitiveArea = useCallback(
    async (form: Record<string, string>) => {
      try {
        if (!form.district_id) return showToast("District is required", "error");
        if (!form.police_station_id) return showToast("Police Station is required", "error");
        if (!form.address) return showToast("Address is required", "error");
        if (!form.qrcode) return showToast("QR Code is required", "error");

        const payload = {
          district_id: Number(form.district_id),
          police_station_id: Number(form.police_station_id),
          address: form.address,
          latitude: form.latitude || "0",
          longitude: form.longitude || "0",
          image: form.image || "",
          qrcode: form.qrcode,
        };

        await api.post("/sensitive-areas", payload);
        setPagination(prev => ({ ...prev, pageIndex: 0 }));
        fetchSensitiveAreas(0, pagination.pageSize, searchQuery);
        setAddDropdowns(prev => ({ 
          ...prev, 
          selectedDistrict: "", 
          selectedPoliceStation: "", 
          policeStations: [] 
        }));
        showToast("Sensitive area added successfully!", "success");
      } catch (error: any) {
        showToast(error.response?.data?.message || "Failed to add sensitive area", "error");
      }
    },
    [fetchSensitiveAreas, pagination.pageSize, searchQuery, showToast]
  );

  const sensitiveAreaFields: FieldConfig[] = useMemo(
    () => [
      {
        name: "district_id",
        label: "District",
        type: "select",
        required: true,
        options: addDropdowns.districts.map((d: any) => ({
          value: String(d.id),
          label: d.district_name,
        })),
        placeholder: "Select District",
        customProps: {
          onMouseDown: () => handleDropdowns(setAddDropdowns, 'districts'),
          onChange: async (e: any) => {
            await handleDistrictChange(setAddDropdowns, e.target.value);
          },
        },
        isLoading: addDropdowns.isLoadingDistricts,
      },
      {
        name: "police_station_id",
        label: "Police Station",
        type: "select",
        required: true,
        disabled: !addDropdowns.selectedDistrict,
        options: addDropdowns.policeStations.map((ps: any) => ({
          value: String(ps.id),
          label: ps.police_station_name || ps.name,
        })),
        placeholder:
          !addDropdowns.selectedDistrict
            ? "Select District first"
            : addDropdowns.isLoadingPoliceStations
            ? "Loading..."
            : addDropdowns.policeStations.length === 0
            ? "No police stations available"
            : "Select Police Station",
      },
      {
        name: "latitude",
        label: "Latitude",
        type: "text",
        placeholder: "Enter latitude",
      },
      {
        name: "longitude",
        label: "Longitude",
        type: "text",
        placeholder: "Enter longitude",
      },
      {
        name: "qrcode",
        label: "QR Code *",
        type: "text",
        required: true,
        placeholder: "Enter QR code (e.g., 1764918092527)",
      },
      {
        name: "address",
        label: "Address *",
        type: "textarea",
        required: true,
        placeholder: "Enter address",
      },
    ],
    [addDropdowns, handleDropdowns, handleDistrictChange]
  );

  const handlePoliceStationDownload = useCallback(async () => {
    try {
      if (!downloadDropdowns.selectedPoliceStation) {
        showToast("Please select a police station first", "error");
        return;
      }
      const selectedStation = downloadDropdowns.policeStations.find(
        ps => ps.id.toString() === downloadDropdowns.selectedPoliceStation
      );
      if (!selectedStation) {
        showToast("Selected police station not found", "error");
        return;
      }
      const pdfExportConfigForStation: ExportPdfOptions = {
        filename: `police-station-${selectedStation.police_station_name?.replace(/\s+/g, '-').toLowerCase() || 'unknown'}-sensitive-areas-${new Date().toLocaleDateString("en-GB").replace(/\//g, "-")}.pdf`,
        title: `Sensitive Areas - ${selectedStation.police_station_name || selectedStation.name}`,
        orientation: "landscape",
        pageSize: "a4",
        columns: [
          { header: "QR Code", accessorKey: "qrcode" },
          { header: "Police Station", accessorKey: "police_station_name" },
          { header: "Address", accessorKey: "address" },
          { header: "District", accessorKey: "district_name" },
          { header: "Lat/Long", accessorKey: "coordinates" },
          { header: "Status", accessorKey: "status" },
        ],
        data: sensitiveAreas
          .filter(area => area.police_station_id?.toString() === downloadDropdowns.selectedPoliceStation)
          .map(area => ({
            ...area,
            coordinates: `${area.latitude}/${area.longitude}`
          })),
        showSerialNumber: true,
        serialNumberHeader: "S.NO.",
        projectName: "E-Police",
        exportDate: true,
        showTotalCount: true,
        searchQuery: `Police Station: ${selectedStation.police_station_name || selectedStation.name}`,
        userRole: "admin",
      };
      exportToPdf(pdfExportConfigForStation);
      showToast(`Downloading data for ${selectedStation.police_station_name || selectedStation.name}`, "success");
    } catch (error) {
      console.error("Error downloading police station data:", error);
      showToast("Failed to download police station data", "error");
    }
  }, [downloadDropdowns, sensitiveAreas, exportToPdf, showToast]);

  const handleEditFieldChange = useCallback(
    async (fieldName: string, value: string, formData: any) => {
      if (fieldName === "district_id") {
        await handleDistrictChange(setEditDropdowns, value);
        return {
          ...formData,
          district_id: value,
          police_station_id: "",
        };
      }
      return {
        ...formData,
        [fieldName]: value,
      };
    },
    [handleDistrictChange]
  );

  const handleViewDetails = useCallback((row: SensitiveAreaRow) => {
    router.push(`/dashboard/police-master/Sensitive-area/view?id=${row.id}`);
  }, [router]);

  const handlePrint = useCallback((row: SensitiveAreaRow) => {
    setPrintingData(row);
    setIsPrintOpen(true);
  }, []);

  const handleEdit = useCallback(
    async (row: SensitiveAreaRow) => {
      try {
        setIsLoadingAreaDetail(true);
        if (!row.id) {
          showToast("Invalid sensitive area id", "error");
          return;
        }
        const freshArea = await fetchSensitiveAreaById(row.id);
        if (!freshArea) return;
        setEditingSensitiveArea(freshArea);
        await handleDropdowns(setEditDropdowns, 'districts');
        setEditDropdowns(prev => ({
          ...prev,
          selectedDistrict: freshArea.district_id?.toString() || "",
          selectedPoliceStation: freshArea.police_station_id?.toString() || ""
        }));
        if (freshArea.district_id) {
          await handleDropdowns(setEditDropdowns, 'policeStations', freshArea.district_id.toString());
        }
        setIsEditModalOpen(true);
      } catch (error) {
        console.error("Error in handleEdit:", error);
        showToast("Failed to load edit form", "error");
      } finally {
        setIsLoadingAreaDetail(false);
      }
    },
    [fetchSensitiveAreaById, showToast, handleDropdowns]
  );

  const handleUpdateSensitiveArea = useCallback(
    async (formData: any) => {
      if (!editingSensitiveArea) return;
      if (!editingSensitiveArea.id) {
        showToast("Invalid sensitive area id", "error");
        return;
      }
      try {
        const payload = {
          district_id: Number(formData.district_id),
          police_station_id: Number(formData.police_station_id),
          address: formData.address,
          latitude: formData.latitude || editingSensitiveArea.latitude,
          longitude: formData.longitude || editingSensitiveArea.longitude,
          image: formData.image || editingSensitiveArea.image,
          qrcode: formData.qrcode || editingSensitiveArea.qrcode,
        };
        await api.put(`/sensitive-areas/${editingSensitiveArea.id}`, payload);
        fetchSensitiveAreas(pagination.pageIndex, pagination.pageSize, searchQuery);
        setIsEditModalOpen(false);
        setEditingSensitiveArea(null);
        setEditDropdowns({
          districts: [],
          policeStations: [],
          selectedDistrict: "",
          selectedPoliceStation: "",
          isLoadingDistricts: false,
          isLoadingPoliceStations: false,
        });
        showToast("Sensitive area updated successfully!", "success");
      } catch (error: any) {
        console.error("Update error:", error?.response?.data || error);
        showToast(error.response?.data?.message || "Failed to update sensitive area", "error");
      }
    },
    [editingSensitiveArea, fetchSensitiveAreas, pagination.pageIndex, pagination.pageSize, searchQuery, showToast]
  );

  const handleDeleteConfirm = useCallback(
    async (id: number) => {
      try {
        await api.delete(`/sensitive-areas/${id}`);
        if (sensitiveAreas.length === 1 && pagination.pageIndex > 0) {
          setPagination(prev => ({ ...prev, pageIndex: prev.pageIndex - 1 }));
        } else {
          fetchSensitiveAreas(pagination.pageIndex, pagination.pageSize, searchQuery);
        }
        showToast("Sensitive area deleted successfully!", "success");
      } catch (error: any) {
        showToast(error.response?.data?.message || "Failed to delete sensitive area", "error");
      }
    },
    [sensitiveAreas.length, pagination.pageIndex, pagination.pageSize, searchQuery, fetchSensitiveAreas, showToast]
  );

  const editModalFields = useMemo<FieldConfig[]>(() => {
    if (!editingSensitiveArea) return [];
    return [
      {
        type: "select",
        name: "district_id",
        label: "District *",
        required: true,
        defaultValue: editingSensitiveArea.district_id?.toString() || "",
        options: editDropdowns.districts.map((district) => ({
          value: district.id.toString(),
          label: district.district_name,
        })),
        placeholder: "Select District",
        customProps: {
          onMouseDown: () => handleDropdowns(setEditDropdowns, 'districts'),
          onChange: async (e: any) => {
            await handleDistrictChange(setEditDropdowns, e.target.value);
          },
        },
        isLoading: editDropdowns.isLoadingDistricts,
      },
      {
        type: "select",
        name: "police_station_id",
        label: "Police Station *",
        required: true,
        defaultValue: editingSensitiveArea.police_station_id?.toString() || "",
        options: editDropdowns.policeStations.map((ps) => ({
          value: ps.id.toString(),
          label: ps.police_station_name || ps.name,
        })),
        placeholder: editDropdowns.selectedDistrict 
          ? (editDropdowns.policeStations.length === 0 
            ? "No police stations in this district" 
            : "Select Police Station") 
          : "Select District first",
        disabled: !editDropdowns.selectedDistrict,
      },
      {
        type: "text",
        name: "latitude",
        label: "Latitude",
        defaultValue: editingSensitiveArea.latitude,
        placeholder: "Enter latitude",
      },
      {
        type: "text",
        name: "longitude",
        label: "Longitude",
        defaultValue: editingSensitiveArea.longitude,
        placeholder: "Enter longitude",
      },
      {
        type: "text",
        name: "qrcode",
        label: "QR Code *",
        required: true,
        defaultValue: editingSensitiveArea.qrcode,
        placeholder: "Enter QR code (e.g., 1764918092527)",
      },
      {
        type: "textarea",
        name: "address",
        label: "Address *",
        required: true,
        defaultValue: editingSensitiveArea.address,
        placeholder: "Enter address",
      },
    ];
  }, [
    editingSensitiveArea,
    editDropdowns,
    handleDropdowns,
    handleDistrictChange,
  ]);

  const columns: ColumnDef<SensitiveAreaRow>[] = useMemo(
    () => [
      {
        accessorKey: "image_qr",
        header: "QR Code/Image",
        cell: ({ row }) => {
          const qrUrl = row.original.qrcode_url;
          const imageUrl = row.original.image_url;
          const qrCodeValue = row.original.qrcode;
          
          return (
            <div className="flex flex-col items-center gap-1">
              <div className="relative">
                {qrUrl ? (
                  <a 
                    href={qrUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="block"
                  >
                    <div className="w-20 h-20 bg-gray-100 border border-gray-300 rounded flex items-center justify-center hover:bg-gray-200 transition-colors overflow-hidden">
                      <img 
                        src={qrUrl} 
                        alt="QR Code" 
                        className="w-full h-full object-contain"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                          const parent = (e.target as HTMLImageElement).parentElement;
                          if (parent) {
                            parent.innerHTML = `<div class="w-full h-full flex flex-col items-center justify-center"><svg class="w-6 h-6 text-gray-500 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path></svg><span class="text-xs text-gray-400">QR</span></div>`;
                          }
                        }}
                      />
                    </div>
                  </a>
                ) : (
                  <div className="w-20 h-20 bg-gray-100 border border-gray-300 rounded flex flex-col items-center justify-center">
                    <QrCode size={24} className="text-gray-400 mb-1" />
                    <span className="text-xs text-gray-400">No QR</span>
                  </div>
                )}
                
                {imageUrl && imageUrl !== qrUrl && (
                  <div className="absolute -top-1 -right-1">
                    <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center border-2 border-white">
                      <ImageIcon size={12} className="text-white" />
                    </div>
                  </div>
                )}
              </div>
              
              {qrCodeValue && (
                <div 
                  className="text-[10px] text-gray-600 text-center max-w-20 truncate cursor-help px-1 py-0.5 bg-gray-100 rounded" 
                  title={`QR Code: ${qrCodeValue}`}
                >
                  {qrCodeValue.length > 15 
                    ? `${qrCodeValue.substring(0, 12)}...` 
                    : qrCodeValue}
                </div>
              )}
            </div>
          );
        },
        size: 120,
      },
      {
        accessorKey: "police_station_name",
        header: "Police Station",
        cell: ({ row }) => (
          <span className="font-medium">{row.original.police_station_name || "Not assigned"}</span>
        ),
      },
      {
        accessorKey: "address",
        header: "Address",
        cell: ({ row }) => (
          <div className="max-w-[200px] truncate" title={row.original.address}>
            {row.original.address}
          </div>
        ),
      },
      {
        accessorKey: "district_name",
        header: "District",
        cell: ({ row }) => (
          <span>{row.original.district_name || "Not assigned"}</span>
        ),
      },
      {
        accessorKey: "coordinates",
        header: "Coordinates",
        cell: ({ row }) => (
          <div className="flex items-center gap-1">
            <MapPin size={14} className="text-gray-500" />
            <span className="text-sm font-mono">
              {row.original.latitude && row.original.longitude 
                ? `${row.original.latitude}/${row.original.longitude}`
                : "N/A"}
            </span>
          </div>
        ),
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => {
          const status = row.original.status || "Active";
          const statusColor = status === "Active" 
            ? "bg-green-100 text-green-800" 
            : "bg-yellow-100 text-yellow-800";
          
          return (
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColor}`}>
              {status}
            </span>
          );
        },
      },
      {
        id: "actions",
        header: "Actions",
        cell: ({ row }) => (
          <div className="flex gap-2">
            <button
              onClick={() => handleViewDetails(row.original)}
              className="px-2 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors flex items-center gap-1 text-sm"
              title="View Details"
            >
              <Eye size={14} />
              <span>View</span>
            </button>

            <button
              onClick={() => handlePrint(row.original)}
              className="px-2 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors flex items-center gap-1 text-sm"
              title="Print Details"
            >
              <Printer size={14} />
              <span>Print</span>
            </button>

            <button
              onClick={() => handleEdit(row.original)}
              className="px-3 py-1 rounded-md text-sm bg-yellow-100 text-yellow-700 hover:bg-yellow-200 transition-colors"
              disabled={isLoadingAreaDetail}
              title="Edit"
            >
              {isLoadingAreaDetail ? "Loading..." : "Edit"}
            </button>

            <AlertPopover
              trigger={
                <button className="px-3 py-1 rounded-md text-sm bg-red-100 text-red-700 hover:bg-red-200 transition-colors">
                  Delete
                </button>
              }
              title="Are you sure you want to delete this Sensitive Area?"
              description="This action cannot be undone."
              okText="Delete"
              cancelText="Cancel"
              onConfirm={() => handleDeleteConfirm(row.original.id)}
            />
          </div>
        ),
      },
    ],
    [handleEdit, handleDeleteConfirm, handleViewDetails, handlePrint, isLoadingAreaDetail]
  );

  const { tableElement, table } = CustomTable<SensitiveAreaRow>({
    data: sensitiveAreas,
    columns,
    pagination,
    totalCount,
    loading,
    sorting,
    onPaginationChange: setPagination,
    onSortingChange: setSorting,
    showSerialNumber: true,
    serialNumberHeader: "S.NO.",
    maxHeight: "500px",
    emptyMessage: "No sensitive areas available",
    manualPagination: true,
    getRowId: (row) => row.id,
  });

  return (
    <div className="w-full min-h-screen bg-white px-4 md:px-8">
      <Toast message={toast.message} type={toast.type} isVisible={toast.isVisible} />

      <AddSection
        title="Create Sensitive Area"
        fields={sensitiveAreaFields}
        onSubmit={handleAddSensitiveArea}
        submitButtonText="Generate QR"
        onReset={() => {
          setAddDropdowns(prev => ({ 
            ...prev, 
            selectedDistrict: "", 
            selectedPoliceStation: "", 
            policeStations: [] 
          }));
        }}
      />

      {/* Download Section with Excel Upload */}
      <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          
          {/* LEFT SIDE (Dropdowns + Download Button) */}
          <div className="flex flex-col md:flex-row items-start md:items-center gap-4 flex-wrap">
            
            <div className="relative w-full md:w-64">
              <select
                value={downloadDropdowns.selectedDistrict}
                onChange={(e) => handleDistrictChange(setDownloadDropdowns, e.target.value)}
                onClick={() => handleDropdowns(setDownloadDropdowns, 'districts')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 bg-white shadow-sm"
              >
                <option value="">Select District</option>
                {downloadDropdowns.districts.map((district) => (
                  <option key={district.id} value={district.id}>
                    {district.district_name}
                  </option>
                ))}
              </select>
            </div>

            <div className="relative w-full md:w-64">
              <select
                value={downloadDropdowns.selectedPoliceStation}
                onChange={(e) =>
                  setDownloadDropdowns(prev => ({ ...prev, selectedPoliceStation: e.target.value }))
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 bg-white shadow-sm"
              >
                <option value="">Select Police Station</option>
                {downloadDropdowns.policeStations.map((station) => (
                  <option key={station.id} value={station.id}>
                    {station.police_station_name || station.name}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={handlePoliceStationDownload}
              className="px-4 py-2 bg-green-300 text-white rounded-md hover:bg-green-500 flex items-center gap-2"
            >
              <Download size={18} />
              <span>Download</span>
            </button>

          </div>

          {/* RIGHT SIDE (Excel Upload Button) */}
          <div>
            <ExcelUpload
              onSuccess={() => {
                setPagination(prev => ({ ...prev, pageIndex: 0 }));
                fetchSensitiveAreas(0, pagination.pageSize, searchQuery);
              }}
              showToast={showToast}
            />
          </div>
        </div>
      </div>

      <div className="mt-6">
        <div className="flex justify-between items-center mb-4 gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <ExportButtons
              pdfConfig={pdfExportConfig}
              excelConfig={excelExportConfig}
            />
            <ColumnVisibilitySelector columns={table.getAllColumns()} />
          </div>

          <div className="w-64">
            <SearchComponent
              placeholder="Search Sensitive Areas..."
              debounceDelay={400}
              serverSideSearch={true}
              onSearch={handleSearch}
            />
          </div>
        </div>

        {tableElement}
      </div>

      <EditModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setEditingSensitiveArea(null);
          setEditDropdowns({
            districts: [],
            policeStations: [],
            selectedDistrict: "",
            selectedPoliceStation: "",
            isLoadingDistricts: false,
            isLoadingPoliceStations: false,
          });
        }}
        onSubmit={handleUpdateSensitiveArea}
        isLoading={isLoadingAreaDetail}
        loadingMessage={
          isLoadingAreaDetail ? "Loading sensitive area details..." : undefined
        }
        title={`Edit Sensitive Area ${editingSensitiveArea ? `- ${editingSensitiveArea.address}` : ""}`}
        fields={editModalFields}
        onFieldChange={handleEditFieldChange}
      />

      {/* Print Modal */}
      {isPrintOpen && printingData && (
        <div className="fixed inset-0 bg-black bg-opacity-40 z-50 overflow-auto">
          <div className="w-full">
            <SensitiveAreaPrint
              data={printingData}
              onClose={() => {
                setIsPrintOpen(false);
                setPrintingData(null);
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}