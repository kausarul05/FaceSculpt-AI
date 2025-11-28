// app/components/AuthWrapper.tsx
"use client";

import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";

export default function AuthWrapper({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState("checking");
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const authToken = localStorage.getItem("authToken");
    const userData = localStorage.getItem("userData");

    // Public paths that don't require authentication
    const publicPaths = ["/", "/login", "/register", "/forgot-password"];
    
    // Admin paths that require admin authentication
    const adminPaths = ["/admin", "/admin/settings", "/admin/user-management", "/admin/products-management", "/admin/review-management", "/admin/subscriptions"];

    if (!authToken) {
      // If no token and trying to access protected route, redirect to login
      if (!publicPaths.some(path => pathname === path || pathname.startsWith(path + '/'))) {
        router.replace("/login");
      } else {
        setStatus("unauthenticated");
      }
    } else {
      // Parse user data to check admin status
      let isAdmin = false;
      if (userData) {
        try {
          const user = JSON.parse(userData);
          isAdmin = user.is_staff === true || user.role === "admin";
        } catch {
          console.error("Error parsing user data");
        }
      }

      // If user is on public page but authenticated, redirect appropriately
      if (pathname === "/login" || pathname === "/register") {
        if (isAdmin) {
          router.replace("/admin");
        } else {
          router.replace("/");
        }
      }
      // If user is trying to access admin routes but not admin, redirect to home
      else if (adminPaths.some(path => pathname === path || pathname.startsWith(path + '/')) && !isAdmin) {
        router.replace("/");
      }
      // If user is admin and accessing admin routes, allow access
      else if (isAdmin && adminPaths.some(path => pathname === path || pathname.startsWith(path + '/'))) {
        setStatus("authenticated");
      }
      // If user is authenticated but not on admin route, allow access
      else {
        setStatus("authenticated");
      }
    }
  }, [router, pathname]);

  if (status === "checking") {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#0A2131]">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  if (status === "unauthenticated") {
    return <>{children}</>;
  }

  return <>{children}</>;
}