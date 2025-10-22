// app/admin/dashboard/page.tsx

"use client";

import { useEffect, useState, ComponentType, useMemo } from "react"; // Ensure useMemo is imported
// 1. Use the shared client import
import supabase from "../../../lib/supabase/client"; // Adjust path if needed
import { useRouter } from "next/navigation";
// Import child components
import AdminManagement from "./adminmanage";
import UserManage from "./usermanage"; // Check if this should be AdminLogins component
import ApplicantsManage from "./applicantsmanage";
import UserLoginsManage from "./userlogins";
import ForcePasswordChange from "./ForcePasswordChange";
import DashboardHome from "./DashboardHome";
// Import icons etc. if needed directly here (e.g., for loading spinner)

// 2. REMOVE local client initialization and imports if they were present

// Define a type for your GoogleUser (if needed by UserLoginsManage)
export interface GoogleUser {
    id: string;
    email?: string;
    // add other properties as needed
}

type TabName = "Home" | "AdminLogins" | "Applicants" | "UserLogins" | "AdminManagement";

// Map tab keys to components and titles
const tabs: { [key in TabName]: { title: string; component: ComponentType<any> | null } } = {
  Home: { title: "Dashboard", component: DashboardHome },
  AdminLogins: { title: "Admin Login History", component: UserManage }, // Verify UserManage shows admin logins
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

export default function DashboardPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<AdminProfile | null>(null);
  const [loading, setLoading] = useState(true); // Start in loading state
  const [activeTab, setActiveTab] = useState<TabName>("Home");
  // const [initialGoogleUsers, setInitialGoogleUsers] = useState<GoogleUser[]>([]); // Keep if needed

  // Function to fetch the currently logged-in admin's profile
  const fetchCurrentUserProfile = async () => {
    console.log("[DashboardPage] fetchCurrentUserProfile: Starting...");
    // Uses the imported shared 'supabase' client
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    if (sessionError) {
      console.error("[DashboardPage] fetchCurrentUserProfile: Error getting session:", sessionError.message);
      await supabase.auth.signOut(); // Attempt signout on error
      router.replace("/admin"); // Redirect to login
      return; // Stop execution
    }
    if (!session) {
      console.log("[DashboardPage] fetchCurrentUserProfile: No active session found. Redirecting.");
      router.replace("/admin"); // Redirect to login
      return; // Stop execution
    }

    console.log("[DashboardPage] fetchCurrentUserProfile: Session found. User ID:", session.user.id);

    try {
        console.log("[DashboardPage] fetchCurrentUserProfile: Fetching profile from 'admin' table...");
        // Fetch profile using the session user ID
        // ⚠️ RLS on 'admin' table must allow SELECT WHERE auth.uid() = id
        const { data: profile, error: profileError } = await supabase
          .from("admin")
          .select("*") // Select all profile fields
          .eq("id", session.user.id) // Match the logged-in user's ID
          .single(); // Expect exactly one matching row

        if (profileError) {
          console.error("[DashboardPage] fetchCurrentUserProfile: Error fetching profile:", profileError.message);
          console.error("[DashboardPage] Check RLS on 'admin' table (needs SELECT using auth.uid()=id) or if admin record exists.");
          await supabase.auth.signOut(); // Sign out if profile fetch fails
          router.replace("/admin");
          return; // Stop execution
        }

        // Handle case where query succeeds but returns null (e.g., RLS filtered it out)
        if (!profile) {
            console.error("[DashboardPage] fetchCurrentUserProfile: No profile data returned for ID:", session.user.id, "(Check RLS/data existence)");
            await supabase.auth.signOut();
            router.replace("/admin");
            return; // Stop execution
        }

        console.log("[DashboardPage] fetchCurrentUserProfile: Profile fetched successfully:", profile);
        setCurrentUser(profile); // Set the current user state
        setLoading(false); // ✅ Set loading to false ONLY after successful fetch

    } catch (err) {
         // Catch any unexpected errors during the try block
         console.error("[DashboardPage] fetchCurrentUserProfile: Unexpected error:", err);
         await supabase.auth.signOut(); // Sign out on unexpected errors
         router.replace("/admin");
         // setLoading(false); // Let the redirect handle the UI state
    }
  };

  // Effect to fetch user profile on initial mount and set up auth listener
  useEffect(() => {
    fetchCurrentUserProfile(); // Fetch profile when component mounts

    // Set up a listener for authentication state changes
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
       console.log("[DashboardPage] Auth State Change:", event, session ? 'Session Active' : 'No Session');
      // If user signs out (e.g., in another tab) or session becomes invalid
      if (event === 'SIGNED_OUT' || !session) {
        setCurrentUser(null); // Clear the user state
        router.replace("/admin"); // Redirect to login page
      }
    });

    // Cleanup function: Unsubscribe from the listener when the component unmounts
    return () => {
       console.log("[DashboardPage] Unmounting, unsubscribing from auth listener.");
      authListener?.subscription.unsubscribe();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]); // Include router in dependency array as it's used for navigation

  // Function to handle user logout
  async function handleLogout() {
     console.log("[DashboardPage] handleLogout: Attempting sign out...");
     setLoading(true); // Indicate activity
     const { error } = await supabase.auth.signOut(); // Use shared client to sign out
     setLoading(false); // Reset loading state
     if (error) {
       console.error("[DashboardPage] handleLogout: Error signing out:", error.message);
       alert(`Logout failed: ${error.message}`); // Inform user of failure
     } else {
        console.log("[DashboardPage] handleLogout: Sign out successful. Redirect should occur via listener.");
        setCurrentUser(null); // Clear user state immediately
        // The onAuthStateChange listener should handle the redirect, but push can provide faster feedback
        router.push("/admin");
     }
  }

  // Determine the component and title for the currently active tab
  const ActiveComponent = tabs[activeTab]?.component;
  const pageTitle = tabs[activeTab]?.title ?? "Dashboard";

  // Prepare props to pass down to child components (e.g., AdminManagement)
  // Use useMemo to avoid recalculating props on every render unless dependencies change
  const componentProps: { [key: string]: any } = useMemo(() => ({
    // Pass the fetched currentUser object to the AdminManagement component
    AdminManagement: { currentUser: currentUser },
    // Add props for other components if they need specific data
    // UserLogins: { someData: someValue },
  }), [currentUser, activeTab]); // Dependencies: Recalculate if currentUser or activeTab changes


  // --- Render Logic ---

  // Show loading indicator while fetching initial profile data
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100 text-yellow-500">
        {/* Loading Spinner */}
        <svg className="animate-spin -ml-1 mr-3 h-8 w-8 text-yellow-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <p className="text-lg font-semibold">Loading Dashboard...</p>
      </div>
    );
  }

   // Fallback display if loading is done but currentUser is still null (should be redirected)
   if (!currentUser) {
       return (
          <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 text-red-600 p-4">
             <h2 className="text-xl font-bold mb-4">Authentication Error</h2>
             <p className="text-center">Could not load your admin profile. Please log in again.</p>
             <button
               onClick={() => router.replace('/admin')}
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
      {/* Conditionally render the ForcePasswordChange modal */}
      {currentUser.requires_password_change && (
        <ForcePasswordChange
          userId={currentUser.id} // Pass the user ID
          onPasswordChanged={fetchCurrentUserProfile} // Pass callback to refetch profile
        />
      )}

      {/* Main container with blur effect if password change is required */}
      <div className={`flex min-h-screen font-sans ${currentUser.requires_password_change ? 'filter blur-sm pointer-events-none' : ''}`}>
        {/* Sidebar */}
        <aside className="w-64 bg-white border-r border-gray-200 p-5 flex flex-col shrink-0 h-screen sticky top-0">
          {/* Sidebar Header */}
          <div className="flex items-center gap-3 mb-8 flex-shrink-0">
            <img src="/assets/TIPLogo.png" alt="TIP Logo" className="w-9 h-9" />
            <h1 className="text-xl font-bold text-gray-800">Admin Panel</h1>
          </div>
          {/* Scrollable Navigation + Logout Button Container */}
          <div className="flex flex-col flex-grow overflow-y-auto overflow-x-hidden"> {/* Prevent horizontal scroll */}
            {/* Navigation Links */}
            <nav className="flex flex-col gap-2 flex-grow pr-1"> {/* Added padding-right */}
              {Object.keys(tabs).map((tabKey) => {
                const key = tabKey as TabName;
                const tab = tabs[key];
                // Skip rendering if no component is associated (though all tabs have one here)
                if (!tab.component) return null;

                return (
                  <button
                    key={key}
                    onClick={() => setActiveTab(key)}
                    className={`w-full text-left px-4 py-2.5 rounded-lg text-sm font-medium transition-colors duration-150 ${
                      activeTab === key
                        ? "bg-yellow-400 text-black shadow-sm font-semibold" // Active state style
                        : "text-gray-600 hover:bg-gray-100 focus:bg-gray-100 focus:outline-none" // Inactive state style
                    }`}
                  >
                    {/* Use simplified titles for specific tabs */}
                    {key === "AdminLogins" ? "Admin Logins" :
                     key === "UserLogins" ? "User Logins" :
                     tab.title}
                  </button>
                );
              })}
            </nav>
            {/* Logout Button */}
            <button
              onClick={handleLogout}
              className="w-full text-left px-4 py-2.5 rounded-lg text-sm font-medium transition-colors duration-150 bg-red-600 text-white hover:bg-red-700 mt-6 flex-shrink-0 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-1" // Added focus styles
            >
              Logout
            </button>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 p-6 sm:p-8 bg-gray-50 overflow-y-auto">
          {/* Render the active component if it exists */}
          {ActiveComponent ? (
            <div className="space-y-6">
              {/* Page Title */}
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-800">{pageTitle}</h2>
              {/* Conditionally wrap component in a card (except for Home) */}
              {activeTab !== 'Home' ? (
                <div className="bg-white p-4 sm:p-6 rounded-xl shadow-md border border-gray-200">
                  {/* Pass the calculated props to the active component */}
                  <ActiveComponent {...(componentProps[activeTab] || {})} />
                </div>
              ) : (
                 // Render Home component directly
                 <ActiveComponent {...(componentProps[activeTab] || {})} />
              )}
            </div>
          ) : (
            // Fallback error message if component is somehow not found
            <div className="text-red-600 font-semibold p-4 bg-red-50 rounded border border-red-200">
                Error: Could not load the component for the "{activeTab}" tab.
            </div>
          )}
        </main>
      </div>
    </>
  );
}