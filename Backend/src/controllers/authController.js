const prisma = require("../config/db");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

async function login(req, res) {
  try {
    console.log("login body:", req.body);

    const { username, password } = req.body || {};

    if (!username || !password) {
      return res.status(400).json({ message: "חובה להזין שם משתמש וסיסמה" });
    }

    const user = await prisma.user.findUnique({
      where: { username },
    });

    console.log("user found:", user);

    if (!user) {
      return res.status(401).json({ message: "שם משתמש או סיסמה שגויים" });
    }

    const passwordRow = await prisma.password.findUnique({
      where: { idNumber: user.idNumber },
    });

    console.log("password row:", passwordRow);

    if (!passwordRow) {
      return res.status(401).json({ message: "שם משתמש או סיסמה שגויים" });
    }

    const isMatch = await bcrypt.compare(password, passwordRow.passwordHash);
    console.log("password match:", isMatch);

    if (!isMatch) {
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

async function updateProfile(req, res) {
  try {
    const { username, email, role } = req.body;

    if (!username || !email || !role) {
      return res.status(400).json({
        message: "חובה לשלוח שם משתמש, אימייל ותפקיד",
      });
    }

    const updatedUser = await prisma.user.update({
      where: { username },
      data: {
        email,
        role,
      },
    });

    return res.json({
      ok: true,
      message: "הפרופיל עודכן בהצלחה",
      user: {
        username: updatedUser.username,
        email: updatedUser.email,
        role: updatedUser.role,
      },
    });
  } catch (error) {
    console.error("updateProfile error:", error);
    return res.status(500).json({
      message: "שגיאת שרת בעדכון פרופיל",
    });
  }
}

module.exports = {
  login,
  updateProfile,
};