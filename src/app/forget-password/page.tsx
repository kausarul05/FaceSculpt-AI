"use client";

import { useState, useEffect } from "react";
import { X, Lock, Eye, EyeOff, ArrowLeft } from "lucide-react";
import { toast } from "react-toastify";
import { useRouter } from "next/navigation";
import { apiRequest } from "../lib/api";

// Define the steps for the forgot password flow
type ForgotPasswordStep = "email" | "verification" | "newPassword" | "success";

// Define API response types
interface ApiResponse<T = unknown> {
    success: boolean;
    code: number;
    message: string;
    timestamp: number;
    data: T;
}

interface ResendOtpResponse {
    message: string;
}

interface ResetPasswordResponse {
    message: string;
}

export default function ForgotPasswordModal() {
    // State for current step in the forgot password flow
    const [currentStep, setCurrentStep] = useState<ForgotPasswordStep>("email");
    
    // State for password visibility toggles
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    
    // State for verification code input (6-digit OTP for production)
    // For now, using 4 digits for demo, change to 6 for production
    const [verificationCode, setVerificationCode] = useState(["", "", "", "", "", ""]);
    const [otpLength, setOtpLength] = useState(6); // Change to 6 for production
    
    // State for countdown timer and resend functionality
    const [countdown, setCountdown] = useState(59);
    const [canResend, setCanResend] = useState(false);
    
    // State for form data
    const [phoneNumber, setPhoneNumber] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    
    // State for loading and messaging
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState("");
    
    const router = useRouter();

    // Effect to prevent body scrolling when modal is open
    useEffect(() => {
        document.body.style.overflow = "hidden";
        return () => { 
            document.body.style.overflow = ""; 
        };
    }, []);

    // Initialize OTP array based on length
    useEffect(() => {
        setVerificationCode(new Array(otpLength).fill(""));
    }, [otpLength]);

    // Countdown timer for resend code functionality
    useEffect(() => {
        if (currentStep === "verification" && countdown > 0) {
            const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
            return () => clearTimeout(timer);
        } else if (countdown === 0) {
            setCanResend(true);
        }
    }, [currentStep, countdown]);

    // Effect to automatically redirect after successful password reset
    useEffect(() => {
        if (currentStep === "success") {
            const timer = setTimeout(() => {
                router.push("/");
            }, 2000); // 2 seconds delay for user to see success message
            return () => clearTimeout(timer);
        }
    }, [currentStep, router]);

    // Handle back to home route
    const handleBackToHome = () => {
        router.push("/");
    };

    // Handle phone number submission for OTP request
    const handlePhoneSubmit = async () => {
        // Validate phone number input
        if (!phoneNumber.trim()) {
            setMessage("Please enter your phone number.");
            return;
        }

        // Basic phone number validation
        if (phoneNumber.length < 10) {
            setMessage("Please enter a valid phone number.");
            return;
        }

        setLoading(true);
        setMessage("");
        
        try {
            // For demo, use hardcoded OTP
            const DEMO_MODE = false; // Set to false in production
            
            if (DEMO_MODE) {
                // Simulate API call delay
                await new Promise(resolve => setTimeout(resolve, 1500));
                
                // Demo success
                toast.success("Demo mode: OTP sent! (Use 123456 for demo)");
                setCurrentStep("verification");
                setCountdown(59);
                setCanResend(false);
                setMessage("Verification code sent to your phone!");
                return;
            }

            // Production API call for OTP request
            // Note: Your actual endpoint might be different
            const response = await apiRequest<ApiResponse<ResendOtpResponse>>(
                "POST",
                "api/auth/resend-otp/",
                {
                    phone_number: phoneNumber
                }
            );

            if (response.success) {
                toast.success(response.message || "OTP sent successfully!");
                setCurrentStep("verification");
                setCountdown(59);
                setCanResend(false);
                setMessage("Verification code sent to your phone!");
            } else {
                throw new Error(response.message || "Failed to send OTP");
            }
            
        } catch (error: unknown) {
            console.error("OTP request error:", error);
            const errorMessage = error instanceof Error 
                ? error.message 
                : "Failed to send verification code. Please try again.";
            
            setMessage(errorMessage);
            toast.error(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    // Handle verification code submission
    const handleVerificationSubmit = async () => {
        // Combine the OTP digits into a single string
        const otp = verificationCode.join("");
        
        // Validate OTP length
        if (otp.length !== otpLength) {
            setMessage(`Please enter the complete ${otpLength}-digit verification code.`);
            return;
        }

        setLoading(true);
        setMessage("");
        
        try {
            // For demo, accept hardcoded OTP
            const DEMO_MODE = true; // Set to false in production
            
            if (DEMO_MODE) {
                // Simulate API call delay
                await new Promise(resolve => setTimeout(resolve, 1500));
                
                // Demo verification - accept any 6-digit code or specific demo code
                const demoValidCodes = ["123456", "000000", "111111"];
                
                if (demoValidCodes.includes(otp) || otp === "123456") {
                    setCurrentStep("newPassword");
                    toast.success("OTP verified successfully!");
                    setMessage("");
                    return;
                } else {
                    throw new Error("Invalid verification code. Use 123456 for demo.");
                }
            }

            // Production: Verify OTP with backend
            // Note: Your actual endpoint might be different
            const response = await apiRequest<ApiResponse<{ verified: boolean }>>(
                "POST",
                "api/auth/verify-otp/", // This endpoint might be different
                {
                    phone_number: phoneNumber,
                    otp: otp
                }
            );

            if (response.success) {
                setCurrentStep("newPassword");
                toast.success("OTP verified successfully!");
                setMessage("");
            } else {
                throw new Error(response.message || "Invalid verification code.");
            }
            
        } catch (error: unknown) {
            console.error("OTP verification error:", error);
            const errorMessage = error instanceof Error 
                ? error.message 
                : "Invalid verification code. Please try again.";
            
            setMessage(errorMessage);
            toast.error(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    // Handle new password submission
    const handleNewPasswordSubmit = async () => {
        // Validate password fields
        if (!newPassword || !confirmPassword) {
            setMessage("Please enter both password fields.");
            return;
        }

        // Check if passwords match
        if (newPassword !== confirmPassword) {
            setMessage("Passwords do not match.");
            return;
        }

        // Validate password strength
        if (newPassword.length < 6) {
            setMessage("Password must be at least 6 characters long.");
            return;
        }

        setLoading(true);
        setMessage("");
        
        try {
            // For demo, simulate success
            const DEMO_MODE = false; // Set to false in production
            
            if (DEMO_MODE) {
                await new Promise(resolve => setTimeout(resolve, 1500));
                
                // Demo success
                console.log("Demo password reset:", {
                    phone_number: phoneNumber,
                    otp: verificationCode.join(""),
                    new_password: newPassword
                });
                
                toast.success("Password reset successful!");
                setCurrentStep("success");
                return;
            }

            // Production API call for password reset
            const response = await apiRequest<ApiResponse<ResetPasswordResponse>>(
                "POST",
                "api/auth/reset-password/",
                {
                    phone_number: phoneNumber,
                    otp: verificationCode.join(""),
                    new_password: newPassword
                }
            );

            if (response.success) {
                toast.success(response.message || "Password reset successfully!");
                setCurrentStep("success");
            } else {
                throw new Error(response.message || "Failed to reset password.");
            }
            
        } catch (error: unknown) {
            console.error("Password reset error:", error);
            const errorMessage = error instanceof Error 
                ? error.message 
                : "Failed to reset password. Please try again.";
            
            setMessage(errorMessage);
            toast.error(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    // Handle resend OTP
    const handleResendCode = async () => {
        if (canResend) {
            setLoading(true);
            setMessage("");
            
            try {
                // For demo
                const DEMO_MODE = true; // Set to false in production
                
                if (DEMO_MODE) {
                    await new Promise(resolve => setTimeout(resolve, 1500));
                    
                    toast.success("Demo: New OTP sent! (Use 123456)");
                    setCountdown(59);
                    setCanResend(false);
                    setMessage("New verification code sent!");
                    return;
                }

                // Production: Resend OTP
                const response = await apiRequest<ApiResponse<ResendOtpResponse>>(
                    "POST",
                    "api/auth/resend-otp/",
                    {
                        phone_number: phoneNumber
                    }
                );

                if (response.success) {
                    toast.success(response.message || "New OTP sent successfully!");
                    setCountdown(59);
                    setCanResend(false);
                    setMessage("New verification code sent!");
                } else {
                    throw new Error(response.message || "Failed to resend code.");
                }
                
            } catch (error: unknown) {
                console.error("Resend OTP error:", error);
                const errorMessage = error instanceof Error 
                    ? error.message 
                    : "Failed to resend code. Please try again.";
                
                setMessage(errorMessage);
                toast.error(errorMessage);
            } finally {
                setLoading(false);
            }
        }
    };

    // Handle individual digit input for OTP
    const handleVerificationCodeChange = (value: string, index: number) => {
        // Only allow numeric input
        if (/^\d?$/.test(value)) {
            const newCode = [...verificationCode];
            newCode[index] = value;
            setVerificationCode(newCode);

            // Auto-focus next input when current digit is entered
            if (value !== "" && index < otpLength - 1) {
                const nextInput = document.getElementById(`verification-${index + 1}`);
                if (nextInput) nextInput.focus();
            }
        }
    };

    // Handle keyboard events for OTP inputs
    const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
        // Move to previous input on backspace when current input is empty
        if (e.key === "Backspace" && verificationCode[index] === "" && index > 0) {
            const prevInput = document.getElementById(`verification-${index - 1}`);
            if (prevInput) prevInput.focus();
        }
        
        // Allow pasting OTP
        if (e.key === "v" && (e.ctrlKey || e.metaKey)) {
            e.preventDefault();
            navigator.clipboard.readText().then(text => {
                if (/^\d+$/.test(text)) {
                    const digits = text.split('').slice(0, otpLength);
                    const newCode = [...verificationCode];
                    digits.forEach((digit, idx) => {
                        if (idx < otpLength) newCode[idx] = digit;
                    });
                    setVerificationCode(newCode);
                }
            });
        }
    };

    // Get title based on current step
    const getStepTitle = () => {
        switch (currentStep) {
            case "email":
                return "Forgot Password";
            case "verification":
                return "Verification Code";
            case "newPassword":
                return "Create New Password";
            case "success":
                return "Successful!";
            default:
                return "Forgot Password";
        }
    };

    // Get description based on current step
    const getStepDescription = () => {
        switch (currentStep) {
            case "email":
                return "Enter your phone number, we will send a verification code to your phone number.";
            case "verification":
                return `Enter the ${otpLength}-digit verification code that we have sent to your phone`;
            case "newPassword":
                return "Your password must be different from previously used passwords.";
            case "success":
            default:
                return "";
        }
    };

    return (
        <div className="h-screen fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/70" />

            {/* Modal Container */}
            <div className="relative bg-[#1A2028] text-white rounded-2xl w-full max-w-[480px] mx-auto shadow-2xl border border-[#2D3748]">
                {/* Header with back arrow and close button */}
                <div className="flex items-center justify-between p-6 border-b border-[#2D3748]">
                    {/* Back to home arrow */}
                    <button
                        onClick={handleBackToHome}
                        className="flex items-center gap-2 text-gray-400 hover:text-white cursor-pointer transition-colors"
                    >
                        <ArrowLeft size={20} />
                        <span>Back to Home</span>
                    </button>

                    {/* Close Button */}
                    <button
                        onClick={handleBackToHome}
                        className="text-gray-400 hover:text-white cursor-pointer transition-colors"
                    >
                        <X size={24} />
                    </button>
                </div>

                <div className="p-8">
                    {/* Back Button - shown for steps after phone input */}
                    {currentStep !== "email" && currentStep !== "success" && (
                        <button
                            onClick={() => {
                                setCurrentStep("email");
                                setMessage("");
                            }}
                            className="flex items-center gap-2 text-[#60A5FA] mb-4 cursor-pointer hover:text-[#3B82F6] transition-colors"
                        >
                            <ArrowLeft size={16} />
                            Back
                        </button>
                    )}

                    {/* Step Title and Description */}
                    <h2 className="text-2xl font-semibold text-white mb-3">
                        {getStepTitle()}
                    </h2>
                    <p className="text-gray-300 font-medium mb-8">
                        {getStepDescription()}
                    </p>

                    {/* Error/Success Message Display */}
                    {message && (
                        <div className={`mb-4 p-3 rounded-lg text-sm border ${
                            message.includes("successfully") || message.includes("sent") || message.includes("verified")
                                ? "bg-green-500/10 text-green-300 border-green-500/30" 
                                : "bg-red-500/10 text-red-300 border-red-500/30"
                        }`}>
                            {message}
                        </div>
                    )}

                    {/* Step 1: Phone Number Input */}
                    {currentStep === "email" && (
                        <div className="space-y-6">
                            <div>
                                <label className="block text-sm font-semibold text-white mb-2">
                                    Phone Number
                                </label>
                                <div className="relative">
                                    <input
                                        type="tel"
                                        placeholder="Enter your phone number"
                                        value={phoneNumber}
                                        onChange={(e) => setPhoneNumber(e.target.value)}
                                        required
                                        className="w-full p-3 bg-[#2D3748] border border-[#4A5568] text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-[#60A5FA] focus:border-transparent transition-colors"
                                    />
                                </div>
                            </div>

                            {/* Demo Mode Notice */}
                            {/* {true && ( // Change to false in production
                                <div className="text-xs text-yellow-400 bg-yellow-900/20 p-2 rounded border border-yellow-700/30">
                                    <strong>Demo Mode:</strong> Use any phone number and OTP "123456"
                                </div>
                            )} */}

                            {/* Continue Button */}
                            <button
                                onClick={handlePhoneSubmit}
                                disabled={loading}
                                className="w-full bg-[#60A5FA] text-white py-3 rounded-lg font-bold cursor-pointer hover:bg-[#3B82F6] disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors"
                            >
                                {loading ? "Sending OTP..." : "Send OTP"}
                            </button>
                        </div>
                    )}

                    {/* Step 2: OTP Input */}
                    {currentStep === "verification" && (
                        <div className="space-y-6">
                            <div>
                                {/* OTP inputs */}
                                <div className="flex gap-2 justify-center">
                                    {verificationCode.map((digit, index) => (
                                        <input
                                            key={index}
                                            id={`verification-${index}`}
                                            type="text"
                                            maxLength={1}
                                            value={digit}
                                            onChange={(e) => handleVerificationCodeChange(e.target.value, index)}
                                            onKeyDown={(e) => handleKeyDown(e, index)}
                                            className="w-12 h-12 sm:w-14 sm:h-14 bg-[#2D3748] border border-[#4A5568] rounded-lg text-center text-xl font-semibold focus:outline-none focus:ring-2 focus:ring-[#60A5FA] focus:border-transparent transition-colors"
                                        />
                                    ))}
                                </div>
                                
                                {/* Paste OTP hint */}
                                <p className="text-xs text-gray-400 text-center mt-2">
                                    Tip: You can paste OTP with Ctrl+V
                                </p>
                            </div>

                            {/* Resend code section */}
                            <div className="text-center">
                                <span className="text-sm text-gray-300">
                                    Didn&apos;t receive the code?{" "}
                                    <button
                                        onClick={handleResendCode}
                                        disabled={!canResend || loading}
                                        className={`font-medium cursor-pointer ${
                                            canResend && !loading
                                                ? "text-[#60A5FA] hover:text-[#3B82F6]"
                                                : "text-gray-500 cursor-not-allowed"
                                        } transition-colors`}
                                    >
                                        {canResend ? "Resend code" : `Resend code in 00:${countdown.toString().padStart(2, '0')}`}
                                    </button>
                                </span>
                            </div>

                            {/* Verify Button */}
                            <button
                                onClick={handleVerificationSubmit}
                                disabled={verificationCode.some(digit => digit === "") || loading}
                                className="w-full bg-[#60A5FA] text-white py-3 rounded-lg font-bold cursor-pointer hover:bg-[#3B82F6] disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors"
                            >
                                {loading ? "Verifying..." : "Verify OTP"}
                            </button>
                        </div>
                    )}

                    {/* Step 3: New Password Creation */}
                    {currentStep === "newPassword" && (
                        <div className="space-y-6">
                            {/* New Password Field */}
                            <div>
                                <label className="block text-sm font-semibold text-white mb-2">
                                    New Password
                                </label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        placeholder="Enter your new password"
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        className="w-full p-3 pl-10 bg-[#2D3748] border border-[#4A5568] text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-[#60A5FA] focus:border-transparent transition-colors"
                                    />
                                    {/* Password visibility toggle */}
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-200 cursor-pointer transition-colors"
                                    >
                                        {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                    </button>
                                </div>
                                <p className="text-xs text-gray-400 mt-1">
                                    Must be at least 6 characters long
                                </p>
                            </div>

                            {/* Confirm Password Field */}
                            <div>
                                <label className="block text-sm font-semibold text-white mb-2">
                                    Confirm Password
                                </label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                                    <input
                                        type={showConfirmPassword ? "text" : "password"}
                                        placeholder="Confirm Password"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        className="w-full p-3 pl-10 bg-[#2D3748] border border-[#4A5568] text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-[#60A5FA] focus:border-transparent transition-colors"
                                    />
                                    {/* Confirm password visibility toggle */}
                                    <button
                                        type="button"
                                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-200 cursor-pointer transition-colors"
                                    >
                                        {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                    </button>
                                </div>
                            </div>

                            {/* Reset Password Button */}
                            <button
                                onClick={handleNewPasswordSubmit}
                                disabled={loading}
                                className="w-full bg-[#60A5FA] text-white py-3 rounded-lg font-bold cursor-pointer hover:bg-[#3B82F6] disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors"
                            >
                                {loading ? "Resetting Password..." : "Reset Password"}
                            </button>
                        </div>
                    )}

                    {/* Step 4: Success Confirmation */}
                    {currentStep === "success" && (
                        <div className="flex flex-col items-center justify-center text-center space-y-6 py-8">
                            {/* Success Icon */}
                            <div className="w-20 h-20 flex items-center justify-center mb-2">
                                <div className="w-20 h-20 rounded-full border-4 border-[#60A5FA] flex items-center justify-center">
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="#60A5FA"
                                        strokeWidth="3"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        className="w-12 h-12"
                                    >
                                        <path d="M20 6L9 17l-5-5" />
                                    </svg>
                                </div>
                            </div>

                            {/* Success Title */}
                            <h2 className="text-2xl font-semibold text-white">Password Reset Successful!</h2>

                            {/* Success Description */}
                            <p className="text-gray-300 text-sm">
                                Your password has been changed successfully. You will be redirected to login shortly.
                            </p>

                            {/* Loading spinner for auto-redirect */}
                            <div className="mt-6 flex flex-col items-center gap-2">
                                <div className="w-8 h-8 border-4 border-t-[#60A5FA] border-[#2D3748] rounded-full animate-spin" />
                                <p className="text-gray-400 text-xs">
                                    Redirecting to admin dashboard...
                                </p>
                            </div>

                            {/* Manual login button */}
                            <button
                                onClick={() => router.push("/admin")}
                                className="mt-4 bg-[#60A5FA] text-white px-6 py-2 rounded-lg font-medium hover:bg-[#3B82F6] transition-colors cursor-pointer"
                            >
                                Go to Login Now
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}