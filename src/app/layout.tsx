import type { Metadata } from "next";
import { Hind_Siliguri } from "next/font/google";
import "./globals.css";

const hindSiliguri = Hind_Siliguri({
  subsets: ["bengali", "latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-hind-siliguri",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Gramer Khejur Gur - খাঁটি খেজুরের গুড়",
  description: "সাধারণ গুড় নয়। শীতের সকালের ঘ্রাণ আর সুবাস নিয়ে সরাসরি গাছ থেকে সংগ্রহ করা রসে তৈরি খাঁটি খেজুরের গুড়।",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="bn" className={hindSiliguri.variable} data-scroll-behavior="smooth">
      <body 
        className={`${hindSiliguri.className} antialiased font-sans`} 
        suppressHydrationWarning={true}
      >
        {children}
      </body>
    </html>
  );
}