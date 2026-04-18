const prisma = require("../config/db");

async function notifyConsultationCreated({ consultation, lead }) {
  const webhookUrl = process.env.GOOGLE_APPS_SCRIPT_WEBHOOK_URL;

  if (!webhookUrl) {
    return {
      ok: false,
      error: "Missing GOOGLE_APPS_SCRIPT_WEBHOOK_URL",
    };
  }

  const payload = {
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

module.exports = {
  notifyConsultationCreated,
};