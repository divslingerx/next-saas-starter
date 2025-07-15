"use strict";
var _a;
exports.__esModule = true;
exports.db = void 0;
var postgres_js_1 = require("drizzle-orm/postgres-js");
var postgres_1 = require("postgres");
var schema = require("./schema");
/**
 * Cache the database connection in development. This avoids creating a new connection on every HMR
 * update.
 */
var globalForDb = globalThis;
var getDatabaseUrl = function () {
    if (!process.env.DATABASE_URL) {
        throw new Error("DATABASE_URL is not defined");
    }
    return process.env.DATABASE_URL;
};
var conn = (_a = globalForDb.conn) !== null && _a !== void 0 ? _a : postgres_1["default"](getDatabaseUrl());
if (process.env.NODE_ENV !== "production")
    globalForDb.conn = conn;
exports.db = postgres_js_1.drizzle(conn, { schema: schema });
