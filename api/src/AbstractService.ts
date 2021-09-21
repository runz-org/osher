import { Is } from './Is';
import { Entry as User } from './user/Model';

export interface Context {
  user?: User,
  ip?: string,
}

type MayListen<T> = { [Method in keyof T]: T[Method] extends (params: infer Params, context: Context) => Promise<infer Result> ? {
  method: Method,
  params: Params extends object ? Params : {},
  result: Result extends object ? Result : {},
} : never };

type MayCron<T> = { [Method in keyof T]: T[Method] extends () => Promise<void> ? Method : never };

export abstract class AbstractService {

  // Объявление апи с подсказками в IDE, соответствует post-запросам с синхроннымм ответом
  public readonly defineApi = <Method extends MayListen<this>[Exclude<keyof this, 'defineApi' | 'defineEvents'>]['method']>(
    guards: {[M in Method]: [
      Is<MayListen<this>[M]['params']>['value'],
      (context: Context, params: MayListen<this>[M]['params']) => boolean,
    ]}
  ) =>
    (method: unknown, params: unknown, context: Context): Promise<MayListen<this>[Method]['result']> | undefined => {
      const isMethod = (x: unknown): x is Method => Is.string(x) && Object.keys(guards).includes(x);
      if (!isMethod(method)) return undefined;
      const [is, allow] = guards[method];
      return new Is(is).entry(params) && allow(context, params) ? this[method](params, context) : undefined;
    }

  // Объявление событий с подсказками в IDE, соответствует подпискам на Server Sent Events
  public readonly defineEvents = <Method extends MayListen<this>[Exclude<keyof this, 'defineApi' | 'defineEvents'>]['method']>(
    guards: { [M in Method]: [
      Is<MayListen<this>[M]['result']>['value'],
      (context: Context, query: Partial<MayListen<this>[M]['result']>) => boolean,
    ]}
  ) => ({
    listenResult: (push: (event: Method, result: MayListen<this>[Method]['result']) => void) => {
      for (const method of Object.keys(guards) as Method[]) {
        const original = this[method];
        this[method] = (async (params: MayListen<this>[Method]['params']): Promise<MayListen<this>[Method]['result']> => {
          const result = await original(params);
          push(method, result);
          return result;
        }) as this[Method];
      }
    },
    allow: (event: unknown, query: unknown, context: Context): boolean => {
      const isMethod = (x: unknown): x is Method => Is.string(x) && Object.keys(guards).includes(x);
      if (!isMethod(event)) return false;
      const [is, allow] = guards[event];
      return new Is(is).partial(query) && allow(context, query);
    }
  })

  // Объявление периодически запускаемых задач
  public readonly defineCron = <Method extends MayCron<this>[Exclude<keyof this, 'cron'>]>(
    crons: { [M in Method]: number }
  ) =>
    (): void => {
      for (const method of Object.keys(crons) as Method[]) {
        setInterval(() => this[method]().catch(console.error), crons[method]);
      }
    }
}
