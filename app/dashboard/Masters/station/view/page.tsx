"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import PoliceStationInfoCard from "@/component/ui/PoliceStationView/PoliceStationInfoCard";
import PoliceStationTabs from "@/component/ui/PoliceStationView/PoliceStationTabs";
import { api } from "@/services/api/apiServices";

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

function PoliceStationViewPageComponent() {
  const searchParams = useSearchParams();
  const policeStationId = searchParams.get("id");

  const [stationDetails, setStationDetails] = useState<PoliceStationDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (policeStationId) {
      fetchStationDetails(policeStationId);
    }
  }, [policeStationId]);

  const fetchStationDetails = async (id: string) => {
    try {
      setLoading(true);
      setError(null);

      const response = await api.get(`/police-stations/${id}`);
      const stationData =
        response?.data?.data || response?.data || response;

      setStationDetails(stationData);
    } catch (err) {
      setError("Failed to fetch Police Station information.");
    } finally {
      setLoading(false);
    }
  };

  if (!policeStationId) {
    return (
      <div className="min-h-screen flex items-center justify-center text-red-600">
        Missing Police Station ID
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  if (error || !stationDetails) {
    return (
      <div className="min-h-screen flex items-center justify-center text-red-600">
        {error || "Police Station not found"}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-6">
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-4">
          <PoliceStationInfoCard stationDetails={stationDetails} />
        </div>

        <div className="lg:col-span-8">

          <PoliceStationTabs policeStationId={parseInt(policeStationId)} />

        </div>
      </div>
    </div>
  );
}

export default function PoliceStationViewPage() {
  return (
    <Suspense>
      <PoliceStationViewPageComponent />
    </Suspense>
  )
}