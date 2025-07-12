import { text, bigint, boolean, doublePrecision, timestamp, index, pgTableCreator } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";

// Create table with prefix
export const createTable = pgTableCreator((name) => `agency-app_${name}`);

// Transaction table
export const transaction = createTable("transaction", {
  id: bigint("id", { mode: "number" }).primaryKey(),
  orderId: bigint("order_id", { mode: "number" }).notNull(),
  parentId: bigint("parent_id", { mode: "number" }),
  
  // Transaction details
  kind: text("kind"),
  status: text("status"),
  gateway: text("gateway"),
  message: text("message"),
  errorCode: text("error_code"),
  
  // Authorization
  authorization: text("authorization"),
  authorizationExpiresAt: timestamp("authorization_expires_at"),
  
  // Amounts
  amount: doublePrecision("amount"),
  currency: text("currency"),
  
  // Currency exchange
  currencyExchangeAdjustment: doublePrecision("currency_exchange_adjustment"),
  currencyExchangeCurrency: text("currency_exchange_currency"),
  currencyExchangeFinalAmount: doublePrecision("currency_exchange_final_amount"),
  currencyExchangeId: bigint("currency_exchange_id", { mode: "number" }),
  currencyExchangeOriginalAmount: doublePrecision("currency_exchange_original_amount"),
  
  // Receipt
  receiptAmount: doublePrecision("receipt_amount"),
  receiptStatus: text("receipt_status"),
  
  // Payment details
  paymentDetailsAvsResultCode: text("payment_details_avs_result_code"),
  paymentDetailsCreditCardBin: text("payment_details_credit_card_bin"),
  paymentDetailsCreditCardCompany: text("payment_details_credit_card_company"),
  paymentDetailsCreditCardNumber: text("payment_details_credit_card_number"),
  paymentDetailsCvvResultCode: text("payment_details_cvv_result_code"),
  
  // Other fields
  sourceName: text("source_name"),
  deviceId: text("device_id"),
  userId: bigint("user_id", { mode: "number" }),
  test: boolean("test"),
  
  // Timestamps
  createdAt: timestamp("created_at"),
  processedAt: timestamp("processed_at"),
}, (table) => [
  index("transaction_order_id_idx").on(table.orderId),
  index("transaction_kind_idx").on(table.kind),
  index("transaction_status_idx").on(table.status),
  index("transaction_created_at_idx").on(table.createdAt),
]);

// Tender transaction table
export const tenderTransaction = createTable("tender_transaction", {
  id: bigint("id", { mode: "number" }).primaryKey(),
  orderId: bigint("order_id", { mode: "number" }).notNull(),
  
  // Transaction details
  amount: doublePrecision("amount"),
  currency: text("currency"),
  paymentMethod: text("payment_method"),
  remoteReference: text("remote_reference"),
  
  // Payment details
  paymentDetailsCreditCardCompany: text("payment_details_credit_card_company"),
  paymentDetailsCreditCardNumber: text("payment_details_credit_card_number"),
  
  // Other fields
  userId: bigint("user_id", { mode: "number" }),
  test: boolean("test"),
  
  // Timestamps
  processedAt: timestamp("processed_at"),
}, (table) => [
  index("tender_transaction_order_id_idx").on(table.orderId),
]);

// Payment dispute table
export const paymentDispute = createTable("payment_dispute", {
  id: bigint("id", { mode: "number" }).primaryKey(),
  orderId: bigint("order_id", { mode: "number" }).notNull(),
  
  // Dispute details
  type: text("type"),
  status: text("status"),
  reason: text("reason"),
  networkReasonCode: text("network_reason_code"),
  
  // Amounts
  amount: text("amount"),
  currency: text("currency"),
  
  // Dates
  evidenceDueBy: timestamp("evidence_due_by"),
  evidenceSentOn: timestamp("evidence_sent_on"),
  finalizedOn: timestamp("finalized_on"),
}, (table) => [
  index("payment_dispute_order_id_idx").on(table.orderId),
  index("payment_dispute_status_idx").on(table.status),
]);

// Payment dispute evidence table
export const paymentDisputeEvidence = createTable("payment_dispute_evidence", {
  id: bigint("id", { mode: "number" }).primaryKey(),
  paymentsDisputeId: bigint("payments_dispute_id", { mode: "number" }),
  
  // Customer information
  customerEmailAddress: text("customer_email_address"),
  customerFirstName: text("customer_first_name"),
  customerLastName: text("customer_last_name"),
  
  // Evidence text
  accessActivityLog: text("access_activity_log"),
  cancellationPolicyDisclosure: text("cancellation_policy_disclosure"),
  cancellationRebuttal: text("cancellation_rebuttal"),
  refundPolicyDisclosure: text("refund_policy_disclosure"),
  refundRefusalExplanation: text("refund_refusal_explanation"),
  uncategorizedText: text("uncategorized_text"),
  
  // Product description
  productDescriptionTitle: text("product_description_title"),
  productDescriptionProductName: text("product_description_product_name"),
  productDescriptionProductDescription: text("product_description_product_description"),
  productDescriptionPrice: text("product_description_price"),
  productDescriptionQuantity: text("product_description_quantity"),
  
  // Billing address
  billingAddressAddress1: text("billing_address_address1"),
  billingAddressAddress2: text("billing_address_address2"),
  billingAddressCity: text("billing_address_city"),
  billingAddressCountry: text("billing_address_country"),
  billingAddressCountryCode: text("billing_address_country_code"),
  billingAddressProvince: text("billing_address_province"),
  billingAddressProvinceCode: text("billing_address_province_code"),
  billingAddressZip: text("billing_address_zip"),
  
  // Shipping address
  disputeShippingAddressAddress1: text("dispute_shipping_address_address1"),
  disputeShippingAddressAddress2: text("dispute_shipping_address_address2"),
  disputeShippingAddressCity: text("dispute_shipping_address_city"),
  disputeShippingAddressCountry: text("dispute_shipping_address_country"),
  disputeShippingAddressCountryCode: text("dispute_shipping_address_country_code"),
  disputeShippingAddressProvince: text("dispute_shipping_address_province"),
  disputeShippingAddressProvinceCode: text("dispute_shipping_address_province_code"),
  disputeShippingAddressZip: text("dispute_shipping_address_zip"),
  
  // Fulfillment information
  fulfillmentsShippingCarrier: text("fulfillments_shipping_carrier"),
  fulfillmentsShippingDate: timestamp("fulfillments_shipping_date"),
  fulfillmentsShippingTrackingNumber: bigint("fulfillments_shipping_tracking_number", { mode: "number" }),
  
  // Evidence file IDs
  disputeEvidenceFilesCancellationPolicyFileId: bigint("dispute_evidence_files_cancellation_policy_file_id", { mode: "number" }),
  disputeEvidenceFilesCustomerCommunicationFileId: bigint("dispute_evidence_files_customer_communication_file_id", { mode: "number" }),
  disputeEvidenceFilesCustomerSignatureFileId: bigint("dispute_evidence_files_customer_signature_file_id", { mode: "number" }),
  disputeEvidenceFilesRefundPolicyFileId: bigint("dispute_evidence_files_refund_policy_file_id", { mode: "number" }),
  disputeEvidenceFilesServiceDocumentationFileId: bigint("dispute_evidence_files_service_documentation_file_id", { mode: "number" }),
  disputeEvidenceFilesShippingDocumentationFileId: bigint("dispute_evidence_files_shipping_documentation_file_id", { mode: "number" }),
  disputeEvidenceFilesUncategorizedFileId: bigint("dispute_evidence_files_uncategorized_file_id", { mode: "number" }),
  
  // Other fields
  submitted: boolean("submitted"),
  createdAt: text("created_at"),
  updatedOn: text("updated_on"),
});

// Create Zod schemas for validation
export const insertTransactionSchema = createInsertSchema(transaction, {
  test: z.boolean().optional(),
});
export const selectTransactionSchema = createSelectSchema(transaction);

export const insertTenderTransactionSchema = createInsertSchema(tenderTransaction, {
  test: z.boolean().optional(),
});
export const selectTenderTransactionSchema = createSelectSchema(tenderTransaction);

export const insertPaymentDisputeSchema = createInsertSchema(paymentDispute);
export const selectPaymentDisputeSchema = createSelectSchema(paymentDispute);

export const insertPaymentDisputeEvidenceSchema = createInsertSchema(paymentDisputeEvidence, {
  submitted: z.boolean().optional(),
});
export const selectPaymentDisputeEvidenceSchema = createSelectSchema(paymentDisputeEvidence);

// Type exports
export type Transaction = typeof transaction.$inferSelect;
export type NewTransaction = typeof transaction.$inferInsert;

export type TenderTransaction = typeof tenderTransaction.$inferSelect;
export type NewTenderTransaction = typeof tenderTransaction.$inferInsert;

export type PaymentDispute = typeof paymentDispute.$inferSelect;
export type NewPaymentDispute = typeof paymentDispute.$inferInsert;

export type PaymentDisputeEvidence = typeof paymentDisputeEvidence.$inferSelect;
export type NewPaymentDisputeEvidence = typeof paymentDisputeEvidence.$inferInsert;