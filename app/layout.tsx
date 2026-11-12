import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "QR Magic",
  description: "Generate QR codes from any link or text and download them as PNG.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="antialiased font-sans">{children}</body>
    </html>
  );
}
