import express, { Request, Response, NextFunction, json } from 'express';
import 'express-async-errors';
import { get as config } from 'config';
import cors from 'cors';
import Busboy from 'busboy';
import { randomBytes } from 'crypto';
import mime from 'mime-types';
import { tmpdir } from 'os';
import { createWriteStream, promises as fs } from 'fs';
import { Files } from './img/Files';
import { InferEntry, Is } from './Is';
import userService from './user/Service';
import { Role } from './user/Model';
import bus, { push, cron } from './bus/Service';

export class Http {
  public async start(): Promise<void> {
    const limit: number = config('http.bodyLimit');
    const debug: boolean = config('http.debug');
    const app = express();

    app.set('trust proxy', 1);
    app.use(cors());
    app.use(json({ limit }));

    // Логирование запросов в консоль
    if (debug) {
      app.use((req, res, next) => {
        console.log(`[${req.method}] ${req.url}`, req.body);
        next();
      });
    }

    // Получить ресайзенную картинку
    app.get('/img/*', async (req, res) => {
      const maxListeners: number = config('image.maxListeners') || 50;
      const sizeLimit: number = config('image.sizeLimit') || 2000;
      const maxAge = 31557600000; // Один год

      req.socket.setMaxListeners(maxListeners);

      try {
        const files = new Files;
        const parsed = files.parseUri(req.path.substring(4));

        if (null === parsed) {
          throw new Error('Incorrect path');
        }

        const { filename, width, height, type } = parsed;

        if (width > sizeLimit || height > sizeLimit) {
          throw new Error('Size limit');
        }

        const image = await files.resize(filename, width, height);

        return res.type(type).set({'Cache-Control': `max-age=${maxAge}`}).send(image);
      } catch (error) {
        console.log(`[ERROR] ${error.message}`);
      }

      const image = Buffer.from('R0lGODlhAQABAIABAAAAAP///yH5BAEAAAEALAAAAAABAAEAAAICTAEAOw==', 'base64');
      res.status(404).type('image/gif').send(image);
    });

    // Аплоаднуть картинку
    app.post('/img', async (req, res, next) => {
      const user = await userService.getUser({token: this.getToken(req)});

      if (null !== user && Role.admin === user.role) {
        const tmp = await this.uploadTmp(req, 'image');

        if (undefined !== tmp.image) {
          try {
            const result = await (new Files).put(tmp.image);
            return res.json({ result });
          } finally {
            await fs.unlink(tmp.image);
          }
        }
      }

      next();
    });

    app.get('/api/sber-callback', (req, res) => {
      console.log('sber callback GET', req.query);
      res.set({'Content-Type': 'text/plain'});
      res.end('OK');
    })

    app.post('/api/sber-callback', (req, res) => {
      console.log('sber callback POST', req.query, req.body);
      res.set({'Content-Type': 'text/plain'});
      res.end('OK');
    })

    // Слушать события апи
    app.get('/api', (req, res) => {
      const heartbeat = Math.max(Is.string(req.query.heartbeat) ? parseInt(req.query.heartbeat) || 0 : 0, 3000);
      req.socket.setTimeout(0);
      res.set({
        'Content-Type': 'text/event-stream',
        'Connection': 'keep-alive',
        'Cache-Control': 'no-cache',
        'X-Accel-Buffering': 'no',
      });
      res.write(`retry: ${heartbeat}\n\n`);
      const push = (event: string, data: unknown) =>
        res.write(`data: ${JSON.stringify({event, data})}\n\n`);
      const session_id = bus.startSession(push, { ip: req.ip });
      push('connected', { session_id });
      const interval = setInterval(() => push('heartbeat', {mts: Date.now()}), heartbeat);
      res.once('close', () => {
        clearInterval(interval);
        bus.closeSession(session_id);
      });
    })

    // Пушнуть в апи
    app.post('/api', async (req, res, next) => {
      const isEntry = new Is({ method: Is.string, params: Is.unknown });
      const isBulk = Array.isArray(req.body);
      const body = isBulk ? req.body : [req.body];
      const isPushData = (x: unknown): x is InferEntry<typeof isEntry>[] =>
        Array.isArray(x) && !x.find(entry => !isEntry.entry(entry));

      if (isPushData(body)) {
        const user = await userService.getUser({ token: this.getToken(req) });
        const ip = req.ip;
        const context = null === user ? { ip } : { user, ip };
        const result = await Promise.all(body.map(({ method, params }) => push(method, params, context)));

        if (isBulk) {
          return res.json(result.map(result => (undefined === result ? {error: "Not Found"} : {result})));

        } else if (undefined !== result[0]) {
          return res.json({result: result[0]});
        }
      }

      next();
    });

    app.use((req, res) => res.status(404).json({ error: 'Not Found' }));

    app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
      console.log(`[ERROR] ${err.message}`, err.stack);
      res.status(500).json({ error: 'Internal Server Error' });
    });

    cron();

    const host: string = config('http.host');
    const port: number = parseInt(config('http.port'));

    app.listen(port, host, () => console.log(`API started at http://${host}:${port}`));
  }

  protected getToken(req: Request): string {
    const token: string = req.headers['authorization'] || '';
    return token.length > 7 && token.startsWith('Bearer ') ? token.substring(7) : '';
  }

  protected uploadTmp(req: Request, ...fieldnames: string[]): Promise<Record<string, string>> {
    const busboy = new Busboy({ headers: req.headers });

    return new Promise((resolve, reject) => {
      const result: Record<string, string> = {};

      busboy.on('file', function(fieldname, file, filename, encoding, mimetype) {
        if (fieldnames.includes(fieldname)) {
          const dir = tmpdir();
          const basename = randomBytes(32).toString('hex');
          const ext = mime.extension(mimetype);
          result[fieldname] = `${dir}/${basename}.${ext}`;

          file.pipe(createWriteStream(result[fieldname]));
        }
      });

      busboy.on('finish', () => resolve(result));

      req.pipe(busboy);
    });
  }
}
