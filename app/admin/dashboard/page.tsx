// app/admin/dashboard/page.tsx

"use client";

import { useEffect, useState, ComponentType } from "react";
import { createClient } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";
import AdminManagement from "./adminmanage";
import UserManage from "./usermanage";
import ApplicantsManage from "./applicantsmanage";
import UserLoginsManage from "./userlogins";
import ForcePasswordChange from "./ForcePasswordChange";
import DashboardHome from "./DashboardHome"; // Import the new dashboard component

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Define a type for your GoogleUser if it's not globally available
// You can adjust this based on the actual structure
export interface GoogleUser {
    id: string;
    email?: string;
    // add other properties as needed
}

type TabName = "Home" | "AdminLogins" | "Applicants" | "UserLogins" | "AdminManagement";

const tabs: { [key in TabName]: { title: string; component: ComponentType<any> | null } } = {
  Home: { title: "Dashboard", component: DashboardHome },
  AdminLogins: { title: "Admin Login History", component: UserManage },
  Applicants: { title: "Applicant Submissions", component: ApplicantsManage },
  UserLogins: { title: "User Login History", component: UserLoginsManage },
  AdminManagement: { title: "Admin Management", component: AdminManagement },
};

// Define the shape of an admin's profile
interface AdminProfile {
  id: string;
  name: string | null;
  email: string | null;
  role?: string;
  requires_password_change?: boolean;
}

// NOTE: The component name is now `DashboardPage` to avoid conflict with the default export `Page`
export default function DashboardPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<AdminProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabName>("Home");
  // Assuming initialGoogleUsers is fetched or passed differently now, or can be empty
  const [initialGoogleUsers, setInitialGoogleUsers] = useState<GoogleUser[]>([]);

  const fetchCurrentUserProfile = async () => {
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (!session || sessionError) {
      router.replace("/admin");
      return;
    }

    const { data: profile, error: profileError } = await supabase
      .from("admin")
      .select("*")
      .eq("id", session.user.id)
      .single();
  if (profileError || !profile) {
        console.error("Could not fetch admin profile:", profileError);
        await supabase.auth.signOut();
        router.replace("/admin");
        return;
      }
    
    setCurrentUser(profile);
    setLoading(false);
  };

  useEffect(() => {
    fetchCurrentUserProfile();

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        router.replace("/admin");
      }
    });

    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, [router]);

  async function handleLogout() {
    await supabase.auth.signOut();
    router.replace("/admin");
  }

  const ActiveComponent = tabs[activeTab].component;
  const pageTitle = tabs[activeTab].title;
  
  const componentProps: { [key: string]: any } = {
    UserLogins: { users: initialGoogleUsers },
    AdminManagement: { currentUserEmail: currentUser?.email ?? null },
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100 text-yellow-500">
        <p className="text-lg font-semibold">Loading Dashboard...</p>
      </div>
    );
  }

  return (
    <>
      {currentUser?.requires_password_change && currentUser.id && (
        <ForcePasswordChange 
          userId={currentUser.id} 
          onPasswordChanged={fetchCurrentUserProfile}
        />
      )}
      
      <div className="flex min-h-screen font-sans">
        <aside className="w-64 bg-white border-r border-gray-200 p-5 flex flex-col shrink-0">
          <div className="flex items-center gap-3 mb-8">
              <img src="/assets/TIPLogo.png" alt="TIP Logo" className="w-9 h-9" />
              <h1 className="text-xl font-bold text-gray-800">Admin Panel</h1>
          </div>
          <div className="flex flex-col flex-grow">
              <nav className="flex flex-col gap-2">
                  {Object.keys(tabs).map((tabKey) => {
                      const tab = tabs[tabKey as TabName];
                      return (
                      <button
                          key={tabKey}
                          onClick={() => setActiveTab(tabKey as TabName)}
                          className={`w-full text-left px-4 py-2.5 rounded-lg text-sm font-medium transition-colors duration-200 ${
                          activeTab === tabKey
                              ? "bg-yellow-400 text-white shadow-sm"
                              : "text-gray-600 hover:bg-gray-100"
                          }`}
                      >
                          {tab.title === "Admin Login History" ? "Admin Logins" : tab.title === "User Login History" ? "User Logins" : tab.title}
                      </button>
                      );
                  })}
              </nav>
              <button
                  onClick={handleLogout}
                  className="w-full text-left px-4 py-2.5 rounded-lg text-sm font-medium transition-colors duration-200 bg-red-500 text-white hover:bg-red-600 mt-6"
              >
                  Logout
              </button>
          </div>
        </aside>
        <main className="flex-1 p-8 bg-gray-50 overflow-y-auto">
          {activeTab === "Home" ? (
            <div>
              <h2 className="text-3xl font-bold text-gray-800 mb-6">Dashboard</h2>
              {ActiveComponent && <ActiveComponent />}
            </div>
          ) : (
            <div className="space-y-6">
              <h2 className="text-3xl font-bold text-gray-800">{pageTitle}</h2>
              <div className="bg-white p-6 rounded-xl shadow-md border border-gray-200">
                {ActiveComponent && <ActiveComponent {...(componentProps[activeTab] || {})} />}
              </div>
            </div>
          )}
        </main>
      </div>
    </>
  );
}