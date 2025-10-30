//missing page

"use client";
import { useState } from "react";
import { Plus, Minus } from "lucide-react";
import { createClient } from "@supabase/supabase-js";

// --- 1. SETUP SUPABASE CLIENT ---
// Replace with your actual Supabase project URL and anon key
// IMPORTANT: Use environment variables for these in a real application!
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "YOUR_SUPABASE_URL";
const supabaseKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "YOUR_SUPABASE_ANON_KEY";
const supabase = createClient(supabaseUrl, supabaseKey);

/* ---------------- Accordion ---------------- */
function AccordionItem({
  title,
  children,
  defaultOpen = false,
}: {
  title: string;
  children: React.ReactNode;
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

/* ---------------- Types ---------------- */
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

/* ---------------- (All your section components remain the same) ---------------- */
// FormalEducationSection, NonFormalEducationSection, CertificationSection, etc.
// ... (The components from your previous code go here) ...
/* ---------------- Section C: Formal Education ---------------- */
function FormalEducationSection({
  education,
  onChange,
  onAdd,
  onRemove,
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
}) {
  const levels = [
    { key: "tertiary", label: "Tertiary" },
    { key: "secondary", label: "Secondary" },
    { key: "elementary", label: "Elementary" },
    { key: "technical", label: "Technical/Vocational" },
  ] as const;

  return (
    <div>
      {/* Render Tertiary, Secondary, Elementary, Technical */}
      {levels.map(({ key, label }) => {
        const list = education[key];
        return (
          <div key={key} className="mb-8">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-semibold text-black">{label}</h4>
              {list.length === 0 && (
                <button
                  type="button"
                  onClick={() => onAdd(key)}
                  className="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-2 rounded-lg flex items-center gap-1"
                >
                  <Plus size={16} /> Add
                </button>
              )}
            </div>

            {list.map((entry, idx) => (
              <div key={idx} className="bg-gray-50 p-6 rounded-xl shadow mb-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Name of the School
                    </label>
                    <input
                      type="text"
                      value={entry.schoolName}
                      onChange={(e) =>
                        onChange(key, idx, "schoolName", e.target.value)
                      }
                      className="w-full border border-gray-400 rounded-lg px-3 py-2 text-black bg-white"
                    />
                  </div>

                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      School Address
                    </label>
                    <input
                      type="text"
                      value={entry.schoolAddress}
                      onChange={(e) =>
                        onChange(key, idx, "schoolAddress", e.target.value)
                      }
                      className="w-full border border-gray-400 rounded-lg px-3 py-2 text-black bg-white"
                    />
                  </div>

                  {/* START: Conditionally render Degree Program */}
                  {key !== "secondary" && key !== "elementary" && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Degree Program
                      </label>
                      <input
                        type="text"
                        value={entry.degreeProgram || ""}
                        onChange={(e) =>
                          onChange(key, idx, "degreeProgram", e.target.value)
                        }
                        className="w-full border border-gray-400 rounded-lg px-3 py-2 text-black bg-white"
                      />
                    </div>
                  )}
                  {/* END: Conditionally render Degree Program */}

                  {/* Adjust grid span for Year Graduated if Degree Program is hidden */}
                  <div
                    className={
                      key === "secondary" || key === "elementary"
                        ? "col-span-2"
                        : ""
                    }
                  >
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Year Graduated
                    </label>
                    <input
                      type="text"
                      value={entry.yearGraduated}
                      onChange={(e) =>
                        onChange(key, idx, "yearGraduated", e.target.value)
                      }
                      className="w-full border border-gray-400 rounded-lg px-3 py-2 text-black bg-white"
                    />
                  </div>

                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Inclusive Dates of Attendance
                    </label>
                    <input
                      type="text"
                      value={entry.dates}
                      onChange={(e) =>
                        onChange(key, idx, "dates", e.target.value)
                      }
                      className="w-full border border-gray-400 rounded-lg px-3 py-2 text-black bg-white"
                    />
                  </div>
                </div>

                {/* Buttons aligned bottom-right */}
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

/* ---------------- Section C.2: Non-Formal Education ---------------- */
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
/* ---------------- Section C.3: Certifications ---------------- */
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
    <div className="mb-8">
      <div className="flex items-center justify-between mb-3">
        <h4 className="font-semibold text-black">
          Other Certification Credentials / Eligibility
        </h4>

        {certifications.length === 0 && (
          <button
            type="button"
            onClick={onAdd}
            className="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-2 rounded-lg flex items-center gap-1"
          >
            <Plus size={16} /> Add
          </button>
        )}
      </div>

      {certifications.map((entry, idx) => (
        <div key={idx} className="bg-gray-50 p-6 rounded-xl shadow mb-4">
          <div className="grid grid-cols-2 gap-4">
            {/* Title of the certification */}
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

            {/* Certifying Body */}
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

            {/* Date Certified */}
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

            {/* Rating */}
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

          {/* Buttons */}
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

/* ---------------- Section D: Publication ---------------- */
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
      {publications.map((pub, idx) => (
        <div key={idx} className="bg-gray-50 p-6 rounded-xl shadow mb-4">
          <div className="grid grid-cols-2 gap-4">
            {/* Title (full width) */}
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

            {/* Circulation (left) */}
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

            {/* Level (right, select) */}
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

            {/* Year Published (left) */}
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

            {/* Year Presented (right) */}
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

          {/* Buttons aligned bottom-right */}
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
/* ---------------- Section E: Invention/Patent ---------------- */
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

          {/* Buttons */}
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

/* ---------------- Section F: Work Experiences ---------------- */
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
      {/* 1. Employment */}
      <h4 className="font-semibold text-black mb-3">
        Employment{" "}
        <span className="italic text-gray-600">
          (i.e., from current to previous employment)
        </span>
      </h4>
      {work.employment.map((entry, idx) => (
        <div key={idx} className="bg-gray-50 p-6 rounded-xl shadow mb-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Company / Address
              </label>
              <input
                type="text"
                value={entry.company}
                onChange={(e) =>
                  onEmploymentChange(idx, "company", e.target.value)
                }
                className="w-full border border-gray-400 rounded-lg px-3 py-2 text-black bg-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Designation / Position
              </label>
              <input
                type="text"
                value={entry.designation}
                onChange={(e) =>
                  onEmploymentChange(idx, "designation", e.target.value)
                }
                className="w-full border border-gray-400 rounded-lg px-3 py-2 text-black bg-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Inclusive Dates of Attendance
              </label>
              <input
                type="text"
                value={entry.dates}
                onChange={(e) =>
                  onEmploymentChange(idx, "dates", e.target.value)
                }
                className="w-full border border-gray-400 rounded-lg px-3 py-2 text-black bg-white"
              />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Brief Description
              </label>
              <textarea
                value={entry.description}
                onChange={(e) =>
                  onEmploymentChange(idx, "description", e.target.value)
                }
                className="w-full border border-gray-400 rounded-lg px-3 py-2 text-black bg-white min-h-[80px]"
              />
            </div>
          </div>

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

      {/* 2. Consultancy */}
      <h4 className="font-semibold text-black mt-6 mb-3">Consultancy</h4>
      {work.consultancy.map((entry, idx) => (
        <div key={idx} className="bg-gray-50 p-6 rounded-xl shadow mb-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Consultancies
              </label>
              <input
                type="text"
                value={entry.consultancy}
                onChange={(e) =>
                  onConsultancyChange(idx, "consultancy", e.target.value)
                }
                className="w-full border border-gray-400 rounded-lg px-3 py-2 text-black bg-white"
              />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Name and Address of the Company
              </label>
              <input
                type="text"
                value={entry.companyAddress}
                onChange={(e) =>
                  onConsultancyChange(idx, "companyAddress", e.target.value)
                }
                className="w-full border border-gray-400 rounded-lg px-3 py-2 text-black bg-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Inclusive Dates of Attendance
              </label>
              <input
                type="text"
                value={entry.dates}
                onChange={(e) =>
                  onConsultancyChange(idx, "dates", e.target.value)
                }
                className="w-full border border-gray-400 rounded-lg px-3 py-2 text-black bg-white"
              />
            </div>
          </div>

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

      {/* 3. Self-Employment */}
      <h4 className="font-semibold text-black mt-6 mb-3">
        Self-Employment{" "}
        <span className="italic text-gray-600">(Business Proprietorship)</span>
      </h4>
      {work.selfEmployment.map((entry, idx) => (
        <div key={idx} className="bg-gray-50 p-6 rounded-xl shadow mb-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Company / Address
              </label>
              <input
                type="text"
                value={entry.company}
                onChange={(e) =>
                  onSelfEmploymentChange(idx, "company", e.target.value)
                }
                className="w-full border border-gray-400 rounded-lg px-3 py-2 text-black bg-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Designation / Position
              </label>
              <input
                type="text"
                value={entry.designation}
                onChange={(e) =>
                  onSelfEmploymentChange(idx, "designation", e.target.value)
                }
                className="w-full border border-gray-400 rounded-lg px-3 py-2 text-black bg-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Reference Person & Contact No.
              </label>
              <input
                type="text"
                value={entry.reference}
                onChange={(e) =>
                  onSelfEmploymentChange(idx, "reference", e.target.value)
                }
                className="w-full border border-gray-400 rounded-lg px-3 py-2 text-black bg-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Inclusive Dates of Attendance
              </label>
              <input
                type="text"
                value={entry.dates}
                onChange={(e) =>
                  onSelfEmploymentChange(idx, "dates", e.target.value)
                }
                className="w-full border border-gray-400 rounded-lg px-3 py-2 text-black bg-white"
              />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Brief Description
              </label>
              <textarea
                value={entry.description}
                onChange={(e) =>
                  onSelfEmploymentChange(idx, "description", e.target.value)
                }
                className="w-full border border-gray-400 rounded-lg px-3 py-2 text-black bg-white minnpm-h-[80px]"
              />
            </div>
          </div>

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

/* ---------------- Section G: Recognition Received ---------------- */
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
        Please describe all the honors, awards, citations, and recognitions
        received from school, community and civic organizations, as well as
        citations for work excellence, outstanding accomplishments, community
        service, etc.
      </p>

      {recognitions.map((rec, idx) => (
        <div key={idx} className="bg-gray-50 p-6 rounded-xl shadow mb-4">
          <div className="grid grid-cols-2 gap-4">
            {/* Title with placeholder hint */}
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Title of Recognition
              </label>
              <input
                type="text"
                placeholder="e.g., Honor, Award, Citation, Recognition, etc."
                value={rec.title}
                onChange={(e) => onChange(idx, "title", e.target.value)}
                className="w-full border border-gray-400 rounded-lg px-3 py-2 text-black bg-white"
              />
            </div>

            {/* Awarding body */}
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Name and Address of the Awarding Body
              </label>
              <input
                type="text"
                value={rec.awardingBody}
                onChange={(e) => onChange(idx, "awardingBody", e.target.value)}
                className="w-full border border-gray-400 rounded-lg px-3 py-2 text-black bg-white"
              />
            </div>

            {/* Inclusive dates */}
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Inclusive Dates
              </label>
              <input
                type="text"
                value={rec.dates}
                onChange={(e) => onChange(idx, "dates", e.target.value)}
                className="w-full border border-gray-400 rounded-lg px-3 py-2 text-black bg-white"
              />
            </div>
          </div>

          {/* Buttons */}
          <div className="mt-4 flex justify-end gap-2">
            {idx > 0 && (
              <button
                type="button"
                onClick={() => onRemove(idx)}
                className="bg-red-500 hover:bg-red-600 text-white px-3 py-2 rounded-lg flex items-center gap-1"
              >
                Remove
              </button>
            )}
            {idx === recognitions.length - 1 && (
              <button
                type="button"
                onClick={onAdd}
                className="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-2 rounded-lg flex items-center gap-1"
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
/* ---------------- Section H: PDA ---------------- */
/* ---------------- Section H: Professional Development Activities ---------------- */
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
      {/* 1. Memberships */}
      <div>
        <h4 className="font-semibold text-black mb-2">
          1. <span className="italic">Professional Organization Membership</span>
        </h4>
        {memberships.map((entry, idx) => (
          <div key={idx} className="bg-gray-50 p-6 rounded-xl shadow mb-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Organization
                </label>
                <input
                  type="text"
                  value={entry.organization}
                  onChange={(e) =>
                    onChange("memberships", idx, "organization", e.target.value)
                  }
                  className="w-full border border-gray-400 rounded-lg px-3 py-2 text-black bg-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Designation
                </label>
                <input
                  type="text"
                  value={entry.designation}
                  onChange={(e) =>
                    onChange("memberships", idx, "designation", e.target.value)
                  }
                  className="w-full border border-gray-400 rounded-lg px-3 py-2 text-black bg-white"
                />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Inclusive Dates of Attendance
                </label>
                <input
                  type="text"
                  value={entry.dates}
                  onChange={(e) =>
                    onChange("memberships", idx, "dates", e.target.value)
                  }
                  className="w-full border border-gray-400 rounded-lg px-3 py-2 text-black bg-white"
                />
              </div>
            </div>
            {/* Buttons */}
            <div className="mt-4 flex justify-end gap-2">
              {idx > 0 && (
                <button
                  type="button"
                  onClick={() => onRemove("memberships", idx)}
                  className="bg-red-500 hover:bg-red-600 text-white px-3 py-2 rounded-lg"
                >
                  Remove
                </button>
              )}
              {idx === memberships.length - 1 && (
                <button
                  type="button"
                  onClick={() => onAdd("memberships")}
                  className="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-2 rounded-lg"
                >
                  Add
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* 2. Projects */}
      <div>
        <h4 className="font-semibold text-black mb-2">
          2. Project Management/Involvement
        </h4>
        {projects.map((entry, idx) => (
          <div key={idx} className="bg-gray-50 p-6 rounded-xl shadow mb-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Title of the Project
                </label>
                <input
                  type="text"
                  value={entry.title}
                  onChange={(e) =>
                    onChange("projects", idx, "title", e.target.value)
                  }
                  className="w-full border border-gray-400 rounded-lg px-3 py-2 text-black bg-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Designation
                </label>
                <input
                  type="text"
                  value={entry.designation}
                  onChange={(e) =>
                    onChange("projects", idx, "designation", e.target.value)
                  }
                  className="w-full border border-gray-400 rounded-lg px-3 py-2 text-black bg-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Inclusive Dates of Attendance
                </label>
                <input
                  type="text"
                  value={entry.dates}
                  onChange={(e) =>
                    onChange("projects", idx, "dates", e.target.value)
                  }
                  className="w-full border border-gray-400 rounded-lg px-3 py-2 text-black bg-white"
                />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Brief Description
                </label>
                <textarea
                  value={entry.description}
                  onChange={(e) =>
                    onChange("projects", idx, "description", e.target.value)
                  }
                  className="w-full border border-gray-400 rounded-lg px-3 py-2 text-black bg-white"
                  rows={3}
                />
              </div>
            </div>
            {/* Buttons */}
            <div className="mt-4 flex justify-end gap-2">
              {idx > 0 && (
                <button
                  type="button"
                  onClick={() => onRemove("projects", idx)}
                  className="bg-red-500 hover:bg-red-600 text-white px-3 py-2 rounded-lg"
                >
                  Remove
                </button>
              )}
              {idx === projects.length - 1 && (
                <button
                  type="button"
                  onClick={() => onAdd("projects")}
                  className="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-2 rounded-lg"
                >
                  Add
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* 3. Research */}
      <div>
        <h4 className="font-semibold text-black mb-2">
          3.{" "}
          <span className="italic">
            Research and Development, Strategic Plans, etc.
          </span>
        </h4>
        {research.map((entry, idx) => (
          <div key={idx} className="bg-gray-50 p-6 rounded-xl shadow mb-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Title
                </label>
                <input
                  type="text"
                  value={entry.title}
                  onChange={(e) =>
                    onChange("research", idx, "title", e.target.value)
                  }
                  className="w-full border border-gray-400 rounded-lg px-3 py-2 text-black bg-white"
                />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Name and Address of Institution/Agency
                </label>
                <input
                  type="text"
                  value={entry.institution}
                  onChange={(e) =>
                    onChange("research", idx, "institution", e.target.value)
                  }
                  className="w-full border border-gray-400 rounded-lg px-3 py-2 text-black bg-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Inclusive Dates
                </label>
                <input
                  type="text"
                  value={entry.dates}
                  onChange={(e) =>
                    onChange("research", idx, "dates", e.target.value)
                  }
                  className="w-full border border-gray-400 rounded-lg px-3 py-2 text-black bg-white"
                />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Brief Description
                </label>
                <textarea
                  value={entry.description}
                  onChange={(e) =>
                    onChange("research", idx, "description", e.target.value)
                  }
                  className="w-full border border-gray-400 rounded-lg px-3 py-2 text-black bg-white"
                  rows={3}
                />
              </div>
            </div>
            {/* Buttons */}
            <div className="mt-4 flex justify-end gap-2">
              {idx > 0 && (
                <button
                  type="button"
                  onClick={() => onRemove("research", idx)}
                  className="bg-red-500 hover:bg-red-600 text-white px-3 py-2 rounded-lg"
                >
                  Remove
                </button>
              )}
              {idx === research.length - 1 && (
                <button
                  type="button"
                  onClick={() => onAdd("research")}
                  className="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-2 rounded-lg"
                >
                  Add
                </button>
              )}
            </div>
          </div>
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
  formData: any; // This should contain data from previous steps
  setFormData: any;
  nextStep: () => void;
  prevStep: () => void;
}) {
  // All your existing state hooks...
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
    technical: [
      {
        schoolName: "",
        schoolAddress: "",
        degreeProgram: "",
        yearGraduated: "",
        dates: "",
      },
    ],
  });
  const [nonFormal, setNonFormal] = useState<NonFormalState>([
    { title: "", sponsor: "", venue: "", dates: "" },
  ]);
  const [certifications, setCertifications] = useState<CertificationState>([]);
  const [publications, setPublications] = useState<PublicationState>([
    {
      title: "",
      circulation: "",
      level: "",
      yearPublished: "",
      yearPresented: "",
    },
  ]);
  const [inventions, setInventions] = useState<InventionState>([
    {
      title: "",
      agency: "",
      applicationDate: "",
      level: "",
      yearPublished: "",
    },
  ]);
  const [work, setWork] = useState<WorkExperienceState>({
    employment: [{ company: "", designation: "", dates: "", description: "" }],
    consultancy: [{ consultancy: "", companyAddress: "", dates: "" }],
    selfEmployment: [
      {
        company: "",
        designation: "",
        reference: "",
        dates: "",
        description: "",
      },
    ],
  });
  const [recognitions, setRecognitions] = useState<RecognitionState>([
    { title: "", awardingBody: "", dates: "" },
  ]);
  const [memberships, setMemberships] = useState<MembershipEntry[]>([
    { organization: "", designation: "", dates: "" },
  ]);
  const [projects, setProjects] = useState<ProjectEntry[]>([
    { title: "", designation: "", dates: "", description: "" },
  ]);
  const [research, setResearch] = useState<ResearchEntry[]>([
    { title: "", institution: "", dates: "", description: "" },
  ]);

  // All your existing handlers...
  // handleEducationChange, addEducation, etc.
  // ...
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

  // C.3 Certification
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

  // D. Publication
  /* --- Education handlers --- */
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

  /* --- Publication handlers --- */
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

  /* --- Invention handlers --- */
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

  /* --- WorkEXP handlers --- */
  // handlers
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

  // G. Recognitions
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

  /* ---------------- Handlers for Section H ---------------- */
  const handleProfessionalDevChange = (
    category: "memberships" | "projects" | "research",
    index: number,
    field: string,
    value: string
  ) => {
    if (category === "memberships") {
      setMemberships((prev) => {
        const updated = [...prev];
        updated[index] = { ...updated[index], [field]: value };
        return updated;
      });
    } else if (category === "projects") {
      setProjects((prev) => {
        const updated = [...prev];
        updated[index] = { ...updated[index], [field]: value };
        return updated;
      });
    } else {
      setResearch((prev) => {
        const updated = [...prev];
        updated[index] = { ...updated[index], [field]: value };
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

  // --- 2. ADD LOADING AND ERROR STATE ---
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  /* --- Nav --- */
  const handleBack = () => prevStep();

  // --- 3. CREATE SUBMISSION HANDLER ---
  // PASTE THIS ENTIRE FUNCTION INTO d.tsx, REPLACING THE OLD ONE

// --- 3. CREATE SUBMISSION HANDLER ---
const handleSubmit = async () => {
  setIsSubmitting(true);
  setSubmitError(null);

  // Combine professional development states into one object
  const professional_development = {
    memberships,
    projects,
    research,
  };

  // ✅ FIX: Destructure ALL properties from formData and map them to their
  // correct snake_case database column names, according to your schema.
  const {
    // These are the likely camelCase names from your previous form steps
    applicantName,
    degreeAppliedFor,
    campus,
    folderLink,
    photoUrl,
    fullAddress,
    mobileNumber,
    emailAddress,
    goals, // This was the source of the last error
    degreePriorities,
    creativeWorks,
    signatureUrl,
    lifelongLearning,
    selfAssessment,
    ...otherFormData // Collects any other properties just in case
  } = formData;

  const submissionData = {
    ...otherFormData, // Spread any remaining properties

    // --- Mapped from formData (camelCase from JS -> snake_case for DB) ---
    applicant_name: applicantName,
    degree_applied_for: degreeAppliedFor,
    campus: campus,
    folder_link: folderLink,
    photo_url: photoUrl,
    full_address: fullAddress,
    mobile_number: mobileNumber,
    email_address: emailAddress,
    goal_statement: goals, // Correctly maps `goals` data to `goal_statement` column
    degree_priorities: degreePriorities,
    creative_works: creativeWorks,
    signature_url: signatureUrl,
    lifelong_learning: lifelongLearning,
    self_assessment: selfAssessment,

    // --- From this component's state (already correctly named) ---
    education_background: education,
    non_formal_education: nonFormal,
    certifications: certifications,
    publications: publications,
    inventions: inventions,
    work_experiences: work,
    recognitions: recognitions,
    professional_development: professional_development,
  };

  try {
    const { error } = await supabase
      .from("applications")
      .insert([submissionData]);

    if (error) {
      throw error;
    }

    nextStep();
  } catch (error: any) {
    // Improved error logging
    console.error("Full error object from Supabase:", JSON.stringify(error, null, 2));

    let displayMessage = "An unexpected error occurred. Please check the console.";
    if (error && error.message) {
      displayMessage = error.message;
    } else if (error && error.details) {
      displayMessage = error.details;
    }
    
    setSubmitError(`Submission failed: ${displayMessage}. Please try again.`);
  } finally {
    setIsSubmitting(false);
  }
};

  return (
    <div className="min-h-screen flex justify-center items-center bg-gray-100 p-6">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSubmit();
        }}
        className="bg-white shadow-lg rounded-2xl flex flex-col overflow-y-auto"
        style={{
          width: "896px",
          height: "803.5px",
        }}
      >
        <h2 className="text-center font-bold text-xl mt-4 mb-2 text-black">
          APPLICATION FORM AND PRELIMINARY ASSESSMENT FORM
        </h2>

        <div
          className="bg-yellow-100 text-black px-6 py-3 rounded-lg text-sm mb-4 
                flex items-center gap-2 mx-auto w-auto whitespace-nowrap shadow"
        >
          <span>⚠️</span>
          <span>
            All information indicated herein shall be certified true copy and
            notarized
          </span>
        </div>

        {/* --- 4. DISPLAY SUBMISSION ERROR IF IT EXISTS --- */}
        {submitError && (
          <div className="text-red-600 bg-red-100 p-3 rounded-lg mx-6 text-center">
            {submitError}
          </div>
        )}

        <div className="flex-1 overflow-y-auto mb-2 max-h-[70vh] px-6 pt-2 pb-4 scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-100">
          {/* C. */}
          <AccordionItem title="C. Educational Background" defaultOpen>
            <h4 className="font-semibold text-black mt-2 mb-2">
              Formal Education
            </h4>
            <FormalEducationSection
              education={education}
              onChange={handleEducationChange}
              onAdd={addEducation}
              onRemove={removeEducation}
            />
            <h4 className="font-semibold text-black mt-6 mb-2">
              Non-Formal Education
            </h4>
            <NonFormalEducationSection
              nonFormal={nonFormal}
              onChange={handleNonFormalChange}
              onAdd={addNonFormal}
              onRemove={removeNonFormal}
            />

            <h4 className="font-semibold text-black mt-6 mb-2"></h4>
            <CertificationSection
              certifications={certifications}
              onChange={handleCertificationChange}
              onAdd={addCertification}
              onRemove={removeCertification}
            />
          </AccordionItem>
          <AccordionItem title="D. Publication">
            <PublicationSection
              publications={publications}
              onChange={handlePublicationChange}
              onAdd={addPublication}
              onRemove={removePublication}
            />
          </AccordionItem>

          <AccordionItem title="E. Invention/Patent">
            <InventionSection
              inventions={inventions}
              onChange={handleInventionChange}
              onAdd={addInvention}
              onRemove={removeInvention}
            />
          </AccordionItem>

          <AccordionItem title="F. Work Experiences">
            <WorkExperienceSection
              work={work}
              onEmploymentChange={handleEmploymentChange}
              onConsultancyChange={handleConsultancyChange}
              onSelfEmploymentChange={handleSelfEmploymentChange}
              onAdd={addWork}
              onRemove={removeWork}
            />
          </AccordionItem>

          <AccordionItem title="G. Recognitions Received">
            <RecognitionSection
              recognitions={recognitions}
              onChange={handleRecognitionChange}
              onAdd={addRecognition}
              onRemove={removeRecognition}
            />
          </AccordionItem>
          <AccordionItem title="H. Professional Development Activities">
            <ProfessionalDevelopmentSection
              memberships={memberships}
              projects={projects}
              research={research}
              onChange={handleProfessionalDevChange}
              onAdd={addProfessionalDev}
              onRemove={removeProfessionalDev}
            />
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
            type="submit" // Changed to type="submit"
            disabled={isSubmitting} // Disable button during submission
            className="bg-yellow-500 text-white font-semibold py-2 px-6 rounded-lg hover:bg-yellow-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? "Submitting..." : "Next →"}
          </button>
        </div>
      </form>
    </div>
  );
}