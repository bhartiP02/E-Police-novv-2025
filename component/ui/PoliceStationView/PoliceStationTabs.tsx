"use client";

import { useState, useEffect } from "react";
import { api } from "@/services/api/apiServices";
import { Users, UserX, AlertCircle, Eye, ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import CustomTable from "@/component/ui/Table/CustomTable";

// ... interfaces remain the same ...

interface PoliceStationTabsProps {
  policeStationId: number;
}

type TabType = "police" | "criminals" | "incidents" | "eyes";

// Wrapper components for each table to ensure consistent hook calls
function PoliceStationTable({ data }: { data: any }) {
  const columns = [
    {
      accessorKey: "name",
      header: "Station Name",
      cell: (info: any) => info.getValue() || "N/A",
    },
    {
      accessorKey: "district_name",
      header: "District",
      cell: (info: any) => info.getValue() || "N/A",
    },
    {
      accessorKey: "city_name",
      header: "City",
      cell: (info: any) => info.getValue() || "N/A",
    },
    {
      accessorKey: "address",
      header: "Address",
      cell: (info: any) => info.getValue() || "N/A",
    },
  ];

  const { tableElement } = CustomTable({
    data,
    columns,
    totalCount: data.length,
    pagination: { pageIndex: 0, pageSize: 10 },
    onPaginationChange: () => {},
    onSortingChange: () => {},
  });

  return tableElement;
}

function PoliceTableWrapper({ data }: { data: Police[] }) {
  const columns = [
    {
      accessorKey: "name",
      header: "Name",
      cell: (info: any) => info.getValue(),
    },
    {
      accessorKey: "designation",
      header: "Designation",
      cell: (info: any) => info.getValue(),
    },
    {
      accessorKey: "mobile",
      header: "Mobile",
      cell: (info: any) => info.getValue(),
    },
    {
      accessorKey: "email",
      header: "Email",
      cell: (info: any) => info.getValue(),
    },
    {
      accessorKey: "gender",
      header: "Gender",
      cell: (info: any) => info.getValue() || "N/A",
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: (info: any) => {
        const status = info.getValue();
        return (
          <span
            className={`px-3 py-1 rounded-full text-xs font-medium ${
              status?.toLowerCase() === "active"
                ? "bg-green-100 text-green-800"
                : "bg-red-100 text-red-800"
            }`}
          >
            {status}
          </span>
        );
      },
    },
    {
      id: "actions",
      header: "Action",
      cell: () => (
        <button className="p-2 bg-purple-100 rounded-md hover:bg-purple-200 transition-colors">
          <Eye className="w-4 h-4 text-purple-700" />
        </button>
      ),
    },
  ];

  const { tableElement } = CustomTable({
    data,
    columns,
    totalCount: data.length,
    pagination: { pageIndex: 0, pageSize: 10 },
    onPaginationChange: () => {},
    onSortingChange: () => {},
  });

  return tableElement;
}

function CriminalTableWrapper({ data }: { data: Criminal[] }) {
  const columns = [
    {
      accessorKey: "name",
      header: "Name",
      cell: (info: any) => info.getValue(),
    },
    {
      accessorKey: "crime_type",
      header: "Crime Type",
      cell: (info: any) => info.getValue(),
    },
    {
      accessorKey: "arrest_date",
      header: "Arrest Date",
      cell: (info: any) => info.getValue(),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: (info: any) => {
        const status = info.getValue();
        return (
          <span
            className={`px-3 py-1 rounded-full text-xs font-medium ${
              status?.toLowerCase() === "active"
                ? "bg-green-100 text-green-800"
                : "bg-red-100 text-red-800"
            }`}
          >
            {status}
          </span>
        );
      },
    },
    {
      id: "actions",
      header: "Action",
      cell: () => (
        <button className="p-2 bg-purple-100 rounded-md hover:bg-purple-200 transition-colors">
          <Eye className="w-4 h-4 text-purple-700" />
        </button>
      ),
    },
  ];

  const { tableElement } = CustomTable({
    data,
    columns,
    totalCount: data.length,
    pagination: { pageIndex: 0, pageSize: 10 },
    onPaginationChange: () => {},
    onSortingChange: () => {},
  });

  return tableElement;
}

function IncidentTableWrapper({ data }: { data: Incident[] }) {
  const columns = [
    {
      accessorKey: "incident_type",
      header: "Incident Type",
      cell: (info: any) => info.getValue(),
    },
    {
      accessorKey: "date",
      header: "Date",
      cell: (info: any) => info.getValue(),
    },
    {
      accessorKey: "description",
      header: "Description",
      cell: (info: any) => info.getValue(),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: (info: any) => {
        const status = info.getValue();
        return (
          <span
            className={`px-3 py-1 rounded-full text-xs font-medium ${
              status?.toLowerCase() === "resolved"
                ? "bg-green-100 text-green-800"
                : status?.toLowerCase() === "pending"
                ? "bg-yellow-100 text-yellow-800"
                : "bg-red-100 text-red-800"
            }`}
          >
            {status}
          </span>
        );
      },
    },
    {
      id: "actions",
      header: "Action",
      cell: () => (
        <button className="p-2 bg-purple-100 rounded-md hover:bg-purple-200 transition-colors">
          <Eye className="w-4 h-4 text-purple-700" />
        </button>
      ),
    },
  ];

  const { tableElement } = CustomTable({
    data,
    columns,
    totalCount: data.length,
    pagination: { pageIndex: 0, pageSize: 10 },
    onPaginationChange: () => {},
    onSortingChange: () => {},
  });

  return tableElement;
}

function PoliceEyeTableWrapper({ data }: { data: PoliceEye[] }) {
  const columns = [
    {
      accessorKey: "location",
      header: "Location",
      cell: (info: any) => info.getValue(),
    },
    {
      accessorKey: "camera_type",
      header: "Camera Type",
      cell: (info: any) => info.getValue(),
    },
    {
      accessorKey: "installation_date",
      header: "Installation Date",
      cell: (info: any) => info.getValue(),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: (info: any) => {
        const status = info.getValue();
        return (
          <span
            className={`px-3 py-1 rounded-full text-xs font-medium ${
              status?.toLowerCase() === "active"
                ? "bg-green-100 text-green-800"
                : "bg-red-100 text-red-800"
            }`}
          >
            {status}
          </span>
        );
      },
    },
    {
      id: "actions",
      header: "Action",
      cell: () => (
        <button className="p-2 bg-purple-100 rounded-md hover:bg-purple-200 transition-colors">
          <Eye className="w-4 h-4 text-purple-700" />
        </button>
      ),
    },
  ];

  const { tableElement } = CustomTable({
    data,
    columns,
    totalCount: data.length,
    pagination: { pageIndex: 0, pageSize: 10 },
    onPaginationChange: () => {},
    onSortingChange: () => {},
  });

  return tableElement;
}

export default function PoliceStationTabs({ policeStationId }: PoliceStationTabsProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabType>("police");
  const [loading, setLoading] = useState(false);
  const [loadingStation, setLoadingStation] = useState(false);
  
  // Data states
  const [policeList, setPoliceList] = useState<Police[]>([]);
  const [criminalList, setCriminalList] = useState<Criminal[]>([]);
  const [incidentList, setIncidentList] = useState<Incident[]>([]);
  const [policeEyeList, setPoliceEyeList] = useState<PoliceEye[]>([]);
  const [stationDetails, setStationDetails] = useState<PoliceStationDetails | null>(null);

  useEffect(() => {
    fetchTabData(activeTab);
  }, [activeTab, policeStationId]);

  useEffect(() => {
    fetchStationDetails();
  }, [policeStationId]);

  const fetchStationDetails = async () => {
    if (!policeStationId) return;
    
    try {
      setLoadingStation(true);
      // Try different API endpoints
      let response;
      try {
        response = await api.get(`/police-stations/${policeStationId}`);
      } catch (err) {
        console.warn("Endpoint /police-stations failed, trying /stations...");
        // Try without the police-stations prefix
        try {
          response = await api.get(`/stations/${policeStationId}`);
        } catch (err2) {
          console.error("Both endpoints failed:", err2);
          setStationDetails(null);
          return;
        }
      }
      
      // Extract data safely
      const data = response?.data?.data || response?.data || response;
      
      if (data && typeof data === 'object' && !Array.isArray(data)) {
        setStationDetails(data as PoliceStationDetails);
      } else if (Array.isArray(data) && data.length > 0) {
        // If API returns an array, take the first item
        setStationDetails(data[0] as PoliceStationDetails);
      } else {
        console.warn("Invalid station details format:", data);
        setStationDetails(null);
      }
    } catch (err) {
      console.error("Error fetching station details:", err);
      setStationDetails(null);
    } finally {
      setLoadingStation(false);
    }
  };

  const fetchTabData = async (tab: TabType) => {
    if (!policeStationId) return;
    
    try {
      setLoading(true);
      let endpoint = "";
      
      switch (tab) {
        case "police":
          endpoint = `/police?station_id=${policeStationId}`;
          break;
        case "criminals":
          endpoint = `/criminals?station_id=${policeStationId}`;
          break;
        case "incidents":
          endpoint = `/incidents?station_id=${policeStationId}`;
          break;
        case "eyes":
          endpoint = `/police-eyes?station_id=${policeStationId}`;
          break;
      }

      const response = await api.get(endpoint);
      const extractedData = response?.data?.data || response?.data || response || [];
      
      // Ensure we have an array
      const dataArray = Array.isArray(extractedData) ? extractedData : [extractedData];
      
      switch (tab) {
        case "police":
          setPoliceList(dataArray);
          break;
        case "criminals":
          setCriminalList(dataArray);
          break;
        case "incidents":
          setIncidentList(dataArray);
          break;
        case "eyes":
          setPoliceEyeList(dataArray);
          break;
      }
    } catch (err) {
      console.error(`Error fetching ${tab} data:`, err);
      // Set empty arrays on error
      switch (tab) {
        case "police":
          setPoliceList([]);
          break;
        case "criminals":
          setCriminalList([]);
          break;
        case "incidents":
          setIncidentList([]);
          break;
        case "eyes":
          setPoliceEyeList([]);
          break;
      }
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: "police" as TabType, label: "Police Details", icon: <Users className="w-4 h-4" />, count: policeList.length },
    { id: "criminals" as TabType, label: "Criminal Details", icon: <UserX className="w-4 h-4" />, count: criminalList.length },
    { id: "incidents" as TabType, label: "Incident Spot", icon: <AlertCircle className="w-4 h-4" />, count: incidentList.length },
    { id: "eyes" as TabType, label: "Police Eyes", icon: <Eye className="w-4 h-4" />, count: policeEyeList.length }
  ];

  // Format station details for the table
  const getStationTableData = () => {
    if (!stationDetails) return [];
    return [stationDetails];
  };

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      {/* Tabs Header */}
      <div className="border-b bg-gray-50 relative">
        {/* Back Button (Top-Right) */}
        <button
          onClick={() => router.push("/dashboard/Masters/station")}
          className="absolute right-3 top-3 p-2 rounded-md bg-purple-100 hover:bg-purple-200 text-purple-700 transition"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        {/* Tabs */}
        <div className="flex overflow-x-auto pr-12">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium whitespace-nowrap transition-all ${
                activeTab === tab.id
                  ? "border-b-2 border-purple-500 text-purple-600 bg-white"
                  : "text-gray-600 hover:text-gray-800 hover:bg-gray-100"
              }`}
            >
            {tab.icon}
            <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="p-3">
        {loading || loadingStation ? (
          <div className="flex items-center justify-center h-58">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
          </div>
        ) : (
          <>
            {/* --- Police Station Details Table --- */}
            {activeTab === "police" && stationDetails && (
              <div className="mb-8">
                <div className="mb-4">
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">Police Station Information</h3>
                </div>
                <PoliceStationTable data={getStationTableData()} />
              </div>
            )}

            {/* Show station not found message */}
            {activeTab === "police" && !stationDetails && !loading && !loadingStation && (
              <div className="mb-8">
                <div className="text-center py-8 bg-gray-50 rounded-md">
                  <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">Police station details not found.</p>
                  <button
                    onClick={() => fetchStationDetails()}
                    className="mt-4 px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition"
                  >
                    Retry
                  </button>
                </div>
              </div>
            )}

            {/* --- Police Officers Table --- */}
            {activeTab === "police" && policeList.length > 0 && (
              <div className="mt-6">
                <h4 className="text-md font-semibold text-gray-800 mb-4">Police Officers</h4>
                <PoliceTableWrapper data={policeList} />
              </div>
            )}

            {/* --- Criminal Table --- */}
            {activeTab === "criminals" && criminalList.length > 0 && (
              <div>
                <CriminalTableWrapper data={criminalList} />
              </div>
            )}

            {/* --- Incident Table --- */}
            {activeTab === "incidents" && incidentList.length > 0 && (
              <div>
                <IncidentTableWrapper data={incidentList} />
              </div>
            )}

            {/* --- Police Eye Table --- */}
            {activeTab === "eyes" && policeEyeList.length > 0 && (
              <div>
                <PoliceEyeTableWrapper data={policeEyeList} />
              </div>
            )}

            {/* Show empty state if no data in current tab */}
            {activeTab === "police" && !stationDetails && policeList.length === 0 && (
              <EmptyState message="No police records found" />
            )}
            {activeTab === "criminals" && criminalList.length === 0 && (
              <EmptyState message="No criminal records found" />
            )}
            {activeTab === "incidents" && incidentList.length === 0 && (
              <EmptyState message="No incident records found" />
            )}
            {activeTab === "eyes" && policeEyeList.length === 0 && (
              <EmptyState message="No police eye records found" />
            )}
          </>
        )}
      </div>
    </div>
  );
}

// Helper Components
function EmptyState({ message }: { message: string }) {
  return (
    <div className="text-center py-12">
      <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
        <AlertCircle className="w-8 h-8 text-gray-400" />
      </div>
      <p className="text-gray-500 text-lg">{message}</p>
    </div>
  );
}