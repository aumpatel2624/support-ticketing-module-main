import { Inter, Outfit } from "next/font/google";
import "./globals.css";
import Toaster from "@/components/common/Toaster";
import RouteGuard from "@/components/auth/RouteGuard";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
  display: "swap",
});

export const metadata = {
  title: "Ticketing System",
  description: "Professional Support Ticketing System for efficient ticket management",
  icons: {
    icon: "/logo.webp",
    shortcut: "/logo.webp",
    apple: "/logo.webp",
  },
};

import PageTitleUpdater from "@/components/common/PageTitleUpdater";

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body
        className={`${inter.variable} ${outfit.variable} antialiased`}
      >
        <PageTitleUpdater />
        <RouteGuard>
          {children}
        </RouteGuard>
        <Toaster />
      </body>
    </html>
  );
}
