// Decap CMS configuration for the admin panel at /admin.
// After the GitHub repository exists, set GITHUB_REPO below to "kullanici-adi/repo-adi".
const GITHUB_REPO = "soufranceo/mehmetakgul-site";

/* ---------- small helpers so every text field gets a Turkish + English box ---------- */
const tr_en = (name, label, widget = "string", hint) => ({
  name,
  label,
  widget: "object",
  collapsed: false,
  hint,
  fields: [
    { name: "tr", label: "Türkçe", widget },
    { name: "en", label: "English", widget, required: false, hint: "Boş bırakılırsa Türkçe metin kullanılır." },
  ],
});
const img = (name, label, hint) => ({ name, label, widget: "image", hint, choose_url: true });
const str = (name, label, hint, extra = {}) => ({ name, label, widget: "string", hint, ...extra });

const pageFile = (name, label, file, fields) => ({ name, label, file, fields });

CMS.init({
  config: {
    locale: "tr",
    load_config_file: false,
    backend: window.CMS_TEST_MODE ? { name: "test-repo" } : {
      name: "github",
      repo: GITHUB_REPO,
      branch: "main",
      // username + password login handled by netlify/functions/auth.mjs
      base_url: window.location.origin,
      auth_endpoint: "api/admin-login",
      commit_messages: {
        create: "Yeni {{collection}}: {{slug}}",
        update: "Güncelleme {{collection}}: {{slug}}",
        delete: "Silindi {{collection}}: {{slug}}",
        uploadMedia: "Görsel yüklendi: {{path}}",
        deleteMedia: "Görsel silindi: {{path}}",
      },
    },
    // lets you try the panel on your own computer with `npx decap-server`
    local_backend: true,
    site_url: "/",
    display_url: "/",
    logo_url: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'%3E%3Crect width='64' height='64' rx='14' fill='%230e1116'/%3E%3Ctext x='50%25' y='58%25' text-anchor='middle' font-family='Georgia,serif' font-size='30' fill='%23c8a46a'%3EMA%3C/text%3E%3C/svg%3E",
    media_folder: "images/uploads",
    public_folder: "/images/uploads",
    slug: { encoding: "ascii", clean_accents: true, sanitize_replacement: "-" },

    collections: [
      /* ---------------- BLOG ---------------- */
      {
        name: "blog",
        label: "Blog Yazıları",
        label_singular: "Blog Yazısı",
        description: "Yeni yazı eklemek için sağ üstteki “Yeni Blog Yazısı” butonuna basın. Kaydedip yayınladıktan 1–2 dakika sonra sitede görünür.",
        folder: "content/blog",
        format: "json",
        extension: "json",
        create: true,
        delete: true,
        slug: "{{slug}}",
        identifier_field: "title",
        summary: "{{title}}  ·  {{date | date('DD.MM.YYYY')}}",
        sortable_fields: ["date", "title"],
        fields: [
          str("title", "Başlık"),
          { name: "date", label: "Tarih", widget: "datetime", format: "YYYY-MM-DDTHH:mm:ss.SSSZ", date_format: "DD.MM.YYYY", time_format: "HH:mm" },
          { name: "published", label: "Yayında", widget: "boolean", default: true, hint: "Kapalıysa yazı sitede görünmez (taslak)." },
          { ...img("cover", "Kapak görseli", "Yatay bir fotoğraf önerilir."), required: false },
          { name: "summary", label: "Kısa özet", widget: "text", required: false, hint: "Listede ve Google'da görünen 1–2 cümle." },
          { name: "body", label: "Yazı", widget: "markdown", buttons: ["bold", "italic", "link", "heading-two", "heading-three", "quote", "bulleted-list", "numbered-list"], editor_components: ["image"] },
        ],
      },

      /* ---------------- SITE CONTENT ---------------- */
      {
        name: "site",
        label: "Site İçerikleri",
        description: "Ana sayfadaki bölümler. Her metnin Türkçe ve İngilizce kutusu vardır.",
        editor: { preview: false },
        files: [
          pageFile("hero", "1 · Giriş (Hero)", "content/hero.json", [
            img("image", "Arka plan görseli", "Büyük, yatay ve yüksek çözünürlüklü bir fotoğraf."),
            tr_en("eyebrow", "Üst küçük yazı"),
            tr_en("line1", "Başlık — 1. satır"),
            tr_en("line2", "Başlık — 2. satır (altın, italik)"),
            tr_en("line3", "Başlık — 3. satır"),
          ]),
          pageFile("intro", "2 · Tanıtım, Rakamlar ve Görseller", "content/intro.json", [
            tr_en("manifesto", "Tanıtım paragrafı", "text"),
            {
              name: "stats", label: "Rakamlar", widget: "list", summary: "{{fields.prefix}}{{fields.number}}{{fields.suffix}}",
              fields: [
                str("prefix", "Önek (ör. %)", "", { required: false }),
                { name: "number", label: "Sayı", widget: "number", value_type: "int" },
                str("suffix", "Sonek (ör. +)", "", { required: false }),
                tr_en("label", "Açıklama"),
              ],
            },
            { name: "marquee", label: "Kayan yazı kelimeleri", widget: "list", summary: "{{fields.tr}}", fields: [str("tr", "Türkçe"), str("en", "English", "", { required: false })] },
            img("image_a", "Sol görsel"),
            tr_en("caption_a", "Sol görsel etiketi"),
            img("image_b", "Sağ görsel"),
            tr_en("caption_b", "Sağ görsel etiketi"),
            tr_en("title1", "Büyük yazı — 1. satır"),
            tr_en("title2", "Büyük yazı — 2. satır (altın)"),
          ]),
          pageFile("projects", "3 · Projeler", "content/projects.json", [
            tr_en("eyebrow", "Üst küçük yazı"),
            tr_en("title1", "Başlık — 1. satır"),
            tr_en("title2", "Başlık — 2. satır (altın)"),
            {
              name: "items", label: "Projeler", label_singular: "Proje", widget: "list", summary: "{{fields.title.tr}}",
              fields: [img("image", "Görsel"), tr_en("title", "Proje adı"), tr_en("desc", "Açıklama", "text")],
            },
            tr_en("cta1", "Son yuvarlak buton — 1. satır"),
            tr_en("cta2", "Son yuvarlak buton — 2. satır"),
          ]),
          pageFile("services", "4 · Hizmetler / Yetkinlikler", "content/services.json", [
            tr_en("eyebrow", "Üst küçük yazı"),
            tr_en("title1", "Başlık — 1. satır"),
            tr_en("title2", "Başlık — 2. satır (altın)"),
            {
              name: "items", label: "Hizmetler", label_singular: "Hizmet", widget: "list", summary: "{{fields.title.tr}}",
              fields: [tr_en("title", "Hizmet adı"), tr_en("desc", "Açıklama", "text")],
            },
          ]),
          pageFile("about", "5 · Hakkımda", "content/about.json", [
            img("photo", "Profil fotoğrafı", "Kare kırpılmış bir fotoğraf en iyi sonucu verir; yuvarlak çerçevede gösterilir."),
            str("name1", "Ad"),
            str("name2", "Soyad (altın)"),
            str("years", "Rozet sayısı (ör. 17+)"),
            tr_en("badge", "Rozet yazısı"),
            tr_en("eyebrow", "Üst küçük yazı"),
            tr_en("lead", "Giriş paragrafı (büyük)", "text"),
            tr_en("text", "Detay paragrafı", "text"),
            { name: "timeline", label: "Kariyer adımları", widget: "list", summary: "{{fields.tr}}", fields: [str("tr", "Türkçe"), str("en", "English", "", { required: false })] },
          ]),
          pageFile("contact", "6 · İletişim", "content/contact.json", [
            tr_en("eyebrow", "Üst küçük yazı"),
            tr_en("title1", "Başlık — 1. kelime"),
            tr_en("title2", "Başlık — 2. kelime (altın)"),
            str("phone_display", "Telefon (görünen)", "Ör. +90 553 349 18 10"),
            str("whatsapp_number", "WhatsApp numarası", "Sadece rakam, ülke koduyla: 905533491810"),
            tr_en("whatsapp_message", "WhatsApp hazır mesajı"),
            str("email", "E-posta"),
            tr_en("location", "Konum"),
            img("background", "Arka plan görseli"),
          ]),
          pageFile("seo", "7 · Google / Paylaşım Bilgileri (SEO)", "content/seo.json", [
            tr_en("title", "Sayfa başlığı", "string", "Google'da ve tarayıcı sekmesinde görünür."),
            tr_en("description", "Sayfa açıklaması", "text", "Google sonuçlarında başlığın altında görünür (150 karakter civarı)."),
            img("og_image", "Paylaşım görseli", "WhatsApp, Facebook vb. link paylaşıldığında görünen görsel."),
          ]),
        ],
      },
    ],
  },
});
