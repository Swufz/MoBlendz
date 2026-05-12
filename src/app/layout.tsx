import type { Metadata } from "next";
import { Allura, Inter, Outfit } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
});

const allura = Allura({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-allura",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://www.moblendz.co"),
  title: "MoBlendz | Private Barber Appointments",
  description:
    "Book your next cut with MoBlendz. Choose your service, pick a time, and pay cash when you arrive.",
  openGraph: {
    title: "MoBlendz | Private Barber Appointments",
    description:
      "Book your next cut with MoBlendz. Choose your service, pick a time, and pay cash when you arrive.",
    url: "https://www.moblendz.co",
    siteName: "MoBlendz",
    images: [
      {
        url: "https://www.moblendz.co/mb-logo.png",
        width: 1200,
        height: 630,
        alt: "MoBlendz logo",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "MoBlendz | Private Barber Appointments",
    description:
      "Book your next cut with MoBlendz. Choose your service, pick a time, and pay cash when you arrive.",
    images: ["https://www.moblendz.co/mb-logo.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${outfit.variable} ${allura.variable} h-full antialiased`}
    >
      <body
        className="flex min-h-full flex-col bg-background text-foreground"
        suppressHydrationWarning
      >
        {children}
      </body>
    </html>
  );
}
