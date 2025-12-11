import { getQueryClient } from "@/services/api/queryClient";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { jwtDecode } from "jwt-decode";

interface DecodedToken {
  id: string;
  username: string;
  role: string;
}

interface UserData {
  id: number;
  name: string;
  email: string;
  mobile: number;
  designation_type: "Admin" | "Head_Person" | "SDPO" | "Station_Head" | "Police";
  police_station_id?: number;
  district_id?: number;
}

interface AuthState {
  isAuthenticated: boolean;
  token: string | null;
  decodedToken: DecodedToken | null;
  user: UserData | null;

  // Hydration flag
  isHydrated: boolean;

  login: (token: string, user: UserData) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      isAuthenticated: false,
      token: null,
      decodedToken: null,
      user: null,

      isHydrated: false,   // 🚀 NEW

      login: (token: string, user: UserData) => {
        // Save token
        document.cookie = `token=${token}; path=/`;
        localStorage.setItem("token", token);
        localStorage.setItem("user", JSON.stringify(user));

        const decoded = jwtDecode<DecodedToken>(token);

        set({
          isAuthenticated: true,
          token,
          decodedToken: decoded,
          user,
        });
      },

      logout: () => {
        document.cookie = "token=; Max-Age=0; path=/";
        localStorage.removeItem("token");
        localStorage.removeItem("user");

        getQueryClient().clear();

        set({
          isAuthenticated: false,
          token: null,
          decodedToken: null,
          user: null,
        });
      },
    }),

    // === PERSIST CONFIG ===
    {
      name: "auth-storage",
      partialize: (state) => ({
        token: state.token,
        user: state.user,
        decodedToken: state.decodedToken,
        isAuthenticated: state.isAuthenticated,
      }),

      onRehydrateStorage: () => (state) => {
        if (state) {
          state.isHydrated = true; 
        }
      },
    }
  )
);
