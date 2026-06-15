const prisma = require("../config/db");

const SUSPICIOUS_EVENT_TYPES = [
  "LOGIN_FAILED",
  "LOGIN_RATE_LIMITED",
  "AUTHENTICATION_REQUIRED",
  "TOKEN_INVALID",
  "TOKEN_EXPIRED",
  "AUTHORIZATION_DENIED",
];

function createHourlyBuckets(now) {
  const buckets = [];

  for (let hoursAgo = 23; hoursAgo >= 0; hoursAgo -= 1) {
    const bucketDate = new Date(
      now.getTime() - hoursAgo * 60 * 60 * 1000
    );

    bucketDate.setMinutes(0, 0, 0);

    buckets.push({
      bucketStart: bucketDate.toISOString(),
      failedAttempts: 0,
      blockedEvents: 0,
      totalEvents: 0,
    });
  }

  return buckets;
}

function getHourKey(dateValue) {
  const date = new Date(dateValue);
  date.setMinutes(0, 0, 0);

  return date.toISOString();
}

function calculateSpikeDetection(logs, now) {
  const currentHourStart = new Date(now);
  currentHourStart.setMinutes(0, 0, 0);

  const previousFiveHoursStart = new Date(
    currentHourStart.getTime() -
      5 * 60 * 60 * 1000
  );

  let currentHourFailed = 0;
  let previousFiveHoursFailed = 0;

  logs.forEach((log) => {
    const createdAt = new Date(log.createdAt);

    if (createdAt >= currentHourStart) {
      currentHourFailed += 1;
      return;
    }

    if (
      createdAt >= previousFiveHoursStart &&
      createdAt < currentHourStart
    ) {
      previousFiveHoursFailed += 1;
    }
  });

  const baselineAverage =
    previousFiveHoursFailed / 5;

  /*
   * התראה מופעלת כאשר יש לפחות חמישה אירועים
   * חשודים בשעה הנוכחית, והכמות גדולה לפחות
   * פי שניים מהממוצע של חמש השעות הקודמות.
   */
  const spikeDetected =
    currentHourFailed >= 5 &&
    currentHourFailed >=
      Math.max(1, baselineAverage * 2);

  return {
    spikeDetected,
    currentHourFailed,
    baselineAverage: Number(
      baselineAverage.toFixed(1)
    ),
  };
}

async function getSecurityOverview(req, res) {
  try {
    const now = new Date();

    const last24Hours = new Date(
      now.getTime() - 24 * 60 * 60 * 1000
    );

    const last6Hours = new Date(
      now.getTime() - 6 * 60 * 60 * 1000
    );

    const [
      totalEvents,
      failedLogins,
      successfulLogins,
      blockedEvents,
      authorizationDenied,
      uniqueIpGroups,
      chartLogs,
      spikeLogs,
      recentBlockedEvents,
      recentEvents,
    ] = await Promise.all([
      prisma.securityLog.count({
        where: {
          createdAt: {
            gte: last24Hours,
          },
        },
      }),

      prisma.securityLog.count({
        where: {
          createdAt: {
            gte: last24Hours,
          },
          eventType: "LOGIN_FAILED",
        },
      }),

      prisma.securityLog.count({
        where: {
          createdAt: {
            gte: last24Hours,
          },
          eventType: "LOGIN_SUCCESS",
        },
      }),

      prisma.securityLog.count({
        where: {
          createdAt: {
            gte: last24Hours,
          },
          blocked: true,
        },
      }),

      prisma.securityLog.count({
        where: {
          createdAt: {
            gte: last24Hours,
          },
          eventType: "AUTHORIZATION_DENIED",
        },
      }),

      prisma.securityLog.groupBy({
        by: ["ipAddress"],
        where: {
          createdAt: {
            gte: last24Hours,
          },
        },
      }),

      prisma.securityLog.findMany({
        where: {
          createdAt: {
            gte: last24Hours,
          },
          eventType: {
            in: SUSPICIOUS_EVENT_TYPES,
          },
        },
        select: {
          eventType: true,
          blocked: true,
          createdAt: true,
        },
        orderBy: {
          createdAt: "asc",
        },
      }),

      prisma.securityLog.findMany({
        where: {
          createdAt: {
            gte: last6Hours,
          },
          eventType: {
            in: SUSPICIOUS_EVENT_TYPES,
          },
        },
        select: {
          createdAt: true,
        },
        orderBy: {
          createdAt: "asc",
        },
      }),

      prisma.securityLog.findMany({
        where: {
          blocked: true,
        },
        orderBy: {
          createdAt: "desc",
        },
        take: 20,
        select: {
          id: true,
          eventType: true,
          ipAddress: true,
          username: true,
          reason: true,
          route: true,
          method: true,
          statusCode: true,
          createdAt: true,
        },
      }),

      prisma.securityLog.findMany({
        orderBy: {
          createdAt: "desc",
        },
        take: 50,
        select: {
          id: true,
          eventType: true,
          ipAddress: true,
          username: true,
          reason: true,
          route: true,
          method: true,
          statusCode: true,
          blocked: true,
          details: true,
          createdAt: true,
        },
      }),
    ]);

    const hourlyActivity =
      createHourlyBuckets(now);

    const bucketsByHour = new Map(
      hourlyActivity.map((bucket) => [
        bucket.bucketStart,
        bucket,
      ])
    );

    chartLogs.forEach((log) => {
      const hourKey = getHourKey(
        log.createdAt
      );

      const bucket =
        bucketsByHour.get(hourKey);

      if (!bucket) {
        return;
      }

      bucket.failedAttempts += 1;
      bucket.totalEvents += 1;

      if (log.blocked) {
        bucket.blockedEvents += 1;
      }
    });

    const spike =
      calculateSpikeDetection(
        spikeLogs,
        now
      );

    return res.status(200).json({
      generatedAt: now.toISOString(),

      period: {
        hours: 24,
        from: last24Hours.toISOString(),
        to: now.toISOString(),
      },

      summary: {
        totalEvents,
        failedLogins,
        successfulLogins,
        blockedEvents,
        authorizationDenied,
        uniqueIpAddresses:
          uniqueIpGroups.length,
      },

      alert: {
        level: spike.spikeDetected
          ? "high"
          : "normal",

        spikeDetected:
          spike.spikeDetected,

        message:
          spike.spikeDetected
            ? "זוהתה עלייה חריגה באירועי האבטחה בשעה האחרונה"
            : "לא זוהתה כרגע פעילות חריגה",

        currentHourFailed:
          spike.currentHourFailed,

        baselineAverage:
          spike.baselineAverage,
      },

      hourlyActivity,
      recentBlockedEvents,
      recentEvents,
    });
  } catch (error) {
    console.error(
      "Security overview error:",
      error
    );

    return res.status(500).json({
      message:
        "שגיאה בטעינת נתוני האבטחה",
    });
  }
}

module.exports = {
  getSecurityOverview,
};