"use client";

import React, { useState } from "react";
import { AppSidebar } from "@/component/layout/app-sidebar";
import Navbar from "@/component/layout/navbar";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen w-full overflow-hidden bg-[#0F0F0F]">

      {/* Sidebar */}
      <AppSidebar 
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Page Content */}
      <div className="flex-1 overflow-auto bg-[#0F0F0F] text-white">
        <div className="my-6 mr-6 bg-white space-y-6 py-8 px-6 rounded-4xl">

        {/* Navbar */}
        {/* <div className="p-3 bg-white"> */}
          <Navbar onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
        {/* </div> */} 

        {/* Actual Page Content */}
        {/* <div className="p-3 bg-white"> */}
          {children}
        {/* </div> */}

        </div>


      </div>
    </div>
  );
}
