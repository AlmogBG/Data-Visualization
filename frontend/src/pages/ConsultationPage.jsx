import React, { useEffect, useMemo, useRef, useState } from "react";
import TopNavbar from "../components/TopNavbar";
import Sidebar from "../components/Sidebar";
import {
  getConsultationFormOptions,
  searchLeads,
  createLead,
  updateLead,
  createConsultation,
  getLeadConsultations,
  updateConsultation,
  deleteConsultation,
} from "../api/consultationApi";
import {
  Search,
  UserRound,
  CalendarDays,
  Phone,
  Mail,
  Building2,
  MapPinned,
  GraduationCap,
  Map,
  Megaphone,
  Clock3,
  FileText,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Save,
  Pencil,
  Users,
  ListChecks,
  BadgeInfo,
  SquarePen,
  X,
  Trash2,
} from "lucide-react";

const campusOptions = ["אשדוד", "באר שבע"];
const areaOptions = ["דרום", "מרכז", "צפון", "שפלה", "ירושלים"];
const sourceOptions = ["פייסבוק", "אינסטגרם", "גוגל", "אתר", "טלפון", "המלצה", "אחר"];

const outcomeOptions = [
  { value: "", label: "ללא" },
  { value: "ENROLLED", label: "נרשם" },
  { value: "NOT_RELEVANT", label: "לא רלוונטי" },
  { value: "NOT_INTERESTED", label: "לא מעוניין" },
  { value: "FOLLOWUP", label: "מעקב" },
  { value: "SELF_CONTACT", label: "פנייה עצמית" },
  { value: "OTHER", label: "אחר" },
];

const outcomeLabelMap = {
  ENROLLED: "נרשם",
  NOT_RELEVANT: "לא רלוונטי",
  NOT_INTERESTED: "לא מעוניין",
  FOLLOWUP: "מעקב",
  SELF_CONTACT: "פנייה עצמית",
  OTHER: "אחר",
};

const GOOGLE_CALENDAR_EMBED_BASE_URL =
  "https://calendar.google.com/calendar/embed?src=datavisualization4222%40gmail.com&ctz=Asia%2FJerusalem&mode=MONTH&showTitle=0&showPrint=0&showCalendars=0&showTabs=1&showTz=0&hl=en";

function buildDateTimeValue(datePart, timePart) {
  if (!datePart || !timePart) return "";
  return `${datePart}T${timePart}:00`;
}

function formatDateTime(value) {
  if (!value) return "-";
  const d = new Date(value);
  return d.toLocaleString("he-IL");
}

function getOutcomeLabel(value) {
  return outcomeLabelMap[value] || "-";
}

function isValidIsraeliPhone(phone) {
  const cleaned = String(phone || "").replace(/\D/g, "");
  return /^0\d{8,9}$/.test(cleaned);
}

function isValidEmail(email) {
  if (!email) return true;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email).trim());
}

function inputClass(hasError, disabled = false, hasIcon = false) {
  return [
    "w-full rounded-xl bg-white/[0.06] py-2.5 text-sm text-white placeholder:text-white/35 outline-none ring-1 transition",
    hasIcon ? "pr-11 pl-3.5" : "px-3.5",
    hasError
      ? "ring-red-400/70 focus:ring-red-300"
      : "ring-white/10 focus:ring-sky-300/25",
    disabled ? "disabled:opacity-70" : "",
  ].join(" ");
}

function FieldIcon({ icon: Icon }) {
  return (
    <div className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-white/40">
      <Icon size={17} />
    </div>
  );
}

function InputField({
  icon,
  error,
  disabled = false,
  className = "",
  ...props
}) {
  return (
    <div>
      <div className="relative">
        <input
          {...props}
          disabled={disabled}
          className={`${inputClass(!!error, disabled, true)} ${className}`}
        />
        <FieldIcon icon={icon} />
      </div>
      {error ? <div className="mt-1 text-sm text-red-300">{error}</div> : null}
    </div>
  );
}

function SelectField({
  icon,
  error,
  disabled = false,
  className = "",
  children,
  ...props
}) {
  return (
    <div>
      <div className="relative">
        <select
          {...props}
          disabled={disabled}
          className={`${inputClass(
            !!error,
            disabled,
            true
          )} appearance-none ${className}`}
        >
          {children}
        </select>
        <FieldIcon icon={icon} />
      </div>
      {error ? <div className="mt-1 text-sm text-red-300">{error}</div> : null}
    </div>
  );
}

function TextareaField({ icon, error, className = "", ...props }) {
  return (
    <div>
      <div className="relative">
        <textarea
          {...props}
          className={`${inputClass(
            !!error,
            false,
            true
          )} min-h-[104px] resize-none ${className}`}
        />
        <div className="pointer-events-none absolute right-3.5 top-3.5 text-white/40">
          {React.createElement(icon, { size: 18 })}
        </div>
      </div>
      {error ? <div className="mt-1 text-sm text-red-300">{error}</div> : null}
    </div>
  );
}

const emptyLeadForm = {
  fullName: "",
  phone: "",
  email: "",
  campus: "",
  area: "",
  source: "",
  departmentId: "",
  cityId: "",
};

const emptyConsultationForm = {
  meetingDate: "",
  meetingTime: "",
  outcome: "",
  arrived: "",
  notes: "",
};

const emptySearchForm = {
  q: "",
  phone: "",
  email: "",
  fullName: "",
};

export default function ConsultationPage() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [optionsLoading, setOptionsLoading] = useState(true);
  const [departments, setDepartments] = useState([]);
  const [cities, setCities] = useState([]);

  const [searchValues, setSearchValues] = useState(emptySearchForm);
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);

  const [selectedLead, setSelectedLead] = useState(null);
  const [consultations, setConsultations] = useState([]);
  const [editingConsultationId, setEditingConsultationId] = useState(null);

  const [leadForm, setLeadForm] = useState(emptyLeadForm);
  const [consultationForm, setConsultationForm] = useState(
    emptyConsultationForm
  );

  const [leadErrors, setLeadErrors] = useState({});
  const [consultationErrors, setConsultationErrors] = useState({});

  const [savingLead, setSavingLead] = useState(false);
  const [savingConsultation, setSavingConsultation] = useState(false);
  const [deletingConsultationId, setDeletingConsultationId] = useState(null);
  const [isEditingLead, setIsEditingLead] = useState(false);

  const consultationCardRef = useRef(null);
  const [calendarRefreshKey, setCalendarRefreshKey] = useState(0);

  const calendarEmbedUrl = useMemo(() => {
    return `${GOOGLE_CALENDAR_EMBED_BASE_URL}&refresh=${calendarRefreshKey}`;
  }, [calendarRefreshKey]);

  useEffect(() => {
    async function loadOptions() {
      try {
        setOptionsLoading(true);
        const data = await getConsultationFormOptions();
        setDepartments(data.departments || []);
        setCities(data.cities || []);
      } catch (error) {
        console.error(error);
        alert(error.message);
      } finally {
        setOptionsLoading(false);
      }
    }

    loadOptions();
  }, []);

  const isExistingLead = !!selectedLead?.id;

  async function refreshLeadConsultations(leadId) {
    const data = await getLeadConsultations(leadId);

    setSelectedLead(data.lead);
    setConsultations(data.consultations || []);

    setLeadForm({
      fullName: data.lead?.fullName || "",
      phone: data.lead?.phone || "",
      email: data.lead?.email || "",
      campus: data.lead?.campus || "",
      area: data.lead?.area || "",
      source: data.lead?.source || "",
      departmentId: data.lead?.department?.id
        ? String(data.lead.department.id)
        : "",
      cityId: data.lead?.city?.id ? String(data.lead.city.id) : "",
    });
  }

  function refreshCalendarIframe() {
    setCalendarRefreshKey((prev) => prev + 1);
  }

  async function handleSearch() {
    try {
      setSearching(true);
      const data = await searchLeads(searchValues);
      setSearchResults(data.rows || []);
    } catch (error) {
      alert(error.message);
    } finally {
      setSearching(false);
    }
  }

  async function handleSelectLead(lead) {
    setSelectedLead({
      id: lead.id,
      fullName: lead.fullName,
      phone: lead.phone || "",
      email: lead.email || "",
      campus: lead.campus || "",
      area: lead.area || "",
      source: lead.source || "",
      status: lead.status || "",
      department: lead.department || null,
      city: lead.city || null,
    });

    setLeadForm({
      fullName: lead.fullName || "",
      phone: lead.phone || "",
      email: lead.email || "",
      campus: lead.campus || "",
      area: lead.area || "",
      source: lead.source || "",
      departmentId: lead.department?.id ? String(lead.department.id) : "",
      cityId: lead.city?.id ? String(lead.city.id) : "",
    });

    setIsEditingLead(false);
    setLeadErrors({});
    await refreshLeadConsultations(lead.id);
  }

  function handleClearSearchAndLeadSection() {
    setSearchValues(emptySearchForm);
    setSearchResults([]);
    setSelectedLead(null);
    setConsultations([]);
    setEditingConsultationId(null);
    setIsEditingLead(false);
    setLeadForm(emptyLeadForm);
    setLeadErrors({});
    setConsultationForm(emptyConsultationForm);
    setConsultationErrors({});
  }

  function handleClearConsultationForm() {
    setConsultationForm(emptyConsultationForm);
    setConsultationErrors({});
    setEditingConsultationId(null);
  }

  function validateLeadForm() {
    const errors = {};

    if (!leadForm.fullName.trim()) {
      errors.fullName = "חובה להזין שם מלא";
    }

    if (!leadForm.phone.trim()) {
      errors.phone = "חובה להזין טלפון";
    } else if (!isValidIsraeliPhone(leadForm.phone)) {
      errors.phone = "נא להזין מספר טלפון תקין";
    }

    if (leadForm.email.trim() && !isValidEmail(leadForm.email)) {
      errors.email = "נא להזין כתובת אימייל תקינה";
    }

    if (!leadForm.campus) errors.campus = "חובה לבחור קמפוס";
    if (!leadForm.area) errors.area = "חובה לבחור אזור";
    if (!leadForm.source) errors.source = "חובה לבחור מקור הגעה";
    if (!leadForm.departmentId) errors.departmentId = "חובה לבחור מחלקה";
    if (!leadForm.cityId) errors.cityId = "חובה לבחור עיר";

    setLeadErrors(errors);
    return Object.keys(errors).length === 0;
  }

  function validateConsultationForm() {
    const errors = {};

    if (!selectedLead?.id) {
      errors.lead = "יש לבחור או ליצור מועמד לפני יצירת פגישה";
    }

    if (!consultationForm.meetingDate) {
      errors.meetingDate = "חובה לבחור תאריך פגישה";
    }

    if (!consultationForm.meetingTime) {
      errors.meetingTime = "חובה לבחור שעת פגישה";
    }

    setConsultationErrors(errors);
    return Object.keys(errors).length === 0;
  }

  function handleStartEditLead() {
    if (!selectedLead?.id) return;
    setIsEditingLead(true);
  }

  function handleCancelEditLead() {
    if (!selectedLead) {
      setIsEditingLead(false);
      setLeadForm(emptyLeadForm);
      setLeadErrors({});
      return;
    }

    setLeadForm({
      fullName: selectedLead.fullName || "",
      phone: selectedLead.phone || "",
      email: selectedLead.email || "",
      campus: selectedLead.campus || "",
      area: selectedLead.area || "",
      source: selectedLead.source || "",
      departmentId: selectedLead.department?.id
        ? String(selectedLead.department.id)
        : "",
      cityId: selectedLead.city?.id ? String(selectedLead.city.id) : "",
    });

    setLeadErrors({});
    setIsEditingLead(false);
  }

  async function handleSaveLead() {
    try {
      if (!validateLeadForm()) return;

      setSavingLead(true);

      if (selectedLead?.id && isEditingLead) {
        const data = await updateLead(selectedLead.id, leadForm);

        setSelectedLead({
          id: data.lead.id,
          fullName: data.lead.fullName || "",
          phone: data.lead.phone || "",
          email: data.lead.email || "",
          campus: data.lead.campus || "",
          area: data.lead.area || "",
          source: data.lead.source || "",
          status: data.lead.status || "",
          department: data.lead.department || null,
          city: data.lead.city || null,
        });

        setLeadForm({
          fullName: data.lead.fullName || "",
          phone: data.lead.phone || "",
          email: data.lead.email || "",
          campus: data.lead.campus || "",
          area: data.lead.area || "",
          source: data.lead.source || "",
          departmentId: data.lead.department?.id
            ? String(data.lead.department.id)
            : "",
          cityId: data.lead.city?.id ? String(data.lead.city.id) : "",
        });

        setIsEditingLead(false);
        alert("פרטי המועמד עודכנו בהצלחה");
        return;
      }

      const data = await createLead(leadForm);

      const lead = data.lead;
      setSelectedLead({
        id: lead.id,
        fullName: lead.fullName || "",
        phone: lead.phone || "",
        email: lead.email || "",
        campus: lead.campus || "",
        area: lead.area || "",
        source: lead.source || "",
        status: lead.status || "",
        department: lead.department || null,
        city: lead.city || null,
      });

      setLeadForm({
        fullName: lead.fullName || "",
        phone: lead.phone || "",
        email: lead.email || "",
        campus: lead.campus || "",
        area: lead.area || "",
        source: lead.source || "",
        departmentId: lead.department?.id ? String(lead.department.id) : "",
        cityId: lead.city?.id ? String(lead.city.id) : "",
      });

      setConsultations([]);
      setIsEditingLead(false);
      alert("המועמד נוצר בהצלחה");
    } catch (error) {
      alert(error.message);
    } finally {
      setSavingLead(false);
    }
  }

  async function handleSaveConsultation() {
    try {
      if (!validateConsultationForm()) return;

      const leadId = selectedLead?.id;
      setSavingConsultation(true);

      const payload = {
        leadId,
        meetingDate: buildDateTimeValue(
          consultationForm.meetingDate,
          consultationForm.meetingTime
        ),
        outcome: consultationForm.outcome,
        arrived:
          consultationForm.arrived === "" ? null : consultationForm.arrived,
        notes: consultationForm.notes,
      };

      if (editingConsultationId) {
        await updateConsultation(editingConsultationId, payload);
        alert("פגישת הייעוץ עודכנה בהצלחה");
      } else {
        await createConsultation(payload);
        alert("פגישת הייעוץ נוצרה בהצלחה");
      }

      handleClearConsultationForm();
      await refreshLeadConsultations(leadId);
      refreshCalendarIframe();
    } catch (error) {
      alert(error.message);
    } finally {
      setSavingConsultation(false);
    }
  }

  async function handleDeleteConsultation(id) {
    const confirmed = window.confirm("האם למחוק את פגישת הייעוץ?");

    if (!confirmed) return;

    try {
      setDeletingConsultationId(id);

      await deleteConsultation(id);

      if (editingConsultationId === id) {
        handleClearConsultationForm();
      }

      if (selectedLead?.id) {
        await refreshLeadConsultations(selectedLead.id);
      }

      refreshCalendarIframe();
      alert("פגישת הייעוץ נמחקה בהצלחה");
    } catch (error) {
      alert(error.message);
    } finally {
      setDeletingConsultationId(null);
    }
  }

  function handleEditConsultation(item) {
    const d = item.meetingDate ? new Date(item.meetingDate) : null;
    const datePart = d ? d.toISOString().slice(0, 10) : "";
    const timePart = d
      ? `${String(d.getHours()).padStart(2, "0")}:${String(
          d.getMinutes()
        ).padStart(2, "0")}`
      : "";

    setEditingConsultationId(item.id);
    setConsultationErrors({});
    setConsultationForm({
      meetingDate: datePart,
      meetingTime: timePart,
      outcome: item.outcome || "",
      arrived:
        item.arrived === true ? "true" : item.arrived === false ? "false" : "",
      notes: item.notes || "",
    });

    requestAnimationFrame(() => {
      consultationCardRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    });
  }

  const selectedLeadSummary = useMemo(() => {
    if (!selectedLead) return null;

    return {
      name: selectedLead.fullName,
      phone: selectedLead.phone || "-",
      email: selectedLead.email || "-",
      campus: selectedLead.campus || "-",
      area: selectedLead.area || "-",
      source: selectedLead.source || "-",
      status: selectedLead.status || "-",
      department: selectedLead.department?.name || "-",
      city: selectedLead.city?.town || "-",
    };
  }, [selectedLead]);

  return (
    <div dir="rtl" className="min-h-screen bg-[#2e3038] text-white">
      <TopNavbar />
      <Sidebar isOpen={menuOpen} onToggle={() => setMenuOpen((s) => !s)} />

      <div className="mx-auto max-w-7xl px-6 pb-12 pt-24">
        <div className="mt-6 text-center">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/[0.04] px-3.5 py-1.5 ring-1 ring-white/10">
            <CalendarDays size={16} className="text-sky-300" />
            <span className="text-xs font-semibold text-white/80">
              ניהול פגישות ייעוץ
            </span>
          </div>

          <h1 className="mt-3 text-[28px] font-bold tracking-tight">
            פגישת ייעוץ
          </h1>
          <p className="mt-2 text-sm text-white/65">
            חיפוש מועמד, יצירת מועמד חדש, תיעוד פגישה ועדכון פגישות קיימות
          </p>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-6 xl:grid-cols-[0.95fr_1.1fr_0.95fr]">
          <div className="rounded-[28px] bg-[#363943] p-5 shadow-[0_14px_36px_rgba(0,0,0,0.26)] ring-1 ring-white/10">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-sky-500/12 p-2.5 text-sky-300">
                <Search size={18} />
              </div>
              <div className="text-lg font-bold">חיפוש מועמד קיים</div>
            </div>

            <div className="mt-5 space-y-3.5">
              <InputField
                icon={Search}
                type="text"
                placeholder="חיפוש כללי"
                value={searchValues.q}
                onChange={(e) =>
                  setSearchValues((prev) => ({ ...prev, q: e.target.value }))
                }
              />

              <InputField
                icon={Phone}
                type="text"
                placeholder="טלפון"
                value={searchValues.phone}
                onChange={(e) =>
                  setSearchValues((prev) => ({ ...prev, phone: e.target.value }))
                }
              />

              <InputField
                icon={Mail}
                type="text"
                placeholder="אימייל"
                value={searchValues.email}
                onChange={(e) =>
                  setSearchValues((prev) => ({ ...prev, email: e.target.value }))
                }
              />

              <InputField
                icon={UserRound}
                type="text"
                placeholder="שם מלא"
                value={searchValues.fullName}
                onChange={(e) =>
                  setSearchValues((prev) => ({
                    ...prev,
                    fullName: e.target.value,
                  }))
                }
              />

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={handleSearch}
                  disabled={searching}
                  className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-sky-500/18 px-4 text-sm font-semibold text-sky-100 ring-1 ring-sky-300/25 transition hover:bg-sky-500/28 disabled:opacity-60"
                >
                  <Search size={17} />
                  {searching ? "מחפש..." : "חפש מועמד"}
                </button>

                <button
                  type="button"
                  onClick={handleClearSearchAndLeadSection}
                  className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-white/[0.05] px-4 text-sm font-semibold text-white ring-1 ring-white/10 transition hover:bg-white/[0.08]"
                >
                  <RotateCcw size={17} />
                  נקה טופס
                </button>
              </div>
            </div>

            <div className="mt-6">
              <div className="mb-3 flex items-center gap-2 text-xs font-semibold tracking-wide text-white/65">
                <Users size={15} className="text-white/50" />
                <span>תוצאות חיפוש</span>
              </div>

              <div className="space-y-3">
                {searchResults.map((lead) => (
                  <button
                    key={lead.id}
                    type="button"
                    onClick={() => handleSelectLead(lead)}
                    className="w-full rounded-xl bg-white/[0.04] p-3.5 text-right ring-1 ring-white/10 transition hover:bg-white/[0.07]"
                  >
                    <div className="flex items-start gap-3">
                      <div className="mt-1 rounded-lg bg-white/10 p-2 text-sky-300">
                        <UserRound size={15} />
                      </div>

                      <div className="flex-1">
                        <div className="text-sm font-semibold">
                          {lead.fullName}
                        </div>
                        <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-sm text-white/70">
                          <span className="inline-flex items-center gap-1">
                            <Phone size={13} />
                            {lead.phone || "-"}
                          </span>
                          <span className="inline-flex items-center gap-1">
                            <Mail size={13} />
                            {lead.email || "-"}
                          </span>
                        </div>
                        <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs text-white/55">
                          <span className="inline-flex items-center gap-1">
                            <GraduationCap size={12} />
                            {lead.department?.name || "-"}
                          </span>
                          <span className="inline-flex items-center gap-1">
                            <MapPinned size={12} />
                            {lead.city?.town || "-"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </button>
                ))}

                {!searching && searchResults.length === 0 ? (
                  <div className="rounded-xl bg-white/[0.04] p-4 text-sm text-white/60 ring-1 ring-white/10">
                    אין תוצאות להצגה
                  </div>
                ) : null}
              </div>
            </div>
          </div>

          <div className="rounded-[28px] bg-[#363943] p-5 shadow-[0_14px_36px_rgba(0,0,0,0.26)] ring-1 ring-white/10">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-emerald-500/12 p-2.5 text-emerald-300">
                <UserRound size={18} />
              </div>
              <div className="text-lg font-bold">פרטי מועמד</div>
            </div>

            <div className="mt-5 grid grid-cols-1 gap-3">
              <InputField
                icon={UserRound}
                type="text"
                placeholder="שם מלא"
                value={leadForm.fullName}
                onChange={(e) => {
                  setLeadForm((prev) => ({
                    ...prev,
                    fullName: e.target.value,
                  }));
                  setLeadErrors((prev) => ({ ...prev, fullName: "" }));
                }}
                disabled={isExistingLead && !isEditingLead}
                error={leadErrors.fullName}
              />

              <InputField
                icon={Phone}
                type="text"
                placeholder="טלפון"
                value={leadForm.phone}
                onChange={(e) => {
                  setLeadForm((prev) => ({ ...prev, phone: e.target.value }));
                  setLeadErrors((prev) => ({ ...prev, phone: "" }));
                }}
                disabled={isExistingLead && !isEditingLead}
                error={leadErrors.phone}
              />

              <InputField
                icon={Mail}
                type="email"
                placeholder="אימייל"
                value={leadForm.email}
                onChange={(e) => {
                  setLeadForm((prev) => ({ ...prev, email: e.target.value }));
                  setLeadErrors((prev) => ({ ...prev, email: "" }));
                }}
                disabled={isExistingLead && !isEditingLead}
                error={leadErrors.email}
              />

              <SelectField
                icon={Building2}
                value={leadForm.campus}
                onChange={(e) => {
                  setLeadForm((prev) => ({ ...prev, campus: e.target.value }));
                  setLeadErrors((prev) => ({ ...prev, campus: "" }));
                }}
                disabled={isExistingLead && !isEditingLead}
                error={leadErrors.campus}
              >
                <option value="" className="text-black">
                  בחר קמפוס
                </option>
                {campusOptions.map((item) => (
                  <option key={item} value={item} className="text-black">
                    {item}
                  </option>
                ))}
              </SelectField>

              <SelectField
                icon={Map}
                value={leadForm.area}
                onChange={(e) => {
                  setLeadForm((prev) => ({ ...prev, area: e.target.value }));
                  setLeadErrors((prev) => ({ ...prev, area: "" }));
                }}
                disabled={isExistingLead && !isEditingLead}
                error={leadErrors.area}
              >
                <option value="" className="text-black">
                  בחר אזור
                </option>
                {areaOptions.map((item) => (
                  <option key={item} value={item} className="text-black">
                    {item}
                  </option>
                ))}
              </SelectField>

              <SelectField
                icon={Megaphone}
                value={leadForm.source}
                onChange={(e) => {
                  setLeadForm((prev) => ({ ...prev, source: e.target.value }));
                  setLeadErrors((prev) => ({ ...prev, source: "" }));
                }}
                disabled={isExistingLead && !isEditingLead}
                error={leadErrors.source}
              >
                <option value="" className="text-black">
                  בחר מקור הגעה
                </option>
                {sourceOptions.map((item) => (
                  <option key={item} value={item} className="text-black">
                    {item}
                  </option>
                ))}
              </SelectField>

              <SelectField
                icon={GraduationCap}
                value={leadForm.departmentId}
                onChange={(e) => {
                  setLeadForm((prev) => ({
                    ...prev,
                    departmentId: e.target.value,
                  }));
                  setLeadErrors((prev) => ({ ...prev, departmentId: "" }));
                }}
                disabled={(isExistingLead && !isEditingLead) || optionsLoading}
                error={leadErrors.departmentId}
              >
                <option value="" className="text-black">
                  בחר מחלקה
                </option>
                {departments.map((item) => (
                  <option key={item.id} value={item.id} className="text-black">
                    {item.name}
                  </option>
                ))}
              </SelectField>

              <SelectField
                icon={MapPinned}
                value={leadForm.cityId}
                onChange={(e) => {
                  setLeadForm((prev) => ({
                    ...prev,
                    cityId: e.target.value,
                  }));
                  setLeadErrors((prev) => ({ ...prev, cityId: "" }));
                }}
                disabled={(isExistingLead && !isEditingLead) || optionsLoading}
                error={leadErrors.cityId}
              >
                <option value="" className="text-black">
                  בחר עיר
                </option>
                {cities.map((item) => (
                  <option key={item.id} value={item.id} className="text-black">
                    {item.town}
                  </option>
                ))}
              </SelectField>
            </div>

            {!isExistingLead ? (
              <div className="mt-5">
                <button
                  type="button"
                  onClick={handleSaveLead}
                  disabled={savingLead}
                  className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-sky-500/18 px-4 text-sm font-semibold text-sky-100 ring-1 ring-sky-300/25 transition hover:bg-sky-500/28 disabled:opacity-60"
                >
                  <Save size={17} />
                  {savingLead ? "שומר..." : "שמור מועמד חדש"}
                </button>
              </div>
            ) : (
              <div className="mt-5 space-y-4">
                <div className="rounded-xl bg-white/[0.04] p-4 ring-1 ring-white/10">
                  <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-white/80">
                    <BadgeInfo size={15} className="text-emerald-300" />
                    <span>מועמד קיים שנבחר</span>
                  </div>

                  <div className="space-y-2 text-sm text-white/75">
                    <div className="flex items-center gap-2">
                      <UserRound size={14} className="text-white/50" />
                      <span>שם: {selectedLeadSummary?.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone size={14} className="text-white/50" />
                      <span>טלפון: {selectedLeadSummary?.phone}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Mail size={14} className="text-white/50" />
                      <span>אימייל: {selectedLeadSummary?.email}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Building2 size={14} className="text-white/50" />
                      <span>קמפוס: {selectedLeadSummary?.campus}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Map size={14} className="text-white/50" />
                      <span>אזור: {selectedLeadSummary?.area}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <GraduationCap size={14} className="text-white/50" />
                      <span>מחלקה: {selectedLeadSummary?.department}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPinned size={14} className="text-white/50" />
                      <span>עיר: {selectedLeadSummary?.city}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Megaphone size={14} className="text-white/50" />
                      <span>מקור: {selectedLeadSummary?.source}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <BadgeInfo size={14} className="text-white/50" />
                      <span>סטטוס: {selectedLeadSummary?.status}</span>
                    </div>
                  </div>
                </div>

                {!isEditingLead ? (
                  <button
                    type="button"
                    onClick={handleStartEditLead}
                    className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-emerald-500/18 px-4 text-sm font-semibold text-emerald-100 ring-1 ring-emerald-300/25 transition hover:bg-emerald-500/28"
                  >
                    <SquarePen size={17} />
                    שינוי פרטי מועמד
                  </button>
                ) : (
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={handleSaveLead}
                      disabled={savingLead}
                      className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-sky-500/18 px-4 text-sm font-semibold text-sky-100 ring-1 ring-sky-300/25 transition hover:bg-sky-500/28 disabled:opacity-60"
                    >
                      <Save size={17} />
                      {savingLead ? "שומר..." : "שמור שינויים"}
                    </button>

                    <button
                      type="button"
                      onClick={handleCancelEditLead}
                      className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-white/[0.05] px-4 text-sm font-semibold text-white ring-1 ring-white/10 transition hover:bg-white/[0.08]"
                    >
                      <X size={17} />
                      בטל עריכה
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          <div
            ref={consultationCardRef}
            className="rounded-[28px] bg-[#363943] p-5 shadow-[0_14px_36px_rgba(0,0,0,0.26)] ring-1 ring-white/10"
          >
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-violet-500/12 p-2.5 text-violet-300">
                <CalendarDays size={18} />
              </div>
              <div className="text-lg font-bold">פגישת ייעוץ</div>
            </div>

            <div className="mt-5 grid grid-cols-1 gap-3">
              <InputField
                icon={CalendarDays}
                type="date"
                value={consultationForm.meetingDate}
                onChange={(e) => {
                  setConsultationForm((prev) => ({
                    ...prev,
                    meetingDate: e.target.value,
                  }));
                  setConsultationErrors((prev) => ({
                    ...prev,
                    meetingDate: "",
                  }));
                }}
                error={consultationErrors.meetingDate}
              />

              <InputField
                icon={Clock3}
                type="time"
                value={consultationForm.meetingTime}
                onChange={(e) => {
                  setConsultationForm((prev) => ({
                    ...prev,
                    meetingTime: e.target.value,
                  }));
                  setConsultationErrors((prev) => ({
                    ...prev,
                    meetingTime: "",
                  }));
                }}
                error={consultationErrors.meetingTime}
              />

              <SelectField
                icon={ListChecks}
                value={consultationForm.outcome}
                onChange={(e) =>
                  setConsultationForm((prev) => ({
                    ...prev,
                    outcome: e.target.value,
                  }))
                }
              >
                {outcomeOptions.map((item) => (
                  <option
                    key={item.value}
                    value={item.value}
                    className="text-black"
                  >
                    {item.label}
                  </option>
                ))}
              </SelectField>

              <SelectField
                icon={CheckCircle2}
                value={consultationForm.arrived}
                onChange={(e) =>
                  setConsultationForm((prev) => ({
                    ...prev,
                    arrived: e.target.value,
                  }))
                }
              >
                <option value="" className="text-black">
                  הגיע / לא הגיע
                </option>
                <option value="true" className="text-black">
                  הגיע
                </option>
                <option value="false" className="text-black">
                  לא הגיע
                </option>
              </SelectField>

              <TextareaField
                icon={FileText}
                placeholder="הערות"
                value={consultationForm.notes}
                onChange={(e) =>
                  setConsultationForm((prev) => ({
                    ...prev,
                    notes: e.target.value,
                  }))
                }
                rows={4}
              />

              {consultationErrors.lead ? (
                <div className="text-sm text-red-300">
                  {consultationErrors.lead}
                </div>
              ) : null}
            </div>

            <div className="mt-5 flex gap-3">
              <button
                type="button"
                onClick={handleSaveConsultation}
                disabled={savingConsultation}
                className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-sky-500/18 px-4 text-sm font-semibold text-sky-100 ring-1 ring-sky-300/25 transition hover:bg-sky-500/28 disabled:opacity-60"
              >
                <Save size={17} />
                {savingConsultation
                  ? "שומר..."
                  : editingConsultationId
                  ? "עדכן פגישה"
                  : "שמור פגישה"}
              </button>

              <button
                type="button"
                onClick={handleClearConsultationForm}
                className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-white/[0.05] px-4 text-sm font-semibold text-white ring-1 ring-white/10 transition hover:bg-white/[0.08]"
              >
                <RotateCcw size={17} />
                נקה טופס
              </button>
            </div>
          </div>
        </div>

        <div className="mt-8 rounded-[28px] bg-[#363943] p-5 shadow-[0_14px_36px_rgba(0,0,0,0.26)] ring-1 ring-white/10">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-amber-500/12 p-2.5 text-amber-300">
              <ListChecks size={18} />
            </div>
            <div className="text-lg font-bold">רשימת פגישות קודמות</div>
          </div>

          {!selectedLead ? (
            <div className="mt-4 rounded-xl bg-white/[0.04] p-4 text-sm text-white/65 ring-1 ring-white/10">
              בחר מועמד קיים או צור מועמד חדש כדי לראות ולהוסיף פגישות
            </div>
          ) : consultations.length === 0 ? (
            <div className="mt-4 rounded-xl bg-white/[0.04] p-4 text-sm text-white/65 ring-1 ring-white/10">
              אין עדיין פגישות שמורות למועמד זה
            </div>
          ) : (
            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[980px] border-separate border-spacing-y-2.5">
                <thead>
                  <tr className="text-right text-sm text-white/60">
                    <th className="px-3">תאריך פגישה</th>
                    <th className="px-3">תוצאה</th>
                    <th className="px-3">הגיע</th>
                    <th className="px-3">הערות</th>
                    <th className="px-3">נוצר בתאריך</th>
                    <th className="px-3">פעולות</th>
                  </tr>
                </thead>
                <tbody>
                  {consultations.map((item) => (
                    <tr
                      key={item.id}
                      className="rounded-xl bg-white/[0.04] ring-1 ring-white/10"
                    >
                      <td className="px-3 py-3.5">
                        <div className="inline-flex items-center gap-2">
                          <CalendarDays size={14} className="text-sky-300" />
                          <span>{formatDateTime(item.meetingDate)}</span>
                        </div>
                      </td>

                      <td className="px-3 py-3.5">
                        <div className="inline-flex items-center gap-2">
                          <ListChecks size={14} className="text-violet-300" />
                          <span>{getOutcomeLabel(item.outcome)}</span>
                        </div>
                      </td>

                      <td className="px-3 py-3.5">
                        <div className="inline-flex items-center gap-2">
                          {item.arrived === true ? (
                            <>
                              <CheckCircle2
                                size={15}
                                className="text-emerald-300"
                              />
                              <span>כן</span>
                            </>
                          ) : item.arrived === false ? (
                            <>
                              <XCircle size={15} className="text-rose-300" />
                              <span>לא</span>
                            </>
                          ) : (
                            <>
                              <BadgeInfo size={15} className="text-white/45" />
                              <span>-</span>
                            </>
                          )}
                        </div>
                      </td>

                      <td className="px-3 py-3.5">
                        <div className="inline-flex items-center gap-2">
                          <FileText size={14} className="text-white/50" />
                          <span>{item.notes || "-"}</span>
                        </div>
                      </td>

                      <td className="px-3 py-3.5">
                        <div className="inline-flex items-center gap-2">
                          <Clock3 size={14} className="text-white/50" />
                          <span>{formatDateTime(item.createdAt)}</span>
                        </div>
                      </td>

                      <td className="px-3 py-3.5">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleEditConsultation(item)}
                            className="inline-flex h-9 items-center gap-2 rounded-xl bg-sky-500/18 px-4 text-sm font-semibold text-sky-100 ring-1 ring-sky-300/25 transition hover:bg-sky-500/28"
                          >
                            <Pencil size={14} />
                            ערוך
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDeleteConsultation(item.id)}
                            disabled={deletingConsultationId === item.id}
                            className="inline-flex h-9 items-center gap-2 rounded-xl bg-rose-500/16 px-4 text-sm font-semibold text-rose-100 ring-1 ring-rose-300/25 transition hover:bg-rose-500/24 disabled:opacity-60"
                          >
                            <Trash2 size={14} />
                            {deletingConsultationId === item.id
                              ? "מוחק..."
                              : "מחק"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="mt-8 rounded-[28px] bg-[#363943] p-5 shadow-[0_14px_36px_rgba(0,0,0,0.26)] ring-1 ring-white/10">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-sky-500/12 p-2.5 text-sky-300">
                <CalendarDays size={18} />
              </div>
              <div className="text-lg font-bold">יומן פגישות ייעוץ</div>
            </div>
          </div>

          <div className="mt-4 overflow-hidden rounded-2xl bg-white ring-1 ring-white/10">
            <iframe
              key={calendarRefreshKey}
              src={calendarEmbedUrl}
              style={{ border: 0 }}
              width="100%"
              height="720"
              frameBorder="0"
              scrolling="no"
              title="יומן פגישות ייעוץ"
            />
          </div>
        </div>
      </div>
    </div>
  );
}