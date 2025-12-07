// src/App.js
import React, { useState } from 'react';
import './App.css';

import HomePage from './pages/HomePage';
import Sidebar from './components/Sidebar';

function App() {
  // state לפתיחה/סגירה של התפריט
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const handleSidebarToggle = () => {
    setIsSidebarOpen((prev) => !prev);
  };

  return (
    <div className="app-root">
      {/* תפריט צד – מקבל סטייט ופונקציית טוגל */}
      <Sidebar isOpen={isSidebarOpen} onToggle={handleSidebarToggle} />

      {/* אזור התוכן המרכזי */}
      <main className="app-main" id="home">
        <HomePage />
      </main>
    </div>
  );
}

export default App;
