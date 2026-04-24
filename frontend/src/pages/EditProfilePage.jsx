import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import TopNavbar from "../components/TopNavbar";
import Sidebar from "../components/Sidebar";

const API_BASE_URL =
  process.env.REACT_APP_API_BASE_URL || "http://188.245.161.194:5000";

export default function EditProfilePage() {
  const navigate = useNavigate();

  const [menuOpen, setMenuOpen] = useState(false);
  const [username, setUsername] = useState("");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [codeSent, setCodeSent] = useState(false);
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);

  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
    const loggedInUsername = localStorage.getItem("loggedInUsername") || "";

    setUsername(storedUser.username || loggedInUsername || "");
    setFullName(storedUser.fullName || "");
    setEmail(storedUser.email || localStorage.getItem("loggedInEmail") || "");
  }, []);

  const handleSendCode = async (e) => {
    e.preventDefault();

    const trimmedEmail = email.trim().toLowerCase();

    if (!trimmedEmail) {
      alert("חובה להזין אימייל");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      alert("נא להזין כתובת אימייל תקינה");
      return;
    }

    try {
      setSending(true);

      const res = await fetch(
        `${API_BASE_URL}/api/auth/profile/request-email-change`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            username,
            email: trimmedEmail,
          }),
        }
      );

      const data = await res.json();

      if (!res.ok) {
        alert(data.message || "שליחת קוד האימות נכשלה");
        return;
      }

      setCodeSent(true);
      alert("קוד אימות נשלח לכתובת האימייל החדשה");
    } catch (error) {
      console.error("Request email change error:", error);
      alert("שגיאה בחיבור לשרת");
    } finally {
      setSending(false);
    }
  };

  const handleVerifyCode = async (e) => {
    e.preventDefault();

    if (!verificationCode.trim()) {
      alert("חובה להזין קוד אימות");
      return;
    }

    try {
      setVerifying(true);

      const res = await fetch(
        `${API_BASE_URL}/api/auth/profile/verify-email-change`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            username,
            code: verificationCode.trim(),
          }),
        }
      );

      const data = await res.json();

      if (!res.ok) {
        alert(data.message || "אימות הקוד נכשל");
        return;
      }

      const updatedUser = {
        username: data.user.username,
        email: data.user.email,
        role: data.user.role,
        fullName: data.user.fullName,
      };

      localStorage.setItem("user", JSON.stringify(updatedUser));
      localStorage.setItem("loggedInUsername", updatedUser.username || "");
      localStorage.setItem("loggedInEmail", updatedUser.email || "");
      localStorage.setItem("loggedInRole", updatedUser.role || "");

      alert("האימייל עודכן בהצלחה");
      navigate("/home", { replace: true });
    } catch (error) {
      console.error("Verify email code error:", error);
      alert("שגיאה בחיבור לשרת");
    } finally {
      setVerifying(false);
    }
  };

  return (
    <div dir="rtl" className="min-h-screen bg-[#2e3038] text-white">
      <TopNavbar />
      <Sidebar isOpen={menuOpen} onToggle={() => setMenuOpen((s) => !s)} />

      <div className="mx-auto max-w-6xl px-6 pt-28">
        <div className="mt-8 text-center">
          <h1 className="text-3xl font-extrabold tracking-tight">
            עריכת פרטים אישיים
          </h1>
          <p className="mt-2 text-sm text-white/75">
            כאן ניתן לעדכן את כתובת האימייל של המשתמש
          </p>
        </div>

        <div className="mx-auto mt-10 max-w-2xl rounded-[32px] bg-[#3b3e47] p-8 shadow-[0_18px_60px_rgba(0,0,0,0.40)]">
          <form className="space-y-5">
            <div>
              <label className="mb-2 block text-sm font-semibold text-white/90">
                שם מלא
              </label>
              <input
                type="text"
                value={fullName}
                readOnly
                className="w-full rounded-2xl bg-white/10 px-5 py-4 text-white/80 outline-none ring-white/8"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-white/90">
                אימייל
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="הזן אימייל חדש"
                className="w-full rounded-2xl bg-white/10 px-5 py-4 text-white placeholder:text-white/35 outline-none ring-white/8 transition focus:ring-2 focus:ring-white/20"
              />
            </div>

            {codeSent && (
              <div>
                <label className="mb-2 block text-sm font-semibold text-white/90">
                  קוד אימות
                </label>
                <input
                  type="text"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value)}
                  placeholder="הזן את הקוד שנשלח למייל"
                  className="w-full rounded-2xl bg-white/10 px-5 py-4 text-white placeholder:text-white/35 outline-none ring-white/8 transition focus:ring-2 focus:ring-white/20"
                />
              </div>
            )}

            <div className="flex gap-3 pt-2">
              {!codeSent ? (
                <button
                  type="button"
                  onClick={handleSendCode}
                  disabled={sending}
                  className="w-full rounded-2xl px-4 py-4 text-lg font-bold text-white transition-all duration-300
                  bg-gradient-to-l from-[#5a6072] via-[#4f5567] to-[#444958]
                  shadow-[0_10px_30px_rgba(0,0,0,0.22)]
                  ring-1 ring-white/10
                  hover:from-[#6b7287] hover:via-[#596077] hover:to-[#4d5366]
                  hover:shadow-[0_16px_38px_rgba(0,0,0,0.30)]
                  hover:-translate-y-[1px]
                  active:translate-y-0
                  disabled:opacity-70 disabled:hover:translate-y-0"
                >
                  {sending ? "שולח קוד..." : "שמור שינויים"}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleVerifyCode}
                  disabled={verifying}
                  className="w-full rounded-2xl px-4 py-4 text-lg font-bold text-white transition-all duration-300
                  bg-gradient-to-l from-[#5a6072] via-[#4f5567] to-[#444958]
                  shadow-[0_10px_30px_rgba(0,0,0,0.22)]
                  ring-1 ring-white/10
                  hover:from-[#6b7287] hover:via-[#596077] hover:to-[#4d5366]
                  hover:shadow-[0_16px_38px_rgba(0,0,0,0.30)]
                  hover:-translate-y-[1px]
                  active:translate-y-0
                  disabled:opacity-70 disabled:hover:translate-y-0"
                >
                  {verifying ? "מאמת..." : "אמת קוד ועדכן אימייל"}
                </button>
              )}

              <button
                type="button"
                onClick={() => navigate("/home")}
                className="w-full rounded-2xl px-4 py-4 text-lg font-bold text-white transition-all duration-300
                bg-white/10
                shadow-[0_10px_30px_rgba(0,0,0,0.18)]
                ring-1 ring-white/10
                hover:bg-white/15"
              >
                ביטול
              </button>
            </div>
          </form>
        </div>

        <div className="pb-16" />
      </div>
    </div>
  );
}