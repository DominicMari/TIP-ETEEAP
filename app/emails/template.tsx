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
        {/* 3. Header Section with Logo */}
        <Section style={header}>
          <Row>
            <Column style={{ width: '100px', verticalAlign: 'middle' }}>
              <Img
                src={logoUrl}
                width="100"
                height="100"
                alt="TIP Logo"
                style={{ display: 'block', outline: 'none', border: 'none', textDecoration: 'none' }}
              />
            </Column>
            <Column style={{ verticalAlign: 'middle', paddingLeft: '15px' }}>
              <Text style={tipHeaderText}>TECHNOLOGICAL INSTITUTE OF THE PHILIPPINES</Text>
            </Column>
          </Row>
        </Section>
        
        {/* 5. Heading (Subject) */}
        <Heading style={h1}>{subject}</Heading>
        
        {/* 6. Body Content */}
        <Section style={bodySection}>
          <Text style={text} dangerouslySetInnerHTML={{ __html: body }}></Text>
        </Section>

        {/* 7. Footer Section */}
        <Hr style={hr} />
        <Section style={footer}>
          <Row style={socialsRow}>
            <Column align="center" style={socialCol}>
              <Link href="https://www.facebook.com/TIP1962official">
                <Img src={fbUrl} width="32" height="32" alt="Facebook" style={{ display: 'block', outline: 'none', border: 'none', textDecoration: 'none' }} />
              </Link>
            </Column>
            <Column align="center" style={socialCol}>
              <Link href="https://twitter.com/TIP1962official">
                <Img src={xUrl} width="32" height="32" alt="Twitter" style={{ display: 'block', outline: 'none', border: 'none', textDecoration: 'none' }} />
              </Link>
            </Column>
            <Column align="center" style={socialCol}>
              <Link href="https://www.instagram.com/tip1962official/">
                <Img src={igUrl} width="32" height="32" alt="Instagram" style={{ display: 'block', outline: 'none', border: 'none', textDecoration: 'none' }} />
              </Link>
            </Column>
          </Row>
          <Text style={footerText}>
            Technological Institute of the Philippines
            <br />            
            <br />
            363 P. Casal St., Quiapo, Manila
            <br />
            31338 Arlegui St., Quiapo, Manilappines
            <br />
            <br />            
            Tel. No: (02) 8733-9117 / (02) 7918-8476 / 0917-177-2566 
            <br />
            <br />
            938 Aurora Blvd, Cubao, Quezon City, Metro Manila, Philippines
            <br />
            Tel. No: (02) 8723-1131 / (02) 8723-1132 / 0917-177-2572
            <br />
            <br />
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
  backgroundColor: "#f9f9f9", // Very light gray background for a cleaner look
  fontFamily: FONT_FAMILY,
};

const container = {
  backgroundColor: "#ffffff",
  border: "1px solid #FFD700", // T.I.P. Yellow border
  borderRadius: "8px",
  // Removed boxShadow for a simpler design
  margin: "40px auto",
  padding: "30px",
  maxWidth: "580px",
};

const header = {
  textAlign: "center" as const,
  paddingBottom: "20px",
};

const h1 = {
  color: "#000000", // T.I.P. Black for headings
  fontFamily: FONT_FAMILY,
  fontSize: "28px",
  fontWeight: "bold",
  margin: "0 0 30px",
  padding: "0",
  textAlign: "center" as const,
};

const bodySection = {
  padding: "0 20px",
  maxHeight: "400px", // Set a max height to enable scrolling
  overflowY: "auto" as const, // Enable vertical scrolling
};

const text = {
  color: "#333333",
  fontFamily: FONT_FAMILY,
  fontSize: "16px",
  lineHeight: "26px",
};

const tipHeaderText = {
  fontFamily: FONT_FAMILY,
  fontSize: "24px",
  fontWeight: "bold",
  color: "#000000",
  textAlign: "left" as const,
};

const hr = {
  borderColor: "#cccccc", // Subtle gray for separator
  margin: "30px 0",
};

const footer = {
  paddingTop: "10px",
};

const socialsRow = {
  paddingBottom: "20px",
};

const socialCol = {
  padding: "0 8px",
};

const footerText = {
  color: "#555555", 
  fontFamily: FONT_FAMILY,
  fontSize: "12px",
  textAlign: "center" as const,
  lineHeight: "18px",
};