const express = require("express");
const cors = require("cors");
const nodemailer = require("nodemailer");
require("dotenv").config();

const app = express();

app.use(cors());
app.use(express.json());

const PORT = Number(process.env.PORT || 5000);
const GMAIL_USER = process.env.GMAIL_USER || process.env.SMTP_USER;
const GMAIL_APP_PASSWORD = process.env.GMAIL_APP_PASSWORD || process.env.SMTP_PASS;
const OWNER_EMAIL = process.env.OWNER_EMAIL || GMAIL_USER;

function isValidEmail(value) {
  return /^\S+@\S+\.\S+$/.test(String(value || "").trim());
}

if (!GMAIL_USER || !GMAIL_APP_PASSWORD || !OWNER_EMAIL) {
  console.warn(
    "Missing env vars. Set GMAIL_USER, GMAIL_APP_PASSWORD, OWNER_EMAIL in Backend/.env"
  );
}

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: GMAIL_USER,
    pass: GMAIL_APP_PASSWORD,
  },
  // Fail fast so the API does not hang when SMTP is slow/unreachable.
  connectionTimeout: 10000,
  greetingTimeout: 10000,
  socketTimeout: 15000,
});

const corsOptions = {
  origin: true,
  methods: ["GET", "POST", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
};

app.use(cors(corsOptions));
app.options(/.*/, cors(corsOptions));

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, service: "mail-api" });
});

app.post("/api/contact", async (req, res) => {
  try {
    const name = String(req.body?.name || "").trim().replace(/\s+/g, " ");
    const email = String(req.body?.email || "").trim().toLowerCase();
    const phone = String(req.body?.phone || "").trim().replace(/\D/g, "");
    const message = String(req.body?.message || "").trim();

    if (!/^[A-Za-z ]{2,50}$/.test(name)) {
      return res.status(400).json({ ok: false, error: "Name must contain only letters and spaces" });
    }
    if (!/^[a-zA-Z0-9._%+-]+@gmail\.com$/.test(email)) {
      return res.status(400).json({ ok: false, error: "Email must be a valid @gmail.com address" });
    }
    if (!/^[0-9]{10}$/.test(phone)) {
      return res.status(400).json({ ok: false, error: "Mobile number must be exactly 10 digits" });
    }
    if (message.length < 10) {
      return res.status(400).json({ ok: false, error: "Message too short" });
    }

    await transporter.sendMail({
      from: `"Thanjai Tech Studio Contact" <${GMAIL_USER}>`,
      to: OWNER_EMAIL,
      replyTo: email,
      subject: `New Website Enquiry from ${name}`,
      text: `Name: ${name}\nEmail: ${email}\nMobile: ${phone}\n\nMessage:\n${message}`,
      html: `
        <div style="margin:0;padding:24px;background:#f1f5f9;font-family:Arial,sans-serif;color:#0f172a;">
          <div style="max-width:620px;margin:0 auto;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e2e8f0;">
            <div style="padding:18px 22px;background:linear-gradient(135deg,#22d3ee 0%,#3b82f6 100%);color:#ffffff;">
              <h2 style="margin:0;font-size:22px;line-height:1.3;">New Contact Form Submission</h2>
              <p style="margin:6px 0 0;font-size:13px;opacity:0.95;">Thanjai Tech Studio Website Enquiry</p>
            </div>

            <div style="padding:20px 22px;">
              <div style="margin-bottom:12px;padding:12px 14px;border-radius:10px;background:#f8fafc;border:1px solid #e2e8f0;">
                <span style="display:block;font-size:12px;font-weight:700;color:#64748b;letter-spacing:.3px;text-transform:uppercase;">Name</span>
                <span style="display:block;margin-top:4px;font-size:16px;font-weight:700;color:#0f172a;">${name}</span>
              </div>

              <div style="margin-bottom:12px;padding:12px 14px;border-radius:10px;background:#f8fafc;border:1px solid #e2e8f0;">
                <span style="display:block;font-size:12px;font-weight:700;color:#64748b;letter-spacing:.3px;text-transform:uppercase;">Email</span>
                <span style="display:block;margin-top:4px;font-size:15px;font-weight:700;color:#1d4ed8;">${email}</span>
              </div>

              <div style="margin-bottom:12px;padding:12px 14px;border-radius:10px;background:#f8fafc;border:1px solid #e2e8f0;">
                <span style="display:block;font-size:12px;font-weight:700;color:#64748b;letter-spacing:.3px;text-transform:uppercase;">Mobile</span>
                <span style="display:block;margin-top:4px;font-size:16px;font-weight:700;color:#0f172a;">${phone}</span>
              </div>

              <div style="padding:14px;border-radius:10px;background:linear-gradient(180deg,#f8fafc 0%,#eef2ff 100%);border:1px solid #dbeafe;">
                <span style="display:block;font-size:12px;font-weight:700;color:#6366f1;letter-spacing:.3px;text-transform:uppercase;">Message</span>
                <p style="margin:8px 0 0;font-size:15px;line-height:1.6;color:#0f172a;">${message.replace(/\n/g, "<br />")}</p>
              </div>
            </div>

            <div style="padding:12px 22px;background:#f8fafc;border-top:1px solid #e2e8f0;">
              <p style="margin:0;font-size:12px;color:#64748b;">Auto-generated by Thanjai Tech Studio contact form.</p>
            </div>
          </div>
        </div>
      `,
    });

    return res.status(200).json({ ok: true, message: "Email sent" });
  } catch (error) {
    console.error("Mail error:", error);
    const timeoutCodes = new Set(["ETIMEDOUT", "ESOCKET", "ECONNECTION"]);
    if (timeoutCodes.has(error?.code)) {
      return res.status(504).json({ ok: false, error: "Mail server timeout. Please try again." });
    }
    return res.status(500).json({ ok: false, error: "Failed to send email" });
  }
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Mail server running on http://localhost:${PORT}`);
  });
}

module.exports = app;

