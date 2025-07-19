import type { BetterAuthOptions } from "better-auth";
import { expo } from "@better-auth/expo";
import { stripe } from "@better-auth/stripe";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import {
  admin,
  bearer,
  customSession,
  multiSession,
  oAuthProxy,
  oneTap,
  openAPI,
  organization,
  twoFactor,
} from "better-auth/plugins";
import { passkey } from "better-auth/plugins/passkey";
import { Stripe } from "stripe";

import { db } from "@charmlabs/db/client";

import { reactInvitationEmail } from "./email/invitation";
import { resend } from "./email/resend";
import { reactResetPasswordEmail } from "./email/reset-password";

const PROFESSION_PRICE_ID = {
  default: "price_1QxWZ5LUjnrYIrml5Dnwnl0X",
  annual: "price_1QxWZTLUjnrYIrmlyJYpwyhz",
};
const STARTER_PRICE_ID = {
  default: "price_1QxWWtLUjnrYIrmleljPKszG",
  annual: "price_1QxWYqLUjnrYIrmlonqPThVF",
};

const from = process.env.BETTER_AUTH_EMAIL ?? "delivered@resend.dev";
const to = process.env.TEST_EMAIL ?? "";

export function initAuth(options: {
  baseUrl: string;
  productionUrl: string;
  secret: string | undefined;

  discordClientId: string;
  discordClientSecret: string;
}) {
  const config = {
    appName: "Next Admin App",
    database: drizzleAdapter(db, {
      provider: "pg",
    }),
    baseURL: options.baseUrl,
    secret: options.secret,
    emailVerification: {
      async sendVerificationEmail({ user, url }) {
        const res = await resend.emails.send({
          from,
          to: to || user.email,
          subject: "Verify your email address",
          html: `<a href="${url}">Verify your email address</a>`,
        });
        console.log(res, user.email);
      },
    },
    account: {
      accountLinking: {
        trustedProviders: ["google", "github", "demo-app"],
      },
    },
    emailAndPassword: {
      enabled: true,
      async sendResetPassword({ user, url }) {
        await resend.emails.send({
          from,
          to: user.email,
          subject: "Reset your password",
          react: reactResetPasswordEmail({
            username: user.email,
            resetLink: url,
          }),
        });
      },
    },
    plugins: [
      organization({
        async sendInvitationEmail(data) {
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
                  ? `http://localhost:3000/accept-invitation/${data.id}`
                  : `${
                      process.env.BETTER_AUTH_URL ||
                      "https://demo.better-auth.com"
                    }/accept-invitation/${data.id}`,
            }),
          });
        },
      }),
      twoFactor({
        otpOptions: {
          async sendOTP({ user, otp }) {
            await resend.emails.send({
              from,
              to: user.email,
              subject: "Your OTP",
              html: `Your OTP is ${otp}`,
            });
          },
        },
      }),
      passkey(),
      openAPI(),
      bearer(),
      admin({
        adminUserIds: ["EXD5zjob2SD6CBWcEQ6OpLRHcyoUbnaB"],
      }),
      multiSession(),
      oAuthProxy({
        /**
         * Auto-inference blocked by https://github.com/better-auth/better-auth/pull/2891
         */
        currentURL: options.baseUrl,
        productionURL: options.productionUrl,
      }),
      expo(),

      oneTap(),
      customSession(async (session) => {
        return {
          ...session,
          user: {
            ...session.user,
            dd: "test",
          },
        };
      }),
      stripe({
        stripeClient: new Stripe(process.env.STRIPE_KEY || "sk_test_"),
        stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET!,
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
              priceId: PROFESSION_PRICE_ID.default,
              annualDiscountPriceId: PROFESSION_PRICE_ID.annual,
            },
            {
              name: "Enterprise",
            },
          ],
        },
      }),
      nextCookies(), // Make sure nextCookies is always last.
    ],
    socialProviders: {
      facebook: {
        clientId: process.env.FACEBOOK_CLIENT_ID ?? "",
        clientSecret: process.env.FACEBOOK_CLIENT_SECRET ?? "",
      },
      github: {
        clientId: process.env.GITHUB_CLIENT_ID ?? "",
        clientSecret: process.env.GITHUB_CLIENT_SECRET ?? "",
      },
      google: {
        clientId: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ?? "",
        clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
      },
      discord: {
        clientId: process.env.DISCORD_CLIENT_ID ?? "",
        clientSecret: process.env.DISCORD_CLIENT_SECRET ?? "",
      },
      microsoft: {
        clientId: process.env.MICROSOFT_CLIENT_ID ?? "",
        clientSecret: process.env.MICROSOFT_CLIENT_SECRET ?? "",
      },
      twitch: {
        clientId: process.env.TWITCH_CLIENT_ID ?? "",
        clientSecret: process.env.TWITCH_CLIENT_SECRET ?? "",
      },
      twitter: {
        clientId: process.env.TWITTER_CLIENT_ID ?? "",
        clientSecret: process.env.TWITTER_CLIENT_SECRET ?? "",
      },
    },
    trustedOrigins: ["expo://"],
  } satisfies BetterAuthOptions;

  return betterAuth(config);
}

export const auth = initAuth({})

export type Auth = ReturnType<typeof initAuth>;
export type Session = Auth["$Infer"]["Session"];
