# QR Magic

A small Next.js app that generates QR codes, downloads them as PNG, and saves them to a **private** Google Cloud Storage bucket, returning a 1‑hour signed URL.

Built to exercise Infisical's Google Cloud integration: every GCP setting comes from environment variables, and the app contains no Infisical SDK.

| Variable | Description |
| --- | --- |
| `GCP_PROJECT_ID` | GCP project ID |
| `GCP_BUCKET_NAME` | Private bucket that receives the QR PNGs |
| `GCP_SERVICE_ACCOUNT_JSON` | Service account key JSON (raw JSON or base64 of it) |

Credentials are read only in `lib/gcp-storage.ts` (marked `server-only`), so they can never be bundled into client code. API responses never include them.

---

## 1. Install

```bash
npm install
```

## 2. Local development

Inject the variables from Infisical (recommended) or export them in your shell. Do **not** create `.env` files.

```bash
# With the Infisical CLI
infisical login
infisical init                        # link this folder to your Infisical project
infisical run --env=dev -- npm run dev

# Or manually (bash)
export GCP_PROJECT_ID=my-project
export GCP_BUCKET_NAME=my-qr-bucket
export GCP_SERVICE_ACCOUNT_JSON="$(cat ~/secure/qr-magic-key.json)"
npm run dev
```

Open http://localhost:3000.

## 3. GCP project and bucket setup

```bash
export PROJECT_ID=my-project
export REGION=us-central1
export BUCKET=qr-magic-$PROJECT_ID

gcloud config set project $PROJECT_ID
gcloud services enable storage.googleapis.com run.googleapis.com \
  artifactregistry.googleapis.com cloudbuild.googleapis.com secretmanager.googleapis.com

# Private bucket: uniform access and public access prevention turned on
gcloud storage buckets create gs://$BUCKET --location=$REGION \
  --uniform-bucket-level-access --public-access-prevention
```

## 4. Service account and permissions

```bash
gcloud iam service-accounts create qr-magic-uploader --display-name="QR Magic uploader"
export SA=qr-magic-uploader@$PROJECT_ID.iam.gserviceaccount.com

# Granted on the bucket only, not the whole project
gcloud storage buckets add-iam-policy-binding gs://$BUCKET \
  --member=serviceAccount:$SA --role=roles/storage.objectCreator
gcloud storage buckets add-iam-policy-binding gs://$BUCKET \
  --member=serviceAccount:$SA --role=roles/storage.objectViewer

# Create a key, store it in Infisical, then delete the local copy
gcloud iam service-accounts keys create qr-magic-key.json --iam-account=$SA
```

| Role | Why |
| --- | --- |
| `roles/storage.objectCreator` | Upload PNGs (`storage.objects.create`) |
| `roles/storage.objectViewer` | Signed URLs only work if the signing account can read the object (`storage.objects.get`) |

Signed URLs are created locally from the key's private key, so the account does not need `iam.serviceAccountTokenCreator`.

> If your organization enforces `iam.disableServiceAccountKeyCreation`, either get an exception for this test project or have Infisical manage the key (see below).

## 5. Infisical configuration

1. In Infisical, create a project (for example `qr-magic`) with `dev` and `prod` environments.
2. Add these secrets to each environment:
   - `GCP_PROJECT_ID`
   - `GCP_BUCKET_NAME`
   - `GCP_SERVICE_ACCOUNT_JSON`: paste the full contents of `qr-magic-key.json`. Multi-line values are fine. If you prefer, store `base64 -w0 qr-magic-key.json` instead; the app accepts both.
3. Delete the local key file: `rm qr-magic-key.json`.
4. Connect Infisical to GCP: **Integrations → App Connections → GCP**. Follow Infisical's steps to grant its service account impersonation on a GCP service account that has `roles/secretmanager.admin` in your project.
5. Create a **Secret Sync → GCP Secret Manager** for the `prod` environment that targets your project. Each Infisical key becomes a Secret Manager secret with the same name (`GCP_PROJECT_ID`, `GCP_BUCKET_NAME`, `GCP_SERVICE_ACCOUNT_JSON`).
6. Cloud Run reads those secrets (see section 7).

**Rotation test**

1. Create a new key: `gcloud iam service-accounts keys create new-key.json --iam-account=$SA`.
2. Update `GCP_SERVICE_ACCOUNT_JSON` in Infisical. The sync pushes a new Secret Manager version.
3. Roll out a new Cloud Run revision so it reads `:latest`:
   `gcloud run services update qr-magic --region=$REGION --update-labels=rotated=$(date +%s)`
4. Delete the old key (`gcloud iam service-accounts keys list/delete ...`). Then save a QR code again. A successful upload confirms the new credential is live. If the old key were still in use, the UI would show *"Google Cloud rejected the service account credentials."*

Locally, restart `infisical run -- npm run dev` to pick up the change. The app also rebuilds its GCS client whenever the credential value changes.

## 6. Push to GitHub

```bash
git init
git add .
git status            # make sure no key files or .env files are listed
git commit -m "Initial commit: QR Magic"
git branch -M main
git remote add origin https://github.com/<you>/qr-magic.git
git push -u origin main
```

`.gitignore` and `.dockerignore` already exclude `.env*` files and common key filenames (`*-key.json`, `*service-account*.json`).

## 7. Deploy to Cloud Run

```bash
# Runtime identity for Cloud Run: it only needs to read the synced secrets
gcloud iam service-accounts create qr-magic-run
export RUN_SA=qr-magic-run@$PROJECT_ID.iam.gserviceaccount.com
for s in GCP_PROJECT_ID GCP_BUCKET_NAME GCP_SERVICE_ACCOUNT_JSON; do
  gcloud secrets add-iam-policy-binding $s \
    --member=serviceAccount:$RUN_SA --role=roles/secretmanager.secretAccessor
done

# Build with the Dockerfile and deploy
gcloud run deploy qr-magic \
  --source . \
  --region=$REGION \
  --service-account=$RUN_SA \
  --allow-unauthenticated \
  --set-secrets=GCP_PROJECT_ID=GCP_PROJECT_ID:latest,GCP_BUCKET_NAME=GCP_BUCKET_NAME:latest,GCP_SERVICE_ACCOUNT_JSON=GCP_SERVICE_ACCOUNT_JSON:latest
```

**Ways to set environment variables in Cloud Run**

- **Secret Manager references (recommended):** `--set-secrets=NAME=SECRET:VERSION`, as above. Values resolve when an instance starts, so roll out a new revision after rotating.
- **Plain env vars (non-secret values only):** `--set-env-vars=GCP_PROJECT_ID=my-project,GCP_BUCKET_NAME=my-bucket`. Never pass the key JSON this way, because it would show in the service configuration.
- **Console:** Cloud Run → service → *Edit & deploy new revision* → *Variables & Secrets*.

The container listens on `$PORT` (8080). Variables are injected at runtime and are never baked into the image.
