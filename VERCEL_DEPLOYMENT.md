# Vercel deployment

Deploy this repository as two Vercel projects: one backend and one frontend.

## 1. Backend project

Import the GitHub repository and set the Root Directory to:

```text
attendance-system/server
```

Add these variables under **Settings > Environment Variables** for Production,
Preview, and Development where appropriate:

```text
MONGODB_URI=<MongoDB Atlas connection string>
JWT_SECRET=<long random value>
CORS_ORIGIN=https://<frontend-project>.vercel.app
DEFAULT_RADIUS_METERS=100
MAX_ACCURACY_METERS=100
ALLOW_OUTSIDE_AS_FLAGGED=false
PHOTO_STORAGE=vercel-blob
BLOB_ACCESS=private
SERVE_WEB=false
```

Do not add `PORT`; Vercel manages the serverless runtime.

In the backend project's **Storage** tab, create and connect a **private Vercel
Blob** store. New stores use Vercel's managed credentials automatically. If the
dashboard creates a `BLOB_READ_WRITE_TOKEN`, keep it only in Vercel.

Deploy the backend and verify:

```text
https://<backend-project>.vercel.app/api/health
```

## 2. Frontend project

Import the same GitHub repository again and set the Root Directory to:

```text
attendance-system/web
```

Vercel should detect Vite. Use:

```text
Build Command: npm run build
Output Directory: dist
```

Add this environment variable:

```text
VITE_API_URL=https://<backend-project>.vercel.app/api
```

Deploy the frontend. If its final URL differs from the value configured in the
backend's `CORS_ORIGIN`, update that backend variable and redeploy the backend.

## 3. MongoDB Atlas

Allow connections from the deployed backend in Atlas Network Access. Vercel
uses dynamic outbound addresses on standard deployments, so the simple Atlas
setup is `0.0.0.0/0`; use a strong database password and least-privilege user.

## Notes

- Never commit or upload `.env` files.
- Environment-variable changes apply only after a redeployment.
- New punch photos are private Blobs and can only be opened through the
  authenticated admin report endpoint.
- Existing local `/uploads/...` photos are not automatically migrated to Blob.
