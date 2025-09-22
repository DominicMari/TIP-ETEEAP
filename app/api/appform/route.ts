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
    const degree = formData.get("degree") as string | null;
    const campus = formData.get("campus") as string | null;
    const folderLink = formData.get("folderLink") as string | null;
    const photoFile = formData.get("photo") as File | Blob | null;

    if (!name || !degree || !campus || !folderLink || !photoFile) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Use Uint8Array for Edge runtime compatibility
    const photoBytes = new Uint8Array(await photoFile.arrayBuffer());
    const fileName = `photos/${Date.now()}-${(photoFile as File).name || "photo.jpg"}`;

    // Upload the photo
    const { error: uploadError } = await supabase.storage
      .from("application-photos")
      .upload(fileName, photoBytes, {
        contentType: photoFile.type,
      });

    if (uploadError) {
      return NextResponse.json({ error: uploadError.message }, { status: 500 });
    }

    // Get public URL correctly from data.publicUrl
    const { data: publicUrlData } = supabase.storage
      .from("application-photos")
      .getPublicUrl(fileName);

    const photoUrl = publicUrlData?.publicUrl || null;

    const { error: dbError } = await supabase
      .from("applications")
      .insert([{
        name,
        degree,
        campus,
        folder_link: folderLink,
        photo_url: photoUrl,
      }]); // array wrapper required

    if (dbError) {
      return NextResponse.json({ error: dbError.message }, { status: 500 });
    }

    return NextResponse.json({ message: "Application saved successfully" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Unexpected error" }, { status: 500 });
  }
}
