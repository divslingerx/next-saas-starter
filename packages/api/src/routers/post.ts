import { z } from "zod";

import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "../trpc";

export const postRouter = createTRPCRouter({
  hello: publicProcedure
    .input(z.object({ text: z.string() }))
    .query(({ input }) => {
      return {
        greeting: `Hello ${input.text}`,
      };
    }),

  // Example procedures - apps should implement their own database logic
  create: protectedProcedure
    .input(z.object({ name: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      // This is just an example - actual implementation would depend on the app's schema
      console.log(`Creating post: ${input.name} by user ${ctx.session.user.id}`);
      // Apps using this would implement their own database logic
      return { success: true, name: input.name };
    }),

  getLatest: protectedProcedure.query(async ({ ctx }) => {
    // Example response - apps would query their own database
    return {
      id: 1,
      name: "Example Post",
      createdById: ctx.session.user.id,
      createdAt: new Date(),
    };
  }),

  getSecretMessage: protectedProcedure.query(() => {
    return "you can now see this secret message!";
  }),
});
