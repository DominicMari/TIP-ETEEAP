"use client";

import { useEffect, useState, useMemo } from "react";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Represents a single login event from your 'admin_login_history' table
interface AdminLoginEvent {
  id: string;
  name: string | null;
  email: string | null;
  login_timestamp: string | null;
}

// ✅ Represents the processed summary for each unique admin
interface AdminSummary {
  email: string;
  name: string | null;
  last_login: string | null;
  login_count: number;
}

// ✅ A simple component to generate a colored avatar from a name
const AdminAvatar = ({ name }: { name: string | null }) => {
  const initial = name ? name.charAt(0).toUpperCase() : "A";
  const colors = [
    "bg-red-500", "bg-yellow-500", "bg-green-500", "bg-blue-500", 
    "bg-indigo-500", "bg-purple-500", "bg-pink-500"
  ];
  // Simple hash to get a consistent color for a name
  const colorIndex = (name?.charCodeAt(0) || 0) % colors.length;

  return (
    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold ${colors[colorIndex]}`}>
      {initial}
    </div>
  );
};

export default function UserManage() {
  const [logs, setLogs] = useState<AdminLoginEvent[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchLogs = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("admin_login_history")
        .select("id, name, email, login_timestamp")
        .order("login_timestamp", { ascending: false });

      if (error) {
        console.error("Error fetching logs:", error.message);
      } else {
        setLogs(data as AdminLoginEvent[]);
      }
      setLoading(false);
    };

    fetchLogs();

    const channel = supabase
      .channel("public:admin_login_history")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "admin_login_history" },
        (payload) => {
          setLogs((prevLogs) => [payload.new as AdminLoginEvent, ...prevLogs]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // ✅ Process the raw login data to create a summary for each admin
  const adminSummaries = useMemo(() => {
    if (!logs) return [];
    
    const summaryMap = new Map<string, AdminSummary>();

    logs.forEach(log => {
      if (!log.email) return;

      if (summaryMap.has(log.email)) {
        // If we've seen this admin before, just increment their login count
        const existing = summaryMap.get(log.email)!;
        existing.login_count += 1;
      } else {
        // If it's the first time, create their summary
        summaryMap.set(log.email, {
          email: log.email,
          name: log.name,
          last_login: log.login_timestamp, // The first one we see is the most recent
          login_count: 1,
        });
      }
    });

    return Array.from(summaryMap.values());
  }, [logs]);

  if (loading) {
    return <div className="text-gray-600">Loading admin login history...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="text-sm text-gray-600">Total Unique Admins: {adminSummaries.length}</div>
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border rounded-lg">
          <thead className="bg-gray-50">
            <tr>
              {/* ✅ Updated table headers for the new summary view */}
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Admin</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Logged In</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider text-center">Total Logins</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {adminSummaries.length === 0 ? (
              <tr>
                <td colSpan={4} className="p-4 text-center text-gray-500">
                  No login history found.
                </td>
              </tr>
            ) : (
              adminSummaries.map((admin) => (
                <tr key={admin.email} className="text-black">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <AdminAvatar name={admin.name} />
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{admin.name || "N/A"}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">{admin.email}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {admin.last_login
                      ? new Date(admin.last_login).toLocaleString()
                      : "N/A"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-700 text-center">
                    {admin.login_count}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}