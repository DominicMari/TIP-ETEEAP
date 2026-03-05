// components/admin/printTemplate.tsx
"use client";

/**
 * Generates the full HTML string for the formal TIP-ETEEAP print template.
 * Called by openPrintPreview() to render in a new browser window.
 */
export function generatePrintHTML(data: any): string {
  if (!data) return "";

  const safeParse = (raw: any): any => {
    if (!raw) return null;
    if (typeof raw === "string") {
      try {
        return JSON.parse(raw);
      } catch {
        return raw;
      }
    }
    return raw;
  };

  const fmtDate = (dateStr: string | null | undefined): string => {
    if (!dateStr) return "—";
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return new Intl.DateTimeFormat("en-PH", {
        year: "numeric",
        month: "short",
        day: "numeric",
      }).format(d);
    } catch {
      return dateStr;
    }
  };

  const generatedDate = new Intl.DateTimeFormat("en-PH", {
    dateStyle: "long",
  }).format(new Date());

  // --- Reusable Styles ---
  const thStyle = `border:1px solid #000;padding:4px 6px;text-align:left;background:#f3f4f6;font-size:9pt;`;
  const tdStyle = `border:1px solid #000;padding:4px 6px;font-size:9pt;`;
  const tdLabelStyle = `border:1px solid #000;padding:6px 8px;font-weight:bold;width:25%;font-size:10pt;`;
  const tdValueStyle = `border:1px solid #000;padding:6px 8px;font-size:10pt;`;
  const sectionHeader = (text: string) =>
    `<div style="background:#000;color:#fff;padding:4px 8px;font-size:10pt;font-weight:bold;text-transform:uppercase;">${text}</div>`;

  // --- Table Renderer (for arrays / categorized objects) ---
  const renderTableSection = (
    sectionNum: string,
    title: string,
    rawData: any,
    headers: string[],
    keys: string[]
  ): string => {
    const parsed = safeParse(rawData);
    if (!parsed) return "";

    let items: any[] = [];
    if (typeof parsed === "object" && !Array.isArray(parsed)) {
      items = Object.entries(parsed).flatMap(([level, arr]) =>
        Array.isArray(arr)
          ? arr.map((x: any) => ({ ...x, level: level.toUpperCase() }))
          : []
      );
    } else if (Array.isArray(parsed)) {
      items = parsed;
    }
    if (!items.length) return "";

    const headerCells = headers
      .map((h) => `<th style="${thStyle}">${h}</th>`)
      .join("");

    const bodyRows = items
      .map((item) => {
        const cells = keys
          .map((key) => {
            const val = key.toLowerCase().includes("date")
              ? fmtDate(item[key])
              : item[key] || "—";
            return `<td style="${tdStyle}">${val}</td>`;
          })
          .join("");
        return `<tr>${cells}</tr>`;
      })
      .join("");

    return `
      <div style="margin-bottom:18px;page-break-inside:avoid;">
        ${sectionHeader(`${sectionNum}. ${title}`)}
        <table style="width:100%;border-collapse:collapse;border:1px solid #000;">
          <thead><tr>${headerCells}</tr></thead>
          <tbody>${bodyRows}</tbody>
        </table>
      </div>`;
  };

  // --- Assessment / Key-Value Table Renderer ---
  const renderAssessmentTable = (
    sectionNum: string,
    title: string,
    rawData: any
  ): string => {
    const parsed = safeParse(rawData);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed))
      return "";
    const entries = Object.entries(parsed);
    if (!entries.length) return "";

    const formatKey = (key: string) =>
      key.replace(/([A-Z])/g, " $1").replace(/^./, (s) => s.toUpperCase());

    const rows = entries
      .map(
        ([key, value]) =>
          `<tr>
            <td style="${tdStyle}font-weight:bold;width:30%;vertical-align:top;">${formatKey(key)}</td>
            <td style="${tdStyle}">${String(value)}</td>
          </tr>`
      )
      .join("");

    return `
      <div style="margin-bottom:18px;page-break-inside:avoid;">
        ${sectionHeader(`${sectionNum}. ${title}`)}
        <table style="width:100%;border-collapse:collapse;border:1px solid #000;">
          <thead><tr>
            <th style="${thStyle}">Category</th>
            <th style="${thStyle}">Response</th>
          </tr></thead>
          <tbody>${rows}</tbody>
        </table>
      </div>`;
  };

  // =============================================
  //  BUILD THE FULL HTML DOCUMENT
  // =============================================
  return `<!DOCTYPE html>
<html>
<head>
  <title>TIP-ETEEAP Application - ${data.applicant_name || "Applicant"}</title>
  <style>
    @page { margin: 0; }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: "Times New Roman", Georgia, serif;
      color: #000;
      padding: 40px;
      font-size: 11pt;
      line-height: 1.4;
    }
    @media print {
      body { padding: 30px 40px; }
    }
  </style>
</head>
<body>

  <!-- ========== HEADER WITH TIP LOGO ========== -->
  <div style="display:flex;justify-content:space-between;align-items:center;border-bottom:2px solid #000;padding-bottom:16px;margin-bottom:20px;">
    <div style="display:flex;gap:14px;align-items:center;">
      <img src="/assets/TIPLogo.png" alt="TIP Logo" style="width:60px;height:60px;object-fit:contain;" />
      <div>
        <h1 style="font-size:16pt;font-weight:bold;text-transform:uppercase;margin:0;">
          Technological Institute of the Philippines
        </h1>
        <p style="font-size:10pt;margin:2px 0 0;">
          ETEEAP Accreditation and Equivalency Program
        </p>
      </div>
    </div>
    <div style="width:110px;height:110px;border:2px solid #000;display:flex;align-items:center;justify-content:center;flex-shrink:0;">
      ${
        data.photo_url
          ? `<img src="${data.photo_url}" style="width:100%;height:100%;object-fit:cover;" />`
          : `<span style="font-size:8pt;text-align:center;color:#666;">Affix 2x2 Photo</span>`
      }
    </div>
  </div>

  <h2 style="text-align:center;font-size:13pt;font-weight:bold;text-decoration:underline;text-transform:uppercase;margin-bottom:24px;">
    Official Application for Accreditation and Equivalency
  </h2>

  <!-- ========== I. PERSONAL DATA ========== -->
  <div style="margin-bottom:18px;page-break-inside:avoid;">
    ${sectionHeader("I. Personal Data")}
    <table style="width:100%;border-collapse:collapse;border:1px solid #000;">
      <tbody>
        <tr>
          <td style="${tdLabelStyle}">Full Name</td>
          <td style="${tdValueStyle}text-transform:uppercase;font-weight:600;">${data.applicant_name || "—"}</td>
        </tr>
        <tr>
          <td style="${tdLabelStyle}">Address</td>
          <td style="${tdValueStyle}">${data.full_address || "—"}</td>
        </tr>
        <tr>
          <td style="${tdLabelStyle}">Email Address</td>
          <td style="${tdValueStyle}">${data.email_address || "—"}</td>
        </tr>
        <tr>
          <td style="${tdLabelStyle}">Mobile Number</td>
          <td style="${tdValueStyle}">${data.mobile_number || "—"}</td>
        </tr>
        <tr>
          <td style="${tdLabelStyle}">Degree Applied</td>
          <td style="${tdValueStyle}font-weight:600;">${data.degree_applied_for || "—"}</td>
        </tr>
        <tr>
          <td style="${tdLabelStyle}">Campus</td>
          <td style="${tdValueStyle}">${data.campus || "—"}</td>
        </tr>
      </tbody>
    </table>
  </div>

  <!-- ========== DATA SECTIONS (II – XIII) ========== -->

  ${renderTableSection("II", "Degree Program Priorities", data.degree_priorities, ["Priority", "Program"], ["priority", "program"])}

  ${renderTableSection("III", "Formal Educational Background", data.education_background, ["Level", "School", "Degree", "Year Graduated"], ["level", "school_name", "degree", "end_date"])}

  ${renderTableSection("IV", "Non-Formal Education / Training", data.non_formal_education, ["Training", "Description"], ["name", "description"])}

  ${renderTableSection("V", "Work Experience", data.work_experiences, ["Type", "Position", "Company", "Start Date", "End Date"], ["level", "position", "company_name", "start_date", "end_date"])}

  ${renderTableSection("VI", "Professional Development", data.professional_development, ["Type", "Activity", "Description"], ["level", "title", "description"])}

  ${renderTableSection("VII", "Certifications", data.certifications, ["Title", "Issuing Body", "Rating", "Date Certified"], ["title", "certifyingBody", "rating", "dateCertified"])}

  ${renderTableSection("VIII", "Publications", data.publications, ["Title", "Publisher", "Date Published"], ["title", "publisher", "datePublished"])}

  ${renderTableSection("IX", "Inventions", data.inventions, ["Title", "Inventors", "Patent No.", "Date Issued"], ["title", "inventors", "patentNumber", "dateIssued"])}

  ${renderTableSection("X", "Recognitions", data.recognitions, ["Title", "Description"], ["title", "description"])}

  ${renderTableSection("XI", "Creative Works", data.creative_works, ["Title", "Link", "Description"], ["title", "link", "description"])}

  ${renderAssessmentTable("XII", "Self Assessment", data.self_assessment)}

  ${renderAssessmentTable("XIII", "Lifelong Learning", data.lifelong_learning)}

  <!-- ========== XIV. GOAL STATEMENT ========== -->
  ${
    data.goal_statement
      ? `
  <div style="margin-bottom:18px;page-break-inside:avoid;">
    ${sectionHeader("XIV. Statement of Goals")}
    <div style="border:1px solid #000;padding:16px 20px;text-align:justify;font-style:italic;min-height:120px;font-size:10pt;line-height:1.6;">
      ${safeParse(data.goal_statement) || "—"}
    </div>
  </div>`
      : ""
  }

  <!-- ========== SIGNATURE ========== -->
  <div style="margin-top:50px;display:flex;justify-content:flex-end;page-break-inside:avoid;">
    <div style="text-align:center;width:280px;">
      ${
        data.signature_url
          ? `<img src="${data.signature_url}" style="height:60px;margin:0 auto;display:block;" />`
          : '<div style="height:60px;"></div>'
      }
      <div style="border-top:2px solid #000;margin-top:6px;padding-top:6px;">
        <p style="font-weight:bold;text-transform:uppercase;font-size:10pt;">${data.applicant_name || "—"}</p>
        <p style="font-size:9pt;font-style:italic;">Signature over printed name</p>
        <p style="font-size:8pt;margin-top:12px;color:#555;">Generated: ${generatedDate}</p>
      </div>
    </div>
  </div>

  <!-- ========== FOOTER ========== -->
  <div style="position:fixed;bottom:0;left:0;right:0;display:flex;justify-content:space-between;padding:8px 40px;font-size:8pt;border-top:1px solid #ccc;color:#555;">
    <span>TIP-ETEEAP FORM 001-A</span>
    <span>Accreditation Office Copy</span>
  </div>

  <script>
    window.onload = function() {
      setTimeout(function() { window.print(); }, 500);
    };
  </script>
</body>
</html>`;
}

/**
 * Opens a new browser window and triggers print preview
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

export default function TIPPrintTemplate({ data }: { data: any }) {
  return null;
}