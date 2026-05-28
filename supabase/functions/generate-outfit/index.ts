import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';

type WardrobeCategory =
  | 'upper'
  | 'outerwear'
  | 'bottom'
  | 'dress'
  | 'shoes'
  | 'bag'
  | 'accessory';

type WardrobePayloadItem = {
  id: string;
  name: string;
  category: WardrobeCategory;
  itemType: string;
};

type WeatherPayload = {
  city?: string;
  temperature?: number;
  feelsLike?: number;
  precipitation?: number;
  wind?: number;
  condition?: string;
  isCold?: boolean;
  isRainy?: boolean;
  needsOuterwear?: boolean;
};

type SelectedPiece = {
  role: 'top' | 'bottom' | 'dress' | 'shoes' | 'outerwear' | 'bag' | 'accessory' | 'jewelry';
  itemId: string;
};

type StylistResponse = {
  title?: string;
  vibe?: string;
  commentary?: string;
  missingPiece?: string;
  tags?: string[];
  weatherReason?: string;
  stylingNotes?: string;
  selectedPieces?: SelectedPiece[];
};

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const OPENAI_URL = 'https://api.openai.com/v1/chat/completions';
const MAX_WARDROBE_ITEMS = 45;
const MAX_TEXT_LENGTH = 180;
const MAX_OUTPUT_TOKENS = 520;
const REQUEST_TIMEOUT_MS = 12000;
const RETRY_COUNT = 1;

function jsonResponse(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

function logHook(event: string, metadata: Record<string, unknown>) {
  console.log(JSON.stringify({ event, ...metadata, at: new Date().toISOString() }));
}

function truncateText(value: unknown, fallback = ''): string {
  if (typeof value !== 'string') return fallback;
  return value.trim().slice(0, MAX_TEXT_LENGTH);
}

function clampNumber(value: unknown): number | undefined {
  const next = Number(value);
  return Number.isFinite(next) ? next : undefined;
}

function sanitizeWardrobe(raw: unknown): WardrobePayloadItem[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .slice(0, MAX_WARDROBE_ITEMS)
    .map((item) => ({
      id: truncateText(item?.id),
      name: truncateText(item?.name, 'Wardrobe piece'),
      category: item?.category as WardrobeCategory,
      itemType: truncateText(item?.itemType),
    }))
    .filter((item) => item.id && item.category && item.itemType);
}

function sanitizeWeather(raw: unknown): WeatherPayload | undefined {
  if (!raw || typeof raw !== 'object') return undefined;
  const value = raw as Record<string, unknown>;
  return {
    city: truncateText(value.city),
    temperature: clampNumber(value.temperature),
    feelsLike: clampNumber(value.feelsLike),
    precipitation: clampNumber(value.precipitation),
    wind: clampNumber(value.wind),
    condition: truncateText(value.condition),
    isCold: Boolean(value.isCold),
    isRainy: Boolean(value.isRainy),
    needsOuterwear: Boolean(value.needsOuterwear),
  };
}

function summarizeWardrobe(wardrobe: WardrobePayloadItem[]) {
  const byCategory = wardrobe.reduce<Record<string, number>>((acc, item) => {
    acc[item.category] = (acc[item.category] ?? 0) + 1;
    return acc;
  }, {});
  return {
    total: wardrobe.length,
    byCategory,
    hasTopBottom: byCategory.upper > 0 && byCategory.bottom > 0,
    hasDress: byCategory.dress > 0,
    hasOuterwear: byCategory.outerwear > 0,
    hasComfortShoes: wardrobe.some((item) => ['ayakkabi', 'bot', 'sneaker', 'loafer'].includes(item.itemType)),
  };
}

function buildPrompt(params: {
  locale: string;
  intent: string;
  mood?: string;
  weather?: WeatherPayload;
  styleMemory?: unknown;
  recentItemIds: string[];
  wardrobe: WardrobePayloadItem[];
}) {
  const wardrobeSummary = summarizeWardrobe(params.wardrobe);
  return [
    'Persona: Stylove private editorial stylist. Refined, modern, minimal, confident. No robotic phrasing.',
    'Task: build one complete look using only wardrobe IDs below.',
    'Rank by: color harmony, silhouette balance, occasion relevance, weather compatibility, layering logic.',
    'Avoid: duplicate colors/textures when alternatives exist, clashing formality, repeated hero items, generic compliments.',
    'Negative rules: no winter layering in hot weather; no heels/suits for comfort travel; do not overuse black/white; vary accessory logic.',
    'Selection: top+bottom when strong, otherwise dress. Shoes required if available. Outerwear only for cold/rain/evening. Bag/accessories if they improve the look.',
    'Commentary must describe the selectedPieces item names only. Do not mention a color, tone, time of day, destination mood, or layer that is not supported by selectedPieces, weather, or intent.',
    'For beach/coastal/hot summer intent: use grounded language about lightness, comfort, breathable styling, simple contrast, relaxed structure. Avoid evening, gala, winter, burgundy, champagne, heavy layering.',
    'Missing category: write one subtle missingPiece sentence, never invent an item ID.',
    'JSON only: {"title":"","vibe":"","commentary":"","missingPiece":"","tags":[""],"weatherReason":"","stylingNotes":"","selectedPieces":[{"role":"top","itemId":""}]}',
    `locale=${params.locale}`,
    `intent=${params.intent}`,
    `mood=${params.mood ?? 'editorial minimal'}`,
    `weather=${JSON.stringify(params.weather ?? null)}`,
    `wardrobeBalance=${JSON.stringify(wardrobeSummary)}`,
    `recentItemIds=${JSON.stringify(params.recentItemIds.slice(0, 12))}`,
    `styleMemory=${JSON.stringify(params.styleMemory ?? null).slice(0, 650)}`,
    `items=${JSON.stringify(params.wardrobe)}`,
  ].join('\n');
}

async function fetchWithTimeout(apiKey: string, body: Record<string, unknown>) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    return await fetch(OPENAI_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeout);
  }
}

async function callProvider(apiKey: string, body: Record<string, unknown>) {
  let lastError: unknown;
  for (let attempt = 0; attempt <= RETRY_COUNT; attempt += 1) {
    try {
      const res = await fetchWithTimeout(apiKey, body);
      if (res.ok) return res;
      lastError = new Error(`Provider returned ${res.status}`);
      if (res.status < 500 && res.status !== 429) break;
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError instanceof Error ? lastError : new Error('Provider request failed');
}

function parseProviderContent(data: Record<string, unknown>): StylistResponse {
  const choices = data.choices as { message?: { content?: string } }[] | undefined;
  const content = choices?.[0]?.message?.content;
  if (!content) return {};
  try {
    return JSON.parse(content) as StylistResponse;
  } catch {
    return {};
  }
}

function sanitizeResponse(raw: StylistResponse, wardrobe: WardrobePayloadItem[]): StylistResponse {
  const allowedIds = new Set(wardrobe.map((item) => item.id));
  const usedIds = new Set<string>();
  const selectedPieces = (raw.selectedPieces ?? [])
    .filter((piece) => allowedIds.has(piece.itemId) && !usedIds.has(piece.itemId))
    .slice(0, 8)
    .map((piece) => {
      usedIds.add(piece.itemId);
      return piece;
    });

  return {
    title: truncateText(raw.title),
    vibe: truncateText(raw.vibe),
    commentary: truncateText(raw.commentary, '').slice(0, 320),
    missingPiece: truncateText(raw.missingPiece, '').slice(0, 220),
    tags: (raw.tags ?? []).filter((item) => typeof item === 'string').slice(0, 4).map((item) => item.slice(0, 32)),
    weatherReason: truncateText(raw.weatherReason, '').slice(0, 220),
    stylingNotes: truncateText(raw.stylingNotes, '').slice(0, 320),
    selectedPieces,
  };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return jsonResponse({ ok: false, error: 'Method not allowed' }, 405);

  const apiKey = Deno.env.get('OPENAI_API_KEY');
  if (!apiKey) {
    logHook('generate_outfit_missing_secret', {});
    return jsonResponse({ ok: false, error: 'Stylist service unavailable' }, 200);
  }

  const authHeader = req.headers.get('Authorization');
  if (!authHeader) return jsonResponse({ ok: false, error: 'Unauthorized' }, 401);

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY');
  if (!supabaseUrl || !anonKey) {
    logHook('generate_outfit_missing_supabase_env', {});
    return jsonResponse({ ok: false, error: 'Server configuration incomplete' }, 500);
  }

  const userClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
  });
  const {
    data: { user },
  } = await userClient.auth.getUser();
  if (!user) return jsonResponse({ ok: false, error: 'Unauthorized' }, 401);

  const payload = await req.json().catch(() => ({}));
  const intent = truncateText(payload.intent, 'A refined day plan');
  const locale = truncateText(payload.locale, 'tr').slice(0, 8);
  const mood = truncateText(payload.mood);
  const wardrobe = sanitizeWardrobe(payload.wardrobe);
  const weather = sanitizeWeather(payload.weather);
  const styleMemory = payload.styleMemory ?? null;
  const recentItemIds = Array.isArray(payload.recentItemIds)
    ? payload.recentItemIds.filter((item) => typeof item === 'string').slice(0, 20)
    : [];

  if (wardrobe.length === 0) {
    return jsonResponse({ ok: false, error: 'Wardrobe is empty' }, 200);
  }

  const prompt = buildPrompt({ locale, intent, mood, weather, styleMemory, recentItemIds, wardrobe });
  const model = Deno.env.get('OPENAI_MODEL');
  if (!model) {
    logHook('generate_outfit_missing_model_config', {});
    return jsonResponse({ ok: false, error: 'Stylist service unavailable' }, 200);
  }
  const requestBody = {
    model,
    temperature: 0.38,
    max_tokens: MAX_OUTPUT_TOKENS,
    response_format: { type: 'json_object' },
    messages: [
      {
        role: 'system',
        content:
          'Write concise luxury fashion styling. Never mention internal systems, providers, model names, or implementation details.',
      },
      { role: 'user', content: prompt },
    ],
  };

  try {
    logHook('generate_outfit_start', { wardrobeCount: wardrobe.length, locale, userId: user.id });
    const res = await callProvider(apiKey, requestBody);
    const data = (await res.json()) as Record<string, unknown>;
    const response = sanitizeResponse(parseProviderContent(data), wardrobe);
    logHook('generate_outfit_success', {
      selectedCount: response.selectedPieces?.length ?? 0,
      missingCount: response.missingPieces?.length ?? 0,
    });
    return jsonResponse({ ok: true, look: response });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Provider request failed';
    logHook('generate_outfit_failure', { message });
    return jsonResponse({ ok: false, error: 'Stylist service unavailable' }, 200);
  }
});
