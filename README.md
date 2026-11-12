# QR Magic

A simple, modern QR code generator. Type a link or any text, get a QR code instantly, then download it as a PNG or save it to the cloud.

## Features

- **Instant QR codes:** enter a URL or text and press **Generate QR** (or hit Enter).
- **Live preview:** the QR code appears in a preview card along with the text it encodes.
- **Download PNG:** save a high-resolution (512 × 512) PNG with one click.
- **Save to Cloud:** upload the QR image and get a private, time-limited link to it.
- **Clear feedback:** loading spinners, success and error messages.
- **Responsive:** works on phones, tablets and desktops.

## How to use

1. Enter a URL (for example `https://example.com`) or any text, up to 1,500 characters.
2. Click **Generate QR**. Use Shift+Enter if you need a new line in the text.
3. Click **PNG** to download the image, or **Save to Cloud** to upload it.
4. After saving, click **Open signed link** to view the stored image. The link expires after 1 hour.

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

Generating and downloading QR codes works right away. **Save to Cloud** needs storage settings supplied as environment variables when the app starts: `GCP_PROJECT_ID`, `GCP_BUCKET_NAME` and `GCP_SERVICE_ACCOUNT_JSON`.

## Project structure

```
app/
  page.tsx                  Main page
  api/qr/upload/route.ts    POST endpoint that stores a QR PNG
components/
  QRGenerator.tsx           Input, preview, download and save UI
lib/
  gcp-storage.ts            Server-only storage upload helper
```

## Build for production

```bash
npm run build
```

A `Dockerfile` is included for running the app in a container.
