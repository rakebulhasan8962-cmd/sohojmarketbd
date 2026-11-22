"use client";

import React, { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
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

const DEFAULT_PHOTO =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="500" viewBox="0 0 800 500"><rect width="800" height="500" fill="#1e293b"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="#94a3b8" font-family="sans-serif" font-size="24">Upload Image</text></svg>`
  );
const DEFAULT_WHATSAPP = "01639193531";
const LOCAL_BACKUP_KEY = "sohoj_admin_dashboard_backup_v1";

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
    id: "gallery-heading",
    label: "গ্যালারির ওপরের শিরোনাম",
    type: "text",
    contentPath: "galleryTitle",
    styleKey: "galleryTitle",
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
    styleKey: "packageBox_0",
  },
  {
    id: "pkg-box-1",
    label: "প্যাক বক্স #2",
    type: "box",
    contentPath: "packages.1.name",
    styleKey: "packageBox_1",
  },
  {
    id: "faq-box",
    label: "FAQ বক্স",
    type: "box",
    styleKey: "faqBox",
  },
];

function buildInitialFormData(defaultValues: any, initialWhatsapp: string) {
  let localBackup: any = null;
  if (typeof window !== "undefined") {
    try {
      const raw = window.localStorage.getItem(LOCAL_BACKUP_KEY);
      if (raw) {
        localBackup = JSON.parse(raw);
      }
    } catch {
      localBackup = null;
    }
  }

  const hasServerDefaults =
    defaultValues &&
    typeof defaultValues === "object" &&
    Object.keys(defaultValues).length > 0;
  const base = hasServerDefaults ? defaultValues : localBackup || {};

  const resolvedPhone =
    (typeof initialWhatsapp === "string" && initialWhatsapp.trim()) ||
    base?.whatsappNumber ||
    base?.adminWhatsApp ||
    DEFAULT_WHATSAPP;

  return {
    ...base,
    siteName: base?.siteName || "Sohoj Market",
    galleryTitle: base?.galleryTitle || "আমাদের পণ্যের গ্যালারি",
    whatsappNumber: resolvedPhone,
    adminWhatsApp: resolvedPhone,
    gallery:
      Array.isArray(base?.gallery) && base.gallery.length > 0
        ? base.gallery
        : [
            {
              url: DEFAULT_PHOTO,
              caption: "খাঁটি খেজুরের গুড় — প্রাকৃতিক স্বাদ #1",
            },
            { url: DEFAULT_PHOTO, caption: "হাতে তৈরি ঐতিহ্যবাহী পাটালি #2" },
            { url: DEFAULT_PHOTO, caption: "শীতের সকালের ঘ্রাণ ও শুদ্ধতা #3" },
          ],
    customBlocks: Array.isArray(base?.customBlocks) ? base.customBlocks : [],
    courierDispatches: Array.isArray(base?.courierDispatches)
      ? base.courierDispatches
      : [],
    features: Array.isArray(base?.features) ? base.features : [],
    packages: Array.isArray(base?.packages) ? base.packages : [],
    faqs: Array.isArray(base?.faqs) ? base.faqs : [],
    details: {
      ...(base?.details || {}),
      points: Array.isArray(base?.details?.points) ? base.details.points : [],
    },
    whyUs: {
      ...(base?.whyUs || {}),
      points: Array.isArray(base?.whyUs?.points) ? base.whyUs.points : [],
    },
    targetAudience: {
      ...(base?.targetAudience || {}),
      points: Array.isArray(base?.targetAudience?.points)
        ? base.targetAudience.points
        : [],
    },
    pricing: {
      productName: base?.pricing?.productName || "খাঁটি খেজুরের গুড়",
      productPrice: base?.pricing?.productPrice ?? 1250,
      shippingInside: base?.pricing?.shippingInside ?? 60,
      shippingOutside: base?.pricing?.shippingOutside ?? 120,
      discountEnabled: base?.pricing?.discountEnabled ?? false,
      discountType: base?.pricing?.discountType || "flat",
      discountValue: base?.pricing?.discountValue ?? 0,
      discountLabel: base?.pricing?.discountLabel || "বিশেষ ছাড়",
      paymentMethods:
        Array.isArray(base?.pricing?.paymentMethods) &&
        base.pricing.paymentMethods.length > 0
          ? base.pricing.paymentMethods
          : [
              "Pay with cash upon delivery",
              "bKash",
              "Nagad",
              "Card Payment",
            ],
      ...(base?.pricing || {}),
    },
    theme: {
      heroTitleSize: base?.theme?.heroTitleSize ?? 48,
      heroDescSize: base?.theme?.heroDescSize ?? 17,
      sectionTitleSize: base?.theme?.sectionTitleSize ?? 28,
      heroImageHeight: base?.theme?.heroImageHeight ?? 360,
      imageShadow:
        base?.theme?.imageShadow ??
        "0 20px 30px -8px rgba(115, 56, 94, 0.22)",
      boxShadow:
        base?.theme?.boxShadow ??
        "0 12px 26px -8px rgba(30, 27, 36, 0.12)",
      borderRadius: base?.theme?.borderRadius ?? 16,
      sectionPaddingY: base?.theme?.sectionPaddingY ?? 48,
      boxPadding: base?.theme?.boxPadding ?? 24,
      pageBgColor: base?.theme?.pageBgColor || "#FAF9F5",
      primaryColor: base?.theme?.primaryColor || "#73385E",
      accentColor: base?.theme?.accentColor || "#A2AB34",
      boxBgColor: base?.theme?.boxBgColor || "#FFFFFF",
      textColor: base?.theme?.textColor || "#1E1B24",
      mutedTextColor: base?.theme?.mutedTextColor || "#4B4554",
      ...(base?.theme || {}),
      elements: {
        galleryCard: { size: 180, borderRadius: 14 },
        ...((base?.theme && base.theme.elements) || {}),
      },
    },
  };
}

async function compressImageToSafeDataUrl(
  file: File,
  maxSide = 900,
  quality = 0.72
): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const src = typeof reader.result === "string" ? reader.result : "";
      if (!src) {
        resolve(DEFAULT_PHOTO);
        return;
      }
      const img = new window.Image();
      img.onload = () => {
        let { width, height } = img;
        if (width > maxSide || height > maxSide) {
          if (width >= height) {
            height = Math.round((height * maxSide) / width);
            width = maxSide;
          } else {
            width = Math.round((width * maxSide) / height);
            height = maxSide;
          }
        }
        const canvas = document.createElement("canvas");
        canvas.width = Math.max(1, width);
        canvas.height = Math.max(1, height);
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve(src);
          return;
        }
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/jpeg", quality));
      };
      img.onerror = () => resolve(src);
      img.src = src;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function AdminDashboard({
  initialOrders = [],
  initialWhatsapp = "",
  defaultValues,
}: {
  initialOrders?: any[];
  initialWhatsapp?: string;
  defaultValues?: any;
}) {
  const router = useRouter();
  const safeOrders = Array.isArray(initialOrders) ? initialOrders : [];

  const [activeNav, setActiveNav] = useState<
    "orders" | "courier" | "graph" | "gallery" | "json" | "editor" | "preview"
  >("orders");

  const [isFullScreenWebView, setIsFullScreenWebView] = useState(false);

  const [graphMode, setGraphMode] = useState<"day" | "month">("day");
  const [hoveredBarIndex, setHoveredBarIndex] = useState<number | null>(null);

  const [selectedElement, setSelectedElement] = useState<SelectedElement>(
    SELECTABLE_TARGETS[0]
  );

  const [selectedCourierProvider, setSelectedCourierProvider] = useState<
    "Steadfast" | "Pathao" | "RedX"
  >("Steadfast");
  const [selectedOrderId, setSelectedOrderId] = useState<string>(
    safeOrders[0]?.id ? String(safeOrders[0].id) : ""
  );
  const [courierNote, setCourierNote] = useState<string>(
    "সাবধানে ডেলিভারি করবেন (ভঙ্গুর/খাদ্যপণ্য)"
  );

  const galleryFileInputRef = useRef<HTMLInputElement | null>(null);
  const editorFileInputRef = useRef<HTMLInputElement | null>(null);
  const [editorImagePath, setEditorImagePath] = useState<string>("hero.imageUrl");

  const [formData, setFormData] = useState<any>(() =>
    buildInitialFormData(defaultValues, initialWhatsapp)
  );

  const [history, setHistory] = useState<any[]>([]);
  const [redoStack, setRedoStack] = useState<any[]>([]);

  const [jsonText, setJsonText] = useState<string>(() =>
    JSON.stringify(
      {
        siteName: formData.siteName,
        galleryTitle: formData.galleryTitle,
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
          galleryTitle: formData.galleryTitle,
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

  const [newPhotoUrl, setNewPhotoUrl] = useState(DEFAULT_PHOTO);
  const [newPhotoCaption, setNewPhotoCaption] = useState("");
  const [insertAtPosition, setInsertAtPosition] = useState<string>("end");
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const showToast = useCallback((msg: string, duration = 2400) => {
    setToast(msg);
    setTimeout(() => {
      setToast((prev) => (prev === msg ? null : prev));
    }, duration);
  }, []);

  const commitChange = useCallback((updater: (prev: any) => any) => {
    setFormData((prev: any) => {
      const next = updater(prev);
      if (next !== prev) {
        setHistory((h: any[]) => [...h.slice(-39), prev]);
        setRedoStack([]);
      }
      return next;
    });
  }, []);

  const handleUndo = useCallback(() => {
    setHistory((prevHistory: any[]) => {
      if (prevHistory.length === 0) return prevHistory;
      const previousState = prevHistory[prevHistory.length - 1];
      setFormData((current: any) => {
        setRedoStack((r: any[]) => [...r.slice(-39), current]);
        return previousState;
      });
      showToast("আগের অবস্থায় Undo হয়েছে!", 1600);
      return prevHistory.slice(0, -1);
    });
  }, [showToast]);

  const handleRedo = useCallback(() => {
    setRedoStack((prevRedo: any[]) => {
      if (prevRedo.length === 0) return prevRedo;
      const nextState = prevRedo[prevRedo.length - 1];
      setFormData((current: any) => {
        setHistory((h: any[]) => [...h.slice(-39), current]);
        return nextState;
      });
      showToast("Redo হয়েছে!", 1600);
      return prevRedo.slice(0, -1);
    });
  }, [showToast]);

  const latestFormDataRef = useRef(formData);
  useEffect(() => {
    latestFormDataRef.current = formData;
  }, [formData]);

  const handleSaveAll = useCallback(async () => {
    if (saving) return;
    setSaving(true);

    const currentData = latestFormDataRef.current;
    const phone = (
      currentData?.whatsappNumber ||
      currentData?.adminWhatsApp ||
      DEFAULT_WHATSAPP
    ).trim();

    const payload = {
      ...currentData,
      whatsappNumber: phone,
      adminWhatsApp: phone,
    };

    try {
      if (typeof window !== "undefined") {
        try {
          window.localStorage.setItem(LOCAL_BACKUP_KEY, JSON.stringify(payload));
        } catch {
          // ignore localStorage quota error
        }
      }

      const mod = actions as Record<string, any>;
      const candidateNames = [
        "updateContentAction",
        "saveSiteContent",
        "updateSiteContent",
        "saveContentAction",
        "saveContent",
        "updateContent",
        "saveLandingContent",
        "updateLandingContent",
      ];

      let saveFn: ((data: any) => Promise<any>) | null = null;
      for (const name of candidateNames) {
        if (mod && typeof mod[name] === "function") {
          saveFn = mod[name];
          break;
        }
      }

      if (!saveFn && mod && typeof mod === "object") {
        for (const [k, v] of Object.entries(mod)) {
          if (typeof v === "function" && !/whatsapp|order/i.test(k)) {
            saveFn = v;
            break;
          }
        }
      }

      let savedOnServer = false;
      let serverError = "";

      if (typeof saveFn === "function") {
        const res = await saveFn(payload);
        if (res && typeof res === "object" && res.success === false) {
          serverError =
            res.error || res.message || "ডাটাবেজে সেভ করতে সমস্যা হয়েছে!";
        } else {
          savedOnServer = true;
        }
      }

      if (!savedOnServer) {
        try {
          const apiRes = await fetch("/api/content", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });
          if (apiRes.ok) {
            const apiData = await apiRes.json().catch(() => ({}));
            if (apiData?.success !== false) {
              savedOnServer = true;
              serverError = "";
            }
          }
        } catch {
          // ignore if /api/content is not present
        }
      }

      router.refresh();

      if (savedOnServer) {
        const okMsg = "সব পরিবর্তন সফলভাবে সেভ হয়েছে!";
        showToast(okMsg, 2200);
        if (typeof window !== "undefined") window.alert(okMsg);
      } else {
        const msg = serverError
          ? `${serverError} (লোকাল ব্রাউজারে সেভ রাখা হয়েছে)`
          : "লোকাল ব্রাউজারে সেভ হয়েছে। সার্ভার সেভের জন্য actions.ts বা /api/content চেক করুন।";
        showToast(msg, 3000);
        if (typeof window !== "undefined") window.alert(msg);
      }
    } catch (e: any) {
      const failMsg = `সেভ করতে সমস্যা হয়েছে: ${e?.message || "Server error"}`;
      showToast(failMsg, 3200);
      if (typeof window !== "undefined") window.alert(failMsg);
    } finally {
      setSaving(false);
    }
  }, [saving, showToast, router]);

  const handleSaveAllRef = useRef(handleSaveAll);
  useEffect(() => {
    handleSaveAllRef.current = handleSaveAll;
  }, [handleSaveAll]);

  const handleUndoRef = useRef(handleUndo);
  useEffect(() => {
    handleUndoRef.current = handleUndo;
  }, [handleUndo]);

  const handleRedoRef = useRef(handleRedo);
  useEffect(() => {
    handleRedoRef.current = handleRedo;
  }, [handleRedo]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const isMod = e.ctrlKey || e.metaKey;
      if (!isMod) return;

      const key = e.key.toLowerCase();
      const target = e.target as HTMLElement | null;
      const isEditable =
        target?.tagName === "INPUT" ||
        target?.tagName === "TEXTAREA" ||
        target?.isContentEditable;

      if (key === "s") {
        e.preventDefault();
        void handleSaveAllRef.current();
      } else if (key === "z" && !e.shiftKey) {
        if (!isEditable && history.length > 0) {
          e.preventDefault();
          handleUndoRef.current();
        }
      } else if ((key === "y" && !e.shiftKey) || (key === "z" && e.shiftKey)) {
        if (!isEditable && redoStack.length > 0) {
          e.preventDefault();
          handleRedoRef.current();
        }
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [history.length, redoStack.length]);

  const galleryList: GalleryPhoto[] = Array.isArray(formData.gallery)
    ? formData.gallery
    : [];

  const courierDispatches: any[] = Array.isArray(formData.courierDispatches)
    ? formData.courierDispatches
    : [];

  const handleSendToCourier = () => {
    const targetOrder =
      safeOrders.find((o) => String(o?.id) === String(selectedOrderId)) ||
      safeOrders[0];

    const trackingCode = `${selectedCourierProvider.slice(
      0,
      2
    ).toUpperCase()}-${Math.floor(100000 + Math.random() * 900000)}`;

    const entry = {
      id: `cour_${Date.now()}`,
      orderId: targetOrder?.id || "MANUAL",
      customerName: targetOrder?.customerName || targetOrder?.name || "গ্রাহক",
      phone: targetOrder?.phone || DEFAULT_WHATSAPP,
      address: targetOrder?.address || "ঠিকানা নির্ধারিত নয়",
      total: targetOrder?.total ?? 0,
      courier: selectedCourierProvider,
      trackingCode,
      note: courierNote,
      status: "Booked / Ready to Dispatch",
      createdAt: new Date().toLocaleString("bn-BD"),
    };

    commitChange((prev) => ({
      ...prev,
      courierDispatches: [entry, ...(prev.courierDispatches || [])],
    }));
    showToast(`${selectedCourierProvider}-এ পাঠানোর জন্য বুক করা হয়েছে!`, 2400);
  };

  const handleUpdateCourierStatus = (id: string, status: string) => {
    commitChange((prev) => ({
      ...prev,
      courierDispatches: (prev.courierDispatches || []).map((c: any) =>
        c.id === id ? { ...c, status } : c
      ),
    }));
  };

  const handleGalleryFileChange = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const dataUrl = await compressImageToSafeDataUrl(file);
      setNewPhotoUrl(dataUrl);
      if (!newPhotoCaption.trim()) {
        setNewPhotoCaption(file.name.replace(/\.[^/.]+$/, ""));
      }
      showToast("গ্যালারির ছবি সিলেক্ট হয়েছে! '+ যোগ' চাপুন", 2000);
    } catch {
      showToast("ছবি প্রসেস করতে সমস্যা হয়েছে। অন্য ছবি চেষ্টা করুন।", 2500);
    } finally {
      e.target.value = "";
    }
  };

  const handleEditorFileChange = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const targetPath =
        selectedElement.type === "image" && selectedElement.contentPath
          ? selectedElement.contentPath
          : editorImagePath;

      const dataUrl = await compressImageToSafeDataUrl(file);
      handleUpdateContent(targetPath, dataUrl);
      showToast("ছবি আপলোড ও সেট হয়েছে! Save চাপুন", 2200);
    } catch {
      showToast("ছবি আপলোড করতে সমস্যা হয়েছে। অন্য ছবি চেষ্টা করুন।", 2500);
    } finally {
      e.target.value = "";
    }
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
    commitChange((prev) => {
      const currentElements = {
        ...((prev.theme && prev.theme.elements) || {}),
      };

      if (field === "__resetAll") {
        delete currentElements[styleKey];
      } else {
        currentElements[styleKey] = {
          ...(currentElements[styleKey] || {}),
          [field]: value,
        };
      }

      return {
        ...prev,
        theme: {
          ...(prev.theme || {}),
          elements: currentElements,
        },
      };
    });
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

  const handleUpdateCustomBlock = (
    id: string,
    patch: Partial<CustomBlockItem>
  ) => {
    commitChange((prev) => ({
      ...prev,
      customBlocks: (prev.customBlocks || []).map((b: CustomBlockItem) =>
        b.id === id ? { ...b, ...patch } : b
      ),
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
      if (!parsed || typeof parsed !== "object") {
        setJsonError("JSON অবশ্যই একটি অবজেক্ট হতে হবে।");
        return;
      }
      commitChange((prev) => ({
        ...prev,
        ...parsed,
        theme: parsed.theme
          ? {
              ...(prev.theme || {}),
              ...parsed.theme,
              elements: {
                ...((prev.theme && prev.theme.elements) || {}),
                ...(parsed.theme.elements || {}),
              },
            }
          : prev.theme,
      }));
      setJsonError(null);
      showToast("JSON থেকে লেখা আপডেট হয়েছে!", 1800);
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
            onClick={handleRedo}
            disabled={redoStack.length === 0}
            className="text-xs font-bold px-3 py-1 rounded-full bg-cyan-500/20 text-cyan-300 disabled:opacity-35 cursor-pointer"
          >
            Redo ({redoStack.length})
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
          onUpdateCustomBlock={handleUpdateCustomBlock}
          onGalleryChange={handleGalleryChange}
          onSave={handleSaveAll}
          saving={saving}
          onUndo={handleUndo}
          onRedo={handleRedo}
          canUndo={history.length > 0}
          canRedo={redoStack.length > 0}
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
              { id: "courier", label: "Courier", icon: "Truck" },
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
          <div className="grid grid-cols-2 gap-1.5">
            <button
              type="button"
              onClick={handleUndo}
              disabled={history.length === 0}
              className="w-full py-2 px-2 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700 disabled:opacity-35 flex items-center justify-center gap-1 cursor-pointer"
            >
              <DynamicIcon name="Undo2" className="w-3.5 h-3.5" />
              Undo ({history.length})
            </button>
            <button
              type="button"
              onClick={handleRedo}
              disabled={redoStack.length === 0}
              className="w-full py-2 px-2 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700 disabled:opacity-35 flex items-center justify-center gap-1 cursor-pointer"
            >
              <DynamicIcon name="Redo2" className="w-3.5 h-3.5" />
              Redo ({redoStack.length})
            </button>
          </div>

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

        {activeNav === "courier" && (
          <section className="bg-slate-900 border border-slate-800 rounded-2xl p-5 md:p-6 space-y-5 shadow-xl">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-4">
              <div>
                <h1 className="text-xl font-extrabold text-white">
                  Courier Management
                </h1>
                <p className="text-xs text-slate-400">
                  অর্ডার সিলেক্ট করে সরাসরি কুরিয়ারে পাঠানোর বুকিং ও ট্র্যাকিং
                  ম্যানেজ করুন
                </p>
              </div>

              <div className="inline-flex bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
                {(["Steadfast", "Pathao", "RedX"] as const).map((prov) => (
                  <button
                    key={prov}
                    type="button"
                    onClick={() => setSelectedCourierProvider(prov)}
                    className={`px-3.5 py-1.5 rounded-lg font-bold cursor-pointer ${
                      selectedCourierProvider === prov
                        ? "bg-indigo-600 text-white"
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    {prov}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 bg-slate-950 p-4 rounded-xl border border-slate-800 text-xs">
              <div>
                <label className="block text-slate-400 mb-1 font-bold">
                  অর্ডার বেছে নিন
                </label>
                <select
                  value={selectedOrderId}
                  onChange={(e) => setSelectedOrderId(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white"
                >
                  {safeOrders.length > 0 ? (
                    safeOrders.map((ord, i) => {
                      const oid = String(ord?.id ?? i + 1);
                      return (
                        <option key={oid} value={oid}>
                          #{oid} — {ord?.customerName || ord?.name || "গ্রাহক"}{" "}
                          (৳{ord?.total ?? 0})
                        </option>
                      );
                    })
                  ) : (
                    <option value="DEMO-1">নতুন ম্যানুয়াল পার্সেল বুকিং</option>
                  )}
                </select>
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-bold">
                  ডেলিভারি নোট
                </label>
                <input
                  type="text"
                  value={courierNote}
                  onChange={(e) => setCourierNote(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white"
                />
              </div>

              <div className="flex items-end">
                <button
                  type="button"
                  onClick={handleSendToCourier}
                  className="w-full py-2 px-4 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold cursor-pointer"
                >
                  + {selectedCourierProvider}-এ পাঠান
                </button>
              </div>
            </div>

            <div className="space-y-2.5">
              <div className="text-xs font-bold text-slate-300">
                কুরিয়ার ডিসপ্যাচ তালিকা ({courierDispatches.length}টি)
              </div>
              {courierDispatches.length === 0 ? (
                <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 text-xs text-slate-400">
                  এখনো কোনো কুরিয়ার বুকিং যুক্ত করা হয়নি। ওপরে কুরিয়ার ও অর্ডার
                  বেছে নিয়ে পাঠান।
                </div>
              ) : (
                <div className="space-y-2">
                  {courierDispatches.map((item: any) => (
                    <div
                      key={item.id}
                      className="bg-slate-950 border border-slate-800 rounded-xl p-3.5 flex flex-wrap items-center justify-between gap-3 text-xs"
                    >
                      <div className="space-y-0.5">
                        <div className="font-extrabold text-white">
                          {item.courier} •{" "}
                          <span className="text-cyan-300 font-mono">
                            {item.trackingCode}
                          </span>
                        </div>
                        <div className="text-slate-300">
                          {item.customerName} ({item.phone}) — ৳{item.total}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          {item.address} | {item.note}
                        </div>
                      </div>

                      <select
                        value={item.status}
                        onChange={(e) =>
                          handleUpdateCourierStatus(item.id, e.target.value)
                        }
                        className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-emerald-300 font-bold"
                      >
                        <option value="Booked / Ready to Dispatch">
                          Booked / Ready to Dispatch
                        </option>
                        <option value="Picked by Courier">Picked by Courier</option>
                        <option value="In Transit">In Transit</option>
                        <option value="Delivered">Delivered</option>
                      </select>
                    </div>
                  ))}
                </div>
              )}
            </div>
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
                  সরাসরি কম্পিউটার/ফোন থেকে ছবি আপলোড করুন বা URL দিয়ে যোগ করুন
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
                  যেকোনো বক্স, বাটন, লেখা বা ছবি বেছে নিয়ে এডিট করুন এবং সরাসরি
                  ছবি আপলোড করুন
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
                  সেকশন অনুযায়ী ছবি আপলোড / পরিবর্তন
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
                  এখানে লাইভ পেজ ও টুলসহ দেখা যাচ্ছে—পুরো স্ক্রিনে দেখতে পাশে Full
                  Screen View চাপুন
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
                onUpdateCustomBlock={handleUpdateCustomBlock}
                onGalleryChange={handleGalleryChange}
                onUndo={handleUndo}
                onRedo={handleRedo}
                canUndo={history.length > 0}
                canRedo={redoStack.length > 0}
              />
            </div>
          </section>
        )}
      </main>
    </div>
  );
}