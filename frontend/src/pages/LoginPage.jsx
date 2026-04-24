import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { User, Lock, Eye, EyeOff } from "lucide-react";
import Sidebar from "../components/Sidebar";

const API_BASE_URL =
  process.env.REACT_APP_API_BASE_URL || "http://188.245.161.194:5000";

export default function LoginPage() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const token =
      localStorage.getItem("token") || sessionStorage.getItem("token");

    if (token) {
      navigate("/home", { replace: true });
    }
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username,
          password,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.message || "התחברות נכשלה");
        return;
      }

      localStorage.setItem(
        "user",
        JSON.stringify({
          username: data.username,
          email: data.email,
          role: data.role,
          fullName: data.fullName,
        })
      );
      localStorage.setItem("token", data.token);
      localStorage.setItem("loggedInUsername", data.username || username);
      localStorage.setItem("loggedInEmail", data.email || "");
      localStorage.setItem("loggedInRole", data.role || "");

      navigate("/home", { replace: true });
    } catch (error) {
      console.error("Login error:", error);
      alert("שגיאה בחיבור לשרת");
    }
  };

  return (
    <div
      dir="rtl"
      className="min-h-screen bg-[#2e3038] text-white overflow-hidden relative"
    >
      <Sidebar
        isOpen={menuOpen}
        onToggle={() => setMenuOpen((prev) => !prev)}
      />

      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[18%] left-1/2 -translate-x-1/2 h-56 w-56 rounded-full bg-sky-500/10 blur-3xl" />
        <div className="absolute bottom-[12%] left-[18%] h-40 w-40 rounded-full bg-indigo-400/10 blur-3xl" />
      </div>

      <div className="relative z-10 mx-auto max-w-7xl px-6 pt-6 pb-10">
        <div className="grid grid-cols-3 items-start">
          <div className="justify-self-start"></div>

          <div className="justify-self-center text-center">
            <div className="mx-auto inline-flex items-center justify-center rounded-2xl bg-white px-5 py-3 shadow-sm ring-1 ring-black/10">
              <img
                src="/SCE_logo.png"
                alt="SCE"
                className="h-10 w-auto"
                onError={(e) => {
                  e.currentTarget.style.display = "none";
                }}
              />
            </div>
            <div className="mt-2 text-[12px] text-white/75">
              המכללה האקדמית להנדסה ע״ש סמי שמעון
            </div>
          </div>

          <div />
        </div>

        <div className="mt-10 flex justify-center">
          <div className="w-full max-w-md">
            <div className="mb-8 text-center">
              <h1 className="text-4xl font-extrabold tracking-tight">
                כניסה למערכת
              </h1>
            </div>

            <div className="rounded-[30px] bg-[#434754]/95 p-8 shadow-[0_20px_80px_rgba(0,0,0,0.35)] ring-1 ring-white/10 backdrop-blur-sm">
              <div className="mb-8 text-center">
                <h2 className="text-2xl font-extrabold">ברוכים הבאים</h2>
                <p className="mt-2 text-sm text-white/55">מערכת מדור רישום</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="mb-2 block text-sm font-semibold text-white/90">
                    שם משתמש
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="הזן שם משתמש"
                      className="w-full rounded-2xl bg-white/10 px-5 py-4 pr-12 text-white placeholder:text-white/35 outline-none ring-white/8 transition focus:ring-2 focus:ring-white/20"
                    />
                    <User className="absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-white/45" />
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-white/90">
                    סיסמה
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="הזן סיסמה"
                      className="w-full rounded-2xl bg-white/10 px-5 py-4 pr-12 pl-12 text-white placeholder:text-white/35 outline-none ring-white/8 transition focus:ring-2 focus:ring-white/20"
                    />
                    <Lock className="absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-white/45" />
                    <button
                      type="button"
                      onClick={() => setShowPassword((prev) => !prev)}
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-white/45 hover:text-white/80"
                    >
                      {showPassword ? (
                        <EyeOff className="h-5 w-5" />
                      ) : (
                        <Eye className="h-5 w-5" />
                      )}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full rounded-2xl px-4 py-4 text-lg font-bold text-white transition-all duration-300
                  bg-gradient-to-l from-[#5a6072] via-[#4f5567] to-[#444958]
                  shadow-[0_10px_30px_rgba(0,0,0,0.22)]
                  ring-1 ring-white/10
                  hover:from-[#6b7287] hover:via-[#596077] hover:to-[#4d5366]
                  hover:shadow-[0_16px_38px_rgba(0,0,0,0.30)]
                  hover:-translate-y-[1px]
                  active:translate-y-0"
                >
                  כניסה לאזור האישי
                </button>
              </form>

              <div className="mt-6 text-center text-sm text-white/35">
                SCE Management System
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}