import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { Resend } from 'resend';
import config from '../config/index.js';

const prisma = new PrismaClient();

type Tokens = {
  accessToken: string;
  refreshToken: string;
};

export async function generateAccessToken(payload: object) {
  // use any-cast to avoid typing mismatch with jsonwebtoken types in this repo
  return (jwt as any).sign(payload, config.jwt.accessToken.secret, {
    expiresIn: config.jwt.accessToken.expiry,
  });
}

export async function generateRefreshToken(payload: object) {
  return (jwt as any).sign(payload, config.jwt.refreshToken.secret, {
    expiresIn: config.jwt.refreshToken.expiry,
  });
}

async function saveRefreshToken(userId: string, token: string) {
  // persist refresh token
  const decoded = jwt.decode(token) as { exp?: number } | null;
  const expiresAt = decoded?.exp ? new Date(decoded.exp * 1000) : undefined;

  return prisma.refreshToken.create({
    data: {
      token,
      userId,
      expiresAt,
    },
  });
}

export async function register(data: { name: string; email: string; password: string; phone?: string; role: 'CLIENT' | 'LAWYER' | 'ADMIN'}) {
  const { name, email, password, phone, role } = data;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    throw new Error('Email already in use');
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: {
      name,
      email,
      phone: phone ?? '',
      passwordHash,
      role,
    },
  });

  const accessToken = await generateAccessToken({ sub: user.id, role: user.role });
  const refreshToken = await generateRefreshToken({ sub: user.id });

  await saveRefreshToken(user.id, refreshToken);

  return { user, accessToken, refreshToken } as { user: typeof user } & Tokens;
}

export async function login(data: { email: string; password: string }) {
  const { email, password } = data;
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !user.passwordHash) {
    throw new Error('Invalid credentials');
  }

  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) throw new Error('Invalid credentials');

  const accessToken = await generateAccessToken({ sub: user.id, role: user.role });
  const refreshToken = await generateRefreshToken({ sub: user.id });

  await saveRefreshToken(user.id, refreshToken);

  return { user, accessToken, refreshToken } as { user: typeof user } & Tokens;
}

export async function verifyRefreshToken(token: string) {
  try {
    const payload = jwt.verify(token, config.jwt.refreshToken.secret);
    const db = await prisma.refreshToken.findUnique({ where: { token } });
    if (!db || db.revoked) throw new Error('Invalid refresh token');
    if (db.expiresAt && db.expiresAt < new Date()) throw new Error('Refresh token expired');
    return payload;
  } catch (err) {
    throw err;
  }
}

export async function revokeRefreshToken(token: string) {
  // mark revoked or delete
  try {
    await prisma.refreshToken.updateMany({ where: { token }, data: { revoked: true } });
  } catch (err) {
    // ignore
  }
}

export async function refreshTokens(token: string) {
  const payload = await verifyRefreshToken(token) as any;
  const userId = payload.sub as string;
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new Error('User not found');

  // revoke old token
  await revokeRefreshToken(token);

  const accessToken = await generateAccessToken({ sub: user.id, role: user.role });
  const refreshToken = await generateRefreshToken({ sub: user.id });
  await saveRefreshToken(user.id, refreshToken);

  return { accessToken, refreshToken };
}

// OTP flow
export async function requestOtp(identifier: string) {
  const windowMs = 5 * 60 * 1000; // 5 minutes
  const since = new Date(Date.now() - windowMs);
  // rate limit: max 3 requests per identifier per window
  const recent = await prisma.otp.count({ where: { identifier, createdAt: { gte: since } } });
  if (recent >= 3) {
    throw new Error('Too many OTP requests. Try again later');
  }

  const code = String(Math.floor(100000 + Math.random() * 900000));
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

  // persist OTP
  await prisma.otp.create({ data: { identifier, code, expiresAt } });

  // send OTP via configured SMTP (from config) or log in development
  try {
    // const smtp = config.smtp as any;
    if (config.resend.apiKey) {
    //   const nodemailer = await import('nodemailer');
    //   const transporter = nodemailer.createTransport({
    //     host: config.smtp.host,
    //     port: config.smtp.port || 587,
    //     secure: !!config.smtp.secure,
    //     auth: config.smtp.user ? { user: config.smtp.user, pass: config.smtp.pass } : undefined,
    //   });
    //   console.warn(`SMTP Configured: ${transporter}`);//debug line


      const resend = new Resend(config.resend.apiKey);


      // load html template
      const fs = await import('fs');
      const path = await import('path');
      const tplPath = path.resolve(process.cwd(), 'src/utils/templates/otp.html');
      let html = '';
      try {
        html = fs.readFileSync(tplPath, { encoding: 'utf8' });
        html = html.replace('{{OTP_CODE}}', code);
      } catch (err) {
        // ignore template read errors and fallback to text
        html = '';
      }

    //   const info = await transporter.sendMail({
    //     from: config.smtp.from || 'no-reply@example.com',
    //     to: identifier,
    //     subject: 'Your OTP code',
    //     text: `Your OTP code is ${code}. It expires in 5 minutes.`,
    //     html: html || undefined,
    //   });
    //   console.warn(`OTP email sent: ${info.messageId}`);//debug line

      const info = await resend.emails.send({
        from: config.resend.from || 'no-reply@example.com',
        to: identifier,
        subject: 'Your OTP to register in LawSoft',
        html: html || `Your OTP is <strong>${code}</strong>. It expires in 5 minutes.`,
      });
      // change the sent response later it is not accurate sending false even if email is sent
      return { ok: true, sent: !!(info && (info as any).id) };
    }
  } catch (err) {
    // ignore send errors and fall through to log
    console.error('Error smtp configuration:', err);
  }

  // Fallback: log OTP for development
  // eslint-disable-next-line no-console
  console.warn(`OTP for ${identifier}: ${code} (expires ${expiresAt.toISOString()})`);
  return { ok: true };
}

export async function verifyOtp(identifier: string, code: string) {
  const now = new Date();
  // find latest otp for identifier
  const otp = await prisma.otp.findFirst({ where: { identifier, code }, orderBy: { createdAt: 'desc' } });
  if (!otp) throw new Error('Invalid OTP');
  if (otp.expiresAt < now) {
    throw new Error('OTP expired');
  }

  // find user by email
  let user = await prisma.user.findUnique({ where: { email: identifier } }).catch(() => null as any);
//   if (!user) user = await prisma.user.findUnique({ where: { email: identifier } }).catch(() => null as any);
  if (!user) throw new Error('User not found');

  // mark emailVerified if email matches
  if (user.email === identifier) {
    await prisma.user.update({ where: { id: user.id }, data: { emailVerified: true } });
  }

  // remove OTP records for identifier
  await prisma.otp.deleteMany({ where: { identifier } });

  // issue tokens
  const accessToken = await generateAccessToken({ sub: user.id, role: user.role });
  const refreshToken = await generateRefreshToken({ sub: user.id });
  await saveRefreshToken(user.id, refreshToken);

  return { user, accessToken, refreshToken };
}

export async function restorePassword(identifier: string, code: string, newPassword: string) {
  const now = new Date();
  const otp = await prisma.otp.findFirst({ where: { identifier, code }, orderBy: { createdAt: 'desc' } });
  if (!otp) throw new Error('Invalid OTP');
  if (otp.expiresAt < now) throw new Error('OTP expired');

  // find user by email or phone
  let user = await prisma.user.findUnique({ where: { email: identifier } }).catch(() => null as any);
  if (!user) {
    // try phone (if phone stored exactly)
    user = await prisma.user.findFirst({ where: { phone: identifier } }).catch(() => null as any);
  }
  if (!user) throw new Error('User not found');

  // update password
  const passwordHash = await bcrypt.hash(newPassword, 10);
  await prisma.user.update({ where: { id: user.id }, data: { passwordHash } });

  // remove used OTPs
  await prisma.otp.deleteMany({ where: { identifier } });

  return { ok: true };
}

export default {
  register,
  login,
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
  revokeRefreshToken,
  refreshTokens,
  restorePassword
};
