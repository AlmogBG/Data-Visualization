const prisma = require("../config/db");

function normalizeDisplayValue(value) {
  if (value === undefined || value === null || String(value).trim() === "") {
    return "-";
  }

  return String(value).trim();
}

function displayCampus(value) {
  if (!value) return "-";

  const cleaned = String(value).trim();

  if (cleaned === "ASHDOD") return "אשדוד";
  if (cleaned === "BEER_SHEVA") return "באר שבע";

  return cleaned;
}

function buildConsultationPayload({ consultation, lead }) {
  const candidateName = normalizeDisplayValue(
    consultation?.leadFullName || lead?.fullName
  );

  return {
    action: "upsert",
    consultationId: consultation.id,
    eventId: consultation.googleEventId || "",
    title: `פגישת ייעוץ - ${candidateName}`,

    candidateName,
    phone: normalizeDisplayValue(consultation?.leadPhone || lead?.phone),
    email: normalizeDisplayValue(consultation?.leadEmail || lead?.email),
    campus: normalizeDisplayValue(
      consultation?.leadCampus || displayCampus(lead?.campus)
    ),
    department: normalizeDisplayValue(
      consultation?.leadDepartmentName || lead?.department?.name
    ),
    city: normalizeDisplayValue(consultation?.leadCityName || lead?.city?.town),
    source: normalizeDisplayValue(consultation?.leadSource || lead?.source),
    createdByUsername: normalizeDisplayValue(consultation?.createdByUsername),

    notes: normalizeDisplayValue(consultation?.notes),
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
        error: "Apps Script did not return valid JSON",
        raw: text,
        status: response.status,
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