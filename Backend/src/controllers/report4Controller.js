const prisma = require("../config/db");

const yearMap = {
  "תשפ״ב": 2022,
  "תשפ״ג": 2023,
  "תשפ״ד": 2024,
  "תשפ״ה": 2025,
  "תשפ״ו": 2026,
};

const campusKeys = ["ASHDOD", "BEER_SHEVA"];

const outcomeOptions = [
  { key: "נרשם", name: "נרשם" },
  { key: "לא רלוונטי", name: "לא רלוונטי" },
  { key: "לא מעוניין", name: "לא מעוניין" },
  { key: "להמשך טיפול", name: "להמשך טיפול" },
  { key: "ייצור קשר בעצמו", name: "ייצור קשר בעצמו" },
  { key: "אחר", name: "אחר" },
];

function normalizeYear(value) {
  if (!value) return new Date().getFullYear();

  if (yearMap[value]) return yearMap[value];

  const parsed = Number(value);
  if (Number.isFinite(parsed)) return parsed;

  return new Date().getFullYear();
}

function normalizeMonthList(monthsQuery) {
  if (!monthsQuery) {
    return Array.from({ length: 12 }, (_, index) => index + 1);
  }

  const values = String(monthsQuery)
    .split(",")
    .map((item) => Number(item.trim()))
    .filter((num) => Number.isFinite(num) && num >= 1 && num <= 12);

  return values.length > 0
    ? values
    : Array.from({ length: 12 }, (_, index) => index + 1);
}

function normalizeCampusValue(value) {
  if (!value) return null;

  const raw = String(value).trim();
  const normalized = raw.toUpperCase();

  if (normalized === "ASHDOD") return "ASHDOD";
  if (normalized === "BEER_SHEVA") return "BEER_SHEVA";
  if (normalized === "BEER SHEVA") return "BEER_SHEVA";
  if (normalized === "BEERSHEVA") return "BEER_SHEVA";

  if (raw.includes("אשדוד")) return "ASHDOD";
  if (raw.includes("באר")) return "BEER_SHEVA";

  return null;
}

function normalizeOutcomeValue(value) {
  if (!value) return "אחר";

  const raw = String(value).trim();

  const map = {
    ENROLLED: "נרשם",
    NOT_RELEVANT: "לא רלוונטי",
    NOT_INTERESTED: "לא מעוניין",
    FOLLOWUP: "להמשך טיפול",
    SELF_CONTACT: "ייצור קשר בעצמו",
    OTHER: "אחר",

    "נרשם": "נרשם",
    "לא רלוונטי": "לא רלוונטי",
    "לא מעוניין": "לא מעוניין",
    "להמשך טיפול": "להמשך טיפול",
    "ייצור קשר בעצמו": "ייצור קשר בעצמו",
    "אחר": "אחר",
  };

  return map[raw] || "אחר";
}

function monthLabel(year, monthNumber) {
  return `${String(monthNumber).padStart(2, "0")}/${String(year).slice(-2)}`;
}

function buildEmptyOutcomeResult() {
  const result = {};

  for (const campusKey of campusKeys) {
    result[campusKey] = {
      campus: campusKey,
      items: outcomeOptions.map((item) => ({
        key: item.key,
        name: item.name,
        value: 0,
      })),
    };
  }

  return result;
}

async function getReport4Monthly(req, res) {
  try {
    const year = normalizeYear(req.query.year);
    const selectedMonthNumbers = normalizeMonthList(req.query.months);
    const selectedMonthSet = new Set(selectedMonthNumbers);

    const startDate = new Date(year, 0, 1);
    const endDate = new Date(year + 1, 0, 1);

    const consultations = await prisma.consultation.findMany({
      where: {
        meetingDate: {
          gte: startDate,
          lt: endDate,
        },
      },
      select: {
        meetingDate: true,
        arrived: true,
        lead: {
          select: {
            campus: true,
          },
        },
      },
    });

    const rows = selectedMonthNumbers.map((monthNumber) => ({
      month: String(monthNumber).padStart(2, "0"),
      label: monthLabel(year, monthNumber),
      invitedAshdod: 0,
      invitedBeer: 0,
      attendedAshdod: 0,
      attendedBeer: 0,
    }));

    const rowMap = new Map(rows.map((row) => [Number(row.month), row]));

    for (const consultation of consultations) {
      if (!consultation.meetingDate) continue;

      const consultationDate = new Date(consultation.meetingDate);
      const monthNumber = consultationDate.getMonth() + 1;

      if (!selectedMonthSet.has(monthNumber)) continue;

      const campus = normalizeCampusValue(consultation.lead?.campus);
      const row = rowMap.get(monthNumber);

      if (!campus || !row) continue;

      if (campus === "ASHDOD") {
        row.invitedAshdod += 1;
        if (consultation.arrived) row.attendedAshdod += 1;
      }

      if (campus === "BEER_SHEVA") {
        row.invitedBeer += 1;
        if (consultation.arrived) row.attendedBeer += 1;
      }
    }

    return res.json(rows);
  } catch (error) {
    console.error("getReport4Monthly error:", error);
    return res.status(500).json({
      message: "שגיאה בטעינת דוח 4 - נתוני פגישות חודשיים",
      error: error.message,
    });
  }
}

async function getReport4Outcomes(req, res) {
  try {
    const year = normalizeYear(req.query.year);
    const selectedMonthNumbers = normalizeMonthList(req.query.months);
    const selectedMonthSet = new Set(selectedMonthNumbers);

    const startDate = new Date(year, 0, 1);
    const endDate = new Date(year + 1, 0, 1);

    const consultations = await prisma.consultation.findMany({
      where: {
        meetingDate: {
          gte: startDate,
          lt: endDate,
        },
      },
      select: {
        meetingDate: true,
        outcome: true,
        lead: {
          select: {
            campus: true,
          },
        },
      },
    });

    const result = buildEmptyOutcomeResult();

    const itemMap = {};
    for (const campusKey of campusKeys) {
      itemMap[campusKey] = new Map(
        result[campusKey].items.map((item) => [item.key, item])
      );
    }

    for (const consultation of consultations) {
      if (!consultation.meetingDate) continue;

      const consultationDate = new Date(consultation.meetingDate);
      const monthNumber = consultationDate.getMonth() + 1;

      if (!selectedMonthSet.has(monthNumber)) continue;

      const campus = normalizeCampusValue(consultation.lead?.campus);
      if (!campus || !campusKeys.includes(campus)) continue;

      const outcomeKey = normalizeOutcomeValue(consultation.outcome);

      const target =
        itemMap[campus].get(outcomeKey) || itemMap[campus].get("אחר");

      if (target) {
        target.value += 1;
      }
    }

    return res.json(result);
  } catch (error) {
    console.error("getReport4Outcomes error:", error);
    return res.status(500).json({
      message: "שגיאה בטעינת דוח 4 - תוצאות פגישות ייעוץ",
      error: error.message,
    });
  }
}

module.exports = {
  getReport4Monthly,
  getReport4Outcomes,
};
