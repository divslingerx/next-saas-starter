"use strict";
exports.__esModule = true;
exports.createCaller = exports.appRouter = void 0;
var post_1 = require("./routers/post");
var trpc_1 = require("./trpc");
/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
exports.appRouter = trpc_1.createTRPCRouter({
    post: post_1.postRouter
});
/**
 * Create a server-side caller for the tRPC API.
 * @example
 * const trpc = createCaller(createContext);
 * const res = await trpc.post.all();
 *       ^? Post[]
 */
exports.createCaller = trpc_1.createCallerFactory(exports.appRouter);
