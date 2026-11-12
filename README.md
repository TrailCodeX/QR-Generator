# QR Magic

A simple, modern QR code generator. Type a link or any text, get a QR code instantly, and download it as a PNG.

## Features

- **Instant QR codes:** enter a URL or text and press **Generate QR** (or hit Enter).
- **Live preview:** the QR code appears in a preview card along with the text it encodes.
- **Download PNG:** save a high-resolution (512 × 512) PNG with one click.
- **Private:** QR codes are generated entirely in the browser. Nothing is uploaded.
- **Responsive:** works on phones, tablets and desktops.

## How to use

1. Enter a URL (for example `https://example.com`) or any text, up to 1,500 characters.
2. Click **Generate QR**. Use Shift+Enter if you need a new line in the text.
3. Click **Download PNG** to save the image.

## Tech stack

- [Next.js](https://nextjs.org) (App Router) and TypeScript
- Tailwind CSS
- [`qrcode`](https://www.npmjs.com/package/qrcode) for QR generation
- Lucide React icons

## Getting started

```bash
npm install
npm run dev
```

Open http://localhost:3000.

## Build

```bash
npm run build
```

This produces a static site in the `out/` folder, which any static host can serve.

## Project structure

```
app/
  page.tsx              Main page
  layout.tsx            Page shell and metadata
components/
  QRGenerator.tsx       Input, preview and download UI
```
