"use strict";
exports.__esModule = true;
exports.subscription = exports.passkey = exports.twoFactor = exports.invitation = exports.member = exports.organization = exports.verification = exports.account = exports.session = exports.user = void 0;
var pg_core_1 = require("drizzle-orm/pg-core");
exports.user = pg_core_1.pgTable("user", {
    id: pg_core_1.text('id').primaryKey(),
    name: pg_core_1.text('name').notNull(),
    email: pg_core_1.text('email').notNull().unique(),
    emailVerified: pg_core_1.boolean('email_verified').$defaultFn(function () { return false; }).notNull(),
    image: pg_core_1.text('image'),
    createdAt: pg_core_1.timestamp('created_at').$defaultFn(function () { /* @__PURE__ */ return new Date(); }).notNull(),
    updatedAt: pg_core_1.timestamp('updated_at').$defaultFn(function () { /* @__PURE__ */ return new Date(); }).notNull(),
    twoFactorEnabled: pg_core_1.boolean('two_factor_enabled'),
    role: pg_core_1.text('role'),
    banned: pg_core_1.boolean('banned'),
    banReason: pg_core_1.text('ban_reason'),
    banExpires: pg_core_1.timestamp('ban_expires'),
    stripeCustomerId: pg_core_1.text('stripe_customer_id')
});
exports.session = pg_core_1.pgTable("session", {
    id: pg_core_1.text('id').primaryKey(),
    expiresAt: pg_core_1.timestamp('expires_at').notNull(),
    token: pg_core_1.text('token').notNull().unique(),
    createdAt: pg_core_1.timestamp('created_at').notNull(),
    updatedAt: pg_core_1.timestamp('updated_at').notNull(),
    ipAddress: pg_core_1.text('ip_address'),
    userAgent: pg_core_1.text('user_agent'),
    userId: pg_core_1.text('user_id').notNull().references(function () { return exports.user.id; }, { onDelete: 'cascade' }),
    activeOrganizationId: pg_core_1.text('active_organization_id'),
    impersonatedBy: pg_core_1.text('impersonated_by')
});
exports.account = pg_core_1.pgTable("account", {
    id: pg_core_1.text('id').primaryKey(),
    accountId: pg_core_1.text('account_id').notNull(),
    providerId: pg_core_1.text('provider_id').notNull(),
    userId: pg_core_1.text('user_id').notNull().references(function () { return exports.user.id; }, { onDelete: 'cascade' }),
    accessToken: pg_core_1.text('access_token'),
    refreshToken: pg_core_1.text('refresh_token'),
    idToken: pg_core_1.text('id_token'),
    accessTokenExpiresAt: pg_core_1.timestamp('access_token_expires_at'),
    refreshTokenExpiresAt: pg_core_1.timestamp('refresh_token_expires_at'),
    scope: pg_core_1.text('scope'),
    password: pg_core_1.text('password'),
    createdAt: pg_core_1.timestamp('created_at').notNull(),
    updatedAt: pg_core_1.timestamp('updated_at').notNull()
});
exports.verification = pg_core_1.pgTable("verification", {
    id: pg_core_1.text('id').primaryKey(),
    identifier: pg_core_1.text('identifier').notNull(),
    value: pg_core_1.text('value').notNull(),
    expiresAt: pg_core_1.timestamp('expires_at').notNull(),
    createdAt: pg_core_1.timestamp('created_at').$defaultFn(function () { /* @__PURE__ */ return new Date(); }),
    updatedAt: pg_core_1.timestamp('updated_at').$defaultFn(function () { /* @__PURE__ */ return new Date(); })
});
exports.organization = pg_core_1.pgTable("organization", {
    id: pg_core_1.text('id').primaryKey(),
    name: pg_core_1.text('name').notNull(),
    slug: pg_core_1.text('slug').unique(),
    logo: pg_core_1.text('logo'),
    createdAt: pg_core_1.timestamp('created_at').notNull(),
    metadata: pg_core_1.text('metadata')
});
exports.member = pg_core_1.pgTable("member", {
    id: pg_core_1.text('id').primaryKey(),
    organizationId: pg_core_1.text('organization_id').notNull().references(function () { return exports.organization.id; }, { onDelete: 'cascade' }),
    userId: pg_core_1.text('user_id').notNull().references(function () { return exports.user.id; }, { onDelete: 'cascade' }),
    role: pg_core_1.text('role')["default"]("member").notNull(),
    createdAt: pg_core_1.timestamp('created_at').notNull()
});
exports.invitation = pg_core_1.pgTable("invitation", {
    id: pg_core_1.text('id').primaryKey(),
    organizationId: pg_core_1.text('organization_id').notNull().references(function () { return exports.organization.id; }, { onDelete: 'cascade' }),
    email: pg_core_1.text('email').notNull(),
    role: pg_core_1.text('role'),
    status: pg_core_1.text('status')["default"]("pending").notNull(),
    expiresAt: pg_core_1.timestamp('expires_at').notNull(),
    inviterId: pg_core_1.text('inviter_id').notNull().references(function () { return exports.user.id; }, { onDelete: 'cascade' })
});
exports.twoFactor = pg_core_1.pgTable("two_factor", {
    id: pg_core_1.text('id').primaryKey(),
    secret: pg_core_1.text('secret').notNull(),
    backupCodes: pg_core_1.text('backup_codes').notNull(),
    userId: pg_core_1.text('user_id').notNull().references(function () { return exports.user.id; }, { onDelete: 'cascade' })
});
exports.passkey = pg_core_1.pgTable("passkey", {
    id: pg_core_1.text('id').primaryKey(),
    name: pg_core_1.text('name'),
    publicKey: pg_core_1.text('public_key').notNull(),
    userId: pg_core_1.text('user_id').notNull().references(function () { return exports.user.id; }, { onDelete: 'cascade' }),
    credentialID: pg_core_1.text('credential_i_d').notNull(),
    counter: pg_core_1.integer('counter').notNull(),
    deviceType: pg_core_1.text('device_type').notNull(),
    backedUp: pg_core_1.boolean('backed_up').notNull(),
    transports: pg_core_1.text('transports'),
    createdAt: pg_core_1.timestamp('created_at'),
    aaguid: pg_core_1.text('aaguid')
});
exports.subscription = pg_core_1.pgTable("subscription", {
    id: pg_core_1.text('id').primaryKey(),
    plan: pg_core_1.text('plan').notNull(),
    referenceId: pg_core_1.text('reference_id').notNull(),
    stripeCustomerId: pg_core_1.text('stripe_customer_id'),
    stripeSubscriptionId: pg_core_1.text('stripe_subscription_id'),
    status: pg_core_1.text('status')["default"]("incomplete"),
    periodStart: pg_core_1.timestamp('period_start'),
    periodEnd: pg_core_1.timestamp('period_end'),
    cancelAtPeriodEnd: pg_core_1.boolean('cancel_at_period_end'),
    seats: pg_core_1.integer('seats')
});
