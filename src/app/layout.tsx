import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import { Cursor } from "@/components/ui/inverted-cursor";
import LenisProvider from "@/components/LenisProvider";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Adhil Shahid Portfolio",
  description: "A high-end personal portfolio built with Next.js and HTML5 Canvas.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark h-full antialiased bg-[#050505]">
      <body className={`${inter.className} min-h-full flex flex-col bg-[#050505] text-white overflow-x-hidden`}>
        <LenisProvider>
          <Navbar />
          {children}
          <Cursor />
        </LenisProvider>
      </body>
    </html>
  );
}
