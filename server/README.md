# Apartment Maintenance System — Backend Server

AI-powered Node.js/Express REST backend for modern residential society maintenance and facility management.

---

## Prerequisites
- **Node.js**: v18.0.0 or higher (v24+ recommended)
- **npm**: v9.0.0 or higher
- **MongoDB**: v6.0 or higher (or MongoDB Atlas connection string)
- *(Optional)* **Google Gemini API Key**: For AI complaint classification and resident FAQ chatbot.

---

## Quickstart

### 1. Install Dependencies
```bash
cd server
npm install
```

### 2. Configure Environment Variables
Copy the template configuration file:
```bash
cp .env.example .env
```
Edit `.env` with your settings:
```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/apartment_maintenance
JWT_SECRET=your_jwt_super_secret_key_change_in_production
JWT_EXPIRES_IN=7d

# AI Configuration (Optional for booting; required for live AI responses)
AI_PROVIDER=gemini
AI_API_KEY=your_google_gemini_api_key_here
AI_MODEL=gemini-2.5-flash
AI_REQUEST_TIMEOUT_MS=10000

CLIENT_URL=http://localhost:3000
```

> **Note**: If `AI_API_KEY` is left blank, the server will start up normally. Standard CRUD and authentication will work fully. AI endpoints will safely return an informative `503 Service Unavailable` configuration error without crashing.

### 3. Run Development Server
```bash
npm run dev
```

### 4. Run Production Server
```bash
npm start
```

### 5. Run Automated Tests
```bash
npm test
```
*Tests run with an automated in-memory MongoDB server and mocked AI provider calls.*

---

## API Base Endpoints

| Endpoint Prefix | Description | Access |
| :--- | :--- | :--- |
| `/api/auth` | Register, login, profile retrieval, updates | Public / Private |
| `/api/flats` | Apartment unit management & resident mapping | Private (RBAC) |
| `/api/residents` | Resident roster & profile management | Private (Admin / Staff) |
| `/api/complaints` | Maintenance complaint submissions & assignment | Private (RBAC) |
| `/api/payments` | Maintenance fee charge records & manual receipts | Private (RBAC) |
| `/api/staff` | Maintenance technician directory & availability | Private (RBAC) |
| `/api/announcements` | Society broadcast messages & notices | Private (RBAC) |
| `/api/ai` | AI categorization & Apartment FAQ assistant | Private (JWT Required) |
| `/api/health` | Service uptime and status monitor | Public |

For detailed request/response examples and schemas, see [`../docs/API_DOCUMENTATION.md`](../docs/API_DOCUMENTATION.md).

---

## Architectural & Security Highlights
- **Password Security**: Passwords hashed with `bcryptjs` (salt cost 10); passwords excluded by default from queries and JSON responses.
- **JWT Authorization**: Cryptographically signed tokens with configurable expiration and bearer scheme.
- **AI Safety Guardrails**: AI suggestions are validated against a strict category/priority enum and checked against dangerous automated directives (e.g., unauthorized demolition, gas line disruptions).
- **Graceful Failure**: AI network timeouts (10s) and provider errors are handled without dropping the HTTP connection.
- **In-Memory Testing**: Automated test suite requires zero external database dependencies.
