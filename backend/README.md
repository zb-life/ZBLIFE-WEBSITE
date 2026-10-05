# ZB Custom Invoice Backend — Stripe integration plan

The prototype UI uses browser storage only. The production version should call a protected backend endpoint when staff clicks **Generate payment link**.

## Production flow

1. Staff creates a custom invoice in ZB Admin.
2. Backend creates/reuses the Stripe customer.
3. Backend creates a one-off Stripe Invoice with `collection_method=send_invoice`.
4. Backend adds arbitrary invoice items, plus shipping and an optional negative invoice item for a fixed discount.
5. Backend sends/finalizes the invoice.
6. Save the returned Stripe invoice ID, `hosted_invoice_url`, `invoice_pdf`, amount, due date and status in the ZB database.
7. Return the hosted invoice URL to Admin so staff can copy it to WhatsApp/email.
8. Stripe webhooks update the ZB invoice record. On `invoice.paid`, create the sales order, update customer lifetime value / sales analytics, decrement stock if relevant, and email the internal invoice copy.

## Required production hardening

- Verify Stripe webhook signatures.
- Protect the admin endpoint with Cloudflare Access or strong authenticated staff sessions, not only a shared token.
- Use idempotency keys for invoice creation so double-clicks cannot create duplicate invoices.
- Store Stripe customer IDs per customer to avoid duplicates.
- Validate money server-side and never trust totals sent from the browser.
- Add audit fields: created_by, created_at, modified_by, sent_at, paid_at, voided_at.
- Keep invoice status synced from Stripe webhooks rather than allowing the browser to mark invoices paid.
