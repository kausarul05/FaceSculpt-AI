"use client";
import { Pencil } from "lucide-react";
import Image from "next/image";
import React, { useRef, useState, useEffect, useCallback } from "react";
import profile from "@/../public/images/profile.jpg"
import { toast } from "react-toastify";
import { apiRequest } from "@/app/lib/api";

// Define types for API responses
interface ApiResponse {
    success: boolean;
    code: number;
    message: string;
    timestamp: number;
    data: unknown;
}

interface ProfileData {
    name: string;
    phone_number: string;
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

export default function Page() {
    // State for active tab (profile or password)
    const [activeTab, setActiveTab] = useState("profile");
    
    // Refs and state for profile image handling
    const fileInputRef = useRef<HTMLInputElement | null>(null);
    const [preview, setPreview] = useState<string>(profile.src);
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
            
            // Make API call to get profile data
            const response = await apiRequest("GET", "/api/dashboard/profile/", null, {
                headers: {
                    "Authorization": `Bearer ${authToken}`,
                }
            });
            
            if (response.success) {
                const profileData: ProfileData = response.data;
                
                // console.log("Loaded profile data:", profileData);
                
                // Set form data with real user data
                setFormData(prev => ({
                    ...prev,
                    name: profileData.name || "",
                    phone_number: profileData.phone_number || ""
                }));

                // toast.success("Profile data loaded successfully!");
            } else {
                throw new Error(response.message || "Failed to load profile");
            }
            
        } catch (error: unknown) {
            console.error("Error loading profile:", error);
            toast.error(error.message || "Error loading profile data");
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

    // Handle profile picture file selection
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            // Create preview URL for selected image
            const imageUrl = URL.createObjectURL(file);
            setPreview(imageUrl);
            toast.success("Profile picture updated!");
            
            // Optionally upload to server
            // uploadProfilePicture(file);
        }
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
            
            const response = await apiRequest("POST", "/api/dashboard/profile/picture/", formData, {
                headers: {
                    "Authorization": `Bearer ${authToken}`,
                }
            });
            
            if (response.success) {
                // Update preview with server URL if returned
                if (response.data.profile_picture_url) {
                    setPreview(response.data.profile_picture_url);
                }
                toast.success("Profile picture updated successfully!");
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

    // Handle profile form submission - Try different approaches
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
            
            let response: ApiResponse;
            
            // TRY APPROACH 1: FormData (Most likely what your API expects)
            const formDataToSend = new FormData();
            formDataToSend.append('name', formData.name);
            formDataToSend.append('phone_number', formData.phone_number);
            
            // Add other fields if your backend supports them
            // formDataToSend.append('country', formData.Country);
            // formDataToSend.append('city', formData.City);
            // formDataToSend.append('province', formData.Province);
            // formDataToSend.append('gender', formData.Gender);
            // formDataToSend.append('bio', formData.Bio);
            
            // Try PUT with FormData first
            try {
                response = await apiRequest("PUT", "/api/dashboard/profile/", formDataToSend, {
                    headers: {
                        "Authorization": `Bearer ${authToken}`,
                    }
                });
            } catch (error: unknown) {
                console.log("PUT with FormData failed, trying POST...");
                
                // TRY APPROACH 2: POST with FormData
                response = await apiRequest("POST", "/api/dashboard/profile/", formDataToSend, {
                    headers: {
                        "Authorization": `Bearer ${authToken}`,
                    }
                });
            }
            
            if (response.success) {
                toast.success("Profile updated successfully!");
                // Refresh profile data to get any server-side changes
                await fetchProfileData();
            } else {
                throw new Error(response.message || "Failed to update profile");
            }
            
        } catch (error: unknown) {
            console.error("Error updating profile:", error);
            toast.error(error.message || "Error updating profile. Please try again.");
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
            
            // Prepare password change payload
            const payload = {
                old_password: passwordData.old_password,
                new_password: passwordData.new_password
            };
            
            // Make API call to change password
            const response = await apiRequest("POST", "/api/dashboard/change-password/", payload, {
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${authToken}`,
                }
            });
            
            if (response.success) {
                toast.success("Password changed successfully!");
                
                // Reset password form
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
            toast.error(error.message || "Error changing password. Please try again.");
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
                            className={`text-white font-semibold cursor-pointer mt-2 w-full text-start p-2 rounded ${
                                activeTab === "profile" ? "bg-[#60A5FB]" : ""
                            }`}
                        >
                            Profile Information
                        </button>
                    </div>
                    <div>
                        <button
                            onClick={() => setActiveTab("password")}
                            className={`text-white font-semibold cursor-pointer mt-2 w-full text-start p-2 rounded ${
                                activeTab === "password" ? "bg-[#60A5FB]" : ""
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
                                <Image
                                    src={preview}
                                    alt="Profile"
                                    width={96}
                                    height={96}
                                    className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl object-cover"
                                />

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

                                    {/* Phone Number Field (Disabled) */}
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
                                            // disabled
                                            className="w-full mt-2 p-3 border border-[#60A5FB66] text-white rounded-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                                        />
                                        {/* <small className="text-gray-400 text-xs">Phone number cannot be changed</small> */}
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