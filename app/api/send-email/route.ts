import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { Resend } from 'resend';
import { EmailTemplate } from '@/app/emails/template';

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM_EMAIL = 'admin@tipeteeap.online';

export async function POST(req: NextRequest) {
  const supabase = createRouteHandlerClient({ cookies });
  const { recipient, subject, body } = await req.json();

  if (!recipient || !subject?.trim() || !body?.trim()) {
    return NextResponse.json({ error: 'Recipient, subject, and body are required.' }, { status: 400 });
  }

  let logStatus: 'Sent' | 'Failed' = 'Failed';
  let errorMessage: string | null = null;

  try {
    const { data, error } = await resend.emails.send({
      from: `TIP Tech Support <${FROM_EMAIL}>`,
      to: [recipient],
      subject: subject.trim(),
      react: EmailTemplate({ subject: subject.trim(), body }),
    });

    if (error) {
      throw new Error(error.message);
    }

    logStatus = 'Sent';
    return NextResponse.json({ message: 'Email sent and logged' });
  } catch (error: any) {
    errorMessage = error.message || 'Unknown error';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  } finally {
    try {
      const { error: logError } = await supabase.from('email_logs').insert({
        recipient,
        subject: subject?.trim(),
        status: logStatus,
        body,
        sender: FROM_EMAIL,
        error_details: errorMessage,
      });

      if (logError) {
        console.error('Failed to write email log to Supabase:', logError.message);
      }
    } catch (dbError) {
      console.error('Database connection error while logging:', dbError);
    }
  }
}