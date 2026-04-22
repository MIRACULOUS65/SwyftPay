import { betterAuth } from "better-auth";
import { Pool } from "pg";

export const auth = betterAuth({
  database: new Pool({
    connectionString: process.env.DATABASE_URL,
  }),

  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false, // hackathon: skip email verification
  },

  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    },
  },

  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // update session every 24 hours
  },

  user: {
    additionalFields: {
      walletAddress: {
        type: "string",
        required: false,
        defaultValue: null,
        input: true,
      },
      preferredCurrency: {
        type: "string",
        required: false,
        defaultValue: "INR",
        input: true,
      },
      inrBalance: {
        type: "number",
        required: false,
        defaultValue: 0, // real balance — starts at ₹0
        input: false,
      },
    },
  },
});

export type Session = typeof auth.$Infer.Session;
