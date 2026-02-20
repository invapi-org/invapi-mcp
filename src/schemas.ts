import { z } from "zod";

// ── Reusable sub-schemas ──

export const PostalAddressSchema = z.object({
  address_line_1: z.string().describe("Street address line 1"),
  address_line_2: z.string().optional().describe("Street address line 2"),
  address_line_3: z.string().optional().describe("Street address line 3"),
  city: z.string().describe("City name"),
  post_code: z.string().describe("Postal / ZIP code"),
  country_subdivision: z.string().optional().describe("State / province / region"),
  country_code: z
    .string()
    .min(2)
    .max(2)
    .describe("ISO 3166-1 alpha-2 country code, e.g. 'DE', 'US', 'FR'"),
});

export const ContactSchema = z.object({
  telephone_number: z.string().optional().describe("Phone number"),
  email_address: z.string().optional().describe("Email address"),
});

export const PartySchema = z.object({
  name: z.string().describe("Full formal name of the party"),
  postal_address: PostalAddressSchema,
  vat_identifier: z.string().optional().describe("VAT identification number"),
  contact: ContactSchema,
});

const VatCategoryCode = z
  .enum(["S", "Z", "E", "AE", "K", "G", "O", "L", "M"])
  .describe(
    "VAT category: S=Standard, Z=Zero-rated, E=Exempt, AE=Reverse charge, " +
    "K=Intra-community, G=Export, O=Outside scope, L=Canary Islands, M=Ceuta/Melilla"
  );

export const PriceDetailsSchema = z.object({
  item_price_without_vat: z.number().describe("Unit price without VAT"),
  item_price_discount: z.number().optional().describe("Discount per unit"),
  item_price_with_vat: z.number().describe("Unit price with VAT"),
  item_vat_percentage: z.number().describe("VAT rate as percentage, e.g. 19"),
  vat_category_code: VatCategoryCode,
});

export const InvoiceItemSchema = z.object({
  item_identifier: z.string().describe("Unique line-item identifier"),
  item_quantity: z.number().describe("Quantity of items"),
  item_quantity_unit_of_measure_code: z
    .string()
    .describe("UN/ECE Recommendation 20 unit code, e.g. 'C62' (unit), 'HUR' (hour), 'KGM' (kg)"),
  item_total_amount_with_vat: z.number().describe("Total line amount including VAT"),
  item_total_amount_without_vat: z.number().optional().describe("Total line amount excluding VAT"),
  price_details: PriceDetailsSchema,
  item_information: z.string().optional().describe("Description of the item or service"),
});

const InvoicingPeriodSchema = z.object({
  start: z.string().describe("Period start date (YYYY-MM-DD)"),
  end: z.string().describe("Period end date (YYYY-MM-DD)"),
});

const AdditionalDataSchema = z.object({
  reverse_charge: z.boolean().optional().describe("True if VAT reverse charge applies"),
  leitweg_id: z.string().optional().describe("Leitweg-ID for German government invoicing"),
  customer_id: z.string().optional(),
  order_id: z.string().optional(),
  delivery_id: z.string().optional(),
  project: z.string().optional().describe("Project reference"),
  preceeding_invoice_number: z.string().optional(),
  invoicing_period: InvoicingPeriodSchema.optional(),
});

const DeliveryAddressSchema = z.object({
  address_line_1: z.string().describe("Street address line 1"),
  address_line_2: z.string().optional(),
  address_line_3: z.string().optional(),
  city: z.string(),
  post_code: z.string(),
  country_subdivision: z.string().optional(),
  country_code: z.string().min(2).max(2),
});

const DeliveryInformationSchema = z.object({
  deliver_to: z.string().optional().describe("Delivery recipient name"),
  deliver_to_address: DeliveryAddressSchema.optional(),
  delivery_date: z.string().optional().describe("Delivery date (YYYY-MM-DD)"),
  delivery_method: z.string().optional(),
  delivery_instructions: z.string().optional(),
});

const PaymentInformationSchema = z.object({
  payment_type: z
    .enum(["credit_card", "credit_transfer", "cash", "online_payment_service"])
    .optional()
    .describe("Payment method"),
  payment_reference: z.string().optional(),
  payment_instructions: z.string().optional(),
  payment_account_number: z.string().optional().describe("IBAN or account number"),
  credit_card_number: z.string().optional(),
  credit_card_type: z.string().optional(),
  payment_due_date: z.string().optional().describe("Due date (YYYY-MM-DD)"),
  payment_payed_date: z.string().optional().describe("Date payment was made (YYYY-MM-DD)"),
  payment_terms: z.string().optional(),
});

const TotalsSchema = z.object({
  total_amount_without_vat: z.number().describe("Sum of all line items without VAT"),
  total_amount_with_vat: z.number().describe("Sum of all line items with VAT"),
  total_vat_amount: z.number().describe("Total VAT amount"),
  amount_due_for_payment: z.number().describe("Amount due for payment"),
  paid_amount: z.number().describe("Amount already paid"),
  sum_of_allowances: z.number().optional(),
  sum_of_charges: z.number().optional(),
  invoice_total_without_vat: z.number().optional(),
  rounding_amount: z.number().optional(),
});

// ── Main Invoice schema ──

export const InvoiceSchema = z.object({
  invoice_number: z.string().describe("Unique invoice identifier, e.g. 'INV-2025-001'"),
  invoice_date: z.string().describe("Issue date in YYYY-MM-DD format"),
  invoice_currency_code: z
    .string()
    .describe("ISO 4217 currency code, e.g. 'EUR', 'USD', 'GBP'"),
  invoice_type: z
    .enum(["incoming", "outgoing"])
    .describe(
      "'incoming' = received from vendor/supplier; 'outgoing' = sent to customer"
    ),
  invoice_note: z.string().optional(),
  additional_data: AdditionalDataSchema.optional(),
  seller: PartySchema.describe("The party issuing the invoice"),
  buyer: PartySchema.describe("The party receiving the invoice"),
  delivery_information: DeliveryInformationSchema.optional(),
  payment_information: PaymentInformationSchema,
  totals: TotalsSchema,
  items: z.array(InvoiceItemSchema).min(1).describe("Invoice line items (at least 1)"),
  invoice_description: z.string().describe("Short description of the invoice"),
  category: z.string().optional().describe("Invoice category"),
  id: z.string().optional(),
});

export type Invoice = z.infer<typeof InvoiceSchema>;

// ── Extraction-specific schemas ──

export const ExtractionPartySchema = z.object({
  name: z.string().describe("Full formal name"),
  postal_address: PostalAddressSchema,
  vat_identifier: z.string().optional(),
  contact: ContactSchema,
});

export const CategorySchema = z.object({
  id: z.string().describe("Category identifier"),
  name: z.string().describe("Category name"),
  description: z.string().describe("What this category represents"),
});

// ── Batch operation schema ──

export const BatchOperationSchema = z.object({
  id: z.string().describe("Unique identifier for this operation (returned in results)"),
  operation: z
    .enum(["json_to_ubl", "json_to_cii", "ubl_to_json", "cii_to_json", "zugferd_to_json"])
    .describe("Conversion operation to perform"),
  input: z.unknown().describe(
    "Input data: an Invoice JSON object for json_to_* operations, or an XML string for *_to_json operations"
  ),
});
