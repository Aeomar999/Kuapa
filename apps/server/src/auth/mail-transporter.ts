import * as nodemailer from "nodemailer";

/**
 * Outbound email transport.
 *
 * Production runs on Railway, which blocks outbound SMTP (ports 25/465/587),
 * so a direct Nodemailer/SMTP connection to the mail host just times out. When
 * RESEND_API_KEY is set we send over Resend's HTTPS API (port 443) instead;
 * locally, with no key, we fall back to a pooled Nodemailer SMTP transporter.
 *
 * Both paths expose the same `sendMail({ from, to, subject, html, text })`
 * signature and resolve to `{ messageId }`, so callers and tests are unchanged.
 */

export interface SendMailOptions {
  from: string;
  to: string | string[];
  subject: string;
  html?: string;
  text?: string;
}

export interface SendMailResult {
  messageId: string;
}

const resendApiKey = process.env.RESEND_API_KEY;

/** Send via Resend's HTTPS API. Throws on a non-2xx response. */
async function sendViaResend(options: SendMailOptions): Promise<SendMailResult> {
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${resendApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: options.from,
      to: Array.isArray(options.to) ? options.to : [options.to],
      subject: options.subject,
      html: options.html,
      text: options.text,
    }),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    // Resend errors come back as { name, message }; surface the message so the
    // caller's catch logs something actionable (e.g. unverified sender domain).
    const message = data?.message || data?.name || `Resend HTTP ${response.status}`;
    throw new Error(`Resend send failed: ${message}`);
  }
  return { messageId: data?.id ?? "" };
}

// Create the SMTP transporter lazily so the Resend path never opens (and times
// out on) an SMTP socket in production.
let smtpTransporter: nodemailer.Transporter | null = null;
function getSmtpTransporter(): nodemailer.Transporter {
  if (!smtpTransporter) {
    const smtpPort = parseInt(process.env.SMTP_PORT || "465", 10);
    smtpTransporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || "smtp.gmail.com",
      port: smtpPort,
      secure: smtpPort === 465,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
      pool: true,
      maxConnections: 3,
      maxMessages: 100,
      connectionTimeout: 10_000,
      greetingTimeout: 10_000,
      socketTimeout: 20_000,
    });
  }
  return smtpTransporter;
}

async function sendViaSmtp(options: SendMailOptions): Promise<SendMailResult> {
  const info = await getSmtpTransporter().sendMail(options);
  return { messageId: info.messageId };
}

/**
 * Shared mailer. Uses Resend's HTTPS API when RESEND_API_KEY is set (required
 * on Railway, which blocks SMTP), otherwise a local SMTP transporter.
 */
export const mailTransporter = {
  sendMail(options: SendMailOptions): Promise<SendMailResult> {
    return resendApiKey ? sendViaResend(options) : sendViaSmtp(options);
  },
};

// Startup readiness log. We deliberately do NOT run a blocking SMTP verify() in
// production: on Railway that connection times out (SMTP egress is blocked),
// which is exactly the noisy "SMTP transporter verification failed" error.
if (resendApiKey) {
  console.log("Mailer: using Resend HTTPS API");
} else if (process.env.NODE_ENV !== "production") {
  getSmtpTransporter()
    .verify()
    .then(
      () => console.log("SMTP transporter verified and ready"),
      (error) => console.error("SMTP transporter verification failed:", error?.message || error)
    );
}
