import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "../db/index";
import { emailHarmony } from "better-auth-harmony";
import { organization, admin, multiSession } from "better-auth/plugins";
// import { stripe } from "@better-auth/stripe";
// import { stripePlans } from "../modules/subscriptions/config/stripe-plans";
// import Stripe from "stripe";
import {
  sendChangeEmailVerification,
  sendResetPasswordEmail,
  sendVerificationEmail,
} from "../core/email/email";
import { config } from "../core/config";

// const stripeConfig = config.get("stripe");
// const stripeClient = new Stripe(stripeConfig.secretKey);
// const stripeWebhookSecret = stripeConfig.webhookSecret;

const authConfig = config.get("auth");
const appConfig = config.get("app");

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
  }),
  user: {
    additionalFields: {
      role: {
        type: "string",
        defaultValue: "user",
        returned: true,
        sortable: true,
        required: true,
      },
    },

    changeEmail: {
      enabled: true,
      sendChangeEmailVerification: async ({ newEmail, url }, _request) => {
        const { error } = await sendChangeEmailVerification({
          email: newEmail,
          verificationUrl: url,
        });

        if (error)
          return console.log("sendChangeEmailVerification Error: ", error);
      },
    },
  },
  rateLimit: {
    window: 60, // time window in seconds
    max: 5, // max requests in the window
  },
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true, // if true, users must verify their email before signing in

    autoSignIn: true,
    minPasswordLength: 8,
    sendResetPassword: async ({ user, url }) => {
      const { error } = await sendResetPasswordEmail({
        email: user.email,
        verificationUrl: url,
      });

      if (error) return console.log("sendResetPasswordEmail Error: ", error);
    },
  },
  emailVerification: {
    sendOnSignUp: true,
    expiresIn: 60 * 60 * 1, // 1 HOUR
    autoSignInAfterVerification: true,
    sendVerificationEmail: async ({ user, token }) => {
      const invitations = await db.query.invitation
        .findMany({
          where: (invitation, { eq }) => eq(invitation.email, user.email),
        })
        .then((invitations) => {
          if (invitations.length > 0) {
            return invitations[0];
          }
        });

      let REDIRECT_URL = authConfig.emailVerificationCallbackUrl || "/";

      //check if the user has any existing invitations.
      if (invitations) {
        REDIRECT_URL = "/org/my-orgs";
      }
      const verificationUrl = `${authConfig.baseUrl}/api/auth/verify-email?token=${token}&callbackURL=${REDIRECT_URL}`;
      const { error } = await sendVerificationEmail({
        email: user.email,
        verificationUrl: verificationUrl,
      });

      if (error) return console.log("sendVerificationEmail Error: ", error);
    },
  },
  socialProviders: {
    google: authConfig.google
      ? {
          clientId: authConfig.google.clientId,
          clientSecret: authConfig.google.clientSecret,
        }
      : undefined,
    github: authConfig.github
      ? {
          clientId: authConfig.github.clientId,
          clientSecret: authConfig.github.clientSecret,
        }
      : undefined,
  },
  baseURL: authConfig.baseUrl,
  session: {
    expiresIn: authConfig.sessionExpiry,
    updateAge: 60 * 60 * 24, // 1 day
    cookieCache: {
      enabled: true,
      maxAge: 5 * 60, // 5 minutes
    },
  },
  advanced: {
    useSecureCookies: config.isProduction(),
    defaultCookieAttributes: {
      sameSite: "lax",
      secure: config.isProduction(),
      httpOnly: true,
    },
  },
  trustedOrigins: authConfig.trustedOrigins,
  plugins: [
    organization({
      allowUserToCreateOrganization: async (user) => {
        // const subscription = await getSubscription(user.id);
        // return subscription.plan === "pro";
        return true;
      },
      teams: {
        enabled: true,
        maximumTeams: 10, // Optional: limit teams per organization
        allowRemovingAllTeams: false, // Optional: prevent removing the last team
      },
      organizationCreation: {
        disabled: false, // Set to true to disable organization creation

        beforeCreate: async ({ organization, user }, request) => {
          // Run custom logic before organization is created
          // Optionally modify the organization data
          return {
            data: {
              ...organization,
              metadata: {
                customField: "value",
              },
            },
          };
        },
        afterCreate: async ({ organization, member, user }, request) => {
          // Run custom logic after organization is created
          // e.g., create default resources, send notifications
          // await setupDefaultResources(organization.id);
        },
      },
    }),
    multiSession(),
    admin({
      impersonationSessionDuration: 60 * 60 * 24, // 1 days
    }),
    // stripe({
    //   stripeClient,
    //   stripeWebhookSecret,
    //   createCustomerOnSignUp: true,
    //   subscription: {
    //     enabled: true,
    //     // Optional: Set to true to enable subscription management
    //     // If enabled, you can manage subscriptions using the Stripe dashboard
    //     // and the BetterAuth client.
    //     // This will also enable the subscription plugin on the client side.
    //     plans: stripePlans,
    //   },
    // }),
    emailHarmony(),
  ],
});

export type Session = typeof auth.$Infer.Session;
export type AuthUserType = Session["user"];
