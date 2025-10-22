"use client";
import React, { useState } from "react";
// 1. REMOVE the direct import
// import { createClient } from "@supabase/supabase-js";
// 2. ADD the import for the shared client
import supabase from "../../lib/supabase/client"; // Adjust path if needed
import { useRouter } from "next/navigation";

// 3. REMOVE the local client initialization
// const supabase = createClient(
//   process.env.NEXT_PUBLIC_SUPABASE_URL!,
//   process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
// );

export default function AdminLoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    setLoading(true);
    console.log("[Admin Login] Attempting sign in..."); // Log start

    // Now uses the imported shared 'supabase' client
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    // Check for errors or missing session/user
    if (error || !data.session || !data.user) {
       console.error("[Admin Login] Sign in failed:", error?.message || "No session/user data returned");
      // Provide a more specific error if possible
      setErrorMessage(error?.message || "Invalid credentials. Please try again.");
      setLoading(false);
      return;
    }
    console.log("[Admin Login] Sign in successful. User ID:", data.user.id);

    // --- Record Login Event (Optional but recommended) ---
    try {
      console.log("[Admin Login] Fetching admin profile for logging...");
      // Fetch the admin's name from the 'admin' table to make the log more informative
      // ⚠️ Ensure RLS allows reading own profile (auth.uid() = id)
      const { data: adminProfile, error: profileError } = await supabase
        .from('admin')
        .select('name')
        .eq('id', data.user.id) // Match the logged-in user's ID
        .single(); // Expect one result

       if (profileError) {
           // Log the error but don't stop the login process
           console.warn("[Admin Login] Could not fetch admin name for history log:", profileError.message);
       }

      console.log("[Admin Login] Recording login event in admin_login_history...");
      // Insert the login record into the history table
      // ⚠️ Ensure RLS allows INSERT into admin_login_history
      const { error: logError } = await supabase
        .from("admin_login_history")
        .insert({
          admin_id: data.user.id, // Use the user ID from the successful login
          name: adminProfile?.name || data.user.email, // Use fetched name or fallback to email
          email: data.user.email, // Use email from the successful login
          // login_timestamp is handled by default value 'now()' in the database
        });

      if (logError) {
        // Log the error but don't stop the login process
        console.error("[Admin Login] Failed to record login event:", logError.message);
      } else {
         console.log("[Admin Login] Login event recorded.");
      }
    } catch (e) {
      // Catch unexpected errors during the logging process
      console.error("[Admin Login] An unexpected error occurred while logging the event:", e);
    }
    // --- End Record Login Event ---

    console.log("[Admin Login] Redirecting to /admin/dashboard...");
    // Redirect AFTER successful login and logging attempt
    // Use replace so the login page isn't in the browser history
    router.replace("/admin/dashboard");
    // No need to setLoading(false) here, as we are navigating away
  };

  // --- Render logic remains the same ---
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <div className="bg-white shadow-xl rounded-xl p-8 w-full max-w-sm">
        <div className="flex justify-center mb-6">
           <img src="/assets/TIPLogo.png" alt="TIP Logo" className="w-12 h-12" />
        </div>
        <h1 className="text-2xl font-bold text-center mb-6 text-gray-800">
           Admin Portal Login
        </h1>
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 sr-only" htmlFor="email">Email</label>
            <input
               id="email"
               type="email"
               placeholder="Email Address"
               value={email}
               onChange={(e) => setEmail(e.target.value)}
               className="w-full p-3 border border-gray-300 rounded-lg text-black focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
               required
               autoComplete="email"
             />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 sr-only" htmlFor="password">Password</label>
            <input
               id="password"
               type="password"
               placeholder="Password"
               value={password}
               onChange={(e) => setPassword(e.target.value)}
               className="w-full p-3 border border-gray-300 rounded-lg text-black focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
               required
               autoComplete="current-password"
            />
          </div>

          {errorMessage && <p className="text-red-600 text-sm text-center font-medium">{errorMessage}</p>}

          <button
             type="submit"
             disabled={loading}
             className="w-full bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-3 px-4 rounded-lg transition-colors duration-200 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center"
           >
             {loading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                     <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                     <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                   </svg>
                   Logging in...
                </>
              ) : (
                "Login"
              )}
          </button>
        </form>
      </div>
    </div>
  );
}