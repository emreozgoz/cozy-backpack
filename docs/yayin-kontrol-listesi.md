# Yayın kontrol listesi (M8)

✅ = hazır · ⏳ = senin hesabın / cihazın gerekiyor · 📝 = senden bir bilgi gerekiyor

## Hazır olanlar
- ✅ Uygulama ikonu (açık / koyu / renklendirilmiş), açılış ekranı — `npm run icons`
- ✅ `app.json`: bundle ID `com.emreozgoz.cozybackpack`, iPad, TR/EN yerelleştirme, `ITSAppUsesNonExemptEncryption: false`, izleme izni metni
- ✅ `eas.json`: `development`, `simulator`, `preview`, `production` profilleri
- ✅ Mağaza metinleri (TR/EN): ad, alt başlık, tanıtım metni, açıklama, anahtar kelimeler, yenilikler, inceleme notu — `store/listing.json` (uzunluklar testle denetleniyor)
- ✅ Destek sitesi, gizlilik politikası, kullanım şartları — `site/`
- ✅ Ekran görüntüsü çerçeveleme — `npm run screenshots`
- ✅ Reklamlar yalnızca genel izleyici (G) içeriğiyle sınırlı

## Senden gerekenler
1. 📝 **Destek e-postası:** sitede `SUPPORT_EMAIL` yazan 6 yere gerçek adres gelecek.
2. ⏳ **GitHub Pages'ı aç:** repo → Settings → Pages → Source: **GitHub Actions**. Sonraki push'ta site şu adreste yayınlanır: `https://emreozgoz.github.io/cozy-backpack/`
3. ⏳ **Apple Developer Program** üyeliği ($99/yıl).
4. ⏳ **EAS:** `npx eas-cli@latest login`, ardından `npx eas-cli@latest init` (proje kimliğini `app.json`'a yazar).
5. ⏳ **App Store Connect'te uygulama kaydı:**
   - bundle ID `com.emreozgoz.cozybackpack`
   - birincil dil Türkçe, ikincil dil İngilizce
   - kategori: Oyunlar → Bulmaca, ikincil kategori: Gündelik
6. ⏳ **Ürünler, RevenueCat, AdMob:** `docs/gelir-kurulumu.md`
7. ⏳ **Sentry (isteğe bağlı ama önerilir):**
   - sentry.io'da bir React Native projesi aç, DSN'i `.env`'e `EXPO_PUBLIC_SENTRY_DSN` olarak yaz.
   - Kaynak haritalarının yüklenmesi için `SENTRY_ORG`, `SENTRY_PROJECT` ve `SENTRY_AUTH_TOKEN` değerlerini EAS secret olarak ekle.
   - Ardından `eas.json`'daki `SENTRY_DISABLE_AUTO_UPLOAD` satırlarını sil.
8. ⏳ **İlk TestFlight derlemesi:** `npx eas-cli@latest build --profile production --platform ios` ve ardından `npx eas-cli@latest submit --platform ios`

## Ekran görüntüleri
1. Mac'te simülatörü aç: iPhone 16 Pro Max (6,9") ve iPad Pro 13".
2. Uygulamayı dev build ile çalıştır. Her dil için şu 6 anı yakala (sıra `store/listing.json`'daki başlıklarla aynı):
   1. Yarısı dolu bir çanta, bir eşya sürüklenirken
   2. Fermuarın kapandığı an (kutlama)
   3. Bölümün başı: ders programı notu ve masadaki eşyalar
   4. Süslenmiş oda
   5. Kedili bir bölüm (ya da sakin bir oyun anı)
   6. Günün Çantası
3. Kaydetmek için `Cmd+S`, ardından dosyaları şu klasöre koy: `design/screenshots/raw/{iphone|ipad}/{tr|en}/1.png … 6.png`
4. `npm run screenshots` çalıştır; çıktılar `design/screenshots/out/` altında App Store boyutlarında ve saydamlık kanalı olmadan oluşur.

## App Store Connect formları
- **Yaş derecesi:** tüm içerik soruları "Yok". Uygulama içi satın alma var, reklam var, sınırsız web erişimi yok. Beklenen sonuç 4+.
- **Kids kategorisi:** seçme (üçüncü taraf reklamlar yüzünden).
- **App Privacy (Uygulama Gizliliği):**
  - **Kimlik bilgileri → Cihaz kimliği:** AdMob ve RevenueCat. Kullanım amaçları: üçüncü taraf reklamcılık, uygulama işlevselliği. Kullanıcıyla ilişkilendirilmez; izleme için kullanılır (izin verilirse).
  - **Satın alımlar → Satın alma geçmişi:** RevenueCat. Uygulama işlevselliği için. Kullanıcıyla ilişkilendirilmez.
  - **Kullanım verileri → Ürün etkileşimi:** AdMob. Üçüncü taraf reklamcılık için.
  - **Tanılama verileri:** AdMob (performans ölçümü) ve Sentry (çökme verisi; uygulama işlevselliği). Kullanıcıyla ilişkilendirilmez.
  - **Konum → Yaklaşık konum:** AdMob (IP üzerinden). Üçüncü taraf reklamcılık için.
- **İhracat uyumu (şifreleme):** `app.json`'da beyan edildiği için artık sorulmaz.
- **Sürüm bilgisi:**
  - ekran görüntüleri
  - metinler (`store/listing.json`)
  - destek URL'si ve gizlilik URL'si (`store/listing.json` → `support`)
  - inceleme notu (`reviewNotes`)

## Yayın öncesi son kontrol
- [ ] `app.json`'daki örnek AdMob kimliğini gerçeğiyle değiştir
- [ ] `.env` dosyasında RevenueCat ve AdMob anahtarları var
- [ ] TestFlight'ta gerçek cihazda oyna: sürükle-bırak, fermuar, sesler, titreşim, sürprizler, kedi
- [ ] Sandbox hesabıyla her ürünü satın al, sonra satın alımları geri yükle
- [ ] Reklam izni ve onay formu akışı (bölgeni AB olarak ayarlayıp dene)
- [ ] Düşük donanımlı bir iPhone'da (ör. SE) akıcılık kontrolü
- [ ] Destek sitesi açılıyor, e-posta adresi doğru
