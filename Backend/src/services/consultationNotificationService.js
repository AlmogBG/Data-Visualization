const prisma = require("../config/db");

function buildConsultationPayload({ consultation, lead }) {
  return {
    action: "upsert",
    consultationId: consultation.id,
    eventId: consultation.googleEventId || "",
    title: `פגישת ייעוץ - ${lead?.fullName || "מועמד"}`,
    candidateName: lead?.fullName || "",
    phone: lead?.phone || "",
    email: lead?.email || "",
    campus: lead?.campus || "",
    department: lead?.department?.name || "",
    city: lead?.city?.town || "",
    source: lead?.source || "",
    notes: consultation?.notes || "",
    meetingDateTime: consultation.meetingDate,
    durationMinutes: 60,
  };
}

async function callAppsScript(payload) {
  const webhookUrl = process.env.GOOGLE_APPS_SCRIPT_WEBHOOK_URL;

  if (!webhookUrl) {
    return {
      ok: false,
      error: "Missing GOOGLE_APPS_SCRIPT_WEBHOOK_URL",
    };
  }

  try {
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const text = await response.text();

    console.log("Apps Script raw response:");
    console.log(text);

    try {
      return JSON.parse(text);
    } catch (parseError) {
      return {
        ok: false,
        error: `Apps Script did not return JSON. Raw response starts with: ${text.slice(
          0,
          200
        )}`,
      };
    }
  } catch (error) {
    return {
      ok: false,
      error: error.message,
    };
  }
}

async function upsertConsultationEvent({ consultation, lead }) {
  const payload = buildConsultationPayload({ consultation, lead });
  return callAppsScript(payload);
}

async function syncLeadConsultationsToCalendar({ lead, consultations }) {
  const results = [];

  for (const consultation of consultations) {
    if (!consultation.meetingDate) {
      results.push({
        consultationId: consultation.id,
        ok: false,
        error: "Missing meetingDate",
      });
      continue;
    }

    const syncResult = await upsertConsultationEvent({
      consultation,
      lead,
    });

    if (syncResult.ok && syncResult.eventId) {
      if (consultation.googleEventId !== syncResult.eventId) {
        await prisma.consultation.update({
          where: { id: consultation.id },
          data: {
            googleEventId: syncResult.eventId,
          },
        });
      }
    }

    results.push({
      consultationId: consultation.id,
      ...syncResult,
    });
  }

  return {
    ok: results.every((item) => item.ok),
    results,
  };
}

module.exports = {
  upsertConsultationEvent,
  syncLeadConsultationsToCalendar,
};