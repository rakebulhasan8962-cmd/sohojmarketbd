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
  adminWhatsApp: "8801823902192",
  hero: {
    badge: "Premium Khejur Gur",
    title: "প্রতিটি কামড়ে খাঁটি গ্রামবাংলার স্বাদ",
    description: "সাধারণ গুড় নয়। শীতের সকালের ঘ্রাণ আর সুবাস নিয়ে, সরাসরি গাছি থেকে সংগ্রহ করা রসে তৈরি Gramer Gur – এর খাঁটি খেজুরের গুড়। কোনো চিনি বা কৃত্রিম রং ছাড়া, ঐতিহ্যবাহী পদ্ধতিতে জ্বাল",
    tags: ["১০০% খাঁটি", "চিনিমুক্ত", "ঐতিহ্যবাহী স্বাদ"],
    imageUrl: "/images/hero.png"
  },
  features: [
    { title: "সারা বাংলাদেশে", subtitle: "হোম ডেলিভারি সুবিধা", icon: "Truck" },
    { title: "Cash on Delivery", subtitle: "পণ্য হাতে পেয়ে মূল্য পরিশোধ", icon: "Banknote" },
    { title: "নিরাপদ পণ্য", subtitle: "যত্নসহকারে প্যাকেজিং", icon: "ShieldCheck" },
    { title: "Premium Quality", subtitle: "বিশেষ দিনের জন্য বিশেষ স্বাদ", icon: "Award" },
  ],
  details: {
    title: "",
    text1: "গুড় তো অনেকেই বানায়। কিন্তু সত্যিকারের খেজুরের গুড়ের সেই মিষ্টি ঘ্রাণ আর দানাদার স্বাদ সবার কাছে পাওয়া যায় না। Gramer Gur -এর খেজুরের গুড় তৈরি হয়েছে তাদের জন্য, যারা ভেজালের ভিড়ে খাঁটি জিনিসটাই খুঁজছেন।",
    text2: "পিঠা-পায়েস থেকে সকালের নাস্তা, শীতের প্রতিটি আয়োজনের জন্য একটি খাঁটি ঐতিহ্যবাহী উপহার।",
    pointsTitle: "আপনি পাবেন",
    points: [
      { title: "খেজুরের খাঁটি ঘ্রাণ ও স্বাদ", description: "প্রাকৃতিক মিষ্টতা আর গুড়ের অনন্য সুবাস, যা পিঠা-পায়েসকে করে তোলে আরও মজাদার।" },
      { title: "নরম ও দানাদার টেক্সচার", description: "মুখে দিলেই মিলিয়ে যায়, আবার কামড়ে পাওয়া যায় আসল গুড়ের স্বাদ।" },
      { title: "পিঠা-পায়েসে আলাদা মাত্রা", description: "শীতের পিঠা, পায়েস, কিংবা রুটির সাথে খাওয়ার জন্য সেরা একটি খাঁটি উপাদান।" }
    ],
    imageUrl: "/images/details.png"
  },
  whyUs: {
    title: "কেন গ্রামার খেজুরের গুড়?",
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
    productName: "Gramer Khejur Gur",
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