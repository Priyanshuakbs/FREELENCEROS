const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const path = require('path');
const http = require('http');
const { Server } = require('socket.io');
const cron = require('node-cron');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const app = express();
const server = http.createServer(app);

// ── Trust proxy (required for Render/Heroku/any reverse proxy) ───────────────
// Fixes: express-rate-limit X-Forwarded-For validation error on Render
app.set('trust proxy', 1);

const logEmailConfigDiagnostics = () => {
  const hasBrevo = !!(process.env.BREVO_API_KEY || '').trim();
  const hasSmtp  = !!(process.env.SMTP_USER || '').trim() && !!(process.env.SMTP_PASS || '').trim();

  if (hasBrevo) {
    const sender = (process.env.BREVO_SENDER_EMAIL || process.env.SMTP_USER || '?').trim();
    console.log(`📧 [EMAIL] Brevo API configured. Sender: ${sender} (production — HTTPS/443)`);
  }
  if (hasSmtp) {
    console.log(`📧 [EMAIL] Gmail SMTP configured. Sender: ${(process.env.SMTP_USER || '').trim()} (local fallback)`);
  }
  if (!hasBrevo && !hasSmtp) {
    console.warn('⚠️  [EMAIL] No provider configured — emails will use mock mode.');
  }
};

// Socket.io setup
const normalizeOrigin = (value) => (value || '').trim().replace(/\/+$/, '');
const allowedOrigins = [
  normalizeOrigin(process.env.FRONTEND_URL),
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:3000',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:5174',
  'http://localhost:4173',
].filter(Boolean);
const isLocalDevOrigin = (origin) => /^https?:\/\/(localhost|127\.0\.0\.1|\[::1\])(?::\d+)?$/.test(origin);
const isVercelOrigin = (origin) => {
  const normalizedOrigin = normalizeOrigin(origin);
  return !!normalizedOrigin && (normalizedOrigin.endsWith('.vercel.app') || allowedOrigins.includes(normalizedOrigin));
};

const io = new Server(server, {
  cors: {
    origin: function(origin, callback) {
      if (!origin || allowedOrigins.includes(origin) || isLocalDevOrigin(origin) || isVercelOrigin(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Blocked by CORS policy'));
      }
    },
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

// Attach io to app for use in controllers
app.set('io', io);

io.on('connection', (socket) => {
  console.log('🔌 Socket connected:', socket.id);

  socket.on('join-room', (userId) => {
    if (userId) {
      socket.join(userId.toString());
      console.log(`👤 User/Client ${userId} joined their room`);
    }
  });

  socket.on('join-conversation', (conversationId) => {
    if (conversationId) {
      socket.join(`conversation-${conversationId}`);
      console.log(`💬 Socket ${socket.id} joined conversation-${conversationId}`);
    }
  });

  socket.on('leave-conversation', (conversationId) => {
    if (conversationId) {
      socket.leave(`conversation-${conversationId}`);
      console.log(`💬 Socket ${socket.id} left conversation-${conversationId}`);
    }
  });

  socket.on('typing', ({ conversationId, userName }) => {
    if (conversationId) {
      socket.to(`conversation-${conversationId}`).emit('user-typing', { conversationId, userName });
    }
  });

  socket.on('stop-typing', ({ conversationId }) => {
    if (conversationId) {
      socket.to(`conversation-${conversationId}`).emit('user-stop-typing', { conversationId });
    }
  });

  socket.on('disconnect', () => {
    console.log('🔌 Socket disconnected:', socket.id);
  });
});

// Secure HTTP headers
app.use(helmet({
  crossOriginResourcePolicy: false,
}));

// Static files directory for uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Strict CORS Setup
app.use(cors({
  origin: function(origin, callback) {
    const normalizedOrigin = normalizeOrigin(origin);
    if (!origin || allowedOrigins.includes(normalizedOrigin) || isVercelOrigin(origin) || isLocalDevOrigin(normalizedOrigin)) {
      callback(null, true);
    } else {
      callback(new Error('Blocked by CORS policy'));
    }
  },
  credentials: true,
}));

// Rate limiting
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 mins
  max: 1000,
  message: { message: 'Too many requests, please try again later.' }
});
app.use('/api/', generalLimiter);

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 60,
  message: { message: 'Too many authentication attempts. Please try again after 15 minutes.' }
});
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);

// Request body parser
app.use(express.json());

// NoSQL injection prevention
app.use(mongoSanitize());

// Routes
// app.use('/api/leads', require('./routes/leads'))
app.use('/api/leads', require('./routes/leadRoutes'));
app.use('/api/clients', require('./routes/clients'));
app.use('/api/projects', require('./routes/projects'));
app.use('/api/projects', require('./routes/prd'));
app.use('/api/dashboard', require('./routes/dashboard'));
app.use('/api/timelogs', require('./routes/timeLogs'));
app.use('/api/invoices', require('./routes/invoices'));
app.use('/api/expenses', require('./routes/expenses'));
app.use('/api/contracts', require('./routes/contracts'));
app.use('/api/conversations', require('./routes/conversations'));
app.use('/api/freelancers', require('./routes/freelancers'));
app.use('/api/chatbot', require('./routes/chatbot'));
app.use('/api/ai', require('./routes/ai'));
app.use('/api/auth', require('./routes/auth'));
app.use('/api/onboarding', require('./routes/onboarding'));

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});



app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// Production-ready global error handling
app.use((err, req, res, next) => {
  console.error('Error:', err.message);
  const status = err.status || 500;
  const message = process.env.NODE_ENV === 'production'
    ? 'An unexpected error occurred.'
    : err.message;
  res.status(status).json({ message });
});

mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('✅ MongoDB connected');
    logEmailConfigDiagnostics();

    // ─────────────────────────────────────────
    // Recurring Invoice Cron Job — runs daily at midnight
    // ─────────────────────────────────────────
    cron.schedule('0 0 * * *', async () => {
      try {
        const Invoice = require('./models/Invoice');
        const now = new Date();
        const due = await Invoice.find({
          isRecurring: true,
          nextInvoiceDate: { $lte: now },
        });

        for (const inv of due) {
          const generateInvoiceNumber = () => {
            const date = new Date();
            return `INV-${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}-${Math.floor(Math.random() * 9000) + 1000}`;
          };

          // Duplicate the invoice
          const newInv = new Invoice({
            invoiceNumber: generateInvoiceNumber(),
            client: inv.client,
            project: inv.project,
            freelancer: inv.freelancer,
            items: inv.items,
            subtotal: inv.subtotal,
            tax: inv.tax,
            total: inv.total,
            notes: inv.notes,
            status: 'draft',
            isRecurring: true,
            recurringCycle: inv.recurringCycle,
          });

          // Set next recurrence
          const next = new Date();
          if (inv.recurringCycle === 'weekly') next.setDate(next.getDate() + 7);
          else if (inv.recurringCycle === 'quarterly') next.setMonth(next.getMonth() + 3);
          else next.setMonth(next.getMonth() + 1);

          newInv.nextInvoiceDate = next;
          await newInv.save();

          // Update the original invoice's next date
          await Invoice.findByIdAndUpdate(inv._id, { nextInvoiceDate: next });

          console.log(`🔁 Auto-generated recurring invoice: ${newInv.invoiceNumber}`);
        }
      } catch (err) {
        console.error('❌ Recurring invoice cron error:', err.message);
      }
    });

    // ─────────────────────────────────────────
    // Overdue Invoice Check — runs daily at 9am
    // ─────────────────────────────────────────
    cron.schedule('0 9 * * *', async () => {
      try {
        const Invoice = require('./models/Invoice');
        const now = new Date();
        const updated = await Invoice.updateMany(
          { status: 'sent', dueDate: { $lt: now } },
          { $set: { status: 'overdue' } }
        );
        if (updated.modifiedCount > 0) {
          console.log(`⚠️  Marked ${updated.modifiedCount} invoices as overdue`);
        }
      } catch (err) {
        console.error('❌ Overdue cron error:', err.message);
      }
    });

    console.log('⏰ Cron jobs scheduled (recurring invoices & overdue checks)');
  })
  .catch((err) => console.error('❌ MongoDB error:', err));

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
