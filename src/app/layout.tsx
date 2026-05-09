import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Mo Blendz",
  description: "Book clean cuts, track rewards, and manage appointments.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body
        className="flex min-h-full flex-col bg-background text-foreground"
        suppressHydrationWarning
      >
        {children}
      </body>
    </html>
  );
}
