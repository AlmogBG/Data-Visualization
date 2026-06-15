import React, {
  useEffect,
  useRef,
  useState,
} from "react";

import {
  Link,
  useLocation,
  useNavigate,
} from "react-router-dom";

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
  HiOutlineCalendarDays,
  HiOutlineShieldCheck,
} from "react-icons/hi2";

const navigationItems = [
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
  {
    key: "security",
    label: "לוח אבטחה - SIEM Lite",
    path: "/security",
    icon: HiOutlineShieldCheck,
  },
];

function getStoredRole() {
  const directRole =
    localStorage.getItem("loggedInRole") ||
    sessionStorage.getItem("loggedInRole");

  if (directRole) {
    return directRole;
  }

  try {
    const storedUser =
      localStorage.getItem("user") ||
      sessionStorage.getItem("user");

    if (!storedUser) {
      return "";
    }

    const parsedUser = JSON.parse(storedUser);

    return parsedUser?.role || "";
  } catch (error) {
    console.error(
      "Failed to read the stored user role:",
      error
    );

    return "";
  }
}

export default function TopNavbar() {
  const location = useLocation();
  const navigate = useNavigate();

  const [
    navigationOpen,
    setNavigationOpen,
  ] = useState(false);

  const [userOpen, setUserOpen] =
    useState(false);

  const [userName, setUserName] =
    useState("משתמש");

  const [userRole, setUserRole] =
    useState("");

  const navigationDropdownRef =
    useRef(null);

  const userDropdownRef =
    useRef(null);

  const isManager =
    userRole === "Manager";

  useEffect(() => {
    try {
      const storedUsername =
        localStorage.getItem(
          "loggedInUsername"
        ) ||
        sessionStorage.getItem(
          "loggedInUsername"
        ) ||
        "משתמש";

      setUserName(storedUsername);
      setUserRole(getStoredRole());
    } catch (error) {
      console.error(
        "Failed to load user details:",
        error
      );

      setUserName("משתמש");
      setUserRole("");
    }
  }, []);

  useEffect(() => {
    function handleClickOutside(event) {
      if (
        navigationDropdownRef.current &&
        !navigationDropdownRef.current.contains(
          event.target
        )
      ) {
        setNavigationOpen(false);
      }

      if (
        userDropdownRef.current &&
        !userDropdownRef.current.contains(
          event.target
        )
      ) {
        setUserOpen(false);
      }
    }

    document.addEventListener(
      "mousedown",
      handleClickOutside
    );

    return () => {
      document.removeEventListener(
        "mousedown",
        handleClickOutside
      );
    };
  }, []);

  useEffect(() => {
    setNavigationOpen(false);
    setUserOpen(false);
  }, [location.pathname]);

  /*
   * הכפתור מציג תמיד את אותו הטקסט,
   * ללא תלות בעמוד שבו המשתמש נמצא.
   */
  const menuButtonLabel =
    "מעבר בין דוחות";

  function handleEditProfile() {
    setUserOpen(false);

    navigate("/profile/edit");
  }

  function handleLogout() {
    try {
      localStorage.removeItem("token");

      localStorage.removeItem(
        "loggedInUsername"
      );

      localStorage.removeItem(
        "loggedInEmail"
      );

      localStorage.removeItem(
        "loggedInRole"
      );

      localStorage.removeItem("user");

      sessionStorage.removeItem("token");

      sessionStorage.removeItem(
        "loggedInUsername"
      );

      sessionStorage.removeItem(
        "loggedInEmail"
      );

      sessionStorage.removeItem(
        "loggedInRole"
      );

      sessionStorage.removeItem("user");
    } catch (error) {
      console.error(
        "Failed to clear authentication data:",
        error
      );
    }

    navigate("/login", {
      replace: true,
    });

    setTimeout(() => {
      window.history.pushState(
        null,
        "",
        "/login"
      );
    }, 0);
  }

  return (
    <header className="fixed left-0 right-0 top-0 z-50 border-b border-white/10 bg-[#2b2e36]/95 shadow-[0_8px_24px_rgba(0,0,0,0.18)] backdrop-blur-md">
      <div className="relative mx-auto h-[74px] max-w-7xl px-6">
        <div className="absolute left-1/2 top-1/2 z-10 -translate-x-1/2 -translate-y-1/2">
          <Link
            to="/home"
            className="inline-flex items-center justify-center"
          >
            <div className="inline-flex items-center justify-center rounded-xl bg-white px-3 py-1.5 shadow-sm ring-1 ring-black/10">
              <img
                src="/SCE_logo.png"
                alt="SCE"
                className="h-7 w-auto"
                onError={(event) => {
                  event.currentTarget.style.display =
                    "none";
                }}
              />
            </div>
          </Link>
        </div>

        <div className="flex h-full items-center justify-between">
          <div className="flex items-center gap-2.5">
            {isManager ? (
              <div
                className="relative"
                ref={
                  navigationDropdownRef
                }
              >
                <button
                  type="button"
                  onClick={() =>
                    setNavigationOpen(
                      (current) =>
                        !current
                    )
                  }
                  className="flex h-11 items-center gap-2 rounded-full bg-white/[0.04] px-4 text-white ring-1 ring-white/10 transition hover:bg-white/[0.08]"
                >
                  <HiOutlineDocumentChartBar className="text-[18px] text-sky-300" />

                  <span className="text-sm font-semibold">
                    {menuButtonLabel}
                  </span>

                  <HiOutlineChevronDown
                    className={[
                      "text-sm transition",
                      navigationOpen
                        ? "rotate-180"
                        : "",
                    ].join(" ")}
                  />
                </button>

                {navigationOpen ? (
                  <div className="absolute right-0 mt-3 w-[320px] overflow-hidden rounded-2xl border border-white/10 bg-[#363943] shadow-[0_18px_40px_rgba(0,0,0,0.28)]">
                    <div className="border-b border-white/10 px-4 py-3 text-sm font-bold text-white">
                      מעבר בין דוחות
                    </div>

                    <div className="max-h-[430px] overflow-y-auto p-2">
                      {navigationItems.map(
                        (item) => {
                          const Icon =
                            item.icon;

                          const active =
                            location.pathname ===
                            item.path;

                          return (
                            <Link
                              key={item.key}
                              to={item.path}
                              className={[
                                "mb-1 flex items-center gap-3 rounded-xl px-3 py-2.5 transition",
                                active
                                  ? "bg-sky-500/15 text-sky-100 ring-1 ring-sky-300/20"
                                  : "text-white/85 hover:bg-white/[0.06]",
                              ].join(" ")}
                            >
                              <Icon className="text-[18px] text-sky-300" />

                              <span className="text-sm font-medium">
                                {item.label}
                              </span>
                            </Link>
                          );
                        }
                      )}
                    </div>
                  </div>
                ) : null}
              </div>
            ) : null}

            <button
              type="button"
              onClick={() =>
                navigate(
                  "/consultation"
                )
              }
              className="flex h-11 items-center gap-2 rounded-full bg-white/[0.04] px-4 text-white ring-1 ring-white/10 transition hover:bg-white/[0.08]"
            >
              <HiOutlineCalendarDays className="text-[18px] text-sky-300" />

              <span className="text-sm font-semibold">
                פגישת ייעוץ
              </span>
            </button>
          </div>

          <div
            className="relative"
            ref={userDropdownRef}
          >
            <button
              type="button"
              onClick={() =>
                setUserOpen(
                  (current) =>
                    !current
                )
              }
              className="flex h-11 items-center gap-2 rounded-full bg-white/[0.04] px-3.5 ring-1 ring-white/10 transition hover:bg-white/[0.08]"
            >
              <HiOutlineUserCircle className="text-[26px] text-sky-300" />

              <div className="text-right leading-tight">
                <div className="text-[11px] text-white/55">
                  מחובר כעת
                </div>

                <div className="text-sm font-semibold text-white">
                  {userName}
                </div>
              </div>

              <HiOutlineChevronDown
                className={[
                  "text-sm text-white transition",
                  userOpen
                    ? "rotate-180"
                    : "",
                ].join(" ")}
              />
            </button>

            {userOpen ? (
              <div className="absolute left-0 mt-3 w-[220px] overflow-hidden rounded-2xl border border-white/10 bg-[#363943] shadow-[0_18px_40px_rgba(0,0,0,0.28)]">
                <div className="border-b border-white/10 px-4 py-3">
                  <div className="text-sm font-bold text-white">
                    פרטי משתמש
                  </div>

                  <div className="mt-1 text-xs text-white/50">
                    {userRole ||
                      "תפקיד לא זמין"}
                  </div>
                </div>

                <div className="p-2">
                  <button
                    type="button"
                    onClick={
                      handleEditProfile
                    }
                    className="mb-1 flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-white/85 transition hover:bg-white/[0.06]"
                  >
                    <HiOutlinePencilSquare className="text-[18px] text-sky-300" />

                    <span className="text-sm font-medium">
                      עריכת פרופיל
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={handleLogout}
                    className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-white/85 transition hover:bg-white/[0.06]"
                  >
                    <HiOutlineArrowRightOnRectangle className="text-[18px] text-rose-300" />

                    <span className="text-sm font-medium">
                      התנתקות
                    </span>
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </header>
  );
}