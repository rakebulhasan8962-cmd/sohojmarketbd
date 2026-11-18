"use server";

import { updateSiteContent } from "@/lib/data";
import { revalidatePath } from "next/cache";

// কনটেন্ট আপডেট করার সার্ভার অ্যাকশন
export async function updateContentAction(newContent: any) {
  try {
    const contentToSave = typeof newContent === "string" ? JSON.parse(newContent) : newContent;
    
    await updateSiteContent(contentToSave);

    revalidatePath("/");
    revalidatePath("/admin");
    return { success: true };
  } catch (error) {
    console.error("Failed to update content:", error);
    return { success: false, error: "ডাটাবেজে কনটেন্ট সেভ করতে সমস্যা হয়েছে।" };
  }
}