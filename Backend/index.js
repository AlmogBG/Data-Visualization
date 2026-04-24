require("dotenv").config();

const express = require("express");
const cors = require("cors");

const authRoutes = require("./src/routes/authRoutes");
const consultationRoutes = require("./src/routes/consultationRoutes");

const { getLeadsByCity } = require("./src/controllers/statsController");
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

const envAllowedOrigins = process.env.FRONTEND_ORIGIN
  ? process.env.FRONTEND_ORIGIN.split(",")
      .map((origin) => origin.trim())
      .filter(Boolean)
  : [];

const allowedOrigins = Array.from(
  new Set([...defaultAllowedOrigins, ...envAllowedOrigins])
);

app.use(
  cors({
    origin(origin, callback) {
      if (!origin) {
        return callback(null, true);
      }

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      console.warn(`CORS blocked origin: ${origin}`);
      return callback(new Error(`CORS blocked origin: ${origin}`));
    },
    credentials: true,
  })
);

app.use(express.json());

app.get("/health", (req, res) => {
  return res.json({
    ok: true,
    message: "Server is running",
  });
});

app.get("/api/home/summary", getHomeSummary);

app.use("/api/auth", authRoutes);
app.use("/auth", authRoutes);
app.use("/api", consultationRoutes);

app.get("/api/stats", (req, res) => {
  return res.json({
    ok: true,
    message: "Stats routes working",
  });
});

app.get("/api/stats/cities", getLeadsByCity);

app.get("/api/report1/comparison", getReport1Comparison);
app.get("/api/report2/comparison", getReport2Comparison);

app.get("/api/report4/monthly", getReport4Monthly);
app.get("/api/report4/outcomes", getReport4Outcomes);

app.get("/api/report5/media", getReport5Media);

app.use((req, res) => {
  return res.status(404).json({
    message: "Route not found",
    path: req.originalUrl,
  });
});

app.use((err, req, res, next) => {
  console.error("Server error:", err.message);

  return res.status(500).json({
    message: "Internal server error",
    error: process.env.NODE_ENV === "development" ? err.message : undefined,
  });
});

app.listen(PORT, "0.0.0.0", () => {
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
  console.log("GET    /api/stats/cities");
  console.log("GET    /api/report1/comparison");
  console.log("GET    /api/report2/comparison");
  console.log("GET    /api/report4/monthly");
  console.log("GET    /api/report4/outcomes");
  console.log("GET    /api/report5/media");
});
