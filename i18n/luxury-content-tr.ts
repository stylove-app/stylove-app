import type { MoodId } from '@/i18n/types';

export const AURA_BY_TONE_TR: Record<MoodId, string[]> = {
  elegant: [
    'Sessiz lüks, özgüvenli enerji.',
    'Rafine akşam duruşu — ipek saati.',
    'Konuşmadan önce konuşan zarif ölçülülük.',
  ],
  soft: [
    'Nazik ışıltı — muted tonlarda romantizm.',
    'Samimi bir akşam için yumuşak zarafet.',
    'Pembe saat enerjisi — nazik, manyetik, gerçek.',
  ],
  confident: [
    'Kararlı çizgiler, sessiz güç.',
    'Özgüvenli enerji — yapılı, emin, modern.',
    'Cesur sessizlik — gösterişsiz varlık.',
  ],
  oldMoney: [
    'Sessiz lüks — miras duruşu, sıfır abartı.',
    'Gösterişsiz servet — zamansız, asla modaya bağımlı değil.',
    'Yeni bir akşam için eski dünya rafinesi.',
  ],
  seductive: [
    'Kontrollü çekicilik — ifade yerine ima.',
    'Gece sonrası manyetizma, editoryal ölçülülükle.',
    'Duyusal duruş — gerilim, drape, niyet.',
  ],
  minimal: [
    'Bu gece için minimal zarafet.',
    'Saf form — her unsur gerekli.',
    'Ölçülülük en büyük lüks olarak.',
  ],
};

export const EDITORIAL_COLOR_HARMONY_TR: Record<MoodId, string[]> = {
  elegant: [
    'Şampanya ve bordo tonal diyalogda — serin duruşa karşı sıcak derinlik.',
    'Fildişi ve altın vurgular, uyumu bozmadan ışıltılı kontrast yaratır.',
  ],
  soft: [
    'Pembe ve krem katmanlar birlikte nefes alır — samimi, asla yapay değil.',
    'Fildişi üzerinde muted gül tonları yumuşak odak romantizm.',
  ],
  confident: [
    'Siyah ve deve rengi keskin oranda — otorite ve sıcaklık.',
    'Tek altın vurgulu monokrom baz — flaş değil, odak.',
  ],
  oldMoney: [
    'Deve rengi, lacivert ve fildişi — sessiz servetin miras paleti.',
    'Mükemmel orandaki nötr tonlar; hiçbir şey rekabet etmez.',
  ],
  seductive: [
    'Şarap ve siyah kasıtlı gerilimde — kontrastla çekicilik.',
    'Ten tonu nötrlerine karşı derin bordo — gölgede samimiyet.',
  ],
  minimal: [
    'Fildişiden kömüre monokrom — dikkat dağıtılmaz, varlık güçlenir.',
    'Tek ton katmanlama derinliği dokuyla, renkle değil yaratır.',
  ],
};

export const EDITORIAL_EMOTIONAL_TONE_TR: Record<MoodId, string[]> = {
  elegant: ['Ruh hali rafine ve kendinden emin okunuyor — zahmetsiz akşam feminenliği.'],
  soft: ['Duygusal ton: nazik, zarif, sessizce manyetik.'],
  confident: ['Otorite ve soğukkanlılık yansıtır — şiirle giyinmiş güç.'],
  oldMoney: ['Trendlerin ötesinde zevk sinyali — gerçek lüksün sessiz işareti.'],
  seductive: ['Kontrollü gerilim — çekicilik gösterilende değil, ima edilende yaşar.'],
  minimal: ['Ölçülülük, varlığınızın ifade olması için alan açar.'],
};

export const EDITORIAL_SILHOUETTE_TR: Record<MoodId, string[]> = {
  elegant: [
    'Uzatılmış oranlar ve temiz dikey çizgiler silueti inceltir.',
    'Dengeli hacim — yapılı üst, akışkan alt — editoryal duruş.',
  ],
  soft: [
    'Akışkan çizgiler bedeni nazikçe takip eder — hacim değil, hareketle romantizm.',
    'Yumuşak drape, zarif yapıyı korurken samimiyet yaratır.',
  ],
  confident: [
    'Yapılı omuzlar ve belirgin bel, kesinlikle varlık yansıtır.',
    'Keskin terzilik, bir yumuşak unsur ile dengelenir — saldırganlık olmadan güç.',
  ],
  oldMoney: [
    'Klasik oranlar — hiçbir şey trend, her şey zamansız.',
    'Fısıldayan, duyuran değil, gösterişsiz kesim.',
  ],
  seductive: [
    'Kontrollü açılımlar ve kasıtlı drape editoryal gerilim yaratır.',
    'Siluet doğal çizgileri takip ederken gizemi korur.',
  ],
  minimal: [
    'Temiz çizgiler ve gerekli hacim — her oran kasıtlı.',
    'Fazlalık olmadığında siluet tüm ifade olur.',
  ],
};

export const MISSING_NOTES_TR = {
  watches: ['İnce altın saat, sessiz lüks tonunu tamamlar.'],
  rings: ['Tek bir statement yüzük — minyatürde rafine dokunuş.'],
  shoes: ['Doğru topuk yüksekliği duruşu ve varlığı dönüştürür.'],
  perfume: ['Koku, görünmez edit katmanınızdır.'],
  bags: ['Yapılı clutch kompozisyonu sabitler.'],
} as const;
