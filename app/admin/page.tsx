"use client";
import React, { useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function AdminAuth() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authMode, setAuthMode] = useState<"login" | "register">("register");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const router = useRouter();

  async function handleAuth(e: React.FormEvent) {
    e.preventDefault();
    setErrorMessage("");

    if (!email || !password || (authMode === "register" && !name)) {
      setErrorMessage("Please fill in all required fields.");
      return;
    }

    setLoading(true);

    try {
      if (authMode === "login") {
        // Login using Supabase Auth
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error || !data.session) {
          setErrorMessage("Invalid credentials. Please try again.");
          setLoading(false);
          return;
        }

        router.replace("/admin/dashboard");
      } else {
        // Register

        // 1. Create user with Supabase Auth
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: name },
          },
        });

        if (error || !data.user) {
          setErrorMessage(error?.message ?? "Failed to register.");
          setLoading(false);
          return;
        }

        // 2. Insert into admin table with id matching auth user id
        const { error: profileError } = await supabase.from("admin").insert({
          id: data.user.id, // FK to auth.users.id
          name,
          email,
        });

        if (profileError) {
          setErrorMessage("Failed to save profile: " + profileError.message);
          setLoading(false);
          return;
        }

        // 3. Auto-login after registration
        const { error: loginError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (loginError) {
          setErrorMessage(
            "Registration successful, but auto-login failed. Please login manually."
          );
          setLoading(false);
          return;
        }

        router.replace("/admin/dashboard");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white shadow-lg rounded-xl p-8 w-96">
        <h1 className="text-2xl font-bold text-center mb-6 flex items-center gap-2 text-black">
          <img src="/assets/TIPLogo.png" alt="TIP Logo" className="w-8 h-8" />
          {authMode === "login" ? "Admin Login" : "Admin Register"}
        </h1>

        <form onSubmit={handleAuth} className="flex flex-col">
          {authMode === "register" && (
            <input
              type="text"
              placeholder="Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full mb-4 p-3 border rounded-lg text-black focus:ring focus:ring-yellow-300"
              required
            />
          )}
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full mb-4 p-3 border rounded-lg text-black focus:ring focus:ring-yellow-300"
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full mb-6 p-3 border rounded-lg text-black focus:ring focus:ring-yellow-300"
            required
          />
          {errorMessage && <p className="text-red-600 mb-4">{errorMessage}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-3 rounded-lg mb-4 transition disabled:opacity-50"
          >
            {loading
              ? "Please wait..."
              : authMode === "login"
              ? "Login"
              : "Register"}
          </button>
        </form>

        <p className="text-sm text-center">
          {authMode === "login" ? "Don’t have an account?" : "Already registered?"}{" "}
          <button
            onClick={() => {
              setAuthMode(authMode === "login" ? "register" : "login");
              setErrorMessage("");
            }}
            className="text-yellow-600 font-semibold hover:underline"
          >
            {authMode === "login" ? "Register here" : "Login here"}
          </button>
        </p>
      </div>
    </div>
  );
}
