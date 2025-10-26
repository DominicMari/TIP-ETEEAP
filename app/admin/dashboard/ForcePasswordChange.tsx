// app/admin/dashboard/ForcePasswordChange.tsx

"use client";
import React, { useState } from "react";
// 1. Use the shared client
import supabase from "../../../lib/supabase/client"; // Adjust path if needed
import { FaEye, FaEyeSlash } from "react-icons/fa";

// --- Rest of the component remains the same ---

interface ForcePasswordChangeProps {
  userId: string;
  onPasswordChanged: () => void; // A function to reload the dashboard
}

export default function ForcePasswordChange({ userId, onPasswordChanged }: ForcePasswordChangeProps) {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitError, setSubmitError] = useState(""); // For errors from the submission (e.g., API failure)
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // ✅ 1. Add a new state just for real-time password rule validation.
  const [passwordRuleError, setPasswordRuleError] = useState("");

  const validatePassword = (password: string) => {
    // ✅ Modified validation: Don't show "Password is required" while typing.
    if (password.length > 0 && password.length < 8) return "Password must be at least 8 characters long.";
    if (password.length > 0 && !/[A-Z]/.test(password)) return "Password must contain an uppercase letter.";
    if (password.length > 0 && !/[a-z]/.test(password)) return "Password must contain a lowercase letter.";
    if (password.length > 0 && !/\d/.test(password)) return "Password must contain a number.";
    if (password.length > 0 && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) return "Password must contain a special character.";
    return ""; // All rules passed (or field is empty)
  };

  // ✅ 2. Create a handler that validates as the user types.
  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newPass = e.target.value;
    setNewPassword(newPass);
    setPasswordRuleError(validatePassword(newPass)); // Set real-time validation error
    setSubmitError(""); // Clear any old submission errors
  };

  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(""); // Clear old submission errors
    setPasswordRuleError(""); // Clear rule errors

    // ✅ 3. Run all validations one last time on submit.
    const validationError = validatePassword(newPassword);
    if (!newPassword) { // Check for empty password *only* on submit
        setPasswordRuleError("Password is required.");
        return;
    }
    if (validationError) {
      console.warn("[ForcePasswordChange] Validation failed:", validationError);
      setPasswordRuleError(validationError); // Show rule error
      return;
    }
    if (newPassword !== confirmPassword) {
      console.warn("[ForcePasswordChange] Passwords do not match.");
      setSubmitError("Passwords do not match."); // Use the main error for mismatch
      return;
    }

    setLoading(true);
    console.log("[ForcePasswordChange] Attempting password update...");
    try {
      // 1. Update the password in Supabase Auth
      console.log("[ForcePasswordChange] Updating Supabase Auth user...");
      const { error: updateAuthError } = await supabase.auth.updateUser({ password: newPassword });
      if (updateAuthError) {
         console.error("[ForcePasswordChange] Auth update error:", updateAuthError.message);
         throw updateAuthError;
      }
      console.log("[ForcePasswordChange] Auth user updated.");

      // 2. Update the flag in your 'admin' table
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
      setSubmitError(`Failed to update password: ${errorMsg}`); // Set submission error
    } finally {
      setLoading(false);
    }
  };

  // --- Render logic ---
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
                // ✅ 4. Use the new handler here
                onChange={handlePasswordChange}
                className="w-full mt-1 p-3 border border-gray-300 rounded-lg focus:ring-yellow-400 focus:border-yellow-400 pr-10"
                required
                autoComplete="new-password"
              />
              <button type="button" onClick={() => setShowPassword(!showPassword)} title={showPassword ? "Hide password" : "Show password"} className="absolute right-3 top-[38px] text-gray-500 hover:text-gray-700">
                {showPassword ? <FaEyeSlash /> : <FaEye />}
              </button>
              {/* ✅ 5. Show the real-time rule error */}
              {passwordRuleError && <p className="text-red-600 text-xs mt-1">{passwordRuleError}</p>}
            </div>
            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label>
              <input
                type={showConfirmPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className={`w-full mt-1 p-3 border rounded-lg focus:ring-yellow-400 focus:border-yellow-400 pr-10 ${newPassword && confirmPassword && newPassword !== confirmPassword ? 'border-red-500' : 'border-gray-300'}`}
                required
                autoComplete="new-password"
              />
              <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} title={showConfirmPassword ? "Hide password" : "Show password"} className="absolute right-3 top-[38px] text-gray-500 hover:text-gray-700">
                {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>
            {newPassword && confirmPassword && newPassword !== confirmPassword && (
              <p className="text-red-600 text-xs text-center">Passwords do not match.</p>
            )}
          </div>
          
          {/* ✅ 6. Show the main submission error */}
          {submitError && <p className="text-red-600 mt-4 text-center font-medium">{submitError}</p>}
          
          <button
            type="submit"
            // ✅ 7. Update disabled logic to check the real-time rule error
            disabled={loading || !newPassword || !confirmPassword || !!passwordRuleError || newPassword !== confirmPassword}
            className="w-full mt-6 bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-3 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Updating..." : "Set New Password and Continue"}
          </button>
        </form>
      </div>
    </div>
  );
}