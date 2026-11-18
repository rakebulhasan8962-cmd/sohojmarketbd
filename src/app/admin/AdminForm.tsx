"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { updateContentAction } from "./actions"

export default function AdminForm({ defaultValues }: { defaultValues: any }) {
  const [content, setContent] = useState(defaultValues)
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const router = useRouter()

  async function uploadToCloudinary(file: File): Promise<string> {
    const formData = new FormData()
    formData.append("file", file)
    formData.append("upload_preset", "sohojmarket_preset")

    const res = await fetch(`https://api.cloudinary.com/v1_1/hcvbcphm/image/upload`, {
      method: "POST",
      body: formData,
    })
    
    const data = await res.json()
    if (!res.ok) {
      throw new Error(data.error?.message || "Cloudinary upload failed")
    }
    
    if (data.secure_url) {
      return data.secure_url
    }
    throw new Error("Invalid response from Cloudinary")
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>, sectionKey: string) {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      setUploading(true)
      const url = await uploadToCloudinary(file)
      
      setContent((prev: any) => ({
        ...prev,
        [sectionKey]: {
          ...(prev[sectionKey] || {}),
          imageUrl: url
        }
      }))
      alert("Image uploaded to Cloudinary successfully!")
    } catch (error: any) {
      alert("Image upload failed: " + error.message)
      console.error(error)
    } finally {
      setUploading(false)
    }
  }

  async function handleSave() {
    try {
      setLoading(true)
      const cleanData = JSON.parse(JSON.stringify(content))
      await updateContentAction(cleanData)
      alert("Saved successfully!")
      router.refresh()
    } catch (error: any) {
      alert("Failed to save: " + (error.message || "Unknown error"))
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-8 pb-12">
      {/* হোয়াটসঅ্যাপ নাম্বার সেটিংস */}
      <section className="space-y-4 bg-gray-50 p-6 rounded-xl border border-gray-200">
        <h2 className="text-xl font-bold text-gray-800">অ্যাডমিন হোয়াটসঅ্যাপ নাম্বার সেটিংস</h2>
        <p className="text-sm text-gray-500">
          কাস্টমার অর্ডার করলে সরাসরি এই নাম্বারে হোয়াটসঅ্যাপ নোটিফিকেশন চলে যাবে।
        </p>
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-1">
            হোয়াটসঅ্যাপ নাম্বার (কান্ট্রি কোড সহ)
          </label>
          <input
            type="text"
            value={content.adminWhatsApp || "8801823902192"}
            onChange={e => setContent({...content, adminWhatsApp: e.target.value})}
            placeholder="8801823902192"
            className="w-full max-w-md border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-black bg-white"
          />
          <p className="text-xs text-gray-400 mt-1">প্লাস (+) চিহ্ন ছাড়াই লিখবেন, যেমন: 8801823902192</p>
        </div>
      </section>

      {/* Hero Section */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold border-b pb-2">Hero Section</h2>
        <div>
          <label className="block text-sm font-bold mb-1">Badge</label>
          <input className="w-full border p-2 rounded" value={content.hero?.badge || ""} onChange={e => setContent({...content, hero: {...content.hero, badge: e.target.value}})} />
        </div>
        <div>
          <label className="block text-sm font-bold mb-1">Title</label>
          <input className="w-full border p-2 rounded" value={content.hero?.title || ""} onChange={e => setContent({...content, hero: {...content.hero, title: e.target.value}})} />
        </div>
        <div>
          <label className="block text-sm font-bold mb-1">Description</label>
          <textarea className="w-full border p-2 rounded" rows={4} value={content.hero?.description || ""} onChange={e => setContent({...content, hero: {...content.hero, description: e.target.value}})} />
        </div>
        <div>
          <label className="block text-sm font-bold mb-1">Hero Image</label>
          <input 
            type="file" 
            accept="image/*"
            className="w-full border p-2 rounded bg-white cursor-pointer"
            onChange={(e) => handleFileChange(e, "hero")}
          />
          <p className="text-xs text-gray-500 mt-1">বর্তমান URL: {content.hero?.imageUrl || "নেই"}</p>
        </div>
      </section>

      {/* Details Section */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold border-b pb-2">Details Section Image</h2>
        <div>
          <label className="block text-sm font-bold mb-1">Details Image</label>
          <input 
            type="file" 
            accept="image/*"
            className="w-full border p-2 rounded bg-white cursor-pointer"
            onChange={(e) => handleFileChange(e, "details")}
          />
          <p className="text-xs text-gray-500 mt-1">বর্তমান URL: {content.details?.imageUrl || "নেই"}</p>
        </div>
      </section>

      {/* Why Us Section */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold border-b pb-2">Why Us Section Image</h2>
        <div>
          <label className="block text-sm font-bold mb-1">Why Us Image</label>
          <input 
            type="file" 
            accept="image/*"
            className="w-full border p-2 rounded bg-white cursor-pointer"
            onChange={(e) => handleFileChange(e, "whyUs")}
          />
          <p className="text-xs text-gray-500 mt-1">বর্তমান URL: {content.whyUs?.imageUrl || "নেই"}</p>
        </div>
      </section>

      {/* Target Audience Section */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold border-b pb-2">Target Audience Section Image</h2>
        <div>
          <label className="block text-sm font-bold mb-1">Target Audience Image</label>
          <input 
            type="file" 
            accept="image/*"
            className="w-full border p-2 rounded bg-white cursor-pointer"
            onChange={(e) => handleFileChange(e, "targetAudience")}
          />
          <p className="text-xs text-gray-500 mt-1">বর্তমান URL: {content.targetAudience?.imageUrl || "নেই"}</p>
        </div>
      </section>

      {/* Pricing */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold border-b pb-2">Pricing & Shipping</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-bold mb-1">Product Price</label>
            <input type="number" className="w-full border p-2 rounded" value={content.pricing?.productPrice || 0} onChange={e => setContent({...content, pricing: {...content.pricing, productPrice: Number(e.target.value)}})} />
          </div>
          <div>
            <label className="block text-sm font-bold mb-1">Shipping Inside Dhaka</label>
            <input type="number" className="w-full border p-2 rounded" value={content.pricing?.shippingInside || 0} onChange={e => setContent({...content, pricing: {...content.pricing, shippingInside: Number(e.target.value)}})} />
          </div>
          <div>
            <label className="block text-sm font-bold mb-1">Shipping Outside Dhaka</label>
            <input type="number" className="w-full border p-2 rounded" value={content.pricing?.shippingOutside || 0} onChange={e => setContent({...content, pricing: {...content.pricing, shippingOutside: Number(e.target.value)}})} />
          </div>
        </div>
      </section>

      {/* Advanced Raw Content (JSON) */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold border-b pb-2">Advanced Raw Content (JSON)</h2>
        <textarea 
          className="w-full border p-2 rounded font-mono text-sm" 
          rows={8} 
          value={JSON.stringify(content, null, 2)} 
          onChange={e => {
            try {
              setContent(JSON.parse(e.target.value))
            } catch (err) {} 
          }} 
        />
      </section>

      <div className="pt-4">
        <button 
          onClick={handleSave} 
          disabled={loading || uploading} 
          className="bg-black text-white px-6 py-3 rounded font-bold disabled:opacity-50 cursor-pointer"
        >
          {loading ? "Saving..." : uploading ? "Uploading image..." : "Save Content"}
        </button>
      </div>
    </div>
  )
}