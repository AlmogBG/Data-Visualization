const prisma = require("../config/db");

const yearMap = {
  'תשפ״ב': 2022,
  'תשפ״ג': 2023,
  'תשפ״ד': 2024,
  'תשפ״ה': 2025,
};

const monthKeys = [
  "01", "02", "03", "04", "05", "06",
  "07", "08", "09", "10", "11", "12",
];

const monthLabels = {
  "01": "01",
  "02": "02",
  "03": "03",
  "04": "04",
  "05": "05",
  "06": "06",
  "07": "07",
  "08": "08",
  "09": "09",
  "10": "10",
  "11": "11",
  "12": "12",
};

const outcomeLabelMap = {
  ENROLLED: "נרשם",
  NOT_RELEVANT: "לא רלוונטי",
  NOT_INTERESTED: "לא מעוניין",
  FOLLOWUP: "רלוונטי ונמשך טיפול",
  SELF_CONTACT: "ייצור קשר בעצמו – לא רלוונטי",
  OTHER: "אחר",
};

function parseMonthsParam(monthsParam) {
  if (!monthsParam || monthsParam === "ALL") {
    return monthKeys;
  }

  const parsed = String(monthsParam)
    .split(",")
    .map((m) => m.trim())
    .filter((m) => monthKeys.includes(m))
    .sort((a, b) => Number(a) - Number(b));

  return parsed.length ? parsed : monthKeys;
}

function normalizeCampusValue(value) {
  if (!value) return null;

  const cleaned = String(value).trim();

  if (cleaned === "ASHDOD" || cleaned === "אשדוד") {
    return "ASHDOD";
  }

  if (
    cleaned === "BEER_SHEVA" ||
    cleaned === "באר שבע" ||
    cleaned === "באר-שבע"
  ) {
    return "BEER_SHEVA";
  }

  return cleaned;
}

function buildCampusLeadWhere(campus) {
  if (campus === "ASHDOD") {
    return {
      OR: [{ campus: "ASHDOD" }, { campus: "אשדוד" }],
    };
  }

  if (campus === "BEER_SHEVA") {
    return {
      OR: [
        { campus: "BEER_SHEVA" },
        { campus: "באר שבע" },
        { campus: "באר-שבע" },
      ],
    };
  }

  return {};
}

function buildCampusKeys(campus) {
  if (campus === "ASHDOD") return ["ASHDOD"];
  if (campus === "BEER_SHEVA") return ["BEER_SHEVA"];
  return ["ASHDOD", "BEER_SHEVA"];
}

function buildMonthLabel(monthKey, gregorianYear) {
  const yearSuffix = String(gregorianYear).slice(-2);
  return `${monthLabels[monthKey] || monthKey}/${yearSuffix}`;
}

async function getReport4Monthly(req, res) {
  try {
    const {
      campus = "BOTH",
      year = "תשפ״ה",
      months = "ALL",
    } = req.query;

    const gregorianYear = yearMap[year];
    if (!gregorianYear) {
      return res.status(400).json({ message: "שנה לא תקינה" });
    }

    const selectedMonths = parseMonthsParam(months);
    const selectedMonthNumbers = new Set(selectedMonths.map((m) => Number(m)));

    const startDate = new Date(gregorianYear, 0, 1);
    const endDate = new Date(gregorianYear, 11, 31, 23, 59, 59, 999);

    const leads = await prisma.lead.findMany({
      where: {
        ...buildCampusLeadWhere(campus),
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      select: {
        id: true,
        campus: true,
        createdAt: true,
      },
    });

    const consultations = await prisma.consultation.findMany({
      where: {
        meetingDate: {
          gte: startDate,
          lte: endDate,
        },
      },
      select: {
        id: true,
        arrived: true,
        meetingDate: true,
        lead: {
          select: {
            campus: true,
          },
        },
      },
    });

    const rows = selectedMonths.map((mKey) => ({
      month: mKey,
      label: buildMonthLabel(mKey, gregorianYear),
      invitedAshdod: 0,
      invitedBeer: 0,
      attendedAshdod: 0,
      attendedBeer: 0,
    }));

    const rowMap = new Map(rows.map((row) => [row.month, row]));
    const campusKeys = buildCampusKeys(campus);

    for (const lead of leads) {
      const normalizedCampus = normalizeCampusValue(lead.campus);
      if (!normalizedCampus || !campusKeys.includes(normalizedCampus)) continue;

      const leadDate = new Date(lead.createdAt);
      const monthNumber = leadDate.getMonth() + 1;
      if (!selectedMonthNumbers.has(monthNumber)) continue;

      const monthKey = String(monthNumber).padStart(2, "0");
      const row = rowMap.get(monthKey);
      if (!row) continue;

      if (normalizedCampus === "ASHDOD") {
        row.invitedAshdod += 1;
      } else if (normalizedCampus === "BEER_SHEVA") {
        row.invitedBeer += 1;
      }
    }

    for (const consultation of consultations) {
      const campusFromLead = normalizeCampusValue(consultation.lead?.campus);
      if (!campusFromLead || !campusKeys.includes(campusFromLead)) continue;

      const consultationDate = new Date(consultation.meetingDate);
      const monthNumber = consultationDate.getMonth() + 1;
      if (!selectedMonthNumbers.has(monthNumber)) continue;
      if (consultation.arrived !== true) continue;

      const monthKey = String(monthNumber).padStart(2, "0");
      const row = rowMap.get(monthKey);
      if (!row) continue;

      if (campusFromLead === "ASHDOD") {
        row.attendedAshdod += 1;
      } else if (campusFromLead === "BEER_SHEVA") {
        row.attendedBeer += 1;
      }
    }

    let result = rows;

    if (campus === "ASHDOD") {
      result = rows.map((row) => ({
        ...row,
        invitedBeer: null,
        attendedBeer: null,
      }));
    } else if (campus === "BEER_SHEVA") {
      result = rows.map((row) => ({
        ...row,
        invitedAshdod: null,
        attendedAshdod: null,
      }));
    }

    return res.json(result);
  } catch (error) {
    console.error("getReport4Monthly error:", error);
    return res.status(500).json({
      message: "שגיאת שרת בשליפת נתוני דוח 4 חודשי",
      error: error.message,
    });
  }
}

async function getReport4Outcomes(req, res) {
  try {
    const {
      campus = "BOTH",
      year = "תשפ״ה",
      months = "ALL",
    } = req.query;

    const gregorianYear = yearMap[year];
    if (!gregorianYear) {
      return res.status(400).json({ message: "שנה לא תקינה" });
    }

    const selectedMonths = parseMonthsParam(months);
    const selectedMonthNumbers = new Set(selectedMonths.map((m) => Number(m)));
    const campusKeys = buildCampusKeys(campus);

    const startDate = new Date(gregorianYear, 0, 1);
    const endDate = new Date(gregorianYear, 11, 31, 23, 59, 59, 999);

    const consultations = await prisma.consultation.findMany({
      where: {
        meetingDate: {
          gte: startDate,
          lte: endDate,
        },
      },
      select: {
        outcome: true,
        meetingDate: true,
        lead: {
          select: {
            campus: true,
          },
        },
      },
    });

    const result = {};

    for (const campusKey of campusKeys) {
      result[campusKey] = {
        campus: campusKey,
        items: Object.keys(outcomeLabelMap).map((key) => ({
          key,
          name: outcomeLabelMap[key],
          value: 0,
        })),
      };
    }

    const itemMap = {};
    for (const campusKey of campusKeys) {
      itemMap[campusKey] = new Map(
        result[campusKey].items.map((item) => [item.key, item])
      );
    }

    for (const consultation of consultations) {
      const campusFromLead = normalizeCampusValue(consultation.lead?.campus);
      if (!campusFromLead || !campusKeys.includes(campusFromLead)) continue;

      const consultationDate = new Date(consultation.meetingDate);
      const monthNumber = consultationDate.getMonth() + 1;
      if (!selectedMonthNumbers.has(monthNumber)) continue;

      const outcomeKey = consultation.outcome || "OTHER";
      const target =
        itemMap[campusFromLead].get(outcomeKey) ||
        itemMap[campusFromLead].get("OTHER");

      if (target) {
        target.value += 1;
      }
    }

    return res.json(result);
  } catch (error) {
    console.error("getReport4Outcomes error:", error);
    return res.status(500).json({
      message: "שגיאת שרת בשליפת תוצאות דוח 4",
      error: error.message,
    });
  }
}

module.exports = {
  getReport4Monthly,
  getReport4Outcomes,
};