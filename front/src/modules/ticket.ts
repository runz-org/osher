import api from './api';

export enum Status {
  wait_deposit = 'wait_deposit',
  active = 'active',
  done = 'done',
}

export interface Entry {
  user_phone: string,
  product_id: number,
  price: number,
  mdOrder: string,
  status: Status,
  created_mts: number,
}

export class Module {
  public create(product_id: number, count: number): Promise<string> {
    return api.pushOne('ticket.create', { product_id, count });
  }

  public async my(): Promise<{id: number, entry: Entry}[]> {
    //await new Promise(resolve => setTimeout(resolve, 3000));
    const results = await api.pushMany([{
      method: 'ticket.my',
      params: {},
    }]);

    return results[0].result;
  }

  public watchCreated(user_phone: string, on: (result: {id: number, entry: Entry}) => void) {
    const event = 'ticket.created';
    api.setQuery(event, { user_phone }, result => on({
      id: result.id,
      entry: result.entry,
    }));
    return () => api.removeQuery(event);
  }

  public watchStatus(user_phone: string, on: (result: {id: number, status: Status}) => void) {
    const event = 'ticket.statusChange';
    api.setQuery(event, { user_phone }, result => on({
      id: result.id,
      status: result.status,
    }));
    return () => api.removeQuery(event);
  }

  public watchDeleted(user_phone: string, on: (result: {id: number}) => void) {
    const event = 'ticket.deleted';
    api.setQuery(event, { user_phone }, result => on({
      id: result.id,
    }));
    return () => api.removeQuery(event);
  }
}

export default new Module;
