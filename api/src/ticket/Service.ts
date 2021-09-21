import sqlite from '../sqlite/Client';
import { Session } from '../sqlite/Session';
import { AbstractService, Context } from '../AbstractService';
import { is, Model, Entry, Status } from './Model';
import { Model as ProductModel } from '../product/Model';
import { Model as SberModel, Status as SberStatus } from '../sber/Model';
import { Role } from '../user/Model';
import { Is } from '../Is';
import bus from '../bus/Client';
import { isPhone, Phone } from '../Phone';

export class Service extends AbstractService {
  // Полный список
  public findAll(): Promise<{
    id: number,
    entry: Entry,
  }[]> {
    return this.model(model => model.findAll(), { readonly: true });
  }

  // Билеты юзера
  public async my({}, {user}: Context): Promise<{
    id: number,
    entry: Entry,
  }[]> {
    return user ? this.model(model => model.findByUserPhone(user.phone), { readonly: true }) : [];
  }

  // Создать
  public async create({product_id, count}: { product_id: number, count: number }, {user}: Context): Promise<string | undefined> {
    if (undefined === user) {
      return undefined;
    }

    return sqlite(db => db.transaction(async session => {
      const model = new Model(db);
      const productModel = new ProductModel(db);
      const sberModel = new SberModel(db);

      const product = await productModel.getById(product_id);

      if (null === product) {
        return undefined;
      }

      const { formUrl, mdOrder } = await sberModel.register(product.price * count);

      const entry: Entry = {
        user_phone: user.phone,
        product_id,
        price: product.price,
        mdOrder,
        status: Status.wait_deposit,
        created_mts: Date.now(),
      }

      const id = await model.insertOne(entry)
      this.created({id, entry, user_phone: user.phone});

      return formUrl;
    }));
  }

  // Обновить статус
  public async warmStatus({mdOrder, status}: {mdOrder: string, status: SberStatus}): Promise<void> {
    return sqlite(db => db.transaction(async session => {
      const model = new Model(db);
      const items = await model.findWaitingByMdOrder(mdOrder);

      if (SberStatus.deposited === status) {
        for (const {id, entry} of items) {
          await model.updateById(id, {status: Status.active});
          this.statusChange({id, status: Status.active, user_phone: entry.user_phone});
        }
      } else if (SberStatus.declined === status) {
        for (const {id, entry} of items) {
          await model.deleteById(id);
          this.deleted({id, user_phone: entry.user_phone});
        }
      }
    }));
  }

  public async created<T extends {id: number, entry: Entry, user_phone: Phone}>(params: T): Promise<T> {
    return params;
  }

  public async statusChange<T extends {id: number, status: Status, user_phone: Phone}>(params: T): Promise<T> {
    return params;
  }

  public async deleted<T extends {id: number, user_phone: Phone}>(params: T): Promise<T> {
    return params;
  }

  protected model<P>(
    callback: (model: Model, session?: Session) => Promise<P>,
    options: {readonly?: boolean} = {},
  ): Promise<P> {
    if (options.readonly) {
      return sqlite(db => callback(new Model(db)), { readonly: true, shared: true });
    } else {
      return sqlite(db => db.transaction(session => callback(new Model(db), session)));
    }
  }
}

export const instance = new Service;

const session_id = bus.startSession((event, data) => {
  if ('transaction.statusChange' === event) {
    instance.warmStatus(data as {mdOrder: string, status: SberStatus});
  }
}, {ip: 'system.ticket'});
bus.setQuery(session_id, 'transaction.statusChange', {});

const admin = ({ user }: Context) => user?.role === Role.admin;
const anyUser = ({ user }: Context) => !!user;
const sameUser = ({ user }: Context, params: {user_phone?: Phone}) => admin({user}) || user?.phone === params.user_phone;

export const api = instance.defineApi({
  findAll: [{}, admin],
  my: [{}, anyUser],
  create: [{ product_id: Is.number, count: Is.number }, anyUser],
  statusChange: [{id: Is.number, status: Is.enum(Status), user_phone: isPhone}, admin],
})

export const events = instance.defineEvents({
  created: [{id: Is.number, entry: is.entry, user_phone: isPhone}, sameUser],
  statusChange: [{id: Is.number, status: Is.enum(Status), user_phone: isPhone}, sameUser],
  deleted: [{id: Is.number, user_phone: isPhone}, sameUser]
});
