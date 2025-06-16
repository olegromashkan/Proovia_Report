# Proovia Report

This project uses **Next.js** with UnoCSS and a small SQLite database.

The interface now adapts to mobile screens thanks to responsive
layout tweaks in several pages.

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

Daily summary posts are generated automatically from the uploaded data. A post
for a specific day is created only when all four sources—`event_stream`,
`schedule_trips`, `csv_trips` and `copy_of_tomorrow_trips`—have been uploaded
for that day. Missing posts for previous days are created once all required data
becomes available.

## Uploading data

Navigate to `/upload` in the browser and select a `.json` file with the
structure shown in the examples. The file will be uploaded to the server and
each section will be stored in its corresponding table. The API accepts payloads
up to **10&nbsp;MB**. If a file exceeds this limit the server will respond with a
`Payload too large` error. The upload page now shows a progress bar and a log of
steps to help you monitor the upload process.
