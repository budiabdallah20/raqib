import { createServer } from 'node:https';
import next from 'next';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import 'dotenv/config';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// الوضع: dev فقط عند تمرير --dev (npm run dev:https). خلاف ذلك إنتاج دائمًا.
const dev = process.argv.includes('--dev');
// الإنتاج يستمع على كل الواجهات (وراء reverse proxy موثوق) — التطوير على localhost فقط.
const hostname = process.env.HOSTNAME || (dev ? 'localhost' : '0.0.0.0');
const port = parseInt(process.env.PORT || '5000', 10);

let httpsOptions;
try {
  httpsOptions = {
    key: readFileSync(join(__dirname, 'certs/localhost+2-key.pem')),
    cert: readFileSync(join(__dirname, 'certs/localhost+2.pem')),
    // TLS 1.3 فقط — لا تراجع لبروتوكولات أضعف.
    minVersion: 'TLSv1.3',
    ciphers: 'TLS_AES_256_GCM_SHA384:TLS_CHACHA20_POLY1305_SHA256',
    honorCipherOrder: true,
  };
} catch (err) {
  console.error('\n❌ SSL certificates not found in ./certs/');
  console.error('   Run these commands first:');
  console.error('   > C:\\mkcert.exe -install');
  console.error('   > C:\\mkcert.exe -key-file certs/localhost+2-key.pem -cert-file certs/localhost+2.pem localhost 127.0.0.1 ::1\n');
  console.error('   For public production use Let\'s Encrypt (free) via Caddy/Nginx Auto-SSL');
  console.error('   or Cloudflare Universal SSL in Full (Strict) mode.\n');
  process.exit(1);
}

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const server = createServer(httpsOptions, async (req, res) => {
    // Force HTTPS redirect (for any http request that leaks in) — فقط خلف بروكسي موثوق.
    const trustedProxy = process.env.TRUST_PROXY === '1';
    if (trustedProxy && req.headers['x-forwarded-proto'] === 'http') {
      res.writeHead(301, {
        Location: `https://${req.headers.host}${req.url}`,
      });
      res.end();
      return;
    }

    try {
      await handle(req, res);
    } catch (err) {
      console.error('Error occurred handling', req.url, err);
      res.statusCode = 500;
      res.end('internal server error');
    }
  });

  server
    .once('error', (err) => {
      console.error(err);
      process.exit(1);
    })
    .listen(port, hostname, () => {
      console.log(`\n✅ Raqib ready on https://${hostname}:${port} (TLS 1.3)\n`);
    });

  // إيقاف نظيف على SIGTERM/SIGINT
  for (const sig of ['SIGTERM', 'SIGINT']) {
    process.on(sig, () => {
      server.close(() => process.exit(0));
    });
  }
});
