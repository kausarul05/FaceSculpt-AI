import type { Metadata } from "next";
import Sidebar from "./Components/Sidebar/Sidebar";
import Link from "next/link";
import ProfileImageWrapper from "./Components/ProfileImageWrapper";


export const metadata: Metadata = {
  title: "Admin Dashboard",
  description: "Admin management panel",
};

export default function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex">
      <div>
        <Sidebar />
      </div>
      <div className="w-full pl-[385px] bg-[#1A2028]">
        <div className="flex justify-between bg-[#1A2028] p-6">
          <span></span>
          <Link href="/admin/settings">
            <ProfileImageWrapper />
          </Link>
        </div>
        {children}
      </div>
    </div>
  );
}