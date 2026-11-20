"use client";

import React, { useState, useEffect, useRef } from "react";
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

const DEFAULT_PHOTO = "/images/khejur-gur-hero.avif";

const FONT_CHOICES = [
  { label: "Default", value: "inherit" },
  { label: "Arial", value: "Arial, Helvetica, sans-serif" },
  { label: "Hind Siliguri", value: "'Hind Siliguri', sans-serif" },
  { label: "Noto Sans Bengali", value: "'Noto Sans Bengali', sans-serif" },
  { label: "Sans Pro", value: "ui-sans-serif, system-ui, sans-serif" },
  { label: "Classic Serif", value: "ui-serif, Georgia, serif" },
  { label: "Mono", value: "ui-monospace, SFMono-Regular, monospace" },
];

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
  onGalleryChange,
  onUndo,
  canUndo = false,
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
  onGalleryChange?: (nextGallery: GalleryItem[]) => void;
  onUndo?: () => void;
  canUndo?: boolean;
}) {
  const theme = content?.theme || {};
  const elementStyles = theme.elements || {};

  const primaryColor = theme.primaryColor || "#73385E";
  const accentColor = theme.accentColor || "#A2AB34";
  const pageBgColor = theme.pageBgColor || "#FAF9F5";
  const boxBgColor = theme.boxBgColor || "#FFFFFF";
  const textColor = theme.textColor || "#1E1B24";
  const mutedTextColor = theme.mutedTextColor || "#4B4554";

  const whatsappNumber = (
    content?.whatsappNumber ||
    content?.adminWhatsApp ||
    "8801639193531"
  ).replace(/[^0-9]/g, "");
  const formattedWa = whatsappNumber.startsWith("88")
    ? whatsappNumber
    : `88${whatsappNumber}`;

  const globalHeroTitleSize = theme.heroTitleSize ?? 48;
  const globalHeroDescSize = theme.heroDescSize ?? 17;
  const globalSectionTitleSize = theme.sectionTitleSize ?? 28;
  const globalHeroImageHeight = theme.heroImageHeight ?? 440;
  const globalImageShadow =
    theme.imageShadow ?? "0 20px 30px -8px rgba(115, 56, 94, 0.22)";
  const globalBoxShadow =
    theme.boxShadow ?? "0 12px 26px -8px rgba(30, 27, 36, 0.12)";
  const globalBorderRadius = theme.borderRadius ?? 18;
  const globalSectionPaddingY = theme.sectionPaddingY ?? 60;
  const globalBoxPadding = theme.boxPadding ?? 28;

  const [localStyles, setLocalStyles] = useState<Record<string, any>>({});
  const [localCustomBlocks, setLocalCustomBlocks] = useState<CustomBlockItem[]>(
    []
  );
  const [localOverrides, setLocalOverrides] = useState<Record<string, any>>(
    {}
  );

  // শুরুর চিকন লাইনে লেখা আসা-যাওয়ার (slide/fade) স্টেট
  const [tickerVisible, setTickerVisible] = useState(true);

  // Edit View-তে Mobile View / Desktop View সুইচ স্টেট
  const [deviceView, setDeviceView] = useState<"desktop" | "mobile">("desktop");

  const [dockPos, setDockPos] = useState<{ x: number; y: number }>({
    x: 16,
    y: 86,
  });
  const [activeTool, setActiveTool] = useState<
    "select" | "text" | "box" | "image" | "gallery" | "addBox"
  >("select");
  const [activeEl, setActiveEl] = useState<SelectedElement | null>(null);

  const [newBoxTitle, setNewBoxTitle] = useState("");
  const [newBoxDesc, setNewBoxDesc] = useState("");
  const [newBoxImg, setNewBoxImg] = useState(DEFAULT_PHOTO);
  const [newBoxPos, setNewBoxPos] = useState<
    "afterHero" | "afterGallery" | "beforeFooter"
  >("afterGallery");
  const [newBoxRadius, setNewBoxRadius] = useState(20);
  const [newBoxWidth, setNewBoxWidth] = useState(1100);
  const [newBoxHeight, setNewBoxHeight] = useState(230);

  const [newGalUrl, setNewGalUrl] = useState(DEFAULT_PHOTO);
  const [newGalCaption, setNewGalCaption] = useState("");
  const [newGalIndex, setNewGalIndex] = useState<string>("end");

  const dragDockRef = useRef<{
    startX: number;
    startY: number;
    origX: number;
    origY: number;
  } | null>(null);

  // শুরুর চিকন লাইনে স্মুথ আসা-যাওয়া অ্যানিমেশন
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

  const getElStyle = (key: string) => ({
    ...(elementStyles[key] || {}),
    ...(localStyles[key] || {}),
  });

  const applyStyle = (styleKey: string, field: string, value: any) => {
    setLocalStyles((prev) => ({
      ...prev,
      [styleKey]: {
        ...(prev[styleKey] || {}),
        [field]: value,
      },
    }));
    onUpdateStyle?.(styleKey, field, value);
  };

  const applyResize = (styleKey: string, width?: number, height?: number) => {
    setLocalStyles((prev) => ({
      ...prev,
      [styleKey]: {
        ...(prev[styleKey] || {}),
        ...(width !== undefined ? { width } : {}),
        ...(height !== undefined ? { height } : {}),
      },
    }));
    onResizeElement?.(styleKey, width, height);
  };

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
    const brightness = st.brightness ?? 100;
    const contrast = st.contrast ?? 100;
    const saturate = st.saturate ?? 100;
    const grayscale = st.grayscale ?? 0;
    const blur = st.blur ?? 0;
    const hueRotate = st.hueRotate ?? 0;
    return `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturate}%) grayscale(${grayscale}%) blur(${blur}px) hue-rotate(${hueRotate}deg)`;
  };

  const isMobileSim = isEditMode && deviceView === "mobile";

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
      fontSize: `${st.fontSize ?? defaultSize}px`,
      fontWeight: st.bold ? 800 : undefined,
      fontStyle: st.italic ? "italic" : "normal",
      textDecoration,
      textAlign: st.textAlign || defaultAlign,
      color: st.color || defaultColor,
      backgroundColor: st.backgroundColor || st.highlightColor || undefined,
      textShadow: st.textShadow || "none",
      padding: st.padding !== undefined ? `${st.padding}px` : undefined,
      borderRadius:
        st.borderRadius !== undefined ? `${st.borderRadius}px` : undefined,
      width: st.width ? `${st.width}px` : undefined,
      maxWidth: "100%",
      height: st.height ? `${st.height}px` : undefined,
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
      width: st.width ? `${st.width}px` : undefined,
      maxWidth: "100%",
      height: st.height ? `${st.height}px` : undefined,
      borderRadius: `${st.borderRadius ?? defaultRadius}px`,
      padding: `${st.padding ?? defaultPadding}px`,
      boxShadow: st.boxShadow ?? defaultShadow,
      borderColor: st.borderColor || undefined,
      borderWidth:
        st.borderWidth !== undefined ? `${st.borderWidth}px` : undefined,
      borderStyle: st.borderWidth ? "solid" : undefined,
      filter: buildPhotoshopFilter(st),
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
      width: st.width ? `${st.width}px` : "100%",
      maxWidth: "100%",
      height: `${st.height ?? defaultHeight}px`,
      borderRadius: `${st.borderRadius ?? defaultRadius}px`,
      boxShadow: st.boxShadow ?? defaultShadow,
      borderColor: st.borderColor || "#FFFFFF",
      borderWidth:
        st.borderWidth !== undefined ? `${st.borderWidth}px` : "4px",
      borderStyle: "solid",
    };
  };

  const getImageFilterCss = (key: string): React.CSSProperties => {
    const st = getElStyle(key);
    const zoomScale = (st.zoom ?? 100) / 100;
    return {
      filter: buildPhotoshopFilter(st),
      objectPosition: st.objectPosition || "center",
      transform: `scale(${zoomScale})`,
      transformOrigin: "center center",
    };
  };

  // ফ্রেম ঠিক রেখে ভেতরের ছবি জুম ইন/আউট করার কন্ট্রোল (বাটন + Alt/Wheel)
  const renderZoomOverlay = (styleKey: string) => {
    if (!isEditMode) return null;
    const zoomVal = getElStyle(styleKey).zoom ?? 100;
    return (
      <div
        onClick={(e) => e.stopPropagation()}
        onMouseDown={(e) => e.stopPropagation()}
        onWheel={(e) => {
          if (e.altKey) {
            e.preventDefault();
            e.stopPropagation();
            const delta = e.deltaY < 0 ? 10 : -10;
            applyStyle(
              styleKey,
              "zoom",
              Math.max(50, Math.min(240, zoomVal + delta))
            );
          }
        }}
        title="ফ্রেম ঠিক রেখে ভেতরের ছবি Zoom In/Out করুন (বা Alt + Mouse Wheel)"
        className="absolute top-2 right-2 z-30 flex items-center gap-1 bg-black/80 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-md shadow"
      >
        <button
          type="button"
          onClick={() =>
            applyStyle(styleKey, "zoom", Math.max(50, zoomVal - 10))
          }
          title="Zoom Out"
          className="px-1 hover:text-[#A2AB34] cursor-pointer"
        >
          −
        </button>
        <span>{zoomVal}%</span>
        <button
          type="button"
          onClick={() =>
            applyStyle(styleKey, "zoom", Math.min(240, zoomVal + 10))
          }
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
      const nextW = Math.max(70, currentWidth + (moveEvent.clientX - startX));
      const nextH = Math.max(0, currentHeight + (moveEvent.clientY - startY));
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

  const pricing = {
    ...(content?.pricing || {
      productPrice: 1250,
      shippingInside: 60,
      shippingOutside: 120,
    }),
    whatsappNumber: formattedWa,
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
  }, [galleryImages.length, currentSlide]);

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

  const galleryCardSize =
    getElStyle("galleryCard").size ?? (isMobileSim ? 145 : 220);
  const galleryBannerStyle = getElStyle("galleryBanner");
  const galleryBannerHeight =
    galleryBannerStyle.height ?? (isMobileSim ? 235 : 330);
  const galleryBannerWidth = galleryBannerStyle.width;

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
      borderRadius: `${Math.min(
        32,
        getElStyle("galleryCard").borderRadius ?? globalBorderRadius
      )}px`,
      transform: `translate(-50%, -50%) translateX(${translateX}px) scale(${scale})`,
      opacity,
      zIndex,
      pointerEvents: absDiff <= 2 ? "auto" : "none",
    };
  };

  const activeItem = galleryImages[currentSlide];

  const handleAddBoxOnPage = () => {
    const created: CustomBlockItem = {
      id: `blk_${Date.now()}`,
      title: newBoxTitle.trim() || "নতুন কাস্টম বক্স / সেকশন",
      description:
        newBoxDesc.trim() ||
        "মেইন ওয়েবপেজে যুক্ত করা নতুন বক্স—কর্নার শেপ, সাইজ ও ছবি কাস্টমাইজযোগ্য।",
      imageUrl: newBoxImg.trim() || DEFAULT_PHOTO,
      position: newBoxPos,
      bgColor: boxBgColor,
      textColor: textColor,
      width: newBoxWidth,
      height: newBoxHeight,
      borderRadius: newBoxRadius,
      padding: globalBoxPadding,
      shadow: globalBoxShadow,
    };
    setLocalCustomBlocks((prev) => [...prev, created]);
    onAddCustomBlock?.(created);
    setNewBoxTitle("");
    setNewBoxDesc("");
  };

  const handleAddGalleryItem = () => 
    
    {
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
const readOriginalImageWithoutCrop = (
    file: File
  ): Promise<{ dataUrl: string; width: number; height: number }> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = typeof reader.result === "string" ? reader.result : "";
        const img = new window.Image();
        img.onload = () => {
          resolve({
            dataUrl: result,
            width: img.naturalWidth,
            height: img.naturalHeight,
          });
        };
        img.onerror = () =>
          resolve({ dataUrl: result, width: 0, height: 0 });
        img.src = result;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
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
            const w = st.width ?? blk.width ?? 520;
            const h = st.height ?? blk.height ?? 210;
            const r = st.borderRadius ?? blk.borderRadius ?? globalBorderRadius;
            const p = st.padding ?? blk.padding ?? globalBoxPadding;

            return (
              <div
                key={blk.id || i}
                onClick={(e) =>
                  handleSelect(e, {
                    id: `custom-blk-${blk.id || i}`,
                    label: `কাস্টম বক্স: ${blk.title}`,
                    type: "customBlock",
                    styleKey: stKey,
                  })
                }
                style={{
                  backgroundColor: st.backgroundColor || blk.bgColor || boxBgColor,
                  color: st.color || blk.textColor || textColor,
                  width: `${w}px`,
                  maxWidth: "100%",
                  minHeight: `${h}px`,
                  borderRadius: `${r}px`,
                  padding: `${p}px`,
                  boxShadow: st.boxShadow ?? blk.shadow ?? globalBoxShadow,
                }}
                className={`border border-black/10 relative shrink-0 ${highlightClass(
                  `custom-blk-${blk.id || i}`
                )}`}
              >
                <div className="grid sm:grid-cols-2 gap-4 items-center">
                  <div>
                    <h3
                      style={{ color: primaryColor }}
                      className="text-xl font-extrabold mb-2"
                    >
                      {blk.title}
                    </h3>
                    <p
                      style={{ color: mutedTextColor }}
                      className="text-sm leading-relaxed"
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
                        className="object-cover"
                        unoptimized={isPreview}
                      />
                    </div>
                  )}
                </div>

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
        {/* ওয়েবপেজের শুরুতে চিকন সুন্দর অ্যানিমেটেড লাইন (লেখা আসবে-যাবে ও Edit Mode-এ এডিট করা যাবে) */}
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

        {/* কালো ও হালকা মাটি কালারের মুভেবল Tool Dock + Inspector Panel */}
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
                    ? "Desktop View-এ ফিরে যান"
                    : "Mobile View-এ গিয়ে এডিট করুন"
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
                    title: "Box, Color, Shadow & Size",
                  },
                  { id: "image", icon: "Image", title: "Photo & Filters" },
                  {
                    id: "gallery",
                    icon: "Images",
                    title: "Gallery Banner, Frame & Photos",
                  },
                  { id: "addBox", icon: "PlusSquare", title: "নতুন বক্স তৈরি" },
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
                  title="Undo"
                  className="w-8 h-8 mt-1 rounded-lg flex items-center justify-center bg-stone-800 text-amber-300 hover:bg-stone-700 disabled:opacity-30 cursor-pointer"
                >
                  <DynamicIcon name="Undo2" className="w-4 h-4" />
                </button>
              )}
            </div>

            <div className="w-[320px] max-w-[82vw] bg-stone-900/95 backdrop-blur-md border border-stone-700/80 rounded-xl shadow-2xl text-stone-100 text-xs overflow-hidden">
              <div
                onMouseDown={startDockDrag}
                className="bg-stone-950 px-3 py-2 border-b border-stone-800 flex items-center justify-between cursor-move"
              >
                <span className="font-extrabold text-[11px] tracking-wider text-[#A2AB34]">
                  EDIT BAR ({deviceView === "mobile" ? "MOBILE" : "DESKTOP"})
                </span>
                <span className="text-[10px] text-stone-300 truncate max-w-[130px]">
                  {currentSelected ? currentSelected.label : "এলিমেন্ট ধরুন"}
                </span>
              </div>

              <div className="p-3 space-y-2.5 max-h-[75vh] overflow-y-auto bg-stone-900/90">
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

                {activeTool === "addBox" && (
                  <div className="space-y-2.5 bg-stone-950/70 p-2.5 rounded-lg border border-stone-800">
                    <div className="font-bold text-[#A2AB34]">
                      নতুন বক্স / সেকশন তৈরি করুন
                    </div>
                    <input
                      type="text"
                      value={newBoxTitle}
                      onChange={(e) => setNewBoxTitle(e.target.value)}
                      placeholder="বক্স বা সেকশনের শিরোনাম"
                      className="w-full bg-stone-900 border border-stone-700 rounded px-2.5 py-1.5 text-white"
                    />
                    <textarea
                      rows={2}
                      value={newBoxDesc}
                      onChange={(e) => setNewBoxDesc(e.target.value)}
                      placeholder="বিবরণ লিখুন"
                      className="w-full bg-stone-900 border border-stone-700 rounded px-2.5 py-1.5 text-white"
                    />
                    <input
                      type="text"
                      value={newBoxImg}
                      onChange={(e) => setNewBoxImg(e.target.value)}
                      placeholder="ছবির URL (ঐচ্ছিক)"
                      className="w-full bg-stone-900 border border-stone-700 rounded px-2.5 py-1.5 text-white"
                    />
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
                        onChange={(e) => setNewBoxRadius(Number(e.target.value))}
                        className="w-full accent-[#A2AB34]"
                      />
                    </div>
                    <div>
                      <div className="flex justify-between mb-1">
                        <span>Width</span>
                        <span>{newBoxWidth}px</span>
                      </div>
                      <input
                        type="range"
                        min="120"
                        max="1200"
                        value={newBoxWidth}
                        onChange={(e) => setNewBoxWidth(Number(e.target.value))}
                        className="w-full accent-[#A2AB34]"
                      />
                    </div>
                    <div>
                      <div className="flex justify-between mb-1">
                        <span>Height</span>
                        <span>{newBoxHeight}px</span>
                      </div>
                      <input
                        type="range"
                        min="80"
                        max="520"
                        value={newBoxHeight}
                        onChange={(e) => setNewBoxHeight(Number(e.target.value))}
                        className="w-full accent-[#A2AB34]"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={handleAddBoxOnPage}
                      style={{ backgroundColor: "#A2AB34", color: "#1E1B24" }}
                      className="w-full py-2 rounded-lg font-extrabold cursor-pointer"
                    >
                      + ওয়েবপেজে বক্স যোগ করুন
                    </button>
                  </div>
                )}

                {activeTool === "gallery" && (
                  <div className="space-y-2.5 bg-stone-950/70 p-2.5 rounded-lg border border-stone-800">
                    <div className="font-bold text-[#A2AB34]">
                      Photo Gallery ({galleryImages.length}টি ছবি)
                    </div>

                    <div>
                      <div className="flex justify-between mb-1">
                        <span>গ্যালারি ফ্রেম সাইজ</span>
                        <span>{galleryCardSize}px</span>
                      </div>
                      <input
                        type="range"
                        min="90"
                        max="420"
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
                        <span>বাইরের ব্যানার চওড়া</span>
                        <span>{galleryBannerWidth || "Auto"}px</span>
                      </div>
                      <input
                        type="range"
                        min="240"
                        max="1150"
                        value={galleryBannerWidth || 900}
                        onChange={(e) =>
                          applyStyle(
                            "galleryBanner",
                            "width",
                            Number(e.target.value)
                          )
                        }
                        className="w-full accent-[#A2AB34]"
                      />
                    </div>

                    <div className="space-y-1.5 border-t border-stone-800 pt-2">
                      <div className="text-[11px] font-bold text-[#A2AB34]">
                        ভেতরের প্রতিটি ছবির সাইজ ও Zoom
                      </div>
                      {galleryImages.map((_, gIdx) => {
                        const itemStKey = `galleryItem_${gIdx}`;
                        const itemSt = getElStyle(itemStKey);
                        const itemSize = itemSt.size ?? galleryCardSize;
                        const itemZoom = itemSt.zoom ?? 100;
                        return (
                          <div
                            key={gIdx}
                            className="bg-stone-900 border border-stone-800 rounded p-2 space-y-1.5"
                          >
                            <div className="flex justify-between text-[11px]">
                              <span>ছবি #{gIdx + 1} সাইজ</span>
                              <span className="text-[#A2AB34]">
                                {itemSize}px
                              </span>
                            </div>
                            <input
                              type="range"
                              min="50"
                              max="380"
                              value={itemSize}
                              onChange={(e) =>
                                applyStyle(
                                  itemStKey,
                                  "size",
                                  Number(e.target.value)
                                )
                              }
                              className="w-full accent-emerald-400"
                            />
                            <div className="flex justify-between text-[11px]">
                              <span>ছবি #{gIdx + 1} Zoom</span>
                              <span className="text-cyan-300">{itemZoom}%</span>
                            </div>
                            <input
                              type="range"
                              min="50"
                              max="240"
                              value={itemZoom}
                              onChange={(e) =>
                                applyStyle(
                                  itemStKey,
                                  "zoom",
                                  Number(e.target.value)
                                )
                              }
                              className="w-full accent-[#A2AB34]"
                            />
                          </div>
                        );
                      })}
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
                            #{i + 1}
                          </option>
                        ))}
                      </select>
                    </div>
                    <button
                      type="button"
                      onClick={handleAddGalleryItem}
                      style={{ backgroundColor: "#A2AB34", color: "#1E1B24" }}
                      className="w-full py-1.5 rounded font-extrabold cursor-pointer"
                    >
                        <label className="block w-full bg-stone-900 hover:bg-stone-800 border border-dashed border-stone-600 rounded px-2.5 py-1.5 text-center text-[11px] text-[#A2AB34] font-bold cursor-pointer">
                      📁 আসল সাইজে ছবি আপলোড (No Crop)
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          const original = await readOriginalImageWithoutCrop(
                            file
                          );
                          setNewGalUrl(original.dataUrl);
                          if (!newGalCaption.trim()) {
                            setNewGalCaption(
                              file.name.replace(/\.[^/.]+$/, "")
                            );
                          }
                          e.target.value = "";
                        }}
                      />
                    </label>
                      + গ্যালারিতে ছবি যুক্ত করুন
                    </button>
                  </div>
                )}

                {activeTool !== "addBox" &&
                  activeTool !== "gallery" &&
                  currentSelected && (
                    <div className="space-y-2.5 bg-stone-950/75 p-2.5 rounded-lg border border-stone-800">
                      {currentSelected.contentPath && (
                        <div>
                          <label className="block text-[10px] text-stone-400 mb-1">
                            লেখা / মান পরিবর্তন করুন
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
                            max="90"
                            value={activeStyle.fontSize ?? 17}
                            onChange={(e) =>
                              applyStyle(
                                currentSelected.styleKey,
                                "fontSize",
                                Number(e.target.value)
                              )
                            }
                            title="Font Size (px)"
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
                            title="Bold (B)"
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
                            title="Italic (I)"
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
                            title="Underline (U)"
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
                          <span>Width</span>
                          <span>{activeStyle.width || "Auto"}px</span>
                        </div>
                        <input
                          type="range"
                          min="60"
                          max="1150"
                          value={activeStyle.width || 240}
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
                          <span>Height</span>
                          <span>{activeStyle.height || "Auto"}px</span>
                        </div>
                        <input
                          type="range"
                          min="32"
                          max="650"
                          value={activeStyle.height || 90}
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
                        <label className="block text-[10px] text-stone-400 mb-1">
                          Shadow
                        </label>
                        <select
                          value={activeStyle.boxShadow ?? ""}
                          onChange={(e) =>
                            applyStyle(
                              currentSelected.styleKey,
                              "boxShadow",
                              e.target.value
                            )
                          }
                          className="w-full bg-stone-900 border border-stone-700 rounded px-2 py-1.5 text-white"
                        >
                          <option value="">Default</option>
                          <option value="none">None</option>
                          <option value="0 6px 16px rgba(0,0,0,0.18)">
                            Soft
                          </option>
                          <option value="0 20px 30px -8px rgba(115,56,94,0.35)">
                            Plum Shadow
                          </option>
                          <option value="0 25px 50px -12px rgba(0,0,0,0.55)">
                            Deep 3D
                          </option>
                        </select>
                      </div>

                      <div>
                        <div className="flex justify-between mb-1">
                          <span>Padding</span>
                          <span>{activeStyle.padding ?? globalBoxPadding}px</span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="64"
                          value={activeStyle.padding ?? globalBoxPadding}
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
                            {activeStyle.borderRadius ?? globalBorderRadius}px
                          </span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="48"
                          value={activeStyle.borderRadius ?? globalBorderRadius}
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

                      {currentSelected.type === "image" && (
                        <div className="space-y-2 border-t border-stone-800 pt-2">
                          <div className="text-[11px] font-bold text-[#A2AB34]">
                            Photo Zoom & Photoshop Filters
                          </div>
                          <div>
                            <div className="flex justify-between">
                              <span>Photo Zoom (ফ্রেমের ভেতরে ছবি)</span>
                              <span>{activeStyle.zoom ?? 100}%</span>
                            </div>
                            <input
                              type="range"
                              min="50"
                              max="240"
                              value={activeStyle.zoom ?? 100}
                              onChange={(e) =>
                                applyStyle(
                                  currentSelected.styleKey,
                                  "zoom",
                                  Number(e.target.value)
                                )
                              }
                              className="w-full accent-emerald-400"
                            />
                          </div>
                          <div>
                            <div className="flex justify-between">
                              <span>Brightness</span>
                              <span>{activeStyle.brightness ?? 100}%</span>
                            </div>
                            <input
                              type="range"
                              min="30"
                              max="180"
                              value={activeStyle.brightness ?? 100}
                              onChange={(e) =>
                                applyStyle(
                                  currentSelected.styleKey,
                                  "brightness",
                                  Number(e.target.value)
                                )
                              }
                              className="w-full accent-[#A2AB34]"
                            />
                          </div>
                          <div>
                            <div className="flex justify-between">
                              <span>Contrast</span>
                              <span>{activeStyle.contrast ?? 100}%</span>
                            </div>
                            <input
                              type="range"
                              min="30"
                              max="200"
                              value={activeStyle.contrast ?? 100}
                              onChange={(e) =>
                                applyStyle(
                                  currentSelected.styleKey,
                                  "contrast",
                                  Number(e.target.value)
                                )
                              }
                              className="w-full accent-[#A2AB34]"
                            />
                          </div>
                          <div>
                            <div className="flex justify-between">
                              <span>Saturation</span>
                              <span>{activeStyle.saturate ?? 100}%</span>
                            </div>
                            <input
                              type="range"
                              min="0"
                              max="220"
                              value={activeStyle.saturate ?? 100}
                              onChange={(e) =>
                                applyStyle(
                                  currentSelected.styleKey,
                                  "saturate",
                                  Number(e.target.value)
                                )
                              }
                              className="w-full accent-[#A2AB34]"
                            />
                          </div>
                        </div>
                      )}
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
              <div
                className={
                  isMobileSim &&
                  getElStyle("heroBadge").textAlign === "center"
                    ? "flex justify-center"
                    : isMobileSim &&
                      getElStyle("heroBadge").textAlign === "right"
                    ? "flex justify-end"
                    : ""
                }
              >
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
              </div>

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
                  isMobileSim
                    ? "gap-1.5 mb-2 justify-start"
                    : "gap-2.5 mb-6"
                }`}
              >
                {heroTags.map((tag: string, i: number) => {
                  const cleanTag = String(tag).replace(/^✓\s*/, "");
                  const stKey = `heroTagBox_${i}`;
                  const st = getElStyle(stKey);
                  const w = st.width;
                  const h = st.height;
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
                        borderRadius: `${
                          st.borderRadius ??
                          Math.max(8, globalBorderRadius * 0.5)
                        }px`,
                        boxShadow: st.boxShadow || "none",
                        width: w ? `${w}px` : undefined,
                        height: h ? `${h}px` : undefined,
                      }}
                      className={`font-medium ${
                        isMobileSim ? "px-2.5 py-1" : "px-3.5 py-2"
                      } border border-black/10 inline-flex items-center justify-center relative shrink-0 ${highlightClass(
                        `hero-tag-${i}`
                      )}`}
                    >
                      <span className="whitespace-nowrap">✓ {cleanTag}</span>
                      {isEditMode && (
                        <span
                          onMouseDown={(e) =>
                            handleDragResize(e, stKey, w || 100, h || 30)
                          }
                          className="ml-1 text-[10px] text-[#73385E] cursor-nwse-resize"
                        >
                          ↘
                        </span>
                      )}
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
                className={`flex flex-wrap ${
                  isMobileSim ? "gap-2" : "gap-3.5"
                }`}
              >
                {(() => {
                  const st = getElStyle("btnOrder");
                  const w = st.width;
                  const h = st.height;
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
                        fontSize: `${st.fontSize ?? (isMobileSim ? 13 : 16)}px`,
                        fontFamily: st.fontFamily || "inherit",
                        fontWeight: st.bold ? 800 : 700,
                        fontStyle: st.italic ? "italic" : "normal",
                        width: w ? `${w}px` : undefined,
                        height: h ? `${h}px` : undefined,
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
                        <span
                          onMouseDown={(e) =>
                            handleDragResize(e, "btnOrder", w || 150, h || 42)
                          }
                          title="টেনে বাটন বড়-ছোট করুন"
                          className="ml-0.5 w-4 h-4 rounded bg-black/25 text-[10px] flex items-center justify-center cursor-nwse-resize"
                        >
                          ↘
                        </span>
                      )}
                    </a>
                  );
                })()}

                {(() => {
                  const st = getElStyle("btnMore");
                  const w = st.width;
                  const h = st.height;
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
                        fontSize: `${st.fontSize ?? (isMobileSim ? 13 : 16)}px`,
                        fontFamily: st.fontFamily || "inherit",
                        fontWeight: st.bold ? 800 : 700,
                        fontStyle: st.italic ? "italic" : "normal",
                        width: w ? `${w}px` : undefined,
                        height: h ? `${h}px` : undefined,
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
                        <span
                          onMouseDown={(e) =>
                            handleDragResize(e, "btnMore", w || 130, h || 42)
                          }
                          title="টেনে বাটন বড়-ছোট করুন"
                          className="ml-0.5 w-4 h-4 rounded bg-black/25 text-[10px] flex items-center justify-center cursor-nwse-resize"
                        >
                          ↘
                        </span>
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
              paddingTop: `${
                isMobileSim ? 20 : globalSectionPaddingY * 0.8
              }px`,
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
                  const w = st.width || (isMobileSim ? 162 : 250);
                  const h = st.height || (isMobileSim ? 135 : 175);
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
                      style={{
                        ...getBoxCss(
                          cardKey,
                          "rgba(0,0,0,0.16)",
                          globalBorderRadius,
                          isMobileSim
                            ? 12
                            : Math.max(18, globalBoxPadding * 0.85),
                          globalBoxShadow
                        ),
                        width: `${w}px`,
                      }}
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
                            label: `ফিচার #${i + 1} শিরোনাম`,
                            type: "text",
                            contentPath: `features.${i}.title`,
                            styleKey: `featTitle_${i}`,
                          })
                        }
                        style={getTextCss(
                          `featTitle_${i}`,
                          isMobileSim ? 14 : 18,
                          "#F8F5EE",
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
                            label: `ফিচার #${i + 1} বিবরণ`,
                            type: "text",
                            contentPath: `features.${i}.subtitle`,
                            styleKey: `featSub_${i}`,
                          })
                        }
                        style={getTextCss(
                          `featSub_${i}`,
                          isMobileSim ? 12 : 14,
                          "#FFFFFF",
                          "center"
                        )}
                        className={`font-medium ${highlightClass(
                          `feat-sub-${i}`
                        )}`}
                      >
                        {getFieldValue(
                          `features.${i}.subtitle`,
                          feature.subtitle
                        )}
                      </p>

                      {isEditMode && (
                        <div
                          onMouseDown={(e) =>
                            handleDragResize(e, cardKey, w, h)
                          }
                          title="টেনে কার্ড বড়-ছোট করুন"
                          className="absolute bottom-2 right-2 w-5 h-5 rounded bg-black/40 text-white text-[10px] flex items-center justify-center cursor-nwse-resize"
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
              {/* ব্যাকগ্রাউন্ড ছাড়া ছবির ওপরের মাঝখানে পরিষ্কার লেখা */}
              {galleryBannerHeight > 0 && (
                <div className="pointer-events-none -mt-3 mb-2 z-30 flex flex-col items-center text-center">
                  <h2
                    onClick={(e) =>
                      handleSelect(e, {
                        id: "gallery-title",
                        label: "গ্যালারি হেডিং",
                        type: "text",
                        styleKey: "galleryTitle",
                      })
                    }
                    style={{
                      ...getTextCss(
                        "galleryTitle",
                        isMobileSim ? 13 : 16,
                        primaryColor,
                        "center"
                      ),
                      backgroundColor: "transparent",
                    }}
                    className="pointer-events-auto font-bold leading-tight drop-shadow-[0_1px_1px_rgba(255,255,255,0.9)]"
                  >
                    আমাদের পণ্যের গ্যালারি
                  </h2>
                </div>
              )}

              {/* ছবিগুলোর কন্টেইনার — কোনো ওভারফ্লো কাটিং ছাড়া */}
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
                  const perItemSize = itemSt.size ?? galleryCardSize;
                  const perItemZoom = itemSt.zoom ?? 100;
                  return (
                    <div
                      key={`${img.url}-${idx}`}
                      onClick={(e) => {
                        if (isEditMode) {
                          e.stopPropagation();
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
                      <span
                        style={{
                          backgroundColor: accentColor,
                          color: "#1E1B24",
                        }}
                        className="absolute top-2 left-2 z-10 text-[10px] font-extrabold px-2 py-0.5 rounded-full shadow"
                      >
                        #{idx + 1}
                      </span>

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
                      {isEditMode && (
                        <div
                          onMouseDown={(e) =>
                            handleDragResize(
                              e,
                              itemKey,
                              perItemSize,
                              perItemSize
                            )
                          }
                          title={`টেনে ছবি #${idx + 1} ছোট-বড় করুন`}
                          className="absolute bottom-2 right-2 z-30 w-5 h-5 rounded-md bg-[#73385E] text-white text-[10px] flex items-center justify-center cursor-nwse-resize shadow"
                        >
                          ↘
                        </div>
                      )}
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
                      className="absolute left-2 md:left-4 top-1/2 -translate-y-1/2 z-40 bg-white/90 hover:bg-white text-gray-900 p-2 md:p-2.5 rounded-full shadow-lg transition-all cursor-pointer active:scale-90"
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
                      className="absolute right-2 md:right-4 top-1/2 -translate-y-1/2 z-40 bg-white/90 hover:bg-white text-gray-900 p-2 md:p-2.5 rounded-full shadow-lg transition-all cursor-pointer active:scale-90"
                    >
                      <DynamicIcon name="ChevronRight" className="w-4 h-4" />
                    </button>
                  </>
                )}

                {galleryImages.length > 1 && (
                  <div className="absolute bottom-2 left-1/2 -translate-x-1/2 z-30 flex justify-center gap-1.5 bg-black/35 px-2.5 py-1 rounded-full">
                    {galleryImages.map((_, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setCurrentSlide(idx);
                        }}
                        aria-label={`Slide ${idx + 1}`}
                        style={{
                          backgroundColor:
                            currentSlide === idx ? accentColor : undefined,
                        }}
                        className={`h-2 rounded-full transition-all duration-300 cursor-pointer ${
                          currentSlide === idx
                            ? "w-6"
                            : "w-2 bg-white/40 hover:bg-white/70"
                        }`}
                      />
                    ))}
                  </div>
                )}
              </div>

              {isEditMode && (
                <div className="flex items-center justify-end gap-1.5 pt-1 relative z-30">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      applyStyle(
                        "galleryBanner",
                        "height",
                        Math.max(0, galleryBannerHeight - 40)
                      );
                    }}
                    title="ব্যানার ছোট করতে করতে একদম নাই করুন"
                    className="px-2 py-0.5 rounded bg-rose-600/90 hover:bg-rose-500 text-white text-[10px] font-bold cursor-pointer"
                  >
                    ব্যানার − (0 হলে নাই)
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      applyStyle(
                        "galleryBanner",
                        "height",
                        galleryBannerHeight + 40
                      );
                    }}
                    title="ব্যানার বড় করুন"
                    className="px-2 py-0.5 rounded bg-emerald-600/90 hover:bg-emerald-500 text-white text-[10px] font-bold cursor-pointer"
                  >
                    ব্যানার +
                  </button>
                  <div
                    onMouseDown={(e) =>
                      handleDragResize(
                        e,
                        "galleryBanner",
                        galleryBannerWidth || 720,
                        galleryBannerHeight
                      )
                    }
                    title="টেনে গ্যালারি ব্যানার ছোট-বড় করুন"
                    className="w-6 h-6 rounded-md bg-[#A2AB34] text-zinc-950 font-bold text-xs flex items-center justify-center cursor-nwse-resize shadow"
                  >
                    ↘
                  </div>
                </div>
              )}
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
              const st = getElStyle("detailsBox");
              const w = isMobileSim ? undefined : st.width;
              const h = st.height;
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
                  style={{
                    ...getBoxCss(
                      "detailsBox",
                      boxBgColor,
                      globalBorderRadius,
                      isMobileSim ? 16 : globalBoxPadding,
                      globalBoxShadow
                    ),
                    width: w ? `${w}px` : "100%",
                    minHeight: h ? `${h}px` : undefined,
                  }}
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
                        src={getFieldValue(
                          "details.imageUrl",
                          details.imageUrl
                        )}
                        alt="Details"
                        fill
                        sizes="(max-width: 768px) 100vw, 50vw"
                        style={getImageFilterCss("detailsImage")}
                        className="object-cover transition-transform duration-200"
                        unoptimized={isPreview}
                      />
                      {isEditMode && (
                        <div
                          onMouseDown={(e) =>
                            handleDragResize(
                              e,
                              "detailsImage",
                              getElStyle("detailsImage").width || 480,
                              getElStyle("detailsImage").height || 310
                            )
                          }
                          title="টেনে ছবি বড়-ছোট করুন"
                          className="absolute bottom-2 right-2 z-30 w-6 h-6 rounded-md bg-[#73385E] text-white text-xs flex items-center justify-center cursor-nwse-resize shadow"
                        >
                          ↘
                        </div>
                      )}
                    </div>
                  )}

                  {details.text1 && (
                    <p
                      onClick={(e) =>
                        handleSelect(e, {
                          id: "det-t1",
                          label: "Details বিবরণ ১",
                          type: "text",
                          contentPath: "details.text1",
                          styleKey: "detailsText1",
                        })
                      }
                      style={getTextCss(
                        "detailsText1",
                        isMobileSim ? 14 : 17,
                        mutedTextColor
                      )}
                      className={`mb-4 leading-relaxed ${highlightClass(
                        "det-t1"
                      )}`}
                    >
                      {getFieldValue("details.text1", details.text1)}
                    </p>
                  )}

                  {details.text2 && (
                    <div
                      style={{
                        borderRadius: `${Math.max(
                          8,
                          globalBorderRadius * 0.6
                        )}px`,
                      }}
                      className="border border-dashed border-[#73385E]/30 p-3.5 bg-[#A2AB34]/10"
                    >
                      <p
                        onClick={(e) =>
                          handleSelect(e, {
                            id: "det-t2",
                            label: "Details হাইলাইট",
                            type: "text",
                            contentPath: "details.text2",
                            styleKey: "detailsText2",
                          })
                        }
                        style={getTextCss(
                          "detailsText2",
                          isMobileSim ? 15 : 18,
                          primaryColor,
                          "center"
                        )}
                        className={`font-semibold ${highlightClass(
                          "det-t2"
                        )}`}
                      >
                        {getFieldValue("details.text2", details.text2)}
                      </p>
                    </div>
                  )}

                  {isEditMode && (
                    <div
                      onMouseDown={(e) =>
                        handleDragResize(e, "detailsBox", w || 520, h || 520)
                      }
                      title="টেনে বক্স বড়-ছোট করুন"
                      className="absolute bottom-2.5 right-2.5 w-6 h-6 rounded-md bg-[#73385E] text-white text-xs flex items-center justify-center cursor-nwse-resize shadow"
                    >
                      ↘
                    </div>
                  )}
                </div>
              );
            })()}
            {(() => {
              const st = getElStyle("detailsPointsBox");
              const w = st.width;
              const h = st.height;
              const btnSt = getElStyle("detailsOrderBtn");
              const btnW = btnSt.width;
              const btnH = btnSt.height;

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
                  style={{
                    ...getBoxCss(
                      "detailsPointsBox",
                      boxBgColor,
                      globalBorderRadius,
                      isMobileSim ? 16 : globalBoxPadding,
                      globalBoxShadow
                    ),
                    width: w ? `${w}px` : "100%",
                    minHeight: h ? `${h}px` : undefined,
                  }}
                  className={`border border-black/10 flex flex-col justify-between relative w-full ${highlightClass(
                    "details-box-r"
                  )}`}
                >
                  <div>
                    {details.pointsTitle && (
                      <h2
                        onClick={(e) =>
                          handleSelect(e, {
                            id: "det-pt-title",
                            label: "Details শিরোনাম",
                            type: "text",
                            contentPath: "details.pointsTitle",
                            styleKey: "detailsPointsTitle",
                          })
                        }
                        style={getTextCss(
                          "detailsPointsTitle",
                          isMobileSim ? 20 : globalSectionTitleSize,
                          primaryColor
                        )}
                        className={`font-bold mb-6 ${highlightClass(
                          "det-pt-title"
                        )}`}
                      >
                        {getFieldValue(
                          "details.pointsTitle",
                          details.pointsTitle
                        )}
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
                                  id: `det-p-t-${i}`,
                                  label: `পয়েন্ট #${i + 1} শিরোনাম`,
                                  type: "text",
                                  contentPath: `details.points.${i}.title`,
                                  styleKey: "detailsPointTitle",
                                })
                              }
                              style={getTextCss(
                                "detailsPointTitle",
                                isMobileSim ? 16 : 20,
                                primaryColor
                              )}
                              className={`font-bold mb-1 ${highlightClass(
                                `det-p-t-${i}`
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
                                  id: `det-p-d-${i}`,
                                  label: `পয়েন্ট #${i + 1} বিবরণ`,
                                  type: "text",
                                  contentPath: `details.points.${i}.description`,
                                  styleKey: "detailsPointDesc",
                                })
                              }
                              style={getTextCss(
                                "detailsPointDesc",
                                isMobileSim ? 13 : 15,
                                mutedTextColor
                              )}
                              className={`leading-relaxed ${highlightClass(
                                `det-p-d-${i}`
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
                        fontSize: `${btnSt.fontSize ?? 15}px`,
                        fontFamily: btnSt.fontFamily || "inherit",
                        fontWeight: btnSt.bold ? 800 : 700,
                        fontStyle: btnSt.italic ? "italic" : "normal",
                        width: btnW ? `${btnW}px` : undefined,
                        height: btnH ? `${btnH}px` : undefined,
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
                      {isEditMode && (
                        <span
                          onMouseDown={(e) =>
                            handleDragResize(
                              e,
                              "detailsOrderBtn",
                              btnW || 175,
                              btnH || 48
                            )
                          }
                          title="টেনে বাটন বড়-ছোট করুন"
                          className="ml-1 w-4 h-4 rounded bg-black/25 text-[10px] flex items-center justify-center cursor-nwse-resize"
                        >
                          ↘
                        </span>
                      )}
                    </a>
                  </div>

                  {isEditMode && (
                    <div
                      onMouseDown={(e) =>
                        handleDragResize(
                          e,
                          "detailsPointsBox",
                          w || 520,
                          h || 520
                        )
                      }
                      title="টেনে বক্স বড়-ছোট করুন"
                      className="absolute bottom-2.5 right-2.5 w-6 h-6 rounded-md bg-[#73385E] text-white text-xs flex items-center justify-center cursor-nwse-resize shadow"
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
                    {isEditMode && (
                      <div
                        onMouseDown={(e) =>
                          handleDragResize(
                            e,
                            "whyUsImage",
                            getElStyle("whyUsImage").width || 520,
                            getElStyle("whyUsImage").height || 480
                          )
                        }
                        title="টেনে ছবি বড়-ছোট করুন"
                        className="absolute bottom-2.5 right-2.5 z-30 w-6 h-6 rounded-md bg-[#A2AB34] text-zinc-950 font-bold text-xs flex items-center justify-center cursor-nwse-resize shadow"
                      >
                        ↘
                      </div>
                    )}
                  </div>
                )}

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
                      "#F8F5EE"
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
                        <div>
                          <p
                            onClick={(e) =>
                              handleSelect(e, {
                                id: `why-pt-${i}`,
                                label: `Why Us পয়েন্ট #${i + 1}`,
                                type: "text",
                                contentPath: `whyUs.points.${i}.title`,
                                styleKey: "whyUsPointText",
                              })
                            }
                            style={getTextCss(
                              "whyUsPointText",
                              isMobileSim ? 13 : 15,
                              "#FFFFFF"
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
                      <DynamicIcon name="ShoppingCart" className="w-4 h-4" />
                      অর্ডার করতে চাই
                    </a>
                    <a
                      href={isEditMode ? undefined : "#order"}
                      onClick={(e) => {
                        if (!isEditMode) {
                          e.preventDefault();
                          document
                            .getElementById("order")
                            ?.scrollIntoView({ behavior: "smooth" });
                        }
                      }}
                      style={{
                        borderRadius: `${Math.max(
                          10,
                          globalBorderRadius * 0.55
                        )}px`,
                      }}
                      className="bg-[#2E8B57] hover:bg-[#246B43] text-white px-6 py-3 font-bold shadow-md transform hover:-translate-y-0.5 transition-all duration-200 flex items-center gap-2 text-sm cursor-pointer"
                    >
                      <DynamicIcon name="MessageCircle" className="w-4 h-4" />
                      WhatsApp অর্ডার / যোগাযোগ
                    </a>
                  </div>
                </div>
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
                    primaryColor
                  )}
                  className={`font-bold mb-5 ${highlightClass("tgt-title")}`}
                >
                  {getFieldValue("targetAudience.title", targetAudience.title)}
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
                            label: `Target পয়েন্ট #${i + 1}`,
                            type: "text",
                            contentPath: `targetAudience.points.${i}`,
                            styleKey: "targetPoint",
                          })
                        }
                        style={getTextCss(
                          "targetPoint",
                          isMobileSim ? 14 : 16,
                          mutedTextColor
                        )}
                        className={highlightClass(`tgt-pt-${i}`)}
                      >
                        {typeof point === "object" && point !== null
                          ? getFieldValue(
                              `targetAudience.points.${i}`,
                              `${point.title || ""} ${
                                point.description ? `: ${point.description}` : ""
                              }`.trim()
                            )
                          : getFieldValue(`targetAudience.points.${i}`, point)}
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
              </div>

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
                  {isEditMode && (
                    <div
                      onMouseDown={(e) =>
                        handleDragResize(
                          e,
                          "targetImage",
                          getElStyle("targetImage").width || 520,
                          getElStyle("targetImage").height || 400
                        )
                      }
                      title="টেনে ছবি বড়-ছোট করুন"
                      className="absolute bottom-2.5 right-2.5 z-30 w-6 h-6 rounded-md bg-[#73385E] text-white text-xs flex items-center justify-center cursor-nwse-resize shadow"
                    >
                      ↘
                    </div>
                  )}
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
                      style={{
                        ...getBoxCss(
                          `packageBox_${i}`,
                          boxBgColor,
                          Math.max(10, globalBorderRadius * 0.6),
                          isMobileSim
                            ? 14
                            : Math.max(16, globalBoxPadding * 0.7),
                          globalBoxShadow
                        ),
                        width: pkgStyle.width
                          ? `${pkgStyle.width}px`
                          : "100%",
                      }}
                      className={`border border-black/10 relative w-full ${highlightClass(
                        `pkg-box-${i}`
                      )}`}
                    >
                      <div
                        onClick={(e) =>
                          handleSelect(e, {
                            id: `pkg-t-${i}`,
                            label: `প্যাক #${i + 1} নাম`,
                            type: "text",
                            contentPath: `packages.${i}.name`,
                            styleKey: "packageTitle",
                          })
                        }
                        style={getTextCss(
                          "packageTitle",
                          isMobileSim ? 16 : 18,
                          primaryColor
                        )}
                        className={`flex items-center gap-2 font-bold mb-1.5 ${highlightClass(
                          `pkg-t-${i}`
                        )}`}
                      >
                        <DynamicIcon
                          name={i === 0 ? "Users" : "Home"}
                          className="w-4 h-4 shrink-0"
                        />
                        <span>{getFieldValue(`packages.${i}.name`, pkg.name)}</span>
                      </div>
                      <p
                        onClick={(e) =>
                          handleSelect(e, {
                            id: `pkg-d-${i}`,
                            label: `প্যাক #${i + 1} বিবরণ`,
                            type: "text",
                            contentPath: `packages.${i}.description`,
                            styleKey: "packageDesc",
                          })
                        }
                        style={getTextCss(
                          "packageDesc",
                          isMobileSim ? 13 : 14,
                          mutedTextColor
                        )}
                        className={highlightClass(`pkg-d-${i}`)}
                      >
                        {getFieldValue(
                          `packages.${i}.description`,
                          pkg.description
                        )}
                      </p>
                      {isEditMode && (
                        <div
                          onMouseDown={(e) =>
                            handleDragResize(
                              e,
                              `packageBox_${i}`,
                              pkgStyle.width || 420,
                              pkgStyle.height || 120
                            )
                          }
                          title="টেনে প্যাক বক্স ছোট-বড় করুন"
                          className="absolute bottom-2 right-2 w-5 h-5 rounded bg-[#73385E] text-white text-[10px] flex items-center justify-center cursor-nwse-resize"
                        >
                          ↘
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              <a
                href={isEditMode ? undefined : "#order"}
                onClick={(e) => {
                  if (!isEditMode) {
                    e.preventDefault();
                    document
                      .getElementById("order")
                      ?.scrollIntoView({ behavior: "smooth" });
                  }
                }}
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
                  WhatsApp-এ যোগাযোগ ও অর্ডার করুন ({whatsappNumber})
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
          {(() => {
            const ordSt = getElStyle("orderFormBox");
            const ordW = ordSt.width;
            const ordH = ordSt.height;
            return (
              <div
                onClick={(e) =>
                  handleSelect(e, {
                    id: "order-form-box",
                    label: "Order Form বক্স",
                    type: "box",
                    styleKey: "orderFormBox",
                  })
                }
                style={{
                  ...getBoxCss(
                    "orderFormBox",
                    boxBgColor,
                    globalBorderRadius,
                    ordSt.padding ?? 8,
                    globalBoxShadow
                  ),
                  width: ordW ? `${ordW}px` : "100%",
                  minHeight: ordH ? `${ordH}px` : undefined,
                }}
                className={`mx-auto border border-black/10 relative w-full ${highlightClass(
                  "order-form-box"
                )}`}
              >
                <CheckoutForm pricing={pricing} isMobile={isMobileSim} />
                {isEditMode && (
                  <div
                    onMouseDown={(e) =>
                      handleDragResize(
                        e,
                        "orderFormBox",
                        ordW || 760,
                        ordH || 460
                      )
                    }
                    title="টেনে Order Form বক্স ছোট-বড় করুন"
                    className="absolute bottom-2.5 right-2.5 z-30 w-6 h-6 rounded-md bg-[#73385E] text-white text-xs flex items-center justify-center cursor-nwse-resize shadow"
                  >
                    ↘
                  </div>
                )}
              </div>
            );
          })()}
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