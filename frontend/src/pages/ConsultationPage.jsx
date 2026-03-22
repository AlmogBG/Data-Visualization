import React, { useEffect, useMemo, useState } from "react";
import TopNavbar from "../components/TopNavbar";
import Sidebar from "../components/Sidebar";
import {
  HiOutlineMagnifyingGlass,
  HiOutlineUserPlus,
  HiOutlineCalendarDays,
  HiOutlineClipboardDocumentList,
} from "react-icons/hi2";
import {
  getConsultationFormOptions,
  searchLeads,
  createLead,
  createConsultation,
  getLeadConsultations,
  updateConsultation,
} from "../api/consultationApi";

const campusOptions = ["אשדוד", "באר שבע"];
const areaOptions = ["דרום", "מרכז", "צפון", "שפלה", "ירושלים"];
const sourceOptions = [
  "פייסבוק",
  "אינסטגרם",
  "גוגל",
  "אתר",
  "טלפון",
  "המלצה",
  "אחר",
];

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

function inputClass(hasError, disabled = false) {
  return [
    "w-full rounded-2xl bg-white/10 px-4 py-3 text-white placeholder:text-white/35 outline-none ring-1 transition",
    hasError ? "ring-red-400/70 focus:ring-red-300" : "ring-white/10",
    disabled ? "disabled:opacity-70" : "",
  ].join(" ");
}

function Card({ title, icon: Icon, children, className = "" }) {
  return (
    <section
      className={[
        "rounded-[32px] bg-[#3b3e47] p-6 shadow-[0_18px_60px_rgba(0,0,0,0.40)]",
        className,
      ].join(" ")}
    >
      <div className="mb-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Icon className="text-2xl text-sky-300" />
          <h2 className="text-2xl font-extrabold">{title}</h2>
        </div>
      </div>
      {children}
    </section>
  );
}

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

  function handleSelectLead(lead) {
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

    setLeadErrors({});
    setConsultations(lead.consultations || []);
  }

  function handleClearSearchAndLeadSection() {
    setSearchValues(emptySearchForm);
    setSearchResults([]);
    setSelectedLead(null);
    setConsultations([]);
    setEditingConsultationId(null);
    setLeadForm(emptyLeadForm);
    setLeadErrors({});
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

  async function handleCreateLead() {
    try {
      if (!validateLeadForm()) return;

      setSavingLead(true);
      const data = await createLead(leadForm);
      const lead = data.lead;

      setLeadForm(emptyLeadForm);
      setLeadErrors({});
      setSelectedLead(null);
      setConsultations([]);
      setEditingConsultationId(null);

      setSearchValues({
        q: "",
        phone: lead.phone || "",
        email: lead.email || "",
        fullName: lead.fullName || "",
      });

      setSearchResults([
        {
          id: lead.id,
          fullName: lead.fullName,
          phone: lead.phone || "",
          email: lead.email || "",
          campus: lead.campus || "",
          area: lead.area || "",
          status: lead.status || "",
          source: lead.source || "",
          department: lead.department || null,
          city: lead.city || null,
          consultations: [],
        },
      ]);

      alert("המועמד נוצר בהצלחה ונוסף לתוצאות החיפוש");
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
    } catch (error) {
      alert(error.message);
    } finally {
      setSavingConsultation(false);
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

      <div className="mx-auto max-w-[1500px] px-6 pt-28 pb-14">
        <div className="mt-8 text-center">
          <h1 className="flex items-center justify-center gap-3 text-4xl font-extrabold tracking-tight">
            <HiOutlineCalendarDays className="text-4xl text-sky-300" />
            פגישת ייעוץ
          </h1>
          <p className="mt-3 text-base text-white/75">
            חיפוש מועמד, יצירת מועמד חדש, יצירת פגישה חדשה ועריכת פגישות קיימות
          </p>
        </div>

        <div className="mt-10 grid grid-cols-1 gap-8 2xl:grid-cols-12">
          <Card
            title="חיפוש מועמד קיים"
            icon={HiOutlineMagnifyingGlass}
            className="2xl:col-span-4"
          >
            <div className="space-y-4">
              <input
                type="text"
                placeholder="חיפוש כללי"
                value={searchValues.q}
                onChange={(e) =>
                  setSearchValues((prev) => ({ ...prev, q: e.target.value }))
                }
                className="w-full rounded-2xl bg-white/10 px-4 py-4 text-white placeholder:text-white/35 outline-none ring-1 ring-white/10"
              />

              <input
                type="text"
                placeholder="טלפון"
                value={searchValues.phone}
                onChange={(e) =>
                  setSearchValues((prev) => ({ ...prev, phone: e.target.value }))
                }
                className="w-full rounded-2xl bg-white/10 px-4 py-4 text-white placeholder:text-white/35 outline-none ring-1 ring-white/10"
              />

              <input
                type="text"
                placeholder="אימייל"
                value={searchValues.email}
                onChange={(e) =>
                  setSearchValues((prev) => ({ ...prev, email: e.target.value }))
                }
                className="w-full rounded-2xl bg-white/10 px-4 py-4 text-white placeholder:text-white/35 outline-none ring-1 ring-white/10"
              />

              <input
                type="text"
                placeholder="שם מלא"
                value={searchValues.fullName}
                onChange={(e) =>
                  setSearchValues((prev) => ({
                    ...prev,
                    fullName: e.target.value,
                  }))
                }
                className="w-full rounded-2xl bg-white/10 px-4 py-4 text-white placeholder:text-white/35 outline-none ring-1 ring-white/10"
              />

              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={handleSearch}
                  disabled={searching}
                  className="w-full rounded-2xl bg-sky-500/20 px-4 py-4 font-bold text-sky-100 ring-1 ring-sky-300/30 transition hover:bg-sky-500/30 disabled:opacity-60"
                >
                  {searching ? "מחפש..." : "חפש מועמד"}
                </button>

                <button
                  type="button"
                  onClick={handleClearSearchAndLeadSection}
                  className="w-full rounded-2xl bg-white/10 px-4 py-4 font-bold text-white ring-1 ring-white/10 transition hover:bg-white/15"
                >
                  נקה טופס
                </button>
              </div>
            </div>

            <div className="mt-8">
              <div className="mb-3 text-sm font-bold text-white/80">
                תוצאות חיפוש
              </div>

              <div className="max-h-[320px] space-y-3 overflow-y-auto pr-1">
                {searchResults.map((lead) => (
                  <button
                    key={lead.id}
                    type="button"
                    onClick={() => handleSelectLead(lead)}
                    className="w-full rounded-2xl bg-white/5 p-4 text-right ring-1 ring-white/10 transition hover:bg-white/10"
                  >
                    <div className="text-lg font-bold">{lead.fullName}</div>
                    <div className="mt-1 text-sm text-white/70">
                      {lead.email || "-"} | {lead.phone || "-"}
                    </div>
                    <div className="mt-1 text-xs text-white/55">
                      {lead.department?.name || "-"} | {lead.city?.town || "-"}
                    </div>
                  </button>
                ))}

                {!searching && searchResults.length === 0 ? (
                  <div className="rounded-2xl bg-white/5 p-5 text-sm text-white/60 ring-1 ring-white/10">
                    אין תוצאות להצגה
                  </div>
                ) : null}
              </div>
            </div>
          </Card>

          <Card
            title="פרטי מועמד"
            icon={HiOutlineUserPlus}
            className="2xl:col-span-4"
          >
            <div className="grid grid-cols-1 gap-3">
              <input
                type="text"
                placeholder="שם מלא"
                value={leadForm.fullName}
                onChange={(e) => {
                  setLeadForm((prev) => ({ ...prev, fullName: e.target.value }));
                  setLeadErrors((prev) => ({ ...prev, fullName: "" }));
                }}
                disabled={isExistingLead}
                className={inputClass(!!leadErrors.fullName, isExistingLead)}
              />
              {leadErrors.fullName ? (
                <div className="text-sm text-red-300">{leadErrors.fullName}</div>
              ) : null}

              <input
                type="text"
                placeholder="טלפון"
                value={leadForm.phone}
                onChange={(e) => {
                  setLeadForm((prev) => ({ ...prev, phone: e.target.value }));
                  setLeadErrors((prev) => ({ ...prev, phone: "" }));
                }}
                disabled={isExistingLead}
                className={inputClass(!!leadErrors.phone, isExistingLead)}
              />
              {leadErrors.phone ? (
                <div className="text-sm text-red-300">{leadErrors.phone}</div>
              ) : null}

              <input
                type="email"
                placeholder="אימייל"
                value={leadForm.email}
                onChange={(e) => {
                  setLeadForm((prev) => ({ ...prev, email: e.target.value }));
                  setLeadErrors((prev) => ({ ...prev, email: "" }));
                }}
                disabled={isExistingLead}
                className={inputClass(!!leadErrors.email, isExistingLead)}
              />
              {leadErrors.email ? (
                <div className="text-sm text-red-300">{leadErrors.email}</div>
              ) : null}

              <select
                value={leadForm.campus}
                onChange={(e) => {
                  setLeadForm((prev) => ({ ...prev, campus: e.target.value }));
                  setLeadErrors((prev) => ({ ...prev, campus: "" }));
                }}
                disabled={isExistingLead}
                className={inputClass(!!leadErrors.campus, isExistingLead)}
              >
                <option value="" className="text-black">
                  בחר קמפוס
                </option>
                {campusOptions.map((item) => (
                  <option key={item} value={item} className="text-black">
                    {item}
                  </option>
                ))}
              </select>
              {leadErrors.campus ? (
                <div className="text-sm text-red-300">{leadErrors.campus}</div>
              ) : null}

              <select
                value={leadForm.area}
                onChange={(e) => {
                  setLeadForm((prev) => ({ ...prev, area: e.target.value }));
                  setLeadErrors((prev) => ({ ...prev, area: "" }));
                }}
                disabled={isExistingLead}
                className={inputClass(!!leadErrors.area, isExistingLead)}
              >
                <option value="" className="text-black">
                  בחר אזור
                </option>
                {areaOptions.map((item) => (
                  <option key={item} value={item} className="text-black">
                    {item}
                  </option>
                ))}
              </select>
              {leadErrors.area ? (
                <div className="text-sm text-red-300">{leadErrors.area}</div>
              ) : null}

              <select
                value={leadForm.source}
                onChange={(e) => {
                  setLeadForm((prev) => ({ ...prev, source: e.target.value }));
                  setLeadErrors((prev) => ({ ...prev, source: "" }));
                }}
                disabled={isExistingLead}
                className={inputClass(!!leadErrors.source, isExistingLead)}
              >
                <option value="" className="text-black">
                  בחר מקור הגעה
                </option>
                {sourceOptions.map((item) => (
                  <option key={item} value={item} className="text-black">
                    {item}
                  </option>
                ))}
              </select>
              {leadErrors.source ? (
                <div className="text-sm text-red-300">{leadErrors.source}</div>
              ) : null}

              <select
                value={leadForm.departmentId}
                onChange={(e) => {
                  setLeadForm((prev) => ({
                    ...prev,
                    departmentId: e.target.value,
                  }));
                  setLeadErrors((prev) => ({ ...prev, departmentId: "" }));
                }}
                disabled={isExistingLead || optionsLoading}
                className={inputClass(
                  !!leadErrors.departmentId,
                  isExistingLead || optionsLoading
                )}
              >
                <option value="" className="text-black">
                  בחר מחלקה
                </option>
                {departments.map((item) => (
                  <option key={item.id} value={item.id} className="text-black">
                    {item.name}
                  </option>
                ))}
              </select>
              {leadErrors.departmentId ? (
                <div className="text-sm text-red-300">
                  {leadErrors.departmentId}
                </div>
              ) : null}

              <select
                value={leadForm.cityId}
                onChange={(e) => {
                  setLeadForm((prev) => ({
                    ...prev,
                    cityId: e.target.value,
                  }));
                  setLeadErrors((prev) => ({ ...prev, cityId: "" }));
                }}
                disabled={isExistingLead || optionsLoading}
                className={inputClass(
                  !!leadErrors.cityId,
                  isExistingLead || optionsLoading
                )}
              >
                <option value="" className="text-black">
                  בחר עיר
                </option>
                {cities.map((item) => (
                  <option key={item.id} value={item.id} className="text-black">
                    {item.town}
                  </option>
                ))}
              </select>
              {leadErrors.cityId ? (
                <div className="text-sm text-red-300">{leadErrors.cityId}</div>
              ) : null}
            </div>

            {!isExistingLead ? (
              <div className="mt-6">
                <button
                  type="button"
                  onClick={handleCreateLead}
                  disabled={savingLead}
                  className="w-full rounded-2xl bg-sky-500/20 px-4 py-4 font-bold text-sky-100 ring-1 ring-sky-300/30 transition hover:bg-sky-500/30 disabled:opacity-60"
                >
                  {savingLead ? "שומר..." : "שמור מועמד חדש"}
                </button>
              </div>
            ) : (
              <div className="mt-6 rounded-2xl bg-white/5 p-5 ring-1 ring-white/10">
                <div className="mb-3 text-lg font-bold text-white">
                  מועמד קיים שנבחר
                </div>
                <div className="space-y-2 text-sm text-white/75">
                  <div>שם: {selectedLeadSummary?.name}</div>
                  <div>טלפון: {selectedLeadSummary?.phone}</div>
                  <div>אימייל: {selectedLeadSummary?.email}</div>
                  <div>קמפוס: {selectedLeadSummary?.campus}</div>
                  <div>אזור: {selectedLeadSummary?.area}</div>
                  <div>מחלקה: {selectedLeadSummary?.department}</div>
                  <div>עיר: {selectedLeadSummary?.city}</div>
                  <div>מקור: {selectedLeadSummary?.source}</div>
                  <div>סטטוס: {selectedLeadSummary?.status}</div>
                </div>
              </div>
            )}
          </Card>

          <Card
            title="פגישת ייעוץ"
            icon={HiOutlineCalendarDays}
            className="2xl:col-span-4"
          >
            <div className="grid grid-cols-1 gap-3">
              <input
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
                className={inputClass(!!consultationErrors.meetingDate)}
              />
              {consultationErrors.meetingDate ? (
                <div className="text-sm text-red-300">
                  {consultationErrors.meetingDate}
                </div>
              ) : null}

              <input
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
                className={inputClass(!!consultationErrors.meetingTime)}
              />
              {consultationErrors.meetingTime ? (
                <div className="text-sm text-red-300">
                  {consultationErrors.meetingTime}
                </div>
              ) : null}

              <select
                value={consultationForm.outcome}
                onChange={(e) =>
                  setConsultationForm((prev) => ({
                    ...prev,
                    outcome: e.target.value,
                  }))
                }
                className={inputClass(false)}
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
              </select>

              <select
                value={consultationForm.arrived}
                onChange={(e) =>
                  setConsultationForm((prev) => ({
                    ...prev,
                    arrived: e.target.value,
                  }))
                }
                className={inputClass(false)}
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
              </select>

              <textarea
                placeholder="הערות"
                value={consultationForm.notes}
                onChange={(e) =>
                  setConsultationForm((prev) => ({
                    ...prev,
                    notes: e.target.value,
                  }))
                }
                rows={5}
                className={inputClass(false)}
              />

              {consultationErrors.lead ? (
                <div className="text-sm text-red-300">
                  {consultationErrors.lead}
                </div>
              ) : null}
            </div>

            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={handleSaveConsultation}
                disabled={savingConsultation}
                className="w-full rounded-2xl bg-sky-500/20 px-4 py-4 font-bold text-sky-100 ring-1 ring-sky-300/30 transition hover:bg-sky-500/30 disabled:opacity-60"
              >
                {savingConsultation
                  ? "שומר..."
                  : editingConsultationId
                  ? "עדכן פגישה"
                  : "שמור פגישה"}
              </button>

              <button
                type="button"
                onClick={handleClearConsultationForm}
                className="w-full rounded-2xl bg-white/10 px-4 py-4 font-bold text-white ring-1 ring-white/10 transition hover:bg-white/15"
              >
                נקה טופס
              </button>
            </div>
          </Card>
        </div>

        <Card
          title="רשימת פגישות קודמות"
          icon={HiOutlineClipboardDocumentList}
          className="mt-8"
        >
          {!selectedLead ? (
            <div className="rounded-2xl bg-white/5 p-5 text-white/65 ring-1 ring-white/10">
              בחר מועמד קיים או צור מועמד חדש כדי לראות ולהוסיף פגישות
            </div>
          ) : consultations.length === 0 ? (
            <div className="rounded-2xl bg-white/5 p-5 text-white/65 ring-1 ring-white/10">
              אין עדיין פגישות שמורות למועמד זה
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[950px] border-separate border-spacing-y-3">
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
                      className="rounded-2xl bg-white/5 ring-1 ring-white/10"
                    >
                      <td className="px-3 py-4">
                        {formatDateTime(item.meetingDate)}
                      </td>
                      <td className="px-3 py-4">
                        {getOutcomeLabel(item.outcome)}
                      </td>
                      <td className="px-3 py-4">
                        {item.arrived === true
                          ? "כן"
                          : item.arrived === false
                          ? "לא"
                          : "-"}
                      </td>
                      <td className="px-3 py-4">{item.notes || "-"}</td>
                      <td className="px-3 py-4">
                        {formatDateTime(item.createdAt)}
                      </td>
                      <td className="px-3 py-4">
                        <button
                          type="button"
                          onClick={() => handleEditConsultation(item)}
                          className="rounded-xl bg-sky-500/20 px-4 py-2 text-sm font-bold text-sky-100 ring-1 ring-sky-300/30 transition hover:bg-sky-500/30"
                        >
                          ערוך
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}