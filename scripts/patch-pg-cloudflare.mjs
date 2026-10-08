// OpenNext traces node_modules via the package's `default` export condition, but
// pg-cloudflare's `default` is a stub (dist/empty.js). The real CloudflareSocket impl
// sits behind the `workerd` condition (dist/index.js), which esbuild bundles against —
// so it gets dropped from the copy and the build fails to resolve "pg-cloudflare".
// Repoint `default` at the real file so the tracer copies it. Runs every build (idempotent).
import { readFileSync, writeFileSync } from 'node:fs';

const pkgPath = 'node_modules/pg-cloudflare/package.json';
const pkg = JSON.parse(readFileSync(pkgPath, 'utf8'));

if (pkg.exports?.['.']?.default !== './dist/index.js') {
  pkg.exports['.'].default = './dist/index.js';
  writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n');
  console.log('patched pg-cloudflare default export -> ./dist/index.js');
} else {
  console.log('pg-cloudflare already patched');
}
