"use strict";
// Example model schema from the Drizzle docs
// https://orm.drizzle.team/docs/sql-schema-declaration
var __makeTemplateObject = (this && this.__makeTemplateObject) || function (cooked, raw) {
    if (Object.defineProperty) { Object.defineProperty(cooked, "raw", { value: raw }); } else { cooked.raw = raw; }
    return cooked;
};
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
exports.__esModule = true;
exports.posts = exports.createTable = void 0;
var auth_schema_1 = require("./auth-schema");
__exportStar(require("./auth-schema"), exports);
var drizzle_orm_1 = require("drizzle-orm");
var pg_core_1 = require("drizzle-orm/pg-core");
/**
 * This is an example of how to use the multi-project schema feature of Drizzle ORM. Use the same
 * database instance for multiple projects.
 *
 * @see https://orm.drizzle.team/docs/goodies#multi-project-schema
 */
exports.createTable = pg_core_1.pgTableCreator(function (name) { return "agency-app_" + name; });
exports.posts = exports.createTable("post", function (d) { return ({
    id: d.integer().primaryKey().generatedByDefaultAsIdentity(),
    name: d.varchar({ length: 256 }),
    createdById: d.text().references(function () { return auth_schema_1.user.id; }),
    createdAt: d
        .timestamp({ withTimezone: true })["default"](drizzle_orm_1.sql(templateObject_1 || (templateObject_1 = __makeTemplateObject(["CURRENT_TIMESTAMP"], ["CURRENT_TIMESTAMP"]))))
        .notNull(),
    updatedAt: d.timestamp({ withTimezone: true }).$onUpdate(function () { return new Date(); })
}); }, function (t) { return [pg_core_1.index("name_idx").on(t.name)]; });
var templateObject_1;
