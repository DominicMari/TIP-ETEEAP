import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Text,
  Img,
  Section,
  Row,
  Column,
  Link,
  Hr,
} from "@react-email/components";
import * as React from "react";

const logoUrl = `https://zwqrpmnpboyvvniboqrh.supabase.co/storage/v1/object/public/Assets/images/NewTIPLogo.png`;
interface EmailTemplateProps {
  subject: string;
  body: string; // This will be HTML
}

export const EmailTemplate = ({ subject, body }: EmailTemplateProps) => (
  <Html>
    <Head />
    <Preview>{subject}</Preview>
    <Body style={main}>
      <Container style={shell}>
        <Section style={brandTopBar}>
          <Text style={brandTopBarText}>ETEEAP Department</Text>
        </Section>

        <Section style={card}>
          <Section style={headerSection}>
            <Img
              src={logoUrl}
              width="100"
              height="72"
              alt="TIP Logo"
              style={logo}
            />
            <Text style={tipHeaderText}>TECHNOLOGICAL INSTITUTE OF THE PHILIPPINES</Text>
            <Text style={subHeaderText}>Expanded Tertiary Education Equivalency and Accreditation Program</Text>
          </Section>

          <Hr style={hr} />

          <Section style={bodySection}>
            <div dangerouslySetInnerHTML={{ __html: body }} style={text} />
          </Section>

          <Hr style={hr} />

          <Section style={footer}>
            <Text style={footerTitle}>Technological Institute of the Philippines</Text>
            <Text style={footerText}>
              363 P. Casal St., Quiapo, Manila | 3138 Arlegui St., Quiapo, Manila
              <br />
              Tel. No: (02) 8733-9117 / (02) 7918-8476 / 0917-177-2566
              <br />
              938 Aurora Blvd, Cubao, Quezon City, Metro Manila
              <br />
              Tel. No: (02) 8723-1131 / (02) 8723-1132 / 0917-177-2572
            </Text>
          </Section>
        </Section>
      </Container>
    </Body>
  </Html>
);

export default EmailTemplate;

const CONTENT_FONT =
  "Gotham, 'Helvetica Neue', Helvetica, Arial, sans-serif";

const HEADER_FONT = "Arial, Helvetica, sans-serif";

const main = {
  backgroundColor: "#f4f6fb",
  fontFamily: CONTENT_FONT,
  margin: "0",
  padding: "26px 12px",
};

const shell = {
  margin: "0 auto",
  maxWidth: "620px",
  width: "100%",
};

const brandTopBar = {
  backgroundColor: "#111827",
  borderRadius: "12px 12px 0 0",
  padding: "10px 20px",
};

const brandTopBarText = {
  color: "#f4c300",
  fontFamily: CONTENT_FONT,
  fontSize: "11px",
  fontWeight: 700,
  letterSpacing: "0.08em",
  margin: "0",
  textTransform: "uppercase" as const,
};

const card = {
  backgroundColor: "#ffffff",
  border: "1px solid #e5e7eb",
  borderRadius: "0 0 12px 12px",
  boxShadow: "0 16px 45px rgba(15, 23, 42, 0.08)",
  padding: "30px 26px 28px",
  width: "100%",
};

const headerSection = {
  paddingBottom: "20px",
  textAlign: "center" as const,
};

const logo = {
  display: "block",
  margin: "0 auto 12px",
  outline: "none",
  border: "none",
  textDecoration: "none",
};

const tipHeaderText = {
  color: "#0f172a",
  fontFamily: HEADER_FONT,
  fontSize: "18px",
  fontWeight: 700,
  letterSpacing: "0.02em",
  lineHeight: "1.35",
  margin: "0",
  textTransform: "uppercase" as const,
};

const subHeaderText = {
  color: "#475569",
  fontFamily: CONTENT_FONT,
  fontSize: "12px",
  lineHeight: "18px",
  margin: "8px 0 0",
};

const subjectSection = {
  backgroundColor: "#f8fafc",
  border: "1px solid #e2e8f0",
  borderRadius: "10px",
  marginBottom: "14px",
  padding: "16px 16px 14px",
};

const subjectLabel = {
  color: "#b08900",
  fontFamily: CONTENT_FONT,
  fontSize: "11px",
  fontWeight: 700,
  letterSpacing: "0.06em",
  margin: "0 0 6px",
  textTransform: "uppercase" as const,
};

const h1 = {
  color: "#0f172a",
  fontFamily: CONTENT_FONT,
  fontSize: "24px",
  fontWeight: 700,
  letterSpacing: "-0.01em",
  lineHeight: "1.3",
  margin: "0",
};

const metaStrip = {
  backgroundColor: "#fffbea",
  border: "1px solid #f3e8b3",
  borderRadius: "10px",
  marginBottom: "18px",
  padding: "10px 12px",
};

const metaCol = {
  verticalAlign: "top",
};

const metaDividerCol = {
  width: "14px",
};

const verticalDivider = {
  backgroundColor: "#f4c300",
  borderRadius: "99px",
  height: "28px",
  margin: "0 auto",
  width: "2px",
};

const metaTitle = {
  color: "#6b7280",
  fontFamily: CONTENT_FONT,
  fontSize: "10px",
  letterSpacing: "0.05em",
  margin: "0 0 2px",
  textAlign: "center" as const,
  textTransform: "uppercase" as const,
};

const metaValue = {
  color: "#111827",
  fontFamily: CONTENT_FONT,
  fontSize: "12px",
  fontWeight: 700,
  margin: "0",
  textAlign: "center" as const,
};

const bodySection = {
  borderLeft: "3px solid #f4c300",
  padding: "4px 0 4px 14px",
};

const lead = {
  color: "#0f172a",
  fontFamily: CONTENT_FONT,
  fontSize: "16px",
  fontWeight: 600,
  lineHeight: "24px",
  margin: "0 0 8px",
};

const bodyDivider = {
  borderColor: "#e2e8f0",
  margin: "0 0 12px",
};

const text = {
  color: "#1e293b",
  fontFamily: CONTENT_FONT,
  fontSize: "15px",
  lineHeight: "24px",
  margin: "0",
};

const hr = {
  borderColor: "#e2e8f0",
  margin: "24px 0 14px",
};

const footer = {
  textAlign: "center" as const,
};

const socialsRow = {
  margin: "0 auto 12px",
  width: "160px",
};

const socialCol = {
  padding: "0 4px",
};

const socialIcon = {
  display: "block",
  outline: "none",
  border: "none",
  textDecoration: "none",
};

const footerTitle = {
  color: "#0f172a",
  fontFamily: HEADER_FONT,
  fontSize: "13px",
  fontWeight: 700,
  margin: "0 0 6px",
};

const footerText = {
  color: "#64748b",
  fontFamily: CONTENT_FONT,
  fontSize: "12px",
  textAlign: "center" as const,
  lineHeight: "19px",
  margin: "0",
};