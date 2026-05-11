import React, { useEffect, useMemo, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import Sidebar from "../components/Sidebar";
import TopNavbar from "../components/TopNavbar";

const API_BASE_URL =
  process.env.REACT_APP_API_BASE_URL || "http://188.245.161.194:5000";

const months = [
  { key: "ALL", label: "בחר הכל" },
  { key: "01", label: "ינו" },
  { key: "02", label: "פבר" },
  { key: "03", label: "מרץ" },
  { key: "04", label: "אפר" },
  { key: "05", label: "מאי" },
  { key: "06", label: "יונ" },
  { key: "07", label: "יול" },
  { key: "08", label: "אוג" },
  { key: "09", label: "ספט" },
  { key: "10", label: "אוק" },
  { key: "11", label: "נוב" },
  { key: "12", label: "דצמ" },
];

const fmtInt = (n) => new Intl.NumberFormat("he-IL").format(Number(n) || 0);

function calcDelta(curr, prev) {
  return (Number(curr) || 0) - (Number(prev) || 0);
}

function calcDeltaPct(curr, prev) {
  const current = Number(curr) || 0;
  const previous = Number(prev) || 0;

  if (previous === 0) return 0;

  return ((current - previous) / previous) * 100;
}

function fmtPct(n) {
  return `${n > 0 ? "+" : ""}${n.toFixed(1)}%`;
}

function getMonthsLabel(selectedMonths) {
  if (selectedMonths.includes("ALL")) return "כל החודשים";

  const map = new Map(months.map((m) => [m.key, m.label]));
  return selectedMonths.map((key) => map.get(key)).filter(Boolean).join(", ");
}

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;

  const selected = payload.find((p) => p.dataKey === "yearB")?.value ?? 0;
  const compare = payload.find((p) => p.dataKey === "yearA")?.value ?? 0;

  const delta = calcDelta(selected, compare);
  const deltaPct = calcDeltaPct(selected, compare);

  const deltaColor =
    delta > 0
      ? "text-emerald-300"
      : delta < 0
      ? "text-rose-300"
      : "text-slate-200";

  return (
    <div className="rounded-xl border border-slate-700/40 bg-slate-950/90 p-3 text-slate-100 shadow-lg">
      <div className="mb-1 font-bold">{label}</div>

      <div className="text-sm text-slate-200">
        נבחר מצטבר: <span className="font-semibold">{fmtInt(selected)}</span>
      </div>

      <div className="text-sm text-slate-200">
        להשוואה מצטבר:{" "}
        <span className="font-semibold">{fmtInt(compare)}</span>
      </div>

      <div className={`mt-1 text-sm ${deltaColor}`}>
        שינוי: <span className="font-semibold">{fmtInt(delta)}</span> (
        {fmtPct(deltaPct)})
      </div>
    </div>
  );
}

function CustomLegend({ payload }) {
  if (!payload?.length) return null;

  return (
    <div className="flex flex-wrap items-center justify-center gap-4 pt-2 text-sm text-white/85">
      {payload.map((entry) => (
        <div key={entry.value} className="flex items-center gap-2">
          <span
            className="inline-block h-2.5 w-2.5 rounded-full"
            style={{ background: entry.color }}
          />
          <span className="font-semibold">{entry.value}</span>
        </div>
      ))}
    </div>
  );
}

export default function Report1() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [yearA, setYearA] = useState("תשפ״ד");
  const [yearB, setYearB] = useState("תשפ״ה");
  const [selectedMonths, setSelectedMonths] = useState(["ALL"]);

  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const monthsLabel = useMemo(
    () => getMonthsLabel(selectedMonths),
    [selectedMonths]
  );

  useEffect(() => {
    let cancelled = false;

    async function loadData() {
      try {
        setLoading(true);
        setErrorMessage("");

        const monthsParam = selectedMonths.includes("ALL")
          ? "ALL"
          : [...selectedMonths].sort((a, b) => Number(a) - Number(b)).join(",");

        const params = new URLSearchParams({
          yearA,
          yearB,
          months: monthsParam,
        });

        const res = await fetch(
          `${API_BASE_URL}/api/report1/comparison?${params.toString()}`
        );

        let json = null;

        try {
          json = await res.json();
        } catch {
          json = null;
        }

        if (!res.ok) {
          throw new Error(json?.message || "שגיאה בטעינת נתוני דוח 1");
        }

        if (!json?.rows || !Array.isArray(json.rows)) {
          throw new Error("מבנה הנתונים שהתקבל מהשרת אינו תקין");
        }

        if (!cancelled) {
          setChartData(json.rows);
        }
      } catch (error) {
        console.error("Report1 load error:", error);

        if (!cancelled) {
          setChartData([]);
          setErrorMessage(
            error.message || "לא ניתן לטעון את נתוני הדוח כרגע"
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadData();

    return () => {
      cancelled = true;
    };
  }, [yearA, yearB, selectedMonths]);

  const tableRows = useMemo(() => {
    return chartData.map((row) => {
      const delta = calcDelta(row.yearB, row.yearA);
      const deltaPct = calcDeltaPct(row.yearB, row.yearA);

      return {
        month: row.month,
        selected: row.yearB,
        compare: row.yearA,
        delta,
        deltaPct,
      };
    });
  }, [chartData]);

  function toggleMonth(monthKey) {
    if (monthKey === "ALL") {
      setSelectedMonths(["ALL"]);
      return;
    }

    setSelectedMonths((prev) => {
      const clean = prev.includes("ALL") ? [] : prev;

      if (clean.includes(monthKey)) {
        const next = clean.filter((item) => item !== monthKey);
        return next.length === 0 ? ["ALL"] : next;
      }

      return [...clean, monthKey].sort((a, b) => Number(a) - Number(b));
    });
  }

  const hasData = chartData.length > 0;

  return (
    <div dir="rtl" className="min-h-screen bg-[#2e3038] text-white">
      <TopNavbar />
      <Sidebar isOpen={menuOpen} onToggle={() => setMenuOpen((s) => !s)} />

      <div className="mx-auto max-w-6xl px-6 pt-28 pb-14">
        <div className="mt-6 text-center">
          <h1 className="text-3xl font-extrabold tracking-tight">
            📈 דוח 1 - השוואת נרשמים לפי חודשים / שנים
          </h1>

          <p className="mt-2 text-sm text-white/75">
            השוואה: <span className="font-semibold">{yearB}</span> מול{" "}
            <span className="font-semibold">{yearA}</span> | חודשים:{" "}
            <span className="font-semibold">{monthsLabel}</span>
            {loading ? <span className="mr-2">(טוען...)</span> : null}
          </p>
        </div>

        <div className="mt-6 flex flex-col items-center justify-between gap-4 lg:flex-row">
          <div className="flex items-center gap-3">
            <div className="text-sm text-white/80">שנה</div>

            <select
              className="rounded-xl bg-white/10 px-3 py-2 text-sm ring-1 ring-white/10 focus:outline-none"
              value={yearB}
              onChange={(e) => setYearB(e.target.value)}
            >
              <option value="תשפ״ה">תשפ״ה</option>
              <option value="תשפ״ד">תשפ״ד</option>
              <option value="תשפ״ג">תשפ״ג</option>
            </select>

            <div className="text-sm text-white/80">בהשוואה ל-</div>

            <select
              className="rounded-xl bg-white/10 px-3 py-2 text-sm ring-1 ring-white/10 focus:outline-none"
              value={yearA}
              onChange={(e) => setYearA(e.target.value)}
            >
              <option value="תשפ״ד">תשפ״ד</option>
              <option value="תשפ״ג">תשפ״ג</option>
              <option value="תשפ״ב">תשפ״ב</option>
            </select>
          </div>

          <div className="flex flex-wrap justify-center gap-2">
            {months.map((month) => {
              const active = selectedMonths.includes(month.key);

              return (
                <button
                  key={month.key}
                  onClick={() => toggleMonth(month.key)}
                  className={[
                    "rounded-full px-4 py-2 text-xs font-semibold transition",
                    "ring-1 ring-white/10",
                    active
                      ? "bg-sky-500/20 text-sky-100 ring-sky-300/30"
                      : "bg-white/5 text-white/80 hover:bg-white/10",
                  ].join(" ")}
                >
                  {month.label}
                </button>
              );
            })}
          </div>
        </div>

        {errorMessage ? (
          <div className="mt-8 rounded-2xl border border-rose-300/20 bg-rose-500/10 p-5 text-center text-sm text-rose-100">
            {errorMessage}
          </div>
        ) : null}

        {!loading && !errorMessage && !hasData ? (
          <div className="mt-8 rounded-2xl border border-white/10 bg-white/5 p-5 text-center text-sm text-white/75">
            אין נתונים להצגה עבור הסינון שנבחר.
          </div>
        ) : null}

        {hasData ? (
          <div className="mt-8 flex flex-col gap-6 lg:flex-row-reverse">
            <div className="w-full lg:w-[40%]">
              <div className="rounded-[28px] bg-[#3b3e47] p-6 shadow-[0_18px_55px_rgba(0,0,0,0.35)]">
                <div className="mb-4 text-lg font-bold">
                  📋 סיכום חודשי מצטבר
                </div>

                <div className="overflow-hidden rounded-2xl bg-[#2e3038] ring-1 ring-white/10">
                  <table className="w-full text-sm">
                    <thead className="bg-white/5">
                      <tr className="text-slate-200/90">
                        <th className="px-4 py-3 text-right font-semibold">
                          חודש
                        </th>
                        <th className="px-4 py-3 text-left font-semibold">
                          {yearB}
                        </th>
                        <th className="px-4 py-3 text-left font-semibold">
                          {yearA}
                        </th>
                        <th className="px-4 py-3 text-left font-semibold">
                          % שינוי
                        </th>
                      </tr>
                    </thead>

                    <tbody>
                      {tableRows.map((row) => {
                        const positive = row.delta > 0;
                        const negative = row.delta < 0;

                        const color = positive
                          ? "text-emerald-300"
                          : negative
                          ? "text-rose-300"
                          : "text-slate-200";

                        const icon = positive ? "▲" : negative ? "▼" : "•";

                        return (
                          <tr key={row.month} className="border-t border-white/5">
                            <td className="px-4 py-3 font-medium text-slate-50">
                              {row.month}
                            </td>

                            <td className="px-4 py-3 text-left text-slate-100">
                              {fmtInt(row.selected)}
                            </td>

                            <td className="px-4 py-3 text-left text-slate-100">
                              {fmtInt(row.compare)}
                            </td>

                            <td
                              className={`px-4 py-3 text-left font-semibold ${color}`}
                            >
                              <span className="inline-flex items-center gap-2">
                                <span>{icon}</span>
                                <span>{fmtPct(row.deltaPct)}</span>
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                <div className="mt-3 text-xs text-slate-200/70">
                  הערכים בטבלה הם מצטברים בהתאם לחודשים שנבחרו.
                </div>
              </div>
            </div>

            <div className="w-full lg:w-[60%]">
              <div className="rounded-[28px] bg-[#3b3e47] p-6 shadow-[0_18px_55px_rgba(0,0,0,0.35)]">
                <div className="mb-4 text-lg font-bold">
                  📉 נרשמים מצטברים לפי חודשים
                </div>

                <div className="rounded-2xl bg-[#2e3038] p-4 ring-1 ring-white/10">
                  <ResponsiveContainer width="100%" height={420}>
                    <LineChart
                      data={chartData}
                      margin={{ top: 10, right: 20, left: 10, bottom: 10 }}
                    >
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="rgba(255,255,255,0.08)"
                      />

                      <XAxis
                        dataKey="month"
                        tick={{ fill: "rgba(255,255,255,0.80)", fontSize: 12 }}
                        tickLine={false}
                        axisLine={{ stroke: "rgba(255,255,255,0.18)" }}
                      />

                      <YAxis
                        tick={{ fill: "rgba(255,255,255,0.72)", fontSize: 12 }}
                        tickLine={false}
                        axisLine={false}
                        tickMargin={10}
                      />

                      <Tooltip content={<CustomTooltip />} />
                      <Legend content={<CustomLegend />} />

                      <Line
                        type="monotone"
                        dataKey="yearB"
                        name={yearB}
                        stroke="rgba(96,165,250,0.95)"
                        strokeWidth={3}
                        dot={false}
                        activeDot={{ r: 6 }}
                      />

                      <Line
                        type="monotone"
                        dataKey="yearA"
                        name={yearA}
                        stroke="rgba(148,163,184,0.85)"
                        strokeWidth={3}
                        dot={false}
                        activeDot={{ r: 6 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                <div className="mt-3 text-xs text-white/60">
                  * הנתונים מגיעים מבסיס הנתונים דרך ה־Backend בלבד.
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
