import { AbstractModel, Type } from '../sqlite/AbstractModel';
import { Is, InferEntry } from '../Is';
import { Phone, isPhone } from '../Phone';
import sms from '../Sms';
import { Session } from '../sqlite/Session';

export const isSmsCode = new Is({
  phone: isPhone,
  code: Is.string,
  sent_mts: Is.number,
  try_count: Is.number,
})

export type SmsCode = InferEntry<typeof isSmsCode>;

export class SmsCodeModel extends AbstractModel<SmsCode> {
  table = 'sms_code'
  is = isSmsCode
  type: Record<keyof SmsCode, Type> = {
    phone: Type.string,
    code: Type.string,
    sent_mts: Type.integer,
    try_count: Type.integer,
  }

  public async createIndexes(): Promise<void> {
    await this.createIndex({ phone: 1 }, { unique: true });
  }

  public async send(
    phone: Phone,
    options: { session?: Session } = {},
  ): Promise<void> {
    const code = '' + (Math.floor(Math.random() * 900000) + 100000);

    await this.db.transaction(async session => {
      await this.insertOne({
        phone,
        code,
        sent_mts: Date.now(),
        try_count: 0,
      });
      await sms.send(phone, `osher.club, код для входа ${code}`);
    }, options)
  }

  public async getByPhone(phone: Phone): Promise<SmsCode | null> {
    const sql = `SELECT * FROM ${this.table} WHERE phone=$phone`;
    const row = await this.db.get(sql, { $phone: phone });
    return row ? this.unserialize(row): null;
  }

  public async incrementTryCount(phone: Phone): Promise<void> {
    const sql = `UPDATE ${this.table} SET try_count=try_count+1 WHERE phone=$phone`;
    await this.db.run(sql, { $phone: phone });
  }

  public async deleteByPhone(phone: Phone): Promise<number> {
    const sql = `DELETE FROM ${this.table} WHERE phone=$phone`;
    const result = await this.db.run(sql, { $phone: phone });
    return result.changes;
  }
}
