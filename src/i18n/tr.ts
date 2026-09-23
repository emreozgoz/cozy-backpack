import type { DecorSlot } from '@/data/decor';
import type { Issue } from '@/game/rules';
import type { Subject, TipKey, Weekday } from '@/game/types';

// Turkish copy — the source dictionary. en.ts must match its shape exactly.

const subjects: Record<Subject, string> = {
  math: 'Matematik',
  turkish: 'Türkçe',
  science: 'Fen',
  life: 'Hayat Bilgisi',
  social: 'Sosyal',
  history: 'Tarih',
  english: 'İngilizce',
  art: 'Resim',
  music: 'Müzik',
  pe: 'Beden Eğitimi',
};

const weekdays: Record<Weekday, string> = {
  mon: 'Pazartesi',
  tue: 'Salı',
  wed: 'Çarşamba',
  thu: 'Perşembe',
  fri: 'Cuma',
  sat: 'Cumartesi',
  sun: 'Pazar',
};

const tips: Record<TipKey, string> = {
  drag: 'Eşyayı sürükle, çantaya bırak. Hepsi yerleşince fermuarı sağa çek.',
  hint: 'Takılırsan 💡 ipucuna dokun. Acele yok, süre de yok.',
  rotate: 'Bir eşyaya dokunursan döner. Bazen yan yatması gerekir.',
  distractor: 'Masada programda olmayan şeyler de var. Onları masada bırak.',
  flute: 'Müzik günü: flütü unutma! Uzun eşyalar bazen yan yatmalı.',
  upright: 'Beslenme kutusu dik durmalı, yoksa yemekler dökülür.',
  bottle: 'Suluk yan yatabilir ama baş aşağı konmaz.',
  art: 'Resim günü! Boya kalemleri ve resim defteri de çantaya girer.',
  tight: 'Bugün çanta biraz dolu. Her boşluk önemli.',
  finale: 'Haftanın son günü: bu haftanın bütün kuralları bir arada.',
};

/** Why the zipper got stuck — the first problem found, in plain words. */
const stuckReasons: Record<Issue['kind'], string> = {
  missing: 'Fermuar takıldı: programdaki bir şey hâlâ masada.',
  extra: 'Fermuar takıldı: çantada bugün gerekmeyen bir şey var.',
  orientation: 'Fermuar takıldı: bir eşya yanlış yönde duruyor.',
  fragile: 'Fermuar takıldı: hediyenin üstüne bir şey konmuş.',
  pocket: 'Fermuar takıldı: bir eşya kendi cebinde değil.',
};

const weekNames: Record<number, string> = {
  1: 'Okula Dönüş',
  2: 'Beslenme Saati',
  3: 'Spor Haftası',
  4: 'Sınav Haftası',
};

const slots: Record<DecorSlot, string> = {
  wall: 'Duvar',
  curtain: 'Perde',
  lamp: 'Lamba',
  plant: 'Bitki',
  rug: 'Halı',
};

const decor: Record<string, string> = {
  wall_timetable: 'Ders programı',
  wall_rainbow: 'Gökkuşağı posteri',
  wall_cat: 'Kedi posteri',
  curtain_mint: 'Nane perde',
  curtain_lavender: 'Lavanta perde',
  curtain_butter: 'Puantiyeli perde',
  lamp_basic: 'Masa lambası',
  lamp_mushroom: 'Mantar lamba',
  lamp_moon: 'Ay lamba',
  plant_none: 'Boş köşe',
  plant_cactus: 'Minik kaktüs',
  plant_monstera: 'Deve tabanı',
  rug_round: 'Yuvarlak halı',
  rug_rainbow: 'Gökkuşağı halı',
  rug_cloud: 'Bulut halı',
};

const ui = {
  appName: 'Cozy Backpack',
  week: (n: number) => `${n}. Hafta`,
  pullZip: 'Hazır olunca fermuarı sağa çek →',
  hint: 'İpucu',
  closeTip: 'İpucunu kapat',
  packed: 'Çanta hazır!',
  next: 'Sonraki gün',
  replay: 'Tekrar oyna',
  levels: 'Günler',
  home: 'Odaya dön',

  // home
  packBag: 'Çantayı hazırla',
  stars: 'Yıldız',
  buttons: 'Düğme',
  hints: 'İpucu',
  settings: 'Ayarlar',
  decorate: 'Odanı süsle',
  dailyPuzzle: 'Günün Çantası',
  dailyTodo: (streak: number) =>
    streak > 1 ? `Bugünün bulmacası hazır · ${streak} günlük seri` : 'Bugünün bulmacası hazır',
  dailyDone: (streak: number) => `Bugün tamam ✓ · ${streak} günlük seri`,

  // win card
  earned: (n: number) => `+${n}`,
  newDecor: (name: string) => `Yeni dekor açıldı: ${name}`,
  dailyComplete: 'Günün Çantası tamam!',
  streak: (n: number) => `${n} günlük seri`,

  // hints
  noHints: 'İpucun kalmadı. Günlük ödülden yeni ipucu kazanabilirsin.',
  nothingToHint: 'Çanta zaten hazır görünüyor, fermuarı dene!',

  // map
  locked: 'Önceki günü bitirince açılır',
  starsCount: (n: number) => `${n} yıldız`,

  // daily reward
  dailyReward: 'Günlük ödül',
  dailyRewardTitle: 'Günlük hediyen',
  dailyRewardBody: 'Her gün küçük bir hediye. Bir gün kaçırırsan sıra kaybolmaz, seni bekler.',
  claim: 'Al',
  claimed: 'Yarın yine gel!',
  day: (n: number) => `${n}. gün`,
  close: 'Kapat',

  // decorate
  equipped: 'Takılı',
  equip: 'Tak',
  buy: 'Al',
  needStars: (n: number) => `${n} yıldızda açılır`,
  notEnough: 'Düğmen yetmiyor',

  // settings
  sound: 'Ses efektleri',
  haptics: 'Titreşim',
  language: 'Dil',
  languageSystem: 'Sistem',
  resetProgress: 'İlerlemeyi sıfırla',
  resetConfirm: 'Emin misin? Yıldızlar, düğmeler ve dekorlar silinir.',
  resetYes: 'Evet, sıfırla',
  resetDone: 'İlerleme sıfırlandı.',
  cancel: 'Vazgeç',
  version: (v: string) => `Sürüm ${v}`,

  // accessibility
  zipper: 'Fermuar',
  zipperHint: 'Çantayı kapatmak için sağa çek',
};

export const tr = { subjects, weekdays, tips, stuckReasons, weekNames, slots, decor, ui };

export type Strings = typeof tr;
