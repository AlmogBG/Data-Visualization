import React, { useEffect, useMemo, useState } from "react";
import TopNavbar from "../components/TopNavbar";
import {
  HiOutlineChartBar,
  HiOutlineUserGroup,
  HiOutlineCurrencyDollar,
  HiOutlineCalendarDays,
} from "react-icons/hi2";
import KpiCard from "../components/KpiCard";
import Sidebar from "../components/Sidebar";
import { getHomeSummary } from "../api/metricsApi";

function trendFromDelta(deltaPct) {
  if (deltaPct > 0) {
    return { type: "up", text: `+${deltaPct}% לעומת חודש קודם` };
  }
  if (deltaPct < 0) {
    return { type: "down", text: `${deltaPct}% לעומת חודש קודם` };
  }
  return { type: "neutral", text: "ללא שינוי" };
}

function GroupCard({ title, icon: Icon, iconClassName = "", items }) {
  return (
    <div className="rounded-[32px] bg-[#3b3e47] p-5 shadow-[0_18px_60px_rgba(0,0,0,0.40)]">
      <div className="flex items-center justify-center gap-2 text-center text-xl font-extrabold text-white">
        {Icon ? <Icon className={`text-2xl ${iconClassName}`} /> : null}
        <span>{title}</span>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-4">
        {items.map((it) => (
          <KpiCard
            key={it.title}
            title={it.title}
            value={it.value}
            trendText={it.trend.text}
            trendType={it.trend.type}
          />
        ))}
      </div>
    </div>
  );
}

export default function HomePage() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function loadSummary() {
      try {
        setLoading(true);
        const data = await getHomeSummary();

        if (!cancelled) {
          setSummary(data);
        }
      } catch (error) {
        console.error("Failed to load home summary:", error);

        if (!cancelled) {
          setSummary({
            totalLeads: 0,
            newLeads: 0,
            totalMeetings: 0,
            totalSales: 0,
            leadsInProgress: 0,
            closedLeads: 0,
            newSales: 0,
            refunds: 0,
            conversionRate: 0,
            todayMeetings: 0,
            futureMeetings: 0,
            canceledMeetings: 0,
            trends: {
              totalLeads: 0,
              newLeads: 0,
              leadsInProgress: 0,
              closedLeads: 0,
              totalSales: 0,
              newSales: 0,
              refunds: 0,
              conversionRate: 0,
              totalMeetings: 0,
              todayMeetings: 0,
              futureMeetings: 0,
              canceledMeetings: 0,
            },
          });
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadSummary();

    return () => {
      cancelled = true;
    };
  }, []);

  const data = useMemo(() => {
    const s = summary || {
      totalLeads: 0,
      newLeads: 0,
      totalMeetings: 0,
      totalSales: 0,
      leadsInProgress: 0,
      closedLeads: 0,
      newSales: 0,
      refunds: 0,
      conversionRate: 0,
      todayMeetings: 0,
      futureMeetings: 0,
      canceledMeetings: 0,
      trends: {},
    };

    return {
      kids: [
        {
          title: 'סה"כ לידים',
          value: s.totalLeads ?? 0,
          trend: trendFromDelta(s.trends?.totalLeads ?? 0),
        },
        {
          title: "לידים חדשים החודש",
          value: s.newLeads ?? 0,
          trend: trendFromDelta(s.trends?.newLeads ?? 0),
        },
        {
          title: "לידים בטיפול",
          value: s.leadsInProgress ?? 0,
          trend: trendFromDelta(s.trends?.leadsInProgress ?? 0),
        },
        {
          title: "לידים סגורים",
          value: s.closedLeads ?? 0,
          trend: trendFromDelta(s.trends?.closedLeads ?? 0),
        },
      ],
      sales: [
        {
          title: 'סה"כ מכירות',
          value: s.totalSales ?? 0,
          trend: trendFromDelta(s.trends?.totalSales ?? 0),
        },
        {
          title: "מכירות חדשות",
          value: s.newSales ?? 0,
          trend: trendFromDelta(s.trends?.newSales ?? 0),
        },
        {
          title: "החזרים",
          value: s.refunds ?? 0,
          trend: trendFromDelta(s.trends?.refunds ?? 0),
        },
        {
          title: "אחוז המרה",
          value: `${s.conversionRate ?? 0}%`,
          trend: trendFromDelta(s.trends?.conversionRate ?? 0),
        },
      ],
      meetings: [
        {
          title: 'סה"כ פגישות',
          value: s.totalMeetings ?? 0,
          trend: trendFromDelta(s.trends?.totalMeetings ?? 0),
        },
        {
          title: "פגישות היום",
          value: s.todayMeetings ?? 0,
          trend: trendFromDelta(s.trends?.todayMeetings ?? 0),
        },
        {
          title: "פגישות עתידיות",
          value: s.futureMeetings ?? 0,
          trend: trendFromDelta(s.trends?.futureMeetings ?? 0),
        },
        {
          title: "פגישות שבוטלו",
          value: s.canceledMeetings ?? 0,
          trend: trendFromDelta(s.trends?.canceledMeetings ?? 0),
        },
      ],
    };
  }, [summary]);

  const updatedAt = useMemo(() => {
    const now = new Date();
    const time = now.toLocaleTimeString("he-IL", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
    const date = now.toLocaleDateString("he-IL");
    return `${time}, ${date}`;
  }, [summary]);

  return (
    <div dir="rtl" className="min-h-screen bg-[#2e3038] text-white">
      <TopNavbar />
      <Sidebar isOpen={menuOpen} onToggle={() => setMenuOpen((s) => !s)} />

      <div className="mx-auto max-w-6xl px-6 pt-28">
        <div className="mt-8 text-center">
          <h1 className="flex items-center justify-center gap-3 text-3xl font-extrabold tracking-tight">
            <HiOutlineChartBar className="text-4xl text-sky-300" />
            סיכום פעילויות מחלקת הרישום
          </h1>
          <p className="mt-2 text-sm text-white/75">
            תצוגה מרוכזת של לידים, פגישות ומכירות – בזמן כמעט אמת.
            {loading ? <span className="mr-2">(טוען...)</span> : null}
          </p>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-3">
          <GroupCard
            title="לידים"
            icon={HiOutlineUserGroup}
            iconClassName="text-sky-300"
            items={data.kids}
          />
          <GroupCard
            title="מכירות"
            icon={HiOutlineCurrencyDollar}
            iconClassName="text-emerald-300"
            items={data.sales}
          />
          <GroupCard
            title="פגישות"
            icon={HiOutlineCalendarDays}
            iconClassName="text-indigo-300"
            items={data.meetings}
          />
        </div>

        <div className="mt-8 text-right text-xs text-white/60">
          נתונים מעודכנים ל- {updatedAt}
        </div>

        <div className="pb-16" />
      </div>
    </div>
  );
}