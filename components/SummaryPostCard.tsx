import React from "react";

interface ContractorInfo {
  name: string;
  avg: number;
}
interface DriverInfo {
  driver: string;
  time: number;
}
interface SummaryContent {
  date: string;
  total: number;
  complete: number;
  failed: number;
  best: string[];
  worst: string[];
  topContractors: ContractorInfo[];
  earliestDrivers: DriverInfo[];
  latestDrivers: DriverInfo[];
}

function minutesToTime(m: number): string {
  if (!isFinite(m)) return "N/A";
  const h = Math.floor(m / 60);
  const mm = Math.round(m % 60);
  return `${String(h).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;
}

export default function SummaryPostCard({ post }: { post: any }) {
  let content: SummaryContent | null = null;
  try {
    content = JSON.parse(post.content);
  } catch {
    return null;
  }

  if (!content) return null;

  const date = new Date(post.created_at).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
  const successRate = content.total
    ? ((content.complete / content.total) * 100).toFixed(1)
    : "0";

  return (
    <div className="card bg-base-200/50 shadow-md">
      <div className="card-body p-4 space-y-2">
        <div className="flex items-center justify-between mb-2">
          <h3 className="card-title text-base font-semibold">{date}</h3>
          <span className="text-sm text-base-content/60">
            Success {successRate}%
          </span>
        </div>
        <div className="grid grid-cols-3 gap-2 text-sm">
          <div>Total: {content.total}</div>
          <div>Complete: {content.complete}</div>
          <div>Failed: {content.failed}</div>
        </div>
        {content.best.length > 0 && (
          <div className="text-sm">
            <strong>Best Drivers:</strong> {content.best.join(", ")}
          </div>
        )}
        {content.worst.length > 0 && (
          <div className="text-sm">
            <strong>Worst Drivers:</strong> {content.worst.join(", ")}
          </div>
        )}
        {content.topContractors.length > 0 && (
          <div className="text-sm">
            <strong>Top Contractors:</strong>{" "}
            {content.topContractors
              .map((c) => `${c.name} (£${c.avg.toFixed(0)})`)
              .join(", ")}
          </div>
        )}
        {content.earliestDrivers.length > 0 && (
          <div className="text-sm">
            <strong>Earliest:</strong>{" "}
            {content.earliestDrivers
              .map((d) => `${d.driver} ${minutesToTime(d.time)}`)
              .join(", ")}
          </div>
        )}
        {content.latestDrivers.length > 0 && (
          <div className="text-sm">
            <strong>Latest:</strong>{" "}
            {content.latestDrivers
              .map((d) => `${d.driver} ${minutesToTime(d.time)}`)
              .join(", ")}
          </div>
        )}
      </div>
    </div>
  );
}
