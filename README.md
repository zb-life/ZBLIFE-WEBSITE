# ZB v15.16 — Netlify + Supabase Connection Fix

This version no longer relies on a Netlify Function just to expose the browser-safe Supabase URL and publishable key.

Netlify now generates `supabase-config.json` during every deploy using:

- `SUPABASE_URL`
- `SUPABASE_PUBLISHABLE_KEY`

Both values are browser-safe/public values. Secret Supabase keys are still never exposed.

## Deploy

1. Upload/commit this version to the GitHub repository root.
2. In Netlify, keep:
   - Base directory: blank
   - Package directory: blank
   - Build command: leave the UI blank (the repo's `netlify.toml` supplies it)
   - Publish directory: `.`
   - Functions directory: `netlify/functions`
3. Confirm the two environment variables exist.
4. Trigger a fresh deploy.

After deployment, open:

`https://YOUR-SITE.netlify.app/supabase-config.json`

You should see the Supabase URL and publishable key. Then reload `account.html`.


# ZB v15.15 — Supabase Connected Foundation

This version connects the existing storefront/Admin prototype to the Supabase project through the Netlify environment variables you already added.

## What changed

- Supabase runtime connection via Netlify Function
- Customer sign-up/sign-in/password-reset request uses Supabase Auth
- Admin access checks `user_roles`
- Storefront/Admin load catalog/content from Supabase
- **Save & publish** syncs major catalog/content changes to Supabase
- Existing visual design is retained
- No secret Supabase key is exposed in the browser

## Netlify variables required

- `SUPABASE_URL`
- `SUPABASE_PUBLISHABLE_KEY`

You already added these.

## Important

This is the first backend conversion stage. Checkout payments/orders are still the prototype flow until Stripe + server-side order creation/webhooks are added next. Product media uploads also still use the existing prototype media workflow; Supabase Storage upload wiring is the next media step.


# ZIONBURG v15.11

Account + localization update:
- centered sign-in / create-account experience on desktop
- larger language / market selector typography
- password recovery UI with privacy-safe prototype response
- retains v15.8 markets, currency, tax and shipping functionality
- language switch now translates the shared storefront interface site-wide
- Traditional Chinese starter translations cover Home, Product, Account, Checkout, Stockists, Community, cart, navigation and footer
- Admin → Markets & languages now includes a Shopify-style storefront translation editor
- product variants and homepage benefit copy can also carry per-language translations

## v15.11 admin login + in-context translation
- Account is now the shared login entry point for customers and authorised store admins.
- Admin → Store settings includes an Admin access email allowlist. Accounts matching those emails receive Open Admin and Edit Storefront actions on their Account dashboard.
- Once at least one admin email is configured, `/admin.html` redirects non-admin visitors to Account sign-in.
- Admin → Markets & languages keeps the bulk storefront translation editor, but it is collapsed by default.
- Added Edit Storefront translation mode: open a storefront page, choose a language, click translatable copy in context, edit it in the side panel and save.
- Edit mode supports shared UI phrases plus contextual product, variant, collection, homepage, benefit and community translations.
- The Edit/Browse toggle lets an admin temporarily use normal storefront interactions while remaining in translation mode.
- Authentication and admin roles are still prototype/browser-side only; production requires server-side auth and protected routes.

# ZIONBURG Editorial Ecommerce Prototype — v15

Static HTML/CSS/JS prototype intended for Netlify preview/testing.

## What changed
- Storefront redesigned in a more premium editorial / wellness direction.
- Public navigation preserved: Products dropdown, Bundles, About, Stockists, Community.
- Mobile navigation preserved as MENU / centered ZIONBURG / BAG with a full-screen menu and expandable Products list.
- Admin remains at `/admin.html` and continues to store prototype data in browser `localStorage`.
- Benefit icons are SVG assets.
- Shipping fee and free-delivery threshold remain editable in Admin > Store Settings and update storefront/checkout automatically.
- Subscriptions, discounts, orders, customers, bundles, custom pages, stockists, community entries and custom invoices are represented in the prototype.
- Custom Invoices can create line items and a shareable prototype payment URL.

## Important
This is a browser-first prototype. It does not charge live cards or provide production-grade authentication. Admin access rules and customer sessions are simulated in browser storage, and localStorage data is not shared between devices. A live deployment should move authentication, roles, payments, orders and customer data to secure backend services.

## Netlify
Upload the whole folder or this ZIP to Netlify. No build command is required. The entry page is `index.html`.


## v15.1 fixes
- Product scent, pack and purchase-option selection now persists correctly.
- Navigation logo and favicon are editable in Admin > Navigation via URL or upload.
- Homepage benefit SVG/icon assets and benefit copy are editable in Admin > Homepage.

## v15.2 media controls
- Homepage hero, product feature, four lifestyle panels and commitment background can each be switched between image and video in Admin > Homepage.
- Product gallery supports mixed image/video slides in Admin > Products.
- Hosted MP4/WebM URLs are recommended for normal videos. Small local video uploads (<1.8 MB) are supported only for prototype testing because browser localStorage is limited.
- Video slides support poster images, autoplay, loop and visible controls toggles.

## v15.3 interaction update
- Restores the more detailed split product-page composition.
- Softer Rhode-inspired pill buttons and tactile micro-interactions across the storefront.
- Scent choices now use colour-dot chips with animated selected states.
- Pack options use soft cards; purchase options use a segmented selector.
- Product gallery retains mixed image/video support and gains arrows, count and polished thumbnails.
- Product editorial copy updates with the selected scent.
- Existing admin, media controls, subscriptions, shipping settings and navigation remain intact.

## v15.5 catalog + admin overhaul
- Admin redesigned with a larger, cleaner Shopify-inspired interface and more readable typography.
- Default storefront font changed to Instrument Sans. Theme supports Instrument Sans, Manrope, DM Sans and Carme.
- Products are now a true multi-product catalog instead of one hard-coded item.
- Each product supports status, handle, vendor, category, description, navigation visibility, subscription eligibility, variants, inventory, pricing, colours and mixed media.
- Collections can group products and are available for merchandising and bundle rules.
- Added `collection.html?collection=HANDLE` for collection storefront pages.
- Bundles can apply to a specific product, a collection or all products.
- Subscription settings now include `Show subscription option on storefront`, which hides the customer-facing subscription UI without deleting the setup.
- Storefront palette controls include page background, text, surfaces, selected option colour, accent, primary button, button text and border colour.
- Removed the repetitive selected-scent name beside “Choose your scent”; the control now shows the number of available options instead.
- Homepage and product media editors support Image, Video/MP4 and YouTube media types.


## v15.5 typography update
- Larger storefront body copy and supporting text
- Larger admin labels, form fields, tables, helper text and navigation
- Storefront body text size is adjustable under Admin → Theme (16–19 px)
- Default storefront body size is now 17 px


## v15.8 markets, languages and international checkout
- Added Admin → Markets & languages with enabled languages, global translated copy and per-product / per-collection translations.
- Added market configuration for countries/regions, currency, prototype FX rate, tax rate, shipping fee, free-shipping threshold and delivery estimate.
- Storefront language and market selectors appear when more than one option is enabled.
- Checkout selects the market by destination country and recalculates shipping, tax and displayed currency.
- Tax supports none/manual prototype rates/Stripe Tax integration placeholder. Production tax obligations and FX should be handled by a live tax/payment service rather than relying on the prototype rates.

## v15.8 account + community UX
- Account page now shows one state at a time: Sign in or Create account, with a clear switch between them.
- Create account includes password confirmation.
- Community Partners and Friends of ZB support image/logo URL, image upload, cover/contain fit, website/social URL and translated name/note fields.


## v15.12 typography update
- Increased default storefront body text to 18px across English and Traditional Chinese.
- Existing v15 data using smaller body text is automatically migrated to 18px once.
- Added Noto Sans TC as the dedicated Traditional Chinese storefront font.
- Traditional Chinese renders one step larger with more generous line height for legibility.
- Language selectors, product controls, account forms, navigation, accordions and supporting copy were enlarged.
- Theme > Body text size now supports 17–21px.


## v15.14 updates
- Phone number and postal code are required in the prototype checkout.
- Orders now have a Ship order workflow in Admin: carrier, tracking number, optional tracking URL, shipped timestamp and optional customer email notification.
- Added `netlify/functions/send-shipping-email.mjs` for Resend-backed shipping notifications when `RESEND_API_KEY` and `ZB_FROM_EMAIL` are configured.
- Customer Account order history can display tracking information for shipped orders.

> Production note: this build still stores store/customer/order data in browser localStorage. The Supabase production conversion should make the Admin panel write products, collections, customers and orders directly to the database; you should not manually enter products in the Supabase dashboard for normal day-to-day use.
