import {
  useState,
  useEffect,
  useMemo,
  useCallback,
  memo,
  useRef,
  Fragment,
} from "react";
import { useRouter } from "next/router";
import useSWR from "swr";
import Layout from "../components/Layout";
import TripModal from "../components/TripModal";
import Icon from "../components/Icon";
import VanCheck from "../components/VanCheck";
import DriverStatsModal from "../components/DriverStatsModal";
import { parseDate } from "../lib/dateUtils";

// --- Helpers ---
interface Trip {
  ID: string;
  [key: string]: any;
}

const formatDate = (date: Date) => date.toISOString().slice(0, 10);

const calcLoad = (startTime: string) => {
  if (!startTime?.includes(":")) return "N/A";
  const [h, m] = startTime.trim().split(":").map(Number);
  if (isNaN(h) || isNaN(m)) return "N/A";
  const date = new Date();
  date.setHours(h, m, 0, 0);
  date.setMinutes(date.getMinutes() - 90);
  return date.toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
  });
};

const diffTime = (t1: string, t2: string) => {
  if (!t1 || !t2) return "N/A";
  const [h1, m1] = t1.split(":").map(Number);
  const [h2, m2] = t2.split(":").map(Number);
  if ([h1, m1, h2, m2].some((n) => isNaN(n))) return "N/A";
  const minutes1 = h1 * 60 + m1;
  const minutes2 = h2 * 60 + m2;
  let diff = minutes2 - minutes1;
  if (diff > 12 * 60) diff -= 24 * 60;
  if (diff < -12 * 60) diff += 24 * 60;
  return diff.toString();
};

// --- Scrolling Stats Component ---
const ScrollingStats = ({
  trips,
  driverToContractor,
  onDriversClick,
}: {
  trips: Trip[];
  driverToContractor: Record<string, string>;
  onDriversClick: () => void;
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  const stats = useMemo(() => {
    // Top Drivers
    const driverStats: Record<string, { complete: number; failed: number }> =
      {};
    const postcodeCounts: Record<string, number> = {};
    const auctionCounts: Record<string, number> = {};
    const contractorCounts: Record<string, number> = {};

    trips.forEach((trip) => {
      const driver = trip["Trip.Driver1"];
      const postcode = trip["Address.Postcode"];
      const auction = trip["Order.Auction"];
      const contractor = driver ? driverToContractor[driver] : null;

      if (driver) {
        if (!driverStats[driver])
          driverStats[driver] = { complete: 0, failed: 0 };
        if (trip.Status === "Complete") driverStats[driver].complete++;
        else if (trip.Status === "Failed") driverStats[driver].failed++;
      }
      if (postcode)
        postcodeCounts[postcode] = (postcodeCounts[postcode] || 0) + 1;
      if (auction) auctionCounts[auction] = (auctionCounts[auction] || 0) + 1;
      if (contractor)
        contractorCounts[contractor] = (contractorCounts[contractor] || 0) + 1;
    });

    const topDrivers = Object.entries(driverStats)
      .map(([d, s]) => ({
        driver: d,
        complete: s.complete,
        failed: s.failed,
        total: s.complete + s.failed,
      }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 3);

    const topPostcodes = Object.entries(postcodeCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10);

    const topAuctions = Object.entries(auctionCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10);

    const topContractors = Object.entries(contractorCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10);

    return { topDrivers, topPostcodes, topAuctions, topContractors };
  }, [trips, driverToContractor]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (scrollRef.current) {
        scrollRef.current.scrollLeft += 1;
        if (
          scrollRef.current.scrollLeft >=
          scrollRef.current.scrollWidth - scrollRef.current.clientWidth
        ) {
          scrollRef.current.scrollLeft = 0;
        }
      }
    }, 30);

    return () => clearInterval(interval);
  }, []);

  const StatCard = ({
    title,
    data,
    color,
  }: {
    title: string;
    data: [string, number][];
    color: string;
  }) => (
    <div
      className={`bg-gradient-to-br ${color} rounded-xl p-4 shadow-lg min-w-[250px] text-white`}
    >
      <h3 className="font-bold text-lg mb-3 opacity-90">{title}</h3>
      <div className="space-y-1">
        {data.slice(0, 3).map(([name, count], idx) => (
          <div key={idx} className="flex justify-between items-center">
            <span className="text-sm truncate max-w-[150px]">{name}</span>
            <span className="font-bold">{count}</span>
          </div>
        ))}
      </div>
    </div>
  );

  const TopDriversCard = ({
    data,
    onClick,
  }: {
    data: { driver: string; complete: number; failed: number }[];
    onClick: () => void;
  }) => (
    <div
      className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-4 shadow-lg min-w-[250px] text-white cursor-pointer"
      onClick={onClick}
    >
      <h3 className="font-bold text-lg mb-3 opacity-90">🏆 Top Drivers</h3>
      <div className="space-y-1">
        {data.map((d, idx) => (
          <div key={d.driver} className="flex justify-between items-center">
            <span className="text-sm truncate max-w-[150px]">
              {idx + 1}. {d.driver}
            </span>
            <span className="font-bold">
              {d.complete}✓ {d.failed}✗
            </span>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="overflow-hidden relative bg-base-200 py-3">
      <div
        ref={scrollRef}
        className="flex gap-4 px-4 overflow-x-hidden"
        style={{ scrollBehavior: "smooth" }}
      >
        <TopDriversCard data={stats.topDrivers} onClick={onDriversClick} />
        <StatCard
          title="📍 Top Postcodes"
          data={stats.topPostcodes}
          color="from-purple-500 to-purple-600"
        />
        <StatCard
          title="🏪 Top Auctions"
          data={stats.topAuctions}
          color="from-green-500 to-green-600"
        />
        <StatCard
          title="🚛 Top Contractors"
          data={stats.topContractors}
          color="from-orange-500 to-orange-600"
        />
      </div>
    </div>
  );
};

// --- Memoized Components ---
const TripCard = memo(
  ({ trip, onClick }: { trip: Trip; onClick: () => void }) => {
    const statusColor =
      trip.Status === "Complete"
        ? "border-l-success"
        : trip.Status === "Failed"
          ? "border-l-error"
          : "border-l-base-300";
    const summaryText = (trip.Summary || "").split(" ")[0];

    return (
      <div
        onClick={onClick}
        className={`bg-base-200 rounded-lg border-l-4 ${statusColor} p-3 hover:shadow-lg transition-all cursor-pointer group`}
      >
        <div className="flex items-center gap-3">
          {trip.Seq && (
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              <span className="text-sm font-bold text-primary">{trip.Seq}</span>
            </div>
          )}
          <div className="flex-grow min-w-0">
            <div className="flex items-center gap-2">
              <p className="font-semibold truncate">
                #{trip["Order.OrderNumber"]}
              </p>
              <span className="badge badge-ghost badge-sm">
                {trip["Address.Postcode"]}
              </span>
            </div>
            <p className="text-sm opacity-70">
              {trip["Trip.Driver1"] || "No Driver"}
            </p>
          </div>
          <div className="flex flex-col items-end gap-1 flex-shrink-0">
            {summaryText && (
              <span className="badge badge-outline badge-sm">
                {summaryText}
              </span>
            )}
            {trip["Order.Auction"] && (
              <span className="badge badge-ghost badge-sm">
                {trip["Order.Auction"]}
              </span>
            )}
          </div>
        </div>
      </div>
    );
  },
);

// --- Main Component ---
export default function FullReport() {
  const router = useRouter();
  const today = useMemo(() => formatDate(new Date()), []);

  const fetcher = (url: string) => fetch(url).then((res) => res.json());

  // --- State ---
  const [trips, setTrips] = useState<Trip[]>([]);
  const [startData, setStartData] = useState<any[]>([]);
  const [vanChecks, setVanChecks] = useState<any[]>([]);
  const [selected, setSelected] = useState<Trip | null>(null);
  const [isDrawerOpen, setDrawerOpen] = useState(false);
  const [showDriverStats, setShowDriverStats] = useState(false);

  // Filters
  const [filters, setFilters] = useState({
    start: today,
    end: today,
    status: "",
    contractor: "",
    auction: "",
    search: "",
    startSearch: "",
    startContractor: "",
    vanSearch: "",
    vanContractor: "",
  });

  const dateRangeText = useMemo(() => {
    return filters.start === filters.end
      ? filters.start
      : `${filters.start} - ${filters.end}`;
  }, [filters.start, filters.end]);

  const [sortField, setSortField] = useState("Order.OrderNumber");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [startSortField, setStartSortField] = useState<
    | "Asset"
    | "Contractor_Name"
    | "Driver"
    | "First_Mention_Time"
    | "Start_Time"
    | "Last_Mention_Time"
  >("Driver");
  const [startSortDir, setStartSortDir] = useState<"asc" | "desc">("asc");

  // Derived data
  const { contractors, auctions, driverToContractor } = useMemo(() => {
    const contractorSet = new Set<string>();
    const driverMap: Record<string, string> = {};

    startData.forEach((r) => {
      if (r.Contractor_Name) {
        contractorSet.add(r.Contractor_Name);
        if (r.Driver) driverMap[r.Driver] = r.Contractor_Name;
      }
    });

    const auctionSet = new Set<string>();
    trips.forEach((t) => {
      if (t["Order.Auction"]) auctionSet.add(t["Order.Auction"]);
    });

    return {
      contractors: Array.from(contractorSet).sort(),
      auctions: Array.from(auctionSet).sort(),
      driverToContractor: driverMap,
    };
  }, [trips, startData]);

  // --- Data Loading ---
  useEffect(() => {
    if (!router.isReady) return;
    const { start: qStart, end: qEnd } = router.query;
    if (typeof qStart === "string") {
      setFilters((prev) => ({ ...prev, start: qStart }));
    }
    if (typeof qEnd === "string") {
      setFilters((prev) => ({ ...prev, end: qEnd }));
    }
  }, [router.isReady, router.query]);

  const { data: tripsRes } = useSWR(
    router.isReady
      ? `/api/report?start=${filters.start}&end=${filters.end}`
      : null,
    fetcher,
  );
  const { data: startRes } = useSWR(
    router.isReady
      ? `/api/start-times?start=${filters.start}&end=${filters.end}`
      : null,
    fetcher,
  );
  const { data: vanRes } = useSWR(
    router.isReady
      ? `/api/van-checks?start=${filters.start}&end=${filters.end}`
      : null,
    fetcher,
  );

  useEffect(() => {
    if (tripsRes) setTrips(tripsRes.items || []);
  }, [tripsRes]);
  useEffect(() => {
    if (startRes) setStartData(startRes.items || []);
  }, [startRes]);
  useEffect(() => {
    if (vanRes) setVanChecks(vanRes.items || []);
  }, [vanRes]);

  const isLoading = !tripsRes || !startRes || !vanRes;

  // --- Filtering ---
  const filteredTrips = useMemo(() => {
    return trips
      .filter((t) => {
        const matchesStatus =
          !filters.status ||
          t.Status?.toLowerCase() === filters.status.toLowerCase();
        const contractor = driverToContractor[t["Trip.Driver1"]] || "Unknown";
        const matchesContractor =
          !filters.contractor || contractor === filters.contractor;
        const matchesAuction =
          !filters.auction || t["Order.Auction"] === filters.auction;
        const matchesSearch =
          !filters.search ||
          [
            t["Order.OrderNumber"],
            t["Trip.Driver1"],
            t["Address.Postcode"],
          ].some((field) =>
            String(field || "")
              .toLowerCase()
              .includes(filters.search.toLowerCase()),
          );

        return (
          matchesStatus && matchesContractor && matchesAuction && matchesSearch
        );
      })
      .sort((a, b) => {
        const valA = a[sortField] ?? "";
        const valB = b[sortField] ?? "";

        if (sortField === "Seq" || sortField === "Order.OrderNumber") {
          const numA = parseInt(String(valA), 10);
          const numB = parseInt(String(valB), 10);
          if (!isNaN(numA) && !isNaN(numB)) {
            return sortDir === "asc" ? numA - numB : numB - numA;
          }
        }

        const compareResult =
          typeof valA === "number" && typeof valB === "number"
            ? valA - valB
            : String(valA).localeCompare(String(valB));

        return sortDir === "asc" ? compareResult : -compareResult;
      });
  }, [trips, filters, sortField, sortDir, driverToContractor]);

  const stats = useMemo(() => {
    let positiveTimeCompleted = 0;
    let positiveArrivalTime = 0;

    filteredTrips.forEach((trip) => {
      if (
        !trip?.["Address.Working_Hours"] ||
        !trip.Time_Completed ||
        !trip.Arrival_Time
      )
        return;

      const matches = String(trip["Address.Working_Hours"]).match(
        /\d{2}:\d{2}/g,
      );
      const endTime = matches?.[1];
      if (!endTime) return;

      const [h, m] = endTime.split(":").map(Number);
      const timeCompletedDate = new Date(trip.Time_Completed);
      const whEndForCompleted = new Date(timeCompletedDate);
      whEndForCompleted.setHours(h, m, 0, 0);

      const arrivalDate = new Date(trip.Arrival_Time);
      const whEndForArrival = new Date(arrivalDate);
      whEndForArrival.setHours(h, m, 0, 0);

      if (timeCompletedDate >= whEndForCompleted) positiveTimeCompleted++;
      if (arrivalDate >= whEndForArrival) positiveArrivalTime++;
    });

    return {
      total: filteredTrips.length,
      complete: filteredTrips.filter((t) => t.Status === "Complete").length,
      failed: filteredTrips.filter((t) => t.Status === "Failed").length,
      positiveTimeCompleted,
      positiveArrivalTime,
    };
  }, [filteredTrips]);

  const startContractors = useMemo(() => {
    const set = new Set<string>();
    startData.forEach((s) => {
      if (s.Contractor_Name) set.add(s.Contractor_Name);
    });
    return Array.from(set).sort();
  }, [startData]);

  const vanContractors = useMemo(() => {
    const set = new Set<string>();
    vanChecks.forEach((vc) => {
      const c = driverToContractor[vc.driver_id];
      if (c) set.add(c);
    });
    return Array.from(set).sort();
  }, [vanChecks, driverToContractor]);

  const filteredStartData = useMemo(() => {
    return startData
      .filter((r) => {
        const matchContractor =
          !filters.startContractor ||
          r.Contractor_Name === filters.startContractor;
        const matchSearch =
          !filters.startSearch ||
          Object.values(r).some((v) =>
            String(v).toLowerCase().includes(filters.startSearch.toLowerCase()),
          );
        return matchContractor && matchSearch;
      })
      .sort((a, b) => {
        const valA = a[startSortField] ?? "";
        const valB = b[startSortField] ?? "";
        const cmp = String(valA).localeCompare(String(valB), undefined, {
          numeric: true,
        });
        return startSortDir === "asc" ? cmp : -cmp;
      });
  }, [startData, filters, startSortField, startSortDir]);

  const filteredVanChecks = useMemo(() => {
    return vanChecks.filter((vc) => {
      const contractor = driverToContractor[vc.driver_id] || "Unknown";
      const matchContractor =
        !filters.vanContractor || contractor === filters.vanContractor;
      const matchSearch =
        !filters.vanSearch ||
        [vc.driver_id, vc.van_id].some((field) =>
          String(field).toLowerCase().includes(filters.vanSearch.toLowerCase()),
        );
      return matchContractor && matchSearch;
    });
  }, [vanChecks, filters, driverToContractor]);

  const driverStatsData = useMemo(() => {
    const dateSet = new Set<string>();
    const map: Record<string, Record<string, { complete: number; failed: number; total: number }>> = {};

    trips.forEach((t) => {
      const driver = t["Trip.Driver1"];
      if (!driver) return;
      const raw = t["Trip.Start_Time"] || t["Start_Time"] || t.Start_Time;
      const date = parseDate(String(raw || "").split(" ")[0] || "");
      if (!date) return;
      dateSet.add(date);
      if (!map[driver]) map[driver] = {};
      if (!map[driver][date]) map[driver][date] = { complete: 0, failed: 0, total: 0 };
      if (t.Status === "Complete") map[driver][date].complete++;
      else if (t.Status === "Failed") map[driver][date].failed++;
      map[driver][date].total++;
    });

    const dates = Array.from(dateSet).sort();
    const stats = Object.keys(map).map((driver) => {
      const daily = dates.map((d) => map[driver][d] || { complete: 0, failed: 0, total: 0 });
      const total = daily.reduce(
        (acc, cur) => ({
          complete: acc.complete + cur.complete,
          failed: acc.failed + cur.failed,
          total: acc.total + cur.total,
        }),
        { complete: 0, failed: 0, total: 0 },
      );
      return {
        driver,
        contractor: driverToContractor[driver] || "Unknown",
        daily,
        total,
      };
    }).sort((a, b) => b.total.total - a.total.total);

    return { dates, stats };
  }, [trips, driverToContractor]);

  // --- Handlers ---
  const setDateRange = useCallback((start: Date, end: Date) => {
    setFilters((prev) => ({
      ...prev,
      start: formatDate(start),
      end: formatDate(end),
    }));
  }, []);

  const dateShortcuts = useMemo(
    () => ({
      today: () => setDateRange(new Date(), new Date()),
      yesterday: () => {
        const d = new Date();
        d.setDate(d.getDate() - 1);
        setDateRange(d, d);
      },
      last7Days: () => {
        const end = new Date();
        const start = new Date();
        start.setDate(end.getDate() - 6);
        setDateRange(start, end);
      },
      thisWeek: () => {
        const now = new Date();
        const day = now.getDay();
        const diff = now.getDate() - day + (day === 0 ? -6 : 1);
        const start = new Date(now.setDate(diff));
        const end = new Date(start);
        end.setDate(start.getDate() + 6);
        setDateRange(start, end);
      },
      lastWeek: () => {
        const now = new Date();
        now.setDate(now.getDate() - 7);
        const day = now.getDay();
        const diff = now.getDate() - day + (day === 0 ? -6 : 1);
        const start = new Date(now.setDate(diff));
        const end = new Date(start);
        end.setDate(start.getDate() + 6);
        setDateRange(start, end);
      },
    }),
    [setDateRange],
  );

  const handleReset = () => {
    setFilters({
      start: today,
      end: today,
      status: "",
      contractor: "",
      auction: "",
      search: "",
      startSearch: "",
      startContractor: "",
      vanSearch: "",
      vanContractor: "",
    });
    setSortField("Order.OrderNumber");
    setSortDir("asc");
    setStartSortField("Driver");
    setStartSortDir("asc");
  };

  const copyStartTable = useCallback(() => {
    const rows = filteredStartData.map((r) => {
      const load = calcLoad(r.Start_Time);
      const diffLoad = diffTime(r.First_Mention_Time, load);
      const diffStart = diffTime(r.Last_Mention_Time, r.Start_Time);
      return [
        r.Asset,
        r.Contractor_Name,
        r.Driver,
        r.First_Mention_Time,
        load,
        diffLoad,
        r.Start_Time,
        r.Last_Mention_Time,
        diffStart,
      ].join(",");
    });
    navigator.clipboard.writeText(rows.join("\n"));
  }, [filteredStartData]);

  const downloadStartCSV = useCallback(() => {
    const header = [
      "Asset",
      "Contractor",
      "Driver",
      "Arrive WH",
      "Load Time",
      "Diff Load",
      "Start Time",
      "Left WH",
      "Diff Start",
    ];
    const rows = filteredStartData.map((r) => {
      const load = calcLoad(r.Start_Time);
      const diffLoad = diffTime(r.First_Mention_Time, load);
      const diffStart = diffTime(r.Last_Mention_Time, r.Start_Time);
      return [
        r.Asset,
        r.Contractor_Name,
        r.Driver,
        r.First_Mention_Time,
        load,
        diffLoad,
        r.Start_Time,
        r.Last_Mention_Time,
        diffStart,
      ].join(",");
    });
    const csv = [header.join(","), ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "start_times.csv";
    a.click();
    URL.revokeObjectURL(url);
  }, [filteredStartData]);

  return (
    <Layout title="Orders Report" fullWidth>
      <div className="drawer drawer-end">
        <input
          id="filter-drawer"
          type="checkbox"
          className="drawer-toggle"
          checked={isDrawerOpen}
          onChange={() => setDrawerOpen(!isDrawerOpen)}
        />

        <div className="drawer-content">
          {/* Scrolling Stats */}
          <ScrollingStats
            trips={trips}
            driverToContractor={driverToContractor}
            onDriversClick={() => setShowDriverStats(true)}
          />

          {/* Header */}
          <div className="bg-base-200 p-3 sticky top-0 z-40 backdrop-blur-lg bg-opacity-90">
            <div className="flex justify-between items-center">
              <div className="flex gap-4 items-center">
                <div className="btn-group btn-group-sm">
                  <button onClick={dateShortcuts.today} className="btn btn-sm">
                    Today
                  </button>
                  <button
                    onClick={dateShortcuts.yesterday}
                    className="btn btn-sm"
                  >
                    Yesterday
                  </button>
                  <button
                    onClick={dateShortcuts.last7Days}
                    className="btn btn-sm"
                  >
                    7 Days
                  </button>
                  <button
                    onClick={dateShortcuts.thisWeek}
                    className="btn btn-sm"
                  >
                    This Week
                  </button>
                  <button
                    onClick={dateShortcuts.lastWeek}
                    className="btn btn-sm"
                  >
                    Last Week
                  </button>
                </div>
                <span className="text-sm opacity-70 hidden sm:inline">
                  {dateRangeText}
                </span>
              </div>
              <label
                htmlFor="filter-drawer"
                className="btn btn-primary btn-sm gap-2"
              >
                <Icon name="filter" className="w-4 h-4" />
                Filters & Sort
              </label>
            </div>
          </div>

          {/* Main Content */}
          <div className="p-3 grid grid-cols-1 lg:grid-cols-12 gap-3">
            {/* Start Times - Takes 5 columns */}
            <div className="lg:col-span-5 bg-base-100 rounded-lg shadow-lg p-3">
              <div className="flex justify-between items-center mb-2">
                <h2 className="text-lg font-bold">Start Times Analysis</h2>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Search..."
                    value={filters.startSearch}
                    onChange={(e) =>
                      setFilters((prev) => ({
                        ...prev,
                        startSearch: e.target.value,
                      }))
                    }
                    className="input input-bordered input-xs w-28"
                  />
                  <select
                    value={filters.startContractor}
                    onChange={(e) =>
                      setFilters((prev) => ({
                        ...prev,
                        startContractor: e.target.value,
                      }))
                    }
                    className="select select-bordered select-xs w-32"
                  >
                    <option value="">All Contractors</option>
                    {startContractors.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={copyStartTable}
                    className="btn btn-xs btn-ghost"
                    title="Copy"
                  >
                    <Icon name="copy" className="w-3 h-3" />
                  </button>
                  <button
                    onClick={downloadStartCSV}
                    className="btn btn-xs btn-ghost"
                    title="Download"
                  >
                    <Icon name="download" className="w-3 h-3" />
                  </button>
                </div>
              </div>

              <div className="overflow-auto max-h-[calc(100vh-220px)]">
                <table className="table table-xs table-zebra">
                  <thead className="sticky top-0 bg-base-100 z-10">
                    <tr>
                      {[
                        ["Asset", "Asset"],
                        ["Contractor", "Contractor_Name"],
                        ["Driver", "Driver"],
                        ["Arrive WH", "First_Mention_Time"],
                        ["Load Time", "load"],
                        ["Diff Load", "diffLoad"],
                        ["Start Time", "Start_Time"],
                        ["Left WH", "Last_Mention_Time"],
                        ["Diff Start", "diffStart"],
                      ].map(([label, field]) => (
                        <th
                          key={field}
                          className="cursor-pointer select-none"
                          onClick={() => {
                            if (
                              field === "load" ||
                              field === "diffLoad" ||
                              field === "diffStart"
                            )
                              return;
                            setStartSortField(field as any);
                            setStartSortDir((prev) =>
                              startSortField === field
                                ? prev === "asc"
                                  ? "desc"
                                  : "asc"
                                : "asc",
                            );
                          }}
                        >
                          {label}
                          {startSortField === field && (
                            <span>{startSortDir === "asc" ? " ▲" : " ▼"}</span>
                          )}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredStartData.map((r, idx) => {
                      const load = calcLoad(r.Start_Time);
                      const diffLoad = diffTime(r.First_Mention_Time, load);
                      const diffStart = diffTime(
                        r.Last_Mention_Time,
                        r.Start_Time,
                      );
                      return (
                        <tr key={idx} className="hover">
                          <td className="font-medium">{r.Asset}</td>
                          <td>{r.Contractor_Name}</td>
                          <td>{r.Driver}</td>
                          <td>{r.First_Mention_Time}</td>
                          <td className="text-info">{load}</td>
                          <td
                            className={
                              Math.abs(parseInt(diffLoad)) > 15
                                ? "text-warning"
                                : ""
                            }
                          >
                            {diffLoad}
                          </td>
                          <td className="font-medium">{r.Start_Time}</td>
                          <td>{r.Last_Mention_Time}</td>
                          <td
                            className={
                              Math.abs(parseInt(diffStart)) > 15
                                ? "text-warning"
                                : ""
                            }
                          >
                            {diffStart}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Van Checks - Takes 3 columns */}
            <div className="lg:col-span-3 bg-base-100 rounded-lg shadow-lg p-3">
              <div className="flex justify-between items-center mb-2">
                <h2 className="text-lg font-bold">Van Check</h2>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Search..."
                    value={filters.vanSearch}
                    onChange={(e) =>
                      setFilters((prev) => ({
                        ...prev,
                        vanSearch: e.target.value,
                      }))
                    }
                    className="input input-bordered input-xs w-24"
                  />
                  <select
                    value={filters.vanContractor}
                    onChange={(e) =>
                      setFilters((prev) => ({
                        ...prev,
                        vanContractor: e.target.value,
                      }))
                    }
                    className="select select-bordered select-xs w-28"
                  >
                    <option value="">All Contractors</option>
                    {vanContractors.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="overflow-auto max-h-[calc(100vh-220px)] space-y-1">
                {filteredVanChecks.map((vc, idx) => (
                  <VanCheck
                    key={idx}
                    data={vc}
                    contractor={driverToContractor[vc.driver_id]}
                  />
                ))}
              </div>
            </div>

            {/* Orders - Takes 4 columns */}
            <div className="lg:col-span-4 bg-base-100 rounded-lg shadow-lg p-3">
              <div className="mb-2">
                <div className="flex justify-between items-center mb-3">
                  <h2 className="text-lg font-bold">Orders</h2>
                  <div className="flex gap-2">
                    <button
                      onClick={dateShortcuts.today}
                      className="btn btn-xs btn-ghost"
                    >
                      Today
                    </button>
                    <button
                      onClick={dateShortcuts.yesterday}
                      className="btn btn-xs btn-ghost"
                    >
                      Yesterday
                    </button>
                    <button
                      onClick={dateShortcuts.lastWeek}
                      className="btn btn-xs btn-ghost"
                    >
                      Last Week
                    </button>
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-5 gap-2 mb-3">
                  <div className="bg-base-200 rounded p-2 text-center">
                    <div className="text-xs opacity-70">Total</div>
                    <div className="text-lg font-bold">{stats.total}</div>
                  </div>
                  <div className="bg-success/20 rounded p-2 text-center">
                    <div className="text-xs text-success">Complete</div>
                    <div className="text-lg font-bold text-success">
                      {stats.complete}
                    </div>
                  </div>
                  <div className="bg-error/20 rounded p-2 text-center">
                    <div className="text-xs text-error">Failed</div>
                    <div className="text-lg font-bold text-error">
                      {stats.failed}
                    </div>
                  </div>
                  <div className="bg-warning/20 rounded p-2 text-center">
                    <div className="text-xs text-warning">Late TC</div>
                    <div className="text-lg font-bold text-warning">
                      {stats.positiveTimeCompleted}
                    </div>
                  </div>
                  <div className="bg-warning/20 rounded p-2 text-center">
                    <div className="text-xs text-warning">Late Arr</div>
                    <div className="text-lg font-bold text-warning">
                      {stats.positiveArrivalTime}
                    </div>
                  </div>
                </div>
              </div>

              <div className="overflow-auto max-h-[calc(100vh-320px)] space-y-2">
                {isLoading ? (
                  <div className="flex justify-center items-center h-32">
                    <span className="loading loading-spinner loading-md"></span>
                  </div>
                ) : (
                  filteredTrips.map((trip) => (
                    <TripCard
                      key={trip.ID}
                      trip={trip}
                      onClick={() => setSelected(trip)}
                    />
                  ))
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Filter Drawer */}
        <div className="drawer-side z-50">
          <label htmlFor="filter-drawer" className="drawer-overlay"></label>
          <div className="menu p-4 w-80 min-h-full bg-base-100 text-base-content">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-xl">Filters & Sort</h3>
              <button
                onClick={() => setDrawerOpen(false)}
                className="btn btn-sm btn-ghost btn-circle"
              >
                ✕
              </button>
            </div>

            {/* Date Range */}
            <div className="form-control mb-4">
              <label className="label">
                <span className="label-text">Date Range</span>
              </label>
              <div className="flex gap-2">
                <input
                  type="date"
                  value={filters.start}
                  onChange={(e) =>
                    setFilters((prev) => ({ ...prev, start: e.target.value }))
                  }
                  className="input input-bordered input-sm flex-1"
                />
                <input
                  type="date"
                  value={filters.end}
                  onChange={(e) =>
                    setFilters((prev) => ({ ...prev, end: e.target.value }))
                  }
                  className="input input-bordered input-sm flex-1"
                />
              </div>
            </div>

            {/* Quick Date Buttons */}
            <div className="grid grid-cols-2 gap-2 mb-4">
              {Object.entries(dateShortcuts).map(([key, fn]) => (
                <button
                  key={key}
                  onClick={fn}
                  className="btn btn-ghost btn-sm capitalize"
                >
                  {key.replace(/([A-Z])/g, " $1").trim()}
                </button>
              ))}
            </div>

            <div className="divider my-2"></div>

            {/* Search */}
            <div className="form-control mb-3">
              <label className="label">
                <span className="label-text">Search Orders</span>
              </label>
              <input
                type="text"
                placeholder="Order, Driver, Postcode..."
                value={filters.search}
                onChange={(e) =>
                  setFilters((prev) => ({ ...prev, search: e.target.value }))
                }
                className="input input-bordered input-sm"
              />
            </div>

            {/* Status Filter */}
            <div className="form-control mb-3">
              <label className="label">
                <span className="label-text">Status</span>
              </label>
              <select
                value={filters.status}
                onChange={(e) =>
                  setFilters((prev) => ({ ...prev, status: e.target.value }))
                }
                className="select select-bordered select-sm"
              >
                <option value="">All</option>
                <option value="Complete">Complete</option>
                <option value="Failed">Failed</option>
              </select>
            </div>

            {/* Contractor Filter */}
            <div className="form-control mb-3">
              <label className="label">
                <span className="label-text">Contractor</span>
              </label>
              <select
                value={filters.contractor}
                onChange={(e) =>
                  setFilters((prev) => ({
                    ...prev,
                    contractor: e.target.value,
                  }))
                }
                className="select select-bordered select-sm"
              >
                <option value="">All</option>
                {contractors.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            {/* Auction Filter */}
            <div className="form-control mb-3">
              <label className="label">
                <span className="label-text">Auction</span>
              </label>
              <select
                value={filters.auction}
                onChange={(e) =>
                  setFilters((prev) => ({ ...prev, auction: e.target.value }))
                }
                className="select select-bordered select-sm"
              >
                <option value="">All</option>
                {auctions.map((a) => (
                  <option key={a} value={a}>
                    {a}
                  </option>
                ))}
              </select>
            </div>

            <div className="divider my-2"></div>

            {/* Sort Options */}
            <div className="form-control mb-3">
              <label className="label">
                <span className="label-text">Sort By</span>
              </label>
              <select
                value={sortField}
                onChange={(e) => setSortField(e.target.value)}
                className="select select-bordered select-sm"
              >
                <option value="Seq">Sequence</option>
                <option value="Order.OrderNumber">Order Number</option>
                <option value="Trip.Driver1">Driver</option>
                <option value="Address.Postcode">Postcode</option>
              </select>
            </div>

            <div className="form-control mb-4">
              <label className="label">
                <span className="label-text">Direction</span>
              </label>
              <div className="btn-group w-full">
                <button
                  onClick={() => setSortDir("asc")}
                  className={`btn btn-sm flex-1 ${sortDir === "asc" ? "btn-active" : ""}`}
                >
                  Ascending
                </button>
                <button
                  onClick={() => setSortDir("desc")}
                  className={`btn btn-sm flex-1 ${sortDir === "desc" ? "btn-active" : ""}`}
                >
                  Descending
                </button>
              </div>
            </div>

            <div className="flex-grow"></div>

            <button
              onClick={handleReset}
              className="btn btn-outline btn-primary w-full"
            >
              <Icon name="refresh" className="w-4 h-4" />
              Reset All
            </button>
          </div>
        </div>
      </div>

      <TripModal
        trip={selected}
        onClose={() => setSelected(null)}
        allTrips={trips}
      />
      <DriverStatsModal
        open={showDriverStats}
        onClose={() => setShowDriverStats(false)}
        dates={driverStatsData.dates}
        stats={driverStatsData.stats}
      />
    </Layout>
  );
}
