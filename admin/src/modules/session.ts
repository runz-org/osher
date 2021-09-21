import api from './api';

export interface Entry {
  session_id: string,
  ip: string,
  mts: number,
}

export class Module {
  public async findAll(): Promise<Entry[]> {
    const result = await api.pushOne('bus.findAll', {});
    return result.map((entry: any) => ({
      session_id: entry.session_id,
      ip: entry.info.ip,
      mts: entry.mts,
    }))
  }

  public watchSessionStarted(on: (session_id: string) => void) {
    const event = 'bus.sessionStarted';
    api.setQuery(event, {}, result => on(result.session_id));
    return () => api.removeQuery(event);
  }

  public watchSessionClosed(on: (session_id: string) => void) {
    const event = 'bus.sessionClosed';
    api.setQuery(event, {}, result => on(result.session_id));
    return () => api.removeQuery(event);
  }
}

export default new Module;
