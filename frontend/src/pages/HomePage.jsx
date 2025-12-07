// src/pages/HomePage.jsx
import React, { useEffect, useState } from 'react';
import { getHomeSummary } from '../api/metricsApi';
import KpiCard from '../components/KpiCard';

function HomePage() {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadData = async () => {
    try {
      setError('');
      const data = await getHomeSummary();
      setSummary(data);
    } catch (err) {
      console.error(err);
      setError('אירעה שגיאה בטעינת הנתונים. נסה שוב.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const id = setInterval(loadData, 30000); // ריענון כל 30 שניות
    return () => clearInterval(id);
  }, []);

  return (
    <div className="home-root">
      <header className="home-header">
        {/* כפתור התחברות – ימין למעלה */}
        <div className="home-login">
          <button className="login-main-btn">אזור אישי</button>
          <span className="login-subtext">
            כניסת מנהל מערכת / הנהלת קמפוס
          </span>
        </div>

        {/* לוגו + כותרת במרכז */}
        <div className="home-title-center">
          <img
            src="/SCE_logo.png"
            alt="SCE"
            className="home-logo"
          />
          <h1 className="home-title-he">
            סיכום פעילות מחלקת הרישום
          </h1>
          <p className="home-subtitle-he">
            תצוגה מרוכזת של לידים, פגישות ומכירות – בזמן כמעט אמת.
          </p>
        </div>
      </header>

      {error && !summary && (
        <div className="home-error">{error}</div>
      )}

      {loading && !summary ? (
        <div className="columns-wrapper">
          <div className="category-card">
            <div className="home-skeleton-card" />
          </div>
          <div className="category-card">
            <div className="home-skeleton-card" />
          </div>
          <div className="category-card">
            <div className="home-skeleton-card" />
          </div>
        </div>
      ) : (
        <>
          <div className="columns-wrapper">
            {/* לידים */}
            <section className="category-card">
              <h2 className="category-title">לידים</h2>
              <div className="category-grid">
                <KpiCard
                  title="סה״כ לידים"
                  value={summary?.totalLeads}
                  trendText="+12% לעומת חודש קודם"
                  trendType="up"
                />
                <KpiCard
                  title="לידים חדשים החודש"
                  value={64}
                  trendText="+5% לעומת שנה שעברה"
                  trendType="up"
                />
                <KpiCard
                  title="לידים בטיפול"
                  value={38}
                  trendText="ללא שינוי מהשבוע שעבר"
                  trendType="neutral"
                />
                <KpiCard
                  title="לידים סגורים"
                  value={summary ? Math.floor(summary.totalLeads * 0.3) : '-'}
                  trendText="-3% מיעד המחלקה"
                  trendType="down"
                />
              </div>
            </section>

            {/* מכירות */}
            <section className="category-card">
              <h2 className="category-title">מכירות</h2>
              <div className="category-grid">
                <KpiCard
                  title="סה״כ מכירות"
                  value={summary?.totalSales}
                  trendText="-3% מיעד החודש"
                  trendType="down"
                />
                <KpiCard
                  title="מכירות חדשות"
                  value={12}
                  trendText="+4% לעומת חודש קודם"
                  trendType="up"
                />
                <KpiCard
                  title="אחוז המרה מלידים"
                  value="18%"
                  trendText="+2 נק׳ לעומת שנה שעברה"
                  trendType="up"
                />
                <KpiCard
                  title="לקוחות חוזרים"
                  value={5}
                  trendText="יציב"
                  trendType="neutral"
                />
              </div>
            </section>

            {/* פגישות */}
            <section className="category-card">
              <h2 className="category-title">פגישות</h2>
              <div className="category-grid">
                <KpiCard
                  title="סה״כ פגישות"
                  value={summary?.totalMeetings}
                  trendText="יציב ביחס לשבוע שעבר"
                  trendType="neutral"
                />
                <KpiCard
                  title="פגישות היום"
                  value={6}
                  trendText="+1 לעומת אתמול"
                  trendType="up"
                />
                <KpiCard
                  title="פגישות מבוטלות"
                  value={3}
                  trendText="+1% ביטולים"
                  trendType="down"
                />
                <KpiCard
                  title="פגישות עתידיות"
                  value={19}
                  trendText="שבוע עמוס"
                  trendType="up"
                />
              </div>
            </section>
          </div>

          {summary?.lastUpdated && (
            <p className="home-updated-he">
              נתונים מעודכנים ל־{' '}
              {new Date(summary.lastUpdated).toLocaleString('he-IL')}
            </p>
          )}
        </>
      )}
    </div>
  );
}

export default HomePage;
