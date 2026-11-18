"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { updateContentAction } from "./actions";
import { updateOrderStatus, deleteOrder, updateWhatsappNumber } from "@/app/actions";

export default function AdminDashboard({
  initialOrders,
  defaultValues,
  initialWhatsapp,
}: {
  initialOrders: any[];
  defaultValues: any;
  initialWhatsapp: string;
}) {
  const [orders, setOrders] = useState<any[]>(initialOrders || []);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);

  const [content, setContent] = useState<any>(defaultValues || {});
  const [whatsapp, setWhatsapp] = useState<string>(initialWhatsapp || "");
  
  const [loading, setLoading] = useState(false);
  const [uploadingKey, setUploadingKey] = useState<string | null>(null);
  const router = useRouter();

  // জেনেরিক হ্যান্ডলার: যেকোনো টেক্সট ইনপুট বা টেক্সটএরিয়ার মান পরিবর্তন করার জন্য
  function handleInputChange(sectionPath: string[], value: any) {
    setContent((prev: any) => {
      const newContent = JSON.parse(JSON.stringify(prev));
      let current = newContent;
      for (let i = 0; i < sectionPath.length - 1; i++) {
        if (!current[sectionPath[i]]) current[sectionPath[i]] = {};
        current = current[sectionPath[i]];
      }
      current[sectionPath[sectionPath.length - 1]] = value;
      return newContent;
    });
  }

  async function uploadToCloudinary(file: File): Promise<string> {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", "sohojmarket_preset");

    const res = await fetch(`https://api.cloudinary.com/v1_1/hcvbcphm/image/upload`, {
      method: "POST",
      body: formData,
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error?.message || "Cloudinary upload failed");
    }

    if (data.secure_url) {
      return data.secure_url;
    }
    throw new Error("Invalid response from Cloudinary");
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>, sectionPath: string[]) {
    const file = e.target.files?.[0];
    if (!file) return;

    const uploadKeyId = sectionPath.join(".");
    try {
      setUploadingKey(uploadKeyId);
      const url = await uploadToCloudinary(file);
      handleInputChange(sectionPath, url);
      alert("ছবি সফলভাবে আপলোড হয়েছে!");
    } catch (error: any) {
      alert("ছবি আপলোড ব্যর্থ হয়েছে: " + error.message);
      console.error(error);
    } finally {
      setUploadingKey(null);
    }
  }

  async function handleSave() {
    try {
      setLoading(true);
      
      if (whatsapp) {
        await updateWhatsappNumber(whatsapp);
      }

      const cleanData = JSON.parse(JSON.stringify({
        ...content,
        adminWhatsApp: whatsapp,
      }));
      await updateContentAction(cleanData);

      alert("সব পরিবর্তন সফলভাবে সেভ হয়েছে!");
      router.refresh();
    } catch (error: any) {
      alert("সেভ করতে সমস্যা হয়েছে: " + (error.message || "Unknown error"));
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  async function handleStatusChange(orderId: number, newStatus: string) {
    const res = await updateOrderStatus(orderId, newStatus);
    if (res.success) {
      setOrders(orders.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o)));
      if (selectedOrder && selectedOrder.id === orderId) {
        setSelectedOrder({ ...selectedOrder, status: newStatus });
      }
      router.refresh();
    }
  }

  async function handleDeleteOrder(orderId: number) {
    if (confirm("আপনি কি নিশ্চিতভাবে এই অর্ডারটি ডিলিট করতে চান?")) {
      const res = await deleteOrder(orderId);
      if (res.success) {
        setOrders(orders.filter((o) => o.id !== orderId));
        setSelectedOrder(null);
        router.refresh();
      }
    }
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-12 pb-20">
      <div className="border-b pb-4 flex flex-col sm:flex-row justify-between sm:items-center gap-3">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900">ডিজিটাল অ্যাডমিন প্যানেল</h1>
          <p className="text-sm text-gray-500 mt-1">অর্ডার ম্যানেজমেন্ট এবং ওয়েবসাইটের সম্পূর্ণ লেখা ও ছবি নিয়ন্ত্রণ</p>
        </div>
        <div className="bg-blue-100 text-blue-800 px-4 py-2 rounded-xl font-bold text-sm w-fit">
          মোট অর্ডার: {orders.length}টি
        </div>
      </div>

      <section className="space-y-4">
        <h2 className="text-xl font-bold text-gray-800">কাস্টমার অর্ডার লিস্ট (বিস্তারিত দেখতে ক্লিক করুন)</h2>
        <div className="bg-white rounded-xl shadow overflow-hidden border border-gray-200 overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[700px]">
            <thead>
              <tr className="bg-gray-100 border-b border-gray-200 text-sm text-gray-700">
                <th className="p-3">আইডি</th>
                <th className="p-3">গ্রাহকের নাম ও ফোন</th>
                <th className="p-3">পরিমাণ</th>
                <th className="p-3">এলাকা</th>
                <th className="p-3">মোট বিল</th>
                <th className="p-3">স্ট্যাটাস</th>
                <th className="p-3 text-center">কার্যক্রম</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 text-sm">
              {orders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-6 text-center text-gray-500">কোনো অর্ডার পাওয়া যায়নি।</td>
                </tr>
              ) : (
                orders.map((order) => (
                  <tr
                    key={order.id}
                    className="hover:bg-blue-50/50 cursor-pointer transition-colors"
                    onClick={() => setSelectedOrder(order)}
                  >
                    <td className="p-3 font-bold text-gray-800">#{order.id}</td>
                    <td className="p-3">
                      <div className="font-semibold text-gray-900">{order.name}</div>
                      <div className="text-xs text-gray-500">{order.phone}</div>
                    </td>
                    <td className="p-3 font-bold text-gray-800">
                      {order.quantity || 1} টি
                    </td>
                    <td className="p-3 text-gray-600">
                      {order.shippingArea === "inside" ? "ঢাকার ভিতরে" : "ঢাকার বাহিরে"}
                    </td>
                    <td className="p-3 font-bold text-gray-900">{order.total}৳</td>
                    <td className="p-3" onClick={(e) => e.stopPropagation()}>
                      <select
                        value={order.status || "pending"}
                        onChange={(e) => handleStatusChange(order.id, e.target.value)}
                        className={`px-2.5 py-1.5 rounded-lg text-xs font-bold border cursor-pointer ${
                          order.status === "confirmed"
                            ? "bg-blue-100 text-blue-800 border-blue-300"
                            : order.status === "shipped"
                            ? "bg-purple-100 text-purple-800 border-purple-300"
                            : order.status === "delivered"
                            ? "bg-green-100 text-green-800 border-green-300"
                            : order.status === "cancelled"
                            ? "bg-red-100 text-red-800 border-red-300"
                            : "bg-yellow-100 text-yellow-800 border-yellow-300"
                        }`}
                      >
                        <option value="pending">⏳ Pending</option>
                        <option value="confirmed">✓ Confirmed</option>
                        <option value="shipped">🚚 Shipped</option>
                        <option value="delivered">📦 Delivered</option>
                        <option value="cancelled">❌ Cancelled</option>
                      </select>
                    </td>
                    <td className="p-3 text-center" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => handleDeleteOrder(order.id)}
                        className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-xs font-bold transition-colors cursor-pointer"
                      >
                        ডিলিট
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      <div className="space-y-8 border-t pt-8">
        <h2 className="text-2xl font-bold text-gray-900">ওয়েবসাইট কনটেন্ট ও সেটিংস এডিটর</h2>

        <section className="space-y-4 bg-gray-50 p-6 rounded-xl border border-gray-200">
          <h3 className="text-xl font-bold text-gray-800">অ্যাডমিন হোয়াটসঅ্যাপ নাম্বার সেটিংস</h3>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">হোয়াটসঅ্যাপ নাম্বার</label>
            <input
              type="text"
              value={whatsapp}
              onChange={(e) => setWhatsapp(e.target.value)}
              placeholder="8801712345678"
              className="w-full max-w-md border border-gray-300 rounded-lg px-4 py-2.5 text-sm bg-white"
            />
          </div>
        </section>

        <section className="space-y-4 bg-white p-6 rounded-xl border border-gray-200">
          <h3 className="text-xl font-bold border-b pb-2 text-indigo-700">1. Hero Section</h3>
          <div>
            <label className="block text-sm font-bold mb-1">Badge</label>
            <input
              className="w-full border p-2.5 rounded-lg"
              value={content.hero?.badge || ""}
              onChange={(e) => handleInputChange(["hero", "badge"], e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-bold mb-1">Title</label>
            <input
              className="w-full border p-2.5 rounded-lg"
              value={content.hero?.title || ""}
              onChange={(e) => handleInputChange(["hero", "title"], e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-bold mb-1">Description</label>
            <textarea
              className="w-full border p-2.5 rounded-lg"
              rows={3}
              value={content.hero?.description || ""}
              onChange={(e) => handleInputChange(["hero", "description"], e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-bold mb-1">Hero Image Change (ছবি আপলোড বাটন)</label>
            <input
              type="file"
              accept="image/*"
              className="w-full border p-2 rounded-lg bg-gray-50 cursor-pointer"
              onChange={(e) => handleFileChange(e, ["hero", "imageUrl"])}
            />
            <p className="text-xs text-gray-500 mt-1">বর্তমান লিংক: {content.hero?.imageUrl || "নেই"}</p>
          </div>
        </section>

        <section className="space-y-4 bg-white p-6 rounded-xl border border-gray-200">
          <h3 className="text-xl font-bold border-b pb-2 text-indigo-700">2. Details Section</h3>
          <div>
            <label className="block text-sm font-bold mb-1">Text 1 (প্রথম প্যারাগ্রাফ)</label>
            <textarea
              className="w-full border p-2.5 rounded-lg"
              rows={3}
              value={content.details?.text1 || ""}
              onChange={(e) => handleInputChange(["details", "text1"], e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-bold mb-1">Text 2 (হাইলাইটেড বক্সের লেখা)</label>
            <input
              className="w-full border p-2.5 rounded-lg"
              value={content.details?.text2 || ""}
              onChange={(e) => handleInputChange(["details", "text2"], e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-bold mb-1">Points Title</label>
            <input
              className="w-full border p-2.5 rounded-lg"
              value={content.details?.pointsTitle || ""}
              onChange={(e) => handleInputChange(["details", "pointsTitle"], e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-bold mb-1">Details Image Change (ছবি আপলোড বাটন)</label>
            <input
              type="file"
              accept="image/*"
              className="w-full border p-2 rounded-lg bg-gray-50 cursor-pointer"
              onChange={(e) => handleFileChange(e, ["details", "imageUrl"])}
            />
            <p className="text-xs text-gray-500 mt-1">বর্তমান লিংক: {content.details?.imageUrl || "নেই"}</p>
          </div>
        </section>

        <section className="space-y-4 bg-white p-6 rounded-xl border border-gray-200">
          <h3 className="text-xl font-bold border-b pb-2 text-indigo-700">3. Why Us Section</h3>
          <div>
            <label className="block text-sm font-bold mb-1">Title</label>
            <input
              className="w-full border p-2.5 rounded-lg"
              value={content.whyUs?.title || ""}
              onChange={(e) => handleInputChange(["whyUs", "title"], e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-bold mb-1">Why Us Image Change (ছবি আপলোড বাটন)</label>
            <input
              type="file"
              accept="image/*"
              className="w-full border p-2 rounded-lg bg-gray-50 cursor-pointer"
              onChange={(e) => handleFileChange(e, ["whyUs", "imageUrl"])}
            />
            <p className="text-xs text-gray-500 mt-1">বর্তমান লিংক: {content.whyUs?.imageUrl || "নেই"}</p>
          </div>
        </section>

        <section className="space-y-4 bg-white p-6 rounded-xl border border-gray-200">
          <h3 className="text-xl font-bold border-b pb-2 text-indigo-700">4. Target Audience Section</h3>
          <div>
            <label className="block text-sm font-bold mb-1">Title</label>
            <input
              className="w-full border p-2.5 rounded-lg"
              value={content.targetAudience?.title || ""}
              onChange={(e) => handleInputChange(["targetAudience", "title"], e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-bold mb-1">Target Image Change (ছবি আপলোড বাটন)</label>
            <input
              type="file"
              accept="image/*"
              className="w-full border p-2 rounded-lg bg-gray-50 cursor-pointer"
              onChange={(e) => handleFileChange(e, ["targetAudience", "imageUrl"])}
            />
            <p className="text-xs text-gray-500 mt-1">বর্তমান লিংক: {content.targetAudience?.imageUrl || "নেই"}</p>
          </div>
        </section>

        <section className="space-y-4 bg-white p-6 rounded-xl border border-gray-200">
          <h3 className="text-xl font-bold border-b pb-2 text-indigo-700">5. Pricing & Shipping</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-bold mb-1">Product Price</label>
              <input
                type="number"
                className="w-full border p-2.5 rounded-lg"
                value={content.pricing?.productPrice || 0}
                onChange={(e) => handleInputChange(["pricing", "productPrice"], Number(e.target.value))}
              />
            </div>
            <div>
              <label className="block text-sm font-bold mb-1">Shipping Inside Dhaka</label>
              <input
                type="number"
                className="w-full border p-2.5 rounded-lg"
                value={content.pricing?.shippingInside || 0}
                onChange={(e) => handleInputChange(["pricing", "shippingInside"], Number(e.target.value))}
              />
            </div>
            <div>
              <label className="block text-sm font-bold mb-1">Shipping Outside Dhaka</label>
              <input
                type="number"
                className="w-full border p-2.5 rounded-lg"
                value={content.pricing?.shippingOutside || 0}
                onChange={(e) => handleInputChange(["pricing", "shippingOutside"], Number(e.target.value))}
              />
            </div>
          </div>
        </section>

        {/* Advanced Raw Content (JSON) - সম্পূর্ণ লেখার কন্ট্রোল */}
        <section className="space-y-4 bg-white p-6 rounded-xl border border-gray-200">
          <h3 className="text-xl font-bold border-b pb-2 text-indigo-700">6. Advanced Raw Content (JSON)</h3>
          <p className="text-xs text-gray-500">ওয়েবসাইটের অন্য যেকোনো সেকশন বা ফিচারের লেখা পরিবর্তন করতে চাইলে এখান থেকে সরাসরি JSON এডিট করতে পারেন।</p>
          <textarea
            className="w-full border p-3 rounded-lg font-mono text-sm bg-gray-50 text-gray-800"
            rows={12}
            value={JSON.stringify(content, null, 2)}
            onChange={(e) => {
              try {
                setContent(JSON.parse(e.target.value));
              } catch (err) {}
            }}
          />
        </section>

        <div className="pt-2">
          <button
            onClick={handleSave}
            disabled={loading || uploadingKey !== null}
            className="bg-black hover:bg-gray-800 text-white px-8 py-3.5 rounded-xl font-bold disabled:opacity-50 cursor-pointer shadow-lg transition-all"
          >
            {loading ? "Saving..." : uploadingKey !== null ? "Uploading image..." : "Save Content & Settings"}
          </button>
        </div>
      </div>

      {selectedOrder && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl relative space-y-4">
            <button
              onClick={() => setSelectedOrder(null)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 text-xl font-bold cursor-pointer"
            >
              ✕
            </button>

            <h3 className="text-xl font-bold text-gray-900 border-b pb-3">
              কাস্টমার অর্ডার ডিটেইলস #{selectedOrder.id}
            </h3>

            <div className="space-y-3 text-sm text-gray-700">
              <div className="bg-gray-50 p-4 rounded-xl space-y-2 border">
                <div><strong>গ্রাহকের নাম:</strong> <span className="text-gray-900 font-semibold">{selectedOrder.name}</span></div>
                <div><strong>ফোন নাম্বার:</strong> <span className="text-gray-900 font-semibold">{selectedOrder.phone}</span></div>
                <div><strong>সম্পূর্ণ ঠিকানা:</strong> <span className="text-gray-900 font-semibold">{selectedOrder.address}</span></div>
                <div><strong>পণ্যের পরিমাণ:</strong> <span className="text-gray-900 font-semibold">{selectedOrder.quantity || 1} টি</span></div>
                <div><strong>শিপিং এলাকা:</strong> <span className="text-gray-900 font-semibold">{selectedOrder.shippingArea === "inside" ? "ঢাকার ভিতরে" : "ঢাকার বাহিরে"}</span></div>
              </div>

              <div className="bg-blue-50 p-4 rounded-xl space-y-1.5 border border-blue-100">
                <div><strong>পণ্যের মূল্য (Subtotal):</strong> {selectedOrder.subtotal}৳</div>
                <div><strong>ডেলিভারি চার্জ (Shipping):</strong> {selectedOrder.shippingFee}৳</div>
                <div className="text-base font-bold text-blue-900 pt-1.5 border-t border-blue-200">
                  সর্বমোট বিল: {selectedOrder.total}৳
                </div>
              </div>

              <div className="flex justify-between items-center pt-1">
                <div>
                  <strong>বর্তমান স্ট্যাটাস:</strong>{" "}
                  <span className={
                    selectedOrder.status === "confirmed" ? "text-blue-600 font-bold" :
                    selectedOrder.status === "shipped" ? "text-purple-600 font-bold" :
                    selectedOrder.status === "delivered" ? "text-green-600 font-bold" :
                    selectedOrder.status === "cancelled" ? "text-red-600 font-bold" : "text-amber-600 font-bold"
                  }>
                    {(selectedOrder.status || "pending").toUpperCase()}
                  </span>
                </div>
                <div className="text-xs text-gray-400">
                  সময়: {new Date(selectedOrder.createdAt).toLocaleString("bn-BD")}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t">
              <button
                onClick={() => handleDeleteOrder(selectedOrder.id)}
                className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-xl text-sm font-bold cursor-pointer"
              >
                অর্ডার ডিলিট করুন
              </button>
              <button
                onClick={() => setSelectedOrder(null)}
                className="bg-gray-800 hover:bg-black text-white px-4 py-2 rounded-xl text-sm font-bold cursor-pointer"
              >
                বন্ধ করুন
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}