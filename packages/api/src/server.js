"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
exports.__esModule = true;
exports.createCaller = exports.createTRPCContext = exports.appRouter = void 0;
var root_1 = require("./root");
__createBinding(exports, root_1, "appRouter");
var trpc_1 = require("./trpc");
__createBinding(exports, trpc_1, "createTRPCContext");
__createBinding(exports, trpc_1, "createCaller");
