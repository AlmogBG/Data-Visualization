const BASE_URL =
  process.env.REACT_APP_API_BASE_URL ||
  "http://localhost:5001";

/*
 * מחזיר את טוקן ההתחברות השמור בדפדפן.
 */
function getStoredToken() {
  return (
    localStorage.getItem("token") ||
    sessionStorage.getItem("token")
  );
}

/*
 * מוחק את נתוני ההתחברות השמורים.
 */
function clearAuthenticationData() {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  localStorage.removeItem("loggedInUsername");
  localStorage.removeItem("loggedInEmail");
  localStorage.removeItem("loggedInRole");

  sessionStorage.removeItem("token");
  sessionStorage.removeItem("user");
  sessionStorage.removeItem("loggedInUsername");
  sessionStorage.removeItem("loggedInEmail");
  sessionStorage.removeItem("loggedInRole");
}

/*
 * מחזיר את המשתמש למסך ההתחברות.
 */
function redirectToLogin() {
  clearAuthenticationData();

  if (window.location.pathname !== "/login") {
    window.location.replace("/login");
  }
}

/*
 * שולח בקשה מאומתת ל-Backend.
 */
async function authenticatedFetch(path, options = {}) {
  const token = getStoredToken();

  if (!token) {
    redirectToLogin();

    throw new Error("נדרשת התחברות למערכת");
  }

  const response = await fetch(`${BASE_URL}${path}`, {
    ...options,

    headers: {
      ...(options.headers || {}),
      Authorization: `Bearer ${token}`,
    },
  });

  /*
   * 401 מציין שטוקן ההתחברות חסר,
   * אינו תקין או שפג תוקפו.
   */
  if (response.status === 401) {
    redirectToLogin();

    throw new Error(
      "תוקף ההתחברות פג. יש להתחבר מחדש"
    );
  }

  return response;
}

/*
 * קורא תשובת JSON ומטפל בשגיאות API.
 */
async function handleJson(res, fallbackMessage) {
  if (res.status === 204) {
    return null;
  }

  let data = null;

  try {
    data = await res.json();
  } catch (error) {
    data = null;
  }

  if (!res.ok) {
    throw new Error(
      data?.message || fallbackMessage
    );
  }

  return data;
}

/*
 * עדכון פרטי מועמד.
 */
export async function updateLead(id, payload) {
  const safeId = encodeURIComponent(id);

  const res = await authenticatedFetch(
    `/api/leads/${safeId}`,
    {
      method: "PUT",

      headers: {
        "Content-Type": "application/json",
      },

      body: JSON.stringify(payload),
    }
  );

  return handleJson(
    res,
    "שגיאה בעדכון מועמד"
  );
}

/*
 * טעינת אפשרויות הטופס.
 */
export async function getConsultationFormOptions() {
  const res = await authenticatedFetch(
    "/api/form/options"
  );

  return handleJson(
    res,
    "שגיאה בטעינת נתוני הטופס"
  );
}

/*
 * חיפוש מועמדים.
 */
export async function searchLeads(params) {
  const query = new URLSearchParams();

  Object.entries(params || {}).forEach(
    ([key, value]) => {
      if (
        value !== undefined &&
        value !== null &&
        String(value).trim() !== ""
      ) {
        query.append(
          key,
          String(value).trim()
        );
      }
    }
  );

  const queryString = query.toString();

  const path = queryString
    ? `/api/leads/search?${queryString}`
    : "/api/leads/search";

  const res = await authenticatedFetch(path);

  return handleJson(
    res,
    "שגיאה בחיפוש מועמדים"
  );
}

/*
 * יצירת מועמד חדש.
 */
export async function createLead(payload) {
  const res = await authenticatedFetch(
    "/api/leads",
    {
      method: "POST",

      headers: {
        "Content-Type": "application/json",
      },

      body: JSON.stringify(payload),
    }
  );

  return handleJson(
    res,
    "שגיאה ביצירת מועמד"
  );
}

/*
 * יצירת פגישת ייעוץ.
 */
export async function createConsultation(payload) {
  const res = await authenticatedFetch(
    "/api/consultations",
    {
      method: "POST",

      headers: {
        "Content-Type": "application/json",
      },

      body: JSON.stringify(payload),
    }
  );

  return handleJson(
    res,
    "שגיאה ביצירת פגישת ייעוץ"
  );
}

/*
 * קבלת פגישות קודמות של מועמד.
 */
export async function getLeadConsultations(
  leadId
) {
  const safeLeadId =
    encodeURIComponent(leadId);

  const res = await authenticatedFetch(
    `/api/consultations/lead/${safeLeadId}`
  );

  return handleJson(
    res,
    "שגיאה בטעינת פגישות המועמד"
  );
}

/*
 * עדכון פגישת ייעוץ.
 */
export async function updateConsultation(
  id,
  payload
) {
  const safeId = encodeURIComponent(id);

  const res = await authenticatedFetch(
    `/api/consultations/${safeId}`,
    {
      method: "PUT",

      headers: {
        "Content-Type": "application/json",
      },

      body: JSON.stringify(payload),
    }
  );

  return handleJson(
    res,
    "שגיאה בעדכון פגישת ייעוץ"
  );
}

/*
 * מחיקת פגישת ייעוץ.
 */
export async function deleteConsultation(id) {
  const safeId = encodeURIComponent(id);

  const res = await authenticatedFetch(
    `/api/consultations/${safeId}`,
    {
      method: "DELETE",
    }
  );

  return handleJson(
    res,
    "שגיאה במחיקת פגישת ייעוץ"
  );
}