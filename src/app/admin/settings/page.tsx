"use client";
import { Pencil } from "lucide-react";
import Image from "next/image";
import React, { useRef, useState, useEffect, useCallback } from "react";
import { toast } from "react-toastify";
import { apiRequest } from "@/app/lib/api";

// Define types for API responses
interface ApiResponse<T = unknown> {
    success: boolean;
    code: number;
    message: string;
    timestamp: number;
    data: T;
}

interface ProfileData {
    name: string;
    phone_number: string;
    profile_picture?: string;
    country?: string;
    city?: string;
    province?: string;
    gender?: string;
    bio?: string;
}

interface ProfileFormData {
    name: string;
    phone_number: string;
    Country: string;
    City: string;
    Province: string;
    Gender: string;
    Bio: string;
}

interface PasswordFormData {
    old_password: string;
    new_password: string;
    confirm_password: string;
}

// Interface for profile picture response
interface ProfilePictureResponse {
    profile_picture: string;
}

// Interface for generic success response (no data)
interface SuccessResponse {
    success: true;
    message: string;
}

// Type guard to check if value is ProfileData
function isProfileData(obj: unknown): obj is ProfileData {
    if (!obj || typeof obj !== 'object') return false;

    const hasName = 'name' in obj && typeof (obj as ProfileData).name === 'string';
    const hasPhone = 'phone_number' in obj && typeof (obj as ProfileData).phone_number === 'string';

    return hasName && hasPhone;
}

// Type guard to check if value is ProfilePictureResponse
function isProfilePictureResponse(obj: unknown): obj is ProfilePictureResponse {
    if (!obj || typeof obj !== 'object') return false;

    // Check if profile_picture exists and is a string
    return 'profile_picture' in obj && typeof (obj as ProfilePictureResponse).profile_picture === 'string';
}

export default function Page() {
    // State for active tab (profile or password)
    const [activeTab, setActiveTab] = useState("profile");

    // Refs and state for profile image handling
    const fileInputRef = useRef<HTMLInputElement | null>(null);
    const [preview, setPreview] = useState<string>("");
    const [saving, setSaving] = useState(false);
    const [loading, setLoading] = useState(true);

    // Form data state for profile information
    const [formData, setFormData] = useState<ProfileFormData>({
        name: "",
        phone_number: "",
        Country: "",
        City: "",
        Province: "",
        Gender: "",
        Bio: ""
    });

    // Form data state for password change
    const [passwordData, setPasswordData] = useState<PasswordFormData>({
        old_password: "",
        new_password: "",
        confirm_password: ""
    });

    // Fake data for dropdown options
    const availableOptions = {
        countries: ["United States", "Canada", "United Kingdom", "Australia", "Germany", "France"],
        cities: ["New York", "Los Angeles", "Chicago", "Toronto", "London", "Sydney"],
        provinces: ["California", "Texas", "Florida", "Ontario", "Quebec", "New South Wales"],
        genders: ["male", "female", "other", "prefer not to say"]
    };

    // Get auth token from localStorage
    const getAuthToken = () => {
        if (typeof window !== 'undefined') {
            return localStorage.getItem("authToken");
        }
        return null;
    };

    // Fetch profile data from API
    const fetchProfileData = useCallback(async () => {
        try {
            setLoading(true);

            const authToken = getAuthToken();
            if (!authToken) {
                toast.error("Authentication token not found. Please login again.");
                return;
            }

            // Make API call to get profile data with proper typing
            const response = await apiRequest<ApiResponse<ProfileData>>(
                "GET",
                "/api/dashboard/profile/",
                null,
                {
                    headers: {
                        "Authorization": `Bearer ${authToken}`,
                    }
                }
            );

            if (response.success) {
                // Use type guard to ensure data is ProfileData
                if (isProfileData(response.data)) {
                    const profileData = response.data;

                    // Set form data with real user data
                    setFormData(prev => ({
                        ...prev,
                        name: profileData.name || "",
                        phone_number: profileData.phone_number || "",
                        Country: profileData.country || "",
                        City: profileData.city || "",
                        Province: profileData.province || "",
                        Gender: profileData.gender || "",
                        Bio: profileData.bio || ""
                    }));

                    // Set the preview with the profile picture URL from API
                    if (profileData.profile_picture) {
                        const fullUrl = getFullImageUrl(profileData.profile_picture);
                        setPreview(fullUrl);
                    }
                } else {
                    console.error("Invalid profile data structure:", response.data);
                    toast.error("Invalid profile data received from server");
                }
            } else {
                throw new Error(response.message || "Failed to load profile");
            }

        } catch (error: unknown) {
            console.error("Error loading profile:", error);
            const errorMessage = error instanceof Error ? error.message : "Error loading profile data";
            toast.error(errorMessage);
        } finally {
            setLoading(false);
        }
    }, []);

    // Load profile data on component mount
    useEffect(() => {
        fetchProfileData();
    }, [fetchProfileData]);

    // Handle click on edit profile picture icon
    const handleEditClick = () => {
        if (fileInputRef.current) {
            fileInputRef.current.click();
        }
    };

    // Helper function to construct full URL for profile picture
    const getFullImageUrl = (url: string): string => {
        if (!url) return "";

        // If URL is already absolute, return as-is
        if (url.startsWith('http://') || url.startsWith('https://')) {
            return url;
        }

        // If URL starts with /, prepend with your base URL
        const baseUrl = "https://server.facesculptai.com";
        return `${baseUrl}${url}`;
    };

    // Handle profile picture file selection
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            // Create preview URL for selected image
            const imageUrl = URL.createObjectURL(file);
            setPreview(imageUrl);
            toast.success("Profile picture updated!");

            // Upload to server
            uploadProfilePicture(file);
        }
    };

    // Helper function to extract profile picture URL from response
    const extractProfilePictureUrl = (data: unknown): string | null => {
        if (!data) return null;

        // If data is already a string, return it
        if (typeof data === "string") return data;

        // If data is an object, look for common field names
        if (typeof data === "object" && data !== null) {
            const obj = data as Record<string, unknown>;

            // Try different possible field names
            const possibleFields = [
                "profile_picture",
                "profile_picture_url",
                "profile_image",
                "image_url",
                "url",
                "avatar",
                "picture",
            ];

            for (const field of possibleFields) {
                if (obj[field] && typeof obj[field] === "string") {
                    return obj[field] as string;
                }
            }
        }

        return null;
    };

    // Function to upload profile picture
    const uploadProfilePicture = async (file: File) => {
        try {
            const authToken = getAuthToken();
            if (!authToken) {
                toast.error("Authentication token not found.");
                return;
            }

            const formData = new FormData();
            formData.append('profile_picture', file);

            console.log("Uploading profile picture...");

            const response = await apiRequest<ApiResponse<ProfilePictureResponse>>(
                "PUT",
                "/api/dashboard/profile/",
                formData,
                {
                    headers: {
                        "Authorization": `Bearer ${authToken}`,
                    }
                }
            );

            console.log("Full API response:", response);

            if (response.success) {
                console.log("Response data:", response.data);

                // Try the type guard first
                if (isProfilePictureResponse(response.data)) {
                    console.log("Got profile picture URL from ProfilePictureResponse");
                    const newImageUrl = response.data.profile_picture;
                    console.log("New image URL:", newImageUrl);

                    setPreview(newImageUrl);

                    // Store in localStorage
                    const currentProfile = JSON.parse(localStorage.getItem('profile') || '{}');
                    localStorage.setItem('profile', JSON.stringify({
                        ...currentProfile,
                        profile_picture: newImageUrl
                    }));

                    // Dispatch a custom event
                    window.dispatchEvent(new Event('profilePictureUpdated'));
                    toast.success("Profile picture updated successfully!");
                } else {
                    // Try extracting from the data using our helper
                    const profilePictureUrl = extractProfilePictureUrl(response.data);
                    
                    if (profilePictureUrl) {
                        console.log("Extracted profile picture URL:", profilePictureUrl);
                        setPreview(profilePictureUrl);

                        // Store in localStorage
                        const currentProfile = JSON.parse(localStorage.getItem('profile') || '{}');
                        localStorage.setItem('profile', JSON.stringify({
                            ...currentProfile,
                            profile_picture: profilePictureUrl
                        }));

                        // Dispatch a custom event
                        window.dispatchEvent(new Event('profilePictureUpdated'));
                        toast.success("Profile picture updated successfully!");
                    } else {
                        console.log("Could not extract profile picture URL from:", response.data);
                        toast.error("Could not get the new profile picture URL");
                    }
                }
            } else {
                console.log("API returned success: false", response.message);
                toast.error(response.message || "Failed to upload profile picture");
            }
        } catch (error) {
            console.error("Error uploading profile picture:", error);
            toast.error("Failed to upload profile picture");
        }
    };

    // Handle input changes for profile form fields
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { id, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [id]: value
        }));
    };

    // Handle input changes for password form fields
    const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setPasswordData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    // Handle profile form submission
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);

        try {
            const authToken = getAuthToken();
            if (!authToken) {
                toast.error("Authentication token not found. Please login again.");
                setSaving(false);
                return;
            }

            const formDataToSend = new FormData();
            formDataToSend.append('name', formData.name);
            formDataToSend.append('phone_number', formData.phone_number);

            const putResponse = await apiRequest<ApiResponse<SuccessResponse | unknown>>(
                "PUT",
                "/api/dashboard/profile/",
                formDataToSend,
                {
                    headers: {
                        "Authorization": `Bearer ${authToken}`,
                    }
                }
            );

            if (putResponse.success) {
                toast.success("Profile updated successfully!");
                await fetchProfileData();
                setSaving(false);
                return;
            }

            console.log("PUT failed or returned success false, trying POST...");

            const postResponse = await apiRequest<ApiResponse<SuccessResponse | unknown>>(
                "POST",
                "/api/dashboard/profile/",
                formDataToSend,
                {
                    headers: {
                        "Authorization": `Bearer ${authToken}`,
                    }
                }
            );

            if (postResponse.success) {
                toast.success("Profile updated successfully!");
                await fetchProfileData();
            } else {
                throw new Error(postResponse.message || "Failed to update profile");
            }
        } catch (error: unknown) {
            console.error("Error updating profile:", error);
            const errorMessage = error instanceof Error ? error.message : "Error updating profile. Please try again.";
            toast.error(errorMessage);
        } finally {
            setSaving(false);
        }
    };

    // Handle password change submission
    const handlePasswordSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validate that new passwords match
        if (passwordData.new_password !== passwordData.confirm_password) {
            toast.error("New passwords do not match!");
            return;
        }

        // Validate password strength (basic check)
        if (passwordData.new_password.length < 6) {
            toast.error("New password must be at least 6 characters long!");
            return;
        }

        setSaving(true);

        try {
            const authToken = getAuthToken();
            if (!authToken) {
                toast.error("Authentication token not found. Please login again.");
                setSaving(false);
                return;
            }

            const payload = {
                old_password: passwordData.old_password,
                new_password: passwordData.new_password
            };

            const response = await apiRequest<ApiResponse<SuccessResponse>>(
                "POST",
                "/api/dashboard/change-password/",
                payload,
                {
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${authToken}`,
                    }
                }
            );

            if (response.success) {
                toast.success("Password changed successfully!");

                setPasswordData({
                    old_password: "",
                    new_password: "",
                    confirm_password: ""
                });
            } else {
                throw new Error(response.message || "Failed to change password");
            }
        } catch (error: unknown) {
            console.error("Error changing password:", error);
            const errorMessage = error instanceof Error ? error.message : "Error changing password. Please try again.";
            toast.error(errorMessage);
        } finally {
            setSaving(false);
        }
    };

    // Loading state UI
    if (loading) {
        return (
            <div className="min-h-screen bg-[#1A2028] text-white p-6">
                <div className="flex gap-6">
                    {/* Sidebar loading skeleton */}
                    <div className="mb-8 w-[400px] bg-[#1A2028] h-full p-4 rounded-lg">
                        <div className="animate-pulse">
                            <div className="h-10 bg-gray-700 rounded mb-2"></div>
                            <div className="h-10 bg-gray-700 rounded"></div>
                        </div>
                    </div>

                    {/* Main content loading skeleton */}
                    <div className="bg-[#1A2028] w-full rounded-lg p-6">
                        <div className="animate-pulse">
                            <div className="h-6 bg-gray-700 rounded w-1/3 mb-4"></div>
                            <div className="space-y-4">
                                <div className="h-10 bg-gray-700 rounded"></div>
                                <div className="h-10 bg-gray-700 rounded"></div>
                                <div className="h-10 bg-gray-700 rounded"></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#000000] text-white p-6">
            <div className="flex gap-6">
                {/* Sidebar Navigation */}
                <div className="mb-8 w-[400px] bg-[#1A2028] h-full p-4 rounded-lg">
                    <div className="mb-2">
                        <button
                            onClick={() => setActiveTab("profile")}
                            className={`text-white font-semibold cursor-pointer mt-2 w-full text-start p-2 rounded ${activeTab === "profile" ? "bg-[#60A5FB]" : ""
                                }`}
                        >
                            Profile Information
                        </button>
                    </div>
                    <div>
                        <button
                            onClick={() => setActiveTab("password")}
                            className={`text-white font-semibold cursor-pointer mt-2 w-full text-start p-2 rounded ${activeTab === "password" ? "bg-[#60A5FB]" : ""
                                }`}
                        >
                            Change Password
                        </button>
                    </div>
                </div>

                {/* Main Content Area */}
                <div className="bg-[#1A2028] w-full rounded-lg p-6">
                    {/* Profile Information Tab */}
                    {activeTab === "profile" && (
                        <div>
                            <h2 className="text-lg font-semibold mb-4">Profile</h2>

                            {/* Profile Picture Section */}
                            <div className="relative mb-5">
                                <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl overflow-hidden bg-gray-700">
                                    {preview ? (
                                        <img
                                            src={preview}
                                            alt="Profile"
                                            className="w-full h-full object-cover"
                                            onError={(e) => {
                                                console.error("Failed to load profile image:", preview);
                                                e.currentTarget.style.display = 'none';
                                            }}
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                                            No Image
                                        </div>
                                    )}
                                </div>

                                {/* Edit Profile Picture Button */}
                                <div
                                    onClick={handleEditClick}
                                    className="absolute left-15 bottom-0 bg-gray-600 p-1.5 sm:p-2 rounded-full cursor-pointer hover:bg-gray-700 transition"
                                >
                                    <Pencil size={16} className="sm:w-5 sm:h-5" color="white" />
                                </div>

                                {/* Hidden File Input */}
                                <input
                                    type="file"
                                    accept="image/*"
                                    ref={fileInputRef}
                                    className="hidden"
                                    onChange={handleFileChange}
                                />
                            </div>

                            {/* Profile Form */}
                            <form onSubmit={handleSubmit}>
                                <div className="space-y-4 sm:space-y-6">
                                    {/* Display Name Field */}
                                    <div>
                                        <label className="block text-sm font-semibold" htmlFor="name">
                                            Display Name
                                        </label>
                                        <input
                                            type="text"
                                            id="name"
                                            name="name"
                                            placeholder="Enter Your Display Name"
                                            value={formData.name}
                                            onChange={handleInputChange}
                                            className="w-full mt-2 p-3 border border-[#60A5FB66] text-white rounded-lg text-sm"
                                        />
                                    </div>

                                    {/* Phone Number Field */}
                                    <div>
                                        <label className="block text-sm font-semibold" htmlFor="phone_number">
                                            Phone Number
                                        </label>
                                        <input
                                            type="tel"
                                            id="phone_number"
                                            name="phone_number"
                                            value={formData.phone_number}
                                            onChange={handleInputChange}
                                            className="w-full mt-2 p-3 border border-[#60A5FB66] text-white rounded-lg text-sm"
                                        />
                                    </div>

                                    {/* Save Button */}
                                    <div className="mt-6 sm:mt-8">
                                        <button
                                            type="submit"
                                            disabled={saving}
                                            className="py-3 sm:py-4 px-8 sm:px-14 bg-[#60A5FB] text-white font-semibold text-sm rounded-lg disabled:bg-gray-600 disabled:cursor-not-allowed transition duration-300 cursor-pointer w-full sm:w-auto"
                                        >
                                            {saving ? "Saving..." : "Save"}
                                        </button>
                                    </div>
                                </div>
                            </form>
                        </div>
                    )}

                    {/* Change Password Tab */}
                    {activeTab === "password" && (
                        <div>
                            <h2 className="text-lg font-semibold mb-4">Change Password</h2>
                            <form onSubmit={handlePasswordSubmit}>
                                {/* Current Password Field */}
                                <div className="mb-6">
                                    <label className="block text-sm font-medium mb-2">
                                        Current Password
                                    </label>
                                    <input
                                        type="password"
                                        name="old_password"
                                        placeholder="Enter Current Password"
                                        value={passwordData.old_password}
                                        onChange={handlePasswordChange}
                                        className="w-full border border-[#60A5FB66] rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-[#007ED6] placeholder-gray-400"
                                    />
                                </div>

                                {/* New Password Field */}
                                <div className="mb-6">
                                    <label className="block text-sm font-medium mb-2">
                                        New Password
                                    </label>
                                    <input
                                        type="password"
                                        name="new_password"
                                        placeholder="Enter New Password"
                                        value={passwordData.new_password}
                                        onChange={handlePasswordChange}
                                        className="w-full border border-[#60A5FB66] rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-[#007ED6] placeholder-gray-400"
                                    />
                                </div>

                                {/* Confirm New Password Field */}
                                <div className="mb-6">
                                    <label className="block text-sm font-medium mb-2">
                                        Confirm New Password
                                    </label>
                                    <input
                                        type="password"
                                        name="confirm_password"
                                        placeholder="Confirm New Password"
                                        value={passwordData.confirm_password}
                                        onChange={handlePasswordChange}
                                        className="w-full border border-[#60A5FB66] rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-[#007ED6] placeholder-gray-400"
                                    />
                                </div>

                                {/* Update Password Button */}
                                <div className="flex justify-end">
                                    <button
                                        type="submit"
                                        disabled={saving}
                                        className="bg-[#60A5FB] text-white px-8 py-3 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                                    >
                                        {saving ? "Updating..." : "Update Password"}
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}