"use client";

import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import { useEffect, useState } from "react";
import { loginUser } from "@/services/api/userLoginService";
import Image from "next/image";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const { isAuthenticated, login } = useAuthStore();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      router.replace("/dashboard");
    }
  }, [isAuthenticated, router]);

  useEffect(() => {
    if (localStorage.getItem("token")) {
      router.replace("/login");
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const data = await loginUser(email, password);

      if (data?.token && data?.user) {
        login(data.token, data.user);     
        router.push("/dashboard");
      } else {
        alert("Invalid response from server.");
      }
    } catch (error: any) {
      console.error("Login error:", error);
      alert("Login failed. Please check your credentials.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative flex items-center justify-center min-h-screen overflow-hidden bg-gradient-to-br from-gray-800 via-gray-700 to-gray-900">
      {/* Background overlay with blur effect */}
      <div className="absolute inset-0 bg-[url('/background.svg')] bg-cover bg-center opacity-30 blur-sm"></div>
      
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 w-80 h-80 bg-orange-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -right-40 w-80 h-80 bg-orange-600/10 rounded-full blur-3xl animate-pulse"></div>
      </div>

      {/* Login Card Container */}
      <div className="relative z-10 w-full max-w-md px-4">
        <div className="w-full bg-white/95 backdrop-blur-md rounded-3xl shadow-2xl border-2 border-orange-100 overflow-hidden">
          {/* Logo Section */}
          <div className="pt-8 pb-4 px-8 bg-gradient-to-b from-orange-50 to-white">
            <div className="text-center">
              <div className="flex justify-center mb-4">
                <div className="relative w-24 h-24 bg-white rounded-full shadow-lg p-2 border-4 border-orange-500">
                  <Image
                    src="/logo.svg"
                    alt="E-Police Logo"
                    width={80}
                    height={80}
                    className="w-full h-full object-contain"
                    priority
                  />
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-2xl font-bold text-gray-800 tracking-tight">
                  E-POLICE
                </p>
                <p className="text-base font-medium">
                  <span className="text-gray-700">Login</span>{" "}
                  <span className="text-orange-600">to your account</span>
                </p>
              </div>
            </div>
          </div>

          {/* Form Section */}
          <div className="px-8 pb-8 pt-6">
            <div className="space-y-5">
              {/* Email Input */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Enter email address
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                      />
                    </svg>
                  </span>
                  <input
                    type="email"
                    placeholder="Enter email address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={isLoading}
                    className="w-full h-12 pl-10 pr-4 text-base text-black border border-gray-300 rounded-lg focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 focus:outline-none bg-gray-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                </div>
              </div>

              {/* Password Input */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Password
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                      />
                    </svg>
                  </span>
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={isLoading}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !isLoading) {
                        handleSubmit(e);
                      }
                    }}
                    className="w-full h-12 pl-10 pr-10 text-base text-black border border-gray-300 rounded-lg focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 focus:outline-none bg-gray-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    onClick={() => setShowPassword((prev) => !prev)}
                    tabIndex={-1}
                    disabled={isLoading}
                  >
                    {showPassword ? (
                      // Eye Off Icon
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                        />
                      </svg>
                    ) : (
                      // Eye Icon
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                        />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              {/* Login Button */}
              <button
                type="button"
                onClick={handleSubmit}
                disabled={isLoading}
                className="w-full h-12 text-base font-bold bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white shadow-lg rounded-lg mt-6 transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center"
              >
                {isLoading ? (
                  <>
                    <svg
                      className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Logging in...
                  </>
                ) : (
                  "Login"
                )}
              </button>

              {/* Sign Up Link */}
              <div className="text-center pt-4">
                <p className="text-sm text-gray-600">
                  Don't have a account?{" "}
                  <Link
                    href="/signup"
                    className="font-semibold text-orange-600 hover:text-orange-700 underline transition-colors"
                  >
                    Sign up
                  </Link>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}