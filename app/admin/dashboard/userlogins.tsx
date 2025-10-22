"use client";

import { useEffect, useState, useMemo } from "react";
// 1. REMOVE the direct import
// import { createClient } from "@supabase/supabase-js";
// 2. ADD the import for the shared client
import supabase from "../../../lib/supabase/client"; // Adjust path if needed

// 3. REMOVE the local client initialization
// const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
// const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
// const supabase = createClient(supabaseUrl, supabaseAnonKey);

// --- Rest of the component remains the same ---

// Represents a single login event from your 'user_login_history' table
interface LoginEvent {
  id: string; // Assuming Supabase generates UUIDs or similar for id
  name: string | null;
  email: string | null;
  avatar_url: string | null;
  created_at: string | null; // Keep as string if that's how Supabase returns it
}

// Represents the processed summary for each unique user
interface UserSummary {
  email: string;
  name: string | null;
  avatar_url: string | null;
  last_login: string | null;
  login_count: number;
}

export default function UserLoginsManage() {
  const [logins, setLogins] = useState<LoginEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchLoginEvents = async () => {
      setLoading(true);
      setError(null);
      console.log("[UserLoginsManage] Fetching user login history..."); // Add log

      // Now uses the imported shared 'supabase' client
      const { data, error: fetchError } = await supabase
        .from("user_login_history") // Reading from your table
        .select("*") // Select all columns for simplicity, or specify needed ones
        .order("created_at", { ascending: false }); // Get the newest logins first

      if (fetchError) {
        console.error("[UserLoginsManage] Error fetching login events:", fetchError.message);
        setError(`Failed to fetch login history: ${fetchError.message}`);
        setLogins([]); // Clear data on error
      } else {
        console.log(`[UserLoginsManage] Fetched ${data?.length || 0} login events.`);
        setLogins((data as LoginEvent[] | null) || []); // Handle null case
      }
      setLoading(false);
    };

    fetchLoginEvents();

    // Optional: Add realtime listener if needed for user logins
    // const channel = supabase.channel('user-login-history-changes')
    //   .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'user_login_history' }, (payload) => {
    //     setLogins((prevLogins) => [payload.new as LoginEvent, ...prevLogins]);
    //   })
    //   .subscribe();

    // return () => {
    //   supabase.removeChannel(channel);
    // };

  }, []); // Run once on mount

  // Process the raw log data into a summary
  const userSummaries = useMemo((): UserSummary[] => {
    if (!logins || logins.length === 0) return [];
    console.log("[UserLoginsManage] Recalculating user summaries...");

    const summaryMap = new Map<string, UserSummary>();

    // Iterate through logs (newest first)
    logins.forEach(log => {
      if (!log.email) {
          console.warn("[UserLoginsManage] Skipping login event with missing email:", log);
          return;
      };

      if (summaryMap.has(log.email)) {
        // Increment count for older logs of the same user
        const existing = summaryMap.get(log.email)!;
        existing.login_count += 1;
      } else {
        // Create entry for the newest log encountered for this user
        summaryMap.set(log.email, {
          email: log.email,
          name: log.name,
          avatar_url: log.avatar_url,
          last_login: log.created_at, // This is the latest timestamp seen so far
          login_count: 1,
        });
      }
    });
    console.log(`[UserLoginsManage] Calculated ${summaryMap.size} user summaries.`);
    return Array.from(summaryMap.values());
  }, [logins]); // Recalculate when logins change

  if (loading) {
    return <p className="text-gray-600 animate-pulse p-4">Loading user history...</p>;
  }
  if (error) {
    return <p className="text-red-600 bg-red-50 p-4 rounded border border-red-200">Error: {error}</p>;
  }

  return (
    <div className="text-black">
       <div className="text-sm text-gray-600 font-medium mb-4">Total Unique Users Logged In: {userSummaries.length}</div>
      <div className="overflow-x-auto border border-gray-200 rounded-lg shadow-sm">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">User</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Email</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Last Logged In</th>
              <th className="px-6 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Total Logins</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {userSummaries.length === 0 ? (
                 <tr>
                    <td colSpan={4} className="px-6 py-10 text-center text-gray-500">
                        No user logins have been recorded yet.
                    </td>
                 </tr>
             ) : (
                 userSummaries.map((user) => (
                   <tr key={user.email} className="hover:bg-gray-50 transition-colors duration-150">
                     <td className="px-6 py-4 whitespace-nowrap">
                       <div className="flex items-center">
                         <div className="flex-shrink-0 h-10 w-10">
                           <img
                              className="h-10 w-10 rounded-full object-cover bg-gray-200" // Added background color
                              src={user.avatar_url || '/assets/default-avatar.png'} // Provide a default avatar path
                              alt={`${user.name || 'User'}'s avatar`}
                              onError={(e) => { e.currentTarget.src = '/assets/default-avatar.png'; }} // Fallback on image load error
                            />
                         </div>
                         <div className="ml-4">
                           <div className="text-sm font-medium text-gray-900">{user.name || "N/A"}</div>
                         </div>
                       </div>
                     </td>
                     <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{user.email}</td>
                     <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                       {user.last_login
                          ? new Date(user.last_login).toLocaleString('en-US', {
                               year: 'numeric', month: 'short', day: 'numeric',
                               hour: 'numeric', minute: '2-digit', hour12: true
                             })
                          : "N/A"}
                     </td>
                     <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-700 text-center">{user.login_count}</td>
                   </tr>
                 ))
             )}
          </tbody>
        </table>
      </div>
    </div>
  );
}