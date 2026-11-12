import { QrCode } from "lucide-react";
import QRGenerator from "@/components/QRGenerator";

export default function Home() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-5xl flex-col px-4 py-10 sm:py-16">
      <header className="mb-10 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-pink-500 to-violet-600 shadow-lg shadow-violet-900/40">
          <QrCode className="h-7 w-7 text-white" />
        </div>
        <h1 className="bg-gradient-to-r from-pink-300 via-violet-200 to-sky-300 bg-clip-text text-4xl font-extrabold tracking-tight text-transparent sm:text-5xl">
          QR Magic
        </h1>
        <p className="mt-3 text-slate-300">
          Turn any link or text into a QR code and download it as a PNG.
        </p>
      </header>

      <QRGenerator />

      <footer className="mt-auto pt-12 text-center text-xs text-slate-400">
        QR codes are generated in your browser. Nothing is uploaded.
      </footer>
    </main>
  );
}
