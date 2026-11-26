// Builds the static site into dist/ from the JSON files in content/.
// No dependencies: run with `node build.js` (Netlify runs it on every deploy).
// `node build.js --drafts` also includes blog posts that are not published.
const fs = require("fs");
const path = require("path");

const ROOT = __dirname;
const OUT = path.join(ROOT, "dist");
const SHOW_DRAFTS = process.argv.includes("--drafts");

/* ---------------- helpers ---------------- */
const read = (f) => JSON.parse(fs.readFileSync(path.join(ROOT, "content", f), "utf8"));
const esc = (s) =>
  String(s == null ? "" : s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
// pick the language from a {tr, en} field, falling back to Turkish
const L = (field, lang) => {
  if (field == null) return "";
  if (typeof field !== "object") return String(field);
  return field[lang] || field.tr || "";
};
const t = (field, lang) => esc(L(field, lang));
const pad = (n) => String(n).padStart(2, "0");
const write = (rel, html) => {
  const file = path.join(OUT, rel);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, html);
};
const copyDir = (src, dest) => {
  if (!fs.existsSync(src)) return;
  fs.mkdirSync(dest, { recursive: true });
  for (const e of fs.readdirSync(src, { withFileTypes: true })) {
    const s = path.join(src, e.name), d = path.join(dest, e.name);
    e.isDirectory() ? copyDir(s, d) : fs.copyFileSync(s, d);
  }
};
const fmtDate = (d, lang) => {
  const dt = new Date(d);
  if (isNaN(dt)) return "";
  return dt.toLocaleDateString(lang === "en" ? "en-GB" : "tr-TR", { day: "numeric", month: "long", year: "numeric" });
};
const slugify = (s) =>
  String(s)
    .toLowerCase()
    .replace(/ı/g, "i").replace(/ğ/g, "g").replace(/ü/g, "u").replace(/ş/g, "s").replace(/ö/g, "o").replace(/ç/g, "c")
    .normalize("NFKD").replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

/* ---------------- tiny markdown → html ---------------- */
function inline(s) {
  s = esc(s);
  s = s.replace(/!\[([^\]]*)\]\(([^)\s]+)\)/g, '<img src="$2" alt="$1" loading="lazy" />');
  s = s.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (m, txt, url) => {
    const ext = /^https?:\/\//.test(url);
    return `<a href="${url}"${ext ? ' target="_blank" rel="noopener"' : ""}>${txt}</a>`;
  });
  s = s.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>").replace(/__([^_]+)__/g, "<strong>$1</strong>");
  s = s.replace(/\*([^*]+)\*/g, "<em>$1</em>").replace(/(^|\W)_([^_]+)_(?=\W|$)/g, "$1<em>$2</em>");
  s = s.replace(/`([^`]+)`/g, "<code>$1</code>");
  s = s.replace(/ {2,}$/gm, "<br />");
  return s;
}
function markdown(src) {
  const lines = String(src || "").replace(/\r\n?/g, "\n").split("\n");
  const out = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (!line.trim()) { i++; continue; }
    let m;
    if ((m = line.match(/^(#{1,6})\s+(.*)$/))) {
      const lvl = Math.min(Math.max(m[1].length, 2), 4);
      out.push(`<h${lvl}>${inline(m[2])}</h${lvl}>`); i++; continue;
    }
    if (/^(-{3,}|\*{3,})\s*$/.test(line)) { out.push("<hr />"); i++; continue; }
    if (/^>\s?/.test(line)) {
      const buf = [];
      while (i < lines.length && /^>\s?/.test(lines[i])) buf.push(lines[i++].replace(/^>\s?/, ""));
      out.push(`<blockquote>${markdown(buf.join("\n"))}</blockquote>`); continue;
    }
    if (/^\s*[-*+]\s+/.test(line)) {
      const items = [];
      while (i < lines.length && /^\s*[-*+]\s+/.test(lines[i])) items.push(`<li>${inline(lines[i++].replace(/^\s*[-*+]\s+/, ""))}</li>`);
      out.push(`<ul>${items.join("")}</ul>`); continue;
    }
    if (/^\s*\d+[.)]\s+/.test(line)) {
      const items = [];
      while (i < lines.length && /^\s*\d+[.)]\s+/.test(lines[i])) items.push(`<li>${inline(lines[i++].replace(/^\s*\d+[.)]\s+/, ""))}</li>`);
      out.push(`<ol>${items.join("")}</ol>`); continue;
    }
    const buf = [];
    while (i < lines.length && lines[i].trim() && !/^(#{1,6}\s|>|\s*[-*+]\s|\s*\d+[.)]\s|-{3,}\s*$)/.test(lines[i])) buf.push(lines[i++]);
    const para = inline(buf.join("\n")).replace(/\n/g, " ");
    out.push(/^<img [^>]+\/>$/.test(para) ? `<figure>${para}</figure>` : `<p>${para}</p>`);
  }
  return out.join("\n");
}

/* ---------------- fixed interface text ---------------- */
const UI = {
  tr: {
    menu: "Ana menü", projects: "Projelerim", services: "Yetkinliklerim", about: "Hakkımda", blog: "Blog", contact: "İletişim",
    scroll: "Kaydır", mail: "E-posta", loc: "Konum", name: "Adınız", email: "E-posta", msg: "Mesajınız", send: "Gönder",
    rights: "Tüm hakları saklıdır.", top: "Başa dön ↑", waLabel: "WhatsApp ile yazın",
    blogEyebrow: "Blog", blogTitle1: "Son", blogTitle2: "yazılar", allPosts: "Tüm yazılar", readMore: "Devamını oku",
    backToBlog: "Tüm yazılar", noPosts: "Yakında yeni yazılar burada olacak.", blogIntro: "Otelcilik, dijital pazarlama ve misafir deneyimi üzerine notlar.",
  },
  en: {
    menu: "Main menu", projects: "Projects", services: "Expertise", about: "About", blog: "Blog", contact: "Contact",
    scroll: "Scroll", mail: "Email", loc: "Location", name: "Your name", email: "Email", msg: "Your message", send: "Send",
    rights: "All rights reserved.", top: "Back to top ↑", waLabel: "Message on WhatsApp",
    blogEyebrow: "Blog", blogTitle1: "Latest", blogTitle2: "posts", allPosts: "All posts", readMore: "Read more",
    backToBlog: "All posts", noPosts: "New posts are coming soon.", blogIntro: "Notes on hospitality, digital marketing and guest experience.",
  },
};

/* ---------------- shared parts ---------------- */
const FONTS =
  '<link rel="preconnect" href="https://fonts.googleapis.com" />\n  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />\n  <link href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300;0,9..144,400;0,9..144,600;1,9..144,300;1,9..144,400&family=Inter:wght@300;400;500;600&display=swap" rel="stylesheet" />';
const WA_ICON =
  '<svg viewBox="0 0 24 24" width="26" height="26" fill="currentColor" aria-hidden="true"><path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm0 18.2a8.2 8.2 0 0 1-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8s-.4-.1-.6.1-.7.8-.8 1-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.3-.4.3-.4.7-1.3.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2 5.2 5.2 0 0 0 1.1 2.7 11.8 11.8 0 0 0 4.5 4c1.7.7 2.3.8 3.2.6a2.7 2.7 0 0 0 1.8-1.2 2.2 2.2 0 0 0 .1-1.3c0-.1-.2-.2-.5-.3z"/></svg>';

function head({ lang, title, description, image, url }) {
  return `<!DOCTYPE html>
<html lang="${lang}">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${esc(title)}</title>
  <meta name="description" content="${esc(description)}" />
  <meta property="og:title" content="${esc(title)}" />
  <meta property="og:description" content="${esc(description)}" />
  ${image ? `<meta property="og:image" content="${esc(image)}" />` : ""}
  <meta property="og:type" content="website" />
  <meta name="theme-color" content="#0e1116" />
  <link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'%3E%3Crect width='64' height='64' rx='14' fill='%230e1116'/%3E%3Ctext x='50%25' y='58%25' text-anchor='middle' font-family='Georgia,serif' font-size='30' fill='%23c8a46a'%3EMA%3C/text%3E%3C/svg%3E" />
  ${url ? `<link rel="alternate" hreflang="tr" href="/" /><link rel="alternate" hreflang="en" href="/en/" />` : ""}
  ${FONTS}
  <link rel="stylesheet" href="/css/style.css" />
</head>`;
}

function header(lang, { home, hasBlog }) {
  const u = UI[lang];
  const base = home ? "" : lang === "en" ? "/en/" : "/";
  const homeHref = lang === "en" ? "/en/" : "/";
  return `
  <div class="progress" aria-hidden="true"><span></span></div>
  <header class="header">
    <a href="${home ? "#home" : homeHref}" class="logo"><span class="logo__mark">M<span>A</span></span><span class="logo__tag" lang="en">Hotel Management Service</span></a>
    <nav class="nav" aria-label="${u.menu}">
      <a href="${base}#projects">${u.projects}</a>
      <a href="${base}#services">${u.services}</a>
      <a href="${base}#about">${u.about}</a>
      ${hasBlog ? `<a href="/blog/">${u.blog}</a>` : ""}
      <a href="${base}#contact">${u.contact}</a>
    </nav>
    <div class="lang" role="group" aria-label="Dil / Language">
      <a href="/" class="${lang === "tr" ? "is-active" : ""}" hreflang="tr">TR</a>
      <a href="/en/" class="${lang === "en" ? "is-active" : ""}" hreflang="en">EN</a>
    </div>
    <button class="burger" aria-label="${u.menu}" aria-expanded="false"><span></span><span></span></button>
  </header>`;
}

function footer(lang, contact, { home }) {
  const u = UI[lang];
  const wa = `https://wa.me/${esc(contact.whatsapp_number)}?text=${encodeURIComponent(L(contact.whatsapp_message, lang))}`;
  return `
  <footer class="footer">
    <div class="footer__big">Mehmet Akgül</div>
    <div class="footer__row">
      <span>© <span id="year">${new Date().getFullYear()}</span> Mehmet Akgül · ${u.rights}</span>
      <a href="${home ? "#home" : "#top"}">${u.top}</a>
    </div>
  </footer>

  <a class="wa-float" href="${wa}" target="_blank" rel="noopener" aria-label="${u.waLabel}">${WA_ICON}</a>`;
}

/* ---------------- home page ---------------- */
function homePage(lang, c, posts) {
  const u = UI[lang];
  const { seo, hero, intro, projects, services, about, contact } = c;
  const wa = `https://wa.me/${esc(contact.whatsapp_number)}?text=${encodeURIComponent(L(contact.whatsapp_message, lang))}`;
  const marquee = (intro.marquee || []).map((m) => `<span>${t(m, lang)}</span><i>✦</i>`).join("");
  const latest = posts.slice(0, 3);

  return `${head({ lang, title: L(seo.title, lang), description: L(seo.description, lang), image: seo.og_image, url: true })}
<body>
  <div class="loader" aria-hidden="true">
    <div class="loader__inner">
      <span class="loader__name">Mehmet Akgül</span>
      <span class="loader__count">0</span>
    </div>
  </div>
${header(lang, { home: true, hasBlog: posts.length > 0 })}

  <main>
    <section class="hero" id="home">
      <div class="hero__media"><img src="${esc(hero.image)}" alt="" /></div>
      <div class="hero__shade"></div>
      <div class="hero__content">
        <p class="eyebrow">${t(hero.eyebrow, lang)}</p>
        <h1 class="hero__title">
          <span class="line"><span>${t(hero.line1, lang)}</span></span>
          <span class="line"><em>${t(hero.line2, lang)}</em></span>
          <span class="line"><span>${t(hero.line3, lang)}</span></span>
        </h1>
      </div>
      <div class="hero__scroll"><span>${u.scroll}</span><i></i></div>
    </section>

    <section class="manifesto">
      <p class="manifesto__text" data-split>${t(intro.manifesto, lang)}</p>
    </section>

    <section class="stats">
      ${(intro.stats || [])
        .map(
          (s) => `<div class="stat">${s.prefix ? `<span class="stat__pre">${esc(s.prefix)}</span>` : ""}<span class="stat__num" data-count="${Number(s.number) || 0}">${Number(s.number) || 0}</span>${s.suffix ? `<span class="stat__plus">${esc(s.suffix)}</span>` : ""}<p>${t(s.label, lang)}</p></div>`
        )
        .join("\n      ")}
    </section>

    <div class="marquee" aria-hidden="true">
      <div class="marquee__track">${marquee}${marquee}</div>
    </div>

    <section class="trio">
      <figure class="trio__item trio__item--a">
        <img src="${esc(intro.image_a)}" alt="${t(intro.caption_a, lang)}" loading="lazy" />
        <figcaption>${t(intro.caption_a, lang)}</figcaption>
      </figure>
      <figure class="trio__item trio__item--b">
        <img src="${esc(intro.image_b)}" alt="${t(intro.caption_b, lang)}" loading="lazy" />
        <figcaption>${t(intro.caption_b, lang)}</figcaption>
      </figure>
      <h2 class="trio__title"><span>${t(intro.title1, lang)}</span><br /><em>${t(intro.title2, lang)}</em></h2>
    </section>

    <section class="projects" id="projects">
      <div class="projects__pin">
        <div class="projects__head">
          <p class="eyebrow">${t(projects.eyebrow, lang)}</p>
          <h2 class="section-title">${t(projects.title1, lang)}<br /><em>${t(projects.title2, lang)}</em></h2>
        </div>
        <div class="projects__track">
          ${(projects.items || [])
            .map(
              (p, i) => `<article class="card">
            <div class="card__img"><img src="${esc(p.image)}" alt="${t(p.title, lang)}" loading="lazy" /></div>
            <span class="card__no">${pad(i + 1)}</span>
            <h3>${t(p.title, lang)}</h3>
            <p>${t(p.desc, lang)}</p>
          </article>`
            )
            .join("\n          ")}
          <a class="card card--cta" href="#contact">
            <span>${t(projects.cta1, lang)}<br />${t(projects.cta2, lang)}</span>
            <i>→</i>
          </a>
        </div>
      </div>
    </section>

    <section class="services" id="services">
      <div class="services__intro">
        <p class="eyebrow">${t(services.eyebrow, lang)}</p>
        <h2 class="section-title">${t(services.title1, lang)}<br /><em>${t(services.title2, lang)}</em></h2>
      </div>
      <ol class="services__list">
        ${(services.items || [])
          .map((s, i) => `<li class="service"><span class="service__no">${pad(i + 1)}</span><h3>${t(s.title, lang)}</h3><p>${t(s.desc, lang)}</p></li>`)
          .join("\n        ")}
      </ol>
    </section>

    <section class="about" id="about">
      <div class="about__media">
        <div class="about__frame">
          <span class="about__ring about__ring--glow" aria-hidden="true"></span>
          <span class="about__ring about__ring--dash" aria-hidden="true"></span>
          <img src="${esc(about.photo)}" alt="${esc(about.name1)} ${esc(about.name2)}" width="800" height="800" loading="lazy" />
          <div class="about__badge"><strong>${esc(about.years)}</strong><span>${t(about.badge, lang)}</span></div>
        </div>
      </div>
      <div class="about__body">
        <p class="eyebrow">${t(about.eyebrow, lang)}</p>
        <h2 class="section-title">${esc(about.name1)} <em>${esc(about.name2)}</em></h2>
        <p class="about__lead" data-split>${t(about.lead, lang)}</p>
        <p class="about__text">${t(about.text, lang)}</p>
        <ul class="timeline">
          ${(about.timeline || []).map((x) => `<li>${t(x, lang)}</li>`).join("\n          ")}
        </ul>
      </div>
    </section>
${
  latest.length
    ? `
    <section class="blog-home" id="blog">
      <div class="blog-home__head">
        <div>
          <p class="eyebrow">${u.blogEyebrow}</p>
          <h2 class="section-title">${u.blogTitle1} <em>${u.blogTitle2}</em></h2>
        </div>
        <a class="link-arrow" href="/blog/">${u.allPosts} →</a>
      </div>
      <div class="post-grid">
        ${latest.map((p) => postCard(p, lang)).join("\n        ")}
      </div>
    </section>
`
    : ""
}
    <section class="contact" id="contact">
      <div class="contact__bg"><img src="${esc(contact.background)}" alt="" loading="lazy" /></div>
      <div class="contact__inner">
        <p class="eyebrow">${t(contact.eyebrow, lang)}</p>
        <h2 class="contact__title"><span>${t(contact.title1, lang)}</span> <em>${t(contact.title2, lang)}</em></h2>
        <div class="contact__grid">
          <div class="contact__info">
            <a class="contact__big" href="${wa}" target="_blank" rel="noopener"><span>WhatsApp</span>${esc(contact.phone_display)}</a>
            <a class="contact__big" href="mailto:${esc(contact.email)}"><span>${u.mail}</span>${esc(contact.email)}</a>
            <p class="contact__loc"><span>${u.loc}</span>${t(contact.location, lang)}</p>
          </div>
          <form class="form" name="iletisim" method="POST" data-netlify="true" netlify-honeypot="bot-field" action="/tesekkurler.html">
            <input type="hidden" name="form-name" value="iletisim" />
            <p class="hidden"><label>Boş bırakın <input name="bot-field" /></label></p>
            <label><span>${u.name}</span><input type="text" name="ad" required /></label>
            <label><span>${u.email}</span><input type="email" name="email" required /></label>
            <label><span>${u.msg}</span><textarea name="mesaj" rows="4" required></textarea></label>
            <button type="submit" class="btn">${u.send}</button>
          </form>
        </div>
      </div>
    </section>
  </main>
${footer(lang, contact, { home: true })}

  <script src="https://cdn.jsdelivr.net/npm/lenis@1.1.13/dist/lenis.min.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/gsap@3.12.5/dist/gsap.min.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/gsap@3.12.5/dist/ScrollTrigger.min.js"></script>
  <script src="/js/main.js"></script>
</body>
</html>
`;
}

/* ---------------- blog ---------------- */
function postCard(p, lang) {
  const u = UI[lang];
  return `<a class="post-card" href="/blog/${p.slug}/">
          ${p.cover ? `<div class="post-card__img"><img src="${esc(p.cover)}" alt="" loading="lazy" /></div>` : ""}
          <time datetime="${esc(p.date)}">${fmtDate(p.date, "tr")}</time>
          <h3>${esc(p.title)}</h3>
          ${p.summary ? `<p>${esc(p.summary)}</p>` : ""}
          <span class="post-card__more">${u.readMore} →</span>
        </a>`;
}

function blogIndex(posts, c) {
  const u = UI.tr;
  return `${head({ lang: "tr", title: `Blog — Mehmet Akgül`, description: u.blogIntro, image: c.seo.og_image })}
<body class="page" id="top">
${header("tr", { home: false, hasBlog: true })}
  <main class="blog-page">
    <section class="blog-hero">
      <p class="eyebrow">${u.blogEyebrow}</p>
      <h1 class="section-title">Notlar & <em>yazılar</em></h1>
      <p class="blog-hero__intro">${u.blogIntro}</p>
    </section>
    <section class="post-grid post-grid--page">
      ${posts.length ? posts.map((p) => postCard(p, "tr")).join("\n      ") : `<p class="blog-empty">${u.noPosts}</p>`}
    </section>
  </main>
${footer("tr", c.contact, { home: false })}
  <script src="/js/main.js"></script>
</body>
</html>
`;
}

function blogPost(p, c) {
  const u = UI.tr;
  return `${head({ lang: "tr", title: `${p.title} — Mehmet Akgül`, description: p.summary || p.title, image: p.cover || c.seo.og_image })}
<body class="page" id="top">
${header("tr", { home: false, hasBlog: true })}
  <main class="article">
    <header class="article__head">
      <a class="link-arrow" href="/blog/">← ${u.backToBlog}</a>
      <time datetime="${esc(p.date)}">${fmtDate(p.date, "tr")}</time>
      <h1>${esc(p.title)}</h1>
      ${p.summary ? `<p class="article__summary">${esc(p.summary)}</p>` : ""}
    </header>
    ${p.cover ? `<figure class="article__cover"><img src="${esc(p.cover)}" alt="" /></figure>` : ""}
    <div class="article__body">
${markdown(p.body)}
    </div>
    <div class="article__foot">
      <a class="btn" href="/#contact">${u.contact}</a>
      <a class="link-arrow" href="/blog/">← ${u.backToBlog}</a>
    </div>
  </main>
${footer("tr", c.contact, { home: false })}
  <script src="/js/main.js"></script>
</body>
</html>
`;
}

/* ---------------- build ---------------- */
function loadPosts() {
  const dir = path.join(ROOT, "content", "blog");
  if (!fs.existsSync(dir)) return [];
  const posts = [];
  for (const f of fs.readdirSync(dir)) {
    if (!f.endsWith(".json")) continue;
    try {
      const p = JSON.parse(fs.readFileSync(path.join(dir, f), "utf8"));
      if (p.published === false && !SHOW_DRAFTS) continue;
      p.slug = slugify(f.replace(/\.json$/, "")) || slugify(p.title);
      posts.push(p);
    } catch (e) {
      console.warn(`! Skipping ${f}: ${e.message}`);
    }
  }
  return posts.sort((a, b) => new Date(b.date) - new Date(a.date));
}

function build() {
  const c = {};
  for (const k of ["seo", "hero", "intro", "projects", "services", "about", "contact"]) c[k] = read(`${k}.json`);
  const posts = loadPosts();

  fs.rmSync(OUT, { recursive: true, force: true });
  fs.mkdirSync(OUT, { recursive: true });

  write("index.html", homePage("tr", c, posts));
  write("en/index.html", homePage("en", c, posts));
  write("blog/index.html", blogIndex(posts, c));
  for (const p of posts) write(`blog/${p.slug}/index.html`, blogPost(p, c));

  for (const d of ["css", "js", "images", "admin"]) copyDir(path.join(ROOT, d), path.join(OUT, d));
  fs.copyFileSync(path.join(ROOT, "tesekkurler.html"), path.join(OUT, "tesekkurler.html"));

  console.log(`Built ${2 + 1 + posts.length} pages (${posts.length} blog post${posts.length === 1 ? "" : "s"}) into dist/`);
}

build();
