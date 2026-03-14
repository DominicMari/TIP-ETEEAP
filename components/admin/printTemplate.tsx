// components/admin/printTemplate.tsx
"use client";

/**
 * TIP-ACAD-E-001: Application and Preliminary Assessment Form (For Applicant)
 * Layout matches the official PDF form exactly.
 * Uses "keyA+keyB" syntax in table keys to combine two fields (e.g. startDate+endDate).
 */
export function generatePrintHTML(data: any): string {
  if (!data) return "";

  // ─── Helpers ───
  const safeParse = (raw: any): any => {
    if (!raw) return null;
    if (typeof raw === "string") {
      try { return JSON.parse(raw); } catch { return raw; }
    }
    return raw;
  };

  const fmtDate = (d: string | null | undefined): string => {
    if (!d) return "";
    try {
      const dt = new Date(d);
      return isNaN(dt.getTime()) ? d : new Intl.DateTimeFormat("en-PH", { year: "numeric", month: "2-digit", day: "2-digit" }).format(dt);
    } catch { return d; }
  };

  // ─── Styles ───
  const th = `border:1px solid #000;padding:4px 6px;text-align:center;font-size:8pt;font-weight:bold;vertical-align:middle;`;
  const td = `border:1px solid #000;padding:4px 6px;font-size:8pt;vertical-align:top;`;
  const tbl = `width:100%;border-collapse:collapse;margin-bottom:4px;`;

  // Underline-style field
  const uField = (label: string, value: any, width?: string) =>
    `<span style="font-size:8.5pt;${width ? `display:inline-block;width:${width};` : ""}">${label} <span style="border-bottom:1px solid #000;display:inline-block;min-width:120px;padding-bottom:1px;">${value || ""}</span></span>`;

  // Full-width underline row
  const uRow = (label: string, value: any) =>
    `<div style="margin-bottom:4px;font-size:8.5pt;">${label}: <span style="border-bottom:1px solid #000;display:inline-block;width:calc(100% - ${label.length * 6 + 20}px);min-width:200px;padding-bottom:1px;">${value || ""}</span></div>`;

  // Essay box
  const essayBox = (content: any, minH: string = "70px") =>
    `<div style="border:1px solid #000;padding:8px 10px;min-height:${minH};font-size:8pt;line-height:1.5;text-align:justify;margin-bottom:6px;">${content || "&nbsp;"}</div>`;

  // Section header
  const secHdr = (text: string, bold: boolean = true, italic: boolean = true) =>
    `<div style="font-size:9pt;font-weight:${bold ? "bold" : "normal"};${italic ? "font-style:italic;" : ""}margin:8px 0 4px;">${text}</div>`;

  // ─── Table Renderer (supports "keyA+keyB" combined columns) ───
  const renderTable = (rawData: any, headers: string[], keys: string[], emptyRows: number = 3): string => {
    const parsed = safeParse(rawData);
    let items: any[] = [];
    if (parsed) {
      if (typeof parsed === "object" && !Array.isArray(parsed)) {
        items = Object.entries(parsed).flatMap(([level, arr]) =>
          Array.isArray(arr) ? arr.map((x: any) => ({ ...x, _level: level.charAt(0).toUpperCase() + level.slice(1) })) : []
        );
      } else if (Array.isArray(parsed)) {
        items = parsed;
      }
    }

    const headRow = headers.map(h => `<th style="${th}">${h}</th>`).join("");

    let bodyRows = "";
    if (items.length > 0) {
      bodyRows = items.map(item => `<tr>${keys.map(k => {
        if (k === "_level") return `<td style="${td}">${item._level || ""}</td>`;
        if (k.includes("+")) {
          const [a, b] = k.split("+");
          const va = item[a] || "";
          const vb = item[b] || "";
          return `<td style="${td}">${va}${va && vb ? " – " : ""}${vb}</td>`;
        }
        return `<td style="${td}">${item[k] || ""}</td>`;
      }).join("")}</tr>`).join("");
    } else {
      bodyRows = Array(emptyRows).fill(`<tr>${keys.map(() => `<td style="${td}">&nbsp;</td>`).join("")}</tr>`).join("");
    }

    return `<table style="${tbl}"><thead><tr>${headRow}</tr></thead><tbody>${bodyRows}</tbody></table>`;
  };

  // ═══════════════════════════════════════════════════════
  //  BUILD HTML — TIP-ACAD-E-001 Layout
  // ═══════════════════════════════════════════════════════
  return `<!DOCTYPE html>
<html>
<head>
  <title>TIP-ACAD-E-001 — ${data.applicant_name || "Applicant"}</title>
  <style>
    @page { size: A4; margin: 12mm 14mm 12mm 14mm; }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: Arial, Helvetica, sans-serif; color: #000; font-size: 9pt; line-height: 1.3; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    @media print { body { padding: 0; } }
  </style>
</head>
<body>

<!-- ═══════════ PAGE HEADER ═══════════ -->
<div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:6px;">
  <div style="display:flex;gap:8px;align-items:center;">
    <img src="/assets/TIPLogo.png" alt="TIP Logo" style="width:52px;height:52px;object-fit:contain;" />
    <div>
      <div style="font-size:14pt;font-weight:bold;">TECHNOLOGICAL<br/>INSTITUTE OF THE<br/>PHILIPPINES</div>
    </div>
  </div>
  <div style="text-align:right;font-size:7pt;letter-spacing:2px;font-weight:bold;">
    T I P - A C A D - E - 0 0 1<br/>
    <span style="font-weight:normal;font-style:italic;letter-spacing:0.5px;font-size:6.5pt;">Revision Status / Date: 0/2025 July 04</span>
  </div>
</div>

<!-- ETEEAP Subtitle -->
<div style="text-align:center;font-size:9pt;font-weight:bold;margin-bottom:6px;">
  Expanded Tertiary Education Equivalency and Accreditation Program<br/>(ETEEAP)
</div>

<!-- Privacy Consent -->
<div style="margin-bottom:8px;">
  <div style="font-size:7.5pt;font-weight:bold;margin-bottom:2px;">PRIVACY CONSENT</div>
  <div style="font-size:6.5pt;line-height:1.4;">I understand and agree that by filling out this form, I am allowing the Technological Institute of the Philippines to collect, use, share, and disclose my personal information for advising and to retain these personal information for a period allowed based on applicable laws and school policy. The purpose and extent of collection, use, sharing, disclosure, and retention of my personal information was explained to me.</div>
</div>

<!-- Form Title -->
<div style="text-align:center;margin-bottom:10px;">
  <div style="font-size:10pt;font-weight:bold;">APPLICATION AND PRELIMINARY ASSESSMENT FORM</div>
  <div style="font-size:9pt;font-style:italic;">For Applicant</div>
</div>

<!-- ═══════════ APPLICATION HEADER + PHOTO ═══════════ -->
<div style="display:flex;justify-content:space-between;gap:10px;margin-bottom:8px;">
  <div style="flex:1;">
    <table style="width:100%;border-collapse:collapse;">
      <tr><td style="font-weight:bold;font-size:8.5pt;padding:3px 0;width:140px;">Name of the Applicant:</td><td style="border-bottom:1px solid #000;font-size:8.5pt;padding:3px 4px;font-weight:bold;text-transform:uppercase;">${data.applicant_name || ""}</td></tr>
      <tr><td style="font-weight:bold;font-size:8.5pt;padding:3px 0;">Degree Applied For:</td><td style="border-bottom:1px solid #000;font-size:8.5pt;padding:3px 4px;font-weight:bold;">${data.degree_applied_for || ""}</td></tr>
      <tr><td style="font-weight:bold;font-size:8.5pt;padding:3px 0;">Campus:</td><td style="border-bottom:1px solid #000;font-size:8.5pt;padding:3px 4px;">${data.campus || ""}</td></tr>
      <tr><td style="font-weight:bold;font-size:8.5pt;padding:3px 0;">Date of Application:</td><td style="border-bottom:1px solid #000;font-size:8.5pt;padding:3px 4px;">${fmtDate(data.application_date || data.created_at)}</td></tr>
      <tr><td style="font-weight:bold;font-size:8.5pt;padding:3px 0;">Folder Link:</td><td style="border-bottom:1px solid #000;font-size:7pt;padding:3px 4px;word-break:break-all;">${data.folder_link || ""}</td></tr>
    </table>
  </div>
  <div style="width:85px;height:85px;border:1.5px solid #000;display:flex;align-items:center;justify-content:center;flex-shrink:0;">
    ${data.photo_url ? `<img src="${data.photo_url}" style="width:100%;height:100%;object-fit:cover;" />` : `<span style="font-size:7pt;text-align:center;color:#666;">1 x 1<br/>Picture</span>`}
  </div>
</div>

<!-- Direction -->
<div style="font-size:7.5pt;margin-bottom:10px;line-height:1.4;">
  <b style="font-style:italic;">Direction.</b> <span style="font-style:italic;">Please accomplish the following information needed. Do not leave items unanswered. Indicate <b>"Not applicable"</b> as the case may be. All information declared in this file is under oath as well as submitted. Discovery of false information shall be disqualified from participating in the program.</span>
</div>

<!-- ═══════════ I. APPLICATION PROFILE ═══════════ -->
<div style="font-size:10pt;font-weight:bold;margin-bottom:4px;">I. APPLICATION PROFILE</div>

<!-- A. Personal Information -->
${secHdr("A. &nbsp;Personal Information")}
${uRow("Name (Last Name, First Name Middle Name)", `<b>${data.applicant_name || ""}</b>`)}
${uRow("City Address", data.city_address)}
${uRow("Permanent Address", data.permanent_address)}
<div style="margin-bottom:4px;font-size:8.5pt;display:flex;gap:8px;flex-wrap:wrap;">
  ${uField("Age:", data.age, "120px")} ${uField("Gender:", data.gender, "140px")} ${uField("Nationality:", data.nationality, "160px")} ${uField("Religion:", data.religion, "160px")}
</div>
<div style="margin-bottom:4px;font-size:8.5pt;display:flex;gap:8px;flex-wrap:wrap;">
  ${uField("Civil Status:", data.civil_status, "160px")} ${uField("Birthday:", fmtDate(data.birth_date), "170px")} ${uField("Birth Place:", data.birth_place, "250px")}
</div>
<div style="margin-bottom:4px;font-size:8.5pt;display:flex;gap:8px;flex-wrap:wrap;">
  ${uField("Telephone No.:", "", "170px")} ${uField("Mobile No.:", data.mobile_number, "180px")} ${uField("Email Address:", data.email_address, "250px")}
</div>
${uRow("Languages Spoken", data.language_spoken)}
<div style="margin-bottom:4px;font-size:8.5pt;display:flex;gap:8px;">
  ${uField("Contact Person in case of emergency:", data.emergency_contact_name, "400px")} ${uField("Relationship:", data.emergency_relationship, "200px")}
</div>
<div style="margin-bottom:6px;font-size:8.5pt;display:flex;gap:8px;">
  ${uField("Address:", data.emergency_address, "400px")} ${uField("Contact No.:", data.emergency_contact_number, "200px")}
</div>

<!-- B. Priorities and Goals -->
${secHdr("B. &nbsp;Priorities and Goals")}
<div style="font-size:8.5pt;margin-bottom:4px;">1. Degree program being applied for.</div>
${(() => {
  const p = safeParse(data.degree_priorities);
  const labels = ["First Priority", "Second Priority", "Third Priority"];
  if (Array.isArray(p) && p.length > 0) {
    return p.map((item: any, i: number) =>
      `<div style="margin-left:20px;margin-bottom:2px;font-size:8.5pt;font-style:italic;">${labels[i] || `Priority ${i + 1}`}: <span style="border-bottom:1px solid #000;display:inline-block;min-width:300px;font-style:normal;font-weight:bold;">${typeof item === "string" ? item : (item?.program || "")}</span></div>`
    ).join("");
  }
  return labels.map((l, i) =>
    `<div style="margin-left:20px;margin-bottom:2px;font-size:8.5pt;font-style:italic;">${l}: <span style="border-bottom:1px solid #000;display:inline-block;min-width:300px;font-style:normal;font-weight:bold;">${i === 0 ? (data.degree_applied_for || "") : ""}</span></div>`
  ).join("");
})()}
<div style="font-size:7pt;font-style:italic;margin:2px 0 6px;color:#333;">(Note: The T.I.P. ETEEAP Unit Head and the Assessors have the right to give the final approval on what program the applicant shall enroll.)</div>

<div style="font-size:8.5pt;margin-bottom:4px;">2. Statement of your goals, objectives, and purposes in applying for the degree.</div>
${essayBox(safeParse(data.goal_statement))}

<div style="font-size:8.5pt;margin-bottom:4px;">3. Indicate how much time you plan to devote to personal learning activities so that you can finish the requirements in the prescribed program. Please specify your response.</div>
${essayBox(data.time_plan || data.learning_time_plan, "50px")}

<div style="font-size:8.5pt;margin-bottom:4px;">4. For overseas applicants (<i>Otherwise, please indicate "Not Applicable"</i>), describe how you plan to obtain accreditation/equivalency (e.g., when you plan to come to the Philippines).</div>
${essayBox(data.is_overseas ? data.overseas_details : "Not Applicable", "40px")}

<div style="font-size:8.5pt;margin-bottom:4px;">5. How soon do you need to complete equivalency/accreditation?</div>
${essayBox(data.completion_timeline || "", "40px")}

<!-- ═══════════ C. EDUCATIONAL BACKGROUND ═══════════ -->
${secHdr("C. &nbsp;Educational Background", true, false)}
<div style="font-size:7pt;font-style:italic;margin-bottom:4px;">(All information indicated herein shall be certified true copy and notarized.)</div>

<div style="font-size:8.5pt;font-style:italic;margin-bottom:3px;">1. Formal Education</div>
${renderTable(data.education_background,
  ["Level", "Degree program", "Name of the School", "School Address", "Year Graduated", "Inclusive Dates of Attendance (mm/dd/yy-mm/dd/yy)"],
  ["_level", "degreeProgram", "schoolName", "schoolAddress", "yearGraduated", "startDate+endDate"],
  5
)}

<div style="font-size:8.5pt;font-style:italic;margin:6px 0 3px;">2. Non-Formal Education</div>
${renderTable(data.non_formal_education,
  ["Title of the Training, Seminar, Workshop, Convention, Conference, etc.", "Role", "Level", "Sponsored or Conducted by", "Inclusive Dates of Attendance"],
  ["title", "role", "level", "sponsor", "startDate+endDate"],
  3
)}

<div style="font-size:8.5pt;font-style:italic;margin:6px 0 3px;">3. Other Certification Credentials/Eligibility</div>
${renderTable(data.certifications,
  ["Title of the Certification", "Name and Address of the Certifying Body", "Date Certified (Month/Day/Year)", "Rating"],
  ["title", "certifyingBody", "dateCertified", "rating"],
  3
)}

<!-- ═══════════ D. PUBLICATIONS ═══════════ -->
${secHdr("D. &nbsp;Publications", true, true)}
${renderTable(data.publications,
  ["Title of the Publications", "Circulation", "Level (Local, National, International)", "Year Published", "Year Presented"],
  ["title", "circulation", "level", "yearPublished", "yearPresented"],
  3
)}

<!-- ═══════════ E. INVENTION/PATENT ═══════════ -->
${secHdr("E. &nbsp;Invention/Patent", true, true)}
${renderTable(data.inventions,
  ["Title of the Invention/Patent", "Agency (ex., IPOPHL, WIPO)", "Application Date", "Level (National, International)", "Year Published"],
  ["title", "agency", "applicationDate", "level", "yearPublished"],
  3
)}

<!-- ═══════════ F. WORK EXPERIENCES ═══════════ -->
${secHdr("F. &nbsp;Work Experiences", true, true)}

<div style="font-size:8.5pt;font-style:italic;margin-bottom:3px;">1. Employment (i.e., from current to previous employment)</div>
${renderTable(safeParse(data.work_experiences)?.employment,
  ["Company/Address", "Designation/Position", "Brief Description about your work", "Inclusive Dates of Attendance (mm/dd/yy-mm/dd/yy)"],
  ["company", "designation", "description", "startDate+endDate"],
  3
)}

<div style="font-size:8.5pt;font-style:italic;margin:6px 0 3px;">2. Consultancy</div>
${renderTable(safeParse(data.work_experiences)?.consultancy,
  ["Consultancies (Title and Brief Description)", "Name and Address of the Company", "Inclusive Dates of Attendance (mm/dd/yy-mm/dd/yy)"],
  ["consultancy", "companyAddress", "startDate+endDate"],
  3
)}

<div style="font-size:8.5pt;font-style:italic;margin:6px 0 3px;">3. Self-Employment (Business Proprietorship/Startup)</div>
${renderTable(safeParse(data.work_experiences)?.selfEmployment,
  ["Company/Address", "Designation/Position", "Brief Description of your work", "Reference Person and Contact No.", "Inclusive Dates of Attendance"],
  ["company", "designation", "description", "reference", "startDate+endDate"],
  3
)}

<!-- ═══════════ G. RECOGNITIONS ═══════════ -->
${secHdr("G. &nbsp;Recognitions Received", true, true)}
<div style="font-size:7pt;font-style:italic;margin-bottom:3px;">(Please describe all the honors, awards, citations, and recognitions received from schools, community and civic organizations, as well as citations for work excellence, outstanding accomplishments, community service, etc.)</div>
${renderTable(data.recognitions,
  ["Title of Recognition", "Name and Address of the Awarding Body", "Inclusive Dates of Attendance (Month/Day/Year)"],
  ["title", "awardingBody", "startDate+endDate"],
  3
)}

<!-- ═══════════ H. PROFESSIONAL DEVELOPMENT ═══════════ -->
${secHdr("H. &nbsp;Professional Development Activities", true, true)}

<div style="font-size:8.5pt;font-style:italic;margin-bottom:3px;">1. Professional Organization Membership</div>
${renderTable(safeParse(data.professional_development)?.memberships,
  ["Organization", "Designation", "Inclusive Dates of Attendance (mm/dd/yy-mm/dd/yy)"],
  ["organization", "designation", "startDate+endDate"],
  3
)}

<div style="font-size:8.5pt;font-style:italic;margin:6px 0 3px;">2. Project Management/Involvement</div>
${renderTable(safeParse(data.professional_development)?.projects,
  ["Title of the Project", "Designation (Project Leader, Member, etc.)", "Brief Description about your involvement", "Inclusive Dates of Attendance"],
  ["title", "designation", "description", "startDate+endDate"],
  3
)}

<div style="font-size:8.5pt;font-style:italic;margin:6px 0 3px;">3. Research and Development (R&D), Strategic Management Plan, Operational Plan, Marketing Plan, and other Business Related Activities/Output</div>
${renderTable(safeParse(data.professional_development)?.research,
  ["Title and Brief Description", "Name and Address of the Institution/Industry/Agency", "Inclusive Dates (mm/dd/yy-mm/dd/yy)"],
  ["title", "institution", "startDate+endDate"],
  3
)}

<!-- ═══════════ I. CREATIVE WORKS ═══════════ -->
${secHdr("I. &nbsp;Creative Works and Special Accomplishments", true, true)}
<div style="font-size:7pt;font-style:italic;margin-bottom:3px;">(Please enumerate the various creative works and special accomplishments you have done in the past. Examples of these are literary fiction and non-fiction writings, musical work, products of visual performing arts, exceptional accomplishments in sports, social, cultural, and leisure activities, etc.)</div>
${renderTable(data.creative_works,
  ["Title and Brief Description", "Name and Address of the Institution/Industry/Agency", "Inclusive Dates (mm/dd/yy-mm/dd/yy)"],
  ["title", "institution", "startDate+endDate"],
  3
)}

<!-- ═══════════ J. LIFELONG LEARNING ═══════════ -->
${secHdr("J. &nbsp;Lifelong Learning Experience", true, true)}
<div style="font-size:7pt;font-style:italic;margin-bottom:6px;">(Please indicate the various life experiences from which you must have derived some learning experience.)</div>
${(() => {
  const ll = safeParse(data.lifelong_learning);
  const items = [
    { key: "hobbies", label: "1. Hobbies/Leisure Activities", desc: "(Leisure activities that involve rating of skills for competition and other purposes.)" },
    { key: "skills", label: "2. Special Skills", desc: "(Note down those special skills you think must be related to the field of study you want to pursue.)" },
    { key: "workActivities", label: "3. Work-Related Activities", desc: "(Some work-related activities are occasions for you to learn something new.)" },
    { key: "volunteer", label: "4. Volunteer Activities", desc: "(List only volunteer activities that demonstrate learning opportunities.)" },
    { key: "travels", label: "5. Travels: Cite places visited and purpose of travel", desc: "(Include a write-up of the nature of travel undertaken.)" },
  ];
  return items.map(({ key, label, desc }) =>
    `<div style="margin-bottom:6px;">
      <div style="font-size:8.5pt;font-weight:bold;">${label}</div>
      <div style="font-size:6.5pt;font-style:italic;margin-bottom:2px;">${desc}</div>
      ${essayBox(ll?.[key] || null, "50px")}
    </div>`
  ).join("");
})()}

<!-- ═══════════ PORTFOLIO (if any) ═══════════ -->
${(() => {
  const portfolio = safeParse(data.portfolio);
  if (!Array.isArray(portfolio) || !portfolio.length) return "";
  const rows = portfolio.map((p: any, i: number) =>
    `<tr><td style="${td}">${i + 1}</td><td style="${td}">${p.title || ""}</td><td style="${td}">${p.fileType || ""}</td><td style="${td}">${p.url ? '<a href="' + p.url + '" style="color:#00c;">View</a>' : ""}</td></tr>`
  ).join("");
  return `<div style="margin-top:8px;">${secHdr("Portfolio Documents")}
    <table style="${tbl}"><thead><tr><th style="${th}">#</th><th style="${th}">Document Title</th><th style="${th}">Type</th><th style="${th}">Link</th></tr></thead><tbody>${rows}</tbody></table></div>`;
})()}

<!-- ═══════════ II. SELF-REPORT / SELF-ASSESSMENT ═══════════ -->
<div style="font-size:10pt;font-weight:bold;margin:12px 0 6px;">II. SELF-REPORT/SELF-ASSESSMENT</div>

<div style="font-size:8.5pt;margin-bottom:6px;margin-left:16px;">A. &nbsp;Write an essay on the following questions:</div>
${(() => {
  const sa = safeParse(data.self_assessment);
  const questions = [
    { key: "jobLearning", q: "1. What did you learn about your job?" },
    { key: "teamworkLearning", q: "2. What did you learn about working with others?" },
    { key: "selfLearning", q: "3. What did you learn about yourself?" },
    { key: "workBenefits", q: "4. What were the benefits of your work experience?" },
  ];
  let html = questions.map(({ key, q }) =>
    `<div style="margin-bottom:6px;">
      <div style="font-size:8.5pt;font-weight:bold;font-style:italic;margin-bottom:2px;">${q}</div>
      ${essayBox(sa?.[key] || null, "60px")}
    </div>`
  ).join("");

  html += `<div style="margin-bottom:6px;">
    <div style="font-size:8.5pt;margin-bottom:2px;">B. &nbsp;Write an essay on how attaining a degree contributes to your personal development, community, workplace, society, and country.</div>
    ${essayBox(sa?.degreeContribution || sa?.essay || null, "70px")}
  </div>`;
  return html;
})()}

<!-- ═══════════ DECLARATION & SIGNATURE ═══════════ -->
<div style="margin-top:16px;font-size:8.5pt;line-height:1.5;">
  I declare under oath that the foregoing information stated and documents presented herein are true and correct. Accomplished on this __ day of __________, 20_____.
</div>

<div style="margin-top:24px;page-break-inside:avoid;">
  <div style="font-size:8.5pt;margin-bottom:8px;">Signed:</div>
  <div style="width:300px;">
    ${data.signature_url ? `<img src="${data.signature_url}" style="height:50px;display:block;" />` : '<div style="height:50px;"></div>'}
    <div style="border-top:1.5px solid #000;padding-top:4px;margin-top:4px;">
      <div style="font-size:8.5pt;text-align:center;">${data.applicant_name || ""}</div>
      <div style="font-size:7pt;text-align:center;">Printed Name of the Applicant with Signature</div>
    </div>
  </div>
</div>

<script>window.onload = function() { setTimeout(function() { window.print(); }, 600); };</script>
</body>
</html>`;
}

/**
 * Opens a new browser window and triggers print preview.
 */
export function openPrintPreview(data: any): void {
  const printWindow = window.open("", "_blank", "width=900,height=700");
  if (!printWindow) {
    alert("Please allow pop-ups to use the print feature.");
    return;
  }
  const html = generatePrintHTML(data);
  printWindow.document.write(html);
  printWindow.document.close();
}

/**
 * Default export for backward compatibility.
 */
export default function TIPPrintTemplate({ data }: { data: any }) {
  return null;
}