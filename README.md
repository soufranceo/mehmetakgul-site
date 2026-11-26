# Mehmet Akgül — Web Sitesi

Kaydırmalı (scroll) animasyonlu tek sayfa site + blog + yönetim paneli.

- Türkçe ana sayfa: `/` · İngilizce: `/en/` · Blog: `/blog/` · Yönetim paneli: `/admin/`
- İçerikler `content/` klasöründeki JSON dosyalarındadır. Siteyi `build.js` bu dosyalardan `dist/` klasörüne üretir (bağımlılık yok, sadece Node.js).
- Netlify her `git push` sonrası `node build.js` çalıştırır ve `dist/` klasörünü yayınlar.

## Klasörler
| Yol | Ne işe yarar |
| --- | --- |
| `content/*.json` | Ana sayfa metinleri ve görselleri (her metnin `tr` ve `en` hali var) |
| `content/blog/*.json` | Blog yazıları (`published: false` ise taslak, sitede görünmez) |
| `images/` · `images/uploads/` | Görseller (panelden yüklenenler `uploads` klasörüne gider) |
| `admin/` | Yönetim paneli (Decap CMS) |
| `css/`, `js/` | Tasarım ve animasyonlar |
| `build.js` | Sayfaları üreten betik |

## Bilgisayarda deneme
```
node build.js           # yayındaki gibi
node build.js --drafts  # taslak yazılar dahil
```
Sonra `dist/` klasörünü herhangi bir yerel sunucuyla açın.

## Yönetim panelini açma (bir kerelik kurulum)
1. Siteyi GitHub'a gönderin ve Netlify'da bu repoyu bağlayın (Build command: `node build.js`, Publish: `dist` — `netlify.toml` bunu zaten söyler).
2. `admin/config.js` dosyasındaki `GITHUB_REPO` değerini `kullanici-adi/repo-adi` yapın.
3. GitHub → **Settings → Developer settings → Personal access tokens → Fine-grained tokens → Generate new token**
   - Repository access: **Only select repositories** → bu repo
   - Permissions → **Contents: Read and write**
   - Oluşan token'ı kopyalayın.
4. Şifrenin hash'ini üretin (şifre hiçbir dosyaya yazılmaz):
   `node scripts/hash-password.mjs "sifreniz"`
5. Netlify → Site → **Site configuration → Environment variables** → üç değişken ekleyin (hepsini **Secret** işaretleyin):
   - `ADMIN_USER` = kullanıcı adı (ör. `admin`)
   - `ADMIN_PASSWORD_HASH` = 4. adımın çıktısı
   - `GITHUB_TOKEN` = 3. adımdaki token
6. Netlify → **Deploys → Trigger deploy**. Sonra `https://SITENIZ/admin/` → giriş butonu → kullanıcı adı ve şifre.

Şifreyi değiştirmek için 4. adımı yeni şifreyle tekrarlayıp `ADMIN_PASSWORD_HASH` değerini güncelleyin ve yeniden deploy edin.
Giriş kontrolü `netlify/functions/auth.mjs` içinde sunucuda yapılır; şifre ve token tarayıcıya ya da repoya hiç yazılmaz.

## Panelde ne yapılır
- **Blog Yazıları → Yeni Blog Yazısı**: başlık, tarih, kapak görseli, özet ve yazı. "Yayınla" dedikten 1–2 dakika sonra sitede.
- **Site İçerikleri**: Giriş, Tanıtım & Rakamlar, Projeler, Hizmetler, Hakkımda, İletişim ve SEO. Her metnin Türkçe ve İngilizce kutusu var; İngilizce boşsa Türkçesi kullanılır.
- Görselleri sürükle-bırak ile yükleyebilir ya da bir görsel linki yapıştırabilirsiniz.

## İletişim formu
Form Netlify Forms ile çalışır. Gelen mesajlar Netlify → **Forms** bölümündedir; e-posta bildirimi oradan açılır.
