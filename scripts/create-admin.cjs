#!/usr/bin/env node
/**
 * Create or reset an admin / superadmin account.
 *
 * The seed script does NOT create admin logins, so run this once on any fresh
 * database (and anytime you need to reset the admin password).
 *
 * Usage (from clothing/clothing/):
 *   node scripts/create-admin.cjs --email you@example.com --password "StrongPass123" --name "AURELIA Admin" [--role superadmin]
 *
 * Or via environment variables:
 *   ADMIN_EMAIL=you@example.com ADMIN_PASSWORD="StrongPass123" ADMIN_NAME="AURELIA Admin" ADMIN_ROLE=superadmin node scripts/create-admin.cjs
 *
 * Flags/vars:
 *   --email    / ADMIN_EMAIL     (required)
 *   --password / ADMIN_PASSWORD  (required, min 8 chars)
 *   --name     / ADMIN_NAME      (optional)
 *   --role     / ADMIN_ROLE      "admin" | "superadmin" (default: superadmin)
 *
 * Safe to re-run: if the email already exists it UPDATES the password + role.
 */
const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

/** Minimal `--flag value` parser. */
function parseArgs(argv) {
  const out = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith("--")) {
      const key = a.slice(2);
      const val = argv[i + 1] && !argv[i + 1].startsWith("--") ? argv[++i] : "true";
      out[key] = val;
    }
  }
  return out;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));

  const email = (args.email || process.env.ADMIN_EMAIL || "").trim().toLowerCase();
  const password = args.password || process.env.ADMIN_PASSWORD || "";
  const name = (args.name || process.env.ADMIN_NAME || "AURELIA Admin").trim();
  let role = (args.role || process.env.ADMIN_ROLE || "superadmin").trim().toLowerCase();

  if (role !== "admin" && role !== "superadmin") role = "superadmin";

  // Validate
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    console.error("✖ A valid --email (or ADMIN_EMAIL) is required.");
    process.exit(1);
  }
  if (!password || password.length < 8) {
    console.error("✖ A --password (or ADMIN_PASSWORD) of at least 8 characters is required.");
    process.exit(1);
  }

  const passwordHash = await bcrypt.hash(password, 12);

  const existing = await prisma.user.findUnique({ where: { email }, select: { id: true } });

  const user = await prisma.user.upsert({
    where: { email },
    update: { passwordHash, role, emailVerified: new Date(), name: name || undefined },
    create: {
      email,
      name: name || null,
      passwordHash,
      role,
      emailVerified: new Date(),
    },
    select: { id: true, email: true, role: true },
  });

  console.log(`✔ ${existing ? "Updated" : "Created"} ${user.role} account:`);
  console.log(`   Email: ${user.email}`);
  console.log(`   Role:  ${user.role}`);
  console.log(`   Password set. Log in at /login then open /admin.`);
}

main()
  .catch((e) => { console.error("✖ Failed:", e.message || e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
