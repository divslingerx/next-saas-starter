import { stripe } from "@better-auth/stripe";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import {
  admin,
  bearer,
  customSession,
  multiSession,
  oAuthProxy,
  oneTap,
  openAPI,
  organization,
  passkey,
  twoFactor,
} from "better-auth/plugins";
import { Resend } from "resend";
import Stripe from "stripe";

import { db } from "./db";
import { reactInvitationEmail } from "./email/invitation";
import { reactResetPasswordEmail } from "./email/reset-password";
import { reactVerificationEmail } from "./email/verification";

// Initialize Resend for email sending
const resend = new Resend(process.env.RESEND_API_KEY || "");

// Email configuration
const from = process.env.BETTER_AUTH_EMAIL || "delivered@resend.dev";
const to = process.env.TEST_EMAIL || ""; // For testing purposes

// Initialize Stripe client if configured
const stripeClient = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: process.env.STRIPE_CLIENT_API_VERSION,
    })
  : undefined;

// Define your subscription price IDs
const STARTER_PRICE_ID = {
  default: process.env.STRIPE_STARTER_PRICE_ID_DEFAULT,
  annual: STRIPE_STARTER_PRICE_ID_ANNUAL,
};

const PROFESSIONAL_PRICE_ID = {
  default: STRIPE_PROFESSIONAL_PRICE_ID_DEFAULT,
  annual: STRIPE_PROFESSIONAL_PRICE_ID_ANNUAL,
};

/**
 * Server app's auth configuration
 * Complete auth setup with all features from core auth
 */
export const auth = betterAuth({
  appName: process.env.APP_NAME || "Server App",
  database: drizzleAdapter(db, {
    provider: "pg",
  }),

  // Email verification configuration
  emailVerification: {
    async sendVerificationEmail({ user, url }) {
      try {
        const res = await resend.emails.send({
          from,
          to: to || user.email, // Use test email if provided, otherwise user's email
          subject: "Verify your email address",
          react: reactVerificationEmail({
            username: user.name || user.email,
            verifyLink: url,
          }),
        });
        console.log("Verification email sent:", res, user.email);
      } catch (error) {
        console.error("Failed to send verification email:", error);
      }
    },
  },

  // Account linking configuration
  account: {
    accountLinking: {
      trustedProviders: ["google"], // Only Google for now
    },
  },

  // Email and password authentication
  emailAndPassword: {
    enabled: true,
    async sendResetPassword({ user, url }) {
      try {
        await resend.emails.send({
          from,
          to: to || user.email,
          subject: "Reset your password",
          react: reactResetPasswordEmail({
            username: user.name || user.email,
            resetLink: url,
          }),
        });
        console.log("Reset password email sent to:", user.email);
      } catch (error) {
        console.error("Failed to send reset password email:", error);
      }
    },
  },

  // Social providers - Only Google for now
  socialProviders: {
    google: {
      clientId:
        process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ||
        process.env.GOOGLE_CLIENT_ID ||
        "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    },
  },

  // Plugins configuration
  plugins: [
    // Organization support with invitation emails
    organization({
      async sendInvitationEmail(data) {
        try {
          await resend.emails.send({
            from,
            to: data.email,
            subject: "You've been invited to join an organization",
            react: reactInvitationEmail({
              username: data.email,
              invitedByUsername: data.inviter.user.name,
              invitedByEmail: data.inviter.user.email,
              teamName: data.organization.name,
              inviteLink:
                process.env.NODE_ENV === "development"
                  ? `http://localhost:4000/accept-invitation/${data.id}`
                  : `${process.env.BETTER_AUTH_URL || "https://api.example.com"}/accept-invitation/${data.id}`,
            }),
          });
          console.log("Invitation email sent to:", data.email);
        } catch (error) {
          console.error("Failed to send invitation email:", error);
        }
      },
    }),

    // Two-factor authentication
    twoFactor({
      otpOptions: {
        async sendOTP({ user, otp }) {
          try {
            await resend.emails.send({
              from,
              to: to || user.email,
              subject: "Your verification code",
              html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                  <h2>Your verification code</h2>
                  <p>Hi ${user.name || user.email},</p>
                  <p>Your verification code is:</p>
                  <div style="background-color: #f0f0f0; padding: 20px; text-align: center; font-size: 24px; font-weight: bold; letter-spacing: 2px;">
                    ${otp}
                  </div>
                  <p>This code will expire in 10 minutes.</p>
                  <p>If you didn't request this code, please ignore this email.</p>
                </div>
              `,
            });
            console.log("OTP sent to:", user.email);
          } catch (error) {
            console.error("Failed to send OTP:", error);
          }
        },
      },
    }),

    // Passkey support
    passkey(),

    // OpenAPI documentation (development only)
    ...(process.env.NODE_ENV === "development" ? [openAPI()] : []),

    // Bearer token support for API access
    bearer(),

    // Admin plugin (development only)
    ...(process.env.NODE_ENV === "development"
      ? [
          admin({
            adminUserIds: process.env.ADMIN_USER_IDS?.split(",") || [],
          }),
        ]
      : []),

    // Multi-session support
    multiSession(),

    // OAuth proxy for handling OAuth in development
    ...(process.env.NODE_ENV === "development"
      ? [
          oAuthProxy({
            currentURL: process.env.AUTH_BASE_URL || "http://localhost:4000",
          }),
        ]
      : []),

    // Google One Tap sign-in
    oneTap(),

    // Custom session data
    customSession(async (session) => {
      return {
        ...session,
        user: {
          ...session.user,
          // Add any custom user data here
          serverApp: true,
        },
      };
    }),

    // Stripe integration (if configured)
    ...(stripeClient && process.env.STRIPE_WEBHOOK_SECRET
      ? [
          stripe({
            stripeClient: stripeClient,
            stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
            subscription: {
              enabled: true,
              plans: [
                {
                  name: "Starter",
                  priceId: STARTER_PRICE_ID.default,
                  annualDiscountPriceId: STARTER_PRICE_ID.annual,
                  freeTrial: {
                    days: 7,
                  },
                },
                {
                  name: "Professional",
                  priceId: PROFESSIONAL_PRICE_ID.default,
                  annualDiscountPriceId: PROFESSIONAL_PRICE_ID.annual,
                },
                {
                  name: "Enterprise",
                  // Custom pricing, no fixed price ID
                },
              ],
            },
          }),
        ]
      : []),
  ],

  // Trusted origins for CORS
  trustedOrigins: [
    "http://localhost:3000", // Next.js app
    "http://localhost:4000", // Server app
    "http://localhost:5173", // Vite app (if any)
    ...(process.env.TRUSTED_ORIGINS?.split(",") || []),
  ],
});

// Export auth client for use in API routes
export const authClient = auth;

// Export types for TypeScript
export type Session = typeof auth.$Infer.Session;
export type User = typeof auth.$Infer.User;
