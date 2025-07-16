import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
dotenv.config();

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS,
  },
});

export const sendOTP = async (to, otp) => {
  const mailOptions = {
    from: process.env.MAIL_USER,
    to,
    subject: 'Your One-Time Password (OTP)',
    html: `
      <div style="font-family: 'Segoe UI', sans-serif; max-width: 500px; margin: auto; border: 1px solid #e0e0e0; border-radius: 10px; padding: 20px; background: #f9f9f9;">
        <h2 style="color: #2e7d32;">🔐 Email Verification</h2>
        <p>Hello,</p>
        <p>Your One-Time Password (OTP) is:</p>
        <div style="font-size: 24px; font-weight: bold; color: #2e7d32; letter-spacing: 4px; margin: 20px 0;">${otp}</div>
        <p>This OTP will expire in <strong>5 minutes</strong>.</p>
        <p style="color: #757575;">If you did not request this, please ignore this email.</p>
        <hr />
        <p style="font-size: 12px; color: #999;">This is an automated message. Please do not reply.</p>
      </div>
    `
  };

  return transporter.sendMail(mailOptions);
};
