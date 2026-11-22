"use server";

import { updateSiteContent as saveToDb } from "@/lib/data";
import { revalidatePath } from "next/cache";

export async function updateContentAction(newContent: any) {
  try {
    const contentToSave =
      typeof newContent === "string" ? JSON.parse(newContent) : newContent;

    if (!contentToSave || typeof contentToSave !== "object") {
      return {
        success: false,
        error: "অবৈধ কনটেন্ট ডেটা পাঠানো হয়েছে।",
      };
    }

    await saveToDb(contentToSave);

    revalidatePath("/", "layout");
    revalidatePath("/admin", "layout");

    return { success: true };
  } catch (error: any) {
    console.error("Failed to update content:", error);
    return {
      success: false,
      error: error?.message || "ডাটাবেজে কনটেন্ট সেভ করতে সমস্যা হয়েছে।",
    };
  }
}

export async function saveSiteContent(newContent: any) {
  return updateContentAction(newContent);
}

export async function updateSiteContent(newContent: any) {
  return updateContentAction(newContent);
}