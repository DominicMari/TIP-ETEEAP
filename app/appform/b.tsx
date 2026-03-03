"use client";

import { useState } from "react";

export default function PersonalInformationForm({
  formData,
  setFormData,
  nextStep,
  prevStep,
}: {
  formData: any;
  setFormData: (data: any) => void;
  nextStep: () => void;
  prevStep: () => void;
}) {
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value, type, checked } = e.target as HTMLInputElement;
    const newValue = type === "checkbox" ? checked : value;

    let updated = {
      ...formData,
      [name]: newValue,
    };

    // Clear overseas details if unchecked
    if (name === "isOverseas" && !checked) {
      updated.overseasDetails = "";
    }

    // Auto-calculate age if birthday changes
    if (name === "birthday" && value) {
      const birthDate = new Date(value);
      const today = new Date();
      let age = today.getFullYear() - birthDate.getFullYear();
      const m = today.getMonth() - birthDate.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
      updated.age = age;
    }

    setFormData(updated);

    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const validateAndProceed = () => {
    const newErrors: Record<string, string> = {};

    const requiredFields = [
      "name",
      "cityAddress",
      "permanentAddress",
      "birthday",
      "birthplace",
      "age",
      "gender",
      "nationality",
      "religion",
      "civilStatus",
      "email",
      "mobile",
      "language",
      "emergencyContactName",
      "emergencyRelationship",
      "emergencyAddress",
      "emergencyContactNumber",
    ];

    requiredFields.forEach((field) => {
      if (!String(formData[field] ?? "").trim()) {
        newErrors[field] = "This field is required.";
      }
    });

    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Please enter a valid email address.";
    }

    if (formData.mobile && !/^\d{11}$/.test(formData.mobile)) {
      newErrors.mobile = "Mobile number must be 11 digits.";
    }

    if (
      formData.emergencyContactNumber &&
      !/^\d{7,11}$/.test(formData.emergencyContactNumber)
    ) {
      newErrors.emergencyContactNumber = "Contact number must be 7–11 digits.";
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length === 0) {
      nextStep();
    }
  };

  return (
    <div className="min-h-screen flex justify-center items-center bg-gray-100 p-6">
      <form
        className="bg-white shadow-lg rounded-2xl w-full max-w-3xl flex flex-col"
        onSubmit={(e) => e.preventDefault()}
      >
        <h2 className="text-center font-bold text-xl mt-4 mb-2 text-black">
          PERSONAL INFORMATION
        </h2>

        <div className="flex-1 overflow-y-auto max-h-[70vh] px-6 pt-4 pb-6">
          {/* Overseas */}
          <div className="mb-6 flex items-center gap-2">
            <input
              type="checkbox"
              name="isOverseas"
              checked={formData.isOverseas || false}
              onChange={handleChange}
              className="w-5 h-5 accent-yellow-500"
            />
            <label className="text-sm font-semibold text-black">
              I am an Overseas Applicant
            </label>
          </div>

          {formData.isOverseas && (
            <div className="mb-6">
              <label className="block text-sm font-semibold text-black">
                (Optional) Country or Remarks:
              </label>
              <textarea
                name="overseasDetails"
                rows={2}
                value={formData.overseasDetails || ""}
                onChange={handleChange}
                className="w-full border border-gray-400 rounded-lg px-3 py-2 text-black"
              />
            </div>
          )}

          {/* Personal Details */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-semibold text-black">Full Name:</label>
              <input
                name="name"
                value={formData.name || ""}
                onChange={handleChange}
                className={`w-full border rounded-lg px-3 py-2 text-black ${
                  errors.name ? "border-red-500" : "border-gray-400"
                }`}
              />
              {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
            </div>

            <div>
              <label className="text-sm font-semibold text-black">Birthplace:</label>
              <input
                name="birthplace"
                value={formData.birthplace || ""}
                onChange={handleChange}
                className={`w-full border rounded-lg px-3 py-2 text-black ${
                  errors.birthplace ? "border-red-500" : "border-gray-400"
                }`}
              />
              {errors.birthplace && <p className="text-red-500 text-sm mt-1">{errors.birthplace}</p>}
            </div>

            <div>
              <label className="text-sm font-semibold text-black">Birthday:</label>
              <input
                type="date"
                name="birthday"
                value={formData.birthday || ""}
                onChange={handleChange}
                className={`w-full border rounded-lg px-3 py-2 text-black ${
                  errors.birthday ? "border-red-500" : "border-gray-400"
                }`}
              />
            </div>

            <div>
              <label className="text-sm font-semibold text-black">Age:</label>
              <input
                type="number"
                name="age"
                value={formData.age || ""}
                readOnly
                className={`w-full border rounded-lg px-3 py-2 text-black ${
                  errors.age ? "border-red-500" : "border-gray-400"
                }`}
              />
            </div>

            <div>
              <label className="text-sm font-semibold text-black">Gender:</label>
              <select
                name="gender"
                value={formData.gender || ""}
                onChange={handleChange}
                className={`w-full border rounded-lg px-3 py-2 text-black ${
                  errors.gender ? "border-red-500" : "border-gray-400"
                }`}
              >
                <option value="">Select gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Prefer not to say">Prefer not to say</option>
              </select>
            </div>

            <div>
              <label className="text-sm font-semibold text-black">Civil Status:</label>
              <input
                name="civilStatus"
                value={formData.civilStatus || ""}
                onChange={handleChange}
                className={`w-full border rounded-lg px-3 py-2 text-black ${
                  errors.civilStatus ? "border-red-500" : "border-gray-400"
                }`}
              />
            </div>

            <div>
              <label className="text-sm font-semibold text-black">Nationality:</label>
              <input
                name="nationality"
                value={formData.nationality || ""}
                onChange={handleChange}
                className={`w-full border rounded-lg px-3 py-2 text-black ${
                  errors.nationality ? "border-red-500" : "border-gray-400"
                }`}
              />
            </div>

            <div>
              <label className="text-sm font-semibold text-black">Religion:</label>
              <input
                name="religion"
                value={formData.religion || ""}
                onChange={handleChange}
                className={`w-full border rounded-lg px-3 py-2 text-black ${
                  errors.religion ? "border-red-500" : "border-gray-400"
                }`}
              />
            </div>

            <div>
              <label className="text-sm font-semibold text-black">City Address:</label>
              <input
                name="cityAddress"
                value={formData.cityAddress || ""}
                onChange={handleChange}
                className={`w-full border rounded-lg px-3 py-2 text-black ${
                  errors.cityAddress ? "border-red-500" : "border-gray-400"
                }`}
              />
            </div>

            <div>
              <label className="text-sm font-semibold text-black">Permanent Address:</label>
              <input
                name="permanentAddress"
                value={formData.permanentAddress || ""}
                onChange={handleChange}
                className={`w-full border rounded-lg px-3 py-2 text-black ${
                  errors.permanentAddress ? "border-red-500" : "border-gray-400"
                }`}
              />
            </div>

            <div>
              <label className="text-sm font-semibold text-black">Email:</label>
              <input
                type="email"
                name="email"
                value={formData.email || ""}
                onChange={handleChange}
                className={`w-full border rounded-lg px-3 py-2 text-black ${
                  errors.email ? "border-red-500" : "border-gray-400"
                }`}
              />
            </div>

            <div>
              <label className="text-sm font-semibold text-black">Mobile:</label>
              <input
                type="tel"
                name="mobile"
                value={formData.mobile || ""}
                onChange={handleChange}
                className={`w-full border rounded-lg px-3 py-2 text-black ${
                  errors.mobile ? "border-red-500" : "border-gray-400"
                }`}
              />
            </div>

            <div>
              <label className="text-sm font-semibold text-black">Language Spoken:</label>
              <input
                name="language"
                value={formData.language || ""}
                onChange={handleChange}
                className={`w-full border rounded-lg px-3 py-2 text-black ${
                  errors.language ? "border-red-500" : "border-gray-400"
                }`}
              />
            </div>
          </div>

          {/* Emergency Contact */}
          <h3 className="font-semibold text-lg mt-6 mb-2 text-black border-b pb-1">
            Emergency Contact
          </h3>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-semibold text-black">Contact Person Name:</label>
              <input
                name="emergencyContactName"
                value={formData.emergencyContactName || ""}
                onChange={handleChange}
                className={`w-full border rounded-lg px-3 py-2 text-black ${
                  errors.emergencyContactName ? "border-red-500" : "border-gray-400"
                }`}
              />
            </div>
            <div>
              <label className="text-sm font-semibold text-black">Relationship:</label>
              <input
                name="emergencyRelationship"
                value={formData.emergencyRelationship || ""}
                onChange={handleChange}
                className={`w-full border rounded-lg px-3 py-2 text-black ${
                  errors.emergencyRelationship ? "border-red-500" : "border-gray-400"
                }`}
              />
            </div>
            <div>
              <label className="text-sm font-semibold text-black">Address:</label>
              <input
                name="emergencyAddress"
                value={formData.emergencyAddress || ""}
                onChange={handleChange}
                className={`w-full border rounded-lg px-3 py-2 text-black ${
                  errors.emergencyAddress ? "border-red-500" : "border-gray-400"
                }`}
              />
            </div>
            <div>
              <label className="text-sm font-semibold text-black">Contact Number:</label>
              <input
                name="emergencyContactNumber"
                value={formData.emergencyContactNumber || ""}
                onChange={handleChange}
                className={`w-full border rounded-lg px-3 py-2 text-black ${
                  errors.emergencyContactNumber ? "border-red-500" : "border-gray-400"
                }`}
              />
            </div>
          </div>
        </div>

        {/* Navigation Buttons */}
        <div className="flex justify-between px-6 pb-4">
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
            className="bg-yellow-500 text-white font-semibold py-2 px-6 rounded-lg"
          >
            Next →
          </button>
        </div>
      </form>
    </div>
  );
}
