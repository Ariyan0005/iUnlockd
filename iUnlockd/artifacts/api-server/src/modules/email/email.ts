import { logger } from "../../lib/logger";

export interface SmtpConfig {
  host: string;
  port: number;
  user: string;
  pass: string;
  from: string;
  secure: boolean;
}

function getSmtpConfig(): SmtpConfig | null {
  const host = process.env["SMTP_HOST"];
  const user = process.env["SMTP_USER"];
  const pass = process.env["SMTP_PASS"];
  if (!host || !user || !pass) return null;

  const port = Number(process.env["SMTP_PORT"] ?? 587);
  const secure = port === 465;
  const from = process.env["SMTP_FROM"] ?? user;

  return { host, port, user, pass, from, secure };
}

async function createTransporter() {
  const config = getSmtpConfig();
  if (!config) return null;

  const nodemailer = await import("nodemailer");
  return nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth: { user: config.user, pass: config.pass },
    tls: {
      rejectUnauthorized: false,
    },
  });
}

function emailWrapper(body: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f4f4f4;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f4;padding:32px 16px">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08)">
        <tr>
          <td style="background:#111111;padding:24px 32px;text-align:center">
            <div style="color:#ffffff;font-size:22px;font-weight:700;letter-spacing:-0.5px">iUnlockd</div>
            <div style="color:#888888;font-size:12px;margin-top:2px">Professional Unlock Services</div>
          </td>
        </tr>
        <tr>
          <td style="padding:32px">
            ${body}
          </td>
        </tr>
        <tr>
          <td style="background:#f9f9f9;padding:20px 32px;text-align:center;border-top:1px solid #eeeeee">
            <p style="margin:0;color:#999999;font-size:12px">© ${new Date().getFullYear()} iUnlockd. All rights reserved.</p>
            <p style="margin:6px 0 0;color:#bbbbbb;font-size:11px">If you didn't request this email, you can safely ignore it.</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

export async function sendVerificationEmail(email: string, name: string, otp: string): Promise<boolean> {
  const transporter = await createTransporter();
  if (!transporter) {
    logger.warn({ email, otp }, "SMTP not configured — OTP logged for dev. Set SMTP_HOST, SMTP_USER, SMTP_PASS, SMTP_PORT, SMTP_FROM in environment.");
    return false;
  }
  const config = getSmtpConfig()!;
  try {
    await transporter.sendMail({
      from: `"iUnlockd" <${config.from}>`,
      to: email,
      subject: "Verify your iUnlockd account",
      html: emailWrapper(`
        <h2 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#111111">Hello, ${name}!</h2>
        <p style="margin:0 0 24px;color:#555555;font-size:15px;line-height:1.6">
          Thanks for registering. Enter the verification code below to activate your iUnlockd account.
        </p>
        <div style="background:#111111;border-radius:12px;padding:28px 16px;text-align:center;margin-bottom:24px">
          <p style="margin:0 0 8px;color:#888888;font-size:12px;letter-spacing:1px;text-transform:uppercase">Your Verification Code</p>
          <p style="margin:0;font-size:42px;font-weight:800;letter-spacing:12px;color:#ffffff;font-family:monospace">${otp}</p>
        </div>
        <p style="margin:0;color:#888888;font-size:13px;line-height:1.5">
          This code expires in <strong>10 minutes</strong>. Check your spam folder if you don't see it.
        </p>
      `),
    });
    logger.info({ email }, "Verification email sent");
    return true;
  } catch (err) {
    logger.error({ err, email }, "Failed to send verification email — check SMTP credentials");
    return false;
  }
}

export async function sendPasswordResetEmail(email: string, name: string, otp: string): Promise<boolean> {
  const transporter = await createTransporter();
  if (!transporter) {
    logger.warn({ email, otp }, "SMTP not configured — password reset OTP logged for dev.");
    return false;
  }
  const config = getSmtpConfig()!;
  try {
    await transporter.sendMail({
      from: `"iUnlockd" <${config.from}>`,
      to: email,
      subject: "Reset your iUnlockd password",
      html: emailWrapper(`
        <h2 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#111111">Password Reset</h2>
        <p style="margin:0 0 24px;color:#555555;font-size:15px;line-height:1.6">
          Hi ${name}, we received a request to reset your password. Use the code below to continue.
        </p>
        <div style="background:#111111;border-radius:12px;padding:28px 16px;text-align:center;margin-bottom:24px">
          <p style="margin:0 0 8px;color:#888888;font-size:12px;letter-spacing:1px;text-transform:uppercase">Password Reset Code</p>
          <p style="margin:0;font-size:42px;font-weight:800;letter-spacing:12px;color:#ffffff;font-family:monospace">${otp}</p>
        </div>
        <p style="margin:0;color:#888888;font-size:13px;line-height:1.5">
          This code expires in <strong>10 minutes</strong>. If you didn't request a reset, ignore this email — your account is safe.
        </p>
      `),
    });
    logger.info({ email }, "Password reset email sent");
    return true;
  } catch (err) {
    logger.error({ err, email }, "Failed to send password reset email — check SMTP credentials");
    return false;
  }
}
