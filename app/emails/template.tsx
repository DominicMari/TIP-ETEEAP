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

// 2. Fallback URL is now a full, secure URL
const baseUrl = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : 'https://tip-eteeap.vercel.app'; 


const logoUrl = `https://zwqrpmnpboyvvniboqrh.supabase.co/storage/v1/object/public/Assets/images/TIPLogo.png`;
const fbUrl = `https://zwqrpmnpboyvvniboqrh.supabase.co/storage/v1/object/public/Assets/images/FB.png`;
const xUrl = `https://zwqrpmnpboyvvniboqrh.supabase.co/storage/v1/object/public/Assets/images/x.png`;
const igUrl = `https://zwqrpmnpboyvvniboqrh.supabase.co/storage/v1/object/public/Assets/images/IG.png`;

interface EmailTemplateProps {
  subject: string;
  body: string; // This will be HTML
}

export const EmailTemplate = ({ subject, body }: EmailTemplateProps) => (
  <Html>
    <Head />
    <Preview>{subject}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={accentBar}>
          <Row>
            <Column style={{ width: '24px' }}>
              <div style={accentDot}></div>
            </Column>
            <Column>
              <Text style={eyebrow}>Official T.I.P. Communication</Text>
            </Column>
          </Row>
        </Section>

        {/* Header */}
        <Section style={header}>
          <Row>
            <Column style={{ width: '80px', verticalAlign: 'middle' }}>
              <Img
                src={logoUrl}
                width="80"
                height="80"
                alt="TIP Logo"
                style={{ display: 'block', outline: 'none', border: 'none', textDecoration: 'none' }}
              />
            </Column>
            <Column style={{ verticalAlign: 'middle', paddingLeft: '12px' }}>
              <Text style={tipHeaderText}>TECHNOLOGICAL INSTITUTE OF THE PHILIPPINES</Text>
            </Column>
          </Row>
        </Section>

        {/* Subject */}
        <Heading style={h1}>{subject}</Heading>

        {/* Body */}
        <Section style={bodySection}>
          <Text style={lead}>Hello,</Text>
          <Text style={text} dangerouslySetInnerHTML={{ __html: body }}></Text>
        </Section>

        {/* Footer */}
        <Hr style={hr} />
        <Section style={footer}>
          <Row style={socialsRow}>
            <Column align="center" style={socialCol}>
              <Link href="https://www.facebook.com/TIP1962official">
                <Img src={fbUrl} width="28" height="28" alt="Facebook" style={{ display: 'block', outline: 'none', border: 'none', textDecoration: 'none' }} />
              </Link>
            </Column>
            <Column align="center" style={socialCol}>
              <Link href="https://twitter.com/TIP1962official">
                <Img src={xUrl} width="28" height="28" alt="Twitter" style={{ display: 'block', outline: 'none', border: 'none', textDecoration: 'none' }} />
              </Link>
            </Column>
            <Column align="center" style={socialCol}>
              <Link href="https://www.instagram.com/tip1962official/">
                <Img src={igUrl} width="28" height="28" alt="Instagram" style={{ display: 'block', outline: 'none', border: 'none', textDecoration: 'none' }} />
              </Link>
            </Column>
          </Row>
          <Text style={footerText}>
            Technological Institute of the Philippines
            <br />
            363 P. Casal St., Quiapo, Manila
            <br />
            31338 Arlegui St., Quiapo, Manila
            <br />
            Tel. No: (02) 8733-9117 / (02) 7918-8476 / 0917-177-2566 
            <br />
            938 Aurora Blvd, Cubao, Quezon City, Metro Manila
            <br />
            Tel. No: (02) 8723-1131 / (02) 8723-1132 / 0917-177-2572
          </Text>
        </Section>
      </Container>
    </Body>
  </Html>
);

// --- 8. All-New, Cleaner Styles ---

const FONT_FAMILY =
  "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif";

const main = {
  backgroundColor: "#f6f7fb",
  fontFamily: FONT_FAMILY,
  padding: "0 12px",
};

const container = {
  backgroundColor: "#ffffff",
  border: "1px solid #f4c300",
  borderRadius: "14px",
  boxShadow: "0 15px 40px rgba(0,0,0,0.06)",
  margin: "36px auto",
  padding: "28px 26px 32px",
  width: "100%",
  maxWidth: "600px",
};

const accentBar = {
  marginBottom: "12px",
};

const accentDot = {
  width: "10px",
  height: "10px",
  borderRadius: "999px",
  backgroundColor: "#f4c300",
  marginTop: "6px",
};

const eyebrow = {
  fontSize: "11px",
  letterSpacing: "0.06em",
  textTransform: "uppercase" as const,
  color: "#6b7280",
  margin: "0",
};

const header = {
  padding: "8px 0 20px",
};

const h1 = {
  color: "#141414",
  fontFamily: FONT_FAMILY,
  fontSize: "24px",
  fontWeight: 700,
  margin: "0 0 18px",
  padding: "0",
  lineHeight: "1.3",
};

const bodySection = {
  padding: "0 6px",
};

const lead = {
  color: "#1f2937",
  fontSize: "16px",
  lineHeight: "24px",
  margin: "0 0 10px",
};

const text = {
  color: "#1f2937",
  fontFamily: FONT_FAMILY,
  fontSize: "15px",
  lineHeight: "24px",
  margin: "0",
};

const tipHeaderText = {
  fontFamily: FONT_FAMILY,
  fontSize: "16px",
  fontWeight: 700,
  color: "#0f172a",
  margin: "0 0 4px",
};

const subHeaderText = {
  fontFamily: FONT_FAMILY,
  fontSize: "13px",
  color: "#4b5563",
  margin: "0",
};

const hr = {
  borderColor: "#e5e7eb",
  margin: "28px 0 18px",
};

const footer = {
  paddingTop: "4px",
};

const socialsRow = {
  paddingBottom: "14px",
};

const socialCol = {
  padding: "0 6px",
};

const footerText = {
  color: "#6b7280",
  fontFamily: FONT_FAMILY,
  fontSize: "12px",
  textAlign: "center" as const,
  lineHeight: "18px",
  margin: "0",
};