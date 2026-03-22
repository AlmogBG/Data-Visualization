const prisma = require("../config/db");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { sendVerificationCode } = require("../utils/mailer");

const pendingEmailUpdates = new Map();

function generateVerificationCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

async function login(req, res) {
  try {
    const { username, password } = req.body || {};

    console.log("========== LOGIN REQUEST ==========");
    console.log("username received:", username);

    if (!username || !password) {
      return res.status(400).json({ message: "חובה להזין שם משתמש וסיסמה" });
    }

    const user = await prisma.user.findUnique({
      where: { username },
    });

    console.log("user lookup in DB completed.");

    if (!user) {
      console.log("login failed: user not found in DB");
      console.log("==================================");
      return res.status(401).json({ message: "שם משתמש או סיסמה שגויים" });
    }

    console.log("user found in DB:", {
      idNumber: user.idNumber,
      username: user.username,
      fullName: user.fullName,
      email: user.email,
      role: user.role,
    });

    const passwordRow = await prisma.password.findUnique({
      where: { idNumber: user.idNumber },
    });

    if (!passwordRow) {
      console.log("login failed: password row not found in DB");
      console.log("==================================");
      return res.status(401).json({ message: "שם משתמש או סיסמה שגויים" });
    }

    const isMatch = await bcrypt.compare(password, passwordRow.passwordHash);

    if (!isMatch) {
      console.log("login failed: password mismatch");
      console.log("==================================");
      return res.status(401).json({ message: "שם משתמש או סיסמה שגויים" });
    }

    const token = jwt.sign(
      {
        username: user.username,
        idNumber: user.idNumber,
        role: user.role,
      },
      process.env.JWT_SECRET || "secret_key",
      { expiresIn: "8h" }
    );

    console.log("login success:");
    console.log({
      username: user.username,
      fullName: user.fullName,
      email: user.email,
      role: user.role,
    });
    console.log("==================================");

    return res.json({
      ok: true,
      token,
      username: user.username,
      email: user.email,
      role: user.role,
      fullName: user.fullName,
    });
  } catch (error) {
    console.error("login error full:", error);
    console.error("login error message:", error.message);
    return res.status(500).json({ message: "שגיאת שרת בהתחברות" });
  }
}

async function requestEmailChange(req, res) {
  try {
    const { username, email } = req.body || {};

    console.log("====== REQUEST EMAIL CHANGE ======");
    console.log("request received for username:", username);

    if (!username || !email) {
      return res.status(400).json({
        message: "חובה לשלוח שם משתמש ואימייל",
      });
    }

    const trimmedEmail = email.trim().toLowerCase();

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      return res.status(400).json({
        message: "כתובת האימייל אינה תקינה",
      });
    }

    const existingUser = await prisma.user.findUnique({
      where: { username },
    });

    if (!existingUser) {
      console.log("email change failed: user not found in DB");
      console.log("==================================");
      return res.status(404).json({
        message: "המשתמש לא נמצא",
      });
    }

    console.log("current user details from DB:");
    console.log({
      username: existingUser.username,
      fullName: existingUser.fullName,
      oldEmail: existingUser.email,
      role: existingUser.role,
    });

    if ((existingUser.email || "").toLowerCase() === trimmedEmail) {
      console.log("email change cancelled: new email is identical to current email");
      console.log("==================================");
      return res.status(400).json({
        message: "זהו כבר האימייל הנוכחי שלך",
      });
    }

    const emailOwner = await prisma.user.findUnique({
      where: { email: trimmedEmail },
    });

    if (emailOwner && emailOwner.username !== username) {
      console.log("email change failed: requested email already belongs to another user");
      console.log("==================================");
      return res.status(409).json({
        message: "כתובת האימייל כבר קיימת במערכת",
      });
    }

    const code = generateVerificationCode();
    const expiresAt = Date.now() + 10 * 60 * 1000;

    pendingEmailUpdates.set(username, {
      oldEmail: existingUser.email,
      newEmail: trimmedEmail,
      code,
      expiresAt,
      fullName: existingUser.fullName,
      role: existingUser.role,
    });

    await sendVerificationCode(trimmedEmail, code);

    console.log("verification email sent successfully.");
    console.log("pending email change saved:");
    console.log({
      username,
      fullName: existingUser.fullName,
      oldEmail: existingUser.email,
      newEmail: trimmedEmail,
      role: existingUser.role,
      expiresAt: new Date(expiresAt).toISOString(),
    });
    console.log("==================================");

    return res.json({
      ok: true,
      message: "קוד אימות נשלח לכתובת האימייל החדשה",
    });
  } catch (error) {
    console.error("requestEmailChange error full:", error);
    console.error("requestEmailChange error message:", error.message);
    return res.status(500).json({
      message: "שגיאה בעת שליחת קוד האימות",
    });
  }
}

async function verifyEmailChange(req, res) {
  try {
    const { username, code } = req.body || {};

    console.log("====== VERIFY EMAIL CHANGE ======");
    console.log("verification request received for username:", username);

    if (!username || !code) {
      return res.status(400).json({
        message: "חובה לשלוח שם משתמש וקוד אימות",
      });
    }

    const pending = pendingEmailUpdates.get(username);

    if (!pending) {
      console.log("verification failed: no pending email change request found");
      console.log("==================================");
      return res.status(400).json({
        message: "לא נמצאה בקשת אימות פעילה",
      });
    }

    if (Date.now() > pending.expiresAt) {
      pendingEmailUpdates.delete(username);
      console.log("verification failed: code expired");
      console.log("==================================");
      return res.status(400).json({
        message: "קוד האימות פג תוקף. נא לבקש קוד חדש",
      });
    }

    if (pending.code !== code.trim()) {
      console.log("verification failed: wrong verification code");
      console.log("==================================");
      return res.status(400).json({
        message: "קוד האימות שגוי",
      });
    }

    const beforeUpdate = await prisma.user.findUnique({
      where: { username },
    });

    const updatedUser = await prisma.user.update({
      where: { username },
      data: {
        email: pending.newEmail,
      },
    });

    pendingEmailUpdates.delete(username);

    console.log("email updated successfully in DB.");
    console.log("before update:");
    console.log({
      username: beforeUpdate.username,
      fullName: beforeUpdate.fullName,
      email: beforeUpdate.email,
      role: beforeUpdate.role,
    });

    console.log("after update:");
    console.log({
      username: updatedUser.username,
      fullName: updatedUser.fullName,
      email: updatedUser.email,
      role: updatedUser.role,
    });
    console.log("==================================");

    return res.json({
      ok: true,
      message: "האימייל עודכן בהצלחה",
      user: {
        username: updatedUser.username,
        email: updatedUser.email,
        role: updatedUser.role,
        fullName: updatedUser.fullName,
      },
    });
  } catch (error) {
    console.error("verifyEmailChange error full:", error);
    console.error("verifyEmailChange error message:", error.message);
    return res.status(500).json({
      message: "שגיאת שרת באימות הקוד",
    });
  }
}

module.exports = {
  login,
  requestEmailChange,
  verifyEmailChange,
};