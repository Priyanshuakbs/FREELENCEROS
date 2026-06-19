# 🔗 API ENDPOINTS COMPLETE REFERENCE

## API Base URL
```
http://localhost:5000/api
```

---

## 🔑 AUTHENTICATION ENDPOINTS

### Register New Account
```http
POST /auth/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "Secure@123"
}
```
**Response (201)**:
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "60d5ec49c1234567890abc12",
    "name": "John Doe",
    "email": "john@example.com",
    "plan": "free",
    "monthlyGoal": 100000
  }
}
```

### Login
```http
POST /auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "Secure@123"
}
```
**Response (200)**:
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "60d5ec49c1234567890abc12",
    "name": "John Doe",
    "email": "john@example.com",
    "plan": "free"
  }
}
```

### Get Current User
```http
GET /auth/me
Authorization: Bearer <token>
```
**Response (200)**:
```json
{
  "user": {
    "_id": "60d5ec49c1234567890abc12",
    "name": "John Doe",
    "email": "john@example.com",
    "plan": "free",
    "currency": "INR",
    "isVerified": false,
    "monthlyGoal": 100000,
    "avatar": "",
    "createdAt": "2024-12-15T10:30:00Z",
    "updatedAt": "2024-12-15T10:30:00Z"
  }
}
```

### Update Monthly Goal
```http
PUT /auth/goal
Authorization: Bearer <token>
Content-Type: application/json

{
  "monthlyGoal": 150000
}
```
**Response (200)**:
```json
{
  "user": {
    "_id": "60d5ec49c1234567890abc12",
    "name": "John Doe",
    "email": "john@example.com",
    "monthlyGoal": 150000,
    "plan": "free"
  }
}
```

---

## 👥 CLIENTS ENDPOINTS

### Get All Clients
```http
GET /clients
Authorization: Bearer <token>
```
**Response (200)**:
```json
{
  "clients": [
    {
      "_id": "60d5ec49c1234567890abc13",
      "name": "TechCorp India",
      "email": "contact@techcorp.com",
      "phone": "+91-9876543210",
      "company": "TechCorp",
      "address": "Bangalore, India",
      "freelancer": "60d5ec49c1234567890abc12",
      "createdAt": "2024-12-15T10:35:00Z"
    }
  ]
}
```

### Create Client
```http
POST /clients
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "TechCorp India",
  "email": "contact@techcorp.com",
  "phone": "+91-9876543210",
  "company": "TechCorp",
  "address": "Bangalore, India"
}
```
**Response (201)**:
```json
{
  "client": {
    "_id": "60d5ec49c1234567890abc13",
    "name": "TechCorp India",
    "email": "contact@techcorp.com",
    "phone": "+91-9876543210",
    "company": "TechCorp",
    "address": "Bangalore, India",
    "freelancer": "60d5ec49c1234567890abc12"
  }
}
```

### Update Client
```http
PUT /clients/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "phone": "+91-9876543211",
  "company": "TechCorp Solutions"
}
```
**Response (200)**:
```json
{
  "client": {
    "_id": "60d5ec49c1234567890abc13",
    "name": "TechCorp India",
    "email": "contact@techcorp.com",
    "phone": "+91-9876543211",
    "company": "TechCorp Solutions",
    "address": "Bangalore, India"
  }
}
```

### Delete Client
```http
DELETE /clients/:id
Authorization: Bearer <token>
```
**Response (200)**:
```json
{
  "message": "Client deleted"
}
```

---

## 📁 PROJECTS ENDPOINTS

### Get All Projects
```http
GET /projects
Authorization: Bearer <token>
```
**Response (200)**: Returns all projects with populated client details

### Get Single Project
```http
GET /projects/:id
Authorization: Bearer <token>
```

### Create Project
```http
POST /projects
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "Website Redesign",
  "description": "Modern responsive website",
  "client": "60d5ec49c1234567890abc13",
  "budget": 50000,
  "deadline": "2024-12-31",
  "status": "active"
}
```
**Response (201)**:
```json
{
  "project": {
    "_id": "60d5ec49c1234567890abc14",
    "title": "Website Redesign",
    "description": "Modern responsive website",
    "client": "60d5ec49c1234567890abc13",
    "budget": 50000,
    "deadline": "2024-12-31",
    "status": "active",
    "tasks": [],
    "freelancer": "60d5ec49c1234567890abc12",
    "shareToken": null
  }
}
```

### Update Project
```http
PUT /projects/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "status": "completed",
  "budget": 55000
}
```

### Delete Project
```http
DELETE /projects/:id
Authorization: Bearer <token>
```
**Response (200)**:
```json
{
  "message": "Project deleted"
}
```

---

## 📝 KANBAN / TASK ENDPOINTS

### Add Task to Project
```http
POST /projects/:id/tasks
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "Design Homepage"
}
```
**Response (200)**:
```json
{
  "project": {
    "_id": "60d5ec49c1234567890abc14",
    "title": "Website Redesign",
    "tasks": [
      {
        "_id": "60d5ec49c1234567890abc15",
        "title": "Design Homepage",
        "completed": false,
        "status": "todo"
      }
    ]
  }
}
```

### Move Task (Change Status)
```http
PATCH /projects/:projectId/tasks/:taskId
Authorization: Bearer <token>
Content-Type: application/json

{
  "status": "in-progress"
}
```
**Status Values**: `todo` → `in-progress` → `review` → `done`

### Toggle Task Complete
```http
PATCH /projects/:projectId/tasks/:taskId/toggle
Authorization: Bearer <token>
```
**Response (200)**:
```json
{
  "project": {
    "tasks": [
      {
        "_id": "60d5ec49c1234567890abc15",
        "title": "Design Homepage",
        "completed": true,
        "status": "todo"
      }
    ]
  }
}
```

### Delete Task
```http
DELETE /projects/:projectId/tasks/:taskId
Authorization: Bearer <token>
```
**Response (200)**:
```json
{
  "project": { ... }
}
```

---

## 🔗 PROJECT SHARING ENDPOINTS

### Generate Share Token
```http
POST /projects/:id/share
Authorization: Bearer <token>
```
**Response (200)**:
```json
{
  "shareToken": "abc123def456ghi789jkl012..."
}
```

### Get Public Project (No Auth)
```http
GET /projects/public/:token
```
**Response (200)**:
```json
{
  "project": {
    "_id": "60d5ec49c1234567890abc14",
    "title": "Website Redesign",
    "client": { "name": "TechCorp India", "company": "TechCorp" },
    "freelancer": { "name": "John Doe" },
    "tasks": [ ... ],
    "status": "active"
  }
}
```

---

## 💵 INVOICES ENDPOINTS

### Get All Invoices
```http
GET /invoices
Authorization: Bearer <token>
```
**Response (200)**:
```json
{
  "invoices": [
    {
      "_id": "60d5ec49c1234567890abc16",
      "invoiceNumber": "INV-202412-5678",
      "client": { "name": "TechCorp India", "email": "contact@techcorp.com" },
      "project": { "title": "Website Redesign" },
      "subtotal": 60000,
      "tax": 18,
      "total": 70800,
      "status": "draft",
      "dueDate": "2024-12-31",
      "createdAt": "2024-12-15T11:00:00Z"
    }
  ]
}
```

### Get Single Invoice
```http
GET /invoices/:id
Authorization: Bearer <token>
```

### Create Invoice
```http
POST /invoices
Authorization: Bearer <token>
Content-Type: application/json

{
  "client": "60d5ec49c1234567890abc13",
  "project": "60d5ec49c1234567890abc14",
  "items": [
    {
      "description": "Web Development - 40 hours",
      "quantity": 40,
      "rate": 1500,
      "amount": 60000
    }
  ],
  "tax": 18,
  "dueDate": "2024-12-31",
  "notes": "Payment via bank transfer"
}
```
**Response (201)**:
```json
{
  "invoice": {
    "_id": "60d5ec49c1234567890abc16",
    "invoiceNumber": "INV-202412-5678",
    "client": "60d5ec49c1234567890abc13",
    "project": "60d5ec49c1234567890abc14",
    "items": [ ... ],
    "subtotal": 60000,
    "tax": 18,
    "total": 70800,
    "status": "draft",
    "dueDate": "2024-12-31",
    "notes": "Payment via bank transfer"
  }
}
```

### Update Invoice Status
```http
PATCH /invoices/:id/status
Authorization: Bearer <token>
Content-Type: application/json

{
  "status": "paid"
}
```
**Status Values**: `draft` → `sent` → `paid` or `overdue`

### Download Invoice PDF
```http
GET /invoices/:id/pdf
Authorization: Bearer <token>
```
**Response**: PDF file (application/pdf)

### Send Payment Reminder Email
```http
POST /invoices/:id/remind
Authorization: Bearer <token>
```
**Response (200)**:
```json
{
  "message": "Reminder email sent"
}
```

### Delete Invoice
```http
DELETE /invoices/:id
Authorization: Bearer <token>
```
**Response (200)**:
```json
{
  "message": "Deleted"
}
```

---

## ⏱️ TIME LOGS ENDPOINTS

### Get All Time Logs
```http
GET /timelogs
Authorization: Bearer <token>
```
**Response (200)**:
```json
{
  "logs": [
    {
      "_id": "60d5ec49c1234567890abc17",
      "project": { "title": "Website Redesign" },
      "description": "Frontend development",
      "duration": 480,
      "hourlyRate": 1500,
      "date": "2024-12-15",
      "createdAt": "2024-12-15T14:00:00Z"
    }
  ]
}
```

### Create Time Log
```http
POST /timelogs
Authorization: Bearer <token>
Content-Type: application/json

{
  "project": "60d5ec49c1234567890abc14",
  "description": "Frontend development",
  "duration": 480,
  "hourlyRate": 1500,
  "date": "2024-12-15"
}
```
**Note**: Duration is in minutes (480 = 8 hours)

**Response (201)**:
```json
{
  "log": {
    "_id": "60d5ec49c1234567890abc17",
    "project": "60d5ec49c1234567890abc14",
    "description": "Frontend development",
    "duration": 480,
    "hourlyRate": 1500,
    "date": "2024-12-15"
  }
}
```

### Delete Time Log
```http
DELETE /timelogs/:id
Authorization: Bearer <token>
```
**Response (200)**:
```json
{
  "message": "Deleted"
}
```

---

## 💳 EXPENSES ENDPOINTS

### Get All Expenses
```http
GET /expenses
Authorization: Bearer <token>
```
**Response (200)**:
```json
{
  "expenses": [
    {
      "_id": "60d5ec49c1234567890abc18",
      "title": "Adobe Creative Suite License",
      "amount": 5499,
      "category": "Software",
      "date": "2024-12-15",
      "notes": "Monthly subscription",
      "createdAt": "2024-12-15T10:00:00Z"
    }
  ]
}
```

### Create Expense
```http
POST /expenses
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "Adobe Creative Suite License",
  "amount": 5499,
  "category": "Software",
  "date": "2024-12-15",
  "notes": "Monthly subscription"
}
```
**Categories**: `Software`, `Hardware`, `Marketing`, `Office`, `Travel`, `Others`

**Response (201)**:
```json
{
  "expense": {
    "_id": "60d5ec49c1234567890abc18",
    "title": "Adobe Creative Suite License",
    "amount": 5499,
    "category": "Software",
    "date": "2024-12-15",
    "notes": "Monthly subscription"
  }
}
```

### Delete Expense
```http
DELETE /expenses/:id
Authorization: Bearer <token>
```
**Response (200)**:
```json
{
  "message": "Expense deleted"
}
```

---

## 📋 CONTRACTS ENDPOINTS

### Get All Contracts
```http
GET /contracts
Authorization: Bearer <token>
```
**Response (200)**:
```json
{
  "contracts": [
    {
      "_id": "60d5ec49c1234567890abc19",
      "title": "Web Development Agreement",
      "clientName": "John Smith",
      "clientEmail": "john@client.com",
      "description": "Development of e-commerce platform",
      "terms": "1. Client provides requirements\n2. Freelancer develops...",
      "amount": 150000,
      "status": "draft",
      "signedAt": null,
      "createdAt": "2024-12-15T10:00:00Z"
    }
  ]
}
```

### Create Contract
```http
POST /contracts
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "Web Development Agreement",
  "clientName": "John Smith",
  "clientEmail": "john@client.com",
  "description": "Development of e-commerce platform",
  "terms": "1. Client provides requirements\n2. Freelancer develops according to spec\n3. Payment on milestones",
  "amount": 150000,
  "status": "draft"
}
```
**Status Values**: `draft`, `sent`, `signed`

**Response (201)**:
```json
{
  "contract": {
    "_id": "60d5ec49c1234567890abc19",
    "title": "Web Development Agreement",
    "clientName": "John Smith",
    "clientEmail": "john@client.com",
    "description": "Development of e-commerce platform",
    "terms": "1. Client provides requirements\n...",
    "amount": 150000,
    "status": "draft",
    "signedAt": null
  }
}
```

### Download Contract PDF
```http
GET /contracts/:id/pdf
Authorization: Bearer <token>
```
**Response**: PDF file (application/pdf)

### Delete Contract
```http
DELETE /contracts/:id
Authorization: Bearer <token>
```
**Response (200)**:
```json
{
  "message": "Contract deleted successfully"
}
```

---

## 🤖 CHATBOT ENDPOINTS

### Process Chat Message
```http
POST /chatbot
Authorization: Bearer <token>
Content-Type: application/json

{
  "message": "Show me my business summary"
}
```

**Response (200)**: 
```json
{
  "reply": "### 📊 Business Summary...\n- Clients: 5\n- Revenue: ₹500,000\n- Net Profit: ₹250,000\n..."
}
```

### Example Queries

**Get Statistics**:
```bash
Message: "Show me my business summary"
Message: "Statistics"
Message: "Dashboard"
Message: "How am I doing?"
```

**Revenue Information**:
```bash
Message: "How much have I earned?"
Message: "Revenue"
Message: "Income"
Message: "Money"
```

**Expense Overview**:
```bash
Message: "What are my expenses?"
Message: "Expense report"
```

**Client Information**:
```bash
Message: "List my clients"
Message: "Show clients"
```

**Project Information**:
```bash
Message: "Tell me about my projects"
Message: "Project overview"
Message: "Kanban"
```

**Invoice Management**:
```bash
Message: "Send payment reminders"
Message: "Unpaid invoices"
Message: "Email reminders"
```

---

## 🚨 ERROR RESPONSES

### 400 Bad Request
```json
{
  "message": "Name and email required"
}
```

### 401 Unauthorized
```json
{
  "message": "Not authorized"
}
```

### 404 Not Found
```json
{
  "message": "Client not found"
}
```

### 429 Too Many Requests (Rate Limit)
```
Headers:
X-RateLimit-Limit: 200
X-RateLimit-Remaining: 0
X-RateLimit-Reset: 1702659900

Body:
{
  "message": "Too many requests, please try again later."
}
```

### 500 Server Error
```json
{
  "message": "An unexpected error occurred."
}
```

---

## 🔄 Common Integration Patterns

### Full Invoice Workflow
```javascript
// 1. Login
POST /api/auth/login
→ Get token

// 2. Get clients to select one
GET /api/clients
→ Choose client ID

// 3. Get projects for context
GET /api/projects
→ Choose project ID

// 4. Create invoice
POST /api/invoices
{
  client: selectedClientId,
  project: selectedProjectId,
  items: [...],
  tax: 18
}
→ Get invoiceId

// 5. Download PDF
GET /api/invoices/{invoiceId}/pdf

// 6. Send reminder
POST /api/invoices/{invoiceId}/remind

// 7. Mark as paid
PATCH /api/invoices/{invoiceId}/status
{ status: "paid" }
```

### Project with Kanban
```javascript
// 1. Create project
POST /api/projects
→ Get projectId

// 2. Add tasks
POST /api/projects/{projectId}/tasks
{ title: "Design" }

// 3. Move tasks
PATCH /api/projects/{projectId}/tasks/{taskId}
{ status: "in-progress" }

// 4. Mark complete
PATCH /api/projects/{projectId}/tasks/{taskId}/toggle
```

### Client Portal Sharing
```javascript
// 1. Get project
GET /api/projects/{id}

// 2. Generate share token
POST /api/projects/{id}/share
→ Get shareToken

// 3. Create share URL
https://yourapp.com/portal/{shareToken}

// 4. Client accesses without login
GET /api/projects/public/{shareToken}
```

---

## 📊 Request/Response Examples

### Example: Create Invoice with Multiple Line Items
**Request**:
```http
POST /api/invoices
Authorization: Bearer eyJ...
Content-Type: application/json

{
  "client": "64f8d9c3e4b8a1f2c3d4e5f6",
  "project": "64f8d9c3e4b8a1f2c3d4e5f7",
  "items": [
    {
      "description": "UI Design - 20 hours",
      "quantity": 20,
      "rate": 2000,
      "amount": 40000
    },
    {
      "description": "Development - 30 hours",
      "quantity": 30,
      "rate": 2500,
      "amount": 75000
    },
    {
      "description": "Testing & QA - 10 hours",
      "quantity": 10,
      "rate": 1500,
      "amount": 15000
    }
  ],
  "tax": 18,
  "dueDate": "2025-01-15",
  "notes": "50% advance, 50% on completion"
}
```

**Response (201)**:
```json
{
  "invoice": {
    "_id": "64f8d9c3e4b8a1f2c3d4e5f8",
    "invoiceNumber": "INV-202412-9876",
    "client": "64f8d9c3e4b8a1f2c3d4e5f6",
    "project": "64f8d9c3e4b8a1f2c3d4e5f7",
    "items": [
      {
        "description": "UI Design - 20 hours",
        "quantity": 20,
        "rate": 2000,
        "amount": 40000
      },
      {
        "description": "Development - 30 hours",
        "quantity": 30,
        "rate": 2500,
        "amount": 75000
      },
      {
        "description": "Testing & QA - 10 hours",
        "quantity": 10,
        "rate": 1500,
        "amount": 15000
      }
    ],
    "subtotal": 130000,
    "tax": 18,
    "total": 153400,
    "status": "draft",
    "dueDate": "2025-01-15",
    "notes": "50% advance, 50% on completion",
    "freelancer": "64f8d9c3e4b8a1f2c3d4e5f0",
    "createdAt": "2024-12-15T15:30:00Z"
  }
}
```

---

## 🎯 Response Status Codes Summary

| Code | Meaning | When Used |
|------|---------|-----------|
| 200 | OK | Successful GET, PUT, PATCH, DELETE |
| 201 | Created | Successful POST (resource created) |
| 400 | Bad Request | Missing required fields, validation failed |
| 401 | Unauthorized | Missing or invalid JWT token |
| 404 | Not Found | Resource doesn't exist or doesn't belong to user |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Server Error | Unexpected server error |

---

**All endpoints require JWT token in Authorization header except `/auth/register`, `/auth/login`, and `/projects/public/:token`**

