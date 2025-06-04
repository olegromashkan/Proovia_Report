import { useEffect } from 'react';
import Head from 'next/head';

export default function Home() {
  useEffect(() => {
    const verticalNavbar = document.getElementById('verticalNavbar');
    const mainContent = document.getElementById('mainContent');
    const navbarToggle = document.getElementById('navbarToggle');
    const toggleIconOpen = document.getElementById('toggleIconOpen');
    const toggleIconClose = document.getElementById('toggleIconClose');
    const navbarToggleText = document.getElementById('navbarToggleText');

    function setNavbarState(isExpanded: boolean, animate = true) {
      if (!verticalNavbar || !mainContent) return;
      if (!animate) {
        verticalNavbar.style.transition = 'none';
        mainContent.style.transition = 'none';
      } else {
        verticalNavbar.style.transition = '';
        mainContent.style.transition = '';
      }
      if (isExpanded) {
        verticalNavbar.classList.add('is-expanded');
        mainContent.classList.add('navbar-expanded');
        if (toggleIconOpen) toggleIconOpen.style.display = 'block';
        if (toggleIconClose) toggleIconClose.style.display = 'none';
        if (navbarToggleText) navbarToggleText.textContent = 'Collapse';
      } else {
        verticalNavbar.classList.remove('is-expanded');
        mainContent.classList.remove('navbar-expanded');
        if (toggleIconOpen) toggleIconOpen.style.display = 'none';
        if (toggleIconClose) toggleIconClose.style.display = 'block';
        if (navbarToggleText) navbarToggleText.textContent = 'Expand';
      }
      localStorage.setItem('navbarState', isExpanded ? 'expanded' : 'collapsed');
      if (!animate) {
        setTimeout(() => {
          verticalNavbar.style.transition = '';
          mainContent.style.transition = '';
        }, 50);
      }
    }

    if (navbarToggle) {
      navbarToggle.addEventListener('click', () => {
        const isExpanded = verticalNavbar?.classList.contains('is-expanded');
        setNavbarState(!isExpanded, true);
      });
    }

    const savedNavbarState = localStorage.getItem('navbarState');
    setNavbarState(savedNavbarState === 'expanded', false);

    function initMiniCalendar() {
      const miniCalendar = document.getElementById('miniCalendar');
      if (!miniCalendar) return;
      miniCalendar.innerHTML = '';
      const today = new Date();
      const currentMonth = 2; // March 2025 as in snippet
      const currentYear = 2025;
      let firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();
      const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
      const firstDayAdjusted = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1;
      for (let i = 0; i < firstDayAdjusted; i++) {
        const emptyDay = document.createElement('div');
        emptyDay.className = 'mini-calendar-day opacity-30 pointer-events-none';
        miniCalendar.appendChild(emptyDay);
      }
      for (let day = 1; day <= daysInMonth; day++) {
        const dayEl = document.createElement('div');
        dayEl.className = 'mini-calendar-day';
        dayEl.textContent = String(day);
        if (
          currentYear === today.getFullYear() &&
          currentMonth === today.getMonth() &&
          day === today.getDate()
        ) {
          dayEl.classList.add('active');
        }
        dayEl.addEventListener('click', () => {
          const active = miniCalendar.querySelector('.mini-calendar-day.active');
          if (active) active.classList.remove('active');
          dayEl.classList.add('active');
          console.log(`Calendar day ${day} clicked.`);
        });
        miniCalendar.appendChild(dayEl);
      }
    }
    initMiniCalendar();

    const themeToggleV = document.getElementById('themeToggleInputV') as HTMLInputElement | null;
    if (themeToggleV) {
      function applyThemePreference(theme: 'light' | 'dark') {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);
        themeToggleV.checked = theme === 'light';
      }
      const savedTheme = localStorage.getItem('theme');
      const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      let initialTheme: 'light' | 'dark' = 'dark';
      if (savedTheme === 'light' || savedTheme === 'dark') {
        initialTheme = savedTheme;
      } else {
        initialTheme = systemPrefersDark ? 'dark' : 'light';
      }
      applyThemePreference(initialTheme);
      themeToggleV.addEventListener('change', function () {
        applyThemePreference(this.checked ? 'light' : 'dark');
      });
    }
  }, []);

  return (
    <>
      <Head>
        <title>Dashboard - Custom Vertical Nav</title>
        <link href="https://cdn.jsdelivr.net/npm/daisyui@5.0.0-beta.1/daisyui.css" rel="stylesheet" />
        <script src="https://cdn.tailwindcss.com" />
      </Head>
      <style jsx global>{`
        body {
          display: flex;
          min-height: 100vh;
          overflow-x: hidden;
          background-color: hsl(var(--b1));
          color: hsl(var(--bc));
        }
        .vertical-navbar {
          display: flex;
          flex-direction: column;
          height: 100vh;
          position: sticky;
          top: 0;
          z-index: 50;
          background-color: hsl(var(--b2));
          padding: 1rem;
          box-shadow: 0 2px 10px hsla(var(--sc) / 0.1);
          width: 5rem;
          transition: width 0.35s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .vertical-navbar.is-expanded {
          width: 16rem;
        }
        .navbar-brand {
          display: flex;
          align-items: center;
          padding-bottom: 1rem;
          margin-bottom: 1rem;
          border-bottom: 1px solid hsl(var(--b3));
          width: 100%;
          overflow: hidden;
          justify-content: center;
          transition: justify-content 0.35s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .vertical-navbar.is-expanded .navbar-brand {
          justify-content: flex-start;
        }
        .brand-image {
          height: 2.5rem;
          width: 2.5rem;
          flex-shrink: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 9999px;
          background-color: hsl(var(--p));
          color: hsl(var(--pc));
        }
        .brand-text {
          opacity: 0;
          margin-left: 0;
          max-width: 0;
          white-space: nowrap;
          overflow: hidden;
          font-size: 1.25rem;
          font-weight: 600;
          color: hsl(var(--bc));
          transition: opacity 0.3s ease-in-out 0.1s, max-width 0.3s cubic-bezier(0.4, 0, 0.2, 1) 0.05s, margin-left 0.3s cubic-bezier(0.4, 0, 0.2, 1) 0.05s;
        }
        .vertical-navbar.is-expanded .brand-text {
          opacity: 1;
          margin-left: 0.75rem;
          max-width: 150px;
        }
        .nav-menu {
          list-style: none;
          padding: 0;
          margin: 0;
          width: 100%;
          flex-grow: 1;
          overflow-y: auto;
          overflow-x: hidden;
        }
        .nav-item .nav-link {
          overflow: hidden;
          white-space: nowrap;
        }
        .nav-icon {
          height: 1.5rem;
          width: 1.5rem;
          flex-shrink: 0;
        }
        .nav-text {
          opacity: 0;
          margin-left: 0;
          max-width: 0;
          white-space: nowrap;
          overflow: hidden;
          transition: opacity 0.3s ease-in-out 0.1s, max-width 0.3s cubic-bezier(0.4, 0, 0.2, 1) 0.05s, margin-left 0.3s cubic-bezier(0.4, 0, 0.2, 1) 0.05s;
        }
        .vertical-navbar.is-expanded .nav-text {
          opacity: 1;
          margin-left: 0.75rem;
          max-width: 150px;
        }
        .navbar-footer {
          margin-top: auto;
          padding-top: 1rem;
          border-top: 1px solid hsl(var(--b3));
          width: 100%;
          display: flex;
          flex-direction: column;
          align-items: center;
          transition: align-items 0.35s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .vertical-navbar.is-expanded .navbar-footer {
          align-items: flex-start;
        }
        .navbar-footer .btn,
        .navbar-footer .swap {
          margin-top: 0.5rem;
        }
        .main-content-wrapper {
          flex-grow: 1;
          padding-left: 5rem;
          transition: padding-left 0.35s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .main-content-wrapper.navbar-expanded {
          padding-left: 16rem;
        }
        .dashboard-content-area {
          max-width: 1600px;
          margin: 0 auto;
          padding: 1.5rem;
        }
        .mini-calendar {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          gap: 4px;
          margin-top: 1rem;
        }
        .mini-calendar-day {
          aspect-ratio: 1/1;
          display: flex;
          justify-content: center;
          align-items: center;
          font-size: 0.75rem;
          border-radius: var(--rounded-btn, 0.5rem);
          cursor: pointer;
          transition: background-color 0.2s ease-in-out, color 0.2s ease-in-out;
          border: 1px solid hsl(var(--b3));
        }
        .mini-calendar-day:hover {
          background-color: hsl(var(--b3));
          color: hsl(var(--p));
        }
        .mini-calendar-day.active {
          background-color: hsl(var(--p));
          color: hsl(var(--pc));
          border-color: hsl(var(--p));
        }
      `}</style>
      <aside id="verticalNavbar" className="vertical-navbar">
        <div className="navbar-brand">
          <div className="brand-image">D</div>
          <span className="brand-text">Dashboard</span>
        </div>
        <ul className="nav-menu">
          <li className="nav-item">
            <a href="/" className="nav-link btn btn-ghost justify-start w-full text-left mb-1 font-normal normal-case">
              <svg className="nav-icon" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h7.5" />
              </svg>
              <span className="nav-text">Home</span>
            </a>
          </li>
          <li className="nav-item">
            <a href="/invoice.html" className="nav-link btn btn-ghost justify-start w-full text-left mb-1 font-normal normal-case">
              <svg className="nav-icon" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
              </svg>
              <span className="nav-text">Receipt Generator</span>
            </a>
          </li>
          <li className="nav-item">
            <a href="/hours02.html" className="nav-link btn btn-ghost justify-start w-full text-left mb-1 font-normal normal-case">
              <svg className="nav-icon" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="nav-text">Driver Hours</span>
            </a>
          </li>
          <li className="nav-item">
            <a href="/order_stats.html" className="nav-link btn btn-ghost justify-start w-full text-left mb-1 font-normal normal-case">
              <svg className="nav-icon" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v11.25A2.25 2.25 0 006 16.5h12A2.25 2.25 0 0020.25 14.25V3M3.75 21h16.5M16.5 3.75h.008v.008h-.008V3.75zM12.375 3.75h.008v.008h-.008V3.75zM8.25 3.75h.008v.008h-.008V3.75z" />
              </svg>
              <span className="nav-text">Order Statistics</span>
            </a>
          </li>
          <li className="nav-item">
            <a href="/punctuality.html" className="nav-link btn btn-ghost justify-start w-full text-left mb-1 font-normal normal-case">
              <svg className="nav-icon" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
              </svg>
              <span className="nav-text">Trips</span>
            </a>
          </li>
        </ul>
        <div className="navbar-footer">
          <label className="swap swap-rotate btn btn-ghost justify-start w-full normal-case" aria-label="Toggle theme">
            <input type="checkbox" className="theme-controller" value="light" id="themeToggleInputV" />
            <svg className="nav-icon swap-on" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" />
            </svg>
            <svg className="nav-icon swap-off" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" />
            </svg>
            <span className="nav-text">Theme</span>
          </label>
          <button id="navbarToggle" className="btn btn-ghost justify-start w-full normal-case" aria-label="Toggle menu">
            <svg id="toggleIconOpen" className="nav-icon" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" style={{ display: 'none' }}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M18.75 19.5l-7.5-7.5 7.5-7.5m-6 15L5.25 12l7.5-7.5" />
            </svg>
            <svg id="toggleIconClose" className="nav-icon" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 4.5l7.5 7.5-7.5 7.5m-6-15l7.5 7.5-7.5 7.5" />
            </svg>
            <span className="nav-text" id="navbarToggleText">Collapse</span>
          </button>
        </div>
      </aside>
      <main id="mainContent" className="main-content-wrapper">
        <div id="calendarContainer" className="calendar-container"></div>
        <div className="dashboard-content-area">
          <div className="flex justify-center">
            <div className="w-full max-w-md">
              <div className="card bg-base-100 shadow-xl">
                <div className="card-body">
                  <h2 className="card-title text-lg mb-2 justify-center">Quick Date Selection</h2>
                  <div className="grid grid-cols-7 gap-1 text-center text-xs mb-2 opacity-70">
                    <div>Mo</div>
                    <div>Tu</div>
                    <div>We</div>
                    <div>Th</div>
                    <div>Fr</div>
                    <div>Sa</div>
                    <div>Su</div>
                  </div>
                  <div className="mini-calendar" id="miniCalendar"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}

