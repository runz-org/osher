import { Client, Value } from './Client';
import { Session } from './Session';
import { Is } from '../Is';

export enum Type {
  string = 'string',
  integer = 'integer',
  real = 'real',
  boolean = 'boolean',
  json = 'json',
}

export abstract class AbstractModel<Entry extends object> {
  public abstract readonly table: string;
  public abstract readonly is: Is<Entry>;
  public abstract readonly type: Record<keyof Entry, Type>;

  constructor(
    protected readonly db: Client,
  ) {}

  protected serialize(entry: Partial<Entry>): Record<keyof Entry, Value> {
    const row = {} as Record<keyof Entry, Value>;

    for (const key of this.is.keys) {
      const type = this.type[key];
      const value = entry[key];

      if (Type.boolean === type) {
        row[key] = value ? 1 : 0;
      } else if (Type.integer === type) {
        row[key] = Is.number(value) && isFinite(value) ? Math.floor(value) : 0;
      } else if (Type.real === type) {
        row[key] = Is.number(value) && isFinite(value) ? value : 0;
      } else if (Type.string === type && Is.string(value)) {
        row[key] = '' === value ? null : value;
      } else {
        const json = JSON.stringify(value || {});
        row[key] = undefined === json || '{}' === json ? null : json;
      }
    }

    return row;
  }

  protected unserialize(row: Record<string, Value>): Entry {
    const entry = {} as Entry;

    for (const key of this.is.keys) {
      const type = this.type[key];
      const value = row[key as string];
      let entryValue: unknown;

      if (Type.boolean === type) {
        entryValue = value ? true : false;
      } else if (Type.integer === type) {
        entryValue = Is.number(value) && isFinite(value) ? Math.floor(value) : 0;
      } else if (Type.real === type) {
        entryValue = Is.number(value) && isFinite(value) ? value : 0;
      } else if (Type.json === type) {
        entryValue = value ? (Is.string(value) ? JSON.parse(value) : value) : {};
      } else {
        entryValue = value ? `${value}` : '';
      }

      if (!this.is.value[key](entryValue)) {
        throw new Error(`Failed to userialize: rowid = ${row.rowid}, key = ${key}, value = ${value}`);
      }

      entry[key] = entryValue;
    }

    return entry;
  }

  public async findAll(): Promise<{ id: number, entry: Entry }[]> {
    const sql = `SELECT rowid, * FROM ${this.table}`;
    const rows = await this.db.all(sql);
    return rows.map(row => ({
      id: row.rowid as number,
      entry: this.unserialize(row),
    }));
  }

  public async getById(id: number): Promise<Entry | null> {
    const sql = `SELECT * FROM ${this.table} WHERE rowid=$id`;
    const row = await this.db.get(sql, { $id: id });
    return row ? this.unserialize(row) : null;
  }

  public async insertOne(entry: Partial<Entry>): Promise<number> {
    const placeholders: string[] = [];
    const params: Record<string, Value> = {};
    const rows = this.serialize(entry);

    for (const key of this.is.keys) {
      placeholders.push(`$${key}`);
      params[`$${key}`] = rows[key];
    }

    const sql =
      this.is.keys.length > 0 ?
      `INSERT INTO ${this.table} (${this.is.keys.join(', ')}) VALUES (${placeholders.join(', ')})` :
      `INSERT INTO ${this.table} DEFAULT VALUES`;
    const result = await this.db.run(sql, params);

    return result.lastID;
  }

  public async updateById(id: number, entry: Partial<Entry>): Promise<number> {
    const keys = (Object.keys(entry) as (keyof Entry)[]).filter( key => undefined !== entry[key] );

    if (keys.length === 0) {
      return 0;
    }

    const placeholders: string[] = [];
    const params: Record<string, Value> = { '$id': id };
    const rows = this.serialize(entry);

    for (const key of keys) {
      placeholders.push(`${key}=$${key}`);
      params[`$${key}`] = rows[key];
    }

    const sql = `UPDATE ${this.table} SET ${placeholders.join(', ')} WHERE rowid=$id`;
    const result = await this.db.run(sql, params);

    return result.changes;
  }

  public async deleteById(id: number): Promise<number> {
    const sql = `DELETE FROM ${this.table} WHERE rowid=$id`;
    const result = await this.db.run(sql, { $id: id });
    return result.changes;
  }

  public async createColumns(
    options: { session?: Session } = {},
  ): Promise<void> {
    await this.db.transaction(async session => {
      const hasColumns = await this.db.all(`PRAGMA table_info(${this.table})`);
      const columns: string[] = [];

      for (const key of this.is.keys) {
        const type = {
          [Type.string]: 'TEXT',
          [Type.integer]: 'INTEGER',
          [Type.real]: 'REAL',
          [Type.boolean]: 'INTEGER',
          [Type.json]: 'JSON',
        }[this.type[key]];

        if (!hasColumns.find(row => row.name === key && row.type === type)) {
          columns.push(`${key} ${type}`);
        }
      }

      if (hasColumns.length > 0) {
        await this.db.exec(columns.map(column => `ALTER TABLE ${this.table} ADD ${column}`));
      } else {
        await this.db.run(`CREATE TABLE ${this.table} (${columns.join(', ')})`);
      }
    }, options)
  }

  public async createIndex(
    keys: {[K in keyof Entry]?: 1|-1},
    options: { unique?: boolean } = {},
  ): Promise<void> {
    const nameParts: string[] = [];
    const columns: string[] = [];

    for (const key in keys) {
      const direction = keys[key] === -1 ? 'DESC' : 'ASC';
      nameParts.push(`${key}_${direction}`);
      columns.push(`${key} ${direction}`);
    }

    const CREATE = options.unique ? 'CREATE UNIQUE' : 'CREATE';
    const name = nameParts.join('_') + (options.unique ? '_unique' : '');
    const sql = `${CREATE} INDEX IF NOT EXISTS ${name} ON ${this.table} (${columns.join(', ')})`;
    await this.db.run(sql);
  }
}
