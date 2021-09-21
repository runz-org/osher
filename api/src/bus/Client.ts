import { randomBytes } from 'crypto';
import { Is } from '../Is';

export type Query = Record<string, any>;
export type Data = Record<string, any>;
export type Info = Record<string, any>;
export type Push = (event: string, data: Data) => void;

export const isQuery = (x: unknown): x is Query => Is.object(x);

export interface JsonEntry {
  session_id: string,
  info: Info,
  mts: number,
  queries: {
    event: string,
    query: Query,
    mts: number,
  }[],
}

export class Client {
  protected sessions: Record<string, {
    push: Push,
    info: Record<string, any>,
    mts: number,
    queries: Record<string, {
      query: Query,
      mts: number,
    }>,
  }> = {}

  public startSession(push: Push, info: Info = {}): string {
    const mts = Date.now();
    const chars = 'ABCEHKMOPTX';
    const bytes = randomBytes(3);
    const session_id = [
      chars.charAt(bytes[0] % chars.length),
      chars.charAt(bytes[1] % chars.length),
      chars.charAt(bytes[2] % chars.length),
    ].join('') + `_${mts}`;
    this.sessions[session_id] = { push, queries: {}, info, mts };
    return session_id;
  }

  public isOpenSession(session_id: string): boolean {
    return undefined !== this.sessions[session_id];
  }

  public closeSession(session_id: string): void {
    if (this.isOpenSession(session_id)) {
      delete this.sessions[session_id];
    }
  }

  protected match(data: Data, query: Query): boolean {
    return !Object.entries(query).find(([k, v]) => v !== data[k]);
  }

  public pushAll(event: string, data: Data): void {
    for (const session of Object.values(this.sessions)) {
      const query = session.queries[event];

      if (undefined !== query && this.match(data, query.query)) {
        session.push(event, data);
      }
    }
  }

  public pushBySessionId(session_id: string, event: string, data: Data): void {
    if (this.isOpenSession(session_id)) {
      const session = this.sessions[session_id];
      const query = session.queries[event];

      if (undefined !== query && this.match(data, query.query)) {
        session.push(event, data);
      }
    }
  }

  public setQuery(session_id: string, event: string, query: Query): void {
    if (this.isOpenSession(session_id)) {
      const mts = Date.now();
      this.sessions[session_id].queries[event] = { query, mts };
    }
  }

  public removeQuery(session_id: string, event: string): void {
    if (this.isOpenSession(session_id) && undefined !== this.sessions[session_id].queries[event]) {
      delete this.sessions[session_id].queries[event];
    }
  }

  public clear(session_id: string): void {
    if (this.isOpenSession(session_id)) {
      this.sessions[session_id].queries = {};
    }
  }

  public toJSON(): JsonEntry[] {
    const result: JsonEntry[] = [];

    for (const [session_id, { info, mts: session_mts, queries: session_queries }] of Object.entries(this.sessions)) {
      const queries = [];

      for (const [ event, { query, mts } ] of Object.entries(session_queries)) {
        queries.push({ event, query, mts });
      }

      result.push({ session_id, info, mts: session_mts, queries });
    }

    return result;
  }
}

export default new Client;
