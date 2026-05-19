const prisma = require("../config/db");

async function getLeadsByCity(req, res) {
  try {
    const { campus, department, area, year, month } = req.query;

    const leadWhere = {};

    if (campus && campus !== "ALL" && campus !== "undefined") {
      leadWhere.campus = campus;
    }

    if (department && department !== "ALL" && department !== "undefined") {
      leadWhere.department = {
        name: department,
      };
    }

    if (year && year !== "ALL" && year !== "undefined") {
      const yearInt = parseInt(year, 10);

      if (!Number.isNaN(yearInt)) {
        let startDate = null;
        let endDate = null;

        if (month && month !== "ALL" && month !== "undefined") {
          const monthInt = parseInt(month, 10);

          if (!Number.isNaN(monthInt)) {
            startDate = new Date(yearInt, monthInt - 1, 1);
            endDate = new Date(yearInt, monthInt, 0, 23, 59, 59, 999);
          }
        } else {
          startDate = new Date(yearInt, 0, 1);
          endDate = new Date(yearInt, 11, 31, 23, 59, 59, 999);
        }

        if (startDate && endDate) {
          leadWhere.createdAt = {
            gte: startDate,
            lte: endDate,
          };
        }
      }
    }

    const cityWhere = {};
    if (area && area !== "ALL" && area !== "undefined") {
      cityWhere.region = area;
    }

    const cityStats = await prisma.city.findMany({
      where: cityWhere,
      include: {
        leads: {
          where: leadWhere,
          select: {
            id: true,
          },
        },
      },
      orderBy: {
        town: "asc",
      },
    });

    const formatted = cityStats
      .map((city) => ({
        town: city.town,
        count: city.leads.length,
        region: city.region,
      }))
      .filter((row) => row.count > 0)
      .sort((a, b) => b.count - a.count);

    return res.json(formatted);
  } catch (error) {
    console.error("getLeadsByCity error:", error);

    return res.status(500).json({
      message: "שגיאת שרת בשליפת נתוני ערים",
      error: error.message,
    });
  }
}
async function getAnomalies(req, res) {
  try {
    // נגדיר את טווח הזמן: 30 הימים האחרונים
    const today = new Date();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(today.getDate() - 30);

    // שליפת כל הלידים מ-30 הימים האחרונים 
    const leads = await prisma.lead.findMany({
      where: {
        createdAt: {
          gte: thirtyDaysAgo,
        },
      },
      select: {
        createdAt: true,
      },
    });

    // קיבוץ הלידים לפי תאריך (ימים)
    const leadsPerDay = {};
    leads.forEach((lead) => {
      const dateString = lead.createdAt.toISOString().split("T")[0];
      leadsPerDay[dateString] = (leadsPerDay[dateString] || 0) + 1;
    });

    const todayString = today.toISOString().split("T")[0];
    const todayCount = leadsPerDay[todayString] || 0;

    // חישוב הממוצע היומי ללא היום הנוכחי 
    const pastCounts = Object.entries(leadsPerDay)
      .filter(([date]) => date !== todayString)
      .map(([_, count]) => count);

    const averageLeads = pastCounts.length
      ? pastCounts.reduce((sum, count) => sum + count, 0) / pastCounts.length
      : 0;

    const anomalies = [];

    // הגדרת תנאי לחריגה: כמות הלידים היום גדולה ב-20% מהממוצע, ולפחות 20 לידים 
    if (todayCount > averageLeads * 1.2 && todayCount > 20) {
      anomalies.push({
        id: "spike_leads_today",
        type: "warning",
        title: "קפיצה חריגה בהרשמות!",
        message: `זוהתה כמות יוצאת דופן של נרשמים היום (${todayCount} לידים), לעומת ממוצע יומי של ${Math.round(averageLeads)} בחודש האחרון.`,
        date: todayString,
      });
    }

    return res.json({ anomalies });
  } catch (error) {
    console.error("getAnomalies error:", error);
    return res.status(500).json({
      message: "שגיאת שרת בחישוב חריגות נתונים",
      error: error.message,
    });
  }
}


module.exports = {
  getLeadsByCity,
  getAnomalies, 
};
