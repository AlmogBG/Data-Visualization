const BASE_URL =
  process.env.REACT_APP_API_BASE_URL ||
  "http://localhost:5001";

/*
 * מחזיר את טוקן ההתחברות ששמור בדפדפן.
 */
function getStoredToken() {
  return (
    localStorage.getItem("token") ||
    sessionStorage.getItem("token")
  );
}

/*
 * מוחק את כל נתוני ההתחברות שנשמרו בדפדפן.
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
 * מחזיר את המשתמש למסך ההתחברות
 * כאשר הטוקן חסר או אינו תקין.
 */
function redirectToLogin() {
  clearAuthenticationData();

  if (window.location.pathname !== "/login") {
    window.location.replace("/login");
  }
}

/*
 * שולח בקשת API עם JWT בכותרת Authorization.
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
   * אם השרת דחה את הטוקן,
   * מוחקים את פרטי ההתחברות ומחזירים למסך הכניסה.
   */
  if (response.status === 401) {
    redirectToLogin();
  }

  return response;
}

/*
 * קורא תשובת JSON ומטפל בשגיאות API.
 */
async function handleJson(res, fallbackMessage) {
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
 * קבלת נתוני דף הבית.
 * הנתיב מוגן באמצעות JWT.
 */
export async function getHomeSummary() {
  const res = await authenticatedFetch(
    "/api/home/summary"
  );

  return handleJson(
    res,
    "שגיאה בטעינת נתוני דף הבית"
  );
}

/*
 * קבלת התראות חריגות.
 * גם הנתיב הזה מוגן כעת באמצעות JWT.
 */
export async function getAnomalies() {
  const res = await authenticatedFetch(
    "/api/stats/anomalies"
  );

  return handleJson(
    res,
    "שגיאה בטעינת ההתראות"
  );
}