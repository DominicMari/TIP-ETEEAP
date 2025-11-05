// File: app/api/create-admin/route.ts

import { createClient } from '@supabase/supabase-js'; // Use the standard client
import { NextResponse } from 'next/server';
import { Resend } from 'resend';

// Initialize Resend
const resend = new Resend(process.env.RESEND_API_KEY);

// Function to generate a random, secure password
function generateTemporaryPassword() {
  const length = 12;
  const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
  let retVal = "";
  for (let i = 0, n = charset.length; i < length; ++i) {
    retVal += charset.charAt(Math.floor(Math.random() * n));
  }
  return retVal;
}

export async function POST(request: Request) {
  const { name, email } = await request.json();

  if (!name || !email) {
    return NextResponse.json({ error: 'Name and email are required.' }, { status: 400 });
  }

  // This is the correct way to create a SERVICE client in an API route.
  // It will now work because Vercel has the SERVICE_ROLE_KEY from Step 1.
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const temporaryPassword = generateTemporaryPassword();

  // 1. Create the user in Supabase Auth
  const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email: email,
    password: temporaryPassword,
    email_confirm: true, // Auto-confirm the email
    user_metadata: { full_name: name },
  });

  if (authError) {
    console.error('Error creating auth user:', authError);
    return NextResponse.json({ error: authError.message }, { status: 500 });
  }

  if (!authData.user) {
    return NextResponse.json({ error: 'User could not be created.' }, { status: 500 });
  }

  // 2. Insert the user into your public 'admin' table
  // This will now SUCCEED because supabaseAdmin is a true admin client
  const { error: profileError } = await supabaseAdmin
    .from('admin')
    .insert({
      id: authData.user.id,
      name: name,
      email: email,
      // 'role' defaults to 'admin'
    });

  if (profileError) {
    console.error('Error creating admin profile:', profileError);
    // Cleanup: If the profile insert fails, delete the auth user
    await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
    // This is the error your user sees:
    return NextResponse.json({ error: 'Failed to create admin profile.' }, { status: 500 });
  }
  
  // 3. Send the temporary password via email
  try {
    console.log(`[API] Sending temporary password to: ${email}`);
    
    const loginUrl = process.env.NEXTAUTH_URL ? `${process.env.NEXTAUTH_URL}/admin` : 'http://localhost:3000/admin';

    await resend.emails.send({
      from: 'ETEEAP Admin Portal <admin@tipeteeap.online>',
      to: email,
      subject: 'Your ETEEAP Admin Account Has Been Created',
      html: `
        <div>
          <h1>Welcome to the ETEEAP Admin Portal, ${name}!</h1>
          <p>An account has been created for you. You can log in using these credentials:</p>
          <ul>
            <li><strong>Email:</strong> ${email}</li>
            <li><strong>Temporary Password:</strong> <code style="background:#eee; padding: 2px 5px; border-radius: 4px; font-family: monospace;">${temporaryPassword}</code></li>
          </ul>
          <p>You will be required to change this password immediately upon your first login for security.</p>
          <p>Please log in at: <a href="${loginUrl}">${loginUrl}</a></p>
        </div>
      `,
    });
    console.log(`[API] Email sent successfully to: ${email}`);
  } catch (emailError) {
    console.error(`[API] FAILED to send email to ${email}:`, emailError);
  }

  // 4. Return the password to the frontend modal
  return NextResponse.json({
    message: 'Admin created successfully.',
    user: authData.user,
    temporaryPassword: temporaryPassword, 
  });
}