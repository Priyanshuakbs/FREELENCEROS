# 📊 Freelancer SaaS - Complete Project Analysis

## Project Overview
**FreelanceOS** is a full-stack SaaS platform for freelancers to manage clients, projects, invoices, expenses, time tracking, and contracts with an AI chatbot assistant.

- **Frontend**: React 19 + Vite + TailwindCSS + Zustand + Zod validation
- **Backend**: Node.js + Express + MongoDB + Mongoose
- **Database**: MongoDB (NoSQL)
- **Port**: Backend runs on 5000, Frontend on 5173

---

## 🏗️ ARCHITECTURE & FILE STRUCTURE

```
backend/
├── server.js              # Express app setup
├── middleware/auth.js     # JWT verification
├── controllers/           # Business logic
├── models/               # Database schemas
├── routes/               # API endpoints
└── package.json

frontend/
├── src/
│   ├── App.jsx            # Router & layout
│   ├── store/authStore.js # Zustand state
│   ├── lib/axios.js       # API client
│   ├── pages/             # Page components
│   ├── components/        # Reusable UI
│   └── assets/
└── vite.config.js
```

---

## 🔐 SECURITY MEASURES IMPLEMENTED

### 1. **Authentication & Authorization**
- **JWT (JSON Web Tokens)**: All protected routes require `Bearer <token>`
- **Password Hashing**: BCryptJS with salt rounds = 12
- **Password Validation**: 
  - Min 8 characters
  - Must contain: uppercase, lowercase, digit, special character
- **Token Expiration**: Configurable via `JWT_EXPIRE` env variable
- **Protected Routes**: All API endpoints except `/auth/register`, `/auth/login` require JWT

**File**: [backend/middleware/auth.js](backend/middleware/auth.js)

```javascript
// Usage in routes:
router.get('/protected-route', protect, controllerFunction);
```

### 2. **Rate Limiting**
- **General Limit**: 200 requests per 15 minutes per IP
- **Auth Limit**: 30 requests per 15 minutes for login/register (brute force protection)
- **Library**: `express-rate-limit`

**File**: [backend/server.js](backend/server.js#L15)

### 3. **Data Validation & Sanitization**
- **Input Validation**: Express-validator for email format, required fields
- **NoSQL Injection Prevention**: `express-mongo-sanitize` removes `$` and `.` from user input
- **Request Size Limit**: JSON payload limit enforced

**Files**: 
- [backend/server.js](backend/server.js#L42)
- All controllers validate required fields

### 4. **CORS (Cross-Origin Resource Sharing)**
- **Strict Origin Whitelist**: Only allows frontend URL from `.env`
- **Credentials Support**: Enabled for cookie-based auth if needed
- **Fallback**: Development mode allows localhost:5173

**File**: [backend/server.js](backend/server.js#L26)

```javascript
const allowedOrigins = process.env.FRONTEND_URL ? 
  [process.env.FRONTEND_URL] : ['http://localhost:5173'];
```

### 5. **HTTP Security Headers**
- **Helmet.js**: Protects against common web vulnerabilities
  - CSP (Content Security Policy)
  - XSS (Cross-Site Scripting)
  - Clickjacking attacks
  - MIME sniffing

**File**: [backend/server.js](backend/server.js#L10)

### 6. **Frontend Security**
- **Secure Token Storage**: Stored in localStorage via Zustand with persistence
- **Auto Token Refresh**: Axios interceptors handle 401 responses
- **Route Protection**: Private routes require valid token
- **API Token Injection**: Automatic header injection on every request

**Files**: 
- [frontend/src/store/authStore.js](frontend/src/store/authStore.js)
- [frontend/src/lib/axios.js](frontend/src/lib/axios.js)
- [frontend/src/App.jsx](frontend/src/App.jsx#L22)

### 7. **Data Privacy**
- **Password Never Returned**: User model excludes password in queries with `.select('-password')`
- **Freelancer-Scoped Queries**: All data filtered by `freelancer: req.user._id`
- **User Isolation**: No user can access another user's data

**Example**: All controller queries include `{ freelancer: req.user._id }`

### 8. **Environment Variables**
- **Sensitive Data Protection**: API keys, secrets in `.env`
- **Production Mode Detection**: Different error messages in production vs development
- **Database URI**: Protected in `process.env.MONGO_URI`

---

## 📋 COMPLETE FUNCTION REFERENCE

### 🔑 AUTHENTICATION CONTROLLER
**File**: [backend/controllers/authController.js](backend/controllers/authController.js)

| Function | Purpose | Route | Method | Auth Required |
|----------|---------|-------|--------|----------------|
| `register` | Create new account | `/api/auth/register` | POST | No |
| `login` | User login | `/api/auth/login` | POST | No |
| `getMe` | Get current user | `/api/auth/me` | GET | ✅ Yes |
| `updateGoal` | Set monthly income goal | `/api/auth/goal` | PUT | ✅ Yes |

**Usage Examples**:

```bash
# Register
POST /api/auth/register
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "Secure@123"
}

# Login
POST /api/auth/login
{
  "email": "john@example.com",
  "password": "Secure@123"
}

# Get current user (with JWT header)
GET /api/auth/me
Headers: Authorization: Bearer <token>

# Update monthly goal
PUT /api/auth/goal
{
  "monthlyGoal": 100000
}
```

---

### 👥 CLIENTS CONTROLLER
**File**: [backend/controllers/clientController.js](backend/controllers/clientController.js)

| Function | Purpose | Route | Method | Auth |
|----------|---------|-------|--------|------|
| `getClients` | Fetch all clients | `/api/clients` | GET | ✅ |
| `createClient` | Add new client | `/api/clients` | POST | ✅ |
| `updateClient` | Edit client details | `/api/clients/:id` | PUT | ✅ |
| `deleteClient` | Remove client | `/api/clients/:id` | DELETE | ✅ |

**Usage Examples**:

```bash
# Get all clients
GET /api/clients

# Create client
POST /api/clients
{
  "name": "TechCorp India",
  "email": "contact@techcorp.com",
  "phone": "+91-9876543210",
  "company": "TechCorp",
  "address": "Bangalore, India"
}

# Update client
PUT /api/clients/60d5ec49c1234567890abc12
{
  "phone": "+91-9876543211",
  "address": "New Address"
}

# Delete client
DELETE /api/clients/60d5ec49c1234567890abc12
```

---

### 📁 PROJECTS & KANBAN CONTROLLER
**File**: [backend/controllers/projectController.js](backend/controllers/projectController.js)

| Function | Purpose | Route | Method | Auth |
|----------|---------|-------|--------|------|
| `getProjects` | Fetch all projects | `/api/projects` | GET | ✅ |
| `getProject` | Get single project | `/api/projects/:id` | GET | ✅ |
| `createProject` | Create new project | `/api/projects` | POST | ✅ |
| `updateProject` | Edit project | `/api/projects/:id` | PUT | ✅ |
| `deleteProject` | Delete project | `/api/projects/:id` | DELETE | ✅ |
| `addTask` | Add task to project | `/api/projects/:id/tasks` | POST | ✅ |
| `moveTask` | Move task (todo→in-progress→review→done) | `/api/projects/:id/tasks/:taskId` | PATCH | ✅ |
| `deleteTask` | Delete task | `/api/projects/:id/tasks/:taskId` | DELETE | ✅ |
| `toggleTask` | Mark task complete/incomplete | `/api/projects/:id/tasks/:taskId/toggle` | PATCH | ✅ |
| `generateShareToken` | Create public sharing link | `/api/projects/:id/share` | POST | ✅ |
| `getPublicProject` | Access shared project (no auth needed) | `/api/projects/public/:token` | GET | No |

**Usage Examples**:

```bash
# Get all projects with clients populated
GET /api/projects

# Create project
POST /api/projects
{
  "title": "Website Redesign",
  "description": "Modern responsive website",
  "client": "60d5ec49c1234567890abc12",
  "budget": 50000,
  "deadline": "2024-12-31",
  "status": "active"
}

# Add task to project
POST /api/projects/60d5ec49c1234567890abc12/tasks
{
  "title": "Design Homepage"
}

# Move task between statuses (Kanban)
PATCH /api/projects/60d5ec49c1234567890abc12/tasks/60d5ec49c1234567890abc13
{
  "status": "in-progress"
}

# Generate share token for client portal
POST /api/projects/60d5ec49c1234567890abc12/share

# Access public project (client view)
GET /api/projects/public/abc123def456...
```

---

### 📄 INVOICES CONTROLLER
**File**: [backend/controllers/invoiceController.js](backend/controllers/invoiceController.js)

| Function | Purpose | Route | Method | Auth |
|----------|---------|-------|--------|------|
| `getInvoices` | Fetch all invoices | `/api/invoices` | GET | ✅ |
| `getInvoice` | Get single invoice | `/api/invoices/:id` | GET | ✅ |
| `createInvoice` | Generate invoice | `/api/invoices` | POST | ✅ |
| `updateStatus` | Change status (draft→sent→paid) | `/api/invoices/:id/status` | PATCH | ✅ |
| `downloadPDF` | Export invoice as PDF | `/api/invoices/:id/pdf` | GET | ✅ |
| `sendReminderEmail` | Email payment reminder | `/api/invoices/:id/remind` | POST | ✅ |
| `deleteInvoice` | Delete invoice | `/api/invoices/:id` | DELETE | ✅ |

**Uses**: Puppeteer (PDF generation) + Nodemailer (Email)

**Usage Examples**:

```bash
# Get all invoices (sorted by newest first)
GET /api/invoices

# Create invoice
POST /api/invoices
{
  "client": "60d5ec49c1234567890abc12",
  "project": "60d5ec49c1234567890abc13",
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

# Update invoice status to paid
PATCH /api/invoices/60d5ec49c1234567890abc14/status
{
  "status": "paid"
}

# Download PDF
GET /api/invoices/60d5ec49c1234567890abc14/pdf
# Returns PDF file as attachment

# Send payment reminder email
POST /api/invoices/60d5ec49c1234567890abc14/remind
```

**PDF Template Features**:
- Professional invoice design with company branding
- Client details, project info, line items
- Tax calculations (GST 18% default)
- Invoice number, dates, status badge
- Subtotal, tax, grand total

---

### ⏱️ TIME LOGS CONTROLLER
**File**: [backend/controllers/timeLogController.js](backend/controllers/timeLogController.js)

| Function | Purpose | Route | Method | Auth |
|----------|---------|-------|--------|------|
| `getLogs` | Fetch all time logs | `/api/timelogs` | GET | ✅ |
| `createLog` | Record work hours | `/api/timelogs` | POST | ✅ |
| `deleteLog` | Delete time entry | `/api/timelogs/:id` | DELETE | ✅ |

**Usage Examples**:

```bash
# Get all time logs
GET /api/timelogs

# Log work time (duration in minutes)
POST /api/timelogs
{
  "project": "60d5ec49c1234567890abc12",
  "description": "Frontend development",
  "duration": 480,  // 8 hours
  "hourlyRate": 1500,
  "date": "2024-12-15"
}

# Delete time entry
DELETE /api/timelogs/60d5ec49c1234567890abc15
```

**Data Notes**:
- Duration stored in minutes (480 = 8 hours)
- Hourly rate captured for invoice calculations
- Associated with project for billing context

---

### 💳 EXPENSES CONTROLLER
**File**: [backend/controllers/expenseController.js](backend/controllers/expenseController.js)

| Function | Purpose | Route | Method | Auth |
|----------|---------|-------|--------|------|
| `getExpenses` | Fetch all expenses | `/api/expenses` | GET | ✅ |
| `createExpense` | Record expense | `/api/expenses` | POST | ✅ |
| `deleteExpense` | Delete expense | `/api/expenses/:id` | DELETE | ✅ |

**Usage Examples**:

```bash
# Get all expenses (sorted by date)
GET /api/expenses

# Create expense
POST /api/expenses
{
  "title": "Adobe Creative Suite License",
  "amount": 5499,
  "category": "Software",  // One of: Software, Hardware, Marketing, Office, Travel, Others
  "date": "2024-12-15",
  "notes": "Monthly subscription"
}

# Delete expense
DELETE /api/expenses/60d5ec49c1234567890abc16
```

**Expense Categories**:
- Software (subscriptions, tools)
- Hardware (equipment, devices)
- Marketing (ads, content creation)
- Office (supplies, furniture)
- Travel (flights, hotels)
- Others (miscellaneous)

---

### 📋 CONTRACTS CONTROLLER
**File**: [backend/controllers/contractController.js](backend/controllers/contractController.js)

| Function | Purpose | Route | Method | Auth |
|----------|---------|-------|--------|------|
| `getContracts` | Fetch all contracts | `/api/contracts` | GET | ✅ |
| `createContract` | Create new contract | `/api/contracts` | POST | ✅ |
| `downloadContractPDF` | Export contract as PDF | `/api/contracts/:id/pdf` | GET | ✅ |
| `deleteContract` | Delete contract | `/api/contracts/:id` | DELETE | ✅ |

**Uses**: Puppeteer for PDF generation

**Usage Examples**:

```bash
# Get all contracts
GET /api/contracts

# Create contract
POST /api/contracts
{
  "title": "Web Development Agreement",
  "clientName": "John Smith",
  "clientEmail": "john@client.com",
  "description": "Development of e-commerce platform",
  "terms": "1. Client provides requirements\n2. Freelancer develops...",
  "amount": 150000,
  "status": "draft"  // draft, sent, or signed
}

# Download contract PDF
GET /api/contracts/60d5ec49c1234567890abc17/pdf

# Delete contract
DELETE /api/contracts/60d5ec49c1234567890abc17
```

**PDF Template Features**:
- Professional legal document format
- Freelancer and client details
- Engagement description, scope, technical terms
- Compensation details
- Signature area for both parties

---

### 🤖 CHATBOT CONTROLLER
**File**: [backend/controllers/chatbotController.js](backend/controllers/chatbotController.js)

| Function | Purpose | Route | Method | Auth |
|----------|---------|-------|--------|------|
| `processChat` | AI-powered business assistant | `/api/chatbot` | POST | ✅ |

**Uses**: Google Generative AI (Gemini) with fallback to rule-based parser

**Usage Examples**:

```bash
# Query business statistics
POST /api/chatbot
{
  "message": "Show me my business summary"
}

Response:
{
  "reply": "### 📊 Business Summary...\n- Clients: 5\n- Revenue: ₹500,000\n..."
}

# Revenue query
POST /api/chatbot
{
  "message": "How much have I earned?"
}

# Expense tracking
POST /api/chatbot
{
  "message": "What are my expenses?"
}

# Client listing
POST /api/chatbot
{
  "message": "List my clients"
}

# Project overview
POST /api/chatbot
{
  "message": "Tell me about my projects"
}

# Invoice management
POST /api/chatbot
{
  "message": "Send email reminders for unpaid invoices"
}
```

**AI Features**:
- **Primary**: Google Gemini 1.5 Flash model (with API key)
- **Fallback**: Rule-based parser (no API needed)
- **Context**: Provides freelancer's business metrics to AI

**Supported Queries (Rule-Based)**:
1. **Statistics**: "stats", "summary", "dashboard", "how am I doing"
2. **Revenue**: "revenue", "earned", "income", "money"
3. **Expenses**: "expense"
4. **Clients**: "client"
5. **Projects**: "project", "task", "kanban"
6. **Invoicing**: "email", "reminder", "unpaid", "remind"

---

## 🗄️ DATABASE MODELS & SCHEMAS

### User Model
**File**: [backend/models/User.js](backend/models/User.js)

```javascript
{
  name: String,
  email: String (unique),
  password: String (hashed with bcrypt),
  avatar: String,
  plan: String (free, pro, business),
  currency: String (default: INR),
  isVerified: Boolean,
  monthlyGoal: Number,
  createdAt: Date,
  updatedAt: Date
}
```

### Client Model
**File**: [backend/models/Client.js](backend/models/Client.js)

```javascript
{
  name: String,
  email: String,
  phone: String,
  company: String,
  address: String,
  freelancer: ObjectId (ref: User),
  createdAt: Date,
  updatedAt: Date
}
```

### Project Model
**File**: [backend/models/Project.js](backend/models/Project.js)

```javascript
{
  title: String,
  description: String,
  client: ObjectId (ref: Client),
  freelancer: ObjectId (ref: User),
  status: String (active, completed, on-hold),
  budget: Number,
  deadline: Date,
  tasks: [{
    title: String,
    completed: Boolean,
    status: String (todo, in-progress, review, done)
  }],
  shareToken: String (for public portal),
  createdAt: Date,
  updatedAt: Date
}
```

### Invoice Model
**File**: [backend/models/Invoice.js](backend/models/Invoice.js)

```javascript
{
  invoiceNumber: String (unique),
  client: ObjectId (ref: Client),
  project: ObjectId (ref: Project),
  freelancer: ObjectId (ref: User),
  items: [{
    description: String,
    quantity: Number,
    rate: Number,
    amount: Number
  }],
  subtotal: Number,
  tax: Number (default: 18),
  total: Number,
  status: String (draft, sent, paid, overdue),
  dueDate: Date,
  notes: String,
  paidAt: Date,
  createdAt: Date,
  updatedAt: Date
}
```

### TimeLog Model
**File**: [backend/models/TimeLog.js](backend/models/TimeLog.js)

```javascript
{
  project: ObjectId (ref: Project),
  freelancer: ObjectId (ref: User),
  description: String,
  duration: Number (in minutes),
  hourlyRate: Number,
  date: Date,
  createdAt: Date,
  updatedAt: Date
}
```

### Expense Model
**File**: [backend/models/Expense.js](backend/models/Expense.js)

```javascript
{
  title: String,
  amount: Number,
  category: String (Software, Hardware, Marketing, Office, Travel, Others),
  date: Date,
  notes: String,
  freelancer: ObjectId (ref: User),
  createdAt: Date,
  updatedAt: Date
}
```

### Contract Model
**File**: [backend/models/Contract.js](backend/models/Contract.js)

```javascript
{
  title: String,
  clientName: String,
  clientEmail: String,
  description: String,
  terms: String,
  amount: Number,
  status: String (draft, sent, signed),
  signedAt: Date,
  freelancer: ObjectId (ref: User),
  createdAt: Date,
  updatedAt: Date
}
```

---

## 🔌 API ROUTES STRUCTURE

### Authentication Routes
**File**: [backend/routes/auth.js](backend/routes/auth.js)
```
POST   /api/auth/register
POST   /api/auth/login
GET    /api/auth/me         (protected)
PUT    /api/auth/goal       (protected)
```

### Clients Routes
**File**: [backend/routes/clients.js](backend/routes/clients.js)
```
GET    /api/clients         (protected)
POST   /api/clients         (protected)
PUT    /api/clients/:id     (protected)
DELETE /api/clients/:id     (protected)
```

### Projects Routes
**File**: [backend/routes/projects.js](backend/routes/projects.js)
```
GET    /api/projects                    (protected)
POST   /api/projects                    (protected)
GET    /api/projects/:id                (protected)
PUT    /api/projects/:id                (protected)
DELETE /api/projects/:id                (protected)
POST   /api/projects/:id/tasks          (protected)
PATCH  /api/projects/:id/tasks/:taskId  (protected)
DELETE /api/projects/:id/tasks/:taskId  (protected)
PATCH  /api/projects/:id/tasks/:taskId/toggle (protected)
POST   /api/projects/:id/share          (protected)
GET    /api/projects/public/:token      (public)
```

### Invoices Routes
**File**: [backend/routes/invoices.js](backend/routes/invoices.js)
```
GET    /api/invoices           (protected)
POST   /api/invoices           (protected)
GET    /api/invoices/:id       (protected)
PATCH  /api/invoices/:id/status (protected)
GET    /api/invoices/:id/pdf   (protected)
POST   /api/invoices/:id/remind (protected)
DELETE /api/invoices/:id       (protected)
```

### Time Logs Routes
**File**: [backend/routes/timeLogs.js](backend/routes/timeLogs.js)
```
GET    /api/timelogs    (protected)
POST   /api/timelogs    (protected)
DELETE /api/timelogs/:id (protected)
```

### Expenses Routes
**File**: [backend/routes/expenses.js](backend/routes/expenses.js)
```
GET    /api/expenses     (protected)
POST   /api/expenses     (protected)
DELETE /api/expenses/:id (protected)
```

### Contracts Routes
**File**: [backend/routes/contracts.js](backend/routes/contracts.js)
```
GET    /api/contracts           (protected)
POST   /api/contracts           (protected)
GET    /api/contracts/:id/pdf   (protected)
DELETE /api/contracts/:id       (protected)
```

### Chatbot Routes
**File**: [backend/routes/chatbot.js](backend/routes/chatbot.js)
```
POST   /api/chatbot  (protected)
```

---

## 🎨 FRONTEND PAGES & COMPONENTS

### Pages
| Page | File | Purpose |
|------|------|---------|
| Dashboard | [frontend/src/pages/Dashboard.jsx](frontend/src/pages/Dashboard.jsx) | Main overview with analytics |
| Login | [frontend/src/pages/Login.jsx](frontend/src/pages/Login.jsx) | User authentication |
| Register | [frontend/src/pages/Register.jsx](frontend/src/pages/Register.jsx) | New account creation |
| Clients | [frontend/src/pages/Clients.jsx](frontend/src/pages/Clients.jsx) | Client management |
| Projects | [frontend/src/pages/Projects.jsx](frontend/src/pages/Projects.jsx) | Project listing & management |
| Kanban | [frontend/src/pages/Kanban.jsx](frontend/src/pages/Kanban.jsx) | Drag-drop task board |
| Time Tracker | [frontend/src/pages/TimeTracker.jsx](frontend/src/pages/TimeTracker.jsx) | Log work hours |
| Invoices | [frontend/src/pages/Invoices.jsx](frontend/src/pages/Invoices.jsx) | Invoice management & PDF export |
| Expenses | [frontend/src/pages/Expenses.jsx](frontend/src/pages/Expenses.jsx) | Expense tracking |
| Contracts | [frontend/src/pages/Contracts.jsx](frontend/src/pages/Contracts.jsx) | Contract management |
| Tax Estimator | [frontend/src/pages/TaxEstimator.jsx](frontend/src/pages/TaxEstimator.jsx) | Calculate tax liability |
| Client Portal | [frontend/src/pages/ClientPortal.jsx](frontend/src/pages/ClientPortal.jsx) | Shared project view (public) |
| Landing | [frontend/src/pages/Landing.jsx](frontend/src/pages/Landing.jsx) | Public homepage |

### Reusable Components
| Component | File | Purpose |
|-----------|------|---------|
| Layout | [frontend/src/components/Layout.jsx](frontend/src/components/Layout.jsx) | Main app shell with sidebar |
| Sidebar | [frontend/src/components/Sidebar.jsx](frontend/src/components/Sidebar.jsx) | Navigation menu |
| ChatbotWidget | [frontend/src/components/ChatbotWidget.jsx](frontend/src/components/ChatbotWidget.jsx) | AI assistant chat interface |

### State Management
- **Auth Store**: [frontend/src/store/authStore.js](frontend/src/store/authStore.js)
  - Manages user, token
  - Persisted to localStorage

### API Integration
- **Axios Instance**: [frontend/src/lib/axios.js](frontend/src/lib/axios.js)
  - Auto token injection in headers
  - Redirect to login on 401
  - Base URL from env: `VITE_API_URL`

---

## 🚀 HOW TO USE THE APPLICATION

### Setup & Installation

**Backend**:
```bash
cd backend
npm install
# Create .env file with:
# MONGO_URI=mongodb+srv://...
# JWT_SECRET=your_secret_key
# JWT_EXPIRE=7d
# PORT=5000
# FRONTEND_URL=http://localhost:5173
# GEMINI_API_KEY=your_api_key (optional)
npm run dev  # Start with nodemon
```

**Frontend**:
```bash
cd frontend
npm install
# Create .env file with:
# VITE_API_URL=http://localhost:5000/api
npm run dev  # Start dev server
```

### User Workflow

1. **Register/Login**: Navigate to `/login` or `/register`
2. **Add Clients**: Go to `/clients`, add client details
3. **Create Projects**: Go to `/projects`, create project, assign client
4. **Track Time**: Go to `/time-tracker`, log work hours
5. **Record Expenses**: Go to `/expenses`, categorize spending
6. **Generate Invoices**: Go to `/invoices`, create from projects & time logs
7. **Download PDF**: Click invoice → Download PDF → Send to client
8. **Email Reminders**: Click invoice → Send reminder email
9. **View Contracts**: Go to `/contracts`, download contract PDFs
10. **Share with Client**: Go to `/projects` → Generate share token → Share link

### API Authentication Flow

```
1. POST /api/auth/register or /api/auth/login
   → Returns: { token: "jwt_token", user: { ... } }

2. Store token in localStorage (Zustand persists automatically)

3. Include in all requests:
   Authorization: Bearer <token>

4. Backend validates token in middleware (auth.js)

5. If token expired/invalid → 401 response
   → Frontend redirects to /login
```

---

## 🛡️ SECURITY CHECKLIST

- ✅ **JWT Authentication**: Every protected endpoint validates token
- ✅ **Rate Limiting**: 200 reqs/15min general, 30 reqs/15min auth
- ✅ **Bcrypt Hashing**: Passwords never stored in plaintext
- ✅ **NoSQL Injection**: Input sanitization via mongo-sanitize
- ✅ **CORS**: Strict whitelist of allowed origins
- ✅ **Helmet Headers**: Protection against XSS, clickjacking, MIME sniffing
- ✅ **Password Policy**: Min 8 chars, mixed case, numbers, special chars
- ✅ **User Isolation**: All queries filtered by freelancer ID
- ✅ **Token Expiration**: Tokens expire (configurable)
- ✅ **HTTPS Ready**: Use in production with SSL certificates
- ✅ **Error Handling**: Generic messages in production, detailed in dev
- ✅ **Frontend Security**: Secure token storage, auto-logout on 401

---

## 📊 PERFORMANCE CONSIDERATIONS

- **Database Indexing**: Ensure indexes on `freelancer`, `email`, `invoiceNumber`
- **Pagination**: Consider implementing for large datasets
- **Caching**: Redis can cache user stats for chatbot
- **PDF Generation**: Puppeteer runs in headless mode for server efficiency
- **API Response Times**: Most operations < 500ms

---

## 🐛 COMMON API USAGE PATTERNS

### Creating a Complete Invoice Flow:
```javascript
// 1. Get client
const clients = await axios.get('/api/clients');
const clientId = clients.data.clients[0]._id;

// 2. Get project
const projects = await axios.get('/api/projects');
const projectId = projects.data.projects[0]._id;

// 3. Get time logs for context
const logs = await axios.get('/api/timelogs');

// 4. Create invoice
const invoice = await axios.post('/api/invoices', {
  client: clientId,
  project: projectId,
  items: [{ description: "Work", quantity: 40, rate: 1500, amount: 60000 }],
  tax: 18,
  dueDate: "2024-12-31"
});

// 5. Download PDF
const pdf = await axios.get(`/api/invoices/${invoice.data.invoice._id}/pdf`, {
  responseType: 'blob'
});
```

---

## 📞 SUPPORT & DEBUGGING

- Check backend logs: `npm run dev` in backend folder
- Check frontend console: Press F12 in browser
- Verify MongoDB connection: Check `.env` MONGO_URI
- Verify JWT secret matches: BACKEND_JWT_SECRET == FRONTEND usage
- Test protected routes: Include full Bearer token in Authorization header
- Monitor rate limits: Check X-RateLimit headers in responses

---

## 📄 LICENSE & NOTES

This project demonstrates:
- Full-stack MERN architecture
- Enterprise-grade security practices
- Real-world freelance business logic
- Modern React patterns with Zustand
- RESTful API design
- PDF & Email generation

**Last Updated**: December 2024
