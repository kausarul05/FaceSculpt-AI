"use client";

import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { useRouter } from "next/navigation";
import { apiRequest } from "./lib/api";

type LoginFormData = {
  phone_number: string;
  password: string;
  rememberMe: boolean;
};

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState<LoginFormData>({
    phone_number: "",
    password: "",
    rememberMe: false,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
    if (error) setError("");
  };

  const handleLogin = async () => {
    if (!formData.phone_number || !formData.password) {
      setError("Please fill in all fields");
      return;
    }

    // Validate phone number format (example: 11 digits starting with 880)
    // const phoneRegex = /^880\d{10}$/;
    // if (!phoneRegex.test(formData.phone_number)) {
    //   setError("Please enter a valid Bangladeshi phone number (e.g., 8801708050645)");
    //   return;
    // }

    setIsLoading(true);
    setError("");

    try {
      const payload = {
        phone_number: formData.phone_number,
        password: formData.password,
      };
      const data = await apiRequest("POST", "/api/dashboard/login/", payload);

      console.log("data", data)
      
      if (data.data) {
        localStorage.setItem("authToken", data?.data?.token);
        localStorage.setItem("refreshToken", data?.data?.refresh_token);
        localStorage.setItem("admin_name", data?.data?.admin_name);
        
        if (formData.rememberMe) {
          localStorage.setItem("rememberMe", "true");
        }
        
        router.push("/admin");
      } else {
        setError(data.message || "Login failed. Please check your credentials.");
      }
      
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Something went wrong. Please try again.";
      setError(errorMessage);
    } finally {
      setIsLoading(false); // Uncomment when using real API
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !isLoading) handleLogin();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#000000] p-4">
      <div className="bg-[#1A2028] text-white rounded-2xl w-full max-w-[500px] p-8 border border-[#60A5FB]">
        <h2 className="text-3xl font-semibold text-white mb-3">Welcome!</h2>
        <p className="text-[#E5E5E5] font-medium mb-8">
          Let&apos;s login into your account first
        </p>

        {error && (
          <div className="mb-4 p-3 bg-red-500/20 border border-red-500 rounded-lg text-red-300 text-sm whitespace-pre-wrap">
            {error}
          </div>
        )}

        <div className="space-y-5">
          <div>
            <label className="block text-sm font-semibold text-white mb-2">Phone Number</label>
            <div className="relative">
              <input
                type="text"
                name="phone_number"
                placeholder="Enter your phone number (e.g., 8801708050645)"
                value={formData.phone_number}
                onChange={handleInputChange}
                onKeyPress={handleKeyPress}
                className="w-full p-3 border border-[#FFFFFF] rounded-lg bg-transparent text-white disabled:opacity-50"
                disabled={isLoading}
                autoComplete="tel"
                pattern="[0-9]*"
                inputMode="numeric"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-white mb-2">Password</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                placeholder="Enter your password"
                value={formData.password}
                onChange={handleInputChange}
                onKeyPress={handleKeyPress}
                className="w-full p-3 border border-[#FFFFFF] rounded-lg bg-transparent text-white disabled:opacity-50"
                disabled={isLoading}
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 disabled:opacity-50"
                disabled={isLoading}
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          <div className="flex justify-between items-center">
            <label className="flex items-center">
              <input
                type="checkbox"
                name="rememberMe"
                checked={formData.rememberMe}
                onChange={handleInputChange}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 disabled:opacity-50"
                disabled={isLoading}
              />
              <span className="ml-2 text-xs text-white">Remember Me</span>
            </label>
            <button
              onClick={() => router.push("/forget-password")}
              className="text-sm text-[#EB4335] cursor-pointer disabled:opacity-50"
              disabled={isLoading}
            >
              Forgot Password?
            </button>
          </div>

          <button
            onClick={handleLogin}
            disabled={isLoading}
            className="w-full bg-[#60A5FB] text-white py-3 rounded-lg font-bold cursor-pointer transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
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
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 
                    3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Logging in...
              </>
            ) : (
              "Login"
            )}
          </button>

          <div className="text-sm text-white text-center flex justify-between mt-10">
            <span>© 2025. FaceSculpt AI. All rights reserved.</span>
            <span className="text-[#60A5FB] cursor-pointer">
              Terms & Conditions
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}