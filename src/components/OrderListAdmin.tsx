"use client";

import { useState } from "react";
import { confirmOrderStatus } from "@/app/actions";

export default function OrderListAdmin({ initialOrders }: { initialOrders: any[] }) {
  const [orders, setOrders] = useState(initialOrders);
  const [loadingId, setLoadingId] = useState<number | null>(null);

  async function handleConfirm(id: number) {
    setLoadingId(id);
    await confirmOrderStatus(id);
    setOrders((prev) =>
      prev.map((order) => (order.id === id ? { ...order, status: "confirmed" } : order))
    );
    setLoadingId(null);
  }

  return (
    <div className="bg-white rounded-xl shadow p-6 md:p-8 mb-10 border border-gray-200">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Customer Orders ({orders.length})</h2>
      </div>

      {orders.length === 0 ? (
        <p className="text-gray-500 text-center py-8">এখনো কোনো অর্ডার আসেনি।</p>
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
                <th className="p-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 text-sm">
              {orders.map((order) => (
                <tr key={order.id} className="hover:bg-gray-50">
                  <td className="p-3 font-bold text-gray-700">#{order.id}</td>
                  <td className="p-3">
                    <div className="font-bold text-gray-900">{order.name}</div>
                    <div className="text-gray-600">{order.phone}</div>
                    <div className="text-gray-500 text-xs mt-0.5">{order.address}</div>
                  </td>
                  <td className="p-3">
                    {order.shippingArea === "inside" ? "ঢাকার ভিতরে" : "ঢাকার বাহিরে"} ({order.shippingFee}৳)
                  </td>
                  <td className="p-3 font-bold text-gray-900">{order.total}৳</td>
                  <td className="p-3">
                    {order.status === "confirmed" ? (
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-green-100 text-green-800">
                        ✓ Confirmed
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-yellow-100 text-yellow-800">
                        ⏳ Pending
                      </span>
                    )}
                  </td>
                  <td className="p-3 text-right">
                    {order.status === "pending" ? (
                      <button
                        onClick={() => handleConfirm(order.id)}
                        disabled={loadingId === order.id}
                        className="bg-green-600 hover:bg-green-700 text-white px-4 py-1.5 rounded-lg text-xs font-bold transition-colors disabled:opacity-50 cursor-pointer"
                      >
                        {loadingId === order.id ? "Confirming..." : "Confirm Order"}
                      </button>
                    ) : (
                      <span className="text-gray-400 text-xs font-medium">Completed</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}