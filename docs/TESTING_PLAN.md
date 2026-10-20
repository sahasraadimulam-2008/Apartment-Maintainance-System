# Testing Plan & Automated Verification Report

## Strategy & Objectives
The Apartment Maintenance System follows an automated test-driven approach ensuring that authentication, security boundaries, business logic, role-based access, and AI integrations are verified before deploying or developing client frontends.

---

## Testing Environment & Tooling
- **Test Framework**: Jest (v29)
- **HTTP Assertion Engine**: Supertest (v7)
- **Database Engine**: `mongodb-memory-server` (v10) — Isolated in-memory MongoDB instance per test run ensuring clean state, zero production data pollution, and high execution speed.
- **AI Mocking**: `jest.spyOn()` and mock providers — AI integration tests execute reliably in automated CI environments without consuming tokens or requiring a paid API key.

---

## Test Suites Breakdown

| Test Suite | File | Focus Areas | Tests | Result |
| :--- | :--- | :--- | :---: | :---: |
| **Authentication** | `tests/auth.test.js` | User registration, password hashing, JWT generation, login, invalid credentials, protected route tokens, token expiry | 11 | **PASS** |
| **Role Authorization** | `tests/roles.test.js` | Admin privileges, resident restrictions, staff permissions, multi-tier RBAC boundaries | 5 | **PASS** |
| **Complaint Management** | `tests/complaint.test.js` | Submission, flat ownership enforcement, resident privacy isolation, status updates, staff assignment, audit history | 11 | **PASS** |
| **Maintenance Payments** | `tests/payment.test.js` | Billing dues creation, negative amount rejection, validation, resident isolation, manual payment status recording | 8 | **PASS** |
| **AI Features & Safety** | `tests/ai.test.js` | Input validation, unconfigured key 503 handling, Gemini structured output, dangerous action guardrails, timeouts, heuristic fallback, FAQ chatbot | 10 | **PASS** |
| **Society Announcements** | `tests/announcement.test.js` | Admin broadcast creation, audience filtering (Residents/Staff/All), unauthorized access prevention, deletion | 5 | **PASS** |
| **Flat Management** | `tests/flat.test.js` | Flat creation, building-flatNumber compound uniqueness, resident assignment, deletion safeguards | 4 | **PASS** |
| **Total** | **7 Suites** | **End-to-end backend API coverage** | **54** | **100% PASS** |

---

## How to Run Tests

### Run all tests once:
```bash
cd server
npm test
```

### Run tests with code coverage report:
```bash
cd server
npm run test:coverage
```

### Run tests in watch mode during development:
```bash
cd server
npm run test:watch
```

---

## Actual Test Execution Output

```
PASS tests/announcement.test.js
PASS tests/flat.test.js
PASS tests/complaint.test.js
PASS tests/payment.test.js
PASS tests/roles.test.js
PASS tests/auth.test.js
PASS tests/ai.test.js

Test Suites: 7 passed, 7 total
Tests:       54 passed, 54 total
Snapshots:   0 total
Time:        19.6 s
Ran all test suites.
```
