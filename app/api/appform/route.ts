import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "edge"; // optional, edge function runtime

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
    const photoFile = formData.get("photo") as Blob | null;

    if (!name || !degree || !campus || !folderLink || !photoFile) {
      console.error("Missing required fields:", { name, degree, campus, folderLink, photoFile });
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const buffer = Buffer.from(await photoFile.arrayBuffer());
    const fileName = `photos/${Date.now()}-${(photoFile as any).name || "photo.jpg"}`;

    const { error: uploadError } = await supabase.storage
      .from("application-photos")
      .upload(fileName, buffer, {
        contentType: photoFile.type,
      });

    if (uploadError) {
      console.error("Supabase storage upload error:", uploadError);
      return NextResponse.json({ error: uploadError.message }, { status: 500 });
    }

    const { publicURL } = supabase.storage.from("application-photos").getPublicUrl(fileName);

    const { error: dbError } = await supabase.from("applications").insert({
      name,
      degree,
      campus,
      folder_link: folderLink,
      photo_url: publicURL,
    });

    if (dbError) {
      console.error("Supabase database insert error:", dbError);
      return NextResponse.json({ error: dbError.message }, { status: 500 });
    }

    return NextResponse.json({ message: "Application saved successfully" });
  } catch (error: any) {
    console.error("Unexpected server error:", error);
    return NextResponse.json({ error: error.message || "Unexpected error" }, { status: 500 });
  }
}
