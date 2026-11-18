import { NextResponse } from "next/server";
import { db } from "@/db";
import { siteContent } from "@/db/schema";

export async function GET() {
  try {
    // ডাটাবেজের পুরোনো বা ডামি ডেটা মুছে ফেলা হচ্ছে
    await db.delete(siteContent);
    return NextResponse.json({ success: true, message: "Database reset successfully!" });
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}