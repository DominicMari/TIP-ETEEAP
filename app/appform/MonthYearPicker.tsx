"use client";

import { useState, useEffect } from "react";

interface MonthYearPickerProps {
  value: string; // Format: "YYYY-MM" or "YYYY-MM-DD"
  onChange: (value: string) => void;
  label?: string;
  required?: boolean;
  error?: string;
  maxDate?: string; // Format: "YYYY-MM-DD"
  minDate?: string; // Format: "YYYY-MM-DD"
}

export default function MonthYearPicker({
  value,
  onChange,
  label,
  required = false,
  error,
  maxDate,
  minDate,
}: MonthYearPickerProps) {
  const [month, setMonth] = useState("");
  const [year, setYear] = useState("");

  // Parse the value on mount and when it changes
  useEffect(() => {
    if (value) {
      const parts = value.split("-");
      if (parts.length >= 2) {
        setYear(parts[0]);
        setMonth(parts[1]);
      }
    }
  }, [value]);

  const handleMonthChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newMonth = e.target.value;
    setMonth(newMonth);
    if (year) {
      onChange(`${year}-${newMonth.padStart(2, "0")}`);
    }
  };

  const handleYearChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newYear = e.target.value;
    setYear(newYear);
    if (month && newYear.length === 4) {
      onChange(`${newYear}-${month.padStart(2, "0")}`);
    }
  };

  // Parse max and min dates to get constraints
  const getMaxYear = () => {
    if (!maxDate) {
      const today = new Date();
      return today.getFullYear().toString();
    }
    return maxDate.split("-")[0];
  };

  const getMinYear = () => {
    if (!minDate) {
      return "1900";
    }
    return minDate.split("-")[0];
  };

  const maxYear = parseInt(getMaxYear());
  const minYear = parseInt(getMinYear());

  const currentYear = new Date().getFullYear();
  const years = Array.from(
    { length: maxYear - minYear + 1 },
    (_, i) => (maxYear - i).toString()
  );

  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-semibold text-black mb-2">
          {label}
          {required && <span className="text-red-500">*</span>}
        </label>
      )}
      <div className="flex gap-2">
        {/* Month Dropdown */}
        <select
          value={month}
          onChange={handleMonthChange}
          className={`flex-1 border rounded-lg p-2 text-black ${
            error ? "border-red-500" : "border-gray-400"
          }`}
        >
          <option value="">Month</option>
          <option value="01">January</option>
          <option value="02">February</option>
          <option value="03">March</option>
          <option value="04">April</option>
          <option value="05">May</option>
          <option value="06">June</option>
          <option value="07">July</option>
          <option value="08">August</option>
          <option value="09">September</option>
          <option value="10">October</option>
          <option value="11">November</option>
          <option value="12">December</option>
        </select>

        {/* Year Input */}
        <input
          type="number"
          value={year}
          onChange={handleYearChange}
          min={minYear}
          max={maxYear}
          placeholder="Year"
          className={`flex-1 border rounded-lg p-2 text-black ${
            error ? "border-red-500" : "border-gray-400"
          }`}
        />
      </div>
      {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
    </div>
  );
}
