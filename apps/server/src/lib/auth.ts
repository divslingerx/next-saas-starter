import { createAuth } from "@charmlabs/auth";
import { 
  resetPasswordTemplate, 
  verificationEmailTemplate, 
  invitationEmailTemplate 
} from "@charmlabs/auth/email-templates";
import { db } from "./db";
import Stripe from "stripe";

// Initialize Stripe client if configured
const stripeClient = process.env.STRIPE_SECRET_KEY 
  ? new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: "2025-06-30.basil",
    })
  : undefined;

// Define your subscription price IDs
const PRICE_IDS = {
  starter: {
    default: process.env.STRIPE_STARTER_PRICE_ID || "",
    annual: process.env.STRIPE_STARTER_ANNUAL_PRICE_ID,
  },
  professional: {
    default: process.env.STRIPE_PRO_PRICE_ID || "",
    annual: process.env.STRIPE_PRO_ANNUAL_PRICE_ID,
  },
};

/**
 * Server app's auth configuration
 * This is completely isolated from other apps in the monorepo
 */
export const auth = createAuth({
  database: db,
  appName: process.env.APP_NAME || "Server App",
  baseURL: process.env.AUTH_BASE_URL || "http://localhost:3001",
  secret: process.env.AUTH_SECRET,
  
  // Email configuration
  email: {
    from: process.env.EMAIL_FROM || "noreply@example.com",
    async sendVerificationEmail({ user, url }) {
      const template = verificationEmailTemplate({
        username: user.name || user.email,
        verifyLink: url,
        appName: process.env.APP_NAME,
      });
      
      // TODO: Integrate with your email provider (Resend, SendGrid, etc.)
      console.log("Sending verification email:", template);
      
      // Example with Resend:
      // await resend.emails.send({
      //   from: process.env.EMAIL_FROM,
      //   to: user.email,
      //   ...template,
      // });
    },
    async sendResetPassword({ user, url }) {
      const template = resetPasswordTemplate({
        username: user.name || user.email,
        resetLink: url,
        appName: process.env.APP_NAME,
      });
      
      // TODO: Integrate with your email provider
      console.log("Sending reset password email:", template);
    },
  },
  
  // OAuth providers - only configure the ones you need
  socialProviders: {
    ...(process.env.GOOGLE_CLIENT_ID && {
      google: {
        clientId: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      },
    }),
    ...(process.env.GITHUB_CLIENT_ID && {
      github: {
        clientId: process.env.GITHUB_CLIENT_ID,
        clientSecret: process.env.GITHUB_CLIENT_SECRET!,
      },
    }),
    ...(process.env.DISCORD_CLIENT_ID && {
      discord: {
        clientId: process.env.DISCORD_CLIENT_ID,
        clientSecret: process.env.DISCORD_CLIENT_SECRET!,
      },
    }),
  },
  
  // Organization support
  organization: {
    enabled: true,
    async sendInvitationEmail({ user, organization, inviter, url }) {
      const template = invitationEmailTemplate({
        inviterName: inviter.name || inviter.email,
        organizationName: organization.name,
        inviteLink: url,
        appName: process.env.APP_NAME,
      });
      
      // TODO: Integrate with your email provider
      console.log("Sending invitation email:", template);
    },
  },
  
  // Stripe integration (if configured)
  ...(stripeClient && {
    stripe: {
      client: stripeClient,
      priceIds: PRICE_IDS,
    },
  }),
  
  // Feature flags
  enableMobileSupport: false, // Set to true if you have a mobile app
  enableBearerTokens: true,
  enableTwoFactor: true,
  enablePasskeys: true,
  enableAdmin: process.env.NODE_ENV === "development",
  enableOpenAPI: process.env.NODE_ENV === "development",
  
  // Custom session data (optional)
  customSessionData: async () => {
    // Add any custom data you want in the session
    return {
      timestamp: new Date().toISOString(),
    };
  },
});

// Export auth client for use in API routes
export const authClient = auth;

// Export types for TypeScript
export type AuthSession = typeof auth.$Infer.Session;
export type AuthUser = typeof auth.$Infer.User;