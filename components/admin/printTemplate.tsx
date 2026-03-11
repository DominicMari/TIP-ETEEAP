// components/admin/printTemplate.tsx
"use client";

/**
 * Generates the full HTML string for the formal TIP-ETEEAP print template.
 * Field names match exactly what d.tsx and b.tsx save to Supabase.
 */
export function generatePrintHTML(data: any): string {
  if (!data) return "";

  // --- Helpers ---
  const safeParse = (raw: any): any => {
    if (!raw) return null;
    if (typeof raw === "string") {
      try { return JSON.parse(raw); } catch { return raw; }
    }
    return raw;
  };

  const fmtDate = (dateStr: string | null | undefined): string => {
    if (!dateStr) return "—";
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return new Intl.DateTimeFormat("en-PH", { year: "numeric", month: "short", day: "numeric" }).format(d);
    } catch { return dateStr; }
  };

  const generatedDate = new Intl.DateTimeFormat("en-PH", { dateStyle: "long" }).format(new Date());

  // --- Styles ---
  const th = `border:1px solid #000;padding:5px 8px;text-align:left;background:#f0f0f0;font-size:9pt;font-weight:bold;color:#000;`;
  const td = `border:1px solid #000;padding:5px 8px;font-size:9pt;`;
  const tdLabel = `border:1px solid #000;padding:6px 10px;font-weight:bold;width:28%;font-size:9.5pt;background:#fafafa;`;
  const tdValue = `border:1px solid #000;padding:6px 10px;font-size:9.5pt;`;
  const tableWrap = `width:100%;border-collapse:collapse;border:1px solid #000;`;
  const sectionWrap = `margin-bottom:16px;page-break-inside:avoid;`;
  const header = (text: string) =>
    `<div style="background:#1a1a1a;color:#fff;padding:5px 10px;font-size:9.5pt;font-weight:bold;text-transform:uppercase;letter-spacing:0.5px;">${text}</div>`;

  // --- Table Section Renderer ---
  const renderTable = (num: string, title: string, rawData: any, headers: string[], keys: string[]): string => {
    const parsed = safeParse(rawData);
    if (!parsed) return "";

    let items: any[] = [];
    if (typeof parsed === "object" && !Array.isArray(parsed)) {
      items = Object.entries(parsed).flatMap(([level, arr]) =>
        Array.isArray(arr) ? arr.map((x: any) => ({ ...x, _level: level.toUpperCase() })) : []
      );
    } else if (Array.isArray(parsed)) {
      items = parsed;
    }
    if (!items.length) return "";

    const headRow = headers.map(h => `<th style="${th}">${h}</th>`).join("");
    const bodyRows = items.map(item => {
      const cells = keys.map(key => {
        const val = key === "_level" ? (item._level || "—") : (item[key] || "—");
        return `<td style="${td}">${val}</td>`;
      }).join("");
      return `<tr>${cells}</tr>`;
    }).join("");

    return `<div style="${sectionWrap}">${header(`${num}. ${title}`)}<table style="${tableWrap}"><thead><tr>${headRow}</tr></thead><tbody>${bodyRows}</tbody></table></div>`;
  };

  // --- Assessment Key-Value Renderer ---
  const renderAssessment = (num: string, title: string, rawData: any): string => {
    const parsed = safeParse(rawData);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return "";
    const entries = Object.entries(parsed);
    if (!entries.length) return "";

    const fmtKey = (k: string) => k.replace(/([A-Z])/g, " $1").replace(/^./, s => s.toUpperCase());
    const rows = entries.map(([key, value]) =>
      `<tr><td style="${td}font-weight:bold;width:30%;vertical-align:top;">${fmtKey(key)}</td><td style="${td}">${String(value)}</td></tr>`
    ).join("");

    return `<div style="${sectionWrap}">${header(`${num}. ${title}`)}<table style="${tableWrap}"><thead><tr><th style="${th}">Category</th><th style="${th}">Response</th></tr></thead><tbody>${rows}</tbody></table></div>`;
  };

  // --- Personal Data Row Helpers ---
  const pRow = (label: string, value: any) =>
    `<tr><td style="${tdLabel}">${label}</td><td style="${tdValue}" colspan="3">${value || "—"}</td></tr>`;
  const pRow2 = (l1: string, v1: any, l2: string, v2: any) =>
    `<tr><td style="${tdLabel}">${l1}</td><td style="${tdValue}">${v1 || "—"}</td><td style="${tdLabel}">${l2}</td><td style="${tdValue}">${v2 || "—"}</td></tr>`;

  // =============================================
  //  BUILD HTML
  // =============================================
  return `<!DOCTYPE html>
<html>
<head>
  <title>TIP-ETEEAP Application — ${data.applicant_name || "Applicant"}</title>
  <style>
    @page { size: A4; margin: 25mm 10mm 10mm 10mm; }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: "Times New Roman", Georgia, serif; color: #000; padding: 10px 20px; font-size: 10.5pt; line-height: 1.35; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    @media print { body { padding: 5px 15px; } }
  </style>
</head>
<body>

  <!-- ===== HEADER ===== -->
  <div style="display:flex;justify-content:space-between;align-items:center;border-bottom:3px double #000;padding-bottom:14px;margin-bottom:16px;margin-top:-1mm;">
    <div style="display:flex;gap:12px;align-items:center;">
      <img src="/assets/TIPLogo.png" alt="TIP Logo" style="width:56px;height:56px;object-fit:contain;" />
      <div>
        <h1 style="font-size:15pt;font-weight:bold;text-transform:uppercase;margin:0;">Technological Institute of the Philippines</h1>
        <p style="font-size:9.5pt;margin:2px 0 0;color:#333;">ETEEAP Accreditation and Equivalency Program</p>
      </div>
    </div>
    <div style="width:105px;height:105px;border:2px solid #000;display:flex;align-items:center;justify-content:center;flex-shrink:0;">
      ${data.photo_url
        ? `<img src="${data.photo_url}" style="width:100%;height:100%;object-fit:cover;" />`
        : `<span style="font-size:8pt;text-align:center;color:#666;">Affix 2x2<br/>Photo</span>`}
    </div>
  </div>

  <h2 style="text-align:center;font-size:12pt;font-weight:bold;text-decoration:underline;text-transform:uppercase;margin-bottom:20px;">
    Official Application for Accreditation and Equivalency
  </h2>

  <!-- ===== I. PERSONAL DATA ===== -->
  <div style="${sectionWrap}">
    ${header("I. Personal Data")}
    <table style="${tableWrap}">
      <tbody>
        ${pRow2("Full Name", `<b style="text-transform:uppercase;">${data.applicant_name || "—"}</b>`, "Campus", data.campus)}
        ${pRow2("Birthday", fmtDate(data.birth_date), "Age", data.age)}
        ${pRow2("Birthplace", data.birth_place, "Gender", data.gender)}
        ${pRow2("Civil Status", data.civil_status, "Nationality", data.nationality)}
        ${pRow2("Religion", data.religion, "Language Spoken", data.language_spoken)}
        ${pRow("City Address", data.city_address)}
        ${pRow("Permanent Address", data.permanent_address)}
        ${pRow2("Email Address", data.email_address, "Mobile Number", data.mobile_number)}
        ${pRow("Degree Applied For", `<b>${data.degree_applied_for || "—"}</b>`)}
        ${data.is_overseas ? pRow("Overseas Details", data.overseas_details) : ""}
      </tbody>
    </table>
  </div>

  <!-- ===== EMERGENCY CONTACT ===== -->
  ${data.emergency_contact_name ? `
  <div style="${sectionWrap}">
    ${header("Emergency Contact")}
    <table style="${tableWrap}">
      <tbody>
        ${pRow2("Contact Name", data.emergency_contact_name, "Relationship", data.emergency_relationship)}
        ${pRow2("Address", data.emergency_address, "Contact Number", data.emergency_contact_number)}
      </tbody>
    </table>
  </div>` : ""}

  <!-- ===== II. GOAL STATEMENT ===== -->
  ${data.goal_statement ? `
  <div style="${sectionWrap}">
    ${header("II. Statement of Goals")}
    <div style="border:1px solid #000;padding:20px 24px;text-align:justify;font-style:italic;min-height:100px;font-size:10pt;line-height:1.7;">
      ${safeParse(data.goal_statement) || "—"}
    </div>
  </div>` : ""}

  <!-- ===== II. DEGREE PRIORITIES ===== -->
  ${renderTable("II", "Degree Program Priorities", data.degree_priorities, ["Priority", "Program"], ["priority", "program"])}

  <!-- ===== III. EDUCATION (d.tsx keys: schoolName, schoolAddress, degreeProgram, yearGraduated, startDate, endDate) ===== -->
  ${renderTable("III", "Formal Educational Background", data.education_background,
    ["Level", "School Name", "School Address", "Degree/Program", "Year Graduated", "Start", "End"],
    ["_level", "schoolName", "schoolAddress", "degreeProgram", "yearGraduated", "startDate", "endDate"]
  )}

  <!-- ===== IV. NON-FORMAL (d.tsx keys: title, sponsor, venue, startDate, endDate) ===== -->
  ${renderTable("IV", "Non-Formal Education / Training", data.non_formal_education,
    ["Title", "Sponsor", "Venue", "Start Date", "End Date"],
    ["title", "sponsor", "venue", "startDate", "endDate"]
  )}

  <!-- ===== V. WORK EXPERIENCE (each sub-type has different field names) ===== -->
  ${renderTable("V-A", "Work Experience — Employment", safeParse(data.work_experiences)?.employment,
    ["Company", "Designation", "Start Date", "End Date", "Description"],
    ["company", "designation", "startDate", "endDate", "description"]
  )}
  ${renderTable("V-B", "Work Experience — Consultancy", safeParse(data.work_experiences)?.consultancy,
    ["Nature of Consultancy", "Company Address", "Start Date", "End Date"],
    ["consultancy", "companyAddress", "startDate", "endDate"]
  )}
  ${renderTable("V-C", "Work Experience — Self-Employment", safeParse(data.work_experiences)?.selfEmployment,
    ["Company", "Designation", "Reference", "Start Date", "End Date", "Description"],
    ["company", "designation", "reference", "startDate", "endDate", "description"]
  )}

  <!-- ===== VI. PROFESSIONAL DEVELOPMENT (split by sub-type) ===== -->
  ${renderTable("VI-A", "Memberships", safeParse(data.professional_development)?.memberships,
    ["Organization", "Designation", "Start Date", "End Date"],
    ["organization", "designation", "startDate", "endDate"]
  )}
  ${renderTable("VI-B", "Projects", safeParse(data.professional_development)?.projects,
    ["Title", "Designation", "Start", "End", "Description"],
    ["title", "designation", "startDate", "endDate", "description"]
  )}
  ${renderTable("VI-C", "Research", safeParse(data.professional_development)?.research,
    ["Title", "Institution", "Start", "End", "Description"],
    ["title", "institution", "startDate", "endDate", "description"]
  )}

  <!-- ===== VII. CERTIFICATIONS (d.tsx keys: title, certifyingBody, dateCertified, rating) ===== -->
  ${renderTable("VII", "Certifications", data.certifications,
    ["Title", "Certifying Body", "Date Certified", "Rating"],
    ["title", "certifyingBody", "dateCertified", "rating"]
  )}

  <!-- ===== VIII. PUBLICATIONS (d.tsx keys: title, circulation, level, yearPublished, yearPresented) ===== -->
  ${renderTable("VIII", "Publications", data.publications,
    ["Title", "Circulation", "Level", "Year Published", "Year Presented"],
    ["title", "circulation", "level", "yearPublished", "yearPresented"]
  )}

  <!-- ===== IX. INVENTIONS (d.tsx keys: title, agency, applicationDate, level, yearPublished) ===== -->
  ${renderTable("IX", "Inventions", data.inventions,
    ["Title", "Agency", "Application Date", "Level", "Year Published"],
    ["title", "agency", "applicationDate", "level", "yearPublished"]
  )}

  <!-- ===== X. RECOGNITIONS (d.tsx keys: title, awardingBody, startDate, endDate) ===== -->
  ${renderTable("X", "Recognitions", data.recognitions,
    ["Title", "Awarding Body", "Start Date", "End Date"],
    ["title", "awardingBody", "startDate", "endDate"]
  )}

  <!-- ===== XI. CREATIVE WORKS (i.tsx keys: title, institution, startDate, endDate) ===== -->
  ${renderTable("XI", "Creative Works & Special Accomplishments", data.creative_works,
    ["Title", "Institution", "Start Date", "End Date"],
    ["title", "institution", "startDate", "endDate"]
  )}

  <!-- ===== XII. SELF ASSESSMENT ===== -->
  ${renderAssessment("XII", "Self-Report / Self-Assessment", data.self_assessment)}

  <!-- ===== XIII. LIFELONG LEARNING ===== -->
  ${renderAssessment("XIII", "Lifelong Learning Experience", data.lifelong_learning)}

  <!-- ===== XV. PORTFOLIO ===== -->
  ${(() => {
    const portfolio = safeParse(data.portfolio);
    if (!Array.isArray(portfolio) || !portfolio.length) return "";
    const rows = portfolio.map((p: any, i: number) =>
      `<tr><td style="${td}">${i + 1}</td><td style="${td}">${p.title || "—"}</td><td style="${td}">${p.fileType || "—"}</td><td style="${td}">${p.url ? '<a href="' + p.url + '" style="color:#00c;">View</a>' : "—"}</td></tr>`
    ).join("");
    return `<div style="${sectionWrap}">${header("XV. Portfolio Documents")}<table style="${tableWrap}"><thead><tr><th style="${th}">#</th><th style="${th}">Document Title</th><th style="${th}">Type</th><th style="${th}">Link</th></tr></thead><tbody>${rows}</tbody></table></div>`;
  })()}

  <!-- ===== SIGNATURE ===== -->
  <div style="margin-top:40px;display:flex;justify-content:flex-end;page-break-inside:avoid;">
    <div style="text-align:center;width:280px;">
      ${data.signature_url
        ? `<img src="${data.signature_url}" style="height:55px;margin:0 auto;display:block;" />`
        : '<div style="height:55px;"></div>'}
      <div style="border-top:2px solid #000;margin-top:4px;padding-top:6px;">
        <p style="font-weight:bold;text-transform:uppercase;font-size:10pt;">${data.applicant_name || "—"}</p>
        <p style="font-size:8.5pt;font-style:italic;color:#333;">Signature over printed name</p>
        <p style="font-size:7.5pt;margin-top:10px;color:#777;">Generated: ${generatedDate}</p>
      </div>
    </div>
  </div>

  <!-- ===== FOOTER ===== -->
  <div style="position:fixed;bottom:0;left:0;right:0;display:flex;justify-content:space-between;padding:6px 42px;font-size:7.5pt;border-top:1px solid #999;color:#777;background:#fff;">
    <span>TIP-ETEEAP FORM 001-A</span>
    <span>Accreditation Office Copy</span>
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