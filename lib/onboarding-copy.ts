import type { Locale } from '@/i18n/types';

export type OnboardingSlideCopy = {
  title: string;
  subtitle: string;
  footnote: string;
};

export type OnboardingCopy = {
  languageName: string;
  splashSubtitle: string;
  slides: readonly OnboardingSlideCopy[];
  continueCta: string;
  skipCta: string;
  authWelcomeTitle: string;
  authWelcomeSubtitle: string;
  continueWithEmail: string;
  continueWithGoogle: string;
  continueWithApple: string;
  loginLink: string;
  registerLink: string;
  languageLabel: string;
  emailPlaceholder: string;
  passwordPlaceholder: string;
  loginCta: string;
  registerCta: string;
  switchToLogin: string;
  switchToRegister: string;
  socialComingSoon: string;
  errorTitle: string;
  successTitle: string;
  weakPassword: string;
  confirmEmail: string;
};

export const ONBOARDING_LANGUAGE_ORDER: Locale[] = [
  'tr',
  'en',
  'de',
  'fr',
  'es',
  'it',
  'ar',
  'ru',
];

export const ONBOARDING_COPY: Record<Locale, OnboardingCopy> = {
  tr: {
    languageName: 'Türkçe',
    splashSubtitle: 'Zarif stilin, gardırobundan doğar.',
    slides: [
      {
        title: 'Gardırobunu Düzenle',
        subtitle: 'Kıyafetlerini yükle, her parçanı dijital gardırobunda tek bir yerde topla.',
        footnote: 'Üstlerinden ayakkabılarına kadar tüm parçaların her zaman hazır olsun.',
      },
      {
        title: 'Kendi Kıyafetlerinle Kombinler Oluştur',
        subtitle: 'Stylove, gardırobundaki parçaları kullanarak sana kombin önerileri hazırlar.',
        footnote: 'Farklı bir görünüm mü istiyorsun? Tek dokunuşla yeni alternatifler oluştur.',
      },
    ],
    continueCta: 'Devam Et',
    skipCta: 'Atla',
    authWelcomeTitle: 'Hoş geldin',
    authWelcomeSubtitle: 'Stil dünyan seni bekliyor.',
    continueWithEmail: 'E-posta ile devam et',
    continueWithGoogle: 'Google ile devam et',
    continueWithApple: 'Apple ile devam et',
    loginLink: 'Giriş yap',
    registerLink: 'Hesap oluştur',
    languageLabel: 'Dil',
    emailPlaceholder: 'E-posta',
    passwordPlaceholder: 'Şifre',
    loginCta: 'Giriş yap',
    registerCta: 'Hesap oluştur',
    switchToLogin: 'Zaten hesabın var mı? Giriş yap',
    switchToRegister: 'Hesabın yok mu? Hesap oluştur',
    socialComingSoon: 'Bu giriş yöntemi yakında kullanılabilir olacak.',
    errorTitle: 'Hesap',
    successTitle: 'Başarılı',
    weakPassword: 'Şifre en az 6 karakter olmalıdır.',
    confirmEmail: 'Hesabın oluşturuldu. Lütfen e-posta adresini doğrula.',
  },
  en: {
    languageName: 'English',
    splashSubtitle: 'Elegant style, shaped by your wardrobe.',
    slides: [
      {
        title: 'Organize Your Wardrobe',
        subtitle: 'Upload your clothes and keep every piece in one digital wardrobe.',
        footnote: 'From tops to shoes — everything ready when you need it.',
      },
      {
        title: 'Create Looks From Your Clothes',
        subtitle: 'Stylove builds outfit suggestions using pieces already in your wardrobe.',
        footnote: 'Want a different look? Generate fresh alternatives with a single tap.',
      },
    ],
    continueCta: 'Continue',
    skipCta: 'Skip',
    authWelcomeTitle: 'Welcome',
    authWelcomeSubtitle: 'Your style world awaits.',
    continueWithEmail: 'Continue with Email',
    continueWithGoogle: 'Continue with Google',
    continueWithApple: 'Continue with Apple',
    loginLink: 'Log in',
    registerLink: 'Create account',
    languageLabel: 'Language',
    emailPlaceholder: 'Email',
    passwordPlaceholder: 'Password',
    loginCta: 'Log in',
    registerCta: 'Create account',
    switchToLogin: 'Already have an account? Log in',
    switchToRegister: 'No account yet? Create one',
    socialComingSoon: 'This sign-in option will be available soon.',
    errorTitle: 'Account',
    successTitle: 'Success',
    weakPassword: 'Password must be at least 6 characters.',
    confirmEmail: 'Your account has been created. Please verify your email address.',
  },
  de: {
    languageName: 'Deutsch',
    splashSubtitle: 'Dein eleganter Stil, aus deinem Kleiderschrank.',
    slides: [
      {
        title: 'Ordne deine Garderobe',
        subtitle: 'Lade deine Kleidung hoch und sammle jedes Teil an einem Ort.',
        footnote: 'Von Oberteilen bis Schuhen — alles griffbereit.',
      },
      {
        title: 'Looks aus deinen Kleidungsstücken',
        subtitle: 'Stylove erstellt Outfit-Vorschläge aus deiner eigenen Garderobe.',
        footnote: 'Neuer Look gewünscht? Mit einem Tipp frische Alternativen.',
      },
    ],
    continueCta: 'Weiter',
    skipCta: 'Überspringen',
    authWelcomeTitle: 'Willkommen',
    authWelcomeSubtitle: 'Deine Stilwelt wartet auf dich.',
    continueWithEmail: 'Mit E-Mail fortfahren',
    continueWithGoogle: 'Mit Google fortfahren',
    continueWithApple: 'Mit Apple fortfahren',
    loginLink: 'Anmelden',
    registerLink: 'Konto erstellen',
    languageLabel: 'Sprache',
    emailPlaceholder: 'E-Mail',
    passwordPlaceholder: 'Passwort',
    loginCta: 'Einloggen',
    registerCta: 'Konto erstellen',
    switchToLogin: 'Schon ein Konto? Anmelden',
    switchToRegister: 'Noch kein Konto? Erstellen',
    socialComingSoon: 'Diese Anmeldung ist bald verfügbar.',
    errorTitle: 'Konto',
    successTitle: 'Erfolgreich',
    weakPassword: 'Das Passwort muss mindestens 6 Zeichen lang sein.',
    confirmEmail: 'Dein Konto wurde erstellt. Bitte bestätige deine E-Mail-Adresse.',
  },
  fr: {
    languageName: 'Français',
    splashSubtitle: 'Un style élégant, né de votre garde-robe.',
    slides: [
      {
        title: 'Organisez votre garde-robe',
        subtitle: 'Importez vos vêtements et regroupez chaque pièce au même endroit.',
        footnote: 'Des hauts aux chaussures — tout est prêt quand vous en avez besoin.',
      },
      {
        title: 'Créez des looks avec vos vêtements',
        subtitle: 'Stylove prépare des suggestions à partir de votre garde-robe.',
        footnote: 'Envie d’un autre style ? De nouvelles options en un geste.',
      },
    ],
    continueCta: 'Continuer',
    skipCta: 'Passer',
    authWelcomeTitle: 'Bienvenue',
    authWelcomeSubtitle: 'Votre univers style vous attend.',
    continueWithEmail: 'Continuer avec l’e-mail',
    continueWithGoogle: 'Continuer avec Google',
    continueWithApple: 'Continuer avec Apple',
    loginLink: 'Se connecter',
    registerLink: 'Créer un compte',
    languageLabel: 'Langue',
    emailPlaceholder: 'E-mail',
    passwordPlaceholder: 'Mot de passe',
    loginCta: 'Se connecter',
    registerCta: 'Créer un compte',
    switchToLogin: 'Déjà un compte ? Se connecter',
    switchToRegister: 'Pas encore de compte ? Créer un compte',
    socialComingSoon: 'Cette connexion sera bientôt disponible.',
    errorTitle: 'Compte',
    successTitle: 'Succès',
    weakPassword: 'Le mot de passe doit contenir au moins 6 caractères.',
    confirmEmail: 'Votre compte a été créé. Veuillez vérifier votre e-mail.',
  },
  es: {
    languageName: 'Español',
    splashSubtitle: 'Tu estilo elegante, desde tu armario.',
    slides: [
      {
        title: 'Organiza tu armario',
        subtitle: 'Sube tu ropa y reúne cada prenda en un solo lugar digital.',
        footnote: 'Desde tops hasta zapatos — todo listo cuando lo necesites.',
      },
      {
        title: 'Crea looks con tu ropa',
        subtitle: 'Stylove prepara sugerencias usando las piezas de tu armario.',
        footnote: '¿Quieres otro estilo? Nuevas alternativas con un toque.',
      },
    ],
    continueCta: 'Continuar',
    skipCta: 'Omitir',
    authWelcomeTitle: 'Bienvenida',
    authWelcomeSubtitle: 'Tu mundo de estilo te espera.',
    continueWithEmail: 'Continuar con correo',
    continueWithGoogle: 'Continuar con Google',
    continueWithApple: 'Continuar con Apple',
    loginLink: 'Iniciar sesión',
    registerLink: 'Crear cuenta',
    languageLabel: 'Idioma',
    emailPlaceholder: 'Correo electrónico',
    passwordPlaceholder: 'Contraseña',
    loginCta: 'Iniciar sesión',
    registerCta: 'Crear cuenta',
    switchToLogin: '¿Ya tienes cuenta? Inicia sesión',
    switchToRegister: '¿No tienes cuenta? Crea una',
    socialComingSoon: 'Este inicio de sesión estará disponible pronto.',
    errorTitle: 'Cuenta',
    successTitle: 'Éxito',
    weakPassword: 'La contraseña debe tener al menos 6 caracteres.',
    confirmEmail: 'Tu cuenta fue creada. Verifica tu correo electrónico.',
  },
  it: {
    languageName: 'Italiano',
    splashSubtitle: 'Il tuo stile elegante, dal guardaroba.',
    slides: [
      {
        title: 'Organizza il guardaroba',
        subtitle: 'Carica i tuoi capi e tieni ogni pezzo in un unico posto.',
        footnote: 'Dai top alle scarpe — tutto pronto quando serve.',
      },
      {
        title: 'Crea look con i tuoi capi',
        subtitle: 'Stylove prepara suggerimenti usando il tuo guardaroba.',
        footnote: 'Vuoi un altro stile? Nuove alternative con un tocco.',
      },
    ],
    continueCta: 'Continua',
    skipCta: 'Salta',
    authWelcomeTitle: 'Benvenuta',
    authWelcomeSubtitle: 'Il tuo mondo di stile ti aspetta.',
    continueWithEmail: 'Continua con e-mail',
    continueWithGoogle: 'Continua con Google',
    continueWithApple: 'Continua con Apple',
    loginLink: 'Accedi',
    registerLink: 'Crea account',
    languageLabel: 'Lingua',
    emailPlaceholder: 'E-mail',
    passwordPlaceholder: 'Password',
    loginCta: 'Accedi',
    registerCta: 'Crea account',
    switchToLogin: 'Hai già un account? Accedi',
    switchToRegister: 'Non hai un account? Creane uno',
    socialComingSoon: 'Questo accesso sarà disponibile a breve.',
    errorTitle: 'Account',
    successTitle: 'Successo',
    weakPassword: 'La password deve contenere almeno 6 caratteri.',
    confirmEmail: 'Il tuo account è stato creato. Verifica la tua e-mail.',
  },
  ar: {
    languageName: 'العربية',
    splashSubtitle: 'أسلوبك الأنيق، من خزانتك.',
    slides: [
      {
        title: 'نظّمي خزانتك',
        subtitle: 'ارفعي ملابسك واجمعي كل قطعة في مكان واحد.',
        footnote: 'من القمصان إلى الأحذية — كل شيء جاهز عند الحاجة.',
      },
      {
        title: 'أنشئي إطلالات من ملابسك',
        subtitle: 'Stylove يقترح تنسيقات من قطع خزانتك.',
        footnote: 'تريدين مظهراً مختلفاً؟ بدائل جديدة بلمسة واحدة.',
      },
    ],
    continueCta: 'متابعة',
    skipCta: 'تخطي',
    authWelcomeTitle: 'أهلاً بك',
    authWelcomeSubtitle: 'عالم أسلوبك ينتظرك.',
    continueWithEmail: 'المتابعة بالبريد',
    continueWithGoogle: 'المتابعة مع Google',
    continueWithApple: 'المتابعة مع Apple',
    loginLink: 'تسجيل الدخول',
    registerLink: 'إنشاء حساب',
    languageLabel: 'اللغة',
    emailPlaceholder: 'البريد الإلكتروني',
    passwordPlaceholder: 'كلمة المرور',
    loginCta: 'تسجيل الدخول',
    registerCta: 'إنشاء حساب',
    switchToLogin: 'لديك حساب؟ سجّل الدخول',
    switchToRegister: 'ليس لديك حساب؟ أنشئ حساباً',
    socialComingSoon: 'طريقة الدخول هذه ستتوفر قريباً.',
    errorTitle: 'الحساب',
    successTitle: 'تم بنجاح',
    weakPassword: 'يجب أن تتكون كلمة المرور من 6 أحرف على الأقل.',
    confirmEmail: 'تم إنشاء حسابك. يرجى تأكيد بريدك الإلكتروني.',
  },
  ru: {
    languageName: 'Русский',
    splashSubtitle: 'Изящный стиль — из вашего гардероба.',
    slides: [
      {
        title: 'Организуйте гардероб',
        subtitle: 'Загрузите одежду и соберите каждую вещь в одном месте.',
        footnote: 'От верха до обуви — всё готово, когда нужно.',
      },
      {
        title: 'Создавайте образы из своей одежды',
        subtitle: 'Stylove предлагает сочетания из вашего гардероба.',
        footnote: 'Нужен другой вид? Новые варианты одним касанием.',
      },
    ],
    continueCta: 'Продолжить',
    skipCta: 'Пропустить',
    authWelcomeTitle: 'Добро пожаловать',
    authWelcomeSubtitle: 'Ваш мир стиля ждёт вас.',
    continueWithEmail: 'Продолжить с e-mail',
    continueWithGoogle: 'Продолжить с Google',
    continueWithApple: 'Продолжить с Apple',
    loginLink: 'Войти',
    registerLink: 'Создать аккаунт',
    languageLabel: 'Язык',
    emailPlaceholder: 'E-mail',
    passwordPlaceholder: 'Пароль',
    loginCta: 'Войти',
    registerCta: 'Создать аккаунт',
    switchToLogin: 'Уже есть аккаунт? Войти',
    switchToRegister: 'Нет аккаунта? Создать',
    socialComingSoon: 'Этот способ входа скоро будет доступен.',
    errorTitle: 'Аккаунт',
    successTitle: 'Готово',
    weakPassword: 'Пароль должен содержать не менее 6 символов.',
    confirmEmail: 'Ваш аккаунт создан. Подтвердите e-mail.',
  },
};
