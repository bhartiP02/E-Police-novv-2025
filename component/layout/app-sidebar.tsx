"use client";

import * as React from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { useAuthStore } from "@/store/authStore";

const COLORS = {
  background: "#0F0F0F",
  primary: "#9A65C2",
  text: "#FFFFFF",
  textMuted: "#A0A0A0",
  hover: "#1A1A1A",
  border: "#2A2A2A",
};

interface SubMenuItem {
  title: string;
  url: string;
  icon?: string;
}

interface MenuItem {
  title: string;
  url?: string;
  icon?: string;
  submenu?: SubMenuItem[];
  roles: string[];
}

export function AppSidebar({ isOpen, onClose }) {
  const router = useRouter();
  const pathname = usePathname();
  const user = useAuthStore((s) => s.user);

  const realRole = user?.designation_type;

  const [expandedMenus, setExpandedMenus] = React.useState({});

  const toggleMenu = (menu: string) =>
    setExpandedMenus((prev) => ({ ...prev, [menu]: !prev[menu] }));

  if (!user) return null;

  // --------------------------------
  //  ROLE-BASED SIDEBAR CONFIG
  // --------------------------------
  const sidebarData: MenuItem[] = [
    // LIVE TRACKING
    {
      title: "Live Tracking",
      url: "/dashboard/live-tracking",
      roles: ["Admin", "Head_Person", "SDPO", "Station_Head", "Police"],
    },

    // CHECKPOST
    {
      title: "Checkpost/Nakabandi",
      url: "/dashboard/check-post",
      roles: ["Admin", "Head_Person", "SDPO", "Station_Head", "Police"],
    },

    // MASTERS
    {
      title: "Manage Masters",
      roles: ["Admin", "Head_Person", "SDPO"],
      submenu: [
        { title: "State", url: "/dashboard/Masters/State", roles: ["Admin"] },
        { title: "District", url: "/dashboard/Masters/District", roles: ["Admin"] },
        { title: "Cities", url: "/dashboard/Masters/Cities", roles: ["Admin"] },
        { title: "SDPO", url: "/dashboard/Masters/SDPO", roles: ["Admin", "Head_Person", "SDPO"] },
        { title: "Station", url: "/dashboard/Masters/station", roles: ["Admin", "Head_Person", "SDPO"] },
        { title: "Police User", url: "/dashboard/Masters/police-user", roles: ["Admin", "Head_Person", "SDPO"] },
      ],
    },

    // POLICE MASTERS
    {
      title: "Police Masters",
      roles: ["Admin", "Head_Person", "SDPO", "Station_Head"],
      submenu: [
        { title: "Police Designation", url: "/dashboard/police-master/police-designation" , roles: ["Admin", "Head_Person", "SDPO"]},
        { title: "Sensitive Areas", url: "/dashboard/police-master/Sensitive-area",roles: ["Admin", "Head_Person", "SDPO","Station_Head","Police"] },
        { title: "E-Polish", url: "/dashboard/police-master/E-polish",roles: ["Admin", "Head_Person", "SDPO"] },
        { title: "Manage Police Station", url: "/dashboard/police-master/manage-polish-station", roles: ["Admin", "Head_Person", "SDPO"] },
        { title: "Police Eye", url: "/dashboard/police-master/police-eye", roles: ["Admin", "Head_Person", "SDPO","Station_Head","Police"] },
        { title: "Vehicles", url: "/dashboard/police-master/vehicles",roles: ["Admin", "Head_Person", "SDPO","Station_Head","Police"] },
      ],
    },

    // TASKS
    {
      title: "Tasks",
      roles: ["Admin", "Head_Person", "SDPO", "Station_Head", "Police"],
      submenu: [
        { title: "Assign Police Task", url: "/dashboard/Task/assign-police-task", roles: ["Admin", "Head_Person", "SDPO", "Station_Head", "Police"] },
        { title: "Assign Station Task", url: "/dashboard/Task/assign-station-task", roles: ["Admin", "Head_Person", "SDPO"] },
        { title: "Task Categories", url: "/dashboard/Task/polish-task-categories", roles: ["Admin", "Head_Person", "SDPO"] },
      ],
    },

    // INCIDENCE
    {
      title: "Incidence Spot",
      url: "/dashboard/Incidence-spot",
      roles: ["Admin", "Head_Person", "SDPO", "Station_Head", "Police"],
    },

    // MANAGE POLICE USERS
    {
      title: "Manage Police Users",
      url: "/dashboard/manage-police-user",
      roles: ["Admin", "Head_Person", "SDPO", "Station_Head"],
    },

    // CRIMINALS
    {
      title: "Criminals",
      url: "/dashboard/Criminals",
      roles: ["Admin", "Head_Person", "SDPO", "Station_Head", "Police"],
    },

    // PATROLLING ATTENDANCE
    {
      title: "Patrolling Attendance",
      url: "/dashboard/patrolling-attendance",
      roles: ["Admin", "Head_Person", "SDPO", "Station_Head", "Police"],
    },

    // REPORTS
    {
      title: "Reports",
      roles: ["Admin", "Head_Person", "SDPO", "Station_Head", "Police"],
      submenu: [
        { title: "Selfie Report", url: "/dashboard/Reports/selfie", roles: ["Admin", "Head_Person", "SDPO", "Station_Head", "Police"] },
        { title: "Task Report", url: "/dashboard/Reports/task", roles: ["Admin", "Head_Person", "SDPO", "Station_Head"] },
        { title: "Police Summary Report", url: "/dashboard/Reports/summary", roles: ["Admin", "Head_Person", "SDPO", "Station_Head"] },
        { title: "Night Patrolling", url: "/dashboard/Reports/night", roles: ["Admin", "Head_Person", "SDPO", "Station_Head"] },
      ],
    },
  ];

  // -------------------------------------
  // RENDER SIDEBAR
  // -------------------------------------
  return (
    <>
      {isOpen && <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={onClose} />}

      <div
        className={`fixed lg:static inset-y-0 left-0 z-50 h-screen flex flex-col transition-transform duration-300 ${
          isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
        style={{
          width: "270px",
          backgroundColor: COLORS.background,
          borderRight: `1px solid ${COLORS.border}`,
        }}
      >
        {/* USER INFO */}
        <div className="px-6 py-8 border-b" style={{ borderColor: COLORS.border }}>
          <div className="flex flex-col items-center">
            {/* User Avatar with subtle shadow */}
            <div className="relative mb-4">
              <img 
                src="/user-avatar.png" 
                className="w-24 h-24 rounded-full object-cover shadow-lg"
              />
            </div>

            {/* User Name */}
            <p className="text-white mt-2 text-base font-semibold text-center">{user.name}</p>
            
            {/* User Role and District */}
            <p className="text-gray-400 text-xs mt-1 text-center">{user.designation_type}</p>
            <p className="text-gray-500 text-xs mt-0.5 text-center">District: {user.district_id}</p>

            {/* Dashboard Button */}
            <Link
              href="/dashboard"
              className={`mt-5 w-full py-2.5 rounded-lg text-center text-sm font-medium transition-all duration-200 ease-out flex items-center justify-center gap-2 hover:shadow-lg transform hover:scale-105 ${
                pathname.startsWith("/dashboard")
                  ? "bg-[#9A65C2] shadow-md"
                  : "bg-[#9A65C299] hover:bg-[#9A65C2]"
              }`}
            >
              📊 Dashboard
            </Link>
          </div>
        </div>

        {/* SIDEBAR MENU */}
        <div className="flex-1 overflow-y-auto no-scrollbar px-2 py-3">
          {sidebarData
            .filter((item) => item.roles.includes(realRole))
            .map((item) =>
              item.submenu ? (
                <div key={item.title}>
                  <button
                    onClick={() => toggleMenu(item.title)}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-white transition-all duration-200 ease-out hover:bg-gray-800/60"
                  >
                    {item.icon && <span>{item.icon}</span>}
                    <span className="text-sm flex-1 text-left font-medium">{item.title}</span>
                    <span className="transition-transform duration-200 text-sm">{expandedMenus[item.title] ? "∨" : ">"}</span>
                  </button>

                  {expandedMenus[item.title] && (
                    <div className="bg-black/30 rounded-lg my-1 overflow-hidden transition-all duration-200">
                      {item.submenu
                        .filter((sub) => !sub.roles || sub.roles.includes(realRole))
                        .map((sub) => {
                          const active = pathname.startsWith(sub.url);
                          return (
                            <Link
                              key={sub.url}
                              href={sub.url}
                              className="block px-6 py-2.5 text-sm transition-all duration-150 ease-out rounded-md mx-2 my-1"
                              style={{
                                backgroundColor: active ? COLORS.primary : "transparent",
                                color: COLORS.text,
                              }}
                            >
                              {sub.title}
                            </Link>
                          );
                        })}
                    </div>
                  )}
                </div>
              ) : (
                <Link
                  key={item.url}
                  href={item.url!}
                  className="flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ease-out"
                  style={{
                    backgroundColor: pathname.startsWith(item.url!)
                      ? COLORS.primary
                      : "transparent",
                    color: COLORS.text,
                  }}
                >
                  {item.icon && <span>{item.icon}</span>}
                  <span className="text-sm font-medium">{item.title}</span>
                </Link>
              )
            )}
        </div>
      </div>
    </>
  );
}