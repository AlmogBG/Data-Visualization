import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  BarChart,
  Bar,
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

const departments = [
  "הנדסת תוכנה",
  "מדעי המחשב",
  "הנדסת בניין",
  "הנדסת מכונות",
  "הנדסת תעשייה וניהול",
  "הנדסת חשמל",
  "תקשורת חזותית",
];

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
  let x = Math.sin(seed) * 10000;
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

function MiniIcon({ children, className = "", size = "h-4 w-4" }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={`${size} ${className}`}
      fill="none"
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

function IcoTitle() {
  return (
    <MiniIcon
      size="h-8 w-8"
      className="text-white/65 shrink-0 translate-y-[2px]"
    >
      <path
        d="M4 19V5m0 14h16"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M8 15V9m4 6V7m4 8v-5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </MiniIcon>
  );
}

function IcoTable() {
  return (
    <MiniIcon className="text-white/55">
      <path
        d="M4 6h16v12H4V6Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path d="M4 10h16" stroke="currentColor" strokeWidth="2" />
      <path d="M10 6v12" stroke="currentColor" strokeWidth="2" />
      <path d="M15 6v12" stroke="currentColor" strokeWidth="2" />
    </MiniIcon>
  );
}

function IcoChart() {
  return (
    <MiniIcon className="text-white/55">
      <path
        d="M6 20V10M12 20V4M18 20V14"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </MiniIcon>
  );
}

function TrendArrow({ dir }) {
  if (dir === "neutral") return null;

  const isUp = dir === "up";
  return (
    <svg
      viewBox="0 0 24 24"
      className={`h-5 w-5 ${isUp ? "text-emerald-300" : "text-rose-300"}`}
      fill="currentColor"
      aria-hidden="true"
    >
      {isUp ? (
        <path d="M12 5l8 14H4l8-14Z" />
      ) : (
        <path d="M12 19 4 5h16l-8 14Z" />
      )}
    </svg>
  );
}

function buildTableHeader(year, monthsLabel) {
  return (
    <div className="flex flex-col leading-tight">
      <span>{year}</span>
      <span className="text-[11px] text-white/70">{monthsLabel}</span>
    </div>
  );
}

function CustomTooltip({ active, payload, label, yearA, yearB, monthsLabel }) {
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
      <div className="mb-2 text-xs text-white/60">{monthsLabel}</div>

      <div className="text-sm text-slate-200">
        {yearB}: <span className="font-semibold">{fmtInt(selected)}</span>
      </div>
      <div className="text-sm text-slate-200">
        {yearA}: <span className="font-semibold">{fmtInt(compare)}</span>
      </div>

      <div className={`mt-1 text-sm ${deltaColor}`}>
        שינוי: <span className="font-semibold">{fmtInt(delta)}</span> ({fmtPct(deltaPct)})
      </div>
    </div>
  );
}

function CustomLegend({ payload }) {
  if (!payload?.length) return null;

  return (
    <div className="flex flex-wrap items-center justify-center gap-5 pt-2 text-sm text-white/85">
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

function CustomXAxisTick({ x, y, payload }) {
  const text = payload?.value ?? "";
  const words = String(text).split(" ");
  const mid = Math.ceil(words.length / 2);
  const lines = [
    words.slice(0, mid).join(" "),
    words.slice(mid).join(" "),
  ].filter(Boolean);

  return (
    <g transform={`translate(${x},${y})`}>
      {lines.map((line, i) => (
        <text
          key={i}
          x={0}
          y={0}
          dy={16 + i * 14}
          textAnchor="middle"
          fill="rgba(255,255,255,0.80)"
          fontSize={12}
        >
          {line}
        </text>
      ))}
    </g>
  );
}

function CustomCursor({ x, y, width, height }) {
  const axisPad = 86;
  const safeX = (x ?? 0) + axisPad;
  const safeW = Math.max(0, (width ?? 0) - axisPad);

  return (
    <rect
      x={safeX}
      y={y}
      width={safeW}
      height={height}
      rx={12}
      ry={12}
      fill="rgba(255,255,255,0.10)"
      stroke="rgba(255,255,255,0.22)"
      strokeWidth={1.5}
    />
  );
}

function buildMockChartData({ yearA, yearB, selectedMonths }) {
  const useAll = selectedMonths.includes("ALL");
  const monthFactor = useAll ? 12 : selectedMonths.length;

  return departments.map((dep, idx) => {
    const seedA = idx * 100 + yearA.length * 17 + monthFactor * 3;
    const seedB = idx * 100 + yearB.length * 19 + monthFactor * 5;

    const baseA = genRandomValue(seedA, 80, 450) * monthFactor;
    const baseB = Math.max(0, baseA + genRandomValue(seedB, -120, 160));

    return {
      department: dep,
      yearA: baseA,
      yearB: baseB,
    };
  });
}

export default function Report2() {
  const navigate = useNavigate();

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
    const token =
      localStorage.getItem("token") || sessionStorage.getItem("token");

    if (!token) {
      navigate("/login", { replace: true });
    }
  }, [navigate]);

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
          `${API_BASE_URL}/api/report2/comparison?${params.toString()}`
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
        const mock = buildMockChartData({ yearA, yearB, selectedMonths });

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
    return chartData
      .map((d) => {
        const delta = calcDelta(d.yearB, d.yearA);
        const deltaPct = calcDeltaPct(d.yearB, d.yearA);

        return {
          department: d.department,
          selected: d.yearB,
          compare: d.yearA,
          delta,
          deltaPct,
        };
      })
      .sort((x, y) => y.selected - x.selected);
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
          <div className="inline-flex items-center justify-center gap-3 align-middle">
            <IcoTitle />
            <h1 className="leading-none text-3xl font-extrabold tracking-tight">
              דוח 2 - ביקושי המחלקות של הנרשמים למכללה בהשוואה לשנים האחרונות
            </h1>
          </div>

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
              <div className="mb-4 flex items-center gap-2">
                <IcoTable />
                <div className="text-lg font-bold">ביקושי המחלקות (השוואה)</div>
              </div>

              <div className="overflow-hidden rounded-2xl bg-[#2e3038] ring-1 ring-white/10">
                <table className="w-full text-sm">
                  <thead className="bg-white/5">
                    <tr className="text-slate-200/90">
                      <th className="px-4 py-3 text-right font-semibold">מחלקה</th>
                      <th className="px-4 py-3 text-left font-semibold">
                        {buildTableHeader(yearB, monthsLabel)}
                      </th>
                      <th className="px-4 py-3 text-left font-semibold">
                        {buildTableHeader(yearA, monthsLabel)}
                      </th>
                      <th className="px-4 py-3 text-left font-semibold">שינוי</th>
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

                      const dir = pos ? "up" : neg ? "down" : "neutral";

                      return (
                        <tr
                          key={r.department}
                          className="border-t border-white/5"
                        >
                          <td className="px-4 py-3 font-medium text-slate-50">
                            {r.department}
                          </td>
                          <td className="px-4 py-3 text-left text-slate-100">
                            {fmtInt(r.selected)}
                          </td>
                          <td className="px-4 py-3 text-left text-slate-100">
                            {fmtInt(r.compare)}
                          </td>

                          <td className={`px-4 py-3 text-left font-semibold ${pctColor}`}>
                            <div className="flex items-center justify-end gap-2">
                              <span>
                                {fmtInt(r.delta)} ({fmtPct(r.deltaPct)})
                              </span>
                              <TrendArrow dir={dir} />
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="mt-3 text-xs text-slate-200/70">
                שינוי מחושב ביחס ל־{yearA} עבור החודשים שנבחרו ({monthsLabel}).
              </div>
            </div>
          </div>

          <div className="w-full lg:w-[60%]">
            <div className="rounded-[28px] bg-[#3b3e47] p-6 shadow-[0_18px_55px_rgba(0,0,0,0.35)]">
              <div className="mb-4 flex items-center gap-2">
                <IcoChart />
                <div className="text-lg font-bold">נרשמים לפי מחלקה</div>
              </div>

              <div className="rounded-2xl bg-[#2e3038] p-4 ring-1 ring-white/10">
                <ResponsiveContainer width="100%" height={460}>
                  <BarChart
                    data={chartData}
                    margin={{ top: 10, right: 8, left: 80, bottom: 34 }}
                    barCategoryGap="6%"
                    barGap={10}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="rgba(255,255,255,0.08)"
                    />

                    <XAxis
                      dataKey="department"
                      interval={0}
                      height={64}
                      tick={<CustomXAxisTick />}
                      tickLine={false}
                      axisLine={{ stroke: "rgba(255,255,255,0.18)" }}
                    />

                    <YAxis
                      width={64}
                      tick={{ fill: "rgba(255,255,255,0.72)", fontSize: 12 }}
                      dx={-14}
                      tickMargin={16}
                      tickLine={false}
                      axisLine={false}
                    />

                    <Tooltip
                      content={
                        <CustomTooltip
                          yearA={yearA}
                          yearB={yearB}
                          monthsLabel={monthsLabel}
                        />
                      }
                      cursor={<CustomCursor />}
                    />

                    <Legend content={<CustomLegend />} />

                    <Bar
                      dataKey="yearB"
                      name={yearB}
                      fill="rgba(96,165,250,0.85)"
                      radius={[8, 8, 0, 0]}
                      barSize={38}
                      activeBar={{
                        stroke: "rgba(255,255,255,0.45)",
                        strokeWidth: 2,
                      }}
                    />
                    <Bar
                      dataKey="yearA"
                      name={yearA}
                      fill="rgba(148,163,184,0.55)"
                      radius={[8, 8, 0, 0]}
                      barSize={38}
                      activeBar={{
                        stroke: "rgba(255,255,255,0.35)",
                        strokeWidth: 2,
                      }}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}