"use client";

import React, { useRef, useState } from "react";
import { DynamicIcon } from "./DynamicIcon";

export default function ImageUploadButton({
  onImageSelected,
  label = "ছবি আপলোড",
  className = "",
}: {
  onImageSelected: (urlOrDataUrl: string) => void;
  label?: string;
  className?: string;
}) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [uploading, setUploading] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        onImageSelected(reader.result);
      }
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    };
    reader.onerror = () => {
      setUploading(false);
    };
    reader.readAsDataURL(file);
  };

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />
      <button
        type="button"
        disabled={uploading}
        onClick={() => fileInputRef.current?.click()}
        className={`inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition cursor-pointer disabled:opacity-50 ${className}`}
      >
        <DynamicIcon name="Upload" className="w-3.5 h-3.5 shrink-0" />
        <span>{uploading ? "লোড হচ্ছে..." : label}</span>
      </button>
    </>
  );
}