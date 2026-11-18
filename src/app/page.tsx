import { getSiteContent } from "@/lib/data";
import { DynamicIcon } from "@/components/DynamicIcon";
import CheckoutForm from "@/components/CheckoutForm";
import FAQSection from "@/components/FAQSection";
import Image from "next/image";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const content = await getSiteContent();

  const hero = content?.hero || {};
  
  const heroBadge = hero.badge && hero.badge.trim() !== "" ? hero.badge : "Premium Khejur Gur";
  const heroTitle = hero.title && hero.title.trim() !== "" ? hero.title : "প্রতিটি কামডে খাঁটি গ্রামবাংলার স্বাদ";
  const heroTags = hero.tags && hero.tags.length > 0 ? hero.tags : ["১০০% খাঁটি", "চিনিমুক্ত", "ঐতিহ্যবাহী স্বাদ"];
  const heroDescription = hero.description && hero.description.trim() !== "" ? hero.description : "সাধারণ গুড় নয়। শীতের সকালের ঘ্রাণ আর সুবাস নিয়ে, সরাসরি গাছ থেকে সংগ্রহ করা রসে তৈরি Gramer Gur - এর খাঁটি খেজুরের গুড়। কোনো চিনি বা কৃত্রিম রং ছাড়া, ঐতিহ্যবাহী পদ্ধতিতে জ্বাল।";
  const heroImageUrl = hero.imageUrl && hero.imageUrl.trim() !== "" ? hero.imageUrl : "/images/hero-gur.png";

  const details = content?.details || {};
  const whyUs = content?.whyUs || {};
  const targetAudience = content?.targetAudience || {};
  const pricing = content?.pricing || { productPrice: 1250, shippingInside: 60, shippingOutside: 120 };

  return (
    <main className="min-h-screen bg-brand-bg text-brand-text">
      {/* Hero Section */}
      <section className="container mx-auto px-4 py-12 md:py-20 max-w-6xl">
        <div className="grid md:grid-cols-2 gap-10 items-center">
          <div>
            <span className="inline-block bg-[#F8F5EC] text-brand-text px-4 py-1.5 rounded-full text-sm font-medium border border-[#EBE3CD] mb-6 shadow-xs">
              {heroBadge}
            </span>
            
            <h1 className="text-4xl md:text-6xl font-extrabold text-brand-heading leading-tight mb-6">
              {heroTitle}
            </h1>
            
            <div className="flex flex-wrap gap-2.5 mb-6">
              {heroTags.map((tag: string, i: number) => {
                const cleanTag = tag.replace(/^✓\s*/, '');
                return (
                  <span key={i} className="bg-[#F8F5EC] text-sm font-medium px-3.5 py-1.5 rounded-lg border border-[#EBE3CD] shadow-2xs whitespace-nowrap">
                    ✓ {cleanTag}
                  </span>
                );
              })}
            </div>
            
            <p className="text-lg text-gray-600 mb-8 leading-relaxed">
              {heroDescription}
            </p>
            
            {/* Professional 3D & Smooth Touch/Hover Effect Buttons */}
            <div className="flex flex-wrap gap-4">
              <a 
                href="#order" 
                className="bg-brand-button hover:bg-brand-button-hover text-white px-9 py-4 rounded-xl font-bold shadow-md hover:shadow-lg transform hover:-translate-y-1 active:scale-95 transition-all duration-200 flex items-center gap-2 cursor-pointer"
              >
                <DynamicIcon name="ShoppingCart" className="w-5 h-5" />
                অর্ডার করতে চাই
              </a>
              <a 
                href="#details" 
                className="bg-brand-header hover:bg-[#5a2c4a] text-white px-9 py-4 rounded-xl font-bold shadow-md hover:shadow-lg transform hover:-translate-y-1 active:scale-95 transition-all duration-200 flex items-center gap-2 cursor-pointer"
              >
                আরও জানুন ↓
              </a>
            </div>
          </div>
          
          <div className="relative h-[400px] md:h-[500px] rounded-3xl overflow-hidden shadow-2xl border-4 border-white">
            <Image 
              src={heroImageUrl} 
              alt="Khejur Gur" 
              fill 
              sizes="(max-width: 768px) 100vw, 50vw"
              className="object-cover"
              priority
            />
          </div>
        </div>
      </section>

      {/* Features Section - এখানে স্টাইল দিয়ে সরাসরি ক্রিম কালার ফিক্স করে দেওয়া হয়েছে */}
      {content?.features && content.features.length > 0 && (
        <section className="bg-brand-header py-14 shadow-inner">
          <div className="container mx-auto px-4 max-w-6xl">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
              {content.features.map((feature: any, i: number) => (
                <div 
                  key={i} 
                  className="bg-black/15 border border-white/25 rounded-2xl p-6 flex flex-col items-center text-center shadow-lg hover:bg-black/25 transform hover:-translate-y-1 transition-all duration-200"
                >
                  <DynamicIcon name={feature.icon} className="w-10 h-10 mb-3" style={{ color: "#F4ECD8" }} strokeWidth={1.5} />
                  <h3 className="font-bold text-lg mb-1 drop-shadow-sm" style={{ color: "#F4ECD8" }}>{feature.title}</h3>
                  <p className="text-white text-xs md:text-sm font-medium">{feature.subtitle}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Details Section */}
      <section id="details" className="container mx-auto px-4 py-16 max-w-6xl">
        <div className="grid md:grid-cols-2 gap-10">
          <div className="border border-gray-200 rounded-2xl p-6 bg-white shadow-md">
            {details.imageUrl && (
              <div className="relative h-[300px] rounded-xl overflow-hidden mb-6 shadow-inner">
                <Image 
                  src={details.imageUrl} 
                  alt="Details" 
                  fill 
                  sizes="(max-width: 768px) 100vw, 50vw"
                  className="object-cover" 
                />
              </div>
            )}
            {details.text1 && <p className="text-gray-700 mb-6 text-lg leading-relaxed">{details.text1}</p>}
            {details.text2 && (
              <div className="border border-dashed border-gray-300 p-4 rounded-xl bg-gray-50">
                <p className="text-brand-heading font-medium text-center">{details.text2}</p>
              </div>
            )}
          </div>

          <div className="border border-gray-200 rounded-2xl p-8 bg-white shadow-md flex flex-col justify-between">
            <div>
              {details.pointsTitle && <h2 className="text-3xl font-bold text-brand-heading mb-8">{details.pointsTitle}</h2>}
              <div className="space-y-8">
                {details.points?.map((point: any, i: number) => (
                  <div key={i} className="flex gap-4">
                    <div className="mt-1">
                      <DynamicIcon name="CheckCircle2" className="w-6 h-6 text-brand-heading" />
                    </div>
                    <div>
                      <h3 className="font-bold text-xl text-brand-heading mb-2">{point.title}</h3>
                      <p className="text-gray-600 leading-relaxed">{point.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="mt-10">
              <a 
                href="#order" 
                className="inline-block bg-brand-button hover:bg-brand-button-hover text-white px-9 py-4 rounded-xl font-bold shadow-md hover:shadow-lg transform hover:-translate-y-1 active:scale-95 transition-all duration-200 text-center"
              >
                অর্ডার করতে চাই
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Why Us Section */}
      {whyUs?.title && (
        <section className="bg-brand-header py-16 text-white shadow-inner">
          <div className="container mx-auto px-4 max-w-6xl">
            <div className="grid md:grid-cols-2 gap-10 items-center">
              {whyUs.imageUrl && (
                <div className="relative h-[500px] rounded-2xl overflow-hidden shadow-2xl border-2 border-white/20">
                  <Image 
                    src={whyUs.imageUrl} 
                    alt="Why Us" 
                    fill 
                    sizes="(max-width: 768px) 100vw, 50vw"
                    className="object-cover" 
                  />
                  <div className="absolute bottom-6 right-6 text-right">
                     <span className="font-serif text-2xl drop-shadow-lg" style={{ color: "#F4ECD8" }}>গ্রাম বাংলার<br/>ঐতিহ্য</span>
                  </div>
                </div>
              )}
              
              <div className="border border-white/20 rounded-2xl p-8 md:p-10 bg-black/15 shadow-xl">
                <h2 className="text-3xl font-bold mb-8 drop-shadow-sm" style={{ color: "#F4ECD8" }}>{whyUs.title}</h2>
                <div className="space-y-6">
                  {whyUs.points?.map((point: any, i: number) => (
                    <div key={i} className="flex gap-4">
                      <DynamicIcon name="CheckSquare" className="w-6 h-6 flex-shrink-0 mt-1" style={{ color: "#F4ECD8" }} />
                      <div>
                        <p className="text-white leading-relaxed font-medium">
                          <span className="font-bold" style={{ color: "#F4ECD8" }}>{point.title}</span> {point.description && `: ${point.description}`}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="mt-10 flex flex-wrap gap-4">
                  <a 
                    href="#order" 
                    className="bg-brand-button hover:bg-brand-button-hover text-white px-9 py-4 rounded-xl font-bold shadow-md hover:shadow-lg transform hover:-translate-y-1 active:scale-95 transition-all duration-200 flex items-center gap-2"
                  >
                    <DynamicIcon name="ShoppingCart" className="w-5 h-5" />
                    অর্ডার করতে চাই
                  </a>
                  <a 
                    href="https://wa.me/8801823902192" 
                    target="_blank" 
                    rel="noreferrer" 
                    className="bg-[#2E8B57] hover:bg-[#246B43] text-white px-9 py-4 rounded-xl font-bold shadow-md hover:shadow-lg transform hover:-translate-y-1 active:scale-95 transition-all duration-200 flex items-center gap-2"
                  >
                    <DynamicIcon name="MessageCircle" className="w-5 h-5" />
                    WhatsApp
                  </a>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Target Audience & Packages */}
      <section className="container mx-auto px-4 py-16 max-w-6xl">
        {targetAudience?.title && (
          <div className="grid md:grid-cols-2 gap-10 mb-16 items-center">
            <div className="border border-gray-200 rounded-2xl p-8 bg-white shadow-md">
              <h2 className="text-3xl font-bold text-brand-heading mb-6">{targetAudience.title}</h2>
              <div className="space-y-4 mb-8">
                {targetAudience.points?.map((point: string, i: number) => (
                  <div key={i} className="flex gap-3 items-center">
                    <DynamicIcon name="CheckCheck" className="w-5 h-5 text-brand-heading flex-shrink-0" />
                    <p className="text-gray-700">{point}</p>
                  </div>
                ))}
              </div>
              <a 
                href="#order" 
                className="inline-block bg-brand-button hover:bg-brand-button-hover text-white px-9 py-4 rounded-xl font-bold shadow-md hover:shadow-lg transform hover:-translate-y-1 active:scale-95 transition-all duration-200"
              >
                <DynamicIcon name="ShoppingCart" className="w-5 h-5 inline mr-2" />
                অর্ডার করতে চাই
              </a>
            </div>
            {targetAudience.imageUrl && (
              <div className="relative h-[400px] rounded-2xl overflow-hidden shadow-md">
                <Image 
                  src={targetAudience.imageUrl} 
                  alt="Target" 
                  fill 
                  sizes="(max-width: 768px) 100vw, 50vw"
                  className="object-cover" 
                />
              </div>
            )}
          </div>
        )}

        <div className="grid md:grid-cols-2 gap-10">
          <div>
            <div className="bg-brand-header text-white p-4 rounded-t-xl font-bold flex items-center gap-2 shadow-sm">
              <DynamicIcon name="Gift" className="w-5 h-5" />
              আপনার জন্য কোন প্যাকটি?
            </div>
            <div className="space-y-4 mt-4">
              {content?.packages?.map((pkg: any, i: number) => (
                <div key={i} className="border border-gray-300 rounded-xl p-4 bg-white shadow-xs">
                  <div className="flex items-center gap-2 font-bold text-lg mb-2">
                    <DynamicIcon name={i === 0 ? "Users" : "Home"} className="w-5 h-5 text-gray-700" />
                    {pkg.name}
                  </div>
                  <p className="text-gray-600">{pkg.description}</p>
                </div>
              ))}
            </div>
            <a 
              href="https://wa.me/8801823902192" 
              target="_blank" 
              rel="noreferrer" 
              className="w-full mt-6 bg-[#2E8B57] hover:bg-[#246B43] text-white py-4 rounded-xl font-bold shadow-md hover:shadow-lg transform hover:-translate-y-1 active:scale-95 transition-all duration-200 flex items-center justify-center gap-2"
            >
              <DynamicIcon name="MessageCircle" className="w-5 h-5" />
              WhatsApp-এ যোগাযোগ করুন
            </a>
          </div>

          <div>
            <div className="bg-brand-button text-white p-4 rounded-t-xl font-bold text-center text-xl shadow-sm">
              সচরাচর জানতে চাওয়া প্রশ্ন
            </div>
            <div className="border border-gray-200 border-t-0 rounded-b-xl p-6 bg-brand-offer/30 shadow-xs">
              <FAQSection faqs={content?.faqs || []} />
            </div>
          </div>
        </div>
      </section>

      {/* Checkout Section */}
      <section id="order" className="container mx-auto px-4 max-w-4xl pb-20">
        <CheckoutForm pricing={pricing} />
      </section>
      
      {/* Footer */}
      <footer className="bg-brand-heading py-8 text-center text-white/70 border-t border-white/10">
        <p>© {new Date().getFullYear()} Gramer Khejur Gur. All rights reserved.</p>
      </footer>
    </main>
  );
}