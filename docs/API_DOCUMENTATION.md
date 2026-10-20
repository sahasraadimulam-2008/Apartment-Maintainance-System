# Apartment Maintenance System — API Documentation

## Overview
All endpoints accept and return `application/json` unless otherwise stated. Authentication is handled using JSON Web Tokens (JWT) transmitted via the HTTP `Authorization` header.

```http
Authorization: Bearer <jwt_token>
```

---

## Response Envelope Conventions

### Success Envelope
```json
{
  "success": true,
  "message": "Operation completed successfully",
  "data": { ... }
}
```

### Paginated List Envelope
```json
{
  "success": true,
  "count": 10,
  "pagination": {
    "total": 45,
    "page": 1,
    "pages": 5,
    "limit": 10
  },
  "data": [ ... ]
}
```

### Error Envelope
```json
{
  "success": false,
  "error": "Error description",
  "errors": [
    { "field": "email", "message": "A valid email address is required" }
  ]
}
```

---

## HTTP Status Codes Reference

| Code | Status | Meaning |
| :--- | :--- | :--- |
| `200` | OK | Request succeeded. |
| `201` | Created | Resource successfully created. |
| `400` | Bad Request | Validation failure, malformed JSON, or missing parameters. |
| `401` | Unauthorized | Token is missing, expired, or invalid. |
| `403` | Forbidden | Authenticated user lacks role permissions or target data ownership. |
| `404` | Not Found | Requested entity was not found. |
| `409` | Conflict | Duplicate unique key (e.g. email or flat number). |
| `502` | Bad Gateway | AI provider communication failure or timeout. |
| `503` | Service Unavailable | Feature is temporarily offline or unconfigured (`AI_API_KEY` missing). |

---

## 1. Authentication (`/api/auth`)

### 1.1 Register User
- **Method & Route**: `POST /api/auth/register`
- **Access**: Public (Resident role default; Admin can specify any role)
- **Request Body**:
```json
{
  "name": "Sarah Connor",
  "email": "sarah@example.com",
  "password": "securePassword123",
  "role": "resident",
  "flat": "6724a1b02f89c100234123a1",
  "phone": "+1-555-0199"
}
```
- **Response** (`201 Created`):
```json
{
  "success": true,
  "message": "User registered successfully",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "data": {
    "id": "6724a1b02f89c100234123b2",
    "name": "Sarah Connor",
    "email": "sarah@example.com",
    "role": "resident",
    "flat": "6724a1b02f89c100234123a1",
    "phone": "+1-555-0199"
  }
}
```

### 1.2 User Login
- **Method & Route**: `POST /api/auth/login`
- **Access**: Public
- **Request Body**:
```json
{
  "email": "sarah@example.com",
  "password": "securePassword123"
}
```
- **Response** (`200 OK`):
```json
{
  "success": true,
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "data": {
    "id": "6724a1b02f89c100234123b2",
    "name": "Sarah Connor",
    "email": "sarah@example.com",
    "role": "resident",
    "flat": {
      "_id": "6724a1b02f89c100234123a1",
      "flatNumber": "101",
      "building": "Tower A",
      "floor": 1
    }
  }
}
```

### 1.3 Get Current User Profile
- **Method & Route**: `GET /api/auth/me`
- **Access**: Private (Any authenticated role)
- **Response** (`200 OK`): Returns populated authenticated user object without password hash.

---

## 2. Flat Management (`/api/flats`)

### 2.1 Create Flat
- **Method & Route**: `POST /api/flats`
- **Access**: Private (`admin` only)
- **Request Body**:
```json
{
  "flatNumber": "A-302",
  "building": "Tower A",
  "floor": 3,
  "bhkType": "3BHK",
  "squareFootage": 1350
}
```
- **Response** (`201 Created`)

### 2.2 List Flats
- **Method & Route**: `GET /api/flats`
- **Access**: Private (`admin`, `staff`, `resident`)
- **Query Parameters**:
  - `building` (string): Search by building name
  - `occupancyStatus` (string): `vacant` | `occupied` | `under_maintenance`
  - `page` (number, default: 1)
  - `limit` (number, default: 20)
- **Response** (`200 OK`): Paginated array of flat documents with resident names populated.

### 2.3 Assign Resident to Flat
- **Method & Route**: `POST /api/flats/:id/assign-resident`
- **Access**: Private (`admin` only)
- **Request Body**:
```json
{
  "residentId": "6724a1b02f89c100234123b2"
}
```

---

## 3. Resident Management (`/api/residents`)

### 3.1 List Residents
- **Method & Route**: `GET /api/residents`
- **Access**: Private (`admin`, `staff`)
- **Query Parameters**: `search`, `flatId`, `page`, `limit`
- **Response** (`200 OK`): Paginated resident directory with flat details.

### 3.2 View Resident Details
- **Method & Route**: `GET /api/residents/:id`
- **Access**: Private (`admin`, `staff`, or the Resident themselves)

---

## 4. Complaint Management (`/api/complaints`)

### 4.1 Submit Complaint
- **Method & Route**: `POST /api/complaints`
- **Access**: Private (`resident`, `admin`)
- **Request Body**:
```json
{
  "title": "Kitchen pipe leaking",
  "description": "Continuous water leakage under sink damaging cabinet woodwork.",
  "flatId": "6724a1b02f89c100234123a1",
  "category": "Plumbing",
  "priority": "High",
  "useAiClassification": true
}
```
- **Response** (`201 Created`):
```json
{
  "success": true,
  "message": "Complaint submitted successfully",
  "data": {
    "_id": "6724b0f901a89c20042456c1",
    "title": "Kitchen pipe leaking",
    "description": "Continuous water leakage under sink damaging cabinet woodwork.",
    "resident": "6724a1b02f89c100234123b2",
    "flat": "6724a1b02f89c100234123a1",
    "category": "Plumbing",
    "priority": "High",
    "status": "Open",
    "aiSuggestions": {
      "category": "Plumbing",
      "priority": "High",
      "suggestedAction": "Isolate cold water valve under sink and replace damaged PVC gasket.",
      "confidenceScore": 0.95,
      "generatedAt": "2026-10-19T13:30:00.000Z"
    },
    "statusHistory": [
      {
        "status": "Open",
        "note": "Complaint registered by resident",
        "updatedAt": "2026-10-19T13:30:00.000Z"
      }
    ]
  }
}
```

### 4.2 List Complaints (Role-Aware)
- **Method & Route**: `GET /api/complaints`
- **Access**: Private (Residents strictly view their own; Admin & Staff view all)
- **Query Parameters**: `status`, `category`, `priority`, `flatId`, `assignedStaff`, `page`, `limit`

### 4.3 Update Complaint Status
- **Method & Route**: `PATCH /api/complaints/:id/status`
- **Access**: Private (`admin`, `staff`)
- **Request Body**:
```json
{
  "status": "In Progress",
  "note": "Technician dispatched to evaluate pipe."
}
```

### 4.4 Assign Complaint to Staff
- **Method & Route**: `PATCH /api/complaints/:id/assign`
- **Access**: Private (`admin` only)
- **Request Body**:
```json
{
  "staffId": "6724c30089a1bc00192384d5",
  "note": "Assigned to Bob (Plumber)."
}
```

---

## 5. Maintenance Payments (`/api/payments`)

> **Notice**: Payment records represent billing schedules and manual payment verification. No external gateway is active in Version 1.

### 5.1 Create Dues Record
- **Method & Route**: `POST /api/payments`
- **Access**: Private (`admin` only)
- **Request Body**:
```json
{
  "residentId": "6724a1b02f89c100234123b2",
  "flatId": "6724a1b02f89c100234123a1",
  "amount": 2500,
  "billingPeriod": "November 2026",
  "dueDate": "2026-11-10T00:00:00.000Z",
  "notes": "Monthly society maintenance and security charge"
}
```

### 5.2 List Payments
- **Method & Route**: `GET /api/payments`
- **Access**: Private (Residents view their own dues; Admin & Staff view all records)

### 5.3 Update Payment Status (Manual Receipt)
- **Method & Route**: `PATCH /api/payments/:id/status`
- **Access**: Private (`admin` only)
- **Request Body**:
```json
{
  "status": "Paid",
  "paymentMethod": "UPI",
  "paymentReference": "UPI/2026/091823749",
  "notes": "Verified receipt via society bank statement"
}
```

---

## 6. Staff Management (`/api/staff`)

### 6.1 Register Staff Member
- **Method & Route**: `POST /api/staff`
- **Access**: Private (`admin` only)
- **Request Body**:
```json
{
  "name": "Marcus Vance",
  "jobRole": "Electrician",
  "contactDetails": {
    "email": "marcus@maintenance.complex.com",
    "phone": "+1-555-0182"
  },
  "availabilityStatus": "Available"
}
```

### 6.2 List Staff
- **Method & Route**: `GET /api/staff`
- **Access**: Private (`admin`, `staff`, `resident`)
- **Query Parameters**: `jobRole`, `availabilityStatus`, `search`, `page`, `limit`

---

## 7. Announcements (`/api/announcements`)

### 7.1 Publish Announcement
- **Method & Route**: `POST /api/announcements`
- **Access**: Private (`admin` only)
- **Request Body**:
```json
{
  "title": "Annual Fire Safety Drill",
  "message": "Mandatory fire evacuation drill scheduled for Saturday at 11:00 AM.",
  "targetAudience": "All",
  "priority": "Urgent",
  "expiryDate": "2026-10-31T23:59:59.000Z"
}
```

### 7.2 List Announcements
- **Method & Route**: `GET /api/announcements`
- **Access**: Private (Filtered according to user role: residents receive `All` and `Residents`)

---

## 8. AI Features (`/api/ai`)

### 8.1 Classify Complaint Issue
- **Method & Route**: `POST /api/ai/classify-complaint`
- **Access**: Private (Any authenticated user)
- **Request Body**:
```json
{
  "title": "Kitchen faucet leaking",
  "description": "Water leaking steadily from under the tap handle whenever water pressure rises in the evening."
}
```
- **Response** (`200 OK`):
```json
{
  "success": true,
  "message": "Complaint categorized successfully",
  "data": {
    "category": "Plumbing",
    "priority": "Medium",
    "suggestedAction": "Inspect faucet spindle cartridge and replace degraded silicone washer.",
    "isFallback": false,
    "provider": "gemini",
    "model": "gemini-2.5-flash"
  }
}
```
- **Missing AI Key Response** (`503 Service Unavailable`):
```json
{
  "success": false,
  "error": "AI service is not configured. Please set a valid AI_API_KEY in server environment variables.",
  "hint": "Please set the AI_API_KEY environment variable in your server configuration."
}
```

### 8.2 Apartment FAQ Chatbot
- **Method & Route**: `POST /api/ai/chat`
- **Access**: Private (Any authenticated user)
- **Request Body**:
```json
{
  "message": "What are the society swimming pool hours, and is guest parking free?"
}
```
- **Response** (`200 OK`):
```json
{
  "success": true,
  "data": {
    "reply": "The swimming pool is open daily from 6:00 AM – 11:00 AM and 4:00 PM – 9:00 PM (closed on Mondays for maintenance). Guest parking is available in the Block D visitor lot for up to 24 hours with security registration.",
    "provider": "gemini",
    "model": "gemini-2.5-flash",
    "disclaimer": "Automated response based on standard apartment guidelines. For private account or payment details, please contact the Management Office."
  }
}
```

### 8.3 AI Service Status
- **Method & Route**: `GET /api/ai/status`
- **Access**: Private (Any authenticated user)
- **Response** (`200 OK`):
```json
{
  "success": true,
  "data": {
    "configured": true,
    "provider": "gemini",
    "model": "gemini-2.5-flash",
    "timeoutMs": 10000
  }
}
```
