// File: app/api/update-admin-password/route.ts

import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const { userId, newPassword } = await request.json();

  if (!userId || !newPassword) {
    return NextResponse.json({ error: 'User ID and new password are required.' }, { status: 400 });
  }

  // Create an admin client to perform privileged operations
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.SUPABASE_SERVICE_ROLE_KEY || ''
  );

  // Use the admin client to update the user's password
  const { data, error } = await supabaseAdmin.auth.admin.updateUserById(
    userId,
    { password: newPassword }
  );

  if (error) {
    console.error('Supabase admin error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ message: 'Password updated successfully.', user: data.user });
}