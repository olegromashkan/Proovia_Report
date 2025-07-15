# Proovia Report

This project uses **Next.js** with Tailwind CSS (via the DaisyUI plugin) and a small SQLite database.

## Development

1. Install dependencies (requires internet access):

   ```bash
   npm install
   ```

   This project uses Plotly for the dashboard map, so make sure
   `react-plotly.js` and `plotly.js-dist` are installed.

   Tailwind CSS is configured in `tailwind.config.cjs` and compiled automatically
   when running the Next.js dev or build commands.

2. Run the development server:

```bash
npm run dev
```

The navigation now includes a **Routes Table** page showing a spreadsheet-like
interface for managing driver routes. It supports editable cells, keyboard
navigation and copy/paste operations.

For production builds just run:

```bash
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
up to **500&nbsp;MB**. If a file exceeds this limit the server will respond with a
`Payload too large` error. The upload page now shows a progress bar and a log of
steps to help you monitor the upload process.

## Database Schema

All tables share the columns `id`, `data` and `created_at`. The `data` column
stores a JSON document with fields specific to each dataset. The main tables are
listed below:

| Table name               | Description                               |
| ------------------------ | ----------------------------------------- |
| `copy_of_tomorrow_trips` | Planned trips for the next day            |
| `event_stream`           | Raw scan events                           |
| `drivers_report`         | Driver information and contractors        |
| `schedule_trips`         | Daily schedule entries                    |
| `csv_trips`              | Trips imported from CSV files             |
| `van_checks`             | Van inspection results                    |

Use SQLite JSON functions to query the fields inside the `data` column.

## AI Assistant

The `/api/ai-query` endpoint allows you to ask questions about the stored data
in natural language. The AI converts requests about the database into safe
SQLite `SELECT` statements and returns the results. For general questions it
responds conversationally. Example request:

```bash
curl -X POST /api/ai-query \
  -H 'Content-Type: application/json' \
  -d '{"userQuery":"show failed deliveries for yesterday"}'
```

The response will either start with `SQL_QUERY:` followed by the executed query
or with `CONVERSATION:` for a regular answer.
