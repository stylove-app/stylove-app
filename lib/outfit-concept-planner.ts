import { isQaTestMode } from '@/lib/qa-test-mode';
import type { WardrobeItemTypeId } from '@/i18n/types';
import type { SelectedOccasionId } from '@/lib/selected-occasion';
import { getEffectiveStyleProfile } from '@/lib/wardrobe-style-profile';
import type { WardrobeItem } from '@/lib/outfit-engine';
import type { PaletteMode } from '@/lib/outfit-palette-planner';
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

const CASUAL_TOP_CATS = ['t_shirt', 'blouse', 'shirt', 'crop_top', 'sweater', 'cardigan'];
const CASUAL_BOTTOM_CATS = ['jeans', 'skirt', 'shorts', 'tailored_trousers'];
const CASUAL_SHOES = ['sneaker', 'flat', 'sandal', 'loafer', 'boot'];

const CONCEPTS_BY_OCCASION: Record<SelectedOccasionId, OutfitConcept[]> = {
  daily: [
    {
      id: 'relaxed_daily',
      label: 'Relaxed daily',
      structure: 'separates',
      paletteModes: ['neutral_accent', 'tonal', 'summer_light', 'cool_classic'],
      topCategories: CASUAL_TOP_CATS,
      topTypes: ['tisort', 'gomlek', 'kazak'],
      bottomCategories: ['jeans', 'skirt', 'shorts', 'tailored_trousers'],
      bottomTypes: ['jean', 'etek', 'pantolon', 'sort'],
      onePieceCategories: [],
      onePieceTypes: [],
      shoeCategories: CASUAL_SHOES,
      shoeTypes: ['ayakkabi', 'bot'],
      avoidCategories: ['blazer', 'coat', 'trench', 'heel', 'evening_dress', 'office_dress'],
      avoidTypes: ['topuklu', 'ceket', 'trenchcoat', 'kaban'],
      maxFormality: 0.62,
      allowOuterwear: 'weather',
      allowWatch: false,
      allowBoldAccent: true,
      preferBag: true,
    },
    {
      id: 'summer_daily',
      label: 'Summer daily',
      structure: 'either',
      paletteModes: ['summer_light', 'soft_pastel', 'analogous', 'neutral_accent'],
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
      paletteModes: ['monochrome', 'tonal', 'neutral_accent', 'cool_classic'],
      topCategories: ['blouse', 'shirt', 'sweater', 't_shirt'],
      topTypes: ['gomlek', 'kazak', 'tisort'],
      bottomCategories: ['jeans', 'tailored_trousers', 'skirt'],
      bottomTypes: ['jean', 'pantolon', 'etek'],
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
      paletteModes: ['neutral_accent', 'cool_classic', 'tonal'],
      topCategories: ['blouse', 'shirt', 'sweater', 't_shirt'],
      topTypes: ['gomlek', 'kazak', 'tisort'],
      bottomCategories: ['jeans', 'skirt', 'tailored_trousers'],
      bottomTypes: ['jean', 'etek', 'pantolon'],
      onePieceCategories: ['midi_dress'],
      onePieceTypes: ['elbise'],
      shoeCategories: ['loafer', 'sneaker', 'flat', 'boot'],
      shoeTypes: ['ayakkabi', 'bot'],
      avoidCategories: ['evening_dress', 'heel'],
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
      paletteModes: ['complementary', 'neutral_accent', 'cool_classic'],
      topCategories: ['blouse', 'shirt', 't_shirt', 'sweater'],
      topTypes: ['gomlek', 'tisort', 'kazak'],
      bottomCategories: ['jeans'],
      bottomTypes: ['jean'],
      onePieceCategories: [],
      onePieceTypes: [],
      shoeCategories: ['sneaker', 'loafer', 'flat', 'boot'],
      shoeTypes: ['ayakkabi', 'bot'],
      avoidCategories: ['blazer', 'heel', 'evening_dress'],
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
      paletteModes: ['monochrome', 'tonal', 'soft_pastel'],
      topCategories: ['blouse', 'shirt', 'sweater'],
      topTypes: ['gomlek', 'kazak'],
      bottomCategories: ['tailored_trousers', 'skirt', 'jeans'],
      bottomTypes: ['pantolon', 'etek', 'jean'],
      onePieceCategories: ['midi_dress'],
      onePieceTypes: ['elbise'],
      shoeCategories: ['loafer', 'flat', 'sneaker'],
      shoeTypes: ['ayakkabi', 'bot'],
      avoidCategories: ['blazer', 'heel'],
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
      paletteModes: ['cool_classic', 'dark_elegant', 'neutral_accent', 'monochrome'],
      topCategories: ['blouse', 'shirt', 'sweater'],
      topTypes: ['gomlek', 'kazak'],
      bottomCategories: ['tailored_trousers', 'skirt'],
      bottomTypes: ['pantolon', 'etek'],
      onePieceCategories: ['office_dress', 'midi_dress'],
      onePieceTypes: ['elbise'],
      shoeCategories: ['loafer', 'heel', 'flat', 'boot'],
      shoeTypes: ['topuklu', 'ayakkabi', 'bot'],
      avoidCategories: ['shorts', 'crop_top', 't_shirt'],
      avoidTypes: ['sort', 'tisort', 'hoodie', 'sweatshirt'],
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
      paletteModes: ['dark_elegant', 'monochrome', 'cool_classic'],
      topCategories: ['blouse', 'shirt'],
      topTypes: ['gomlek'],
      bottomCategories: ['tailored_trousers', 'skirt'],
      bottomTypes: ['pantolon', 'etek'],
      onePieceCategories: [],
      onePieceTypes: [],
      shoeCategories: ['loafer', 'heel', 'flat'],
      shoeTypes: ['topuklu', 'ayakkabi'],
      avoidCategories: ['jeans', 'shorts', 'sneaker'],
      avoidTypes: ['jean', 'sort', 'tisort'],
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
      paletteModes: ['tonal', 'neutral_accent', 'soft_pastel'],
      topCategories: ['blouse', 'shirt', 'sweater'],
      topTypes: ['gomlek', 'kazak'],
      bottomCategories: ['tailored_trousers', 'skirt', 'jeans'],
      bottomTypes: ['pantolon', 'etek', 'jean'],
      onePieceCategories: [],
      onePieceTypes: [],
      shoeCategories: ['loafer', 'flat', 'boot'],
      shoeTypes: ['ayakkabi', 'bot'],
      avoidCategories: ['shorts', 'crop_top'],
      avoidTypes: ['sort', 'hoodie'],
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
      paletteModes: ['dark_elegant', 'monochrome', 'neutral_accent'],
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
      paletteModes: ['dark_elegant', 'complementary', 'neutral_accent'],
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
      paletteModes: ['dark_elegant', 'monochrome', 'cool_classic'],
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
      paletteModes: ['soft_pastel', 'neutral_accent', 'dark_elegant'],
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
      paletteModes: ['soft_pastel', 'analogous', 'neutral_accent'],
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
      paletteModes: ['neutral_accent', 'complementary', 'tonal'],
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
      paletteModes: ['summer_light', 'soft_pastel', 'analogous'],
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
      paletteModes: ['summer_light', 'analogous', 'neutral_accent'],
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
      paletteModes: ['summer_light', 'soft_pastel'],
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
      paletteModes: ['summer_light', 'warm_earthy', 'analogous'],
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
      paletteModes: ['neutral_accent', 'tonal', 'cool_classic'],
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
      paletteModes: ['summer_light', 'soft_pastel', 'warm_earthy'],
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
      paletteModes: ['dark_elegant', 'monochrome', 'neutral_accent'],
      topCategories: [],
      topTypes: [],
      bottomCategories: [],
      bottomTypes: [],
      onePieceCategories: ['evening_dress', 'midi_dress', 'office_dress'],
      onePieceTypes: ['elbise', 'takim'],
      shoeCategories: ['heel', 'loafer', 'boot'],
      shoeTypes: ['topuklu', 'bot'],
      avoidCategories: ['jeans', 'shorts', 'sneaker', 't_shirt'],
      avoidTypes: ['jean', 'sort', 'tisort'],
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
      paletteModes: ['dark_elegant', 'complementary'],
      topCategories: [],
      topTypes: [],
      bottomCategories: [],
      bottomTypes: [],
      onePieceCategories: ['evening_dress'],
      onePieceTypes: ['elbise'],
      shoeCategories: ['heel', 'boot'],
      shoeTypes: ['topuklu', 'bot'],
      avoidCategories: ['sneaker', 'jeans', 'shorts'],
      avoidTypes: ['ayakkabi', 'jean'],
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
      paletteModes: ['dark_elegant', 'cool_classic'],
      topCategories: [],
      topTypes: [],
      bottomCategories: [],
      bottomTypes: [],
      onePieceCategories: ['matching_set', 'office_dress', 'midi_dress'],
      onePieceTypes: ['takim', 'elbise'],
      shoeCategories: ['heel', 'loafer'],
      shoeTypes: ['topuklu', 'ayakkabi'],
      avoidCategories: ['jeans', 'shorts'],
      avoidTypes: ['jean', 'sort'],
      maxFormality: 0.95,
      allowOuterwear: 'weather',
      allowWatch: true,
      allowBoldAccent: false,
      preferBag: true,
    },
  ],
  sport_walk: [
    {
      id: 'walking_comfort',
      label: 'Walking comfort',
      structure: 'separates',
      paletteModes: ['neutral_accent', 'tonal', 'cool_classic'],
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
      paletteModes: ['neutral_accent', 'tonal', 'summer_light'],
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
      paletteModes: ['neutral_accent', 'tonal', 'cool_classic'],
      topCategories: ['t_shirt', 'blouse', 'sweater', 'shirt'],
      topTypes: ['tisort', 'gomlek', 'kazak'],
      bottomCategories: ['jeans', 'tailored_trousers', 'shorts'],
      bottomTypes: ['jean', 'pantolon', 'sort'],
      onePieceCategories: [],
      onePieceTypes: [],
      shoeCategories: ['sneaker', 'flat', 'loafer', 'boot'],
      shoeTypes: ['ayakkabi', 'bot'],
      avoidCategories: ['heel', 'evening_dress'],
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
      paletteModes: ['summer_light', 'warm_earthy'],
      topCategories: ['t_shirt', 'blouse'],
      topTypes: ['tisort', 'gomlek'],
      bottomCategories: ['jeans', 'shorts', 'skirt'],
      bottomTypes: ['jean', 'sort', 'etek'],
      onePieceCategories: ['summer_dress'],
      onePieceTypes: ['elbise'],
      shoeCategories: ['sneaker', 'sandal', 'flat'],
      shoeTypes: ['ayakkabi'],
      avoidCategories: ['heel', 'blazer'],
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
      paletteModes: ['warm_earthy', 'neutral_accent', 'tonal'],
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
      paletteModes: ['soft_pastel', 'warm_earthy', 'neutral_accent'],
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
      paletteModes: ['monochrome', 'tonal', 'cool_classic'],
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

  if (hot && occasion === 'daily') {
    concepts = concepts.sort((a, b) => {
      const aSummer = a.id.includes('summer') ? -1 : 0;
      const bSummer = b.id.includes('summer') ? -1 : 0;
      return aSummer - bSummer;
    });
  }

  if (cool) {
    concepts = concepts.filter((c) => c.allowOuterwear !== 'never' || c.structure === 'separates');
  }

  if (params.regenerate && params.previousConceptId) {
    const prevIdx = concepts.findIndex((c) => c.id === params.previousConceptId);
    if (prevIdx >= 0) {
      const rotated = [...concepts.slice(prevIdx + 1), ...concepts.slice(0, prevIdx + 1)];
      concepts = rotated;
    }
  }

  const index = (params.seed + params.attempt * 11) % concepts.length;
  return concepts[index] ?? concepts[0];
}

export function resolveConceptStructure(
  concept: OutfitConcept,
  pools: { onePieces: unknown[]; tops: unknown[]; bottoms: unknown[] },
  seed: number,
): OutfitStructure {
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

  if (cats.includes(profile.category)) score += 10;
  else if (types.includes(item.itemType)) score += 7;
  else if (cats.length === 0 && types.length === 0) score += 2;
  else score -= 6;

  if (concept.avoidCategories.includes(profile.category)) score -= 22;
  if (concept.avoidTypes.includes(item.itemType)) score -= 18;

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
  const hot = weather.temperature >= 28 && !weather.isRainy;
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

export function isDressRuiningOuterwear(item: WardrobeItem): boolean {
  const profile = getEffectiveStyleProfile(item);
  return (
    profile.category === 'blazer' ||
    profile.category === 'coat' ||
    profile.category === 'jacket' ||
    item.itemType === 'trenchcoat' ||
    item.itemType === 'kaban' ||
    item.itemType === 'mont'
  );
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
