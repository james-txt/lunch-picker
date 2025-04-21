import type { Metadata } from "next";
import { Raleway } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { Analytics } from "@vercel/analytics/react"

const raleway = Raleway({
  subsets: ["latin"],
  weight: ['300', '400', '500', '600', '700'],
  variable: "--font-raleway",
});

export const metadata: Metadata = {
  title: "Lunch Picker",
  description: "A simple app to help pick lunch spots",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${raleway.variable} font-raleway`}>
      <body>
        {children}
        <Toaster />
        <Analytics />
      </body>
    </html>
  );
}
