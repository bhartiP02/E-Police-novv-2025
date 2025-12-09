"use client";

import React from "react";

interface SensitiveAreaPrintProps {
  data: {
    id: number;
    address: string;
    latitude: string;
    longitude: string;
    qrcode: string;
    qrcode_url: string;
    police_station_name?: string;
    district_name?: string;
    status?: string;
  };
  onClose?: () => void;
}

export const SensitiveAreaPrint: React.FC<SensitiveAreaPrintProps> = ({
  data,
  onClose
}) => {
  const handlePrint = () => window.print();

  return (
    <div className="w-full min-h-screen flex flex-col items-center bg-gray-50 py-8 px-3">

      {/* Card */}
      <div
        className="p-6 bg-white rounded-xl shadow-2xl border-[18px]"
        style={{ borderColor: "#9A65C2" }}
      >
        
        {/* QR Code */}
        <div className="border-[6px] border-gray-300 p-2 mb-6 mx-auto rounded-md">
          <img
            src={data.qrcode_url}
            alt="QR Code"
            className="w-56 h-56 object-contain"
          />
        </div>

        {/* AREA */}
        <div className="text-center my-4">
          <h3 className="font-bold text-sm text-black tracking-wide uppercase">
            AREA
          </h3>
          <div className="border-t border-gray-300 w-4/5 mx-auto my-2"></div>
          <p className="text-md text-black font-medium">
            {data.address || "N/A"}
          </p>
        </div>

        {/* POLICE STATION */}
        <div className="text-center my-4">
          <h3 className="font-bold text-sm text-black tracking-wide uppercase">
            POLICE STATION NAME
          </h3>
          <div className="border-t border-gray-300 w-4/5 mx-auto my-2"></div>
          <p className="text-md text-black font-medium">
            {data.police_station_name || "Not Assigned"}
          </p>
        </div>

        {/* Purple Generator Bar */}
        <div
        className="text-center font-semibold py-2 mt-4 rounded-md"
        style={{ backgroundColor: "#9A65C2", color: "black", fontSize: "13px" }}
        >
        HB POLICE SELFIE GENERATOR
        </div>


        {/* Footer */}
        <p className="text-center text-xs text-gray-600 mt-4">
          © 2020 HB GADGET
        </p>
      </div>

      {/* Buttons */}
      <div className="flex gap-3 mt-4 print:hidden">
        <button
          onClick={handlePrint}
          className="px-6 py-2 bg-[#9A65C2] text-black rounded-lg shadow-md hover:bg-[#854eb3] transition"
        >
          Print
        </button>

        <button
          onClick={onClose}
          className="px-6 py-2 bg-gray-300 text-gray-800 rounded-lg shadow-md hover:bg-gray-400 transition"
        >
          Cancel
        </button>
      </div>

      {/* Print Styles */}
      <style>{`
        @media print {
          .print\\:hidden {
            display: none !important;
          }
          body {
            margin: 0 !important;
            padding: 0 !important;
            background: white !important;
          }
        }
      `}</style>
    </div>
  );
};
