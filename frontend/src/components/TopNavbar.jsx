import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  HiOutlineChevronDown,
  HiOutlineUserCircle,
  HiOutlineHome,
  HiOutlineDocumentChartBar,
  HiOutlineChartBar,
  HiOutlineMap,
  HiOutlinePresentationChartLine,
  HiOutlineUsers,
  HiOutlineMegaphone,
  HiOutlinePencilSquare,
  HiOutlineArrowRightOnRectangle,
  HiOutlineXMark,
} from "react-icons/hi2";

const API_BASE_URL =
  process.env.REACT_APP_API_BASE_URL || "http://localhost:10000";

const reports = [
  {
    key: "home",
    label: "דף הבית",
    path: "/home",
    icon: HiOutlineHome,
  },
  {
    key: "report1",
    label: "דוח 1 - השוואת נרשמים",
    path: "/report1",
    icon: HiOutlinePresentationChartLine,
  },
  {
    key: "report2",
    label: "דוח 2 - ביקושי מחלקות",
    path: "/report2",
    icon: HiOutlineChartBar,
  },
  {
    key: "report3",
    label: "דוח 3 - מפת מגורי נרשמים",
    path: "/report3",
    icon: HiOutlineMap,
  },
  {
    key: "report4",
    label: "דוח 4 - ניתוח הגעה לייעוץ",
    path: "/report4",
    icon: HiOutlineUsers,
  },
  {
    key: "report5",
    label: "דוח 5 - לידים ומדיה",
    path: "/report5",
    icon: HiOutlineMegaphone,
  },
];

export default function TopNavbar() {
  const location = useLocation();
  const navigate = useNavigate();

  const [reportsOpen, setReportsOpen] = useState(false);
  const [userOpen, setUserOpen] = useState(false);
  const [profileModalOpen, setProfileModalOpen] = useState(false);

  const reportsDropdownRef = useRef(null);
  const userDropdownRef = useRef(null);

  const [userName, setUserName] = useState("משתמש");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    try {
      const storedUsername =
        localStorage.getItem("loggedInUsername") ||
        sessionStorage.getItem("loggedInUsername") ||
        "משתמש";

      const storedEmail =
        localStorage.getItem("loggedInEmail") ||
        sessionStorage.getItem("loggedInEmail") ||
        "";

      const storedRole =
        localStorage.getItem("loggedInRole") ||
        sessionStorage.getItem("loggedInRole") ||
        "";

      setUserName(storedUsername);
      setEmail(storedEmail);
      setRole(storedRole);
    } catch (err) {
      setUserName("משתמש");
      setEmail("");
      setRole("");
    }
  }, []);

  useEffect(() => {
    function handleClickOutside(event) {
      if (
        reportsDropdownRef.current &&
        !reportsDropdownRef.current.contains(event.target)
      ) {
        setReportsOpen(false);
      }

      if (
        userDropdownRef.current &&
        !userDropdownRef.current.contains(event.target)
      ) {
        setUserOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    setReportsOpen(false);
    setUserOpen(false);
  }, [location.pathname]);

  const activeItem = reports.find((r) => r.path === location.pathname);

  const menuButtonLabel =
    !activeItem || activeItem.path === "/home"
      ? "מעבר בין דוחות"
      : activeItem.label;

  async function handleSaveProfile() {
    try {
      setSaving(true);

      const username =
        localStorage.getItem("loggedInUsername") ||
        sessionStorage.getItem("loggedInUsername");

      const token =
        localStorage.getItem("token") || sessionStorage.getItem("token");

      const res = await fetch(`${API_BASE_URL}/api/auth/profile`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          username,
          email,
          role,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.message || "שמירת הפרופיל נכשלה");
      }

      try {
        if (localStorage.getItem("loggedInUsername")) {
          localStorage.setItem("loggedInEmail", email);
          localStorage.setItem("loggedInRole", role);
        }

        if (sessionStorage.getItem("loggedInUsername")) {
          sessionStorage.setItem("loggedInEmail", email);
          sessionStorage.setItem("loggedInRole", role);
        }
      } catch (err) {}

      alert("הפרופיל עודכן בהצלחה");
      setProfileModalOpen(false);
    } catch (error) {
      alert(error.message || "אירעה שגיאה בעדכון הפרופיל");
    } finally {
      setSaving(false);
    }
  }

  function handleLogout() {
  try {
    localStorage.removeItem("token");
    localStorage.removeItem("loggedInUsername");
    localStorage.removeItem("loggedInEmail");
    localStorage.removeItem("loggedInRole");

    sessionStorage.removeItem("token");
    sessionStorage.removeItem("loggedInUsername");
    sessionStorage.removeItem("loggedInEmail");
    sessionStorage.removeItem("loggedInRole");
  } catch (err) {}

  navigate("/login", { replace: true });

  setTimeout(() => {
    window.history.pushState(null, "", "/login");
  }, 0);
}

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-white/10 bg-[#2e3038]/95 backdrop-blur-md shadow-[0_10px_30px_rgba(0,0,0,0.25)]">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-6">
          {/* Right side - reports menu */}
          <div className="relative" ref={reportsDropdownRef}>
            <button
              type="button"
              onClick={() => setReportsOpen((s) => !s)}
              className="flex items-center gap-2 rounded-full bg-white/5 px-4 py-2 text-white ring-1 ring-white/10 transition hover:bg-white/10"
            >
              <HiOutlineDocumentChartBar className="text-xl text-sky-300" />
              <span className="font-semibold">{menuButtonLabel}</span>
              <HiOutlineChevronDown
                className={`transition ${reportsOpen ? "rotate-180" : ""}`}
              />
            </button>

            {reportsOpen && (
              <div className="absolute right-0 mt-3 w-[320px] overflow-hidden rounded-2xl border border-white/10 bg-[#3b3e47] shadow-[0_20px_50px_rgba(0,0,0,0.35)]">
                <div className="border-b border-white/10 px-4 py-3 text-sm font-bold text-white">
                  מעבר בין דוחות
                </div>

                <div className="max-h-[420px] overflow-y-auto p-2">
                  {reports.map((item) => {
                    const Icon = item.icon;
                    const active = location.pathname === item.path;

                    return (
                      <Link
                        key={item.key}
                        to={item.path}
                        className={[
                          "mb-1 flex items-center gap-3 rounded-xl px-3 py-3 transition",
                          active
                            ? "bg-sky-500/20 text-sky-100 ring-1 ring-sky-300/20"
                            : "text-white/85 hover:bg-white/8",
                        ].join(" ")}
                      >
                        <Icon className="text-xl text-sky-300" />
                        <span className="text-sm font-medium">{item.label}</span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Center - logo */}
          <div className="text-center">
            <Link to="/home" className="inline-flex items-center justify-center">
              <div className="inline-flex items-center justify-center rounded-2xl bg-white px-4 py-2 shadow-sm ring-1 ring-black/10">
                <img
                  src="/SCE_logo.png"
                  alt="SCE"
                  className="h-9 w-auto"
                  onError={(e) => (e.currentTarget.style.display = "none")}
                />
              </div>
            </Link>
          </div>

          {/* Left side - user */}
          <div className="relative" ref={userDropdownRef}>
            <button
              type="button"
              onClick={() => setUserOpen((s) => !s)}
              className="flex items-center gap-2 rounded-full bg-white/5 px-4 py-2 ring-1 ring-white/10 transition hover:bg-white/10"
            >
              <HiOutlineUserCircle className="text-3xl text-sky-300" />
              <div className="text-right leading-tight">
                <div className="text-xs text-white/60">מחובר כעת</div>
                <div className="text-sm font-bold text-white">{userName}</div>
              </div>
              <HiOutlineChevronDown
                className={`text-white transition ${userOpen ? "rotate-180" : ""}`}
              />
            </button>

            {userOpen && (
              <div className="absolute left-0 mt-3 w-[240px] overflow-hidden rounded-2xl border border-white/10 bg-[#3b3e47] shadow-[0_20px_50px_rgba(0,0,0,0.35)]">
                <div className="border-b border-white/10 px-4 py-3 text-sm font-bold text-white">
                  פרטי משתמש
                </div>

                <div className="p-2">
                  <button
                    type="button"
                    onClick={() => {
                      setUserOpen(false);
                      setProfileModalOpen(true);
                    }}
                    className="mb-1 flex w-full items-center gap-3 rounded-xl px-3 py-3 text-white/85 transition hover:bg-white/8"
                  >
                    <HiOutlinePencilSquare className="text-xl text-sky-300" />
                    <span className="text-sm font-medium">עריכת פרופיל</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleLogout}
                    className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-white/85 transition hover:bg-white/8"
                  >
                    <HiOutlineArrowRightOnRectangle className="text-xl text-rose-300" />
                    <span className="text-sm font-medium">התנתקות</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {profileModalOpen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 px-4">
          <div className="w-full max-w-md rounded-[28px] border border-white/10 bg-[#3b3e47] p-6 shadow-[0_20px_60px_rgba(0,0,0,0.45)]">
            <div className="mb-5 flex items-center justify-between">
              <div className="text-xl font-bold text-white">עריכת פרופיל</div>
              <button
                type="button"
                onClick={() => setProfileModalOpen(false)}
                className="rounded-full p-2 text-white/70 hover:bg-white/10 hover:text-white"
              >
                <HiOutlineXMark className="text-2xl" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-semibold text-white/85">
                  שם משתמש
                </label>
                <input
                  type="text"
                  value={userName}
                  disabled
                  className="w-full rounded-2xl bg-white/5 px-4 py-3 text-white/60 ring-1 ring-white/10 outline-none"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-white/85">
                  אימייל
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-2xl bg-white/5 px-4 py-3 text-white ring-1 ring-white/10 outline-none focus:ring-sky-300/30"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-white/85">
                  תפקיד
                </label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full rounded-2xl bg-white/5 px-4 py-3 text-white ring-1 ring-white/10 outline-none focus:ring-sky-300/30"
                >
                  <option value="Manager" className="text-black">
                    Manager
                  </option>
                  <option value="Management Employee" className="text-black">
                    Management Employee
                  </option>
                </select>
              </div>

              <button
                type="button"
                onClick={handleSaveProfile}
                disabled={saving}
                className="mt-2 w-full rounded-2xl bg-sky-500/20 px-4 py-3 font-bold text-sky-100 ring-1 ring-sky-300/30 transition hover:bg-sky-500/30 disabled:opacity-60"
              >
                {saving ? "שומר..." : "שמור שינויים"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}