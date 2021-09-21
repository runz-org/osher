import { AbstractModel, Type } from '../sqlite/AbstractModel';
import { Is, InferEntry } from '../Is';
import { Value } from '../sqlite/Client';

export enum Status {
  hidden = 'hidden',
  upcomming = 'upcomming',
  done = 'done',
}

export type Images = string[];
export type GeoLocation = [number, number];

export const is = new Is({
  slug: Is.string,
  start_time: Is.string,
  title: Is.string,
  status: Is.enum(Status),
  description: Is.string,
  content: Is.string,
  price: Is.number,
  category: Is.string,
  location: Is.string,
  images: (x: unknown): x is Images =>
    Array.isArray(x) && !x.find(image => !Is.string(image)),
  geoloc: (x: unknown): x is GeoLocation =>
    Array.isArray(x) && x.length === 2 && Is.number(x[0]) && Is.number(x[1]),
} as const)

const defaultGeoloc: GeoLocation = [55.75322, 37.622513];

export type Entry = InferEntry<typeof is>;

export class Model extends AbstractModel<Entry>{
  table = 'product'
  is = is
  type: Record<keyof Entry, Type> = {
    slug: Type.string,
    start_time: Type.string,
    title: Type.string,
    status: Type.string,
    description: Type.string,
    content: Type.string,
    price: Type.integer,
    category: Type.string,
    location: Type.string,
    images: Type.json,
    geoloc: Type.json,
  }

  protected serialize(entry: Partial<Entry>): Record<keyof Entry, Value> {
    const { status = Status.hidden, images = [], geoloc = defaultGeoloc, location = 'Москва' } = entry;
    const result = super.serialize({
      ...entry,
      status,
      images: [...new Set(images)],
    });
    return {
      ...result,
      images: '[]' === result.images ? null : result.images,
    };
  }

  protected unserialize(row: Record<string, Value>): Entry {
    return super.unserialize({
      ...row,
      images: row.images || '[]',
      location: row.location || 'Москва',
      geoloc: row.geoloc || JSON.stringify(defaultGeoloc),
    });
  }

  public async createIndexes(): Promise<void> {
    await this.createIndex({ slug: 1 }, { unique: true });
    await this.createIndex({ category: 1 });
  }

  public async getBySlug(slug: string): Promise<{ id: number, entry: Entry } | null> {
    const sql = `SELECT rowid, * FROM ${this.table} WHERE slug=$slug`;
    const row = await this.db.get(sql, { $slug: slug });
    return row && Is.number(row.rowid) ? { id: row.rowid, entry: this.unserialize(row) } : null;
  }

  public async unusedImages(images: Images): Promise<Images> {
    if (images.length === 0) {
      return [];
    }

    const placeholders = Array.from({length: images.length}).map(() => '?').join(',');
    const sql = `SELECT DISTINCT value FROM ${this.table}, json_each(images) ` +
      `WHERE value IN (${placeholders})`;
    const used = await this.db.all(sql, images);

    return images.filter(filename => !used.find(row => row.value === filename));
  }
}
