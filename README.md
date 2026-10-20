# 🏢 Apartment Maintenance System

## 📌 Project Overview
The Apartment Maintenance System is a web application designed to simplify apartment management. It helps residents, apartment administrators, and maintenance staff manage complaints, maintenance payments, flats, and announcements in one place.

## 🎯 Objectives
- Make it easy for residents to submit and track complaints.
- Manage apartment flats and resident information.
- Track maintenance charges and payment records.
- Help administrators assign complaints to maintenance staff.
- Provide announcements and updates.
- Use AI to assist with complaint categorization and frequently asked questions.

## 🛠️ Technology Stack
- Frontend: React.js
- Backend: Node.js and Express.js
- Database: MongoDB
- Programming Language: JavaScript
- AI: AI API integration
- Version Control: Git and GitHub
- API Testing: Postman

## 👥 Team Responsibilities
| Member | Responsibility |
|---|---|
| Member 1 | Team Leader, Architecture and Integration |
| Member 2 | Frontend Development |
| Member 3 | Authentication and Authorization |
| Member 4 | Resident and Flat Management |
| Member 5 | Complaint Management |
| Member 6 | AI Integration |
| Member 7 | Maintenance Payment Management |
| Member 8 | Staff Management and Announcements |
| Member 9 | Testing and Deployment |

## 📂 Project Structure
See [PROJECT_STRUCTURE.md](docs/PROJECT_STRUCTURE.md) for the planned folder structure and development workflow.

## 🔄 Development Workflow
1. Each member works on their assigned module.
2. Use separate Git branches for features.
3. Test code before submitting changes.
4. Submit pull requests for review.
5. The team leader reviews and integrates changes.
6. Never commit passwords, API keys, or other secrets.

## 🚧 Project Status
Initial setup and project planning.

## 📅 Future Improvements
- AI-assisted complaint categorization.
- Complaint status notifications.
- Maintenance payment tracking.
- Apartment management dashboard.
- Reports and analytics.
# Apartment Maintenance System

An AI-powered, enterprise-grade residential society maintenance and facility management platform built with **Node.js**, **Express.js**, **MongoDB**, **JWT authentication**, and **Google Gemini AI**.

---

## Team Structure & Ownership

This project is built and maintained across 9 specialized functional areas:

- **Member 1 (Team Leader & Integration)**: System architecture, cross-module orchestration, API design, repository hygiene.
- **Member 2 (Frontend Development)**: React Single-Page Application (SPA), responsive dashboards *(scheduled for Phase 2 integration)*.
- **Member 3 (Authentication & Backend Foundation)**: User registration, secure login, password hashing (`bcrypt`), JWT token handling, security middleware.
- **Member 4 (Resident & Flat Management)**: Flat directory, building layout mapping, resident association and profile management.
- **Member 5 (Complaint Management)**: Complaint intake, status lifecycle tracking, technician assignment, audit trail logging.
- **Member 6 (AI Integration)**: AI complaint categorization, urgency prioritization, safety guardrails, automated FAQ chatbot with Google Gemini.
- **Member 7 (Maintenance Payment Management)**: Maintenance fee billing schedules, manual offline receipt recording, dues tracking.
- **Member 8 (Staff Management & Announcements)**: Technician registry, trade specializations, society broadcast announcements.
- **Member 9 (Testing & Deployment)**: Automated testing suite (Jest & Supertest), in-memory database test harness, CI readiness.

---

## Technology Stack

- **Runtime**: Node.js (v18+)
- **Backend Framework**: Express.js (v4)
- **Database & ODM**: MongoDB with Mongoose (v8)
- **Security & Cryptography**: JSON Web Tokens (`jsonwebtoken`), `bcryptjs`, `helmet`, `cors`
- **Validation**: `express-validator`
- **AI Engine**: Google Gemini API via official `@google/generative-ai` SDK
- **Testing**: Jest, Supertest, `mongodb-memory-server`
- **API Standard**: RESTful JSON API (Postman-compatible)

---

## Backend Directory Layout

```
server/
  src/
    config/
      database.js          # MongoDB connection and lifecycle
      aiConfig.js          # AI parameters, prompts, and category enums
    models/
      User.js              # User auth model (resident, staff, admin)
      Flat.js              # Apartment unit model
      Complaint.js         # Maintenance complaint model with AI suggestions
      Payment.js           # Maintenance charge and status model
      Staff.js             # Maintenance technician model
      Announcement.js      # Society notice model
    controllers/
      authController.js    # Register, login, profile management
      flatController.js    # Flat management & resident association
      residentController.js# Resident directory & management
      complaintController.js# Complaint lifecycle & staff assignments
      paymentController.js # Maintenance billing records
      staffController.js   # Technician registry
      announcementController.js # Society announcements
      aiController.js      # AI classification & FAQ assistant
    routes/
      authRoutes.js
      flatRoutes.js
      residentRoutes.js
      complaintRoutes.js
      paymentRoutes.js
      staffRoutes.js
      announcementRoutes.js
      aiRoutes.js
    middleware/
      authMiddleware.js    # JWT bearer verification
      roleMiddleware.js    # Role-based authorization guard
      errorMiddleware.js   # Centralized error and 404 handler
      validateRequest.js   # Input validation result extractor
    services/
      aiService.js         # Gemini AI provider client, fallback, and safety checks
      notificationService.js # Event dispatcher and audit logging
    utils/
      generateToken.js     # JWT signing utility
    app.js                 # Express app configuration
    server.js              # Server entry point & graceful shutdown
  tests/                   # Automated test suites
  .env.example             # Configuration template
  package.json
```

---

## Installation & Running the Server

### 1. Prerequisites
Ensure you have **Node.js** (v18+) and **npm** installed on your system.

### 2. Install Dependencies
```bash
cd server
npm install
```

### 3. Environment Configuration
Create a `.env` file in the `server/` directory based on `.env.example`:
```bash
cp .env.example .env
```
Fill in the configuration variables:
```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/apartment_maintenance
JWT_SECRET=your_jwt_super_secret_key_change_in_production
JWT_EXPIRES_IN=7d

# Optional AI API Key (Server starts cleanly without it)
AI_PROVIDER=gemini
AI_API_KEY=your_google_gemini_api_key_here
AI_MODEL=gemini-2.5-flash
AI_REQUEST_TIMEOUT_MS=10000

CLIENT_URL=http://localhost:3000
```

### 4. Start the Server
- **Development Mode** (with automatic reload):
  ```bash
  npm run dev
  ```
- **Production Mode**:
  ```bash
  npm start
  ```

### 5. Run Automated Tests
```bash
npm test
```
*Executes all 54 automated tests across 7 suites against an isolated in-memory MongoDB server.*

---

## Core AI Features

### 1. AI Complaint Categorization (`POST /api/ai/classify-complaint`)
Accepts a maintenance complaint description and returns a validated JSON object with:
- `category`: Plumbing, Electrical, Carpentry, HVAC, Security, Sanitation, Civil/Structural, or General
- `priority`: Low, Medium, High, or Critical
- `suggestedAction`: Safe, actionable maintenance guidance for technicians
- **Safety Enforcement**: Automatically detects and prevents dangerous automated instructions (e.g., unauthorized demolition, gas line disruptions) and downgrades/flags for certified inspector review.
- **Graceful Fallback**: If the AI key is absent or provider times out, explicit errors or heuristic fallback rules ensure system stability.

### 2. Apartment FAQ Chatbot (`POST /api/ai/chat`)
Answers resident queries using verified society policies (clubhouse hours, visitor parking, maintenance dues schedules, waste management, quiet hours, emergency numbers).
- **Anti-Hallucination**: Grounded strictly in verified apartment rules. Instructed to disclaim private account or payment data and refer residents to the management office.

---

## Documentation

Full architectural specifications and guides are available in the [`docs/`](docs/) directory:
- [API Documentation](docs/API_DOCUMENTATION.md): Endpoints, request/response examples, role permissions.
- [Database Design](docs/DATABASE_DESIGN.md): Entity relationship diagrams, schema definitions, and indexes.
- [Project Structure](docs/PROJECT_STRUCTURE.md): Team matrix and architectural principles.
- [Testing Plan](docs/TESTING_PLAN.md): Testing methodology, mock design, and test reports.
