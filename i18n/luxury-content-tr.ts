import type { MoodId } from '@/i18n/types';

export const AURA_BY_TONE_TR: Record<MoodId, string[]> = {
  elegant: ['Sessiz lüks, özgüvenli enerji.', 'Rafine akşam duruşu.', 'Zarif ölçülülük.'],
  soft: ['Nazik ışıltı.', 'Samimi akşam zarafeti.', 'Pembe saat enerjisi.'],
  confident: ['Kararlı çizgiler, sessiz güç.', 'Yapılı, emin, modern.', 'Cesur sessizlik.'],
  oldMoney: ['Sessiz lüks — miras duruşu.', 'Gösterişsiz servet.', 'Zamansız rafine.'],
  seductive: ['Kontrollü çekicilik.', 'Gece manyetizması.', 'Duyusal duruş.'],
  minimal: ['Bu gece minimal zarafet.', 'Saf form.', 'Ölçülülük en büyük lüks.'],
};

export const EDITORIAL_COLOR_HARMONY_TR: Record<MoodId, string[]> = {
  elegant: ['Şampanya ve bordo tonal uyum.'],
  soft: ['Pembe ve krem — samimi, doğal.'],
  confident: ['Siyah ve deve rengi — otorite ve sıcaklık.'],
  oldMoney: ['Deve rengi, lacivert, fildişi.'],
  seductive: ['Bordo ve siyah — kontrastla çekicilik.'],
  minimal: ['Fildişiden kömüre — odak sizde.'],
};

export const EDITORIAL_EMOTIONAL_TONE_TR: Record<MoodId, string[]> = {
  elegant: ['Rafine, emin akşam feminenliği.'],
  soft: ['Nazik, zarif, sessizce manyetik.'],
  confident: ['Otorite ve duruş.'],
  oldMoney: ['Trendlerin ötesinde bir zevk.'],
  seductive: ['Çekicilik imada yaşar.'],
  minimal: ['Varlığınız ifade olur.'],
};

export const EDITORIAL_SILHOUETTE_TR: Record<MoodId, string[]> = {
  elegant: ['Dikey çizgiler silueti inceltir.'],
  soft: ['Akıcı çizgiler — hareketle romantizm.'],
  confident: ['Yapılı omuzlar, bel vurgusu.'],
  oldMoney: ['Klasik oranlar — zamansız.'],
  seductive: ['Kontrollü drape, editoryal gerilim.'],
  minimal: ['Temiz çizgiler — her oran kasıtlı.'],
};

export const MISSING_NOTES_TR = {
  watches: ['İnce altın saat tamamlar.'],
  rings: ['Tek yüzük — küçük rafine dokunuş.'],
  shoes: ['Doğru topuk duruşu değiştirir.'],
  perfume: ['Koku — görünmez katman.'],
  bags: ['Yapılı clutch editi sabitler.'],
} as const;
