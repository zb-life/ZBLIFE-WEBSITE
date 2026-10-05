# ZB Ecommerce V15 — Launch Candidate

This package removes the demo/reset controls and adds the Stripe pricing sync interface. The storefront/CMS UI is ready for deployment, but real commerce still requires backend credentials and database/email services. See `backend/LAUNCH_CHECKLIST.md`.

## Stripe pricing
Use the ZB Admin as the pricing source of truth:
- Products: base scent price
- Bundles: quantity and flat bundle price
- Subscriptions: discount and billing cadence

Then use **Sync Stripe Prices**. The backend creates new Stripe Price objects when pricing changes. Existing orders/subscriptions keep their original Stripe Price IDs for accounting history.
