import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { Resend } from 'resend';
import { EmailTemplate } from '@/app/emails/template'; 

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM_EMAIL = 'admin@tipeteeap.online'; // Your verified domain

export async function POST(req: NextRequest) {
  const supabase = createRouteHandlerClient({ cookies });
  const { recipient, subject, body } = await req.json();

  let logStatus: 'Sent' | 'Failed' = 'Failed';
  let errorMessage: string | null = null;

  try {
    // --- 1. Attempt to send the email via Resend ---
    const { data, error } = await resend.emails.send({
      from: `TIP Tech Support <${FROM_EMAIL}>`, // Or your desired "from" name
      to: [recipient],
      subject: subject,
      react: EmailTemplate({ subject: subject, body: body }),
    });

    if (error) {
      console.error('Resend error:', error);
      throw new Error(error.message);
    }

    console.log('Email sent successfully:', data);
    logStatus = 'Sent';
    return NextResponse.json({ message: 'Email sent and logged' });

  } catch (error: any) {
    console.error('Failed to send email:', error);
    errorMessage = error.message || 'Unknown error';
    return NextResponse.json({ error: errorMessage }, { status: 500 });

  } finally {
    // --- 3. Log the result to Supabase (no change) ---
    try {
      const { error: logError } = await supabase.from('email_logs').insert({
        recipient: recipient,
        subject: subject,
        status: logStatus,
        sender: FROM_EMAIL,
        error_details: errorMessage,
      });

      if (logError) {
        console.error('FATAL: Failed to write email log to Supabase:', logError.message);
      }
    } catch (dbError) {
      console.error('FATAL: Database connection error while logging:', dbError);
    }
  }
}