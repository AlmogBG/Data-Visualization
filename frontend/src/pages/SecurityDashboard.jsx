import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from "recharts";

import {
  Activity,
  AlertTriangle,
  Ban,
  LogIn,
  Network,
  RefreshCw,
  ShieldCheck,
  UserX,
} from "lucide-react";

import TopNavbar from "../components/TopNavbar";

const API_BASE_URL =
  process.env.REACT_APP_API_BASE_URL ||
  "http://localhost:5001";

const eventLabels = {
  LOGIN_SUCCESS: "התחברות מוצלחת",
  LOGIN_FAILED: "התחברות נכשלה",
  LOGIN_RATE_LIMITED:
    "חסימת ניסיונות התחברות",
  AUTHENTICATION_REQUIRED:
    "גישה ללא התחברות",
  AUTHORIZATION_DENIED:
    "גישה ללא הרשאה",
  TOKEN_INVALID: "טוקן לא תקין",
  TOKEN_EXPIRED: "תוקף טוקן פג",
  SERVER_SECURITY_ERROR:
    "שגיאת אבטחה בשרת",
  UNKNOWN: "אירוע לא מזוהה",
};

function getStoredToken() {
  return (
    localStorage.getItem("token") ||
    sessionStorage.getItem("token")
  );
}

function clearAuthenticationData() {
  localStorage.removeItem("token");
  localStorage.removeItem("user");

  localStorage.removeItem(
    "loggedInUsername"
  );

  localStorage.removeItem(
    "loggedInEmail"
  );

  localStorage.removeItem(
    "loggedInRole"
  );

  sessionStorage.removeItem("token");
  sessionStorage.removeItem("user");

  sessionStorage.removeItem(
    "loggedInUsername"
  );

  sessionStorage.removeItem(
    "loggedInEmail"
  );

  sessionStorage.removeItem(
    "loggedInRole"
  );
}

function redirectToLogin() {
  clearAuthenticationData();

  if (
    window.location.pathname !==
    "/login"
  ) {
    window.location.replace(
      "/login"
    );
  }
}

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

        Authorization:
          `Bearer ${token}`,
      },
    }
  );

  if (response.status === 401) {
    redirectToLogin();

    throw new Error(
      "תוקף ההתחברות פג. יש להתחבר מחדש"
    );
  }

  if (response.status === 403) {
    window.location.replace(
      "/home"
    );

    throw new Error(
      "אין לך הרשאה לצפות בלוח האבטחה"
    );
  }

  return response;
}

function formatNumber(value) {
  return new Intl.NumberFormat(
    "he-IL"
  ).format(Number(value) || 0);
}

function formatDateTime(value) {
  if (!value) {
    return "—";
  }

  const date = new Date(value);

  if (
    Number.isNaN(date.getTime())
  ) {
    return "—";
  }

  return new Intl.DateTimeFormat(
    "he-IL",
    {
      dateStyle: "short",
      timeStyle: "medium",
      hour12: false,
    }
  ).format(date);
}

function formatHour(value) {
  if (!value) {
    return "";
  }

  const date = new Date(value);

  if (
    Number.isNaN(date.getTime())
  ) {
    return "";
  }

  return new Intl.DateTimeFormat(
    "he-IL",
    {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }
  ).format(date);
}

function getEventLabel(eventType) {
  return (
    eventLabels[eventType] ||
    eventType ||
    "אירוע לא מזוהה"
  );
}

function getEventBadgeClasses(
  eventType,
  blocked
) {
  if (
    blocked ||
    eventType ===
      "LOGIN_RATE_LIMITED"
  ) {
    return "border-rose-300/20 bg-rose-500/10 text-rose-200";
  }

  if (
    eventType === "LOGIN_SUCCESS"
  ) {
    return "border-emerald-300/20 bg-emerald-500/10 text-emerald-200";
  }

  if (
    eventType === "LOGIN_FAILED"
  ) {
    return "border-amber-300/20 bg-amber-500/10 text-amber-200";
  }

  return "border-sky-300/20 bg-sky-500/10 text-sky-200";
}

function KpiCard({
  title,
  value,
  description,
  Icon,
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-[#3b3e47] p-5 shadow-[0_14px_35px_rgba(0,0,0,0.2)]">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-sm text-white/60">
            {title}
          </div>

          <div className="mt-2 text-3xl font-extrabold text-white">
            {formatNumber(value)}
          </div>

          <div className="mt-2 text-xs leading-5 text-white/45">
            {description}
          </div>
        </div>

        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-sky-500/10 text-sky-200 ring-1 ring-sky-300/15">
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}

function SecurityTooltip({
  active,
  payload,
  label,
}) {
  if (
    !active ||
    !payload?.length
  ) {
    return null;
  }

  return (
    <div className="rounded-xl border border-white/10 bg-slate-950/95 p-3 text-sm text-white shadow-xl">
      <div className="mb-2 font-bold">
        שעה: {label}
      </div>

      {payload.map((item) => (
        <div
          key={item.dataKey}
          className="flex items-center justify-between gap-6 py-0.5 text-white/80"
        >
          <span>{item.name}</span>

          <span className="font-semibold text-white">
            {formatNumber(
              item.value
            )}
          </span>
        </div>
      ))}
    </div>
  );
}

export default function SecurityDashboard() {
  const [data, setData] =
    useState(null);

  const [loading, setLoading] =
    useState(true);

  const [
    refreshing,
    setRefreshing,
  ] = useState(false);

  const [
    errorMessage,
    setErrorMessage,
  ] = useState("");

  const loadSecurityOverview =
    useCallback(
      async (
        manualRefresh = false
      ) => {
        try {
          if (manualRefresh) {
            setRefreshing(true);
          } else {
            setLoading(true);
          }

          setErrorMessage("");

          const response =
            await authenticatedFetch(
              "/api/security/overview"
            );

          let json = null;

          try {
            json =
              await response.json();
          } catch {
            json = null;
          }

          if (!response.ok) {
            throw new Error(
              json?.message ||
                "שגיאה בטעינת נתוני האבטחה"
            );
          }

          setData(json);
        } catch (error) {
          console.error(
            "Security dashboard load error:",
            error
          );

          setErrorMessage(
            error.message ||
              "לא ניתן לטעון את נתוני האבטחה"
          );
        } finally {
          setLoading(false);
          setRefreshing(false);
        }
      },
      []
    );

  useEffect(() => {
    loadSecurityOverview();

    const intervalId =
      window.setInterval(
        () => {
          loadSecurityOverview(
            true
          );
        },
        30 * 1000
      );

    return () => {
      window.clearInterval(
        intervalId
      );
    };
  }, [loadSecurityOverview]);

  const chartData =
    useMemo(() => {
      const hourlyActivity =
        Array.isArray(
          data?.hourlyActivity
        )
          ? data.hourlyActivity
          : [];

      return hourlyActivity.map(
        (item) => ({
          ...item,

          hour: formatHour(
            item.bucketStart
          ),
        })
      );
    }, [data]);

  const summary =
    data?.summary || {
      totalEvents: 0,
      failedLogins: 0,
      successfulLogins: 0,
      blockedEvents: 0,
      authorizationDenied: 0,
      uniqueIpAddresses: 0,
    };

  const alert =
    data?.alert || {
      level: "normal",
      spikeDetected: false,

      message:
        "לא זוהתה כרגע פעילות חריגה",

      currentHourFailed: 0,
      baselineAverage: 0,
    };

  const blockedEvents =
    Array.isArray(
      data?.recentBlockedEvents
    )
      ? data.recentBlockedEvents
      : [];

  const recentEvents =
    Array.isArray(
      data?.recentEvents
    )
      ? data.recentEvents
      : [];

  return (
    <div
      dir="rtl"
      className="min-h-screen bg-[#2e3038] text-white"
    >
      <TopNavbar />

      <main className="mx-auto max-w-7xl px-6 pb-14 pt-28">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-500/10 text-sky-200 ring-1 ring-sky-300/20">
                <ShieldCheck className="h-6 w-6" />
              </div>

              <div>
                <h1 className="text-3xl font-extrabold tracking-tight">
                  לוח אבטחה – SIEM Lite
                </h1>

                <p className="mt-1 text-sm text-white/60">
                  ניטור אירועי התחברות,
                  חסימות, הרשאות ופעילות
                  חריגה במערכת
                </p>
              </div>
            </div>

            <div className="mt-3 text-xs text-white/45">
              טווח נתונים: 24 השעות
              האחרונות

              {data?.generatedAt ? (
                <>
                  {" "}
                  • עודכן לאחרונה:{" "}
                  {formatDateTime(
                    data.generatedAt
                  )}
                </>
              ) : null}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() =>
                loadSecurityOverview(
                  true
                )
              }
              disabled={refreshing}
              className="inline-flex h-11 items-center gap-2 rounded-xl bg-sky-500/15 px-4 text-sm font-semibold text-sky-100 ring-1 ring-sky-300/20 transition hover:bg-sky-500/25 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <RefreshCw
                className={[
                  "h-4 w-4",

                  refreshing
                    ? "animate-spin"
                    : "",
                ].join(" ")}
              />

              {refreshing
                ? "מעדכן..."
                : "רענון נתונים"}
            </button>
          </div>
        </div>

        {errorMessage ? (
          <div className="mt-7 rounded-2xl border border-rose-300/20 bg-rose-500/10 p-5 text-center text-sm text-rose-100">
            {errorMessage}
          </div>
        ) : null}

        {loading ? (
          <div className="mt-10 rounded-2xl border border-white/10 bg-white/[0.04] p-10 text-center text-white/65">
            טוען את נתוני האבטחה...
          </div>
        ) : null}

        {!loading && data ? (
          <>
            <section className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
              <KpiCard
                title="סה״כ אירועי אבטחה"
                value={
                  summary.totalEvents
                }
                description="כל האירועים שנרשמו ב־24 השעות האחרונות"
                Icon={Activity}
              />

              <KpiCard
                title="ניסיונות התחברות כושלים"
                value={
                  summary.failedLogins
                }
                description="ניסיונות שבהם שם המשתמש או הסיסמה לא היו תקינים"
                Icon={UserX}
              />

              <KpiCard
                title="התחברויות מוצלחות"
                value={
                  summary.successfulLogins
                }
                description="משתמשים שעברו אימות בהצלחה"
                Icon={LogIn}
              />

              <KpiCard
                title="אירועים שנחסמו"
                value={
                  summary.blockedEvents
                }
                description="בקשות שנחסמו על ידי מנגנוני האבטחה"
                Icon={Ban}
              />

              <KpiCard
                title="ניסיונות ללא הרשאה"
                value={
                  summary.authorizationDenied
                }
                description="משתמשים מחוברים שניסו להיכנס לנתיב ללא הרשאה"
                Icon={AlertTriangle}
              />

              <KpiCard
                title="כתובות IP ייחודיות"
                value={
                  summary.uniqueIpAddresses
                }
                description="מספר כתובות ה־IP שהופיעו באירועי האבטחה"
                Icon={Network}
              />
            </section>

            <section
              className={[
                "mt-6 rounded-2xl border p-5",

                alert.spikeDetected
                  ? "border-rose-300/25 bg-rose-500/10"
                  : "border-emerald-300/20 bg-emerald-500/10",
              ].join(" ")}
            >
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-start gap-3">
                  <div
                    className={[
                      "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",

                      alert.spikeDetected
                        ? "bg-rose-500/15 text-rose-200"
                        : "bg-emerald-500/15 text-emerald-200",
                    ].join(" ")}
                  >
                    {alert.spikeDetected ? (
                      <AlertTriangle className="h-5 w-5" />
                    ) : (
                      <ShieldCheck className="h-5 w-5" />
                    )}
                  </div>

                  <div>
                    <div className="font-bold">
                      {alert.spikeDetected
                        ? "התראת פעילות חריגה"
                        : "מצב האבטחה תקין"}
                    </div>

                    <div className="mt-1 text-sm text-white/70">
                      {alert.message}
                    </div>
                  </div>
                </div>

                <div className="text-sm text-white/65">
                  אירועים בשעה הנוכחית:{" "}

                  <span className="font-bold text-white">
                    {formatNumber(
                      alert.currentHourFailed
                    )}
                  </span>

                  {" "}• ממוצע קודם:{" "}

                  <span className="font-bold text-white">
                    {
                      alert.baselineAverage
                    }
                  </span>
                </div>
              </div>
            </section>

            <section className="mt-6 rounded-[28px] bg-[#3b3e47] p-5 shadow-[0_18px_55px_rgba(0,0,0,0.3)] lg:p-7">
              <div className="mb-5">
                <h2 className="text-xl font-bold">
                  פעילות אבטחה לפי שעה
                </h2>

                <p className="mt-1 text-sm text-white/55">
                  אירועים חשודים וחסימות
                  במהלך 24 השעות האחרונות
                </p>
              </div>

              <div className="h-[380px] rounded-2xl border border-white/10 bg-[#2e3038] p-3">
                <ResponsiveContainer
                  width="100%"
                  height="100%"
                >
                  <LineChart
                    data={chartData}
                    margin={{
                      top: 20,
                      right: 15,
                      left: 5,
                      bottom: 5,
                    }}
                  >
                    <CartesianGrid
                      stroke="rgba(255,255,255,0.08)"
                      strokeDasharray="4 4"
                    />

                    <XAxis
                      dataKey="hour"
                      stroke="rgba(255,255,255,0.45)"
                      tick={{
                        fill:
                          "rgba(255,255,255,0.6)",

                        fontSize: 11,
                      }}
                    />

                    <YAxis
                      allowDecimals={false}
                      stroke="rgba(255,255,255,0.45)"
                      tick={{
                        fill:
                          "rgba(255,255,255,0.6)",

                        fontSize: 11,
                      }}
                    />

                    <Tooltip
                      content={
                        <SecurityTooltip />
                      }
                    />

                    <Legend />

                    <Line
                      type="monotone"
                      dataKey="failedAttempts"
                      name="אירועים חשודים"
                      stroke="#fbbf24"
                      strokeWidth={3}
                      dot={{
                        r: 3,
                      }}
                      activeDot={{
                        r: 6,
                      }}
                    />

                    <Line
                      type="monotone"
                      dataKey="blockedEvents"
                      name="אירועים שנחסמו"
                      stroke="#fb7185"
                      strokeWidth={3}
                      dot={{
                        r: 3,
                      }}
                      activeDot={{
                        r: 6,
                      }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </section>

            <section className="mt-6 rounded-[28px] bg-[#3b3e47] p-5 shadow-[0_18px_55px_rgba(0,0,0,0.3)] lg:p-7">
              <div className="mb-5">
                <h2 className="text-xl font-bold">
                  חסימות אחרונות
                </h2>

                <p className="mt-1 text-sm text-white/55">
                  כתובות IP ובקשות שנחסמו
                  על ידי מנגנוני האבטחה
                </p>
              </div>

              {blockedEvents.length >
              0 ? (
                <div className="overflow-x-auto rounded-2xl border border-white/10">
                  <table className="min-w-full text-right text-sm">
                    <thead className="bg-white/[0.05] text-white/65">
                      <tr>
                        <th className="whitespace-nowrap px-4 py-3 font-semibold">
                          זמן
                        </th>

                        <th className="whitespace-nowrap px-4 py-3 font-semibold">
                          כתובת IP
                        </th>

                        <th className="whitespace-nowrap px-4 py-3 font-semibold">
                          משתמש
                        </th>

                        <th className="whitespace-nowrap px-4 py-3 font-semibold">
                          סוג אירוע
                        </th>

                        <th className="whitespace-nowrap px-4 py-3 font-semibold">
                          נתיב
                        </th>

                        <th className="whitespace-nowrap px-4 py-3 font-semibold">
                          קוד
                        </th>
                      </tr>
                    </thead>

                    <tbody>
                      {blockedEvents.map(
                        (event) => (
                          <tr
                            key={event.id}
                            className="border-t border-white/10 text-white/75"
                          >
                            <td className="whitespace-nowrap px-4 py-3">
                              {formatDateTime(
                                event.createdAt
                              )}
                            </td>

                            <td
                              dir="ltr"
                              className="whitespace-nowrap px-4 py-3 text-right font-mono text-xs"
                            >
                              {event.ipAddress ||
                                "—"}
                            </td>

                            <td className="whitespace-nowrap px-4 py-3">
                              {event.username ||
                                "לא ידוע"}
                            </td>

                            <td className="whitespace-nowrap px-4 py-3">
                              <span
                                className={[
                                  "inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold",

                                  getEventBadgeClasses(
                                    event.eventType,
                                    true
                                  ),
                                ].join(" ")}
                              >
                                {getEventLabel(
                                  event.eventType
                                )}
                              </span>
                            </td>

                            <td
                              dir="ltr"
                              className="max-w-[260px] truncate px-4 py-3 text-right font-mono text-xs"
                              title={
                                event.route ||
                                ""
                              }
                            >
                              {event.method ||
                                ""}{" "}

                              {event.route ||
                                "—"}
                            </td>

                            <td className="whitespace-nowrap px-4 py-3 font-semibold text-rose-200">
                              {event.statusCode ||
                                "—"}
                            </td>
                          </tr>
                        )
                      )}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-8 text-center text-sm text-white/60">
                  לא נמצאו אירועים חסומים.
                </div>
              )}
            </section>

            <section className="mt-6 rounded-[28px] bg-[#3b3e47] p-5 shadow-[0_18px_55px_rgba(0,0,0,0.3)] lg:p-7">
              <div className="mb-5">
                <h2 className="text-xl font-bold">
                  יומן אירועי אבטחה
                </h2>

                <p className="mt-1 text-sm text-white/55">
                  חמישים אירועי האבטחה
                  האחרונים שנרשמו במערכת
                </p>
              </div>

              {recentEvents.length > 0 ? (
                <div className="overflow-x-auto rounded-2xl border border-white/10">
                  <table className="min-w-full text-right text-sm">
                    <thead className="bg-white/[0.05] text-white/65">
                      <tr>
                        <th className="whitespace-nowrap px-4 py-3 font-semibold">
                          זמן
                        </th>

                        <th className="whitespace-nowrap px-4 py-3 font-semibold">
                          אירוע
                        </th>

                        <th className="whitespace-nowrap px-4 py-3 font-semibold">
                          IP
                        </th>

                        <th className="whitespace-nowrap px-4 py-3 font-semibold">
                          משתמש
                        </th>

                        <th className="whitespace-nowrap px-4 py-3 font-semibold">
                          בקשה
                        </th>

                        <th className="whitespace-nowrap px-4 py-3 font-semibold">
                          תוצאה
                        </th>
                      </tr>
                    </thead>

                    <tbody>
                      {recentEvents.map(
                        (event) => (
                          <tr
                            key={event.id}
                            className="border-t border-white/10 text-white/75"
                          >
                            <td className="whitespace-nowrap px-4 py-3">
                              {formatDateTime(
                                event.createdAt
                              )}
                            </td>

                            <td className="whitespace-nowrap px-4 py-3">
                              <span
                                className={[
                                  "inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold",

                                  getEventBadgeClasses(
                                    event.eventType,
                                    event.blocked
                                  ),
                                ].join(" ")}
                              >
                                {getEventLabel(
                                  event.eventType
                                )}
                              </span>
                            </td>

                            <td
                              dir="ltr"
                              className="whitespace-nowrap px-4 py-3 text-right font-mono text-xs"
                            >
                              {event.ipAddress ||
                                "—"}
                            </td>

                            <td className="whitespace-nowrap px-4 py-3">
                              {event.username ||
                                "לא ידוע"}
                            </td>

                            <td
                              dir="ltr"
                              className="max-w-[260px] truncate px-4 py-3 text-right font-mono text-xs"
                              title={
                                event.route ||
                                ""
                              }
                            >
                              {event.method ||
                                ""}{" "}

                              {event.route ||
                                "—"}
                            </td>

                            <td className="whitespace-nowrap px-4 py-3">
                              <span
                                className={
                                  event.blocked
                                    ? "font-semibold text-rose-200"
                                    : "text-white/70"
                                }
                              >
                                {event.statusCode ||
                                  "—"}
                              </span>
                            </td>
                          </tr>
                        )
                      )}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-8 text-center text-sm text-white/60">
                  עדיין לא נרשמו אירועי אבטחה.
                </div>
              )}
            </section>
          </>
        ) : null}
      </main>
    </div>
  );
}