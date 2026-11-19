"use client";

import { useState } from "react";
import { submitOrder, getOrdersByPhone } from "@/app/actions";
import { DynamicIcon } from "./DynamicIcon";
import { bdLocations } from "@/lib/bdLocations";

export default function CheckoutForm({ pricing }: { pricing: any }) {
  const [shippingArea, setShippingArea] = useState<"inside" | "outside">("inside");
  const [quantity, setQuantity] = useState<number>(1);
  const [district, setDistrict] = useState<string>("");
  const [thana, setThana] = useState<string>("");
  const [villageAddress, setVillageAddress] = useState<string>("");

  const [loading, setLoading] = useState(false);
  const [submittedOrder, setSubmittedOrder] = useState<any>(null);

  // স্ট্যাটাস চেকার স্টেট
  const [trackPhone, setTrackPhone] = useState("");
  const [trackedOrders, setTrackedOrders] = useState<any[] | null>(null);
  const [trackingLoading, setTrackingLoading] = useState(false);

  const ADMIN_WHATSAPP = "8801639193531";

  const districts = Object.keys(bdLocations);
  const availableThanas = bdLocations[district] || [];

  const subtotal = pricing.productPrice * quantity;
  const shippingFee = shippingArea === "inside" ? pricing.shippingInside : pricing.shippingOutside;
  const total = subtotal + shippingFee;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);

    const name = formData.get("name") as string;
    const phone = formData.get("phone") as string;
    const fullAddress = `${villageAddress}, থানা: ${thana}, জেলা: ${district}`;

    const result = await submitOrder({
      name,
      address: fullAddress,
      phone,
      shippingArea,
      quantity,
      subtotal,
      shippingFee,
      total,
    });

    if (result.success && result.order) {
      setSubmittedOrder(result.order);

      const shippingText = shippingArea === "inside" ? `ঢাকার ভিতরে (${shippingFee}৳)` : `ঢাকার বাহিরে (${shippingFee}৳)`;
      const message = `🛒 *নতুন অর্ডার এসেছে!* (Order #${result.order.id})
      
*নাম:* ${name}
*ফোন:* ${phone}
*ঠিকানা:* ${fullAddress}
*প্রোডাক্ট:* ${pricing.productName || "খাঁটি খেজুরের গুড়"} (× ${quantity})
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
    <div className="max-w-5xl mx-auto mt-12 mb-20" id="order">
      {submittedOrder ? (
        <div className="bg-[#F9F6F0] p-8 rounded-xl border border-[#E5DEC9] text-center max-w-3xl mx-auto shadow-md mb-10">
          <h3 className="text-2xl font-bold text-[#4B203D] mb-3">ধন্যবাদ, {submittedOrder.name}!</h3>
          <p className="text-gray-700 text-lg mb-4">
            আপনার অর্ডারটি (অর্ডার আইডি: <strong>#{submittedOrder.id}</strong> | পরিমাণ: <strong>{submittedOrder.quantity || 1}টি</strong>) সফলভাবে রিসিভ করা হয়েছে।
          </p>
          <div className="inline-block bg-white px-6 py-3 rounded-lg border border-gray-200 mb-6">
            <span className="text-gray-600 mr-2">বর্তমান অর্ডার স্ট্যাটাস:</span>
            {submittedOrder.status === "confirmed" && (
              <span className="font-bold text-blue-600">✓ Confirmed (অর্ডার কনফার্ম হয়েছে)</span>
            )}
            {submittedOrder.status === "shipped" && (
              <span className="font-bold text-purple-600">🚚 Shipped / কুরিয়ারে পাঠানো হয়েছে</span>
            )}
            {submittedOrder.status === "delivered" && (
              <span className="font-bold text-green-600">📦 Delivered (ডেলিভারি সম্পন্ন)</span>
            )}
            {submittedOrder.status === "cancelled" && (
              <span className="font-bold text-red-600">❌ Cancelled (বাতিল করা হয়েছে)</span>
            )}
            {(!submittedOrder.status || submittedOrder.status === "pending") && (
              <span className="font-bold text-amber-600">⏳ Pending (অ্যাডমিন কনফার্মেশনের অপেক্ষায়)</span>
            )}
          </div>
          <p className="text-sm text-gray-500 mb-6">
            নিচের বক্সে আপনার ফোন নাম্বার (<strong>{submittedOrder.phone}</strong>) দিয়ে যেকোনো সময় আপনার অর্ডারটির সর্বশেষ অবস্থা চেক করতে পারবেন।
          </p>
          <button
            onClick={() => setSubmittedOrder(null)}
            className="bg-[#4B203D] hover:bg-[#3a182f] text-white px-8 py-3 rounded-xl font-bold shadow-md transition-all cursor-pointer"
          >
            আরেকটি অর্ডার করুন
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="border border-[#D4C4A8] rounded-xl overflow-hidden bg-white shadow-md mb-10">
          <div className="p-6 md:p-10">
            <h2 className="text-[22px] md:text-[28px] font-bold text-[#222222] text-center mb-10">
              অর্ডার করতে নিচের ফর্মটি সঠিক ভাবে পুরন করুন।
            </h2>

            <div className="grid md:grid-cols-2 gap-10 items-start">
              {/* বাম পাশ: Billing details & Shipping */}
              <div className="space-y-6">
                <div>
                  <h3 className="text-[19px] font-bold text-[#222222] mb-4">Billing details</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-[14px] font-medium text-gray-700 mb-1">
                        নাম লিখুন <span className="text-red-500">*</span>
                      </label>
                      <input
                        required
                        name="name"
                        type="text"
                        placeholder="আপনার নাম"
                        className="w-full border border-gray-300 rounded-md px-3.5 py-2.5 text-[15px] focus:outline-none focus:border-gray-500 bg-white"
                      />
                    </div>

                    <div>
                      <label className="block text-[14px] font-medium text-gray-700 mb-1">
                        ফোন নাম্বার লিখুন <span className="text-red-500">*</span>
                      </label>
                      <input
                        required
                        name="phone"
                        type="tel"
                        placeholder="১১ সংখ্যার ফোন নাম্বার"
                        className="w-full border border-gray-300 rounded-md px-3.5 py-2.5 text-[15px] focus:outline-none focus:border-gray-500 bg-white"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[14px] font-medium text-gray-700 mb-1">
                          জেলা <span className="text-red-500">*</span>
                        </label>
                        <input
                          required
                          list="district-list"
                          value={district}
                          onChange={(e) => {
                            setDistrict(e.target.value);
                            setThana("");
                            if (e.target.value === "ঢাকা") {
                              setShippingArea("inside");
                            } else if (e.target.value) {
                              setShippingArea("outside");
                            }
                          }}
                          placeholder="জেলা সিলেক্ট বা লিখুন"
                          className="w-full border border-gray-300 rounded-md px-3.5 py-2.5 text-[15px] focus:outline-none focus:border-gray-500 bg-white"
                        />
                        <datalist id="district-list">
                          {districts.map((dist) => (
                            <option key={dist} value={dist} />
                          ))}
                        </datalist>
                      </div>

                      <div>
                        <label className="block text-[14px] font-medium text-gray-700 mb-1">
                          থানা / উপজেলা <span className="text-red-500">*</span>
                        </label>
                        <input
                          required
                          list="thana-list"
                          value={thana}
                          onChange={(e) => setThana(e.target.value)}
                          placeholder="থানা সিলেক্ট বা লিখুন"
                          className="w-full border border-gray-300 rounded-md px-3.5 py-2.5 text-[15px] focus:outline-none focus:border-gray-500 bg-white"
                        />
                        <datalist id="thana-list">
                          {availableThanas.map((th) => (
                            <option key={th} value={th} />
                          ))}
                        </datalist>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[14px] font-medium text-gray-700 mb-1">
                        গ্রাম / বাসা / রোড নং <span className="text-red-500">*</span>
                      </label>
                      <input
                        required
                        type="text"
                        value={villageAddress}
                        onChange={(e) => setVillageAddress(e.target.value)}
                        placeholder="গ্রাম বা এলাকার বিস্তারিত ঠিকানা লিখুন"
                        className="w-full border border-gray-300 rounded-md px-3.5 py-2.5 text-[15px] focus:outline-none focus:border-gray-500 bg-white"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-[19px] font-bold text-[#222222] mb-3">Shipping</h3>
                  <div className="border border-gray-200 rounded-lg divide-y divide-gray-200 bg-white">
                    <label className="flex items-center justify-between p-3.5 cursor-pointer hover:bg-gray-50">
                      <div className="flex items-center gap-3">
                        <input
                          type="radio"
                          name="shipping"
                          value="inside"
                          checked={shippingArea === "inside"}
                          onChange={() => setShippingArea("inside")}
                          className="w-4 h-4 accent-black"
                        />
                        <span className="text-[15px] text-gray-800">ঢাকার ভিতরে:</span>
                      </div>
                      <span className="text-[15px] font-medium text-gray-800">{pricing.shippingInside}৳</span>
                    </label>
                    <label className="flex items-center justify-between p-3.5 cursor-pointer hover:bg-gray-50">
                      <div className="flex items-center gap-3">
                        <input
                          type="radio"
                          name="shipping"
                          value="outside"
                          checked={shippingArea === "outside"}
                          onChange={() => setShippingArea("outside")}
                          className="w-4 h-4 accent-black"
                        />
                        <span className="text-[15px] text-gray-800">ঢাকার বাহিরে:</span>
                      </div>
                      <span className="text-[15px] font-medium text-gray-800">{pricing.shippingOutside}৳</span>
                    </label>
                  </div>
                </div>
              </div>

              {/* ডান পাশ: Your order */}
              <div>
                <h3 className="text-[19px] font-bold text-[#222222] mb-4">Your order</h3>
                <div className="border border-gray-200 rounded-xl p-6 bg-white shadow-xs">
                  <div className="flex justify-between font-bold text-[15px] text-gray-900 pb-3 border-b border-gray-200">
                    <span>Product</span>
                    <span>Subtotal</span>
                  </div>

                  <div className="py-3.5 border-b border-gray-200 flex justify-between items-center text-[15px]">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-amber-50 border border-amber-200 rounded flex items-center justify-center text-amber-800 font-bold text-sm shrink-0">
                        G
                      </div>
                      <div>
                        <div className="text-gray-800 font-medium">{pricing.productName || "খাঁটি খেজুরের গুড়"}</div>
                        {/* প্রোডাক্ট পরিমাণ (Quantity) কন্ট্রোলার */}
                        <div className="inline-flex items-center border border-gray-300 rounded mt-1.5 bg-gray-50">
                          <button
                            type="button"
                            onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                            className="px-3 py-1 text-gray-700 hover:bg-gray-200 font-bold cursor-pointer"
                          >
                            -
                          </button>
                          <span className="px-3.5 py-1 text-sm font-semibold text-gray-900 bg-white border-x border-gray-300">
                            {quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => setQuantity((q) => q + 1)}
                            className="px-3 py-1 text-gray-700 hover:bg-gray-200 font-bold cursor-pointer"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    </div>
                    <div className="text-gray-600 text-right">
                      × {quantity} <span className="block sm:inline sm:ml-2 font-semibold text-gray-900">{subtotal}৳</span>
                    </div>
                  </div>

                  <div className="py-3 flex justify-between items-center text-[15px] text-gray-800 border-b border-gray-200">
                    <span>Subtotal</span>
                    <span className="font-semibold">{subtotal}৳</span>
                  </div>

                  <div className="py-3 flex justify-between items-center text-[15px] text-gray-800 border-b border-gray-200">
                    <span>Shipping</span>
                    <span className="text-gray-600">
                      {shippingArea === "inside" ? "ঢাকার ভিতরে" : "ঢাকার বাহিরে"}:{" "}
                      <strong className="text-gray-900">{shippingFee}৳</strong>
                    </span>
                  </div>

                  <div className="py-3.5 flex justify-between items-center font-bold text-[18px] text-gray-900 border-b border-gray-200">
                    <span>Total</span>
                    <span>{total}৳</span>
                  </div>

                  <div className="mt-4 bg-[#F9F6F0] border border-[#E5DEC9] rounded-lg p-4 mb-4">
                    <div className="font-bold text-[15px] mb-1.5 text-gray-900">ক্যাশ অন ডেলিভারি</div>
                    <div className="text-[14px] text-gray-600 bg-white p-3 rounded border border-gray-200">
                      Pay with cash upon delivery.
                    </div>
                  </div>

                  <p className="text-[12px] text-gray-500 mb-5 leading-relaxed">
                    Your personal data will be used to process your order, support your experience throughout this website, and for other purposes described in our privacy policy.
                  </p>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-[#4A2018] hover:bg-[#381611] text-white py-3.5 rounded-xl font-bold text-[17px] flex items-center justify-center gap-2 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:opacity-70 cursor-pointer"
                  >
                    {loading ? (
                      "অর্ডার প্রসেস হচ্ছে..."
                    ) : (
                      <>
                        <DynamicIcon name="Lock" className="w-5 h-5" />
                        অর্ডার করুন {total}৳
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
      <div className="bg-white border border-gray-200 rounded-xl p-6 max-w-2xl mx-auto shadow-md">
        <h3 className="text-lg font-bold text-gray-800 mb-3 text-center">
          আপনার অর্ডারের বর্তমান অবস্থা (Status) চেক করুন
        </h3>
        <form onSubmit={handleTrackOrder} className="flex flex-col sm:flex-row gap-3">
          <input
            type="tel"
            required
            value={trackPhone}
            onChange={(e) => setTrackPhone(e.target.value)}
            placeholder="অর্ডার করার সময় দেওয়া ফোন নাম্বার লিখুন"
            className="flex-1 border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-gray-500"
          />
          <button
            type="submit"
            disabled={trackingLoading}
            className="bg-gray-800 hover:bg-black text-white px-6 py-2.5 rounded-lg text-sm font-bold shadow-sm transition-all cursor-pointer"
          >
            {trackingLoading ? "খোঁজা হচ্ছে..." : "স্ট্যাটাস দেখুন"}
          </button>
        </form>

        {trackedOrders !== null && (
          <div className="mt-5 border-t border-gray-100 pt-4">
            {trackedOrders.length === 0 ? (
              <p className="text-center text-sm text-red-500">এই নাম্বারে কোনো অর্ডার পাওয়া যায়নি।</p>
            ) : (
              <div className="space-y-3">
                {trackedOrders.map((order) => (
                  <div
                    key={order.id}
                    className="flex items-center justify-between bg-gray-50 p-3.5 rounded-lg border border-gray-200 text-sm"
                  >
                    <div>
                      <span className="font-bold text-gray-800">Order #{order.id}</span> — {order.quantity || 1}টি ({order.total}৳)
                      <div className="text-xs text-gray-500 mt-0.5">{order.address}</div>
                    </div>
                    <div>
                      {order.status === "confirmed" && (
                        <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full font-bold text-xs">
                          ✓ Confirmed
                        </span>
                      )}
                      {order.status === "shipped" && (
                        <span className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full font-bold text-xs">
                          🚚 Shipped / কুরিয়ারে
                        </span>
                      )}
                      {order.status === "delivered" && (
                        <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full font-bold text-xs">
                          📦 Delivered
                        </span>
                      )}
                      {order.status === "cancelled" && (
                        <span className="bg-red-100 text-red-800 px-3 py-1 rounded-full font-bold text-xs">
                          ❌ Cancelled
                        </span>
                      )}
                      {(!order.status || order.status === "pending") && (
                        <span className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full font-bold text-xs">
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