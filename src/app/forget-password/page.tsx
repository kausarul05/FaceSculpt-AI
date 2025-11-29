"use client";

import { useState, useEffect } from "react";
import { X, Lock, Eye, EyeOff, ArrowLeft } from "lucide-react";
// import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import { useRouter } from "next/navigation";


// Define the steps for the forgot password flow
type ForgotPasswordStep = "email" | "verification" | "newPassword" | "success";

export default function ForgotPasswordModal() {
  // State for current step in the forgot password flow
  const [currentStep, setCurrentStep] = useState<ForgotPasswordStep>("email");
  
  // State for password visibility toggles
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  // State for verification code input (4-digit code)
  const [verificationCode, setVerificationCode] = useState(["", "", "", ""]);
  
  // State for countdown timer and resend functionality
  const [countdown, setCountdown] = useState(59);
  const [canResend, setCanResend] = useState(false);
  
  // State for form data
  const [email, setEmail] = useState("");
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
        // onClose();
        router.push("/admin"); // Changed from "/dashboard" to "/admin"
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [currentStep, router]);

  // Handle back to home route
  const handleBackToHome = () => {
    router.push("/");
    // onClose();
  };

  // Handle email submission for password reset request
  const handleEmailSubmit = async () => {
    // Validate email input
    if (!email.trim()) {
      setMessage("Please enter your phone number.");
      return;
    }

    // Basic phone number validation (simple check for demo)
    if (email.length < 10) {
      setMessage("Please enter a valid phone number.");
      return;
    }

    setLoading(true);
    setMessage("");
    
    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Log what would be sent to API
      console.log("Password reset requested for phone:", email);
      
      // Simulate successful phone submission
      setMessage("Verification code sent to your phone!");
      
      // Move to verification step
      setCurrentStep("verification");
      setCountdown(59);
      setCanResend(false);
      
    } catch (error) {
      // Handle errors
      setMessage(
        typeof error === "object" && error !== null && "message" in error
          ? (error as { message?: string }).message || "Failed to send verification code."
          : "Failed to send verification code."
      );
    } finally {
      setLoading(false);
    }
  };

  // Handle verification code submission
  const handleVerificationSubmit = async () => {
    // Combine the 4-digit code into a single string
    const code = verificationCode.join("");
    
    // Validate code length
    if (code.length !== 4) {
      setMessage("Please enter the complete verification code.");
      return;
    }

    setLoading(true);
    setMessage("");
    
    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Log verification attempt
      console.log("Verification attempt:", { phone: email, code });
      
      // Simulate successful verification
      setCurrentStep("newPassword");
      setMessage("");
      
    } catch (error) {
      // Handle verification errors
      setMessage(
        typeof error === "object" && error !== null && "message" in error
          ? (error as { message?: string }).message || "Invalid verification code."
          : "Invalid verification code."
      );
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
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Log password reset data
      console.log("Password reset data:", {
        phone: email,
        newPassword,
        confirmPassword
      });
      
      // Simulate successful password reset
      toast.success("Password reset successfully!");
      setCurrentStep("success");
      
    } catch (error) {
      // Handle password reset errors
      setMessage(
        typeof error === "object" && error !== null && "message" in error
          ? (error as { message?: string }).message || "Failed to reset password."
          : "Failed to reset password."
      );
    } finally {
      setLoading(false);
    }
  };

  // Handle resend verification code
  const handleResendCode = async () => {
    if (canResend) {
      setLoading(true);
      setMessage("");
      
      try {
        // Simulate API call delay
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        // Log resend attempt
        console.log("Resending code to:", email);
        
        // Reset countdown and update state
        setCountdown(59);
        setCanResend(false);
        setMessage("Verification code sent successfully!");
        
      } catch (error) {
        // Handle resend errors
        setMessage(
        typeof error === "object" && error !== null && "message" in error
          ? (error as { message?: string }).message || "Failed to resend code."
          : "Failed to resend code."
      );
      } finally {
        setLoading(false);
      }
    }
  };

  // Handle individual digit input for verification code
  const handleVerificationCodeChange = (value: string, index: number) => {
    // Only allow numeric input
    if (/^\d?$/.test(value)) {
      const newCode = [...verificationCode];
      newCode[index] = value;
      setVerificationCode(newCode);

      // Auto-focus next input when current digit is entered
      if (value !== "" && index < 3) {
        const nextInput = document.getElementById(`verification-${index + 1}`);
        if (nextInput) nextInput.focus();
      }
    }
  };

  // Handle keyboard events for verification code inputs
  const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
    // Move to previous input on backspace when current input is empty
    if (e.key === "Backspace" && verificationCode[index] === "" && index > 0) {
      const prevInput = document.getElementById(`verification-${index - 1}`);
      if (prevInput) prevInput.focus();
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
        return "Enter the verification code that we have sent to your phone";
      case "newPassword":
        return "Your password must be different from previous used password.";
      case "success":
      default:
        return "";
    }
  };

  return (
    <div className="h-screen fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop - closes modal when clicked */}
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
            className="text-gray-400 hover:text-white cursor-pointer transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <div className="p-8">
          {/* Back Button - shown for steps after email input */}
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
              message.includes("successfully") || message.includes("sent") 
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
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full p-3 bg-[#2D3748] border border-[#4A5568] text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-[#60A5FA] focus:border-transparent transition-colors"
                  />
                </div>
              </div>

              {/* Continue Button */}
              <button
                onClick={handleEmailSubmit}
                disabled={loading}
                className="w-full bg-[#60A5FA] text-white py-3 rounded-lg font-bold cursor-pointer hover:bg-[#3B82F6] disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? "Sending..." : "Continue"}
              </button>
            </div>
          )}

          {/* Step 2: Verification Code Input */}
          {currentStep === "verification" && (
            <div className="space-y-6">
              <div>
                {/* 4-digit verification code inputs */}
                <div className="flex gap-3 justify-center">
                  {verificationCode.map((digit, index) => (
                    <input
                      key={index}
                      id={`verification-${index}`}
                      type="text"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleVerificationCodeChange(e.target.value, index)}
                      onKeyDown={(e) => handleKeyDown(e, index)}
                      className="w-14 h-14 bg-[#2D3748] border border-[#4A5568] rounded-lg text-center text-xl font-semibold focus:outline-none focus:ring-2 focus:ring-[#60A5FA] focus:border-transparent transition-colors"
                    />
                  ))}
                </div>
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
                    {canResend ? "Resend code" : `Resend code at 00:${countdown.toString().padStart(2, '0')}`}
                  </button>
                </span>
              </div>

              {/* Verify Button */}
              <button
                onClick={handleVerificationSubmit}
                disabled={verificationCode.some(digit => digit === "") || loading}
                className="w-full bg-[#60A5FA] text-white py-3 rounded-lg font-bold cursor-pointer hover:bg-[#3B82F6] disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? "Verifying..." : "Continue"}
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
                {loading ? "Resetting..." : "Continue"}
              </button>
            </div>
          )}

          {/* Step 4: Success Confirmation */}
          {currentStep === "success" && (
            <div className="flex flex-col items-center justify-center text-center space-y-6 py-8">
              {/* Success Icon - Blue outlined checkmark */}
              <div className="w-20 h-20 flex items-center justify-center mb-2">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 512 512"
                  className="w-20 h-20 text-[#60A5FA]"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="20"
                >
                  <circle cx="256" cy="256" r="200" stroke="#60A5FA" strokeWidth="20" fill="none" />
                  <path
                    stroke="#60A5FA"
                    strokeWidth="20"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M176 260l50 50 110-110"
                  />
                </svg>
              </div>

              {/* Success Title */}
              <h2 className="text-2xl font-semibold text-white">Successful!</h2>

              {/* Success Description */}
              <p className="text-gray-300 text-sm">
                Your password has been changed successfully.
              </p>

              {/* Loading spinner for auto-redirect */}
              <div className="mt-6 flex justify-center">
                <div className="w-8 h-8 border-4 border-t-[#60A5FA] border-[#2D3748] rounded-full animate-spin" />
              </div>

              <p className="text-gray-400 text-xs mt-4">
                Redirecting to admin dashboard...
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}