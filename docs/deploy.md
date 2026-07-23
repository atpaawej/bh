# Deployment

## Prerequisites

- [Google Cloud CLI](https://cloud.google.com/sdk/docs/install) installed and authenticated (`gcloud auth login`)
- A [Google Cloud](https://console.cloud.google.com) project with billing enabled
- [Cloud Run Admin API](https://console.developers.google.com/apis/api/run.googleapis.com) enabled
- [Cloud Scheduler API](https://console.developers.google.com/apis/api/cloudscheduler.googleapis.com) enabled

---

## Backend (Cloud Run)

### 1. Build and push

```bash
# Set your project and region
export PROJECT_ID="your-gcp-project"
export REGION="us-central1"

# Build the container
gcloud builds submit \
  --project="$PROJECT_ID" \
  --region="$REGION" \
  --tag="gcr.io/$PROJECT_ID/bharathunt-api" \
  packages/backend

# Or build locally and tag
docker build -t "gcr.io/$PROJECT_ID/bharathunt-api" -f packages/backend/Dockerfile .
docker push "gcr.io/$PROJECT_ID/bharathunt-api"
```

### 2. Deploy to Cloud Run

```bash
gcloud run deploy bharathunt-api \
  --project="$PROJECT_ID" \
  --region="$REGION" \
  --image="gcr.io/$PROJECT_ID/bharathunt-api" \
  --platform=managed \
  --allow-unauthenticated \
  --min-instances=0 \
  --max-instances=2 \
  --memory=512Mi \
  --cpu=1 \
  --timeout=300 \
  --set-env-vars="NODE_ENV=production" \
  --set-secrets="SUPABASE_URL=supabase-url:latest,\
SUPABASE_ANON_KEY=supabase-anon-key:latest,\
SUPABASE_SERVICE_KEY=supabase-service-key:latest,\
DATABASE_URL=database-url:latest,\
JWT_SECRET=jwt-secret:latest,\
REFRESH_TOKEN_SECRET=refresh-token-secret:latest,\
CLOUDINARY_CLOUD_NAME=cloudinary-cloud-name:latest,\
CLOUDINARY_API_KEY=cloudinary-api-key:latest,\
CLOUDINARY_API_SECRET=cloudinary-api-secret:latest,\
FRONTEND_URL=frontend-url:latest,\
CRON_SECRET=cron-secret:latest"
```

> **Note:** The example above uses [Secret Manager](https://cloud.google.com/secret-manager) for environment variables.
> Create secrets first with `gcloud secrets create SECRET_NAME --data-file=/dev/stdin`.
> For a simpler setup, you can pass values directly with `--set-env-vars` instead.

### 3. Verify the deployment

```bash
# Get the service URL
SERVICE_URL=$(gcloud run services describe bharathunt-api \
  --project="$PROJECT_ID" \
  --region="$REGION" \
  --format="value(status.url)")

# Health check
curl "$SERVICE_URL/api/health"
```

---

## Cloud Scheduler (Weekly Cron)

The cron job runs every Friday at 00:00 UTC and publishes all products scheduled for the current BH week (Friday → Thursday).

### Setup

```bash
# Set the service URL (from the deploy step above)
export SERVICE_URL="https://bharathunt-api-xxxxx-uc.a.run.app"

# Generate a cron secret if you haven't already
export CRON_SECRET=$(node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))")
echo "CRON_SECRET=$CRON_SECRET"
```

**Important:** Set `CRON_SECRET` as an environment variable on your Cloud Run service (see deploy step above) so the cron endpoint can verify the secret.

```bash
# Create the Cloud Scheduler job
gcloud scheduler jobs create http publish-weekly-products \
  --project="$PROJECT_ID" \
  --region="$REGION" \
  --schedule="0 0 * * 5" \
  --uri="${SERVICE_URL}/api/cron/publish-week" \
  --http-method=post \
  --headers="X-Cron-Secret=${CRON_SECRET}" \
  --oidc-service-account-email="your-scheduler-sa@$PROJECT_ID.iam.gserviceaccount.com" \
  --oidc-token-audience="$SERVICE_URL"
```

### What the cron job does

`POST /api/cron/publish-week` (gated by `X-Cron-Secret`):
1. Computes the current BH week window (Friday 00:00 UTC → Thursday 23:59:59.999 UTC)
2. Finds all products with `status = "draft"` and `scheduledFor` within that window
3. Updates them to `status = "submitted"` and sets `launchedAt` to now
4. Returns `{ published: count, week: { start, end } }`

### Testing the cron endpoint

```bash
# Manually trigger the publish with the correct secret
curl -X POST "${SERVICE_URL}/api/cron/publish-week" \
  -H "X-Cron-Secret: ${CRON_SECRET}"

# Without the secret (should return 401)
curl -X POST "${SERVICE_URL}/api/cron/publish-week"
# → {"status":401,"code":"UNAUTHORIZED","message":"Invalid or missing X-Cron-Secret header"}
```

---

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `NODE_ENV` | No | `development`, `production`, or `test` (default: `development`) |
| `PORT` | No | Server port (default: `4000`) |
| `SUPABASE_URL` | Yes | Supabase project URL |
| `SUPABASE_ANON_KEY` | Yes | Supabase anonymous key |
| `SUPABASE_SERVICE_KEY` | Yes | Supabase service role key |
| `DATABASE_URL` | Yes | PostgreSQL connection string (prefer Supabase pooler) |
| `JWT_SECRET` | Yes | Secret for signing JWTs (min 32 chars) |
| `JWT_EXPIRES_IN` | No | Access token TTL (default: `15m`) |
| `REFRESH_TOKEN_SECRET` | Yes | Secret for hashing refresh tokens (min 32 chars) |
| `CLOUDINARY_CLOUD_NAME` | Yes | Cloudinary cloud name |
| `CLOUDINARY_API_KEY` | Yes | Cloudinary API key |
| `CLOUDINARY_API_SECRET` | Yes | Cloudinary API secret |
| `FRONTEND_URL` | No | Frontend origin for CORS (default: `http://localhost:3000`) |
| `CRON_SECRET` | Yes | Shared secret for Cloud Scheduler authentication (min 16 chars) |
