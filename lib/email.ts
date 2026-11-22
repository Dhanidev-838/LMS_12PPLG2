import nodemailer from "nodemailer";

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  })[character] ?? character);
}

export async function sendOtpEmail(toEmail: string, nama: string, otp: string): Promise<void> {
  const user = process.env.GMAIL_USER?.trim();
  const password = process.env.GMAIL_APP_PASSWORD?.replace(/\s/g, "");
  if (!user || !password) {
    throw new Error("GMAIL_USER and GMAIL_APP_PASSWORD must be configured to send OTP emails.");
  }

  const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: { user, pass: password },
  });

  try {
    await transporter.sendMail({
      from: { name: "Classify", address: user },
      to: toEmail,
      subject: "Kode OTP Reset Password Classify",
      html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
        <h2 style="color: #6B85F6;">Classify</h2>
        <p>Halo <strong>${escapeHtml(nama)}</strong>,</p>
        <p>Berikut kode OTP untuk mengubah password akun Classify anda:</p>
        <div style="background: #F9FAFB; border-radius: 12px; padding: 24px; text-align: center; margin: 16px 0;">
          <span style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #111827;">${otp}</span>
        </div>
        <p style="color: #6B7280; font-size: 13px;">
          Kode ini berlaku selama <strong>10 menit</strong>. Jangan bagikan kode ini kepada siapa pun.
          Jika anda tidak meminta perubahan password, abaikan email ini.
        </p>
      </div>
    `,
    });
  } catch (error) {
    console.error("Gagal kirim email OTP via Gmail SMTP:", error);
    throw new Error("Gagal mengirim email OTP.");
  }
}