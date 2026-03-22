const BASE_URL =
  process.env.REACT_APP_API_BASE_URL || "http://localhost:10000";

async function handleJson(res, fallbackMessage) {
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || fallbackMessage);
  }
  return data;
}

export async function getConsultationFormOptions() {
  const res = await fetch(`${BASE_URL}/api/form/options`);
  return handleJson(res, "שגיאה בטעינת נתוני הטופס");
}

export async function searchLeads(params) {
  const query = new URLSearchParams();

  Object.entries(params || {}).forEach(([key, value]) => {
    if (value !== undefined && value !== null && String(value).trim() !== "") {
      query.append(key, value);
    }
  });

  const res = await fetch(`${BASE_URL}/api/leads/search?${query.toString()}`);
  return handleJson(res, "שגיאה בחיפוש מועמדים");
}

export async function createLead(payload) {
  const res = await fetch(`${BASE_URL}/api/leads`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  return handleJson(res, "שגיאה ביצירת מועמד");
}

export async function createConsultation(payload) {
  const res = await fetch(`${BASE_URL}/api/consultations`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  return handleJson(res, "שגיאה ביצירת פגישת ייעוץ");
}

export async function getLeadConsultations(leadId) {
  const res = await fetch(`${BASE_URL}/api/consultations/lead/${leadId}`);
  return handleJson(res, "שגיאה בטעינת פגישות המועמד");
}

export async function updateConsultation(id, payload) {
  const res = await fetch(`${BASE_URL}/api/consultations/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  return handleJson(res, "שגיאה בעדכון פגישת ייעוץ");
}