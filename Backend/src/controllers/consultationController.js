const prisma = require("../config/db");
const {
  upsertConsultationEvent,
  deleteConsultationFromCalendar,
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

function displayCampus(value) {
  if (!value) return "-";

  const cleaned = String(value).trim();

  if (cleaned === "ASHDOD") return "אשדוד";
  if (cleaned === "BEER_SHEVA") return "באר שבע";

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

function buildConsultationSnapshotData(lead, createdByUsername = null) {
  return {
    leadFullName: lead?.fullName || null,
    leadPhone: lead?.phone || null,
    leadEmail: lead?.email || null,
    leadCampus: displayCampus(lead?.campus),
    leadDepartmentName: lead?.department?.name || null,
    leadCityName: lead?.city?.town || null,
    leadSource: lead?.source || null,
    createdByUsername: normalizeNullableString(createdByUsername),
  };
}

function mapConsultationRow(item) {
  return {
    id: item.id,
    leadId: item.leadId,
    meetingDate: item.meetingDate,
    outcome: item.outcome,
    arrived: item.arrived,
    notes: item.notes,
    googleEventId: item.googleEventId,
    createdAt: item.createdAt,

    leadFullName: item.leadFullName,
    leadPhone: item.leadPhone,
    leadEmail: item.leadEmail,
    leadCampus: item.leadCampus,
    leadDepartmentName: item.leadDepartmentName,
    leadCityName: item.leadCityName,
    leadSource: item.leadSource,

    createdById: item.createdById,
    createdByUsername: item.createdByUsername,
  };
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
      consultations: lead.consultations.map(mapConsultationRow),
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
    const normalizedEmail =
      normalizeNullableString(email)?.toLowerCase() || null;
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
    const {
      leadId,
      meetingDate,
      outcome,
      arrived,
      notes,
      createdByUsername,
    } = req.body || {};

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

    let createdById = null;
    const cleanCreatedByUsername = normalizeNullableString(createdByUsername);

    if (cleanCreatedByUsername) {
      const user = await prisma.user.findUnique({
        where: { username: cleanCreatedByUsername },
        select: {
          idNumber: true,
          username: true,
        },
      });

      if (user) {
        createdById = user.idNumber;
      }
    }

    const snapshotData = buildConsultationSnapshotData(
      lead,
      cleanCreatedByUsername
    );

    let consultation = await prisma.consultation.create({
      data: {
        leadId: Number(leadId),
        meetingDate: new Date(meetingDate),
        outcome: normalizeNullableString(outcome),
        arrived: parseArrived(arrived),
        notes: normalizeNullableString(notes),

        leadFullName: snapshotData.leadFullName,
        leadPhone: snapshotData.leadPhone,
        leadEmail: snapshotData.leadEmail,
        leadCampus: snapshotData.leadCampus,
        leadDepartmentName: snapshotData.leadDepartmentName,
        leadCityName: snapshotData.leadCityName,
        leadSource: snapshotData.leadSource,

        createdById,
        createdByUsername: snapshotData.createdByUsername,
      },
      include: {
        lead: {
          include: {
            department: true,
            city: true,
          },
        },
        createdByUser: true,
      },
    });

    const syncResult = await upsertConsultationEvent({
      consultation,
      lead,
    });

    if (!syncResult?.ok) {
      await prisma.consultation.delete({
        where: { id: consultation.id },
      });

      return res.status(500).json({
        message: "פגישת הייעוץ לא נשמרה כי הסנכרון ליומן נכשל",
        syncResult,
      });
    }

    if (syncResult.eventId) {
      consultation = await prisma.consultation.update({
        where: { id: consultation.id },
        data: {
          googleEventId: syncResult.eventId,
        },
        include: {
          lead: {
            include: {
              department: true,
              city: true,
            },
          },
          createdByUser: true,
        },
      });
    }

    return res.status(201).json({
      ok: true,
      message: "פגישת הייעוץ נוצרה בהצלחה",
      consultation: mapConsultationRow(consultation),
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
          include: {
            createdByUser: true,
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

    return res.json({
      ok: true,
      lead: {
        id: lead.id,
        fullName: lead.fullName,
        phone: lead.phone,
        email: lead.email,
        campus: lead.campus,
        area: lead.area,
        status: lead.status,
        source: lead.source,
        department: lead.department,
        city: lead.city,
      },
      consultations: lead.consultations.map(mapConsultationRow),
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
    const normalizedEmail =
      normalizeNullableString(email)?.toLowerCase() || null;
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
        createdByUser: true,
      },
    });

    if (!existing) {
      return res.status(404).json({
        message: "פגישת הייעוץ לא נמצאה",
      });
    }

    const previousValues = {
      meetingDate: existing.meetingDate,
      outcome: existing.outcome,
      arrived: existing.arrived,
      notes: existing.notes,
      googleEventId: existing.googleEventId,
    };

    const fallbackSnapshot = buildConsultationSnapshotData(
      existing.lead,
      existing.createdByUsername
    );

    let updated = await prisma.consultation.update({
      where: { id: Number(id) },
      data: {
        ...(meetingDate ? { meetingDate: new Date(meetingDate) } : {}),
        outcome: normalizeNullableString(outcome),
        arrived: parseArrived(arrived),
        notes: normalizeNullableString(notes),

        leadFullName: existing.leadFullName || fallbackSnapshot.leadFullName,
        leadPhone: existing.leadPhone || fallbackSnapshot.leadPhone,
        leadEmail: existing.leadEmail || fallbackSnapshot.leadEmail,
        leadCampus: existing.leadCampus || fallbackSnapshot.leadCampus,
        leadDepartmentName:
          existing.leadDepartmentName || fallbackSnapshot.leadDepartmentName,
        leadCityName: existing.leadCityName || fallbackSnapshot.leadCityName,
        leadSource: existing.leadSource || fallbackSnapshot.leadSource,
        createdByUsername:
          existing.createdByUsername || fallbackSnapshot.createdByUsername,
      },
      include: {
        lead: {
          include: {
            department: true,
            city: true,
          },
        },
        createdByUser: true,
      },
    });

    const syncResult = await upsertConsultationEvent({
      consultation: updated,
      lead: updated.lead,
    });

    if (!syncResult?.ok) {
      await prisma.consultation.update({
        where: { id: Number(id) },
        data: previousValues,
      });

      return res.status(500).json({
        message: "פגישת הייעוץ לא עודכנה כי הסנכרון ליומן נכשל",
        syncResult,
      });
    }

    if (syncResult.eventId && updated.googleEventId !== syncResult.eventId) {
      updated = await prisma.consultation.update({
        where: { id: updated.id },
        data: {
          googleEventId: syncResult.eventId,
        },
        include: {
          lead: {
            include: {
              department: true,
              city: true,
            },
          },
          createdByUser: true,
        },
      });
    }

    return res.json({
      ok: true,
      message: "פגישת הייעוץ עודכנה בהצלחה",
      consultation: mapConsultationRow(updated),
      syncResult,
    });
  } catch (error) {
    console.error("updateConsultation error:", error);
    return res.status(500).json({
      message: "שגיאת שרת בעדכון פגישת ייעוץ",
    });
  }
}

async function deleteConsultation(req, res) {
  try {
    const { id } = req.params;

    const existing = await prisma.consultation.findUnique({
      where: { id: Number(id) },
    });

    if (!existing) {
      return res.status(404).json({
        message: "פגישת הייעוץ לא נמצאה",
      });
    }

    const deleteCalendarResult = await deleteConsultationFromCalendar({
      consultation: existing,
    });

    if (!deleteCalendarResult?.ok) {
      return res.status(500).json({
        message: "מחיקת פגישת הייעוץ נעצרה כי המחיקה מהיומן נכשלה",
        deleteCalendarResult,
      });
    }

    await prisma.consultation.delete({
      where: { id: Number(id) },
    });

    return res.json({
      ok: true,
      message: "פגישת הייעוץ נמחקה בהצלחה",
      deleteCalendarResult,
    });
  } catch (error) {
    console.error("deleteConsultation error:", error);
    return res.status(500).json({
      message: "שגיאת שרת במחיקת פגישת ייעוץ",
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
  deleteConsultation,
};