// components/admin/printTemplate.tsx
"use client";

/**
 * TIP-ACAD-E-001 â€” Application and Preliminary Assessment Form (For Applicant)
 * 1-to-1 match with the official PDF (Revision Status/Date: 0/2025 July 04)
 */
export function generatePrintHTML(data: any): string {
  if (!data) return "";

  const safeParse = (raw: any): any => {
    if (!raw) return null;
    if (typeof raw === "string") { try { return JSON.parse(raw); } catch { return raw; } }
    return raw;
  };

  const fmtDate = (d: string | null | undefined): string => {
    if (!d) return "";
    try {
      const dt = new Date(d);
      return isNaN(dt.getTime()) ? d : new Intl.DateTimeFormat("en-PH", { year: "numeric", month: "2-digit", day: "2-digit" }).format(dt);
    } catch { return d; }
  };

  const th = `border:1px solid #000;padding:3px 5px;text-align:center;font-size:7.5pt;font-weight:bold;vertical-align:middle;background:#fff;`;
  const td = `border:1px solid #000;padding:3px 5px;font-size:7.5pt;vertical-align:top;`;
  const tbl = `width:100%;border-collapse:collapse;margin-bottom:6px;`;

  const uField = (label: string, value: any, width?: string) =>
    `<span style="font-size:8pt;${width ? `display:inline-block;width:${width};` : ""}white-space:nowrap;">${label}&nbsp;<span style="border-bottom:1px solid #000;display:inline-block;min-width:80px;padding-bottom:1px;font-size:8pt;">${value || ""}</span></span>`;

  const uRow = (label: string, value: any) =>
    `<div style="margin-bottom:3px;font-size:8pt;display:flex;align-items:baseline;gap:4px;">${label}:&nbsp;<span style="border-bottom:1px solid #000;flex:1;display:inline-block;padding-bottom:1px;">${value || ""}</span></div>`;

  const essayBox = (content: any, minH = "60px") =>
    `<div style="border:1px solid #000;padding:6px 8px;min-height:${minH};font-size:8pt;line-height:1.5;margin-bottom:6px;">${content || "&nbsp;"}</div>`;

  const secHdr = (text: string) =>
    `<div style="font-size:9pt;font-weight:bold;font-style:italic;margin:8px 0 3px;">${text}</div>`;

  const renderTable = (rawData: any, headers: string[], keys: string[], emptyRows = 3): string => {
    const parsed = safeParse(rawData);
    let items: any[] = [];
    if (parsed) {
      if (typeof parsed === "object" && !Array.isArray(parsed)) {
        items = Object.entries(parsed).flatMap(([level, arr]) =>
          Array.isArray(arr) ? arr.map((x: any) => ({ ...x, _level: level.charAt(0).toUpperCase() + level.slice(1) })) : []
        );
      } else if (Array.isArray(parsed)) { items = parsed; }
    }
    const headRow = headers.map(h => `<th style="${th}">${h}</th>`).join("");
    const bodyRows = items.length > 0
      ? items.map(item => `<tr>${keys.map(k => {
        if (k === "_level") return `<td style="${td}">${item._level || ""}</td>`;
        if (k.includes("+")) { const [a, b] = k.split("+"); const va = item[a] || ""; const vb = item[b] || ""; return `<td style="${td}">${va}${va && vb ? " â€“ " : ""}${vb}</td>`; }
        return `<td style="${td}">${item[k] || ""}</td>`;
      }).join("")}</tr>`).join("")
      : Array(emptyRows).fill(`<tr>${keys.map(() => `<td style="${td}">&nbsp;</td>`).join("")}</tr>`).join("");
    return `<table style="${tbl}"><thead><tr>${headRow}</tr></thead><tbody>${bodyRows}</tbody></table>`;
  };

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8"/>
  <title>TIP-ACAD-E-001 â€” ${data.applicant_name || "Applicant"}</title>
  <style>
    @page { size: A4; margin: 12mm 14mm 12mm 14mm; }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: Arial, Helvetica, sans-serif; color: #000; font-size: 9pt; line-height: 1.3; }
    @media print { body { padding: 0; } .no-print { display: none; } }
  </style>
</head>
<body>

<!-- PAGE HEADER -->
<div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:4px;">
  <div style="display:flex;gap:8px;align-items:center;">
    <img src="/assets/TIPLogo.png" alt="TIP" style="width:50px;height:50px;object-fit:contain;" onerror="this.style.display='none'" />
    <div style="font-size:10pt;font-weight:bold;line-height:1.3;">TECHNOLOGICAL<br/>INSTITUTE OF THE<br/>PHILIPPINES</div>
  </div>
  <div style="text-align:right;font-size:7pt;font-weight:bold;letter-spacing:1.5px;">
    T I P - A C A D - E - 0 0 1<br/>
    <span style="font-weight:normal;font-style:italic;letter-spacing:0;font-size:6.5pt;">Revision Status / Date: 0/2025 July 04</span>
  </div>
</div>

<!-- ETEEAP TITLE -->
<div style="text-align:center;font-size:9.5pt;font-weight:bold;margin-bottom:6px;">
  Expanded Tertiary Education Equivalency and Accreditation Program<br/>(ETEEAP)
</div>

<!-- PRIVACY CONSENT -->
<div style="margin-bottom:8px;">
  <div style="font-size:8pt;font-weight:bold;margin-bottom:2px;">PRIVACY CONSENT</div>
  <div style="font-size:7pt;line-height:1.4;">I understand and agree that by filling out this form, I am allowing the Technological Institute of the Philippines to collect, use, share, and disclose my personal information for advising and to retain these personal information for a period allowed based on applicable laws and school policy. The purpose and extent of collection, use, sharing, disclosure, and retention of my personal information was explained to me.</div>
</div>

<!-- FORM TITLE -->
<div style="text-align:center;margin-bottom:8px;">
  <div style="font-size:10.5pt;font-weight:bold;">APPLICATION AND PRELIMINARY ASSESSMENT FORM</div>
  <div style="font-size:9pt;font-style:italic;">For Applicant</div>
</div>

<!-- HEADER FIELDS + PHOTO -->
<div style="display:flex;justify-content:space-between;gap:10px;margin-bottom:8px;">
  <div style="flex:1;">
    <table style="width:100%;border-collapse:collapse;">
      <tr><td style="font-weight:bold;font-size:8.5pt;padding:3px 0;white-space:nowrap;width:145px;">Name of the Applicant:</td><td style="border-bottom:1px solid #000;font-size:8.5pt;padding:3px 4px;">${data.applicant_name || ""}</td></tr>
      <tr><td style="font-weight:bold;font-size:8.5pt;padding:3px 0;">Degree Applied For:</td><td style="border-bottom:1px solid #000;font-size:8.5pt;padding:3px 4px;">${data.degree_applied_for || ""}</td></tr>
      <tr><td style="font-weight:bold;font-size:8.5pt;padding:3px 0;">Campus:</td><td style="border-bottom:1px solid #000;font-size:8.5pt;padding:3px 4px;">${data.campus || ""}</td></tr>
      <tr><td style="font-weight:bold;font-size:8.5pt;padding:3px 0;">Date of Application:</td><td style="border-bottom:1px solid #000;font-size:8.5pt;padding:3px 4px;">${fmtDate(data.application_date || data.created_at)}</td></tr>
      <tr><td style="font-weight:bold;font-size:8.5pt;padding:3px 0;">Folder Link:</td><td style="border-bottom:1px solid #000;font-size:7.5pt;padding:3px 4px;word-break:break-all;">${data.folder_link || ""}</td></tr>
    </table>
  </div>
  <div style="width:90px;height:90px;border:1.5px solid #000;display:flex;align-items:center;justify-content:center;flex-shrink:0;overflow:hidden;">
    ${data.photo_url
      ? `<img src="${data.photo_url}" style="width:100%;height:100%;object-fit:cover;" />`
      : `<div style="text-align:center;font-size:7pt;color:#555;line-height:1.4;">1 x 1<br/>Picture</div>`}
  </div>
</div>

<!-- DIRECTION -->
<div style="font-size:7.5pt;margin-bottom:10px;line-height:1.5;">
  <b><i>Direction.</i></b> <i>Please accomplish the following information needed. Do not leave items unanswered. Indicate <b>"Not applicable"</b> as the case may be. All information declared in this file is under oath as well as submitted. Discovery of false information shall be disqualified from participating in the program.</i>
</div>

<!-- I. APPLICATION PROFILE -->
<div style="font-size:10pt;font-weight:bold;margin-bottom:4px;">I. APPLICATION PROFILE</div>

<!-- A. Personal Information -->
${secHdr("A. &nbsp; Personal Information")}
${uRow("Name (<i>Last Name, First Name Middle Name</i>)", data.applicant_name || "")}
${uRow("City Address", data.city_address || "")}
${uRow("Permanent Address", data.permanent_address || "")}
<div style="margin-bottom:3px;font-size:8pt;display:flex;gap:6px;flex-wrap:wrap;">
  ${uField("Age:", data.age || "", "100px")}
  ${uField("Gender:", data.gender || "", "130px")}
  ${uField("Nationality:", data.nationality || "", "150px")}
  ${uField("Religion:", data.religion || "", "150px")}
</div>
<div style="margin-bottom:3px;font-size:8pt;display:flex;gap:6px;flex-wrap:wrap;">
  ${uField("Civil Status:", data.civil_status || "", "150px")}
  ${uField("Birthday:", fmtDate(data.birth_date), "160px")}
  ${uField("Birth Place:", data.birth_place || "", "220px")}
</div>
<div style="margin-bottom:3px;font-size:8pt;display:flex;gap:6px;flex-wrap:wrap;">
  ${uField("Telephone No.:", "", "160px")}
  ${uField("Mobile No.:", data.mobile_number || "", "170px")}
  ${uField("Email Address:", data.email_address || "", "230px")}
</div>
${uRow("Languages Spoken", data.language_spoken || "")}
<div style="margin-bottom:3px;font-size:8pt;display:flex;gap:6px;">
  ${uField("Contact Person in case of emergency:", data.emergency_contact_name || "", "380px")}
  ${uField("Relationship:", data.emergency_relationship || "", "180px")}
</div>
<div style="margin-bottom:8px;font-size:8pt;display:flex;gap:6px;">
  ${uField("Address:", data.emergency_address || "", "380px")}
  ${uField("Contact No.:", data.emergency_contact_number || "", "180px")}
</div>

<!-- B. Priorities and Goals -->
${secHdr("B. &nbsp; Priorities and Goals")}
<div style="font-size:8.5pt;margin-bottom:4px;">1. Degree program being applied for.</div>
${(() => {
      const p = safeParse(data.degree_priorities);
      const labels = ["First Priority", "Second Priority", "Third Priority"];
      if (Array.isArray(p) && p.length > 0) {
        return p.map((item: any, i: number) =>
          `<div style="margin-left:20px;margin-bottom:2px;font-size:8.5pt;font-style:italic;">${labels[i] || `Priority ${i + 1}`}:&nbsp;<span style="border-bottom:1px solid #000;display:inline-block;min-width:280px;font-style:normal;">${typeof item === "string" ? item : (item?.program || "")}</span></div>`
        ).join("");
      }
      return labels.map((l, i) =>
        `<div style="margin-left:20px;margin-bottom:2px;font-size:8.5pt;font-style:italic;">${l}:&nbsp;<span style="border-bottom:1px solid #000;display:inline-block;min-width:280px;font-style:normal;">${i === 0 ? (data.degree_applied_for || "") : ""}</span></div>`
      ).join("");
    })()}
<div style="font-size:7pt;font-style:italic;margin:3px 0 6px;color:#333;">(Note: The T.I.P. ETEEAP Unit Head and the Assessors have the right to give the final approval on what program the applicant shall enroll.)</div>

<div style="font-size:8.5pt;margin-bottom:3px;">2. Statement of your goals, objectives, and purposes in applying for the degree.</div>
${(() => {
      const gs = safeParse(data.goal_statement);
      const statement = typeof gs === "object" && gs !== null ? gs.statement : (typeof gs === "string" ? gs : "");
      const plan = typeof gs === "object" && gs !== null ? gs.plan : "";
      const completion = typeof gs === "object" && gs !== null ? gs.completion : "";
      return `
${essayBox(statement, "70px")}
<div style="font-size:8.5pt;margin-bottom:3px;">3. Indicate how much time you plan to devote to personal learning activities so that you can finish the requirements in the prescribed program. Please specify your response.</div>
${essayBox(plan, "50px")}
<div style="font-size:8.5pt;margin-bottom:3px;">4. For overseas applicants (<i>Otherwise, please indicate "Not Applicable"</i>), describe how you plan to obtain accreditation/equivalency (e.g., when you plan to come to the Philippines).</div>
${essayBox(data.is_overseas ? (data.overseas_details || "") : "Not Applicable", "50px")}
<div style="font-size:8.5pt;margin-bottom:3px;">5. How soon do you need to complete equivalency/accreditation?</div>
${essayBox(completion, "50px")}
  `;
    })()}

<!-- C. Educational Background -->
<div style="font-size:9pt;font-weight:bold;margin:8px 0 2px;">C. &nbsp; Educational Background</div>
<div style="font-size:7pt;font-style:italic;margin-bottom:4px;">(All information indicated herein shall be certified true copy and notarized.)</div>

<div style="font-size:8.5pt;font-style:italic;margin-bottom:3px;">1. Formal Education</div>
${renderTable(data.education_background,
      ["Level", "Degree program", "Name of the School", "School Address", "Year Graduated", "Inclusive Dates of Attendance<br/>(mm/dd/yy-mm/dd/yy)"],
      ["_level", "degreeProgram", "schoolName", "schoolAddress", "yearGraduated", "startDate+endDate"],
      5
    )}

<div style="font-size:8.5pt;font-style:italic;margin:4px 0 3px;">2. Non-Formal Education</div>
${renderTable(data.non_formal_education,
      ["Title of the Training, Seminar, Workshop, Convention, Conference, etc.<br/><i style='font-weight:normal'>(ex. Seminar: Title, Training: Title; Workshop: Title; etc.)</i>", "Sponsored or Conducted by", "Venue", "Inclusive Dates of Attendance<br/>(mm/dd/yy-mm/dd/yy)"],
      ["title", "sponsor", "venue", "startDate+endDate"],
      3
    )}

<div style="font-size:8.5pt;font-style:italic;margin:4px 0 3px;">3. Other Certification Credentials/Eligibility</div>
${renderTable(data.certifications,
      ["Title of the Certification<br/><i style='font-weight:normal'>(ex. Civil Service Examination, TESDA, PRC, Microsoft Certification, CISCO, etc.)</i>", "Name and Address of the Certifying Body", "Date Certified<br/>(Month / Day / Year)", "Rating"],
      ["title", "certifyingBodyName+certifyingBodyAddress", "dateCertified", "rating"],
      3
    )}

<!-- D. Publications -->
${secHdr("D. &nbsp; Publications")}
${renderTable(data.publications,
      ["Title of the Publications<br/><i style='font-weight:normal'>(ex., Research, Journal, Training Module, Book, Workbook, Lab Manual, etc.)</i>", "Circulation", "Level<br/>(Local, National, International)", "Year Published<br/>(Month / Day / Year)", "Year Presented<br/>(Month / Day / Year)"],
      ["title", "circulation", "level", "yearPublished", "yearPresented"],
      3
    )}

<!-- E. Invention/Patent -->
${secHdr("E. &nbsp; Invention/Patent")}
${renderTable(data.inventions,
      ["Title of the Invention/Patent", "Agency<br/><i style='font-weight:normal'>(ex., IPOPHL, WIPO)</i>", "Application Date<br/>(Month / Day / Year)", "Level<br/>(National, International)", "Year Published<br/>(Month / Day / Year)"],
      ["title", "agency", "applicationDate", "level", "yearPublished"],
      3
    )}

<!-- F. Work Experiences -->
${secHdr("F. &nbsp; Work Experiences")}
<div style="font-size:8.5pt;font-style:italic;margin-bottom:3px;">1. Employment (i.e., from current to previous employment)</div>
${renderTable(safeParse(data.work_experiences)?.employment,
      ["Company/<br/>Address", "Designation/<br/>Position", "Brief Description<br/>about your work", "Inclusive Dates of Attendance<br/>(mm/dd/yy-mm/dd/yy)"],
      ["company+companyAddress", "designation", "description", "startDate+endDate"],
      3
    )}

<div style="font-size:8.5pt;font-style:italic;margin:4px 0 3px;">2. Consultancy</div>
${renderTable(safeParse(data.work_experiences)?.consultancy,
      ["Consultancies<br/><i style='font-weight:normal'>(ex. Title of the Consultation Activity and Brief Description)</i>", "Name and Address of the Company", "Inclusive Dates of Attendance<br/>(mm/dd/yy-mm/dd/yy)"],
      ["consultancy", "companyName+companyAddress", "startDate+endDate"],
      3
    )}

<div style="font-size:8.5pt;font-style:italic;margin:4px 0 3px;">3. Self-Employment (Business Proprietorship/Startup)</div>
${renderTable(safeParse(data.work_experiences)?.selfEmployment,
      ["Company/<br/>Address", "Designation/<br/>Position", "Brief Description<br/>of your work", "Reference Person<br/>and Contact No.", "Inclusive Dates<br/>of Attendance<br/>(mm/dd/yy-mm/dd/yy)"],
      ["company+companyAddress", "designation", "description", "reference", "startDate+endDate"],
      3
    )}

<!-- G. Recognitions -->
${secHdr("G. &nbsp; Recognitions Received")}
<div style="font-size:7pt;font-style:italic;margin-bottom:3px;">(Please describe all the honors, awards, citations, and recognitions received from schools, community and civic organizations, as well as citations for work excellence, outstanding accomplishments, community service, etc.)</div>
${renderTable(data.recognitions,
      ["Title of Recognition<br/><i style='font-weight:normal'>(ex. Honor, Award, Citation, Recognition, etc.)</i>", "Name and Address<br/>of the Awarding Body", "Inclusive Dates of Attendance<br/>(Month / Day / Year)"],
      ["title", "awardingBodyName+awardingBodyAddress", "startDate+endDate"],
      3
    )}

<!-- H. Professional Development -->
${secHdr("H. &nbsp; Professional Development Activities")}
<div style="font-size:8.5pt;font-style:italic;margin-bottom:3px;">1. Professional Organization Membership</div>
${renderTable(safeParse(data.professional_development)?.memberships,
      ["Organization", "Designation", "Inclusive Dates of Attendance<br/>(mm/dd/yy-mm/dd/yy)"],
      ["organization", "designation", "startDate+endDate"],
      3
    )}

<div style="font-size:8.5pt;font-style:italic;margin:4px 0 3px;">2. Project Management/Involvement</div>
${renderTable(safeParse(data.professional_development)?.projects,
      ["Title of the Project", "Designation<br/><i style='font-weight:normal'>(Project Leader, Member, Statistician, Data Analyst, etc.)</i>", "Brief Description<br/>about your involvement", "Inclusive Dates of Attendance<br/>(mm/dd/yy-mm/dd/yy)"],
      ["title", "designation", "description", "startDate+endDate"],
      3
    )}

<div style="font-size:8.5pt;font-style:italic;margin:4px 0 3px;">3. Research and Development (R&amp;D), Strategic Management Plan, Operational Plan, Marketing Plan, and other Business Related Activities/Output</div>
${renderTable(safeParse(data.professional_development)?.research,
      ["Title and Brief Description", "Name and Address of the Institution/Industry/Agency to testify such work and accomplishment", "Inclusive Dates<br/>(mm/dd/yy-mm/dd/yy)"],
      ["title", "institution", "startDate+endDate"],
      3
    )}

<!-- I. Creative Works -->
${secHdr("I. &nbsp; Creative Works and Special Accomplishments")}
<div style="font-size:7.5pt;font-style:italic;margin-bottom:4px;">(Please enumerate the various creative works and special accomplishments you have done in the past. Examples of these are literary fiction and non-fiction writings, musical work, products of visual performing arts, exceptional accomplishments in sports, social, cultural, and leisure activities, etc. which can lead one to conclude the level of expertise you have obtained in certain fields of interest. Include also participation in competitions and prizes obtained.)</div>
${renderTable(data.creative_works,
      ["Title and Brief Description", "Name and Address of the Institution/Industry/Agency to testify such work and accomplishment", "Inclusive Dates<br/>(mm/dd/yy-mm/dd/yy)"],
      ["title", "institutionName+institutionAddress", "startDate+endDate"],
      3
    )}

<!-- J. Lifelong Learning -->
${secHdr("J. &nbsp; Lifelong Learning Experience")}
<div style="font-size:7.5pt;font-style:italic;margin-bottom:6px;">(Please indicate the various life experiences from which you must have derived some learning experience.)</div>
${(() => {
      const ll = safeParse(data.lifelong_learning);
      const items = [
        { key: "hobbies", label: "1. Hobbies/Leisure Activities", desc: "(Leisure activities that involve rating of skills for competition and other purposes (e.g., \"belt concept in Tae-kwon-do) may also indicate your level for ease in evaluation. On the other hand, watching Negosiyente on a regular basis can be considered a learning opportunity.)" },
        { key: "skills", label: "2. Special Skills", desc: "(Note down those special skills you think must be related to the field of study you want to pursue.)" },
        { key: "workActivities", label: "3. Work-Related Activities", desc: "(Some work-related activities are occasions for you to learn something new. For example, being assigned to projects beyond your usual job description where you learned new skills and knowledge (i.e., analytical, problem-solving, numerical, etc.). Please do not include the formal training programs you already cited. However, you may include here experiences that can be classified as on-the-job training or apprenticeship.)" },
        { key: "volunteer", label: "4. Volunteer Activities", desc: "(List only volunteer activities that demonstrate learning opportunities, and are related to the course you are applying for credit; e.g., counseling programs, sports coaching, project organizing or coordination, organizational leadership, mentorship or tutorial on mathematics and physics concepts, and the like)" },
        { key: "travels", label: "5. Travels: Cite places visited and purpose of travel", desc: "(Include a write-up of the nature of travel undertaken, whether for leisure, employment, business or other purposes. State in clear terms what new learning experience was obtained from these travels and how it helped you become a better person.)" },
      ];
      return items.map(({ key, label, desc }) =>
        `<div style="margin-bottom:6px;">
      <div style="font-size:8.5pt;margin-bottom:2px;">${label} <span style="font-style:italic;font-size:7.5pt;">${desc}</span></div>
      ${essayBox(ll?.[key] || null, "50px")}
    </div>`
      ).join("");
    })()}

<!-- K. ABET Program Criteria -->
<div style="font-size:9pt;font-weight:bold;margin:8px 0 4px;">K. &nbsp; ABET Program Criteria <span style="font-style:italic;font-weight:normal;font-size:8pt;">(For Engineering and Computing Programs only)</span></div>
<div style="font-size:8pt;margin-bottom:4px;">As part of your application for the <span style="border-bottom:1px solid #000;display:inline-block;min-width:140px;">${data.degree_applied_for || ""}</span> program, please submit documentation of your related work experience and lifelong learning activities in mathematics and sciences, specifically highlighting experiences in probability and statistics, calculus, and relevant scientific fields. Detail how these experiences relate to the analysis and design of complex systems, including both hardware and software components. Ensure your submission is formatted as a single PDF and uploaded by [insert deadline date].</div>
${essayBox(data.abet_criteria || "", "60px")}

<!-- II. SELF-REPORT / SELF-ASSESSMENT -->
<div style="font-size:10pt;font-weight:bold;margin:12px 0 4px;">II. SELF-REPORT/SELF-ASSESSMENT</div>
<div style="font-size:8.5pt;margin-bottom:6px;margin-left:12px;">A. &nbsp; Write an essay on the following questions:</div>
${(() => {
      const ll = safeParse(data.lifelong_learning);
      const sa = ll?._selfAssessment || safeParse(data.self_assessment);
      const qs = [
        { key: "jobLearning", q: "1. What did you learn about your job?" },
        { key: "teamworkLearning", q: "2. What did you learn about working with others?" },
        { key: "selfLearning", q: "3. What did you learn about yourself?" },
        { key: "workBenefits", q: "4. What were the benefits of your work experience?" },
      ];
      return qs.map(({ key, q }) =>
        `<div style="margin-bottom:6px;">
      <div style="font-size:8.5pt;font-style:italic;margin-bottom:2px;">${q}</div>
      ${essayBox(sa?.[key] || null, "60px")}
    </div>`
      ).join("") + `
  <div style="margin-bottom:6px;">
    <div style="font-size:8.5pt;margin-bottom:2px;">B. &nbsp; Write an essay on how attaining a degree contributes to your personal development, community, workplace, society, and country.</div>
    ${essayBox(sa?.degreeContribution || sa?.essay || null, "70px")}
  </div>`;
    })()}

<!-- DECLARATION -->
<div style="margin-top:14px;font-size:8.5pt;line-height:1.6;">
  I declare under oath that the foregoing information stated and documents presented herein are true and correct. Accomplished on this __ day of __________, 20_____.
</div>

<!-- SIGNATURE -->
<div style="margin-top:20px;page-break-inside:avoid;">
  <div style="font-size:8.5pt;margin-bottom:6px;">Signed:</div>
  <div style="width:280px;margin-top:8px;">
    ${data.signature_url
      ? `<img src="${data.signature_url}" style="height:48px;display:block;margin-bottom:4px;" />`
      : `<div style="height:48px;"></div>`}
    <div style="border-top:1.5px solid #000;padding-top:4px;">
      <div style="font-size:8.5pt;text-align:center;">${data.applicant_name || ""}</div>
      <div style="font-size:7pt;text-align:center;">Printed Name of the Applicant with Signature</div>
    </div>
  </div>
</div>

<script>window.onload = function() { setTimeout(function() { window.print(); }, 600); };</script>
</body>
</html>`;
}

export function openPrintPreview(data: any): void {
  const printWindow = window.open("", "_blank", "width=900,height=700");
  if (!printWindow) { alert("Please allow pop-ups to use the print feature."); return; }
  printWindow.document.write(generatePrintHTML(data));
  printWindow.document.close();
}

// â”€â”€â”€ TIP-ACAD-E-002 Portfolio Requirements Form â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function _portfolioHTML(submission: any, appData: any): string {
  const fmt = (d: string | null | undefined): string => {
    if (!d) return "";
    try { const dt = new Date(d); return isNaN(dt.getTime()) ? d : new Intl.DateTimeFormat("en-PH", { year: "numeric", month: "2-digit", day: "2-digit" }).format(dt); }
    catch { return d; }
  };

  const name = appData?.applicant_name || submission?.full_name || "";
  const degree = appData?.degree_applied_for || submission?.degree_program || "";
  const campus = appData?.campus || submission?.campus || "";
  const appDate = fmt(appData?.application_date || appData?.created_at || submission?.created_at);
  const folderLink = appData?.folder_link || "";
  const photoUrl = appData?.photo_url || submission?.photo_url || "";
  const sigUrl = appData?.signature_url || submission?.signature || "";
  const cityAddr = appData?.city_address || "";
  const permAddr = appData?.permanent_address || "";
  const mobile = appData?.mobile_number || "";
  const email = appData?.email_address || "";

  // portform files keyed by category
  const pf: Array<{ key: string; label?: string; url: string }> =
    Array.isArray(submission?.portfolio_files) ? submission.portfolio_files : [];
  // Extract filename from URL path
  const fileName = (url: string) => {
    try { return decodeURIComponent(url.split("/").pop()?.split("_").slice(2).join("_") || url.split("/").pop() || url); }
    catch { return url.split("/").pop() || url; }
  };
  const links = (key: string) =>
    pf.filter(f => f.key === key)
      .map(f => `<div style="font-size:7.5pt;margin-bottom:2px;">&#128206; ${f.label || fileName(f.url)}</div>`)
      .join("");

  // credential files from application (C-I) — grouped by section
  const edu  = appData?.education_background || {};
  const work = appData?.work_experiences     || {};
  const pd   = appData?.professional_development || {};

  const item = (label: string) => `<div style="font-size:7.5pt;margin-bottom:2px;padding-left:8px;">&#128206; ${label}</div>`;
  const grpHdr = (title: string) => `<div style="font-size:7pt;font-weight:bold;text-transform:uppercase;margin:5px 0 2px;letter-spacing:0.5px;">${title}</div>`;

  const makeGroup = (title: string, entries: string[]) =>
    entries.length ? grpHdr(title) + entries.map(item).join("") : "";

  const eduEntries = [
    ...(edu.tertiary      || []).filter((e: any) => e.fileUrl).map((e: any) => `Tertiary: ${e.schoolName}${e.degreeProgram ? ` \u2014 ${e.degreeProgram}` : ""}${e.yearGraduated ? ` (${e.yearGraduated})` : ""}`),
    ...(edu.secondary     || []).filter((e: any) => e.fileUrl).map((e: any) => `Secondary: ${e.schoolName}${e.yearGraduated ? ` (${e.yearGraduated})` : ""}`),
    ...(edu.elementary    || []).filter((e: any) => e.fileUrl).map((e: any) => `Elementary: ${e.schoolName}${e.yearGraduated ? ` (${e.yearGraduated})` : ""}`),
    ...(edu.technical     || []).filter((e: any) => e.fileUrl).map((e: any) => `Technical: ${e.schoolName}${e.yearGraduated ? ` (${e.yearGraduated})` : ""}`),
    ...(appData?.non_formal_education || []).filter((e: any) => e.fileUrl).map((e: any) => e.title),
  ];
  const certEntries   = (appData?.certifications || []).filter((e: any) => e.fileUrl).map((e: any) => e.title);
  const pubInvEntries = [
    ...(appData?.publications || []).filter((e: any) => e.fileUrl).map((e: any) => e.title),
    ...(appData?.inventions   || []).filter((e: any) => e.fileUrl).map((e: any) => e.title),
  ];
  const workEntries = [
    ...(work.employment     || []).filter((e: any) => e.fileUrl).map((e: any) => `${e.company}${e.designation ? ` \u2014 ${e.designation}` : ""}`),
    ...(work.consultancy    || []).filter((e: any) => e.fileUrl).map((e: any) => e.consultancy),
    ...(work.selfEmployment || []).filter((e: any) => e.fileUrl).map((e: any) => `${e.company}${e.designation ? ` \u2014 ${e.designation}` : ""}`),
  ];
  const recEntries = (appData?.recognitions || []).filter((e: any) => e.fileUrl).map((e: any) => e.title);
  const pdEntries  = [
    ...(pd.memberships || []).filter((e: any) => e.fileUrl).map((e: any) => e.organization),
    ...(pd.projects    || []).filter((e: any) => e.fileUrl).map((e: any) => e.title),
    ...(pd.research    || []).filter((e: any) => e.fileUrl).map((e: any) => e.title),
  ];
  const cwEntries = (appData?.creative_works || []).filter((e: any) => e.fileUrl).map((e: any) => e.title);

  const credHTML = [
    makeGroup("C. Educational Background", eduEntries),
    makeGroup("D. Certifications",         certEntries),
    makeGroup("E. Publications & Inventions", pubInvEntries),
    makeGroup("F. Work Experience",        workEntries),
    makeGroup("G. Recognitions",           recEntries),
    makeGroup("H. Professional Development", pdEntries),
    makeGroup("I. Creative Works",         cwEntries),
  ].filter(Boolean).join("");

  const row1links = credHTML + links("eteeapForm");

  const TH = "border:1px solid #000;padding:4px 6px;font-size:8pt;font-weight:bold;text-align:center;background:#fff;vertical-align:middle;";
  const TD = "border:1px solid #000;padding:4px 6px;font-size:8pt;vertical-align:top;";
  const uRow = (lbl: string, val: string) =>
    `<div style="margin-bottom:4px;font-size:8.5pt;display:flex;align-items:baseline;gap:4px;">${lbl}:&nbsp;<span style="border-bottom:1px solid #000;flex:1;display:inline-block;padding-bottom:1px;">${val}</span></div>`;
  const photo = photoUrl
    ? `<img src="${photoUrl}" style="width:100%;height:100%;object-fit:cover;" />`
    : `<div style="text-align:center;font-size:7pt;color:#555;line-height:1.4;">1 x 1<br/>Picture</div>`;
  const sig1 = sigUrl ? `<img src="${sigUrl}" style="height:44px;display:block;margin-bottom:2px;" />` : `<div style="height:44px;"></div>`;
  const sig2 = sigUrl ? `<img src="${sigUrl}" style="height:48px;display:block;margin-bottom:4px;" />` : `<div style="height:48px;"></div>`;

  return `<!DOCTYPE html>
<html><head><meta charset="UTF-8"/>
<title>TIP-ACAD-E-002 \u2014 ${name}</title>
<style>
  @page{size:A4;margin:12mm 14mm 12mm 14mm;}
  *{box-sizing:border-box;margin:0;padding:0;}
  body{font-family:Arial,Helvetica,sans-serif;color:#000;font-size:9pt;line-height:1.3;}
  @media print{body{padding:0;}.no-print{display:none;}}
</style></head><body>

<!-- PAGE HEADER -->
<div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:4px;">
  <div style="display:flex;gap:8px;align-items:center;">
    <img src="/assets/TIPLogo.png" alt="TIP" style="width:50px;height:50px;object-fit:contain;" onerror="this.style.display='none'"/>
    <div style="font-size:10pt;font-weight:bold;line-height:1.3;">TECHNOLOGICAL<br/>INSTITUTE OF THE<br/>PHILIPPINES</div>
  </div>
  <div style="text-align:right;font-size:7pt;font-weight:bold;letter-spacing:1.5px;">
    T I P - A C A D - E - 0 0 2<br/>
    <span style="font-weight:normal;font-style:italic;letter-spacing:0;font-size:6.5pt;">Revision Status / Date: 0/2025 July 04</span>
  </div>
</div>

<!-- ETEEAP TITLE -->
<div style="text-align:center;font-size:9.5pt;font-weight:bold;margin-bottom:6px;">
  Expanded Tertiary Education Equivalency and Accreditation Program<br/>(ETEEAP)
</div>

<!-- PRIVACY CONSENT -->
<div style="margin-bottom:8px;">
  <div style="font-size:8pt;font-weight:bold;margin-bottom:2px;">PRIVACY CONSENT</div>
  <div style="font-size:7pt;line-height:1.4;">I understand and agree that by filling out this form, I am allowing the Technological Institute of the Philippines to collect, use, share, and disclose my personal information for advising and to retain these personal information for a period allowed based on applicable laws and school policy. The purpose and extent of collection, use, sharing, disclosure, and retention of my personal information was explained to me.\\</div>
</div>

<!-- FORM TITLE -->
<div style="text-align:center;margin-bottom:8px;">
  <div style="font-size:10.5pt;font-weight:bold;">PORTFOLIO REQUIREMENTS FORM</div>
  <div style="font-size:9pt;font-style:italic;">For Applicant</div>
</div>

<!-- HEADER FIELDS + PHOTO -->
<div style="display:flex;justify-content:space-between;gap:10px;margin-bottom:8px;">
  <div style="flex:1;">
    <table style="width:100%;border-collapse:collapse;">
      <tr><td style="font-weight:bold;font-size:8.5pt;padding:3px 0;white-space:nowrap;width:145px;">Name of the Applicant:</td><td style="border-bottom:1px solid #000;font-size:8.5pt;padding:3px 4px;">${name}</td></tr>
      <tr><td style="font-weight:bold;font-size:8.5pt;padding:3px 0;">Degree Applied For:</td><td style="border-bottom:1px solid #000;font-size:8.5pt;padding:3px 4px;">${degree}</td></tr>
      <tr><td style="font-weight:bold;font-size:8.5pt;padding:3px 0;">Campus:</td><td style="border-bottom:1px solid #000;font-size:8.5pt;padding:3px 4px;">${campus}</td></tr>
      <tr><td style="font-weight:bold;font-size:8.5pt;padding:3px 0;">Date of Application:</td><td style="border-bottom:1px solid #000;font-size:8.5pt;padding:3px 4px;">${appDate}</td></tr>
      <tr><td style="font-weight:bold;font-size:8.5pt;padding:3px 0;">Folder Link:</td><td style="border-bottom:1px solid #000;font-size:7.5pt;padding:3px 4px;word-break:break-all;">${folderLink}</td></tr>
    </table>
  </div>
  <div style="width:90px;height:90px;border:1.5px solid #000;display:flex;align-items:center;justify-content:center;flex-shrink:0;overflow:hidden;">${photo}</div>
</div>

<!-- DIRECTION -->
<div style="font-size:7.5pt;margin-bottom:10px;line-height:1.5;">
  <b><i>Direction.</i></b> <i>Please accomplish the following information needed. Do not leave items unanswered. All information declared in this file is under oath as well as submitted. Discovery of false information shall be disqualified from participating in the program.</i>
</div>

<!-- I. PORTFOLIO COVER SHEET -->
<div style="font-size:10pt;font-weight:bold;margin-bottom:6px;">I. PORTFOLIO COVER SHEET</div>
${uRow("Name (<i>Last Name, First Name Middle Name</i>)", name)}
${uRow("City Address", cityAddr)}
${uRow("Permanent Address", permAddr)}
<div style="margin-bottom:4px;font-size:8.5pt;display:flex;gap:10px;flex-wrap:wrap;">
  <span style="white-space:nowrap;">Telephone No.:&nbsp;<span style="border-bottom:1px solid #000;display:inline-block;min-width:100px;">&nbsp;</span></span>
  <span style="white-space:nowrap;">Mobile No.:&nbsp;<span style="border-bottom:1px solid #000;display:inline-block;min-width:120px;">${mobile}</span></span>
  <span style="white-space:nowrap;">Email Address:&nbsp;<span style="border-bottom:1px solid #000;display:inline-block;min-width:160px;">${email}</span></span>
</div>
${uRow("Degree Program intended to enroll", degree)}

<div style="margin:14px 0 10px;font-size:8.5pt;line-height:1.8;text-align:justify;">
  I understand that it is my responsibility to ensure that this portfolio is applicable to the program I am applying for equivalency and accreditation to earn a Bachelor&apos;s degree.
</div>
<div style="margin-bottom:24px;font-size:8.5pt;line-height:1.8;text-align:justify;">
  I also acknowledge that every information is true and correct. Furthermore, I understand that every form of academic dishonesty is considered adequate grounds for dismissal from the Institute and for the revocation of credits granted.
</div>

<!-- SIGNATURE BLOCK PAGE 1 -->
<div style="display:flex;gap:40px;margin-bottom:8px;page-break-inside:avoid;">
  <div style="width:260px;">
    ${sig1}
    <div style="border-top:1.5px solid #000;padding-top:3px;">
      <div style="font-size:8pt;text-align:center;">${name}</div>
      <div style="font-size:7pt;text-align:center;">Printed Name of the Applicant with Signature</div>
    </div>
  </div>
  <div style="width:120px;">
    <div style="height:44px;"></div>
    <div style="border-top:1.5px solid #000;padding-top:3px;">
      <div style="font-size:8pt;text-align:center;">${appDate}</div>
      <div style="font-size:7pt;text-align:center;">Date</div>
    </div>
  </div>
</div>
<div style="font-size:7pt;text-align:right;margin-top:6px;">1 of 2</div>

<!-- PAGE BREAK -->
<div style="page-break-before:always;"></div>

<!-- PAGE 2 HEADER (form code only, matching PDF) -->
<div style="text-align:right;font-size:7pt;font-weight:bold;letter-spacing:1.5px;margin-bottom:12px;">
  T I P - A C A D - E - 0 0 2<br/>
  <span style="font-weight:normal;font-style:italic;letter-spacing:0;font-size:6.5pt;">Revision Status / Date: 0/2025 July 04</span>
</div>

<!-- II. PORTFOLIO CONTENT -->
<div style="font-size:10pt;font-weight:bold;margin-bottom:3px;">II. PORTFOLIO CONTENT</div>
<div style="font-size:8pt;margin-bottom:5px;">Please scan and submit the following requirements with proper labelings and links</div>

<table style="width:100%;border-collapse:collapse;margin-bottom:10px;">
  <thead>
    <tr>
      <th style="${TH}width:52%;">Portfolio Content</th>
      <th style="${TH}width:48%;">Portfolio Links</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td style="${TD}">
        <b>Accomplished ETEEAP Application and Preliminary Assessment Form</b><br/>
        <i>(Notarized)</i><br/>
        <i>Please submit your credentials as follows:</i><br/>
        &nbsp;- <b>ProfEd</b> <i>(Trainings, Certificates, Recognitions, Eligibility, Recommendation Letter, Work Experience, Professional Development Activities, etc.)</i><br/>
        &nbsp;- <b>GenEd</b> (requirement)<br/>
        &nbsp;- <b>Math/Physics</b> <i>(Mentorship or Tutorial activities, Project Involvement, Data Analysis, Use of Statistical Tools, etc.)</i><br/>
        &nbsp;- <b>PE and NSTP</b> (Certificate Intramurals, Sportsfest, Wellness)<br/>
        &nbsp;- <b>Chemistry</b><br/>
        &nbsp;- <b>ABET Program Criteria</b>
      </td>
      <td style="${TD}">${row1links}</td>
    </tr>
    <tr>
      <td style="${TD}"><b>Curriculum Vitae</b><br/><i>(a comprehensive discussion of why you intend to enroll at T.I.P. ETEEAP Unit)</i></td>
      <td style="${TD}">${links("cv")}</td>
    </tr>
    <tr>
      <td style="${TD}"><b>Psychological Test</b><br/><i>(to be administered by the Guidance and Counseling Center after Preliminary Assessment)</i></td>
      <td style="${TD}">${links("psychTest")}</td>
    </tr>
    <tr>
      <td style="${TD}"><b>Statement of Ownership/Authenticity</b><br/><i>(provide a letter stating ownership/authenticity of the documents submitted)</i></td>
      <td style="${TD}">${links("authenticity")}</td>
    </tr>
    <tr>
      <td style="${TD}"><b>Endorsement Letter from the latest employer</b></td>
      <td style="${TD}">${links("endorsement")}</td>
    </tr>
    <tr>
      <td style="${TD}">
        <b>Other Documents Required</b><br/>
        &nbsp;&nbsp;-&nbsp;PSA Birth Certificate<br/>
        &nbsp;&nbsp;-&nbsp;Barangay Clearance/NBI Clearance/Passport<br/>
        &nbsp;&nbsp;-&nbsp;Marriage Certificate <i>(for married woman)</i>
      </td>
      <td style="${TD}">${links("otherDocs")}</td>
    </tr>
    <tr>
      <td style="${TD}"><b>Workplace Visitation Checklist</b></td>
      <td style="${TD}">${links("visitation")}</td>
    </tr>
    <tr>
      <td style="${TD}"><b>Other Evidence of capability and knowledge in the field for equivalency and accreditation</b> <i>(if any)</i></td>
      <td style="${TD}">${links("otherEvidence")}</td>
    </tr>
  </tbody>
</table>

<!-- DECLARATION -->
<div style="margin-top:10px;font-size:8.5pt;line-height:1.6;">
  I declare under oath that the foregoing information stated and documents presented herein are true and correct. Accomplished on this __ day of __________, 20_____.
</div>

<!-- SIGNATURE PAGE 2 -->
<div style="margin-top:20px;page-break-inside:avoid;">
  <div style="font-size:8.5pt;margin-bottom:6px;">Signed:</div>
  <div style="width:280px;margin-top:8px;">
    ${sig2}
    <div style="border-top:1.5px solid #000;padding-top:4px;">
      <div style="font-size:8.5pt;text-align:center;">${name}</div>
      <div style="font-size:7pt;text-align:center;">Printed Name of the Applicant with Signature</div>
    </div>
  </div>
</div>
<div style="font-size:7pt;text-align:right;margin-top:16px;">2 of 2</div>

<script>window.onload=function(){setTimeout(function(){window.print();},600);};</script>
</body></html>`;
}

export function generatePortfolioPrintHTML(submission: any, appData: any): string {
  return _portfolioHTML(submission, appData);
}

export function openPortfolioPrintPreview(submission: any, appData: any): void {
  const w = window.open("", "_blank", "width=900,height=700");
  if (!w) { alert("Please allow pop-ups to use the print feature."); return; }
  w.document.write(_portfolioHTML(submission, appData));
  w.document.close();
}

export default function TIPPrintTemplate({ data }: { data: any }) {
  return null;
}
