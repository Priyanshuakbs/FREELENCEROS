# 🎯 QUICK REFERENCE GUIDE - FreelanceOS

## 📍 Function Quick Lookup Table

| Module | Function | File | Route | Auth | Use Case |
|--------|----------|------|-------|------|----------|
| **AUTH** | `register` | authController.js | POST /auth/register | No | Create account |
| **AUTH** | `login` | authController.js | POST /auth/login | No | User login |
| **AUTH** | `getMe` | authController.js | GET /auth/me | ✅ | Get current user |
| **AUTH** | `updateGoal` | authController.js | PUT /auth/goal | ✅ | Set income target |
| **CLIENTS** | `getClients` | clientController.js | GET /clients | ✅ | List all clients |
| **CLIENTS** | `createClient` | clientController.js | POST /clients | ✅ | Add new client |
| **CLIENTS** | `updateClient` | clientController.js | PUT /clients/:id | ✅ | Edit client info |
| **CLIENTS** | `deleteClient` | clientController.js | DELETE /clients/:id | ✅ | Remove client |
| **PROJECTS** | `getProjects` | projectController.js | GET /projects | ✅ | List projects |
| **PROJECTS** | `createProject` | projectController.js | POST /projects | ✅ | Create project |
| **PROJECTS** | `updateProject` | projectController.js | PUT /projects/:id | ✅ | Edit project |
| **PROJECTS** | `deleteProject` | projectController.js | DELETE /projects/:id | ✅ | Delete project |
| **PROJECTS** | `addTask` | projectController.js | POST /projects/:id/tasks | ✅ | Add task |
| **PROJECTS** | `moveTask` | projectController.js | PATCH /projects/:id/tasks/:taskId | ✅ | Move task (Kanban) |
| **PROJECTS** | `deleteTask` | projectController.js | DELETE /projects/:id/tasks/:taskId | ✅ | Delete task |
| **PROJECTS** | `toggleTask` | projectController.js | PATCH /projects/:id/tasks/:taskId/toggle | ✅ | Complete/reopen |
| **PROJECTS** | `generateShareToken` | projectController.js | POST /projects/:id/share | ✅ | Create share link |
| **PROJECTS** | `getPublicProject` | projectController.js | GET /projects/public/:token | No | Client portal |
| **INVOICES** | `getInvoices` | invoiceController.js | GET /invoices | ✅ | List invoices |
| **INVOICES** | `createInvoice` | invoiceController.js | POST /invoices | ✅ | Create invoice |
| **INVOICES** | `updateStatus` | invoiceController.js | PATCH /invoices/:id/status | ✅ | Mark paid/draft/sent |
| **INVOICES** | `downloadPDF` | invoiceController.js | GET /invoices/:id/pdf | ✅ | Export as PDF |
| **INVOICES** | `sendReminderEmail` | invoiceController.js | POST /invoices/:id/remind | ✅ | Email payment reminder |
| **INVOICES** | `deleteInvoice` | invoiceController.js | DELETE /invoices/:id | ✅ | Delete invoice |
| **TIME** | `getLogs` | timeLogController.js | GET /timelogs | ✅ | List time entries |
| **TIME** | `createLog` | timeLogController.js | POST /timelogs | ✅ | Log work hours |
| **TIME** | `deleteLog` | timeLogController.js | DELETE /timelogs/:id | ✅ | Delete time entry |
| **EXPENSES** | `getExpenses` | expenseController.js | GET /expenses | ✅ | List expenses |
| **EXPENSES** | `createExpense` | expenseController.js | POST /expenses | ✅ | Record expense |
| **EXPENSES** | `deleteExpense` | expenseController.js | DELETE /expenses/:id | ✅ | Delete expense |
| **CONTRACTS** | `getContracts` | contractController.js | GET /contracts | ✅ | List contracts |
| **CONTRACTS** | `createContract` | contractController.js | POST /contracts | ✅ | Create contract |
| **CONTRACTS** | `downloadContractPDF` | contractController.js | GET /contracts/:id/pdf | ✅ | Export contract PDF |
| **CONTRACTS** | `deleteContract` | contractController.js | DELETE /contracts/:id | ✅ | Delete contract |
| **CHATBOT** | `processChat` | chatbotController.js | POST /chatbot | ✅ | AI assistant query |

---

## 🔐 SECURITY MEASURES AT A GLANCE

| Security Feature | Implementation | Location |
|-----------------|-----------------|----------|
| **JWT Auth** | Bearer token in Authorization header | auth.js middleware |
| **Password Hashing** | bcryptjs (salt rounds: 12) | User.js model |
| **Password Policy** | Min 8 chars, uppercase, lowercase, digit, special | authController.js |
| **Rate Limiting** | 200 reqs/15min general, 30 reqs/15min auth | server.js |
| **CORS** | Whitelist frontend URL from env | server.js |
| **Input Sanitization** | express-mongo-sanitize removes $ and . | server.js |
| **HTTP Headers** | helmet.js (CSP, XSS, clickjacking) | server.js |
| **User Isolation** | All queries filtered by freelancer:req.user._id | All controllers |
| **Password Never Returned** | .select('-password') on User queries | All controllers |
| **Token Expiration** | Configurable via JWT_EXPIRE env | authController.js |
| **404 Handling** | Generic error messages in production | server.js |
| **Frontend Token Management** | Zustand persistent storage + auto-logout | axios.js, authStore.js |

---

## 📊 COMMON API REQUESTS

### Authentication
```bash
# Register
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"John","email":"john@test.com","password":"Pass@123"}'

# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"john@test.com","password":"Pass@123"}'

# Response includes: { token: "eyJ...", user: {...} }
```

### Protected Request (with token)
```bash
curl -X GET http://localhost:5000/api/clients \
  -H "Authorization: Bearer eyJ..."
```

### Create Invoice
```bash
curl -X POST http://localhost:5000/api/invoices \
  -H "Authorization: Bearer eyJ..." \
  -H "Content-Type: application/json" \
  -d '{
    "client":"60d5ec49c1234567890abc12",
    "items":[{"description":"Work","quantity":40,"rate":1500,"amount":60000}],
    "tax":18
  }'
```

### Download Invoice PDF
```bash
curl -X GET http://localhost:5000/api/invoices/60d5ec49c1234567890abc14/pdf \
  -H "Authorization: Bearer eyJ..." \
  -o invoice.pdf
```

---

## 💡 ENVIRONMENT VARIABLES

### Backend (.env)
```bash
MONGO_URI=mongodb+srv://user:pass@cluster.mongodb.net/dbname
JWT_SECRET=your_secret_key_here
JWT_EXPIRE=7d
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
GEMINI_API_KEY=your_gemini_api_key (optional)
SMTP_HOST=smtp.ethereal.email (for email)
SMTP_PORT=587
SMTP_USER=your_email@ethereal.email
SMTP_PASS=your_email_password
```

### Frontend (.env)
```bash
VITE_API_URL=http://localhost:5000/api
```

---

## 📁 KEY FILE LOCATIONS

```
backend/
├── controllers/
│   ├── authController.js        ← Auth functions
│   ├── clientController.js      ← Client CRUD
│   ├── projectController.js     ← Projects & Kanban
│   ├── invoiceController.js     ← Invoices + PDF
│   ├── timeLogController.js     ← Time tracking
│   ├── expenseController.js     ← Expenses
│   ├── contractController.js    ← Contracts + PDF
│   └── chatbotController.js     ← AI assistant
├── models/
│   ├── User.js
│   ├── Client.js
│   ├── Project.js
│   ├── Invoice.js
│   ├── TimeLog.js
│   ├── Expense.js
│   └── Contract.js
├── middleware/
│   └── auth.js                  ← JWT verification
├── routes/
│   ├── auth.js
│   ├── clients.js
│   ├── projects.js
│   ├── invoices.js
│   ├── timeLogs.js
│   ├── expenses.js
│   ├── contracts.js
│   └── chatbot.js
├── server.js                    ← Express setup
└── package.json

frontend/
├── src/
│   ├── pages/                   ← All page components
│   ├── components/              ← Reusable UI components
│   ├── store/authStore.js       ← State management
│   ├── lib/axios.js             ← API client
│   ├── App.jsx                  ← Router
│   └── main.jsx
├── vite.config.js
└── package.json
```

---

## 🎯 TYPICAL USER WORKFLOWS

### Workflow 1: Create & Send Invoice
```
1. Login → POST /auth/login
2. Get Clients → GET /clients
3. Get Projects → GET /projects
4. Create Invoice → POST /invoices
5. Download PDF → GET /invoices/:id/pdf
6. Send Email → POST /invoices/:id/remind
7. Update Status → PATCH /invoices/:id/status
```

### Workflow 2: Track Time & Expenses
```
1. Login → POST /auth/login
2. Create Project → POST /projects
3. Log Time → POST /timelogs
4. Record Expense → POST /expenses
5. Get Dashboard Data → GET /clients, GET /projects, GET /timelogs, GET /expenses
```

### Workflow 3: Kanban Board Management
```
1. Login → POST /auth/login
2. Get Projects → GET /projects
3. Add Task → POST /projects/:id/tasks
4. Move Task → PATCH /projects/:id/tasks/:taskId (change status)
5. Toggle Complete → PATCH /projects/:id/tasks/:taskId/toggle
6. Delete Task → DELETE /projects/:id/tasks/:taskId
```

### Workflow 4: Share Project with Client
```
1. Login → POST /auth/login
2. Get Project → GET /projects/:id
3. Generate Share Token → POST /projects/:id/share
4. Get Share Token Response → { shareToken: "abc123..." }
5. Share URL: http://yourapp.com/portal/abc123...
6. Client accesses → GET /projects/public/abc123... (no auth needed)
```

---

## ❌ ERROR HANDLING

All endpoints return:

**Success (2xx)**:
```json
{ "field": "data", "user": {...} }
```

**Validation Error (400)**:
```json
{ "message": "Name and email required" }
```

**Authentication Error (401)**:
```json
{ "message": "Not authorized" }
```

**Not Found (404)**:
```json
{ "message": "Client not found" }
```

**Server Error (500)**:
```json
{ "message": "An unexpected error occurred." }
```

---

## 🧪 TESTING QUICK COMMANDS

### Start Services
```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend
cd frontend
npm run dev

# Open browser
# http://localhost:5173
```

### Test Authentication
```bash
# Register
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","email":"test@test.com","password":"Test@123"}'

# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"Test@123"}'

# Copy token from response and use in subsequent requests
```

---

## 📞 TROUBLESHOOTING

| Issue | Solution |
|-------|----------|
| 401 Unauthorized | Check JWT token, ensure Bearer prefix, verify JWT_SECRET |
| 500 Server Error | Check backend logs, verify MongoDB connection |
| CORS Error | Verify FRONTEND_URL in backend .env |
| Rate Limit Exceeded | Wait 15 minutes or change rate limit in server.js |
| PDF Generation Failed | Ensure Puppeteer installed, try headless mode |
| Email Not Sending | Verify SMTP credentials in .env |
| Token Expired | Frontend auto-redirects to /login |

---

## 🚀 DEPLOYMENT CHECKLIST

- [ ] Set NODE_ENV=production
- [ ] Use strong JWT_SECRET
- [ ] Enable HTTPS/SSL
- [ ] Set correct CORS origin
- [ ] Configure production MongoDB URI
- [ ] Set up email credentials (SMTP)
- [ ] Enable rate limiting appropriately
- [ ] Use environment variables (not hardcoded)
- [ ] Test all endpoints with auth
- [ ] Verify password policy enforcement
- [ ] Set up error logging/monitoring
- [ ] Configure backup strategy for MongoDB

---

**Need Help?** Refer to PROJECT_ANALYSIS.md for detailed documentation.
