import * as dotenv from "dotenv";
import * as path from "path";
dotenv.config({ path: path.resolve(__dirname, "../../.env") });
const isDev = process.env.NODE_ENV !== "production";
if (isDev) console.log("BETTER_AUTH_URL:", process.env.BETTER_AUTH_URL);
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { phoneNumber } from "better-auth/plugins";
import type { PrismaClient } from "@prisma/client";
import { dash, sentinel } from "@better-auth/infra";
import * as crypto from "crypto";
import { mailTransporter } from "./mail-transporter";
import { sendOtpDualChannel } from "./otp-notification.service";
import { buildEmailVerifyHtml } from "./templates/email-verify.template";

export function createAuth(prisma: PrismaClient) {
  return betterAuth({
    database: prismaAdapter(prisma, {
      provider: "postgresql",
    }),
    baseURL: process.env.BETTER_AUTH_URL + "/api/v1/auth",
    plugins: [
      dash({
        ...(process.env.BETTER_AUTH_API_URL ? { apiUrl: process.env.BETTER_AUTH_API_URL } : {}),
        ...(process.env.BETTER_AUTH_KV_URL ? { kvUrl: process.env.BETTER_AUTH_KV_URL } : {}),
        apiKey: process.env.BETTER_AUTH_API_KEY!,
      }),
      sentinel({
        ...(process.env.BETTER_AUTH_API_URL ? { apiUrl: process.env.BETTER_AUTH_API_URL } : {}),
        ...(process.env.BETTER_AUTH_KV_URL ? { kvUrl: process.env.BETTER_AUTH_KV_URL } : {}),
        apiKey: process.env.BETTER_AUTH_API_KEY!,
        security: {
          credentialStuffing: {
            enabled: true,
            thresholds: { challenge: 3, block: 5 },
          },
        },
      }),
      phoneNumber({
        sendOTP: async ({ phoneNumber, code }) => {
          let user = await prisma.user.findUnique({
            where: { phoneNumber },
            select: { email: true, name: true },
          });

          if (!user) {
            const cleanPhone = phoneNumber.replace(/[^0-9]/g, "");
            const suffix =
              cleanPhone.length >= 9
                ? cleanPhone.slice(-9)
                : cleanPhone.length >= 7
                  ? cleanPhone.slice(-7)
                  : cleanPhone;
            user = await prisma.user.findFirst({
              where: {
                phoneNumber: {
                  endsWith: suffix,
                },
              },
              orderBy: { createdAt: "desc" },
              select: { email: true, name: true },
            });
          }

          if (!user) {
            user = await prisma.user.findFirst({
              where: {
                createdAt: {
                  gte: new Date(Date.now() - 60 * 60 * 1000),
                },
              },
              orderBy: { createdAt: "desc" },
              select: { email: true, name: true },
            });
          }

          const result = await sendOtpDualChannel({
            phoneNumber,
            code,
            email: user?.email,
            userName: user?.name,
          });

          if (!result.emailSuccess && !result.smsSuccess) {
            throw new Error("Failed to send verification code to email.");
          }
        },
      }),
    ],
    emailAndPassword: {
      enabled: true,
      autoSignIn: true,
      requireEmailVerification: true,
    },
    emailVerification: {
      sendOnSignUp: true,
      sendVerificationEmail: async ({ user, url, token }, request) => {
        const webUrl = `${process.env.WEB_URL || "https://kuapa-admin.vercel.app"}/verify-email?token=${token}`;
        const appUrl = `kuapa://verify-email?token=${token}`;

        const emailOtpCode = Math.floor(100000 + Math.random() * 900000).toString();
        const cuid = crypto.randomUUID();

        await prisma.verification.create({
          data: {
            id: cuid,
            identifier: `email-otp:${user.email}`,
            value: emailOtpCode,
            expiresAt: new Date(Date.now() + 5 * 60 * 1000),
          },
        });

        if (isDev) {
          console.log(
            `\n\n=== EMAIL VERIFICATION ===\nTo: ${user.email}\nWeb: ${webUrl}\nApp: ${appUrl}\nOTP: ${emailOtpCode}\n==========================\n\n`
          );
        }

        const html = buildEmailVerifyHtml({
          userName: user.name,
          verifyUrl: webUrl,
          otpCode: emailOtpCode,
          token,
        });

        try {
          const info = await mailTransporter.sendMail({
            from: process.env.EMAIL_FROM || "Kuapa AgriMarket <onboarding@kuapa.com>",
            to: user.email,
            subject: "Verify your Kuapa AgriMarket Email",
            html,
          });
          console.log("Email sent successfully via Nodemailer:", info.messageId);
        } catch (error) {
          console.error("Failed to send email via Nodemailer:", error);
        }
      },
    },
    session: {
      expiresIn: 7 * 24 * 60 * 60,
    },
    account: {
      accountLinking: {
        enabled: true,
        trustedProviders: ["google"],
      },
    },
    socialProviders: {
      google: {
        clientId: process.env.GOOGLE_CLIENT_ID || "",
        clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
      },
    },
    trustedOrigins: [
      "kuapa://",
      "com.kuapa.agrimarket://",
      "bexiemart://",
      "com.bexiemart.app://",
      "exp://",
      "http://localhost:3000",
      "http://localhost:3001",
      "http://localhost:8081",
      "https://kuapa-admin.vercel.app",
      "https://admin.kuapa.com",
      "https://kuapa.com",
    ],
  });
}
