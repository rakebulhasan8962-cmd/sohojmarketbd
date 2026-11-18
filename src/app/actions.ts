"use server";

import { db } from "@/db";
import { orders, settings } from "@/db/schema";
import { desc, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function submitOrder(data: {
  name: string;
  address: string;
  phone: string;
  shippingArea: string;
  quantity: number; // নতুন: quantity যোগ করা হয়েছে
  subtotal: number;
  shippingFee: number;
  total: number;
}) {
  const [insertedOrder] = await db
    .insert(orders)
    .values({
      name: data.name,
      address: data.address,
      phone: data.phone,
      shippingArea: data.shippingArea,
      quantity: data.quantity, // ডাটাবেজে quantity সেভ হবে
      subtotal: data.subtotal,
      shippingFee: data.shippingFee,
      total: data.total,
      status: "pending",
    })
    .returning();

  revalidatePath("/");
  revalidatePath("/admin");
  return { success: true, order: insertedOrder };
}

export async function getAllOrders() {
  try {
    return await db.select().from(orders).orderBy(desc(orders.createdAt));
  } catch (error) {
    console.error("Failed to fetch orders:", error);
    return [];
  }
}

export async function confirmOrderStatus(orderId: number) {
  await db
    .update(orders)
    .set({ status: "confirmed" })
    .where(eq(orders.id, orderId));

  revalidatePath("/");
  revalidatePath("/admin");
  return { success: true };
}

// স্ট্যাটাস পরিবর্তন করার জন্য (Pending, Confirmed, Shipped, Delivered, Cancelled ইত্যাদি যেকোনোটি সেট করতে)
export async function updateOrderStatus(orderId: number, status: string) {
  try {
    await db.update(orders).set({ status }).where(eq(orders.id, orderId));
    revalidatePath("/admin");
    return { success: true };
  } catch (error) {
    return { success: false, error };
  }
}

// অর্ডার ডিলিট করার জন্য
export async function deleteOrder(orderId: number) {
  try {
    await db.delete(orders).where(eq(orders.id, orderId));
    revalidatePath("/admin");
    return { success: true };
  } catch (error) {
    return { success: false, error };
  }
}

export async function getOrdersByPhone(phone: string) {
  try {
    return await db
      .select()
      .from(orders)
      .where(eq(orders.phone, phone.trim()))
      .orderBy(desc(orders.createdAt));
  } catch (error) {
    return [];
  }
}

// হোয়াটসঅ্যাপ নাম্বার ম্যানেজ করার ফাংশন
export async function getWhatsappNumber() {
  try {
    const [res] = await db.select().from(settings).limit(1);
    if (!res) {
      return "8801823902192";
    }
    return (res as any).whatsappNumber || "8801823902192";
  } catch (error) {
    console.warn("Settings table query failed, returning default whatsapp number.");
    return "8801823902192";
  }
}

export async function updateWhatsappNumber(number: string) {
  try {
    const [res] = await db.select().from(settings).limit(1);
    if (res) {
      await db.update(settings).set({ whatsappNumber: number } as any).where(eq(settings.id, res.id));
    } else {
      await db.insert(settings).values({ whatsappNumber: number } as any);
    }
    revalidatePath("/");
    revalidatePath("/admin");
    return { success: true };
  } catch (error) {
    console.error("Failed to update whatsapp number:", error);
    return { success: false, error };
  }
}