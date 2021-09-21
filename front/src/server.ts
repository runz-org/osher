import fs from 'fs';
import express, { Request, Response } from 'express';
import compression from 'compression';
import { createApp } from './main';
import { renderToString } from '@vue/server-renderer';

const host = '0.0.0.0';
const port = 3000;

const template = fs.readFileSync(`${__dirname}/index.html`, 'utf-8');
const serve = async (req: Request, res: Response) => {
  try {
    const { app, router } = createApp({ ssr: true });
    router.push(req.originalUrl);
    await router.isReady();
    const render = await renderToString(app, { setStatus: (code: number) => res.status(code) });
    res.set({'Content-Type': 'text/html'});
    res.end(template.replace('<!--ssr-outlet-->' , render));
  } catch (err) {
    console.log(`[ERROR] ${err.message}`, err.stack);
    res.set({'Content-Type': 'text/plain'});
    res.end('500 Internal Server Error');
  }
}

const app = express();
app.use(compression());
app.get(['/', '/index.html', '/server.js'], serve);
app.use(express.static(__dirname));
app.get('*', serve);
app.listen(port, host, () => console.log(`Render started at http://${host}:${port}`));
