// app/admin/dashboard/ForcePasswordChange.tsx

"use client";
import React, { useState } from "react";
// 1. REMOVE the direct import
// import { createClient } from "@supabase/supabase-js";
// 2. ADD the import for the shared client
import supabase from "../../../lib/supabase/client"; // Adjust path if needed
import { FaEye, FaEyeSlash } from "react-icons/fa";

// 3. REMOVE the local client initialization
// const supabase = createClient(
//   process.env.NEXT_PUBLIC_SUPABASE_URL!,
//   process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
// );

// --- Rest of the component remains the same ---

interface ForcePasswordChangeProps {
  userId: string;
  onPasswordChanged: () => void; // A function to reload the dashboard
}

export default function ForcePasswordChange({ userId, onPasswordChanged }: ForcePasswordChangeProps) {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const validatePassword = (password: string) => {
    if (!password) return "Password is required.";
    if (password.length < 8) return "Password must be at least 8 characters long.";
    if (!/[A-Z]/.test(password)) return "Password must contain an uppercase letter.";
    if (!/[a-z]/.test(password)) return "Password must contain a lowercase letter.";
    if (!/\d/.test(password)) return "Password must contain a number.";
    // Broader special character check
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) return "Password must contain a special character.";
    return "";
  };

  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    console.log("[ForcePasswordChange] Validating password...");
    const validationError = validatePassword(newPassword);
    if (validationError) {
      console.warn("[ForcePasswordChange] Validation failed:", validationError);
      setError(validationError);
      return;
    }
    if (newPassword !== confirmPassword) {
      console.warn("[ForcePasswordChange] Passwords do not match.");
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    console.log("[ForcePasswordChange] Attempting password update...");
    try {
      // 1. Update the password in Supabase Auth
      // Now uses the imported shared 'supabase' client
      console.log("[ForcePasswordChange] Updating Supabase Auth user...");
      const { error: updateAuthError } = await supabase.auth.updateUser({ password: newPassword });
      if (updateAuthError) {
         console.error("[ForcePasswordChange] Auth update error:", updateAuthError.message);
         throw updateAuthError;
      }
      console.log("[ForcePasswordChange] Auth user updated.");

      // 2. Update the flag in your 'admin' table
      // ⚠️ Ensure RLS on 'admin' table allows UPDATE WHERE auth.uid() = id
      console.log("[ForcePasswordChange] Updating 'admin' table flag for user:", userId);
      const { error: updateProfileError } = await supabase
        .from("admin")
        .update({ requires_password_change: false }) // Set flag to false
        .eq("id", userId); // For the specific user

      if (updateProfileError) {
           console.error("[ForcePasswordChange] Profile update error:", updateProfileError.message);
           throw updateProfileError;
      }
      console.log("[ForcePasswordChange] 'admin' table flag updated.");

      alert("Password updated successfully! The dashboard will now load.");
      onPasswordChanged(); // Trigger a refresh of the parent component (dashboard)

    } catch (err) {
      const errorMsg = (err as Error).message;
      console.error("[ForcePasswordChange] Password update failed:", errorMsg);
      setError(`Failed to update password: ${errorMsg}`);
    } finally {
      setLoading(false);
    }
  };

  // --- Render logic remains the same ---
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900 bg-opacity-75 backdrop-blur-sm">
      <div className="bg-white p-8 rounded-xl shadow-2xl w-full max-w-md text-black">
        <h2 className="text-2xl font-bold mb-2">Change Your Password</h2>
        <p className="text-gray-600 mb-6">For security, you must change your temporary password before proceeding.</p>
        <form onSubmit={handlePasswordUpdate}>
          <div className="space-y-4">
            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
              <input
                type={showPassword ? "text" : "password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full mt-1 p-3 border border-gray-300 rounded-lg focus:ring-yellow-400 focus:border-yellow-400 pr-10" // Added pr-10
                required
                autoComplete="new-password"
              />
              <button type="button" onClick={() => setShowPassword(!showPassword)} title={showPassword ? "Hide password" : "Show password"} className="absolute right-3 top-[38px] text-gray-500 hover:text-gray-700"> {/* Adjusted position */}
                {showPassword ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>
            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label>
              <input
                type={showConfirmPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className={`w-full mt-1 p-3 border rounded-lg focus:ring-yellow-400 focus:border-yellow-400 pr-10 ${newPassword && confirmPassword && newPassword !== confirmPassword ? 'border-red-500' : 'border-gray-300'}`} // Highlight mismatch
                required
                autoComplete="new-password"
              />
               <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} title={showConfirmPassword ? "Hide password" : "Show password"} className="absolute right-3 top-[38px] text-gray-500 hover:text-gray-700"> {/* Adjusted position */}
                {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>
             {newPassword && confirmPassword && newPassword !== confirmPassword && (
                <p className="text-red-600 text-xs text-center">Passwords do not match.</p>
             )}
          </div>
          {error && <p className="text-red-600 mt-4 text-center font-medium">{error}</p>}
          <button
            type="submit"
            disabled={loading || !newPassword || !confirmPassword || !!validatePassword(newPassword) || newPassword !== confirmPassword} // More robust disable logic
            className="w-full mt-6 bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-3 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Updating..." : "Set New Password and Continue"}
          </button>
        </form>
      </div>
    </div>
  );
}