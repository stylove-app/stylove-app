import { isQaTestMode } from '@/lib/qa-test-mode';
import type { WardrobeItemTypeId } from '@/i18n/types';
import type { SelectedOccasionId } from '@/lib/selected-occasion';
import {
  authoritativeProductCategory,
  hasUserWardrobeMetadata,
} from '@/lib/wardrobe-metadata-authority';
import { getEffectiveStyleProfile } from '@/lib/wardrobe-style-profile';
import type { WardrobeItem } from '@/lib/outfit-engine';
import type { PaletteMode } from '@/lib/outfit-palette-planner';
import { HOT_WEATHER_HARD_C } from '@/lib/occasion-style-authority';
import { isLayerPieceItem, layerPieceAllowedInContext } from '@/lib/layer-piece-rules';
import type { WeatherSnapshot } from '@/lib/weather';

export type OutfitStructure = 'separates' | 'one_piece';

export type OutfitConceptId = string;

export type OutfitConcept = {
  id: OutfitConceptId;
  label: string;
  structure: OutfitStructure | 'either';
  paletteModes: PaletteMode[];
  topCategories: string[];
  topTypes: WardrobeItemTypeId[];
  bottomCategories: string[];
  bottomTypes: WardrobeItemTypeId[];
  onePieceCategories: string[];
  onePieceTypes: WardrobeItemTypeId[];
  shoeCategories: string[];
  shoeTypes: WardrobeItemTypeId[];
  avoidCategories: string[];
  avoidTypes: WardrobeItemTypeId[];
  maxFormality: number;
  allowOuterwear: 'never' | 'weather' | 'smart';
  allowWatch: boolean;
  allowBoldAccent: boolean;
  preferBag: boolean;
};

const OFFICE_HEAVY_CATEGORIES = new Set([
  'blazer',
  'tailored_trousers',
  'office_dress',
  'coat',
  'trench',
  'heel',
  'evening_dress',
]);

const CASUAL_TOP_CATS = ['t_shirt', 'crop_top', 'blouse', 'sweater', 'shirt'];
const CASUAL_BOTTOM_CATS = ['jeans', 'skirt', 'shorts'];
const CASUAL_SHOES = ['sneaker', 'flat', 'sandal', 'loafer'];
const COFFEE_TOP_CATS = ['t_shirt', 'blouse', 'sweater', 'crop_top', 'shirt'];
const ELEGANT_SHOES = ['heel', 'flat'];

const CONCEPTS_BY_OCCASION: Record<SelectedOccasionId, OutfitConcept[]> = {
  daily: [
    {
      id: 'relaxed_daily',
      label: 'Relaxed daily',
      structure: 'separates',
      paletteModes: ['neutral_plus_accent', 'tonal', 'analogous', 'tonal'],
      topCategories: CASUAL_TOP_CATS,
      topTypes: ['tisort', 'gomlek', 'kazak'],
      bottomCategories: ['jeans', 'skirt', 'shorts'],
      bottomTypes: ['jean', 'etek', 'sort'],
      onePieceCategories: [],
      onePieceTypes: [],
      shoeCategories: CASUAL_SHOES,
      shoeTypes: ['ayakkabi'],
      avoidCategories: ['blazer', 'coat', 'trench', 'heel', 'evening_dress', 'office_dress', 'shirt'],
      avoidTypes: ['topuklu', 'ceket', 'trenchcoat', 'kaban'],
      maxFormality: 0.58,
      allowOuterwear: 'weather',
      allowWatch: false,
      allowBoldAccent: true,
      preferBag: true,
    },
    {
      id: 'summer_daily',
      label: 'Summer daily',
      structure: 'either',
      paletteModes: ['analogous', 'tonal', 'analogous', 'neutral_plus_accent'],
      topCategories: ['t_shirt', 'crop_top', 'blouse', 'shirt'],
      topTypes: ['tisort', 'gomlek'],
      bottomCategories: ['shorts', 'skirt', 'jeans'],
      bottomTypes: ['sort', 'etek', 'jean'],
      onePieceCategories: ['summer_dress', 'midi_dress'],
      onePieceTypes: ['elbise'],
      shoeCategories: ['sandal', 'sneaker', 'flat'],
      shoeTypes: ['ayakkabi'],
      avoidCategories: ['blazer', 'coat', 'heel', 'boot', 'sweater'],
      avoidTypes: ['topuklu', 'ceket', 'kaban', 'mont'],
      maxFormality: 0.5,
      allowOuterwear: 'never',
      allowWatch: false,
      allowBoldAccent: true,
      preferBag: true,
    },
    {
      id: 'minimal_daily',
      label: 'Minimal daily',
      structure: 'separates',
      paletteModes: ['monochrome', 'tonal', 'neutral_plus_accent', 'tonal'],
      topCategories: ['t_shirt', 'blouse', 'sweater', 'crop_top'],
      topTypes: ['tisort', 'gomlek', 'kazak'],
      bottomCategories: ['jeans', 'skirt', 'shorts'],
      bottomTypes: ['jean', 'etek', 'sort'],
      onePieceCategories: [],
      onePieceTypes: [],
      shoeCategories: ['loafer', 'sneaker', 'flat'],
      shoeTypes: ['ayakkabi', 'bot'],
      avoidCategories: ['blazer', 'heel', 'evening_dress'],
      avoidTypes: ['topuklu', 'ceket'],
      maxFormality: 0.58,
      allowOuterwear: 'weather',
      allowWatch: false,
      allowBoldAccent: false,
      preferBag: true,
    },
  ],
  coffee: [
    {
      id: 'relaxed_smart_casual',
      label: 'Relaxed smart casual',
      structure: 'separates',
      paletteModes: ['neutral_plus_accent', 'tonal', 'tonal'],
      topCategories: COFFEE_TOP_CATS,
      topTypes: ['tisort', 'gomlek', 'kazak'],
      bottomCategories: ['jeans', 'skirt'],
      bottomTypes: ['jean', 'etek'],
      onePieceCategories: ['midi_dress', 'summer_dress'],
      onePieceTypes: ['elbise'],
      shoeCategories: ['loafer', 'sneaker', 'flat'],
      shoeTypes: ['ayakkabi'],
      avoidCategories: ['evening_dress', 'heel', 'blazer', 'office_dress', 'tailored_trousers'],
      avoidTypes: ['topuklu'],
      maxFormality: 0.68,
      allowOuterwear: 'weather',
      allowWatch: false,
      allowBoldAccent: false,
      preferBag: true,
    },
    {
      id: 'denim_casual',
      label: 'Denim casual',
      structure: 'separates',
      paletteModes: ['complementary', 'neutral_plus_accent', 'tonal'],
      topCategories: ['t_shirt', 'blouse', 'crop_top', 'sweater'],
      topTypes: ['tisort', 'gomlek', 'kazak'],
      bottomCategories: ['jeans', 'skirt'],
      bottomTypes: ['jean', 'etek'],
      onePieceCategories: [],
      onePieceTypes: [],
      shoeCategories: ['sneaker', 'loafer', 'flat'],
      shoeTypes: ['ayakkabi'],
      avoidCategories: ['blazer', 'heel', 'evening_dress', 'office_dress', 'shirt'],
      avoidTypes: ['topuklu', 'ceket'],
      maxFormality: 0.6,
      allowOuterwear: 'weather',
      allowWatch: false,
      allowBoldAccent: false,
      preferBag: true,
    },
    {
      id: 'soft_minimal',
      label: 'Soft minimal',
      structure: 'either',
      paletteModes: ['monochrome', 'tonal', 'tonal'],
      topCategories: ['t_shirt', 'blouse', 'sweater'],
      topTypes: ['tisort', 'gomlek', 'kazak'],
      bottomCategories: ['jeans', 'skirt'],
      bottomTypes: ['jean', 'etek'],
      onePieceCategories: ['midi_dress', 'summer_dress'],
      onePieceTypes: ['elbise'],
      shoeCategories: ['sneaker', 'flat', 'loafer'],
      shoeTypes: ['ayakkabi'],
      avoidCategories: ['blazer', 'heel', 'tailored_trousers', 'office_dress', 'shirt'],
      avoidTypes: ['topuklu'],
      maxFormality: 0.65,
      allowOuterwear: 'weather',
      allowWatch: false,
      allowBoldAccent: false,
      preferBag: true,
    },
  ],
  office: [
    {
      id: 'polished_office',
      label: 'Polished office',
      structure: 'separates',
      paletteModes: ['tonal', 'monochrome', 'neutral_plus_accent', 'monochrome'],
      topCategories: ['blouse', 'shirt', 'sweater'],
      topTypes: ['gomlek', 'kazak'],
      bottomCategories: ['tailored_trousers', 'skirt'],
      bottomTypes: ['pantolon', 'etek'],
      onePieceCategories: ['office_dress', 'midi_dress'],
      onePieceTypes: ['elbise'],
      shoeCategories: ['loafer', 'heel', 'flat', 'boot'],
      shoeTypes: ['topuklu', 'ayakkabi', 'bot'],
      avoidCategories: ['shorts', 'crop_top', 't_shirt', 'sandal', 'sunglasses'],
      avoidTypes: ['sort', 'tisort', 'hoodie', 'sweatshirt', 'gozluk'],
      maxFormality: 0.95,
      allowOuterwear: 'smart',
      allowWatch: true,
      allowBoldAccent: false,
      preferBag: true,
    },
    {
      id: 'classic_office',
      label: 'Classic office',
      structure: 'separates',
      paletteModes: ['monochrome', 'monochrome', 'tonal'],
      topCategories: ['blouse', 'shirt'],
      topTypes: ['gomlek'],
      bottomCategories: ['tailored_trousers', 'skirt'],
      bottomTypes: ['pantolon', 'etek'],
      onePieceCategories: [],
      onePieceTypes: [],
      shoeCategories: ['loafer', 'heel', 'flat'],
      shoeTypes: ['topuklu', 'ayakkabi'],
      avoidCategories: ['jeans', 'shorts', 'sneaker', 'sandal', 'sunglasses'],
      avoidTypes: ['jean', 'sort', 'tisort', 'gozluk'],
      maxFormality: 0.92,
      allowOuterwear: 'smart',
      allowWatch: true,
      allowBoldAccent: false,
      preferBag: true,
    },
    {
      id: 'soft_office',
      label: 'Soft office',
      structure: 'separates',
      paletteModes: ['tonal', 'neutral_plus_accent', 'tonal'],
      topCategories: ['blouse', 'shirt', 'sweater'],
      topTypes: ['gomlek', 'kazak'],
      bottomCategories: ['tailored_trousers', 'skirt', 'jeans'],
      bottomTypes: ['pantolon', 'etek', 'jean'],
      onePieceCategories: [],
      onePieceTypes: [],
      shoeCategories: ['loafer', 'flat', 'boot'],
      shoeTypes: ['ayakkabi', 'bot'],
      avoidCategories: ['shorts', 'crop_top', 'sandal', 'sunglasses'],
      avoidTypes: ['sort', 'hoodie', 'gozluk'],
      maxFormality: 0.78,
      allowOuterwear: 'weather',
      allowWatch: true,
      allowBoldAccent: false,
      preferBag: true,
    },
  ],
  dinner: [
    {
      id: 'elegant_dress',
      label: 'Elegant dress',
      structure: 'one_piece',
      paletteModes: ['monochrome', 'monochrome', 'neutral_plus_accent'],
      topCategories: [],
      topTypes: [],
      bottomCategories: [],
      bottomTypes: [],
      onePieceCategories: ['evening_dress', 'midi_dress', 'office_dress'],
      onePieceTypes: ['elbise', 'takim'],
      shoeCategories: ['heel', 'boot', 'loafer'],
      shoeTypes: ['topuklu', 'bot'],
      avoidCategories: ['shorts', 'sneaker', 't_shirt'],
      avoidTypes: ['sort', 'tisort', 'ayakkabi'],
      maxFormality: 0.95,
      allowOuterwear: 'weather',
      allowWatch: false,
      allowBoldAccent: true,
      preferBag: true,
    },
    {
      id: 'blouse_and_skirt',
      label: 'Blouse and skirt',
      structure: 'separates',
      paletteModes: ['monochrome', 'complementary', 'neutral_plus_accent'],
      topCategories: ['blouse', 'shirt'],
      topTypes: ['gomlek'],
      bottomCategories: ['skirt'],
      bottomTypes: ['etek'],
      onePieceCategories: [],
      onePieceTypes: [],
      shoeCategories: ['heel', 'loafer', 'boot'],
      shoeTypes: ['topuklu', 'bot'],
      avoidCategories: ['jeans', 'shorts', 'sneaker'],
      avoidTypes: ['jean', 'sort'],
      maxFormality: 0.88,
      allowOuterwear: 'weather',
      allowWatch: false,
      allowBoldAccent: true,
      preferBag: true,
    },
    {
      id: 'blouse_and_trousers',
      label: 'Blouse and trousers',
      structure: 'separates',
      paletteModes: ['monochrome', 'monochrome', 'tonal'],
      topCategories: ['blouse', 'shirt'],
      topTypes: ['gomlek'],
      bottomCategories: ['tailored_trousers'],
      bottomTypes: ['pantolon'],
      onePieceCategories: [],
      onePieceTypes: [],
      shoeCategories: ['heel', 'loafer', 'boot'],
      shoeTypes: ['topuklu', 'bot'],
      avoidCategories: ['jeans', 'shorts'],
      avoidTypes: ['jean', 'sort'],
      maxFormality: 0.9,
      allowOuterwear: 'weather',
      allowWatch: false,
      allowBoldAccent: false,
      preferBag: true,
    },
  ],
  date: [
    {
      id: 'romantic_dress',
      label: 'Romantic dress',
      structure: 'one_piece',
      paletteModes: ['tonal', 'neutral_plus_accent', 'monochrome'],
      topCategories: [],
      topTypes: [],
      bottomCategories: [],
      bottomTypes: [],
      onePieceCategories: ['evening_dress', 'midi_dress', 'summer_dress'],
      onePieceTypes: ['elbise'],
      shoeCategories: ['heel', 'boot', 'loafer'],
      shoeTypes: ['topuklu', 'bot'],
      avoidCategories: ['sneaker', 'shorts'],
      avoidTypes: ['ayakkabi', 'sort'],
      maxFormality: 0.9,
      allowOuterwear: 'weather',
      allowWatch: false,
      allowBoldAccent: true,
      preferBag: true,
    },
    {
      id: 'soft_blouse_skirt',
      label: 'Soft blouse skirt',
      structure: 'separates',
      paletteModes: ['tonal', 'analogous', 'neutral_plus_accent'],
      topCategories: ['blouse', 'shirt'],
      topTypes: ['gomlek'],
      bottomCategories: ['skirt'],
      bottomTypes: ['etek'],
      onePieceCategories: [],
      onePieceTypes: [],
      shoeCategories: ['heel', 'loafer', 'flat'],
      shoeTypes: ['topuklu', 'ayakkabi'],
      avoidCategories: ['jeans', 'shorts', 'sneaker'],
      avoidTypes: ['jean', 'sort'],
      maxFormality: 0.82,
      allowOuterwear: 'weather',
      allowWatch: false,
      allowBoldAccent: true,
      preferBag: true,
    },
    {
      id: 'elevated_casual',
      label: 'Elevated casual',
      structure: 'separates',
      paletteModes: ['neutral_plus_accent', 'complementary', 'tonal'],
      topCategories: ['blouse', 'shirt', 'sweater'],
      topTypes: ['gomlek', 'kazak'],
      bottomCategories: ['jeans', 'skirt', 'tailored_trousers'],
      bottomTypes: ['jean', 'etek', 'pantolon'],
      onePieceCategories: [],
      onePieceTypes: [],
      shoeCategories: ['heel', 'loafer', 'boot'],
      shoeTypes: ['topuklu', 'bot', 'ayakkabi'],
      avoidCategories: ['shorts', 'sneaker'],
      avoidTypes: ['sort'],
      maxFormality: 0.75,
      allowOuterwear: 'weather',
      allowWatch: false,
      allowBoldAccent: false,
      preferBag: true,
    },
  ],
  beach: [
    {
      id: 'summer_dress',
      label: 'Summer dress',
      structure: 'one_piece',
      paletteModes: ['analogous', 'tonal', 'analogous'],
      topCategories: [],
      topTypes: [],
      bottomCategories: [],
      bottomTypes: [],
      onePieceCategories: ['summer_dress', 'midi_dress'],
      onePieceTypes: ['elbise'],
      shoeCategories: ['sandal', 'flat', 'sneaker'],
      shoeTypes: ['ayakkabi'],
      avoidCategories: ['blazer', 'heel', 'boot', 'coat'],
      avoidTypes: ['topuklu', 'ceket', 'kaban'],
      maxFormality: 0.55,
      allowOuterwear: 'never',
      allowWatch: false,
      allowBoldAccent: true,
      preferBag: true,
    },
    {
      id: 'crop_or_tshirt_shorts',
      label: 'Light top shorts',
      structure: 'separates',
      paletteModes: ['analogous', 'analogous', 'neutral_plus_accent'],
      topCategories: ['t_shirt', 'crop_top', 'blouse'],
      topTypes: ['tisort', 'gomlek'],
      bottomCategories: ['shorts', 'skirt'],
      bottomTypes: ['sort', 'etek'],
      onePieceCategories: [],
      onePieceTypes: [],
      shoeCategories: ['sandal', 'sneaker', 'flat'],
      shoeTypes: ['ayakkabi'],
      avoidCategories: ['blazer', 'heel', 'boot', 'coat'],
      avoidTypes: ['topuklu', 'ceket'],
      maxFormality: 0.48,
      allowOuterwear: 'never',
      allowWatch: false,
      allowBoldAccent: true,
      preferBag: false,
    },
    {
      id: 'light_skirt_sandals',
      label: 'Light skirt sandals',
      structure: 'separates',
      paletteModes: ['analogous', 'tonal'],
      topCategories: ['blouse', 't_shirt', 'crop_top'],
      topTypes: ['gomlek', 'tisort'],
      bottomCategories: ['skirt', 'shorts'],
      bottomTypes: ['etek', 'sort'],
      onePieceCategories: [],
      onePieceTypes: [],
      shoeCategories: ['sandal', 'flat', 'sneaker'],
      shoeTypes: ['ayakkabi'],
      avoidCategories: ['blazer', 'heel', 'boot'],
      avoidTypes: ['topuklu'],
      maxFormality: 0.52,
      allowOuterwear: 'never',
      allowWatch: false,
      allowBoldAccent: true,
      preferBag: true,
    },
  ],
  vacation: [
    {
      id: 'relaxed_summer',
      label: 'Relaxed summer',
      structure: 'either',
      paletteModes: ['analogous', 'analogous', 'analogous'],
      topCategories: ['t_shirt', 'blouse', 'crop_top'],
      topTypes: ['tisort', 'gomlek'],
      bottomCategories: ['shorts', 'skirt', 'jeans'],
      bottomTypes: ['sort', 'etek', 'jean'],
      onePieceCategories: ['summer_dress', 'midi_dress'],
      onePieceTypes: ['elbise'],
      shoeCategories: ['sandal', 'sneaker', 'flat'],
      shoeTypes: ['ayakkabi'],
      avoidCategories: ['blazer', 'heel', 'coat'],
      avoidTypes: ['topuklu', 'ceket'],
      maxFormality: 0.55,
      allowOuterwear: 'weather',
      allowWatch: false,
      allowBoldAccent: true,
      preferBag: true,
    },
    {
      id: 'travel_day_comfort',
      label: 'Travel day comfort',
      structure: 'separates',
      paletteModes: ['neutral_plus_accent', 'tonal', 'tonal'],
      topCategories: ['t_shirt', 'blouse', 'sweater'],
      topTypes: ['tisort', 'gomlek', 'kazak'],
      bottomCategories: ['jeans', 'tailored_trousers', 'shorts'],
      bottomTypes: ['jean', 'pantolon', 'sort'],
      onePieceCategories: [],
      onePieceTypes: [],
      shoeCategories: ['sneaker', 'flat', 'loafer', 'boot'],
      shoeTypes: ['ayakkabi', 'bot'],
      avoidCategories: ['heel', 'evening_dress'],
      avoidTypes: ['topuklu'],
      maxFormality: 0.58,
      allowOuterwear: 'weather',
      allowWatch: false,
      allowBoldAccent: false,
      preferBag: true,
    },
    {
      id: 'resort_casual',
      label: 'Resort casual',
      structure: 'either',
      paletteModes: ['analogous', 'tonal', 'analogous'],
      topCategories: ['blouse', 't_shirt', 'shirt'],
      topTypes: ['gomlek', 'tisort'],
      bottomCategories: ['skirt', 'shorts', 'jeans'],
      bottomTypes: ['etek', 'sort', 'jean'],
      onePieceCategories: ['summer_dress'],
      onePieceTypes: ['elbise'],
      shoeCategories: ['sandal', 'flat', 'sneaker'],
      shoeTypes: ['ayakkabi'],
      avoidCategories: ['blazer', 'boot', 'heel'],
      avoidTypes: ['topuklu', 'ceket'],
      maxFormality: 0.52,
      allowOuterwear: 'never',
      allowWatch: false,
      allowBoldAccent: true,
      preferBag: true,
    },
  ],
  wedding: [
    {
      id: 'elegant_dress_wedding',
      label: 'Elegant dress',
      structure: 'one_piece',
      paletteModes: ['monochrome', 'monochrome', 'neutral_plus_accent'],
      topCategories: [],
      topTypes: [],
      bottomCategories: [],
      bottomTypes: [],
      onePieceCategories: ['evening_dress', 'midi_dress', 'office_dress'],
      onePieceTypes: ['elbise', 'takim'],
      shoeCategories: ELEGANT_SHOES,
      shoeTypes: ['topuklu', 'ayakkabi'],
      avoidCategories: ['jeans', 'shorts', 'sneaker', 't_shirt', 'sandal', 'loafer', 'boot', 'sunglasses'],
      avoidTypes: ['jean', 'sort', 'tisort', 'gozluk', 'bot'],
      maxFormality: 0.98,
      allowOuterwear: 'weather',
      allowWatch: false,
      allowBoldAccent: false,
      preferBag: true,
    },
    {
      id: 'evening_dress',
      label: 'Evening dress',
      structure: 'one_piece',
      paletteModes: ['monochrome', 'complementary'],
      topCategories: [],
      topTypes: [],
      bottomCategories: [],
      bottomTypes: [],
      onePieceCategories: ['evening_dress'],
      onePieceTypes: ['elbise'],
      shoeCategories: ['heel'],
      shoeTypes: ['topuklu'],
      avoidCategories: ['sneaker', 'jeans', 'shorts', 'sandal', 'loafer', 'boot', 'sunglasses'],
      avoidTypes: ['ayakkabi', 'jean', 'bot', 'gozluk'],
      maxFormality: 0.98,
      allowOuterwear: 'weather',
      allowWatch: false,
      allowBoldAccent: true,
      preferBag: true,
    },
    {
      id: 'refined_set',
      label: 'Refined set',
      structure: 'one_piece',
      paletteModes: ['monochrome', 'tonal'],
      topCategories: [],
      topTypes: [],
      bottomCategories: [],
      bottomTypes: [],
      onePieceCategories: ['matching_set', 'office_dress', 'midi_dress'],
      onePieceTypes: ['takim', 'elbise'],
      shoeCategories: ELEGANT_SHOES,
      shoeTypes: ['topuklu', 'ayakkabi'],
      avoidCategories: ['jeans', 'shorts', 'sandal', 'sneaker', 'loafer', 'boot', 'sunglasses'],
      avoidTypes: ['jean', 'sort', 'gozluk', 'bot'],
      maxFormality: 0.95,
      allowOuterwear: 'weather',
      allowWatch: false,
      allowBoldAccent: false,
      preferBag: true,
    },
  ],
  sport_walk: [
    {
      id: 'walking_comfort',
      label: 'Walking comfort',
      structure: 'separates',
      paletteModes: ['neutral_plus_accent', 'tonal', 'tonal'],
      topCategories: ['t_shirt', 'blouse', 'sweater', 'shirt'],
      topTypes: ['tisort', 'gomlek', 'kazak'],
      bottomCategories: ['jeans', 'shorts', 'tailored_trousers'],
      bottomTypes: ['jean', 'sort', 'pantolon', 'tayt'],
      onePieceCategories: [],
      onePieceTypes: [],
      shoeCategories: ['sneaker', 'flat', 'boot'],
      shoeTypes: ['ayakkabi', 'bot'],
      avoidCategories: ['heel', 'evening_dress', 'blazer'],
      avoidTypes: ['topuklu', 'ceket'],
      maxFormality: 0.55,
      allowOuterwear: 'weather',
      allowWatch: false,
      allowBoldAccent: false,
      preferBag: false,
    },
  ],
  shopping: [
    {
      id: 'practical_daily',
      label: 'Practical daily',
      structure: 'separates',
      paletteModes: ['neutral_plus_accent', 'tonal', 'analogous'],
      topCategories: ['t_shirt', 'blouse', 'shirt', 'sweater'],
      topTypes: ['tisort', 'gomlek', 'kazak'],
      bottomCategories: ['jeans', 'skirt', 'shorts', 'tailored_trousers'],
      bottomTypes: ['jean', 'etek', 'sort', 'pantolon'],
      onePieceCategories: [],
      onePieceTypes: [],
      shoeCategories: ['sneaker', 'loafer', 'flat', 'sandal'],
      shoeTypes: ['ayakkabi', 'bot'],
      avoidCategories: ['heel', 'evening_dress', 'blazer'],
      avoidTypes: ['topuklu', 'ceket'],
      maxFormality: 0.58,
      allowOuterwear: 'weather',
      allowWatch: false,
      allowBoldAccent: false,
      preferBag: true,
    },
  ],
  travel: [
    {
      id: 'travel_day_comfort',
      label: 'Travel day comfort',
      structure: 'separates',
      paletteModes: ['neutral_plus_accent', 'tonal', 'tonal'],
      topCategories: ['t_shirt', 'blouse', 'sweater', 'shirt'],
      topTypes: ['tisort', 'gomlek', 'kazak'],
      bottomCategories: ['jeans', 'tailored_trousers', 'shorts'],
      bottomTypes: ['jean', 'pantolon', 'sort'],
      onePieceCategories: [],
      onePieceTypes: [],
      shoeCategories: ['sneaker', 'flat', 'loafer', 'boot'],
      shoeTypes: ['ayakkabi', 'bot'],
      avoidCategories: ['heel', 'evening_dress', 'sandal'],
      avoidTypes: ['topuklu'],
      maxFormality: 0.6,
      allowOuterwear: 'weather',
      allowWatch: false,
      allowBoldAccent: false,
      preferBag: true,
    },
    {
      id: 'relaxed_summer_travel',
      label: 'Relaxed travel',
      structure: 'either',
      paletteModes: ['analogous', 'analogous'],
      topCategories: ['t_shirt', 'blouse'],
      topTypes: ['tisort', 'gomlek'],
      bottomCategories: ['jeans', 'shorts', 'skirt'],
      bottomTypes: ['jean', 'sort', 'etek'],
      onePieceCategories: ['summer_dress'],
      onePieceTypes: ['elbise'],
      shoeCategories: ['sneaker', 'flat', 'loafer', 'boot'],
      shoeTypes: ['ayakkabi', 'bot'],
      avoidCategories: ['heel', 'blazer', 'sandal'],
      avoidTypes: ['topuklu', 'ceket'],
      maxFormality: 0.55,
      allowOuterwear: 'weather',
      allowWatch: false,
      allowBoldAccent: false,
      preferBag: true,
    },
  ],
  family_visit: [
    {
      id: 'soft_smart_casual',
      label: 'Soft smart casual',
      structure: 'separates',
      paletteModes: ['analogous', 'neutral_plus_accent', 'tonal'],
      topCategories: ['blouse', 'shirt', 'sweater'],
      topTypes: ['gomlek', 'kazak'],
      bottomCategories: ['jeans', 'skirt', 'tailored_trousers'],
      bottomTypes: ['jean', 'etek', 'pantolon'],
      onePieceCategories: ['midi_dress'],
      onePieceTypes: ['elbise'],
      shoeCategories: ['loafer', 'flat', 'sneaker', 'boot'],
      shoeTypes: ['ayakkabi', 'bot'],
      avoidCategories: ['evening_dress', 'heel'],
      avoidTypes: ['topuklu'],
      maxFormality: 0.72,
      allowOuterwear: 'weather',
      allowWatch: false,
      allowBoldAccent: false,
      preferBag: true,
    },
    {
      id: 'modest_romantic',
      label: 'Modest romantic',
      structure: 'either',
      paletteModes: ['tonal', 'analogous', 'neutral_plus_accent'],
      topCategories: ['blouse', 'sweater'],
      topTypes: ['gomlek', 'kazak'],
      bottomCategories: ['skirt', 'tailored_trousers'],
      bottomTypes: ['etek', 'pantolon'],
      onePieceCategories: ['midi_dress'],
      onePieceTypes: ['elbise'],
      shoeCategories: ['loafer', 'flat', 'boot'],
      shoeTypes: ['ayakkabi', 'bot'],
      avoidCategories: ['shorts', 'crop_top'],
      avoidTypes: ['sort'],
      maxFormality: 0.75,
      allowOuterwear: 'weather',
      allowWatch: false,
      allowBoldAccent: false,
      preferBag: true,
    },
    {
      id: 'clean_daily',
      label: 'Clean daily',
      structure: 'separates',
      paletteModes: ['monochrome', 'tonal', 'tonal'],
      topCategories: ['blouse', 'shirt', 't_shirt'],
      topTypes: ['gomlek', 'tisort'],
      bottomCategories: ['jeans', 'skirt', 'tailored_trousers'],
      bottomTypes: ['jean', 'etek', 'pantolon'],
      onePieceCategories: [],
      onePieceTypes: [],
      shoeCategories: ['loafer', 'sneaker', 'flat'],
      shoeTypes: ['ayakkabi', 'bot'],
      avoidCategories: ['evening_dress', 'heel'],
      avoidTypes: ['topuklu'],
      maxFormality: 0.65,
      allowOuterwear: 'weather',
      allowWatch: false,
      allowBoldAccent: false,
      preferBag: true,
    },
  ],
};

export const CASUAL_OCCASIONS = new Set<SelectedOccasionId>([
  'daily',
  'coffee',
  'shopping',
  'sport_walk',
]);

export function getConceptsForOccasion(occasion: SelectedOccasionId): OutfitConcept[] {
  return CONCEPTS_BY_OCCASION[occasion] ?? CONCEPTS_BY_OCCASION.daily;
}

export function isCasualOccasion(occasion?: SelectedOccasionId): boolean {
  return occasion != null && CASUAL_OCCASIONS.has(occasion);
}

export function selectOutfitConcept(params: {
  occasion?: SelectedOccasionId;
  weather?: WeatherSnapshot;
  seed: number;
  attempt: number;
  regenerate?: boolean;
  previousConceptId?: OutfitConceptId;
}): OutfitConcept {
  const occasion = params.occasion ?? 'daily';
  let concepts = [...getConceptsForOccasion(occasion)];

  const hot = params.weather && params.weather.temperature >= 26;
  const cool = params.weather && (params.weather.temperature <= 16 || params.weather.needsOuterwear);

  if (hot && (occasion === 'daily' || occasion === 'coffee')) {
    concepts = concepts.sort((a, b) => {
      const aSummer = a.id.includes('summer') || a.id.includes('denim') || a.id.includes('relaxed') ? -1 : 0;
      const bSummer = b.id.includes('summer') || b.id.includes('denim') || b.id.includes('relaxed') ? -1 : 0;
      return aSummer - bSummer;
    });
  }

  if (cool) {
    concepts = concepts.filter((c) => c.allowOuterwear !== 'never' || c.structure === 'separates');
  }

  if (params.regenerate && params.previousConceptId) {
    const withoutPrevious = concepts.filter((c) => c.id !== params.previousConceptId);
    if (withoutPrevious.length > 0) {
      concepts = withoutPrevious;
    } else {
      const prevIdx = concepts.findIndex((c) => c.id === params.previousConceptId);
      if (prevIdx >= 0) {
        concepts = [...concepts.slice(prevIdx + 1), ...concepts.slice(0, prevIdx + 1)];
      }
    }
  }

  const index = params.regenerate
    ? params.attempt % concepts.length
    : (params.seed + params.attempt * 11) % concepts.length;
  return concepts[index] ?? concepts[0];
}

export function resolveConceptStructure(
  concept: OutfitConcept,
  pools: { onePieces: unknown[]; tops: unknown[]; bottoms: unknown[] },
  seed: number,
  options?: { regenerate?: boolean; previousWasOnePiece?: boolean },
): OutfitStructure {
  if (options?.regenerate) {
    if (options.previousWasOnePiece && pools.tops.length > 0 && pools.bottoms.length > 0) {
      return 'separates';
    }
    if (!options.previousWasOnePiece && pools.onePieces.length > 0 && concept.structure !== 'separates') {
      return seed % 2 === 0 ? 'one_piece' : 'separates';
    }
  }

  if (concept.structure === 'one_piece') {
    return pools.onePieces.length > 0 ? 'one_piece' : 'separates';
  }
  if (concept.structure === 'separates') {
    if (pools.tops.length === 0 && pools.onePieces.length > 0) return 'one_piece';
    return 'separates';
  }
  if (pools.onePieces.length > 0 && seed % 3 !== 2) return 'one_piece';
  return 'separates';
}

export function scoreItemForConcept(
  item: WardrobeItem,
  concept: OutfitConcept,
  role: 'top' | 'bottom' | 'one_piece' | 'shoes' | 'bag' | 'outerwear' | 'accessory',
): number {
  const profile = getEffectiveStyleProfile(item);
  const category = hasUserWardrobeMetadata(item)
    ? authoritativeProductCategory(item)
    : profile.category;
  let score = 0;

  const cats =
    role === 'top'
      ? concept.topCategories
      : role === 'bottom'
        ? concept.bottomCategories
        : role === 'one_piece'
          ? concept.onePieceCategories
          : role === 'shoes'
            ? concept.shoeCategories
            : [];

  const types =
    role === 'top'
      ? concept.topTypes
      : role === 'bottom'
        ? concept.bottomTypes
        : role === 'one_piece'
          ? concept.onePieceTypes
          : role === 'shoes'
            ? concept.shoeTypes
            : [];

  if (cats.includes(category)) score += hasUserWardrobeMetadata(item) ? 14 : 10;
  else if (!hasUserWardrobeMetadata(item) && types.includes(item.itemType)) score += 7;
  else if (cats.length === 0 && types.length === 0) score += 2;
  else score -= hasUserWardrobeMetadata(item) ? 10 : 6;

  if (concept.avoidCategories.includes(category)) score -= 22;
  if (!hasUserWardrobeMetadata(item) && concept.avoidTypes.includes(item.itemType)) score -= 18;

  const formality = profile.formality === 'formal' ? 0.95 : profile.formality === 'elegant' ? 0.85 : profile.formality === 'office' ? 0.8 : profile.formality === 'smart_casual' ? 0.65 : profile.formality === 'casual' ? 0.4 : 0.5;
  if (formality > concept.maxFormality + 0.08) score -= 12;
  if (formality <= concept.maxFormality) score += 3;

  if (OFFICE_HEAVY_CATEGORIES.has(profile.category) && concept.maxFormality < 0.7) {
    score -= 16;
  }

  return score;
}

export function conceptAllowsOuterwear(
  concept: OutfitConcept,
  weather: WeatherSnapshot | undefined,
  intent: string,
  hasRealTopUnder: boolean,
): boolean {
  if (concept.allowOuterwear === 'never') return false;
  if (!weather) return concept.allowOuterwear === 'smart' && hasRealTopUnder;
  const hot = weather.temperature >= HOT_WEATHER_HARD_C && !weather.isRainy;
  if (hot) return false;
  const needs =
    weather.needsOuterwear ||
    weather.temperature <= 14 ||
    weather.isRainy ||
    ['rain', 'drizzle', 'snow'].includes(weather.condition);
  if (!needs && concept.allowOuterwear !== 'smart') return false;
  if (concept.allowOuterwear === 'smart') return hasRealTopUnder && (needs || weather.temperature <= 18);
  return needs && hasRealTopUnder;
}

export function isDressRuiningOuterwear(item: WardrobeItem, weather?: WeatherSnapshot): boolean {
  if (!isLayerPieceItem(item)) return false;
  return !layerPieceAllowedInContext(item, weather, true);
}

export function logOutfitConceptDebug(payload: {
  occasion?: SelectedOccasionId;
  weatherTemp?: number;
  chosenConcept: string;
  structure: string;
  paletteMode: string;
  paletteColors: string;
  coreItems: string;
  finishingItems: string;
  rejectedReason?: string;
}): void {
  if (!__DEV__ && !isQaTestMode()) return;
  console.log(
    [
      '[Stylove Concept]',
      `occasion=${payload.occasion ?? 'none'}`,
      `weatherTemp=${payload.weatherTemp ?? 'none'}`,
      `chosenConcept=${payload.chosenConcept}`,
      `structure=${payload.structure}`,
      `paletteMode=${payload.paletteMode}`,
      `paletteColors=${payload.paletteColors}`,
      `coreItems=${payload.coreItems}`,
      `finishingItems=${payload.finishingItems}`,
      payload.rejectedReason ? `rejectedReason=${payload.rejectedReason}` : undefined,
    ]
      .filter(Boolean)
      .join('\n'),
  );
}
