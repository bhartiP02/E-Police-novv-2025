"use client";


import React, { useState } from "react";
import { AppSidebar } from "@/component/layout/app-sidebar";
import Navbar from "@/component/layout/navbar";
import { Toaster } from "sonner";

// React Query
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";

// Create Query Client (once)
const queryClient = new QueryClient();

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    //  Wrap entire layout with QueryClientProvider
    <QueryClientProvider client={queryClient}>
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
            <Navbar onMenuClick={() => setSidebarOpen(!sidebarOpen)} />

            {/* Actual Page Content */}
            {children}
          </div>
        </div>

        {/* Toast Notifications */}
        <Toaster richColors closeButton />
      </div>

      {/* Optional Devtools (Good for debugging) */}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}
