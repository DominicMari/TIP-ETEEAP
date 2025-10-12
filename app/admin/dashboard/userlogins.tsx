"use client";

import { useEffect, useState, useMemo } from "react";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Represents a single login event from your 'user_login_history' table
interface LoginEvent {
  id: string;
  name: string | null;
  email: string | null;
  avatar_url: string | null;
  created_at: string | null;
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
      
      const { data, error } = await supabase
        .from("user_login_history") // Reading from your new table
        .select("*")
        .order("created_at", { ascending: false }); // Get the newest logins first

      if (error) {
        console.error("Error fetching login events:", error.message);
        setError("Failed to fetch login history.");
      } else {
        setLogins(data as LoginEvent[]);
      }
      setLoading(false);
    };

    fetchLoginEvents();
  }, []);

  // This logic processes the raw log data into a clean summary
  const userSummaries = useMemo(() => {
    if (!logins) return [];
    
    const summaryMap = new Map<string, UserSummary>();

    logins.forEach(log => {
      if (!log.email) return;

      if (summaryMap.has(log.email)) {
        // If we've already seen this user, just increment their login count
        const existing = summaryMap.get(log.email)!;
        existing.login_count += 1;
      } else {
        // If it's the first time seeing this user, create their summary entry
        summaryMap.set(log.email, {
          email: log.email,
          name: log.name,
          avatar_url: log.avatar_url,
          last_login: log.created_at, // The first one we see is the latest
          login_count: 1,
        });
      }
    });

    return Array.from(summaryMap.values());
  }, [logins]);

  if (loading) {
    return <p className="text-gray-600">Loading user history...</p>;
  }
  if (error) {
    return <p className="text-red-600">{error}</p>;
  }
  if (userSummaries.length === 0) {
    return <p className="text-gray-600">No user logins have been recorded yet.</p>;
  }

  return (
    <div className="text-black">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Logged In</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Logins</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {userSummaries.map((user) => (
              <tr key={user.email}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-10 w-10">
                      <img className="h-10 w-10 rounded-full" src={user.avatar_url || ''} alt={`${user.name}'s avatar`} />
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-900">{user.name || "N/A"}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.email}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {user.last_login ? new Date(user.last_login).toLocaleString() : "N/A"}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-700 text-center">{user.login_count}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}