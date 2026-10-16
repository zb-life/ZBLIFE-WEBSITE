// Google Merchant Center product feed.
// Served at https://zb.life/google-feed.xml (see the redirect in netlify.toml).
// Merchant Center fetches this URL on a schedule, so any product, price or stock
// change made in the admin panel reaches Google on the next fetch.
//
// Uses the same public Supabase key as the storefront, so it only ever sees
// products that are active + published. If SUPABASE_SERVICE_ROLE_KEY is set in
// Netlify, it also reads stock levels and marks sold-out variants as out_of_stock;
// without it every active variant is listed as in_stock.

const SITE = 'https://zb.life';
const clean = v => String(v || '').trim().replace(/^['"]|['"]$/g, '');
const supabaseUrl = () => clean(process.env.SUPABASE_URL).replace(/\/$/, '');
const publicKey = () => clean(process.env.SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_ANON_KEY);
const serviceKey = () => clean(process.env.SUPABASE_SERVICE_ROLE_KEY);

async function supa(path, key = publicKey()) {
  const r = await fetch(`${supabaseUrl()}/rest/v1/${path}`, {
    headers: { apikey: key, authorization: `Bearer ${key}`, accept: 'application/json' }
  });
  if (!r.ok) throw new Error(`Supabase lookup failed (${r.status}) for ${path.split('?')[0]}`);
  return r.json();
}

const xml = v => String(v ?? '')
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;').replace(/'/g, '&apos;')
  // strip characters XML does not allow
  .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '');

const plain = v => String(v || '')
  .replace(/<[^>]*>/g, ' ')
  .replace(/&nbsp;/g, ' ')
  .replace(/\s+/g, ' ')
  .trim();

const absolute = src => {
  const s = String(src || '').trim();
  if (!s) return '';
  if (/^https?:\/\//i.test(s)) return s;
  if (s.startsWith('//')) return `https:${s}`;
  return `${SITE}/${s.replace(/^\.?\//, '')}`;
};

const isImage = src => /\.(jpe?g|png|webp|gif)(\?|$)/i.test(src) || /\/storage\/v1\/object\/public\//.test(src);

const money = (minor, currency) => `${(Number(minor || 0) / 100).toFixed(2)} ${currency || 'HKD'}`;

export async function handler() {
  if (!supabaseUrl() || !publicKey()) {
    return { statusCode: 503, headers: { 'content-type': 'text/plain' }, body: 'Store catalog connection is not configured.' };
  }

  try {
    const [products, variants, media] = await Promise.all([
      supa('products?select=id,title,handle,description,vendor,product_type,seo_title,seo_description,status,published_at&status=eq.active&published_at=not.is.null'),
      supa('product_variants?select=id,product_id,title,sku,barcode,price_minor,compare_at_price_minor,currency,option_values,track_inventory,inventory_policy,weight,weight_unit,position,active&active=eq.true&order=position.asc'),
      supa('product_media?select=product_id,variant_id,media_type,external_url,poster_url,position&order=position.asc')
    ]);

    let stock = null;
    if (serviceKey()) {
      try {
        const inv = await supa('inventory?select=variant_id,quantity_on_hand,quantity_reserved', serviceKey());
        stock = new Map(inv.map(i => [i.variant_id, Number(i.quantity_on_hand || 0) - Number(i.quantity_reserved || 0)]));
      } catch (e) {
        console.warn('Inventory lookup skipped:', e.message);
      }
    }

    const items = [];
    for (const p of products) {
      const pVariants = variants.filter(v => v.product_id === p.id);
      const pImages = media
        .filter(m => m.product_id === p.id)
        .map(m => (m.media_type === 'image' ? m.external_url : m.poster_url))
        .map(absolute)
        .filter(src => src && isImage(src));

      const description = plain(p.description) || plain(p.seo_description) || plain(p.title);
      const multi = pVariants.length > 1;

      for (const v of pVariants) {
        const ov = v.option_values || {};
        const variantImages = [ov.VariantImage, ...(Array.isArray(ov.VariantGallery) ? ov.VariantGallery.map(g => g?.type === 'video' ? '' : g?.src) : [])]
          .map(absolute)
          .filter(src => src && isImage(src));
        const images = [...new Set([...variantImages, ...pImages])];
        if (!images.length) continue; // Google rejects items without an image

        const link = `${SITE}/product.html?product=${encodeURIComponent(p.handle)}&scent=${encodeURIComponent(v.title)}`;
        const onSale = v.compare_at_price_minor != null && Number(v.compare_at_price_minor) > Number(v.price_minor);
        const left = stock?.get(v.id);
        const soldOut = left != null && left <= 0 && v.track_inventory !== false && v.inventory_policy !== 'continue';
        const gtin = String(v.barcode || '').replace(/\D/g, '');

        const fields = [
          ['g:id', v.sku || v.id],
          ['g:title', multi ? `${p.title} – ${v.title}` : p.title],
          ['g:description', description.slice(0, 5000)],
          ['g:link', link],
          ['g:image_link', images[0]],
          ...images.slice(1, 10).map(src => ['g:additional_image_link', src]),
          ['g:availability', soldOut ? 'out_of_stock' : 'in_stock'],
          ['g:price', money(onSale ? v.compare_at_price_minor : v.price_minor, v.currency)],
          ...(onSale ? [['g:sale_price', money(v.price_minor, v.currency)]] : []),
          ['g:brand', p.vendor || 'ZIONBURG'],
          ['g:condition', 'new'],
          ...(gtin.length >= 8 ? [['g:gtin', gtin]] : [['g:identifier_exists', 'no']]),
          ...(v.sku ? [['g:mpn', v.sku]] : []),
          ...(multi ? [['g:item_group_id', p.id]] : []),
          ...(p.product_type ? [['g:product_type', p.product_type]] : []),
          ...(v.weight ? [['g:shipping_weight', `${v.weight} ${v.weight_unit || 'g'}`]] : [])
        ];

        items.push(`    <item>\n${fields.map(([k, val]) => `      <${k}>${xml(val)}</${k}>`).join('\n')}\n    </item>`);
      }
    }

    const body = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">
  <channel>
    <title>ZB Life</title>
    <link>${SITE}</link>
    <description>ZB Life product feed for Google Merchant Center</description>
${items.join('\n')}
  </channel>
</rss>
`;

    return {
      statusCode: 200,
      headers: { 'content-type': 'application/xml; charset=utf-8', 'cache-control': 'public, max-age=900' },
      body
    };
  } catch (e) {
    console.error('Google feed failed:', e);
    return { statusCode: 500, headers: { 'content-type': 'text/plain' }, body: 'Feed temporarily unavailable.' };
  }
}
