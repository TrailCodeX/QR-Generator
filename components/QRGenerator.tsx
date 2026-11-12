"use client";

import { useState } from "react";
import QRCode from "qrcode";
import { CircleAlert, Download, LoaderCircle, QrCode, Sparkles } from "lucide-react";

const MAX_LENGTH = 1500;

export default function QRGenerator() {
  const [text, setText] = useState("");
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [encodedText, setEncodedText] = useState("");
  const [generating, setGenerating] = useState(false);
  const [genError, setGenError] = useState<string | null>(null);

  async function generate(e?: React.FormEvent) {
    e?.preventDefault();
    const value = text.trim();
    if (!value) {
      setGenError("Please enter a URL or some text first.");
      return;
    }
    setGenerating(true);
    setGenError(null);
    try {
      const url = await QRCode.toDataURL(value, {
        width: 512,
        margin: 2,
        errorCorrectionLevel: "M",
        color: { dark: "#1e1b4b", light: "#ffffff" },
      });
      setQrDataUrl(url);
      setEncodedText(value);
    } catch {
      setGenError("Couldn't generate a QR code for that input. Try shorter text.");
      setQrDataUrl(null);
    } finally {
      setGenerating(false);
    }
  }

  function download() {
    if (!qrDataUrl) return;
    const a = document.createElement("a");
    a.href = qrDataUrl;
    a.download = `qr-magic-${Date.now()}.png`;
    a.click();
  }

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {/* Input card */}
      <form
        onSubmit={generate}
        className="flex flex-col rounded-3xl border border-white/10 bg-white/10 p-6 shadow-2xl shadow-black/30 backdrop-blur-xl"
      >
        <label htmlFor="qr-text" className="mb-2 text-sm font-semibold text-slate-200">
          URL or text
        </label>
        <textarea
          id="qr-text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) generate(e);
          }}
          maxLength={MAX_LENGTH}
          rows={5}
          placeholder="https://example.com"
          className="w-full resize-none rounded-2xl border border-white/15 bg-black/30 px-4 py-3 text-base text-white placeholder:text-slate-500 outline-none transition focus:border-violet-400 focus:ring-2 focus:ring-violet-400/40"
        />
        <div className="mt-1 flex justify-between text-xs text-slate-400">
          <span>Enter to generate · Shift+Enter for a new line</span>
          <span>
            {text.length}/{MAX_LENGTH}
          </span>
        </div>

        {genError && (
          <p className="mt-3 flex items-center gap-2 text-sm text-rose-300">
            <CircleAlert className="h-4 w-4 shrink-0" /> {genError}
          </p>
        )}

        <button
          type="submit"
          disabled={generating}
          className="mt-5 inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-pink-500 to-violet-600 px-5 py-3 font-semibold text-white shadow-lg shadow-violet-900/40 transition hover:brightness-110 active:scale-[0.98] disabled:opacity-60"
        >
          {generating ? (
            <LoaderCircle className="h-5 w-5 animate-spin" />
          ) : (
            <Sparkles className="h-5 w-5" />
          )}
          Generate QR
        </button>
      </form>

      {/* Preview card */}
      <section className="flex flex-col items-center rounded-3xl border border-white/10 bg-white/10 p-6 shadow-2xl shadow-black/30 backdrop-blur-xl">
        <div className="flex aspect-square w-full max-w-72 items-center justify-center overflow-hidden rounded-2xl bg-white p-3">
          {qrDataUrl ? (
            <img src={qrDataUrl} alt={`QR code for ${encodedText}`} className="h-full w-full" />
          ) : (
            <div className="flex flex-col items-center gap-2 text-slate-400">
              <QrCode className="h-16 w-16" strokeWidth={1.25} />
              <span className="text-sm">Your QR code will appear here</span>
            </div>
          )}
        </div>

        {qrDataUrl && (
          <p className="mt-3 w-full max-w-72 truncate text-center text-xs text-slate-300" title={encodedText}>
            {encodedText}
          </p>
        )}

        <button
          type="button"
          onClick={download}
          disabled={!qrDataUrl}
          className="mt-5 inline-flex w-full max-w-72 items-center justify-center gap-2 rounded-2xl bg-sky-500 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-sky-900/40 transition hover:bg-sky-400 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Download className="h-4 w-4" /> Download PNG
        </button>
      </section>
    </div>
  );
}
