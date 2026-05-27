import type { TranslationKeys, StyleMoodId, TravelVibeId, WardrobeCategoryId } from '@/i18n/types';
import type { WardrobeItem } from '@/lib/outfit-engine';
import { styleMoodToEngine } from '@/lib/style-mood';
import type { WeatherCondition } from '@/lib/weather';
import { generateLook } from '@/lib/outfit-engine';
import { getStylingWardrobe } from '@/lib/wardrobe-utils';

export type DestinationWeather = {
  city: string;
  temperature: number;
  condition: WeatherCondition;
  isDay: boolean;
  nightTemperature: number;
  nightCondition: WeatherCondition;
};

export type TravelDayPlan = {
  day: number;
  title: string;
  mood: string;
  weatherNote: string;
  items: WardrobeItem[];
  lookImage: string;
  lookTitle: string;
};

export type LuxurySpot = {
  id: string;
  name: string;
  type: 'rooftop' | 'cafe' | 'restaurant' | 'beachClub' | 'gallery';
  image: string;
  outfitSuggested: boolean;
};

export type TravelPlan = {
  destination: string;
  duration: number;
  departureDate: string;
  vibe: TravelVibeId;
  weather: DestinationWeather;
  packedItems: WardrobeItem[];
  accessories: WardrobeItem[];
  shoes: WardrobeItem[];
  outerwear: WardrobeItem[];
  dailyLooks: TravelDayPlan[];
  spots: LuxurySpot[];
  wardrobeHint?: string;
};

const DESTINATION_WEATHER: Record<string, Omit<DestinationWeather, 'city'>> = {
  paris: { temperature: 17, condition: 'partlyCloudy', isDay: true, nightTemperature: 11, nightCondition: 'cloudy' },
  bodrum: { temperature: 29, condition: 'clear', isDay: true, nightTemperature: 22, nightCondition: 'clear' },
  milano: { temperature: 20, condition: 'clear', isDay: true, nightTemperature: 14, nightCondition: 'partlyCloudy' },
  london: { temperature: 14, condition: 'rain', isDay: true, nightTemperature: 9, nightCondition: 'drizzle' },
  dubai: { temperature: 34, condition: 'clear', isDay: true, nightTemperature: 26, nightCondition: 'clear' },
  istanbul: { temperature: 22, condition: 'partlyCloudy', isDay: true, nightTemperature: 16, nightCondition: 'cloudy' },
};

const SPOT_IMAGES = {
  rooftop: 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=600&q=80',
  cafe: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=600&q=80',
  restaurant: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=600&q=80',
  beachClub: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600&q=80',
  gallery: 'https://images.unsplash.com/photo-1561214115-f2f134cc4912?w=600&q=80',
};

const VIBE_MOOD: Record<TravelVibeId, StyleMoodId> = {
  cityExplore: 'dailyChic',
  romanticEscape: 'romantic',
  businessTrip: 'minimal',
  beachClub: 'confident',
  luxuryEscape: 'elegant',
  minimalTravel: 'minimal',
};

function hashString(value: string): number {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

function normalizeDestination(raw: string): string {
  return raw.trim().toLowerCase();
}

function resolveWeather(destination: string): Omit<DestinationWeather, 'city'> {
  const key = normalizeDestination(destination);
  for (const [name, profile] of Object.entries(DESTINATION_WEATHER)) {
    if (key.includes(name)) return profile;
  }
  const seed = hashString(key);
  const conditions: WeatherCondition[] = ['clear', 'partlyCloudy', 'cloudy', 'rain'];
  return {
    temperature: 16 + (seed % 14),
    condition: conditions[seed % conditions.length],
    isDay: true,
    nightTemperature: 10 + (seed % 10),
    nightCondition: conditions[(seed + 1) % conditions.length],
  };
}

function pickItems(items: WardrobeItem[], count: number, seed: number): WardrobeItem[] {
  if (items.length === 0) return [];
  const result: WardrobeItem[] = [];
  for (let i = 0; i < count; i += 1) {
    result.push(items[(seed + i) % items.length]);
  }
  return result;
}

function byCategory(items: WardrobeItem[], category: WardrobeCategoryId): WardrobeItem[] {
  return items.filter((item) => item.category === category);
}

function buildSpots(t: TranslationKeys, destination: string, vibe: TravelVibeId, seed: number): LuxurySpot[] {
  const types: LuxurySpot['type'][] =
    vibe === 'beachClub'
      ? ['beachClub', 'restaurant', 'cafe']
      : vibe === 'businessTrip'
        ? ['restaurant', 'cafe', 'gallery']
        : ['rooftop', 'cafe', 'restaurant', 'gallery', 'beachClub'];

  return types.slice(0, 4).map((type, index) => ({
    id: `${type}-${index}`,
    name: t.travel.spotNames[(seed + index) % t.travel.spotNames.length].replace('{city}', destination),
    type,
    image: SPOT_IMAGES[type],
    outfitSuggested: index % 2 === 0,
  }));
}

export function generateTravelPlan(
  t: TranslationKeys,
  params: {
    destination: string;
    duration: number;
    departureDate: string;
    vibe: TravelVibeId;
    wardrobe: WardrobeItem[];
    seed?: number;
  },
): TravelPlan {
  const { destination, duration, departureDate, vibe, wardrobe } = params;
  const stylingWardrobe = getStylingWardrobe(wardrobe);
  const wardrobeHint =
    stylingWardrobe.length === 1 ? t.travel.wardrobeHintSingle : undefined;
  const seed = params.seed ?? hashString(`${destination}-${vibe}-${departureDate}`);
  const weatherProfile = resolveWeather(destination);
  const weather: DestinationWeather = { city: destination.trim(), ...weatherProfile };

  const moodEngine = styleMoodToEngine(VIBE_MOOD[vibe]);
  const packedCount = Math.min(
    Math.max(duration + 2, 4),
    stylingWardrobe.length || 0,
  );
  const packedItems = pickItems(stylingWardrobe, packedCount, seed);

  const accessories = byCategory(packedItems, 'accessory').length
    ? byCategory(packedItems, 'accessory')
    : pickItems(byCategory(stylingWardrobe, 'accessory'), 2, seed + 1);
  const shoes = byCategory(packedItems, 'shoes').length
    ? byCategory(packedItems, 'shoes')
    : pickItems(byCategory(stylingWardrobe, 'shoes'), 2, seed + 2);
  const outerwear = byCategory(packedItems, 'outerwear').length
    ? byCategory(packedItems, 'outerwear')
    : pickItems(byCategory(stylingWardrobe, 'outerwear'), 1, seed + 3);

  const dayTitles = t.travel.dayTitles[vibe];
  const dailyLooks: TravelDayPlan[] = Array.from({ length: duration }, (_, index) => {
    const day = index + 1;
    const daySeed = seed + day * 17;
    const dayItems = pickItems(
      packedItems.length ? packedItems : stylingWardrobe,
      Math.min(3, stylingWardrobe.length || 0),
      daySeed,
    );
    const titleTemplate = dayTitles[index % dayTitles.length];
    const title = titleTemplate.replace('{day}', String(day));
    const mood = t.travel.moodLabels[(daySeed + index) % t.travel.moodLabels.length];
    const conditionKey = daySeed % 2 === 0 ? weather.condition : weather.nightCondition;
    const temp = daySeed % 2 === 0 ? weather.temperature : weather.nightTemperature;
    const weatherNote = t.travel.weatherDayNote
      .replace('{temp}', String(temp))
      .replace('{condition}', t.weather.conditions[conditionKey]);

    const look = generateLook(t, {
      intent: `${destination} — ${title}`,
      wardrobe: dayItems.length ? dayItems : stylingWardrobe,
      weather: {
        city: destination,
        temperature: temp,
        condition: conditionKey,
        isDay: daySeed % 2 === 0,
        hour: daySeed % 2 === 0 ? 14 : 21,
      },
      seed: daySeed,
      moodOverride: moodEngine,
    });

    return {
      day,
      title,
      mood,
      weatherNote,
      items: dayItems,
      lookImage: dayItems[0]?.imageUri ?? look.image,
      lookTitle: look.title,
    };
  });

  return {
    destination: destination.trim(),
    duration,
    departureDate,
    vibe,
    weather,
    packedItems,
    accessories,
    shoes,
    outerwear,
    dailyLooks,
    spots: buildSpots(t, destination.trim() || t.travel.defaultCity, vibe, seed),
    wardrobeHint,
  };
}
