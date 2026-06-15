import React from "react";

import {
  Link,
  useLocation,
} from "react-router-dom";

import {
  Home,
  BarChart3,
  TrendingUp,
  MapPinned,
  LineChart,
  FileText,
  ShieldCheck,
  X,
} from "lucide-react";

const menuItems = [
  {
    label: "דף הבית",
    to: "/home",
    Icon: Home,
    managerOnly: false,
  },
  {
    label:
      "דוח 1 – השוואת נרשמים לפי חודשים / שנים",
    to: "/report1",
    Icon: TrendingUp,
    managerOnly: true,
  },
  {
    label:
      "דוח 2 – ביקושי המחלקות של הנרשמים למכללה בהשוואה לשנים האחרונות",
    to: "/report2",
    Icon: BarChart3,
    managerOnly: true,
  },
  {
    label:
      "דוח 3 – שמות היישובים של הנרשמים לשנה״ל בחודש זה על פי המחלקה וקמפוס",
    to: "/report3",
    Icon: MapPinned,
    managerOnly: true,
  },
  {
    label:
      "דוח 4 – ניתוח הגעה למפגש ייעוץ",
    to: "/report4",
    Icon: LineChart,
    managerOnly: true,
  },
  {
    label:
      "דוח 5 – ניתוח לידים ומדיה",
    to: "/report5",
    Icon: FileText,
    managerOnly: true,
  },
  {
    label:
      "לוח אבטחה – SIEM Lite",
    to: "/security",
    Icon: ShieldCheck,
    managerOnly: true,
  },
];

function getStoredRole() {
  const directRole =
    localStorage.getItem(
      "loggedInRole"
    ) ||
    sessionStorage.getItem(
      "loggedInRole"
    );

  if (directRole) {
    return directRole;
  }

  try {
    const storedUser =
      localStorage.getItem("user") ||
      sessionStorage.getItem("user");

    if (!storedUser) {
      return "";
    }

    const parsedUser =
      JSON.parse(storedUser);

    return parsedUser?.role || "";
  } catch (error) {
    console.error(
      "Failed to read the stored user role:",
      error
    );

    return "";
  }
}

export default function Sidebar({
  isOpen,
  onToggle,
}) {
  const { pathname } =
    useLocation();

  const role = getStoredRole();

  const isManager =
    role === "Manager";

  const visibleMenuItems =
    menuItems.filter((item) => {
      if (!item.managerOnly) {
        return true;
      }

      return isManager;
    });

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-[2px]"
        onClick={onToggle}
      />

      <aside className="absolute right-0 top-0 h-full w-[320px] border-l border-white/10 bg-[#2c2f37] text-white shadow-[0_20px_50px_rgba(0,0,0,0.35)]">
        <div className="flex h-full flex-col">
          <div className="border-b border-white/10 px-5 py-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-lg font-bold">
                  ניווט במערכת
                </div>

                <div className="mt-1 text-sm text-white/55">
                  {isManager
                    ? "מעבר בין דוחות, אבטחה ועמודים מרכזיים"
                    : "מעבר בין עמודי המערכת"}
                </div>
              </div>

              <button
                type="button"
                onClick={onToggle}
                className="rounded-lg p-2 text-white/70 transition hover:bg-white/10 hover:text-white"
                aria-label="סגירה"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-3 py-4">
            <div className="space-y-1.5">
              {visibleMenuItems.map(
                ({
                  label,
                  to,
                  Icon,
                }) => {
                  const active =
                    pathname === to;

                  return (
                    <Link
                      key={to}
                      to={to}
                      onClick={onToggle}
                      className={[
                        "group flex items-start gap-3 rounded-xl px-3 py-3 transition",
                        active
                          ? "bg-sky-500/15 text-sky-100 ring-1 ring-sky-300/20"
                          : "text-white/85 hover:bg-white/[0.05]",
                      ].join(" ")}
                    >
                      <div
                        className={[
                          "mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ring-1 transition",
                          active
                            ? "bg-sky-500/15 text-sky-200 ring-sky-300/20"
                            : "bg-white/[0.04] text-white/70 ring-white/10 group-hover:text-sky-200",
                        ].join(" ")}
                      >
                        <Icon className="h-[17px] w-[17px]" />
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-medium leading-6">
                          {label}
                        </div>
                      </div>
                    </Link>
                  );
                }
              )}
            </div>
          </div>

          <div className="border-t border-white/10 px-5 py-4">
            <div className="text-xs text-white/45">
              מערכת ניהול אקדמית · SCE
            </div>
          </div>
        </div>
      </aside>
    </div>
  );
}