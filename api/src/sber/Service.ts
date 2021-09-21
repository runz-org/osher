import sqlite from '../sqlite/Client';
import { Session } from '../sqlite/Session';
import { AbstractService, Context } from '../AbstractService';
import { Model, Entry, Status } from './Model';
import { Is } from '../Is';
import { Role } from '../user/Model';

export class Service extends AbstractService {
  // Полный список
  public findAll(): Promise<{
    id: number,
    entry: Entry,
  }[]> {
    return this.model(model => model.findAll(), { readonly: true });
  }

  // Получить по номеру Сбера
  public getByMdOrder({ mdOrder }: { mdOrder: string }): Promise<{
    id: number,
    entry: Entry,
  } | null> {
    return this.model(model => model.getByMdOrder(mdOrder), { readonly: true });
  }

  // Новый платеж
  public async register({ amount }: { amount: number }): Promise<string> {
    const { formUrl } = await this.model(model => model.register(amount));
    return formUrl;
  }

  // Обновить статусы ожидающих платежей
  public async warmStatus(): Promise<void> {
    const mdOrders = await this.model(model => model.waiting(), { readonly: true });

    if (mdOrders.length > 0) {
      console.log('Updating: ', mdOrders)

      await Promise.all(mdOrders.map(mdOrder => this.model(
        async (model, session) => {
          const status = await model.warmStatus(mdOrder, {session})

          if (null !== status) {
            this.statusChange({ mdOrder, status });
          }
        }
      )));
    }
  }

  public async statusChange<T extends {mdOrder: string, status: Status}>(params: T): Promise<T> {
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

const instance = new Service;

const admin = ({ user }: Context) => user?.role === Role.admin;
const anyUser = ({ user }: Context) => !!user;
const guest = () => true;

export const api = instance.defineApi({
  register: [{ amount: Is.number }, anyUser],
  findAll: [{}, admin],
  getByMdOrder: [{ mdOrder: Is.string}, guest],
  statusChange: [{ mdOrder: Is.string, status: Is.enum(Status)}, admin], // для теста
})

export const events = instance.defineEvents({
  statusChange: [{ mdOrder: Is.string, status: Is.enum(Status) }, (user, filterResult) =>
    user === 'admin' || undefined !== filterResult.mdOrder
  ],
})

export const cron = instance.defineCron({
  warmStatus: 15000,
})
