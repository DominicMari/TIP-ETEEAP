"use client";
import React, { useState, ReactNode } from "react";
import { Plus, Minus } from "lucide-react";
import { createClient } from "@supabase/supabase-js";

// --- 1. SETUP SUPABASE CLIENT ---
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "YOUR_SUPABASE_URL";
const supabaseKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "YOUR_SUPABASE_ANON_KEY";
const supabase = createClient(supabaseUrl, supabaseKey);

/* ---------------- Types (Remain the same) ---------------- */
type EducationEntry = {
  schoolName: string;
  schoolAddress: string;
  degreeProgram?: string;
  yearGraduated: string;
  dates: string;
};
type EducationState = {
  tertiary: EducationEntry[];
  secondary: EducationEntry[];
  elementary: EducationEntry[];
  technical: EducationEntry[];
};
type NonFormalEntry = {
  title: string;
  sponsor: string;
  venue: string;
  dates: string;
};
type NonFormalState = NonFormalEntry[];
type CertificationEntry = {
  title: string;
  certifyingBody: string;
  dateCertified: string;
  rating: string;
};
type CertificationState = CertificationEntry[];
type PublicationEntry = {
  title: string;
  circulation: string;
  level: string;
  yearPublished: string;
  yearPresented: string;
};
type PublicationState = PublicationEntry[];
type InventionEntry = {
  title: string;
  agency: string;
  applicationDate: string;
  level: string;
  yearPublished: string;
};
type InventionState = InventionEntry[];
type EmploymentEntry = {
  company: string;
  designation: string;
  dates: string;
  description: string;
};
type ConsultancyEntry = {
  consultancy: string;
  companyAddress: string;
  dates: string;
};
type SelfEmploymentEntry = {
  company: string;
  designation: string;
  reference: string;
  dates: string;
  description: string;
};
type WorkExperienceState = {
  employment: EmploymentEntry[];
  consultancy: ConsultancyEntry[];
  selfEmployment: SelfEmploymentEntry[];
};
type RecognitionEntry = {
  title: string;
  awardingBody: string;
  dates: string;
};
type RecognitionState = RecognitionEntry[];
type MembershipEntry = {
  organization: string;
  designation: string;
  dates: string;
};
type ProjectEntry = {
  title: string;
  designation: string;
  dates: string;
  description: string;
};
type ResearchEntry = {
  title: string;
  institution: string;
  dates: string;
  description: string;
};

/* ---------------- Validation types (fixed) ---------------- */
type FieldErrors = Partial<Record<keyof EducationEntry, string>>;
type EducationErrors = Partial<Record<keyof EducationState, FieldErrors[]>>;
type ValidationErrors = {
  education?: EducationErrors;
};

/* ---------------- Reusable Helper Components ---------------- */

function AccordionItem({
  title,
  children,
  defaultOpen = false,
}: {
  title: string;
  children: ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border rounded-lg mb-4 bg-white shadow-sm">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex justify-between items-center px-4 py-3 font-semibold text-black text-left hover:bg-gray-100"
      >
        {title}
        <span className="text-yellow-500">{open ? "▲" : "▼"}</span>
      </button>
      {open && <div className="px-4 py-4 bg-gray-50">{children}</div>}
    </div>
  );
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="text-red-600 text-sm mt-1">{message}</p>;
}

const NoneCheckbox = ({
  id,
  label,
  checked,
  onChange,
}: {
  id: string;
  label: string;
  checked: boolean;
  onChange: () => void;
}) => (
  <div className="flex items-center mb-4 bg-gray-100 p-3 rounded-md">
    <input
      type="checkbox"
      id={id}
      checked={checked}
      onChange={onChange}
      className="h-4 w-4 rounded border-gray-300 text-yellow-600 focus:ring-yellow-500"
    />
    <label
      htmlFor={id}
      className="ml-3 block text-sm font-medium text-gray-700"
    >
      {label}
    </label>
  </div>
);

/* ---------------- Section C: Formal Education (Updated) ---------------- */
function FormalEducationSection({
  education,
  onChange,
  onAdd,
  onRemove,
  errors,
  hasNoTechnical,
  onHasNoTechnicalChange,
}: {
  education: EducationState;
  onChange: (
    level: keyof EducationState,
    index: number,
    field: keyof EducationEntry,
    value: string
  ) => void;
  onAdd: (level: keyof EducationState) => void;
  onRemove: (level: keyof EducationState, index: number) => void;
  errors?: ValidationErrors["education"];
  hasNoTechnical: boolean;
  onHasNoTechnicalChange: () => void;
}) {
  const levels = [
    { key: "tertiary", label: "Tertiary" },
    { key: "secondary", label: "Secondary" },
    { key: "elementary", label: "Elementary" },
    { key: "technical", label: "Technical/Vocational" },
  ] as const;

  return (
    <div>
      {levels.map(({ key, label }) => {
        const list = education[key];
        const isRequired = key !== "technical";

        return (
          <div key={key} className="mb-8">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-semibold text-black">
                {label}
                {isRequired ? (
                  <span className="text-red-500">*</span>
                ) : (
                  " (Optional)"
                )}
              </h4>
              {list.length === 0 && (!hasNoTechnical || key !== "technical") && (
                <button
                  type="button"
                  onClick={() => onAdd(key)}
                  className="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-2 rounded-lg flex items-center gap-1"
                >
                  <Plus size={16} /> Add
                </button>
              )}
            </div>

            {key === "technical" && (
              <NoneCheckbox
                id="none-technical"
                label="I have no Technical/Vocational education to declare."
                checked={hasNoTechnical}
                onChange={onHasNoTechnicalChange}
              />
            )}

            {(!hasNoTechnical || key !== "technical") &&
              list.map((entry, idx) => (
                <div
                  key={idx}
                  className="bg-gray-50 p-6 rounded-xl shadow mb-4"
                >
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Name of the School{" "}
                        {isRequired && <span className="text-red-500">*</span>}
                      </label>
                      <input
                        type="text"
                        value={entry.schoolName}
                        onChange={(e) =>
                          onChange(key, idx, "schoolName", e.target.value)
                        }
                        className="w-full border border-gray-400 rounded-lg px-3 py-2 text-black bg-white"
                      />
                      <FieldError
                        message={errors?.[key]?.[idx]?.schoolName as string}
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        School Address{" "}
                        {isRequired && <span className="text-red-500">*</span>}
                      </label>
                      <input
                        type="text"
                        value={entry.schoolAddress}
                        onChange={(e) =>
                          onChange(key, idx, "schoolAddress", e.target.value)
                        }
                        className="w-full border border-gray-400 rounded-lg px-3 py-2 text-black bg-white"
                      />
                      <FieldError
                        message={errors?.[key]?.[idx]?.schoolAddress as string}
                      />
                    </div>
                    {key !== "secondary" && key !== "elementary" && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Degree Program{" "}
                          {key === "tertiary" && (
                            <span className="text-red-500">*</span>
                          )}
                        </label>
                        <input
                          type="text"
                          value={entry.degreeProgram || ""}
                          onChange={(e) =>
                            onChange(key, idx, "degreeProgram", e.target.value)
                          }
                          className="w-full border border-gray-400 rounded-lg px-3 py-2 text-black bg-white"
                        />
                        <FieldError
                          message={errors?.[key]?.[idx]?.degreeProgram as string}
                        />
                      </div>
                    )}
                    <div
                      className={
                        key === "secondary" || key === "elementary"
                          ? "col-span-2"
                          : ""
                      }
                    >
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Year Graduated{" "}
                        {isRequired && <span className="text-red-500">*</span>}
                      </label>
                      <input
                        type="text"
                        value={entry.yearGraduated}
                        onChange={(e) =>
                          onChange(key, idx, "yearGraduated", e.target.value)
                        }
                        className="w-full border border-gray-400 rounded-lg px-3 py-2 text-black bg-white"
                      />
                      <FieldError
                        message={errors?.[key]?.[idx]?.yearGraduated as string}
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Inclusive Dates of Attendance{" "}
                        {isRequired && <span className="text-red-500">*</span>}
                      </label>
                      <input
                        type="text"
                        value={entry.dates}
                        onChange={(e) =>
                          onChange(key, idx, "dates", e.target.value)
                        }
                        className="w-full border border-gray-400 rounded-lg px-3 py-2 text-black bg-white"
                      />
                      <FieldError message={errors?.[key]?.[idx]?.dates as string} />
                    </div>
                  </div>
                  <div className="mt-4 flex justify-end gap-2">
                    {idx > 0 && (
                      <button
                        type="button"
                        onClick={() => onRemove(key, idx)}
                        className="bg-red-500 hover:bg-red-600 text-white px-3 py-2 rounded-lg flex items-center gap-1"
                      >
                        <Minus size={16} /> Remove
                      </button>
                    )}
                    {idx === list.length - 1 && (
                      <button
                        type="button"
                        onClick={() => onAdd(key)}
                        className="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-2 rounded-lg flex items-center gap-1"
                      >
                        <Plus size={16} /> Add
                      </button>
                    )}
                  </div>
                </div>
              ))}
          </div>
        );
      })}
    </div>
  );
}

/* --- (All other section components remain unchanged) --- */
function NonFormalEducationSection({
  nonFormal,
  onChange,
  onAdd,
  onRemove,
}: {
  nonFormal: NonFormalState;
  onChange: (index: number, field: keyof NonFormalEntry, value: string) => void;
  onAdd: () => void;
  onRemove: (index: number) => void;
}) {
  return (
    <div>
      {nonFormal.length === 0 && (
        <div className="flex justify-end mb-3">
          <button
            type="button"
            onClick={onAdd}
            className="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-2 rounded-lg flex items-center gap-1"
          >
            <Plus size={16} /> Add
          </button>
        </div>
      )}
      {nonFormal.map((entry, idx) => (
        <div key={idx} className="bg-gray-50 p-6 rounded-xl shadow mb-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Title of Training/Seminar
              </label>
              <input
                type="text"
                value={entry.title}
                onChange={(e) => onChange(idx, "title", e.target.value)}
                className="w-full border border-gray-400 rounded-lg px-3 py-2 text-black bg-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Sponsor
              </label>
              <input
                type="text"
                value={entry.sponsor}
                onChange={(e) => onChange(idx, "sponsor", e.target.value)}
                className="w-full border border-gray-400 rounded-lg px-3 py-2 text-black bg-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Venue
              </label>
              <input
                type="text"
                value={entry.venue}
                onChange={(e) => onChange(idx, "venue", e.target.value)}
                className="w-full border border-gray-400 rounded-lg px-3 py-2 text-black bg-white"
              />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Inclusive Dates
              </label>
              <input
                type="text"
                value={entry.dates}
                onChange={(e) => onChange(idx, "dates", e.target.value)}
                className="w-full border border-gray-400 rounded-lg px-3 py-2 text-black bg-white"
              />
            </div>
          </div>
          <div className="mt-4 flex justify-end gap-2">
            {idx > 0 && (
              <button
                type="button"
                onClick={() => onRemove(idx)}
                className="bg-red-500 hover:bg-red-600 text-white px-3 py-2 rounded-lg flex items-center gap-1"
              >
                <Minus size={16} /> Remove
              </button>
            )}
            {idx === nonFormal.length - 1 && (
              <button
                type="button"
                onClick={onAdd}
                className="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-2 rounded-lg flex items-center gap-1"
              >
                <Plus size={16} /> Add
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
function CertificationSection({
  certifications,
  onChange,
  onAdd,
  onRemove,
}: {
  certifications: CertificationState;
  onChange: (
    idx: number,
    field: keyof CertificationEntry,
    value: string
  ) => void;
  onAdd: () => void;
  onRemove: (idx: number) => void;
}) {
  return (
    <div>
      {certifications.length === 0 && (
        <div className="flex justify-end mb-3">
          <button
            type="button"
            onClick={onAdd}
            className="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-2 rounded-lg flex items-center gap-1"
          >
            <Plus size={16} /> Add
          </button>
        </div>
      )}
      {certifications.map((entry, idx) => (
        <div key={idx} className="bg-gray-50 p-6 rounded-xl shadow mb-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Title of the Certification
              </label>
              <input
                type="text"
                value={entry.title}
                onChange={(e) => onChange(idx, "title", e.target.value)}
                className="w-full border border-gray-400 rounded-lg px-3 py-2 text-black bg-white"
              />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Name and Address of the Certifying Body
              </label>
              <input
                type="text"
                value={entry.certifyingBody}
                onChange={(e) =>
                  onChange(idx, "certifyingBody", e.target.value)
                }
                className="w-full border border-gray-400 rounded-lg px-3 py-2 text-black bg-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date Certified
              </label>
              <input
                type="date"
                value={entry.dateCertified}
                onChange={(e) =>
                  onChange(idx, "dateCertified", e.target.value)
                }
                className="w-full border border-gray-400 rounded-lg px-3 py-2 text-black bg-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Rating
              </label>
              <input
                type="text"
                value={entry.rating}
                onChange={(e) => onChange(idx, "rating", e.target.value)}
                className="w-full border border-gray-400 rounded-lg px-3 py-2 text-black bg-white"
              />
            </div>
          </div>
          <div className="mt-4 flex justify-end gap-2">
            {idx > 0 && (
              <button
                type="button"
                onClick={() => onRemove(idx)}
                className="bg-red-500 hover:bg-red-600 text-white px-3 py-2 rounded-lg flex items-center gap-1"
              >
                <Minus size={16} /> Remove
              </button>
            )}
            {idx === certifications.length - 1 && (
              <button
                type="button"
                onClick={onAdd}
                className="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-2 rounded-lg flex items-center gap-1"
              >
                <Plus size={16} /> Add
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
function PublicationSection({
  publications,
  onChange,
  onAdd,
  onRemove,
}: {
  publications: PublicationState;
  onChange: (
    index: number,
    field: keyof PublicationEntry,
    value: string
  ) => void;
  onAdd: () => void;
  onRemove: (index: number) => void;
}) {
  return (
    <div>
      {publications.length === 0 && (
        <div className="flex justify-end mb-3">
          <button
            type="button"
            onClick={onAdd}
            className="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-2 rounded-lg flex items-center gap-1"
          >
            <Plus size={16} /> Add
          </button>
        </div>
      )}
      {publications.map((pub, idx) => (
        <div key={idx} className="bg-gray-50 p-6 rounded-xl shadow mb-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Title of the Publication
              </label>
              <input
                type="text"
                value={pub.title}
                onChange={(e) => onChange(idx, "title", e.target.value)}
                className="w-full border border-gray-400 rounded-lg px-3 py-2 text-black bg-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Circulation
              </label>
              <input
                type="text"
                value={pub.circulation}
                onChange={(e) => onChange(idx, "circulation", e.target.value)}
                className="w-full border border-gray-400 rounded-lg px-3 py-2 text-black bg-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Level
              </label>
              <select
                value={pub.level}
                onChange={(e) => onChange(idx, "level", e.target.value)}
                className="w-full border border-gray-400 rounded-lg px-3 py-2 text-black bg-white"
              >
                <option value="">Select level</option>
                <option value="Local">Local</option>
                <option value="National">National</option>
                <option value="International">International</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Year Published
              </label>
              <input
                type="text"
                value={pub.yearPublished}
                onChange={(e) =>
                  onChange(idx, "yearPublished", e.target.value)
                }
                className="w-full border border-gray-400 rounded-lg px-3 py-2 text-black bg-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Year Presented
              </label>
              <input
                type="text"
                value={pub.yearPresented}
                onChange={(e) =>
                  onChange(idx, "yearPresented", e.target.value)
                }
                className="w-full border border-gray-400 rounded-lg px-3 py-2 text-black bg-white"
              />
            </div>
          </div>
          <div className="mt-4 flex justify-end gap-2">
            {idx > 0 && (
              <button
                type="button"
                onClick={() => onRemove(idx)}
                className="bg-red-500 hover:bg-red-600 text-white px-3 py-2 rounded-lg flex items-center gap-1"
              >
                <Minus size={16} /> Remove
              </button>
            )}
            {idx === publications.length - 1 && (
              <button
                type="button"
                onClick={onAdd}
                className="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-2 rounded-lg flex items-center gap-1"
              >
                <Plus size={16} /> Add
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
function InventionSection({
  inventions,
  onChange,
  onAdd,
  onRemove,
}: {
  inventions: InventionState;
  onChange: (index: number, field: keyof InventionEntry, value: string) => void;
  onAdd: () => void;
  onRemove: (index: number) => void;
}) {
  return (
    <div>
      {inventions.length === 0 && (
        <div className="flex justify-end mb-3">
          <button
            type="button"
            onClick={onAdd}
            className="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-2 rounded-lg flex items-center gap-1"
          >
            <Plus size={16} /> Add
          </button>
        </div>
      )}
      {inventions.map((inv, idx) => (
        <div key={idx} className="bg-gray-50 p-6 rounded-xl shadow mb-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Title of the Invention/Patent
              </label>
              <input
                type="text"
                value={inv.title}
                onChange={(e) => onChange(idx, "title", e.target.value)}
                className="w-full border border-gray-400 rounded-lg px-3 py-2 text-black bg-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Agency
              </label>
              <input
                type="text"
                value={inv.agency}
                onChange={(e) => onChange(idx, "agency", e.target.value)}
                className="w-full border border-gray-400 rounded-lg px-3 py-2 text-black bg-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Application Date
              </label>
              <input
                type="date"
                value={inv.applicationDate}
                onChange={(e) =>
                  onChange(idx, "applicationDate", e.target.value)
                }
                className="w-full border border-gray-400 rounded-lg px-3 py-2 text-black bg-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Level
              </label>
              <select
                value={inv.level}
                onChange={(e) => onChange(idx, "level", e.target.value)}
                className="w-full border border-gray-400 rounded-lg px-3 py-2 text-black bg-white"
              >
                <option value="">Select level</option>
                <option value="Local">Local</option>
                <option value="National">National</option>
                <option value="International">International</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Year Published
              </label>
              <input
                type="text"
                value={inv.yearPublished}
                onChange={(e) =>
                  onChange(idx, "yearPublished", e.target.value)
                }
                className="w-full border border-gray-400 rounded-lg px-3 py-2 text-black bg-white"
              />
            </div>
          </div>
          <div className="mt-4 flex justify-end gap-2">
            {idx > 0 && (
              <button
                type="button"
                onClick={() => onRemove(idx)}
                className="bg-red-500 hover:bg-red-600 text-white px-3 py-2 rounded-lg flex items-center gap-1"
              >
                <Minus size={16} /> Remove
              </button>
            )}
            {idx === inventions.length - 1 && (
              <button
                type="button"
                onClick={onAdd}
                className="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-2 rounded-lg flex items-center gap-1"
              >
                <Plus size={16} /> Add
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
function WorkExperienceSection({
  work,
  onEmploymentChange,
  onConsultancyChange,
  onSelfEmploymentChange,
  onAdd,
  onRemove,
}: {
  work: WorkExperienceState;
  onEmploymentChange: (
    index: number,
    field: keyof EmploymentEntry,
    value: string
  ) => void;
  onConsultancyChange: (
    index: number,
    field: keyof ConsultancyEntry,
    value: string
  ) => void;
  onSelfEmploymentChange: (
    index: number,
    field: keyof SelfEmploymentEntry,
    value: string
  ) => void;
  onAdd: (type: keyof WorkExperienceState) => void;
  onRemove: (type: keyof WorkExperienceState, index: number) => void;
}) {
  return (
    <div>
      <div className="flex justify-between items-center mb-3">
        <h4 className="font-semibold text-black">
          Employment{" "}
          <span className="italic text-gray-600">
            (from current to previous)
          </span>
        </h4>
        {work.employment.length === 0 && (
          <button
            type="button"
            onClick={() => onAdd("employment")}
            className="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-2 rounded-lg flex items-center gap-1"
          >
            <Plus size={16} /> Add
          </button>
        )}
      </div>
      {work.employment.map((entry, idx) => (
        <div key={idx} className="bg-gray-50 p-6 rounded-xl shadow mb-4">
          <div className="mt-4 flex justify-end gap-2">
            {idx > 0 && (
              <button
                type="button"
                onClick={() => onRemove("employment", idx)}
                className="bg-red-500 hover:bg-red-600 text-white px-3 py-2 rounded-lg flex items-center gap-1"
              >
                <Minus size={16} /> Remove
              </button>
            )}
            {idx === work.employment.length - 1 && (
              <button
                type="button"
                onClick={() => onAdd("employment")}
                className="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-2 rounded-lg flex items-center gap-1"
              >
                <Plus size={16} /> Add
              </button>
            )}
          </div>
        </div>
      ))}
      <div className="flex justify-between items-center mt-6 mb-3">
        <h4 className="font-semibold text-black">Consultancy</h4>
        {work.consultancy.length === 0 && (
          <button
            type="button"
            onClick={() => onAdd("consultancy")}
            className="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-2 rounded-lg flex items-center gap-1"
          >
            <Plus size={16} /> Add
          </button>
        )}
      </div>
      {work.consultancy.map((entry, idx) => (
        <div key={idx} className="bg-gray-50 p-6 rounded-xl shadow mb-4">
          <div className="mt-4 flex justify-end gap-2">
            {idx > 0 && (
              <button
                type="button"
                onClick={() => onRemove("consultancy", idx)}
                className="bg-red-500 hover:bg-red-600 text-white px-3 py-2 rounded-lg flex items-center gap-1"
              >
                <Minus size={16} /> Remove
              </button>
            )}
            {idx === work.consultancy.length - 1 && (
              <button
                type="button"
                onClick={() => onAdd("consultancy")}
                className="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-2 rounded-lg flex items-center gap-1"
              >
                <Plus size={16} /> Add
              </button>
            )}
          </div>
        </div>
      ))}
      <div className="flex justify-between items-center mt-6 mb-3">
        <h4 className="font-semibold text-black">
          Self-Employment{" "}
          <span className="italic text-gray-600">
            (Business Proprietorship)
          </span>
        </h4>
        {work.selfEmployment.length === 0 && (
          <button
            type="button"
            onClick={() => onAdd("selfEmployment")}
            className="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-2 rounded-lg flex items-center gap-1"
          >
            <Plus size={16} /> Add
          </button>
        )}
      </div>
      {work.selfEmployment.map((entry, idx) => (
        <div key={idx} className="bg-gray-50 p-6 rounded-xl shadow mb-4">
          <div className="mt-4 flex justify-end gap-2">
            {idx > 0 && (
              <button
                type="button"
                onClick={() => onRemove("selfEmployment", idx)}
                className="bg-red-500 hover:bg-red-600 text-white px-3 py-2 rounded-lg flex items-center gap-1"
              >
                <Minus size={16} /> Remove
              </button>
            )}
            {idx === work.selfEmployment.length - 1 && (
              <button
                type="button"
                onClick={() => onAdd("selfEmployment")}
                className="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-2 rounded-lg flex items-center gap-1"
              >
                <Plus size={16} /> Add
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
function RecognitionSection({
  recognitions,
  onChange,
  onAdd,
  onRemove,
}: {
  recognitions: RecognitionState;
  onChange: (
    index: number,
    field: keyof RecognitionEntry,
    value: string
  ) => void;
  onAdd: () => void;
  onRemove: (index: number) => void;
}) {
  return (
    <div>
      <p className="italic text-sm text-gray-600 mb-2">
        Describe honors, awards, citations, etc.
      </p>
      {recognitions.length === 0 && (
        <div className="flex justify-end mb-3">
          <button
            type="button"
            onClick={onAdd}
            className="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-2 rounded-lg flex items-center gap-1"
          >
            <Plus size={16} /> Add
          </button>
        </div>
      )}
      {recognitions.map((rec, idx) => (
        <div key={idx} className="bg-gray-50 p-6 rounded-xl shadow mb-4">
          <div className="mt-4 flex justify-end gap-2">
            {idx > 0 && (
              <button
                type="button"
                onClick={() => onRemove(idx)}
                className="bg-red-500 hover:bg-red-600 text-white px-3 py-2 rounded-lg"
              >
                Remove
              </button>
            )}
            {idx === recognitions.length - 1 && (
              <button
                type="button"
                onClick={onAdd}
                className="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-2 rounded-lg"
              >
                Add
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
function ProfessionalDevelopmentSection({
  memberships,
  projects,
  research,
  onChange,
  onAdd,
  onRemove,
}: {
  memberships: MembershipEntry[];
  projects: ProjectEntry[];
  research: ResearchEntry[];
  onChange: (
    category: "memberships" | "projects" | "research",
    index: number,
    field: string,
    value: string
  ) => void;
  onAdd: (category: "memberships" | "projects" | "research") => void;
  onRemove: (
    category: "memberships" | "projects" | "research",
    index: number
  ) => void;
}) {
  return (
    <div className="space-y-8">
      <div>
        <div className="flex justify-between items-center mb-2">
          <h4 className="font-semibold text-black">
            1.{" "}
            <span className="italic">Professional Organization Membership</span>
          </h4>
          {memberships.length === 0 && (
            <button
              type="button"
              onClick={() => onAdd("memberships")}
              className="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-2 rounded-lg"
            >
              Add
            </button>
          )}
        </div>
        {memberships.map((entry, idx) => (
          <div
            key={idx}
            className="bg-gray-50 p-6 rounded-xl shadow mb-4"
          ></div>
        ))}
      </div>
    </div>
  );
}

/* ---------------- Parent Form ---------------- */
export default function BackgroundAchievementsForm({
  formData,
  setFormData,
  nextStep,
  prevStep,
}: {
  formData: any;
  setFormData: any;
  nextStep: () => void;
  prevStep: () => void;
}) {
  // --- Form Data States ---
  const [education, setEducation] = useState<EducationState>({
    tertiary: [
      {
        schoolName: "",
        schoolAddress: "",
        degreeProgram: "",
        yearGraduated: "",
        dates: "",
      },
    ],
    secondary: [
      { schoolName: "", schoolAddress: "", yearGraduated: "", dates: "" },
    ],
    elementary: [
      { schoolName: "", schoolAddress: "", yearGraduated: "", dates: "" },
    ],
    technical: [],
  });
  const [nonFormal, setNonFormal] = useState<NonFormalState>([]);
  const [certifications, setCertifications] = useState<CertificationState>([]);
  const [publications, setPublications] = useState<PublicationState>([]);
  const [inventions, setInventions] = useState<InventionState>([]);
  const [work, setWork] = useState<WorkExperienceState>({
    employment: [],
    consultancy: [],
    selfEmployment: [],
  });
  const [recognitions, setRecognitions] = useState<RecognitionState>([]);
  const [memberships, setMemberships] = useState<MembershipEntry[]>([]);
  const [projects, setProjects] = useState<ProjectEntry[]>([]);
  const [research, setResearch] = useState<ResearchEntry[]>([]);

  // --- State for "None" Toggles ---
  const [hasNoTechnical, setHasNoTechnical] = useState(false);
  const [hasNoNonFormal, setHasNoNonFormal] = useState(false);
  const [hasNoCertifications, setHasNoCertifications] = useState(false);
  const [hasNoPublications, setHasNoPublications] = useState(false);
  const [hasNoInventions, setHasNoInventions] = useState(false);
  const [hasNoWork, setHasNoWork] = useState(false);
  const [hasNoRecognitions, setHasNoRecognitions] = useState(false);
  const [hasNoProfDev, setHasNoProfDev] = useState(false);

  // --- State for Submission and Errors ---
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [errors, setErrors] = useState<ValidationErrors>({});

  /* --- Event Handlers --- */
  const handleNonFormalChange = (
    index: number,
    field: keyof NonFormalEntry,
    value: string
  ) => {
    setNonFormal((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };
  const addNonFormal = () =>
    setNonFormal((prev) => [
      ...prev,
      { title: "", sponsor: "", venue: "", dates: "" },
    ]);
  const removeNonFormal = (index: number) =>
    setNonFormal((prev) => prev.filter((_, i) => i !== index));
  const handleCertificationChange = (
    index: number,
    field: keyof CertificationEntry,
    value: string
  ) => {
    setCertifications((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };
  const addCertification = () =>
    setCertifications((prev) => [
      ...prev,
      { title: "", certifyingBody: "", dateCertified: "", rating: "" },
    ]);
  const removeCertification = (index: number) =>
    setCertifications((prev) => prev.filter((_, i) => i !== index));
  const handleEducationChange = (
    level: keyof EducationState,
    index: number,
    field: keyof EducationEntry,
    value: string
  ) => {
    setEducation((prev) => {
      const updatedLevel = [...prev[level]];
      updatedLevel[index] = { ...updatedLevel[index], [field]: value };
      return { ...prev, [level]: updatedLevel };
    });
  };
  const addEducation = (level: keyof EducationState) => {
    const newEntry: EducationEntry = {
      schoolName: "",
      schoolAddress: "",
      yearGraduated: "",
      dates: "",
    };
    if (level !== "secondary" && level !== "elementary") {
      newEntry.degreeProgram = "";
    }
    setEducation((prev) => ({
      ...prev,
      [level]: [...prev[level], newEntry],
    }));
  };
  const removeEducation = (level: keyof EducationState, index: number) =>
    setEducation((prev) => ({
      ...prev,
      [level]: prev[level].filter((_, i) => i !== index),
    }));
  const handlePublicationChange = (
    index: number,
    field: keyof PublicationEntry,
    value: string
  ) => {
    setPublications((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };
  const addPublication = () =>
    setPublications((prev) => [
      ...prev,
      {
        title: "",
        circulation: "",
        level: "",
        yearPublished: "",
        yearPresented: "",
      },
    ]);
  const removePublication = (index: number) =>
    setPublications((prev) => prev.filter((_, i) => i !== index));
  const handleInventionChange = (
    index: number,
    field: keyof InventionEntry,
    value: string
  ) => {
    setInventions((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };
  const addInvention = () =>
    setInventions((prev) => [
      ...prev,
      {
        title: "",
        agency: "",
        applicationDate: "",
        level: "",
        yearPublished: "",
      },
    ]);
  const removeInvention = (index: number) =>
    setInventions((prev) => prev.filter((_, i) => i !== index));
  const handleEmploymentChange = (
    i: number,
    f: keyof EmploymentEntry,
    v: string
  ) =>
    setWork((prev) => {
      const updated = [...prev.employment];
      updated[i] = { ...updated[i], [f]: v };
      return { ...prev, employment: updated };
    });
  const handleConsultancyChange = (
    i: number,
    f: keyof ConsultancyEntry,
    v: string
  ) =>
    setWork((prev) => {
      const updated = [...prev.consultancy];
      updated[i] = { ...updated[i], [f]: v };
      return { ...prev, consultancy: updated };
    });
  const handleSelfEmploymentChange = (
    i: number,
    f: keyof SelfEmploymentEntry,
    v: string
  ) =>
    setWork((prev) => {
      const updated = [...prev.selfEmployment];
      updated[i] = { ...updated[i], [f]: v };
      return { ...prev, selfEmployment: updated };
    });
  const addWork = (type: keyof WorkExperienceState) =>
    setWork((prev) => {
      const empty: any =
        type === "employment"
          ? { company: "", designation: "", dates: "", description: "" }
          : type === "consultancy"
          ? { consultancy: "", companyAddress: "", dates: "" }
          : {
              company: "",
              designation: "",
              reference: "",
              dates: "",
              description: "",
            };
      return { ...prev, [type]: [...prev[type], empty] };
    });
  const removeWork = (type: keyof WorkExperienceState, idx: number) =>
    setWork((prev) => ({
      ...prev,
      [type]: prev[type].filter((_, i) => i !== idx),
    }));
  const handleRecognitionChange = (
    index: number,
    field: keyof RecognitionEntry,
    value: string
  ) => {
    setRecognitions((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };
  const addRecognition = () =>
    setRecognitions((prev) => [
      ...prev,
      { title: "", awardingBody: "", dates: "" },
    ]);
  const removeRecognition = (index: number) =>
    setRecognitions((prev) => prev.filter((_, i) => i !== index));
  const handleProfessionalDevChange = (
    category: "memberships" | "projects" | "research",
    index: number,
    field: string,
    value: string
  ) => {
    if (category === "memberships") {
      setMemberships((prev) => {
        const updated = [...prev];
        updated[index] = { ...(updated[index] as any), [field]: value } as MembershipEntry;
        return updated;
      });
    } else if (category === "projects") {
      setProjects((prev) => {
        const updated = [...prev];
        updated[index] = { ...(updated[index] as any), [field]: value } as ProjectEntry;
        return updated;
      });
    } else {
      setResearch((prev) => {
        const updated = [...prev];
        updated[index] = { ...(updated[index] as any), [field]: value } as ResearchEntry;
        return updated;
      });
    }
  };
  const addProfessionalDev = (
    category: "memberships" | "projects" | "research"
  ) => {
    if (category === "memberships") {
      setMemberships((prev) => [
        ...prev,
        { organization: "", designation: "", dates: "" },
      ]);
    } else if (category === "projects") {
      setProjects((prev) => [
        ...prev,
        { title: "", designation: "", dates: "", description: "" },
      ]);
    } else {
      setResearch((prev) => [
        ...prev,
        { title: "", institution: "", dates: "", description: "" },
      ]);
    }
  };
  const removeProfessionalDev = (
    category: "memberships" | "projects" | "research",
    index: number
  ) => {
    if (category === "memberships") {
      setMemberships((prev) => prev.filter((_, i) => i !== index));
    } else if (category === "projects") {
      setProjects((prev) => prev.filter((_, i) => i !== index));
    } else {
      setResearch((prev) => prev.filter((_, i) => i !== index));
    }
  };

  /* --- Navigation & Submission --- */
  const handleBack = () => prevStep();

  const validateForm = (): boolean => {
    const newErrors: ValidationErrors = { education: {} };
    let isValid = true;
    const requiredLevels: (keyof EducationState)[] = [
      "tertiary",
      "secondary",
      "elementary",
    ];
    requiredLevels.forEach((level) => {
      newErrors.education![level] = [];
      education[level].forEach((entry, index) => {
        const entryErrors: any = {};
        if (!entry.schoolName.trim()) {
          entryErrors.schoolName = "School name is required.";
          isValid = false;
        }
        if (!entry.schoolAddress.trim()) {
          entryErrors.schoolAddress = "School address is required.";
          isValid = false;
        }
        if (!entry.yearGraduated.trim()) {
          entryErrors.yearGraduated = "Year graduated is required.";
          isValid = false;
        }
        if (!entry.dates.trim()) {
          entryErrors.dates = "Attendance dates are required.";
          isValid = false;
        }
        if (level === "tertiary" && !entry.degreeProgram?.trim()) {
          entryErrors.degreeProgram = "Degree program is required.";
          isValid = false;
        }
        newErrors.education![level]![index] = entryErrors;
      });
    });
    setErrors(newErrors);
    return isValid;
  };

  // This function now correctly saves the data to the parent state and moves to the next step.
  // It no longer tries to submit to Supabase.
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    setSubmitError(null);

    // Run your validation first
    if (!validateForm()) {
      setSubmitError(
        "Please fill in all required fields marked with an asterisk (*)."
      );
      return;
    }

    setIsSubmitting(true);

    // Prepare all the data from this step's internal state
    const finalEducationData = { ...education };
    if (hasNoTechnical) {
      finalEducationData.technical = [];
    }

    const professional_development = {
      memberships: hasNoProfDev ? [] : memberships,
      projects: hasNoProfDev ? [] : projects,
      research: hasNoProfDev ? [] : research,
    };

    // Update the main state in appform/page.tsx using the setFormData prop
    setFormData((prev: any) => ({
      ...prev,
      // This saves all the data from this step into the main state
      education_background: finalEducationData,
      non_formal_education: hasNoNonFormal ? [] : nonFormal,
      certifications: hasNoCertifications ? [] : certifications,
      publications: hasNoPublications ? [] : publications,
      inventions: hasNoInventions ? [] : inventions,
      work_experiences: hasNoWork ? [] : work,
      recognitions: hasNoRecognitions ? [] : recognitions,
      professional_development: professional_development,
    }));

    // We're done! Move to the next step.
    setIsSubmitting(false);
    nextStep();
  };

  return (
    <div className="min-h-screen flex justify-center items-center bg-gray-100 p-6">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSubmit(e);
        }}
        className="bg-white shadow-lg rounded-2xl flex flex-col overflow-y-auto"
        style={{ width: "896px", height: "803.5px" }}
      >
        <h2 className="text-center font-bold text-xl mt-4 mb-2 text-black">
          APPLICATION FORM AND PRELIMINARY ASSESSMENT FORM
        </h2>
        <div className="bg-yellow-100 text-black px-6 py-3 rounded-lg text-sm mb-4 flex items-center gap-2 mx-auto w-auto whitespace-nowrap shadow">
          <span>⚠️</span>
          <span>
            All information indicated herein shall be certified true and correct
          </span>
        </div>
        {submitError && (
          <div className="text-red-600 bg-red-100 p-3 rounded-lg mx-6 text-center">
            {submitError}
          </div>
        )}

        <div className="flex-1 overflow-y-auto mb-2 max-h-[70vh] px-6 pt-2 pb-4 scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-100">
          <AccordionItem title="C. Educational Background" defaultOpen>
            <FormalEducationSection
              education={education}
              onChange={handleEducationChange}
              onAdd={addEducation}
              onRemove={removeEducation}
              errors={errors.education}
              hasNoTechnical={hasNoTechnical}
              onHasNoTechnicalChange={() => setHasNoTechnical(!hasNoTechnical)}
            />
            <hr className="my-6" />
            <h4 className="font-semibold text-black mb-2">
              Non-Formal Education (Optional)
            </h4>
            <NoneCheckbox
              id="none-nonformal"
              label="I have no Non-Formal Education to declare."
              checked={hasNoNonFormal}
              onChange={() => setHasNoNonFormal(!hasNoNonFormal)}
            />
            {!hasNoNonFormal && (
              <NonFormalEducationSection
                nonFormal={nonFormal}
                onChange={handleNonFormalChange}
                onAdd={addNonFormal}
                onRemove={removeNonFormal}
              />
            )}
            <hr className="my-6" />
            <h4 className="font-semibold text-black mb-2">
              Other Certifications (Optional)
            </h4>
            <NoneCheckbox
              id="none-certs"
              label="I have no Certifications to declare."
              checked={hasNoCertifications}
              onChange={() => setHasNoCertifications(!hasNoCertifications)}
            />
            {!hasNoCertifications && (
              <CertificationSection
                certifications={certifications}
                onChange={handleCertificationChange}
                onAdd={addCertification}
                onRemove={removeCertification}
              />
            )}
          </AccordionItem>

          <AccordionItem title="D. Publication (Optional)">
            <NoneCheckbox
              id="none-publications"
              label="I have no Publications to declare."
              checked={hasNoPublications}
              onChange={() => setHasNoPublications(!hasNoPublications)}
            />
            {!hasNoPublications && (
              <PublicationSection
                publications={publications}
                onChange={handlePublicationChange}
                onAdd={addPublication}
                onRemove={removePublication}
              />
            )}
          </AccordionItem>

          <AccordionItem title="E. Invention/Patent (Optional)">
            <NoneCheckbox
              id="none-inventions"
              label="I have no Inventions/Patents to declare."
              checked={hasNoInventions}
              onChange={() => setHasNoInventions(!hasNoInventions)}
            />
            {!hasNoInventions && (
              <InventionSection
                inventions={inventions}
                onChange={handleInventionChange}
                onAdd={addInvention}
                onRemove={removeInvention}
              />
            )}
          </AccordionItem>

          <AccordionItem title="F. Work Experiences (Optional)">
            <NoneCheckbox
              id="none-work"
              label="I have no Work Experience to declare."
              checked={hasNoWork}
              onChange={() => setHasNoWork(!hasNoWork)}
            />
            {!hasNoWork && (
              <WorkExperienceSection
                work={work}
                onEmploymentChange={handleEmploymentChange}
                onConsultancyChange={handleConsultancyChange}
                onSelfEmploymentChange={handleSelfEmploymentChange}
                onAdd={addWork}
                onRemove={removeWork}
              />
            )}
          </AccordionItem>

          <AccordionItem title="G. Recognitions Received (Optional)">
            <NoneCheckbox
              id="none-recognitions"
              label="I have no Recognitions to declare."
              checked={hasNoRecognitions}
              onChange={() => setHasNoRecognitions(!hasNoRecognitions)}
            />
            {!hasNoRecognitions && (
              <RecognitionSection
                recognitions={recognitions}
                onChange={handleRecognitionChange}
                onAdd={addRecognition}
                onRemove={removeRecognition}
              />
            )}
          </AccordionItem>

          <AccordionItem title="H. Professional Development Activities (Optional)">
            <NoneCheckbox
              id="none-profdev"
              label="I have no Professional Development Activities to declare."
              checked={hasNoProfDev}
              onChange={() => setHasNoProfDev(!hasNoProfDev)}
            />
            {!hasNoProfDev && (
              <ProfessionalDevelopmentSection
                memberships={memberships}
                projects={projects}
                research={research}
                onChange={handleProfessionalDevChange}
                onAdd={addProfessionalDev}
                onRemove={removeProfessionalDev}
              />
            )}
          </AccordionItem>
        </div>

        <div className="flex justify-between mt-2 px-6 pb-4">
          <button
            type="button"
            onClick={handleBack}
            disabled={isSubmitting}
            className="bg-gray-300 text-black font-semibold py-2 px-6 rounded-lg hover:bg-gray-400 transition-colors disabled:opacity-50"
          >
            ← Back
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="bg-yellow-500 text-white font-semibold py-2 px-6 rounded-lg hover:bg-yellow-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? "Submitting..." : "Next →"}
          </button>
        </div>
      </form>
    </div>
  );
}