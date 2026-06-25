/**
 * server.js – Portfolio Contact Form Backend
 * Stack: Node.js + Express + Nodemailer
 *
 * Setup:
 *   1. npm install express nodemailer cors dotenv express-rate-limit
 *   2. Copy .env.example to .env and fill in your credentials
 *   3. node server.js  (or: npm start)
 */

require('dotenv').config();
const express = require('express');
const nodemailer = require('nodemailer');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

/* =============================================
   MIDDLEWARE
   ============================================= */
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Allow requests from your own domain (update in production)
app.use(cors({
  origin: process.env.ALLOWED_ORIGIN || '*',
  methods: ['GET', 'POST'],
}));

// Rate limiting: max 5 contact submissions per 15 minutes per IP
const contactLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { success: false, message: 'Too many requests. Please wait 15 minutes before trying again.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Serve the static portfolio files
app.use(express.static(path.join(__dirname)));

/* =============================================
   EMAIL TRANSPORTER
   ============================================= */
let transporter;

async function initMailer() {
  if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
    transporter = nodemailer.createTransport({
      service: process.env.EMAIL_SERVICE || 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });
    console.log('✅ Custom email transporter is configured.');
  } else {
    console.log('⚠️ No custom EMAIL_USER found. Creating Ethereal Sandbox account...');
    const testAccount = await nodemailer.createTestAccount();
    transporter = nodemailer.createTransport({
      host: testAccount.smtp.host,
      port: testAccount.smtp.port,
      secure: testAccount.smtp.secure,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });
    console.log('✅ Ethereal Sandbox ready!');
    console.log(`   Sandbox user: ${testAccount.user}`);
  }
}

/* =============================================
   INPUT SANITIZER
   ============================================= */
function sanitize(str = '') {
  return String(str)
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .trim()
    .slice(0, 2000); // max length guard
}

/* =============================================
   CONTACT API ROUTE
   POST /api/contact
   ============================================= */
app.post('/api/contact', contactLimiter, async (req, res) => {
  const { name, email, phone, subject, message } = req.body;

  // --- Server-side validation ---
  const errors = [];

  if (!name || name.trim().length < 2) {
    errors.push('Name is required (min 2 characters).');
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email || !emailRegex.test(email)) {
    errors.push('A valid email address is required.');
  }

  if (!subject || subject.trim().length < 3) {
    errors.push('Subject is required.');
  }

  if (!message || message.trim().length < 10) {
    errors.push('Message must be at least 10 characters.');
  }

  if (errors.length > 0) {
    return res.status(400).json({ success: false, message: errors.join(' ') });
  }

  // --- Sanitize inputs ---
  const safeName    = sanitize(name);
  const safeEmail   = sanitize(email);
  const safePhone   = sanitize(phone || 'Not provided');
  const safeSubject = sanitize(subject);
  const safeMessage = sanitize(message);

  // --- Build email to YOU (the portfolio owner) ---
  const ownerMailOptions = {
    from: `"Portfolio Contact" <${process.env.EMAIL_USER}>`,
    to: process.env.OWNER_EMAIL || process.env.EMAIL_USER,
    replyTo: safeEmail,
    subject: `[Portfolio] ${safeSubject}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 30px;
                  background: #0f0f0f; color: #ffffff; border-radius: 12px;
                  border: 1px solid #00ffee;">
        <h2 style="color: #00ffee; margin-top: 0;">New Contact Form Submission</h2>
        <table style="width: 100%; border-collapse: collapse; font-size: 15px;">
          <tr>
            <td style="padding: 10px; color: #aaa; width: 120px;">Name</td>
            <td style="padding: 10px; color: #fff;">${safeName}</td>
          </tr>
          <tr style="background: rgba(255,255,255,0.03);">
            <td style="padding: 10px; color: #aaa;">Email</td>
            <td style="padding: 10px; color: #00ffee;">
              <a href="mailto:${safeEmail}" style="color: #00ffee;">${safeEmail}</a>
            </td>
          </tr>
          <tr>
            <td style="padding: 10px; color: #aaa;">Phone</td>
            <td style="padding: 10px; color: #fff;">${safePhone}</td>
          </tr>
          <tr style="background: rgba(255,255,255,0.03);">
            <td style="padding: 10px; color: #aaa;">Subject</td>
            <td style="padding: 10px; color: #fff;">${safeSubject}</td>
          </tr>
        </table>
        <div style="margin-top: 20px; padding: 20px; background: rgba(255,255,255,0.04);
                    border-left: 4px solid #00ffee; border-radius: 4px;">
          <p style="color: #aaa; margin: 0 0 8px;">Message:</p>
          <p style="color: #fff; line-height: 1.7; margin: 0;">${safeMessage.replace(/\n/g, '<br>')}</p>
        </div>
        <p style="color: #555; font-size: 12px; margin-top: 24px;">
          Sent from your portfolio contact form · ${new Date().toUTCString()}
        </p>
      </div>
    `,
  };

  // --- Auto-reply to the person who contacted you ---
  const autoReplyOptions = {
    from: `"Samuel Kimonge" <${process.env.EMAIL_USER}>`,
    to: safeEmail,
    subject: `Thanks for reaching out, ${safeName.split(' ')[0]}!`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 30px;
                  background: #0f0f0f; color: #ffffff; border-radius: 12px;
                  border: 1px solid #00ffee;">
        <h2 style="color: #00ffee; margin-top: 0;">Message Received! 👋</h2>
        <p style="font-size: 16px; line-height: 1.7;">Hi <strong>${safeName.split(' ')[0]}</strong>,</p>
        <p style="font-size: 15px; line-height: 1.7; color: rgba(255,255,255,0.8);">
          Thank you for getting in touch. I've received your message and will get back to you
          as soon as possible — usually within 24–48 hours.
        </p>
        <div style="margin: 24px 0; padding: 16px 20px; background: rgba(0,255,238,0.06);
                    border-radius: 8px; border-left: 4px solid #00ffee;">
          <p style="color: #aaa; font-size: 13px; margin: 0 0 6px;">Your message:</p>
          <p style="color: rgba(255,255,255,0.7); font-size: 14px; margin: 0; font-style: italic;">
            "${safeMessage.slice(0, 200)}${safeMessage.length > 200 ? '…' : ''}"
          </p>
        </div>
        <p style="font-size: 15px; line-height: 1.7; color: rgba(255,255,255,0.8);">
          In the meantime, feel free to check out my work or connect with me on social media.
        </p>
        <p style="margin-top: 28px; color: rgba(255,255,255,0.8);">
          Best regards,<br>
          <strong style="color: #00ffee;">Samuel Kimonge</strong><br>
          <span style="font-size: 13px; color: #aaa;">Software Developer</span>
        </p>
        <hr style="border: none; border-top: 1px solid rgba(255,255,255,0.1); margin: 24px 0;">
        <p style="font-size: 11px; color: #444; text-align: center;">
          This is an automated reply. Please do not reply to this email directly.
        </p>
      </div>
    `,
  };

  try {
    // Send both emails concurrently
    const info = await Promise.all([
      transporter.sendMail(ownerMailOptions),
      transporter.sendMail(autoReplyOptions),
    ]);

    console.log(`✉  Contact form submission from ${safeEmail} – "${safeSubject}"`);

    // Log the Ethereal testing URLs
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      console.log('🔍 Preview Owner Email:', nodemailer.getTestMessageUrl(info[0]));
      console.log('🔍 Preview Auto-Reply:', nodemailer.getTestMessageUrl(info[1]));
    }

    return res.status(200).json({
      success: true,
      message: 'Your message was sent successfully!',
    });
  } catch (err) {
    console.error('❌ Failed to send email:', err.message);
    return res.status(500).json({
      success: false,
      message: 'Failed to send your message. Please try again later.',
    });
  }
});

/* =============================================
   FALLBACK: SERVE index.html FOR SPA ROUTING
   ============================================= */
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

/* =============================================
   START SERVER
   ============================================= */
initMailer().then(() => {
  app.listen(PORT, () => {
    console.log(`🚀 Portfolio server running at http://localhost:${PORT}`);
  });
}).catch(console.error);
