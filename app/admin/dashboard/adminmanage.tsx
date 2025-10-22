// app/admin/dashboard/adminmanage.tsx

"use client";

import { useEffect, useState, useMemo } from "react"; // Added useMemo
import supabase from "../../../lib/supabase/client"; // Verify path
import { FaEye, FaEyeSlash } from "react-icons/fa";

// Interface for the admin profile data structure
interface AdminProfile {
  id: string;
  name: string | null;
  email: string | null;
  role?: string;
  // Add requires_password_change if needed for displaying info, though handled by parent
  requires_password_change?: boolean;
}

// 1. Define Props Interface
interface AdminManagementProps {
  currentUser: AdminProfile | null; // Receive currentUser from parent
}

// 2. Accept currentUser as a prop
export default function AdminManagement({ currentUser }: AdminManagementProps) {
  const [admins, setAdmins] = useState<AdminProfile[]>([]);
  // REMOVED internal currentUser state
  const [selectedAdmin, setSelectedAdmin] = useState<AdminProfile | null>(null);
  const [loading, setLoading] = useState(true); // Manages loading state for the admin list
  const [editing, setEditing] = useState(false);
  const [modalLoading, setModalLoading] = useState(false); // Separate loading state for modal actions

  // State for Add Modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [newAdminName, setNewAdminName] = useState("");
  const [newAdminEmail, setNewAdminEmail] = useState("");
  const [createdAdminInfo, setCreatedAdminInfo] = useState<{ email: string; temporaryPassword: string; } | null>(null);

  // State for Delete Modal
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // State for Edit Form
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const [emailError, setEmailError] = useState("");

  // 3. Renamed and modified function to fetch ONLY the list, using the prop for logic
  const fetchAdminList = async () => {
    // Check if currentUser prop is available
    if (!currentUser) {
        console.warn("[AdminManagement] Cannot fetch admin list: currentUser prop is null.");
        setLoading(false); // Stop loading indicator
        setAdmins([]); // Ensure list is empty
        setSelectedAdmin(null);
        return; // Exit if no current user info
    }

    console.log("[AdminManagement] Fetching admin list. Current user role:", currentUser.role);
    setLoading(true); // Start loading indicator for list fetch
    try {
      // Fetch ALL admin profiles
      // ⚠️ RLS: Super Admins need SELECT *; Regular Admins need SELECT only own row (auth.uid()=id)
      const { data, error } = await supabase.from("admin").select("*");
      if (error) {
           console.error("[AdminManagement] Supabase error fetching admin list:", error);
           throw new Error(`Failed to fetch admins: ${error.message}`); // Throw to be caught below
      }

      const adminData = (data as AdminProfile[] | null) || []; // Handle null data case
      console.log(`[AdminManagement] Fetched ${adminData.length} total admin profiles from DB.`);

      // Filter/Set the list based on the currentUser's role (passed via prop)
      if (currentUser.role === 'super_admin') {
         console.log("[AdminManagement] User is super_admin. Displaying all admins.");
        setAdmins(adminData);
        // If no admin is currently selected and the list isn't empty, select the first one
        if (adminData.length > 0 && !selectedAdmin) {
          selectAdmin(adminData[0]);
        } else if (adminData.length === 0) {
           setSelectedAdmin(null); // Clear selection if list is empty
        }
      } else {
         console.log("[AdminManagement] User is a regular admin. Filtering to own profile.");
        // Filter the fetched list to include only the current user's profile
        const ownProfile = adminData.find(admin => admin.id === currentUser.id);
        setAdmins(ownProfile ? [ownProfile] : []); // Set state to only own profile or empty array
        // Automatically select own profile if found
        if (ownProfile) {
            selectAdmin(ownProfile);
        } else {
            console.error("[AdminManagement] CRITICAL: Logged-in admin's profile not found in fetched list!");
            setSelectedAdmin(null); // Clear selection if own profile wasn't found (data inconsistency?)
        }
      }
    } catch (err) {
      console.error("[AdminManagement] Error during admin list fetch process:", (err as Error).message);
      // Display error state to user? For now, clear lists.
      setAdmins([]);
      setSelectedAdmin(null);
      // Maybe set an error state here to show in the UI
    } finally {
      setLoading(false); // Stop loading indicator
      console.log("[AdminManagement] Admin list fetch attempt complete.");
    }
  };

  // 4. useEffect now depends on currentUser prop
  useEffect(() => {
    fetchAdminList(); // Fetch the list when the component mounts or currentUser changes
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser]); // Dependency array includes currentUser prop


  // --- Helper Functions (Validation, Selection) ---
  const validatePassword = (password: string): string => {
      if (!password) return ""; // Allow empty if not changing
      if (password.length < 8) return "Password must be at least 8 characters long.";
      if (!/[A-Z]/.test(password)) return "Password must contain an uppercase letter.";
      if (!/[a-z]/.test(password)) return "Password must contain a lowercase letter.";
      if (!/\d/.test(password)) return "Password must contain a number.";
      if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) return "Password must contain a special character.";
      return "";
  };
  const validateEmail = (email: string): string => {
      if (!email) return "Email cannot be empty.";
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) return "Please enter a valid email address.";
      return "";
  };
  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const password = e.target.value;
      setNewPassword(password);
      // Validate only if password is not empty
      setPasswordError(password ? validatePassword(password) : "");
  };
  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const email = e.target.value;
      setNewEmail(email);
      setEmailError(validateEmail(email)); // Always validate email
  };
  // Selects an admin from the list and resets the edit form state
  const selectAdmin = (admin: AdminProfile) => {
      console.log("[AdminManagement] Selecting admin:", admin.email);
      setSelectedAdmin(admin);
      setEditing(false); // Ensure edit mode is off when selecting a new admin
      // Reset form fields to match the selected admin's current data
      setNewName(admin.name ?? "");
      setNewEmail(admin.email ?? "");
      // Clear password fields and errors
      setNewPassword("");
      setConfirmPassword("");
      setPasswordError("");
      setEmailError(""); // Clear email error as well
      setShowPassword(false);
      setShowConfirmPassword(false);
  };


  // --- Action Handlers (Add, Save, Delete) ---
  const handleAddAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    // Validate inputs before calling API? (Basic check here, API should validate too)
    if (!newAdminName || !newAdminEmail) {
        alert("Please enter both name and email.");
        return;
    }
    const emailValidationError = validateEmail(newAdminEmail);
     if (emailValidationError) {
        alert(`Invalid Email: ${emailValidationError}`);
        return;
    }

    setModalLoading(true); // Use modal loading state
    setCreatedAdminInfo(null); // Clear previous creation info
    try {
      console.log("[AdminManagement] Calling /api/create-admin for:", newAdminEmail);
      // Call the API route to handle admin creation securely
      const response = await fetch('/api/create-admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newAdminName, email: newAdminEmail }),
      });
      const result = await response.json();
      if (!response.ok) {
           console.error("[AdminManagement] API error creating admin:", result.error);
           throw new Error(result.error || 'Failed to create admin via API.');
      }

      console.log("[AdminManagement] Admin created via API. Result:", result);
      // Show success info (email and temporary password) in the modal
      setCreatedAdminInfo({
        email: newAdminEmail,
        temporaryPassword: result.temporaryPassword,
      });
      // Clear form fields AFTER successful creation shown
      setNewAdminName("");
      setNewAdminEmail("");
      await fetchAdminList(); // Refresh the admin list in the background
    } catch (err) {
      console.error("[AdminManagement] Error in handleAddAdmin:", err);
      alert(`Error creating admin: ${(err as Error).message}`);
      // Don't close modal on error, let user see message/try again
    } finally {
      setModalLoading(false); // Stop modal loading indicator
    }
  };

  const saveAdminInfo = async () => {
      if (!selectedAdmin || !canEditSelected) return; // Check permission again
      console.log("[AdminManagement] Attempting to save admin info for:", selectedAdmin.email);

      // Re-validate email just before saving
      const currentEmailError = validateEmail(newEmail);
      setEmailError(currentEmailError);
      if (currentEmailError) {
          alert("Please fix the email error before saving.");
          return;
      }

      // Check password match only if a new password was entered
      if (newPassword && newPassword !== confirmPassword) {
        alert("New passwords do not match.");
        return;
      }
      // Check password validity only if a new password was entered
      const currentPasswordError = newPassword ? validatePassword(newPassword) : "";
      setPasswordError(currentPasswordError);
       if (currentPasswordError) {
        alert("Please fix the password errors before saving.");
        return;
      }

      setModalLoading(true); // Use modal loading state for save action
      try {
        console.log("[AdminManagement] Updating profile in 'admin' table for ID:", selectedAdmin.id);
        // Update name/email directly in the 'admin' table
        // ⚠️ RLS: Must allow UPDATE based on role (super_admin UPDATE *, admin UPDATE own)
        const { error: profileError } = await supabase
          .from("admin")
          .update({ name: newName, email: newEmail })
          .eq("id", selectedAdmin.id);
        if (profileError) {
             console.error("[AdminManagement] Supabase error updating profile:", profileError);
             throw new Error(`Failed to update profile info: ${profileError.message}`);
        }
        console.log("[AdminManagement] Profile info updated in 'admin' table.");

        // If a new password was entered and is valid, call the API route
        if (newPassword && !currentPasswordError) {
          console.log("[AdminManagement] New password provided. Calling /api/update-admin-password...");
          const response = await fetch('/api/update-admin-password', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: selectedAdmin.id, newPassword: newPassword }),
          });
          const result = await response.json();
          if (!response.ok) {
               console.error("[AdminManagement] API error updating password:", result.error);
               throw new Error(result.error || 'Failed to update password via API.');
          }
          console.log("[AdminManagement] Password updated via API.");
        }

        alert("Admin updated successfully!");
        setEditing(false); // Exit edit mode
        setNewPassword(""); // Clear password fields after successful save
        setConfirmPassword("");
        await fetchAdminList(); // Refresh the admin list to show updated data

        // If the user updated their OWN profile, update the selectedAdmin state too
        if (currentUser?.id === selectedAdmin.id) {
             setSelectedAdmin(prev => prev ? { ...prev, name: newName, email: newEmail } : null);
        }


      } catch (err) {
        console.error("[AdminManagement] Error saving admin info:", err);
        alert(`Error updating admin: ${(err as Error).message}`);
      } finally {
        setModalLoading(false); // Stop modal loading indicator
      }
  };

  const deleteAdmin = async () => {
      // Double-check conditions for deletion
      if (!selectedAdmin || !canDeleteSelected || modalLoading) return;

      console.warn("[AdminManagement] Attempting to delete admin profile:", selectedAdmin.email, "ID:", selectedAdmin.id);
      // Use browser confirm for safety before proceeding
      if (!confirm(`ARE YOU SURE you want to delete the admin profile for ${selectedAdmin.name} (${selectedAdmin.email})? This action only removes them from the admin list and cannot be undone easily.`)) {
            setShowDeleteModal(false); // Close modal if cancelled
            return;
      }

      setModalLoading(true); // Start modal loading indicator
      try {
          // Delete the record from the 'admin' table
          // ⚠️ RLS: Must allow DELETE (likely only for super_admin, and maybe not own row)
          console.log("[AdminManagement] Deleting profile from 'admin' table...");
          const { error } = await supabase
            .from("admin")
            .delete()
            .eq("id", selectedAdmin.id); // Target the selected admin's ID

          if (error) {
             console.error("[AdminManagement] Supabase error deleting admin from table:", error);
             throw new Error(`Failed to delete admin profile: ${error.message}`);
          }
          console.log("[AdminManagement] Admin profile deleted from 'admin' table.");

          // IMPORTANT: This only deletes the record in your 'admin' table.
          // The Supabase Auth user (the actual login credentials) still exists.
          // Deleting Auth users requires admin privileges, typically via an API route using the SERVICE_ROLE_KEY.
          // Consider adding an API call here if you want to fully delete the user login.
          // Example (conceptual):
          // const authDeleteRes = await fetch('/api/delete-auth-user', { method: 'POST', body: JSON.stringify({ userId: selectedAdmin.id }) });
          // if (!authDeleteRes.ok) { console.warn("Failed to delete corresponding Auth user."); }

          alert("Admin profile removed from the list successfully.");
          setShowDeleteModal(false); // Close the confirmation modal
          setSelectedAdmin(null); // Clear the selection as the admin is gone
          await fetchAdminList(); // Refresh the admin list

      } catch (err) {
        console.error("[AdminManagement] Error during deletion process:", err);
        alert(`Error deleting admin: ${(err as Error).message}`);
        // Keep modal open on error? Or close? For now, close.
        setShowDeleteModal(false);
      } finally {
        setModalLoading(false); // Stop modal loading indicator
      }
  };


  // --- Calculated Permissions (useMemo for efficiency) ---
  // 5. Calculate permissions based on the currentUser prop
  const isSuperAdmin = useMemo(() => currentUser?.role === 'super_admin', [currentUser]);
  // Can edit if super_admin OR if viewing own profile
  const canEditSelected = useMemo(() => isSuperAdmin || currentUser?.id === selectedAdmin?.id, [isSuperAdmin, currentUser, selectedAdmin]);
  // Can delete ONLY if super_admin AND NOT deleting own profile
  const canDeleteSelected = useMemo(() => isSuperAdmin && currentUser?.id !== selectedAdmin?.id, [isSuperAdmin, currentUser, selectedAdmin]);


  // --- Render Logic ---

  // Initial loading state for the component
  if (loading && admins.length === 0) {
    return (
        <div className="flex justify-center items-center p-10">
            <svg className="animate-spin mr-3 h-6 w-6 text-yellow-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"> <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle> <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path> </svg>
            <p className="text-gray-500 font-medium">Loading admin data...</p>
        </div>
    );
  }

  // Handle case where fetch is done but currentUser prop was null (shouldn't happen if parent works)
  if (!currentUser && !loading) {
     return <p className="text-red-600 p-4 font-semibold">Error: Cannot manage admins. User information could not be loaded.</p>;
  }

  // --- Main Component JSX ---
  return (
    <div className="space-y-6">
      {/* Add Admin Button Row */}
      <div className="flex justify-between items-center">
        <div>{/* Placeholder if needed for alignment */}</div>
        {/* Show Add button only for super admins */}
        {isSuperAdmin && (
          <button
            onClick={() => {
              setShowAddModal(true);
              setCreatedAdminInfo(null); // Reset success message
            }}
            className="px-4 py-2 bg-yellow-500 text-white font-semibold rounded-lg shadow-md hover:bg-yellow-600 transition-colors focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:ring-offset-2"
            disabled={modalLoading} // Disable if another modal action is in progress
          >
            + Add New Admin
          </button>
        )}
      </div>

      {/* Main Layout: List Panel + Details Panel */}
      <div className="flex flex-col md:flex-row gap-6">

        {/* Admin List Panel */}
        <div className="w-full md:w-1/3 bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
          <h3 className="font-semibold mb-3 text-gray-700 text-lg sticky top-0 bg-white pt-1 pb-2 border-b">
            {isSuperAdmin ? "All Admins" : "My Profile"} ({admins.length})
          </h3>
          <div className="flex flex-col gap-1 max-h-[60vh] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100"> {/* Added scrollbar styling */}
            {admins.length === 0 && !loading && (
                 <p className="text-gray-500 text-sm p-3 text-center">No admins found.</p>
             )}
            {/* Render list of admins */}
            {admins.map((admin) => (
              <div
                key={admin.id}
                role="button" tabIndex={0}
                className={`cursor-pointer p-3 rounded-md transition-colors duration-150 ${
                    selectedAdmin?.id === admin.id
                    ? "bg-yellow-400 text-black font-semibold ring-2 ring-yellow-500" // Active style
                    : "text-gray-700 hover:bg-gray-100 focus:bg-gray-100 focus:outline-none" // Inactive style
                 }`}
                onClick={() => selectAdmin(admin)}
                // Allow selection with Enter/Space key for accessibility
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') selectAdmin(admin); }}
              >
                <p className="font-medium truncate" title={admin.name || undefined}>{admin.name || "No Name Set"}</p>
                <p className="text-xs truncate" title={admin.email || undefined}>{admin.email || "No Email Set"}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Admin Details / Edit Form Panel */}
        <div className="flex-1 bg-white p-6 rounded-lg border border-gray-200 shadow-sm min-h-[60vh]"> {/* Matched min height */}
          {selectedAdmin ? (
            // Display details or edit form for the selected admin
            <div className="space-y-4">
              {/* Header: Name, Email, Role, Edit Button */}
              <div className="flex justify-between items-start pb-4 border-b border-gray-200">
                  <div>
                      {/* Use state values (newName, newEmail) if editing, otherwise selectedAdmin */}
                      <h3 className="text-xl font-bold text-gray-800">{editing ? newName : selectedAdmin.name || "No Name Set"}</h3>
                      <p className="text-sm text-gray-500">{editing ? newEmail : selectedAdmin.email || "No Email Set"}</p>
                      <p className="text-xs text-gray-400 mt-1 capitalize">Role: {selectedAdmin.role?.replace('_', ' ') || 'N/A'}</p> {/* Display role */}
                  </div>
                  {/* Show Edit button if not currently editing AND user has permission */}
                  {!editing && canEditSelected && (
                      <button
                          onClick={() => setEditing(true)}
                          className="px-4 py-2 text-sm bg-blue-500 text-white font-semibold rounded-lg hover:bg-blue-600 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2"
                          disabled={modalLoading} // Disable if modal action in progress
                      >
                          Edit Profile
                      </button>
                  )}
              </div>

              {/* Edit Form (Rendered conditionally) */}
              {editing && canEditSelected && (
                <div className="pt-4 space-y-4">
                  {/* Name Input */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor={`edit-name-${selectedAdmin.id}`}>Name</label>
                    <input id={`edit-name-${selectedAdmin.id}`} type="text" value={newName} onChange={(e) => setNewName(e.target.value)} className="w-full p-2 border border-gray-300 rounded-lg text-gray-800 focus:ring-yellow-400 focus:border-yellow-400" />
                  </div>
                  {/* Email Input */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor={`edit-email-${selectedAdmin.id}`}>Email</label>
                    <input id={`edit-email-${selectedAdmin.id}`} type="email" value={newEmail} onChange={handleEmailChange} className="w-full p-2 border border-gray-300 rounded-lg text-gray-800 focus:ring-yellow-400 focus:border-yellow-400" />
                    {emailError && <p className="text-red-600 text-xs mt-1">{emailError}</p>}
                  </div>

                  {/* Password Change Section */}
                  <div className="pt-4 border-t border-gray-200 space-y-2">
                     <p className="text-sm font-medium text-gray-700">Change Password (optional)</p>
                    {/* New Password Input */}
                    <div>
                      <div className="relative">
                        <label className="sr-only" htmlFor={`edit-new-password-${selectedAdmin.id}`}>New Password</label>
                        <input
                          id={`edit-new-password-${selectedAdmin.id}`}
                          type={showPassword ? "text" : "password"}
                          value={newPassword}
                          onChange={handlePasswordChange}
                          placeholder="Enter new password to change"
                          className="w-full p-2 border border-gray-300 rounded-lg pr-10 text-gray-800 focus:ring-yellow-400 focus:border-yellow-400"
                          autoComplete="new-password"
                         />
                        <button type="button" onClick={() => setShowPassword(!showPassword)} title={showPassword ? "Hide password" : "Show password"} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700">
                           {showPassword ? <FaEyeSlash /> : <FaEye />}
                         </button>
                      </div>
                      {passwordError && <p className="text-red-600 text-xs mt-1">{passwordError}</p>}
                    </div>
                    {/* Confirm Password Input */}
                    <div>
                      <div className="relative">
                        <label className="sr-only" htmlFor={`edit-confirm-password-${selectedAdmin.id}`}>Confirm New Password</label>
                        <input
                           id={`edit-confirm-password-${selectedAdmin.id}`}
                           type={showConfirmPassword ? "text" : "password"}
                           value={confirmPassword}
                           onChange={(e) => setConfirmPassword(e.target.value)}
                           placeholder="Confirm new password"
                           // Highlight border if passwords entered don't match
                           className={`w-full p-2 border rounded-lg pr-10 text-gray-800 focus:ring-yellow-400 focus:border-yellow-400 ${newPassword && confirmPassword && newPassword !== confirmPassword ? 'border-red-500' : 'border-gray-300'}`}
                           autoComplete="new-password"
                         />
                        <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} title={showConfirmPassword ? "Hide password" : "Show password"} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700">
                           {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                         </button>
                         {/* Show mismatch error only if both fields have content */}
                         {newPassword && confirmPassword && newPassword !== confirmPassword && (
                            <p className="text-red-600 text-xs mt-1">Passwords do not match.</p>
                         )}
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons (Delete, Cancel, Save) */}
                  <div className="flex flex-col sm:flex-row justify-between items-center pt-4 border-t border-gray-200 gap-3">
                     {/* Delete Button (Show only if allowed) */}
                     {canDeleteSelected ? (
                       <button
                         onClick={() => setShowDeleteModal(true)}
                         className="w-full sm:w-auto px-4 py-2 text-sm bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50"
                         disabled={modalLoading} // Disable during actions
                       >
                         Delete Admin Profile
                       </button>
                     ) : (
                       <div></div> // Placeholder to maintain alignment
                     )}
                     {/* Cancel and Save Buttons */}
                    <div className="w-full sm:w-auto flex justify-end space-x-2">
                      <button
                         onClick={() => { setEditing(false); if (selectedAdmin) { selectAdmin(selectedAdmin); } }} // Reset form state on cancel
                         className="px-4 py-2 text-sm bg-gray-200 text-gray-800 font-semibold rounded-lg hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 disabled:opacity-50"
                         disabled={modalLoading}
                       >
                         Cancel
                       </button>
                      <button
                         onClick={saveAdminInfo}
                         className="px-4 py-2 text-sm bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50"
                         // Disable save if loading, or validation errors exist
                         disabled={modalLoading || !!emailError || (!!newPassword && !!passwordError) || (!!newPassword && newPassword !== confirmPassword)}
                       >
                         {modalLoading ? 'Saving...' : 'Save Changes'}
                       </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            // Message shown when no admin is selected
            <div className="flex items-center justify-center h-full text-center">
               <p className="text-gray-500">
                  {isSuperAdmin ? "Select an admin from the list to view or edit details." : "Your profile details are shown here."}
               </p>
            </div>
          )}
        </div>
      </div>

      {/* --- Modals --- */}

      {/* Add New Admin Modal */}
      {showAddModal && isSuperAdmin && ( // Only render if super admin
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-60 z-50 p-4 animate-fade-in"> {/* Added animation */}
          <div className="bg-white p-6 md:p-8 rounded-xl w-full max-w-md relative text-black shadow-lg">
            {/* Close Button */}
            <button onClick={() => !modalLoading && setShowAddModal(false)} className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 disabled:opacity-50" aria-label="Close modal" disabled={modalLoading}>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>

            <h3 className="text-xl font-semibold mb-6 text-center">Create New Admin Account</h3>
            {createdAdminInfo ? (
              // Success Message View
              <div className="text-center">
                 <p className="text-lg font-medium text-green-600 mb-4">✅ Admin Created Successfully!</p>
                 <p className="text-sm text-gray-600">Please provide these credentials to the new admin. They **must** change the password on first login.</p>
                 <div className="bg-gray-100 p-4 rounded-lg mt-4 text-left text-sm border border-gray-200 space-y-1">
                     <p><strong>Email:</strong> {createdAdminInfo.email}</p>
                     <p><strong>Temporary Password:</strong> <code className="bg-gray-200 px-2 py-1 rounded text-red-600 font-semibold">{createdAdminInfo.temporaryPassword}</code></p>
                 </div>
                 <button onClick={() => setShowAddModal(false)} className="mt-6 w-full px-4 py-2 bg-gray-300 text-gray-800 font-semibold rounded-lg hover:bg-gray-400 transition-colors">Close</button>
              </div>
            ) : (
              // Create Form View
              <form onSubmit={handleAddAdmin}>
                 <div className="space-y-4">
                     <div>
                         <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="new-admin-name">Full Name</label>
                         <input id="new-admin-name" type="text" placeholder="Juan dela Cruz" value={newAdminName} onChange={(e) => setNewAdminName(e.target.value)} required className="w-full p-3 border border-gray-300 rounded-lg focus:ring-yellow-400 focus:border-yellow-400" />
                     </div>
                     <div>
                         <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="new-admin-email">Email Address</label>
                         <input id="new-admin-email" type="email" placeholder="juan@tip.edu.ph" value={newAdminEmail} onChange={(e) => setNewAdminEmail(e.target.value)} required className="w-full p-3 border border-gray-300 rounded-lg focus:ring-yellow-400 focus:border-yellow-400" />
                         <p className="text-xs text-gray-500 mt-1">Must be a valid email. Temporary password will be sent (conceptually).</p>
                     </div>
                 </div>
                 {/* Modal Action Buttons */}
                 <div className="flex justify-end space-x-3 mt-8">
                     <button type="button" onClick={() => setShowAddModal(false)} className="px-4 py-2 bg-gray-200 text-gray-800 font-semibold rounded-lg hover:bg-gray-300 disabled:opacity-50" disabled={modalLoading}>Cancel</button>
                     <button type="submit" className="px-4 py-2 bg-yellow-500 text-white font-semibold rounded-lg hover:bg-yellow-600 disabled:opacity-50 flex items-center justify-center min-w-[120px]" disabled={modalLoading}>
                         {modalLoading ? (<><svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" /* ... spinner SVG ... */></svg>Creating...</>) : 'Create Admin'}
                     </button>
                 </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && canDeleteSelected && selectedAdmin && ( // Only render if allowed and admin selected
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-60 z-50 p-4 animate-fade-in">
          <div className="bg-white p-6 md:p-8 rounded-xl w-full max-w-md relative text-black shadow-lg">
             <h3 className="text-xl font-semibold mb-4 text-red-600">🚨 Confirm Deletion</h3>
             <p className="text-gray-600 mb-1">Are you absolutely sure you want to delete the admin profile for:</p>
             <p className="font-bold text-center my-2">{selectedAdmin.name} ({selectedAdmin.email})?</p>
             <p className="text-sm text-red-700 bg-red-50 p-2 rounded border border-red-200 mb-6">This action removes their record from the admin list and cannot be undone. Their login credentials might still exist in the authentication system.</p>
             {/* Modal Action Buttons */}
             <div className="flex justify-end space-x-3 mt-8">
               <button onClick={() => setShowDeleteModal(false)} className="px-4 py-2 bg-gray-200 text-gray-800 font-semibold rounded-lg hover:bg-gray-300 disabled:opacity-50" disabled={modalLoading}>Cancel</button>
               <button onClick={deleteAdmin} className="px-4 py-2 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 disabled:opacity-50 flex items-center justify-center min-w-[120px]" disabled={modalLoading}>
                  {modalLoading ? (<><svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" /* ... spinner SVG ... */></svg>Deleting...</>) : 'Confirm Delete'}
               </button>
             </div>
          </div>
        </div>
      )}

    </div> // End root div
  );
}