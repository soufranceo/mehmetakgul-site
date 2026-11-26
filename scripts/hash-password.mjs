// Creates the value for the ADMIN_PASSWORD_HASH environment variable on Netlify.
// Usage: node scripts/hash-password.mjs "your-password"
// The output is safe to paste into Netlify; never commit it or the password to the repo.
import crypto from "node:crypto";

const password = process.argv[2];
if (!password) {
  console.error('Kullanım: node scripts/hash-password.mjs "sifreniz"');
  process.exit(1);
}
const iterations = 600000;
const salt = crypto.randomBytes(16);
const hash = crypto.pbkdf2Sync(password, salt, iterations, 32, "sha256");
console.log(`pbkdf2-sha256$${iterations}$${salt.toString("base64")}$${hash.toString("base64")}`);
