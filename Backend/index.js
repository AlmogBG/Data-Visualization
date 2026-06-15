require("dotenv").config();

const express = require("express");
const cors = require("cors");
const rateLimit = require("express-rate-limit");

const authRoutes = require("./src/routes/authRoutes");
const consultationRoutes = require("./src/routes/consultationRoutes");
const statsRoutes = require("./src/routes/statsRoutes");
const securityRoutes = require("./src/routes/securityRoutes");

const {
  authenticateToken,
  authorizeRoles,
} = require("./src/middleware/authMiddleware");

const {
  getHomeSummary,
} = require("./src/controllers/homeController");

const {
  getReport1Comparison,
} = require("./src/controllers/report1Controller");

const {
  getReport2Comparison,
} = require("./src/controllers/report2Controller");

const {
  getReport4Monthly,
  getReport4Outcomes,
} = require("./src/controllers/report4Controller");

const {
  getReport5Media,
} = require("./src/controllers/report5Controller");

const app = express();

const PORT = process.env.PORT || 5000;

/*
 * התפקידים שרשאים לצפות בדף הבית.
 */
const HOME_ROLES = [
  "Manager",
  "Management Employee",
];

/*
 * כתובות ה-Frontend שמורשות לפנות ל-Backend.
 */
const defaultAllowedOrigins = [
  "http://localhost:3000",
  "http://188.245.161.194:3000",
];

const envAllowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS
      .split(",")
      .map((origin) => origin.trim())
      .filter(Boolean)
  : [];

const allowedOrigins = [
  ...new Set([
    ...defaultAllowedOrigins,
    ...envAllowedOrigins,
  ]),
];

/*
 * הגדרת CORS.
 */
app.use(
  cors({
    origin: (origin, callback) => {
      /*
       * בקשות מהכתובות המורשות מתקבלות.
       *
       * בקשות ללא Origin, כמו curl ובדיקות שרת,
       * מתקבלות גם הן.
       */
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(
        new Error("Not allowed by CORS")
      );
    },

    credentials: true,
  })
);

/*
 * קריאת גוף בקשות בפורמט JSON.
 */
app.use(express.json());

/*
 * בדיקה האם הבקשה הגיעה מהמחשב המקומי.
 */
function isLocalhostRequest(req) {
  const ip =
    req.ip ||
    req.socket?.remoteAddress ||
    req.connection?.remoteAddress ||
    "";

  return (
    ip === "127.0.0.1" ||
    ip === "::1" ||
    ip === "::ffff:127.0.0.1" ||
    ip.includes("127.0.0.1")
  );
}

/*
 * הגבלת קצב כללית לכל נתיבי ה-API.
 */
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 300,

  standardHeaders: true,
  legacyHeaders: false,

  statusCode: 429,

  message: {
    message:
      "Too many requests, please try again later.",
  },

  /*
   * בסביבת פיתוח לא מפעילים את ההגבלה הכללית
   * על בקשות שמגיעות מ-localhost.
   *
   * הגבלת ניסיונות ההתחברות ממשיכה לפעול
   * בתוך authRoutes.js.
   */
  skip: (req) => {
    return (
      process.env.NODE_ENV !== "production" &&
      isLocalhostRequest(req)
    );
  },
});

app.use("/api", apiLimiter);

/*
 * בדיקת בריאות השרת.
 *
 * הנתיב ציבורי ואינו מחזיר מידע רגיש.
 */
app.get("/health", (req, res) => {
  return res.status(200).json({
    status: "ok",
    message: "Backend is running",
  });
});

/*
 * נתיבי התחברות ושינוי פרופיל.
 */
app.use("/api/auth", authRoutes);

/*
 * נתיבי מועמדים ופגישות ייעוץ.
 *
 * ההרשאות מוגדרות בתוך consultationRoutes.js.
 */
app.use("/api", consultationRoutes);

/*
 * נתיבי סטטיסטיקות.
 *
 * /api/stats/cities
 * נגיש רק ל-Manager ומשמש את דוח 3.
 *
 * /api/stats/anomalies
 * נגיש לשני התפקידים ומשמש את דף הבית.
 */
app.use("/api/stats", statsRoutes);

/*
 * נתוני SIEM Lite.
 *
 * ההגנה על הנתיבים מוגדרת בתוך securityRoutes.js:
 * JWT תקין ותפקיד Manager בלבד.
 */
app.use(
  "/api/security",
  securityRoutes
);

/*
 * נתוני דף הבית.
 *
 * נגישים ל-Manager ול-Management Employee.
 */
app.get(
  "/api/home/summary",
  authenticateToken,
  authorizeRoles(...HOME_ROLES),
  getHomeSummary
);

/*
 * דוח 1 — Manager בלבד.
 */
app.get(
  "/api/report1/comparison",
  authenticateToken,
  authorizeRoles("Manager"),
  getReport1Comparison
);

/*
 * דוח 2 — Manager בלבד.
 */
app.get(
  "/api/report2/comparison",
  authenticateToken,
  authorizeRoles("Manager"),
  getReport2Comparison
);

/*
 * דוח 3 משתמש בנתיב:
 * /api/stats/cities
 *
 * ההרשאה מוגדרת בתוך statsRoutes.js.
 */

/*
 * דוח 4 — נתונים חודשיים.
 * Manager בלבד.
 */
app.get(
  "/api/report4/monthly",
  authenticateToken,
  authorizeRoles("Manager"),
  getReport4Monthly
);

/*
 * דוח 4 — תוצאות פגישות.
 * Manager בלבד.
 */
app.get(
  "/api/report4/outcomes",
  authenticateToken,
  authorizeRoles("Manager"),
  getReport4Outcomes
);

/*
 * דוח 5 — Manager בלבד.
 */
app.get(
  "/api/report5/media",
  authenticateToken,
  authorizeRoles("Manager"),
  getReport5Media
);

/*
 * הפעלת השרת.
 */
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);

  console.log(
    "Allowed frontend origins:",
    allowedOrigins
  );

  console.log("Available routes:");

  console.log(
    "GET    /health [public]"
  );

  console.log(
    "POST   /api/auth/login [public]"
  );

  console.log(
    "POST   /api/auth/profile/request-email-change"
  );

  console.log(
    "POST   /api/auth/profile/verify-email-change"
  );

  console.log(
    "GET    /api/home/summary [Manager + Management Employee]"
  );

  console.log(
    "GET    /api/form/options [Manager + Management Employee]"
  );

  console.log(
    "GET    /api/leads/search [Manager + Management Employee]"
  );

  console.log(
    "POST   /api/leads [Manager + Management Employee]"
  );

  console.log(
    "PUT    /api/leads/:id [Manager + Management Employee]"
  );

  console.log(
    "POST   /api/consultations [Manager + Management Employee]"
  );

  console.log(
    "GET    /api/consultations/lead/:leadId [Manager + Management Employee]"
  );

  console.log(
    "PUT    /api/consultations/:id [Manager + Management Employee]"
  );

  console.log(
    "DELETE /api/consultations/:id [Manager + Management Employee]"
  );

  console.log(
    "GET    /api/stats [public route check]"
  );

  console.log(
    "GET    /api/stats/cities [Manager only]"
  );

  console.log(
    "GET    /api/stats/anomalies [Manager + Management Employee]"
  );

  console.log(
    "GET    /api/security/overview [Manager only]"
  );

  console.log(
    "GET    /api/report1/comparison [Manager only]"
  );

  console.log(
    "GET    /api/report2/comparison [Manager only]"
  );

  console.log(
    "GET    /api/report4/monthly [Manager only]"
  );

  console.log(
    "GET    /api/report4/outcomes [Manager only]"
  );

  console.log(
    "GET    /api/report5/media [Manager only]"
  );
});