import { db } from "@/db";
import { siteContent } from "@/db/schema";
import { eq } from "drizzle-orm";

export type SiteContent = {
  adminWhatsApp: string;
  hero: {
    badge: string;
    title: string;
    description: string;
    tags: string[];
    imageUrl: string;
  };
  features: Array<{ title: string; subtitle: string; icon: string }>;
  details: {
    title: string;
    text1: string;
    text2: string;
    pointsTitle: string;
    points: Array<{ title: string; description: string }>;
    imageUrl: string;
  };
  whyUs: {
    title: string;
    points: Array<{ title: string; description: string }>;
    imageUrl: string;
  };
  targetAudience: {
    title: string;
    points: string[];
    imageUrl: string;
  };
  packages: Array<{ name: string; description: string; id: string }>;
  faqs: Array<{ question: string; answer: string }>;
  pricing: {
    productName: string;
    productPrice: number;
    shippingInside: number;
    shippingOutside: number;
  };
};

export const defaultContent: SiteContent = {
  adminWhatsApp: "8801639193531",
  hero: {
    badge: "Hanging Hand Soap",
    title: "আপনার বাথরুমেও যোগ করবে সৌন্দর্য",
    description: "সাধারণ সাবানের বাইরে একটু নতুনত্ব নিয়ে আসুন! আঙুরের থোকার আদলে হাতে তৈরি আকর্ষণীয় Hanging Soap। মনোরম Grape Fragrance এবং ঝুলিয়ে রাখার সুবিধাসহ প্রতিদিনের পরিচ্ছন্নতার অভ্যাসে যোগ করুন একটু ভিন্নতা।",
    tags: ["✓ ১০০% হ্যান্ডমেড", "✓ প্রাকৃতিক সুগন্ধি", "✓ স্কিন-ফ্রেন্ডলি"],
    imageUrl: "/images/hero.png"
  },
  features: [
    { title: "সারা বাংলাদেশে", subtitle: "হোম ডেলিভারি সুবিধা", icon: "Truck" },
    { title: "Cash on Delivery", subtitle: "পণ্য হাতে পেয়ে মূল্য পরিশোধ", icon: "Banknote" },
    { title: "নিরাপদ পণ্য", subtitle: "যত্নসহকারে প্যাকেজিং", icon: "ShieldCheck" },
    { title: "Premium Quality", subtitle: "বিশেষ মানুষের জন্য বিশেষ পছন্দ", icon: "Award" },
  ],
  details: {
    title: "",
    text1: "সাধারণ সাবানের বাইরে একটু নতুনত্ব নিয়ে আসুন! আঙুরের থোকার আদলে হাতে তৈরি আকর্ষণীয় Hanging Soap। মনোরম Grape Fragrance এবং ঝুলিয়ে রাখার সুবিধাসহ প্রতিদিনের পরিচ্ছন্নতার অভ্যাসে যোগ করুন একটু ভিন্নতা।।",
    text2: "সাধারণ সাবান নয়, একটু ভিন্ন অভিজ্ঞতা!প্রতিদিনের ব্যবহার্য একটি পণ্যও হতে পারে সুন্দর ও আকর্ষণীয়।আমাদের Grape Cluster Hanging Soap তৈরি করা হয়েছে আঙুরের থোকার অনুপ্রেরণায়। এর সুন্দর আকৃতি, মনোরম সুগন্ধ এবং ঝুলিয়ে রাখার সুবিধা একে করে তুলেছে সাধারণ সাবানের চেয়ে আলাদা।",
    pointsTitle: "আপনি পাবেন",
    points: [
      { title: "আকর্ষণীয় Grape Design", description: "আঙুরের থোকার আদলে তৈরি ব্যতিক্রমী ডিজাইন, যা দেখতে সুন্দর ও নজরকাড়া।" },
      { title: "মনোরম Grape Fragrance", description: "আঙুরের সুগন্ধে প্রতিদিনের সাবান ব্যবহারে যোগ হবে একটি মনোরম অনুভূতি।" },
      { title: "Transparent Glycerin Soap Base", description: "স্বচ্ছ গ্লিসারিন সাবান বেস দিয়ে তৈরি।" }
    ],
    imageUrl: "/images/details.png"
  },
  whyUs: {
    title: "কেন বেছে নেবেন Grape Cluster Hanging Soap?",
    points: [
      { title: "খাঁটি স্বাদ", description: "চিনির বদলে প্রকৃতির নিজস্ব মিষ্টতা উপভোগ করুন, আরও স্বাভাবিক ও অনন্য স্বাদে।" },
      { title: "পরিবারের পছন্দ", description: "শীতের সকালে পরিবারের সবাই মিলে পিঠা-পায়েসের আনন্দ আরও বাড়িয়ে তুলুন।" },
      { title: "অতিথি আপ্যায়ন", description: "মেহমানদের সামনে ঐতিহ্যবাহী ও আলাদা কিছু পরিবেশন করতে চাইলে দারুণ পছন্দ।" },
      { title: "বিশ্বস্ত খাদ্য ব্র্যান্ড", description: "স্বাদেলা বাজার বিশুদ্ধ ও বিশ্বস্ত খাবার নিয়ে কাজ করে।" },
      { title: "গ্রামার খেজুরের গুড় বিএসটিআই অনুমোদিত এবং হালাল সনদপ্রাপ্ত।", description: "" }
    ],
    imageUrl: "/images/why-us.png"
  },
  targetAudience: {
    title: "কার জন্য এই গুড়?",
    points: [
      "যারা পরিবারের জন্য খাঁটি গুড় কিনতে চান।",
      "যারা শীতে পিঠা-পায়েস বানাতে ভালোবাসেন।",
      "যারা চিনির বদলে প্রাকৃতিক মিষ্টি ব্যবহার করতে চান।",
      "যারা প্রিয়জনকে ঐতিহ্যবাহী উপহার দিতে চান।",
      "যারা সবসময় ভেজালমুক্ত ও কোয়ালিটি-সম্পন্ন খাবার খুঁজছেন।"
    ],
    imageUrl: "/images/target.png"
  },
  packages: [
    { id: "family", name: "Family Pack 500kg", description: "পরিবারের সবাই মিলে উপভোগ করার জন্য।" },
    { id: "large", name: "Large Pack 1kg", description: "বড় পরিবার, অনুষ্ঠান বা অতিথি আপ্যায়নের জন্য।" }
  ],
  faqs: [
    { question: "পণ্যটি কীভাবে অর্ডার করব?", answer: "\"অর্ডার করতে চাই\" বাটনে ক্লিক করুন। সারা বাংলাদেশে ক্যাশ অন ডেলিভারি সুবিধা রয়েছে।" },
    { question: "ঢাকার বাইরে ডেলিভারি হবে?", answer: "হ্যাঁ, আমরা সারা বাংলাদেশে কুরিয়ারের মাধ্যমে হোম ডেলিভারি দিয়ে থাকি।" },
    { question: "পণ্যটি কি নিরাপদ ও মানসম্মত?", answer: "অবশ্যই। আমাদের গুড় বিএসটিআই অনুমোদিত এবং সম্পূর্ণ স্বাস্থ্যসম্মত উপায়ে তৈরি।" },
    { question: "অর্ডার করার আগে কোনো প্রশ্ন থাকলে?", answer: "আমাদের দেওয়া হোয়াটসঅ্যাপ নাম্বারে বা পেজে মেসেজ করতে পারেন।" }
  ],
  pricing: {
    productName: "Grape Cluster Hanging Soap",
    productPrice: 999,
    shippingInside: 80,
    shippingOutside: 150
  }
};

export async function getSiteContent(): Promise<SiteContent> {  
  try {
    const result = await db.select().from(siteContent).limit(1);
    if (result.length > 0 && result[0].content) {
      const data = result[0].content as any;
      // ডাটাবেজে যদি adminWhatsApp না থাকে, তবে ডিফল্ট নাম্বারটি যুক্ত করে রিটার্ন করবে
      return {
        ...defaultContent,
        ...data,
        adminWhatsApp: data.adminWhatsApp || defaultContent.adminWhatsApp
      };
    }
  } catch (error) {
    console.log("Database fetch failed, falling back to default content:", error);
  }
  return defaultContent;
}

export async function updateSiteContent(content: SiteContent) {
  try {
    const existing = await db.select().from(siteContent).limit(1);
    if (existing.length > 0) {
      await db.update(siteContent)
        .set({ 
          content: content as any, 
          updatedAt: new Date() 
        })
        .where(eq(siteContent.id, existing[0].id));
    } else {
      await db.insert(siteContent).values({ 
        content: content as any 
      });
    }
    return { success: true };
  } catch (error) {
    console.error("Database update failed:", error);
    throw error;
  }
}