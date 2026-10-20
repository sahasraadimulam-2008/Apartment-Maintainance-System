# Project Structure & Team Architecture

## Overview
The **Apartment Maintenance System** is designed with a modern decoupled client-server architecture. The project is engineered backend-first to establish robust data modeling, strict security, role-based authorization, and reliable AI services before frontend integration.

---

## 9-Member Team Responsibility Matrix

| Team Member | Functional Area | Specific Modules & Ownership |
| :--- | :--- | :--- |
| **Member 1** | Team Leader & Integration | Architectural oversight, system design, Git workflow, cross-module integration |
| **Member 2** | Frontend Development | React SPA, responsive UI/UX, API client layer *(scheduled for Phase 2)* |
| **Member 3** | Authentication & Backend Foundation | `authController`, `User` model, JWT token generation, auth middleware, bcrypt hashing |
| **Member 4** | Resident & Flat Management | `Flat` and `User` models, `flatController`, `residentController`, flat-resident associations |
| **Member 5** | Complaint Management | `Complaint` model, complaint submission, tracking lifecycle, status history, technician assignment |
| **Member 6** | AI Integration | `aiService`, Google Gemini SDK integration, classification prompt engineering, FAQ assistant |
| **Member 7** | Maintenance Payment Management | `Payment` model, `paymentController`, dues records, offline receipts, transaction tracking |
| **Member 8** | Staff Management & Announcements | `Staff` model, `Announcement` model, broadcast management, technician roster |
| **Member 9** | Testing & Deployment | Jest test automation, Supertest API testing, CI/CD pipelines, production readiness |

---

## Repository Tree Structure

```
Apartment-Maintenance-System/
├── .gitignore                      # Top-level git ignore (secrets, node_modules, build artifacts)
├── README.md                       # Main project README
├── docs/                           # Architecture, database, API, and testing documentation
│   ├── API_DOCUMENTATION.md        # Comprehensive REST API specifications and schemas
│   ├── DATABASE_DESIGN.md          # Mongoose entity relationship diagrams and data dictionary
│   ├── PROJECT_STRUCTURE.md        # Team ownership and architectural breakdown
│   └── TESTING_PLAN.md             # Testing strategy, mock design, and test coverage report
└── server/                         # Express.js Node backend
    ├── .env.example                # Sample environment configuration
    ├── package.json                # Server dependencies, scripts, and Jest config
    ├── README.md                   # Backend startup and development guide
    ├── src/
    │   ├── app.js                  # Express application setup, security middleware, and routes
    │   ├── server.js               # Server entry point, database connection, and shutdown hooks
    │   ├── config/
    │   │   ├── aiConfig.js         # AI provider parameters, validation enums, FAQ system prompt
    │   │   └── database.js         # Mongoose connection management and error handling
    │   ├── controllers/
    │   │   ├── aiController.js     # AI endpoints (classification, FAQ chat, status)
    │   │   ├── announcementController.js # Society announcements CRUD
    │   │   ├── authController.js   # Registration, login, profile retrieval and updates
    │   │   ├── complaintController.js # Complaint lifecycle, status updates, staff assignment
    │   │   ├── flatController.js   # Flat CRUD and resident mapping
    │   │   ├── paymentController.js# Maintenance charge records and status management
    │   │   ├── residentController.js# Resident directory and profiles
    │   │   └── staffController.js  # Maintenance staff directory and roles
    │   ├── middleware/
    │   │   ├── authMiddleware.js   # JWT verification and user context injection
    │   │   ├── errorMiddleware.js  # Centralized error handler and 404 router
    │   │   ├── roleMiddleware.js   # Role-based access control (RBAC) guard
    │   │   └── validateRequest.js  # Express-validator result parser
    │   ├── models/
    │   │   ├── Announcement.js     # Society notice model
    │   │   ├── Complaint.js        # Maintenance complaint model
    │   │   ├── Flat.js             # Apartment flat unit model
    │   │   ├── Payment.js          # Maintenance fee record model
    │   │   ├── Staff.js            # Maintenance staff technician model
    │   │   └── User.js             # User account with authentication methods
    │   ├── services/
    │   │   ├── aiService.js        # Modular AI client (Gemini provider, guardrails, fallback)
    │   │   └── notificationService.js # Event notification and audit dispatcher
    │   └── utils/
    │       └── generateToken.js    # JWT signer utility
    └── tests/
        ├── setup.js                # MongoMemoryServer in-memory test lifecycle
        ├── ai.test.js              # AI classification, guardrails, and chatbot tests
        ├── announcement.test.js    # Society announcement tests
        ├── auth.test.js            # User registration, login, and token tests
        ├── complaint.test.js       # Complaint creation, privacy, and assignment tests
        ├── flat.test.js            # Flat CRUD and assignment tests
        ├── payment.test.js         # Maintenance payment validation tests
        └── roles.test.js           # Role-based authorization boundary tests
```

---

## Architectural Principles

1. **Separation of Concerns**: Controllers deal strictly with HTTP requests and responses; models handle schemas, validation, and database operations; services encapsulate third-party business logic (AI, notifications); middleware handles cross-cutting concerns (authentication, authorization, validation, error handling).
2. **Graceful Degradation**: If third-party AI keys are omitted or providers experience downtime, the backend boots cleanly and provides sensible fallbacks or explicit 503 notifications rather than breaking the application.
3. **Data Isolation & Privacy**: Residents cannot inspect other residents' complaints, private payment records, or directory details.
4. **Predictable REST Contract**: Standardized response envelopes (`{ success: true, data: ... }` and `{ success: false, error: ... }`) with accurate HTTP status codes.
