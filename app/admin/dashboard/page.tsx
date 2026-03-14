"use client";

import { useEffect, useState, ComponentType, useMemo, useRef } from "react";
import supabase from "../../../lib/supabase/client";
import { useRouter } from "next/navigation";
// Import child components
import AdminManagement from "./adminmanage";
import UserManage from "./usermanage";
import ApplicantsManage from "./applicantsmanage";
import UserLoginsManage from "./userlogins";
import ForcePasswordChange from "./ForcePasswordChange";
import DashboardHome from "./DashboardHome";
import EmailManagement from "./emailmanagement";
// ✅ 1. Import your new component
import PortfolioSubmissions from "./portfoliosubmissions";

// Define a type for your GoogleUser
export interface GoogleUser {
  id: string;
  email?: string;
}

type HomeRecordNavigationTarget = {
  formType: "Application" | "Portfolio";
  id: string;
};

type RecordFocusRequest = {
  tab: "Applicants" | "PortfolioSubmissions";
  id: string;
  key: number;
};

// ✅ 2. Add the new tab name to the type
type TabName =
  | "Home"
  | "Applicants"
  | "PortfolioSubmissions" // <-- ADDED
  | "UserLogins"
  | "AdminLogins"
  | "AdminManagement"
  | "EmailManagement";

// ✅ 3. Add the new tab to the 'tabs' object
const tabs: { [key in TabName]: { title: string; component: ComponentType<any> | null } } = {
  Home: { title: "Dashboard", component: DashboardHome },
  Applicants: { title: "Applicant Submissions", component: ApplicantsManage },
  PortfolioSubmissions: { title: "Portfolio Submissions", component: PortfolioSubmissions }, // <-- ADDED
  UserLogins: { title: "User Login History", component: UserLoginsManage },
  AdminLogins: { title: "Admin Login History", component: UserManage },
  AdminManagement: { title: "Admin Management", component: AdminManagement },
  EmailManagement: { title: "Email Management", component: EmailManagement }, 
};

// Define the shape of an admin's profile
interface AdminProfile {
  id: string;
  name: string | null;
  email: string | null;
  role?: string;
  requires_password_change?: boolean;
}

export default function DashboardPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<AdminProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabName>("Home");
  const [recordFocusRequest, setRecordFocusRequest] = useState<RecordFocusRequest | null>(null);

  const inactivityTimer = useRef<NodeJS.Timeout | null>(null);

  // Function to fetch the currently logged-in admin's profile
  const fetchCurrentUserProfile = async () => {
    console.log("[DashboardPage] fetchCurrentUserProfile: Starting...");
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError) {
      console.error("[DashboardPage] fetchCurrentUserProfile: Error getting session:", sessionError.message);
      await supabase.auth.signOut();
      router.replace("/admin");
      return;
    }
    if (!session) {
      console.log("[DashboardPage] fetchCurrentUserProfile: No active session found. Redirecting.");
      router.replace("/admin");
      return;
    }

    console.log("[DashboardPage] fetchCurrentUserProfile: Session found. User ID:", session.user.id);

    try {
      console.log("[DashboardPage] fetchCurrentUserProfile: Fetching profile from 'admin' table...");
      const { data: profile, error: profileError } = await supabase
        .from("admin")
        .select("*")
        .eq("id", session.user.id)
        .single();

      if (profileError) {
        console.error("[DashboardPage] fetchCurrentUserProfile: Error fetching profile:", profileError.message);
        console.error("[DashboardPage] Check RLS on 'admin' table (needs SELECT using auth.uid()=id) or if admin record exists.");
        await supabase.auth.signOut();
        router.replace("/admin");
        return;
      }

      if (!profile) {
        console.error("[DashboardPage] fetchCurrentUserProfile: No profile data returned for ID:", session.user.id, "(Check RLS/data existence)");
        await supabase.auth.signOut();
        router.replace("/admin");
        return;
      }

      console.log("[DashboardPage] fetchCurrentUserProfile: Profile fetched successfully:", profile);
      setCurrentUser(profile);
      setLoading(false);
    } catch (err) {
      console.error("[DashboardPage] fetchCurrentUserProfile: Unexpected error:", err);
      await supabase.auth.signOut();
      router.replace("/admin");
    }
  };

  // Function to handle user logout
  async function handleLogout() {
    const isConfirmed = window.confirm("Are you sure you want to log out?");
    if (!isConfirmed) {
      return; // Stop logout if user clicks "Cancel"
    }

    console.log("[DashboardPage] handleLogout: Attempting sign out...");
    setLoading(true);
    const { error } = await supabase.auth.signOut();
    setLoading(false);
    if (error) {
      console.error("[DashboardPage] handleLogout: Error signing out:", error.message);
      alert(`Logout failed: ${error.message}`);
    } else {
      console.log("[DashboardPage] handleLogout: Sign out successful. Redirect should occur via listener.");
      setCurrentUser(null);
      router.push("/admin");
    }
  }

  const handleNavigateToRecord = (target: HomeRecordNavigationTarget) => {
    const nextTab: "Applicants" | "PortfolioSubmissions" =
      target.formType === "Application" ? "Applicants" : "PortfolioSubmissions";

    setRecordFocusRequest({
      tab: nextTab,
      id: target.id,
      key: Date.now(),
    });
    setActiveTab(nextTab);
  };

  const handleFocusRequestHandled = (
    tab: "Applicants" | "PortfolioSubmissions",
    key: number
  ) => {
    setRecordFocusRequest((prev) => {
      if (!prev) return null;
      if (prev.tab !== tab) return prev;
      if (prev.key !== key) return prev;
      return null;
    });
  };
  
  // Inactivity Logout Effect
  useEffect(() => {
    const twentyMinutes = 20 * 60 * 1000;

    const logoutInactiveUser = () => {
      if (currentUser) {
        console.log("[DashboardPage] Inactivity timer elapsed. Logging out...");
        alert("You have been logged out due to 20 minutes of inactivity.");
        handleLogout();
      }
    };

    const resetTimer = () => {
      if (inactivityTimer.current) {
        clearTimeout(inactivityTimer.current);
      }
      inactivityTimer.current = setTimeout(logoutInactiveUser, twentyMinutes);
    };

    const events = ["mousemove", "keydown", "click", "scroll"];
    resetTimer();
    events.forEach((event) => {
      window.addEventListener(event, resetTimer);
    });

    return () => {
      console.log("[DashboardPage] Clearing inactivity listeners and timer.");
      if (inactivityTimer.current) {
        clearTimeout(inactivityTimer.current);
      }
      events.forEach((event) => {
        window.removeEventListener(event, resetTimer);
      });
    };
  }, [currentUser, router]); // Dependency array is correct


  // Effect to fetch user profile on initial mount and set up auth listener
  useEffect(() => {
    fetchCurrentUserProfile();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log("[DashboardPage] Auth State Change:", event, session ? "Session Active" : "No Session");
        if (event === "SIGNED_OUT" || !session) {
          setCurrentUser(null);
          router.replace("/admin");
        }
      }
    );

    return () => {
      console.log("[DashboardPage] Unmounting, unsubscribing from auth listener.");
      authListener?.subscription.unsubscribe();
    };
  }, [router]);

  // Determine the component and title for the currently active tab
  const ActiveComponent = tabs[activeTab]?.component;
  const pageTitle = tabs[activeTab]?.title ?? "Dashboard";

  // ✅ 4. Add an entry for your new component's props (if any)
  const componentProps: { [key: string]: any } = useMemo(
    () => ({
      Home: {
        onNavigateToRecord: handleNavigateToRecord,
      },
      Applicants: {
        focusApplicationId: recordFocusRequest?.tab === "Applicants" ? recordFocusRequest.id : null,
        focusRequestKey: recordFocusRequest?.tab === "Applicants" ? recordFocusRequest.key : 0,
        onFocusRequestHandled: (key: number) => handleFocusRequestHandled("Applicants", key),
      },
      PortfolioSubmissions: {
        focusSubmissionId:
          recordFocusRequest?.tab === "PortfolioSubmissions" ? recordFocusRequest.id : null,
        focusRequestKey:
          recordFocusRequest?.tab === "PortfolioSubmissions" ? recordFocusRequest.key : 0,
        onFocusRequestHandled: (key: number) =>
          handleFocusRequestHandled("PortfolioSubmissions", key),
      },
      AdminManagement: { currentUser: currentUser },
      EmailManagement: {},
    }),
    [currentUser, recordFocusRequest]
  );

  // --- Render Logic ---

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100 text-yellow-500">
        <svg
          className="animate-spin -ml-1 mr-3 h-8 w-8 text-yellow-500"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          ></path>
        </svg>
        <p className="text-lg font-semibold">Loading Dashboard...</p>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 text-red-600 p-4">
        <h2 className="text-xl font-bold mb-4">Authentication Error</h2>
        <p className="text-center">
          Could not load your admin profile. Please log in again.
        </p>
        <button
          onClick={() => router.replace("/admin")}
          className="mt-6 px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600 focus:outline-none focus:ring-2 focus:ring-yellow-400"
        >
          Go to Login
        </button>
      </div>
    );
  }

  // Render the main dashboard layout
  return (
    <>
      {currentUser.requires_password_change && (
        <ForcePasswordChange
          userId={currentUser.id}
          onPasswordChanged={fetchCurrentUserProfile}
        />
      )}

      <div
        className={`flex min-h-screen font-sans ${
          currentUser.requires_password_change
            ? "filter blur-sm pointer-events-none"
            : ""
        }`}
      >
        {/* Sidebar */}
        <aside className="w-64 bg-white border-r border-gray-200 p-5 flex flex-col shrink-0 h-screen sticky top-0">
          <div className="flex items-center gap-3 mb-8 flex-shrink-0">
            <img src="/assets/NewTIPLogo.png" alt="TIP Logo" className="w-13 h-10" />
            <h1 className="text-xl font-bold text-gray-800">Admin Panel</h1>
          </div>
          <div className="flex flex-col flex-grow overflow-y-auto overflow-x-hidden">
            <nav className="flex flex-col gap-2 flex-grow pr-1">
              {Object.keys(tabs).map((tabKey) => {
                const key = tabKey as TabName;
                const tab = tabs[key];
                if (!tab.component) return null;

                return (
                  <button
                    key={key}
                    onClick={() => setActiveTab(key)}
                    className={`w-full text-left px-4 py-2.5 rounded-lg text-sm font-medium transition-colors duration-150 ${
                      activeTab === key
                        ? "bg-yellow-400 text-black shadow-sm font-semibold"
                        : "text-gray-600 hover:bg-gray-100 focus:bg-gray-100 focus:outline-none"
                    }`}
                  >
                    {key === "AdminLogins"
                      ? "Admin Logins"
                      : key === "UserLogins"
                      ? "User Logins"
                      : tab.title}
                  </button>
                );
              })}
            </nav>
            <button
              onClick={handleLogout}
              className="w-full text-left px-4 py-2.5 rounded-lg text-sm font-medium transition-colors duration-150 bg-red-600 text-white hover:bg-red-700 mt-6 flex-shrink-0 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-1"
            >
              Logout
            </button>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 p-6 sm:p-8 bg-gray-50 overflow-y-auto">
          {ActiveComponent ? (
            <div className="space-y-6">
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-800">
                {pageTitle}
              </h2>
              {activeTab !== "Home" ? (
                <div className="bg-white p-4 sm:p-6 rounded-xl shadow-md border border-gray-200">
                  <ActiveComponent {...(componentProps[activeTab] || {})} />
                </div>
              ) : (
                <ActiveComponent {...(componentProps[activeTab] || {})} />
              )}
            </div>
          ) : (
            <div className="text-red-600 font-semibold p-4 bg-red-50 rounded border border-red-200">
              Error: Could not load the component for the "{activeTab}" tab.
            </div>
          )}
        </main>
      </div>
    </>
  );
}