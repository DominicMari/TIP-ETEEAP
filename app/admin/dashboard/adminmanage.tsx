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
}

export default function AdminManagement() {
  const [admins, setAdmins] = useState<AdminProfile[]>([]);
  const [selectedAdmin, setSelectedAdmin] = useState<AdminProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [passwordError, setPasswordError] = useState("");

  const fetchAdmins = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.from("admin").select("*");
      if (error) {
        console.error("Error fetching admins:", error.message);
        setAdmins([]);
      } else {
        const adminData = data as AdminProfile[];
        setAdmins(adminData);
        if (adminData && adminData.length > 0 && !selectedAdmin) {
          setSelectedAdmin(adminData[0]);
          setNewName(adminData[0].name ?? "");
          setNewEmail(adminData[0].email ?? "");
        }
      }
    } catch (err) {
      console.error("Unexpected error fetching admins:", err);
      setAdmins([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdmins();
  }, []);

  const validatePassword = (password: string) => {
    if (!password) {
        return "";
    }
    if (password.length < 8) {
      return "Password must be at least 8 characters long.";
    }
    if (!/[A-Z]/.test(password)) {
      return "Password must contain an uppercase letter.";
    }
    if (!/[a-z]/.test(password)) {
      return "Password must contain a lowercase letter.";
    }
    if (!/\d/.test(password)) {
      return "Password must contain a number.";
    }
    if (!/[!@#$%^&*]/.test(password)) {
      return "Password must contain a special character (e.g., !@#$%).";
    }
    return "";
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const password = e.target.value;
    setNewPassword(password);
    setPasswordError(validatePassword(password));
  };

  const selectAdmin = (admin: AdminProfile) => {
    setSelectedAdmin(admin);
    setEditing(false);
    setNewName(admin.name ?? "");
    setNewEmail(admin.email ?? "");
    setNewPassword("");
    setPasswordError("");
  };

  const saveAdminInfo = async () => {
    if (!selectedAdmin) return;
    
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

      if (profileError) {
        throw new Error("Failed to update profile: " + profileError.message);
      }
      
      if (newPassword.trim()) {
        const response = await fetch('/api/update-admin-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: selectedAdmin.id,
            newPassword: newPassword,
          }),
        });
        const result = await response.json();
        if (!response.ok) {
          throw new Error(result.error || 'Failed to update password.');
        }
      }

      alert("Admin updated successfully.");
      setEditing(false);
      setNewPassword("");
      fetchAdmins();

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
        fetchAdmins();
      }
    } catch (err) {
      alert("Unexpected error deleting admin.");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <p className="text-yellow-600">Loading admins...</p>;
  }

  return (
    <div>
      <h2 className="text-2xl font-semibold text-black mb-4">Admin Management</h2>
      <div className="flex gap-4">
        <div className="w-1/3 overflow-auto max-h-[400px] border border-gray-300 rounded p-2 bg-gray-50">
          <h3 className="font-semibold mb-2 text-black">All Admins</h3>
          {admins.map((admin) => (
            <div
              key={admin.id}
              className={`cursor-pointer p-2 rounded text-black ${
                selectedAdmin?.id === admin.id ? "bg-yellow-200 font-semibold" : ""
              }`}
              onClick={() => selectAdmin(admin)}
            >
              {admin.name ?? "-"} ({admin.email ?? "-"})
            </div>
          ))}
        </div>

        <div className="flex-1 bg-gray-50 p-6 rounded-xl border border-yellow-400 shadow-md text-black">
          {selectedAdmin ? (
            <>
              <div className="mb-2">
                <strong>Name:</strong>{" "}
                {!editing ? (
                  <>
                    {newName ?? "-"}{" "}
                    <button onClick={() => setEditing(true)} className="ml-2 text-yellow-500 hover:text-yellow-700" title="Edit">✏️</button>
                  </>
                ) : (
                  <input type="text" value={newName} onChange={(e) => setNewName(e.target.value)} className="border border-gray-400 rounded px-2 py-1 text-black" />
                )}
              </div>
              <div className="mb-2">
                <strong>Email:</strong>{" "}
                {!editing ? (
                  newEmail ?? "-"
                ) : (
                  <input type="email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} className="border border-gray-400 rounded px-2 py-1 text-black" />
                )}
              </div>

              <div>
                <strong>Password:</strong>{" "}
                {!editing ? (
                  "************"
                ) : (
                  <div className="relative inline-block">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={newPassword}
                      onChange={handlePasswordChange}
                      placeholder="Enter new password to change"
                      className="border border-gray-400 rounded px-2 py-1 pr-10 text-black"
                    />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-700 hover:text-gray-900">
                      {showPassword ? <FaEyeSlash /> : <FaEye />}
                    </button>
                  </div>
                )}
                {passwordError && editing && (
                  <p className="text-red-500 text-sm mt-1">{passwordError}</p>
                )}
              </div>

              {editing && (
                <div className="mt-4 space-x-2">
                  <button onClick={saveAdminInfo} className="px-4 py-2 bg-yellow-400 text-black rounded hover:bg-yellow-500" disabled={loading}>Save</button>
                  <button onClick={() => { setEditing(false); if (selectedAdmin) { setNewName(selectedAdmin.name ?? ""); setNewEmail(selectedAdmin.email ?? ""); setNewPassword(""); setPasswordError(""); } }} className="px-4 py-2 bg-gray-300 text-black rounded hover:bg-gray-400" disabled={loading}>Cancel</button>
                  <button onClick={() => setShowDeleteModal(true)} className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700" disabled={loading}>Delete</button>
                </div>
              )}
            </>
          ) : (
            <p>Please select an admin to see details.</p>
          )}
        </div>
      </div>

      {showDeleteModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-30 z-50">
          <div className="bg-white p-6 rounded-xl w-full max-w-md relative text-black">
            <h3 className="text-xl font-semibold mb-4">Confirm Delete</h3>
            <p>Are you sure you want to delete Admin {selectedAdmin?.name}?</p>
            <div className="flex justify-end space-x-3 mt-6">
              <button onClick={() => setShowDeleteModal(false)} className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400" disabled={loading}>Cancel</button>
              <button onClick={deleteAdmin} className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700" disabled={loading}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}