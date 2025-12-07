// src/components/Sidebar.jsx
import React from 'react';
import './Sidebar.css';

function Sidebar({ isOpen, onToggle }) {
  return (
    <>
      {/* כפתור  */}
      <button
        type="button"
        className={`sidebar-toggle ${isOpen ? 'open' : ''}`}
        onClick={onToggle}
        aria-label="פתיחת תפריט ניווט"
      >
        <span />
        <span />
        <span />
      </button>

      {/* שכבת רקע */}
      <div
        className={`sidebar-overlay ${isOpen ? 'open' : ''}`}
        onClick={onToggle}
      />

      {/* התפריט עצמו */}
      <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <button
            type="button"
            className="sidebar-close-btn"
            onClick={onToggle}
            aria-label="סגירת תפריט"
          >
            
          </button>

          <h2>דף הבית</h2>
          <div className="sidebar-subtitle">
            ניווט בין הדוחות והתצוגות
          </div>
        </div>

        <nav className="sidebar-nav">
          <a href="#home" onClick={onToggle}>דף הבית</a>
          <a href="#report1" onClick={onToggle}>דוח 1- ביקושי המחלקות של הנרשמים למכללה </a>
          <a href="#report2" onClick={onToggle}> דוח 2- 20 המדיות המובילות בשנה"ל בהשוואה לאשתקד</a>
          <a href="#report3" onClick={onToggle}>דוח 3- שמות הישובים של הנרשמים לשנה"ל בחודש זה על פי המחלקה וקמפוס </a>
          <a href="#report4" onClick={onToggle}>דוח 3- כמה הגיעו לפגישות יעוץ/נרשמו לפגישות יעוץ</a>
          <a href="#report5" onClick={onToggle}>דוח 5- תוצאות פ.יעוץ השוואה בין הקמפוסים</a>
        </nav>
      </aside>
    </>
  );
}

export default Sidebar;
