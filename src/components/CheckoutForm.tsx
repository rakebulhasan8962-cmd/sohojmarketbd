"use client";

import { useState, useRef } from "react";
import { submitOrder, getOrdersByPhone } from "@/app/actions";
import { DynamicIcon } from "./DynamicIcon";
import { bdLocations } from "@/lib/bdLocations";
import { trackPixelEvent } from "@/lib/metaPixel";

const COLOR_OPTIONS = [
  { key: "Green", name: "Green", emoji: "💚", hex: "#22c55e" },
  { key: "Pink", name: "Pink", emoji: "🩷", hex: "#ec4899" },
  { key: "Purple", name: "Purple", emoji: "💜", hex: "#a855f7" },
  { key: "Orange", name: "Orange", emoji: "💛", hex: "#f97316" },
  { key: "Blue", name: "Blue", emoji: "💙", hex: "#3b82f6" },
] as const;

type ColorKey = (typeof COLOR_OPTIONS)[number]["key"];

function findMatchingThanas(rawDistrict: string): string[] {
  const source: any =
    (bdLocations as any)?.default && typeof (bdLocations as any).default === "object"
      ? (bdLocations as any).default
      : (bdLocations as any)?.bdLocations && typeof (bdLocations as any).bdLocations === "object"
      ? (bdLocations as any).bdLocations
      : bdLocations;

  if (!rawDistrict || !source || typeof source !== "object") {
    return [];
  }

  const extractList = (val: any): string[] => {
    if (Array.isArray(val)) {
      return val
        .map((item) =>
          typeof item === "string"
            ? item
            : item?.name || item?.bn_name || item?.label || item?.title || ""
        )
        .filter(Boolean);
    }
    if (val && typeof val === "object") {
      if (Array.isArray(val.thanas)) return extractList(val.thanas);
      if (Array.isArray(val.upazilas)) return extractList(val.upazilas);
      if (Array.isArray(val.areas)) return extractList(val.areas);
    }
    return [];
  };

  const trimmed = rawDistrict.trim();
  const direct = extractList(source[trimmed]);
  if (direct.length > 0) return direct;

  const lower = trimmed.toLowerCase();
  const keys = Object.keys(source);

  const exactKey = keys.find((k) => k.trim().toLowerCase() === lower);
  if (exactKey) {
    const list = extractList(source[exactKey]);
    if (list.length > 0) return list;
  }

  const partialKey = keys.find((k) => {
    const kClean = k.trim().toLowerCase();
    return kClean.includes(lower) || lower.includes(kClean);
  });
  if (partialKey) {
    const list = extractList(source[partialKey]);
    if (list.length > 0) return list;
  }

  return [];
}

function isDhakaDistrict(rawDistrict: string): boolean {
  const val = rawDistrict.trim().toLowerCase();
  return val === "ঢাকা" || val === "dhaka" || val.startsWith("ঢাকা ") || val.startsWith("dhaka ");
}

export default function CheckoutForm({
  pricing,
  isMobile = false,
}: {
  pricing: any;
  isMobile?: boolean;
}) {
  const [shippingArea, setShippingArea] = useState<"inside" | "outside">("inside");
  const [quantity, setQuantity] = useState<number>(1);
  const [activeColor, setActiveColor] = useState<ColorKey>("Green");
  const [colorQuantities, setColorQuantities] = useState<Record<ColorKey, number>>({
    Green: 0,
    Pink: 0,
    Purple: 0,
    Orange: 0,
    Blue: 0,
  });
  const [district, setDistrict] = useState<string>("");
  const [thana, setThana] = useState<string>("");
  const [villageAddress, setVillageAddress] = useState<string>("");
  const [colorError, setColorError] = useState<string>("");
  const colorSectionRef = useRef<HTMLDivElement | null>(null);

  const [loading, setLoading] = useState(false);
  const [submittedOrder, setSubmittedOrder] = useState<any>(null);

  // স্ট্যাটাস চেকার স্টেট
  const [trackPhone, setTrackPhone] = useState("");
  const [trackedOrders, setTrackedOrders] = useState<any[] | null>(null);
  const [trackingLoading, setTrackingLoading] = useState(false);

  const ADMIN_WHATSAPP = pricing?.whatsappNumber || "8801639193531";

  const districts = Object.keys(bdLocations || {});
  const availableThanas = findMatchingThanas(district);

  // নির্বাচিত কালার ও কোয়ান্টিটি যোগফল
  const selectedColorItems = COLOR_OPTIONS.filter(
    (c) => (colorQuantities[c.key] || 0) > 0
  ).map((c) => ({
    ...c,
    qty: colorQuantities[c.key] || 0,
    pin: pricing?.colorVariants?.[c.key]?.pin || "",
    image: pricing?.colorVariants?.[c.key]?.image || "",
  }));

  const totalColorQty = selectedColorItems.reduce((sum, item) => sum + item.qty, 0);
  const effectiveQuantity = totalColorQty;

  const selectedColorsSummary =
    selectedColorItems.length > 0
      ? selectedColorItems.map((c) => `${c.emoji} ${c.name} × ${c.qty}`).join(", ")
      : "কোনো কালার সিলেক্ট করা হয়নি";

  const activeVariantConfig = pricing?.colorVariants?.[activeColor] || {};
  const activePreviewImage =
    activeVariantConfig.image || pricing?.productImage || pricing?.heroImage || "";
  const activePreviewPin = activeVariantConfig.pin || "";

  function updateColorQty(colorKey: ColorKey, delta: number) {
    setActiveColor(colorKey);
    setColorError("");
    setColorQuantities((prev) => {
      const nextVal = Math.max(0, (prev[colorKey] || 0) + delta);
      const updated = { ...prev, [colorKey]: nextVal };
      const sum = Object.values(updated).reduce((a, b) => a + b, 0);
      setQuantity(sum);
      return updated;
    });
  }

  // আসল মূল্য ও ডিসকাউন্ট মূল্য নির্ধারণ
  const originalUnitPrice = Number(pricing?.originalPrice ?? pricing?.productPrice ?? 590);
  const hasDiscount =
    Boolean(pricing?.discountEnabled) &&
    Number(pricing?.discountedPrice ?? pricing?.discountPrice ?? originalUnitPrice) <
      originalUnitPrice;

  const effectiveUnitPrice = hasDiscount
    ? Number(pricing?.discountedPrice ?? pricing?.discountPrice ?? 490)
    : originalUnitPrice;

  const discountPercent =
    originalUnitPrice > 0
      ? Math.max(
          1,
          Math.round(((originalUnitPrice - effectiveUnitPrice) / originalUnitPrice) * 100)
        )
      : 0;

  const subtotal = effectiveUnitPrice * effectiveQuantity;
  const originalSubtotal = originalUnitPrice * effectiveQuantity;
  const shippingFee =
    shippingArea === "inside" ? pricing.shippingInside : pricing.shippingOutside;
  const total = subtotal + shippingFee;

  // অর্ডার নম্বর ৩১০ থেকে শুরু করার ফাংশন
  const formatOrderSerial = (rawId: any) => {
    const num = Number(rawId);
    if (!Number.isNaN(num) && Number.isFinite(num)) {
      return num < 310 ? num + 309 : num;
    }
    return rawId;
  };

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (totalColorQty <= 0) {
      setColorError(
        "অর্ডার কনফার্ম করতে অন্তত একটি কালার সিলেক্ট করে পরিমাণ (+) বাড়ান।"
      );
      colorSectionRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
      return;
    }

    setColorError("");
    setLoading(true);
    const formData = new FormData(e.currentTarget);

    const name = formData.get("name") as string;
    const phone = formData.get("phone") as string;
    const fullAddress = `${villageAddress}, থানা: ${thana}, জেলা: ${district}`;

    const result = await (submitOrder as any)({
      name,
      address: `${fullAddress} | কালার: ${selectedColorsSummary}`,
      phone,
      shippingArea,
      quantity: effectiveQuantity,
      selectedColors: selectedColorsSummary,
      colorBreakdown: selectedColorItems,
      subtotal,
      shippingFee,
      total,
    });

    if (result.success && result.order) {
      const displaySerial = formatOrderSerial(result.order.id);
      setSubmittedOrder({
        ...result.order,
        displaySerial,
        selectedColorsSummary,
      });

      trackPixelEvent("Purchase", {
        content_name: pricing?.productName || "Grape Cluster Hanging Soap",
        value: Number(total) || 0,
        currency: "BDT",
        num_items: Number(effectiveQuantity) || 1,
        order_id: String(displaySerial),
      });

      const shippingText =
        shippingArea === "inside"
          ? `ঢাকার ভিতরে (${shippingFee}৳)`
          : `ঢাকার বাহিরে (${shippingFee}৳)`;

      const priceLine = hasDiscount
        ? `${effectiveUnitPrice}৳ (Discount ${discountPercent}% off from ${originalUnitPrice}৳)`
        : `${effectiveUnitPrice}৳`;

      const message = `🛒 *নতুন অর্ডার এসেছে!* (Order #${displaySerial})
      
*নাম:* ${name}
*ফোন:* ${phone}
*ঠিকানা:* ${fullAddress}
*প্রোডাক্ট:* ${pricing.productName || "Hanging Hand Soap"} (× ${effectiveQuantity})
*কালার ও পরিমাণ:* ${selectedColorsSummary}
*একক মূল্য:* ${priceLine}
*ডেলিভারি:* ${shippingText}
*সর্বমোট বিল:* ${total}৳
*স্ট্যাটাস:* Pending`;

      const whatsappUrl = `https://wa.me/${ADMIN_WHATSAPP}?text=${encodeURIComponent(message)}`;
      window.open(whatsappUrl, "_blank");
    }

    setLoading(false);
    setDistrict("");
    setThana("");
    setVillageAddress("");
    setQuantity(1);
    setColorQuantities({
      Green: 0,
      Pink: 0,
      Purple: 0,
      Orange: 0,
      Blue: 0,
    });
  }

  async function handleTrackOrder(e: React.FormEvent) {
    e.preventDefault();
    if (!trackPhone.trim()) return;
    setTrackingLoading(true);
    const results = await getOrdersByPhone(trackPhone);
    setTrackedOrders(results);
    setTrackingLoading(false);
  }

  return (
    <div
      className={`w-full max-w-5xl mx-auto ${
        isMobile ? "mt-4 mb-8 px-1" : "mt-12 mb-20"
      }`}
      id="order"
    >
      {submittedOrder ? (
        <div
          className={`bg-[#F9F6F0] ${
            isMobile ? "p-4" : "p-8"
          } rounded-xl border border-[#E5DEC9] text-center max-w-3xl mx-auto shadow-md mb-8`}
        >
          <h3 className="text-xl font-bold text-[#4B203D] mb-2">
            ধন্যবাদ, {submittedOrder.name}!
          </h3>
          <p className="text-gray-700 text-sm mb-2">
            অর্ডার আইডি:{" "}
            <strong>
              #{submittedOrder.displaySerial ?? formatOrderSerial(submittedOrder.id)}
            </strong>{" "}
            | পরিমাণ: <strong>{submittedOrder.quantity || 1}টি</strong>
          </p>
          {submittedOrder.selectedColorsSummary && (
            <p className="text-xs text-gray-600 mb-3">
              কালার: <strong>{submittedOrder.selectedColorsSummary}</strong>
            </p>
          )}
          <div className="inline-block bg-white px-4 py-2.5 rounded-lg border border-gray-200 mb-4 text-xs">
            <span className="text-gray-600 mr-1">স্ট্যাটাস:</span>
            <span className="font-bold text-amber-600">
              {submittedOrder.status || "Pending"}
            </span>
          </div>
          <div>
            <button
              type="button"
              onClick={() => setSubmittedOrder(null)}
              className="w-full sm:w-auto bg-[#4B203D] hover:bg-[#3a182f] text-white px-6 py-2.5 rounded-xl font-bold text-sm shadow-md transition-all cursor-pointer"
            >
              আরেকটি অর্ডার করুন
            </button>
          </div>
        </div>
      ) : (
        <form
          onSubmit={handleSubmit}
          className="border border-[#D4C4A8] rounded-xl overflow-hidden bg-white shadow-md mb-8"
        >
          <div className={isMobile ? "p-3.5" : "p-6 md:p-10"}>
            <h2
              className={`${
                isMobile ? "text-[18px] mb-5" : "text-[22px] md:text-[28px] mb-10"
              } font-bold text-[#222222] text-center leading-snug`}
            >
              অর্ডার করতে নিচের ফর্মটি সঠিক ভাবে পুরন করুন।
            </h2>

            {/* মোবাইল ভিউতে ১ কলাম, ডেস্কটপে ২ কলাম */}
            <div
              className={`grid grid-cols-1 ${
                isMobile ? "gap-6" : "md:grid-cols-2 gap-10"
              } items-start`}
            >
              {/* সেকশন ১ (বাম কলাম): Billing details, Shipping ও কালার নির্বাচন */}
              <div className="flex flex-col space-y-5 w-full">
                <div>
                  <h3 className="text-[17px] font-bold text-[#222222] mb-3">
                    Billing details
                  </h3>

                  <div className="flex flex-col space-y-3.5">
                    <div className="w-full">
                      <label className="block text-[13px] font-medium text-gray-700 mb-1">
                        নাম লিখুন <span className="text-red-500">*</span>
                      </label>
                      <input
                        required
                        name="name"
                        type="text"
                        placeholder="আপনার নাম"
                        className="w-full border border-gray-300 rounded-md px-3 py-2 text-[14px] focus:outline-none focus:border-gray-500 bg-white"
                      />
                    </div>

                    <div className="w-full">
                      <label className="block text-[13px] font-medium text-gray-700 mb-1">
                        ফোন নাম্বার লিখুন <span className="text-red-500">*</span>
                      </label>
                      <input
                        required
                        name="phone"
                        type="tel"
                        placeholder="১১ সংখ্যার ফোন নাম্বার"
                        className="w-full border border-gray-300 rounded-md px-3 py-2 text-[14px] focus:outline-none focus:border-gray-500 bg-white"
                      />
                    </div>

                    {/* জেলা ও থানা */}
                    <div
                      className={`grid grid-cols-1 ${
                        isMobile ? "gap-3.5" : "sm:grid-cols-2 gap-3"
                      }`}
                    >
                      <div className="w-full">
                        <label className="block text-[13px] font-medium text-gray-700 mb-1">
                          জেলা <span className="text-red-500">*</span>
                        </label>
                        <select
                          required
                          value={district}
                          onChange={(e) => {
                            const nextDistrict = e.target.value;
                            setDistrict(nextDistrict);
                            setThana("");
                            if (isDhakaDistrict(nextDistrict)) {
                              setShippingArea("inside");
                            } else if (nextDistrict) {
                              setShippingArea("outside");
                            }
                          }}
                          className="w-full border border-gray-300 rounded-md px-3 py-2 text-[14px] focus:outline-none focus:border-gray-500 bg-white"
                        >
                          <option value="">জেলা সিলেক্ট করুন</option>
                          {districts.map((dist) => (
                            <option key={dist} value={dist}>
                              {dist}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="w-full">
                        <label className="block text-[13px] font-medium text-gray-700 mb-1">
                          থানা / উপজেলা <span className="text-red-500">*</span>
                        </label>
                        {availableThanas.length > 0 ? (
                          <select
                            required
                            value={thana}
                            onChange={(e) => setThana(e.target.value)}
                            className="w-full border border-gray-300 rounded-md px-3 py-2 text-[14px] focus:outline-none focus:border-gray-500 bg-white"
                          >
                            <option value="">থানা / উপজেলা সিলেক্ট করুন</option>
                            {availableThanas.map((th) => (
                              <option key={th} value={th}>
                                {th}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <input
                            required
                            type="text"
                            value={thana}
                            onChange={(e) => setThana(e.target.value)}
                            placeholder={
                              district
                                ? "থানা / উপজেলার নাম লিখুন"
                                : "আগে জেলা সিলেক্ট করুন"
                            }
                            className="w-full border border-gray-300 rounded-md px-3 py-2 text-[14px] focus:outline-none focus:border-gray-500 bg-white"
                          />
                        )}
                      </div>
                    </div>

                    <div className="w-full">
                      <label className="block text-[13px] font-medium text-gray-700 mb-1">
                        গ্রাম / বাসা / রোড নং <span className="text-red-500">*</span>
                      </label>
                      <input
                        required
                        type="text"
                        value={villageAddress}
                        onChange={(e) => setVillageAddress(e.target.value)}
                        placeholder="গ্রাম বা এলাকার বিস্তারিত ঠিকানা লিখুন"
                        className="w-full border border-gray-300 rounded-md px-3 py-2 text-[14px] focus:outline-none focus:border-gray-500 bg-white"
                      />
                    </div>
                  </div>
                </div>

                {/* Shipping অপশন */}
                <div className="w-full">
                  <h3 className="text-[17px] font-bold text-[#222222] mb-2.5">
                    Shipping
                  </h3>
                  <div className="flex flex-col border border-gray-200 rounded-lg divide-y divide-gray-200 bg-white w-full">
                    <label className="flex items-center justify-between gap-2 p-3 cursor-pointer hover:bg-gray-50 w-full">
                      <span className="flex items-center gap-2.5 text-[14px] text-gray-800">
                        <input
                          type="radio"
                          name="shipping"
                          value="inside"
                          checked={shippingArea === "inside"}
                          onChange={() => setShippingArea("inside")}
                          className="w-4 h-4 accent-black shrink-0"
                        />
                        <span>ঢাকার ভিতরে:</span>
                      </span>
                      <span className="text-[14px] font-semibold text-gray-900 shrink-0">
                        {pricing.shippingInside}৳
                      </span>
                    </label>

                    <label className="flex items-center justify-between gap-2 p-3 cursor-pointer hover:bg-gray-50 w-full">
                      <span className="flex items-center gap-2.5 text-[14px] text-gray-800">
                        <input
                          type="radio"
                          name="shipping"
                          value="outside"
                          checked={shippingArea === "outside"}
                          onChange={() => setShippingArea("outside")}
                          className="w-4 h-4 accent-black shrink-0"
                        />
                        <span>ঢাকার বাহিরে:</span>
                      </span>
                      <span className="text-[14px] font-semibold text-gray-900 shrink-0">
                        {pricing.shippingOutside}৳
                      </span>
                    </label>
                  </div>
                </div>

                {/* ডান পাশ থেকে নামিয়ে আনা ৫টি কালার ও পরিমাণ নির্বাচন বক্স (বাম পাশের ফাঁকা জায়গা ভরাট করবে) */}
                <div className="w-full space-y-2.5 bg-gray-50 border border-gray-200 rounded-xl p-3.5">
                  <div className="flex items-center justify-between">
                    <h3 className="text-[15px] font-bold text-[#222222]">
                      কালার ও পরিমাণ নির্বাচন করুন
                    </h3>
                    <span className="text-xs font-bold text-gray-700">
                      মোট: {effectiveQuantity}টি
                    </span>
                  </div>

                  {/* কালারে টাচ করলে ছবি ও পিন প্রিভিউ */}
                  {(activePreviewImage || activePreviewPin) && (
                    <div className="flex items-center gap-3 bg-[#F9F6F0] border border-[#E5DEC9] rounded-lg p-2">
                      {activePreviewImage && (
                        <img
                          src={activePreviewImage}
                          alt={activeColor}
                          className="w-12 h-12 rounded-md object-cover border border-gray-200 shrink-0"
                        />
                      )}
                      <div className="flex flex-col min-w-0">
                        <span className="text-xs font-bold text-gray-900">
                          {activeColor}
                        </span>
                        {activePreviewPin && (
                          <span className="inline-block w-fit mt-0.5 bg-amber-100 text-amber-900 text-[11px] font-bold px-2 py-0.5 rounded border border-amber-300">
                            📌 {activePreviewPin}
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="flex flex-col divide-y divide-gray-200 bg-white border border-gray-200 rounded-lg px-2.5">
                    {COLOR_OPTIONS.map((clr) => {
                      const qtyVal = colorQuantities[clr.key] || 0;
                      const isActive = activeColor === clr.key;
                      const clrPin = pricing?.colorVariants?.[clr.key]?.pin || "";
                      return (
                        <div
                          key={clr.key}
                          onClick={() => setActiveColor(clr.key)}
                          className={`flex items-center justify-between gap-2 py-2 px-1 cursor-pointer transition-colors ${
                            isActive ? "bg-amber-50/50" : ""
                          }`}
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <span
                              className="w-3 h-3 rounded-full shrink-0 border border-black/15"
                              style={{ backgroundColor: clr.hex }}
                            />
                            <span className="text-xs font-semibold text-gray-800 truncate">
                              {clr.emoji} {clr.name}
                            </span>
                            {clrPin && (
                              <span className="text-[10px] font-bold bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded shrink-0">
                                {clrPin}
                              </span>
                            )}
                          </div>

                          <div
                            className="inline-flex items-center border border-gray-300 rounded bg-gray-50 shrink-0"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <button
                              type="button"
                              onClick={() => updateColorQty(clr.key, -1)}
                              className="px-2.5 py-0.5 text-gray-700 hover:bg-gray-200 font-bold cursor-pointer"
                            >
                              -
                            </button>
                            <span className="px-2.5 py-0.5 text-xs font-semibold text-gray-900 bg-white border-x border-gray-300">
                              {qtyVal}
                            </span>
                            <button
                              type="button"
                              onClick={() => updateColorQty(clr.key, 1)}
                              className="px-2.5 py-0.5 text-gray-700 hover:bg-gray-200 font-bold cursor-pointer"
                            >
                              +
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="text-[11px] text-gray-700 pt-0.5 truncate">
                    নির্বাচিত: <strong>{selectedColorsSummary}</strong>
                  </div>
                </div>
              </div>

              {/* সেকশন ২ (ডান কলাম): Your order */}
              <div className="flex flex-col w-full">
                <h3 className="text-[17px] font-bold text-[#222222] mb-3">
                  Your order
                </h3>

                <div className="border border-gray-200 rounded-xl p-4 bg-white shadow-xs flex flex-col space-y-3 w-full">
                  <div className="flex justify-between font-bold text-[14px] text-gray-900 pb-2.5 border-b border-gray-200">
                    <span>Product</span>
                    <span>Subtotal</span>
                  </div>

                  {/* প্রোডাক্ট, ডিসকাউন্ট ও নির্বাচিত কালারের সারাংশ */}
                  <div className="py-2.5 border-b border-gray-200 flex flex-col gap-2 text-[14px]">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex flex-col gap-1.5">
                        <span className="text-gray-800 font-semibold">
                          {pricing.productName || "Hanging Hand Soap"}
                        </span>

                        {hasDiscount && (
                          <div className="flex items-center gap-1.5">
                            <span className="inline-flex items-center bg-[#FEF08A] text-stone-950 font-black text-base md:text-lg px-2.5 py-0.5 rounded-md border border-amber-400 shadow-xs tracking-wide">
                              Discount — {discountPercent}%
                            </span>
                            <span className="inline-flex items-center justify-center w-6 h-6 -rotate-3 bg-rose-600 text-white text-xs font-black rounded-full shadow-xs border border-rose-700 shrink-0">
                              %
                            </span>
                          </div>
                        )}

                        <div className="text-xs text-gray-600">
                          {hasDiscount ? (
                            <>
                              <span className="line-through text-gray-400 mr-1.5">
                                {originalUnitPrice}৳
                              </span>
                              <span className="font-bold text-emerald-700 text-sm">
                                {effectiveUnitPrice}৳
                              </span>
                            </>
                          ) : (
                            <span className="font-semibold text-gray-800">
                              {effectiveUnitPrice}৳
                            </span>
                          )}
                          <span className="text-gray-500 ml-1.5">
                            × {effectiveQuantity}টি
                          </span>
                        </div>

                        <div className="text-xs text-gray-700 bg-gray-50 border border-gray-200 rounded px-2 py-1">
                          কালার: <strong>{selectedColorsSummary}</strong>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        {hasDiscount && (
                          <span className="line-through text-xs text-gray-400 mr-1.5">
                            {originalSubtotal}৳
                          </span>
                        )}
                        <span className="font-bold text-gray-900">
                          {subtotal}৳
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="py-2 flex justify-between items-center text-[14px] text-gray-800 border-b border-gray-200">
                    <span>Subtotal</span>
                    <span className="font-semibold">{subtotal}৳</span>
                  </div>

                  <div className="py-2 flex justify-between items-center gap-2 text-[14px] text-gray-800 border-b border-gray-200">
                    <span>Shipping</span>
                    <span className="text-gray-700 font-medium text-right">
                      {shippingArea === "inside" ? "ঢাকার ভিতরে" : "ঢাকার বাহিরে"}:{" "}
                      <strong className="text-gray-900">{shippingFee}৳</strong>
                    </span>
                  </div>

                  <div className="py-2.5 flex justify-between items-center font-bold text-[17px] text-gray-900 border-b border-gray-200">
                    <span>Total</span>
                    <span>{total}৳</span>
                  </div>

                  {/* ক্যাশ অন ডেলিভারি */}
                  <div className="mt-1 bg-[#F9F6F0] border border-[#E5DEC9] rounded-lg p-3.5 flex flex-col space-y-2">
                    <div className="font-bold text-[14px] text-gray-900">
                      ক্যাশ অন ডেলিভারি
                    </div>
                    <div className="text-[13px] text-gray-600 bg-white p-2.5 rounded border border-gray-200">
                      Pay with cash upon delivery.
                    </div>
                  </div>

                  <p className="text-[12px] text-gray-500 leading-relaxed pt-1">
                    Your personal data will be used to process your order, support your experience throughout this website, and for other purposes described in our privacy policy.
                  </p>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-[#4A2018] hover:bg-[#381611] text-white py-3 px-4 rounded-xl font-bold text-[15px] flex items-center justify-center gap-2 transition-all shadow-md disabled:opacity-70 cursor-pointer"
                  >
                    {loading ? (
                      "অর্ডার প্রসেস হচ্ছে..."
                    ) : (
                      <>
                        <DynamicIcon name="Lock" className="w-4 h-4 shrink-0" />
                        <span>অর্ডার করুন {total}৳</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </form>
      )}

      {/* কাস্টমার লাইভ অর্ডার স্ট্যাটাস ট্র্যাকার */}
      <div
        className={`bg-white border border-gray-200 rounded-xl ${
          isMobile ? "p-4" : "p-6"
        } max-w-2xl mx-auto shadow-md`}
      >
        <h3 className="text-base font-bold text-gray-800 mb-3 text-center">
          আপনার অর্ডারের বর্তমান অবস্থা (Status) চেক করুন
        </h3>
        <form onSubmit={handleTrackOrder} className="flex flex-col gap-2.5">
          <input
            type="tel"
            required
            value={trackPhone}
            onChange={(e) => setTrackPhone(e.target.value)}
            placeholder="অর্ডার করার সময় দেওয়া ফোন নাম্বার লিখুন"
            className="w-full border border-gray-300 rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:border-gray-500"
          />
          <button
            type="submit"
            disabled={trackingLoading}
            className="w-full bg-gray-800 hover:bg-black text-white px-5 py-2.5 rounded-lg text-sm font-bold shadow-sm transition-all cursor-pointer"
          >
            {trackingLoading ? "খোঁজা হচ্ছে..." : "স্ট্যাটাস দেখুন"}
          </button>
        </form>

        {trackedOrders !== null && (
          <div className="mt-4 border-t border-gray-100 pt-3">
            {trackedOrders.length === 0 ? (
              <p className="text-center text-sm text-red-500">
                এই নাম্বারে কোনো অর্ডার পাওয়া যায়নি।
              </p>
            ) : (
              <div className="space-y-2.5">
                {trackedOrders.map((order) => (
                  <div
                    key={order.id}
                    className="flex flex-col gap-1.5 bg-gray-50 p-3 rounded-lg border border-gray-200 text-sm"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-gray-800">
                        Order #{formatOrderSerial(order.id)}
                      </span>
                      <span className="font-bold text-gray-900">
                        {order.total}৳
                      </span>
                    </div>
                    <div className="text-xs text-gray-600">
                      পরিমাণ: {order.quantity || 1}টি • {order.address}
                    </div>
                    <div className="pt-1">
                      {order.status === "confirmed" && (
                        <span className="inline-block bg-blue-100 text-blue-800 px-2.5 py-0.5 rounded-full font-bold text-xs">
                          ✓ Confirmed
                        </span>
                      )}
                      {order.status === "shipped" && (
                        <span className="inline-block bg-purple-100 text-purple-800 px-2.5 py-0.5 rounded-full font-bold text-xs">
                          🚚 Shipped / কুরিয়ারে
                        </span>
                      )}
                      {order.status === "delivered" && (
                        <span className="inline-block bg-green-100 text-green-800 px-2.5 py-0.5 rounded-full font-bold text-xs">
                          📦 Delivered
                        </span>
                      )}
                      {order.status === "cancelled" && (
                        <span className="inline-block bg-red-100 text-red-800 px-2.5 py-0.5 rounded-full font-bold text-xs">
                          ❌ Cancelled
                        </span>
                      )}
                      {(!order.status || order.status === "pending") && (
                        <span className="inline-block bg-yellow-100 text-yellow-800 px-2.5 py-0.5 rounded-full font-bold text-xs">
                          ⏳ Pending
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}