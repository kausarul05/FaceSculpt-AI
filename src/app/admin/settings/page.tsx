"use client";
import { Pencil } from "lucide-react";
import Image from "next/image";
import React, { useRef, useState, useEffect } from "react";
import profile from "@/../public/images/profile.jpg"
import { apiRequest } from "@/app/lib/api";
import { toast } from "react-toastify";

export default function Page() {
    const [activeTab, setActiveTab] = useState("profile"); // "profile" or "password"
    const fileInputRef = useRef<HTMLInputElement | null>(null);
    const [preview, setPreview] = useState<string>(profile.src);
    const [saving, setSaving] = useState(false);
    const [loading, setLoading] = useState(true);
    
    // Form data state
    const [formData, setFormData] = useState({
        fullname: "",
        email: "",
        Country: "",
        City: "",
        Province: "",
        Gender: "",
        Bio: ""
    });

    // Password form state
    const [passwordData, setPasswordData] = useState({
        current_password: "",
        new_password: "",
        confirm_password: ""
    });

    // Available options for dropdowns
    const availableOptions = {
        countries: ["United States", "Canada", "United Kingdom", "Australia", "Germany", "France"],
        cities: ["New York", "Los Angeles", "Chicago", "Toronto", "London", "Sydney"],
        provinces: ["California", "Texas", "Florida", "Ontario", "Quebec", "New South Wales"],
        genders: ["male", "female", "other", "prefer not to say"]
    };

    // Fetch profile data
    const fetchProfileData = async () => {
        try {
            setLoading(true);
            const response = await apiRequest(
                "GET", 
                "/accounts/profile/", 
                null,
                {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem("authToken")}`
                    }
                } 
            );

            console.log("response from profile fetch:", response); // Debug log 

            if (response) {
                const profileData = response;
                console.log("Profile data received:", profileData); // Debug log
                
                setFormData({
                    fullname: profileData.fullname || "",
                    email: profileData.email || "", // Add email if available from API
                    Country: profileData.Country || "",
                    City: profileData.City || "",
                    Province: profileData.Province || "",
                    Gender: profileData.Gender || "",
                    Bio: profileData.Bio || ""
                });

                // Set profile picture if available
                if (profileData.profile_picture) {
                    setPreview(profileData.profile_picture);
                }
            } else if (response.error) {
                console.error("Error fetching profile:", response.error);
                toast.error("Error loading profile data");
            }
        } catch (error) {
            console.error("Error fetching profile:", error);
            toast.error("Error loading profile data");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProfileData();
    }, []);

    const handleEditClick = () => {
        if (fileInputRef.current) {
            fileInputRef.current.click();
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const imageUrl = URL.createObjectURL(file);
            setPreview(imageUrl);
            // Here you would typically upload the image to the server
        }
    };

    // Handle input changes for profile
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { id, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [id]: value
        }));
    };

    // Handle password input changes - FIXED VERSION
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
            const response = await apiRequest(
                "PATCH", 
                "/accounts/profile/update/", 
                {
                    fullname: formData.fullname,
                    Country: formData.Country,
                    City: formData.City,
                    Province: formData.Province,
                    Gender: formData.Gender,
                    Bio: formData.Bio
                },
                {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem("authToken")}`
                    }
                }
            );

            if (response) {
                toast.success("Profile updated successfully!");
            } else if (response.error) {
                console.error("Failed to update profile:", response.error);
                toast.error("Failed to update profile: " + response.error);
            }
        } catch (error) {
            console.error("Error updating profile:", error);
            toast.error("Error updating profile. Please try again.");
        } finally {
            setSaving(false);
        }
    };

    // Handle password change submission
    const handlePasswordSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (passwordData.new_password !== passwordData.confirm_password) {
            toast.error("New passwords do not match!");
            return;
        }

        setSaving(true);
        
        try {
            const response = await apiRequest(
                "POST", 
                "/accounts/change_pass/", 
                {
                    old_password: passwordData.current_password,
                    new_password: passwordData.new_password,
                    confirm_password: passwordData.confirm_password
                },
                {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem("authToken")}`
                    }
                }
            );

            // console.log("response from password change:", response); // Debug log

            toast.success("Password changed successfully!");
            
            if (response) {
                setPasswordData({
                    current_password: "",
                    new_password: "",
                    confirm_password: ""
                });
            } else if (response.error) {
                console.error("Failed to change password:", response.error);
                toast.error("Failed to change password: " + response.error);
            }
        } catch (error) {
            console.error("Error changing password:", error);
            toast.error("Error changing password. Please try again.");
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[#0A2131] text-white p-6">
                <div className="flex gap-6">
                    <div className="mb-8 w-[400px] bg-[#0D314B] h-full p-4 rounded-lg">
                        {/* Loading skeleton for sidebar */}
                        <div className="animate-pulse">
                            <div className="h-10 bg-gray-700 rounded mb-2"></div>
                            <div className="h-10 bg-gray-700 rounded"></div>
                        </div>
                    </div>
                    <div className="bg-[#0D314B] w-full rounded-lg border border-[#1b4b70] p-6">
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
        <div className="min-h-screen bg-[#0A2131] text-white p-6">
            <div className="flex gap-6">
                {/* Sidebar */}
                <div className="mb-8 w-[400px] bg-[#0D314B] h-full p-4 rounded-lg">
                    <div className="mb-2">
                        <button
                            onClick={() => setActiveTab("profile")}
                            className={`text-white font-semibold cursor-pointer mt-2 w-full text-start p-2 rounded ${activeTab === "profile" ? "bg-[#007ED6]" : ""
                                }`}
                        >
                            Profile Information
                        </button>
                    </div>
                    <div>
                        <button
                            onClick={() => setActiveTab("password")}
                            className={`text-white font-semibold cursor-pointer mt-2 w-full text-start p-2 rounded ${activeTab === "password" ? "bg-[#007ED6]" : ""
                                }`}
                        >
                            Change Password
                        </button>
                    </div>
                </div>

                {/* Main Content */}
                <div className="bg-[#0D314B] w-full rounded-lg border border-[#1b4b70] p-6">
                    {activeTab === "profile" && (
                        <div>
                            <h2 className="text-lg font-semibold mb-4">Profile</h2>
                            <div className="relative mb-5">
                                <Image
                                    src={preview}
                                    alt="Profile"
                                    width={96}
                                    height={96}
                                    className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl object-cover"
                                />

                                {/* Edit Icon */}
                                <div
                                    onClick={handleEditClick}
                                    className="absolute left-15 bottom-0 bg-gray-600 p-1.5 sm:p-2 rounded-full cursor-pointer hover:bg-gray-700 transition"
                                >
                                    <Pencil size={16} className="sm:w-5 sm:h-5" color="white" />
                                </div>

                                {/* Hidden file input */}
                                <input
                                    type="file"
                                    accept="image/*"
                                    ref={fileInputRef}
                                    className="hidden"
                                    onChange={handleFileChange}
                                />
                            </div>
                            <form onSubmit={handleSubmit}>
                                <div className="space-y-4 sm:space-y-6">
                                    <div>
                                        <label className="block text-sm font-semibold" htmlFor="fullname">Display Name</label>
                                        <input
                                            type="text"
                                            id="fullname"
                                            name="fullname"
                                            placeholder="Enter Your Display Name"
                                            value={formData.fullname}
                                            onChange={handleInputChange}
                                            className="w-full mt-2 p-3 bg-[#0D314B] border border-[#007ED6] text-white rounded-lg text-sm"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-semibold" htmlFor="email">Email</label>
                                        <input
                                            type="email"
                                            id="email"
                                            name="email"
                                            value={formData.email}
                                            onChange={handleInputChange}
                                            disabled
                                            className="w-full mt-2 p-3 bg-[#0D314B] border border-[#007ED6] text-white rounded-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                                        />
                                        <small className="text-gray-400 text-xs">Email cannot be changed</small>
                                    </div>

                                    <div className='flex flex-col sm:flex-row justify-between gap-4 sm:gap-6'>
                                        <div className='w-full'>
                                            <label className="block text-sm font-semibold" htmlFor="Country">Country</label>
                                            <select
                                                id="Country"
                                                name="Country"
                                                value={formData.Country}
                                                onChange={handleInputChange}
                                                className="w-full mt-2 p-3 bg-[#0D314B] border border-[#007ED6] text-white rounded-lg text-sm"
                                            >
                                                <option value="">Select Your Country</option>
                                                {availableOptions.countries.map(country => (
                                                    <option key={country} value={country}>{country}</option>
                                                ))}
                                                {formData.Country && !availableOptions.countries.includes(formData.Country) && (
                                                    <option value={formData.Country}>{formData.Country}</option>
                                                )}
                                            </select>
                                        </div>

                                        <div className='w-full'>
                                            <label className="block text-sm font-semibold" htmlFor="City">City</label>
                                            <select
                                                id="City"
                                                name="City"
                                                value={formData.City}
                                                onChange={handleInputChange}
                                                className="w-full mt-2 p-3 bg-[#0D314B] border border-[#007ED6] text-white rounded-lg text-sm"
                                            >
                                                <option value="">Select Your City</option>
                                                {availableOptions.cities.map(city => (
                                                    <option key={city} value={city}>{city}</option>
                                                ))}
                                                {formData.City && !availableOptions.cities.includes(formData.City) && (
                                                    <option value={formData.City}>{formData.City}</option>
                                                )}
                                            </select>
                                        </div>
                                    </div>

                                    <div className='flex flex-col sm:flex-row justify-between gap-4 sm:gap-6'>
                                        <div className='w-full'>
                                            <label className="block text-sm font-semibold" htmlFor="Province">Province</label>
                                            <select
                                                id="Province"
                                                name="Province"
                                                value={formData.Province}
                                                onChange={handleInputChange}
                                                className="w-full mt-2 p-3 bg-[#0D314B] border border-[#007ED6] text-white rounded-lg text-sm"
                                            >
                                                <option value="">Select Your Province</option>
                                                {availableOptions.provinces.map(province => (
                                                    <option key={province} value={province}>{province}</option>
                                                ))}
                                                {formData.Province && !availableOptions.provinces.includes(formData.Province) && (
                                                    <option value={formData.Province}>{formData.Province}</option>
                                                )}
                                            </select>
                                        </div>

                                        <div className='w-full'>
                                            <label className="block text-sm font-semibold" htmlFor="Gender">Gender</label>
                                            <select
                                                id="Gender"
                                                name="Gender"
                                                value={formData.Gender}
                                                onChange={handleInputChange}
                                                className="w-full mt-2 p-3 bg-[#0D314B] border border-[#007ED6] text-white rounded-lg text-sm"
                                            >
                                                <option value="">Select Your Gender</option>
                                                {availableOptions.genders.map(gender => (
                                                    <option key={gender} value={gender}>{gender}</option>
                                                ))}
                                                {formData.Gender && !availableOptions.genders.includes(formData.Gender) && (
                                                    <option value={formData.Gender}>{formData.Gender}</option>
                                                )}
                                            </select>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-semibold" htmlFor="Bio">Bio</label>
                                        <textarea
                                            id="Bio"
                                            name="Bio"
                                            placeholder="Enter Your Bio"
                                            value={formData.Bio}
                                            onChange={handleInputChange}
                                            className="w-full mt-2 p-3 bg-[#0D314B] border border-[#007ED6] text-white rounded-lg text-sm"
                                        ></textarea>
                                    </div>

                                    <div className="mt-6 sm:mt-8">
                                        <button
                                            type="submit"
                                            disabled={saving}
                                            className="py-3 sm:py-4 px-8 sm:px-14 bg-[#007ED6] text-white font-semibold text-sm rounded-lg hover:bg-[#0066b3] disabled:bg-gray-600 disabled:cursor-not-allowed transition duration-300 cursor-pointer w-full sm:w-auto"
                                        >
                                            {saving ? "Saving..." : "Save"}
                                        </button>
                                    </div>
                                </div>
                            </form>
                        </div>
                    )}

                    {activeTab === "password" && (
                        <div>
                            <h2 className="text-lg font-semibold mb-4">Change Password</h2>
                            <form onSubmit={handlePasswordSubmit}>
                                <div className="mb-6">
                                    <label className="block text-sm font-medium mb-2">Current Password</label>
                                    <input
                                        type="password"
                                        name="current_password"
                                        placeholder="Enter Current Password"
                                        value={passwordData.current_password}
                                        onChange={handlePasswordChange}
                                        className="w-full bg-[#0A2131] border border-[#1b4b70] rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-[#007ED6] placeholder-gray-400"
                                    />
                                </div>
                                <div className="mb-6">
                                    <label className="block text-sm font-medium mb-2">New Password</label>
                                    <input
                                        type="password"
                                        name="new_password"
                                        placeholder="Enter New Password"
                                        value={passwordData.new_password}
                                        onChange={handlePasswordChange}
                                        className="w-full bg-[#0A2131] border border-[#1b4b70] rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-[#007ED6] placeholder-gray-400"
                                    />
                                </div>
                                <div className="mb-6">
                                    <label className="block text-sm font-medium mb-2">Confirm New Password</label>
                                    <input
                                        type="password"
                                        name="confirm_password"
                                        placeholder="Confirm New Password"
                                        value={passwordData.confirm_password}
                                        onChange={handlePasswordChange}
                                        className="w-full bg-[#0A2131] border border-[#1b4b70] rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-[#007ED6] placeholder-gray-400"
                                    />
                                </div>
                                <div className="flex justify-end">
                                    <button 
                                        type="submit"
                                        disabled={saving}
                                        className="bg-[#007ED6] hover:bg-[#006bb3] text-white px-8 py-3 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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