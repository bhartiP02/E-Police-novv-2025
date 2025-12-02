"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore"; // Adjust path as needed

const COLORS = {
  backgroundLight: "#E7E9FF",
  primary: "#9A65C2",
  text: "#0F0F0F",
};

interface NavbarProps {
  onMenuClick: () => void;
}

export default function Navbar({ onMenuClick }: NavbarProps) {
  const [openDropdown, setOpenDropdown] = useState(false);
  const router = useRouter();
  const { logout } = useAuthStore();

  const handleLogout = () => {
    logout();
    router.push("/login"); // Redirect to login page after logout
  };

  return (
    <div
      className="w-full h-14 px-4 flex items-center justify-between rounded-xl shadow-sm z-50 relative"
      style={{ backgroundColor: COLORS.backgroundLight }}
    >
      {/* LEFT SECTION (MENU ICON) */}
      <div className="flex items-center gap-6">
        <button
          onClick={onMenuClick}
          className="p-2 hover:bg-white/40 rounded-md transition-colors border-[#0F0F0F]"
          aria-label="Toggle sidebar"
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#0F0F0F"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </button>
      </div>

      {/* CENTERED NAV LINKS */}
      <div className="absolute left-1/2 transform -translate-x-1/2">
        <div className="flex items-center gap-6 text-sm font-medium">
          <Link href="/dashboard" className="text-purple-600 hover:underline">
            Dashboard
          </Link>

          {/* DROPDOWN */}
          <div className="relative">
            <button
              onClick={() => setOpenDropdown(!openDropdown)}
              className="flex items-center gap-1 text-black hover:text-purple-600 transition"
            >
              Manage Master
              <svg
                width="12"
                height="12"
                viewBox="0 0 12 12"
                fill="currentColor"
                className={`transition-transform ${openDropdown ? "rotate-180" : ""}`}
              >
                <path d="M6 9L1 4h10z" />
              </svg>
            </button>

            {openDropdown && (
              <div className="absolute mt-2 w-44 bg-white rounded-lg shadow-md border z-50">

                <Link
                  href="/dashboard/Masters/Cities"
                  className="block px-4 py-2 hover:bg-gray-100 text-sm"
                  style={{ color: COLORS.text }}
                >
                  Cities
                </Link>

                <Link
                  href="/dashboard/Masters/Crime"
                  className="block px-4 py-2 hover:bg-gray-100 text-sm"
                  style={{ color: COLORS.text }}
                >
                  Crime
                </Link>

                <Link
                  href="/dashboard/Masters/District"
                  className="block px-4 py-2 hover:bg-gray-100 text-sm"
                  style={{ color: COLORS.text }}
                >
                  District
                </Link>

                <Link
                  href="/dashboard/Masters/SDPO"
                  className="block px-4 py-2 hover:bg-gray-100 text-sm"
                  style={{ color: COLORS.text }}
                >
                  SDPO
                </Link>

                <Link
                  href="/dashboard/Masters/State"
                  className="block px-4 py-2 hover:bg-gray-100 text-sm"
                  style={{ color: COLORS.text }}
                >
                  State
                </Link>
              </div>
            )}
          </div>

          <Link
            href="#"
            className="block px-4 py-2 text-[#0F0F0F] hover:text-purple-600"
          >
            Task
          </Link>

          <Link href="#" className="text-[#0F0F0F] hover:text-purple-600">
            Report
          </Link>
        </div>
      </div>

      {/* RIGHT SECTION (ICONS) */}
      <div className="flex items-center gap-3">
        <button className="hover:bg-white/40 p-2 rounded-md transition-colors border-[#0F0F0F]">
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#0F0F0F"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
            <path d="M13.73 21a2 2 0 0 1-3.46 0" />
          </svg>
        </button>

        {/* LOGOUT BUTTON */}
        <button
          onClick={handleLogout}
          className="hover:bg-white/40 p-2 rounded-md transition-colors border-[#0F0F0F]"
          aria-label="Logout"
          title="Logout"
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 512 512"
            fill="#0F0F0F"
          >
            <path d="M377.9 105.9L500.7 228.7c7.2 7.2 11.3 17.1 11.3 27.3s-4.1 20.1-11.3 27.3L377.9 406.1c-6.4 6.4-15 9.9-24 9.9c-18.7 0-33.9-15.2-33.9-33.9l0-62.1-128 0c-17.7 0-32-14.3-32-32l0-64c0-17.7 14.3-32 32-32l128 0 0-62.1c0-18.7 15.2-33.9 33.9-33.9c9 0 17.6 3.6 24 9.9zM160 96L96 96c-17.7 0-32 14.3-32 32l0 256c0 17.7 14.3 32 32 32l64 0c17.7 0 32 14.3 32 32s-14.3 32-32 32l-64 0c-53 0-96-43-96-96L0 128C0 75 43 32 96 32l64 0c17.7 0 32 14.3 32 32s-14.3 32-32 32z" />
          </svg>
        </button>
      </div>
    </div>
  );
}