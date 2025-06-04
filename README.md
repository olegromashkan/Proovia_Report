# Proovia Report

This project uses **Next.js** with UnoCSS and a small SQLite database.

## Development

1. Install dependencies (requires internet access):

   ```bash
   npm install
   ```

2. Run the development server:

 ```bash
  npm run dev
  ```

For production builds the UnoCSS stylesheet must be generated first:

```bash
npm run unocss
npm run build
```

The application exposes an API route at `/api/upload` which accepts JSON data
and saves it into an SQLite database (`database.db`). If the server is running
on a machine connected to your local network or via Tailscale, the API will be
reachable on that network as well.

## Uploading data

Navigate to `/upload` in the browser and select a `.json` file with the
structure shown in the examples. The file will be uploaded to the server and
each section will be stored in its corresponding table. The API accepts payloads
up to **10&nbsp;MB**. The upload page now shows a progress bar and a log of steps
to help you monitor the upload process.
