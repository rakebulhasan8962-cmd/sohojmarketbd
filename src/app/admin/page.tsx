import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getAllOrders, getWhatsappNumber } from "../actions";
import AdminDashboard from "./AdminDashboard";
import { db } from "../../db";
import { siteContent } from "../../db/schema";
import { defaultContent, SiteContent } from "../../lib/data";

export const dynamic = "force-dynamic";

async function getMergedContent(): Promise<any> {
  try {
    const result = await db.select().from(siteContent).limit(1);
    if (result.length > 0 && result[0].content) {
      const data = result[0].content as any;
      return {
        ...defaultContent,
        ...data,
        theme: {
          ...((defaultContent as any).theme || {}),
          ...(data.theme || {}),
        },
        gallery: Array.isArray(data.gallery) ? data.gallery : [],
        hero: {
          ...defaultContent.hero,
          ...(data.hero || {}),
        },
        features: data.features || defaultContent.features,
        details: {
          ...defaultContent.details,
          ...(data.details || {}),
          points: data.details?.points || defaultContent.details.points,
        },
        whyUs: {
          ...defaultContent.whyUs,
          ...(data.whyUs || {}),
          points: data.whyUs?.points || defaultContent.whyUs.points,
        },
        targetAudience: {
          ...defaultContent.targetAudience,
          ...(data.targetAudience || {}),
          points: data.targetAudience?.points || defaultContent.targetAudience.points,
        },
        packages: data.packages || defaultContent.packages,
        faqs: data.faqs || defaultContent.faqs,
        pricing: {
          ...defaultContent.pricing,
          ...(data.pricing || {}),
        },
        adminWhatsApp:
          data.adminWhatsApp ||
          data.whatsappNumber ||
          defaultContent.adminWhatsApp,
      };
    }
  } catch (error) {
    console.warn("Using default site content due to DB query issue:", error);
  }

  return {
    ...defaultContent,
    theme: (defaultContent as any).theme || {},
    gallery: [],
  };
}

export default async function AdminPage() {
  const cookieStore = await cookies();
  const isLoggedIn = cookieStore.get("admin_logged_in");

  if (!isLoggedIn || isLoggedIn.value !== "true") {
    redirect("/admin/login");
  }

  const [orders, fetchedWhatsapp, mergedContent] = await Promise.all([
    getAllOrders(),
    getWhatsappNumber(),
    getMergedContent(),
  ]);

  const finalWhatsapp =
    fetchedWhatsapp ||
    mergedContent.whatsappNumber ||
    mergedContent.adminWhatsApp ||
    "";

  return (
    <AdminDashboard
      initialOrders={orders}
      initialWhatsapp={finalWhatsapp}
      defaultValues={mergedContent}
    />
  );
}