"use client";

import { useState, useMemo, useEffect } from "react";
import * as orderActions from "@/app/actions";

export type OrderStatusType =
  | "pending"
  | "confirmed"
  | "processing"
  | "shipped"
  | "delivered"
  | "cancelled";

type FilterStatus = "all" | OrderStatusType;

const ORDER_STATUS_OPTIONS: {
  value: OrderStatusType;
  label: string;
  badgeClass: string;
}[] = [
  {
    value: "pending",
    label: "Pending",
    badgeClass: "bg-amber-100 text-amber-800 border border-amber-200",
  },
  {
    value: "confirmed",
    label: "Confirmed",
    badgeClass: "bg-emerald-100 text-emerald-800 border border-emerald-200",
  },
  {
    value: "processing",
    label: "Processing",
    badgeClass: "bg-sky-100 text-sky-800 border border-sky-200",
  },
  {
    value: "shipped",
    label: "Shipped",
    badgeClass: "bg-indigo-100 text-indigo-800 border border-indigo-200",
  },
  {
    value: "delivered",
    label: "Delivered",
    badgeClass: "bg-teal-100 text-teal-800 border border-teal-200",
  },
  {
    value: "cancelled",
    label: "Cancelled",
    badgeClass: "bg-rose-100 text-rose-800 border border-rose-200",
  },
];

function normalizeStatus(raw: any): OrderStatusType {
  const val = String(raw || "pending").toLowerCase().trim();
  const valid = ORDER_STATUS_OPTIONS.find((s) => s.value === val);
  return valid ? valid.value : "pending";
}

function getStatusMeta(status: OrderStatusType) {
  return (
    ORDER_STATUS_OPTIONS.find((s) => s.value === status) ||
    ORDER_STATUS_OPTIONS[0]
  );
}

export default function OrderListAdmin({
  initialOrders = [],
  orders: ordersProp,
}: {
  initialOrders?: any[];
  orders?: any[];
}) {
  const sourceList = useMemo(() => {
    if (Array.isArray(initialOrders)) return initialOrders;
    if (Array.isArray(ordersProp)) return ordersProp;
    return [];
  }, [initialOrders, ordersProp]);

  const [orders, setOrders] = useState<any[]>(sourceList);
  const [loadingId, setLoadingId] = useState<number | string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<FilterStatus>("all");
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [statusNotice, setStatusNotice] = useState<string | null>(null);

  useEffect(() => {
    setOrders(sourceList);
  }, [sourceList]);

  const safeOrders = Array.isArray(orders) ? orders : [];

  function showNotice(msg: string) {
    setStatusNotice(msg);
    setTimeout(() => setStatusNotice(null), 2200);
  }

  async function handleStatusChange(
    id: number | string,
    nextStatus: OrderStatusType
  ) {
    setLoadingId(id);
    try {
      const anyActions = orderActions as any;
      if (typeof anyActions.updateOrderStatus === "function") {
        await anyActions.updateOrderStatus(id, nextStatus);
      } else if (
        nextStatus === "confirmed" &&
        typeof anyActions.confirmOrderStatus === "function"
      ) {
        await anyActions.confirmOrderStatus(id as number);
      }

      setOrders((prev) =>
        (Array.isArray(prev) ? prev : []).map((order) =>
          order?.id === id ? { ...order, status: nextStatus } : order
        )
      );

      if (selectedOrder?.id === id) {
        setSelectedOrder((prev: any) =>
          prev ? { ...prev, status: nextStatus } : null
        );
      }

      showNotice(`Order #${id} স্ট্যাটাস "${getStatusMeta(nextStatus).label}" করা হয়েছে`);
    } catch (err) {
      console.error("Failed to update order status:", err);
      showNotice("স্ট্যাটাস আপডেট করতে সমস্যা হয়েছে");
    } finally {
      setLoadingId(null);
    }
  }

  function handleCopy(text: string, key: string) {
    if (!text) return;
    navigator.clipboard?.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 1800);
  }

  function formatWhatsAppUrl(order: any) {
    const rawPhone = String(order?.phone || "").replace(/[^0-9]/g, "");
    const normalized = rawPhone.startsWith("88")
      ? rawPhone
      : rawPhone.startsWith("0")
      ? `88${rawPhone}`
      : `880${rawPhone}`;
    const st = getStatusMeta(normalizeStatus(order?.status)).label;
    const msg = encodeURIComponent(
      `আসসালামু আলাইকুম ${order?.name || "গ্রাহক"}, Sohoj Market থেকে আপনার অর্ডার #${order?.id || ""} (${order?.total || 0}৳, স্ট্যাটাস: ${st}) সম্পর্কে যোগাযোগ করছি।`
    );
    return `https://wa.me/${normalized}?text=${msg}`;
  }

  const stats = useMemo(() => {
    const totalCount = safeOrders.length;
    const pendingCount = safeOrders.filter(
      (o) => normalizeStatus(o?.status) === "pending"
    ).length;
    const confirmedCount = safeOrders.filter(
      (o) => normalizeStatus(o?.status) === "confirmed"
    ).length;
    const processingCount = safeOrders.filter(
      (o) => normalizeStatus(o?.status) === "processing"
    ).length;
    const shippedCount = safeOrders.filter(
      (o) => normalizeStatus(o?.status) === "shipped"
    ).length;
    const deliveredCount = safeOrders.filter(
      (o) => normalizeStatus(o?.status) === "delivered"
    ).length;
    const cancelledCount = safeOrders.filter(
      (o) => normalizeStatus(o?.status) === "cancelled"
    ).length;
    const totalRevenue = safeOrders
      .filter((o) => normalizeStatus(o?.status) !== "cancelled")
      .reduce((sum, o) => sum + (Number(o?.total) || 0), 0);

    return {
      totalCount,
      pendingCount,
      confirmedCount,
      processingCount,
      shippedCount,
      deliveredCount,
      cancelledCount,
      totalRevenue,
    };
  }, [safeOrders]);

  const filteredOrders = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return safeOrders.filter((order) => {
      const status = normalizeStatus(order?.status);
      if (statusFilter !== "all" && status !== statusFilter) return false;
      if (!q) return true;

      const idMatch = String(order?.id || "").toLowerCase().includes(q);
      const nameMatch = String(order?.name || "").toLowerCase().includes(q);
      const phoneMatch = String(order?.phone || "").toLowerCase().includes(q);
      const addressMatch = String(order?.address || "").toLowerCase().includes(q);
      return idMatch || nameMatch || phoneMatch || addressMatch;
    });
  }, [safeOrders, searchQuery, statusFilter]);

  return (
    <div className="bg-white rounded-xl shadow p-5 md:p-7 mb-10 border border-gray-200 space-y-6">
      {statusNotice && (
        <div className="bg-slate-900 text-emerald-300 text-xs font-bold px-4 py-2.5 rounded-xl border border-slate-700">
          {statusNotice}
        </div>
      )}

      {/* হেডার ও সামারি কার্ড */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">
            Customer Orders ({safeOrders.length})
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Pending ছাড়াও Confirmed, Processing, Shipped, Delivered ও Cancelled স্ট্যাটাসে অর্ডার পরিচালনা করুন
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
          <div className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2">
            <div className="text-slate-500">মোট অর্ডার</div>
            <div className="text-base font-extrabold text-slate-900">
              {stats.totalCount}
            </div>
          </div>
          <div className="bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
            <div className="text-amber-700">Pending</div>
            <div className="text-base font-extrabold text-amber-900">
              {stats.pendingCount}
            </div>
          </div>
          <div className="bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2">
            <div className="text-emerald-700">Confirmed / Active</div>
            <div className="text-base font-extrabold text-emerald-900">
              {stats.confirmedCount + stats.processingCount + stats.shippedCount}
            </div>
          </div>
          <div className="bg-indigo-50 border border-indigo-200 rounded-lg px-3 py-2">
            <div className="text-indigo-700">মোট অ্যামাউন্ট</div>
            <div className="text-base font-extrabold text-indigo-900">
              {stats.totalRevenue}৳
            </div>
          </div>
        </div>
      </div>

      {/* সার্চ ও স্ট্যাটাস ফিল্টার বার */}
      <div className="flex flex-col gap-3 bg-gray-50 p-3 rounded-xl border border-gray-200">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="নাম, ফোন নম্বর, Order ID বা ঠিকানা দিয়ে খুঁজুন..."
          className="w-full bg-white border border-gray-300 rounded-lg px-3.5 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-slate-400"
        />

        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={() => setStatusFilter("all")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
              statusFilter === "all"
                ? "bg-slate-900 text-white"
                : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-100"
            }`}
          >
            All ({stats.totalCount})
          </button>

          {ORDER_STATUS_OPTIONS.map((st) => {
            const countMap: Record<OrderStatusType, number> = {
              pending: stats.pendingCount,
              confirmed: stats.confirmedCount,
              processing: stats.processingCount,
              shipped: stats.shippedCount,
              delivered: stats.deliveredCount,
              cancelled: stats.cancelledCount,
            };
            return (
              <button
                key={st.value}
                type="button"
                onClick={() => setStatusFilter(st.value)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                  statusFilter === st.value
                    ? "bg-slate-900 text-white"
                    : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-100"
                }`}
              >
                {st.label} ({countMap[st.value]})
              </button>
            );
          })}
        </div>
      </div>

      {/* অর্ডার টেবিল */}
      {filteredOrders.length === 0 ? (
        <p className="text-gray-500 text-center py-8">
          {safeOrders.length === 0
            ? "এখনো কোনো অর্ডার আসেনি।"
            : "সার্চ বা ফিল্টারের সাথে মিলে এমন কোনো অর্ডার পাওয়া যায়নি।"}
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-100 text-gray-700 text-sm border-b">
                <th className="p-3">Order ID</th>
                <th className="p-3">Customer Info</th>
                <th className="p-3">Shipping</th>
                <th className="p-3">Total</th>
                <th className="p-3">Status</th>
                <th className="p-3 text-right">Action / Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 text-sm">
              {filteredOrders.map((order, index) => {
                const orderId = order?.id ?? index + 1;
                const currentStatus = normalizeStatus(order?.status);
                const statusMeta = getStatusMeta(currentStatus);
                const copyText = `Order #${orderId}\nName: ${order?.name || "-"}\nPhone: ${order?.phone || "-"}\nAddress: ${order?.address || "-"}\nStatus: ${statusMeta.label}\nTotal: ${order?.total ?? 0}৳`;

                return (
                  <tr key={orderId} className="hover:bg-gray-50 align-top">
                    <td className="p-3 font-bold text-gray-700 whitespace-nowrap">
                      #{orderId}
                      {order?.quantity ? (
                        <div className="text-[11px] font-medium text-gray-500 mt-0.5">
                          Qty: {order.quantity}
                        </div>
                      ) : null}
                    </td>

                    <td className="p-3">
                      <div className="font-bold text-gray-900">
                        {order?.name || "Unnamed Customer"}
                      </div>
                      <div className="flex items-center gap-2 text-gray-600 mt-0.5">
                        <span>{order?.phone || "-"}</span>
                        {order?.phone && (
                          <button
                            type="button"
                            onClick={() =>
                              handleCopy(String(order.phone), `phone-${orderId}`)
                            }
                            className="text-[11px] px-1.5 py-0.5 rounded bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold cursor-pointer"
                          >
                            {copiedKey === `phone-${orderId}` ? "Copied" : "Copy"}
                          </button>
                        )}
                      </div>
                      <div className="text-gray-500 text-xs mt-1">
                        {order?.address || "-"}
                      </div>
                    </td>

                    <td className="p-3 whitespace-nowrap text-gray-800">
                      {order?.shippingArea === "inside"
                        ? "ঢাকার ভিতরে"
                        : "ঢাকার বাহিরে"}{" "}
                      ({order?.shippingFee ?? 0}৳)
                    </td>

                    <td className="p-3 font-bold text-gray-900 whitespace-nowrap">
                      {order?.total ?? 0}৳
                    </td>

                    <td className="p-3 whitespace-nowrap space-y-1.5">
                      <div>
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${statusMeta.badgeClass}`}
                        >
                          {statusMeta.label}
                        </span>
                      </div>
                      <div>
                        <select
                          aria-label={`Order ${orderId} status`}
                          value={currentStatus}
                          disabled={loadingId === orderId}
                          onChange={(e) =>
                            handleStatusChange(
                              orderId,
                              e.target.value as OrderStatusType
                            )
                          }
                          className="bg-white border border-gray-300 rounded-lg px-2 py-1 text-xs font-bold text-gray-800 cursor-pointer disabled:opacity-50"
                        >
                          {ORDER_STATUS_OPTIONS.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    </td>

                    <td className="p-3 text-right whitespace-nowrap">
                      <div className="inline-flex flex-wrap justify-end items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => setSelectedOrder(order)}
                          className="bg-slate-100 hover:bg-slate-200 text-slate-800 px-2.5 py-1.5 rounded-lg text-xs font-bold cursor-pointer"
                        >
                          Details
                        </button>

                        <button
                          type="button"
                          onClick={() => handleCopy(copyText, `full-${orderId}`)}
                          className="bg-blue-50 hover:bg-blue-100 text-blue-700 px-2.5 py-1.5 rounded-lg text-xs font-bold cursor-pointer"
                        >
                          {copiedKey === `full-${orderId}` ? "✓ Copied" : "Copy Info"}
                        </button>

                        {order?.phone && (
                          <a
                            href={formatWhatsAppUrl(order)}
                            target="_blank"
                            rel="noreferrer"
                            className="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 px-2.5 py-1.5 rounded-lg text-xs font-bold"
                          >
                            WhatsApp
                          </a>
                        )}

                        {currentStatus === "pending" && (
                          <button
                            type="button"
                            onClick={() =>
                              handleStatusChange(orderId, "confirmed")
                            }
                            disabled={loadingId === orderId}
                            className="bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-colors disabled:opacity-50 cursor-pointer"
                          >
                            {loadingId === orderId ? "Saving..." : "Confirm"}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* অর্ডার ডিটেইলস মডাল */}
      {selectedOrder && (
        <div
          onClick={() => setSelectedOrder(null)}
          className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-gray-200 space-y-4"
          >
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-lg font-extrabold text-gray-900">
                Order #{selectedOrder?.id} Details
              </h3>
              <button
                type="button"
                onClick={() => setSelectedOrder(null)}
                className="text-gray-500 hover:text-gray-800 text-sm font-bold px-2 py-1 rounded cursor-pointer"
              >
                ✕ Close
              </button>
            </div>

            <div className="space-y-2 text-sm text-gray-700">
              <div>
                <span className="font-bold text-gray-900">কাস্টমারের নাম:</span>{" "}
                {selectedOrder?.name || "-"}
              </div>
              <div>
                <span className="font-bold text-gray-900">ফোন নম্বর:</span>{" "}
                {selectedOrder?.phone || "-"}
              </div>
              <div>
                <span className="font-bold text-gray-900">ঠিকানা:</span>{" "}
                {selectedOrder?.address || "-"}
              </div>
              <div>
                <span className="font-bold text-gray-900">ডেলিভারি জোন:</span>{" "}
                {selectedOrder?.shippingArea === "inside"
                  ? "ঢাকার ভিতরে"
                  : "ঢাকার বাহিরে"}{" "}
                ({selectedOrder?.shippingFee ?? 0}৳)
              </div>
              {selectedOrder?.quantity && (
                <div>
                  <span className="font-bold text-gray-900">পরিমাণ:</span>{" "}
                  {selectedOrder.quantity}
                </div>
              )}
              <div>
                <span className="font-bold text-gray-900">মোট বিল:</span>{" "}
                <span className="font-extrabold text-gray-950">
                  {selectedOrder?.total ?? 0}৳
                </span>
              </div>
              <div className="flex items-center gap-2 pt-1">
                <span className="font-bold text-gray-900">স্ট্যাটাস বদলান:</span>
                <select
                  value={normalizeStatus(selectedOrder?.status)}
                  disabled={loadingId === selectedOrder?.id}
                  onChange={(e) =>
                    handleStatusChange(
                      selectedOrder?.id,
                      e.target.value as OrderStatusType
                    )
                  }
                  className="bg-gray-50 border border-gray-300 rounded-lg px-2.5 py-1 text-xs font-bold text-gray-900 cursor-pointer"
                >
                  {ORDER_STATUS_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-end gap-2 pt-3 border-t">
              <button
                type="button"
                onClick={() => window.print()}
                className="px-3.5 py-2 rounded-lg text-xs font-bold bg-gray-100 hover:bg-gray-200 text-gray-800 cursor-pointer"
              >
                Print Slip
              </button>
              {selectedOrder?.phone && (
                <a
                  href={formatWhatsAppUrl(selectedOrder)}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3.5 py-2 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  WhatsApp Message
                </a>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}