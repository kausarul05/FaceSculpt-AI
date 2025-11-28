"use client";
import { Pencil } from "lucide-react";
import Image from "next/image";
import React, { useRef, useState, useEffect } from "react";
import profile from "@/../public/images/profile.jpg"
import { toast } from "react-toastify";

export default function Page() {
    // State for active tab (profile or password)
    const [activeTab, setActiveTab] = useState("profile");
    
    // Refs and state for profile image handling
    const fileInputRef = useRef<HTMLInputElement | null>(null);
    const [preview, setPreview] = useState<string>(profile.src);
    const [saving, setSaving] = useState(false);
    const [loading, setLoading] = useState(true);
    
    // Form data state for profile information
    const [formData, setFormData] = useState({
        fullname: "",
        email: "",
        Country: "",
        City: "",
        Province: "",
        Gender: "",
        Bio: ""
    });

    // Form data state for password change
    const [passwordData, setPasswordData] = useState({
        current_password: "",
        new_password: "",
        confirm_password: ""
    });

    // Fake data for dropdown options - simulating API response
    const availableOptions = {
        countries: ["United States", "Canada", "United Kingdom", "Australia", "Germany", "France"],
        cities: ["New York", "Los Angeles", "Chicago", "Toronto", "London", "Sydney"],
        provinces: ["California", "Texas", "Florida", "Ontario", "Quebec", "New South Wales"],
        genders: ["male", "female", "other", "prefer not to say"]
    };

    // Fake user data to simulate API response
    const fakeUserData = {
        fullname: "John Doe",
        email: "john.doe@example.com",
        Country: "United States",
        City: "New York",
        Province: "California",
        Gender: "male",
        Bio: "Software developer with 5+ years of experience in web development.",
        profile_picture: profile.src
    };

    // Simulate fetching profile data from API
    const fetchProfileData = async () => {
        try {
            setLoading(true);
            
            // Simulate API delay
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            // Use fake data instead of actual API call
            const profileData = fakeUserData;
            
            console.log("Loaded fake profile data:", profileData);
            
            // Set form data with fake user data
            setFormData({
                fullname: profileData.fullname,
                email: profileData.email,
                Country: profileData.Country,
                City: profileData.City,
                Province: profileData.Province,
                Gender: profileData.Gender,
                Bio: profileData.Bio
            });

            // Set profile picture
            if (profileData.profile_picture) {
                setPreview(profileData.profile_picture);
            }
            
            toast.success("Profile data loaded successfully!");
            
        } catch (error) {
            console.error("Error loading profile:", error);
            toast.error("Error loading profile data");
        } finally {
            setLoading(false);
        }
    };

    // Load profile data on component mount
    useEffect(() => {
        fetchProfileData();
    }, []);

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
            // Note: In real implementation, you would upload the image to server here
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
            // Simulate API call delay
            await new Promise(resolve => setTimeout(resolve, 1500));
            
            // Log the data that would be sent to API
            console.log("Profile update data:", {
                fullname: formData.fullname,
                Country: formData.Country,
                City: formData.City,
                Province: formData.Province,
                Gender: formData.Gender,
                Bio: formData.Bio
            });
            
            // Simulate successful update
            toast.success("Profile updated successfully!");
            
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
            // Simulate API call delay
            await new Promise(resolve => setTimeout(resolve, 1500));
            
            // Log the data that would be sent to API
            console.log("Password change data:", {
                old_password: passwordData.current_password,
                new_password: passwordData.new_password,
                confirm_password: passwordData.confirm_password
            });
            
            // Simulate successful password change
            toast.success("Password changed successfully!");
            
            // Reset password form
            setPasswordData({
                current_password: "",
                new_password: "",
                confirm_password: ""
            });
            
        } catch (error) {
            console.error("Error changing password:", error);
            toast.error("Error changing password. Please try again.");
        } finally {
            setSaving(false);
        }
    };

    // Loading state UI
    if (loading) {
        return (
            <div className="min-h-screen bg-[#0A2131] text-white p-6">
                <div className="flex gap-6">
                    {/* Sidebar loading skeleton */}
                    <div className="mb-8 w-[400px] bg-[#0D314B] h-full p-4 rounded-lg">
                        <div className="animate-pulse">
                            <div className="h-10 bg-gray-700 rounded mb-2"></div>
                            <div className="h-10 bg-gray-700 rounded"></div>
                        </div>
                    </div>
                    
                    {/* Main content loading skeleton */}
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
                <div className="bg-[#1A2028] w-full rounded-lg  p-6">
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
                                        <label className="block text-sm font-semibold" htmlFor="fullname">
                                            Display Name
                                        </label>
                                        <input
                                            type="text"
                                            id="fullname"
                                            name="fullname"
                                            placeholder="Enter Your Display Name"
                                            value={formData.fullname}
                                            onChange={handleInputChange}
                                            className="w-full mt-2 p-3 border border-[#60A5FB66] text-white rounded-lg text-sm"
                                        />
                                    </div>

                                    {/* Email Field (Disabled) */}
                                    <div>
                                        <label className="block text-sm font-semibold" htmlFor="email">
                                            Email
                                        </label>
                                        <input
                                            type="email"
                                            id="email"
                                            name="email"
                                            value={formData.email}
                                            onChange={handleInputChange}
                                            disabled
                                            className="w-full mt-2 p-3  border border-[#60A5FB66] text-white rounded-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                                        />
                                        <small className="text-gray-400 text-xs">Email cannot be changed</small>
                                    </div>

                                    {/* Location Fields Row */}
                                    <div className='flex flex-col sm:flex-row justify-between gap-4 sm:gap-6'>
                                        {/* Country Field */}
                                        <div className='w-full'>
                                            <label className="block text-sm font-semibold" htmlFor="Country">
                                                Country
                                            </label>
                                            <select
                                                id="Country"
                                                name="Country"
                                                value={formData.Country}
                                                onChange={handleInputChange}
                                                className="w-full mt-2 p-3  border border-[#60A5FB66] text-white rounded-lg text-sm"
                                            >
                                                <option value="">Select Your Country</option>
                                                {availableOptions.countries.map(country => (
                                                    <option key={country} value={country}>{country}</option>
                                                ))}
                                            </select>
                                        </div>

                                        {/* City Field */}
                                        <div className='w-full'>
                                            <label className="block text-sm font-semibold" htmlFor="City">
                                                City
                                            </label>
                                            <select
                                                id="City"
                                                name="City"
                                                value={formData.City}
                                                onChange={handleInputChange}
                                                className="w-full mt-2 p-3  border border-[#60A5FB66] text-white rounded-lg text-sm"
                                            >
                                                <option value="">Select Your City</option>
                                                {availableOptions.cities.map(city => (
                                                    <option key={city} value={city}>{city}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>

                                    {/* Province and Gender Fields Row */}
                                    <div className='flex flex-col sm:flex-row justify-between gap-4 sm:gap-6'>
                                        {/* Province Field */}
                                        <div className='w-full'>
                                            <label className="block text-sm font-semibold" htmlFor="Province">
                                                Province
                                            </label>
                                            <select
                                                id="Province"
                                                name="Province"
                                                value={formData.Province}
                                                onChange={handleInputChange}
                                                className="w-full mt-2 p-3  border border-[#60A5FB66] text-white rounded-lg text-sm"
                                            >
                                                <option value="">Select Your Province</option>
                                                {availableOptions.provinces.map(province => (
                                                    <option key={province} value={province}>{province}</option>
                                                ))}
                                            </select>
                                        </div>

                                        {/* Gender Field */}
                                        <div className='w-full'>
                                            <label className="block text-sm font-semibold" htmlFor="Gender">
                                                Gender
                                            </label>
                                            <select
                                                id="Gender"
                                                name="Gender"
                                                value={formData.Gender}
                                                onChange={handleInputChange}
                                                className="w-full mt-2 p-3  border border-[#60A5FB66] text-white rounded-lg text-sm"
                                            >
                                                <option value="">Select Your Gender</option>
                                                {availableOptions.genders.map(gender => (
                                                    <option key={gender} value={gender}>
                                                        {gender.charAt(0).toUpperCase() + gender.slice(1)}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>

                                    {/* Bio Field */}
                                    <div>
                                        <label className="block text-sm font-semibold" htmlFor="Bio">
                                            Bio
                                        </label>
                                        <textarea
                                            id="Bio"
                                            name="Bio"
                                            placeholder="Enter Your Bio"
                                            value={formData.Bio}
                                            onChange={handleInputChange}
                                            rows={4}
                                            className="w-full mt-2 p-3 border border-[#60A5FB66] text-white rounded-lg text-sm"
                                        ></textarea>
                                    </div>

                                    {/* Save Button */}
                                    <div className="mt-6 sm:mt-8">
                                        <button
                                            type="submit"
                                            disabled={saving}
                                            className="py-3 sm:py-4 px-8 sm:px-14 bg-[#60A5FB] text-white font-semibold text-sm rounded-lg  disabled:bg-gray-600 disabled:cursor-not-allowed transition duration-300 cursor-pointer w-full sm:w-auto"
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
                                        name="current_password"
                                        placeholder="Enter Current Password"
                                        value={passwordData.current_password}
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