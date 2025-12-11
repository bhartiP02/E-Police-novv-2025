"use client";

import React, { useState, useEffect } from "react";
import { AppSidebar } from "@/component/layout/app-sidebar";
import Navbar from "@/component/layout/navbar";
import { Toaster } from "sonner";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";

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
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  
  // ========= MAIN FIX =========
  // Sidebar is ALWAYS open on desktop (lg screens)
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Check authentication
  useEffect(() => {
    if (!user) {
      router.replace("/login");
    }
  }, [user, router]);

  // Auto-enable sidebar if screen is large
  useEffect(() => {
    const checkScreen = () => {
      if (window.innerWidth >= 1024) {
        setSidebarOpen(true);
      }
    };

    checkScreen(); // run once
    window.addEventListener("resize", checkScreen);

    return () => window.removeEventListener("resize", checkScreen);
  }, []);

  // Show loading or nothing while checking auth
  if (!user) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-[#0F0F0F]">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <div className="flex h-screen w-full overflow-hidden bg-[#0F0F0F]">
        
        {/* 👍 SIDEBAR ALWAYS VISIBLE ON DESKTOP */}
        <AppSidebar
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)} // Only closes on mobile
        />

        {/* PAGE CONTENT */}
        <div className="flex-1 overflow-auto bg-[#0F0F0F] text-white">
          <div className="my-6 mr-6 bg-white space-y-6 py-8 px-6 rounded-4xl">
            {/* NAVBAR */}
            <Navbar onMenuClick={() => setSidebarOpen((prev) => !prev)} />

            {/* CHILDREN CONTENT */}
            {children}
          </div>
        </div>

        <Toaster richColors closeButton />
      </div>

      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}