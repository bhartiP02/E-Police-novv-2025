// File: @/app/dashboard/police-master/Sensitive-area/view/page.tsx
"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import SensitiveAreaInfoCard from "@/component/ui/SensitiveAreaView/SensitiveAreaInfoCard";
import SensitiveAreaTabs from "@/component/ui/SensitiveAreaView/SensitiveAreaTabs";
import { api } from "@/services/api/apiServices";
import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

interface SensitiveAreaDetails {
  id: number;
  address: string;
  latitude: string;
  longitude: string;
  qrcode: string;
  qrcode_url: string;
  image_url?: string;
  police_station_name: string;
  state_name: string;
  district_name: string;
  city_name: string;
  status: string;
  sdpo_name?: string;
}

function SensitiveAreaViewPageComponent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const areaId = searchParams.get("id");

  const [areaDetails, setAreaDetails] = useState<SensitiveAreaDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (areaId) {
      fetchAreaDetails(areaId);
    }
  }, [areaId]);

  const fetchAreaDetails = async (id: string) => {
    try {
      setLoading(true);
      setError(null);

      const response = await api.get(`/sensitive-areas/${id}`);
      const data = response?.data?.data || response?.data || response;
      const area = Array.isArray(data) ? data[0] : data;

      if (area) {
        const normalized: SensitiveAreaDetails = {
          id: area.id,
          address: area.address || "",
          latitude: area.latitude || "",
          longitude: area.longitude || "",
          qrcode: area.qrcode || "",
          qrcode_url: area.qrcode_url || "",
          image_url: area.image_url || "",
          police_station_name: area.policeStation?.name || area.police_station_name || "Not assigned",
          state_name: area.state?.state_name_en || area.state_name || "Not assigned",
          district_name: area.district?.district_name || area.district_name || "Not assigned",
          city_name: area.city?.city_name || area.city_name || "Not assigned",
          status: area.status || "Active",
          sdpo_name: area.sdpo_name || "Not assigned",
        };
        setAreaDetails(normalized);
      } else {
        setError("Sensitive area not found");
      }
    } catch (err) {
      console.error("Error fetching sensitive area:", err);
      setError("Failed to fetch sensitive area details");
    } finally {
      setLoading(false);
    }
  };

  if (!areaId) {
    return (
      <div className="min-h-screen flex items-center justify-center text-red-600">
        Missing Sensitive Area ID
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !areaDetails) {
    return (
      <div className="min-h-screen bg-gray-50 px-4 py-6">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-6"
        >
          <ArrowLeft size={20} />
          Go Back
        </button>
        <div className="bg-red-100 border border-red-400 text-red-700 px-6 py-4 rounded-lg">
          {error || "Sensitive area not found"}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-6">
      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-6 print:hidden"
      >
        <ArrowLeft size={20} />
        Go Back
      </button>

      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-4">
          <SensitiveAreaInfoCard areaDetails={areaDetails} />
        </div>

        <div className="lg:col-span-8">
          <SensitiveAreaTabs areaDetails={areaDetails} />
        </div>
      </div>
    </div>
  );
}

export default function SensitiveAreaViewPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <SensitiveAreaViewPageComponent />
    </Suspense>
  );
}