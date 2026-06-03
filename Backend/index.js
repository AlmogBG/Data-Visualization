require("dotenv").config();

const express = require("express");
const cors = require("cors");
const rateLimit = require("express-rate-limit");

const authRoutes = require("./src/routes/authRoutes");
const consultationRoutes = require("./src/routes/consultationRoutes");
const statsRoutes = require("./src/routes/statsRoutes");

const { getHomeSummary } = require("./src/controllers/homeController");
const { getReport1Comparison } = require("./src/controllers/report1Controller");
const { getReport2Comparison } = require("./src/controllers/report2Controller");
const {
  getReport4Monthly,
  getReport4Outcomes,
} = require("./src/controllers/report4Controller");
const { getReport5Media } = require("./src/controllers/report5Controller");

const app = express();

const PORT = process.env.PORT || 5000;

const defaultAllowedOrigins = [
  "http://localhost:3000",
  "http://188.245.161.194:3000",
];

const envAllowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(",").map((origin) => origin.trim())
  : [];

const allowedOrigins = [...defaultAllowedOrigins, ...envAllowedOrigins];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
  })
);

app.use(express.json());

function isLocalhostRequest(req) {
  const ip = req.ip || req.connection?.remoteAddress || "";

  return (
    ip === "127.0.0.1" ||
    ip === "::1" ||
    ip === "::ffff:127.0.0.1" ||
    ip.includes("127.0.0.1")
  );
}

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  statusCode: 429,
  message: {
    message: "Too many requests, please try again later.",
  },

  // בפיתוח ובבדיקות מקומיות לא חוסמים localhost,
  // כדי לאפשר להריץ Smoke Tests בלי Rate Limit.
  skip: (req) => {
    return process.env.NODE_ENV !== "production" && isLocalhostRequest(req);
  },
});

app.use("/api", apiLimiter);

app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    message: "Backend is running",
  });
});

app.use("/api/auth", authRoutes);
app.use("/api", consultationRoutes);
app.use("/api/stats", statsRoutes);

app.get("/api/home/summary", getHomeSummary);

app.get("/api/report1/comparison", getReport1Comparison);
app.get("/api/report2/comparison", getReport2Comparison);

app.get("/api/report4/monthly", getReport4Monthly);
app.get("/api/report4/outcomes", getReport4Outcomes);

app.get("/api/report5/media", getReport5Media);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log("Allowed frontend origins:", allowedOrigins);
  console.log("Available routes:");
  console.log("GET    /health");
  console.log("GET    /api/home/summary");
  console.log("POST   /api/auth/login");
  console.log("GET    /api/form/options");
  console.log("GET    /api/leads/search");
  console.log("POST   /api/leads");
  console.log("PUT    /api/leads/:id");
  console.log("POST   /api/consultations");
  console.log("GET    /api/consultations/lead/:leadId");
  console.log("PUT    /api/consultations/:id");
  console.log("DELETE /api/consultations/:id");
  console.log("GET    /api/stats");
  console.log("GET    /api/stats/cities");
  console.log("GET    /api/stats/anomalies");
  console.log("GET    /api/report1/comparison");
  console.log("GET    /api/report2/comparison");
  console.log("GET    /api/report4/monthly");
  console.log("GET    /api/report4/outcomes");
  console.log("GET    /api/report5/media");
});