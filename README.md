# Proovia Report

This project uses **Next.js** with UnoCSS and a ClickHouse database.

## Development

1. Install dependencies (requires internet access):

   ```bash
   npm install
   ```

   This project uses Plotly for the dashboard map, so make sure
   `react-plotly.js` and `plotly.js-dist` are installed.

2. Run the development server:

 ```bash
  npm run dev
  ```

For production builds the UnoCSS stylesheet must be generated first:

```bash
npm run unocss
npm run build
```

### Running ClickHouse locally

You can start a ClickHouse server with Docker:

```bash
docker run -d --name clickhouse -p 8123:8123 clickhouse/clickhouse-server
```

The API expects the database to be available at `http://localhost:8123`.

The application exposes an API route at `/api/upload` which accepts JSON data
and stores it in ClickHouse. If the server is running on a machine connected to
your local network or via Tailscale, the API will be reachable on that network
as well.

Daily summary posts are generated automatically from the uploaded data. A post
for a specific day is created only when all four sources—`event_stream`,
`schedule_trips`, `csv_trips` and `copy_of_tomorrow_trips`—have been uploaded
for that day. Missing posts for previous days are created once all required data
becomes available.

## Uploading data

Navigate to `/upload` in the browser and select a `.json` file with the
structure shown in the examples. The file will be uploaded to the server and
each section will be stored in its corresponding table. The API accepts payloads
up to **500&nbsp;MB**. If a file exceeds this limit the server will respond with a
`Payload too large` error. The upload page now shows a progress bar and a log of
steps to help you monitor the upload process.
