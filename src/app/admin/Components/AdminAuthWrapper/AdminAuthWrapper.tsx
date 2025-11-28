// app/components/AdminAuthWrapper.tsx
"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function AdminAuthWrapper({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState("checking");
  const router = useRouter();

  useEffect(() => {
    const checkAdminAuth = () => {
      const authToken = localStorage.getItem("authToken");
      const userData = localStorage.getItem("userData");

      if (!authToken) {
        // No token, redirect to login
        router.replace("/login");
        return;
      }


      // Check if user is admin (you'll need to adjust this based on your user data structure)
      if (userData) {
        try {
          const user = JSON.parse(userData);
          // Adjust this condition based on how you identify admin users
          if (user?.is_staff || user === true || user.role === "admin" || user.is_staff) {
            setStatus("authenticated");
          } else {
            // Not admin, redirect to home or unauthorized page
            router.replace("/");
          }
        } catch (error) {
          console.error("Error parsing user data:", error);
          router.replace("/login");
        }
      } else {
        // No user data, redirect to login
        router.replace("/login");
      }
    };

    checkAdminAuth();
  }, [router]);

  if (status === "checking") {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#0A2131]">
        <div className="text-white">Checking admin permissions...</div>
      </div>
    );
  }

  return <>{children}</>;
}