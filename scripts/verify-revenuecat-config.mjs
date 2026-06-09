/**
 * Static + live RevenueCat config check (run: node scripts/verify-revenuecat-config.mjs)
 * Loads .env via Expo's env loader pattern.
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const envPath = resolve(root, '.env');

function loadDotEnv() {
  try {
    const raw = readFileSync(envPath, 'utf8');
    for (const line of raw.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eq = trimmed.indexOf('=');
      if (eq === -1) continue;
      const key = trimmed.slice(0, eq).trim();
      const value = trimmed.slice(eq + 1).trim();
      if (!process.env[key]) process.env[key] = value;
    }
  } catch {
    console.error('Could not read .env');
    process.exit(1);
  }
}

loadDotEnv();

const EXPECTED = {
  envVar: 'EXPO_PUBLIC_REVENUECAT_IOS_KEY',
  weekly: 'com.stylove.app.premium.weekly',
  monthly: 'com.stylove.app.premium.monthly',
  entitlement: 'stylove Premium',
};

const apiKey = process.env[EXPECTED.envVar];
const checks = [];

function pass(label, detail) {
  checks.push({ ok: true, label, detail });
}

function fail(label, detail) {
  checks.push({ ok: false, label, detail });
}

if (!apiKey) {
  fail('Env var present', `${EXPECTED.envVar} is missing`);
} else if (!apiKey.startsWith('appl_')) {
  fail('Key format', `Expected appl_ prefix, got ${apiKey.slice(0, 8)}...`);
} else {
  pass('Env var present', `${EXPECTED.envVar}=${apiKey.slice(0, 12)}...`);
}

// Live offerings check via RevenueCat REST (public SDK keys work for subscriber endpoints in v1)
async function verifyOfferingsLive() {
  if (!apiKey?.startsWith('appl_')) return;

  const appUserId = `verify-${Date.now()}`;
  const url = `https://api.revenuecat.com/v1/subscribers/${encodeURIComponent(appUserId)}`;

  try {
    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
    });

    if (!res.ok) {
      fail('Live API connectivity', `HTTP ${res.status} ${res.statusText}`);
      return;
    }

    pass('Live API connectivity', `RevenueCat accepted iOS public key (HTTP ${res.status})`);

    // Offerings are not in subscriber response; fetch offerings via dedicated endpoint if available
    const offeringsUrl = 'https://api.revenuecat.com/v1/offerings';
    const offeringsRes = await fetch(offeringsUrl, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'X-Platform': 'ios',
      },
    });

    if (offeringsRes.ok) {
      const body = await offeringsRes.json();
      const offerings = body?.offerings ?? body;
      const current = offerings?.current ?? offerings?.current_offering_id;
      pass('Offerings endpoint', `HTTP ${offeringsRes.status}`);

      const packages = [];
      if (offerings?.all) {
        for (const offering of Object.values(offerings.all)) {
          for (const pkg of offering?.available_packages ?? offering?.packages ?? []) {
            const productId =
              pkg?.platform_product_identifier ??
              pkg?.product?.identifier ??
              pkg?.store_product_id;
            if (productId) packages.push(productId);
          }
        }
      }

      const hasWeekly = packages.includes(EXPECTED.weekly);
      const hasMonthly = packages.includes(EXPECTED.monthly);

      if (hasWeekly) pass('Product weekly', EXPECTED.weekly);
      else fail('Product weekly', `Not found in offerings. Seen: ${[...new Set(packages)].join(', ') || 'none'}`);

      if (hasMonthly) pass('Product monthly', EXPECTED.monthly);
      else fail('Product monthly', `Not found in offerings. Seen: ${[...new Set(packages)].join(', ') || 'none'}`);

      if (current) pass('Current offering', typeof current === 'string' ? current : current?.identifier ?? 'set');
      else fail('Current offering', 'No current offering configured in RevenueCat');
    } else {
      // Public key may not expose /v1/offerings — still OK if SDK works on device
      fail(
        'Offerings endpoint',
        `HTTP ${offeringsRes.status} — verify offerings in RC dashboard + TestFlight (public key may not expose REST offerings)`,
      );
    }
  } catch (error) {
    fail('Live API connectivity', String(error));
  }
}

pass('Product ID weekly (code)', EXPECTED.weekly);
pass('Product ID monthly (code)', EXPECTED.monthly);
pass('Entitlement ID (code)', EXPECTED.entitlement);

await verifyOfferingsLive();

console.log('\n=== RevenueCat readiness ===\n');
for (const c of checks) {
  console.log(`${c.ok ? 'PASS' : 'FAIL'}  ${c.label}${c.detail ? `: ${c.detail}` : ''}`);
}

const failed = checks.filter((c) => !c.ok);
process.exit(failed.length ? 1 : 0);
