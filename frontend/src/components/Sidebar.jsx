import React from "react";
import { Link, useLocation } from "react-router-dom";
import {
  Home,
  BarChart3,
  TrendingUp,
  MapPinned,
  LineChart,
  FileText,
  X,
} from "lucide-react";

const menuItems = [
  { label: "דף הבית", to: "/home", Icon: Home },
  { label: "דוח 1 – השוואת נרשמים לפי חודשים / שנים", to: "/report1", Icon: TrendingUp },
  { label: "דוח 2 – ביקושי המחלקות של הנרשמים למכללה בהשוואה לשנים האחרונות", to: "/report2", Icon: BarChart3 },
  { label: "דוח 3 – שמות היישובים של הנרשמים לשנה״ל בחודש זה על פי המחלקה וקמפוס", to: "/report3", Icon: MapPinned },
  { label: "דוח 4 – ניתוח הגעה למפגש ייעוץ", to: "/report4", Icon: LineChart },
  { label: "דוח 5 - ניתוח לידים ומידה", to: "/report5", Icon: FileText },
];

export default function Sidebar({ isOpen, onToggle }) {
  const { pathname } = useLocation();

  if (!isOpen) return null;

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
                <div className="text-lg font-bold">ניווט במערכת</div>
                <div className="mt-1 text-sm text-white/55">
                  מעבר בין דוחות ועמודים מרכזיים
                </div>
              </div>

              <button
                onClick={onToggle}
                className="rounded-lg p-2 text-white/70 transition hover:bg-white/8 hover:text-white"
                aria-label="סגירה"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-3 py-4">
            <div className="space-y-1.5">
              {menuItems.map(({ label, to, Icon }) => {
                const active = pathname === to;

                return (
                  <Link
                    key={to}
                    to={to}
                    onClick={onToggle}
                    className={[
                      "group flex items-start gap-3 rounded-xl px-3 py-3 transition",
                      active
                        ? "bg-sky-500/14 text-sky-100 ring-1 ring-sky-300/20"
                        : "text-white/85 hover:bg-white/[0.05]",
                    ].join(" ")}
                  >
                    <div
                      className={[
                        "mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ring-1 transition",
                        active
                          ? "bg-sky-500/12 text-sky-200 ring-sky-300/20"
                          : "bg-white/[0.04] text-white/70 ring-white/10 group-hover:text-sky-200",
                      ].join(" ")}
                    >
                      <Icon className="h-[17px] w-[17px]" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-medium leading-6">{label}</div>
                    </div>
                  </Link>
                );
              })}
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