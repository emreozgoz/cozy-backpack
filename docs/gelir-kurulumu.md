# Gelir kurulumu (M6)

Kod hazır ve şu an **test modunda** çalışıyor:

- **Expo Go'da ya da anahtar yokken:** satın almalar taklit (para çekilmez), reklamlar "Test reklamı" ekranı.
- **Dev build'de (`npx expo run:ios`):** AdMob, Google'ın resmî **test reklamlarını** gösterir. Satın almalar, RevenueCat anahtarı girilene kadar taklit kalır.

Gerçeğe geçmek için aşağıdakileri sırayla yap, anahtarları `.env` dosyasına yaz (`.env.example`'ı kopyala). `.env` git'e girmez.

## 1. App Store Connect

1. **Agreements, Tax, and Banking** → Paid Apps sözleşmesini imzala, vergi ve banka bilgilerini gir. Bu olmadan satın alma çalışmaz.
2. Uygulama kaydı: bundle ID `com.emreozgoz.cozybackpack`.
3. **In-App Purchases** — kimlikler koddakiyle birebir aynı olmalı (`src/features/monetization/products.ts`):

   | Kimlik | Tür | Önerilen fiyat |
   |---|---|---|
   | `cb.removeads` | Non-Consumable | $3.99 |
   | `cb.starter` | Non-Consumable | $4.99 |
   | `cb.hints.10` | Consumable | $0.99 |
   | `cb.hints.30` | Consumable | $2.49 |
   | `cb.hints.80` | Consumable | $4.99 |
   | `cb.theme.autumn` | Non-Consumable | $1.99 |
   | `cb.theme.sweets` | Non-Consumable | $1.99 |
   | `cb.theme.bundle` | Non-Consumable | $2.99 |

4. **Subscriptions** → "VIP" grubu:
   - `cb.vip.monthly`: 1 ay, $2.99.
   - `cb.vip.yearly`: 1 yıl, $19.99, tanıtım teklifi olarak 7 gün ücretsiz deneme.
5. Her ürüne TR ve EN ad/açıklama ekle, bir de inceleme ekran görüntüsü yükle (dükkân ekranının görüntüsü yeter).
6. Türkiye fiyatlarını yerel alım gücüne göre elle ayarla.

## 2. RevenueCat

1. Proje oluştur → App Store uygulaması ekle. App Store Connect'te **In-App Purchase Key** üret ve RevenueCat'e yükle.
2. **Products**: yukarıdaki 10 ürünü içe aktar.
3. **Entitlements**:
   - `no_ads` ← `cb.removeads`, `cb.starter`
   - `vip` ← `cb.vip.monthly`, `cb.vip.yearly`
   - `theme_autumn` ← `cb.theme.autumn`, `cb.theme.bundle`
   - `theme_sweets` ← `cb.theme.sweets`, `cb.theme.bundle`
4. **API keys** → iOS public SDK key'i `.env` dosyasına yaz: `EXPO_PUBLIC_REVENUECAT_IOS_KEY=appl_...`
5. Test: App Store Connect'te **Sandbox tester** oluştur. Dev build'i iPhone'a kur ve o hesapla satın al.

İpucu ve düğme bakiyesini RevenueCat değil oyun tutar: tüketilebilir paketler satın alınınca hemen oyuncuya eklenir. Kalıcı ürünlerin (reklamsız, başlangıç paketi) hediyeleri bir kez verilir.

## 3. AdMob

1. AdMob'da uygulama ekle (iOS) → **App ID**'yi `app.json` içindeki `react-native-google-mobile-ads` eklentisinde `iosAppId` alanına yaz. Şu an orada Google'ın örnek kimliği var.
2. İki reklam birimi oluştur: **Interstitial** ve **Rewarded**. Kimliklerini `.env` dosyasına yaz:
   - `EXPO_PUBLIC_ADMOB_IOS_INTERSTITIAL=...`
   - `EXPO_PUBLIC_ADMOB_IOS_REWARDED=...`

   Bunlar yalnızca release build'de kullanılır; geliştirmede her zaman test reklamları çıkar, böylece hesabın yanlışlıkla tıklamadan ceza almaz.
3. **Privacy & messaging** → GDPR mesajı oluştur (AB kullanıcıları için onay formu). Oyun formu otomatik gösterir. Ayarlar'da, gerektiğinde "Gizlilik seçenekleri" butonu görünür.
4. `app-ads.txt`: AdMob'un verdiği satırı, App Store'daki geliştirici web sitenin köküne koy (M8'de siteyle birlikte yapılacak).
5. Mediation ekleyince `app.json`'daki `skAdNetworkItems` listesini ağların listesiyle genişlet.

## Reklam kuralları (kodda: `adPolicy.ts`)

- İlk 8 bölümde ve oyunun ilk açıldığı gün geçiş reklamı yok.
- Geçiş reklamı en az 3 bölümde bir ve en az 4 dakika arayla gösterilir; yalnızca bölüm sonunda "Devam"a basınca.
- Günün Çantası'ndan sonra asla reklam çıkmaz.
- Oyuncu az önce ödüllü reklam izlediyse sıradaki geçiş reklamı atlanır.
- Ödüllü reklamlar hep isteğe bağlı (+1 ipucu, düğmeleri ikiye katlama), günde en fazla 8.
- Banner reklam yok.
- Reklamsız, başlangıç paketi veya VIP sahipleri hiç geçiş reklamı görmez.
