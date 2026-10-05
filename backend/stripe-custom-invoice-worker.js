/**
 * ZB custom invoice backend example for Cloudflare Workers.
 * Environment variables required:
 *   STRIPE_SECRET_KEY
 *   ADMIN_API_TOKEN
 *
 * Production note: replace the placeholder database helpers with your real DB.
 */

const STRIPE_API = 'https://api.stripe.com/v1';

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8' },
  });
}

function authOK(request, env) {
  const auth = request.headers.get('authorization') || '';
  return !!env.ADMIN_API_TOKEN && auth === `Bearer ${env.ADMIN_API_TOKEN}`;
}

function formBody(obj) {
  const out = new URLSearchParams();
  for (const [key, value] of Object.entries(obj)) {
    if (value === undefined || value === null || value === '') continue;
    out.set(key, String(value));
  }
  return out;
}

async function stripePost(env, path, body = {}) {
  const res = await fetch(`${STRIPE_API}${path}`, {
    method: 'POST',
    headers: {
      authorization: `Bearer ${env.STRIPE_SECRET_KEY}`,
      'content-type': 'application/x-www-form-urlencoded',
    },
    body: formBody(body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error?.message || `Stripe error ${res.status}`);
  return data;
}

async function createStripeCustomer(env, customer) {
  return stripePost(env, '/customers', {
    name: [customer.firstName, customer.lastName].filter(Boolean).join(' '),
    email: customer.email,
    phone: customer.phone,
    'address[line1]': customer.address,
    'address[country]': customer.country,
  });
}

async function createCustomInvoice(env, payload) {
  const customer = await createStripeCustomer(env, payload.customer);
  const dueDays = Math.max(1, Number(payload.dueDays || 7));

  const invoice = await stripePost(env, '/invoices', {
    customer: customer.id,
    collection_method: 'send_invoice',
    days_until_due: dueDays,
    auto_advance: 'false',
    description: payload.notes || undefined,
    'metadata[zb_source]': 'custom_order',
    'metadata[zb_reference]': payload.reference || '',
  });

  // Arbitrary custom line items: no need to pre-create Stripe Products/Prices.
  for (const item of payload.items || []) {
    const qty = Math.max(1, Number(item.qty || 1));
    const unitPrice = Math.max(0, Number(item.unitPrice || 0));
    await stripePost(env, '/invoiceitems', {
      customer: customer.id,
      invoice: invoice.id,
      currency: 'hkd',
      amount: Math.round(unitPrice * qty * 100),
      description: `${item.description}${qty > 1 ? ` × ${qty}` : ''}`,
    });
  }

  const shipping = Math.max(0, Number(payload.shipping || 0));
  if (shipping > 0) {
    await stripePost(env, '/invoiceitems', {
      customer: customer.id,
      invoice: invoice.id,
      currency: 'hkd',
      amount: Math.round(shipping * 100),
      description: 'Shipping',
    });
  }

  const discount = Math.max(0, Number(payload.discount || 0));
  if (discount > 0) {
    await stripePost(env, '/invoiceitems', {
      customer: customer.id,
      invoice: invoice.id,
      currency: 'hkd',
      amount: -Math.round(discount * 100),
      description: 'Custom discount',
    });
  }

  // send_invoice finalizes the invoice and emails the customer.
  const sent = await stripePost(env, `/invoices/${invoice.id}/send`, {});

  // Save these fields in your DB in production.
  return {
    stripeCustomerId: customer.id,
    stripeInvoiceId: sent.id,
    status: sent.status,
    hostedInvoiceUrl: sent.hosted_invoice_url,
    invoicePdf: sent.invoice_pdf,
    amountDue: sent.amount_due,
    currency: sent.currency,
    dueDate: sent.due_date,
  };
}

async function handleStripeWebhook(request, env) {
  // IMPORTANT: production must verify Stripe-Signature with your webhook secret.
  // This file is an architecture example; add signature verification before launch.
  const event = await request.json();
  const invoice = event.data?.object;
  switch (event.type) {
    case 'invoice.paid':
      // DB: mark custom invoice paid, create/attach sales order, send internal copy.
      break;
    case 'invoice.payment_failed':
      // DB: mark payment issue / notify staff.
      break;
    case 'invoice.voided':
      // DB: mark custom invoice void.
      break;
  }
  return json({ received: true });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    try {
      if (request.method === 'POST' && url.pathname === '/api/admin/custom-invoices') {
        if (!authOK(request, env)) return json({ error: 'Unauthorized' }, 401);
        const payload = await request.json();
        if (!payload?.customer?.email) return json({ error: 'Customer email is required' }, 400);
        if (!Array.isArray(payload.items) || !payload.items.length) return json({ error: 'At least one line item is required' }, 400);
        const result = await createCustomInvoice(env, payload);
        return json(result, 201);
      }
      if (request.method === 'POST' && url.pathname === '/api/stripe/webhook') {
        return handleStripeWebhook(request, env);
      }
      return json({ error: 'Not found' }, 404);
    } catch (err) {
      return json({ error: err.message || 'Unexpected error' }, 500);
    }
  },
};
