"use client";

import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";
import AdminManagement from "./adminmanage";
import UserManage from "./usermanage";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default function DashboardPage() {
  const router = useRouter();

  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"Home" | "Dashboard" | "AdminManagement">("Home");

  useEffect(() => {
    const checkSession = async () => {
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession();

      if (error || !session) {
        router.replace("/admin");
        return;
      }
      setCurrentUser(session.user);
      setLoading(false);
    };

    checkSession();

    const { data: subscription } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        router.replace("/admin");
      } else {
        setCurrentUser(session.user);
      }
    });

    return () => subscription?.subscription?.unsubscribe?.();
  }, [router]);

  async function handleLogout() {
    await supabase.auth.signOut();
    router.replace("/admin");
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white text-yellow-400">
        Loading...
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-white text-yellow-400 font-sans">
      {/* Sidebar */}
      <aside className="w-64 bg-gray-100 border-r border-yellow-400 p-6 flex flex-col">
        <h2 className="text-2xl font-bold mb-6 text-black">Admin Panel</h2>
        <nav className="flex flex-col gap-3 text-black">
          <button
            onClick={() => setActiveTab("Home")}
            className={`text-left px-3 py-2 rounded hover:bg-yellow-200 ${
              activeTab === "Home" ? "bg-yellow-200 font-semibold" : ""
            }`}
          >
            Home
          </button>
          <button
            onClick={() => setActiveTab("Dashboard")}
            className={`text-left px-3 py-2 rounded hover:bg-yellow-200 ${
              activeTab === "Dashboard" ? "bg-yellow-200 font-semibold" : ""
            }`}
          >
            Users Logins
          </button>
          <button
            onClick={() => setActiveTab("AdminManagement")}
            className={`text-left px-3 py-2 rounded hover:bg-yellow-200 ${
              activeTab === "AdminManagement" ? "bg-yellow-200 font-semibold" : ""
            }`}
          >
            Admin Management
          </button>
          <button
            onClick={handleLogout}
            className="text-left px-3 py-2 rounded bg-red-500 text-white hover:bg-red-600 mt-6"
          >
            Logout
          </button>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8 overflow-y-auto space-y-8">
        {activeTab === "Home" && (
          <div>
            <h2 className="text-2xl font-bold text-black">Welcome to the Admin Panel</h2>
            <p className="text-black mt-4">Select a tab to manage Users or Admin settings.</p>
          </div>
        )}
        {activeTab === "Dashboard" && <UserManage />}
        {activeTab === "AdminManagement" && (
          <AdminManagement currentUserEmail={currentUser?.email ?? null} />
        )}
      </main>
    </div>
  );
}
