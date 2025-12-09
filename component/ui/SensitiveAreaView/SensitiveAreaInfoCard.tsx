// File: @/component/ui/SensitiveAreaView/SensitiveAreaInfoCard.tsx
"use client";

interface SensitiveAreaCardProps {
  areaDetails: {
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
  };
}

export default function SensitiveAreaInfoCard({ areaDetails }: SensitiveAreaCardProps) {
  const handleDownloadQR = () => {
    if (areaDetails.qrcode_url) {
      const link = document.createElement("a");
      link.href = areaDetails.qrcode_url;
      link.download = `qrcode-${areaDetails.id}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden print:shadow-none print:border print:border-gray-300">
      {/* QR Code Section */}
      <div className="p-6 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">QR Code</h3>
        <div className="bg-gray-100 rounded-lg p-4 flex items-center justify-center min-h-[250px]">
          {areaDetails.qrcode_url ? (
            <img
              src={areaDetails.qrcode_url}
              alt="QR Code"
              className="w-full h-auto max-w-[220px]"
            />
          ) : (
            <p className="text-gray-500">No QR Code available</p>
          )}
        </div>

        {/* QR Value */}
        <div className="mt-4">
          <p className="text-sm text-gray-600 font-semibold">QR VALUE</p>
          <p className="text-sm font-mono bg-gray-100 p-3 rounded break-all mt-2">
            {areaDetails.qrcode}
          </p>
        </div>

        {/* Sensitive Area Details */}
        <div className="mt-6 space-y-4">
          <div>
            <p className="text-sm font-semibold text-gray-600 uppercase">ADDRESS</p>
            <p className="text-gray-800 mt-1">{areaDetails.address}</p>
          </div>

          <div>
            <p className="text-sm font-semibold text-gray-600 uppercase">STATE</p>
            <p className="text-gray-800 mt-1">{areaDetails.state_name}</p>
          </div>

          <div>
            <p className="text-sm font-semibold text-gray-600 uppercase">DISTRICT</p>
            <p className="text-gray-800 mt-1">{areaDetails.district_name}</p>
          </div>

          <div>
            <p className="text-sm font-semibold text-gray-600 uppercase">CITY</p>
            <p className="text-gray-800 mt-1">{areaDetails.city_name}</p>
          </div>

          <div>
            <p className="text-sm font-semibold text-gray-600 uppercase">POLICE STATION</p>
            <p className="text-gray-800 mt-1">{areaDetails.police_station_name}</p>
          </div>

          <div>
            <p className="text-sm font-semibold text-gray-600 uppercase">SDPO</p>
            <p className="text-gray-800 mt-1">{areaDetails.sdpo_name || "Not assigned"}</p>
          </div>
        </div>

        {/* Download QR Button */}
        <button
          onClick={handleDownloadQR}
          className="w-full mt-6 bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium print:hidden"
        >
          Download QR Code
        </button>
      </div>
    </div>
  );
}