"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminLoginPage() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/admin-auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        // সফলভাবে লগইন হলে অ্যাডমিন ড্যাশবোর্ডে রিডাইরেক্ট করবে
        router.push("/admin");
        router.refresh();
      } else {
        setError(data.error || "পাসওয়ার্ড ভুল হয়েছে!");
      }
    } catch (err) {
      setError("সার্ভারে সংযোগ স্থাপন করতে সমস্যা হয়েছে।");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900">অ্যাডমিন প্যানেল লকড</h1>
          <p className="text-sm text-gray-500 mt-1">প্রবেশ করতে পাসওয়ার্ড দিন</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">পাসওয়ার্ড</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="আপনার পাসওয়ার্ড দিন"
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-black"
              required
            />
          </div>

          {error && <p className="text-red-500 text-xs font-semibold">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-black hover:bg-gray-800 text-white py-3 rounded-lg font-bold transition-colors cursor-pointer disabled:opacity-50"
          >
            {loading ? "যাচাই করা হচ্ছে..." : "লগইন করুন"}
          </button>
        </form>
      </div>
    </div>
  );
}