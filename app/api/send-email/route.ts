import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

// Define email templates
const emailTemplates: { [key: number]: (data: any) => { subject: string; html: string } } = {
  1: (data) => ({
    subject: 'Your Application has been Received',
    html: `<p>Dear Applicant,</p><p>Thank you for submitting your application. We have received it successfully.</p><p>Best regards,<br/>The Admissions Team</p>`,
  }),
  2: (data) => ({
    subject: 'Action Required: Please Submit Additional Documents',
    html: `<p>Dear Applicant,</p><p>We require additional documents to proceed with your application. Please log in to the portal to see the requirements.</p><p>Best regards,<br/>The Admissions Team</p>`,
  }),
  3: (data) => ({
    subject: 'Congratulations! Your Application has been Approved',
    html: `<p>Dear Applicant,</p><p>Congratulations! Your application has been approved. We will contact you shortly with the next steps.</p><p>Best regards,<br/>The Admissions Team</p>`,
  }),
};

export async function POST(req: NextRequest) {
  try {
    const { recipient, templateId, data } = await req.json();

    const templateBuilder = emailTemplates[templateId];

    if (!templateBuilder) {
      return NextResponse.json({ error: 'Invalid template ID' }, { status: 400 });
    }

    const { subject, html } = templateBuilder(data);

    const { data: responseData, error } = await resend.emails.send({
      from: 'onboarding@resend.dev', // Replace with your verified sending email
      to: recipient,
      subject: subject,
      html: html,
    });

    if (error) {
      console.error('Error sending email:', error);
      return NextResponse.json({ error: 'Failed to send email' }, { status: 500 });
    }

    return NextResponse.json({ message: 'Email sent successfully', data: responseData });
  } catch (error) {
    console.error('Error in send-email route:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
