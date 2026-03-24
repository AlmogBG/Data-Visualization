import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ResponsiveContainer,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import Sidebar from "../components/Sidebar";
import TopNavbar from "../components/TopNavbar";

const API_BASE_URL =
  process.env.REACT_APP_API_BASE_URL || "http://localhost:10000";

const campusOptions = [
  { key: "BOTH", label: "שני הקמפוסים" },
  { key: "ASHDOD", label: "אשדוד" },
  { key: "BEER_SHEVA", label: "באר שבע" },
];

const years = ["תשפ״ה", "תשפ״ד", "תשפ״ג", "תשפ״ב"];

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

function getMonthsLabel(selectedMonths) {
  if (selectedMonths.includes("ALL")) return "כל החודשים";
  const map = new Map(months.map((m) => [m.key, m.label]));
  return selectedMonths.map((k) => map.get(k)).join(", ");
}

function seededRand(seed) {
  let x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

function genRandomValue(seed, min, max) {
  const r = seededRand(seed);
  return Math.floor(min + r * (max - min + 1));
}

const monthKeys = ["01", "02", "03", "04", "05", "06", "07", "08", "09", "10", "11", "12"];

function getYearSuffix(yearLabel) {
  const map = {
    'תשפ״ב': "22",
    'תשפ״ג': "23",
    'תשפ״ד': "24",
    'תשפ״ה': "25",
  };
  return map[yearLabel] || "25";
}

function buildMockMonthly({ year, selectedMonths }) {
  const useAll = selectedMonths.includes("ALL");
  const picked = useAll ? monthKeys : selectedMonths.filter((m) => m !== "ALL");
  const list = picked.length ? picked : monthKeys;
  const yearSuffix = getYearSuffix(year);

  return list.map((mKey, idx) => {
    const seedBase = year.length * 71 + Number(mKey) * 29 + idx * 13;

    const invitedAshdod = genRandomValue(seedBase + 11, 40, 140);
    const invitedBeer = genRandomValue(seedBase + 37, 35, 135);

    const attendedAshdod = Math.max(
      0,
      Math.round(invitedAshdod * (0.72 + seededRand(seedBase + 91) * 0.2))
    );
    const attendedBeer = Math.max(
      0,
      Math.round(invitedBeer * (0.7 + seededRand(seedBase + 97) * 0.22))
    );

    return {
      month: mKey,
      label: `${mKey}/${yearSuffix}`,
      invitedAshdod,
      invitedBeer,
      attendedAshdod,
      attendedBeer,
    };
  });
}

const outcomes = [
  { key: "ENROLLED", label: "נרשם" },
  { key: "NOT_RELEVANT", label: "לא רלוונטי" },
  { key: "NOT_INTERESTED", label: "לא מעוניין" },
  { key: "FOLLOWUP", label: "רלוונטי ונמשך טיפול" },
  { key: "SELF_CONTACT", label: "ייצור קשר בעצמו – לא רלוונטי" },
  { key: "OTHER", label: "אחר" },
];

const OUTCOME_COLORS = [
  "#93c5fd",
  "#fcd34d",
  "#fb7185",
  "#86efac",
  "#a7f3d0",
  "#cbd5e1",
];

function buildMockOutcomePie({ year, selectedMonths, campusKey }) {
  const useAll = selectedMonths.includes("ALL");
  const monthFactor = useAll ? 12 : Math.max(1, selectedMonths.filter((m) => m !== "ALL").length);

  const campusFactor = campusKey === "ASHDOD" ? 1.1 : 0.95;
  const seedBase =
    [...year].reduce((a, ch) => a + ch.charCodeAt(0), 0) * 13 +
    monthFactor * 17 +
    (campusKey === "ASHDOD" ? 101 : 202);

  const total = Math.round(genRandomValue(seedBase + 1, 280, 520) * campusFactor);

  const raw = [
    genRandomValue(seedBase + 11, 18, 34),
    genRandomValue(seedBase + 21, 18, 30),
    genRandomValue(seedBase + 31, 8, 16),
    genRandomValue(seedBase + 41, 6, 14),
    genRandomValue(seedBase + 51, 6, 14),
    genRandomValue(seedBase + 61, 2, 10),
  ];

  const sumRaw = raw.reduce((a, b) => a + b, 0);
  const counts = raw.map((w) => Math.max(0, Math.round((w / sumRaw) * total)));

  let diff = total - counts.reduce((a, b) => a + b, 0);
  let i = 0;
  while (diff !== 0 && i < 200) {
    const idx = i % counts.length;
    if (diff > 0) {
      counts[idx] += 1;
      diff -= 1;
    } else if (counts[idx] > 0) {
      counts[idx] -= 1;
      diff += 1;
    }
    i++;
  }

  return outcomes.map((o, idx) => ({
    key: o.key,
    name: o.label,
    value: counts[idx],
  }));
}

function CustomTooltip({ active, payload, label, mode }) {
  if (!active || !payload?.length) return null;

  const a = payload.find((p) => p.dataKey?.includes("Ashdod"))?.value ?? null;
  const b = payload.find((p) => p.dataKey?.includes("Beer"))?.value ?? null;

  return (
    <div className="rounded-xl border border-slate-700/40 bg-slate-950/90 p-3 text-slate-100 shadow-lg">
      <div className="mb-1 font-bold">{label}</div>
      <div className="text-sm text-slate-200">
        {mode === "invited" ? "נרשמו/הוזמנו" : "הגיעו בפועל"}
      </div>

      {a !== null && (
        <div className="mt-1 text-sm text-slate-200">
          אשדוד: <span className="font-semibold">{fmtInt(a)}</span>
        </div>
      )}
      {b !== null && (
        <div className="text-sm text-slate-200">
          באר שבע: <span className="font-semibold">{fmtInt(b)}</span>
        </div>
      )}
    </div>
  );
}

function SubtleCursor({ x, y, width, height }) {
  return (
    <rect
      x={x}
      y={y}
      width={width}
      height={height}
      rx={12}
      ry={12}
      fill="rgba(255,255,255,0.14)"
      stroke="rgba(255,255,255,0.18)"
      strokeWidth={1}
    />
  );
}

function MiniIcon({ children, className = "", size = "h-6 w-6" }) {
  return (
    <svg viewBox="0 0 24 24" className={`${size} ${className}`} fill="none" aria-hidden="true">
      {children}
    </svg>
  );
}

function IcoReportTitle() {
  return (
    <MiniIcon
      size="h-10 w-10"
      className="text-white/60 align-middle -translate-y-[1px]"
    >
      <path d="M4 19V5m0 14h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M8 15V9m4 6V7m4 8v-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </MiniIcon>
  );
}

function IcoPie() {
  return (
    <MiniIcon size="h-5 w-5" className="text-white/55">
      <path
        d="M11 3a9 9 0 109 9h-9V3Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path
        d="M13 3v8h8"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
    </MiniIcon>
  );
}

function PieTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  const p = payload[0];
  const total = payload?.[0]?.payload?.__total ?? null;

  return (
    <div className="rounded-xl border border-slate-700/40 bg-slate-950/90 p-3 text-slate-100 shadow-lg">
      <div className="mb-1 font-bold">{label ?? p?.name}</div>
      <div className="text-sm text-slate-200">
        כמות: <span className="font-semibold">{fmtInt(p?.value ?? 0)}</span>
      </div>
      {total ? (
        <div className="mt-1 text-xs text-white/60">
          מתוך {fmtInt(total)} סה"כ
        </div>
      ) : null}
    </div>
  );
}

function PieLegend({ items }) {
  return (
    <div className="mt-3 flex flex-wrap justify-center gap-x-6 gap-y-2 text-xs text-white/80">
      {items.map((it, idx) => (
        <div key={it.key} className="flex items-center gap-2">
          <span
            className="inline-block h-2.5 w-2.5 rounded-full"
            style={{ background: OUTCOME_COLORS[idx % OUTCOME_COLORS.length] }}
          />
          <span>{it.name}</span>
        </div>
      ))}
    </div>
  );
}

function renderPieLabel({ cx, cy, midAngle, innerRadius, outerRadius, percent, value }) {
  if (!percent || percent < 0.04) return null;

  const RADIAN = Math.PI / 180;
  const r = innerRadius + (outerRadius - innerRadius) * 0.6;
  const x = cx + r * Math.cos(-midAngle * RADIAN);
  const y = cy + r * Math.sin(-midAngle * RADIAN);
  const pct = Math.round(percent * 100);

  return (
    <text
      x={x}
      y={y}
      fill="rgba(255, 255, 255, 1)"
      textAnchor="middle"
      dominantBaseline="central"
      fontSize={12}
      fontWeight={800}
      style={{ pointerEvents: "none" }}
    >
      {pct}% , {fmtInt(value)}
    </text>
  );
}

function PieCard({ title, data }) {
  const total = data.reduce((a, b) => a + (b.value ?? 0), 0);
  const dataWithTotal = data.map((d) => ({ ...d, __total: total }));

  return (
    <div className="rounded-2xl bg-[#2e3038] p-4 ring-1 ring-white/10">
      <div className="mb-3 flex items-center justify-between gap-2">
        <div className="text-sm font-semibold text-white/90">{title}</div>
        <div className="text-xs text-white/60">סה"כ: {fmtInt(total)}</div>
      </div>

      <div className="rounded-2xl bg-white/6 p-3 ring-1 ring-white/5">
        <ResponsiveContainer width="100%" height={260}>
          <PieChart>
            <Tooltip content={<PieTooltip />} />
            <Pie
              data={dataWithTotal}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              outerRadius={95}
              innerRadius={52}
              paddingAngle={2}
              stroke="rgba(255, 255, 255, 0.14)"
              strokeWidth={1}
              labelLine={false}
              label={renderPieLabel}
            >
              {dataWithTotal.map((entry, index) => (
                <Cell
                  key={entry.key}
                  fill={OUTCOME_COLORS[index % OUTCOME_COLORS.length]}
                />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
      </div>

      <PieLegend items={data} />
    </div>
  );
}

export default function Report4() {
  const navigate = useNavigate();

  const [menuOpen, setMenuOpen] = useState(false);
  const [campus, setCampus] = useState("BOTH");
  const [year, setYear] = useState("תשפ״ה");
  const [selectedMonths, setSelectedMonths] = useState(["ALL"]);

  const [data, setData] = useState([]);
  const [pieAshdod, setPieAshdod] = useState([]);
  const [pieBeer, setPieBeer] = useState([]);
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

    async function loadReport4() {
      setLoading(true);

      try {
        const monthsParam = selectedMonths.includes("ALL")
          ? "ALL"
          : [...selectedMonths]
              .filter((m) => m !== "ALL")
              .sort((a, b) => Number(a) - Number(b))
              .join(",");

        const qs = new URLSearchParams({
          campus,
          year,
          months: monthsParam,
        });

        const [monthlyRes, outcomesRes] = await Promise.all([
          fetch(`${API_BASE_URL}/api/report4/monthly?${qs.toString()}`),
          fetch(`${API_BASE_URL}/api/report4/outcomes?${qs.toString()}`),
        ]);

        if (!monthlyRes.ok || !outcomesRes.ok) {
          throw new Error("API not ready");
        }

        const monthlyJson = await monthlyRes.json();
        const outcomesJson = await outcomesRes.json();

        if (!Array.isArray(monthlyJson)) {
          throw new Error("Bad monthly API shape");
        }

        if (!cancelled) {
          setData(monthlyJson);
          setPieAshdod(outcomesJson?.ASHDOD?.items || []);
          setPieBeer(outcomesJson?.BEER_SHEVA?.items || []);
          setApiMode("api");
        }
      } catch (error) {
        console.error("Report4 API error:", error);

        const mockData = buildMockMonthly({ year, selectedMonths });

        const adjusted =
          campus === "ASHDOD"
            ? mockData.map((d) => ({
                ...d,
                invitedBeer: null,
                attendedBeer: null,
              }))
            : campus === "BEER_SHEVA"
            ? mockData.map((d) => ({
                ...d,
                invitedAshdod: null,
                attendedAshdod: null,
              }))
            : mockData;

        if (!cancelled) {
          setData(adjusted);
          setPieAshdod(
            buildMockOutcomePie({
              year,
              selectedMonths,
              campusKey: "ASHDOD",
            })
          );
          setPieBeer(
            buildMockOutcomePie({
              year,
              selectedMonths,
              campusKey: "BEER_SHEVA",
            })
          );
          setApiMode("mock");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadReport4();

    return () => {
      cancelled = true;
    };
  }, [campus, year, selectedMonths]);

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

      return [...clean, mKey].sort((a, b) => Number(a) - Number(b));
    });
  };

  const campusLabel =
    campusOptions.find((c) => c.key === campus)?.label ?? "שני הקמפוסים";

  return (
    <div dir="rtl" className="min-h-screen bg-[#2e3038] text-white">
      <TopNavbar />
      <Sidebar isOpen={menuOpen} onToggle={() => setMenuOpen((s) => !s)} />

      <div className="mx-auto max-w-6xl px-6 pt-28 pb-14">
        <div className="mt-6 text-center">
          <div className="inline-flex items-center gap-3">
            <IcoReportTitle />
            <h1 className="text-3xl font-extrabold tracking-tight">
              דוח 4 – ניתוח הגעה למפגשי ייעוץ
            </h1>
          </div>

          <p className="mt-2 text-sm text-white/75">
            השוואה לפי חודשים בין קמפוסים | שנה:{" "}
            <span className="font-semibold">{year}</span> | חודשים:{" "}
            <span className="font-semibold">{monthsLabel}</span> | קמפוס:{" "}
            <span className="font-semibold">{campusLabel}</span>
            <span className="mx-2 font-semibold">
              {apiMode === "api" ? "API" : "MOCK"}
            </span>
            {loading ? <span className="mr-2">(טוען...)</span> : null}
          </p>
        </div>

        <div className="mt-6 flex flex-col items-center justify-between gap-4 lg:flex-row">
          <div className="flex flex-wrap items-center gap-3">
            <div className="text-sm text-white/80">קמפוס</div>
            <select
              className="rounded-xl bg-white/10 px-3 py-2 text-sm ring-1 ring-white/10 focus:outline-none"
              value={campus}
              onChange={(e) => setCampus(e.target.value)}
            >
              {campusOptions.map((c) => (
                <option key={c.key} value={c.key}>
                  {c.label}
                </option>
              ))}
            </select>

            <div className="text-sm text-white/80">שנה</div>
            <select
              className="rounded-xl bg-white/10 px-3 py-2 text-sm ring-1 ring-white/10 focus:outline-none"
              value={year}
              onChange={(e) => setYear(e.target.value)}
            >
              {years.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
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

        <div className="mt-8">
          <div className="rounded-[28px] bg-[#3b3e47] p-6 shadow-[0_18px_55px_rgba(0,0,0,0.35)]">
            <div className="mb-4 flex items-center justify-between">
              <div className="text-lg font-bold">דוח רביעי</div>
              <div className="text-xs text-white/60">
                4 גרפים • קווים + עמודות • לפי חודש
              </div>
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <div className="rounded-2xl bg-[#2e3038] p-4 ring-1 ring-white/10">
                <div className="mb-2 text-sm font-semibold text-white/90">
                  נרשמו/הוזמנו לפגישת ייעוץ לפי חודש
                </div>
                <div className="rounded-2xl bg-white/6 p-3 ring-1 ring-white/5">
                  <ResponsiveContainer width="100%" height={260}>
                    <LineChart data={data} margin={{ top: 10, right: 14, left: 8, bottom: 6 }}>
                      <CartesianGrid strokeDasharray="3 6" stroke="rgba(255,255,255,0.06)" />
                      <XAxis
                        dataKey="label"
                        tick={{ fill: "rgba(255,255,255,0.75)", fontSize: 12 }}
                        tickLine={false}
                        axisLine={{ stroke: "rgba(255,255,255,0.18)" }}
                      />
                      <YAxis
                        tick={{ fill: "rgba(255,255,255,0.70)", fontSize: 12 }}
                        tickLine={false}
                        axisLine={false}
                      />
                      <Tooltip content={<CustomTooltip mode="invited" />} cursor={<SubtleCursor />} />
                      <Legend wrapperStyle={{ color: "rgba(255,255,255,0.70)" }} />
                      <Line
                        type="monotone"
                        dataKey="invitedAshdod"
                        name="אשדוד"
                        stroke="rgba(96,165,250,0.95)"
                        strokeWidth={3}
                        dot={{ r: 4, strokeWidth: 2, fill: "#e5f0ff" }}
                        connectNulls
                      />
                      <Line
                        type="monotone"
                        dataKey="invitedBeer"
                        name="באר שבע"
                        stroke="rgba(148,163,184,0.85)"
                        strokeWidth={3}
                        dot={{ r: 4, strokeWidth: 2, fill: "#ffffff" }}
                        connectNulls
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="rounded-2xl bg-[#2e3038] p-4 ring-1 ring-white/10">
                <div className="mb-2 text-sm font-semibold text-white/90">
                  הגיעו לפגישת ייעוץ לפי חודש
                </div>
                <div className="rounded-2xl bg-white/6 p-3 ring-1 ring-white/5">
                  <ResponsiveContainer width="100%" height={260}>
                    <LineChart data={data} margin={{ top: 10, right: 14, left: 8, bottom: 6 }}>
                      <CartesianGrid strokeDasharray="3 6" stroke="rgba(255,255,255,0.06)" />
                      <XAxis
                        dataKey="label"
                        tick={{ fill: "rgba(255,255,255,0.75)", fontSize: 12 }}
                        tickLine={false}
                        axisLine={{ stroke: "rgba(255,255,255,0.18)" }}
                      />
                      <YAxis
                        tick={{ fill: "rgba(255,255,255,0.70)", fontSize: 12 }}
                        tickLine={false}
                        axisLine={false}
                      />
                      <Tooltip content={<CustomTooltip mode="attended" />} cursor={<SubtleCursor />} />
                      <Legend wrapperStyle={{ color: "rgba(255,255,255,0.70)" }} />
                      <Line
                        type="monotone"
                        dataKey="attendedAshdod"
                        name="אשדוד"
                        stroke="rgba(96,165,250,0.95)"
                        strokeWidth={3}
                        dot={{ r: 4, strokeWidth: 2, fill: "#e5f0ff" }}
                        connectNulls
                      />
                      <Line
                        type="monotone"
                        dataKey="attendedBeer"
                        name="באר שבע"
                        stroke="rgba(148,163,184,0.85)"
                        strokeWidth={3}
                        dot={{ r: 4, strokeWidth: 2, fill: "#ffffff" }}
                        connectNulls
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="rounded-2xl bg-[#2e3038] p-4 ring-1 ring-white/10">
                <div className="mb-2 text-sm font-semibold text-white/90">
                  עמודות – נרשמו/הוזמנו לפי חודש
                </div>
                <div className="rounded-2xl bg-white/6 p-3 ring-1 ring-white/5">
                  <ResponsiveContainer width="100%" height={260}>
                    <BarChart data={data} margin={{ top: 10, right: 14, left: 8, bottom: 6 }} barCategoryGap="18%" barGap={6}>
                      <CartesianGrid strokeDasharray="3 6" stroke="rgba(255,255,255,0.06)" />
                      <XAxis
                        dataKey="label"
                        tick={{ fill: "rgba(255,255,255,0.75)", fontSize: 12 }}
                        tickLine={false}
                        axisLine={{ stroke: "rgba(255,255,255,0.18)" }}
                      />
                      <YAxis
                        tick={{ fill: "rgba(255,255,255,0.70)", fontSize: 12 }}
                        tickLine={false}
                        axisLine={false}
                      />
                      <Tooltip content={<CustomTooltip mode="invited" />} cursor={<SubtleCursor />} />
                      <Legend wrapperStyle={{ color: "rgba(255,255,255,0.70)" }} />
                      <Bar dataKey="invitedAshdod" name="אשדוד" fill="rgba(96,165,250,0.85)" radius={[8, 8, 0, 0]} barSize={22} />
                      <Bar dataKey="invitedBeer" name="באר שבע" fill="rgba(148,163,184,0.55)" radius={[8, 8, 0, 0]} barSize={22} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="rounded-2xl bg-[#2e3038] p-4 ring-1 ring-white/10">
                <div className="mb-2 text-sm font-semibold text-white/90">
                  עמודות – הגיעו בפועל לפי חודש
                </div>
                <div className="rounded-2xl bg-white/6 p-3 ring-1 ring-white/5">
                  <ResponsiveContainer width="100%" height={260}>
                    <BarChart data={data} margin={{ top: 10, right: 14, left: 8, bottom: 6 }} barCategoryGap="18%" barGap={6}>
                      <CartesianGrid strokeDasharray="3 6" stroke="rgba(255,255,255,0.06)" />
                      <XAxis
                        dataKey="label"
                        tick={{ fill: "rgba(255,255,255,0.75)", fontSize: 12 }}
                        tickLine={false}
                        axisLine={{ stroke: "rgba(255,255,255,0.18)" }}
                      />
                      <YAxis
                        tick={{ fill: "rgba(255,255,255,0.70)", fontSize: 12 }}
                        tickLine={false}
                        axisLine={false}
                      />
                      <Tooltip content={<CustomTooltip mode="attended" />} cursor={<SubtleCursor />} />
                      <Legend wrapperStyle={{ color: "rgba(255,255,255,0.70)" }} />
                      <Bar dataKey="attendedAshdod" name="אשדוד" fill="rgba(96,165,250,0.85)" radius={[8, 8, 0, 0]} barSize={22} />
                      <Bar dataKey="attendedBeer" name="באר שבע" fill="rgba(148,163,184,0.55)" radius={[8, 8, 0, 0]} barSize={22} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            <div className="mt-8 rounded-2xl bg-[#2e3038] p-5 ring-1 ring-white/10">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <IcoPie />
                  <div className="text-lg font-bold">ניתוח פגישות : תוצאות</div>
                </div>
                <div className="text-xs text-white/60">
                  תוצאות פגישות ייעוץ • חלוקה לפי סטטוס
                </div>
              </div>

              <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                {(campus === "BOTH" || campus === "ASHDOD") && (
                  <PieCard title="תוצאות פ.הייעוץ – קמפוס אשדוד" data={pieAshdod} />
                )}
                {(campus === "BOTH" || campus === "BEER_SHEVA") && (
                  <PieCard title="תוצאות פ.הייעוץ – קמפוס באר שבע" data={pieBeer} />
                )}
              </div>

              <div className="mt-4 text-xs text-white/60">
                המטרה: לזהות צווארי בקבוק בתהליך הייעוץ ולשפר את איכות הסינון והטיפול.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}