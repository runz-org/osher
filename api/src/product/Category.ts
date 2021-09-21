import { AbstractModel, Type } from '../sqlite/AbstractModel';
import { Value } from '../sqlite/Client';
import { Is, InferEntry } from '../Is';

export const isCategory = new Is({
  slug: Is.string,
  title: Is.string,
} as const)

export type Category = InferEntry<typeof isCategory>;

export class CategoryModel extends AbstractModel<Category> {
  table = 'category'
  is = isCategory
  type: Record<keyof Category, Type> = {
    slug: Type.string,
    title: Type.string,
  }

  public async createIndexes(): Promise<void> {
    await this.createIndex({ slug: 1 }, { unique: true });
  }

  public async getBySlug(slug: string): Promise<Category | null> {
    const sql = `SELECT * FROM ${this.table} WHERE slug=$slug`;
    const row = await this.db.get(sql, { $slug: slug });
    return row ? this.unserialize(row): null;
  }

  public async updateBySlug(slug: string, category: Partial<Category>): Promise<number> {
    const keys = (Object.keys(category) as (keyof Category)[]).filter( key => undefined !== category[key] );

    if (keys.length === 0) {
      return 0;
    }

    const placeholders: string[] = [];
    const params: Record<string, Value> = { '$slug': slug };
    const rows = this.serialize(category);

    for (const key of keys) {
      placeholders.push(`${key}=$${key}`);
      params[`$${key}`] = rows[key];
    }

    const sql = `UPDATE ${this.table} SET ${placeholders.join(', ')} WHERE slug=$slug`;
    const result = await this.db.run(sql, params);

    return result.changes;
  }

  public async deleteBySlug(slug: string): Promise<number> {
    const sql = `DELETE FROM ${this.table} WHERE slug=$slug`;
    const result = await this.db.run(sql, { $slug: slug });
    return result.changes;
  }
}
