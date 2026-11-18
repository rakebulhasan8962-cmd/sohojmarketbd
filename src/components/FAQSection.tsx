"use client";

import { useState } from "react";

export default function FAQSection({ faqs }: { faqs: any[] }) {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <div className="space-y-5">
      {faqs &&
        faqs.map((faq, index) => {
          const isOpen = openIndex === index;
          return (
            <div key={index} className="border-b border-gray-300/80 pb-4 last:border-none last:pb-0">
              <button
                type="button"
                onClick={() => toggleFAQ(index)}
                className="flex w-full items-center gap-3 text-left focus:outline-none group cursor-pointer"
              >
                <span className="flex h-6 w-6 shrink-0 items-center justify-center text-[#1E2532]">
                  {isOpen ? (
                    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round">
                      <line x1="5" y1="12" x2="19" y2="12" />
                    </svg>
                  ) : (
                    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round">
                      <line x1="12" y1="5" x2="12" y2="19" />
                      <line x1="5" y1="12" x2="19" y2="12" />
                    </svg>
                  )}
                </span>

                <span className="text-[18px] font-bold text-[#1E2532] group-hover:text-brand-button transition-colors">
                  {faq.question}
                </span>
              </button>

              <div 
                className={`grid transition-all duration-300 ease-in-out overflow-hidden ${
                  isOpen ? "grid-rows-[1fr] opacity-100 mt-3" : "grid-rows-[0fr] opacity-0 mt-0"
                }`}
              >
                <div className="overflow-hidden">
                  <div className="rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm text-gray-700 leading-relaxed shadow-xs">
                    {faq.answer}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
    </div>
  );
}