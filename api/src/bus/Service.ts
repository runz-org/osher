import bus, { JsonEntry, Query, isQuery, Push, Info, Data } from './Client';
import { AbstractService, Context } from '../AbstractService';
import { Is } from '../Is';
import { api as sberApi, events as sberEvents, cron as sberCron } from '../sber/Service';
import { api as ticketApi, events as ticketEvents } from '../ticket/Service';
import { api as userApi } from '../user/Service';
import { api as productApi } from '../product/Service';
import { Role } from '../user/Model';

export class Service extends AbstractService {
  public startSession(push: Push, info: Info = {}): string {
    const session_id = bus.startSession(push, info);
    this.sessionStarted({session_id});
    return session_id;
  }

  public closeSession(session_id: string): void {
    bus.closeSession(session_id);
    this.sessionClosed({session_id});
  }

  // Установить новый запрос
  public async setQuery({session_id, event, query}: {session_id: string, event: string, query: Query}): Promise<boolean> {
    bus.setQuery(session_id, event, query);
    this.querySet({session_id, event});
    return true;
  }

  // Удалить запрос
  public async removeQuery({session_id, event}: {session_id: string, event: string}): Promise<boolean> {
    bus.removeQuery(session_id, event);
    this.queryRemoved({session_id, event});
    return true;
  }

  // Событие при установке новой сессии
  public async sessionStarted<T extends {session_id: string}>(params: T): Promise<T> {
    return params;
  }

  // Событие при установке новой сессии
  public async sessionClosed<T extends {session_id: string}>(params: T): Promise<T> {
    return params;
  }

  // Событие при установке нового запроса
  public async querySet<T extends {session_id: string, event: string}>(params: T): Promise<T> {
    return params;
  }

  // Событие при установке нового запроса
  public async queryRemoved<T extends {session_id: string, event: string}>(params: T): Promise<T> {
    return params;
  }

  // Полный список
  public async findAll(): Promise<JsonEntry[]> {
    return bus.toJSON();
  }
}

const instance = new Service;

export default instance;

const admin = ({ user }: Context) => user?.role === Role.admin;
const guest = () => true;

const events = {
  bus: instance.defineEvents({
    sessionStarted: [{session_id: Is.string}, admin],
    sessionClosed: [{session_id: Is.string}, admin],
    querySet: [{session_id: Is.string, event: Is.string}, admin],
    queryRemoved: [{session_id: Is.string, event: Is.string}, admin],
  }),
  transaction: sberEvents,
  ticket: ticketEvents,
};

const api = {
  bus: instance.defineApi({
    findAll: [{}, admin],
    setQuery: [{ session_id: Is.string, event: Is.string, query: isQuery }, (user, params) => {
      const { session_id, event, query } = params;
      const [ prefix, e ] = event.split('.');

      return isEventsPrefix(prefix) && bus.isOpenSession(session_id) && events[prefix].allow(e, query, user);
    }],
    removeQuery: [{ session_id: Is.string, event: Is.string}, guest],
  }),
  user: userApi,
  product: productApi,
  transaction: sberApi,
  ticket: ticketApi,
};

const isEventsPrefix = (x: unknown): x is keyof typeof events => Is.string(x) && Object.keys(events).includes(x);
const isApiPrefix = (x: unknown): x is keyof typeof api => Is.string(x) && Object.keys(api).includes(x);

export const push = (method: string, params: unknown, context: Context) => {
  const [ prefix, m ] = method.split('.');
  return isApiPrefix(prefix) ? api[prefix](m, params, context) : undefined;
}

export const cron = () => {
  sberCron();
}

for (const [prefix, { listenResult }] of Object.entries(events)) {
  listenResult((event: string, result: Data) => bus.pushAll(`${prefix}.${event}`, result));
}
