"use client";

import dynamic from "next/dynamic";
import { User } from "lucide-react";

const ProfileImage = dynamic(
  () => import("@/app/admin/Components/ProfileImage/ProfileImage"),
  {
    ssr: false,
    loading: () => (
      <div className="w-10 h-10 bg-gray-700 rounded-full animate-pulse flex items-center justify-center">
        <User className="w-5 h-5 text-gray-400" />
      </div>
    ),
  }
);

export default function ProfileImageWrapper() {
  return <ProfileImage />;
}