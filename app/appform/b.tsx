// appform/b.tsx  change to personal information
"use client";

import { useState } from "react";

export default function PersonalInformationForm({
  formData,
  setFormData,
  nextStep,
  prevStep,
}: {
  formData: any;
  setFormData: Function;
  nextStep: () => void;
  prevStep: () => void;
}) {
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev: any) => ({
      ...prev,
      personalInfo: { ...prev.personalInfo, [name]: value },
    }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const validateAndProceed = () => {
    const newErrors: Record<string, string> = {};
    const { fullAddress, mobile, email } = formData.personalInfo;

    // Full Address
    if (!fullAddress || !fullAddress.trim())
      newErrors.fullAddress = "Full address is required.";
    else if (fullAddress.length < 5)
      newErrors.fullAddress = "Please enter a complete address.";

    // Mobile
    if (!mobile || !mobile.trim()) newErrors.mobile = "Mobile number is required.";
    else if (!/^[0-9]+$/.test(mobile))
      newErrors.mobile = "Mobile number must contain digits only.";
    else if (mobile.length !== 11)
      newErrors.mobile = "Mobile number must be 11 digits (e.g., 09XXXXXXXXX).";

    // Email
    if (!email || !email.trim()) newErrors.email = "Email is required.";
    else if (
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
    )
      newErrors.email = "Please enter a valid email address.";

    setErrors(newErrors);

    if (Object.keys(newErrors).length === 0) {
      nextStep();
    }
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
              Full Address:
            </label>
            <input
              name="fullAddress"
              value={formData.personalInfo.fullAddress}
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
              Mobile Number:
            </label>
            <input
              name="mobile"
              value={formData.personalInfo.mobile}
              onChange={handleChange}
              maxLength={11}
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
              Email:
            </label>
            <input
              name="email"
              type="email"
              value={formData.personalInfo.email}
              onChange={handleChange}
              className={`w-full border rounded-lg p-2 text-black ${
                errors.email ? "border-red-500" : "border-gray-400"
              }`}
            />
            {errors.email && (
              <p className="text-red-500 text-sm mt-1">{errors.email}</p>
            )}
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