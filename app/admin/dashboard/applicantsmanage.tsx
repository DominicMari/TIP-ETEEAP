"use client";

import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Define the structure of an Applicant based on your database columns
interface Applicant {
  application_id: string;
  name: string | null;
  degree: string | null;
  campus: string | null;
  date: string | null;
  folder_link: string | null;
  photo_url: string | null;
}

export default function ApplicantsManage() {
  const [applicants, setApplicants] = useState<Applicant[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchApplicants = async () => {
      setLoading(true);
      try {
        // Fetch all columns from the 'applications' table
        const { data, error } = await supabase
          .from("applications")
          .select("*")
          .order("date", { ascending: false }); // Order by application date

        if (error) {
          console.error("Error fetching applicants:", error.message);
          setApplicants([]);
        } else {
          setApplicants(data as Applicant[]);
        }
      } catch (err) {
        console.error("Unexpected error fetching applicants:", err);
        setApplicants([]);
      } finally {
        setLoading(false);
      }
    };

    fetchApplicants();
  }, []);

  if (loading) {
    return <div className="text-yellow-400">Loading applicants...</div>;
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold text-black">Applicants</h2>
      <div className="text-sm text-gray-600 mb-4">Total Applications: {applicants.length}</div>
      <div className="overflow-x-auto">
        <table className="min-w-full bg-gray-50 border border-yellow-400 rounded-xl overflow-hidden shadow-md">
          <thead className="bg-gray-100 text-black">
            <tr>
              <th className="p-3 text-left">Photo</th>
              <th className="p-3 text-left">Name</th>
              <th className="p-3 text-left">Degree</th>
              <th className="p-3 text-left">Campus</th>
              <th className="p-3 text-left">Date Submitted</th>
              <th className="p-3 text-left">Folder Link</th>
            </tr>
          </thead>
          <tbody>
            {applicants.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-4 text-center text-yellow-600">
                  No applications found.
                </td>
              </tr>
            ) : (
              applicants.map((app) => (
                <tr
                  key={app.application_id}
                  className="border-b border-yellow-400 hover:bg-yellow-100 transition text-black"
                >
                  <td className="p-3">
                    {app.photo_url ? (
                      <img
                        src={app.photo_url}
                        alt={app.name || "Applicant Photo"}
                        className="w-12 h-12 object-cover rounded-full"
                      />
                    ) : (
                      "-"
                    )}
                  </td>
                  <td className="p-3">{app.name ?? "-"}</td>
                  <td className="p-3">{app.degree ?? "-"}</td>
                  <td className="p-3">{app.campus ?? "-"}</td>
                  <td className="p-3">
                    {app.date ? new Date(app.date).toLocaleDateString() : "-"}
                  </td>
                  <td className="p-3">
                    {app.folder_link ? (
                      <a
                        href={app.folder_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline"
                      >
                        View Folder
                      </a>
                    ) : (
                      "-"
                    )}
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