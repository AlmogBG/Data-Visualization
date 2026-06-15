import React, {
  useEffect,
  useMemo,
  useState,
} from "react";

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
  process.env.REACT_APP_API_BASE_URL ||
  "http://localhost:5001";

const campusOptions = [
  {
    key: "BOTH",
    label: "שני הקמפוסים",
  },
  {
    key: "ASHDOD",
    label: "אשדוד",
  },
  {
    key: "BEER_SHEVA",
    label: "באר שבע",
  },
];

const years = [
  "תשפ״ה",
  "תשפ״ד",
  "תשפ״ג",
  "תשפ״ב",
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

const OUTCOME_COLORS = [
  "#93c5fd",
  "#fcd34d",
  "#fb7185",
  "#86efac",
  "#a7f3d0",
  "#cbd5e1",
];

const fmtInt = (number) =>
  new Intl.NumberFormat("he-IL").format(
    Number(number) || 0
  );

/*
 * מחזיר את טוקן ההתחברות שנשמר בדפדפן.
 */
function getStoredToken() {
  return (
    localStorage.getItem("token") ||
    sessionStorage.getItem("token")
  );
}

/*
 * מוחק את נתוני ההתחברות השמורים.
 */
function clearAuthenticationData() {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  localStorage.removeItem("loggedInUsername");
  localStorage.removeItem("loggedInEmail");
  localStorage.removeItem("loggedInRole");

  sessionStorage.removeItem("token");
  sessionStorage.removeItem("user");
  sessionStorage.removeItem("loggedInUsername");
  sessionStorage.removeItem("loggedInEmail");
  sessionStorage.removeItem("loggedInRole");
}

/*
 * מחזיר את המשתמש למסך ההתחברות.
 */
function redirectToLogin() {
  clearAuthenticationData();

  if (window.location.pathname !== "/login") {
    window.location.replace("/login");
  }
}

/*
 * שולח בקשת API עם JWT בכותרת Authorization.
 */
async function authenticatedFetch(
  path,
  options = {}
) {
  const token = getStoredToken();

  if (!token) {
    redirectToLogin();

    throw new Error(
      "נדרשת התחברות למערכת"
    );
  }

  const response = await fetch(
    `${API_BASE_URL}${path}`,
    {
      ...options,
      headers: {
        ...(options.headers || {}),
        Authorization: `Bearer ${token}`,
      },
    }
  );

  /*
   * אם הטוקן חסר, שגוי או שפג תוקפו,
   * השרת מחזיר 401.
   */
  if (response.status === 401) {
    redirectToLogin();

    throw new Error(
      "תוקף ההתחברות פג. יש להתחבר מחדש"
    );
  }

  return response;
}

function getMonthsLabel(selectedMonths) {
  if (selectedMonths.includes("ALL")) {
    return "כל החודשים";
  }

  const monthMap = new Map(
    months.map((month) => [
      month.key,
      month.label,
    ])
  );

  return selectedMonths
    .map((key) => monthMap.get(key))
    .filter(Boolean)
    .join(", ");
}

function CustomTooltip({
  active,
  payload,
  label,
  mode,
}) {
  if (!active || !payload?.length) {
    return null;
  }

  const ashdod =
    payload.find((item) =>
      item.dataKey?.includes("Ashdod")
    )?.value ?? null;

  const beer =
    payload.find((item) =>
      item.dataKey?.includes("Beer")
    )?.value ?? null;

  return (
    <div className="rounded-xl border border-slate-700/40 bg-slate-950/90 p-3 text-slate-100 shadow-lg">
      <div className="mb-1 font-bold">
        {label}
      </div>

      <div className="text-sm text-slate-200">
        {mode === "invited"
          ? "נרשמו/הוזמנו"
          : "הגיעו בפועל"}
      </div>

      {ashdod !== null ? (
        <div className="mt-1 text-sm text-slate-200">
          אשדוד:{" "}
          <span className="font-semibold">
            {fmtInt(ashdod)}
          </span>
        </div>
      ) : null}

      {beer !== null ? (
        <div className="text-sm text-slate-200">
          באר שבע:{" "}
          <span className="font-semibold">
            {fmtInt(beer)}
          </span>
        </div>
      ) : null}
    </div>
  );
}

function SubtleCursor({
  x,
  y,
  width,
  height,
}) {
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

function MiniIcon({
  children,
  className = "",
  size = "h-6 w-6",
}) {
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

function IcoReportTitle() {
  return (
    <MiniIcon
      size="h-10 w-10"
      className="text-white/60 align-middle -translate-y-[1px]"
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

function IcoPie() {
  return (
    <MiniIcon
      size="h-5 w-5"
      className="text-white/55"
    >
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

function PieTooltip({
  active,
  payload,
  label,
}) {
  if (!active || !payload?.length) {
    return null;
  }

  const item = payload[0];

  const total =
    item?.payload?.__total ?? null;

  return (
    <div className="rounded-xl border border-slate-700/40 bg-slate-950/90 p-3 text-slate-100 shadow-lg">
      <div className="mb-1 font-bold">
        {label ?? item?.name}
      </div>

      <div className="text-sm text-slate-200">
        כמות:{" "}
        <span className="font-semibold">
          {fmtInt(item?.value ?? 0)}
        </span>
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
      {items.map((item, index) => (
        <div
          key={item.key || item.name}
          className="flex items-center gap-2"
        >
          <span
            className="inline-block h-2.5 w-2.5 rounded-full"
            style={{
              background:
                OUTCOME_COLORS[
                  index %
                    OUTCOME_COLORS.length
                ],
            }}
          />

          <span>{item.name}</span>
        </div>
      ))}
    </div>
  );
}

function renderPieLabel({
  cx,
  cy,
  midAngle,
  innerRadius,
  outerRadius,
  percent,
  value,
}) {
  if (!percent || percent < 0.04) {
    return null;
  }

  const RADIAN = Math.PI / 180;

  const radius =
    innerRadius +
    (outerRadius - innerRadius) * 0.6;

  const x =
    cx +
    radius *
      Math.cos(-midAngle * RADIAN);

  const y =
    cy +
    radius *
      Math.sin(-midAngle * RADIAN);

  const percentage = Math.round(
    percent * 100
  );

  return (
    <text
      x={x}
      y={y}
      fill="rgba(255, 255, 255, 1)"
      textAnchor="middle"
      dominantBaseline="central"
      fontSize={12}
      fontWeight={800}
      style={{
        pointerEvents: "none",
      }}
    >
      {percentage}% , {fmtInt(value)}
    </text>
  );
}

function PieCard({ title, data }) {
  const safeData = Array.isArray(data)
    ? data
    : [];

  const total = safeData.reduce(
    (sum, item) =>
      sum + (Number(item.value) || 0),
    0
  );

  const dataWithTotal = safeData.map(
    (item) => ({
      ...item,
      __total: total,
    })
  );

  return (
    <div className="rounded-2xl bg-[#2e3038] p-4 ring-1 ring-white/10">
      <div className="mb-3 flex items-center justify-between gap-2">
        <div className="text-sm font-semibold text-white/90">
          {title}
        </div>

        <div className="text-xs text-white/60">
          סה"כ: {fmtInt(total)}
        </div>
      </div>

      {total > 0 ? (
        <>
          <div className="rounded-2xl bg-white/6 p-3 ring-1 ring-white/5">
            <ResponsiveContainer
              width="100%"
              height={260}
            >
              <PieChart>
                <Tooltip
                  content={<PieTooltip />}
                />

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
                  {dataWithTotal.map(
                    (entry, index) => (
                      <Cell
                        key={
                          entry.key ||
                          entry.name
                        }
                        fill={
                          OUTCOME_COLORS[
                            index %
                              OUTCOME_COLORS.length
                          ]
                        }
                      />
                    )
                  )}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>

          <PieLegend items={safeData} />
        </>
      ) : (
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-center text-sm text-white/70">
          אין נתוני תוצאות להצגה.
        </div>
      )}
    </div>
  );
}

export default function Report4() {
  const navigate = useNavigate();

  const [menuOpen, setMenuOpen] =
    useState(false);

  const [campus, setCampus] =
    useState("BOTH");

  const [year, setYear] =
    useState("תשפ״ה");

  const [
    selectedMonths,
    setSelectedMonths,
  ] = useState(["ALL"]);

  const [data, setData] =
    useState([]);

  const [pieAshdod, setPieAshdod] =
    useState([]);

  const [pieBeer, setPieBeer] =
    useState([]);

  const [loading, setLoading] =
    useState(false);

  const [
    errorMessage,
    setErrorMessage,
  ] = useState("");

  const monthsLabel = useMemo(
    () => getMonthsLabel(selectedMonths),
    [selectedMonths]
  );

  /*
   * בדיקה ראשונית שקיים טוקן בדפדפן.
   */
  useEffect(() => {
    const token = getStoredToken();

    if (!token) {
      navigate("/login", {
        replace: true,
      });
    }
  }, [navigate]);

  /*
   * טעינת שני חלקי דוח 4.
   */
  useEffect(() => {
    let cancelled = false;

    async function loadReport4() {
      try {
        setLoading(true);
        setErrorMessage("");

        const monthsParam =
          selectedMonths.includes("ALL")
            ? "ALL"
            : [...selectedMonths]
                .filter(
                  (item) => item !== "ALL"
                )
                .sort(
                  (first, second) =>
                    Number(first) -
                    Number(second)
                )
                .join(",");

        const queryString =
          new URLSearchParams({
            campus,
            year,
            months: monthsParam,
          });

        /*
         * שתי הבקשות שולחות JWT.
         */
        const [
          monthlyResponse,
          outcomesResponse,
        ] = await Promise.all([
          authenticatedFetch(
            `/api/report4/monthly?${queryString.toString()}`
          ),

          authenticatedFetch(
            `/api/report4/outcomes?${queryString.toString()}`
          ),
        ]);

        let monthlyJson = null;
        let outcomesJson = null;

        try {
          monthlyJson =
            await monthlyResponse.json();
        } catch {
          monthlyJson = null;
        }

        try {
          outcomesJson =
            await outcomesResponse.json();
        } catch {
          outcomesJson = null;
        }

        if (!monthlyResponse.ok) {
          throw new Error(
            monthlyJson?.message ||
              "שגיאה בטעינת נתוני דוח 4"
          );
        }

        if (!outcomesResponse.ok) {
          throw new Error(
            outcomesJson?.message ||
              "שגיאה בטעינת תוצאות דוח 4"
          );
        }

        if (!Array.isArray(monthlyJson)) {
          throw new Error(
            "מבנה הנתונים החודשי שהתקבל מהשרת אינו תקין"
          );
        }

        if (!cancelled) {
          setData(monthlyJson);

          setPieAshdod(
            outcomesJson?.ASHDOD?.items ||
              []
          );

          setPieBeer(
            outcomesJson?.BEER_SHEVA
              ?.items || []
          );
        }
      } catch (error) {
        console.error(
          "Report4 load error:",
          error
        );

        if (!cancelled) {
          setData([]);
          setPieAshdod([]);
          setPieBeer([]);

          setErrorMessage(
            error.message ||
              "לא ניתן לטעון את נתוני הדוח כרגע"
          );
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

  function toggleMonth(monthKey) {
    if (monthKey === "ALL") {
      setSelectedMonths(["ALL"]);
      return;
    }

    setSelectedMonths(
      (previousMonths) => {
        const cleanMonths =
          previousMonths.includes("ALL")
            ? []
            : previousMonths;

        if (
          cleanMonths.includes(monthKey)
        ) {
          const nextMonths =
            cleanMonths.filter(
              (item) =>
                item !== monthKey
            );

          return nextMonths.length === 0
            ? ["ALL"]
            : nextMonths;
        }

        return [
          ...cleanMonths,
          monthKey,
        ].sort(
          (first, second) =>
            Number(first) -
            Number(second)
        );
      }
    );
  }

  const campusLabel =
    campusOptions.find(
      (item) => item.key === campus
    )?.label ?? "שני הקמפוסים";

  const hasMonthlyData =
    data.length > 0;

  const showAshdodPie =
    campus === "BOTH" ||
    campus === "ASHDOD";

  const showBeerPie =
    campus === "BOTH" ||
    campus === "BEER_SHEVA";

  return (
    <div
      dir="rtl"
      className="min-h-screen bg-[#2e3038] text-white"
    >
      <TopNavbar />

      <Sidebar
        isOpen={menuOpen}
        onToggle={() =>
          setMenuOpen(
            (current) => !current
          )
        }
      />

      <div className="mx-auto max-w-6xl px-6 pt-28 pb-14">
        <div className="mt-6 text-center">
          <div className="inline-flex items-center gap-3">
            <IcoReportTitle />

            <h1 className="text-3xl font-extrabold tracking-tight">
              דוח 4 – ניתוח הגעה למפגשי
              ייעוץ
            </h1>
          </div>

          <p className="mt-2 text-sm text-white/75">
            השוואה לפי חודשים בין קמפוסים
            | שנה:{" "}
            <span className="font-semibold">
              {year}
            </span>{" "}
            | חודשים:{" "}
            <span className="font-semibold">
              {monthsLabel}
            </span>{" "}
            | קמפוס:{" "}
            <span className="font-semibold">
              {campusLabel}
            </span>

            {loading ? (
              <span className="mr-2">
                (טוען...)
              </span>
            ) : null}
          </p>
        </div>

        <div className="mt-6 flex flex-col items-center justify-between gap-4 lg:flex-row">
          <div className="flex flex-wrap items-center gap-3">
            <div className="text-sm text-white/80">
              קמפוס
            </div>

            <select
              className="rounded-xl bg-white/10 px-3 py-2 text-sm ring-1 ring-white/10 focus:outline-none"
              value={campus}
              onChange={(event) =>
                setCampus(
                  event.target.value
                )
              }
            >
              {campusOptions.map(
                (item) => (
                  <option
                    key={item.key}
                    value={item.key}
                  >
                    {item.label}
                  </option>
                )
              )}
            </select>

            <div className="text-sm text-white/80">
              שנה
            </div>

            <select
              className="rounded-xl bg-white/10 px-3 py-2 text-sm ring-1 ring-white/10 focus:outline-none"
              value={year}
              onChange={(event) =>
                setYear(event.target.value)
              }
            >
              {years.map((item) => (
                <option
                  key={item}
                  value={item}
                >
                  {item}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-wrap justify-center gap-2">
            {months.map((month) => {
              const active =
                selectedMonths.includes(
                  month.key
                );

              return (
                <button
                  key={month.key}
                  type="button"
                  onClick={() =>
                    toggleMonth(month.key)
                  }
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

        {!loading &&
        !errorMessage &&
        !hasMonthlyData ? (
          <div className="mt-8 rounded-2xl border border-white/10 bg-white/5 p-5 text-center text-sm text-white/75">
            אין נתונים להצגה עבור הסינון
            שנבחר.
          </div>
        ) : null}

        {hasMonthlyData ? (
          <div className="mt-8">
            <div className="rounded-[28px] bg-[#3b3e47] p-6 shadow-[0_18px_55px_rgba(0,0,0,0.35)]">
              <div className="mb-4 flex items-center justify-between">
                <div className="text-lg font-bold">
                  דוח רביעי
                </div>

                <div className="text-xs text-white/60">
                  נתונים מה־Backend בלבד •
                  קווים + עמודות • לפי חודש
                </div>
              </div>

              <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                <div className="rounded-2xl bg-[#2e3038] p-4 ring-1 ring-white/10">
                  <div className="mb-2 text-sm font-semibold text-white/90">
                    נרשמו/הוזמנו לפגישת
                    ייעוץ לפי חודש
                  </div>

                  <div className="rounded-2xl bg-white/6 p-3 ring-1 ring-white/5">
                    <ResponsiveContainer
                      width="100%"
                      height={260}
                    >
                      <LineChart
                        data={data}
                        margin={{
                          top: 10,
                          right: 14,
                          left: 8,
                          bottom: 6,
                        }}
                      >
                        <CartesianGrid
                          strokeDasharray="3 6"
                          stroke="rgba(255,255,255,0.06)"
                        />

                        <XAxis
                          dataKey="label"
                          tick={{
                            fill:
                              "rgba(255,255,255,0.75)",
                            fontSize: 12,
                          }}
                          tickLine={false}
                          axisLine={{
                            stroke:
                              "rgba(255,255,255,0.18)",
                          }}
                        />

                        <YAxis
                          tick={{
                            fill:
                              "rgba(255,255,255,0.70)",
                            fontSize: 12,
                          }}
                          tickLine={false}
                          axisLine={false}
                        />

                        <Tooltip
                          content={
                            <CustomTooltip
                              mode="invited"
                            />
                          }
                          cursor={
                            <SubtleCursor />
                          }
                        />

                        <Legend
                          wrapperStyle={{
                            color:
                              "rgba(255,255,255,0.70)",
                          }}
                        />

                        <Line
                          type="monotone"
                          dataKey="invitedAshdod"
                          name="אשדוד"
                          stroke="rgba(96,165,250,0.95)"
                          strokeWidth={3}
                          dot={{
                            r: 4,
                            strokeWidth: 2,
                            fill: "#e5f0ff",
                          }}
                          connectNulls
                        />

                        <Line
                          type="monotone"
                          dataKey="invitedBeer"
                          name="באר שבע"
                          stroke="rgba(148,163,184,0.85)"
                          strokeWidth={3}
                          dot={{
                            r: 4,
                            strokeWidth: 2,
                            fill: "#ffffff",
                          }}
                          connectNulls
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="rounded-2xl bg-[#2e3038] p-4 ring-1 ring-white/10">
                  <div className="mb-2 text-sm font-semibold text-white/90">
                    הגיעו לפגישת ייעוץ לפי
                    חודש
                  </div>

                  <div className="rounded-2xl bg-white/6 p-3 ring-1 ring-white/5">
                    <ResponsiveContainer
                      width="100%"
                      height={260}
                    >
                      <LineChart
                        data={data}
                        margin={{
                          top: 10,
                          right: 14,
                          left: 8,
                          bottom: 6,
                        }}
                      >
                        <CartesianGrid
                          strokeDasharray="3 6"
                          stroke="rgba(255,255,255,0.06)"
                        />

                        <XAxis
                          dataKey="label"
                          tick={{
                            fill:
                              "rgba(255,255,255,0.75)",
                            fontSize: 12,
                          }}
                          tickLine={false}
                          axisLine={{
                            stroke:
                              "rgba(255,255,255,0.18)",
                          }}
                        />

                        <YAxis
                          tick={{
                            fill:
                              "rgba(255,255,255,0.70)",
                            fontSize: 12,
                          }}
                          tickLine={false}
                          axisLine={false}
                        />

                        <Tooltip
                          content={
                            <CustomTooltip
                              mode="attended"
                            />
                          }
                          cursor={
                            <SubtleCursor />
                          }
                        />

                        <Legend
                          wrapperStyle={{
                            color:
                              "rgba(255,255,255,0.70)",
                          }}
                        />

                        <Line
                          type="monotone"
                          dataKey="attendedAshdod"
                          name="אשדוד"
                          stroke="rgba(96,165,250,0.95)"
                          strokeWidth={3}
                          dot={{
                            r: 4,
                            strokeWidth: 2,
                            fill: "#e5f0ff",
                          }}
                          connectNulls
                        />

                        <Line
                          type="monotone"
                          dataKey="attendedBeer"
                          name="באר שבע"
                          stroke="rgba(148,163,184,0.85)"
                          strokeWidth={3}
                          dot={{
                            r: 4,
                            strokeWidth: 2,
                            fill: "#ffffff",
                          }}
                          connectNulls
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="rounded-2xl bg-[#2e3038] p-4 ring-1 ring-white/10">
                  <div className="mb-2 text-sm font-semibold text-white/90">
                    עמודות – נרשמו/הוזמנו
                    לפי חודש
                  </div>

                  <div className="rounded-2xl bg-white/6 p-3 ring-1 ring-white/5">
                    <ResponsiveContainer
                      width="100%"
                      height={260}
                    >
                      <BarChart
                        data={data}
                        margin={{
                          top: 10,
                          right: 14,
                          left: 8,
                          bottom: 6,
                        }}
                        barCategoryGap="18%"
                        barGap={6}
                      >
                        <CartesianGrid
                          strokeDasharray="3 6"
                          stroke="rgba(255,255,255,0.06)"
                        />

                        <XAxis
                          dataKey="label"
                          tick={{
                            fill:
                              "rgba(255,255,255,0.75)",
                            fontSize: 12,
                          }}
                          tickLine={false}
                          axisLine={{
                            stroke:
                              "rgba(255,255,255,0.18)",
                          }}
                        />

                        <YAxis
                          tick={{
                            fill:
                              "rgba(255,255,255,0.70)",
                            fontSize: 12,
                          }}
                          tickLine={false}
                          axisLine={false}
                        />

                        <Tooltip
                          content={
                            <CustomTooltip
                              mode="invited"
                            />
                          }
                          cursor={
                            <SubtleCursor />
                          }
                        />

                        <Legend
                          wrapperStyle={{
                            color:
                              "rgba(255,255,255,0.70)",
                          }}
                        />

                        <Bar
                          dataKey="invitedAshdod"
                          name="אשדוד"
                          fill="rgba(96,165,250,0.85)"
                          radius={[
                            8,
                            8,
                            0,
                            0,
                          ]}
                          barSize={22}
                        />

                        <Bar
                          dataKey="invitedBeer"
                          name="באר שבע"
                          fill="rgba(148,163,184,0.55)"
                          radius={[
                            8,
                            8,
                            0,
                            0,
                          ]}
                          barSize={22}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="rounded-2xl bg-[#2e3038] p-4 ring-1 ring-white/10">
                  <div className="mb-2 text-sm font-semibold text-white/90">
                    עמודות – הגיעו בפועל לפי
                    חודש
                  </div>

                  <div className="rounded-2xl bg-white/6 p-3 ring-1 ring-white/5">
                    <ResponsiveContainer
                      width="100%"
                      height={260}
                    >
                      <BarChart
                        data={data}
                        margin={{
                          top: 10,
                          right: 14,
                          left: 8,
                          bottom: 6,
                        }}
                        barCategoryGap="18%"
                        barGap={6}
                      >
                        <CartesianGrid
                          strokeDasharray="3 6"
                          stroke="rgba(255,255,255,0.06)"
                        />

                        <XAxis
                          dataKey="label"
                          tick={{
                            fill:
                              "rgba(255,255,255,0.75)",
                            fontSize: 12,
                          }}
                          tickLine={false}
                          axisLine={{
                            stroke:
                              "rgba(255,255,255,0.18)",
                          }}
                        />

                        <YAxis
                          tick={{
                            fill:
                              "rgba(255,255,255,0.70)",
                            fontSize: 12,
                          }}
                          tickLine={false}
                          axisLine={false}
                        />

                        <Tooltip
                          content={
                            <CustomTooltip
                              mode="attended"
                            />
                          }
                          cursor={
                            <SubtleCursor />
                          }
                        />

                        <Legend
                          wrapperStyle={{
                            color:
                              "rgba(255,255,255,0.70)",
                          }}
                        />

                        <Bar
                          dataKey="attendedAshdod"
                          name="אשדוד"
                          fill="rgba(96,165,250,0.85)"
                          radius={[
                            8,
                            8,
                            0,
                            0,
                          ]}
                          barSize={22}
                        />

                        <Bar
                          dataKey="attendedBeer"
                          name="באר שבע"
                          fill="rgba(148,163,184,0.55)"
                          radius={[
                            8,
                            8,
                            0,
                            0,
                          ]}
                          barSize={22}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              <div className="mt-8 rounded-2xl bg-[#2e3038] p-5 ring-1 ring-white/10">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <IcoPie />

                    <div className="text-lg font-bold">
                      ניתוח פגישות: תוצאות
                    </div>
                  </div>

                  <div className="text-xs text-white/60">
                    תוצאות פגישות ייעוץ •
                    חלוקה לפי סטטוס
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                  {showAshdodPie ? (
                    <PieCard
                      title="תוצאות פ.הייעוץ – קמפוס אשדוד"
                      data={pieAshdod}
                    />
                  ) : null}

                  {showBeerPie ? (
                    <PieCard
                      title="תוצאות פ.הייעוץ – קמפוס באר שבע"
                      data={pieBeer}
                    />
                  ) : null}
                </div>

                <div className="mt-4 text-xs text-white/60">
                  המטרה: לזהות צווארי בקבוק
                  בתהליך הייעוץ ולשפר את איכות
                  הסינון והטיפול.
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}