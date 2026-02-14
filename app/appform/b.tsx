"use client";

import { useState } from "react";
import MonthYearPicker from "./MonthYearPicker";

export default function PersonalInformationForm({
  formData, // This is formData.personalInfo, e.g., { fullAddress: ..., mobile: ..., email: ... }
  setFormData, // This is handlePersonalChange
  nextStep,
  prevStep,
}: {
  formData: any;
  setFormData: Function;
  nextStep: () => void;
  prevStep: () => void;
}) {
  const [errors, setErrors] = useState<Record<string, string>>({});

  // --- This function is for most text inputs ---
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  // --- This function calculates age from a date string ---
  const calculateAge = (dateString: string): number => {
    if (!dateString) return 0;
    const today = new Date();
    const birthDate = new Date(dateString);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDifference = today.getMonth() - birthDate.getMonth();
    
    // Check if the birthday has occurred this year
    if (monthDifference < 0 || (monthDifference === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  // --- Special handler for the date picker ---
  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target; // name will be "birthDate"
    const calculatedAge = calculateAge(value);

    setFormData({
      ...formData,
      [name]: value, // Update birthDate
      age: calculatedAge, // Update age
    });

    if (errors.birthDate) setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const validateAndProceed = () => {
    const newErrors: Record<string, string> = {};
    
    const { fullAddress, mobile, email, birthDate } = formData;

    if (!fullAddress?.trim()) newErrors.fullAddress = "Full address is required.";

    // ✅ 2. VALIDATION UPDATED
    if (!mobile?.trim()) {
      newErrors.mobile = "Mobile number is required.";
    } else if (!/^09\d{9}$/.test(mobile)) { // Regex updated to only 11 digits
        newErrors.mobile = "Please enter a valid 11-digit PH mobile number (e.g., 09xxxxxxxxx).";
    }

    if (!email?.trim()) {
      newErrors.email = "Email is required.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = "Please enter a valid email address.";
    }

    if (!birthDate?.trim()) {
      newErrors.birthDate = "Date of birth is required.";
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length === 0) {
      nextStep();
    }
  };

  // This default object ensures formData.age exists on first render
  const data = formData || { 
    fullAddress: "", 
    mobile: "", 
    email: "", 
    birthDate: "", 
    age: "" 
  };

  return (
    <form
      className="bg-white shadow-lg rounded-2xl w-full max-w-3xl flex flex-col"
      onSubmit={(e) => e.preventDefault()}
    >
      <div className="flex-1 overflow-y-auto max-h-[70vh] p-6">
        <h3 className="font-semibold text-lg mb-4 text-black">
          A. Personal Information
        </h3>

        <div className="grid grid-cols-2 gap-4">
          {/* Full Address */}
          <div className="col-span-2">
            <label className="block text-sm font-semibold text-black">
              Full Address: <span className="text-red-500">*</span>
            </label>
            <input
              name="fullAddress"
              value={data.fullAddress || ""}
              onChange={handleChange}
              className={`w-full border rounded-lg p-2 text-black ${
                errors.fullAddress ? "border-red-500" : "border-gray-400"
              }`}
            />
            {errors.fullAddress && (
              <p className="text-red-500 text-sm mt-1">{errors.fullAddress}</p>
            )}
          </div>

          {/* Mobile */}
          <div>
            <label className="block text-sm font-semibold text-black">
              Mobile Number: <span className="text-red-500">*</span>
            </label>
            <input
              name="mobile"
              type="tel"
              value={data.mobile || ""}
              // ✅ 1. INPUT LOGIC UPDATED
              onChange={(e) => {
                const value = e.target.value;
                // Regex to allow only numbers
                const numericRegex = /^[0-9]*$/;
                
                // Only update state if value is numeric AND 11 digits or less
                if (numericRegex.test(value) && value.length <= 11) {
                  handleChange(e);
                }
              }}
              maxLength={11} // Updated to 11
              inputMode="numeric"
              placeholder="09XXXXXXXXX"
              className={`w-full border rounded-lg p-2 text-black ${
                errors.mobile ? "border-red-500" : "border-gray-400"
              }`}
            />
            {errors.mobile && (
               <p className="text-red-500 text-sm mt-1">{errors.mobile}</p>
            )}
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-semibold text-black">
              Email: <span className="text-red-500">*</span>
            </label>
            <input
              name="email"
              type="email"
              value={data.email || ""}
              onChange={handleChange}
              className={`w-full border rounded-lg p-2 text-black ${
                errors.email ? "border-red-500" : "border-gray-400"
              }`}
            />
            {errors.email && (
              <p className="text-red-500 text-sm mt-1">{errors.email}</p>
            )}
          </div>

          {/* Date of Birth & Age Row */}
<div className="col-span-2 flex gap-4">
  
  {/* Date of Birth */}
  <div className="flex-1">
    <label className="block text-sm font-medium text-black mb-1">
      Date of Birth: <span className="text-red-500">*</span>
    </label>
    <input
      type="date"
      /* Added text-black and bg-white here */
      className={`w-full p-2 border rounded-md text-black bg-white focus:outline-none focus:ring-2 ${
        errors.birthDate ? "border-red-500 focus:ring-red-200" : "border-gray-300 focus:ring-blue-200"
      }`}
      value={data.birthDate || ""}
      max={new Date().toISOString().split("T")[0]}
      onChange={(e) => {
        const value = e.target.value;
        const calculatedAge = calculateAge(value);
        
        setFormData({
          ...data,
          birthDate: value,
          age: calculatedAge,
        });

        if (errors.birthDate) setErrors((prev) => ({ ...prev, birthDate: "" }));
      }}
      required
    />
    {errors.birthDate && (
      <p className="mt-1 text-xs text-red-500">{errors.birthDate}</p>
    )}
  </div>

  {/* Age */}
  <div className="w-24">
    <label className="block text-sm font-semibold text-black mb-1">
      Age:
    </label>
    <input
      name="age"
      type="text"
      value={data.age || ""}
      readOnly
      placeholder="0"
      className="w-full p-2 border rounded-md text-black bg-gray-100 cursor-not-allowed text-center"
    />
  </div>
  
</div>

        </div>
      </div>

      <div className="flex justify-between p-6">
        <button
          type="button"
          onClick={prevStep}
          className="bg-gray-300 text-black font-semibold py-2 px-6 rounded-lg"
        >
          ← Back
        </button>
        <button
          type="button"
          onClick={validateAndProceed}
          className="bg-yellow-500 text-white font-semibold py-2 px-6 rounded-lg hover:bg-yellow-600"
        >
          Next →
        </button>
      </div>
    </form>
  );
}
