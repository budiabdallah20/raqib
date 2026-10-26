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
const hostname = 'localhost';
const port = parseInt(process.env.PORT || '5000', 10);

let httpsOptions;
try {
  httpsOptions = {
    key: readFileSync(join(__dirname, 'certs/localhost+2-key.pem')),
    cert: readFileSync(join(__dirname, 'certs/localhost+2.pem')),
  };
} catch (err) {
  console.error('\n❌ SSL certificates not found in ./certs/');
  console.error('   Run these commands first:');
  console.error('   > C:\\mkcert.exe -install');
  console.error('   > C:\\mkcert.exe -key-file certs/localhost+2-key.pem -cert-file certs/localhost+2.pem localhost 127.0.0.1 ::1\n');
  process.exit(1);
}

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  createServer(httpsOptions, async (req, res) => {
    // Force HTTPS redirect (for any http request that leaks in)
    if (req.headers['x-forwarded-proto'] === 'http') {
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
  })
    .once('error', (err) => {
      console.error(err);
      process.exit(1);
    })
    .listen(port, () => {
      console.log(`\n✅ Raqib ready on https://${hostname}:${port}\n`);
    });
});