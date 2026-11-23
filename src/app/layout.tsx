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
  title: "Grape Cluster Hanging Soap",
  description: "আপনার বাথরুমেও যোগ করবে সৌন্দর্য।।",
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