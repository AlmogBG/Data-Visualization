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

const fmtInt = (n) => new Intl.NumberFormat("he-IL").format(n);
const calcDelta = (curr, prev) => curr - prev;
const calcDeltaPct = (curr, prev) =>
  prev === 0 ? 0 : ((curr - prev) / prev) * 100;
const fmtPct = (n) => `${n > 0 ? "+" : ""}${n.toFixed(1)}%`;

function seededRand(seed) {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

function genRandomValue(seed, min, max) {
  const r = seededRand(seed);
  return Math.floor(min + r * (max - min + 1));
}

function getMonthsLabel(selectedMonths) {
  if (selectedMonths.includes("ALL")) return "כל החודשים";

  const map = new Map(months.map((m) => [m.key, m.label]));
  return selectedMonths.map((k) => map.get(k)).join(", ");
}

function generateMonthlySeries(yearKey) {
  const yearSeed = [...String(yearKey)].reduce(
    (acc, ch) => acc + ch.charCodeAt(0),
    0
  );

  return Array.from({ length: 12 }, (_, i) => {
    const monthIndex = i + 1;
    return genRandomValue(yearSeed * 97 + monthIndex * 13, 90, 520);
  });
}

function buildMockCumulativeData({ yearA, yearB, selectedMonths }) {
  const useAll = selectedMonths.includes("ALL");

  const chosenMonthKeys = useAll
    ? months.filter((m) => m.key !== "ALL").map((m) => m.key)
    : [...selectedMonths].sort((a, b) => Number(a) - Number(b));

  const mapLabel = new Map(months.map((m) => [m.key, m.label]));

  const monthlyA = generateMonthlySeries(yearA);
  const monthlyB = generateMonthlySeries(yearB);

  let cumA = 0;
  let cumB = 0;

  return chosenMonthKeys.map((mKey) => {
    const idx = Number(mKey) - 1;

    cumA += monthlyA[idx];
    cumB += monthlyB[idx];

    return {
      monthKey: mKey,
      month: mapLabel.get(mKey) ?? mKey,
      yearA: cumA,
      yearB: cumB,
    };
  });
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
        נבחר (מצטבר): <span className="font-semibold">{fmtInt(selected)}</span>
      </div>

      <div className="text-sm text-slate-200">
        להשוואה (מצטבר):{" "}
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
  const [apiMode, setApiMode] = useState("mock");
  const [loading, setLoading] = useState(false);

  const monthsLabel = useMemo(
    () => getMonthsLabel(selectedMonths),
    [selectedMonths]
  );

  useEffect(() => {
    let cancelled = false;

    async function loadData() {
      setLoading(true);

      try {
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

        if (!res.ok) {
          throw new Error("API not ready");
        }

        const json = await res.json();

        if (!json?.rows || !Array.isArray(json.rows)) {
          throw new Error("Bad API shape");
        }

        if (!cancelled) {
          setChartData(json.rows);
          setApiMode("api");
        }
      } catch (error) {
        console.error("Report1 API error:", error);

        const mock = buildMockCumulativeData({
          yearA,
          yearB,
          selectedMonths,
        });

        if (!cancelled) {
          setChartData(mock);
          setApiMode("mock");
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
    return chartData.map((d) => {
      const delta = calcDelta(d.yearB, d.yearA);
      const deltaPct = calcDeltaPct(d.yearB, d.yearA);

      return {
        month: d.month,
        selected: d.yearB,
        compare: d.yearA,
        delta,
        deltaPct,
      };
    });
  }, [chartData]);

  const toggleMonth = (mKey) => {
    if (mKey === "ALL") {
      setSelectedMonths(["ALL"]);
      return;
    }

    setSelectedMonths((prev) => {
      const clean = prev.includes("ALL") ? [] : prev;

      if (clean.includes(mKey)) {
        const next = clean.filter((x) => x !== mKey);
        return next.length === 0 ? ["ALL"] : next;
      }

      return [...clean, mKey];
    });
  };

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
            <span className="mx-2 font-semibold">
              {apiMode === "api" ? "API" : "MOCK"}
            </span>
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
            {months.map((m) => {
              const active = selectedMonths.includes(m.key);

              return (
                <button
                  key={m.key}
                  onClick={() => toggleMonth(m.key)}
                  className={[
                    "rounded-full px-4 py-2 text-xs font-semibold transition",
                    "ring-1 ring-white/10",
                    active
                      ? "bg-sky-500/20 text-sky-100 ring-sky-300/30"
                      : "bg-white/5 text-white/80 hover:bg-white/10",
                  ].join(" ")}
                >
                  {m.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="mt-8 flex flex-col gap-6 lg:flex-row-reverse">
          <div className="w-full lg:w-[40%]">
            <div className="rounded-[28px] bg-[#3b3e47] p-6 shadow-[0_18px_55px_rgba(0,0,0,0.35)]">
              <div className="mb-4 text-lg font-bold">
                📋 סיכום חודשי מצטבר (השוואה)
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
                    {tableRows.map((r) => {
                      const pos = r.delta > 0;
                      const neg = r.delta < 0;

                      const pctColor = pos
                        ? "text-emerald-300"
                        : neg
                        ? "text-rose-300"
                        : "text-slate-200";

                      const pctIcon = pos ? "▲" : neg ? "▼" : "•";

                      return (
                        <tr key={r.month} className="border-t border-white/5">
                          <td className="px-4 py-3 font-medium text-slate-50">
                            {r.month}
                          </td>

                          <td className="px-4 py-3 text-left text-slate-100">
                            {fmtInt(r.selected)}
                          </td>

                          <td className="px-4 py-3 text-left text-slate-100">
                            {fmtInt(r.compare)}
                          </td>

                          <td
                            className={`px-4 py-3 text-left font-semibold ${pctColor}`}
                          >
                            <span className="inline-flex items-center gap-2">
                              <span className="text-base leading-none">
                                {pctIcon}
                              </span>
                              <span>{fmtPct(r.deltaPct)}</span>
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
                * הגרף מציג סכום מצטבר (Cumulative) כדי לראות מגמה שנתית וקצב
                צמיחה.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}