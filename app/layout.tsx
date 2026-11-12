import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "QR Magic",
  description: "Generate, download and save QR codes to Google Cloud Storage.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="antialiased font-sans">{children}</body>
    </html>
  );
}
