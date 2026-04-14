import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "edge";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: Request) {
  try {
    const formData = await request.formData();

    const name = formData.get("name") as string | null;
    // TODO: Add an email field to the form and use it here.
    const email = formData.get("email") as string | null;
    const degree = formData.get("degree") as string | null;
    const campus = formData.get("campus") as string | null;
    const folderLink = formData.get("folderLink") as string | null;
    const photoFile = formData.get("photo") as File | Blob | null;

    if (!name || !degree || !campus || !folderLink || !photoFile || !email) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Use Uint8Array for Edge runtime compatibility
    const photoBytes = new Uint8Array(await photoFile.arrayBuffer());
    const fileName = `photos/${Date.now()}-${(photoFile as File).name || "photo.jpg"}`;

    // Upload the photo
    const { error: uploadError } = await supabase.storage
      .from("application-photos")
      .upload(fileName, photoBytes, {
        contentType: photoFile.type || "image/jpeg",
      });

    if (uploadError) {
      return NextResponse.json({ error: uploadError.message }, { status: 500 });
    }

    // Get public URL correctly from data.publicUrl
    const { data: publicUrlData } = supabase.storage
      .from("application-photos")
      .getPublicUrl(fileName);

    const photoUrl = publicUrlData?.publicUrl || null;

    const { data: insertedData, error: dbError } = await supabase
      .from("applications")
      .insert([{
        name,
        email,
        degree,
        campus,
        folder_link: folderLink,
        photo_url: photoUrl,
      }])
      .select("application_id")
      .single();

    if (dbError) {
      return NextResponse.json({ error: dbError.message }, { status: 500 });
    }

    const applicationId = insertedData?.application_id ?? null;

    // Insert notification record (non-blocking)
    try {
      await supabase.from('notifications').insert({
        type: 'new_application',
        applicant_name: name,
        application_id: applicationId,
        is_read: false,
      });
    } catch (notifError) {
      console.error('Failed to insert notification:', notifError);
    }

    // Send confirmation email
    try {
      await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/send-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipient: email,
          subject: 'Application Received – TIP ETEEAP',
          body: `Dear <strong>${name}</strong>,<br><br>You have submitted an application. Please wait for further announcements from the coordinator/assessor.<br><br>Best regards,<br>TIP ETEEAP Team`,
        }),
      });
    } catch (emailError) {
      console.error('Failed to send confirmation email:', emailError);
    }

    return NextResponse.json({ message: "Application saved successfully" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Unexpected error" }, { status: 500 });
  }
}
