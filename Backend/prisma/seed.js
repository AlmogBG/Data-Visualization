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

const campuses = ["ASHDOD", "BEER_SHEVA"];
const sources = ["Facebook", "Instagram", "Google", "TikTok", "Referral"];
const statuses = ["NEW", "IN_PROGRESS", "CONTACTED", "CLOSED"];
const outcomes = ["נרשם", "לא נרשם", "במעקב"];

function rand(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomDateInLast18Months() {
  const now = new Date();
  const start = new Date();
  start.setMonth(start.getMonth() - 18);
  return new Date(start.getTime() + Math.random() * (now.getTime() - start.getTime()));
}

async function main() {
  console.log("Seeding started...");

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

  const departmentRows = await prisma.department.findMany();
  const cityRows = await prisma.city.findMany();

  const existingLeads = await prisma.lead.count();
  if (existingLeads > 0) {
    console.log(`Skipping lead creation. Found ${existingLeads} existing leads.`);
    console.log("Seed completed.");
    return;
  }

  const leadsToCreate = [];

  for (let i = 1; i <= 300; i++) {
    const department = rand(departmentRows);
    const city = rand(cityRows);
    const createdAt = randomDateInLast18Months();

    leadsToCreate.push({
      fullName: `נרשם ${i}`,
      phone: `050${String(1000000 + i).slice(-7)}`,
      email: `lead${i}@example.com`,
      campus: rand(campuses),
      area: city.region,
      status: rand(statuses),
      source: rand(sources),
      createdAt,
      departmentId: department.id,
      cityId: city.id,
    });
  }

  await prisma.lead.createMany({
    data: leadsToCreate,
  });

  const leads = await prisma.lead.findMany({
    select: { id: true, createdAt: true },
  });

  const consultationsToCreate = [];

  for (const lead of leads) {
    if (Math.random() < 0.7) {
      const meetingDate = new Date(lead.createdAt);
      meetingDate.setDate(meetingDate.getDate() + Math.floor(Math.random() * 30) + 1);

      consultationsToCreate.push({
        leadId: lead.id,
        meetingDate,
        outcome: rand(outcomes),
        arrived: Math.random() < 0.75,
        createdAt: lead.createdAt,
      });
    }
  }

  if (consultationsToCreate.length > 0) {
    await prisma.consultation.createMany({
      data: consultationsToCreate,
    });
  }

  console.log(`Inserted ${leadsToCreate.length} leads`);
  console.log(`Inserted ${consultationsToCreate.length} consultations`);
  console.log("Seed completed.");
}

main()
  .catch((e) => {
    console.error("Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();


  });