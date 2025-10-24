"use client";

import { useEffect, useState, FC, ReactNode } from "react";
// 1. Use the shared Supabase client
import supabase from "../../../lib/supabase/client"; // Adjust path if needed
import { Loader2, Eye, Check, X, Clock, AlertCircle } from "lucide-react";

// 2. Updated interface to match your 'applications' table
interface Applicant {
  application_id: string; // Primary Key
  created_at: string | null;
  updated_at: string | null;
  user_id: string | null; // Foreign Key to users table
  applicant_name: string | null;
  degree_applied_for: string | null;
  campus: string | null;
  application_date: string | null; // Date type in DB, string here
  folder_link: string | null;
  photo_url: string | null;
  full_address: string | null;
  mobile_number: string | null;
  email_address: string | null;
  goal_statement: string | null;
  degree_priorities: any | null; // JSONB
  creative_works: any | null;    // JSONB
  signature_url: string | null;
  lifelong_learning: any | null; // JSONB
  self_assessment: any | null;   // JSONB
  status: string | null;         // Status column we added
}

// Define the possible status options
const STATUS_OPTIONS = ["Submitted", "Pending", "Approved", "Declined"];
const STATUS_COLORS: Record<string, string> = {
  Submitted: "bg-gray-100 text-gray-800 ring-gray-300",
  Pending: "bg-yellow-100 text-yellow-800 ring-yellow-300",
  Approved: "bg-green-100 text-green-800 ring-green-300",
  Declined: "bg-red-100 text-red-800 ring-red-300",
};

// --- Main ApplicantsManage Component ---
export default function ApplicantsManage() {
  const [applicants, setApplicants] = useState<Applicant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedApplicant, setSelectedApplicant] = useState<Applicant | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [updatingStatusId, setUpdatingStatusId] = useState<string | null>(null); // Track which status is updating

  // --- Data Fetching ---
  useEffect(() => {
    const fetchApplicants = async () => {
      setLoading(true);
      setError(null);
      console.log("[ApplicantsManage] Fetching from 'applications' table...");

      // 3. Fetch from the correct 'applications' table
      // ⚠️ RLS Policy: Admins must have 'SELECT' permission on 'applications'.
      const { data, error: fetchError } = await supabase
        .from("applications")
        .select("*") // Fetch all columns
        .order("created_at", { ascending: false }); // Order by creation date

      if (fetchError) {
        console.error("Error fetching applications:", fetchError.message);
        setError(`Failed to fetch applications: ${fetchError.message}. Check RLS policies.`);
        setApplicants([]); // Clear applicants on error
      } else {
        setApplicants((data as Applicant[] | null) || []); // Handle null case
        console.log(`[ApplicantsManage] Fetched ${data?.length || 0} applications.`);
      }
      setLoading(false);
    };

    fetchApplicants();
  }, []);

  // --- Event Handlers ---

  // Opens the modal
  const handleViewDetails = (applicant: Applicant) => {
    setSelectedApplicant(applicant);
    setIsModalOpen(true);
  };

  // Closes the modal
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedApplicant(null);
  };

  // Updates the status in the database
  const handleStatusChange = async (applicationId: string, newStatus: string) => {
    console.log(`[ApplicantsManage] Updating application ${applicationId} to status ${newStatus}`);
    setUpdatingStatusId(applicationId); // Indicate loading for this specific row

    // 4. Update the 'status' column in the 'applications' table
    // ⚠️ RLS Policy: Admins must have 'UPDATE' permission on 'applications'.
    const { data: updatedData, error: updateError } = await supabase
      .from("applications")
      .update({ status: newStatus, updated_at: new Date().toISOString() }) // Update status and timestamp
      .eq("application_id", applicationId) // Match the correct ID
      .select() // Select the updated row data
      .single(); // Expect one row back

    setUpdatingStatusId(null); // Stop loading indicator for this row

    if (updateError) {
      console.error("Error updating status:", updateError.message);
      setError(`Failed to update status for ${applicationId}: ${updateError.message}. Check RLS.`);
      // Optionally, revert UI change here by refetching or restoring previous state
    } else if (updatedData) {
      console.log(`[ApplicantsManage] Status updated successfully for ${applicationId}.`);
      // Update the local state with the exact data returned from the database
      setApplicants(prevApplicants =>
        prevApplicants.map(app =>
          app.application_id === applicationId ? (updatedData as Applicant) : app
        )
      );
    }
  };

  // --- Render Logic ---

  if (loading) {
    return (
      <div className="flex items-center justify-center p-10">
        <Loader2 className="animate-spin mr-3 h-6 w-6 text-gray-500" />
        <p className="text-gray-600">Loading applications...</p>
      </div>
    );
  }

  // Display error using an alert component
  const ErrorAlert = () => error ? (
     <div className="p-4 mb-4 text-sm text-red-700 bg-red-100 rounded-lg border border-red-200 flex items-center gap-2">
       <AlertCircle className="w-5 h-5 flex-shrink-0" />
       <span><span className="font-medium">Error:</span> {error}</span>
     </div>
  ) : null;


  return (
    <div className="space-y-6">
       <ErrorAlert /> {/* Display error if exists */}
      <div className="text-sm text-gray-600">Total Applications: {applicants.length}</div>
      <div className="overflow-x-auto border border-gray-200 rounded-lg shadow-sm">
        <table className="min-w-full bg-white divide-y divide-gray-200">
          {/* Table Header */}
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Applicant</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Degree Applied For</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Campus</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Date Submitted</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          {/* Table Body */}
          <tbody className="divide-y divide-gray-200">
            {applicants.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-6 text-center text-gray-500">
                  No applications found in the 'applications' table.
                </td>
              </tr>
            ) : (
              applicants.map((app) => (
                <tr key={app.application_id} className="text-black hover:bg-gray-50 transition-colors duration-150">
                  {/* Applicant Info */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        <img
                          className="h-10 w-10 rounded-full object-cover bg-gray-200"
                          src={app.photo_url || '/assets/default-avatar.png'} // Use photo_url
                          alt="Applicant Photo"
                          onError={(e) => { e.currentTarget.src = '/assets/default-avatar.png'; }} // Fallback image
                        />
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{app.applicant_name || "N/A"}</div> {/* Use applicant_name */}
                        <div className="text-xs text-gray-500">{app.email_address || ""}</div> {/* Show email if available */}
                      </div>
                    </div>
                  </td>
                  {/* Degree */}
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{app.degree_applied_for || "N/A"}</td>
                  {/* Campus */}
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{app.campus || "N/A"}</td>
                  {/* Date Submitted */}
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                     {/* Use application_date or created_at */}
                     {app.application_date ? new Date(app.application_date).toLocaleDateString() :
                      app.created_at ? new Date(app.created_at).toLocaleDateString() : "N/A"}
                  </td>
                  {/* Status Dropdown */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                       {updatingStatusId === app.application_id && <Loader2 className="h-4 w-4 animate-spin text-gray-400"/>}
                       <select
                         value={app.status || "Submitted"} // Default to 'Submitted' if null
                         onChange={(e) => handleStatusChange(app.application_id, e.target.value)}
                         disabled={updatingStatusId === app.application_id} // Disable while updating this row
                         className={`text-xs font-semibold rounded-full px-2.5 py-1 border-none outline-none ring-1 ring-inset focus:ring-2 focus:ring-yellow-500 disabled:opacity-70 disabled:cursor-not-allowed ${
                           STATUS_COLORS[app.status || "Submitted"]
                         }`}
                       >
                         {STATUS_OPTIONS.map(status => (
                           <option key={status} value={status}>{status}</option>
                         ))}
                       </select>
                    </div>
                  </td>
                  {/* Actions */}
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    {/* View Details Button */}
                    <button
                      onClick={() => handleViewDetails(app)}
                      className="text-blue-600 hover:text-blue-800 flex items-center gap-1 transition-colors duration-150"
                      title="View Full Application Details"
                    >
                      <Eye size={16} />
                      View Details
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* View Details Modal */}
      {isModalOpen && selectedApplicant && (
        <ViewApplicantModal
          applicant={selectedApplicant}
          onClose={handleCloseModal}
        />
      )}
    </div>
  );
}

// --- View Details Modal Component (Adapted for 'applications' table) ---
const ViewApplicantModal: FC<{ applicant: Applicant; onClose: () => void; }> = ({ applicant, onClose }) => {

   // Helper to render JSONB data cleanly
   const renderJsonData = (data: any) => {
       if (!data) return <p className="text-gray-500 italic text-xs">N/A</p>;
       try {
           // Check if it's already an object/array (might be parsed by Supabase client)
           if (typeof data === 'object') {
               return <pre className="bg-gray-100 p-2 rounded text-xs overflow-x-auto"><code>{JSON.stringify(data, null, 2)}</code></pre>;
           }
           // Try parsing if it's a string
           const parsed = JSON.parse(data);
           return <pre className="bg-gray-100 p-2 rounded text-xs overflow-x-auto"><code>{JSON.stringify(parsed, null, 2)}</code></pre>;
       } catch (e) {
           // If parsing fails, display as string
           return <p className="text-gray-700 text-xs">{String(data)}</p>;
       }
   };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 p-4 animate-fade-in backdrop-blur-sm">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col text-black">
        {/* Modal Header */}
        <div className="flex justify-between items-center p-4 border-b border-gray-200 sticky top-0 bg-white rounded-t-lg">
          <h2 className="text-xl font-bold text-gray-800">Application Details</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700" aria-label="Close modal"> <X size={24} /> </button>
        </div>

        {/* Modal Body (Scrollable) */}
        <div className="p-6 space-y-6 overflow-y-auto">
          {/* Basic Info Section */}
          <div className="flex flex-col sm:flex-row items-start gap-4 pb-4 border-b">
            <img
              className="h-24 w-24 rounded-full object-cover bg-gray-200 flex-shrink-0"
              src={applicant.photo_url || '/assets/default-avatar.png'}
              alt="Applicant Photo"
              onError={(e) => { e.currentTarget.src = '/assets/default-avatar.png'; }}
            />
            <div className="space-y-1">
              <h3 className="text-lg font-bold">{applicant.applicant_name || "N/A"}</h3>
              <p className="text-sm text-gray-600">{applicant.degree_applied_for || "N/A"}</p>
              <p className="text-sm text-gray-600">{applicant.campus} Campus</p>
              <p className="text-sm text-gray-600">Email: {applicant.email_address || "N/A"}</p>
              <p className="text-sm text-gray-600">Mobile: {applicant.mobile_number || "N/A"}</p>
              <p className="text-xs text-gray-500 pt-1">Application ID: {applicant.application_id}</p>
            </div>
          </div>

          {/* Detailed Info Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
            <InfoItem label="Date Submitted" value={applicant.application_date ? new Date(applicant.application_date).toLocaleDateString() : (applicant.created_at ? new Date(applicant.created_at).toLocaleString() : 'N/A')} />
            <InfoItem label="Last Updated" value={applicant.updated_at ? new Date(applicant.updated_at).toLocaleString() : 'N/A'} />
            <InfoItem label="Status" value={applicant.status || "Submitted"} />
             <InfoItem label="Address" value={applicant.full_address || "N/A"} />
            <InfoItem label="User ID (Internal)" value={applicant.user_id || "N/A"} />
            <InfoItem label="Portfolio/Folder Link">
              <a href={applicant.folder_link || "#"} target="_blank" rel="noopener noreferrer" className={`text-blue-600 hover:underline break-all ${!applicant.folder_link ? 'text-gray-500 italic' : ''}`}>
                {applicant.folder_link || "N/A"}
              </a>
            </InfoItem>
          </div>

          {/* Text Areas and JSON Data */}
           <InfoItem label="Goal Statement"> <p className="text-gray-700 text-sm whitespace-pre-wrap">{applicant.goal_statement || <span className="text-gray-500 italic text-xs">N/A</span>}</p> </InfoItem>
           <InfoItem label="Degree Priorities"> {renderJsonData(applicant.degree_priorities)} </InfoItem>
           <InfoItem label="Creative Works"> {renderJsonData(applicant.creative_works)} </InfoItem>
           <InfoItem label="Lifelong Learning"> {renderJsonData(applicant.lifelong_learning)} </InfoItem>
           <InfoItem label="Self Assessment"> {renderJsonData(applicant.self_assessment)} </InfoItem>

          {/* Signature */}
          <div>
            <h4 className="font-semibold text-gray-700 mb-2">Applicant Signature</h4>
            <div className="border rounded-lg p-2 bg-gray-50 max-w-md"> {/* Constrain width */}
              {applicant.signature_url ? (
                <img src={applicant.signature_url} alt="Applicant Signature" className="w-full h-auto object-contain"/>
              ) : ( <p className="text-gray-500 italic text-xs">No signature provided.</p> )}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-gray-200 bg-gray-50 text-right sticky bottom-0 rounded-b-lg">
          <button onClick={onClose} className="px-5 py-2 bg-gray-200 text-gray-800 font-semibold rounded-lg hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-400"> Close </button>
        </div>
      </div>
    </div>
  );
};

// Helper component for displaying items in the modal
const InfoItem: FC<{ label: string; value?: ReactNode; children?: ReactNode }> = ({ label, value, children }) => (
  <div className="text-sm border-b pb-2 mb-2 border-gray-100">
    <p className="font-semibold text-gray-700 mb-1">{label}</p>
    {value ? <div className="text-gray-800">{value}</div> : null}
    {children}
  </div>
);

// Add animation CSS (if not already present globally)
/*
@keyframes fade-in { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
.animate-fade-in { animation: fade-in 0.2s ease-out; }
*/