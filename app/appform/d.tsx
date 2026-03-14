"use client";
import React, { useState, ReactNode, useRef } from "react";
import { Plus, Minus, Paperclip, X } from "lucide-react";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "YOUR_SUPABASE_URL";
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "YOUR_SUPABASE_ANON_KEY";
const supabase = createClient(supabaseUrl, supabaseKey);

/* ---------------- Types ---------------- */
type WithFile = { fileName?: string };
type EducationEntry   = WithFile & { schoolName: string; schoolAddress: string; degreeProgram?: string; yearGraduated: string; startDate: string; endDate: string; };
type EducationState   = { tertiary: EducationEntry[]; secondary: EducationEntry[]; elementary: EducationEntry[]; technical: EducationEntry[]; };
type NonFormalEntry   = WithFile & { title: string; sponsor: string; venue: string; startDate: string; endDate: string; };
type CertificationEntry = WithFile & { title: string; certifyingBodyName: string; certifyingBodyAddress: string; dateCertified: string; rating: string; };
type PublicationEntry   = WithFile & { title: string; circulation: string; level: string; yearPublished: string; yearPresented: string; };
type InventionEntry     = WithFile & { title: string; agency: string; applicationDate: string; level: string; yearPublished: string; };
type EmploymentEntry    = WithFile & { company: string; companyAddress: string; designation: string; startDate: string; endDate: string; description: string; };
type ConsultancyEntry   = WithFile & { consultancy: string; companyName: string; companyAddress: string; startDate: string; endDate: string; };
type SelfEmploymentEntry = WithFile & { company: string; companyAddress: string; designation: string; reference: string; startDate: string; endDate: string; description: string; };
type WorkExperienceState = { employment: EmploymentEntry[]; consultancy: ConsultancyEntry[]; selfEmployment: SelfEmploymentEntry[]; };
type RecognitionEntry   = WithFile & { title: string; awardingBodyName: string; awardingBodyAddress: string; startDate: string; endDate: string; };
type MembershipEntry    = WithFile & { organization: string; designation: string; startDate: string; endDate: string; };
type ProjectEntry       = WithFile & { title: string; designation: string; startDate: string; endDate: string; description: string; };
type ResearchEntry      = WithFile & { title: string; institution: string; startDate: string; endDate: string; description: string; };
type CreativeWork       = WithFile & { title: string; institutionName: string; institutionAddress: string; startDate: string; endDate: string; };

type FieldErrors     = Partial<Record<keyof EducationEntry, string>>;
type EducationErrors = Partial<Record<keyof EducationState, FieldErrors[]>>;
type ValidationErrors = { education?: EducationErrors };

/* ---------------- FileUpload row ---------------- */
function FileUploadRow({ fileName, onFileChange }: { fileName?: string; onFileChange: (name: string) => void }) {
  const ref = useRef<HTMLInputElement>(null);
  return (
    <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-200">
      <input ref={ref} type="file" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) onFileChange(f.name); }} />
      <button type="button" onClick={() => ref.current?.click()} className="flex items-center gap-1 text-xs bg-white border border-gray-300 rounded px-3 py-1.5 hover:bg-gray-50 text-gray-600 transition-colors">
        <Paperclip size={12} /> Choose file
      </button>
      <span className="text-xs text-gray-500 truncate max-w-xs">{fileName || "No file chosen"}</span>
      {fileName && <button type="button" onClick={() => onFileChange("")} className="text-gray-400 hover:text-red-400"><X size={12} /></button>}
    </div>
  );
}

/* ---------------- None badge ---------------- */
function NoneBadge({ onUndo }: { onUndo: () => void }) {
  return (
    <div className="flex items-center gap-2 bg-orange-50 border border-orange-200 rounded-lg px-3 py-2">
      <span className="text-sm text-orange-700 font-medium">None selected</span>
      <button type="button" onClick={onUndo} className="text-xs text-orange-500 hover:text-orange-700 underline">Undo</button>
    </div>
  );
}

/* ---------------- None + Add button bar (for empty list) ---------------- */
function NoneAddBar({ onNone, onAdd, limit, count, limitLabel }: { onNone: () => void; onAdd: () => void; limit?: number; count: number; limitLabel?: string; }) {
  const atLimit = limit !== undefined && count >= limit;
  return (
    <div className="flex justify-end gap-2 mb-3">
      <button type="button" onClick={onNone} className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-3 py-2 rounded-lg text-sm font-semibold transition-colors">None</button>
      {!atLimit && <button type="button" onClick={onAdd} className="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-2 rounded-lg flex items-center gap-1 text-sm transition-colors"><Plus size={16} /> Add</button>}
      {atLimit && limitLabel && <span className="text-xs text-gray-400 self-center">{limitLabel}</span>}
    </div>
  );
}

/* ---------------- AccordionItem ---------------- */
function AccordionItem({ title, children, defaultOpen = false, hasError = false }: { title: string; children: ReactNode; defaultOpen?: boolean; hasError?: boolean; }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className={`border rounded-lg mb-4 bg-white shadow-sm ${hasError ? "border-red-400" : ""}`}>
      <button type="button" onClick={() => setOpen(!open)} className="w-full flex justify-between items-center px-4 py-3 font-semibold text-black text-left hover:bg-gray-100">
        <span className="flex items-center gap-2">{title}{hasError && <span className="text-xs text-red-500 font-normal italic">— incomplete</span>}</span>
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

/* ---- Inline error banner ---- */
function SectionError({ message }: { message?: string }) {
  if (!message) return null;
  return <div className="mb-3 bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-red-600 text-sm font-medium">{message}</div>;
}

/* ============================================================
   SECTION C: Educational Background
   ============================================================ */
function FormalEducationSection({ education, onChange, onAdd, onRemove, errors, hasNoTechnical, onNoneTechnical }: {
  education: EducationState;
  onChange: (level: keyof EducationState, i: number, f: keyof EducationEntry, v: string) => void;
  onAdd: (level: keyof EducationState) => void;
  onRemove: (level: keyof EducationState, i: number) => void;
  errors?: ValidationErrors["education"];
  hasNoTechnical: boolean;
  onNoneTechnical: () => void;
}) {
  const levels = [
    { key: "tertiary" as const,   label: "Tertiary",            req: true  },
    { key: "secondary" as const,  label: "Secondary",           req: true  },
    { key: "elementary" as const, label: "Elementary",          req: true  },
    { key: "technical" as const,  label: "Technical/Vocational", req: false },
  ];
  return (
    <div>
      {levels.map(({ key, label, req }) => {
        const list = education[key];
        const isTech = key === "technical";
        return (
          <div key={key} className="mb-8">
            <h4 className="font-semibold text-black mb-3">{label}{req ? <span className="text-red-500">*</span> : " (Optional)"}</h4>
            {isTech && hasNoTechnical && <NoneBadge onUndo={onNoneTechnical} />}
            {isTech && !hasNoTechnical && list.length === 0 && (
              <NoneAddBar onNone={onNoneTechnical} onAdd={() => onAdd(key)} count={list.length} />
            )}
            {(!isTech || !hasNoTechnical) && list.map((entry, idx) => (
              <div key={idx} className="bg-white border border-gray-200 p-5 rounded-xl shadow-sm mb-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Name of the School{req && <span className="text-red-500"> *</span>}</label>
                    <input type="text" value={entry.schoolName} onChange={(e) => onChange(key, idx, "schoolName", e.target.value)} className="w-full border border-gray-400 rounded-lg px-3 py-2 text-black bg-white" />
                    <FieldError message={errors?.[key]?.[idx]?.schoolName as string} />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">School Address{req && <span className="text-red-500"> *</span>}</label>
                    <input type="text" value={entry.schoolAddress} onChange={(e) => onChange(key, idx, "schoolAddress", e.target.value)} className="w-full border border-gray-400 rounded-lg px-3 py-2 text-black bg-white" />
                    <FieldError message={errors?.[key]?.[idx]?.schoolAddress as string} />
                  </div>
                  {key !== "secondary" && key !== "elementary" && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Degree Program{key === "tertiary" && <span className="text-red-500"> *</span>}</label>
                      <input type="text" value={entry.degreeProgram || ""} onChange={(e) => { const v = e.target.value; if (/^[A-Za-z\s]*$/.test(v)) onChange(key, idx, "degreeProgram", v); }} className="w-full border border-gray-400 rounded-lg px-3 py-2 text-black bg-white" />
                      <FieldError message={errors?.[key]?.[idx]?.degreeProgram as string} />
                    </div>
                  )}
                  <div className={key === "secondary" || key === "elementary" ? "col-span-2" : ""}>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Year Graduated{req && <span className="text-red-500"> *</span>}</label>
                    <input type="text" value={entry.yearGraduated} onChange={(e) => { const v = e.target.value; if (/^[0-9]*$/.test(v) && v.length <= 4) onChange(key, idx, "yearGraduated", v); }} maxLength={4} inputMode="numeric" className="w-full border border-gray-400 rounded-lg px-3 py-2 text-black bg-white" />
                    <FieldError message={errors?.[key]?.[idx]?.yearGraduated as string} />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Inclusive Dates{req && <span className="text-red-500"> *</span>}</label>
                    <div className="grid grid-cols-2 gap-4">
                      <div><label className="block text-xs text-gray-500 mb-1">Start</label><input type="month" value={entry.startDate} onChange={(e) => onChange(key, idx, "startDate", e.target.value)} className="w-full border border-gray-400 rounded-lg px-3 py-2 text-black bg-white" /><FieldError message={errors?.[key]?.[idx]?.startDate as string} /></div>
                      <div><label className="block text-xs text-gray-500 mb-1">End</label><input type="month" value={entry.endDate} onChange={(e) => onChange(key, idx, "endDate", e.target.value)} className="w-full border border-gray-400 rounded-lg px-3 py-2 text-black bg-white" /><FieldError message={errors?.[key]?.[idx]?.endDate as string} /></div>
                    </div>
                  </div>
                </div>
                <FileUploadRow fileName={entry.fileName} onFileChange={(n) => onChange(key, idx, "fileName" as any, n)} />
                <div className="flex justify-end gap-2 mt-3">
                  {idx > 0 && <button type="button" onClick={() => onRemove(key, idx)} className="bg-red-500 hover:bg-red-600 text-white px-3 py-2 rounded-lg flex items-center gap-1 text-sm"><Minus size={16} /> Remove</button>}
                  {isTech && idx === 0 && <button type="button" onClick={onNoneTechnical} className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-3 py-2 rounded-lg text-sm font-semibold">None</button>}
                  {idx === list.length - 1 && <button type="button" onClick={() => onAdd(key)} className="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-2 rounded-lg flex items-center gap-1 text-sm"><Plus size={16} /> Add</button>}
                </div>
              </div>
            ))}
          </div>
        );
      })}
    </div>
  );
}

/* ============================================================
   Generic subsection: one type, has None, has file upload
   ============================================================ */
type SubSectionProps<T extends WithFile> = {
  label?: string;
  entries: T[];
  isNone: boolean;
  onNone: () => void;
  onAdd: () => void;
  onRemove: (i: number) => void;
  onFileChange: (i: number, name: string) => void;
  limit?: number;
  renderFields: (entry: T, idx: number) => ReactNode;
};
function SubSection<T extends WithFile>({ label, entries, isNone, onNone, onAdd, onRemove, onFileChange, limit, renderFields }: SubSectionProps<T>) {
  const atLimit = limit !== undefined && entries.length >= limit;
  return (
    <div>
      {label && <h4 className="font-semibold text-black mb-3">{label}{limit ? <span className="text-gray-400 font-normal text-xs ml-1">(limit {limit})</span> : ""}</h4>}
      {isNone && <NoneBadge onUndo={onNone} />}
      {!isNone && entries.length === 0 && <NoneAddBar onNone={onNone} onAdd={onAdd} count={0} limit={limit} limitLabel={`Max ${limit} reached`} />}
      {!isNone && entries.map((entry, idx) => (
        <div key={idx} className="bg-white border border-gray-200 p-4 rounded-xl shadow-sm mb-4">
          {renderFields(entry, idx)}
          <FileUploadRow fileName={entry.fileName} onFileChange={(n) => onFileChange(idx, n)} />
          <div className="flex justify-end gap-2 mt-3">
            {idx > 0 && <button type="button" onClick={() => onRemove(idx)} className="bg-red-500 hover:bg-red-600 text-white px-3 py-2 rounded-lg flex items-center gap-1 text-sm"><Minus size={16} /> Remove</button>}
            {idx === 0 && <button type="button" onClick={onNone} className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-3 py-2 rounded-lg text-sm font-semibold">None</button>}
            {idx === entries.length - 1 && !atLimit && <button type="button" onClick={onAdd} className="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-2 rounded-lg flex items-center gap-1 text-sm"><Plus size={16} /> Add</button>}
            {idx === entries.length - 1 && atLimit && <span className="text-xs text-gray-400 self-center">Max {limit} reached</span>}
          </div>
        </div>
      ))}
    </div>
  );
}

/* ============================================================
   SECTION C: Non-Formal
   ============================================================ */
function NonFormalSection({ nonFormal, isNone, onNone, onChange, onAdd, onRemove }: { nonFormal: NonFormalEntry[]; isNone: boolean; onNone: () => void; onChange: (i: number, f: keyof NonFormalEntry, v: string) => void; onAdd: () => void; onRemove: (i: number) => void; }) {
  return (
    <SubSection entries={nonFormal} isNone={isNone} onNone={onNone} onAdd={onAdd} onRemove={onRemove}
      onFileChange={(i, n) => onChange(i, "fileName" as any, n)}
      renderFields={(entry, idx) => (
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2"><label className="block text-sm font-medium text-gray-700 mb-1">Title of Training/Seminar</label><input type="text" value={entry.title} onChange={(e) => onChange(idx, "title", e.target.value)} className="w-full border border-gray-400 rounded-lg px-3 py-2 text-black bg-white" /></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Sponsor</label><input type="text" value={entry.sponsor} onChange={(e) => onChange(idx, "sponsor", e.target.value)} className="w-full border border-gray-400 rounded-lg px-3 py-2 text-black bg-white" /></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Venue</label><input type="text" value={entry.venue} onChange={(e) => onChange(idx, "venue", e.target.value)} className="w-full border border-gray-400 rounded-lg px-3 py-2 text-black bg-white" /></div>
          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Inclusive Dates</label>
            <div className="grid grid-cols-2 gap-4">
              <div><label className="block text-xs text-gray-500 mb-1">Start</label><input type="month" value={entry.startDate} onChange={(e) => onChange(idx, "startDate", e.target.value)} className="w-full border border-gray-400 rounded-lg px-3 py-2 text-black bg-white" /></div>
              <div><label className="block text-xs text-gray-500 mb-1">End</label><input type="month" value={entry.endDate} onChange={(e) => onChange(idx, "endDate", e.target.value)} className="w-full border border-gray-400 rounded-lg px-3 py-2 text-black bg-white" /></div>
            </div>
          </div>
        </div>
      )} />
  );
}

/* ============================================================
   SECTION D: Certifications
   ============================================================ */
function CertificationSection({ certifications, isNone, onNone, onChange, onAdd, onRemove }: { certifications: CertificationEntry[]; isNone: boolean; onNone: () => void; onChange: (i: number, f: keyof CertificationEntry, v: string) => void; onAdd: () => void; onRemove: (i: number) => void; }) {
  return (
    <SubSection entries={certifications} isNone={isNone} onNone={onNone} onAdd={onAdd} onRemove={onRemove}
      onFileChange={(i, n) => onChange(i, "fileName" as any, n)}
      renderFields={(entry, idx) => (
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2"><label className="block text-sm font-medium text-gray-700 mb-1">Title of the Certification</label><input type="text" value={entry.title} onChange={(e) => onChange(idx, "title", e.target.value)} className="w-full border border-gray-400 rounded-lg px-3 py-2 text-black bg-white" /></div>
          <div className="col-span-2"><label className="block text-sm font-medium text-gray-700 mb-1">Name of the Certifying Body</label><input type="text" value={entry.certifyingBodyName} onChange={(e) => onChange(idx, "certifyingBodyName", e.target.value)} className="w-full border border-gray-400 rounded-lg px-3 py-2 text-black bg-white" /></div>
          <div className="col-span-2"><label className="block text-sm font-medium text-gray-700 mb-1">Address of the Certifying Body</label><input type="text" value={entry.certifyingBodyAddress} onChange={(e) => onChange(idx, "certifyingBodyAddress", e.target.value)} className="w-full border border-gray-400 rounded-lg px-3 py-2 text-black bg-white" /></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Date Certified</label><input type="month" value={entry.dateCertified} onChange={(e) => onChange(idx, "dateCertified", e.target.value)} className="w-full border border-gray-400 rounded-lg px-3 py-2 text-black bg-white" /></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Rating</label><input type="text" value={entry.rating} onChange={(e) => onChange(idx, "rating", e.target.value)} className="w-full border border-gray-400 rounded-lg px-3 py-2 text-black bg-white" /></div>
        </div>
      )} />
  );
}

/* ============================================================
   SECTION E: Publications + Inventions (each has own None)
   ============================================================ */
function PublicationSection({ publications, isNone, onNone, onChange, onAdd, onRemove }: { publications: PublicationEntry[]; isNone: boolean; onNone: () => void; onChange: (i: number, f: keyof PublicationEntry, v: string) => void; onAdd: () => void; onRemove: (i: number) => void; }) {
  return (
    <SubSection label="Publications" entries={publications} isNone={isNone} onNone={onNone} onAdd={onAdd} onRemove={onRemove}
      onFileChange={(i, n) => onChange(i, "fileName" as any, n)}
      renderFields={(entry, idx) => (
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2"><label className="block text-sm font-medium text-gray-700 mb-1">Title of the Publication</label><input type="text" value={entry.title} onChange={(e) => onChange(idx, "title", e.target.value)} className="w-full border border-gray-400 rounded-lg px-3 py-2 text-black bg-white" /></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Nature of Circulation</label><input type="text" value={entry.circulation} onChange={(e) => onChange(idx, "circulation", e.target.value)} className="w-full border border-gray-400 rounded-lg px-3 py-2 text-black bg-white" /></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Level</label><input type="text" value={entry.level} onChange={(e) => onChange(idx, "level", e.target.value)} className="w-full border border-gray-400 rounded-lg px-3 py-2 text-black bg-white" /></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Year Published</label><input type="text" value={entry.yearPublished} onChange={(e) => onChange(idx, "yearPublished", e.target.value)} className="w-full border border-gray-400 rounded-lg px-3 py-2 text-black bg-white" /></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Year Presented</label><input type="text" value={entry.yearPresented} onChange={(e) => onChange(idx, "yearPresented", e.target.value)} className="w-full border border-gray-400 rounded-lg px-3 py-2 text-black bg-white" /></div>
        </div>
      )} />
  );
}

function InventionSection({ inventions, isNone, onNone, onChange, onAdd, onRemove }: { inventions: InventionEntry[]; isNone: boolean; onNone: () => void; onChange: (i: number, f: keyof InventionEntry, v: string) => void; onAdd: () => void; onRemove: (i: number) => void; }) {
  return (
    <SubSection label="Inventions" entries={inventions} isNone={isNone} onNone={onNone} onAdd={onAdd} onRemove={onRemove}
      onFileChange={(i, n) => onChange(i, "fileName" as any, n)}
      renderFields={(entry, idx) => (
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2"><label className="block text-sm font-medium text-gray-700 mb-1">Title of the Invention</label><input type="text" value={entry.title} onChange={(e) => onChange(idx, "title", e.target.value)} className="w-full border border-gray-400 rounded-lg px-3 py-2 text-black bg-white" /></div>
          <div className="col-span-2"><label className="block text-sm font-medium text-gray-700 mb-1">Agency</label><input type="text" value={entry.agency} onChange={(e) => onChange(idx, "agency", e.target.value)} className="w-full border border-gray-400 rounded-lg px-3 py-2 text-black bg-white" /></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Date of Application</label><input type="month" value={entry.applicationDate} onChange={(e) => onChange(idx, "applicationDate", e.target.value)} className="w-full border border-gray-400 rounded-lg px-3 py-2 text-black bg-white" /></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Level</label><input type="text" value={entry.level} onChange={(e) => onChange(idx, "level", e.target.value)} className="w-full border border-gray-400 rounded-lg px-3 py-2 text-black bg-white" /></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Year Published</label><input type="text" value={entry.yearPublished} onChange={(e) => onChange(idx, "yearPublished", e.target.value)} className="w-full border border-gray-400 rounded-lg px-3 py-2 text-black bg-white" /></div>
        </div>
      )} />
  );
}

/* ============================================================
   SECTION F: Work Experience — at least ONE sub-type must have
   entries. Each sub-type individually can be marked None,
   but not all three at the same time.
   ============================================================ */
function WorkExperienceSection({ work, onEmploymentChange, onConsultancyChange, onSelfEmploymentChange, onAdd, onRemove, noneEmp, onNoneEmp, noneCon, onNoneCon, noneSE, onNoneSE }: {
  work: WorkExperienceState;
  onEmploymentChange: (i: number, f: keyof EmploymentEntry, v: string) => void;
  onConsultancyChange: (i: number, f: keyof ConsultancyEntry, v: string) => void;
  onSelfEmploymentChange: (i: number, f: keyof SelfEmploymentEntry, v: string) => void;
  onAdd: (t: keyof WorkExperienceState) => void;
  onRemove: (t: keyof WorkExperienceState, i: number) => void;
  noneEmp: boolean; onNoneEmp: () => void;
  noneCon: boolean; onNoneCon: () => void;
  noneSE: boolean;  onNoneSE: () => void;
}) {
  return (
    <div>
      {/* Employment */}
      <h4 className="font-semibold text-black mb-3">
        Employment <span className="italic text-gray-500 font-normal text-sm">(from current to previous)</span>
      </h4>
      {noneEmp && <NoneBadge onUndo={onNoneEmp} />}
      {!noneEmp && work.employment.length === 0 && (
        <NoneAddBar onNone={onNoneEmp} onAdd={() => onAdd("employment")} count={0} />
      )}
      {!noneEmp && work.employment.map((entry, idx) => (
        <div key={idx} className="bg-white border border-gray-200 p-4 rounded-xl shadow-sm mb-4">
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Company Name</label><input type="text" value={entry.company} onChange={(e) => onEmploymentChange(idx, "company", e.target.value)} className="w-full border border-gray-400 rounded-lg px-3 py-2 text-black bg-white" /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Designation</label><input type="text" value={entry.designation} onChange={(e) => onEmploymentChange(idx, "designation", e.target.value)} className="w-full border border-gray-400 rounded-lg px-3 py-2 text-black bg-white" /></div>
            <div className="col-span-2"><label className="block text-sm font-medium text-gray-700 mb-1">Company Address</label><input type="text" value={entry.companyAddress || ""} onChange={(e) => onEmploymentChange(idx, "companyAddress" as any, e.target.value)} className="w-full border border-gray-400 rounded-lg px-3 py-2 text-black bg-white" /></div>
            <div className="col-span-2"><label className="block text-sm font-medium text-gray-700 mb-1">Inclusive Dates</label><div className="grid grid-cols-2 gap-4"><div><label className="block text-xs text-gray-500 mb-1">Start</label><input type="month" value={entry.startDate} onChange={(e) => onEmploymentChange(idx, "startDate", e.target.value)} className="w-full border border-gray-400 rounded-lg px-3 py-2 text-black bg-white" /></div><div><label className="block text-xs text-gray-500 mb-1">End</label><input type="month" value={entry.endDate} onChange={(e) => onEmploymentChange(idx, "endDate", e.target.value)} className="w-full border border-gray-400 rounded-lg px-3 py-2 text-black bg-white" /></div></div></div>
            <div className="col-span-2"><label className="block text-sm font-medium text-gray-700 mb-1">Description of Duties</label><textarea value={entry.description} onChange={(e) => onEmploymentChange(idx, "description", e.target.value)} rows={3} className="w-full border border-gray-400 rounded-lg px-3 py-2 text-black bg-white" /></div>
          </div>
          <FileUploadRow fileName={entry.fileName} onFileChange={(n) => onEmploymentChange(idx, "fileName" as any, n)} />
          <div className="flex justify-end gap-2 mt-3">
            {idx > 0 && <button type="button" onClick={() => onRemove("employment", idx)} className="bg-red-500 hover:bg-red-600 text-white px-3 py-2 rounded-lg flex items-center gap-1 text-sm"><Minus size={16} /> Remove</button>}
            {idx === 0 && <button type="button" onClick={onNoneEmp} className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-3 py-2 rounded-lg text-sm font-semibold">None</button>}
            {idx === work.employment.length - 1 && <button type="button" onClick={() => onAdd("employment")} className="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-2 rounded-lg flex items-center gap-1 text-sm"><Plus size={16} /> Add</button>}
          </div>
        </div>
      ))}

      <hr className="my-6" />

      {/* Consultancy */}
      <h4 className="font-semibold text-black mb-3">Consultancy Services</h4>
      {noneCon && <NoneBadge onUndo={onNoneCon} />}
      {!noneCon && work.consultancy.length === 0 && (
        <NoneAddBar onNone={onNoneCon} onAdd={() => onAdd("consultancy")} count={0} />
      )}
      {!noneCon && work.consultancy.map((entry, idx) => (
        <div key={idx} className="bg-white border border-gray-200 p-4 rounded-xl shadow-sm mb-4">
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Nature of Consultancy</label><input type="text" value={entry.consultancy} onChange={(e) => onConsultancyChange(idx, "consultancy", e.target.value)} className="w-full border border-gray-400 rounded-lg px-3 py-2 text-black bg-white" /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Company Name</label><input type="text" value={entry.companyName || ""} onChange={(e) => onConsultancyChange(idx, "companyName" as any, e.target.value)} className="w-full border border-gray-400 rounded-lg px-3 py-2 text-black bg-white" /></div>
            <div className="col-span-2"><label className="block text-sm font-medium text-gray-700 mb-1">Company Address</label><input type="text" value={entry.companyAddress} onChange={(e) => onConsultancyChange(idx, "companyAddress", e.target.value)} className="w-full border border-gray-400 rounded-lg px-3 py-2 text-black bg-white" /></div>
            <div className="col-span-2"><label className="block text-sm font-medium text-gray-700 mb-1">Inclusive Dates</label><div className="grid grid-cols-2 gap-4"><div><label className="block text-xs text-gray-500 mb-1">Start</label><input type="month" value={entry.startDate} onChange={(e) => onConsultancyChange(idx, "startDate", e.target.value)} className="w-full border border-gray-400 rounded-lg px-3 py-2 text-black bg-white" /></div><div><label className="block text-xs text-gray-500 mb-1">End</label><input type="month" value={entry.endDate} onChange={(e) => onConsultancyChange(idx, "endDate", e.target.value)} className="w-full border border-gray-400 rounded-lg px-3 py-2 text-black bg-white" /></div></div></div>
          </div>
          <FileUploadRow fileName={entry.fileName} onFileChange={(n) => onConsultancyChange(idx, "fileName" as any, n)} />
          <div className="flex justify-end gap-2 mt-3">
            {idx > 0 && <button type="button" onClick={() => onRemove("consultancy", idx)} className="bg-red-500 hover:bg-red-600 text-white px-3 py-2 rounded-lg flex items-center gap-1 text-sm"><Minus size={16} /> Remove</button>}
            {idx === 0 && <button type="button" onClick={onNoneCon} className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-3 py-2 rounded-lg text-sm font-semibold">None</button>}
            {idx === work.consultancy.length - 1 && <button type="button" onClick={() => onAdd("consultancy")} className="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-2 rounded-lg flex items-center gap-1 text-sm"><Plus size={16} /> Add</button>}
          </div>
        </div>
      ))}

      <hr className="my-6" />

      {/* Self-Employment */}
      <h4 className="font-semibold text-black mb-3">Self-Employment</h4>
      {noneSE && <NoneBadge onUndo={onNoneSE} />}
      {!noneSE && work.selfEmployment.length === 0 && (
        <NoneAddBar onNone={onNoneSE} onAdd={() => onAdd("selfEmployment")} count={0} />
      )}
      {!noneSE && work.selfEmployment.map((entry, idx) => (
        <div key={idx} className="bg-white border border-gray-200 p-4 rounded-xl shadow-sm mb-4">
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Company Name</label><input type="text" value={entry.company} onChange={(e) => onSelfEmploymentChange(idx, "company", e.target.value)} className="w-full border border-gray-400 rounded-lg px-3 py-2 text-black bg-white" /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Designation</label><input type="text" value={entry.designation} onChange={(e) => onSelfEmploymentChange(idx, "designation", e.target.value)} className="w-full border border-gray-400 rounded-lg px-3 py-2 text-black bg-white" /></div>
            <div className="col-span-2"><label className="block text-sm font-medium text-gray-700 mb-1">Company Address</label><input type="text" value={entry.companyAddress || ""} onChange={(e) => onSelfEmploymentChange(idx, "companyAddress" as any, e.target.value)} className="w-full border border-gray-400 rounded-lg px-3 py-2 text-black bg-white" /></div>
            <div className="col-span-2"><label className="block text-sm font-medium text-gray-700 mb-1">Inclusive Dates</label><div className="grid grid-cols-2 gap-4"><div><label className="block text-xs text-gray-500 mb-1">Start</label><input type="month" value={entry.startDate} onChange={(e) => onSelfEmploymentChange(idx, "startDate", e.target.value)} className="w-full border border-gray-400 rounded-lg px-3 py-2 text-black bg-white" /></div><div><label className="block text-xs text-gray-500 mb-1">End</label><input type="month" value={entry.endDate} onChange={(e) => onSelfEmploymentChange(idx, "endDate", e.target.value)} className="w-full border border-gray-400 rounded-lg px-3 py-2 text-black bg-white" /></div></div></div>
            <div className="col-span-2"><label className="block text-sm font-medium text-gray-700 mb-1">Reference (Name, Designation, Contact No.)</label><input type="text" value={entry.reference} onChange={(e) => onSelfEmploymentChange(idx, "reference", e.target.value)} className="w-full border border-gray-400 rounded-lg px-3 py-2 text-black bg-white" /></div>
            <div className="col-span-2"><label className="block text-sm font-medium text-gray-700 mb-1">Description of Duties</label><textarea value={entry.description} onChange={(e) => onSelfEmploymentChange(idx, "description", e.target.value)} rows={3} className="w-full border border-gray-400 rounded-lg px-3 py-2 text-black bg-white" /></div>
          </div>
          <FileUploadRow fileName={entry.fileName} onFileChange={(n) => onSelfEmploymentChange(idx, "fileName" as any, n)} />
          <div className="flex justify-end gap-2 mt-3">
            {idx > 0 && <button type="button" onClick={() => onRemove("selfEmployment", idx)} className="bg-red-500 hover:bg-red-600 text-white px-3 py-2 rounded-lg flex items-center gap-1 text-sm"><Minus size={16} /> Remove</button>}
            {idx === 0 && <button type="button" onClick={onNoneSE} className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-3 py-2 rounded-lg text-sm font-semibold">None</button>}
            {idx === work.selfEmployment.length - 1 && <button type="button" onClick={() => onAdd("selfEmployment")} className="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-2 rounded-lg flex items-center gap-1 text-sm"><Plus size={16} /> Add</button>}
          </div>
        </div>
      ))}
    </div>
  );
}

/* ============================================================
   SECTION G: Recognitions
   ============================================================ */
function RecognitionSection({ recognitions, isNone, onNone, onChange, onAdd, onRemove }: { recognitions: RecognitionEntry[]; isNone: boolean; onNone: () => void; onChange: (i: number, f: keyof RecognitionEntry, v: string) => void; onAdd: () => void; onRemove: (i: number) => void; }) {
  return (
    <div>
      <p className="italic text-sm text-gray-600 mb-3">Describe honors, awards, citations, etc.</p>
      <SubSection entries={recognitions} isNone={isNone} onNone={onNone} onAdd={onAdd} onRemove={onRemove}
        onFileChange={(i, n) => onChange(i, "fileName" as any, n)}
        renderFields={(entry, idx) => (
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2"><label className="block text-sm font-medium text-gray-700 mb-1">Title of the Recognition</label><input type="text" value={entry.title} onChange={(e) => onChange(idx, "title", e.target.value)} className="w-full border border-gray-400 rounded-lg px-3 py-2 text-black bg-white" /></div>
            <div className="col-span-2"><label className="block text-sm font-medium text-gray-700 mb-1">Name of Awarding Body</label><input type="text" value={entry.awardingBodyName} onChange={(e) => onChange(idx, "awardingBodyName", e.target.value)} className="w-full border border-gray-400 rounded-lg px-3 py-2 text-black bg-white" /></div>
            <div className="col-span-2"><label className="block text-sm font-medium text-gray-700 mb-1">Address of Awarding Body</label><input type="text" value={entry.awardingBodyAddress} onChange={(e) => onChange(idx, "awardingBodyAddress", e.target.value)} className="w-full border border-gray-400 rounded-lg px-3 py-2 text-black bg-white" /></div>
            <div className="col-span-2"><label className="block text-sm font-medium text-gray-700 mb-1">Inclusive Dates</label><div className="grid grid-cols-2 gap-4"><div><label className="block text-xs text-gray-500 mb-1">Start</label><input type="month" value={entry.startDate} onChange={(e) => onChange(idx, "startDate", e.target.value)} className="w-full border border-gray-400 rounded-lg px-3 py-2 text-black bg-white" /></div><div><label className="block text-xs text-gray-500 mb-1">End</label><input type="month" value={entry.endDate} onChange={(e) => onChange(idx, "endDate", e.target.value)} className="w-full border border-gray-400 rounded-lg px-3 py-2 text-black bg-white" /></div></div></div>
          </div>
        )} />
    </div>
  );
}

/* ============================================================
   SECTION H: Professional Development — each subsection has own None + limit
   ============================================================ */
function ProfessionalDevelopmentSection({ memberships, projects, research, noneMem, onNoneMem, noneProj, onNoneProj, noneRes, onNoneRes, onChange, onAdd, onRemove }: {
  memberships: MembershipEntry[]; projects: ProjectEntry[]; research: ResearchEntry[];
  noneMem: boolean; onNoneMem: () => void;
  noneProj: boolean; onNoneProj: () => void;
  noneRes: boolean; onNoneRes: () => void;
  onChange: (cat: "memberships" | "projects" | "research", i: number, f: string, v: string) => void;
  onAdd: (cat: "memberships" | "projects" | "research") => void;
  onRemove: (cat: "memberships" | "projects" | "research", i: number) => void;
}) {
  return (
    <div>
      {/* Memberships */}
      <SubSection label="Membership in Professional Organizations" entries={memberships} isNone={noneMem} onNone={onNoneMem}
        onAdd={() => onAdd("memberships")} onRemove={(i) => onRemove("memberships", i)}
        onFileChange={(i, n) => onChange("memberships", i, "fileName", n)}
        renderFields={(entry, idx) => (
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Organization</label><input type="text" value={entry.organization} onChange={(e) => onChange("memberships", idx, "organization", e.target.value)} className="w-full border border-gray-400 rounded-lg px-3 py-2 text-black bg-white" /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Designation</label><input type="text" value={entry.designation} onChange={(e) => onChange("memberships", idx, "designation", e.target.value)} className="w-full border border-gray-400 rounded-lg px-3 py-2 text-black bg-white" /></div>
            <div className="col-span-2"><label className="block text-sm font-medium text-gray-700 mb-1">Inclusive Dates</label><div className="grid grid-cols-2 gap-4"><div><label className="block text-xs text-gray-500 mb-1">Start</label><input type="month" value={entry.startDate} onChange={(e) => onChange("memberships", idx, "startDate", e.target.value)} className="w-full border border-gray-400 rounded-lg px-3 py-2 text-black bg-white" /></div><div><label className="block text-xs text-gray-500 mb-1">End</label><input type="month" value={entry.endDate} onChange={(e) => onChange("memberships", idx, "endDate", e.target.value)} className="w-full border border-gray-400 rounded-lg px-3 py-2 text-black bg-white" /></div></div></div>
          </div>
        )} />

      <hr className="my-6" />

      {/* Projects — limit 5 */}
      <SubSection label="Projects Undertaken" entries={projects} isNone={noneProj} onNone={onNoneProj} limit={5}
        onAdd={() => onAdd("projects")} onRemove={(i) => onRemove("projects", i)}
        onFileChange={(i, n) => onChange("projects", i, "fileName", n)}
        renderFields={(entry, idx) => (
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Title of Project</label><input type="text" value={entry.title} onChange={(e) => onChange("projects", idx, "title", e.target.value)} className="w-full border border-gray-400 rounded-lg px-3 py-2 text-black bg-white" /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Designation</label><input type="text" value={entry.designation} onChange={(e) => onChange("projects", idx, "designation", e.target.value)} className="w-full border border-gray-400 rounded-lg px-3 py-2 text-black bg-white" /></div>
            <div className="col-span-2"><label className="block text-sm font-medium text-gray-700 mb-1">Inclusive Dates</label><div className="grid grid-cols-2 gap-4"><div><label className="block text-xs text-gray-500 mb-1">Start</label><input type="month" value={entry.startDate} onChange={(e) => onChange("projects", idx, "startDate", e.target.value)} className="w-full border border-gray-400 rounded-lg px-3 py-2 text-black bg-white" /></div><div><label className="block text-xs text-gray-500 mb-1">End</label><input type="month" value={entry.endDate} onChange={(e) => onChange("projects", idx, "endDate", e.target.value)} className="w-full border border-gray-400 rounded-lg px-3 py-2 text-black bg-white" /></div></div></div>
            <div className="col-span-2"><label className="block text-sm font-medium text-gray-700 mb-1">Brief Description</label><textarea value={entry.description} onChange={(e) => onChange("projects", idx, "description", e.target.value)} rows={3} className="w-full border border-gray-400 rounded-lg px-3 py-2 text-black bg-white" /></div>
          </div>
        )} />

      <hr className="my-6" />

      {/* Research — limit 5 */}
      <SubSection label="Research Undertaken" entries={research} isNone={noneRes} onNone={onNoneRes} limit={5}
        onAdd={() => onAdd("research")} onRemove={(i) => onRemove("research", i)}
        onFileChange={(i, n) => onChange("research", i, "fileName", n)}
        renderFields={(entry, idx) => (
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Title of Research</label><input type="text" value={entry.title} onChange={(e) => onChange("research", idx, "title", e.target.value)} className="w-full border border-gray-400 rounded-lg px-3 py-2 text-black bg-white" /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Institution</label><input type="text" value={entry.institution} onChange={(e) => onChange("research", idx, "institution", e.target.value)} className="w-full border border-gray-400 rounded-lg px-3 py-2 text-black bg-white" /></div>
            <div className="col-span-2"><label className="block text-sm font-medium text-gray-700 mb-1">Inclusive Dates</label><div className="grid grid-cols-2 gap-4"><div><label className="block text-xs text-gray-500 mb-1">Start</label><input type="month" value={entry.startDate} onChange={(e) => onChange("research", idx, "startDate", e.target.value)} className="w-full border border-gray-400 rounded-lg px-3 py-2 text-black bg-white" /></div><div><label className="block text-xs text-gray-500 mb-1">End</label><input type="month" value={entry.endDate} onChange={(e) => onChange("research", idx, "endDate", e.target.value)} className="w-full border border-gray-400 rounded-lg px-3 py-2 text-black bg-white" /></div></div></div>
            <div className="col-span-2"><label className="block text-sm font-medium text-gray-700 mb-1">Brief Description</label><textarea value={entry.description} onChange={(e) => onChange("research", idx, "description", e.target.value)} rows={3} className="w-full border border-gray-400 rounded-lg px-3 py-2 text-black bg-white" /></div>
          </div>
        )} />
    </div>
  );
}

/* ============================================================
   SECTION I: Creative Works
   ============================================================ */
function CreativeWorksSection({ works, isNone, onNone, onChange, onAdd, onRemove }: { works: CreativeWork[]; isNone: boolean; onNone: () => void; onChange: (i: number, f: keyof CreativeWork, v: string) => void; onAdd: () => void; onRemove: (i: number) => void; }) {
  return (
    <div>
      <p className="italic text-sm text-gray-700 mb-4">(Please enumerate the various creative works and special accomplishments you have done in the past...)</p>
      <SubSection entries={works} isNone={isNone} onNone={onNone} onAdd={onAdd} onRemove={onRemove}
        onFileChange={(i, n) => onChange(i, "fileName" as any, n)}
        renderFields={(entry, idx) => (
          <div>
            <div className="mb-3"><label className="block text-sm font-semibold text-black mb-1">Title and Brief Description <span className="text-red-500">*</span></label><input type="text" value={entry.title || ""} onChange={(e) => onChange(idx, "title", e.target.value)} className="w-full border border-gray-400 rounded-lg px-3 py-2 text-black bg-white" /></div>
            <div className="mb-3"><label className="block text-sm font-semibold text-black mb-1">Name of Institution/Industry/Agency <span className="text-red-500">*</span></label><input type="text" value={entry.institutionName || ""} onChange={(e) => onChange(idx, "institutionName", e.target.value)} className="w-full border border-gray-400 rounded-lg px-3 py-2 text-black bg-white" /></div>
            <div className="mb-3"><label className="block text-sm font-semibold text-black mb-1">Address of Institution/Industry/Agency <span className="text-red-500">*</span></label><input type="text" value={entry.institutionAddress || ""} onChange={(e) => onChange(idx, "institutionAddress", e.target.value)} className="w-full border border-gray-400 rounded-lg px-3 py-2 text-black bg-white" /></div>
            <div><label className="block text-sm font-semibold text-black mb-1">Inclusive Dates <span className="text-red-500">*</span></label>
              <div className="flex gap-4 items-center">
                <div className="flex-1"><label className="block text-xs text-gray-600 mb-1">From</label><input type="month" value={entry.startDate || ""} max={new Date().toISOString().slice(0, 7)} onChange={(e) => onChange(idx, "startDate", e.target.value)} className="w-full border border-gray-400 rounded-lg px-3 py-2 text-black bg-white" /></div>
                <span className="mt-5 text-gray-500">to</span>
                <div className="flex-1"><label className="block text-xs text-gray-600 mb-1">To</label><input type="month" value={entry.endDate || ""} min={entry.startDate || ""} onChange={(e) => onChange(idx, "endDate", e.target.value)} className="w-full border border-gray-400 rounded-lg px-3 py-2 text-black bg-white" /></div>
              </div>
            </div>
          </div>
        )} />
    </div>
  );
}

/* ============================================================
   PARENT FORM
   ============================================================ */
export default function BackgroundAchievementsForm({ formData, setFormData, nextStep, prevStep }: { formData: any; setFormData: any; nextStep: () => void; prevStep: () => void; }) {
  const [education, setEducation] = useState<EducationState>(formData.education || {
    tertiary:  [{ schoolName: "", schoolAddress: "", degreeProgram: "", yearGraduated: "", startDate: "", endDate: "" }],
    secondary: [{ schoolName: "", schoolAddress: "", yearGraduated: "", startDate: "", endDate: "" }],
    elementary:[{ schoolName: "", schoolAddress: "", yearGraduated: "", startDate: "", endDate: "" }],
    technical: [],
  });
  const [nonFormal,      setNonFormal]      = useState<NonFormalEntry[]>(formData.non_formal_education || []);
  const [certifications, setCertifications] = useState<CertificationEntry[]>(formData.certifications || []);
  const [publications,   setPublications]   = useState<PublicationEntry[]>(formData.publications || []);
  const [inventions,     setInventions]     = useState<InventionEntry[]>(formData.inventions || []);
  const [work,           setWork]           = useState<WorkExperienceState>(formData.work_experience || { employment: [], consultancy: [], selfEmployment: [] });
  const [recognitions,   setRecognitions]   = useState<RecognitionEntry[]>(formData.recognitions || []);
  const [memberships,    setMemberships]    = useState<MembershipEntry[]>(formData.professional_development?.memberships || []);
  const [projects,       setProjects]       = useState<ProjectEntry[]>(formData.professional_development?.projects || []);
  const [research,       setResearch]       = useState<ResearchEntry[]>(formData.professional_development?.research || []);
  const [creativeWorks,  setCreativeWorks]  = useState<CreativeWork[]>(formData.creative_works?.length > 0 ? formData.creative_works : [{ title: "", institutionName: "", institutionAddress: "", startDate: "", endDate: "" }]);

  /* --- None states --- */
  const [hasNoTechnical,   setHasNoTechnical]   = useState(false);
  const [hasNoNonFormal,   setHasNoNonFormal]   = useState(false);
  const [hasNoCert,        setHasNoCert]        = useState(false);
  const [hasNoPub,         setHasNoPub]         = useState(false);
  const [hasNoInv,         setHasNoInv]         = useState(false);
  // Work Experience: each sub-type can be None, but not ALL three
  const [hasNoEmp,  setHasNoEmp]  = useState(false);
  const [hasNoCon,  setHasNoCon]  = useState(false);
  const [hasNoSE,   setHasNoSE]   = useState(false);
  const [hasNoRec,         setHasNoRec]         = useState(false);
  // Prof Dev: each sub-type has own none
  const [hasNoMem,         setHasNoMem]         = useState(false);
  const [hasNoProj,        setHasNoProj]        = useState(false);
  const [hasNoRes,         setHasNoRes]         = useState(false);
  const [hasNoCW,          setHasNoCW]          = useState(false);

  const [sectionErrors, setSectionErrors] = useState<Record<string, string>>({});
  const [eduErrors,     setEduErrors]     = useState<ValidationErrors>({});
  const [isSubmitting,  setIsSubmitting]  = useState(false);

  /* --- Education handlers --- */
  const handleEduChange = (level: keyof EducationState, i: number, f: keyof EducationEntry, v: string) =>
    setEducation(prev => { const u = [...prev[level]]; u[i] = { ...u[i], [f]: v }; return { ...prev, [level]: u }; });
  const addEdu = (level: keyof EducationState) => {
    const e: EducationEntry = { schoolName: "", schoolAddress: "", yearGraduated: "", startDate: "", endDate: "" };
    if (level !== "secondary" && level !== "elementary") e.degreeProgram = "";
    setEducation(prev => ({ ...prev, [level]: [...prev[level], e] }));
  };
  const removeEdu = (level: keyof EducationState, i: number) =>
    setEducation(prev => ({ ...prev, [level]: prev[level].filter((_, x) => x !== i) }));

  /* --- Simple list handlers factory --- */
  const makeListHandlers = <T extends WithFile>(setter: React.Dispatch<React.SetStateAction<T[]>>) => ({
    onChange: (i: number, f: keyof T, v: string) => setter(prev => { const u = [...prev]; u[i] = { ...u[i], [f]: v }; return u; }),
    onAdd:    (blank: T) => setter(prev => [...prev, blank]),
    onRemove: (i: number) => setter(prev => prev.filter((_, x) => x !== i)),
  });

  const nfH   = makeListHandlers(setNonFormal);
  const certH  = makeListHandlers(setCertifications);
  const pubH   = makeListHandlers(setPublications);
  const invH   = makeListHandlers(setInventions);
  const recH   = makeListHandlers(setRecognitions);
  const cwH    = makeListHandlers(setCreativeWorks);

  const handleEmpChange = (i: number, f: keyof EmploymentEntry, v: string) =>
    setWork(prev => { const u = [...prev.employment]; u[i] = { ...u[i], [f]: v }; return { ...prev, employment: u }; });
  const handleConChange = (i: number, f: keyof ConsultancyEntry, v: string) =>
    setWork(prev => { const u = [...prev.consultancy]; u[i] = { ...u[i], [f]: v }; return { ...prev, consultancy: u }; });
  const handleSEChange  = (i: number, f: keyof SelfEmploymentEntry, v: string) =>
    setWork(prev => { const u = [...prev.selfEmployment]; u[i] = { ...u[i], [f]: v }; return { ...prev, selfEmployment: u }; });
  const addWork_ = (t: keyof WorkExperienceState) => setWork(prev => {
    const e: any = t === "employment" ? { company: "", companyAddress: "", designation: "", startDate: "", endDate: "", description: "" }
      : t === "consultancy" ? { consultancy: "", companyName: "", companyAddress: "", startDate: "", endDate: "" }
      : { company: "", companyAddress: "", designation: "", reference: "", startDate: "", endDate: "", description: "" };
    return { ...prev, [t]: [...prev[t], e] };
  });
  const removeWork_ = (t: keyof WorkExperienceState, i: number) =>
    setWork(prev => ({ ...prev, [t]: prev[t].filter((_, x) => x !== i) }));

  const handlePDChange = (cat: "memberships" | "projects" | "research", i: number, f: string, v: string) => {
    if (cat === "memberships") setMemberships(prev => { const u = [...prev]; u[i] = { ...u[i] as any, [f]: v } as MembershipEntry; return u; });
    else if (cat === "projects") setProjects(prev => { const u = [...prev]; u[i] = { ...u[i] as any, [f]: v } as ProjectEntry; return u; });
    else setResearch(prev => { const u = [...prev]; u[i] = { ...u[i] as any, [f]: v } as ResearchEntry; return u; });
  };
  const addPD = (cat: "memberships" | "projects" | "research") => {
    if (cat === "memberships") setMemberships(prev => [...prev, { organization: "", designation: "", startDate: "", endDate: "" }]);
    else if (cat === "projects") setProjects(prev => [...prev, { title: "", designation: "", startDate: "", endDate: "", description: "" }]);
    else setResearch(prev => [...prev, { title: "", institution: "", startDate: "", endDate: "", description: "" }]);
  };
  const removePD = (cat: "memberships" | "projects" | "research", i: number) => {
    if (cat === "memberships") setMemberships(prev => prev.filter((_, x) => x !== i));
    else if (cat === "projects") setProjects(prev => prev.filter((_, x) => x !== i));
    else setResearch(prev => prev.filter((_, x) => x !== i));
  };

  /* --- Helper: is a sub-section "answered"? (has entries OR is none) --- */
  const answered = (isNone: boolean, list: any[]) => isNone || list.length > 0;

  /* --- Validation --- */
  const validateSections = () => {
    const errs: Record<string, string> = {};
    const eduErr: ValidationErrors["education"] = {};
    let valid = true;

    // C: required levels
    const reqLevels: (keyof EducationState)[] = ["tertiary", "secondary", "elementary"];
    let eduOk = true;
    reqLevels.forEach(level => {
      eduErr[level] = [];
      education[level].forEach((entry, i) => {
        const e: Partial<EducationEntry> = {};
        if (!entry.schoolName.trim())      { e.schoolName = "Required."; eduOk = false; valid = false; }
        if (!entry.schoolAddress.trim())   { e.schoolAddress = "Required."; eduOk = false; valid = false; }
        if (!entry.yearGraduated.trim())   { e.yearGraduated = "Required."; eduOk = false; valid = false; }
        if (!entry.startDate.trim())       { e.startDate = "Required."; eduOk = false; valid = false; }
        if (!entry.endDate.trim())         { e.endDate = "Required."; eduOk = false; valid = false; }
        if (level === "tertiary" && !entry.degreeProgram?.trim()) { e.degreeProgram = "Required."; eduOk = false; valid = false; }
        eduErr[level]![i] = e;
      });
    });
    setEduErrors({ education: eduErr });
    if (!eduOk) errs["C"] = "Please complete all required Education fields.";

    // D
    if (!answered(hasNoCert, certifications))           { errs["D"] = "Select None or add at least one certification."; valid = false; }
    // E – each sub-type must be answered
    if (!answered(hasNoPub, publications))              { errs["E-pub"] = "Publications: select None or add at least one entry."; valid = false; }
    if (!answered(hasNoInv, inventions))                { errs["E-inv"] = "Inventions: select None or add at least one entry."; valid = false; }
    // F – each sub-type must be answered (None or entries), but not ALL can be None
    if (!answered(hasNoEmp, work.employment))  { errs["F-emp"] = "Employment: select None or add at least one entry."; valid = false; }
    if (!answered(hasNoCon, work.consultancy)) { errs["F-con"] = "Consultancy: select None or add at least one entry."; valid = false; }
    if (!answered(hasNoSE,  work.selfEmployment)) { errs["F-se"] = "Self-Employment: select None or add at least one entry."; valid = false; }
    if (hasNoEmp && hasNoCon && hasNoSE)       { errs["F-emp"] = "Work Experience is required. At least one sub-type must have entries."; valid = false; }
    // G
    if (!answered(hasNoRec, recognitions))              { errs["G"] = "Select None or add at least one recognition."; valid = false; }
    // H – each sub-type must be answered
    if (!answered(hasNoMem,  memberships))              { errs["H-mem"]  = "Memberships: select None or add at least one entry."; valid = false; }
    if (!answered(hasNoProj, projects))                 { errs["H-proj"] = "Projects: select None or add at least one entry."; valid = false; }
    if (!answered(hasNoRes,  research))                 { errs["H-res"]  = "Research: select None or add at least one entry."; valid = false; }
    // I
    if (!hasNoCW) {
      for (const w of creativeWorks) {
        if (!w.title.trim() || !w.institutionName.trim() || !w.institutionAddress.trim() || !w.startDate || !w.endDate) {
          errs["I"] = "Fill in all required fields or select None."; valid = false; break;
        }
        if (new Date(w.startDate) > new Date(w.endDate)) {
          errs["I"] = "End date cannot be before start date."; valid = false; break;
        }
      }
    }

    setSectionErrors(errs);
    return valid;
  };

  const collectData = () => ({
    education: { ...education, technical: hasNoTechnical ? [] : education.technical },
    non_formal_education: hasNoNonFormal ? [] : nonFormal,
    certifications:       hasNoCert ? [] : certifications,
    publications:         hasNoPub  ? [] : publications,
    inventions:           hasNoInv  ? [] : inventions,
    work_experience: {
      employment:     work.employment,
      consultancy:    work.consultancy,
      selfEmployment: work.selfEmployment,
    },
    recognitions:         hasNoRec  ? [] : recognitions,
    professional_development: {
      memberships: hasNoMem  ? [] : memberships,
      projects:    hasNoProj ? [] : projects,
      research:    hasNoRes  ? [] : research,
    },
    creative_works: hasNoCW ? [] : creativeWorks,
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!validateSections()) {
      const firstErr = document.querySelector(".border-red-400");
      if (firstErr) firstErr.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    setIsSubmitting(true);
    setFormData((prev: any) => ({ ...prev, ...collectData() }));
    nextStep();
  };

  const handleBack = () => {
    setFormData((prev: any) => ({ ...prev, ...collectData() }));
    prevStep();
  };

  /* Determine which accordion headers should show as error */
  const hasEErr  = !!sectionErrors["C"];
  const hasDErr  = !!sectionErrors["D"];
  const hasEsErr = !!sectionErrors["E-pub"] || !!sectionErrors["E-inv"];
  const hasFErr  = !!sectionErrors["F-emp"] || !!sectionErrors["F-con"] || !!sectionErrors["F-se"];
  const hasGErr  = !!sectionErrors["G"];
  const hasHErr  = !!sectionErrors["H-mem"] || !!sectionErrors["H-proj"] || !!sectionErrors["H-res"];
  const hasIErr  = !!sectionErrors["I"];

  return (
    <form onSubmit={handleSubmit} className="w-7xl max-w mx-auto bg-white rounded-xl shadow-md flex flex-col h-full">
      <div className="flex-1 overflow-y-auto mb-2 max-h-[60vh] px-6 pt-2 pb-4 scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-100">

        {Object.keys(sectionErrors).length > 0 && (
          <div className="mb-4 bg-red-50 border border-red-300 text-red-700 rounded-lg px-4 py-3 text-sm font-medium">
            Some sections are incomplete. Please fill in all fields or mark them as "None" before proceeding.
          </div>
        )}

        {/* C */}
        <AccordionItem title="C. Educational Background" defaultOpen hasError={hasEErr}>
          <FormalEducationSection education={education} onChange={handleEduChange} onAdd={addEdu} onRemove={removeEdu} errors={eduErrors.education} hasNoTechnical={hasNoTechnical} onNoneTechnical={() => setHasNoTechnical(p => !p)} />
          <hr className="my-6" />
          <h4 className="font-semibold text-black mb-2">Non-Formal Education <span className="text-gray-400 font-normal text-sm">(Optional)</span></h4>
          <NonFormalSection nonFormal={nonFormal} isNone={hasNoNonFormal} onNone={() => setHasNoNonFormal(p => !p)} onChange={nfH.onChange as any} onAdd={() => nfH.onAdd({ title: "", sponsor: "", venue: "", startDate: "", endDate: "" })} onRemove={nfH.onRemove} />
        </AccordionItem>

        {/* D */}
        <AccordionItem title="D. Certifications" hasError={hasDErr}>
          <SectionError message={sectionErrors["D"]} />
          <CertificationSection certifications={certifications} isNone={hasNoCert} onNone={() => setHasNoCert(p => !p)} onChange={certH.onChange as any} onAdd={() => certH.onAdd({ title: "", certifyingBodyName: "", certifyingBodyAddress: "", dateCertified: "", rating: "" })} onRemove={certH.onRemove} />
        </AccordionItem>

        {/* E */}
        <AccordionItem title="E. Inventions and Publications" hasError={hasEsErr}>
          <SectionError message={sectionErrors["E-pub"]} />
          <PublicationSection publications={publications} isNone={hasNoPub} onNone={() => setHasNoPub(p => !p)} onChange={pubH.onChange as any} onAdd={() => pubH.onAdd({ title: "", circulation: "", level: "", yearPublished: "", yearPresented: "" })} onRemove={pubH.onRemove} />
          <hr className="my-6" />
          <SectionError message={sectionErrors["E-inv"]} />
          <InventionSection inventions={inventions} isNone={hasNoInv} onNone={() => setHasNoInv(p => !p)} onChange={invH.onChange as any} onAdd={() => invH.onAdd({ title: "", agency: "", applicationDate: "", level: "", yearPublished: "" })} onRemove={invH.onRemove} />
        </AccordionItem>

        {/* F */}
        <AccordionItem title="F. Work Experience" hasError={hasFErr}>
          <SectionError message={sectionErrors["F-emp"] || sectionErrors["F-con"] || sectionErrors["F-se"]} />
          <WorkExperienceSection work={work}
            onEmploymentChange={handleEmpChange} onConsultancyChange={handleConChange} onSelfEmploymentChange={handleSEChange}
            onAdd={addWork_} onRemove={removeWork_}
            noneEmp={hasNoEmp} onNoneEmp={() => setHasNoEmp(p => !p)}
            noneCon={hasNoCon} onNoneCon={() => setHasNoCon(p => !p)}
            noneSE={hasNoSE}   onNoneSE={() => setHasNoSE(p => !p)}
          />
        </AccordionItem>

        {/* G */}
        <AccordionItem title="G. Recognitions" hasError={hasGErr}>
          <SectionError message={sectionErrors["G"]} />
          <RecognitionSection recognitions={recognitions} isNone={hasNoRec} onNone={() => setHasNoRec(p => !p)} onChange={recH.onChange as any} onAdd={() => recH.onAdd({ title: "", awardingBodyName: "", awardingBodyAddress: "", startDate: "", endDate: "" })} onRemove={recH.onRemove} />
        </AccordionItem>

        {/* H */}
        <AccordionItem title="H. Professional Development Activities" hasError={hasHErr}>
          <SectionError message={sectionErrors["H-mem"] || sectionErrors["H-proj"] || sectionErrors["H-res"]} />
          <ProfessionalDevelopmentSection memberships={memberships} projects={projects} research={research}
            noneMem={hasNoMem}   onNoneMem={() => setHasNoMem(p => !p)}
            noneProj={hasNoProj} onNoneProj={() => setHasNoProj(p => !p)}
            noneRes={hasNoRes}   onNoneRes={() => setHasNoRes(p => !p)}
            onChange={handlePDChange} onAdd={addPD} onRemove={removePD}
          />
        </AccordionItem>

        {/* I */}
        <AccordionItem title="I. Creative Works and Special Accomplishments" hasError={hasIErr}>
          <SectionError message={sectionErrors["I"]} />
          <CreativeWorksSection works={creativeWorks} isNone={hasNoCW} onNone={() => setHasNoCW(p => !p)}
            onChange={cwH.onChange as any}
            onAdd={() => cwH.onAdd({ title: "", institutionName: "", institutionAddress: "", startDate: "", endDate: "" })}
            onRemove={(i) => { setCreativeWorks(prev => { const u = prev.filter((_, x) => x !== i); return u.length === 0 ? [{ title: "", institutionName: "", institutionAddress: "", startDate: "", endDate: "" }] : u; }); }}
          />
        </AccordionItem>
      </div>

      <div className="flex justify-between mt-2 px-6 pb-4">
        <button type="button" onClick={handleBack} disabled={isSubmitting} className="bg-gray-300 text-black font-semibold py-2 px-6 rounded-lg hover:bg-gray-400 transition-colors disabled:opacity-50">← Back</button>
        <button type="submit" disabled={isSubmitting} className="bg-yellow-500 text-white font-semibold py-2 px-6 rounded-lg hover:bg-yellow-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">{isSubmitting ? "Submitting..." : "Next →"}</button>
      </div>
    </form>
  );
}