"use client";

import * as React from "react";
import Cookies from "js-cookie";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";

interface SubMenuItem {
  title: string;
  url: string;
  icon?: string; // OPTIONAL
}

interface MenuItem {
  title: string;
  url?: string;
  icon?: string; // OPTIONAL
  submenu?: SubMenuItem[];
}

// Decode token
function decodeToken(token: string) {
  try {
    return JSON.parse(atob(token.split(".")[1]));
  } catch {
    return null;
  }
}

const COLORS = {
  background: "#0F0F0F",
  primary: "#9A65C2",
  text: "#FFFFFF",
  textMuted: "#A0A0A0",
  hover: "#1A1A1A",
  border: "#2A2A2A",
};

type UserRole = "superAdmin" | "school" | "branchGroup" | "branch" | null;

interface AppSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AppSidebar({ isOpen, onClose }: AppSidebarProps) {
  const router = useRouter();
  const pathname = usePathname();

  const [userRole, setUserRole] = React.useState<UserRole>(null);
  const [expandedMenus, setExpandedMenus] = React.useState<Record<string, boolean>>({
    Masters: true,
    "Police Master": false,
    Task: false
  });

  React.useEffect(() => {
    const token = Cookies.get("token");
    const decoded = token ? decodeToken(token) : null;

    if (decoded?.role) setUserRole(decoded.role);
  }, []);

  const toggleMenu = (menu: string) => {
    setExpandedMenus((prev) => ({ ...prev, [menu]: !prev[menu] }));
  };

  // ----------- SIDEBAR STRUCTURE (MATCHING YOUR FILE STRUCTURE) -----------
  const sidebarData:MenuItem[] = [
    // Dashboard REMOVED from here (only in profile section now)

    // ---------- MASTERS -----------
    {
      title: "Masters",
      submenu: [
        { title: "State", url: "/dashboard/Masters/State"},
        { title: "District", url: "/dashboard/Masters/District"},
        { title: "Cities", url: "/dashboard/Masters/Cities"},
        { title: "SDPO", url: "/dashboard/Masters/SDPO"},
        { title: "Station", url: "/dashboard/Masters/station"},
        { title: "Police User", url: "/dashboard/Masters/police-user"},
      ],
    },

    // ---------- POLICE MASTER ----------
    {
      title: "Police Master",
      icon: "👮",
      submenu: [
        { title: "E-polish", url: "/dashboard/police-master/E-polish"},
        { title: "Manage Polish Station", url: "/dashboard/police-master/manage-polish-station"},
        { title: "Police Designation", url: "/dashboard/police-master/police-designation"},
        { title: "Police Eye", url: "/dashboard/police-master/police-eye"},
        { title: "Sensitive Area", url: "/dashboard/police-master/Sensitive-area"},
        { title: "Vehicles", url: "/dashboard/police-master/vehicles"},
      ],
    },

    // --------- OTHER MODULES ----------
    { title: "Check-Post", url: "/dashboard/check-post"},
    { title: "Criminals", url: "/dashboard/Criminals"},
    { title: "Incidence Point", url: "/dashboard/Incidence-spot"},
    { title: "Manage Police User", url: "/dashboard/manage-police-user"},
    { title: "Patrolling Attendance", url: "/dashboard/patrolling-attendance"},
    { title: "Reports", url: "/dashboard/Reports"},

    {
      title: "Task",
      icon: "📌",
      submenu: [
        { title: "Assign Police Task", url: "/dashboard/Task/assign-police-task", icon: "📝" },
        { title: "Assign Station Task", url: "/dashboard/Task/assign-station-task", icon: "🏢" },
        { title: "Task Categories", url: "/dashboard/Task/polish-task-categories", icon: "📚" },
      ],
    },
  ];

  // ------- AUTO-OPEN SUBMENU WHEN ITS CHILD IS ACTIVE -------
  React.useEffect(() => {
    sidebarData.forEach((item) => {
      if (item.submenu) {
        const isChildActive = item.submenu.some((sub) =>
          pathname.startsWith(sub.url)
        );
        if (isChildActive) {
          setExpandedMenus((prev) => ({ ...prev, [item.title]: true }));
        }
      }
    });
  }, [pathname]);

  const user = {
    name: "SPDO Tirora",
    role: "Head Person",
    location: "Gondia (500 meters)",
    image: "https://i.pravatar.cc/150?img=11",
  };

  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={onClose} />
      )}

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
        {/* HEADER */}
        <div
          className="flex items-center justify-between px-4 h-14 border-b"
          style={{ borderColor: COLORS.border }}
        >
          <h2 className="text-white text-sm font-semibold">Admin</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white lg:hidden">
            ✕
          </button>
        </div>

        {/* USER INFO */}
        <div className="px-4 py-6 border-b" style={{ borderColor: COLORS.border }}>
          <div className="flex flex-col items-center">
            <div className="relative">
              <img src={user.image} alt={user.name} className="w-20 h-20 rounded-full object-cover" />
              <div className="absolute -right-1 -bottom-1 bg-gray-900 p-1 rounded-full border border-gray-700 text-white text-sm">
                🔒
              </div>
            </div>

            <p className="text-white mt-3 text-sm font-semibold">{user.name}</p>
            <p className="text-gray-400 text-xs">{user.role}</p>
            <p className="text-gray-400 text-xs">{user.location}</p>

            {/* DASHBOARD BUTTON (FINAL STYLE + ACTIVE STATE) */}
            <Link
              href="/dashboard"
              className={`mt-4 w-full py-2 rounded-lg text-center text-sm font-medium transition flex items-center justify-center gap-2
                ${
                  pathname.startsWith("/dashboard")
                    ? "bg-[#9A65C2]"
                    : "bg-[#9A65C299] hover:bg-[#9A65C2]"
                }
              `}
            >
              📊 Dashboard
            </Link>
          </div>
        </div>

        {/* MENU */}
        <div className="flex-1 overflow-y-auto no-scrollbar">
          {sidebarData.map((item) => {
            // ---------- SUBMENU ----------
            if (item.submenu) {
              return (
                <div key={item.title}>
                  <button
                    onClick={() => toggleMenu(item.title)}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-800 text-white"
                  >
                    {item.icon && <span className="text-lg">{item.icon}</span>}
                    <span className="text-sm flex-1">{item.title}</span>
                    <span>{expandedMenus[item.title] ? "▼" : "▶"}</span>
                  </button>

                  {expandedMenus[item.title] && (
                    <div className="bg-black/30">
                      {item.submenu.map((sub) => {
                        const activeSub = pathname.startsWith(sub.url);
                        return (
                          <Link
                            key={sub.url}
                            href={sub.url}
                            className="flex items-center gap-3 px-4 pl-12 py-2.5 text-sm hover:bg-gray-800"
                            style={{
                              backgroundColor: activeSub ? COLORS.primary : "transparent",
                              color: COLORS.text,
                            }}
                          >
                            {sub.icon && <span className="text-lg">{sub.icon}</span>}
                            <span>{sub.title}</span>
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            }

            // ---------- NORMAL MENU ITEM ----------
            const isActive = pathname.startsWith(item.url);

            return (
              <Link
                key={item.url}
                href={item.url}
                className="flex items-center gap-3 px-4 py-3 hover:bg-gray-800"
                style={{
                  backgroundColor: isActive ? COLORS.primary : "transparent",
                  color: COLORS.text,
                }}
              >
                <span className="text-lg">{item.icon}</span>
                <span className="text-sm">{item.title}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </>
  );
}
