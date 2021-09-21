import jwt from 'jwt-simple';
import { get as config } from 'config';
import { AbstractService, Context } from '../AbstractService';
import { Is } from '../Is';
import { Entry, Model, Status, ProfileEditable, isProfileEditable, is, Role } from './Model';
import { SmsCodeModel } from './SmsCode';
import { Phone, isPhone } from '../Phone';
import sqlite from '../sqlite/Client';
import { Session } from '../sqlite/Session';
import querystring from 'querystring';
import axios from 'axios';

const secret: string = config('auth.secret');
const total_try_count: number = config('auth.sms.try_count_limit');
const total_cooldown_mts: number = config('auth.sms.cooldown_mts');

interface Retry {
  cooldown_mts: number,
  total_cooldown_mts: number,
  try_count: number,
  total_try_count: number,
}

export class Service extends AbstractService {
  protected async recaptchaTest(response: string, remoteip?: string): Promise<boolean> {
    const result = await axios.post(
      'https://www.google.com/recaptcha/api/siteverify',
      querystring.stringify({
        secret: config('auth.recaptcha_secret'),
        response,
        remoteip,
      }),
      {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      },
    );

    return result.data.success;
  }

  public async sendSmsCode({ phone, captcha }: { phone: Phone, captcha: string | null }, { ip }: Context): Promise<Retry> {
    return sqlite(db => db.transaction(async session => {
      const model = new Model(db);
      const entry = await model.getByPhone(phone);
      const smsModel = new SmsCodeModel(db);
      const sent = null === entry || Status.blocked === entry.status ? null : await smsModel.getByPhone(phone);

      // если уже отправили код
      if (null !== sent) {
        const cooldown_mts = sent.sent_mts + total_cooldown_mts - Date.now();

        // если еще нельзя переотправить - просто возвращаем текущее состояние
        if (cooldown_mts > 0) {
          return {
            cooldown_mts,
            total_cooldown_mts,
            try_count: sent.try_count,
            total_try_count,
          };
        }

        // грохаем предыдущий код для переотправки
        await smsModel.deleteByPhone(phone);

      // если это совсем новый номер - регистрируем юзера,
      // но при этом надо потребовать капчу
      } else if (null === entry) {
        const success = null === captcha ? false : await this.recaptchaTest(captcha, ip);

        // если нету капчи - отправляем все нули (типа не ожидаем ввода кода)
        if (!success) {
          return {
            cooldown_mts: 0,
            total_cooldown_mts: 0,
            try_count: 0,
            total_try_count: 0,
          };
        }

        await model.create(phone);

      // если юзер заблокирован - редиректим его в вечную капчу
      } else if (Status.blocked === entry.status) {
        return {
          cooldown_mts: 0,
          total_cooldown_mts: 0,
          try_count: 0,
          total_try_count: 0,
        };
      }

      await smsModel.send(phone, { session });

      return {
        cooldown_mts: total_cooldown_mts,
        total_cooldown_mts,
        try_count: 0,
        total_try_count,
      };
    }));
  }

  protected rand(min: number, max: number) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  public async login({ phone, code }: { phone: Phone, code: string }): Promise<
    { token: string } |
    { retry: Retry }
  > {
    return sqlite(db => db.transaction(async session => {
      const model = new Model(db);
      const entry = await model.getByPhone(phone);
      const smsModel = new SmsCodeModel(db);
      const sent = null === entry || Status.blocked === entry.status ? null : await smsModel.getByPhone(phone);

      // если мы еще не отправляли код - тогда прикидываемся ветошью,
      // как будто отправили и он ввел не верно
      if (null === sent || null === entry) {
        return {
          retry: {
            cooldown_mts: this.rand(0, total_cooldown_mts),
            total_cooldown_mts,
            try_count: this.rand(1, total_try_count),
            total_try_count,
          }
        };
      }

      // если он перебрал с попытками - тогда возвращаем текущее состояние
      if (sent.try_count >= total_try_count) {
        return {
          retry: {
            cooldown_mts: Math.max(0, sent.sent_mts + total_cooldown_mts - Date.now()),
            total_cooldown_mts,
            try_count: total_try_count,
            total_try_count,
          }
        };
      }

      // если он ввел код не верно - списываем попытку
      if (sent.code !== code) {
        await smsModel.incrementTryCount(phone);

        return {
          retry: {
            cooldown_mts: Math.max(0, sent.sent_mts + total_cooldown_mts - Date.now()),
            total_cooldown_mts,
            try_count: sent.try_count + 1,
            total_try_count,
          }
        };
      }

      // грохаем использованный код
      await smsModel.deleteByPhone(phone);

      // говорим, что юзер теперь активен
      if (Status.unverified === entry.status) {
        await model.updateByPhone(phone, { status: Status.active });
      }

      return { token: jwt.encode({ phone }, secret) };
    }));
  }

  protected getPhone( token: string ): string | null {
    try {
      return jwt.decode(token, secret).phone;
    } catch (error) {
      return null;
    }
  }

  public async getUser({ token }: { token: string }): Promise<Entry | null> {
    const phone = this.getPhone(token);
    return isPhone(phone) ? this.model(model => model.getByPhone(phone), { readonly: true }) : null;
  }

  public async me({}, { user }: Context): Promise<Entry> {
    if (!user) throw new Error('User is unknown');
    return user;
  }

  public async updateProfile({ set }: { set: ProfileEditable }, { user }: Context): Promise<boolean> {
    if (!user) throw new Error('User is unknown');
    await this.model(model => model.updateByPhone(user.phone, set));
    return true;
  }

  // Полный список
  public findAll(): Promise<{
    id: number,
    entry: Entry,
  }[]> {
    return this.model(model => model.findAll(), { readonly: true });
  }

  // Получить по id
  public getById({ id }: { id: number }): Promise<Entry | null> {
    return this.model(model => model.getById(id), { readonly: true });
  }

  // Добавить
  public async insertOne({ entry } : { entry: Partial<Entry> }): Promise<{
    id: number,
  }> {
    return { id: await this.model(model => model.insertOne(entry)) };
  }

  // Изменить
  public updateById({ id, entry }: { id: number, entry: Partial<Entry> }): Promise<{
    changes: number,
  }> {
    return this.model(async model => {
      const changes = await model.updateById(id, entry);
      return { changes };
    });
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

export default instance;

const captcha = (x: unknown): x is string | null => null === x || Is.string(x);
const id = Is.number;
const entry = (x: unknown): x is Partial<Entry> => is.partial(x);

const admin = ({ user }: Context) => user?.role === Role.admin;
const anyUser = ({ user }: Context) => !!user;
const guest = () => true;

export const api = instance.defineApi({
  sendSmsCode: [{ phone: isPhone, captcha }, guest],
  login: [{ phone: isPhone, code: Is.string }, guest],
  me: [{}, anyUser],
  updateProfile: [{ set: isProfileEditable.entry }, anyUser],
  findAll: [{}, admin],
  getById: [{ id }, admin],
  insertOne: [{ entry }, admin],
  updateById: [{ id, entry }, admin],
})
