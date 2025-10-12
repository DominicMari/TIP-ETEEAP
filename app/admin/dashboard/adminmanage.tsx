"use client";

import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { FaEye, FaEyeSlash } from "react-icons/fa";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const supabase = createClient(supabaseUrl, supabaseAnonKey);

interface AdminProfile {
  id: string;
  name: string | null;
  email: string | null;
  role?: string;
}

export default function AdminManagement() {
  const [admins, setAdmins] = useState<AdminProfile[]>([]);
  const [currentUser, setCurrentUser] = useState<AdminProfile | null>(null);
  const [selectedAdmin, setSelectedAdmin] = useState<AdminProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  
  const [showAddModal, setShowAddModal] = useState(false);
  const [newAdminName, setNewAdminName] = useState("");
  const [newAdminEmail, setNewAdminEmail] = useState("");
  const [createdAdminInfo, setCreatedAdminInfo] = useState<{ email: string; temporaryPassword: string; } | null>(null);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const [emailError, setEmailError] = useState("");

  const fetchAdminsAndCurrentUser = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No user logged in");

      const { data, error } = await supabase.from("admin").select("*");
      if (error) throw error;

      const adminData = data as AdminProfile[];
      const currentUserProfile = adminData.find(admin => admin.id === user.id);
      setCurrentUser(currentUserProfile || null);

      if (currentUserProfile?.role === 'super_admin') {
        setAdmins(adminData);
        if (adminData.length > 0 && !selectedAdmin) {
          selectAdmin(adminData[0]);
        }
      } else {
        setAdmins(currentUserProfile ? [currentUserProfile] : []);
        if (currentUserProfile) {
          selectAdmin(currentUserProfile);
        }
      }
    } catch (err) {
      console.error("Error fetching data:", (err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminsAndCurrentUser();
  }, []);

  const handleAddAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setCreatedAdminInfo(null);
    try {
      const response = await fetch('/api/create-admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newAdminName, email: newAdminEmail }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Failed to create admin.');
      
      setCreatedAdminInfo({
        email: newAdminEmail,
        temporaryPassword: result.temporaryPassword,
      });
      setNewAdminName("");
      setNewAdminEmail("");
      fetchAdminsAndCurrentUser();
    } catch (err) {
      alert((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const validatePassword = (password: string) => {
    if (!password) return "";
    if (password.length < 8) return "Password must be at least 8 characters long.";
    if (!/[A-Z]/.test(password)) return "Password must contain an uppercase letter.";
    if (!/[a-z]/.test(password)) return "Password must contain a lowercase letter.";
    if (!/\d/.test(password)) return "Password must contain a number.";
    if (!/[!@#$%^&*]/.test(password)) return "Password must contain a special character (e.g., !@#$%).";
    return "";
  };

  const validateEmail = (email: string) => {
    if (!email) return "Email cannot be empty.";
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) return "Please enter a valid email address.";
    return "";
  };
  
  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const password = e.target.value;
    setNewPassword(password);
    setPasswordError(validatePassword(password));
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const email = e.target.value;
    setNewEmail(email);
    setEmailError(validateEmail(email));
  };
  
  const selectAdmin = (admin: AdminProfile) => {
    setSelectedAdmin(admin);
    setEditing(false);
    setNewName(admin.name ?? "");
    setNewEmail(admin.email ?? "");
    setNewPassword("");
    setConfirmPassword("");
    setPasswordError("");
    setEmailError("");
    setShowPassword(false);
    setShowConfirmPassword(false);
  };
  
  const saveAdminInfo = async () => {
    if (!selectedAdmin) return;
    const currentEmailError = validateEmail(newEmail);
    if (currentEmailError) {
        setEmailError(currentEmailError);
        alert("Please fix the errors before saving.");
        return;
    }
    if (newPassword !== confirmPassword) {
      alert("Passwords do not match.");
      return;
    }
    if (newPassword.trim() && passwordError) {
      alert("Please fix the password errors before saving.");
      return;
    }
    setLoading(true);
    try {
      const { error: profileError } = await supabase
        .from("admin")
        .update({ name: newName, email: newEmail })
        .eq("id", selectedAdmin.id);
      if (profileError) throw new Error("Failed to update profile: " + profileError.message);
      if (newPassword.trim()) {
        const response = await fetch('/api/update-admin-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: selectedAdmin.id, newPassword: newPassword }),
        });
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || 'Failed to update password.');
      }
      alert("Admin updated successfully.");
      setEditing(false);
      setNewPassword("");
      setConfirmPassword("");
      fetchAdminsAndCurrentUser();
    } catch (err) {
      console.error("Error updating admin:", err);
      alert((err as Error).message);
    } finally {
      setLoading(false);
    }
  };
  
  const deleteAdmin = async () => {
    if (!selectedAdmin) return;
    setLoading(true);
    try {
      const { error } = await supabase.from("admin").delete().eq("id", selectedAdmin.id);
      if (error) {
        alert("Failed to delete admin.");
      } else {
        alert("Admin deleted successfully.");
        setShowDeleteModal(false);
        setSelectedAdmin(null);
        fetchAdminsAndCurrentUser();
      }
    } catch (err) {
      alert("Unexpected error deleting admin.");
    } finally {
      setLoading(false);
    }
  };

  const isSuperAdmin = currentUser?.role === 'super_admin';
  const canEditSelected = isSuperAdmin || currentUser?.id === selectedAdmin?.id;
  const canDeleteSelected = isSuperAdmin && currentUser?.id !== selectedAdmin?.id;

  if (loading && !admins.length) {
    return <p className="text-gray-500">Loading admin data...</p>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div></div> 
        {isSuperAdmin && (
          <button 
            onClick={() => {
              setShowAddModal(true);
              setCreatedAdminInfo(null);
            }}
            className="px-4 py-2 bg-yellow-500 text-white font-semibold rounded-lg shadow-md hover:bg-yellow-600 transition-colors"
          >
            + Add New Admin
          </button>
        )}
      </div>

      <div className="flex gap-6">
        <div className="w-1/3 bg-white p-4 rounded-lg border border-gray-200">
          <h3 className="font-semibold mb-3 text-gray-700 text-lg">
            {isSuperAdmin ? "All Admins" : "My Profile"}
          </h3>
          <div className="flex flex-col gap-1 max-h-[50vh] overflow-y-auto">
            {admins.map((admin) => (
              <div
                key={admin.id}
                className={`cursor-pointer p-3 rounded-md ${selectedAdmin?.id === admin.id ? "bg-yellow-400 text-gray-800 font-semibold" : "text-gray-700 hover:bg-gray-100"}`}
                onClick={() => selectAdmin(admin)}
              >
                <p className="font-medium">{admin.name ?? "No Name"}</p>
                <p className="text-xs">{admin.email ?? "No Email"}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="flex-1 bg-white p-6 rounded-lg border border-gray-200">
          {selectedAdmin ? (
            <div className="space-y-4">
              <div className="flex justify-between items-start">
                  <div>
                      <h3 className="text-lg font-bold text-gray-800">{newName}</h3>
                      <p className="text-sm text-gray-500">{newEmail}</p>
                  </div>
                  {!editing && canEditSelected && (
                      <button onClick={() => setEditing(true)} className="px-4 py-2 text-sm bg-gray-200 text-gray-800 font-semibold rounded-lg hover:bg-gray-300">Edit</button>
                  )}
              </div>
              
              {editing && canEditSelected && (
                <div className="pt-4 border-t border-gray-200 space-y-4">
                  <div>
                    <label className="font-medium text-gray-700">Name</label>
                    <input type="text" value={newName} onChange={(e) => setNewName(e.target.value)} className="w-full mt-1 p-2 border rounded-lg text-gray-800" />
                  </div>
                  <div>
                    <label className="font-medium text-gray-700">Email</label>
                    <input type="email" value={newEmail} onChange={handleEmailChange} className="w-full mt-1 p-2 border rounded-lg text-gray-800" />
                    {emailError && <p className="text-red-500 text-sm mt-1">{emailError}</p>}
                  </div>
                  <div className="space-y-2">
                    <div>
                      <label className="font-medium text-gray-700">New Password</label>
                      <div className="relative">
                        <input type={showPassword ? "text" : "password"} value={newPassword} onChange={handlePasswordChange} placeholder="Enter to change password" className="w-full mt-1 p-2 border rounded-lg pr-10 text-gray-800" />
                        <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">{showPassword ? <FaEyeSlash /> : <FaEye />}</button>
                      </div>
                      {passwordError && <p className="text-red-500 text-sm mt-1">{passwordError}</p>}
                    </div>
                    <div>
                      <label className="font-medium text-gray-700">Confirm Password</label>
                      <div className="relative">
                        <input type={showConfirmPassword ? "text" : "password"} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Confirm new password" className="w-full mt-1 p-2 border rounded-lg pr-10 text-gray-800" />
                        <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">{showConfirmPassword ? <FaEyeSlash /> : <FaEye />}</button>
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-between items-center pt-4 border-t border-gray-200">
                    {canDeleteSelected ? (
                      <button onClick={() => setShowDeleteModal(true)} className="px-4 py-2 text-sm bg-red-500 text-white font-semibold rounded-lg hover:bg-red-600">Delete Admin</button>
                    ) : (
                      <div></div>
                    )}
                    <div className="space-x-2">
                      <button onClick={() => { setEditing(false); if (selectedAdmin) { selectAdmin(selectedAdmin); } }} className="px-4 py-2 text-sm bg-gray-200 text-gray-800 font-semibold rounded-lg hover:bg-gray-300">Cancel</button>
                      <button onClick={saveAdminInfo} className="px-4 py-2 text-sm bg-yellow-500 text-white font-semibold rounded-lg hover:bg-yellow-600">Save Changes</button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <p className="text-gray-500">Please select an admin from the list to see details.</p>
          )}
        </div>
      </div>
      
      {showAddModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white p-8 rounded-xl w-full max-w-md relative text-black shadow-lg">
            <h3 className="text-xl font-semibold mb-6">Create New Admin Account</h3>
            {createdAdminInfo ? (
              <div className="text-center">
                <p className="text-lg font-medium text-green-600 mb-4">Admin Created Successfully!</p>
                <p className="text-sm text-gray-600">Please provide these credentials to the new admin. They must change the password on first login.</p>
                <div className="bg-gray-100 p-4 rounded-lg mt-4 text-left">
                  <p><strong>Email:</strong> {createdAdminInfo.email}</p>
                  <p><strong>Temporary Password:</strong> <span className="font-mono bg-gray-200 p-1 rounded">{createdAdminInfo.temporaryPassword}</span></p>
                </div>
                <button onClick={() => setShowAddModal(false)} className="mt-6 w-full px-4 py-2 bg-gray-300 rounded-lg hover:bg-gray-400">Close</button>
              </div>
            ) : (
              <form onSubmit={handleAddAdmin}>
                <div className="space-y-4">
                  <div>
                    <label className="font-medium text-gray-700">Full Name</label>
                    <input type="text" placeholder="Juan dela Cruz" value={newAdminName} onChange={(e) => setNewAdminName(e.target.value)} required className="w-full mt-1 p-3 border rounded-lg focus:ring focus:ring-yellow-300" />
                  </div>
                  <div>
                    <label className="font-medium text-gray-700">Email Address</label>
                    <input type="email" placeholder="juan@example.com" value={newAdminEmail} onChange={(e) => setNewAdminEmail(e.target.value)} required className="w-full mt-1 p-3 border rounded-lg focus:ring focus:ring-yellow-300" />
                  </div>
                </div>
                <div className="flex justify-end space-x-3 mt-8">
                  <button type="button" onClick={() => setShowAddModal(false)} className="px-4 py-2 bg-gray-200 text-gray-800 font-semibold rounded-lg hover:bg-gray-300" disabled={loading}>Cancel</button>
                  <button type="submit" className="px-4 py-2 bg-yellow-500 text-white font-semibold rounded-lg hover:bg-yellow-600" disabled={loading}>
                    {loading ? 'Creating...' : 'Create Admin'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {showDeleteModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white p-8 rounded-xl w-full max-w-md relative text-black shadow-lg">
            <h3 className="text-xl font-semibold mb-4">Confirm Deletion</h3>
            <p className="text-gray-600">Are you sure you want to delete the admin account for <span className="font-bold">{selectedAdmin?.name}</span>? This action cannot be undone.</p>
            <div className="flex justify-end space-x-3 mt-8">
              <button onClick={() => setShowDeleteModal(false)} className="px-4 py-2 bg-gray-200 text-gray-800 font-semibold rounded-lg hover:bg-gray-300" disabled={loading}>Cancel</button>
              <button onClick={deleteAdmin} className="px-4 py-2 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700" disabled={loading}>
                {loading ? 'Deleting...' : 'Delete Admin'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}