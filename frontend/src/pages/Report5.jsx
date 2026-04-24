import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
} from "recharts";
import Sidebar from "../components/Sidebar";
import TopNavbar from "../components/TopNavbar";

const API_BASE_URL =
  process.env.REACT_APP_API_BASE_URL || "http://188.245.161.194:5000";

/** ---------- Options ---------- */
const campusOptions = [
  { key: "ALL", label: "כל הקמפוסים" },
  { key: "ASHDOD", label: "אשדוד" },
  { key: "BEER_SHEVA", label: "באר שבע" },
];

const years = ["תשפ״ה", "תשפ״ד", "תשפ״ג", "תשפ״ב"];

/** ---------- Helpers ---------- */
const fmtInt = (n) => new Intl.NumberFormat("he-IL").format(n);

function seededRand(seed) {
  let x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

function genRandomValue(seed, min, max) {
  const r = seededRand(seed);
  return Math.floor(min + r * (max - min + 1));
}

/** ---------- Mock data ---------- */
const mediaSources = [
  { key: "LinkedIn", color: "#A78BFA" },
  { key: "Instagram", color: "#A3E635" },
  { key: "Google Ads", color: "#FBBF24" },
  { key: "Facebook", color: "#60A5FA" },
  { key: "Website", color: "#34D399" },
  { key: "TikTok", color: "#FB7185" },
  { key: "Referral", color: "#F97316" },
  { key: "Other", color: "#94A3B8" },
];

function buildMockByMedia({ year, campus }) {
  const campusFactor =
    campus === "ALL" ? 1.0 : campus === "ASHDOD" ? 1.08 : 0.96;

  return mediaSources.map((m, idx) => {
    const seed = idx * 91 + year.length * 37 + campus.length * 53;

    const gross = Math.round(genRandomValue(seed + 11, 120, 520) * campusFactor);

    const qRate = 0.38 + seededRand(seed + 77) * 0.28;
    const qualified = Math.max(0, Math.round(gross * qRate));

    return { name: m.key, gross, qualified, color: m.color };
  });
}

/** ---------- Icons ---------- */
function MiniIcon({ children, className = "", size = "h-5 w-5" }) {
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
    <MiniIcon size="h-5 w-5" className="text-white/60">
      <path
        d="M8 3h6l4 4v14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path
        d="M14 3v5h5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path
        d="M9 12h6M9 16h6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        opacity="0.85"
      />
    </MiniIcon>
  );
}

function IcoCard() {
  return (
    <MiniIcon className="text-white/60" size="h-5 w-5">
      <path d="M12 3v9h9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path
        d="M21 12a9 9 0 1 1-9-9"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </MiniIcon>
  );
}

/** ---------- Tooltip ---------- */
function CustomTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;

  const p = payload[0]?.payload;
  const val = payload[0]?.value ?? 0;
  const pct = p?.__pct ?? null;

  return (
    <div className="rounded-xl border border-slate-700/40 bg-slate-950/90 p-3 text-slate-100 shadow-lg">
      <div className="mb-1 font-bold">{p?.name}</div>
      <div className="text-sm text-slate-200">
        כמות: <span className="font-semibold">{fmtInt(val)}</span>
      </div>
      {pct !== null && (
        <div className="text-sm text-slate-200">
          אחוז: <span className="font-semibold">{pct}%</span>
        </div>
      )}
    </div>
  );
}

function renderPieLabel({ x, y, percent }) {
  const p = Math.round((percent ?? 0) * 100);
  if (p <= 0) return null;

  return (
    <text
      x={x}
      y={y}
      fill="white"
      textAnchor="middle"
      dominantBaseline="central"
      fontSize={14}
      fontWeight={800}
      style={{ textShadow: "0 2px 10px rgba(0,0,0,0.45)" }}
    >
      {p}%
    </text>
  );
}

function CustomLegend({ payload }) {
  if (!payload?.length) return null;

  return (
    <div className="flex flex-wrap justify-center gap-4 pt-2 text-sm text-white/80">
      {payload.map((entry) => (
        <div key={entry.value} className="flex items-center gap-2">
          <span
            className="inline-block h-2.5 w-2.5 rounded-full"
            style={{ backgroundColor: entry.color }}
          />
          <span>{entry.value}</span>
        </div>
      ))}
    </div>
  );
}

/** ---------- Component ---------- */
export default function Report5() {
  const navigate = useNavigate();

  const [menuOpen, setMenuOpen] = useState(false);
  const [campus, setCampus] = useState("ALL");
  const [year, setYear] = useState("תשפ״ה");

  const [raw, setRaw] = useState([]);
  const [apiMode, setApiMode] = useState("mock");
  const [loading, setLoading] = useState(false);

  const campusLabel =
    campusOptions.find((c) => c.key === campus)?.label ?? "כל הקמפוסים";

  useEffect(() => {
    const token =
      localStorage.getItem("token") || sessionStorage.getItem("token");

    if (!token) {
      navigate("/login", { replace: true });
    }
  }, [navigate]);

  useEffect(() => {
    let cancelled = false;

    async function loadReport5() {
      setLoading(true);

      try {
        const qs = new URLSearchParams({
          campus,
          year,
        });

        const res = await fetch(`${API_BASE_URL}/api/report5/media?${qs.toString()}`);
        if (!res.ok) {
          throw new Error("API not ready");
        }

        const json = await res.json();
        if (!Array.isArray(json)) {
          throw new Error("Bad API shape");
        }

        const merged = mediaSources.map((source) => {
          const found = json.find((item) => item.name === source.key);
          return {
            name: source.key,
            gross: found?.gross ?? 0,
            qualified: found?.qualified ?? 0,
            color: source.color,
          };
        });

        if (!cancelled) {
          setRaw(merged);
          setApiMode("api");
        }
      } catch (error) {
        console.error("Report5 API error:", error);

        const mock = buildMockByMedia({ year, campus });

        if (!cancelled) {
          setRaw(mock);
          setApiMode("mock");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadReport5();

    return () => {
      cancelled = true;
    };
  }, [campus, year]);

  const grossData = useMemo(() => {
    const total = raw.reduce((s, r) => s + (r.gross ?? 0), 0);
    return raw.map((r) => ({
      name: r.name,
      value: r.gross,
      color: r.color,
      __pct: total ? Math.round((r.gross / total) * 100) : 0,
    }));
  }, [raw]);

  const qualifiedData = useMemo(() => {
    const total = raw.reduce((s, r) => s + (r.qualified ?? 0), 0);
    return raw.map((r) => ({
      name: r.name,
      value: r.qualified,
      color: r.color,
      __pct: total ? Math.round((r.qualified / total) * 100) : 0,
    }));
  }, [raw]);

  const totalGross = grossData.reduce((s, r) => s + (r.value ?? 0), 0);
  const totalQualified = qualifiedData.reduce((s, r) => s + (r.value ?? 0), 0);
  const qualifiedRate = totalGross
    ? ((totalQualified / totalGross) * 100).toFixed(1)
    : "0.0";

  return (
    <div dir="rtl" className="min-h-screen bg-[#2e3038] text-white">
      <TopNavbar />
      <Sidebar isOpen={menuOpen} onToggle={() => setMenuOpen((s) => !s)} />

      <div className="mx-auto max-w-6xl px-6 pt-28 pb-14">
        <div className="mt-6 text-center">
          <div className="inline-flex items-center justify-center gap-2">
            <IcoTitle />
            <h1 className="text-3xl font-extrabold tracking-tight">
              דוח 5 – ניתוח לידים ומדיה
            </h1>
          </div>

          <p className="mt-2 text-sm text-white/75">
            השוואת התפלגות לידים לפי מקור מדיה - סה״כ הלידים מול הלידים האיכותיים | שנה:{" "}
            <span className="font-semibold">{year}</span> | קמפוס:{" "}
            <span className="font-semibold">{campusLabel}</span>
            <span className="mx-2 font-semibold">
              {apiMode === "api" ? "API" : "MOCK"}
            </span>
            {loading ? <span className="mr-2">(טוען...)</span> : null}
          </p>
        </div>

        <div className="mt-5 text-center text-sm text-white/80">
          <span className="font-semibold">{qualifiedRate}%</span> יחס איכותיים •
          הלידים האיכותיים :{" "}
          <span className="font-semibold">{fmtInt(totalQualified)}</span> •
          סה״כ הלידים :{" "}
          <span className="font-semibold">{fmtInt(totalGross)}</span>
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

          <div className="text-xs text-white/60">
            {campusLabel} • {year}
          </div>
        </div>

        <div className="mt-8">
          <div className="rounded-[28px] bg-[#3b3e47] p-6 lg:p-7 shadow-[0_18px_55px_rgba(0,0,0,0.35)]">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <IcoCard />
                <div className="text-lg font-bold">התפלגות לידים לפי מקור מדיה</div>
              </div>
              <div className="text-xs text-white/60">
                2 תרשימי עוגה של לידים איכותיים מול סה״כ הלידים
              </div>
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <div className="rounded-2xl bg-[#2e3038] p-4 ring-1 ring-white/10">
                <div className="mb-3 text-center text-sm font-semibold text-white/90">
                  לידים איכותיים
                </div>

                <div className="rounded-2xl bg-white/6 p-2 ring-1 ring-white/5">
                  <ResponsiveContainer width="100%" height={440}>
                    <PieChart>
                      <Tooltip content={<CustomTooltip />} />
                      <Legend content={<CustomLegend />} />
                      <Pie
                        data={qualifiedData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="46%"
                        innerRadius={92}
                        outerRadius={155}
                        paddingAngle={2}
                        stroke="rgba(255,255,255,0.35)"
                        strokeWidth={1.5}
                        labelLine={false}
                        label={renderPieLabel}
                      >
                        {qualifiedData.map((e) => (
                          <Cell key={e.name} fill={e.color} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="rounded-2xl bg-[#2e3038] p-4 ring-1 ring-white/10">
                <div className="mb-3 text-center text-sm font-semibold text-white/90">
                  סה״כ לידים
                </div>

                <div className="rounded-2xl bg-white/6 p-2 ring-1 ring-white/5">
                  <ResponsiveContainer width="100%" height={440}>
                    <PieChart>
                      <Tooltip content={<CustomTooltip />} />
                      <Legend content={<CustomLegend />} />
                      <Pie
                        data={grossData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="46%"
                        innerRadius={92}
                        outerRadius={155}
                        paddingAngle={2}
                        stroke="rgba(255,255,255,0.35)"
                        strokeWidth={1.5}
                        labelLine={false}
                        label={renderPieLabel}
                      >
                        {grossData.map((e) => (
                          <Cell key={e.name} fill={e.color} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}