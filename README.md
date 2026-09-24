# Cozy Backpack

Rahatlatıcı bir çanta toplama bulmacası (Expo + React Native + TypeScript, iOS öncelikli).

## Çalıştırma

```bash
npm install
npx expo start          # iPhone'da Expo Go ya da dev build ile aç
npx expo run:ios        # Mac'te yerel dev build
```

## Komutlar

| Komut | Ne yapar |
|---|---|
| `npm test` | Oyun mantığı ve içerik testleri (Jest) |
| `npm run typecheck` | TypeScript kontrolü |
| `npm run lint` | ESLint |
| `npm run levels` | Tüm bölümleri doğrular, çözülebilirliği kanıtlar, zorluk raporu yazar ve `src/data/levelIndex.ts`'i üretir |
| `npm run art` | Eşyaları ve odayı `design/previews/` altına PNG olarak çizer (açık/koyu, yüz ifadeleri, dekorlar) |
| `npm run sfx` | Ses efektlerini sentezler (`assets/audio/sfx/`) |
| `npm run icons` | Uygulama ikonu, açılış ekranı ve Android katmanlarını çizer (`assets/icons/`) |
| `npm run screenshots` | Ham simülatör görüntülerini App Store için çerçeveler (`--demo` ile deneme seti) |

## Yeni bölüm eklemek

1. `assets/levels/weekNN/wNN-dD.json` dosyası oluştur (örnek: `assets/levels/week02/w02-d3.json`).
2. `npm run levels` çalıştır. Hata varsa satır satır söyler; yoksa bölüm oyuna eklenir.

Eşyalar `assets/data/items.json` içinde tanımlı. Şekiller `X` (dolu) ve `.` (boş) satırlarıyla yazılır.

## Klasörler

- `src/game/` — saf TypeScript oyun mantığı (ızgara, kurallar, çözücü, ipucu, yıldız)
- `src/board/` — oyun ekranı çizimi ve jestler (Skia + Reanimated)
- `src/art/` — kodla çizilen tüm görseller (Stil A: pastel & yüzlü)
- `src/app/` — ekranlar (expo-router)
- `scripts/` — bölüm doğrulayıcı ve görsel önizleme
- `design/` — stil keşfi ve önizleme çıktıları
- `store/` — App Store metinleri (TR/EN)
- `site/` — destek sayfası, gizlilik politikası, kullanım şartları (GitHub Pages)
- `docs/` — kurulum ve yayın rehberleri
