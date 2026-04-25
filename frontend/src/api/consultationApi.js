const BASE_URL =
  process.env.REACT_APP_API_BASE_URL || "http://188.245.161.194:5000";

async function handleJson(res, fallbackMessage) {
  let data = null;

  try {
    data = await res.json();
  } catch (error) {
    data = null;
  }

  if (!res.ok) {
    throw new Error(data?.message || fallbackMessage);
  }

  return data;
}

export async function updateLead(id, payload) {
  const res = await fetch(`${BASE_URL}/api/leads/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  return handleJson(res, "שגיאה בעדכון מועמד");
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

  const queryString = query.toString();
  const url = queryString
    ? `${BASE_URL}/api/leads/search?${queryString}`
    : `${BASE_URL}/api/leads/search`;

  const res = await fetch(url);
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

export async function deleteConsultation(id) {
  const res = await fetch(`${BASE_URL}/api/consultations/${id}`, {
    method: "DELETE",
  });

  return handleJson(res, "שגיאה במחיקת פגישת ייעוץ");
}