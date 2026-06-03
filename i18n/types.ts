export type Locale = 'en' | 'tr' | 'fr' | 'ar' | 'de' | 'es' | 'it' | 'ru';

export type StyleMoodId = 'elegant' | 'minimal' | 'confident' | 'romantic' | 'dailyChic';

export type MoodId =
  | 'elegant'
  | 'soft'
  | 'confident'
  | 'oldMoney'
  | 'seductive'
  | 'minimal';

export type OccasionId =
  | 'dinner'
  | 'date'
  | 'gala'
  | 'brunch'
  | 'evening'
  | 'meeting';

/** Engine grouping for outfit / travel logic. */
export type WardrobeCategoryId =
  | 'upper'
  | 'outerwear'
  | 'bottom'
  | 'dress'
  | 'shoes'
  | 'bag'
  | 'accessory';

export type WardrobeItemTypeId =
  | 'tisort'
  | 'gomlek'
  | 'kazak'
  | 'sweatshirt'
  | 'hoodie'
  | 'ceket'
  | 'mont'
  | 'trenchcoat'
  | 'kaban'
  | 'pantolon'
  | 'jean'
  | 'sort'
  | 'tayt'
  | 'etek'
  | 'elbise'
  | 'takim'
  | 'ayakkabi'
  | 'bot'
  | 'topuklu'
  | 'canta'
  | 'saat'
  | 'kemer'
  | 'sapka'
  | 'gozluk'
  | 'aksesuar';

export type OutfitVariant = 'default' | 'elegant' | 'feminine' | 'minimal';

export type TravelVibeId =
  | 'cityExplore'
  | 'romanticEscape'
  | 'businessTrip'
  | 'beachClub'
  | 'luxuryEscape'
  | 'minimalTravel';

import type { StylovePushKind } from '@/lib/notifications/types';
export type { StylovePushKind } from '@/lib/notifications/types';
export type NotificationActionId = 'aura' | 'savedLook' | 'fragrance';

export type TranslationKeys = {
  common: {
    continue: string;
    save: string;
    cancel: string;
    decline: string;
    seeAll: string;
    upload: string;
    remove: string;
    close: string;
  };
  welcome: {
    tagline: string;
  };
  onboarding: {
    step1Title: string;
    step1Subtitle: string;
    step2Title: string;
    step2Subtitle: string;
    step3Title: string;
    step3Subtitle: string;
    cta: string;
    skip: string;
    firstLaunch: {
      languageLabel: string;
      languageTr: string;
      languageEn: string;
      purposeLines: readonly string[];
      signInCta: string;
      signUpCta: string;
      continueGuest: string;
    };
  };
  tabs: {
    home: string;
    wardrobe: string;
    looks: string;
    travel: string;
    profile: string;
  };
  home: {
    greetingMorning: string;
    greetingAfternoon: string;
    greetingEvening: string;
    greetingName: string;
    subGreeting: string;
    subGreetingMorning: string;
    subGreetingAfternoon: string;
    subGreetingEvening: string;
    moodLabel: string;
    moods: Record<StyleMoodId, string>;
    tonightsSelection: string;
    tonightsSelectionSubtitle: string;
    savedLooks: string;
    savedLooksSubtitle: string;
    yourWardrobe: string;
    wardrobeSubtitle: string;
    revealLook: string;
    wardrobeLoadingHint: string;
    preparedForYou: string;
    curatedFor: string;
    todaysAura: string;
    premiumCta: string;
    noLookTitle: string;
    noLookSubtitle: string;
    wardrobeHintSingle: string;
    generateError: string;
    emptyWardrobeTitle: string;
    emptyWardrobeMessage: string;
    emptyWardrobeHint: string;
  };
  lookCopy: {
    neutralTitles: readonly string[];
    defaultOccasion: string;
  };
  intent: {
    title: string;
    subtitle: string;
    placeholder: string;
    suggestionsLabel: string;
    suggestions: string[];
  };
  limits: {
    wardrobeTitle: string;
    outfitTitle: string;
    freeWardrobeLimit: string;
    freeDailyOutfitLimit: string;
  };
  weather: {
    line: string;
    fallbackLocation: string;
    conditions: Record<
      'clear' | 'partlyCloudy' | 'cloudy' | 'rain' | 'drizzle' | 'snow' | 'fog' | 'thunderstorm',
      string
    >;
    timeOfDay: Record<'morning' | 'afternoon' | 'evening' | 'night', string>;
  };
  completeLook: {
    title: string;
    subtitle: string;
    top: string;
    bottom: string;
    dress: string;
    shoes: string;
    outerwear: string;
    bag: string;
    accessories: string;
    jewelry: string;
    watches: string;
    perfume: string;
    missingTitle: string;
    missingSubtitle: string;
    missingTopCompletion: string;
    missingBottomCompletion: string;
    missingShoeCompletion: string;
    missingOuterwearCompletion: string;
    missingBagCompletion: string;
    missingJewelryCompletion: string;
    finalTouches: {
      top: string;
      bottom: string;
      shoes: string;
      bag: string;
      jewelry: string;
      sunglasses: string;
      lightJewelry: string;
      hairAccent: string;
      breathable: string;
      perfumeEvening: string;
      compactBag: string;
      structuredBag: string;
      weatherCoat: string;
      rainFootwear: string;
      quietWatch: string;
    };
  };
  outfit: {
    elegance: string;
    occasion: string;
    replaceLook: string;
    saveLook: string;
    saved: string;
    weatherNote: string;
    weatherStyling: string;
    whyThisWorks: string;
    weatherStylingIndoor: string;
    weatherStylingWarm: string;
    weatherStylingLight: string;
    weatherVibes: {
      layered: string;
      weatherReady: string;
      daylight: string;
    };
    descriptionVenue: string;
    descriptionIndoor: string;
    descriptionWarm: string;
    descriptionLight: string;
    wardrobeDescription: string;
    wardrobeWeatherWarm: string;
    wardrobeWeatherCool: string;
    wardrobeStylingNote: string;
    descriptions: Record<MoodId, string[]>;
    titles: Record<MoodId, string[]>;
    vibes: Record<MoodId, string[]>;
    reasoning: Record<MoodId, string[]>;
  };
  moods: Record<MoodId, string>;
  wardrobe: {
    title: string;
    subtitle: string;
    addPiece: string;
    emptyTitle: string;
    emptySubtitle: string;
    collectionGrowing: string;
    collectionNote: string;
    preparingPiece: string;
    filterAll: string;
    removeTitle: string;
    removeConfirm: string;
    removeAction: string;
    takePhoto: string;
    chooseFromGallery: string;
    chooseType: string;
    filterEmptyTitle: string;
    filterEmptySubtitle: string;
    saveError: string;
    permissionDeniedTitle: string;
    permissionDeniedBody: string;
    loadErrorTitle: string;
    loadErrorSubtitle: string;
    retryLoad: string;
    removeError: string;
  };
  categories: Record<WardrobeCategoryId, string>;
  wardrobeTypes: Record<WardrobeItemTypeId, string>;
  looks: {
    title: string;
    subtitle: string;
    emptyTitle: string;
    emptySubtitle: string;
    curated: string;
    saved: string;
    lookbook: string;
    lookbookSubtitle: string;
    spread: string;
    removeTitle: string;
    removeConfirm: string;
    removeAction: string;
    savedTitle: string;
    savedMessage: string;
    saveError: string;
    archiveCategoryLabel: string;
    archiveCategoryToday: string;
    archiveCategoryDateNight: string;
    archiveCategoryBusiness: string;
    archiveCategorySummer: string;
    archiveCategoryTravel: string;
    loadErrorTitle: string;
    loadErrorSubtitle: string;
    retryLoad: string;
  };
  weeklySummary: {
    title: string;
    subtitle: string;
    cardEyebrow: string;
    openCta: string;
    emptyTitle: string;
    emptySubtitle: string;
    auraTitle: string;
    moodTitle: string;
    tonesTitle: string;
    favoriteTitle: string;
    insightsTitle: string;
    metricsTitle: string;
    editorialTitle: string;
    nextWeekTitle: string;
    looksCreated: string;
    savedLooks: string;
    favoriteCategory: string;
    activeDays: string;
    noFavorite: string;
    moods: {
      minimal: string;
      business: string;
      romantic: string;
      relaxed: string;
      chic: string;
    };
    auras: {
      cityElegance: string;
      minimalPower: string;
      nightRomance: string;
      modernCashmere: string;
      quietLuxury: string;
    };
    insights: {
      strongSilhouettes: string;
      neutralCenter: string;
      travelRhythm: string;
      romanticLine: string;
      relaxedEase: string;
    };
    nextWeekSuggestions: {
      contrast: string;
      texture: string;
      color: string;
      tailoring: string;
    };
    editorialFallback: string;
  };
  loading: {
    preparingPhoto: string;
    generatingLook: string;
    savingLook: string;
    loadingWeather: string;
    cinematic: readonly string[];
  };
  aura: {
    byTime: Record<'morning' | 'afternoon' | 'evening' | 'night', readonly string[]>;
    byTone: Record<MoodId, readonly string[]>;
    weatherSuffix: {
      rain: string;
      clear: string;
      night: string;
    };
  };
  scores: {
    title: string;
    elegance: string;
    confidence: string;
    minimalism: string;
    nightEnergy: string;
    streetLuxury: string;
  };
  editorial: {
    title: string;
    colorHarmony: string;
    weatherCompatibility: string;
    emotionalTone: string;
    silhouetteBalance: string;
    colorHarmonyLines: Record<MoodId, readonly string[]>;
    emotionalToneLines: Record<MoodId, readonly string[]>;
    silhouetteBalanceLines: Record<MoodId, readonly string[]>;
    weatherDefault: readonly string[];
    weatherIndoor: string;
    weatherWarm: string;
    weatherLight: string;
  };
  share: {
    title: string;
    shareAura: string;
    message: string;
    previewTitle: string;
    previewSubtitle: string;
    saveImage: string;
    instagramStory: string;
    copyLink: string;
    savedToGallery: string;
    linkCopied: string;
    shareUnavailable: string;
    shareError: string;
    permissionDenied: string;
    emptyTitle: string;
    emptySubtitle: string;
    themeLabel: string;
    themeNoir: string;
    themeIvory: string;
    themeEspresso: string;
    itemsLabel: string;
    commentaryLabel: string;
  };
  profile: {
    title: string;
    subtitle: string;
    membership: string;
    membershipSubtitle: string;
    language: string;
    savedLooks: string;
    preferences: string;
    signature: string;
    yourSignature: string;
    yourEnergy: string;
    mostWornTones: string;
    styleDna: string;
    signatureEmptyTitle: string;
    signatureEmptyBody: string;
    signatureFormingTitle: string;
    signatureFormingBody: string;
    signaturePending: string;
    theme: string;
    themeLight: string;
    themeDark: string;
    premiumCta: string;
    displayName: string;
    statsCurated: string;
    statsSaved: string;
    settingsTitle: string;
    settingsAccountProfile: string;
    settingsAppearance: string;
    premiumStatus: string;
    premiumFree: string;
    premiumActive: string;
    freePlan: string;
    premiumPlan: string;
    deleteAccount: string;
    deleteAccountNote: string;
    deleteAccountConfirmTitle: string;
    deleteAccountConfirmBody: string;
    deleteAccountConfirmCta: string;
    deleteAccountCancel: string;
    deleteAccountDeleting: string;
    deleteAccountError: string;
    details: {
      title: string;
      firstName: string;
      lastName: string;
      username: string;
      changePhoto: string;
      photoHint: string;
      firstNamePlaceholder: string;
      lastNamePlaceholder: string;
      usernamePlaceholder: string;
      savedTitle: string;
      savedMessage: string;
    };
    account: {
      title: string;
      subtitle: string;
      guestLabel: string;
      signedInLabel: string;
      email: string;
      password: string;
      emailPlaceholder: string;
      passwordPlaceholder: string;
      signIn: string;
      signUp: string;
      signOut: string;
      successTitle: string;
      errorTitle: string;
      signUpSuccessActive: string;
      signUpSuccessConfirm: string;
      signInSuccess: string;
      sessionRestoreErrorTitle: string;
      sessionRestoreErrorBody: string;
      retrySessionRestore: string;
      signInAgain: string;
      errors: {
        invalidCredentials: string;
        emailNotConfirmed: string;
        userExists: string;
        weakPassword: string;
        invalidEmail: string;
        emailRequired: string;
        passwordRequired: string;
        rateLimited: string;
        genericSignIn: string;
        genericSignUp: string;
      };
    };
  };
  signature: {
    energyUrban: string;
    energyQuiet: string;
    energyRefined: string;
    dnaMinimal: string;
    dnaStreet: string;
    dnaParisian: string;
    tones: Record<MoodId, string>;
  };
  legal: {
    title: string;
    privacy: { title: string; body: string };
    terms: { title: string; body: string };
    kvkk: { title: string; body: string };
    membership: { title: string; body: string };
    purchases: { title: string; body: string };
  };
  about: {
    sectionTitle: string;
    eyebrow: string;
    title: string;
    cardSubtitle: string;
    homeTitle: string;
    homeSubtitle: string;
    homeTravelLine: string;
    homeCta: string;
    intro: string;
    items: readonly { title: string; description: string }[];
    travel: {
      badge: string;
      title: string;
      intro: string;
      points: readonly string[];
    };
    closing: string;
  };
  notifications: {
    title: string;
    emptyTitle: string;
    emptySubtitle: string;
    items: readonly {
      id: NotificationActionId;
      title: string;
      body: string;
      time: string;
    }[];
  };
  pushNotifications: {
    settingsTitle: string;
    settingsSubtitle: string;
    enableCta: string;
    enabledLabel: string;
    unavailableLabel: string;
    deniedHint: string;
    openSettingsCta: string;
    tokenUnavailableHint: string;
    kinds: Record<StylovePushKind, { title: string; body: string }>;
  };
  premium: {
    title: string;
    subtitle: string;
    weekly: string;
    monthly: string;
    weeklyPrice: string;
    monthlyPrice: string;
    perWeek: string;
    perMonth: string;
    benefits: string[];
    freeFeatures: string[];
    premiumFeatures: string[];
    freeTitle: string;
    premiumTitle: string;
    recommended: string;
    paywallEyebrow: string;
    plansIntro: string;
    sameFeaturesNote: string;
    weeklyPlanTitle: string;
    weeklyPlanSubtitle: string;
    monthlyPlanTitle: string;
    monthlyPlanSubtitle: string;
    inactiveCta: string;
    comparison: readonly { label: string; free: string; premium: string }[];
    comingSoonTitle: string;
    comingSoonMessage: string;
    ctaWeekly: string;
    ctaMonthly: string;
    restore: string;
    successTitle: string;
    successMessage: string;
    continueCta: string;
    restoreTitle: string;
    restoreSuccess: string;
    restoreEmpty: string;
    note: string;
    inactiveNote: string;
    badgeHint: string;
  };
  travel: {
    title: string;
    subtitle: string;
    destinationLabel: string;
    destinationPlaceholder: string;
    destinationRequired: string;
    destinationHint: string;
    durationLabel: string;
    durationPlaceholder: string;
    departureLabel: string;
    departurePlaceholder: string;
    vibeLabel: string;
    vibes: Record<TravelVibeId, string>;
    prepareCta: string;
    preparing: readonly string[];
    weatherTitle: string;
    weatherDay: string;
    weatherNight: string;
    weatherDayNote: string;
    weatherFeelsLike: string;
    weatherRain: string;
    weatherWind: string;
    layeringHint: string;
    forecastUnavailable: string;
    weatherAttribution: string;
    suitcaseTitle: string;
    suitcaseSubtitle: string;
    packedItems: string;
    accessories: string;
    shoes: string;
    outerwear: string;
    timelineTitle: string;
    timelineSubtitle: string;
    dayLabel: string;
    spotsTitle: string;
    spotsSubtitle: string;
    spotOutfitNote: string;
    spotTypes: Record<'rooftop' | 'cafe' | 'restaurant' | 'beachClub' | 'gallery', string>;
    lockTitle: string;
    lockSubtitle: string;
    lockCta: string;
    defaultCity: string;
    emptyWardrobeHint: string;
    wardrobeHintSingle: string;
    moodLabels: readonly string[];
    spotNames: readonly string[];
    dayTitles: Record<TravelVibeId, readonly string[]>;
  };
  events: {
    time: Record<'morning' | 'afternoon' | 'evening' | 'night', string>;
    rules: Record<
      string,
      { venue: string; dressCode: string; vibe: string }
    >;
    occasions: Record<
      OccasionId,
      { dressCode: string; vibe: string }
    >;
  };
};
