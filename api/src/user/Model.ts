import { AbstractModel, Type } from '../sqlite/AbstractModel';
import { Is, InferEntry } from '../Is';
import { Phone, isPhone } from '../Phone';
import { Value } from '../sqlite/Client';

export enum Status {
  unverified = 'unverified',
  active = 'active',
  blocked = 'blocked',
}

export enum Role {
  admin = 'admin',
  user = 'user',
}

export const is = new Is({
  phone: isPhone,
  name: Is.string,
  status: Is.enum(Status),
  role: Is.enum(Role),
  created_mts: Is.number,
})

export type Entry = InferEntry<typeof is>;

export const isProfileEditable = new Is({
  name: is.value.name,
})

export type ProfileEditable = InferEntry<typeof isProfileEditable>;

export class Model extends AbstractModel<Entry> {
  table = 'user'
  is = is
  type: Record<keyof Entry, Type> = {
    phone: Type.string,
    name: Type.string,
    status: Type.string,
    role: Type.string,
    created_mts: Type.integer,
  }

  public async createIndexes(): Promise<void> {
    await this.createIndex({ phone: 1 }, { unique: true });
  }

  protected serialize(entry: Partial<Entry>): Record<keyof Entry, Value> {
    const { status = Status.blocked, role = Role.user, phone, name = phone } = entry;

    return super.serialize({
      ...entry,
      name,
      status,
      role,
      created_mts: Date.now(),
    });
  }

  public async getByPhone(phone: Phone): Promise<Entry | null> {
    const sql = `SELECT * FROM ${this.table} WHERE phone=$phone`;
    const row = await this.db.get(sql, { $phone: phone });
    return row ? this.unserialize(row): null;
  }

  public async create(phone: Phone): Promise<void> {
    await this.insertOne({
      phone,
      name: phone,
      status: Status.unverified,
      role: Role.user,
      created_mts: Date.now(),
    });
  }

  public async updateByPhone(phone: Phone, entry: Partial<Entry>): Promise<number> {
    const keys = (Object.keys(entry) as (keyof Entry)[]).filter( key => undefined !== entry[key] );

    if (keys.length === 0) {
      return 0;
    }

    const placeholders: string[] = [];
    const params: Record<string, Value> = { '$phone': phone };
    const rows = this.serialize(entry);

    for (const key of keys) {
      placeholders.push(`${key}=$${key}`);
      params[`$${key}`] = rows[key];
    }

    const sql = `UPDATE ${this.table} SET ${placeholders.join(', ')} WHERE phone=$phone`;
    const result = await this.db.run(sql, params);

    return result.changes;
  }

  public async updateProfile(phone: Phone, $set: ProfileEditable): Promise<void> {
    await this.updateByPhone(phone, $set);
  }
}
