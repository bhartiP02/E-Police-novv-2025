"use client";

import { useState, useEffect } from "react";
import { X, Mail, Phone, MapPin } from "lucide-react";

// Types
interface PoliceStationDetails {
  id: number;
  name: string;
  email: string;
  mobile: string;
  state_name: string;
  district_name: string;
  city_name: string;
  pincode: string;
  address: string;
  category: string;
  status: string;
  sdpo_name?: string;
  image_url?: string;
}

interface Police {
  id: number;
  name: string;
  designation: string;
  mobile: string;
  email: string;
  status: string;
}

interface Criminal {
  id: number;
  name: string;
  crime_type: string;
  status: string;
  arrest_date: string;
}

interface Incident {
  id: number;
  incident_type: string;
  date: string;
  description: string;
  status: string;
}

interface PoliceEye {
  id: number;
  location: string;
  camera_type: string;
  status: string;
  installation_date: string;
}

interface PoliceStationViewProps {
  policeStationId: number;
  isOpen: boolean;
  onClose: () => void;
  apiBaseUrl?: string;
}

export default function PoliceStationView({
  policeStationId,
  isOpen,
  onClose,
  apiBaseUrl = "/api"
}: PoliceStationViewProps) {
  const [activeTab, setActiveTab] = useState<string>("details");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Data states
  const [stationDetails, setStationDetails] = useState<PoliceStationDetails | null>(null);
  const [policeList, setPoliceList] = useState<Police[]>([]);
  const [criminalList, setCriminalList] = useState<Criminal[]>([]);
  const [incidentList, setIncidentList] = useState<Incident[]>([]);
  const [policeEyeList, setPoliceEyeList] = useState<PoliceEye[]>([]);

  // Fetch station details
  useEffect(() => {
    if (isOpen && policeStationId) {
      fetchStationDetails();
    }
  }, [isOpen, policeStationId]);

  // Fetch tab-specific data when tab changes
  useEffect(() => {
    if (isOpen && policeStationId && activeTab !== "details") {
      fetchTabData(activeTab);
    }
  }, [activeTab, isOpen, policeStationId]);

  const fetchStationDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`${apiBaseUrl}/police-stations/${policeStationId}`);
      
      if (!response.ok) throw new Error("Failed to fetch station details");
      
      const data = await response.json();
      
      // Extract data from various possible response structures
      const stationData = data?.data?.data || data?.data || data;
      setStationDetails(stationData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      console.error("Error fetching station details:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchTabData = async (tab: string) => {
    try {
      setLoading(true);
      let endpoint = "";
      
      switch (tab) {
        case "police":
          endpoint = `${apiBaseUrl}/police?station_id=${policeStationId}`;
          break;
        case "criminals":
          endpoint = `${apiBaseUrl}/criminals?station_id=${policeStationId}`;
          break;
        case "incidents":
          endpoint = `${apiBaseUrl}/incidents?station_id=${policeStationId}`;
          break;
        case "eyes":
          endpoint = `${apiBaseUrl}/police-eyes?station_id=${policeStationId}`;
          break;
      }

      if (endpoint) {
        const response = await fetch(endpoint);
        if (!response.ok) throw new Error(`Failed to fetch ${tab} data`);
        
        const data = await response.json();
        const extractedData = data?.data?.data || data?.data || data || [];
        
        switch (tab) {
          case "police":
            setPoliceList(extractedData);
            break;
          case "criminals":
            setCriminalList(extractedData);
            break;
          case "incidents":
            setIncidentList(extractedData);
            break;
          case "eyes":
            setPoliceEyeList(extractedData);
            break;
        }
      }
    } catch (err) {
      console.error(`Error fetching ${tab} data:`, err);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setActiveTab("details");
    setStationDetails(null);
    setPoliceList([]);
    setCriminalList([]);
    setIncidentList([]);
    setPoliceEyeList([]);
    onClose();
  };

  if (!isOpen) return null;

  const tabs = [
    { id: "details", label: "Police Station Details" },
    { id: "police", label: "Police Details" },
    { id: "criminals", label: "Criminal Details" },
    { id: "incidents", label: "Incident Spot" },
    { id: "eyes", label: "Police Eyes" }
  ];

  return (
    <div className="fixed inset-0 bg-white/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-7xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 px-6 py-4 border-b flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-800">Police Station Information</h2>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-gray-200 rounded-full transition-colors"
          >
            <X className="w-6 h-6 text-gray-600" />
          </button>
        </div>

        {/* Station Header Card */}
        {stationDetails && (
          <div className="bg-white border-b px-6 py-4">
            <div className="flex items-start gap-4">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <img
                  src={stationDetails.image_url || "/police_station_image"}
                  alt="Station"
                  className="w-full h-full object-cover rounded-lg"
                  onError={(e) => {
                    e.currentTarget.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Crect fill='%23E7EDFD' width='100' height='100'/%3E%3Ctext x='50' y='50' font-size='40' text-anchor='middle' dy='.3em' fill='%239A65C2'%3EPS%3C/text%3E%3C/svg%3E";
                  }}
                />
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold text-gray-800 mb-2">{stationDetails.name}</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                  <div className="flex items-center gap-2 text-gray-600">
                    <Mail className="w-4 h-4 text-blue-500" />
                    <span>{stationDetails.email}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <Phone className="w-4 h-4 text-green-500" />
                    <span>{stationDetails.mobile}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <MapPin className="w-4 h-4 text-red-500" />
                    <span>{stationDetails.city_name}, {stationDetails.state_name}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="border-b bg-gray-50">
          <div className="flex overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-6 py-3 text-sm font-medium whitespace-nowrap transition-colors ${
                  activeTab === tab.id
                    ? "border-b-2 border-purple-500 text-purple-600 bg-white"
                    : "text-gray-600 hover:text-gray-800 hover:bg-gray-100"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 bg-gray-50">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
            </div>
          ) : error ? (
            <div className="text-center text-red-600 py-8">
              <p className="text-lg font-semibold">Error loading data</p>
              <p className="text-sm mt-2">{error}</p>
            </div>
          ) : (
            <>
              {/* Police Station Details Tab */}
              {activeTab === "details" && stationDetails && (
                <div className="bg-white rounded-lg shadow-sm">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6">
                    <div className="space-y-4">
                      <DetailRow label="State" value={stationDetails.state_name} />
                      <DetailRow label="District" value={stationDetails.district_name} />
                      <DetailRow label="City" value={stationDetails.city_name} />
                      <DetailRow label="Pincode" value={stationDetails.pincode} />
                    </div>
                    <div className="space-y-4">
                      <DetailRow label="Address" value={stationDetails.address} />
                      <DetailRow label="Category" value={stationDetails.category || "N/A"} />
                      <DetailRow label="SDPO" value={stationDetails.sdpo_name || "N/A"} />
                      <DetailRow 
                        label="Status" 
                        value={
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                            stationDetails.status === "Active"
                              ? "bg-green-100 text-green-800"
                              : "bg-red-100 text-red-800"
                          }`}>
                            {stationDetails.status}
                          </span>
                        } 
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Police Details Tab */}
              {activeTab === "police" && (
                <DataTable
                  columns={[
                    { header: "S.NO.", key: "serial" },
                    { header: "Name", key: "name" },
                    { header: "Designation", key: "designation" },
                    { header: "Mobile", key: "mobile" },
                    { header: "Email", key: "email" },
                    { header: "Status", key: "status", isStatus: true }
                  ]}
                  data={policeList}
                  emptyMessage="No police records found"
                />
              )}

              {/* Criminal Details Tab */}
              {activeTab === "criminals" && (
                <DataTable
                  columns={[
                    { header: "S.NO.", key: "serial" },
                    { header: "Name", key: "name" },
                    { header: "Crime Type", key: "crime_type" },
                    { header: "Arrest Date", key: "arrest_date" },
                    { header: "Status", key: "status", isStatus: true }
                  ]}
                  data={criminalList}
                  emptyMessage="No criminal records found"
                />
              )}

              {/* Incident Spot Tab */}
              {activeTab === "incidents" && (
                <DataTable
                  columns={[
                    { header: "S.NO.", key: "serial" },
                    { header: "Incident Type", key: "incident_type" },
                    { header: "Date", key: "date" },
                    { header: "Description", key: "description" },
                    { header: "Status", key: "status", isStatus: true }
                  ]}
                  data={incidentList}
                  emptyMessage="No incident records found"
                />
              )}

              {/* Police Eyes Tab */}
              {activeTab === "eyes" && (
                <DataTable
                  columns={[
                    { header: "S.NO.", key: "serial" },
                    { header: "Location", key: "location" },
                    { header: "Camera Type", key: "camera_type" },
                    { header: "Installation Date", key: "installation_date" },
                    { header: "Status", key: "status", isStatus: true }
                  ]}
                  data={policeEyeList}
                  emptyMessage="No police eye records found"
                />
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// Helper Components
function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex flex-col">
      <span className="text-sm font-medium text-gray-500 mb-1">{label}</span>
      <div className="text-base text-gray-800">{value}</div>
    </div>
  );
}

interface Column {
  header: string;
  key: string;
  isStatus?: boolean;
}

function DataTable({ 
  columns, 
  data, 
  emptyMessage 
}: { 
  columns: Column[]; 
  data: any[]; 
  emptyMessage: string;
}) {
  if (data.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-8 text-center">
        <p className="text-gray-500">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-blue-50">
            <tr>
              {columns.map((col, idx) => (
                <th
                  key={idx}
                  className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider"
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {data.map((row, rowIdx) => (
              <tr key={rowIdx} className="hover:bg-gray-50 transition-colors">
                {columns.map((col, colIdx) => (
                  <td key={colIdx} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {col.key === "serial" ? (
                      rowIdx + 1
                    ) : col.isStatus ? (
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        row[col.key] === "Active"
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }`}>
                        {row[col.key]}
                      </span>
                    ) : (
                      row[col.key] || "N/A"
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}