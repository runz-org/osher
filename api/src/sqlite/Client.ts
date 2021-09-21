import sqlite3, { Database, RunResult } from 'sqlite3';
import fs from 'fs/promises';
import { Session, Mode as SessionMode } from './Session';

export type Value = null | string | number;

export interface OpenOptions {
  readonly?: boolean,
  shared?: boolean,
  busyTimeout?: number, // default 6000
}

export class Client {
  public constructor(
    public readonly client: Database,
  ) {}

  public async transaction<P>(
    callback: (session: Session) => Promise<P>,
    options: {
      // Вложенные сессии НЕ работают асинхронно!
      // Нужно делать отдельные подключения с рутовыми сессиями
      session?: Session,
      mode?: SessionMode,
    } = {}
  ): Promise<P> {
    const { mode = SessionMode.immediate } = options;

    // Продолжаем в родительской сессии, если savepoint не указано явно
    if (undefined !== options.session && SessionMode.savepoint !== mode) {
      return callback(options.session);
    }

    // Если у нас вложенная сессия, но не начата рутовая,
    // то по документации она будет работать, как deferred.
    const session = new Session(mode, options.session);
    await this.run(session.begin);

    try {
      const result = await callback(session);
      await this.run(session.commit);
      return result;

    } catch (error) {
      await this.run(session.rollback);
      throw error;
    }
  }

  public run(sql: string, params: any = []): Promise<RunResult> {
    return new Promise((resolve, reject) => {
      this.client.run(sql, params, function(error) {
        if (null === error) {
          // Выше специально объявлено function, чтобы захватить контекст
          resolve(this);
        } else {
          reject(error);
        }
      });
    });
  }

  public async exec(sqls: string[]): Promise<void> {
    if (sqls.length === 0) return;

    return new Promise((resolve, reject) => {
      this.client.exec(sqls.join(';'), error => {
        if (null === error) {
          resolve();
        } else {
          reject(error);
        }
      });
    });
  }

  public get(sql: string, params: any = []): Promise<Record<string, Value> | null> {
    return new Promise((resolve, reject) => {
      this.client.get(sql, params, (error, row) => {
        if (null === error) {
          resolve(row === undefined ? null : row);
        } else {
          reject(error);
        }
      });
    });
  }

  public all(sql: string, params: any = []): Promise<Record<string, Value>[]> {
    return new Promise((resolve, reject) => {
      this.client.all(sql, params, (error, rows) => {
        if (null === error) {
          resolve(rows);
        } else {
          reject(error);
        }
      });
    });
  }

  protected static async open(options: OpenOptions = {}): Promise<Database> {
    // для тех, у кого тянутся ручки это расхардкодить:
    //  ...а вы уверены, что в условиях докера это 100% актуально?
    const root = `${__dirname}/../../storage`;
    await fs.mkdir(root, { recursive: true });

    const mode =
      (options.readonly ? sqlite3.OPEN_READONLY : sqlite3.OPEN_CREATE | sqlite3.OPEN_READWRITE) |
      (options.shared ? sqlite3.OPEN_SHAREDCACHE : sqlite3.OPEN_PRIVATECACHE);

    return new Promise((resolve, reject) => {
      const client = new sqlite3.Database(`${root}/db`, mode, error => {
        if (null === error) {
          client.configure('busyTimeout', options.busyTimeout || 6000);
          resolve(client);
        } else {
          reject(error);
        }
      });
    });
  }

  protected close(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.client.close(error => {
        if (null === error) {
          resolve();
        } else {
          reject(error);
        }
      })
    });
  }

  public static async connection<P>(
    callback: (db: Client) => Promise<P>,
    options: OpenOptions = {},
  ): Promise<P> {
    const client = await Client.open(options);
    const instance = new Client(client);

    try {
      return await callback(instance);
    } finally {
      await instance.close();
    }
  }
}

export default Client.connection;
