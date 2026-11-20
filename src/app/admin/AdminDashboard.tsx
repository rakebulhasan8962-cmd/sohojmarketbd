"use client";

import React, { useState, useMemo, useEffect, useRef } from "react";
import * as actions from "../actions";
import OrderListAdmin from "../../components/OrderListAdmin";
import LandingView, {
  SelectedElement,
  CustomBlockItem,
} from "../../components/LandingView";
import { DynamicIcon } from "../../components/DynamicIcon";

interface GalleryPhoto {
  url: string;
  caption?: string;
}

const DEFAULT_PHOTO = "/images/khejur-gur-hero.avif";

const FONT_CHOICES = [
  { label: "Default System", value: "inherit" },
  { label: "Hind Siliguri (বাংলা)", value: "'Hind Siliguri', sans-serif" },
  { label: "Noto Sans Bengali", value: "'Noto Sans Bengali', sans-serif" },
  { label: "Sans Pro", value: "ui-sans-serif, system-ui, sans-serif" },
  { label: "Serif", value: "ui-serif, Georgia, serif" },
  { label: "Mono", value: "ui-monospace, SFMono-Regular, monospace" },
];

const SELECTABLE_TARGETS: SelectedElement[] = [
  {
    id: "hero-title",
    label: "Hero শিরোনাম",
    type: "text",
    contentPath: "hero.title",
    styleKey: "heroTitle",
  },
  {
    id: "hero-desc",
    label: "Hero বিবরণ",
    type: "text",
    contentPath: "hero.description",
    styleKey: "heroDesc",
  },
  {
    id: "hero-tag-0",
    label: "ট্যাগ বক্স #1",
    type: "text",
    contentPath: "hero.tags.0",
    styleKey: "heroTagBox_0",
  },
  {
    id: "hero-tag-1",
    label: "ট্যাগ বক্স #2",
    type: "text",
    contentPath: "hero.tags.1",
    styleKey: "heroTagBox_1",
  },
  {
    id: "hero-tag-2",
    label: "ট্যাগ বক্স #3",
    type: "text",
    contentPath: "hero.tags.2",
    styleKey: "heroTagBox_2",
  },
  {
    id: "btn-order",
    label: "Hero অর্ডার বাটন",
    type: "button",
    styleKey: "btnOrder",
  },
  {
    id: "btn-more",
    label: "আরও জানুন বাটন",
    type: "button",
    styleKey: "btnMore",
  },
  {
    id: "hero-image",
    label: "Hero ছবি",
    type: "image",
    contentPath: "hero.imageUrl",
    styleKey: "heroImage",
  },
  {
    id: "details-img",
    label: "Details ছবি",
    type: "image",
    contentPath: "details.imageUrl",
    styleKey: "detailsImage",
  },
  {
    id: "why-img",
    label: "Why Us ছবি",
    type: "image",
    contentPath: "whyUs.imageUrl",
    styleKey: "whyUsImage",
  },
  {
    id: "tgt-img",
    label: "Target ছবি",
    type: "image",
    contentPath: "targetAudience.imageUrl",
    styleKey: "targetImage",
  },
  {
    id: "feat-card-0",
    label: "ফিচার কার্ড #1",
    type: "box",
    contentPath: "features.0.title",
    styleKey: "featureCard_0",
  },
  {
    id: "feat-card-1",
    label: "ফিচার কার্ড #2",
    type: "box",
    contentPath: "features.1.title",
    styleKey: "featureCard_1",
  },
  {
    id: "feat-card-2",
    label: "ফিচার কার্ড #3",
    type: "box",
    contentPath: "features.2.title",
    styleKey: "featureCard_2",
  },
  {
    id: "feat-card-3",
    label: "ফিচার কার্ড #4",
    type: "box",
    contentPath: "features.3.title",
    styleKey: "featureCard_3",
  },
  {
    id: "details-box-l",
    label: "Details বাম বক্স",
    type: "box",
    styleKey: "detailsBox",
  },
  {
    id: "details-box-r",
    label: "Details ডান বক্স",
    type: "box",
    styleKey: "detailsPointsBox",
  },
  {
    id: "details-order-btn",
    label: "Details অর্ডার বাটন",
    type: "button",
    styleKey: "detailsOrderBtn",
  },
  {
    id: "pkg-box-0",
    label: "প্যাক বক্স #1",
    type: "box",
    contentPath: "packages.0.name",
    styleKey: "packageBox",
  },
  {
    id: "pkg-box-1",
    label: "প্যাক বক্স #2",
    type: "box",
    contentPath: "packages.1.name",
    styleKey: "packageBox",
  },
  {
    id: "faq-box",
    label: "FAQ বক্স",
    type: "box",
    styleKey: "faqBox",
  },
];

export default function AdminDashboard({
  initialOrders = [],
  initialWhatsapp = "",
  defaultValues,
}: {
  initialOrders?: any[];
  initialWhatsapp?: string;
  defaultValues: any;
}) {
  const safeOrders = Array.isArray(initialOrders) ? initialOrders : [];

  const [activeNav, setActiveNav] = useState<
    "orders" | "graph" | "gallery" | "json" | "editor" | "preview"
  >("orders");

  const [isFullScreenWebView, setIsFullScreenWebView] = useState(false);

  const [graphMode, setGraphMode] = useState<"day" | "month">("day");
  const [hoveredBarIndex, setHoveredBarIndex] = useState<number | null>(null);

  const [selectedElement, setSelectedElement] = useState<SelectedElement>(
    SELECTABLE_TARGETS[0]
  );

  const galleryFileInputRef = useRef<HTMLInputElement | null>(null);
  const editorFileInputRef = useRef<HTMLInputElement | null>(null);
  const [editorImagePath, setEditorImagePath] = useState<string>("hero.imageUrl");

  const [formData, setFormData] = useState<any>(() => ({
    ...defaultValues,
    siteName: defaultValues?.siteName || "Sohoj Market",
    whatsappNumber:
      initialWhatsapp ||
      defaultValues?.whatsappNumber ||
      defaultValues?.adminWhatsApp ||
      "",
    adminWhatsApp:
      initialWhatsapp ||
      defaultValues?.adminWhatsApp ||
      defaultValues?.whatsappNumber ||
      "",
    gallery:
      Array.isArray(defaultValues?.gallery) && defaultValues.gallery.length > 0
        ? defaultValues.gallery
        : [
            {
              url: DEFAULT_PHOTO,
              caption: "খাঁটি খেজুরের গুড় — প্রাকৃতিক স্বাদ #1",
            },
            { url: DEFAULT_PHOTO, caption: "হাতে তৈরি ঐতিহ্যবাহী পাটালি #2" },
            { url: DEFAULT_PHOTO, caption: "শীতের সকালের ঘ্রাণ ও শুদ্ধতা #3" },
          ],
    customBlocks: Array.isArray(defaultValues?.customBlocks)
      ? defaultValues.customBlocks
      : [],
    features: Array.isArray(defaultValues?.features)
      ? defaultValues.features
      : [],
    packages: Array.isArray(defaultValues?.packages)
      ? defaultValues.packages
      : [],
    faqs: Array.isArray(defaultValues?.faqs) ? defaultValues.faqs : [],
    details: {
      ...(defaultValues?.details || {}),
      points: Array.isArray(defaultValues?.details?.points)
        ? defaultValues.details.points
        : [],
    },
    whyUs: {
      ...(defaultValues?.whyUs || {}),
      points: Array.isArray(defaultValues?.whyUs?.points)
        ? defaultValues.whyUs.points
        : [],
    },
    targetAudience: {
      ...(defaultValues?.targetAudience || {}),
      points: Array.isArray(defaultValues?.targetAudience?.points)
        ? defaultValues.targetAudience.points
        : [],
    },
    pricing: {
      productName: defaultValues?.pricing?.productName || "খাঁটি খেজুরের গুড়",
      productPrice: defaultValues?.pricing?.productPrice ?? 1250,
      shippingInside: defaultValues?.pricing?.shippingInside ?? 60,
      shippingOutside: defaultValues?.pricing?.shippingOutside ?? 120,
      ...(defaultValues?.pricing || {}),
    },
    theme: {
      heroTitleSize: defaultValues?.theme?.heroTitleSize ?? 48,
      heroDescSize: defaultValues?.theme?.heroDescSize ?? 17,
      sectionTitleSize: defaultValues?.theme?.sectionTitleSize ?? 28,
      heroImageHeight: defaultValues?.theme?.heroImageHeight ?? 360,
      imageShadow:
        defaultValues?.theme?.imageShadow ??
        "0 20px 30px -8px rgba(115, 56, 94, 0.22)",
      boxShadow:
        defaultValues?.theme?.boxShadow ??
        "0 12px 26px -8px rgba(30, 27, 36, 0.12)",
      borderRadius: defaultValues?.theme?.borderRadius ?? 16,
      sectionPaddingY: defaultValues?.theme?.sectionPaddingY ?? 48,
      boxPadding: defaultValues?.theme?.boxPadding ?? 24,
      pageBgColor: defaultValues?.theme?.pageBgColor || "#FAF9F5",
      primaryColor: defaultValues?.theme?.primaryColor || "#73385E",
      accentColor: defaultValues?.theme?.accentColor || "#A2AB34",
      boxBgColor: defaultValues?.theme?.boxBgColor || "#FFFFFF",
      textColor: defaultValues?.theme?.textColor || "#1E1B24",
      mutedTextColor: defaultValues?.theme?.mutedTextColor || "#4B4554",
      ...(defaultValues?.theme || {}),
      elements: {
        galleryCard: { size: 180, borderRadius: 14 },
        ...((defaultValues?.theme && defaultValues.theme.elements) || {}),
      },
    },
  }));

  const [history, setHistory] = useState<any[]>([]);

  const [jsonText, setJsonText] = useState<string>(() =>
    JSON.stringify(
      {
        siteName: formData.siteName,
        hero: formData.hero || {},
        features: formData.features || [],
        details: formData.details || {},
        whyUs: formData.whyUs || {},
        targetAudience: formData.targetAudience || {},
        packages: formData.packages || [],
        faqs: formData.faqs || [],
      },
      null,
      2
    )
  );
  const [jsonError, setJsonError] = useState<string | null>(null);

  useEffect(() => {
    setJsonText(
      JSON.stringify(
        {
          siteName: formData.siteName,
          hero: formData.hero || {},
          features: formData.features || [],
          details: formData.details || {},
          whyUs: formData.whyUs || {},
          targetAudience: formData.targetAudience || {},
          packages: formData.packages || [],
          faqs: formData.faqs || [],
        },
        null,
        2
      )
    );
  }, [formData]);

  useEffect(() => {
    if (selectedElement.type === "image" && selectedElement.contentPath) {
      setEditorImagePath(selectedElement.contentPath);
    }
  }, [selectedElement]);

  const commitChange = (updater: (prev: any) => any) => {
    setFormData((prev: any) => {
      setHistory((h) => [...h.slice(-39), prev]);
      return updater(prev);
    });
  };

  const handleUndo = () => {
    setHistory((prevHistory) => {
      if (prevHistory.length === 0) return prevHistory;
      const previousState = prevHistory[prevHistory.length - 1];
      setFormData(previousState);
      setToast("আগের অবস্থায় Undo হয়েছে!");
      setTimeout(() => setToast(null), 1600);
      return prevHistory.slice(0, -1);
    });
  };

  const [newPhotoUrl, setNewPhotoUrl] = useState(DEFAULT_PHOTO);
  const [newPhotoCaption, setNewPhotoCaption] = useState("");
  const [insertAtPosition, setInsertAtPosition] = useState<string>("end");
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const galleryList: GalleryPhoto[] = Array.isArray(formData.gallery)
    ? formData.gallery
    : [];

  const readFileAsDataUrl = (
    file: File,
    onDone: (dataUrl: string) => void
  ) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        onDone(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleGalleryFileChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    readFileAsDataUrl(file, (dataUrl) => {
      setNewPhotoUrl(dataUrl);
      if (!newPhotoCaption.trim()) {
        setNewPhotoCaption(file.name.replace(/\.[^/.]+$/, ""));
      }
      setToast("গ্যালারির ছবি সিলেক্ট হয়েছে! '+ যোগ' চাপুন");
      setTimeout(() => setToast(null), 2000);
    });
    e.target.value = "";
  };

  const handleEditorFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const targetPath =
      selectedElement.type === "image" && selectedElement.contentPath
        ? selectedElement.contentPath
        : editorImagePath;

    readFileAsDataUrl(file, (dataUrl) => {
      handleUpdateContent(targetPath, dataUrl);
      setToast("ছবি আপলোড ও সেট হয়েছে! Save Changes চাপুন");
      setTimeout(() => setToast(null), 2200);
    });
    e.target.value = "";
  };

  const chartPoints = useMemo(() => {
    if (graphMode === "day") {
      const labels = ["Sat", "Sun", "Mon", "Tue", "Wed", "Thu", "Fri"];
      const orders = new Array(7).fill(0);
      const revenue = new Array(7).fill(0);

      safeOrders.forEach((ord, i) => {
        const dt = ord?.createdAt ? new Date(ord.createdAt) : null;
        const idx =
          dt && !Number.isNaN(dt.getTime()) ? (dt.getDay() + 1) % 7 : i % 7;
        orders[idx] += 1;
        revenue[idx] += Number(ord?.total) || 0;
      });

      const maxVal = Math.max(1, ...orders);
      return labels.map((label, idx) => ({
        label,
        orders: orders[idx],
        revenue: revenue[idx],
        ratio: orders[idx] / maxVal,
      }));
    }

    const labels = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];
    const orders = new Array(12).fill(0);
    const revenue = new Array(12).fill(0);

    safeOrders.forEach((ord, i) => {
      const dt = ord?.createdAt ? new Date(ord.createdAt) : null;
      const idx = dt && !Number.isNaN(dt.getTime()) ? dt.getMonth() : i % 12;
      orders[idx] += 1;
      revenue[idx] += Number(ord?.total) || 0;
    });

    const maxVal = Math.max(1, ...orders);
    return labels.map((label, idx) => ({
      label,
      orders: orders[idx],
      revenue: revenue[idx],
      ratio: orders[idx] / maxVal,
    }));
  }, [safeOrders, graphMode]);

  const setByPath = (obj: any, path: string, value: any) => {
    const parts = path.split(".");
    const clone = { ...obj };
    let curr: any = clone;

    for (let i = 0; i < parts.length - 1; i++) {
      const key = parts[i];
      const nextKey = parts[i + 1];
      if (Array.isArray(curr[key])) {
        curr[key] = [...curr[key]];
      } else {
        curr[key] = { ...(curr[key] || {}) };
      }
      if (!isNaN(Number(nextKey)) && !Array.isArray(curr[key])) {
        curr[key] = Object.values(curr[key]);
      }
      curr = curr[key];
    }

    curr[parts[parts.length - 1]] = value;
    return clone;
  };

  const getByPath = (path: string | undefined) => {
    if (!path) return "";
    const val = path.split(".").reduce((acc: any, key: string) => {
      if (acc === null || acc === undefined) return undefined;
      return acc[key];
    }, formData);
    return val ?? "";
  };

  const handleUpdateContent = (path: string, value: any) => {
    commitChange((prev) => setByPath(prev, path, value));
  };

  const handleUpdateStyle = (styleKey: string, field: string, value: any) => {
    commitChange((prev) => ({
      ...prev,
      theme: {
        ...(prev.theme || {}),
        elements: {
          ...((prev.theme && prev.theme.elements) || {}),
          [styleKey]: {
            ...((prev.theme &&
              prev.theme.elements &&
              prev.theme.elements[styleKey]) ||
              {}),
            [field]: value,
          },
        },
      },
    }));
  };

  const handleResizeElement = (
    styleKey: string,
    width?: number,
    height?: number
  ) => {
    commitChange((prev) => {
      const existing =
        (prev.theme && prev.theme.elements && prev.theme.elements[styleKey]) ||
        {};
      return {
        ...prev,
        theme: {
          ...(prev.theme || {}),
          elements: {
            ...((prev.theme && prev.theme.elements) || {}),
            [styleKey]: {
              ...existing,
              ...(width !== undefined ? { width } : {}),
              ...(height !== undefined ? { height } : {}),
            },
          },
        },
      };
    });
  };

  const handleAddCustomBlock = (block: CustomBlockItem) => {
    commitChange((prev) => ({
      ...prev,
      customBlocks: [...(prev.customBlocks || []), block],
    }));
  };

  const handleGalleryChange = (nextGallery: GalleryPhoto[]) => {
    const normalized = nextGallery.map((item, idx) => ({
      url: item.url,
      caption: item.caption ?? `খাঁটি খেজুরের গুড় #${idx + 1}`,
    }));
    commitChange((prev) => ({ ...prev, gallery: normalized }));
  };

  const handleApplyJson = () => {
    try {
      const parsed = JSON.parse(jsonText);
      commitChange((prev) => ({
        ...prev,
        ...parsed,
      }));
      setJsonError(null);
      setToast("JSON থেকে লেখা আপডেট হয়েছে!");
      setTimeout(() => setToast(null), 1800);
    } catch (err: any) {
      setJsonError(`Invalid JSON: ${err?.message || "Syntax error"}`);
    }
  };

  const handleAddGalleryPhoto = () => {
    const url = newPhotoUrl.trim() || DEFAULT_PHOTO;
    const item: GalleryPhoto = {
      url,
      caption:
        newPhotoCaption.trim() || `খাঁটি খেজুরের গুড় #${galleryList.length + 1}`,
    };
    const nextList = [...galleryList];
    if (insertAtPosition === "end") {
      nextList.push(item);
    } else {
      const idx = Math.max(
        0,
        Math.min(nextList.length, Number(insertAtPosition) - 1)
      );
      nextList.splice(idx, 0, item);
    }
    handleGalleryChange(nextList);
    setNewPhotoCaption("");
    setInsertAtPosition("end");
  };

  const handleRemoveGalleryPhoto = (idx: number) => {
    handleGalleryChange(galleryList.filter((_, i) => i !== idx));
  };

  const handleSaveAll = async () => {
    setSaving(true);
    try {
      const payload = {
        ...formData,
        whatsappNumber: formData.whatsappNumber || formData.adminWhatsApp || "",
        adminWhatsApp: formData.adminWhatsApp || formData.whatsappNumber || "",
      };
      const anyActions = actions as any;
      if (typeof anyActions.saveSiteContent === "function") {
        await anyActions.saveSiteContent(payload);
      } else if (typeof anyActions.updateSiteContent === "function") {
        await anyActions.updateSiteContent(payload);
      }
      if (
        typeof anyActions.updateWhatsappNumber === "function" &&
        payload.whatsappNumber
      ) {
        await anyActions.updateWhatsappNumber(payload.whatsappNumber);
      }
      setToast("সব পরিবর্তন সেভ হয়েছে!");
      setTimeout(() => setToast(null), 2200);
    } catch (e: any) {
      setToast(e?.message || "সেভ করতে সমস্যা হয়েছে");
      setTimeout(() => setToast(null), 2600);
    } finally {
      setSaving(false);
    }
  };

  if (activeNav === "preview" && isFullScreenWebView) {
    return (
      <div className="relative min-h-screen w-full overflow-x-hidden">
        {toast && (
          <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[110] bg-emerald-600 text-white text-xs font-bold px-4 py-2 rounded-full shadow-2xl">
            {toast}
          </div>
        )}

        <div className="fixed top-3 right-3 z-[105] flex items-center gap-1.5 bg-slate-900/95 text-white px-3 py-1.5 rounded-full shadow-2xl border border-slate-700">
          <button
            type="button"
            onClick={() => setIsFullScreenWebView(false)}
            className="text-xs font-bold px-3 py-1 rounded-full bg-slate-800 hover:bg-slate-700 cursor-pointer"
          >
            ← Back to Split View
          </button>
          <button
            type="button"
            onClick={handleUndo}
            disabled={history.length === 0}
            className="text-xs font-bold px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 disabled:opacity-35 cursor-pointer"
          >
            Undo ({history.length})
          </button>
          <button
            type="button"
            onClick={handleSaveAll}
            disabled={saving}
            className="text-xs font-extrabold px-4 py-1 rounded-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 cursor-pointer disabled:opacity-60"
          >
            {saving ? "Saving..." : "Save"}
          </button>
        </div>

        <LandingView
          content={{
            ...formData,
            whatsappNumber: formData.whatsappNumber || formData.adminWhatsApp,
          }}
          isPreview={true}
          isEditMode={true}
          selectedElementId={selectedElement?.id || null}
          onSelectElement={(el) => setSelectedElement(el)}
          onUpdateContent={handleUpdateContent}
          onUpdateStyle={handleUpdateStyle}
          onResizeElement={handleResizeElement}
          onAddCustomBlock={handleAddCustomBlock}
          onGalleryChange={handleGalleryChange}
          onUndo={handleUndo}
          canUndo={history.length > 0}
        />
      </div>
    );
  }

  const currentElStyle =
    (formData.theme?.elements &&
      formData.theme.elements[selectedElement.styleKey]) ||
    {};

  const galleryFrameSize = formData.theme?.elements?.galleryCard?.size ?? 180;
  const activeImagePath =
    selectedElement.type === "image" && selectedElement.contentPath
      ? selectedElement.contentPath
      : editorImagePath;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col md:flex-row">
      <input
        ref={galleryFileInputRef}
        type="file"
        accept="image/*"
        onChange={handleGalleryFileChange}
        className="hidden"
      />
      <input
        ref={editorFileInputRef}
        type="file"
        accept="image/*"
        onChange={handleEditorFileChange}
        className="hidden"
      />

      {toast && (
        <div className="fixed top-4 right-4 z-[60] bg-emerald-600 text-white text-xs font-bold px-4 py-2 rounded-xl shadow-xl">
          {toast}
        </div>
      )}

      <aside className="w-full md:w-64 shrink-0 bg-slate-900 border-b md:border-b-0 md:border-r border-slate-800 flex flex-col justify-between">
        <div className="p-4 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3.5">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-cyan-400 flex items-center justify-center font-black text-slate-950 text-xs">
                cP
              </div>
              <div>
                <div className="font-extrabold text-sm text-white leading-tight">
                  {formData.siteName}
                </div>
                <div className="text-[10px] text-slate-400">Admin Panel</div>
              </div>
            </div>
          </div>

          <nav className="flex md:flex-col gap-1.5 overflow-x-auto pb-1 md:pb-0">
            {[
              { id: "orders", label: "Orders", icon: "ShoppingBag" },
              { id: "graph", label: "Order Graph", icon: "TrendingUp" },
              { id: "gallery", label: "Photo Gallery", icon: "Images" },
              { id: "editor", label: "Box, Button & Style", icon: "Sliders" },
              { id: "json", label: "JSON Content", icon: "Code2" },
              { id: "preview", label: "Preview & Edit", icon: "Eye" },
            ].map((item) => {
              const active = activeNav === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveNav(item.id as any)}
                  className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                    active
                      ? "bg-indigo-600 text-white shadow-md"
                      : "text-slate-300 hover:bg-slate-800 hover:text-white"
                  }`}
                >
                  <DynamicIcon name={item.icon} className="w-4 h-4 shrink-0" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        <div className="p-4 border-t border-slate-800 space-y-2">
          <button
            type="button"
            onClick={handleUndo}
            disabled={history.length === 0}
            className="w-full py-2 px-3 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700 disabled:opacity-35 flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <DynamicIcon name="Undo2" className="w-3.5 h-3.5" />
            Undo ({history.length})
          </button>

          <button
            type="button"
            onClick={handleSaveAll}
            disabled={saving}
            className="w-full py-2.5 px-3 rounded-xl text-xs font-extrabold bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow cursor-pointer disabled:opacity-60"
          >
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </aside>

      <main className="flex-1 min-w-0 p-4 md:p-7 space-y-6">
        {activeNav === "orders" && (
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-xl font-extrabold text-white">
                  Customer Orders
                </h1>
                <p className="text-xs text-slate-400">
                  মোট {safeOrders.length}টি অর্ডার তালিকা
                </p>
              </div>
            </div>
            <OrderListAdmin initialOrders={safeOrders} />
          </section>
        )}

        {activeNav === "graph" && (
          <section className="bg-slate-900 border border-slate-800 rounded-2xl p-5 md:p-6 space-y-5 shadow-xl">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-4">
              <div>
                <h1 className="text-xl font-extrabold text-white">
                  Order Analytics Graph (
                  {graphMode === "day" ? "Day-wise" : "Month-wise"})
                </h1>
                <p className="text-xs text-slate-400">
                  বার বা পয়েন্টের ওপর হোভার করে বিস্তারিত অর্ডার ও আয় দেখুন
                </p>
              </div>

              <div className="inline-flex bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
                <button
                  type="button"
                  onClick={() => setGraphMode("day")}
                  className={`px-3.5 py-1.5 rounded-lg font-bold cursor-pointer ${
                    graphMode === "day"
                      ? "bg-indigo-600 text-white"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  Day Wise
                </button>
                <button
                  type="button"
                  onClick={() => setGraphMode("month")}
                  className={`px-3.5 py-1.5 rounded-lg font-bold cursor-pointer ${
                    graphMode === "month"
                      ? "bg-indigo-600 text-white"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  Month Wise
                </button>
              </div>
            </div>

            <div className="bg-slate-950 border border-slate-800 rounded-xl p-4">
              <div className="h-64 w-full relative">
                <svg
                  viewBox="0 0 700 220"
                  className="w-full h-full overflow-visible"
                >
                  <defs>
                    <linearGradient
                      id="orderAreaGrad"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop
                        offset="0%"
                        stopColor="#6366f1"
                        stopOpacity="0.45"
                      />
                      <stop
                        offset="100%"
                        stopColor="#10b981"
                        stopOpacity="0.02"
                      />
                    </linearGradient>
                  </defs>

                  {[0, 0.25, 0.5, 0.75, 1].map((g) => {
                    const y = 180 - g * 145;
                    return (
                      <line
                        key={g}
                        x1="30"
                        y1={y}
                        x2="680"
                        y2={y}
                        stroke="#1e293b"
                        strokeDasharray="4 4"
                      />
                    );
                  })}

                  {chartPoints.length > 0 &&
                    (() => {
                      const stepX =
                        chartPoints.length > 1
                          ? 640 / (chartPoints.length - 1)
                          : 0;
                      const coords = chartPoints.map((p, idx) => {
                        const x = 35 + idx * stepX;
                        const y = 180 - p.ratio * 140;
                        return { x, y, ...p };
                      });

                      const linePath = coords
                        .map((c, i) => `${i === 0 ? "M" : "L"} ${c.x} ${c.y}`)
                        .join(" ");
                      const areaPath = `${linePath} L ${
                        coords[coords.length - 1].x
                      } 180 L ${coords[0].x} 180 Z`;

                      return (
                        <>
                          <path d={areaPath} fill="url(#orderAreaGrad)" />
                          <path
                            d={linePath}
                            fill="none"
                            stroke="#34d399"
                            strokeWidth="3"
                          />

                          {coords.map((c, idx) => {
                            const barW = Math.min(
                              28,
                              Math.max(12, stepX * 0.45)
                            );
                            const barH = Math.max(4, c.ratio * 140);
                            return (
                              <g
                                key={c.label}
                                onMouseEnter={() => setHoveredBarIndex(idx)}
                                onMouseLeave={() => setHoveredBarIndex(null)}
                                className="cursor-pointer"
                              >
                                <rect
                                  x={c.x - barW / 2}
                                  y={180 - barH}
                                  width={barW}
                                  height={barH}
                                  rx="4"
                                  fill={
                                    hoveredBarIndex === idx
                                      ? "#34d399"
                                      : "#6366f1"
                                  }
                                  opacity="0.75"
                                />
                                <circle
                                  cx={c.x}
                                  cy={c.y}
                                  r={hoveredBarIndex === idx ? 6 : 4}
                                  fill="#10b981"
                                  stroke="#0f172a"
                                  strokeWidth="2"
                                />
                                <text
                                  x={c.x}
                                  y="200"
                                  textAnchor="middle"
                                  fill="#94a3b8"
                                  fontSize="11"
                                >
                                  {c.label}
                                </text>
                                <text
                                  x={c.x}
                                  y={180 - barH - 8}
                                  textAnchor="middle"
                                  fill="#e2e8f0"
                                  fontSize="10"
                                  fontWeight="bold"
                                >
                                  {c.orders}
                                </text>
                              </g>
                            );
                          })}
                        </>
                      );
                    })()}
                </svg>
              </div>

              {hoveredBarIndex !== null && chartPoints[hoveredBarIndex] && (
                <div className="mt-3 pt-3 border-t border-slate-800 flex items-center justify-between text-xs">
                  <span className="font-bold text-emerald-300">
                    {chartPoints[hoveredBarIndex].label}
                  </span>
                  <span className="text-slate-300">
                    Orders:{" "}
                    <strong>{chartPoints[hoveredBarIndex].orders}</strong> |
                    Total:{" "}
                    <strong>৳{chartPoints[hoveredBarIndex].revenue}</strong>
                  </span>
                </div>
              )}
            </div>
          </section>
        )}

        {activeNav === "gallery" && (
          <section className="bg-slate-900 border border-slate-800 rounded-2xl p-5 md:p-6 space-y-5 shadow-xl">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-4">
              <div>
                <h1 className="text-xl font-extrabold text-white">
                  Photo Gallery ({galleryList.length}টি ছবি)
                </h1>
                <p className="text-xs text-slate-400">
                  সরাসরি কম্পিউটার/ফোন থেকে ছবি আপলোড করুন বা URL দিয়ে যোগ করুন
                </p>
              </div>

              <div className="bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 w-60">
                <div className="flex justify-between text-[11px] mb-1">
                  <span className="text-slate-300 font-bold">
                    Gallery Frame Size
                  </span>
                  <span className="text-cyan-300 font-mono">
                    {galleryFrameSize}px
                  </span>
                </div>
                <input
                  type="range"
                  min="130"
                  max="360"
                  value={galleryFrameSize}
                  onChange={(e) =>
                    handleUpdateStyle(
                      "galleryCard",
                      "size",
                      Number(e.target.value)
                    )
                  }
                  className="w-full accent-indigo-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 bg-slate-950 p-3.5 rounded-xl border border-slate-800">
              <div className="flex gap-1.5">
                <input
                  type="text"
                  value={newPhotoUrl}
                  onChange={(e) => setNewPhotoUrl(e.target.value)}
                  placeholder="ছবির URL বা আপলোড করুন"
                  className="flex-1 min-w-0 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white"
                />
                <button
                  type="button"
                  onClick={() => galleryFileInputRef.current?.click()}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs px-3 py-2 rounded-lg shrink-0 cursor-pointer flex items-center gap-1"
                >
                  <DynamicIcon name="Upload" className="w-3.5 h-3.5" />
                  <span>Upload</span>
                </button>
              </div>

              <input
                type="text"
                value={newPhotoCaption}
                onChange={(e) => setNewPhotoCaption(e.target.value)}
                placeholder="ক্যাপশন"
                className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white"
              />

              <div className="flex gap-2">
                <select
                  value={insertAtPosition}
                  onChange={(e) => setInsertAtPosition(e.target.value)}
                  className="bg-slate-900 border border-slate-700 rounded-lg px-2 py-2 text-xs text-white"
                >
                  <option value="end">শেষে</option>
                  {galleryList.map((_, idx) => (
                    <option key={idx} value={String(idx + 1)}>
                      #{idx + 1}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={handleAddGalleryPhoto}
                  className="flex-1 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs px-3 py-2 rounded-lg cursor-pointer"
                >
                  + যোগ
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {galleryList.map((photo, idx) => {
                const perPhotoKey = `galleryPhoto_${idx}`;
                const perPhotoSize =
                  formData.theme?.elements?.[perPhotoKey]?.size ?? 120;
                return (
                  <div
                    key={idx}
                    className="bg-slate-950 border border-slate-800 rounded-xl p-3 space-y-2.5"
                  >
                    <div className="h-36 w-full flex items-center justify-center bg-slate-900/70 rounded-lg border border-slate-800 overflow-hidden">
                      <img
                        src={photo.url || DEFAULT_PHOTO}
                        alt={photo.caption || `Gallery ${idx + 1}`}
                        style={{
                          width: `${perPhotoSize}px`,
                          height: `${perPhotoSize}px`,
                        }}
                        className="object-cover rounded-lg border border-white/15 transition-all"
                      />
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-slate-400">
                      <span className="font-bold text-cyan-300">
                        #{idx + 1} ছবি সাইজ: {perPhotoSize}px
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRemoveGalleryPhoto(idx)}
                        className="text-rose-400 hover:text-rose-300 font-bold cursor-pointer"
                      >
                        মুছুন
                      </button>
                    </div>
                    <input
                      type="range"
                      min="64"
                      max="140"
                      value={perPhotoSize}
                      onChange={(e) =>
                        handleUpdateStyle(
                          perPhotoKey,
                          "size",
                          Number(e.target.value)
                        )
                      }
                      className="w-full accent-emerald-400"
                    />
                    <input
                      type="text"
                      value={photo.caption || ""}
                      onChange={(e) => {
                        const next = [...galleryList];
                        next[idx] = { ...next[idx], caption: e.target.value };
                        handleGalleryChange(next);
                      }}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white"
                    />
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {activeNav === "editor" && (
          <section className="bg-slate-900 border border-slate-800 rounded-2xl p-5 md:p-6 space-y-5 shadow-xl">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
              <div>
                <h1 className="text-xl font-extrabold text-white">
                  Box, Button, Text & Style Editor
                </h1>
                <p className="text-xs text-slate-400">
                  যেকোনো বক্স, বাটন, লেখা বা ছবি বেছে নিয়ে এডিট করুন এবং সরাসরি ছবি আপলোড করুন
                </p>
              </div>

              <button
                type="button"
                onClick={() => editorFileInputRef.current?.click()}
                className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs px-4 py-2 rounded-xl flex items-center gap-1.5 shadow cursor-pointer"
              >
                <DynamicIcon name="Upload" className="w-4 h-4" />
                <span>ছবি আপলোড করুন</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  Element বেছে নিন
                </label>
                <select
                  value={selectedElement.id}
                  onChange={(e) => {
                    const found = SELECTABLE_TARGETS.find(
                      (t) => t.id === e.target.value
                    );
                    if (found) setSelectedElement(found);
                  }}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-xs text-white"
                >
                  {SELECTABLE_TARGETS.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </div>

              {selectedElement.contentPath && (
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    {selectedElement.type === "image"
                      ? "ছবির URL / পাথ (বা পাশে Upload চাপুন)"
                      : "লেখা পরিবর্তন করুন"}
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={String(getByPath(selectedElement.contentPath))}
                      onChange={(e) =>
                        handleUpdateContent(
                          selectedElement.contentPath!,
                          e.target.value
                        )
                      }
                      className="flex-1 min-w-0 bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                    />
                    {selectedElement.type === "image" && (
                      <button
                        type="button"
                        onClick={() => editorFileInputRef.current?.click()}
                        className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs px-3 py-2 rounded-xl shrink-0 cursor-pointer flex items-center gap-1"
                      >
                        <DynamicIcon name="Upload" className="w-3.5 h-3.5" />
                        <span>Upload</span>
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="bg-slate-950/90 border border-slate-800 rounded-xl p-4 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs font-bold text-cyan-300">
                  সেকশন অনুযায়ী ছবি আপলোড / পরিবর্তন
                </span>
                <button
                  type="button"
                  onClick={() => editorFileInputRef.current?.click()}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-3.5 py-1.5 rounded-lg flex items-center gap-1.5 cursor-pointer"
                >
                  <DynamicIcon name="Upload" className="w-3.5 h-3.5" />
                  <span>ডিভাইস থেকে ছবি আপলোড</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-center">
                <select
                  value={activeImagePath}
                  onChange={(e) => setEditorImagePath(e.target.value)}
                  className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white"
                >
                  <option value="hero.imageUrl">Hero ছবি</option>
                  <option value="details.imageUrl">Details ছবি</option>
                  <option value="whyUs.imageUrl">Why Us ছবি</option>
                  <option value="targetAudience.imageUrl">Target ছবি</option>
                </select>

                <input
                  type="text"
                  value={String(getByPath(activeImagePath))}
                  onChange={(e) =>
                    handleUpdateContent(activeImagePath, e.target.value)
                  }
                  placeholder="ছবির URL বা Data URL"
                  className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white"
                />

                <div className="h-12 w-full bg-slate-900 border border-slate-800 rounded-lg overflow-hidden flex items-center justify-center">
                  <img
                    src={String(getByPath(activeImagePath)) || DEFAULT_PHOTO}
                    alt="Preview"
                    className="h-full w-full object-cover"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 bg-slate-950/70 p-4 rounded-xl border border-slate-800 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Text Color</label>
                <input
                  type="color"
                  value={currentElStyle.color || "#FFFFFF"}
                  onChange={(e) =>
                    handleUpdateStyle(
                      selectedElement.styleKey,
                      "color",
                      e.target.value
                    )
                  }
                  className="w-full h-8 rounded bg-slate-900 border border-slate-700 cursor-pointer"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">BG Color</label>
                <input
                  type="color"
                  value={currentElStyle.backgroundColor || "#73385E"}
                  onChange={(e) =>
                    handleUpdateStyle(
                      selectedElement.styleKey,
                      "backgroundColor",
                      e.target.value
                    )
                  }
                  className="w-full h-8 rounded bg-slate-900 border border-slate-700 cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-slate-400">Width</span>
                  <span>{currentElStyle.width || "Auto"}</span>
                </div>
                <input
                  type="range"
                  min="100"
                  max="900"
                  value={currentElStyle.width || 300}
                  onChange={(e) =>
                    handleUpdateStyle(
                      selectedElement.styleKey,
                      "width",
                      Number(e.target.value)
                    )
                  }
                  className="w-full accent-indigo-500"
                />
              </div>

              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-slate-400">Height</span>
                  <span>{currentElStyle.height || "Auto"}</span>
                </div>
                <input
                  type="range"
                  min="40"
                  max="600"
                  value={currentElStyle.height || 140}
                  onChange={(e) =>
                    handleUpdateStyle(
                      selectedElement.styleKey,
                      "height",
                      Number(e.target.value)
                    )
                  }
                  className="w-full accent-indigo-500"
                />
              </div>

              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-slate-400">Font Size</span>
                  <span>{currentElStyle.fontSize || 18}px</span>
                </div>
                <input
                  type="range"
                  min="12"
                  max="72"
                  value={currentElStyle.fontSize || 18}
                  onChange={(e) =>
                    handleUpdateStyle(
                      selectedElement.styleKey,
                      "fontSize",
                      Number(e.target.value)
                    )
                  }
                  className="w-full accent-emerald-400"
                />
              </div>

              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-slate-400">Padding</span>
                  <span>{currentElStyle.padding ?? 20}px</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="60"
                  value={currentElStyle.padding ?? 20}
                  onChange={(e) =>
                    handleUpdateStyle(
                      selectedElement.styleKey,
                      "padding",
                      Number(e.target.value)
                    )
                  }
                  className="w-full accent-emerald-400"
                />
              </div>

              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-slate-400">Radius</span>
                  <span>{currentElStyle.borderRadius ?? 14}px</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="48"
                  value={currentElStyle.borderRadius ?? 14}
                  onChange={(e) =>
                    handleUpdateStyle(
                      selectedElement.styleKey,
                      "borderRadius",
                      Number(e.target.value)
                    )
                  }
                  className="w-full accent-emerald-400"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Font</label>
                <select
                  value={currentElStyle.fontFamily || "inherit"}
                  onChange={(e) =>
                    handleUpdateStyle(
                      selectedElement.styleKey,
                      "fontFamily",
                      e.target.value
                    )
                  }
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-white"
                >
                  {FONT_CHOICES.map((f) => (
                    <option key={f.value} value={f.value}>
                      {f.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </section>
        )}

        {activeNav === "json" && (
          <section className="bg-slate-900 border border-slate-800 rounded-2xl p-5 md:p-6 space-y-4 shadow-xl">
            <div>
              <h1 className="text-xl font-extrabold text-white">
                Webpage JSON Editor
              </h1>
              <p className="text-xs text-slate-400">
                JSON পরিবর্তন করে Apply JSON চাপলে ওয়েবপেজের লেখা আপডেট হবে
              </p>
            </div>
            <textarea
              rows={14}
              value={jsonText}
              onChange={(e) => setJsonText(e.target.value)}
              spellCheck={false}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3.5 text-xs font-mono text-emerald-300"
            />
            {jsonError && (
              <div className="text-xs text-rose-400 font-bold">{jsonError}</div>
            )}
            <button
              type="button"
              onClick={handleApplyJson}
              className="px-5 py-2.5 rounded-xl text-xs font-extrabold bg-indigo-600 hover:bg-indigo-500 text-white cursor-pointer"
            >
              Apply JSON
            </button>
          </section>
        )}

        {activeNav === "preview" && (
          <section className="space-y-4">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h1 className="text-lg font-extrabold text-white">
                  Preview & Edit Workspace
                </h1>
                <p className="text-xs text-slate-400">
                  এখানে লাইভ পেজ ও টুলসহ দেখা যাচ্ছে—পুরো স্ক্রিনে দেখতে পাশে Full Screen View চাপুন
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => editorFileInputRef.current?.click()}
                  className="px-3.5 py-2 rounded-xl text-xs font-extrabold bg-indigo-600 hover:bg-indigo-500 text-white shadow cursor-pointer flex items-center gap-1.5"
                >
                  <DynamicIcon name="Upload" className="w-3.5 h-3.5" />
                  <span>ছবি আপলোড</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsFullScreenWebView(true)}
                  className="px-4 py-2 rounded-xl text-xs font-extrabold bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow cursor-pointer"
                >
                  Full Screen View ↗
                </button>
              </div>
            </div>

            <div className="rounded-2xl overflow-hidden border border-slate-800 shadow-2xl">
              <LandingView
                content={{
                  ...formData,
                  whatsappNumber:
                    formData.whatsappNumber || formData.adminWhatsApp,
                }}
                isPreview={true}
                isEditMode={true}
                selectedElementId={selectedElement?.id || null}
                onSelectElement={(el) => setSelectedElement(el)}
                onUpdateContent={handleUpdateContent}
                onUpdateStyle={handleUpdateStyle}
                onResizeElement={handleResizeElement}
                onAddCustomBlock={handleAddCustomBlock}
                onGalleryChange={handleGalleryChange}
                onUndo={handleUndo}
                canUndo={history.length > 0}
              />
            </div>
          </section>
        )}
      </main>
    </div>
  );
}