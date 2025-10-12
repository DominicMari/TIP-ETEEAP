"use client";
import React, { useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

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

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error || !data.session) {
      setErrorMessage("Invalid credentials. Please try again.");
      setLoading(false);
      return;
    } 
    
    try {
      // Fetch the admin's name from the 'admin' table
      const { data: adminProfile } = await supabase
        .from('admin')
        .select('name')
        .eq('id', data.user.id)
        .single();

      // Insert the login record into the history table
      const { error: logError } = await supabase
        .from("admin_login_history")
        .insert({
          admin_id: data.user.id,
          name: adminProfile?.name || data.user.email,
          email: data.user.email,
        });

      if (logError) {
        console.error("Failed to record login event:", logError.message);
      }
    } catch (e) {
      console.error("An unexpected error occurred while logging the event:", e);
    }
    
    router.replace("/admin/dashboard");
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white shadow-lg rounded-xl p-8 w-96">
        <h1 className="text-2xl font-bold text-center mb-6 flex items-center justify-center gap-2 text-black">
          <img src="/assets/TIPLogo.png" alt="TIP Logo" className="w-8 h-8" />
          Admin Login
        </h1>
        <form onSubmit={handleLogin} className="flex flex-col">
          {/* Input fields remain the same */}
          <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full mb-4 p-3 border rounded-lg text-black" required />
          <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full mb-6 p-3 border rounded-lg text-black" required />
          {errorMessage && <p className="text-red-600 mb-4 text-center">{errorMessage}</p>}
          <button type="submit" disabled={loading} className="w-full bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-3 rounded-lg">
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>
      </div>
    </div>
  );
}