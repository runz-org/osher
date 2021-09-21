import sqlite from './sqlite/Client';
import { Model as UserModel } from './user/Model';
import { SmsCodeModel } from './user/SmsCode';
import { CategoryModel } from './product/Category';
import { Model as ProductModel } from './product/Model';
import { Model as SberModel } from './sber/Model';
import { Model as TicketModel } from './ticket/Model';

export class DbUpdate {
  public async schema(): Promise<void> {

    await sqlite(async db => {
      const wal = await db.get('PRAGMA journal_mode=WAL;');

      if (null !== wal && 'wal' === wal.journal_mode) {
        console.log('Write Ahead Logging journal mode is active');
      } else {
        console.log('Failed to setup Write Ahead Logging journal mode');
      }

      console.log('Creating columns and indexes...')

      await db.transaction(async session => {
        console.log('  user');
        const user = new UserModel(db);
        await user.createColumns({session});
        await user.createIndexes();

        console.log('  sms_code');
        const smsCode = new SmsCodeModel(db);
        await smsCode.createColumns({session});
        await smsCode.createIndexes();

        console.log('  category');
        const category = new CategoryModel(db);
        await category.createColumns({session});
        await category.createIndexes();

        console.log('  product');
        const product = new ProductModel(db);
        await product.createColumns({session});
        await product.createIndexes();

        console.log('  sber');
        const sber = new SberModel(db);
        await sber.createColumns({session});
        await sber.createIndexes();

        console.log('  ticket');
        const ticket = new TicketModel(db);
        await ticket.createColumns({session});
        await ticket.createIndexes();

      });
    });
  }
}
