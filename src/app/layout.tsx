import type { Metadata } from "next";
import { MedievalSharp, Cormorant_Garamond, Cinzel } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const medievalSharp = MedievalSharp({
  variable: "--font-medieval",
  subsets: ["latin"],
  weight: "400",
});

const cormorantGaramond = Cormorant_Garamond({
  variable: "--font-garamond",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
});

const cinzel = Cinzel({
  variable: "--font-gothic",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: "Z.ai Code Scaffold - AI-Powered Development",
  description: "Modern Next.js scaffold optimized for AI-powered development with Z.ai. Built with TypeScript, Tailwind CSS, and shadcn/ui.",
  keywords: ["Z.ai", "Next.js", "TypeScript", "Tailwind CSS", "shadcn/ui", "AI development", "React"],
  authors: [{ name: "Z.ai Team" }],
  viewport: "width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no",
  openGraph: {
    title: "Z.ai Code Scaffold",
    description: "AI-powered development with modern React stack",
    url: "https://chat.z.ai",
    siteName: "Z.ai",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Z.ai Code Scaffold",
    description: "AI-powered development with modern React stack",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${medievalSharp.variable} ${cormorantGaramond.variable} ${cinzel.variable} antialiased text-foreground min-h-screen font-gothic`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
