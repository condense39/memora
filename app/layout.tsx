import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Memora — Event & Media Management",
    template: "%s | Memora",
  },
  description:
    "Memora is a production-ready event and media management platform for clubs and societies. Organize, share, and relive your memories beautifully.",
  keywords: [
    "event management",
    "media gallery",
    "photo sharing",
    "club management",
    "society photos",
  ],
  openGraph: {
    title: "Memora — Event & Media Management",
    description: "Your memories, beautifully organized.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="antialiased bg-gray-50 min-h-screen">
        {children}
        <Toaster position="bottom-right" theme="light" />
      </body>
    </html>
  );
}
