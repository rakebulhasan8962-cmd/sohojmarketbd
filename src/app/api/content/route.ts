import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import * as dataModule from "@/lib/data";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    if (!body || typeof body !== "object") {
      return NextResponse.json(
        { success: false, error: "অবৈধ কনটেন্ট ডেটা।" },
        { status: 400 }
      );
    }

    const anyData = dataModule as Record<string, any>;
    const saveFn =
      anyData.updateSiteContent ||
      anyData.saveSiteContent ||
      anyData.updateContent;

    if (typeof saveFn !== "function") {
      return NextResponse.json(
        { success: false, error: "@/lib/data ফাইলে সেভ ফাংশন পাওয়া যায়নি।" },
        { status: 500 }
      );
    }

    await saveFn(body);

    revalidatePath("/", "layout");
    revalidatePath("/admin", "layout");

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("API /api/content error:", err);
    return NextResponse.json(
      { success: false, error: err?.message || "সার্ভারে সেভ করতে সমস্যা হয়েছে।" },
      { status: 500 }
    );
  }
}