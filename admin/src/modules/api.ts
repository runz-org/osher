import { watch, reactive } from 'vue';
import axios from 'axios'
import connection, { On } from './connection'

export interface Retry {
  cooldown_mts: number,
  total_cooldown_mts: number,
  try_count: number,
  total_try_count: number,
}

export class Module {
  public readonly state = reactive({ 
    isLogged: !!localStorage.auth_token,
  });
  protected _token: string | null = localStorage.auth_token || null;
  protected queries: Record<string, Record<string, any>> = {};

  constructor() {
    watch(() => connection.state.session_id, session_id => {
      if (session_id) {
        const push = [];

        for (const [event, query] of Object.entries(this.queries)) {
          push.push({method: 'bus.setQuery', params: { session_id, event, query }});
        }

        this.pushMany(push);
      }
    })
  }

  protected get root(): string {
    const result = import.meta.env.VITE_API_URL;

    if (typeof result !== 'string') {
      throw new Error(`VITE_API_URL is undefined`);
    }

    return result;
  }

  public get token() {
    return this._token;
  }

  public get headers() {
    return null === this.token ? undefined : { authorization: `Bearer ${this.token}` };
  }

  public async authSendCode(phone: string): Promise<Retry> {
    //await new Promise(resolve => setTimeout(resolve, 3000));
    const result = await axios.post(this.root, { method: 'user.sendSmsCode', params: { phone, captcha: null } });
    return result.data.result;
  }

  public async login(phone: string, code: string): Promise<Retry | null> {
    //await new Promise(resolve => setTimeout(resolve, 3000));
    const result = await axios.post(this.root, { method: 'user.login', params: { phone, code } });

    if (result.data.result) {
      if (result.data.result.token) {
        const meResult = await axios.post(this.root, { method: 'user.me', params: {} }, { headers: {
          authorization: `Bearer ${result.data.result.token}`,
        }});

        if ('admin' !== meResult.data.result?.role) {
          return {
            cooldown_mts: 0,
            total_cooldown_mts: 0,
            try_count: 0,
            total_try_count: 0,
          }
        }

        this._token = result.data.result.token;
        localStorage.auth_token = this.token;
        this.state.isLogged = true;
      }

      if (result.data.result.retry) {
        return result.data.result.retry;
      }
    }

    return null;
  }

  public logout(): void {
    delete localStorage.auth_token;
    this._token = null;
    this.state.isLogged = false;
  }

  public async setQuery(event: string, query: Record<string, any>, on: On): Promise<void> {
    const session_id = connection.state.session_id;

    if (session_id) {
      await this.pushOne('bus.setQuery', { session_id, event, query });
    }

    this.queries[event] = query;
    connection.setListener(event, on);
  }

  public removeQuery(event: string): void {
    if (undefined !== this.queries[event]) {
      delete this.queries[event];
    }

    connection.removeListener(event);

    const session_id = connection.state.session_id;

    if (session_id) {
      this.pushOne('bus.removeQuery', { session_id, event });
    }
  }

  public async pushOne(method: string, params: Record<string, any>): Promise<any> {
    const result = await axios.post(this.root, { method, params }, { headers: this.headers });
    return result.data.result;
  }

  public async pushMany(queries: {method: string, params: Record<string, any>}[]): Promise<any[]> {
    if (queries.length === 0) return [];
    const result = await axios.post(this.root, queries, { headers: this.headers });
    return result.data;
  }
}

export default new Module;

