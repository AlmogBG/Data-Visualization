const nodemailer = require("nodemailer");

function hasSmtpConfig() {
  return (
    process.env.SMTP_HOST &&
    process.env.SMTP_PORT &&
    process.env.SMTP_USER &&
    process.env.SMTP_PASS
  );
}

async function sendVerificationCode(email, code) {
  if (!hasSmtpConfig()) {
    console.log("======================================");
    console.log("SMTP not configured. Using dev fallback.");
    console.log(`Verification code for ${email}: ${code}`);
    console.log("======================================");
    return { success: true, devMode: true };
  }

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: Number(process.env.SMTP_PORT) === 465,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  await transporter.verify();

  const from = process.env.SMTP_FROM || process.env.SMTP_USER;

  await transporter.sendMail({
    from,
    to: email,
    subject: "קוד אימות לעדכון כתובת אימייל",
    html: `
      <div dir="rtl" style="font-family: Arial, sans-serif; line-height: 1.8;">
        <h2>אימות שינוי כתובת אימייל</h2>
        <p>התקבלה בקשה לעדכון כתובת האימייל שלך במערכת.</p>
        <p>קוד האימות שלך הוא:</p>
        <div style="font-size: 28px; font-weight: bold; letter-spacing: 6px; margin: 16px 0;">
          ${code}
        </div>
        <p>הקוד תקף ל-10 דקות.</p>
        <p>אם לא ביקשת לשנות את האימייל, אפשר להתעלם מהודעה זו.</p>
      </div>
    `,
  });

  return { success: true, devMode: false };
}

module.exports = {
  sendVerificationCode,
};