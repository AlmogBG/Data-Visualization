const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

const departments = [
  "הנדסת תוכנה",
  "מדעי המחשב",
  "הנדסת בניין",
  "הנדסת מכונות",
  "הנדסת תעשייה וניהול",
  "הנדסת חשמל",
  "תקשורת חזותית",
];

const cities = [
  { town: "אשדוד", region: "SOUTH" },
  { town: "אשקלון", region: "SOUTH" },
  { town: "באר שבע", region: "SOUTH" },
  { town: "קריית גת", region: "SOUTH" },
  { town: "קריית מלאכי", region: "SOUTH" },
  { town: "יבנה", region: "CENTER" },
  { town: "גן יבנה", region: "CENTER" },
  { town: "רחובות", region: "CENTER" },
  { town: "ראשון לציון", region: "CENTER" },
  { town: "נס ציונה", region: "CENTER" },
  { town: "חולון", region: "CENTER" },
  { town: "בת ים", region: "CENTER" },
  { town: "רמלה", region: "CENTER" },
  { town: "לוד", region: "CENTER" },
  { town: "תל אביב", region: "CENTER" },
  { town: "נהריה", region: "NORTH" },
  { town: "חיפה", region: "NORTH" },
  { town: "עכו", region: "NORTH" },
];

const firstNames = ["יואב", "נועה", "דניאל", "מאיה", "איתי", "שירה", "אור", "רוני", "אלון", "תמר", "אופיר", "ליאור"];
const lastNames = ["כהן", "לוי", "מזרחי", "ביטון", "פרץ", "אברהם", "גבאי", "דהן", "אזולאי", "שמעוני"];

const sources = ["Instagram", "Google Ads", "Facebook", "TikTok", "Referral", "LinkedIn", "Website"];
const statuses = ["NEW", "CONTACTED", "IN_PROGRESS", "נקבעה פגישה", "רלוונטי", "נרשם", "CLOSED"];
const outcomes = ["נרשם", "להמשך טיפול", "יצירת קשר חוזרת", "לא מעוניין", "לא רלוונטי", "אחר"];

function rand(seed) {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

function pick(arr, seed) {
  return arr[Math.floor(rand(seed) * arr.length)];
}

function weightedPick(items, seed) {
  const total = items.reduce((sum, item) => sum + item.weight, 0);
  let value = rand(seed) * total;

  for (const item of items) {
    value -= item.weight;
    if (value <= 0) return item.value;
  }

  return items[items.length - 1].value;
}

function makeDate(year, month, index) {
  const day = 1 + Math.floor(rand(year * 1000 + month * 40 + index) * 25);
  const hour = 8 + Math.floor(rand(year * 2000 + month * 60 + index) * 9);
  return new Date(year, month - 1, day, hour, 0, 0, 0);
}

async function ensureBaseTables() {
  for (const name of departments) {
    await prisma.department.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }

  for (const city of cities) {
    await prisma.city.upsert({
      where: { town: city.town },
      update: { region: city.region },
      create: city,
    });
  }
}

async function clearOldDemoData() {
  const leads = await prisma.lead.findMany({
    where: {
      OR: [
        { email: { endsWith: "@example.com" } },
        { email: { endsWith: "@demo.sce.ac.il" } },
        { email: { endsWith: "@small-demo.sce.ac.il" } },
      ],
    },
    select: { id: true },
  });

  const ids = leads.map((lead) => lead.id);

  console.log("Old demo leads to delete:", ids.length);

  if (ids.length > 0) {
    await prisma.consultation.deleteMany({
      where: { leadId: { in: ids } },
    });

    await prisma.lead.deleteMany({
      where: { id: { in: ids } },
    });
  }
}

async function main() {
  console.log("Small realistic seed started...");

  await ensureBaseTables();
  await clearOldDemoData();

  const departmentRows = await prisma.department.findMany({ orderBy: { id: "asc" } });
  const cityRows = await prisma.city.findMany({ orderBy: { id: "asc" } });

  const software = departmentRows.find((d) => d.name === "הנדסת תוכנה");
  const cs = departmentRows.find((d) => d.name === "מדעי המחשב");
  const industrial = departmentRows.find((d) => d.name === "הנדסת תעשייה וניהול");
  const electrical = departmentRows.find((d) => d.name === "הנדסת חשמל");
  const mechanical = departmentRows.find((d) => d.name === "הנדסת מכונות");
  const civil = departmentRows.find((d) => d.name === "הנדסת בניין");
  const visual = departmentRows.find((d) => d.name === "תקשורת חזותית");

  const deptWeights = [
    { value: software, weight: 23 },
    { value: cs, weight: 18 },
    { value: industrial, weight: 17 },
    { value: electrical, weight: 14 },
    { value: mechanical, weight: 11 },
    { value: civil, weight: 9 },
    { value: visual, weight: 8 },
  ].filter((x) => x.value);

  const leadsToCreate = [];
  let index = 1;

  const plan = [
    { year: 2022, months: [1, 3, 5, 7, 9, 11], perMonth: 3 },
    { year: 2023, months: [1, 3, 5, 7, 9, 11], perMonth: 4 },
    { year: 2024, months: [1, 2, 4, 5, 7, 8, 10, 11], perMonth: 5 },
    { year: 2025, months: [1, 2, 3, 5, 6, 7, 9, 10, 11, 12], perMonth: 6 },
    { year: 2026, months: [1, 2, 3, 4], perMonth: 5 },
    { year: 2026, months: [5], perMonth: 18 },
  ];

  for (const group of plan) {
    for (const month of group.months) {
      for (let i = 0; i < group.perMonth; i++) {
        const seed = group.year * 100000 + month * 1000 + i;

        const city = weightedPick(
          cityRows.map((cityRow) => ({
            value: cityRow,
            weight:
              cityRow.town === "אשדוד" || cityRow.town === "באר שבע" || cityRow.town === "אשקלון"
                ? 10
                : cityRow.region === "SOUTH"
                ? 7
                : cityRow.region === "CENTER"
                ? 5
                : 2,
          })),
          seed + 1
        );

        const campus =
          city.region === "SOUTH"
            ? weightedPick([{ value: "ASHDOD", weight: 58 }, { value: "BEER_SHEVA", weight: 42 }], seed + 2)
            : weightedPick([{ value: "ASHDOD", weight: 72 }, { value: "BEER_SHEVA", weight: 28 }], seed + 2);

        const status = weightedPick(
          [
            { value: "NEW", weight: 17 },
            { value: "CONTACTED", weight: 23 },
            { value: "IN_PROGRESS", weight: 26 },
            { value: "נקבעה פגישה", weight: 15 },
            { value: "רלוונטי", weight: 9 },
            { value: "נרשם", weight: 7 },
            { value: "CLOSED", weight: 3 },
          ],
          seed + 3
        );

        leadsToCreate.push({
          fullName: `${pick(firstNames, seed + 4)} ${pick(lastNames, seed + 5)}`,
          phone: `05${String(30000000 + index).slice(-8)}`,
          email: `small.lead${index}@small-demo.sce.ac.il`,
          campus,
          area: city.region,
          status,
          source: weightedPick(
            [
              { value: "Instagram", weight: 22 },
              { value: "Google Ads", weight: 20 },
              { value: "Facebook", weight: 17 },
              { value: "Referral", weight: 13 },
              { value: "TikTok", weight: 11 },
              { value: "LinkedIn", weight: 9 },
              { value: "Website", weight: 8 },
            ],
            seed + 6
          ),
          createdAt: makeDate(group.year, month, i),
          departmentId: weightedPick(deptWeights, seed + 7).id,
          cityId: city.id,
        });

        index++;
      }
    }
  }

  await prisma.lead.createMany({ data: leadsToCreate });

  const demoLeads = await prisma.lead.findMany({
    where: { email: { endsWith: "@small-demo.sce.ac.il" } },
    orderBy: { id: "asc" },
    select: { id: true, createdAt: true },
  });

  const consultationsToCreate = [];

  for (const lead of demoLeads) {
    const seed = lead.id * 77;

    if (rand(seed) > 0.52) continue;

    const meetingDate = new Date(lead.createdAt);
    meetingDate.setDate(meetingDate.getDate() + 3 + Math.floor(rand(seed + 1) * 21));

    const arrived = rand(seed + 2) < 0.88;

    consultationsToCreate.push({
      leadId: lead.id,
      meetingDate,
      arrived,
      outcome: arrived
        ? weightedPick(
            [
              { value: "נרשם", weight: 25 },
              { value: "להמשך טיפול", weight: 32 },
              { value: "יצירת קשר חוזרת", weight: 20 },
              { value: "לא מעוניין", weight: 12 },
              { value: "לא רלוונטי", weight: 7 },
              { value: "אחר", weight: 4 },
            ],
            seed + 3
          )
        : weightedPick(
            [
              { value: "לא מעוניין", weight: 45 },
              { value: "לא רלוונטי", weight: 35 },
              { value: "אחר", weight: 20 },
            ],
            seed + 4
          ),
      notes: "נתון דמה מצומצם ואמין לצורך הצגת הפרויקט",
      createdAt: lead.createdAt,
    });
  }

  const now = new Date();
  const currentMonthLeads = demoLeads
    .filter((lead) => {
      const date = new Date(lead.createdAt);
      return date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth();
    })
    .slice(0, 8);

  currentMonthLeads.forEach((lead, idx) => {
    const meetingDate = new Date(now);

    if (idx < 2) {
      meetingDate.setHours(10 + idx * 2, 0, 0, 0);
    } else {
      meetingDate.setDate(now.getDate() + idx + 1);
      meetingDate.setHours(9 + (idx % 5), 0, 0, 0);
    }

    consultationsToCreate.push({
      leadId: lead.id,
      meetingDate,
      arrived: idx < 2 ? true : null,
      outcome: idx < 2 ? "להמשך טיפול" : "יצירת קשר חוזרת",
      notes: "פגישת ייעוץ קרובה לצורך הצגת דשבורד",
      createdAt: lead.createdAt,
    });
  });

  await prisma.consultation.createMany({ data: consultationsToCreate });

  const [totalLeads, totalConsultations] = await Promise.all([
    prisma.lead.count(),
    prisma.consultation.count(),
  ]);

  console.log("Small realistic seed completed successfully.");
  console.log(`Inserted demo leads: ${leadsToCreate.length}`);
  console.log(`Inserted demo consultations: ${consultationsToCreate.length}`);
  console.log({ totalLeads, totalConsultations });
}

main()
  .catch((error) => {
    console.error("Seed failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
