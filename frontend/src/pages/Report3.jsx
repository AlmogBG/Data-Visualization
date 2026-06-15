import React, {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
  CartesianGrid,
  Cell,
  Tooltip,
} from "recharts";

import Sidebar from "../components/Sidebar";
import ResidenceMap from "../components/ResidenceMap";
import TopNavbar from "../components/TopNavbar";

const API_BASE_URL =
  process.env.REACT_APP_API_BASE_URL ||
  "http://localhost:5001";

const campuses = [
  { key: "ALL", label: "כל הקמפוסים" },
  { key: "ASHDOD", label: "אשדוד" },
  { key: "BEER_SHEVA", label: "באר שבע" },
];

const areas = [
  { key: "ALL", label: "בחר הכל" },
  { key: "SOUTH", label: "דרום" },
  { key: "CENTER", label: "מרכז" },
  { key: "NORTH", label: "צפון" },
];

const fmtInt = (number) =>
  new Intl.NumberFormat("he-IL").format(
    Number(number) || 0
  );

function getStoredToken() {
  return (
    localStorage.getItem("token") ||
    sessionStorage.getItem("token")
  );
}

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

function redirectToLogin() {
  clearAuthenticationData();

  if (window.location.pathname !== "/login") {
    window.location.replace("/login");
  }
}

async function authenticatedFetch(path, options = {}) {
  const token = getStoredToken();

  if (!token) {
    redirectToLogin();

    throw new Error("נדרשת התחברות למערכת");
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

  if (response.status === 401) {
    redirectToLogin();

    throw new Error(
      "תוקף ההתחברות פג. יש להתחבר מחדש"
    );
  }

  return response;
}

function MiniIcon({
  children,
  className = "",
  size = "h-5 w-5",
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

function IcoTitle() {
  return (
    <MiniIcon
      size="h-8 w-8"
      className="text-white/65 shrink-0 translate-y-[2px]"
    >
      <path
        d="M12 21s7-4.6 7-11a7 7 0 1 0-14 0c0 6.4 7 11 7 11Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />

      <path
        d="M12 11.2a2.2 2.2 0 1 0 0-4.4 2.2 2.2 0 0 0 0 4.4Z"
        stroke="currentColor"
        strokeWidth="2"
      />
    </MiniIcon>
  );
}

function IcoChart() {
  return (
    <MiniIcon
      className="text-white/55"
      size="h-5 w-5"
    >
      <path
        d="M5 20V10M10 20V6M15 20v-8M20 20V4"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </MiniIcon>
  );
}

function IcoMap() {
  return (
    <MiniIcon
      className="text-white/55"
      size="h-5 w-5"
    >
      <path
        d="M9 6 3 8.5v11L9 17m0-11 6 2.5m-6-2.5v11m6-8.5 6-2.5v11L15 19m0-10.5V19"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
    </MiniIcon>
  );
}

function IcoFilter() {
  return (
    <MiniIcon
      className="text-white/55"
      size="h-4 w-4"
    >
      <path
        d="M4 6h16M7 12h10M10 18h4"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </MiniIcon>
  );
}

function CustomXAxisTick({
  x,
  y,
  payload,
}) {
  const text = payload?.value ?? "";
  const words = String(text).split(" ");
  const middle = Math.ceil(words.length / 2);

  const lines = [
    words.slice(0, middle).join(" "),
    words.slice(middle).join(" "),
  ].filter(Boolean);

  return (
    <g transform={`translate(${x},${y})`}>
      {lines.map((line, index) => (
        <text
          key={`${line}-${index}`}
          x={0}
          y={0}
          dy={16 + index * 14}
          textAnchor="middle"
          fill="rgba(255,255,255,0.82)"
          fontSize={12}
          fontWeight="600"
        >
          {line}
        </text>
      ))}
    </g>
  );
}

function SimpleCityTooltip({
  active,
  payload,
  label,
}) {
  if (!active || !payload?.length) {
    return null;
  }

  const value = payload[0]?.value ?? 0;

  return (
    <div className="rounded-2xl border border-[#2e63c7] bg-[#04112f]/95 px-4 py-3 text-white shadow-xl">
      <div className="mb-1 text-lg font-extrabold leading-none">
        {label}
      </div>

      <div className="text-base font-bold">
        נרשמים:{" "}
        <span>{fmtInt(value)}</span>
      </div>
    </div>
  );
}

function SeriesLegend({ primaryLabel }) {
  return (
    <div className="mt-5 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-sm text-white/90">
      <div className="flex items-center gap-2">
        <span className="inline-block h-3 w-3 rounded-full bg-[#60a5fa]" />

        <span className="font-semibold">
          {primaryLabel}
        </span>
      </div>
    </div>
  );
}

export default function Report3() {
  const [menuOpen, setMenuOpen] =
    useState(false);

  const [campus, setCampus] =
    useState("ALL");

  const [department, setDepartment] =
    useState("ALL");

  const [area, setArea] =
    useState("ALL");

  const [topN, setTopN] =
    useState(10);

  const [departments, setDepartments] =
    useState([]);

  const [data, setData] =
    useState([]);

  const [loading, setLoading] =
    useState(false);

  const [
    optionsLoading,
    setOptionsLoading,
  ] = useState(false);

  const [
    errorMessage,
    setErrorMessage,
  ] = useState("");

  const [activeTown, setActiveTown] =
    useState(null);

  const [hoveredTown, setHoveredTown] =
    useState(null);

  /*
   * טעינת רשימת המחלקות.
   * הבקשה שולחת JWT.
   */
  useEffect(() => {
    let cancelled = false;

    async function loadOptions() {
      try {
        setOptionsLoading(true);

        const response =
          await authenticatedFetch(
            "/api/form/options"
          );

        let json = null;

        try {
          json = await response.json();
        } catch {
          json = null;
        }

        if (!response.ok) {
          throw new Error(
            json?.message ||
              "שגיאה בטעינת אפשרויות הסינון"
          );
        }

        const departmentRows =
          Array.isArray(json?.departments)
            ? json.departments
            : [];

        if (!cancelled) {
          setDepartments(departmentRows);
        }
      } catch (error) {
        console.error(
          "Report3 options load error:",
          error
        );

        if (!cancelled) {
          setDepartments([]);
        }
      } finally {
        if (!cancelled) {
          setOptionsLoading(false);
        }
      }
    }

    loadOptions();

    return () => {
      cancelled = true;
    };
  }, []);

  /*
   * טעינת נתוני הערים לפי הסינון שנבחר.
   * הבקשה שולחת JWT.
   */
  useEffect(() => {
    let cancelled = false;

    async function loadCities() {
      try {
        setLoading(true);
        setErrorMessage("");

        const params = new URLSearchParams();

        params.set("campus", campus);
        params.set("department", department);
        params.set("area", area);

        const response =
          await authenticatedFetch(
            `/api/stats/cities?${params.toString()}`
          );

        let json = null;

        try {
          json = await response.json();
        } catch {
          json = null;
        }

        if (!response.ok) {
          throw new Error(
            json?.message ||
              "שגיאה בטעינת נתוני דוח 3"
          );
        }

        if (!Array.isArray(json)) {
          throw new Error(
            "מבנה הנתונים שהתקבל מהשרת אינו תקין"
          );
        }

        if (!cancelled) {
          setData(json);
        }
      } catch (error) {
        console.error(
          "Report3 load error:",
          error
        );

        if (!cancelled) {
          setData([]);

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

    loadCities();

    return () => {
      cancelled = true;
    };
  }, [campus, department, area]);

  const visibleRows = useMemo(() => {
    return [...data]
      .sort(
        (first, second) =>
          (Number(second.count) || 0) -
          (Number(first.count) || 0)
      )
      .slice(0, topN);
  }, [data, topN]);

  useEffect(() => {
    const activeTownExists =
      visibleRows.some(
        (row) => row.town === activeTown
      );

    if (!activeTownExists) {
      setActiveTown(
        visibleRows[0]?.town ?? null
      );
    }
  }, [visibleRows, activeTown]);

  const chartData = useMemo(() => {
    return visibleRows.map((row) => ({
      town: row.town,
      selectedValue:
        Number(row.count) || 0,
      region: row.region,
    }));
  }, [visibleRows]);

  const campusLabel =
    campuses.find(
      (item) => item.key === campus
    )?.label ?? "כל הקמפוסים";

  const areaLabel =
    areas.find(
      (item) => item.key === area
    )?.label ?? "בחר הכל";

  const departmentLabel =
    department === "ALL"
      ? "כל המחלקות"
      : department;

  const primarySeriesLabel =
    `נרשמים • ${campusLabel} • ` +
    `${departmentLabel} • ${areaLabel}`;

  const hasData = chartData.length > 0;

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
            (previous) => !previous
          )
        }
      />

      <div className="mx-auto max-w-7xl px-6 pt-28 pb-14">
        <div className="mt-6 text-center">
          <div className="inline-flex items-center justify-center gap-3 align-middle">
            <IcoTitle />

            <h1 className="text-3xl font-extrabold tracking-tight leading-none">
              דוח 3 - מפת מגורי נרשמים מול
              גרף יישובים
            </h1>
          </div>

          <p className="mt-2 text-sm text-white/75">
            המפה והגרף נשענים על נתונים
            מה־Backend בלבד

            {loading ? (
              <span className="mr-2 text-white/60">
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
                setCampus(event.target.value)
              }
            >
              {campuses.map((item) => (
                <option
                  key={item.key}
                  value={item.key}
                >
                  {item.label}
                </option>
              ))}
            </select>

            <div className="text-sm text-white/80">
              מחלקה
            </div>

            <select
              className="rounded-xl bg-white/10 px-3 py-2 text-sm ring-1 ring-white/10 focus:outline-none"
              value={department}
              onChange={(event) =>
                setDepartment(
                  event.target.value
                )
              }
              disabled={optionsLoading}
            >
              <option value="ALL">
                כל המחלקות
              </option>

              {departments.map((item) => (
                <option
                  key={item.id}
                  value={item.name}
                >
                  {item.name}
                </option>
              ))}
            </select>

            <div className="text-sm text-white/80">
              אזור
            </div>

            <select
              className="rounded-xl bg-white/10 px-3 py-2 text-sm ring-1 ring-white/10 focus:outline-none"
              value={area}
              onChange={(event) =>
                setArea(event.target.value)
              }
            >
              {areas.map((item) => (
                <option
                  key={item.key}
                  value={item.key}
                >
                  {item.label}
                </option>
              ))}
            </select>

            <div className="text-sm text-white/80">
              הצג
            </div>

            <select
              className="rounded-xl bg-white/10 px-3 py-2 text-sm ring-1 ring-white/10 focus:outline-none"
              value={topN}
              onChange={(event) =>
                setTopN(
                  Number(event.target.value)
                )
              }
            >
              <option value={5}>
                5 הערים הבולטות
              </option>

              <option value={10}>
                10 הערים הבולטות
              </option>

              <option value={15}>
                15 הערים הבולטות
              </option>
            </select>
          </div>

          <div className="inline-flex items-center gap-2 text-xs text-white/60">
            <IcoFilter />

            <span>
              {campusLabel} •{" "}
              {departmentLabel} •{" "}
              {areaLabel}
            </span>
          </div>
        </div>

        {errorMessage ? (
          <div className="mt-8 rounded-2xl border border-rose-300/20 bg-rose-500/10 p-5 text-center text-sm text-rose-100">
            {errorMessage}
          </div>
        ) : null}

        {!loading &&
        !errorMessage &&
        !hasData ? (
          <div className="mt-8 rounded-2xl border border-white/10 bg-white/5 p-5 text-center text-sm text-white/75">
            אין נתונים להצגה עבור הסינון
            שנבחר.
          </div>
        ) : null}

        {hasData ? (
          <div className="mt-8 grid grid-cols-1 gap-6 xl:grid-cols-2">
            <div className="rounded-[28px] bg-[#3b3e47] p-6 shadow-[0_18px_55px_rgba(0,0,0,0.35)]">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <IcoChart />

                  <div className="text-lg font-bold">
                    נרשמים לפי עיר
                  </div>
                </div>

                <div className="text-xs text-white/60">
                  גרף עם סדרה אחת
                </div>
              </div>

              <div className="rounded-[24px] bg-[#2f3340] px-4 pt-5 pb-4 ring-1 ring-white/10">
                <ResponsiveContainer
                  width="100%"
                  height={560}
                >
                  <BarChart
                    data={chartData}
                    margin={{
                      top: 22,
                      right: 18,
                      left: 22,
                      bottom: 34,
                    }}
                    barCategoryGap="22%"
                    barGap={12}
                    onMouseMove={(state) => {
                      setHoveredTown(
                        state?.activeLabel || null
                      );
                    }}
                    onMouseLeave={() => {
                      setHoveredTown(null);
                    }}
                    onClick={(state) => {
                      const clickedTown =
                        state?.activeLabel;

                      if (clickedTown) {
                        setActiveTown(
                          clickedTown
                        );
                      }
                    }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="rgba(255,255,255,0.07)"
                    />

                    <XAxis
                      dataKey="town"
                      interval={0}
                      height={74}
                      tick={
                        <CustomXAxisTick />
                      }
                      tickLine={false}
                      axisLine={{
                        stroke:
                          "rgba(255,255,255,0.16)",
                      }}
                    />

                    <YAxis
                      width={8}
                      tick={{
                        fill:
                          "rgba(255,255,255,0.72)",
                        fontSize: 12,
                      }}
                      tickMargin={10}
                      tickLine={false}
                      axisLine={false}
                    />

                    <Tooltip
                      content={
                        <SimpleCityTooltip />
                      }
                      cursor={false}
                    />

                    <Bar
                      dataKey="selectedValue"
                      name={primarySeriesLabel}
                      radius={[8, 8, 0, 0]}
                      barSize={22}
                    >
                      {chartData.map(
                        (entry) => {
                          const isHovered =
                            entry.town ===
                            hoveredTown;

                          const isActive =
                            entry.town ===
                            activeTown;

                          let fill =
                            "rgba(96,165,250,0.90)";

                          if (isHovered) {
                            fill = "#8fc1ff";
                          } else if (
                            isActive
                          ) {
                            fill = "#b7d7ff";
                          }

                          return (
                            <Cell
                              key={entry.town}
                              fill={fill}
                            />
                          );
                        }
                      )}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>

                <SeriesLegend
                  primaryLabel={
                    primarySeriesLabel
                  }
                />
              </div>
            </div>

            <div className="rounded-[28px] bg-[#3b3e47] p-6 shadow-[0_18px_55px_rgba(0,0,0,0.35)]">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <IcoMap />

                  <div className="text-lg font-bold">
                    מפת מגורי נרשמים
                  </div>
                </div>

                <div className="text-xs text-white/60">
                  {visibleRows.length} יישובים
                  מוצגים
                </div>
              </div>

              <div className="rounded-2xl bg-white/5 p-4 ring-1 ring-white/5 backdrop-blur-sm">
                <ResidenceMap
                  points={visibleRows}
                  activeTown={activeTown}
                  onSelectTown={
                    setActiveTown
                  }
                />
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}