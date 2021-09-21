import { AbstractModel, Type } from '../sqlite/AbstractModel';
import { Is, InferEntry } from '../Is';
import { isPhone, Phone } from '../Phone';
import { Value } from '../sqlite/Client';

export enum Status {
  wait_deposit = 'wait_deposit',
  active = 'active',
  done = 'done',
}

export type Images = string[];

export const is = new Is({
  user_phone: isPhone,
  product_id: Is.number,
  price: Is.number,
  mdOrder: Is.string,
  status: Is.enum(Status),
  created_mts: Is.number,
} as const)

export type Entry = InferEntry<typeof is>;

export class Model extends AbstractModel<Entry>{
  table = 'ticket'
  is = is
  type: Record<keyof Entry, Type> = {
    user_phone: Type.string,
    product_id: Type.integer,
    price: Type.integer,
    mdOrder: Type.string,
    status: Type.string,
    created_mts: Type.integer,
  }

  protected serialize(entry: Partial<Entry>): Record<keyof Entry, Value> {
    const { status = Status.wait_deposit, created_mts = Date.now() } = entry;
    return super.serialize({
      ...entry,
      status,
      created_mts,
    });
  }

  public async createIndexes(): Promise<void> {
    await this.createIndex({ user_phone: 1 });
  }

  // Найти ожидающие по номеру заказа сбера
  public async findWaitingByMdOrder(mdOrder: string): Promise<{ id: number, entry: Entry }[]> {
    const sql = `SELECT rowid, * FROM ${this.table} ` +
      `WHERE status=$status AND mdOrder=$mdOrder`;
    const rows = await this.db.all(sql, {$status: Status.wait_deposit, $mdOrder: mdOrder});
    return rows.map(row => ({
      id: row.rowid as number,
      entry: this.unserialize(row),
    }));
  }

  // Найти ожидающие по номеру заказа сбера
  public async findByUserPhone(phone: Phone): Promise<{ id: number, entry: Entry }[]> {
    const sql = `SELECT rowid, * FROM ${this.table} ` +
      `WHERE user_phone=$phone ORDER BY rowid DESC`;
    const rows = await this.db.all(sql, {$phone: phone});
    return rows.map(row => ({
      id: row.rowid as number,
      entry: this.unserialize(row),
    }));
  }
}
