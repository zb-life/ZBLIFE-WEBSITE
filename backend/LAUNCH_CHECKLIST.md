# ZB V15 — launch checklist

V15 is a launch candidate. The UI is deployable, but real payments stay blocked until these external credentials/services and the trusted database are configured.

## 1. Stripe
- Create/use a Stripe account and work in Sandbox/Test mode first.
- Add `STRIPE_SECRET_KEY` only to backend environment secrets; never place it in HTML/JS.
- Deploy `/api/stripe/sync-catalog`, checkout-session creation, custom-invoice creation, customer-portal and webhook endpoints.
- Configure the Stripe webhook and verify `Stripe-Signature`.
- Required events should cover checkout completion, successful/failed invoices, subscription changes/cancellations and refunds relevant to your implementation.

## 2. Pricing source of truth
- Edit scent base prices in Admin > Products.
- Edit pack/bundle prices in Admin > Bundles.
- Edit subscription discount and cadence in Admin > Subscriptions.
- Click **Sync Stripe Prices** after publishing pricing changes.
- Never overwrite historical order prices. Store the amount and Stripe Price ID used on each order/subscription.

## 3. Internal database
Move orders, customers, subscriptions, discount codes, custom invoices, page content and Stripe IDs from browser localStorage into your production database before public launch. Server-side code must recalculate totals from trusted database prices rather than trusting prices sent by the browser.

## 4. Admin protection
Protect `/admin` and all admin API endpoints with authenticated admin/editor roles. Do not rely only on a hidden URL.

## 5. Email
Connect a transactional email provider and configure the verified sender domain. After Stripe confirms payment, send the customer receipt/invoice and the internal copy.

## 6. Final QA
- Test one-time card checkout
- Test eligible wallet/local payment methods in Stripe test/sandbox where possible
- Test free-shipping threshold and paid shipping
- Test discount code rules and analytics
- Test mix-and-match bundles
- Test subscription checkout, renewal webhook and cancellation/customer portal
- Test custom invoice payment link
- Test invoice/receipt email to customer + internal address
- Test refund flow
- Test mobile navigation/cart/checkout
- Replace all placeholder images/copy and verify product claims

## Safety guard in V15
The normal checkout no longer marks orders paid in the browser. It calls `/api/stripe/create-checkout-session` and fails closed if the backend is missing. Local simulation is available only by adding `?demo=1` to the checkout/admin URL.
