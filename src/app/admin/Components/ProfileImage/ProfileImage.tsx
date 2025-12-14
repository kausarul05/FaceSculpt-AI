"use client";

import Image from "next/image";
import { useState, useEffect } from "react";
import { User } from "lucide-react"; // For fallback icon
import { apiRequest } from "@/app/lib/api";

interface ProfileData {
    name: string;
    phone_number: string;
    profile_picture: string;
}

export default function ProfileImage() {
    const [profileData, setProfileData] = useState<ProfileData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchProfile();

        const handleProfileUpdate = () => {
            // Re-fetch or update from localStorage
            const storedProfile = localStorage.getItem('profile');
            if (storedProfile) {
                const parsedProfile = JSON.parse(storedProfile);
                setProfileData(prev => prev ? { ...prev, ...parsedProfile } : parsedProfile);
            }
        };

        window.addEventListener('profilePictureUpdated', handleProfileUpdate);

        return () => {
            window.removeEventListener('profilePictureUpdated', handleProfileUpdate);
        };
    }, []);

    const fetchProfile = async () => {
        try {
            setIsLoading(true);
            setError(null);

            const data = await apiRequest<{ data: ProfileData }>(
                "GET",
                "/api/dashboard/profile/",
                null,
                {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem("authToken")}`
                    }
                }
            );

            if (data.success) {
                setProfileData(data.data);
            }
        } catch (err) {
            console.error("Failed to fetch profile:", err);
            setError("Failed to load profile image");
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoading) {
        return (
            <div className="w-10 h-10 rounded-full bg-gray-700 animate-pulse flex items-center justify-center">
                <User className="w-5 h-5 text-gray-400" />
            </div>
        );
    }

    if (error || !profileData?.profile_picture) {
        return (
            <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center">
                <User className="w-5 h-5 text-gray-400" />
            </div>
        );
    }

    return (
        <Image
            src={profileData.profile_picture}
            alt={profileData.name || "Profile"}
            width={40}
            height={40}
            className="w-10 h-10 object-cover rounded-full cursor-pointer"
            // If the image is from an external URL, you need to configure it in next.config.js
            unoptimized={true} // Consider removing this after configuring next.config.js
        />
    );
}