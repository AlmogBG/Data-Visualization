const prisma = require("../config/db");
const {
  upsertConsultationEvent,
  syncLeadConsultationsToCalendar,
} = require("../services/consultationNotificationService");

function normalizeCampus(value) {
  if (!value) return null;

  const cleaned = String(value).trim();

  if (cleaned === "אשדוד" || cleaned.toUpperCase() === "ASHDOD") {
    return "ASHDOD";
  }

  if (
    cleaned === "באר שבע" ||
    cleaned === "באר-שבע" ||
    cleaned.toUpperCase() === "BEER_SHEVA"
  ) {
    return "BEER_SHEVA";
  }

  return cleaned;
}

function normalizeSource(value) {
  if (!value) return null;

  const cleaned = String(value).trim();

  if (cleaned === "פייסבוק") return "Facebook";
  if (cleaned === "אינסטגרם") return "Instagram";
  if (cleaned === "גוגל") return "Google Ads";
  if (cleaned === "אתר") return "Website";
  if (cleaned === "טלפון") return "Phone";
  if (cleaned === "המלצה") return "Referral";
  if (cleaned === "אחר") return "Other";

  return cleaned;
}

function validateLeadPayload({
  fullName,
  phone,
  campus,
  area,
  source,
  departmentId,
  cityId,
}) {
  return !!(
    fullName &&
    phone &&
    campus &&
    area &&
    source &&
    departmentId &&
    cityId
  );
}

function normalizeNullableString(value) {
  if (value === undefined || value === null) return null;
  const trimmed = String(value).trim();
  return trimmed === "" ? null : trimmed;
}

function parseArrived(value) {
  if (value === true || value === "true") return true;
  if (value === false || value === "false") return false;
  return null;
}

async function getConsultationFormOptions(req, res) {
  try {
    const [departments, cities] = await Promise.all([
      prisma.department.findMany({
        orderBy: { name: "asc" },
        select: {
          id: true,
          name: true,
        },
      }),
      prisma.city.findMany({
        orderBy: { town: "asc" },
        select: {
          id: true,
          town: true,
          region: true,
        },
      }),
    ]);

    return res.json({
      ok: true,
      departments,
      cities,
    });
  } catch (error) {
    console.error("getConsultationFormOptions error:", error);
    return res.status(500).json({
      message: "שגיאת שרת בשליפת נתוני הטופס",
    });
  }
}

async function searchLeads(req, res) {
  try {
    const { q = "", phone = "", email = "", fullName = "" } = req.query;

    const orConditions = [];

    if (q.trim()) {
      orConditions.push(
        { fullName: { contains: q.trim(), mode: "insensitive" } },
        { phone: { contains: q.trim(), mode: "insensitive" } },
        { email: { contains: q.trim(), mode: "insensitive" } }
      );
    }

    if (phone.trim()) {
      orConditions.push({
        phone: { contains: phone.trim(), mode: "insensitive" },
      });
    }

    if (email.trim()) {
      orConditions.push({
        email: { contains: email.trim(), mode: "insensitive" },
      });
    }

    if (fullName.trim()) {
      orConditions.push({
        fullName: { contains: fullName.trim(), mode: "insensitive" },
      });
    }

    if (orConditions.length === 0) {
      return res.json({
        ok: true,
        rows: [],
      });
    }

    const leads = await prisma.lead.findMany({
      where: {
        OR: orConditions,
      },
      include: {
        department: true,
        city: true,
        consultations: {
          orderBy: {
            meetingDate: "desc",
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 20,
    });

    const rows = leads.map((lead) => ({
      id: lead.id,
      fullName: lead.fullName,
      phone: lead.phone,
      email: lead.email,
      campus: lead.campus,
      area: lead.area,
      status: lead.status,
      source: lead.source,
      createdAt: lead.createdAt,
      department: lead.department
        ? {
            id: lead.department.id,
            name: lead.department.name,
          }
        : null,
      city: lead.city
        ? {
            id: lead.city.id,
            town: lead.city.town,
            region: lead.city.region,
          }
        : null,
      consultationsCount: lead.consultations.length,
      consultations: lead.consultations.map((c) => ({
        id: c.id,
        meetingDate: c.meetingDate,
        outcome: c.outcome,
        arrived: c.arrived,
        notes: c.notes,
        createdAt: c.createdAt,
      })),
    }));

    return res.json({
      ok: true,
      rows,
    });
  } catch (error) {
    console.error("searchLeads error:", error);
    return res.status(500).json({
      message: "שגיאת שרת בחיפוש מועמדים",
    });
  }
}

async function createLead(req, res) {
  try {
    const {
      fullName,
      phone,
      email,
      campus,
      area,
      source,
      departmentId,
      cityId,
    } = req.body || {};

    if (
      !validateLeadPayload({
        fullName,
        phone,
        campus,
        area,
        source,
        departmentId,
        cityId,
      })
    ) {
      return res.status(400).json({
        message: "חובה למלא את כל שדות החובה של המועמד",
      });
    }

    const trimmedPhone = phone.trim();
    const normalizedEmail = normalizeNullableString(email)?.toLowerCase() || null;
    const normalizedCampus = normalizeCampus(campus);
    const normalizedSource = normalizeSource(source);

    const duplicateConditions = [{ phone: trimmedPhone }];
    if (normalizedEmail) {
      duplicateConditions.push({ email: normalizedEmail });
    }

    const existingLead = await prisma.lead.findFirst({
      where: {
        OR: duplicateConditions,
      },
      include: {
        department: true,
        city: true,
      },
    });

    if (existingLead) {
      return res.status(409).json({
        message: "כבר קיים מועמד עם אותו טלפון או אימייל",
        existingLead: {
          id: existingLead.id,
          fullName: existingLead.fullName,
          phone: existingLead.phone,
          email: existingLead.email,
          campus: existingLead.campus,
          area: existingLead.area,
          status: existingLead.status,
          source: existingLead.source,
          department: existingLead.department,
          city: existingLead.city,
        },
      });
    }

    const lead = await prisma.lead.create({
      data: {
        fullName: fullName.trim(),
        phone: trimmedPhone,
        email: normalizedEmail,
        campus: normalizedCampus,
        area: area.trim(),
        source: normalizedSource,
        status: "IN_PROGRESS",
        departmentId: Number(departmentId),
        cityId: Number(cityId),
      },
      include: {
        department: true,
        city: true,
      },
    });

    return res.status(201).json({
      ok: true,
      message: "המועמד נוצר בהצלחה",
      lead,
    });
  } catch (error) {
    console.error("createLead error:", error);
    return res.status(500).json({
      message: "שגיאת שרת ביצירת מועמד",
    });
  }
}

async function createConsultation(req, res) {
  try {
    const { leadId, meetingDate, outcome, arrived, notes } = req.body || {};

    if (!leadId || !meetingDate) {
      return res.status(400).json({
        message: "חובה לשלוח מועמד ותאריך פגישה",
      });
    }

    const lead = await prisma.lead.findUnique({
      where: { id: Number(leadId) },
      include: {
        department: true,
        city: true,
      },
    });

    if (!lead) {
      return res.status(404).json({
        message: "המועמד לא נמצא",
      });
    }

    let consultation = await prisma.consultation.create({
      data: {
        leadId: Number(leadId),
        meetingDate: new Date(meetingDate),
        outcome: normalizeNullableString(outcome),
        arrived: parseArrived(arrived),
        notes: normalizeNullableString(notes),
      },
    });

    const syncResult = await upsertConsultationEvent({
      consultation,
      lead,
    });

    if (syncResult.ok && syncResult.eventId) {
      consultation = await prisma.consultation.update({
        where: { id: consultation.id },
        data: {
          googleEventId: syncResult.eventId,
        },
      });
    }

    console.log("consultation created successfully:", {
      id: consultation.id,
      leadId: consultation.leadId,
      meetingDate: consultation.meetingDate,
      outcome: consultation.outcome,
      arrived: consultation.arrived,
      notes: consultation.notes,
      googleEventId: consultation.googleEventId,
      syncResult,
    });

    return res.status(201).json({
      ok: true,
      message: "פגישת הייעוץ נוצרה בהצלחה",
      consultation,
      syncResult,
    });
  } catch (error) {
    console.error("createConsultation error:", error);
    return res.status(500).json({
      message: "שגיאת שרת ביצירת פגישת ייעוץ",
    });
  }
}

async function getLeadConsultations(req, res) {
  try {
    const { leadId } = req.params;

    const lead = await prisma.lead.findUnique({
      where: { id: Number(leadId) },
      include: {
        consultations: {
          orderBy: {
            meetingDate: "desc",
          },
        },
        department: true,
        city: true,
      },
    });

    if (!lead) {
      return res.status(404).json({
        message: "המועמד לא נמצא",
      });
    }

    const syncResult = await syncLeadConsultationsToCalendar({
      lead,
      consultations: lead.consultations,
    });

    const refreshedLead = await prisma.lead.findUnique({
      where: { id: Number(leadId) },
      include: {
        consultations: {
          orderBy: {
            meetingDate: "desc",
          },
        },
        department: true,
        city: true,
      },
    });

    return res.json({
      ok: true,
      lead: {
        id: refreshedLead.id,
        fullName: refreshedLead.fullName,
        phone: refreshedLead.phone,
        email: refreshedLead.email,
        campus: refreshedLead.campus,
        area: refreshedLead.area,
        status: refreshedLead.status,
        source: refreshedLead.source,
        department: refreshedLead.department,
        city: refreshedLead.city,
      },
      consultations: refreshedLead.consultations,
      syncResult,
    });
  } catch (error) {
    console.error("getLeadConsultations error:", error);
    return res.status(500).json({
      message: "שגיאת שרת בשליפת פגישות המועמד",
    });
  }
}

async function updateLead(req, res) {
  try {
    const { id } = req.params;
    const {
      fullName,
      phone,
      email,
      campus,
      area,
      source,
      departmentId,
      cityId,
    } = req.body || {};

    if (
      !validateLeadPayload({
        fullName,
        phone,
        campus,
        area,
        source,
        departmentId,
        cityId,
      })
    ) {
      return res.status(400).json({
        message: "חובה למלא את כל שדות החובה של המועמד",
      });
    }

    const existingLead = await prisma.lead.findUnique({
      where: { id: Number(id) },
      include: {
        department: true,
        city: true,
      },
    });

    if (!existingLead) {
      return res.status(404).json({
        message: "המועמד לא נמצא",
      });
    }

    const trimmedPhone = phone.trim();
    const normalizedEmail = normalizeNullableString(email)?.toLowerCase() || null;
    const normalizedCampus = normalizeCampus(campus);
    const normalizedSource = normalizeSource(source);

    const duplicateLead = await prisma.lead.findFirst({
      where: {
        id: { not: Number(id) },
        OR: [
          { phone: trimmedPhone },
          ...(normalizedEmail ? [{ email: normalizedEmail }] : []),
        ],
      },
    });

    if (duplicateLead) {
      return res.status(409).json({
        message: "כבר קיים מועמד אחר עם אותו טלפון או אימייל",
      });
    }

    const beforeUpdate = {
      id: existingLead.id,
      fullName: existingLead.fullName,
      phone: existingLead.phone,
      email: existingLead.email,
      campus: existingLead.campus,
      area: existingLead.area,
      source: existingLead.source,
      status: existingLead.status,
      departmentId: existingLead.departmentId,
      departmentName: existingLead.department?.name || null,
      cityId: existingLead.cityId,
      cityName: existingLead.city?.town || null,
    };

    const updatedLead = await prisma.lead.update({
      where: { id: Number(id) },
      data: {
        fullName: fullName.trim(),
        phone: trimmedPhone,
        email: normalizedEmail,
        campus: normalizedCampus,
        area: area.trim(),
        source: normalizedSource,
        departmentId: Number(departmentId),
        cityId: Number(cityId),
      },
      include: {
        department: true,
        city: true,
      },
    });

    const afterUpdate = {
      id: updatedLead.id,
      fullName: updatedLead.fullName,
      phone: updatedLead.phone,
      email: updatedLead.email,
      campus: updatedLead.campus,
      area: updatedLead.area,
      source: updatedLead.source,
      status: updatedLead.status,
      departmentId: updatedLead.departmentId,
      departmentName: updatedLead.department?.name || null,
      cityId: updatedLead.cityId,
      cityName: updatedLead.city?.town || null,
    };

    console.log("lead updated successfully:");
    console.log("before:", beforeUpdate);
    console.log("after:", afterUpdate);

    return res.json({
      ok: true,
      message: "פרטי המועמד עודכנו בהצלחה",
      lead: updatedLead,
    });
  } catch (error) {
    console.error("updateLead error:", error);
    return res.status(500).json({
      message: "שגיאת שרת בעדכון מועמד",
    });
  }
}

async function updateConsultation(req, res) {
  try {
    const { id } = req.params;
    const { meetingDate, outcome, arrived, notes } = req.body || {};

    const existing = await prisma.consultation.findUnique({
      where: { id: Number(id) },
      include: {
        lead: {
          include: {
            department: true,
            city: true,
          },
        },
      },
    });

    if (!existing) {
      return res.status(404).json({
        message: "פגישת הייעוץ לא נמצאה",
      });
    }

    let updated = await prisma.consultation.update({
      where: { id: Number(id) },
      data: {
        ...(meetingDate ? { meetingDate: new Date(meetingDate) } : {}),
        outcome: normalizeNullableString(outcome),
        arrived: parseArrived(arrived),
        notes: normalizeNullableString(notes),
      },
      include: {
        lead: {
          include: {
            department: true,
            city: true,
          },
        },
      },
    });

    const syncResult = await upsertConsultationEvent({
      consultation: updated,
      lead: updated.lead,
    });

    if (syncResult.ok && syncResult.eventId) {
      updated = await prisma.consultation.update({
        where: { id: updated.id },
        data: {
          googleEventId: syncResult.eventId,
        },
      });
    }

    console.log("consultation updated successfully:", {
      id: updated.id,
      leadId: updated.leadId,
      meetingDate: updated.meetingDate,
      outcome: updated.outcome,
      arrived: updated.arrived,
      notes: updated.notes,
      googleEventId: updated.googleEventId,
      syncResult,
    });

    return res.json({
      ok: true,
      message: "פגישת הייעוץ עודכנה בהצלחה",
      consultation: updated,
      syncResult,
    });
  } catch (error) {
    console.error("updateConsultation error:", error);
    return res.status(500).json({
      message: "שגיאת שרת בעדכון פגישת ייעוץ",
    });
  }
}

module.exports = {
  getConsultationFormOptions,
  searchLeads,
  createLead,
  updateLead,
  createConsultation,
  getLeadConsultations,
  updateConsultation,
};