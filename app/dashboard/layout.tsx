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

const queryClient = new QueryClient();

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  // ✅ FIX: Use individual selectors — NO object returned
  const user = useAuthStore((s) => s.user);
  const isHydrated = useAuthStore((s) => s.isHydrated);

  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Wait for hydration before redirecting
  useEffect(() => {
    if (!isHydrated) return;

    if (!user) {
      router.replace("/login");
    }
  }, [isHydrated, user, router]);

  // Sidebar always open on large screens
  useEffect(() => {
    const checkScreen = () => {
      if (window.innerWidth >= 1024) {
        setSidebarOpen(true);
      }
    };
    checkScreen();
    window.addEventListener("resize", checkScreen);
    return () => window.removeEventListener("resize", checkScreen);
  }, []);

  // While hydrating, show loader
  if (!isHydrated) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#0F0F0F]">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <div className="flex h-screen w-full overflow-hidden bg-[#0F0F0F]">

        <AppSidebar
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />

        <div className="flex-1 overflow-auto bg-[#0F0F0F] text-white">
          <div className="my-6 mr-6 bg-white space-y-6 py-8 px-6 rounded-4xl">
            <Navbar onMenuClick={() => setSidebarOpen((prev) => !prev)} />
            {children}
          </div>
        </div>

        <Toaster position="top-center" richColors expand={true} />
      </div>

      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}
