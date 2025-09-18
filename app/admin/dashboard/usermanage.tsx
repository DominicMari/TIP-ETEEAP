"use client";

import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const supabase = createClient(supabaseUrl, supabaseAnonKey);

interface User {
  id: string;
  name: string | null;
  email: string | null;
  date_logged_in: string | null;
}

export default function UserManage() {
  const [logs, setLogs] = useState<User[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchLogs = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from("users")
          .select("id, name, email, date_logged_in")
          .not("date_logged_in", "is", null)
          .order("date_logged_in", { ascending: false });

        if (error) {
          console.error("Error fetching logs:", error.message);
          setLogs([]);
        } else {
          setLogs(data as User[]);
        }
      } catch (err) {
        console.error("Unexpected error fetching logs:", err);
        setLogs([]);
      } finally {
        setLoading(false);
      }
    };

    fetchLogs();

    const channel = supabase
      .channel("public:users")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "users" }, (payload) => {
        setLogs((prev) => [payload.new as User, ...prev]);
      })
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "users" }, (payload) => {
        setLogs((prev) => {
          const updated = payload.new as User;
          const others = prev.filter((log) => log.id !== updated.id);
          return [updated, ...others].sort(
            (a, b) =>
              new Date(b.date_logged_in || "").getTime() - new Date(a.date_logged_in || "").getTime()
          );
        });
      })
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, []);

  if (loading) {
    return <div className="text-yellow-400">Loading user logs...</div>;
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold text-black">Users Logins</h2>
      <div className="text-sm text-gray-600 mb-4">Total Logins: {logs.length}</div>
      <div className="overflow-x-auto">
        <table className="min-w-full bg-gray-50 border border-yellow-400 rounded-xl overflow-hidden shadow-md">
          <thead className="bg-gray-100 text-black">
            <tr>
              <th className="p-3 text-left">Name</th>
              <th className="p-3 text-left">Email</th>
              <th className="p-3 text-left">Date Logged In</th>
            </tr>
          </thead>
          <tbody>
            {logs.length === 0 ? (
              <tr>
                <td colSpan={3} className="p-4 text-center text-yellow-600">
                  No login logs found.
                </td>
              </tr>
            ) : (
              logs.map((log) => (
                <tr
                  key={log.id}
                  className="border-b border-yellow-400 hover:bg-yellow-100 transition text-black"
                >
                  <td className="p-3">{log.name ?? "-"}</td>
                  <td className="p-3">{log.email ?? "-"}</td>
                  <td className="p-3">
                    {log.date_logged_in ? new Date(log.date_logged_in).toLocaleString() : "-"}
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
