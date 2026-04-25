# 📊 Data Visualization – Registration Department Dashboard

A full-stack web application for managing, analyzing, and visualizing registration department activity.

The system provides a centralized dashboard for **leads, consultations, sales, geographic data, and operational reports**.  
It is designed to help the registration department monitor KPIs, identify trends, and support decision-making in real time.

---

## ✨ Project Overview

This project is a **Data Visualization platform** developed for the **Registration Department**.

The system includes:

- 🔐 Secure login system
- 👥 Role-based access
- 📈 Main dashboard with KPIs
- 🧑‍💼 Leads management
- 📅 Consultation meetings management
- 📊 Monthly and yearly reports
- 🗺️ Geographic data analysis
- 💰 Sales and media source analysis
- 🗄️ PostgreSQL database integration
- 🔗 REST API backend
- 🖥️ Interactive charts and visual reports

The main purpose of the system is to provide a clear and accessible view of department activity, allowing users to understand performance, compare periods, and make better operational decisions.

---

## 🚀 Main Features

### 🔑 Authentication
- User login
- Password validation
- JWT-based authentication
- Role-based access support

### 🏠 Dashboard
The home page displays key KPIs such as:

- Total leads
- New leads
- Leads in progress
- Closed leads
- Total sales
- New sales
- Refunds
- Conversion rate
- Total consultation meetings
- Future meetings
- Cancelled meetings

### 📊 Reports
The system includes several visualization reports:

1. **📘 Report 1** – Monthly / yearly registration comparison  
2. **📙 Report 2** – Department demand analysis  
3. **📍 Report 3** – Geographic analysis by cities  
4. **📅 Report 4** – Consultation meetings analysis  
5. **📣 Report 5** – Leads and media source analysis  

### 🧾 Consultation Management
- Search existing leads
- Create new leads
- Update lead details
- Create consultation meetings
- Update consultation meetings
- Delete consultation meetings
- View previous consultations for a lead

---

## 🛠️ Tech Stack

### 🎨 Frontend
- React
- JavaScript
- Tailwind CSS
- Recharts
- Lucide React
- React Router DOM

### ⚙️ Backend
- Node.js
- Express.js
- Prisma ORM
- PostgreSQL
- bcrypt
- JSON Web Token (JWT)
- CORS
- dotenv

### 🗄️ Database
- PostgreSQL

### ☁️ Server / Deployment
- Ubuntu Server
- Node.js
- PostgreSQL
- Git / GitHub
- PM2 (optional)

---

## 📁 Project Structure

```txt
Data-Visualization/
│
├── Backend/
│   ├── prisma/
│   │   ├── schema.prisma
│   │   └── seed.js
│   │
│   ├── src/
│   │   ├── controllers/
│   │   ├── routes/
│   │   └── services/
│   │
│   ├── index.js
│   ├── hashPassword.js
│   ├── init.sql
│   ├── package.json
│   ├── package-lock.json
│   └── .env
│
├── frontend/
│   ├── public/
│   │
│   ├── src/
│   │   ├── api/
│   │   │   ├── consultationApi.js
│   │   │   └── metricsApi.js
│   │   │
│   │   ├── components/
│   │   ├── pages/
│   │   │   ├── ConsultationPage.jsx
│   │   │   ├── EditProfilePage.jsx
│   │   │   ├── HomePage.jsx
│   │   │   ├── LoginPage.jsx
│   │   │   ├── Report1.jsx
│   │   │   ├── Report2.jsx
│   │   │   ├── Report3.jsx
│   │   │   ├── Report4.jsx
│   │   │   └── Report5.jsx
│   │   │
│   │   ├── App.js
│   │   ├── App.jsx
│   │   ├── index.js
│   │   └── index.css
│   │
│   ├── package.json
│   ├── package-lock.json
│   └── .env
│
├── .gitignore
└── README.md
