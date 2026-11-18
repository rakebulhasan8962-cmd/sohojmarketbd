import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST(request: Request) {
  try {
    const { password } = await request.json();
    const adminPassword = process.env.ADMIN_PASSWORD || "admin1234"; // ডিফল্ট পাসওয়ার্ড

    if (password === adminPassword) {
      const cookieStore = await cookies();
      
      // কুকি সেট করা হচ্ছে
      cookieStore.set({
        name: "admin_logged_in",
        value: "true",
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        maxAge: 60 * 60 * 24, // ১ দিন
        path: "/",
      });

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ success: false, error: "ভুল পাসওয়ার্ড!" }, { status: 401 });
  } catch (error) {
    return NextResponse.json({ success: false, error: "সার্ভার এরর হয়েছে।" }, { status: 500 });
  }
}