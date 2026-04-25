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
    meetingDateTime: consultation?.meetingDate,
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
  if (!consultation?.meetingDate) {
    return {
      ok: false,
      error: "Missing meetingDate",
    };
  }

  const payload = buildConsultationPayload({ consultation, lead });
  const syncResult = await callAppsScript(payload);

  if (
    syncResult.ok &&
    syncResult.eventId &&
    consultation.googleEventId !== syncResult.eventId
  ) {
    await prisma.consultation.update({
      where: { id: consultation.id },
      data: {
        googleEventId: syncResult.eventId,
      },
    });
  }

  return syncResult;
}

async function deleteConsultationFromCalendar({ consultation }) {
  return callAppsScript({
    action: "delete",
    consultationId: consultation.id,
    eventId: consultation.googleEventId || "",
  });
}

module.exports = {
  upsertConsultationEvent,
  deleteConsultationFromCalendar,
};