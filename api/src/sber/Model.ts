import { get as config } from 'config';
import sber, { Feature, isCardAuthInfo, isSecureAuthInfo, isBindingInfo } from './Client';
import { AbstractModel, Type } from '../sqlite/AbstractModel';
import { Is, InferEntry } from '../Is';
import { randomBytes } from 'crypto';
import { Session } from '../sqlite/Session';

export enum Status {
  wait_approve = 'wait_approve', // Ожидает подтверждения (после создания)
  approved = 'approved', // Создан
  wait_deposit = 'wait_deposit', // Ожидает завершения оплаты
  deposited = 'deposited', // Оплачен
  wait_reverse = 'wait_reverse', // Ожидает отмены
  reversed = 'reversed', // Отменен
  wait_refund = 'wait_refund', // Ожидает возврата средств
  refunded = 'refunded', // Средства возвращены
  declined = 'declined', // Отклонён
}

export const is = new Is({
  order_id: Is.number, // Номер заказа
  amount: Is.number, // Сумма
  deposit_amount: Is.number, // Оплаченная сумма
  refund_amount: Is.number, // Сумма рефанда
  clientId: Is.string, // UID клиента
  bindingId: Is.string, // Ключ связки для безакцептного платежа
  preAuth: Is.boolean, // Предавтоаизация
  features: Is.enum(Feature),
  currency: Is.number, // Валюта
  description: Is.string, // Комментарий
  mdOrder: Is.string, // Номер заказа в системе Сбера
  formUrl: Is.string, // URL для редиректа на форму оплаты
  status: Is.enum(Status), // статус
  actionCode: Is.number, // код состояния в системе Сбера
  actionCodeDescription: Is.string, // Описание состояния в системе Сбера
  ip: Is.string, // IP клиента
  terminalId: Is.string, // Номер платежного терминала
  cardAuthInfo: isCardAuthInfo.partial, // Информация об аутентификации карты
  secureAuthInfo: isSecureAuthInfo.partial, // Инфо об аутентификации
  bindingInfo: isBindingInfo.partial, // Данные о привязке карты
  orderNumber: Is.string, // Сгенеренный внутренний номер транзакции
  register_mts: Is.number, // Момент регистрации
  update_mts: Is.number, // Момент изменения
});

export const isRegisterOptions = new Is({
  order_id: is.value.order_id,
  clientId: is.value.clientId,
  description: is.value.description,
  preAuth: is.value.preAuth,
  features: is.value.features,
  bindingId: is.value.bindingId,
  ip: is.value.ip,
});

export type Entry = InferEntry<typeof is>;
export type RegisterOptions = Partial<InferEntry<typeof isRegisterOptions>>;

export class Model extends AbstractModel<Entry> {
  table = 'sber'
  is = is
  type = {
    order_id: Type.integer,
    amount: Type.real,
    deposit_amount: Type.real,
    refund_amount: Type.real,
    clientId: Type.string,
    bindingId: Type.string,
    preAuth: Type.boolean,
    features: Type.string,
    currency: Type.integer,
    description: Type.string,
    mdOrder: Type.string,
    formUrl: Type.string,
    status: Type.string,
    actionCode: Type.integer,
    actionCodeDescription: Type.string,
    ip: Type.string,
    terminalId: Type.string,
    cardAuthInfo: Type.json,
    secureAuthInfo: Type.json,
    bindingInfo: Type.json,
    orderNumber: Type.string,
    register_mts: Type.integer,
    update_mts: Type.integer,
  }

  protected serialize(entry: Partial<Entry>) {
    const { status = Status.deposited } = entry;
    return super.serialize({
      ...entry,
      status,
      update_mts: Date.now(),
    });
  }

  public async createIndexes(): Promise<void> {
    await this.createIndex({ mdOrder: 1 });
    await this.createIndex({ status: 1, update_mts: 1 });
  }

  // Создание
  public async register(amount: number, options: RegisterOptions = {}): Promise<{
    id: number,
    mdOrder: string,
    formUrl: string,
  }> {

    // Заполняем
    const now = Date.now();
    const chars = 'ABCEHKMOPTX';
    const bytes = randomBytes(3);
    const orderNumber = [
      chars.charAt(bytes[0] % chars.length),
      chars.charAt(bytes[1] % chars.length),
      chars.charAt(bytes[2] % chars.length),
    ].join('') + `:${now}`;

    const entry: Partial<Entry> = {
      ...options,
      amount,
      orderNumber,
      status: options.preAuth ? Status.wait_approve : Status.wait_deposit, // с холдированием или без
      deposit_amount: options.preAuth ? 0 : amount,
      currency: 643,
      register_mts: now,
    };

    // Проводим в Сбере
    const front = config('front');
    const result = await sber.register({
      amount,
      orderNumber,
      returnUrl: `${front}/tickets`,
      failUrl: `${front}/order-fail`,
      clientId: entry.clientId,
      bindingId: entry.bindingId,
      preAuth: entry.preAuth,
      features: entry.features,
      currency: entry.currency,
      description: entry.description,
      pageView: 'MOBILE',
      expirationDate: new Date(now + 1200000),
      dynamicCallbackUrl: `${front}/api/sber-callback`,
    });

    const mdOrder = result.orderId;
    const formUrl = result.formUrl;

    // Сохраняем
    const id = await this.insertOne({ ...entry, mdOrder, formUrl });

    // В случае автоплатежа дёргаем отдельный метод paymentOrderBinding
    // При привязке, ip нужно сохранять вместе с bindingId
    if (Feature.auto_payment === entry.features && entry.bindingId && entry.ip) {
      await sber.paymentOrderBinding({
        mdOrder,
        bindingId: entry.bindingId,
        ip: entry.ip,
      });
    }

    return { id, mdOrder, formUrl };
  }

  /*
  // Завершить оплату при двухфакторном платеже (если был холд, preAuth = true)
  public async deposit(deposit_amount: number, options?: SaveOptions): Promise<this> {
    // Проверка на race-condition
    if (Status.approved !== this.status) {
      return this;
    }

    // Проводим
    if (this.mdOrder) {
      await sber.deposit(this.mdOrder, deposit_amount);
    }

    // Вычисляем сумму и ожидаем колбэка от сбера
    this.deposit_amount += deposit_amount;
    this.status = Status.wait_deposit;

    return this.save(options);
  }

  // Отменить
  public async reverse(options?: SaveOptions): Promise<this> {
    // Проводим
    if (this.mdOrder) {
      await sber.reverse(this.mdOrder);
    }

    // Ожидаем колбэка от сбера
    this.status = Status.wait_reverse;

    return this.save(options);
  }

  // Возвратить средства
  public async refund(refund_amount: number, options?: SaveOptions): Promise<this> {
    // Проводим
    if (this.mdOrder) {
      await sber.refund(this.mdOrder, refund_amount);
    }

    // Вычисляем сумму и ожидаем колбэка от сбера

    this.refund_amount += refund_amount;
    this.deposit_amount -= refund_amount;
    this.status = Status.wait_refund

    return this.save(options);
  }
  */

  // Переход в новый статус
  protected newStatus(status: Status, sberStatus: number): Status | null {
    if (1 === sberStatus && Status.wait_approve === status) {
      return Status.approved;

    } else if (2 === sberStatus && Status.wait_deposit === status) {
      return Status.deposited;

    } else if (3 === sberStatus && Status.wait_reverse === status) {
      return Status.reversed;

    } else if (4 === sberStatus && Status.wait_refund === status) {
      return Status.refunded;

    } else if (6 === sberStatus && Status.declined !== status) {
      return Status.declined;
    }

    return null;
  }

  // Вычитать и обновить статус
  public async warmStatus(
    mdOrder: string,
    options: { session?: Session } = {},
  ): Promise<Status | null> {
    return this.db.transaction(async session => {
      const item = await this.getByMdOrder(mdOrder);

      if (null === item) {
        return null;
      }

      const result = await sber.getOrderStatus(mdOrder);
      const newStatus = this.newStatus(item.entry.status, result.orderStatus);
      const set: Partial<Entry> = {};

      if (Status.approved === newStatus || Status.deposited === newStatus) {
        if (result.bindingInfo?.bindingId) {
          set.bindingId = result.bindingInfo.bindingId;
        }
      }

      if (null !== newStatus) {
        set.status = newStatus;
      }

      set.actionCode = result.actionCode;
      set.actionCodeDescription = result.actionCodeDescription;
      set.ip = result.ip;
      set.terminalId = result.terminalId;
      set.cardAuthInfo = result.cardAuthInfo;
      set.secureAuthInfo = result.secureAuthInfo;
      set.bindingInfo = result.bindingInfo;

      const changes = await this.updateById(item.id, set);

      return changes > 0 ? newStatus : null;
    }, options)
  }

  // Найти по внутреннему номеру Сбера
  public async getByMdOrder(mdOrder: string): Promise<{ id: number, entry: Entry } | null> {
    const sql = `SELECT rowid, * FROM ${this.table} WHERE mdOrder=$mdOrder`;
    const row = await this.db.get(sql, { $mdOrder: mdOrder });
    return row && Is.number(row.rowid) ? { id: row.rowid, entry: this.unserialize(row) } : null;
  }

  // Найти все ожидающие
  public async waiting(): Promise<string[]> {
    const status = [
      Status.wait_approve,
      Status.wait_deposit,
      Status.wait_reverse,
      Status.wait_refund,
    ];

    const placeholders = Array.from({length: status.length}).map(() => '?').join(',');
    const sql = `SELECT mdOrder FROM ${this.table} ` +
      `WHERE status IN (${placeholders}) AND update_mts < ?`;
    const result = await this.db.all(sql, [...status, Date.now() - 15000]);
    return result.map(row => row.mdOrder as string);
  }

  public async findAll(): Promise<{ id: number, entry: Entry }[]> {
    const sql = `SELECT rowid, * FROM ${this.table} ORDER BY rowid DESC`;
    const rows = await this.db.all(sql);
    return rows.map(row => ({
      id: row.rowid as number,
      entry: this.unserialize(row),
    }));
  }
}
