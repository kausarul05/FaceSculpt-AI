"use client";

import Image from "next/image";
import { useState, useEffect } from "react";
import { User } from "lucide-react";
import { apiRequest } from "@/app/lib/api";

interface ProfileData {
    name: string;
    phone_number: string;
    profile_picture?: string; // Make this optional
}

interface ApiResponse<T = unknown> {
    success: boolean;
    code: number;
    message: string;
    timestamp: number;
    data: T;
}

export default function ProfileImage() {
    const [profileData, setProfileData] = useState<ProfileData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchProfile();

        const handleProfileUpdate = () => {
            const storedProfile = localStorage.getItem('profile');
            if (storedProfile) {
                try {
                    const parsedProfile = JSON.parse(storedProfile);
                    setProfileData(prev => prev ? { ...prev, ...parsedProfile } : parsedProfile);
                } catch (err) {
                    console.error("Failed to parse stored profile:", err);
                }
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

            const authToken = localStorage.getItem("authToken");
            if (!authToken) {
                setIsLoading(false);
                return;
            }

            // Use unknown type first, then validate
            const response = await apiRequest<unknown>(
                "GET",
                "/api/dashboard/profile/",
                null,
                {
                    headers: {
                        Authorization: `Bearer ${authToken}`
                    }
                }
            );

            console.log("Raw response:", response); // Debug log

            // Type guard to check if response has the expected structure
            if (
                response &&
                typeof response === 'object' &&
                'success' in response &&
                'data' in response &&
                response.success === true &&
                response.data &&
                typeof response.data === 'object'
            ) {
                const data = response.data as ProfileData;
                setProfileData(data);
            } else {
                setError("Invalid response structure");
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
            className="w-10 h-10 object-cover rounded-full cursor-pointer hover:opacity-80 transition"
            unoptimized={true}
        />
    );
}