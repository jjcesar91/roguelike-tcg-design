import type { Metadata } from "next";
import { MedievalSharp, Cormorant_Garamond } from "next/font/google";
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

export const metadata: Metadata = {
  title: "Code Scaffold",
  description: "Modern Next.js scaffold built with TypeScript, Tailwind CSS, and shadcn/ui.",
  keywords: ["Next.js", "TypeScript", "Tailwind CSS", "shadcn/ui", "React"],
  authors: [{ name: "Development Team" }],
  openGraph: {
  title: "Code Scaffold",
  description: "Development with modern React stack",
  url: "",
  siteName: "Code Scaffold",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
  title: "Code Scaffold",
  description: "Development with modern React stack",
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
        className={`${medievalSharp.variable} ${cormorantGaramond.variable} antialiased text-foreground min-h-screen font-garamond`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
