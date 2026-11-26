// Username + password login for the admin panel (/admin).
//
// Nothing secret lives in this file. Netlify environment variables hold:
//   ADMIN_USER           the username (e.g. admin)
//   ADMIN_PASSWORD_HASH  output of `node scripts/hash-password.mjs "<password>"`
//   GITHUB_TOKEN         a fine-grained GitHub token with Contents: Read and write on this repo only
//
// Decap CMS opens this function in a popup. After a correct username and password it hands
// the GitHub token to the panel (same origin only) so the panel can save changes to GitHub.
import crypto from "node:crypto";

const html = (body, status = 200) =>
  new Response(body, {
    status,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store",
      "X-Frame-Options": "DENY",
      "Referrer-Policy": "no-referrer",
    },
  });

const page = (inner) => `<!DOCTYPE html>
<html lang="tr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex"><title>Yönetim Paneli Girişi</title>
<style>
  *{box-sizing:border-box}body{margin:0;min-height:100vh;display:grid;place-items:center;background:#0e1116;color:#f4efe7;font-family:system-ui,-apple-system,Segoe UI,sans-serif}
  form{width:min(340px,90vw);display:flex;flex-direction:column;gap:14px}
  h1{font-family:Georgia,serif;font-weight:400;font-size:28px;margin:0 0 6px}h1 span{color:#c8a46a;font-style:italic}
  label{font-size:12px;letter-spacing:.15em;text-transform:uppercase;color:#8a8f98}
  input{width:100%;margin-top:6px;padding:12px 14px;border-radius:10px;border:1px solid rgba(255,255,255,.15);background:#161b22;color:#f4efe7;font-size:16px}
  input:focus{outline:none;border-color:#c8a46a}
  button{margin-top:8px;padding:13px;border:0;border-radius:999px;background:#c8a46a;color:#0e1116;font-weight:600;font-size:15px;cursor:pointer}
  .err{background:rgba(220,80,80,.15);border:1px solid rgba(220,80,80,.4);padding:10px 12px;border-radius:10px;font-size:14px}
</style></head><body>${inner}</body></html>`;

const form = (error = "") =>
  page(`<form method="POST" autocomplete="on">
  <h1>M<span>A</span> · Panel</h1>
  ${error ? `<div class="err">${error}</div>` : ""}
  <label>Kullanıcı adı<input name="username" autocomplete="username" required autofocus></label>
  <label>Şifre<input name="password" type="password" autocomplete="current-password" required></label>
  <button type="submit">Giriş yap</button>
</form>`);

// ADMIN_PASSWORD_HASH format: pbkdf2-sha256$<iterations>$<salt base64>$<hash base64>
function checkPassword(password, stored) {
  const parts = String(stored || "").split("$");
  if (parts.length !== 4 || parts[0] !== "pbkdf2-sha256") return false;
  const iterations = parseInt(parts[1], 10);
  const salt = Buffer.from(parts[2], "base64");
  const expected = Buffer.from(parts[3], "base64");
  const actual = crypto.pbkdf2Sync(password, salt, iterations, expected.length, "sha256");
  return actual.length === expected.length && crypto.timingSafeEqual(actual, expected);
}

function sameText(a, b) {
  const x = crypto.createHash("sha256").update(String(a)).digest();
  const y = crypto.createHash("sha256").update(String(b)).digest();
  return crypto.timingSafeEqual(x, y);
}

export default async (req) => {
  const { ADMIN_USER, ADMIN_PASSWORD_HASH, GITHUB_TOKEN, URL: SITE_URL } = process.env;
  if (!ADMIN_USER || !ADMIN_PASSWORD_HASH || !GITHUB_TOKEN) {
    return html(page(`<p class="err">Panel henüz kurulmadı: Netlify ortam değişkenleri eksik.</p>`), 500);
  }

  if (req.method !== "POST") return html(form());

  const data = new URLSearchParams(await req.text());
  const userOk = sameText(data.get("username") || "", ADMIN_USER);
  const passOk = checkPassword(data.get("password") || "", ADMIN_PASSWORD_HASH);

  if (!(userOk && passOk)) {
    // slow down guessing
    await new Promise((r) => setTimeout(r, 1500));
    return html(form("Kullanıcı adı veya şifre hatalı."), 401);
  }

  // Only the site itself (and local previews) may receive the token.
  const allowed = [SITE_URL, process.env.DEPLOY_PRIME_URL, new URL(req.url).origin].filter(Boolean);
  const payload = JSON.stringify({ token: GITHUB_TOKEN, provider: "github" });

  return html(
    page(`<p>Giriş başarılı, panel açılıyor…</p>
<script>
(function () {
  var allowed = ${JSON.stringify(allowed)};
  function receive(e) {
    if (allowed.indexOf(e.origin) === -1) return;
    window.opener.postMessage("authorization:github:success:" + ${JSON.stringify(payload)}, e.origin);
    window.removeEventListener("message", receive);
    setTimeout(function () { window.close(); }, 300);
  }
  window.addEventListener("message", receive, false);
  if (window.opener) window.opener.postMessage("authorizing:github", "*");
  else document.body.innerHTML = "<p>Bu sayfa panelden açılmalı: /admin</p>";
})();
</script>`)
  );
};

export const config = { path: "/api/admin-login" };
