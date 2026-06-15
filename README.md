# 📊 Data Visualization – Registration Department Management System

<p align="center">
  A full-stack information system for managing leads, consultation meetings, registration activity, and operational analytics for an academic registration department.
</p>

<p align="center">
  <strong>Final Project</strong><br>
  Yehuda Baza · Almog Ben-Gur
</p>


<p align="center">
  <img src="https://img.shields.io/badge/React-Frontend-61DAFB?logo=react&logoColor=white" alt="React">
  <img src="https://img.shields.io/badge/Node.js-Backend-339933?logo=node.js&logoColor=white" alt="Node.js">
  <img src="https://img.shields.io/badge/PostgreSQL-Database-4169E1?logo=postgresql&logoColor=white" alt="PostgreSQL">
  <img src="https://img.shields.io/badge/Prisma-ORM-2D3748?logo=prisma&logoColor=white" alt="Prisma">
  <img src="https://img.shields.io/badge/Tailwind_CSS-UI-06B6D4?logo=tailwindcss&logoColor=white" alt="Tailwind CSS">
  <img src="https://img.shields.io/badge/GitHub_Actions-CI%2FCD-2088FF?logo=githubactions&logoColor=white" alt="GitHub Actions">
</p>

<p align="center">
  🔐 Secure Authentication &nbsp;•&nbsp;
  👥 Lead Management &nbsp;•&nbsp;
  📅 Consultation Scheduling &nbsp;•&nbsp;
  📊 Interactive Reports &nbsp;•&nbsp;
  🗺️ Geographic Analysis
</p>

---

## 🧭 Table of Contents

1. [Project Overview](#project-overview)
2. [The Business Problem](#the-business-problem)
3. [Project Goals](#project-goals)
4. [Main Features](#main-features)
5. [System Architecture](#system-architecture)
6. [Technology Stack](#technology-stack)
7. [User Flow](#user-flow)
8. [System Modules](#system-modules)
9. [Reports and Data Visualization](#reports-and-data-visualization)
10. [Authentication, Authorization, and Security](#authentication-authorization-and-security)
11. [Database Design](#database-design)
12. [API Overview](#api-overview)
13. [Google Calendar Integration](#google-calendar-integration)
14. [Project Structure and File Responsibilities](#project-structure-and-file-responsibilities)
15. [Environment Variables](#environment-variables)
16. [Local Installation](#local-installation)
17. [Running the Project](#running-the-project)
18. [Testing](#testing)
19. [CI/CD and Deployment](#cicd-and-deployment)
20. [Operational Notes](#operational-notes)
21. [Future Improvements](#future-improvements)
22. [Project Team](#project-team)
23. [License](#license)

---

## 🚀 Project Overview

**Data Visualization – Registration Department Management System** is a full-stack web application developed to support the daily work of an academic registration department.

The system centralizes candidate and lead information, consultation meetings, registration statuses, departmental data, recruitment sources, and key performance indicators. It replaces scattered manual work with one organized operational platform.

The application combines:

- 👥 Lead and candidate management
- 📅 Consultation meeting management
- 📝 Registration activity tracking
- 🏫 Department and campus filtering
- 📊 Interactive dashboards
- 🎯 KPI cards
- 📈 Comparative reports
- 🗺️ Geographic analysis
- 📣 Recruitment media-source analysis
- 🗓️ Google Calendar integration
- 🔐 Authentication and role-based access control
- 🧪 Automated tests and CI/CD
- 🚀 Production deployment on a remote server

The system interface is designed for Hebrew-speaking users and supports a right-to-left working environment.

---

## ⚠️ The Business Problem

Registration departments often work with information distributed across spreadsheets, forms, calendars, emails, and separate internal systems.

This creates several problems:

- Candidate information is not managed in one location.
- Employees may have difficulty finding previous interactions with a candidate.
- Consultation meetings are difficult to monitor.
- Management lacks a current view of registration performance.
- It is difficult to compare departments, periods, campuses, and recruitment channels.
- Important trends may be discovered too late.
- Manual processes increase the risk of duplicate, missing, or inconsistent information.
- Sensitive operational information requires controlled access.

The project addresses these problems by creating one centralized system for operational work and managerial decision-making.

---

## 🎯 Project Goals

The main goals of the system are:

1. Centralize all relevant registration-department information.
2. Improve the daily workflow of registration representatives and managers.
3. Allow quick creation, search, and update of candidates and leads.
4. Preserve a history of consultation meetings.
5. Present clear and current operational indicators.
6. Support data-driven decision-making.
7. Reduce manual work and duplicate data entry.
8. improve data security through authentication and permissions.
9. provide a maintainable full-stack architecture.
10. support automated testing and controlled deployment.

---

## ✨ Main Features

### 🔐 Authentication

- Secure user login
- Password verification using hashed passwords
- JWT-based authentication
- Protected application routes
- Session persistence in browser storage
- Logout and access revocation
- Role-based authorization

### 👥 Lead and Candidate Management

- Search for an existing candidate
- Create a new candidate
- Update candidate details
- Store contact and registration information
- Filter data by relevant organizational fields
- Prevent unnecessary duplication
- Maintain consistent candidate information across the system

### 📅 Consultation Management

- Create a consultation meeting
- View previous meetings for a selected candidate
- Update meeting information
- Delete a meeting when permitted
- Store consultation result, notes, date, and relevant registration information
- Display the consultation schedule in the application

### 📊 Dashboard

- Central home page with key indicators
- Current operational summary
- KPI cards
- Charts and comparisons
- Visual monitoring of registration activity
- Quick access to reports and consultation management

### 📈 Data Visualization

- Comparative charts
- Monthly trends
- Outcome analysis
- Geographic distribution
- Media-source analysis
- Department and campus filtering
- Interactive charts using Recharts
- Map-based visualization

### 🗓️ Google Calendar

- Embedded consultation calendar
- Shared visibility of scheduled meetings
- Calendar display inside the consultation page
- Support for an organized scheduling workflow

### ⚙️ Operational Infrastructure

- PostgreSQL database
- Prisma ORM
- REST API
- GitHub source control
- GitHub Actions
- Automated tests
- Remote production server environment
- Remote-server deployment
- Environment-based configuration

---

## 🏗️ System Architecture

```mermaid
flowchart LR
    U[Registration Department User]
    F[React Frontend]
    A[Express REST API]
    P[Prisma ORM]
    D[(PostgreSQL Database)]
    G[Google Calendar]
    GH[GitHub Actions]
    S[Production Server]

    U --> F
    F -->|HTTP / JSON| A
    A --> P
    P --> D
    F --> G
    GH -->|Test and Deploy| S
    S --> F
    S --> A
    S --> D
```

### 🧱 Architecture Layers

| Layer | Responsibility |
|---|---|
| Presentation layer | React pages, forms, dashboards, charts, map, and navigation |
| API communication layer | Centralized frontend functions for sending requests to the backend |
| Backend routing layer | Maps HTTP endpoints to the correct controller |
| Business logic layer | Validation, authentication, queries, calculations, and response handling |
| Data access layer | Prisma Client and PostgreSQL |
| Security layer | JWT validation, password hashing, CORS rules, and role checks |
| Integration layer | Google Calendar and deployment services |
| Automation layer | GitHub Actions tests and deployment workflow |

---

## 🧰 Technology Stack

### 🖥️ Frontend

| Technology | Purpose |
|---|---|
| React | Building the user interface |
| React DOM | Rendering the React application |
| React Router DOM | Page routing and protected navigation |
| Tailwind CSS | Responsive interface styling |
| Recharts | Charts and interactive visualizations |
| Lucide React | Interface icons |
| React Icons | Additional icon components |
| Google Maps React API | Geographic visualization and map integration |
| Fetch API | Communication with backend endpoints |
| React Testing Library | Frontend component and interaction tests |
| Jest DOM | Additional DOM assertions for tests |

### 🧠 Backend

| Technology | Purpose |
|---|---|
| Node.js | Backend runtime |
| Express | REST API server |
| Prisma ORM | Database schema, queries, and data access |
| PostgreSQL | Relational database |
| JSON Web Token | Authentication tokens |
| bcryptjs | Password hashing and comparison |
| CORS | Restricting and controlling frontend access |
| dotenv | Loading environment variables |
| pg | PostgreSQL driver |
| Nodemon | Backend development server |

### 🚀 DevOps and Project Tools

| Tool | Purpose |
|---|---|
| Git | Version control |
| GitHub | Repository hosting and team collaboration |
| GitHub Actions | Continuous integration and deployment |
| SSH | Secure server administration and deployment |
| Qase | Test-case management and test documentation |
| Jira | Project and task management |
| VS Code | Development environment |
| Postman / API tools | Manual API verification |
| Google Calendar | Consultation scheduling and calendar display |

---

## 🔄 User Flow

1. The user enters the login page.
2. The frontend sends the username and password to the authentication endpoint.
3. The backend validates the user and compares the password hash.
4. A JWT is returned after successful authentication.
5. The token is stored in browser storage.
6. Protected pages become available according to the user's permissions.
7. The user can access the dashboard, reports, candidate search, and consultation management.
8. The frontend requests data from the backend API.
9. The backend retrieves and aggregates data through Prisma.
10. PostgreSQL returns the required operational information.
11. The frontend presents the information using cards, tables, charts, and maps.
12. Unauthorized or expired sessions are redirected to the login page.

---

## 🧩 System Modules

### 1. 🔑 Login Module

Responsible for authenticating system users.

Main responsibilities:

- Receive login details
- Validate required fields
- Locate the user in the database
- Compare the submitted password with the stored hash
- Create a JWT
- Return user and permission information
- Reject invalid login attempts

### 2. 📊 Home Dashboard Module

Presents a current summary of the department's operational activity.

The dashboard may include:

- Total candidates
- Total consultations
- Registration results
- Current-period activity
- Distribution by department or campus
- Important performance indicators
- Quick navigation to reports

### 3. 👥 Candidate and Lead Module

Responsible for the complete lead workflow.

Main operations:

- Search
- Create
- Update
- Display candidate information
- Connect consultation records to the correct candidate
- Preserve registration and contact information

### 4. 📅 Consultation Module

Responsible for consultation meetings.

Main operations:

- Load form options
- Create a consultation
- Retrieve previous meetings
- Update a consultation
- Delete a consultation
- Connect a meeting to a lead
- Display Google Calendar

### 5. 📈 Reports Module

Responsible for retrieving aggregated database information and presenting it visually.

The reports are separated into focused pages so users can analyze a specific business question without overloading the main dashboard.

### 6. 🗺️ Geographic Module

Displays geographic distribution using city information and map visualization.

### 7. 🛡️ Security Module

Protects system resources and separates access according to user identity and role.

### 8. 🚢 Deployment Module

Automates testing and production updates while keeping secrets outside the repository.

---

## 📈 Reports and Data Visualization

### 📊 Report 1 – Comparative Analysis

Displays a comparison between selected registration dimensions or periods.

Purpose:

- Identify differences
- Compare performance
- Detect strong and weak areas
- Support management decisions

Backend source:

```text
GET /api/report1/comparison
```

### 📉 Report 2 – Additional Operational Comparison

Provides another comparison view based on project business requirements.

Purpose:

- Compare organizational units
- Examine registration trends
- Support filtering and focused analysis

Backend source:

```text
GET /api/report2/comparison
```

### 🗺️ Report 3 – Geographic Distribution

Displays candidates or leads by city or geographic region.

Purpose:

- Identify areas with high or low activity
- Support regional recruitment planning
- Present information on an interactive map

Backend source:

```text
GET /api/stats/cities
```

### 📆 Report 4 – Monthly Activity and Outcomes

Contains two complementary views:

- Monthly activity
- Consultation or registration outcomes

Backend sources:

```text
GET /api/report4/monthly
GET /api/report4/outcomes
```

### 📣 Report 5 – Recruitment Media Sources

Displays candidate distribution and performance by recruitment source.

Purpose:

- Evaluate recruitment channels
- Identify effective media sources
- Support marketing and recruitment decisions

Backend source:

```text
GET /api/report5/media
```

---

## 🔐 Authentication, Authorization, and Security

Security is implemented across the frontend, backend, database, repository, and deployment process.

### 🔒 Password Security

Passwords are not stored as plain text.

The system uses `bcryptjs` to:

- Hash passwords before storage
- Compare login attempts against the stored hash
- Reduce the damage caused by a database exposure

### 🎟️ JWT Authentication

After successful login, the backend creates a signed JSON Web Token.

The token is used to:

- Identify the logged-in user
- Protect API endpoints
- prevent anonymous access
- enforce session expiration

### 🚧 Protected Frontend Routes

Protected pages verify that a token exists before displaying restricted content.

When authentication is missing or no longer valid, the application redirects the user to the login page.

### 🧑‍💼 Role-Based Access Control

The system supports permissions based on user roles.

This allows the project to distinguish between actions such as:

- Viewing data
- Editing candidate information
- Managing consultations
- Accessing management reports
- Performing administrative operations

Authorization is enforced on the backend. Frontend visibility alone is not considered a security control.

### 🌐 CORS Allowlist

The backend accepts browser requests only from approved frontend origins.

Typical approved origins include:

- Local development frontend
- Production frontend address

### 🔑 Environment Variables

Sensitive configuration is stored outside the source code.

Examples:

- Database connection string
- JWT signing secret
- Production origin
- Server port
- Integration configuration

`.env` files must never be committed to Git.

### 🗄️ Database Protection

The production PostgreSQL service should not be exposed publicly unless required.

Development access can be performed using an SSH tunnel instead of publishing the database port.

### 🛡️ Repository Security

The repository must not contain:

- Passwords
- Database credentials
- JWT secrets
- SSH private keys
- Google credentials
- Personal candidate information
- Production `.env` files

### 🧪 Security Testing

The automated test suite verifies important security behavior, including:

- Authentication requirements
- Invalid-token rejection
- Protected endpoint behavior
- Role and permission checks
- Deployment health
- API response behavior after security changes

---

## 🗄️ Database Design

The project uses PostgreSQL through Prisma ORM.

### 🧩 Main Business Entities

#### User

Represents an authorized system user.

Typical responsibilities:

- Username
- Password hash
- Role
- Department or organizational assignment
- Access identity

#### Lead / Candidate

Represents a person interested in academic registration.

Typical information:

- Personal details
- Contact information
- City
- Academic-interest information
- Department
- Campus
- Recruitment source
- Registration status
- Creation and update timestamps

#### Consultation

Represents a consultation meeting connected to a lead.

Typical information:

- Meeting date
- Meeting result
- Notes
- Assigned representative
- Lead reference
- Registration status
- Updated information

#### Organizational Reference Data

Used for consistent form options and reporting.

Examples:

- Departments
- Campuses
- Cities
- Statuses
- Media sources
- Consultation outcomes

### 🔷 Prisma Responsibilities

Prisma is used for:

- Defining the relational schema
- Generating the database client
- Creating type-safe queries
- Managing relations
- Reading and updating data
- Aggregating information for reports
- Seeding development data

---

## 🔌 API Overview

The backend follows a REST-style structure and returns JSON responses.

### ❤️ Health

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/health` | Verify that the backend is running |

### 🔐 Authentication

| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/api/auth/login` | Authenticate a user and return a token |

### 📊 Dashboard

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/home/summary` | Retrieve dashboard summary information |

### 📝 Consultation Form

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/form/options` | Retrieve form option lists |

### 👥 Leads

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/leads/search` | Search for an existing lead |
| POST | `/api/leads` | Create a new lead |
| PUT | `/api/leads/:id` | Update an existing lead |

### 📅 Consultations

| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/api/consultations` | Create a consultation |
| GET | `/api/consultations/lead/:leadId` | Retrieve consultations for a lead |
| PUT | `/api/consultations/:id` | Update a consultation |
| DELETE | `/api/consultations/:id` | Delete a consultation |

### 📈 Statistics and Reports

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/stats/cities` | Retrieve geographic lead statistics |
| GET | `/api/report1/comparison` | Retrieve Report 1 comparison data |
| GET | `/api/report2/comparison` | Retrieve Report 2 comparison data |
| GET | `/api/report4/monthly` | Retrieve monthly statistics |
| GET | `/api/report4/outcomes` | Retrieve outcome statistics |
| GET | `/api/report5/media` | Retrieve media-source statistics |

### ✅ Standard API Behavior

A successful response generally returns:

```json
{
  "ok": true,
  "data": {}
}
```

An error response should return a suitable HTTP status and a safe message:

```json
{
  "ok": false,
  "message": "Request could not be completed"
}
```

Internal database details, secrets, stack traces, and sensitive user data must not be returned to the client.

---

## 📅 Google Calendar Integration

Google Calendar is integrated into the consultation page to provide a clear schedule view inside the application.

### 🔗 Integration Responsibilities

- Display the consultation calendar in the project
- Allow staff to view scheduled meetings
- Connect operational consultation work with calendar planning
- Improve visibility of upcoming meetings

### 🗓️ Calendar Requirements

The embedded calendar must:

- Use the correct Calendar ID
- Be shared with the required users
- Have suitable viewing permissions
- Use the correct timezone
- Avoid exposing private candidate information

### 🔏 Privacy Recommendation

When a calendar is publicly shared, event titles should not contain:

- Identification numbers
- Phone numbers
- Email addresses
- Sensitive candidate notes
- Private registration information

Use a general meeting title or an internal candidate code.

---

## 🗂️ Project Structure and File Responsibilities

> The following map documents the core source files, configuration files, generated dependency files, and operational directories used by the project. Lockfiles and standard generated assets are included because they are part of reproducible installation and deployment.

```text
Data-Visualization/
├── .github/
│   └── workflows/
├── .vscode/
├── Backend/
│   ├── prisma/
│   │   ├── schema.prisma
│   │   └── seed.js
│   ├── src/
│   │   ├── config/
│   │   │   └── db.js
│   │   ├── controllers/
│   │   │   ├── authController.js
│   │   │   ├── consultationController.js
│   │   │   ├── homeController.js
│   │   │   ├── report1Controller.js
│   │   │   ├── report2Controller.js
│   │   │   ├── report4Controller.js
│   │   │   ├── report5Controller.js
│   │   │   └── statsController.js
│   │   ├── middleware/
│   │   │   ├── authMiddleware.js
│   │   │   └── roleMiddleware.js
│   │   └── routes/
│   │       ├── authRoutes.js
│   │       ├── consultationRoutes.js
│   │       └── statsRoutes.js
│   ├── tests/
│   ├── hashPassword.js
│   ├── index.js
│   ├── init.sql
│   ├── package.json
│   └── package-lock.json
├── frontend/
│   ├── public/
│   │   ├── SCE_logo.png
│   │   ├── favicon.ico
│   │   ├── index.html
│   │   ├── logo192.png
│   │   ├── logo512.png
│   │   ├── manifest.json
│   │   └── robots.txt
│   ├── src/
│   │   ├── api/
│   │   │   ├── consultationApi.js
│   │   │   └── metricsApi.js
│   │   ├── components/
│   │   │   ├── KpiCard.jsx
│   │   │   ├── ProtectedRoute.jsx
│   │   │   ├── ResidenceMap.jsx
│   │   │   └── Sidebar.jsx
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
│   │   ├── App.jsx
│   │   ├── App.test.js
│   │   ├── index.css
│   │   ├── index.js
│   │   ├── logo.svg
│   │   ├── reportWebVitals.js
│   │   └── setupTests.js
│   ├── package.json
│   ├── package-lock.json
│   ├── postcss.config.js
│   └── tailwind.config.js
├── .gitignore
└── README.md
```

### 📁 Root Files and Directories

| Path | Responsibility |
|---|---|
| `.github/workflows/` | GitHub Actions workflow definitions for tests, validation, and deployment |
| `.vscode/` | Shared editor configuration for VS Code |
| `Backend/` | Server, API, business logic, security, Prisma, and database access |
| `frontend/` | React application, pages, components, API clients, charts, and styling |
| `.gitignore` | Prevents generated files, dependencies, secrets, logs, and local configuration from entering Git |
| `README.md` | Main project documentation |

### 🧠 Backend Files

| Path | Responsibility |
|---|---|
| `Backend/index.js` | Main Express server entry point; loads environment variables, configures middleware, registers routes, exposes the health endpoint, handles unknown routes, and starts the server |
| `Backend/package.json` | Backend metadata, scripts, runtime dependencies, and development dependencies |
| `Backend/package-lock.json` | Locks exact dependency versions for reproducible installation |
| `Backend/hashPassword.js` | Utility script for generating a secure bcrypt password hash |
| `Backend/init.sql` | SQL initialization or supporting database setup script |
| `Backend/prisma/schema.prisma` | Prisma datasource, generator, database models, fields, relationships, enums, and constraints |
| `Backend/prisma/seed.js` | Inserts initial or development data such as users and reference options |
| `Backend/src/config/db.js` | Creates and exports the database or Prisma connection used by backend modules |

### 🎛️ Backend Controllers

| Path | Responsibility |
|---|---|
| `authController.js` | Validates login details, finds the user, compares the password hash, creates a JWT, and returns safe user information |
| `consultationController.js` | Handles form options, lead search, lead creation, lead updates, consultation creation, consultation history, consultation updates, and deletion |
| `homeController.js` | Builds the dashboard summary and KPI response |
| `statsController.js` | Retrieves statistical data, including city and geographic aggregation |
| `report1Controller.js` | Queries and transforms data for the first comparison report |
| `report2Controller.js` | Queries and transforms data for the second comparison report |
| `report4Controller.js` | Produces monthly and outcome datasets |
| `report5Controller.js` | Produces recruitment media-source analysis |

### 🛣️ Backend Routes

| Path | Responsibility |
|---|---|
| `authRoutes.js` | Defines authentication endpoints and connects them to the authentication controller |
| `consultationRoutes.js` | Defines lead and consultation endpoints |
| `statsRoutes.js` | Defines statistics endpoints |
| `routes/` | Keeps URL definitions separate from business logic |

### 🛡️ Backend Middleware

| Path | Responsibility |
|---|---|
| `authMiddleware.js` | Reads and verifies the JWT, rejects missing or invalid tokens, and attaches authenticated-user information to the request |
| `roleMiddleware.js` | Verifies that the authenticated user has permission to perform the requested operation |
| `middleware/` | Central location for reusable request security and validation logic |

### 🧪 Backend Tests

| Path | Responsibility |
|---|---|
| `Backend/tests/` | Automated backend and security tests |
| Security test files | Verify JWT authentication, protected endpoints, role checks, expected status codes, and rejection of unauthorized requests |
| Deployment/API test file | Verifies the health endpoint and important production API behavior |
| Test configuration | Defines the test environment and prevents tests from changing unintended production data |

### 🌍 Frontend Public Files

| Path | Responsibility |
|---|---|
| `public/index.html` | Base HTML document into which React is mounted |
| `public/SCE_logo.png` | SCE branding displayed in the interface |
| `public/favicon.ico` | Browser-tab icon |
| `public/logo192.png` | Standard web-app icon |
| `public/logo512.png` | Larger web-app icon |
| `public/manifest.json` | Web application metadata |
| `public/robots.txt` | Search-engine crawler instructions |

### 🚪 Frontend Application Entry Files

| Path | Responsibility |
|---|---|
| `src/index.js` | Mounts the React application and initializes browser routing |
| `src/App.jsx` | Main routing definition and application-level layout |
| `src/index.css` | Tailwind directives and global interface rules |
| `src/App.test.js` | Base application test |
| `src/setupTests.js` | Loads Jest DOM and frontend test setup |
| `src/reportWebVitals.js` | Optional browser performance measurement helper |
| `src/logo.svg` | Default or legacy React asset; removable when unused |

### 🔌 Frontend API Layer

| Path | Responsibility |
|---|---|
| `api/metricsApi.js` | Sends requests for dashboard, statistics, and report datasets |
| `api/consultationApi.js` | Sends lead and consultation requests and centralizes JSON/error handling |
| `api/` | Keeps HTTP logic out of page components and provides one place to manage the backend base URL |

### 🧱 Frontend Components

| Path | Responsibility |
|---|---|
| `components/KpiCard.jsx` | Reusable card for displaying a KPI value, title, icon, and supporting text |
| `components/ResidenceMap.jsx` | Map component for geographic distribution |
| `components/Sidebar.jsx` | Main navigation menu and access to application sections |
| `components/ProtectedRoute.jsx` | Prevents unauthenticated users from accessing protected pages |

### 📄 Frontend Pages

| Path | Responsibility |
|---|---|
| `pages/LoginPage.jsx` | Login form, authentication request, token storage, and navigation after login |
| `pages/HomePage.jsx` | Main dashboard with summary cards and visual information |
| `pages/ConsultationPage.jsx` | Candidate search, candidate details, consultation form, meeting history, and Google Calendar |
| `pages/EditProfilePage.jsx` | User-profile or account-detail editing interface |
| `pages/Report1.jsx` | First comparative report |
| `pages/Report2.jsx` | Second comparative report |
| `pages/Report3.jsx` | Geographic report and map |
| `pages/Report4.jsx` | Monthly activity and outcome visualizations |
| `pages/Report5.jsx` | Recruitment media-source visualization |

### ⚙️ Frontend Configuration Files

| Path | Responsibility |
|---|---|
| `frontend/package.json` | Frontend scripts and dependencies |
| `frontend/package-lock.json` | Locks exact dependency versions |
| `frontend/tailwind.config.js` | Tailwind file scanning and theme configuration |
| `frontend/postcss.config.js` | PostCSS and Autoprefixer configuration |
| `frontend/README.md` | Default frontend documentation when retained; the repository root README is the main project document |

### 🔁 Workflow Files

| Path | Responsibility |
|---|---|
| `.github/workflows/*.yml` | Defines automated actions triggered by pushes or pull requests |
| CI steps | Install dependencies, generate Prisma Client, run tests, and build the frontend |
| CD steps | Connect to the production server using protected GitHub secrets and update the deployed application |

### 🧹 Generated or Local-Only Directories

The following directories should not be committed unless intentionally required:

```text
node_modules/
frontend/build/
coverage/
.env
.env.*
*.log
.DS_Store
```

---

## 🔑 Environment Variables

Create environment files locally and on the server. Do not commit real secret values.

### 🧠 Backend Example

Create:

```text
Backend/.env
```

Example:

```env
PORT=5001
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE?schema=public"
JWT_SECRET="replace-with-a-long-random-secret"
FRONTEND_ORIGIN="http://localhost:3000"
```

A production environment may allow more than one approved frontend origin through the project's origin-list configuration.

### 🖥️ Frontend Example

Create:

```text
frontend/.env
```

Example:

```env
REACT_APP_API_BASE_URL="http://localhost:5001"
```

### 🛡️ Security Rules

- Never commit `.env`.
- Never place passwords directly in source code.
- Use a different JWT secret in production.
- Store deployment secrets in GitHub Secrets.
- Rotate exposed credentials immediately.
- Do not publish production database ports unnecessarily.

---

## ⚙️ Local Installation

### ✅ Prerequisites

Install:

- Node.js
- npm
- PostgreSQL
- Git

Recommended:

- VS Code
- Postman or another API client

### 📥 Clone the Repository

```bash
git clone <repository-url>
cd Data-Visualization
```

### 🧠 Install Backend Dependencies

```bash
cd Backend
npm install
npx prisma generate
```

### 🔧 Configure the Backend

Create `Backend/.env` and add the required environment variables.

For a new empty development database only, synchronize the Prisma schema:

```bash
npx prisma db push
```

Seed development data when required:

```bash
node prisma/seed.js
```

### 🖥️ Install Frontend Dependencies

```bash
cd ../frontend
npm install
```

Create `frontend/.env` and define the backend URL.

---

## ▶️ Running the Project

Use two terminal windows.

### 1️⃣ Terminal 1 – Backend

```bash
cd Backend
node index.js
```

Expected output includes the server port, approved frontend origins, and available routes.

### 2️⃣ Terminal 2 – Frontend

```bash
cd frontend
npm start
```

The application normally opens at:

```text
http://localhost:3000
```

### ❤️ Health Check

Open:

```text
http://localhost:5001/health
```

Expected result:

```json
{
  "ok": true,
  "message": "Server is running"
}
```

### 🔐 Local Frontend with Remote Database

The recommended secure method is:

1. Create an SSH tunnel from the local computer to the server database.
2. Run the backend locally.
3. Configure the local backend `DATABASE_URL` to use the local tunnel port.
4. Run the frontend locally.
5. Keep the production database port closed to the public internet.

---

## 🧪 Testing

The project uses both automated tests and managed manual test cases.

### 🖥️ Automated Frontend Tests

Tools:

- React Testing Library
- Jest DOM
- User Event

Areas covered:

- Application rendering
- Login behavior
- Protected routing
- Navigation
- Form interactions
- Error display
- API-dependent states

Run:

```bash
cd frontend
npm test -- --watchAll=false
```

### 🧠 Automated Backend Tests

Areas covered:

- Health endpoint
- Authentication
- Invalid login
- Missing token
- Invalid token
- Protected endpoints
- Role-based authorization
- Lead operations
- Consultation operations
- Important production API behavior

Run the command defined in `Backend/package.json`, for example:

```bash
cd Backend
npm test
```

### 📋 Manual Test Management

Manual test cases are documented in Qase and organized by system area:

- Dashboard
- Reports
- Consultations
- Backend API
- Frontend Routing
- CI/CD
- Google Calendar Integration
- Security

Test evidence can be linked to Jira tasks and exported from Qase as a PDF for inclusion in the final project documentation.

### 🛡️ Test Data Safety

Automated tests should:

- Use a dedicated test configuration
- Avoid deleting production records
- Create only controlled test records
- Clean up created records when possible
- Never contain real passwords or candidate information

---

## 🚢 CI/CD and Deployment

The project uses GitHub Actions to automate validation and deployment.

### 🔁 Continuous Integration

On relevant pushes or pull requests, the workflow can:

1. Check out the repository.
2. Configure Node.js.
3. Install backend dependencies.
4. Generate Prisma Client.
5. Run backend and security tests.
6. Install frontend dependencies.
7. Run frontend tests.
8. Build the React application.
9. Stop the workflow when a required step fails.

### 🚀 Continuous Deployment

After successful validation on the deployment branch, the workflow can:

1. Connect to the remote server using SSH.
2. Pull the approved repository version.
3. Update dependencies.
4. Install dependencies and rebuild the application.
5. Restart the application.
6. Verify the backend health endpoint.
7. Keep deployment credentials in GitHub Secrets.

### 🏭 Production Environment

The production setup includes:

- College-provided remote server
- Frontend service
- Backend service
- PostgreSQL service
- Separate frontend, backend, and database services
- Controlled network access
- Environment variables stored on the server
- GitHub Actions deployment workflow

### 🔑 Required GitHub Secrets

Names depend on the workflow, but commonly include:

```text
SERVER_HOST
SERVER_USER
SERVER_SSH_KEY
SERVER_PORT
DEPLOY_PATH
```

Do not store secret values in workflow files.

---

## 🛠️ Operational Notes

### 🔍 Before Pushing Changes

```bash
git status
```

Verify that the commit does not include:

- `.env`
- Credentials
- Database exports with personal data
- SSH keys
- Local logs
- Temporary files

### 🌿 Standard Git Flow

```bash
git add <changed-files>
git commit -m "Describe the change"
git pull --rebase origin main
git push origin main
```

### ✅ After Deployment

Verify:

```text
GET /health
```

Then check:

- Login
- Protected pages
- Dashboard data
- Candidate search
- Consultation creation
- Report loading
- Google Calendar display

### 📝 Logging

Logs should help identify operational problems without exposing sensitive data.

Safe logging examples:

- Request path
- HTTP status
- Record ID
- Update success or failure
- Before/after values only when they do not include secrets or sensitive personal information

Never log:

- Passwords
- JWT secrets
- Full authorization tokens
- Database URLs
- Private keys
- Sensitive candidate data

---

## 🔭 Future Improvements

Possible next steps:

- Advanced audit trail for every sensitive change
- Fine-grained permission management screen
- Password reset flow
- Refresh-token mechanism
- Multi-factor authentication
- Server-side pagination for large datasets
- Export reports to PDF or Excel
- Notification system
- Automated reminder messages
- More advanced Google Calendar synchronization
- Duplicate-lead detection
- Data-quality dashboard
- Additional accessibility improvements
- Centralized structured logging
- Monitoring and alerting
- Automated database backup verification
- More extensive end-to-end tests

---

## 👥 Project Team

### 👨‍💻 Yehuda Baza

- Full-stack development
- Database and backend integration
- Frontend implementation
- Data visualization
- Security improvements
- Testing and deployment

### 👨‍💻 Almog Ben-Gur

- Project development
- Product and system collaboration
- Data and interface work
- Testing and project documentation

---

## 📄 License

This repository was developed as an academic final project.

No open-source license is granted unless a separate `LICENSE` file is added to the repository.

---

<p align="center">
  ⚛️ React · 🟢 Node.js · 🚂 Express · 🔷 Prisma · 🐘 PostgreSQL · 🎨 Tailwind CSS · 📊 Recharts · ⚙️ GitHub Actions · 📅 Google Calendar
</p>
