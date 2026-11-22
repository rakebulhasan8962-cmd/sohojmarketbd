"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { DynamicIcon } from "./DynamicIcon";
import CheckoutForm from "./CheckoutForm";
import FAQSection from "./FAQSection";
import Image from "next/image";

export interface SelectedElement {
  id: string;
  label: string;
  type: "text" | "image" | "box" | "gallery" | "button" | "customBlock";
  contentPath?: string;
  styleKey: string;
  customId?: string;
}

export interface CustomBlockItem {
  id: string;
  mode?: "flatText" | "photoBox" | "textBox";
  title: string;
  description: string;
  imageUrl?: string;
  position: "afterHero" | "afterGallery" | "beforeFooter";
  bgColor?: string;
  textColor?: string;
  width?: number;
  height?: number;
  borderRadius?: number;
  padding?: number;
  shadow?: string;
}

interface GalleryItem {
  url: string;
  caption?: string;
}

const DEFAULT_PHOTO =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="500" viewBox="0 0 800 500"><rect width="800" height="500" fill="#1e293b"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="#94a3b8" font-family="sans-serif" font-size="24">Upload Image</text></svg>`
  );
const DEFAULT_WHATSAPP = "01639193531";

const FONT_CHOICES = [
  { label: "Default", value: "inherit" },
  { label: "Arial", value: "Arial, Helvetica, sans-serif" },
  { label: "Hind Siliguri", value: "'Hind Siliguri', sans-serif" },
  { label: "Noto Sans Bengali", value: "'Noto Sans Bengali', sans-serif" },
  { label: "Sans Pro", value: "ui-sans-serif, system-ui, sans-serif" },
  { label: "Classic Serif", value: "ui-serif, Georgia, serif" },
  { label: "Mono", value: "ui-monospace, SFMono-Regular, monospace" },
];

function clampNum(val: any, min: number, max: number, fallback: number): number {
  const num = Number(val);
  if (Number.isNaN(num) || !Number.isFinite(num)) return fallback;
  return Math.max(min, Math.min(max, num));
}

function normalizePhone016(raw: any): { display: string; wa: string } {
  const digits = String(raw || "").replace(/[^0-9]/g, "");
  if (digits.length >= 10) {
    const local = digits.startsWith("88")
      ? digits.slice(2)
      : digits.startsWith("0")
      ? digits
      : `0${digits}`;
    const wa = local.startsWith("88") ? local : `88${local}`;
    return { display: local, wa };
  }
  return { display: DEFAULT_WHATSAPP, wa: `88${DEFAULT_WHATSAPP}` };
}

async function compressImageToSafeDataUrl(
  file: File,
  maxSide = 1200,
  quality = 0.82
): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const src = typeof reader.result === "string" ? reader.result : "";
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

export default function LandingView({
  content,
  isPreview = false,
  isEditMode = false,
  selectedElementId = null,
  onSelectElement,
  onUpdateContent,
  onUpdateStyle,
  onResizeElement,
  onAddCustomBlock,
  onUpdateCustomBlock,
  onGalleryChange,
  onSave,
  saving = false,
  onUndo,
  onRedo,
  canUndo = false,
  canRedo = false,
}: {
  content: any;
  isPreview?: boolean;
  isEditMode?: boolean;
  selectedElementId?: string | null;
  onSelectElement?: (el: SelectedElement) => void;
  onUpdateContent?: (path: string, value: any) => void;
  onUpdateStyle?: (styleKey: string, field: string, value: any) => void;
  onResizeElement?: (
    styleKey: string,
    width?: number,
    height?: number
  ) => void;
  onAddCustomBlock?: (block: CustomBlockItem) => void;
  onUpdateCustomBlock?: (id: string, patch: Partial<CustomBlockItem>) => void;
  onGalleryChange?: (nextGallery: GalleryItem[]) => void;
  onSave?: () => Promise<void> | void;
  saving?: boolean;
  onUndo?: () => void;
  onRedo?: () => void;
  canUndo?: boolean;
  canRedo?: boolean;
}) {
  const theme = content?.theme || {};
  const elementStyles = theme.elements || {};

  const primaryColor = theme.primaryColor || "#73385E";
  const accentColor = theme.accentColor || "#A2AB34";
  const pageBgColor = theme.pageBgColor || "#FAF9F5";
  const boxBgColor = theme.boxBgColor || "#FFFFFF";
  const textColor = theme.textColor || "#1E1B24";
  const mutedTextColor = theme.mutedTextColor || "#4B4554";

  const phoneInfo = normalizePhone016(
    content?.whatsappNumber || content?.adminWhatsApp || DEFAULT_WHATSAPP
  );
  const whatsappDisplay = phoneInfo.display;
  const formattedWa = phoneInfo.wa;

  const globalHeroTitleSize = clampNum(theme.heroTitleSize, 18, 64, 48);
  const globalHeroDescSize = clampNum(theme.heroDescSize, 12, 32, 17);
  const globalSectionTitleSize = clampNum(theme.sectionTitleSize, 16, 48, 28);
  const globalHeroImageHeight = clampNum(theme.heroImageHeight, 160, 620, 440);
  const globalImageShadow =
    theme.imageShadow ?? "0 20px 30px -8px rgba(115, 56, 94, 0.22)";
  const globalBoxShadow =
    theme.boxShadow ?? "0 12px 26px -8px rgba(30, 27, 36, 0.12)";
  const globalBorderRadius = clampNum(theme.borderRadius, 0, 48, 18);
  const globalSectionPaddingY = clampNum(theme.sectionPaddingY, 12, 110, 60);
  const globalBoxPadding = clampNum(theme.boxPadding, 8, 48, 28);

  const [localStyles, setLocalStyles] = useState<Record<string, any>>({});
  const [localCustomBlocks, setLocalCustomBlocks] = useState<CustomBlockItem[]>(
    []
  );
  const [localOverrides, setLocalOverrides] = useState<Record<string, any>>(
    {}
  );

  useEffect(() => {
    setLocalOverrides({});
  }, [content]);

  const [tickerVisible, setTickerVisible] = useState(true);
  const [deviceView, setDeviceView] = useState<"desktop" | "mobile">("desktop");
  const isMobileSim = isEditMode && deviceView === "mobile";

  const [dockPos, setDockPos] = useState<{ x: number; y: number }>({
    x: 16,
    y: 86,
  });
  const [activeTool, setActiveTool] = useState<
    | "select"
    | "text"
    | "box"
    | "image"
    | "gallery"
    | "addBox"
    | "discount"
    | "payment"
  >("select");
  const [activeEl, setActiveEl] = useState<SelectedElement | null>(null);

  const [newBoxMode, setNewBoxMode] = useState<
    "flatText" | "photoBox" | "textBox"
  >("flatText");
  const [newBoxTitle, setNewBoxTitle] = useState("");
  const [newBoxDesc, setNewBoxDesc] = useState("");
  const [newBoxImg, setNewBoxImg] = useState("");
  const [newBoxPos, setNewBoxPos] = useState<
    "afterHero" | "afterGallery" | "beforeFooter"
  >("afterGallery");
  const [newBoxRadius, setNewBoxRadius] = useState(20);
  const [newBoxWidth, setNewBoxWidth] = useState(1100);
  const [newBoxHeight, setNewBoxHeight] = useState(180);

  const [newGalUrl, setNewGalUrl] = useState(DEFAULT_PHOTO);
  const [newGalCaption, setNewGalCaption] = useState("");
  const [newGalIndex, setNewGalIndex] = useState<string>("end");
  const [editingGalIdx, setEditingGalIdx] = useState<number>(0);

  const dragDockRef = useRef<{
    startX: number;
    startY: number;
    origX: number;
    origY: number;
  } | null>(null);

  const scopedKey = useCallback(
    (baseKey: string) => (isMobileSim ? `m_${baseKey}` : `d_${baseKey}`),
    [isMobileSim]
  );

  const triggerSave = useCallback(async () => {
    if (onSave) {
      await onSave();
    }
  }, [onSave]);

  const getElStyle = useCallback(
    (baseKey: string) => {
      const sk = scopedKey(baseKey);
      const legacyMobileKey = `m_${baseKey}`;
      if (isMobileSim) {
        return {
          ...(elementStyles[sk] || elementStyles[legacyMobileKey] || {}),
          ...(localStyles[sk] || localStyles[legacyMobileKey] || {}),
        };
      }
      return {
        ...(elementStyles[sk] || elementStyles[baseKey] || {}),
        ...(localStyles[sk] || localStyles[baseKey] || {}),
      };
    },
    [elementStyles, localStyles, scopedKey, isMobileSim]
  );

  const applyStyle = useCallback(
    (baseKey: string, field: string, value: any) => {
      const targetKey = scopedKey(baseKey);
      let safeValue = value;
      if (field === "fontSize") safeValue = clampNum(value, 10, 64, 16);
      if (field === "width") safeValue = clampNum(value, 60, 1150, 300);
      if (field === "height") safeValue = clampNum(value, 0, 650, 140);
      if (field === "padding") safeValue = clampNum(value, 0, 48, 20);
      if (field === "borderRadius") safeValue = clampNum(value, 0, 48, 16);
      if (field === "borderWidth") safeValue = clampNum(value, 0, 12, 1);
      if (field === "zoom") safeValue = clampNum(value, 50, 200, 100);
      if (field === "size") safeValue = clampNum(value, 50, 400, 180);
      if (field === "brightness") safeValue = clampNum(value, 30, 180, 100);
      if (field === "contrast") safeValue = clampNum(value, 30, 200, 100);
      if (field === "saturate") safeValue = clampNum(value, 0, 220, 100);
      if (field === "grayscale") safeValue = clampNum(value, 0, 100, 0);
      if (field === "blur") safeValue = clampNum(value, 0, 12, 0);
      if (field === "hueRotate") safeValue = clampNum(value, 0, 360, 0);

      setLocalStyles((prev) => ({
        ...prev,
        [targetKey]: {
          ...(prev[targetKey] || {}),
          [field]: safeValue,
        },
      }));
      onUpdateStyle?.(targetKey, field, safeValue);
    },
    [scopedKey, onUpdateStyle]
  );

  const applyResize = useCallback(
    (baseKey: string, width?: number, height?: number) => {
      const targetKey = scopedKey(baseKey);
      const safeW =
        width !== undefined ? clampNum(width, 60, 1150, 300) : undefined;
      const safeH =
        height !== undefined ? clampNum(height, 0, 650, 140) : undefined;

      setLocalStyles((prev) => ({
        ...prev,
        [targetKey]: {
          ...(prev[targetKey] || {}),
          ...(safeW !== undefined ? { width: safeW } : {}),
          ...(safeH !== undefined ? { height: safeH } : {}),
        },
      }));
      onResizeElement?.(targetKey, safeW, safeH);
    },
    [scopedKey, onResizeElement]
  );

  const activeElRef = useRef<SelectedElement | null>(null);
  useEffect(() => {
    activeElRef.current = activeEl;
  }, [activeEl]);

  const getElStyleRef = useRef(getElStyle);
  useEffect(() => {
    getElStyleRef.current = getElStyle;
  }, [getElStyle]);

  const applyStyleRef = useRef(applyStyle);
  useEffect(() => {
    applyStyleRef.current = applyStyle;
  }, [applyStyle]);

  useEffect(() => {
    if (!isEditMode) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      const isMod = e.ctrlKey || e.metaKey;
      if (!isMod) return;

      const key = e.key.toLowerCase();
      const target = e.target as HTMLElement | null;
      const isTextInput =
        target?.tagName === "INPUT" ||
        target?.tagName === "TEXTAREA" ||
        target?.isContentEditable;

      if (key === "z" && !e.shiftKey) {
        if (!isTextInput && canUndo && onUndo) {
          e.preventDefault();
          onUndo();
        }
      } else if ((key === "y" && !e.shiftKey) || (key === "z" && e.shiftKey)) {
        if (!isTextInput && canRedo && onRedo) {
          e.preventDefault();
          onRedo();
        }
      } else if (key === "s") {
        e.preventDefault();
        void triggerSave();
      } else if (!isTextInput && activeElRef.current) {
        const sk = activeElRef.current.styleKey;
        const cur = getElStyleRef.current(sk);
        if (key === "b") {
          e.preventDefault();
          applyStyleRef.current(sk, "bold", !cur.bold);
        } else if (key === "i") {
          e.preventDefault();
          applyStyleRef.current(sk, "italic", !cur.italic);
        } else if (key === "u") {
          e.preventDefault();
          applyStyleRef.current(sk, "underline", !cur.underline);
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isEditMode, canUndo, canRedo, onUndo, onRedo, triggerSave]);

  useEffect(() => {
    const interval = setInterval(() => {
      setTickerVisible(false);
      const t = setTimeout(() => {
        setTickerVisible(true);
      }, 450);
      return () => clearTimeout(t);
    }, 3600);
    return () => clearInterval(interval);
  }, []);

  const getFieldValue = (path: string | undefined, fallback: any) => {
    if (!path) return fallback;
    if (Object.prototype.hasOwnProperty.call(localOverrides, path)) {
      return localOverrides[path];
    }
    const val = path.split(".").reduce((acc: any, key: string) => {
      if (acc === null || acc === undefined) return undefined;
      return acc[key];
    }, content);
    return val !== undefined ? val : fallback;
  };

  const applyContentChange = (path: string, value: any) => {
    setLocalOverrides((prev) => ({ ...prev, [path]: value }));
    onUpdateContent?.(path, value);
  };

  const buildPhotoshopFilter = (st: any) => {
    const brightness = clampNum(st.brightness, 30, 180, 100);
    const contrast = clampNum(st.contrast, 30, 200, 100);
    const saturate = clampNum(st.saturate, 0, 220, 100);
    const grayscale = clampNum(st.grayscale, 0, 100, 0);
    const blur = clampNum(st.blur, 0, 12, 0);
    const hueRotate = clampNum(st.hueRotate, 0, 360, 0);
    return `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturate}%) grayscale(${grayscale}%) blur(${blur}px) hue-rotate(${hueRotate}deg)`;
  };

  const getTextCss = (
    key: string,
    defaultSize: number,
    defaultColor: string,
    defaultAlign: "left" | "center" | "right" | "justify" = "left"
  ): React.CSSProperties => {
    const st = getElStyle(key);
    const underline = st.underline ? "underline" : "";
    const strike = st.lineThrough ? "line-through" : "";
    const textDecoration =
      [underline, strike].filter(Boolean).join(" ") || "none";

    return {
      fontFamily: st.fontFamily || "inherit",
      fontSize: `${clampNum(st.fontSize, 10, 64, defaultSize)}px`,
      fontWeight: st.bold ? 800 : undefined,
      fontStyle: st.italic ? "italic" : "normal",
      textDecoration,
      textAlign: st.textAlign || defaultAlign,
      color: st.color || defaultColor,
      backgroundColor: st.backgroundColor || st.highlightColor || undefined,
      textShadow: st.textShadow || "none",
      padding:
        st.padding !== undefined
          ? `${clampNum(st.padding, 0, 48, 8)}px`
          : undefined,
      borderRadius:
        st.borderRadius !== undefined
          ? `${clampNum(st.borderRadius, 0, 48, 8)}px`
          : undefined,
      width: st.width ? `${clampNum(st.width, 60, 1150, 300)}px` : undefined,
      maxWidth: "100%",
      height: st.height ? `${clampNum(st.height, 24, 650, 60)}px` : undefined,
      overflowWrap: "anywhere",
      wordBreak: "break-word",
    };
  };

  const getBoxCss = (
    key: string,
    defaultBg: string,
    defaultRadius: number,
    defaultPadding: number,
    defaultShadow: string
  ): React.CSSProperties => {
    const st = getElStyle(key);
    return {
      backgroundColor: st.backgroundColor || defaultBg,
      color: st.color || undefined,
      textAlign: st.textAlign || undefined,
      width: st.width ? `${clampNum(st.width, 60, 1150, 400)}px` : undefined,
      maxWidth: "100%",
      height: st.height ? `${clampNum(st.height, 40, 650, 180)}px` : undefined,
      borderRadius: `${clampNum(st.borderRadius, 0, 48, defaultRadius)}px`,
      padding: `${clampNum(st.padding, 0, 48, defaultPadding)}px`,
      boxShadow: st.boxShadow ?? defaultShadow,
      borderColor: st.borderColor || undefined,
      borderWidth:
        st.borderWidth !== undefined
          ? `${clampNum(st.borderWidth, 0, 12, 1)}px`
          : undefined,
      borderStyle: st.borderWidth ? "solid" : undefined,
      filter: buildPhotoshopFilter(st),
      overflowWrap: "anywhere",
      wordBreak: "break-word",
    };
  };

  const getImageWrapperCss = (
    key: string,
    defaultHeight: number,
    defaultRadius: number,
    defaultShadow: string
  ): React.CSSProperties => {
    const st = getElStyle(key);
    return {
      width: st.width ? `${clampNum(st.width, 60, 1150, 480)}px` : "100%",
      maxWidth: "100%",
      height: `${clampNum(st.height, 80, 650, defaultHeight)}px`,
      borderRadius: `${clampNum(st.borderRadius, 0, 48, defaultRadius)}px`,
      boxShadow: st.boxShadow ?? defaultShadow,
      borderColor: st.borderColor || "#FFFFFF",
      borderWidth:
        st.borderWidth !== undefined
          ? `${clampNum(st.borderWidth, 0, 12, 4)}px`
          : "4px",
      borderStyle: "solid",
    };
  };

  const getImageFilterCss = (key: string): React.CSSProperties => {
    const st = getElStyle(key);
    const zoomScale = clampNum(st.zoom, 50, 200, 100) / 100;
    return {
      filter: buildPhotoshopFilter(st),
      objectPosition: st.objectPosition || "center",
      transform: `scale(${zoomScale})`,
      transformOrigin: "center center",
    };
  };

  const renderZoomOverlay = (styleKey: string) => {
    if (!isEditMode) return null;
    const zoomVal = clampNum(getElStyle(styleKey).zoom, 50, 200, 100);
    return (
      <div
        onClick={(e) => e.stopPropagation()}
        onMouseDown={(e) => e.stopPropagation()}
        onWheel={(e) => {
          if (e.altKey) {
            e.preventDefault();
            e.stopPropagation();
            const delta = e.deltaY < 0 ? 10 : -10;
            applyStyle(styleKey, "zoom", zoomVal + delta);
          }
        }}
        title="ফ্রেম ঠিক রেখে ভেতরের ছবি Zoom In/Out করুন (বা Alt + Mouse Wheel)"
        className="absolute top-2 right-2 z-30 flex items-center gap-1 bg-black/80 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-md shadow"
      >
        <button
          type="button"
          onClick={() => applyStyle(styleKey, "zoom", zoomVal - 10)}
          title="Zoom Out"
          className="px-1 hover:text-[#A2AB34] cursor-pointer"
        >
          −
        </button>
        <span>{zoomVal}%</span>
        <button
          type="button"
          onClick={() => applyStyle(styleKey, "zoom", zoomVal + 10)}
          title="Zoom In"
          className="px-1 hover:text-[#A2AB34] cursor-pointer"
        >
          +
        </button>
      </div>
    );
  };

  const handleSelect = (e: React.MouseEvent, el: SelectedElement) => {
    if (!isEditMode) return;
    e.preventDefault();
    e.stopPropagation();
    setActiveEl(el);
    if (el.type === "text") setActiveTool("text");
    else if (el.type === "image") setActiveTool("image");
    else if (el.type === "gallery") setActiveTool("gallery");
    else setActiveTool("box");
    onSelectElement?.(el);
  };

  const handleDragResize = (
    e: React.MouseEvent,
    styleKey: string,
    currentWidth: number,
    currentHeight: number
  ) => {
    if (!isEditMode) return;
    e.preventDefault();
    e.stopPropagation();
    const startX = e.clientX;
    const startY = e.clientY;

    const onMove = (moveEvent: MouseEvent) => {
      const nextW = clampNum(
        currentWidth + (moveEvent.clientX - startX),
        60,
        1150,
        300
      );
      const nextH = clampNum(
        currentHeight + (moveEvent.clientY - startY),
        0,
        650,
        140
      );
      applyResize(styleKey, Math.round(nextW), Math.round(nextH));
    };

    const onUp = () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  };

  const startDockDrag = (e: React.MouseEvent) => {
    e.preventDefault();
    dragDockRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      origX: dockPos.x,
      origY: dockPos.y,
    };

    const onMove = (ev: MouseEvent) => {
      if (!dragDockRef.current) return;
      const nextX = Math.max(
        8,
        Math.min(
          window.innerWidth - 340,
          dragDockRef.current.origX + (ev.clientX - dragDockRef.current.startX)
        )
      );
      const nextY = Math.max(
        8,
        Math.min(
          window.innerHeight - 120,
          dragDockRef.current.origY + (ev.clientY - dragDockRef.current.startY)
        )
      );
      setDockPos({ x: nextX, y: nextY });
    };

    const onUp = () => {
      dragDockRef.current = null;
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  };

  const currentSelected = activeEl;
  const currentSelectedId = selectedElementId ?? currentSelected?.id ?? null;

  const highlightClass = (id: string) => {
    if (!isEditMode) return "";
    const isSel = currentSelectedId === id;
    return `cursor-pointer transition-all duration-150 ${
      isSel
        ? "ring-4 ring-[#A2AB34] ring-offset-2 relative z-20"
        : "hover:ring-2 hover:ring-[#73385E]/85 hover:ring-offset-1"
    }`;
  };

  const topNoticeText = getFieldValue(
    "topNoticeText",
    content?.topNoticeText ||
      "১০০% খাঁটি ও প্রাকৃতিক পণ্য — সারা দেশে দ্রুত হোম ডেলিভারি চলছে!"
  );

  const galleryHeadingText = getFieldValue(
    "galleryTitle",
    content?.galleryTitle || "আমাদের পণ্যের গ্যালারি"
  );

  const discountEnabled = Boolean(
    getFieldValue(
      "pricing.discountEnabled",
      content?.pricing?.discountEnabled ?? false
    )
  );
  const discountType: "flat" | "percent" =
    getFieldValue(
      "pricing.discountType",
      content?.pricing?.discountType || "flat"
    ) === "percent"
      ? "percent"
      : "flat";
  const discountValue = clampNum(
    getFieldValue("pricing.discountValue", content?.pricing?.discountValue ?? 0),
    0,
    discountType === "percent" ? 90 : 50000,
    0
  );
  const discountLabel = String(
    getFieldValue(
      "pricing.discountLabel",
      content?.pricing?.discountLabel || "বিশেষ ছাড়"
    )
  );

  const defaultPaymentMethods: string[] =
    Array.isArray(content?.pricing?.paymentMethods) &&
    content.pricing.paymentMethods.length > 0
      ? content.pricing.paymentMethods
      : [
          "Pay with cash upon delivery",
          "bKash",
          "Nagad",
          "Card Payment",
        ];

  const paymentMethods: string[] = getFieldValue(
    "pricing.paymentMethods",
    defaultPaymentMethods
  );

  const togglePaymentMethod = (method: string) => {
    const exists = paymentMethods.includes(method);
    const next = exists
      ? paymentMethods.filter((m) => m !== method)
      : [...paymentMethods, method];
    applyContentChange(
      "pricing.paymentMethods",
      next.length > 0 ? next : ["Pay with cash upon delivery"]
    );
  };

  const hero = content?.hero || {};
  const heroBadge = getFieldValue(
    "hero.badge",
    hero.badge?.trim() || "Premium Khejur Gur"
  );
  const heroTitle = getFieldValue(
    "hero.title",
    hero.title?.trim() || "প্রতিটি কামড়ে খাঁটি গ্রামবাংলার স্বাদ"
  );

  const baseTags: string[] =
    hero.tags?.length > 0
      ? hero.tags
      : ["১০০% খাঁটি", "চিনিমুক্ত", "ঐতিহ্যবাহী স্বাদ"];
  const heroTags = baseTags.map((t, i) => getFieldValue(`hero.tags.${i}`, t));

  const heroDescription = getFieldValue(
    "hero.description",
    hero.description?.trim() ||
      "সাধারণ গুড় নয়। শীতের সকালের ঘ্রাণ আর সুবাস নিয়ে, সরাসরি গাছ থেকে সংগ্রহ করা রসে তৈরি খাঁটি খেজুরের গুড়।"
  );
  const heroImageUrl = getFieldValue(
    "hero.imageUrl",
    hero.imageUrl?.trim() || DEFAULT_PHOTO
  );

  const details = content?.details || {};
  const whyUs = content?.whyUs || {};
  const targetAudience = content?.targetAudience || {};

  const allCustomBlocks: CustomBlockItem[] = [
    ...(Array.isArray(content?.customBlocks) ? content.customBlocks : []),
    ...localCustomBlocks,
  ];

  const baseProductPrice = clampNum(
    getFieldValue("pricing.productPrice", content?.pricing?.productPrice ?? 1250),
    1,
    1000000,
    1250
  );
  const computedDiscountAmount = !discountEnabled
    ? 0
    : discountType === "percent"
    ? Math.round((baseProductPrice * discountValue) / 100)
    : Math.min(baseProductPrice, discountValue);

  const computedDiscountedPrice = Math.max(
    0,
    baseProductPrice - computedDiscountAmount
  );

  const pricing = {
    ...(content?.pricing || {
      productPrice: 1250,
      shippingInside: 60,
      shippingOutside: 120,
    }),
    originalPrice: baseProductPrice,
    productPrice: baseProductPrice,
    discountPrice: computedDiscountedPrice,
    discountEnabled,
    discountType,
    discountValue,
    discountLabel,
    discountAmount: computedDiscountAmount,
    discountedPrice: computedDiscountedPrice,
    paymentMethods,
    whatsappNumber: formattedWa,
    whatsappDisplay,
  };

  const rawGallery: GalleryItem[] =
    Array.isArray(content?.gallery) && content.gallery.length > 0
      ? content.gallery
          .filter(
            (item: any) =>
              item && typeof item.url === "string" && item.url.trim() !== ""
          )
          .map((item: any, idx: number) => ({
            url: item.url.trim(),
            caption:
              typeof item.caption === "string" && item.caption.trim() !== ""
                ? item.caption.trim()
                : `খাঁটি খেজুরের গুড় #${idx + 1}`,
          }))
      : [
          { url: DEFAULT_PHOTO, caption: "খাঁটি খেজুরের গুড় — প্রাকৃতিক স্বাদ #1" },
          { url: DEFAULT_PHOTO, caption: "হাতে তৈরি ঐতিহ্যবাহী পাটালি #2" },
          { url: DEFAULT_PHOTO, caption: "শীতের সকালের ঘ্রাণ ও শুদ্ধতা #3" },
        ];

  const galleryImages: GalleryItem[] = rawGallery.map((item, idx) => ({
    url: getFieldValue(`gallery.${idx}.url`, item.url),
    caption: getFieldValue(`gallery.${idx}.caption`, item.caption),
  }));

  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    if (galleryImages.length === 0 || currentSlide >= galleryImages.length) {
      setCurrentSlide(0);
    }
    if (editingGalIdx >= galleryImages.length) {
      setEditingGalIdx(Math.max(0, galleryImages.length - 1));
    }
  }, [galleryImages.length, currentSlide, editingGalIdx]);

  useEffect(() => {
    if (galleryImages.length <= 1 || isPaused) return;
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % galleryImages.length);
    }, 3200);
    return () => clearInterval(timer);
  }, [galleryImages.length, isPaused]);

  const nextSlide = () => {
    if (galleryImages.length === 0) return;
    setCurrentSlide((prev) => (prev + 1) % galleryImages.length);
  };

  const prevSlide = () => {
    if (galleryImages.length === 0) return;
    setCurrentSlide(
      (prev) => (prev - 1 + galleryImages.length) % galleryImages.length
    );
  };

  const galleryCardSize = clampNum(
    getElStyle("galleryCard").size,
    60,
    360,
    isMobileSim ? 145 : 220
  );
  const galleryBannerStyle = getElStyle("galleryBanner");
  const galleryBannerHeight = clampNum(
    galleryBannerStyle.height,
    0,
    560,
    isMobileSim ? 235 : 330
  );
  const galleryBannerWidth = galleryBannerStyle.width
    ? clampNum(galleryBannerStyle.width, 240, 1150, 900)
    : undefined;

  const getCardStyle = (index: number): React.CSSProperties => {
    const total = galleryImages.length;
    let diff = index - currentSlide;

    if (diff > total / 2) diff -= total;
    if (diff < -total / 2) diff += total;

    const absDiff = Math.abs(diff);
    const stepSpacing = isMobileSim
      ? Math.max(92, galleryCardSize * 0.72)
      : Math.max(150, galleryCardSize * 0.85);
    const translateX = diff * stepSpacing;
    const scale =
      absDiff === 0 ? 1 : absDiff === 1 ? 0.82 : absDiff === 2 ? 0.66 : 0.55;
    const opacity =
      absDiff === 0 ? 1 : absDiff === 1 ? 0.58 : absDiff === 2 ? 0.22 : 0;
    const zIndex = 30 - absDiff * 10;

    return {
      width: `${galleryCardSize}px`,
      height: `${galleryCardSize}px`,
      borderRadius: `${clampNum(
        getElStyle("galleryCard").borderRadius,
        0,
        36,
        globalBorderRadius
      )}px`,
      transform: `translate(-50%, -50%) translateX(${translateX}px) scale(${scale})`,
      opacity,
      zIndex,
      pointerEvents: absDiff <= 2 ? "auto" : "none",
    };
  };

  const handleAddBoxOnPage = () => {
    const hasImg = newBoxMode === "photoBox" && newBoxImg.trim() !== "";
    const isTextOnly = newBoxMode === "textBox";
    const created: CustomBlockItem = {
      id: `blk_${Date.now()}`,
      mode: newBoxMode,
      title:
        newBoxTitle.trim() ||
        (newBoxMode === "flatText"
          ? "নতুন ফ্ল্যাট লেখার বক্স"
          : isTextOnly
          ? "নতুন টেক্সট বক্স"
          : "নতুন ছবি যুক্ত বক্স"),
      description:
        newBoxDesc.trim() ||
        "এখানে আপনার পছন্দমতো লেখা লিখুন, পরে ছবি যুক্ত করুন বা ডিজাইন সাজান।",
      imageUrl: hasImg ? newBoxImg.trim() : undefined,
      position: newBoxPos,
      bgColor: isTextOnly ? "transparent" : boxBgColor,
      textColor: textColor,
      width: clampNum(newBoxWidth, 120, 1150, isTextOnly ? 680 : 1100),
      height: clampNum(
        newBoxHeight,
        60,
        520,
        newBoxMode === "flatText" ? 130 : isTextOnly ? 100 : 220
      ),
      borderRadius: clampNum(
        newBoxRadius,
        0,
        48,
        newBoxMode === "flatText" ? 10 : isTextOnly ? 8 : 20
      ),
      padding: newBoxMode === "flatText" ? 16 : globalBoxPadding,
      shadow: isTextOnly ? "none" : globalBoxShadow,
    };
    setLocalCustomBlocks((prev) => [...prev, created]);
    onAddCustomBlock?.(created);
    setNewBoxTitle("");
    setNewBoxDesc("");
    setNewBoxImg("");
  };

  const attachPhotoToCustomBlock = async (blkId: string, file: File) => {
    const compressed = await compressImageToSafeDataUrl(file);
    setLocalCustomBlocks((prev) =>
      prev.map((b) =>
        b.id === blkId ? { ...b, mode: "photoBox", imageUrl: compressed } : b
      )
    );
    onUpdateCustomBlock?.(blkId, { mode: "photoBox", imageUrl: compressed });
  };

  const handleAddGalleryItem = () => {
    const url = newGalUrl.trim() || DEFAULT_PHOTO;
    const item: GalleryItem = {
      url,
      caption:
        newGalCaption.trim() || `খাঁটি খেজুরের গুড় #${galleryImages.length + 1}`,
    };
    const next = [...galleryImages];
    if (newGalIndex === "end") {
      next.push(item);
    } else {
      const idx = Math.max(0, Math.min(next.length, Number(newGalIndex) - 1));
      next.splice(idx, 0, item);
    }
    onGalleryChange?.(next);
    setNewGalCaption("");
    setNewGalIndex("end");
  };

  const handleRemoveGalleryItem = (idxToRemove: number) => {
    const next = galleryImages.filter((_, i) => i !== idxToRemove);
    onGalleryChange?.(next);
  };

  const handleMoveGalleryItem = (fromIdx: number, dir: -1 | 1) => {
    const toIdx = fromIdx + dir;
    if (toIdx < 0 || toIdx >= galleryImages.length) return;
    const next = [...galleryImages];
    const [moved] = next.splice(fromIdx, 1);
    next.splice(toIdx, 0, moved);
    setEditingGalIdx(toIdx);
    onGalleryChange?.(next);
  };

  const renderCustomBlocks = (
    pos: "afterHero" | "afterGallery" | "beforeFooter"
  ) => {
    const items = allCustomBlocks.filter((b) => b.position === pos);
    if (items.length === 0) return null;

    return (
      <section className="container mx-auto px-4 max-w-6xl py-5">
        <div className="flex flex-wrap items-start justify-center gap-4">
          {items.map((blk, i) => {
            const stKey = `customBlock_${blk.id || i}`;
            const st = getElStyle(stKey);
            const w = clampNum(st.width ?? blk.width, 120, 1150, 520);
            const h = clampNum(st.height ?? blk.height, 60, 520, 160);
            const r = clampNum(
              st.borderRadius ?? blk.borderRadius,
              0,
              48,
              globalBorderRadius
            );
            const p = clampNum(
              st.padding ?? blk.padding,
              0,
              48,
              globalBoxPadding
            );

            return (
              <div
                key={blk.id || i}
                onClick={(e) =>
                  handleSelect(e, {
                    id: `custom-blk-${blk.id || i}`,
                    label: `কাস্টম বক্স: ${blk.title}`,
                    type: "customBlock",
                    styleKey: stKey,
                    customId: blk.id,
                  })
                }
                style={{
                  backgroundColor: st.backgroundColor || blk.bgColor || boxBgColor,
                  color: st.color || blk.textColor || textColor,
                  borderColor: st.borderColor || "rgba(0,0,0,0.12)",
                  borderWidth: st.borderColor ? "2px" : "1px",
                  borderStyle: "solid",
                  width: `${w}px`,
                  maxWidth: "100%",
                  minHeight: `${h}px`,
                  borderRadius: `${r}px`,
                  padding: `${p}px`,
                  boxShadow: st.boxShadow ?? blk.shadow ?? globalBoxShadow,
                }}
                className={`relative shrink-0 overflow-hidden ${highlightClass(
                  `custom-blk-${blk.id || i}`
                )}`}
              >
                <div
                  className={
                    blk.imageUrl
                      ? "grid sm:grid-cols-2 gap-4 items-center"
                      : "space-y-1.5"
                  }
                >
                  <div>
                    <h3
                      style={{ color: st.color || primaryColor }}
                      className="text-lg font-extrabold mb-1 break-words"
                    >
                      {blk.title}
                    </h3>
                    <p
                      style={{ color: st.color || mutedTextColor }}
                      className="text-sm leading-relaxed break-words"
                    >
                      {blk.description}
                    </p>
                  </div>
                  {blk.imageUrl && (
                    <div className="relative h-40 w-full rounded-xl overflow-hidden border border-black/10">
                      <Image
                        src={blk.imageUrl}
                        alt={blk.title}
                        fill
                        style={getImageFilterCss(`${stKey}_img`)}
                        className="object-cover"
                        unoptimized={isPreview}
                      />
                    </div>
                  )}
                </div>

                {isEditMode && blk.id && (
                  <label
                    onClick={(e) => e.stopPropagation()}
                    className="mt-2 inline-flex items-center gap-1 bg-stone-900/85 hover:bg-stone-900 text-amber-300 text-[10px] font-bold px-2.5 py-1 rounded cursor-pointer"
                  >
                    <span>+ ছবি যুক্ত / বদলান</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={async (e) => {
                        const f = e.target.files?.[0];
                        if (f && blk.id) {
                          await attachPhotoToCustomBlock(blk.id, f);
                        }
                        e.target.value = "";
                      }}
                    />
                  </label>
                )}

                {isEditMode && (
                  <div
                    onMouseDown={(e) => handleDragResize(e, stKey, w, h)}
                    title="টেনে সাইজ বড়-ছোট করুন"
                    className="absolute bottom-2.5 right-2.5 w-6 h-6 rounded-md bg-[#73385E] text-white text-xs flex items-center justify-center cursor-nwse-resize select-none shadow"
                  >
                    ↘
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>
    );
  };

  const activeStyle = currentSelected ? getElStyle(currentSelected.styleKey) : {};
  const activeGalItem = galleryImages[editingGalIdx] || galleryImages[0];
  const activeGalStyleKey = `galleryItem_${editingGalIdx}`;
  const activeGalStyle = getElStyle(activeGalStyleKey);

  return (
    <div
      style={{ backgroundColor: isMobileSim ? "#D8D4CC" : pageBgColor }}
      className={`min-h-screen transition-colors duration-200 relative ${
        isMobileSim ? "py-5 px-2 flex justify-center" : ""
      }`}
    >
      <main
        style={{
          backgroundColor: pageBgColor,
          color: textColor,
          width: isMobileSim ? "390px" : "100%",
          maxWidth: "100%",
        }}
        className={`min-h-screen overflow-x-hidden transition-all duration-200 relative ${
          isMobileSim
            ? "rounded-[32px] border-[7px] border-stone-900 shadow-2xl"
            : ""
        }`}
      >
        {/* শুরুর চিকন অ্যানিমেটেড লাইন */}
        <div
          onClick={(e) =>
            handleSelect(e, {
              id: "top-ticker-bar",
              label: "শুরুর চিকন লাইন",
              type: "text",
              contentPath: "topNoticeText",
              styleKey: "topNoticeText",
            })
          }
          style={{
            backgroundColor:
              getElStyle("topNoticeBar").backgroundColor || primaryColor,
            borderColor: "rgba(162, 171, 52, 0.35)",
          }}
          className={`w-full overflow-hidden border-b py-1.5 px-3 flex items-center justify-center ${highlightClass(
            "top-ticker-bar"
          )}`}
        >
          <div
            style={{
              opacity: tickerVisible ? 1 : 0,
              transform: tickerVisible ? "translateY(0px)" : "translateY(-8px)",
            }}
            className="max-w-6xl mx-auto transition-all duration-500 ease-out flex items-center justify-center overflow-hidden"
          >
            <span
              style={getTextCss(
                "topNoticeText",
                isMobileSim ? 11.5 : 12.5,
                "#FFFBEB",
                "center"
              )}
              className="inline-block whitespace-nowrap font-semibold tracking-wide"
            >
              ✦ {topNoticeText} ✦
            </span>
          </div>
        </div>

        {/* মুভেবল Tool Dock + Inspector Panel */}
        {isEditMode && (
          <div
            style={{ left: `${dockPos.x}px`, top: `${dockPos.y}px` }}
            className="fixed z-[95] flex items-start gap-2 select-none"
          >
            <div className="bg-stone-950/95 backdrop-blur-md border border-stone-700/80 rounded-xl p-1.5 shadow-2xl flex flex-col items-center gap-1 text-stone-200">
              <div
                onMouseDown={startDockDrag}
                title="টেনে টুলবার সরান"
                className="w-8 h-5 rounded bg-stone-800 hover:bg-stone-700 flex items-center justify-center cursor-move text-[10px] text-stone-300"
              >
                ⋮⋮
              </div>

              <button
                type="button"
                onClick={() =>
                  setDeviceView((prev) =>
                    prev === "desktop" ? "mobile" : "desktop"
                  )
                }
                title={
                  deviceView === "mobile"
                    ? "Desktop View-এ ফিরে যান (আলাদা স্টাইল)"
                    : "Mobile View-এ গিয়ে এডিট করুন (আলাদা স্টাইল)"
                }
                style={
                  deviceView === "mobile"
                    ? { backgroundColor: "#A2AB34", color: "#1E1B24" }
                    : undefined
                }
                className="w-8 h-8 rounded-lg flex items-center justify-center transition cursor-pointer hover:bg-stone-800 text-stone-200"
              >
                <DynamicIcon
                  name={deviceView === "mobile" ? "Monitor" : "Smartphone"}
                  className="w-4 h-4"
                />
              </button>

              {(
                [
                  { id: "select", icon: "MousePointer", title: "Select & Align" },
                  { id: "text", icon: "Type", title: "Font, B/I/U, Align & Color" },
                  {
                    id: "box",
                    icon: "Square",
                    title: "Box / Button Color, Border, Shadow & Size",
                  },
                  {
                    id: "image",
                    icon: "Image",
                    title: "Photo, Zoom & Photoshop Filters",
                  },
                  {
                    id: "gallery",
                    icon: "Images",
                    title: "Gallery Banner, Frame & Photos",
                  },
                  {
                    id: "discount",
                    icon: "Tag",
                    title: "আসল মূল্য ও Discount সেটিংস",
                  },
                  {
                    id: "payment",
                    icon: "CreditCard",
                    title: "COD + bKash / Nagad Payment অপশন",
                  },
                  {
                    id: "addBox",
                    icon: "PlusSquare",
                    title: "নতুন বক্স / লেখা তৈরি",
                  },
                ] as const
              ).map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setActiveTool(t.id)}
                  title={t.title}
                  style={
                    activeTool === t.id
                      ? { backgroundColor: "#A2AB34", color: "#1E1B24" }
                      : undefined
                  }
                  className={`w-8 h-8 rounded-lg flex items-center justify-center transition cursor-pointer ${
                    activeTool === t.id
                      ? "font-extrabold shadow"
                      : "hover:bg-stone-800 text-stone-300"
                  }`}
                >
                  <DynamicIcon name={t.icon} className="w-4 h-4" />
                </button>
              ))}

              {onUndo && (
                <button
                  type="button"
                  onClick={onUndo}
                  disabled={!canUndo}
                  title="Undo (Ctrl+Z)"
                  className="w-8 h-8 mt-1 rounded-lg flex items-center justify-center bg-stone-800 text-amber-300 hover:bg-stone-700 disabled:opacity-30 cursor-pointer"
                >
                  <DynamicIcon name="Undo2" className="w-4 h-4" />
                </button>
              )}

              {onRedo && (
                <button
                  type="button"
                  onClick={onRedo}
                  disabled={!canRedo}
                  title="Redo (Ctrl+Y / Ctrl+Shift+Z)"
                  className="w-8 h-8 rounded-lg flex items-center justify-center bg-stone-800 text-cyan-300 hover:bg-stone-700 disabled:opacity-30 cursor-pointer"
                >
                  <DynamicIcon name="Redo2" className="w-4 h-4" />
                </button>
              )}

              {onSave && (
                <button
                  type="button"
                  onClick={triggerSave}
                  disabled={saving}
                  title="Save Changes (Ctrl+S)"
                  className="w-8 h-8 rounded-lg flex items-center justify-center bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold disabled:opacity-50 cursor-pointer"
                >
                  <DynamicIcon name="Save" className="w-4 h-4" />
                </button>
              )}
            </div>

            <div className="w-[335px] max-w-[84vw] bg-stone-900/95 backdrop-blur-md border border-stone-700/80 rounded-xl shadow-2xl text-stone-100 text-xs overflow-hidden">
              <div
                onMouseDown={startDockDrag}
                className="bg-stone-950 px-3 py-2 border-b border-stone-800 flex items-center justify-between gap-2 cursor-move"
              >
                <span className="font-extrabold text-[11px] tracking-wider text-[#A2AB34]">
                  EDIT BAR (
                  {deviceView === "mobile" ? "MOBILE ONLY" : "DESKTOP ONLY"})
                </span>
                <div className="flex items-center gap-1.5">
                  {onUndo && (
                    <button
                      type="button"
                      onClick={onUndo}
                      disabled={!canUndo}
                      title="Ctrl+Z"
                      className="px-2 py-0.5 rounded bg-stone-800 hover:bg-stone-700 text-amber-300 text-[10px] font-bold disabled:opacity-35 cursor-pointer"
                    >
                      Undo
                    </button>
                  )}
                  {onRedo && (
                    <button
                      type="button"
                      onClick={onRedo}
                      disabled={!canRedo}
                      title="Ctrl+Y"
                      className="px-2 py-0.5 rounded bg-stone-800 hover:bg-stone-700 text-cyan-300 text-[10px] font-bold disabled:opacity-35 cursor-pointer"
                    >
                      Redo
                    </button>
                  )}
                  {onSave && (
                    <button
                      type="button"
                      onClick={triggerSave}
                      disabled={saving}
                      title="Ctrl+S"
                      className="px-2.5 py-0.5 rounded bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-[10px] font-extrabold disabled:opacity-50 cursor-pointer"
                    >
                      {saving ? "..." : "Save"}
                    </button>
                  )}
                </div>
              </div>

              <div className="p-3 space-y-2.5 max-h-[76vh] overflow-y-auto bg-stone-900/90">
                <div className="grid grid-cols-2 gap-1.5 bg-stone-950 p-1 rounded-lg border border-stone-800">
                  <button
                    type="button"
                    onClick={() => setDeviceView("mobile")}
                    style={
                      deviceView === "mobile"
                        ? { backgroundColor: "#A2AB34", color: "#1E1B24" }
                        : undefined
                    }
                    className={`py-1 rounded font-bold cursor-pointer ${
                      deviceView === "mobile" ? "" : "text-stone-400"
                    }`}
                  >
                    Mobile View
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeviceView("desktop")}
                    style={
                      deviceView === "desktop"
                        ? { backgroundColor: "#A2AB34", color: "#1E1B24" }
                        : undefined
                    }
                    className={`py-1 rounded font-bold cursor-pointer ${
                      deviceView === "desktop" ? "" : "text-stone-400"
                    }`}
                  >
                    Desktop View
                  </button>
                </div>

                {/* Payment অপশন প্যানেল */}
                {activeTool === "payment" && (
                  <div className="space-y-2 bg-stone-950/80 p-2.5 rounded-lg border border-stone-800">
                    <div className="font-bold text-[#A2AB34]">
                      অর্ডার ফর্মের Payment অপশনসমূহ
                    </div>
                    <p className="text-[10px] text-stone-400">
                      Cash on Delivery এবং অনলাইন পেমেন্ট (bKash, Nagad ইত্যাদি)
                      চালু/বন্ধ করুন:
                    </p>
                    {[
                      "Pay with cash upon delivery",
                      "bKash",
                      "Nagad",
                      "bKash / Nagad (Mobile Banking)",
                      "Card Payment",
                    ].map((method) => {
                      const checked = paymentMethods.includes(method);
                      return (
                        <label
                          key={method}
                          className="flex items-center gap-2 bg-stone-900 border border-stone-800 rounded px-2.5 py-1.5 cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => togglePaymentMethod(method)}
                            className="accent-[#A2AB34] w-4 h-4"
                          />
                          <span className="text-[11px] text-stone-200">
                            {method}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                )}

                {/* আসল মূল্য ও Discount কন্ট্রোল প্যানেল */}
                {activeTool === "discount" && (
                  <div className="space-y-2.5 bg-stone-950/80 p-2.5 rounded-lg border border-stone-800">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-[#A2AB34]">
                        আসল মূল্য ও Discount সেটিংস
                      </span>
                      <label className="inline-flex items-center gap-1.5 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={discountEnabled}
                          onChange={(e) =>
                            applyContentChange(
                              "pricing.discountEnabled",
                              e.target.checked
                            )
                          }
                          className="accent-[#A2AB34] w-4 h-4"
                        />
                        <span className="text-[11px] font-bold text-emerald-300">
                          {discountEnabled ? "চালু" : "বন্ধ"}
                        </span>
                      </label>
                    </div>

                    <div>
                      <label className="block text-[10px] text-stone-400 mb-1">
                        আসল মূল্য (Original Price ৳)
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="1000000"
                        value={baseProductPrice}
                        onChange={(e) =>
                          applyContentChange(
                            "pricing.productPrice",
                            clampNum(e.target.value, 1, 1000000, 1250)
                          )
                        }
                        className="w-full bg-stone-900 border border-stone-700 rounded px-2.5 py-1.5 text-white font-bold"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] text-stone-400 mb-1">
                        ডিসকাউন্ট মূল্য (Discounted Price ৳ — সরাসরি লিখুন)
                      </label>
                      <input
                        type="number"
                        min="0"
                        max={baseProductPrice}
                        value={computedDiscountedPrice}
                        onChange={(e) => {
                          const targetFinal = clampNum(
                            e.target.value,
                            0,
                            baseProductPrice,
                            baseProductPrice
                          );
                          const flatDiff = Math.max(
                            0,
                            baseProductPrice - targetFinal
                          );
                          applyContentChange("pricing.discountEnabled", true);
                          applyContentChange("pricing.discountType", "flat");
                          applyContentChange("pricing.discountValue", flatDiff);
                        }}
                        className="w-full bg-stone-900 border border-emerald-700/70 rounded px-2.5 py-1.5 text-emerald-300 font-bold"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] text-stone-400 mb-1">
                        ডিসকাউন্ট লেবেল
                      </label>
                      <input
                        type="text"
                        value={discountLabel}
                        onChange={(e) =>
                          applyContentChange(
                            "pricing.discountLabel",
                            e.target.value
                          )
                        }
                        placeholder="যেমন: শীতকালীন বিশেষ ছাড়"
                        className="w-full bg-stone-900 border border-stone-700 rounded px-2.5 py-1.5 text-white"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-1.5">
                      <div>
                        <label className="block text-[10px] text-stone-400 mb-1">
                          ছাড়ের ধরন
                        </label>
                        <select
                          value={discountType}
                          onChange={(e) =>
                            applyContentChange(
                              "pricing.discountType",
                              e.target.value
                            )
                          }
                          className="w-full bg-stone-900 border border-stone-700 rounded px-2 py-1.5 text-white"
                        >
                          <option value="flat">টাকা (৳)</option>
                          <option value="percent">শতাংশ (%)</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[10px] text-stone-400 mb-1">
                          ছাড়ের পরিমাণ ({discountType === "percent" ? "%" : "৳"})
                        </label>
                        <input
                          type="number"
                          min="0"
                          max={discountType === "percent" ? 90 : 50000}
                          value={discountValue}
                          onChange={(e) => {
                            applyContentChange("pricing.discountEnabled", true);
                            applyContentChange(
                              "pricing.discountValue",
                              clampNum(
                                e.target.value,
                                0,
                                discountType === "percent" ? 90 : 50000,
                                0
                              )
                            );
                          }}
                          className="w-full bg-stone-900 border border-stone-700 rounded px-2 py-1.5 text-white"
                        />
                      </div>
                    </div>

                    <div className="bg-stone-900 border border-stone-800 rounded p-2 text-[11px] space-y-1">
                      <div className="flex justify-between text-stone-400">
                        <span>আসল মূল্য:</span>
                        <span className="line-through">{baseProductPrice}৳</span>
                      </div>
                      <div className="flex justify-between text-emerald-300 font-bold">
                        <span>ছাড় ({discountLabel || "Discount"}):</span>
                        <span>−{computedDiscountAmount}৳</span>
                      </div>
                      <div className="flex justify-between text-white font-extrabold border-t border-stone-800 pt-1">
                        <span>ডিসকাউন্ট মূল্য:</span>
                        <span>{computedDiscountedPrice}৳</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Add Box প্যানেল */}
                {activeTool === "addBox" && (
                  <div className="space-y-2.5 bg-stone-950/70 p-2.5 rounded-lg border border-stone-800">
                    <div className="font-bold text-[#A2AB34]">
                      নতুন বক্স / লেখা তৈরি করুন
                    </div>

                    <div className="grid grid-cols-3 gap-1 bg-stone-900 p-1 rounded border border-stone-800 text-[10px]">
                      <button
                        type="button"
                        onClick={() => {
                          setNewBoxMode("flatText");
                          setNewBoxImg("");
                          setNewBoxHeight(130);
                        }}
                        style={
                          newBoxMode === "flatText"
                            ? { backgroundColor: "#A2AB34", color: "#1E1B24" }
                            : undefined
                        }
                        className="py-1 rounded font-bold cursor-pointer"
                      >
                        ফ্ল্যাট বক্স
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setNewBoxMode("photoBox");
                          if (!newBoxImg) setNewBoxImg(DEFAULT_PHOTO);
                          setNewBoxHeight(220);
                        }}
                        style={
                          newBoxMode === "photoBox"
                            ? { backgroundColor: "#A2AB34", color: "#1E1B24" }
                            : undefined
                        }
                        className="py-1 rounded font-bold cursor-pointer"
                      >
                        ছবিসহ বক্স
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setNewBoxMode("textBox");
                          setNewBoxImg("");
                          setNewBoxHeight(100);
                        }}
                        style={
                          newBoxMode === "textBox"
                            ? { backgroundColor: "#A2AB34", color: "#1E1B24" }
                            : undefined
                        }
                        className="py-1 rounded font-bold cursor-pointer"
                      >
                        টেক্সট বক্স
                      </button>
                    </div>

                    <input
                      type="text"
                      value={newBoxTitle}
                      onChange={(e) => setNewBoxTitle(e.target.value)}
                      placeholder="শিরোনাম লিখুন"
                      className="w-full bg-stone-900 border border-stone-700 rounded px-2.5 py-1.5 text-white"
                    />
                    <textarea
                      rows={2}
                      value={newBoxDesc}
                      onChange={(e) => setNewBoxDesc(e.target.value)}
                      placeholder="লেখার বক্সে যা রাখতে চান তা লিখুন"
                      className="w-full bg-stone-900 border border-stone-700 rounded px-2.5 py-1.5 text-white"
                    />

                    {newBoxMode === "photoBox" && (
                      <div className="space-y-1.5">
                        <input
                          type="text"
                          value={newBoxImg}
                          onChange={(e) => setNewBoxImg(e.target.value)}
                          placeholder="ছবির URL বা নিচ থেকে আপলোড করুন"
                          className="w-full bg-stone-900 border border-stone-700 rounded px-2.5 py-1.5 text-white"
                        />
                        <label className="block w-full bg-stone-900 hover:bg-stone-800 border border-dashed border-stone-600 rounded px-2 py-1 text-center text-[10px] text-[#A2AB34] font-bold cursor-pointer">
                          📁 বক্সের জন্য ছবি আপলোড
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={async (e) => {
                              const file = e.target.files?.[0];
                              if (!file) return;
                              const compressed =
                                await compressImageToSafeDataUrl(file);
                              setNewBoxImg(compressed);
                              e.target.value = "";
                            }}
                          />
                        </label>
                      </div>
                    )}

                    <select
                      value={newBoxPos}
                      onChange={(e) =>
                        setNewBoxPos(
                          e.target.value as
                            | "afterHero"
                            | "afterGallery"
                            | "beforeFooter"
                        )
                      }
                      className="w-full bg-stone-900 border border-stone-700 rounded px-2.5 py-1.5 text-white"
                    >
                      <option value="afterHero">Hero-এর নিচে</option>
                      <option value="afterGallery">Gallery-এর নিচে</option>
                      <option value="beforeFooter">Footer-এর আগে</option>
                    </select>
                    <div>
                      <div className="flex justify-between mb-1">
                        <span>Corner Radius</span>
                        <span>{newBoxRadius}px</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="48"
                        value={newBoxRadius}
                        onChange={(e) =>
                          setNewBoxRadius(
                            clampNum(e.target.value, 0, 48, 20)
                          )
                        }
                        className="w-full accent-[#A2AB34]"
                      />
                    </div>
                    <div>
                      <div className="flex justify-between mb-1">
                        <span>Width (Max 1150px)</span>
                        <span>{newBoxWidth}px</span>
                      </div>
                      <input
                        type="range"
                        min="120"
                        max="1150"
                        value={newBoxWidth}
                        onChange={(e) =>
                          setNewBoxWidth(
                            clampNum(e.target.value, 120, 1150, 520)
                          )
                        }
                        className="w-full accent-[#A2AB34]"
                      />
                    </div>
                    <div>
                      <div className="flex justify-between mb-1">
                        <span>Height (Max 520px)</span>
                        <span>{newBoxHeight}px</span>
                      </div>
                      <input
                        type="range"
                        min="60"
                        max="520"
                        value={newBoxHeight}
                        onChange={(e) =>
                          setNewBoxHeight(
                            clampNum(e.target.value, 60, 520, 180)
                          )
                        }
                        className="w-full accent-[#A2AB34]"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={handleAddBoxOnPage}
                      style={{ backgroundColor: "#A2AB34", color: "#1E1B24" }}
                      className="w-full py-2 rounded-lg font-extrabold cursor-pointer"
                    >
                      + ওয়েবপেজে যোগ করুন
                    </button>
                  </div>
                )}

                {/* Gallery পূর্ণ কন্ট্রোল প্যানেল */}
                {activeTool === "gallery" && (
                  <div className="space-y-2.5 bg-stone-950/70 p-2.5 rounded-lg border border-stone-800">
                    <div className="font-bold text-[#A2AB34]">
                      Photo Gallery ({galleryImages.length}টি ছবি)
                    </div>

                    <div>
                      <label className="block text-[10px] text-stone-400 mb-1">
                        গ্যালারির ওপরের শিরোনাম
                      </label>
                      <input
                        type="text"
                        value={galleryHeadingText}
                        onChange={(e) =>
                          applyContentChange("galleryTitle", e.target.value)
                        }
                        className="w-full bg-stone-900 border border-stone-700 rounded px-2.5 py-1.5 text-white"
                      />
                    </div>

                    <div>
                      <div className="flex justify-between mb-1">
                        <span>গ্যালারি ফ্রেম সাইজ</span>
                        <span>{galleryCardSize}px</span>
                      </div>
                      <input
                        type="range"
                        min="60"
                        max="360"
                        value={galleryCardSize}
                        onChange={(e) =>
                          applyStyle("galleryCard", "size", Number(e.target.value))
                        }
                        className="w-full accent-[#A2AB34]"
                      />
                    </div>

                    <div>
                      <div className="flex justify-between mb-1">
                        <span>বাইরের ব্যানার উচ্চতা (0 দিলে নাই)</span>
                        <span>{galleryBannerHeight}px</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="560"
                        value={galleryBannerHeight}
                        onChange={(e) =>
                          applyStyle(
                            "galleryBanner",
                            "height",
                            Number(e.target.value)
                          )
                        }
                        className="w-full accent-[#A2AB34]"
                      />
                    </div>

                    <div>
                      <div className="flex justify-between mb-1">
                        <span>গ্যালারি কর্নার শেপ (Radius)</span>
                        <span>
                          {clampNum(
                            getElStyle("galleryCard").borderRadius,
                            0,
                            36,
                            globalBorderRadius
                          )}
                          px
                        </span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="36"
                        value={clampNum(
                          getElStyle("galleryCard").borderRadius,
                          0,
                          36,
                          globalBorderRadius
                        )}
                        onChange={(e) =>
                          applyStyle(
                            "galleryCard",
                            "borderRadius",
                            Number(e.target.value)
                          )
                        }
                        className="w-full accent-[#A2AB34]"
                      />
                    </div>

                    <div className="space-y-1.5 border-t border-stone-800 pt-2">
                      <div className="text-[10px] font-bold text-stone-300">
                        বিদ্যমান ছবিগুলো ম্যানেজ করুন:
                      </div>
                      {galleryImages.map((gItem, idx) => (
                        <div
                          key={idx}
                          className={`flex items-center justify-between gap-1.5 px-2 py-1 rounded border text-[10px] ${
                            editingGalIdx === idx
                              ? "bg-stone-800 border-[#A2AB34] text-white"
                              : "bg-stone-900 border-stone-800 text-stone-300"
                          }`}
                        >
                          <button
                            type="button"
                            onClick={() => {
                              setEditingGalIdx(idx);
                              setCurrentSlide(idx);
                            }}
                            className="truncate text-left flex-1 font-semibold cursor-pointer"
                          >
                            #{idx + 1} {gItem.caption || "ছবি"}
                          </button>
                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              type="button"
                              onClick={() => handleMoveGalleryItem(idx, -1)}
                              disabled={idx === 0}
                              title="উপরে নিন"
                              className="px-1.5 py-0.5 rounded bg-stone-700 disabled:opacity-30 cursor-pointer"
                            >
                              ↑
                            </button>
                            <button
                              type="button"
                              onClick={() => handleMoveGalleryItem(idx, 1)}
                              disabled={idx === galleryImages.length - 1}
                              title="নিচে নিন"
                              className="px-1.5 py-0.5 rounded bg-stone-700 disabled:opacity-30 cursor-pointer"
                            >
                              ↓
                            </button>
                            <button
                              type="button"
                              onClick={() => handleRemoveGalleryItem(idx)}
                              disabled={galleryImages.length <= 1}
                              title="মুছে ফেলুন"
                              className="px-1.5 py-0.5 rounded bg-rose-900/80 text-rose-200 disabled:opacity-30 cursor-pointer"
                            >
                              ✕
                            </button>
                          </div>
                        </div>
                      ))}

                      {activeGalItem && (
                        <div className="bg-stone-900 border border-stone-800 rounded p-2 space-y-1.5 mt-1.5">
                          <div className="text-[10px] font-bold text-[#A2AB34]">
                            ছবি #{editingGalIdx + 1} এডিট
                          </div>
                          <input
                            type="text"
                            value={activeGalItem.caption || ""}
                            onChange={(e) =>
                              applyContentChange(
                                `gallery.${editingGalIdx}.caption`,
                                e.target.value
                              )
                            }
                            placeholder="ক্যাপশন লিখুন"
                            className="w-full bg-stone-950 border border-stone-700 rounded px-2 py-1 text-white"
                          />
                          <div className="flex justify-between text-[10px] text-stone-400">
                            <span>ছবি #{editingGalIdx + 1} Zoom</span>
                            <span>
                              {clampNum(activeGalStyle.zoom, 50, 200, 100)}%
                            </span>
                          </div>
                          <input
                            type="range"
                            min="50"
                            max="200"
                            value={clampNum(activeGalStyle.zoom, 50, 200, 100)}
                            onChange={(e) =>
                              applyStyle(
                                activeGalStyleKey,
                                "zoom",
                                Number(e.target.value)
                              )
                            }
                            className="w-full accent-[#A2AB34]"
                          />
                        </div>
                      )}
                    </div>

                    <div className="border-t border-stone-800 pt-2 space-y-1.5">
                      <div className="text-[10px] font-bold text-[#A2AB34]">
                        নতুন ছবি যুক্ত করুন:
                      </div>
                      <input
                        type="text"
                        value={newGalUrl}
                        onChange={(e) => setNewGalUrl(e.target.value)}
                        placeholder="ছবির URL"
                        className="w-full bg-stone-900 border border-stone-700 rounded px-2.5 py-1.5 text-white"
                      />
                      <div className="grid grid-cols-2 gap-1.5">
                        <input
                          type="text"
                          value={newGalCaption}
                          onChange={(e) => setNewGalCaption(e.target.value)}
                          placeholder="ক্যাপশন"
                          className="bg-stone-900 border border-stone-700 rounded px-2 py-1 text-white"
                        />
                        <select
                          value={newGalIndex}
                          onChange={(e) => setNewGalIndex(e.target.value)}
                          className="bg-stone-900 border border-stone-700 rounded px-2 py-1 text-white"
                        >
                          <option value="end">শেষে</option>
                          {galleryImages.map((_, i) => (
                            <option key={i} value={String(i + 1)}>
                              #{i + 1} পজিশনে
                            </option>
                          ))}
                        </select>
                      </div>
                      <label className="block w-full bg-stone-900 hover:bg-stone-800 border border-dashed border-stone-600 rounded px-2.5 py-1.5 text-center text-[11px] text-[#A2AB34] font-bold cursor-pointer">
                        📁 ছবি আপলোড (Auto Safe Size)
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            const compressed = await compressImageToSafeDataUrl(
                              file
                            );
                            setNewGalUrl(compressed);
                            if (!newGalCaption.trim()) {
                              setNewGalCaption(
                                file.name.replace(/\.[^/.]+$/, "")
                              );
                            }
                            e.target.value = "";
                          }}
                        />
                      </label>
                      <button
                        type="button"
                        onClick={handleAddGalleryItem}
                        style={{ backgroundColor: "#A2AB34", color: "#1E1B24" }}
                        className="w-full py-1.5 rounded font-extrabold cursor-pointer"
                      >
                        + গ্যালারিতে ছবি যুক্ত করুন
                      </button>
                    </div>
                  </div>
                )}

                {/* সিলেক্টেড এলিমেন্টের সম্পূর্ণ Text, Box, Border, Shadow ও Photoshop Filter কন্ট্রোল */}
                {activeTool !== "addBox" &&
                  activeTool !== "gallery" &&
                  activeTool !== "discount" &&
                  activeTool !== "payment" &&
                  currentSelected && (
                    <div className="space-y-2.5 bg-stone-950/75 p-2.5 rounded-lg border border-stone-800">
                      <div className="flex items-center justify-between text-[10px] text-[#A2AB34] font-bold">
                        <span>সিলেক্টেড: {currentSelected.label}</span>
                        <button
                          type="button"
                          onClick={() => {
                            const targetKey = scopedKey(
                              currentSelected.styleKey
                            );
                            setLocalStyles((prev) => {
                              const next = { ...prev };
                              delete next[targetKey];
                              return next;
                            });
                            onUpdateStyle?.(targetKey, "__resetAll", true);
                          }}
                          className="text-rose-300 hover:underline cursor-pointer"
                        >
                          Reset
                        </button>
                      </div>

                      {currentSelected.contentPath && (
                        <div>
                          <label className="block text-[10px] text-stone-400 mb-1">
                            লেখা / ছবির URL পরিবর্তন করুন
                          </label>
                          <input
                            type="text"
                            value={getFieldValue(currentSelected.contentPath, "")}
                            onChange={(e) =>
                              applyContentChange(
                                currentSelected.contentPath!,
                                e.target.value
                              )
                            }
                            className="w-full bg-stone-900 border border-stone-700 rounded px-2.5 py-1.5 text-white"
                          />
                        </div>
                      )}

                      {currentSelected.type === "customBlock" &&
                        currentSelected.customId && (
                          <div className="space-y-1.5 bg-stone-900 border border-stone-800 rounded p-2">
                            <div className="text-[10px] font-bold text-[#A2AB34]">
                              বক্সের লেখা ও ছবি বদলান
                            </div>
                            <input
                              type="text"
                              value={
                                allCustomBlocks.find(
                                  (b) => b.id === currentSelected.customId
                                )?.title || ""
                              }
                              onChange={(e) => {
                                const id = currentSelected.customId!;
                                setLocalCustomBlocks((prev) =>
                                  prev.map((b) =>
                                    b.id === id
                                      ? { ...b, title: e.target.value }
                                      : b
                                  )
                                );
                                onUpdateCustomBlock?.(id, {
                                  title: e.target.value,
                                });
                              }}
                              placeholder="শিরোনাম"
                              className="w-full bg-stone-950 border border-stone-700 rounded px-2 py-1 text-white"
                            />
                            <textarea
                              rows={2}
                              value={
                                allCustomBlocks.find(
                                  (b) => b.id === currentSelected.customId
                                )?.description || ""
                              }
                              onChange={(e) => {
                                const id = currentSelected.customId!;
                                setLocalCustomBlocks((prev) =>
                                  prev.map((b) =>
                                    b.id === id
                                      ? { ...b, description: e.target.value }
                                      : b
                                  )
                                );
                                onUpdateCustomBlock?.(id, {
                                  description: e.target.value,
                                });
                              }}
                              placeholder="বিবরণ"
                              className="w-full bg-stone-950 border border-stone-700 rounded px-2 py-1 text-white"
                            />
                          </div>
                        )}

                      {currentSelected.type === "image" && (
                        <div className="space-y-2 bg-stone-900 border border-stone-800 rounded-lg p-2">
                          <label className="block w-full bg-stone-950 hover:bg-stone-800 border border-dashed border-stone-600 rounded px-2 py-1.5 text-center text-[11px] text-[#A2AB34] font-bold cursor-pointer">
                            📁 নতুন ছবি আপলোড করুন
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={async (e) => {
                                const file = e.target.files?.[0];
                                if (!file || !currentSelected.contentPath) return;
                                const compressed =
                                  await compressImageToSafeDataUrl(file);
                                applyContentChange(
                                  currentSelected.contentPath,
                                  compressed
                                );
                                e.target.value = "";
                              }}
                            />
                          </label>

                          <div className="grid grid-cols-2 gap-1.5">
                            <div>
                              <label className="block text-[10px] text-stone-400 mb-1">
                                Object Position
                              </label>
                              <select
                                value={activeStyle.objectPosition || "center"}
                                onChange={(e) =>
                                  applyStyle(
                                    currentSelected.styleKey,
                                    "objectPosition",
                                    e.target.value
                                  )
                                }
                                className="w-full bg-stone-950 border border-stone-700 rounded px-2 py-1 text-white text-[10px]"
                              >
                                <option value="center">Center</option>
                                <option value="top">Top</option>
                                <option value="bottom">Bottom</option>
                                <option value="left">Left</option>
                                <option value="right">Right</option>
                              </select>
                            </div>
                            <div>
                              <div className="flex justify-between text-[10px] text-stone-400 mb-1">
                                <span>Zoom</span>
                                <span>
                                  {clampNum(activeStyle.zoom, 50, 200, 100)}%
                                </span>
                              </div>
                              <input
                                type="range"
                                min="50"
                                max="200"
                                value={clampNum(
                                  activeStyle.zoom,
                                  50,
                                  200,
                                  100
                                )}
                                onChange={(e) =>
                                  applyStyle(
                                    currentSelected.styleKey,
                                    "zoom",
                                    Number(e.target.value)
                                  )
                                }
                                className="w-full accent-[#A2AB34]"
                              />
                            </div>
                          </div>

                          <div className="border-t border-stone-800 pt-1.5 space-y-1.5">
                            <div className="text-[10px] font-bold text-amber-300">
                              Photo Filters (Photoshop Style)
                            </div>
                            {(
                              [
                                {
                                  key: "brightness",
                                  label: "Brightness",
                                  min: 30,
                                  max: 180,
                                  def: 100,
                                  unit: "%",
                                },
                                {
                                  key: "contrast",
                                  label: "Contrast",
                                  min: 30,
                                  max: 200,
                                  def: 100,
                                  unit: "%",
                                },
                                {
                                  key: "saturate",
                                  label: "Saturation",
                                  min: 0,
                                  max: 220,
                                  def: 100,
                                  unit: "%",
                                },
                                {
                                  key: "grayscale",
                                  label: "Grayscale",
                                  min: 0,
                                  max: 100,
                                  def: 0,
                                  unit: "%",
                                },
                                {
                                  key: "blur",
                                  label: "Blur",
                                  min: 0,
                                  max: 12,
                                  def: 0,
                                  unit: "px",
                                },
                                {
                                  key: "hueRotate",
                                  label: "Hue Rotate",
                                  min: 0,
                                  max: 360,
                                  def: 0,
                                  unit: "°",
                                },
                              ] as const
                            ).map((flt) => {
                              const curVal = clampNum(
                                activeStyle[flt.key],
                                flt.min,
                                flt.max,
                                flt.def
                              );
                              return (
                                <div key={flt.key}>
                                  <div className="flex justify-between text-[10px] text-stone-400">
                                    <span>{flt.label}</span>
                                    <span>
                                      {curVal}
                                      {flt.unit}
                                    </span>
                                  </div>
                                  <input
                                    type="range"
                                    min={flt.min}
                                    max={flt.max}
                                    value={curVal}
                                    onChange={(e) =>
                                      applyStyle(
                                        currentSelected.styleKey,
                                        flt.key,
                                        Number(e.target.value)
                                      )
                                    }
                                    className="w-full accent-[#A2AB34]"
                                  />
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      <div className="bg-stone-900 border border-stone-800 rounded-lg p-2 space-y-2">
                        <div className="text-[10px] font-bold text-[#A2AB34]">
                          Box / Button Color, Border & Shadow
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                          <div>
                            <label className="block text-[10px] text-stone-400 mb-1">
                              BG কালার
                            </label>
                            <input
                              type="color"
                              value={activeStyle.backgroundColor || boxBgColor}
                              onChange={(e) =>
                                applyStyle(
                                  currentSelected.styleKey,
                                  "backgroundColor",
                                  e.target.value
                                )
                              }
                              className="w-full h-7 rounded bg-stone-800 border border-stone-700 cursor-pointer"
                            />
                          </div>

                          <div>
                            <label className="block text-[10px] text-stone-400 mb-1">
                              Text কালার
                            </label>
                            <input
                              type="color"
                              value={activeStyle.color || textColor}
                              onChange={(e) =>
                                applyStyle(
                                  currentSelected.styleKey,
                                  "color",
                                  e.target.value
                                )
                              }
                              className="w-full h-7 rounded bg-stone-800 border border-stone-700 cursor-pointer"
                            />
                          </div>

                          <div>
                            <label className="block text-[10px] text-stone-400 mb-1">
                              Border কালার
                            </label>
                            <input
                              type="color"
                              value={activeStyle.borderColor || primaryColor}
                              onChange={(e) => {
                                applyStyle(
                                  currentSelected.styleKey,
                                  "borderColor",
                                  e.target.value
                                );
                                if (!activeStyle.borderWidth) {
                                  applyStyle(
                                    currentSelected.styleKey,
                                    "borderWidth",
                                    2
                                  );
                                }
                              }}
                              className="w-full h-7 rounded bg-stone-800 border border-stone-700 cursor-pointer"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-1.5">
                          <div>
                            <div className="flex justify-between text-[10px] text-stone-400">
                              <span>Border Width</span>
                              <span>
                                {clampNum(activeStyle.borderWidth, 0, 12, 0)}px
                              </span>
                            </div>
                            <input
                              type="range"
                              min="0"
                              max="12"
                              value={clampNum(
                                activeStyle.borderWidth,
                                0,
                                12,
                                0
                              )}
                              onChange={(e) =>
                                applyStyle(
                                  currentSelected.styleKey,
                                  "borderWidth",
                                  Number(e.target.value)
                                )
                              }
                              className="w-full accent-[#A2AB34]"
                            />
                          </div>

                          <div>
                            <label className="block text-[10px] text-stone-400 mb-0.5">
                              Box Shadow
                            </label>
                            <select
                              value={activeStyle.boxShadow || "default"}
                              onChange={(e) =>
                                applyStyle(
                                  currentSelected.styleKey,
                                  "boxShadow",
                                  e.target.value === "default"
                                    ? undefined
                                    : e.target.value
                                )
                              }
                              className="w-full bg-stone-950 border border-stone-700 rounded px-1.5 py-1 text-white text-[10px]"
                            >
                              <option value="default">Default Shadow</option>
                              <option value="none">No Shadow</option>
                              <option value="0 6px 16px rgba(0,0,0,0.12)">
                                Soft Shadow
                              </option>
                              <option value="0 18px 34px rgba(115,56,94,0.25)">
                                Deep Elevated
                              </option>
                            </select>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-1.5">
                        <div className="col-span-2">
                          <select
                            value={activeStyle.fontFamily || "inherit"}
                            onChange={(e) =>
                              applyStyle(
                                currentSelected.styleKey,
                                "fontFamily",
                                e.target.value
                              )
                            }
                            className="w-full bg-stone-900 border border-stone-700 rounded px-2 py-1.5 text-white font-semibold"
                          >
                            {FONT_CHOICES.map((f) => (
                              <option key={f.value} value={f.value}>
                                {f.label}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <input
                            type="number"
                            min="10"
                            max="64"
                            value={clampNum(activeStyle.fontSize, 10, 64, 17)}
                            onChange={(e) =>
                              applyStyle(
                                currentSelected.styleKey,
                                "fontSize",
                                Number(e.target.value)
                              )
                            }
                            title="Font Size (Max 64px)"
                            className="w-full bg-stone-900 border border-stone-700 rounded px-2 py-1.5 text-white text-center font-bold"
                          />
                        </div>
                      </div>

                      <div className="flex items-center justify-between gap-1 bg-stone-900 p-1 rounded border border-stone-800">
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() =>
                              applyStyle(
                                currentSelected.styleKey,
                                "bold",
                                !activeStyle.bold
                              )
                            }
                            title="Bold (Ctrl+B)"
                            className={`w-7 h-7 rounded font-black text-xs cursor-pointer ${
                              activeStyle.bold
                                ? "bg-[#A2AB34] text-stone-950"
                                : "hover:bg-stone-800 text-stone-200"
                            }`}
                          >
                            B
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              applyStyle(
                                currentSelected.styleKey,
                                "italic",
                                !activeStyle.italic
                              )
                            }
                            title="Italic (Ctrl+I)"
                            className={`w-7 h-7 rounded italic font-serif text-xs cursor-pointer ${
                              activeStyle.italic
                                ? "bg-[#A2AB34] text-stone-950"
                                : "hover:bg-stone-800 text-stone-200"
                            }`}
                          >
                            I
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              applyStyle(
                                currentSelected.styleKey,
                                "underline",
                                !activeStyle.underline
                              )
                            }
                            title="Underline (Ctrl+U)"
                            className={`w-7 h-7 rounded underline text-xs cursor-pointer ${
                              activeStyle.underline
                                ? "bg-[#A2AB34] text-stone-950"
                                : "hover:bg-stone-800 text-stone-200"
                            }`}
                          >
                            U
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              applyStyle(
                                currentSelected.styleKey,
                                "lineThrough",
                                !activeStyle.lineThrough
                              )
                            }
                            title="Strikethrough"
                            className={`w-7 h-7 rounded line-through text-xs cursor-pointer ${
                              activeStyle.lineThrough
                                ? "bg-[#A2AB34] text-stone-950"
                                : "hover:bg-stone-800 text-stone-200"
                            }`}
                          >
                            ab
                          </button>
                        </div>

                        <div className="flex items-center gap-1">
                          <label
                            title="Highlight / BG Color"
                            className="w-7 h-7 rounded bg-stone-800 border border-stone-700 flex items-center justify-center cursor-pointer relative overflow-hidden"
                          >
                            <span className="text-[10px] font-bold text-amber-300">
                              HL
                            </span>
                            <input
                              type="color"
                              value={activeStyle.backgroundColor || "#FEF08A"}
                              onChange={(e) =>
                                applyStyle(
                                  currentSelected.styleKey,
                                  "backgroundColor",
                                  e.target.value
                                )
                              }
                              className="opacity-0 absolute inset-0 cursor-pointer"
                            />
                          </label>
                          <label
                            title="Text Color"
                            className="w-7 h-7 rounded bg-stone-800 border border-stone-700 flex items-center justify-center cursor-pointer relative overflow-hidden"
                          >
                            <span className="text-[11px] font-black text-rose-400">
                              A
                            </span>
                            <input
                              type="color"
                              value={activeStyle.color || "#73385E"}
                              onChange={(e) =>
                                applyStyle(
                                  currentSelected.styleKey,
                                  "color",
                                  e.target.value
                                )
                              }
                              className="opacity-0 absolute inset-0 cursor-pointer"
                            />
                          </label>
                        </div>
                      </div>

                      <div>
                        <div className="text-[10px] text-stone-400 mb-1">
                          Alignment (বাম / মাঝ / ডান)
                        </div>
                        <div className="grid grid-cols-4 gap-1 bg-stone-900 p-1 rounded border border-stone-800">
                          {(
                            [
                              { val: "left", lbl: "বাম (L)" },
                              { val: "center", lbl: "মাঝ (C)" },
                              { val: "right", lbl: "ডান (R)" },
                              { val: "justify", lbl: "পূর্ণ (J)" },
                            ] as const
                          ).map((al) => (
                            <button
                              key={al.val}
                              type="button"
                              onClick={() =>
                                applyStyle(
                                  currentSelected.styleKey,
                                  "textAlign",
                                  al.val
                                )
                              }
                              style={
                                (activeStyle.textAlign || "left") === al.val
                                  ? {
                                      backgroundColor: "#A2AB34",
                                      color: "#1E1B24",
                                    }
                                  : undefined
                              }
                              className={`py-1 rounded text-[10px] font-bold cursor-pointer ${
                                (activeStyle.textAlign || "left") === al.val
                                  ? ""
                                  : "text-stone-300 hover:bg-stone-800"
                              }`}
                            >
                              {al.lbl}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between mb-1">
                          <span>Width (Max 1150px)</span>
                          <span>{activeStyle.width || "Auto"}px</span>
                        </div>
                        <input
                          type="range"
                          min="60"
                          max="1150"
                          value={clampNum(activeStyle.width, 60, 1150, 240)}
                          onChange={(e) =>
                            applyResize(
                              currentSelected.styleKey,
                              Number(e.target.value),
                              undefined
                            )
                          }
                          className="w-full accent-[#A2AB34]"
                        />
                      </div>

                      <div>
                        <div className="flex justify-between mb-1">
                          <span>Height (Max 650px)</span>
                          <span>{activeStyle.height || "Auto"}px</span>
                        </div>
                        <input
                          type="range"
                          min="32"
                          max="650"
                          value={clampNum(activeStyle.height, 32, 650, 90)}
                          onChange={(e) =>
                            applyResize(
                              currentSelected.styleKey,
                              undefined,
                              Number(e.target.value)
                            )
                          }
                          className="w-full accent-[#A2AB34]"
                        />
                      </div>

                      <div>
                        <div className="flex justify-between mb-1">
                          <span>Padding (Max 48px)</span>
                          <span>
                            {clampNum(
                              activeStyle.padding,
                              0,
                              48,
                              globalBoxPadding
                            )}
                            px
                          </span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="48"
                          value={clampNum(
                            activeStyle.padding,
                            0,
                            48,
                            globalBoxPadding
                          )}
                          onChange={(e) =>
                            applyStyle(
                              currentSelected.styleKey,
                              "padding",
                              Number(e.target.value)
                            )
                          }
                          className="w-full accent-[#A2AB34]"
                        />
                      </div>

                      <div>
                        <div className="flex justify-between mb-1">
                          <span>Corner Shape (Radius)</span>
                          <span>
                            {clampNum(
                              activeStyle.borderRadius,
                              0,
                              48,
                              globalBorderRadius
                            )}
                            px
                          </span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="48"
                          value={clampNum(
                            activeStyle.borderRadius,
                            0,
                            48,
                            globalBorderRadius
                          )}
                          onChange={(e) =>
                            applyStyle(
                              currentSelected.styleKey,
                              "borderRadius",
                              Number(e.target.value)
                            )
                          }
                          className="w-full accent-[#A2AB34]"
                        />
                      </div>
                    </div>
                  )}
              </div>
            </div>
          </div>
        )}

        {/* Hero Section */}
        <section
          style={{
            paddingTop: `${isMobileSim ? 20 : globalSectionPaddingY}px`,
            paddingBottom: `${isMobileSim ? 20 : globalSectionPaddingY}px`,
          }}
          className="container mx-auto px-3.5 max-w-6xl"
        >
          <div
            className={`grid ${
              isMobileSim ? "grid-cols-1 gap-4" : "md:grid-cols-2 gap-10"
            } items-center`}
          >
            <div className={isMobileSim ? "space-y-3" : ""}>
              <span
                onClick={(e) =>
                  handleSelect(e, {
                    id: "hero-badge",
                    label: "Hero Badge",
                    type: "text",
                    contentPath: "hero.badge",
                    styleKey: "heroBadge",
                  })
                }
                style={{
                  ...getTextCss("heroBadge", 12, textColor),
                  backgroundColor:
                    getElStyle("heroBadge").backgroundColor || "#F3EFE6",
                  borderRadius: `${globalBorderRadius}px`,
                }}
                className={`inline-block px-3.5 py-1 font-medium border border-black/10 ${
                  isMobileSim ? "mb-1" : "mb-6"
                } ${highlightClass("hero-badge")}`}
              >
                {heroBadge}
              </span>

              <h1
                onClick={(e) =>
                  handleSelect(e, {
                    id: "hero-title",
                    label: "Hero শিরোনাম",
                    type: "text",
                    contentPath: "hero.title",
                    styleKey: "heroTitle",
                  })
                }
                style={{
                  lineHeight: 1.18,
                  ...getTextCss(
                    "heroTitle",
                    isMobileSim ? 24 : globalHeroTitleSize,
                    primaryColor
                  ),
                }}
                className={`font-extrabold ${
                  isMobileSim ? "mb-1" : "mb-6"
                } ${highlightClass("hero-title")}`}
              >
                {heroTitle}
              </h1>

              <div
                className={`flex flex-wrap ${
                  isMobileSim ? "gap-1.5 mb-2 justify-start" : "gap-2.5 mb-6"
                }`}
              >
                {heroTags.map((tag: string, i: number) => {
                  const cleanTag = String(tag).replace(/^✓\s*/, "");
                  const stKey = `heroTagBox_${i}`;
                  const st = getElStyle(stKey);
                  return (
                    <div
                      key={i}
                      onClick={(e) =>
                        handleSelect(e, {
                          id: `hero-tag-${i}`,
                          label: `ট্যাগ বক্স #${i + 1}`,
                          type: "text",
                          contentPath: `hero.tags.${i}`,
                          styleKey: stKey,
                        })
                      }
                      style={{
                        ...getTextCss(
                          stKey,
                          isMobileSim ? 11 : 14,
                          textColor
                        ),
                        backgroundColor: st.backgroundColor || "#F3EFE6",
                        borderColor: st.borderColor || "rgba(0,0,0,0.12)",
                        borderWidth: st.borderColor ? "2px" : "1px",
                        borderStyle: "solid",
                        borderRadius: `${
                          st.borderRadius ??
                          Math.max(8, globalBorderRadius * 0.5)
                        }px`,
                        boxShadow: st.boxShadow || "none",
                      }}
                      className={`font-medium ${
                        isMobileSim ? "px-2.5 py-1" : "px-3.5 py-2"
                      } inline-flex items-center justify-center relative shrink-0 ${highlightClass(
                        `hero-tag-${i}`
                      )}`}
                    >
                      <span className="whitespace-nowrap">✓ {cleanTag}</span>
                    </div>
                  );
                })}
              </div>

              <p
                onClick={(e) =>
                  handleSelect(e, {
                    id: "hero-desc",
                    label: "Hero বিবরণ",
                    type: "text",
                    contentPath: "hero.description",
                    styleKey: "heroDesc",
                  })
                }
                style={getTextCss(
                  "heroDesc",
                  isMobileSim ? 14 : globalHeroDescSize,
                  mutedTextColor
                )}
                className={`leading-relaxed ${
                  isMobileSim ? "mb-2" : "mb-8"
                } ${highlightClass("hero-desc")}`}
              >
                {heroDescription}
              </p>

              <div
                className={`flex flex-wrap ${isMobileSim ? "gap-2" : "gap-3.5"}`}
              >
                {(() => {
                  const st = getElStyle("btnOrder");
                  const w = st.width || 180;
                  const h = st.height || 48;
                  return (
                    <a
                      href={isEditMode ? undefined : "#order"}
                      onClick={(e) =>
                        handleSelect(e, {
                          id: "btn-order",
                          label: "অর্ডার করতে চাই বাটন",
                          type: "button",
                          styleKey: "btnOrder",
                        })
                      }
                      style={{
                        backgroundColor: st.backgroundColor || accentColor,
                        color: st.color || "#FFFFFF",
                        borderColor: st.borderColor || undefined,
                        borderWidth: st.borderColor ? "2px" : undefined,
                        borderStyle: st.borderColor ? "solid" : undefined,
                        fontSize: `${clampNum(
                          st.fontSize,
                          11,
                          32,
                          isMobileSim ? 13 : 16
                        )}px`,
                        fontFamily: st.fontFamily || "inherit",
                        fontWeight: st.bold ? 800 : 700,
                        fontStyle: st.italic ? "italic" : "normal",
                        width: st.width
                          ? `${clampNum(st.width, 80, 420, 180)}px`
                          : undefined,
                        height: st.height
                          ? `${clampNum(st.height, 36, 120, 48)}px`
                          : undefined,
                        borderRadius: `${
                          st.borderRadius ??
                          Math.max(10, globalBorderRadius * 0.55)
                        }px`,
                        boxShadow: st.boxShadow || globalBoxShadow,
                      }}
                      className={`hover:opacity-95 ${
                        isMobileSim ? "px-4 py-2.5" : "px-7 py-3.5"
                      } transform hover:-translate-y-0.5 transition-all duration-200 flex items-center gap-1.5 cursor-pointer relative shrink-0 ${highlightClass(
                        "btn-order"
                      )}`}
                    >
                      <DynamicIcon
                        name="ShoppingCart"
                        className={isMobileSim ? "w-4 h-4" : "w-5 h-5"}
                      />
                      <span>অর্ডার করতে চাই</span>
                      {isEditMode && (
                        <div
                          onMouseDown={(e) => handleDragResize(e, "btnOrder", w, h)}
                          title="টেনে বাটন বড়-ছোট করুন"
                          className="w-4 h-4 rounded bg-black/35 text-white text-[10px] flex items-center justify-center cursor-nwse-resize select-none"
                        >
                          ↘
                        </div>
                      )}
                    </a>
                  );
                })()}

                {(() => {
                  const st = getElStyle("btnMore");
                  const w = st.width || 160;
                  const h = st.height || 48;
                  return (
                    <a
                      href={isEditMode ? undefined : "#details"}
                      onClick={(e) =>
                        handleSelect(e, {
                          id: "btn-more",
                          label: "আরও জানুন বাটন",
                          type: "button",
                          styleKey: "btnMore",
                        })
                      }
                      style={{
                        backgroundColor: st.backgroundColor || primaryColor,
                        color: st.color || "#FFFFFF",
                        borderColor: st.borderColor || undefined,
                        borderWidth: st.borderColor ? "2px" : undefined,
                        borderStyle: st.borderColor ? "solid" : undefined,
                        fontSize: `${clampNum(
                          st.fontSize,
                          11,
                          32,
                          isMobileSim ? 13 : 16
                        )}px`,
                        fontFamily: st.fontFamily || "inherit",
                        fontWeight: st.bold ? 800 : 700,
                        fontStyle: st.italic ? "italic" : "normal",
                        width: st.width
                          ? `${clampNum(st.width, 80, 420, 160)}px`
                          : undefined,
                        height: st.height
                          ? `${clampNum(st.height, 36, 120, 48)}px`
                          : undefined,
                        borderRadius: `${
                          st.borderRadius ??
                          Math.max(10, globalBorderRadius * 0.55)
                        }px`,
                        boxShadow: st.boxShadow || globalBoxShadow,
                      }}
                      className={`hover:opacity-95 ${
                        isMobileSim ? "px-4 py-2.5" : "px-7 py-3.5"
                      } transform hover:-translate-y-0.5 transition-all duration-200 flex items-center gap-1.5 cursor-pointer relative shrink-0 ${highlightClass(
                        "btn-more"
                      )}`}
                    >
                      <span>আরও জানুন ↓</span>
                      {isEditMode && (
                        <div
                          onMouseDown={(e) => handleDragResize(e, "btnMore", w, h)}
                          title="টেনে বাটন বড়-ছোট করুন"
                          className="w-4 h-4 rounded bg-black/35 text-white text-[10px] flex items-center justify-center cursor-nwse-resize select-none"
                        >
                          ↘
                        </div>
                      )}
                    </a>
                  );
                })()}
              </div>
            </div>

            {(() => {
              const st = getElStyle("heroImage");
              const w = st.width || (isMobileSim ? 345 : 540);
              const h = st.height || (isMobileSim ? 215 : globalHeroImageHeight);
              return (
                <div
                  onClick={(e) =>
                    handleSelect(e, {
                      id: "hero-image",
                      label: "Hero ছবি",
                      type: "image",
                      contentPath: "hero.imageUrl",
                      styleKey: "heroImage",
                    })
                  }
                  style={getImageWrapperCss(
                    "heroImage",
                    isMobileSim ? 215 : globalHeroImageHeight,
                    globalBorderRadius,
                    globalImageShadow
                  )}
                  className={`relative overflow-hidden ${highlightClass(
                    "hero-image"
                  )}`}
                >
                  {renderZoomOverlay("heroImage")}
                  <Image
                    src={heroImageUrl}
                    alt="Product Hero"
                    fill
                    sizes="(max-width: 768px) 100vw, 50vw"
                    style={getImageFilterCss("heroImage")}
                    className="object-cover transition-transform duration-200"
                    priority
                    unoptimized={isPreview}
                  />
                  {isEditMode && (
                    <div
                      onMouseDown={(e) =>
                        handleDragResize(e, "heroImage", w, h)
                      }
                      title="টেনে ছবি বড়-ছোট করুন"
                      className="absolute bottom-2.5 right-2.5 z-30 w-6 h-6 rounded-md bg-[#73385E] text-white text-xs flex items-center justify-center cursor-nwse-resize shadow"
                    >
                      ↘
                    </div>
                  )}
                </div>
              );
            })()}
          </div>
        </section>

        {renderCustomBlocks("afterHero")}

        {/* Features Section */}
        {content?.features && content.features.length > 0 && (
          <section
            onClick={(e) =>
              handleSelect(e, {
                id: "features-sec",
                label: "Features ব্যানার সেকশন",
                type: "box",
                styleKey: "featuresBanner",
              })
            }
            style={{
              paddingTop: `${isMobileSim ? 20 : globalSectionPaddingY * 0.8}px`,
              paddingBottom: `${
                isMobileSim ? 20 : globalSectionPaddingY * 0.8
              }px`,
              backgroundColor:
                getElStyle("featuresBanner").backgroundColor || primaryColor,
            }}
            className={`shadow-inner ${highlightClass("features-sec")}`}
          >
            <div className="container mx-auto px-3.5 max-w-6xl">
              <div className="flex flex-wrap items-stretch justify-center gap-3">
                {content.features.map((feature: any, i: number) => {
                  const cardKey = `featureCard_${i}`;
                  const st = getElStyle(cardKey);
                  const w = st.width || 240;
                  const h = st.height || 150;
                  return (
                    <div
                      key={i}
                      onClick={(e) =>
                        handleSelect(e, {
                          id: `feat-card-${i}`,
                          label: `ফিচার কার্ড #${i + 1}`,
                          type: "box",
                          contentPath: `features.${i}.title`,
                          styleKey: cardKey,
                        })
                      }
                      style={getBoxCss(
                        cardKey,
                        "rgba(0,0,0,0.16)",
                        globalBorderRadius,
                        isMobileSim
                          ? 12
                          : Math.max(18, globalBoxPadding * 0.85),
                        globalBoxShadow
                      )}
                      className={`border border-white/25 flex flex-col items-center text-center transform hover:-translate-y-1 transition-all duration-200 relative shrink-0 ${highlightClass(
                        `feat-card-${i}`
                      )}`}
                    >
                      <DynamicIcon
                        name={feature.icon}
                        className={
                          isMobileSim ? "w-7 h-7 mb-2" : "w-10 h-10 mb-3"
                        }
                        style={{ color: accentColor }}
                        strokeWidth={1.6}
                      />
                      <h3
                        onClick={(e) =>
                          handleSelect(e, {
                            id: `feat-title-${i}`,
                            label: `ফিচার কার্ড #${i + 1} শিরোনাম`,
                            type: "text",
                            contentPath: `features.${i}.title`,
                            styleKey: `featTitle_${i}`,
                          })
                        }
                        style={getTextCss(
                          `featTitle_${i}`,
                          isMobileSim ? 14 : 18,
                          st.color || "#F8F5EE",
                          "center"
                        )}
                        className={`font-bold mb-1 ${highlightClass(
                          `feat-title-${i}`
                        )}`}
                      >
                        {getFieldValue(`features.${i}.title`, feature.title)}
                      </h3>
                      <p
                        onClick={(e) =>
                          handleSelect(e, {
                            id: `feat-sub-${i}`,
                            label: `ফিচার কার্ড #${i + 1} বিবরণ`,
                            type: "text",
                            contentPath: `features.${i}.subtitle`,
                            styleKey: `featSub_${i}`,
                          })
                        }
                        style={getTextCss(
                          `featSub_${i}`,
                          isMobileSim ? 12 : 14,
                          st.color || "#FFFFFF",
                          "center"
                        )}
                        className={`font-medium ${highlightClass(
                          `feat-sub-${i}`
                        )}`}
                      >
                        {getFieldValue(`features.${i}.subtitle`, feature.subtitle)}
                      </p>
                      {isEditMode && (
                        <div
                          onMouseDown={(e) => handleDragResize(e, cardKey, w, h)}
                          title="টেনে কার্ড বড়-ছোট করুন"
                          className="absolute bottom-2 right-2 w-5 h-5 rounded bg-black/40 text-white text-[10px] flex items-center justify-center cursor-nwse-resize select-none"
                        >
                          ↘
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </section>
        )}

        {/* Photo Gallery */}
        {galleryImages.length > 0 && (
          <section
            id="gallery"
            style={{
              marginTop: `${isMobileSim ? 18 : 28}px`,
              marginBottom: `${isMobileSim ? 18 : 28}px`,
              paddingTop: `${isMobileSim ? 12 : 18}px`,
              paddingBottom: `${isMobileSim ? 12 : 18}px`,
            }}
            className="container mx-auto px-2 max-w-6xl"
          >
            <div className="mb-4 text-center">
              <h2
                onClick={(e) =>
                  handleSelect(e, {
                    id: "gallery-heading",
                    label: "গ্যালারির ওপরের শিরোনাম",
                    type: "text",
                    contentPath: "galleryTitle",
                    styleKey: "galleryTitle",
                  })
                }
                style={getTextCss(
                  "galleryTitle",
                  isMobileSim ? 18 : 24,
                  primaryColor,
                  "center"
                )}
                className={`inline-block font-extrabold ${highlightClass(
                  "gallery-heading"
                )}`}
              >
                {galleryHeadingText}
              </h2>
            </div>

            <div
              onMouseEnter={() => setIsPaused(true)}
              onMouseLeave={() => setIsPaused(false)}
              onClick={(e) =>
                handleSelect(e, {
                  id: "gallery-sec",
                  label: "ফটো গ্যালারি ব্যানার ও ফ্রেম",
                  type: "gallery",
                  styleKey: "galleryCard",
                })
              }
              style={{
                boxShadow:
                  galleryBannerHeight <= 0 ? "none" : globalImageShadow,
                backgroundColor:
                  galleryBannerHeight <= 0
                    ? "transparent"
                    : galleryBannerStyle.backgroundColor || "transparent",
                borderRadius: `${globalBorderRadius}px`,
                padding: "0px",
                width: galleryBannerWidth
                  ? `${galleryBannerWidth}px`
                  : undefined,
                maxWidth: "100%",
                height:
                  galleryBannerHeight <= 0
                    ? "auto"
                    : `${Math.max(0, galleryBannerHeight)}px`,
                minHeight: "0px",
              }}
              className={`relative mx-auto flex flex-col justify-center overflow-visible ${
                galleryBannerHeight <= 0
                  ? "border-0"
                  : "border border-[#A2AB34]/30"
              } ${highlightClass("gallery-sec")}`}
            >
              <div
                style={{
                  minHeight: `${Math.max(
                    galleryCardSize + 24,
                    galleryBannerHeight > 0 ? galleryBannerHeight : 180
                  )}px`,
                }}
                className="relative w-full flex-1 flex items-center justify-center overflow-visible py-2"
              >
                {galleryImages.map((img, idx) => {
                  const style = getCardStyle(idx);
                  const itemKey = `galleryItem_${idx}`;
                  const itemSt = getElStyle(itemKey);
                  const perItemSize = clampNum(
                    itemSt.size,
                    50,
                    360,
                    galleryCardSize
                  );
                  const perItemZoom = clampNum(itemSt.zoom, 50, 200, 100);
                  return (
                    <div
                      key={`${img.url}-${idx}`}
                      onClick={(e) => {
                        if (isEditMode) {
                          e.stopPropagation();
                          setEditingGalIdx(idx);
                          const sel: SelectedElement = {
                            id: "gallery-sec",
                            label: `গ্যালারি ছবি #${idx + 1}`,
                            type: "gallery",
                            contentPath: `gallery.${idx}.caption`,
                            styleKey: itemKey,
                          };
                          setActiveEl(sel);
                          setActiveTool("gallery");
                          onSelectElement?.(sel);
                        } else {
                          setCurrentSlide(idx);
                        }
                      }}
                      style={{
                        ...style,
                        width: `${perItemSize}px`,
                        height: `${perItemSize}px`,
                      }}
                      className="absolute top-1/2 left-1/2 border-4 border-white shadow-2xl transition-all duration-300 ease-out cursor-pointer bg-black/20 overflow-hidden"
                    >
                      {renderZoomOverlay(itemKey)}
                      <Image
                        src={img.url || DEFAULT_PHOTO}
                        alt={img.caption || `Gallery Photo ${idx + 1}`}
                        fill
                        style={{
                          filter: buildPhotoshopFilter(itemSt),
                          transform: `scale(${perItemZoom / 100})`,
                          transformOrigin: "center center",
                        }}
                        className="object-cover transition-transform duration-200"
                        unoptimized={isPreview}
                      />
                    </div>
                  );
                })}
                {galleryImages.length > 1 && (
                  <>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        prevSlide();
                      }}
                      aria-label="Previous Gallery Photo"
                      className="absolute left-2 md:left-4 top-1/2 -translate-y-1/2 z-40 bg-white/90 hover:bg-white text-gray-900 p-2 md:p-2.5 rounded-full shadow-lg transition-all cursor-pointer"
                    >
                      <DynamicIcon name="ChevronLeft" className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        nextSlide();
                      }}
                      aria-label="Next Gallery Photo"
                      className="absolute right-2 md:right-4 top-1/2 -translate-y-1/2 z-40 bg-white/90 hover:bg-white text-gray-900 p-2 md:p-2.5 rounded-full shadow-lg transition-all cursor-pointer"
                    >
                      <DynamicIcon name="ChevronRight" className="w-4 h-4" />
                    </button>
                  </>
                )}
              </div>
            </div>
          </section>
        )}

        {/* Details Section */}
        <section
          id="details"
          style={{
            paddingTop: `${isMobileSim ? 22 : globalSectionPaddingY}px`,
            paddingBottom: `${isMobileSim ? 22 : globalSectionPaddingY}px`,
          }}
          className="container mx-auto px-3.5 max-w-6xl"
        >
          <div
            className={`grid grid-cols-1 ${
              isMobileSim ? "gap-5" : "md:grid-cols-2 gap-6 md:gap-8"
            } items-stretch`}
          >
            {(() => {
              const boxSt = getElStyle("detailsBox");
              const bw = boxSt.width || 520;
              const bh = boxSt.height || 420;
              return (
                <div
                  onClick={(e) =>
                    handleSelect(e, {
                      id: "details-box-l",
                      label: "Details বাম বক্স",
                      type: "box",
                      styleKey: "detailsBox",
                    })
                  }
                  style={getBoxCss(
                    "detailsBox",
                    boxBgColor,
                    globalBorderRadius,
                    isMobileSim ? 16 : globalBoxPadding,
                    globalBoxShadow
                  )}
                  className={`border border-black/10 relative w-full ${highlightClass(
                    "details-box-l"
                  )}`}
                >
                  {details.imageUrl && (
                    <div
                      onClick={(e) =>
                        handleSelect(e, {
                          id: "details-img",
                          label: "Details ছবি",
                          type: "image",
                          contentPath: "details.imageUrl",
                          styleKey: "detailsImage",
                        })
                      }
                      style={getImageWrapperCss(
                        "detailsImage",
                        isMobileSim ? 195 : 310,
                        Math.max(10, globalBorderRadius * 0.7),
                        globalImageShadow
                      )}
                      className={`relative overflow-hidden mb-5 ${highlightClass(
                        "details-img"
                      )}`}
                    >
                      {renderZoomOverlay("detailsImage")}
                      <Image
                        src={getFieldValue("details.imageUrl", details.imageUrl)}
                        alt="Details"
                        fill
                        sizes="(max-width: 768px) 100vw, 50vw"
                        style={getImageFilterCss("detailsImage")}
                        className="object-cover transition-transform duration-200"
                        unoptimized={isPreview}
                      />
                    </div>
                  )}

                  {details.text1 && (
                    <p
                      onClick={(e) =>
                        handleSelect(e, {
                          id: "details-text-1",
                          label: "Details প্রথম লেখা",
                          type: "text",
                          contentPath: "details.text1",
                          styleKey: "detailsText1",
                        })
                      }
                      style={getTextCss(
                        "detailsText1",
                        isMobileSim ? 14 : 17,
                        getElStyle("detailsBox").color || mutedTextColor
                      )}
                      className={`mb-4 leading-relaxed ${highlightClass(
                        "details-text-1"
                      )}`}
                    >
                      {getFieldValue("details.text1", details.text1)}
                    </p>
                  )}

                  {details.text2 && (
                    <div
                      onClick={(e) =>
                        handleSelect(e, {
                          id: "details-text-2",
                          label: "Details দ্বিতীয় লেখা",
                          type: "text",
                          contentPath: "details.text2",
                          styleKey: "detailsText2",
                        })
                      }
                      style={{
                        borderRadius: `${Math.max(
                          8,
                          globalBorderRadius * 0.6
                        )}px`,
                      }}
                      className={`border border-dashed border-[#73385E]/30 p-3.5 bg-[#A2AB34]/10 ${highlightClass(
                        "details-text-2"
                      )}`}
                    >
                      <p
                        style={getTextCss(
                          "detailsText2",
                          isMobileSim ? 15 : 18,
                          primaryColor,
                          "center"
                        )}
                        className="font-semibold"
                      >
                        {getFieldValue("details.text2", details.text2)}
                      </p>
                    </div>
                  )}

                  {isEditMode && (
                    <div
                      onMouseDown={(e) =>
                        handleDragResize(e, "detailsBox", bw, bh)
                      }
                      title="টেনে বাম বক্স বড়-ছোট করুন"
                      className="absolute bottom-2.5 right-2.5 w-6 h-6 rounded-md bg-[#73385E] text-white text-xs flex items-center justify-center cursor-nwse-resize select-none shadow"
                    >
                      ↘
                    </div>
                  )}
                </div>
              );
            })()}

            {(() => {
              const boxRSt = getElStyle("detailsPointsBox");
              const rbw = boxRSt.width || 520;
              const rbh = boxRSt.height || 420;
              const btnSt = getElStyle("detailsOrderBtn");
              return (
                <div
                  onClick={(e) =>
                    handleSelect(e, {
                      id: "details-box-r",
                      label: "Details ডান বক্স",
                      type: "box",
                      styleKey: "detailsPointsBox",
                    })
                  }
                  style={getBoxCss(
                    "detailsPointsBox",
                    boxBgColor,
                    globalBorderRadius,
                    isMobileSim ? 16 : globalBoxPadding,
                    globalBoxShadow
                  )}
                  className={`border border-black/10 flex flex-col justify-between relative w-full ${highlightClass(
                    "details-box-r"
                  )}`}
                >
                  <div>
                    {details.pointsTitle && (
                      <h2
                        onClick={(e) =>
                          handleSelect(e, {
                            id: "details-points-title",
                            label: "Details পয়েন্ট শিরোনাম",
                            type: "text",
                            contentPath: "details.pointsTitle",
                            styleKey: "detailsPointsTitle",
                          })
                        }
                        style={getTextCss(
                          "detailsPointsTitle",
                          isMobileSim ? 20 : globalSectionTitleSize,
                          getElStyle("detailsPointsBox").color || primaryColor
                        )}
                        className={`font-bold mb-6 ${highlightClass(
                          "details-points-title"
                        )}`}
                      >
                        {getFieldValue("details.pointsTitle", details.pointsTitle)}
                      </h2>
                    )}

                    <div className="space-y-5">
                      {details.points?.map((point: any, i: number) => (
                        <div key={i} className="flex gap-3.5">
                          <div className="mt-1">
                            <DynamicIcon
                              name="CheckCircle2"
                              className="w-5 h-5"
                              style={{ color: accentColor }}
                            />
                          </div>
                          <div>
                            <h3
                              onClick={(e) =>
                                handleSelect(e, {
                                  id: `details-pt-title-${i}`,
                                  label: `Details পয়েন্ট #${i + 1} শিরোনাম`,
                                  type: "text",
                                  contentPath: `details.points.${i}.title`,
                                  styleKey: "detailsPointTitle",
                                })
                              }
                              style={getTextCss(
                                "detailsPointTitle",
                                isMobileSim ? 16 : 20,
                                getElStyle("detailsPointsBox").color ||
                                  primaryColor
                              )}
                              className={`font-bold mb-1 ${highlightClass(
                                `details-pt-title-${i}`
                              )}`}
                            >
                              {getFieldValue(
                                `details.points.${i}.title`,
                                point.title
                              )}
                            </h3>
                            <p
                              onClick={(e) =>
                                handleSelect(e, {
                                  id: `details-pt-desc-${i}`,
                                  label: `Details পয়েন্ট #${i + 1} বিবরণ`,
                                  type: "text",
                                  contentPath: `details.points.${i}.description`,
                                  styleKey: "detailsPointDesc",
                                })
                              }
                              style={getTextCss(
                                "detailsPointDesc",
                                isMobileSim ? 13 : 15,
                                getElStyle("detailsPointsBox").color ||
                                  mutedTextColor
                              )}
                              className={`leading-relaxed ${highlightClass(
                                `details-pt-desc-${i}`
                              )}`}
                            >
                              {getFieldValue(
                                `details.points.${i}.description`,
                                point.description
                              )}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="mt-7">
                    <a
                      href={isEditMode ? undefined : "#order"}
                      onClick={(e) =>
                        handleSelect(e, {
                          id: "details-order-btn",
                          label: "Details অর্ডার করতে চাই বাটন",
                          type: "button",
                          styleKey: "detailsOrderBtn",
                        })
                      }
                      style={{
                        backgroundColor: btnSt.backgroundColor || accentColor,
                        color: btnSt.color || "#FFFFFF",
                        borderColor: btnSt.borderColor || undefined,
                        borderWidth: btnSt.borderColor ? "2px" : undefined,
                        borderStyle: btnSt.borderColor ? "solid" : undefined,
                        fontSize: `${clampNum(btnSt.fontSize, 11, 32, 15)}px`,
                        fontFamily: btnSt.fontFamily || "inherit",
                        fontWeight: btnSt.bold ? 800 : 700,
                        fontStyle: btnSt.italic ? "italic" : "normal",
                        borderRadius: `${
                          btnSt.borderRadius ??
                          Math.max(10, globalBorderRadius * 0.5)
                        }px`,
                        boxShadow: btnSt.boxShadow || globalBoxShadow,
                      }}
                      className={`inline-flex items-center justify-center gap-2 hover:opacity-95 px-6 py-3 transform hover:-translate-y-0.5 transition-all duration-200 cursor-pointer relative ${highlightClass(
                        "details-order-btn"
                      )}`}
                    >
                      <span>অর্ডার করতে চাই</span>
                    </a>
                  </div>

                  {isEditMode && (
                    <div
                      onMouseDown={(e) =>
                        handleDragResize(e, "detailsPointsBox", rbw, rbh)
                      }
                      title="টেনে ডান বক্স বড়-ছোট করুন"
                      className="absolute bottom-2.5 right-2.5 w-6 h-6 rounded-md bg-[#73385E] text-white text-xs flex items-center justify-center cursor-nwse-resize select-none shadow"
                    >
                      ↘
                    </div>
                  )}
                </div>
              );
            })()}
          </div>
        </section>

        {/* Why Us Section */}
        {whyUs?.title && (
          <section
            style={{
              paddingTop: `${isMobileSim ? 22 : globalSectionPaddingY}px`,
              paddingBottom: `${isMobileSim ? 22 : globalSectionPaddingY}px`,
              backgroundColor: primaryColor,
            }}
            className="text-white shadow-inner"
          >
            <div className="container mx-auto px-3.5 max-w-6xl">
              <div
                className={`grid ${
                  isMobileSim ? "grid-cols-1 gap-5" : "md:grid-cols-2 gap-10"
                } items-center`}
              >
                {whyUs.imageUrl && (
                  <div
                    onClick={(e) =>
                      handleSelect(e, {
                        id: "why-img",
                        label: "Why Us ছবি",
                        type: "image",
                        contentPath: "whyUs.imageUrl",
                        styleKey: "whyUsImage",
                      })
                    }
                    style={getImageWrapperCss(
                      "whyUsImage",
                      isMobileSim ? 215 : 480,
                      globalBorderRadius,
                      globalImageShadow
                    )}
                    className={`relative overflow-hidden border-2 border-white/20 ${highlightClass(
                      "why-img"
                    )}`}
                  >
                    {renderZoomOverlay("whyUsImage")}
                    <Image
                      src={getFieldValue("whyUs.imageUrl", whyUs.imageUrl)}
                      alt="Why Us"
                      fill
                      sizes="(max-width: 768px) 100vw, 50vw"
                      style={getImageFilterCss("whyUsImage")}
                      className="object-cover transition-transform duration-200"
                      unoptimized={isPreview}
                    />
                  </div>
                )}

                {(() => {
                  const wBoxSt = getElStyle("whyUsBox");
                  const wbw = wBoxSt.width || 520;
                  const wbh = wBoxSt.height || 360;
                  return (
                    <div
                      onClick={(e) =>
                        handleSelect(e, {
                          id: "why-box",
                          label: "Why Us বক্স",
                          type: "box",
                          styleKey: "whyUsBox",
                        })
                      }
                      style={getBoxCss(
                        "whyUsBox",
                        "rgba(0,0,0,0.18)",
                        globalBorderRadius,
                        isMobileSim ? 16 : globalBoxPadding,
                        globalBoxShadow
                      )}
                      className={`border border-white/20 relative ${highlightClass(
                        "why-box"
                      )}`}
                    >
                      <h2
                        onClick={(e) =>
                          handleSelect(e, {
                            id: "why-title",
                            label: "Why Us শিরোনাম",
                            type: "text",
                            contentPath: "whyUs.title",
                            styleKey: "whyUsTitle",
                          })
                        }
                        style={getTextCss(
                          "whyUsTitle",
                          isMobileSim ? 20 : globalSectionTitleSize,
                          getElStyle("whyUsBox").color || "#F8F5EE"
                        )}
                        className={`font-bold mb-6 drop-shadow-sm ${highlightClass(
                          "why-title"
                        )}`}
                      >
                        {getFieldValue("whyUs.title", whyUs.title)}
                      </h2>

                      <div className="space-y-4">
                        {whyUs.points?.map((point: any, i: number) => (
                          <div key={i} className="flex gap-3">
                            <DynamicIcon
                              name="CheckSquare"
                              className="w-5 h-5 flex-shrink-0 mt-1"
                              style={{ color: accentColor }}
                            />
                            <p
                              onClick={(e) =>
                                handleSelect(e, {
                                  id: `why-pt-${i}`,
                                  label: `Why Us পয়েন্ট #${i + 1}`,
                                  type: "text",
                                  contentPath: `whyUs.points.${i}.title`,
                                  styleKey: "whyUsPointText",
                                })
                              }
                              style={getTextCss(
                                "whyUsPointText",
                                isMobileSim ? 13 : 15,
                                getElStyle("whyUsBox").color || "#FFFFFF"
                              )}
                              className={`leading-relaxed font-medium ${highlightClass(
                                `why-pt-${i}`
                              )}`}
                            >
                              <span
                                className="font-bold"
                                style={{ color: accentColor }}
                              >
                                {getFieldValue(
                                  `whyUs.points.${i}.title`,
                                  point.title
                                )}
                              </span>{" "}
                              {point.description && `: ${point.description}`}
                            </p>
                          </div>
                        ))}
                      </div>

                      <div className="mt-7 flex flex-wrap gap-3">
                        <a
                          href={isEditMode ? undefined : "#order"}
                          style={{
                            backgroundColor: accentColor,
                            color: "#FFFFFF",
                            borderRadius: `${Math.max(
                              10,
                              globalBorderRadius * 0.55
                            )}px`,
                          }}
                          className="hover:opacity-95 px-6 py-3 font-bold shadow-md transform hover:-translate-y-0.5 transition-all duration-200 flex items-center gap-2 text-sm"
                        >
                          <DynamicIcon
                            name="ShoppingCart"
                            className="w-4 h-4"
                          />
                          অর্ডার করতে চাই
                        </a>
                        <a
                          href={
                            isEditMode
                              ? undefined
                              : `https://wa.me/${formattedWa}?text=${encodeURIComponent(
                                  "আসসালামু আলাইকুম, আমি অর্ডার করতে চাই।"
                                )}`
                          }
                          target={isEditMode ? undefined : "_blank"}
                          rel={isEditMode ? undefined : "noreferrer"}
                          style={{
                            borderRadius: `${Math.max(
                              10,
                              globalBorderRadius * 0.55
                            )}px`,
                          }}
                          className="bg-[#2E8B57] hover:bg-[#246B43] text-white px-6 py-3 font-bold shadow-md transform hover:-translate-y-0.5 transition-all duration-200 flex items-center gap-2 text-sm cursor-pointer"
                        >
                          <DynamicIcon
                            name="MessageCircle"
                            className="w-4 h-4"
                          />
                          WhatsApp অর্ডার ({whatsappDisplay})
                        </a>
                      </div>

                      {isEditMode && (
                        <div
                          onMouseDown={(e) =>
                            handleDragResize(e, "whyUsBox", wbw, wbh)
                          }
                          title="টেনে Why Us বক্স বড়-ছোট করুন"
                          className="absolute bottom-2.5 right-2.5 w-6 h-6 rounded-md bg-black/50 text-white text-xs flex items-center justify-center cursor-nwse-resize select-none shadow"
                        >
                          ↘
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>
            </div>
          </section>
        )}

        {/* Target Audience & Packages */}
        <section
          style={{
            paddingTop: `${isMobileSim ? 22 : globalSectionPaddingY}px`,
            paddingBottom: `${isMobileSim ? 22 : globalSectionPaddingY}px`,
          }}
          className="container mx-auto px-3.5 max-w-6xl"
        >
          {targetAudience?.title && (
            <div
              className={`grid ${
                isMobileSim ? "grid-cols-1 gap-5" : "md:grid-cols-2 gap-10"
              } mb-10 items-center`}
            >
              {(() => {
                const tBoxSt = getElStyle("targetBox");
                const tbw = tBoxSt.width || 520;
                const tbh = tBoxSt.height || 340;
                return (
                  <div
                    onClick={(e) =>
                      handleSelect(e, {
                        id: "tgt-box",
                        label: "Target বক্স",
                        type: "box",
                        styleKey: "targetBox",
                      })
                    }
                    style={getBoxCss(
                      "targetBox",
                      boxBgColor,
                      globalBorderRadius,
                      isMobileSim ? 16 : globalBoxPadding,
                      globalBoxShadow
                    )}
                    className={`border border-black/10 relative ${highlightClass(
                      "tgt-box"
                    )}`}
                  >
                    <h2
                      onClick={(e) =>
                        handleSelect(e, {
                          id: "tgt-title",
                          label: "Target শিরোনাম",
                          type: "text",
                          contentPath: "targetAudience.title",
                          styleKey: "targetTitle",
                        })
                      }
                      style={getTextCss(
                        "targetTitle",
                        isMobileSim ? 20 : globalSectionTitleSize,
                        getElStyle("targetBox").color || primaryColor
                      )}
                      className={`font-bold mb-5 ${highlightClass(
                        "tgt-title"
                      )}`}
                    >
                      {getFieldValue(
                        "targetAudience.title",
                        targetAudience.title
                      )}
                    </h2>
                    <div className="space-y-3 mb-6">
                      {targetAudience.points?.map((point: any, i: number) => (
                        <div key={i} className="flex gap-3 items-center">
                          <DynamicIcon
                            name="CheckCheck"
                            className="w-5 h-5 flex-shrink-0"
                            style={{ color: accentColor }}
                          />
                          <p
                            onClick={(e) =>
                              handleSelect(e, {
                                id: `tgt-pt-${i}`,
                                label: `Target পয়েন্ট #${i + 1}`,
                                type: "text",
                                contentPath: `targetAudience.points.${i}`,
                                styleKey: "targetPoint",
                              })
                            }
                            style={getTextCss(
                              "targetPoint",
                              isMobileSim ? 14 : 16,
                              getElStyle("targetBox").color || mutedTextColor
                            )}
                            className={highlightClass(`tgt-pt-${i}`)}
                          >
                            {typeof point === "object" && point !== null
                              ? getFieldValue(
                                  `targetAudience.points.${i}`,
                                  `${point.title || ""} ${
                                    point.description
                                      ? `: ${point.description}`
                                      : ""
                                  }`.trim()
                                )
                              : getFieldValue(
                                  `targetAudience.points.${i}`,
                                  point
                                )}
                          </p>
                        </div>
                      ))}
                    </div>
                    <a
                      href={isEditMode ? undefined : "#order"}
                      style={{
                        backgroundColor: accentColor,
                        color: "#FFFFFF",
                        borderRadius: `${Math.max(
                          10,
                          globalBorderRadius * 0.55
                        )}px`,
                      }}
                      className="inline-block hover:opacity-95 px-6 py-3 font-bold shadow-md transform hover:-translate-y-0.5 transition-all duration-200 text-sm"
                    >
                      <DynamicIcon
                        name="ShoppingCart"
                        className="w-4 h-4 inline mr-2"
                      />
                      অর্ডার করতে চাই
                    </a>
                    {isEditMode && (
                      <div
                        onMouseDown={(e) =>
                          handleDragResize(e, "targetBox", tbw, tbh)
                        }
                        title="টেনে Target বক্স বড়-ছোট করুন"
                        className="absolute bottom-2.5 right-2.5 w-6 h-6 rounded-md bg-[#73385E] text-white text-xs flex items-center justify-center cursor-nwse-resize select-none shadow"
                      >
                        ↘
                      </div>
                    )}
                  </div>
                );
              })()}

              {targetAudience.imageUrl && (
                <div
                  onClick={(e) =>
                    handleSelect(e, {
                      id: "tgt-img",
                      label: "Target ছবি",
                      type: "image",
                      contentPath: "targetAudience.imageUrl",
                      styleKey: "targetImage",
                    })
                  }
                  style={getImageWrapperCss(
                    "targetImage",
                    isMobileSim ? 210 : 400,
                    globalBorderRadius,
                    globalImageShadow
                  )}
                  className={`relative overflow-hidden ${highlightClass(
                    "tgt-img"
                  )}`}
                >
                  {renderZoomOverlay("targetImage")}
                  <Image
                    src={getFieldValue(
                      "targetAudience.imageUrl",
                      targetAudience.imageUrl
                    )}
                    alt="Target"
                    fill
                    sizes="(max-width: 768px) 100vw, 50vw"
                    style={getImageFilterCss("targetImage")}
                    className="object-cover transition-transform duration-200"
                    unoptimized={isPreview}
                  />
                </div>
              )}
            </div>
          )}

          {/* Packages & FAQ */}
          <div
            className={`grid grid-cols-1 ${
              isMobileSim ? "gap-6" : "lg:grid-cols-2 gap-6"
            } items-start`}
          >
            <div className="w-full">
              <div
                style={{
                  backgroundColor: primaryColor,
                  borderRadius: `${Math.max(
                    8,
                    globalBorderRadius * 0.5
                  )}px ${Math.max(8, globalBorderRadius * 0.5)}px 0 0`,
                }}
                className="text-white p-3.5 font-bold text-base flex items-center gap-2 shadow-sm"
              >
                <DynamicIcon name="Gift" className="w-5 h-5" />
                আপনার জন্য কোন প্যাকটি?
              </div>
              <div className="flex flex-col gap-3 mt-3">
                {content?.packages?.map((pkg: any, i: number) => {
                  const pkgStyle = getElStyle(`packageBox_${i}`);
                  const pw = pkgStyle.width || 460;
                  const ph = pkgStyle.height || 110;
                  return (
                    <div
                      key={i}
                      onClick={(e) =>
                        handleSelect(e, {
                          id: `pkg-box-${i}`,
                          label: `প্যাক বক্স #${i + 1}`,
                          type: "box",
                          contentPath: `packages.${i}.name`,
                          styleKey: `packageBox_${i}`,
                        })
                      }
                      style={getBoxCss(
                        `packageBox_${i}`,
                        boxBgColor,
                        Math.max(10, globalBorderRadius * 0.6),
                        isMobileSim
                          ? 14
                          : Math.max(16, globalBoxPadding * 0.7),
                        globalBoxShadow
                      )}
                      className={`border border-black/10 relative w-full ${highlightClass(
                        `pkg-box-${i}`
                      )}`}
                    >
                      <div
                        style={getTextCss(
                          "packageTitle",
                          isMobileSim ? 16 : 18,
                          pkgStyle.color || primaryColor
                        )}
                        className="flex items-center gap-2 font-bold mb-1.5"
                      >
                        <DynamicIcon
                          name={i === 0 ? "Users" : "Home"}
                          className="w-4 h-4 shrink-0"
                        />
                        <span>
                          {getFieldValue(`packages.${i}.name`, pkg.name)}
                        </span>
                      </div>
                      <p
                        style={getTextCss(
                          "packageDesc",
                          isMobileSim ? 13 : 14,
                          pkgStyle.color || mutedTextColor
                        )}
                      >
                        {getFieldValue(
                          `packages.${i}.description`,
                          pkg.description
                        )}
                      </p>
                      {isEditMode && (
                        <div
                          onMouseDown={(e) =>
                            handleDragResize(e, `packageBox_${i}`, pw, ph)
                          }
                          title="টেনে প্যাক বক্স বড়-ছোট করুন"
                          className="absolute bottom-2 right-2 w-5 h-5 rounded bg-[#73385E] text-white text-[10px] flex items-center justify-center cursor-nwse-resize select-none"
                        >
                          ↘
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              <a
                href={
                  isEditMode
                    ? undefined
                    : `https://wa.me/${formattedWa}?text=${encodeURIComponent(
                        "আসসালামু আলাইকুম, আমি অর্ডার করতে চাই।"
                      )}`
                }
                target={isEditMode ? undefined : "_blank"}
                rel={isEditMode ? undefined : "noreferrer"}
                style={{
                  borderRadius: `${Math.max(10, globalBorderRadius * 0.55)}px`,
                }}
                className="w-full mt-5 bg-[#2E8B57] hover:bg-[#246B43] text-white py-3.5 px-4 font-bold shadow-md transform hover:-translate-y-0.5 transition-all duration-200 flex items-center justify-center gap-2 text-sm cursor-pointer"
              >
                <DynamicIcon
                  name="MessageCircle"
                  className="w-5 h-5 shrink-0"
                />
                <span>
                  WhatsApp-এ যোগাযোগ ও অর্ডার করুন ({whatsappDisplay})
                </span>
              </a>
            </div>

            <div className="w-full">
              <div
                style={{
                  backgroundColor: accentColor,
                  color: "#FFFFFF",
                  borderRadius: `${Math.max(
                    8,
                    globalBorderRadius * 0.5
                  )}px ${Math.max(8, globalBorderRadius * 0.5)}px 0 0`,
                }}
                className="p-3.5 font-bold text-center text-lg shadow-sm"
              >
                সচরাচর জানতে চাওয়া প্রশ্ন
              </div>
              <div
                onClick={(e) =>
                  handleSelect(e, {
                    id: "faq-box",
                    label: "FAQ বক্স",
                    type: "box",
                    styleKey: "faqBox",
                  })
                }
                style={getBoxCss(
                  "faqBox",
                  boxBgColor,
                  Math.max(10, globalBorderRadius * 0.6),
                  isMobileSim ? 14 : globalBoxPadding,
                  globalBoxShadow
                )}
                className={`border border-black/10 border-t-0 w-full ${highlightClass(
                  "faq-box"
                )}`}
              >
                <FAQSection faqs={content?.faqs || []} />
              </div>
            </div>
          </div>
        </section>

        {renderCustomBlocks("beforeFooter")}

        {/* Checkout / Order Form Section */}
        <section id="order" className="container mx-auto px-3.5 max-w-5xl pb-14">
          {discountEnabled && computedDiscountAmount > 0 && (
            <div className="mb-3 rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-2.5 flex flex-wrap items-center justify-between gap-2 text-xs font-bold text-emerald-900">
              <span>
                🏷️ {discountLabel || "বিশেষ ছাড়"} চালু আছে (
                {discountType === "percent"
                  ? `${discountValue}%`
                  : `${discountValue}৳`}{" "}
                ছাড়)
              </span>
              <span>
                আসল মূল্য{" "}
                <span className="line-through">{baseProductPrice}৳</span> →
                ডিসকাউন্ট মূল্য <strong>{computedDiscountedPrice}৳</strong>
              </span>
            </div>
          )}

          <div
            onClick={(e) =>
              handleSelect(e, {
                id: "order-form-box",
                label: "Order Form বক্স",
                type: "box",
                styleKey: "orderFormBox",
              })
            }
            style={getBoxCss(
              "orderFormBox",
              boxBgColor,
              globalBorderRadius,
              getElStyle("orderFormBox").padding ?? 8,
              globalBoxShadow
            )}
            className={`mx-auto border border-black/10 relative w-full ${highlightClass(
              "order-form-box"
            )}`}
          >
            <CheckoutForm pricing={pricing} isMobile={isMobileSim} />
          </div>
        </section>

        {/* Footer */}
        <footer
          onClick={(e) =>
            handleSelect(e, {
              id: "footer-sec",
              label: "Footer ফুটার",
              type: "box",
              contentPath: "siteName",
              styleKey: "footerBox",
            })
          }
          style={{
            backgroundColor:
              getElStyle("footerBox").backgroundColor || primaryColor,
          }}
          className={`py-6 text-center text-white/90 border-t border-white/15 ${highlightClass(
            "footer-sec"
          )}`}
        >
          <p style={getTextCss("footerText", 13, "#F8F5EE", "center")}>
            © {new Date().getFullYear()}{" "}
            {getFieldValue("siteName", content?.siteName || "Sohoj Market")}.
            All rights reserved.
          </p>
        </footer>
      </main>
    </div>
  );
}