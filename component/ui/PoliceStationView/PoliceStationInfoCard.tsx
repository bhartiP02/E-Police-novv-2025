"use client";

import { Mail, Phone } from "lucide-react";

interface PoliceStationDetails {
  id: number;
  name: string;
  email: string;
  mobile: string;
  image_url?: string;
}

interface PoliceStationInfoCardProps {
  stationDetails: PoliceStationDetails;
}

export default function PoliceStationInfoCard({ stationDetails }: PoliceStationInfoCardProps) {
  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden sticky top-24">

      {/* Image Section */}
      <div className="bg-gradient-to-br from-blue-100 to-purple-100 p-6">
        <div className="w-32 h-32 mx-auto bg-white rounded-lg shadow-md overflow-hidden">
          <img
            src={stationDetails.image_url || "/police_station_image"}
            alt="Police Station"
            className="w-full h-full object-cover"
            onError={(e) => {
              e.currentTarget.src =
                "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 200 200'%3E%3Crect fill='%23E7EDFD' width='200' height='200'/%3E%3Ctext x='100' y='100' font-size='60' text-anchor='middle' dy='.3em' fill='%239A65C2' font-weight='bold'%3EPS%3C/text%3E%3C/svg%3E";
            }}
          />
        </div>
      </div>

      {/* Name Section */}
      <div className="px-6 py-4 text-left">
        <h2 className="text-xl font-bold text-gray-800">{stationDetails.name}</h2>
      </div>

      {/* Only Email & Phone */}
      <div className="px-6 pb-6 space-y-4">
        
        {/* Email */}
        <div className="flex items-center gap-3">
          <Mail className="w-5 h-5 text-blue-600" />
          <p className="text-sm text-gray-800 break-words">{stationDetails.email}</p>
        </div>

        {/* Phone */}
        <div className="flex items-center gap-3">
          <Phone className="w-5 h-5 text-green-600" />
          <p className="text-sm text-gray-800 break-words">{stationDetails.mobile}</p>
        </div>

      </div>
    </div>
  );
}
