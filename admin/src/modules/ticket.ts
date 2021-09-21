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
  public async findAll(): Promise<Entry[]> {
    const result = await api.pushOne('ticket.findAll', {});
    return result.map((item: any) => item.entry);
  }

  public watchCreated(on: (result: {id: number, entry: Entry}) => void) {
    const event = 'ticket.created';
    api.setQuery(event, {}, result => on({
      id: result.id,
      entry: result.entry,
    }));
    return () => api.removeQuery(event);
  }

  public watchStatus(on: (result: {id: number, status: Status}) => void) {
    const event = 'ticket.statusChange';
    api.setQuery(event, {}, result => on({
      id: result.id,
      status: result.status,
    }));
    return () => api.removeQuery(event);
  }

  public watchDeleted(on: (result: {id: number}) => void) {
    const event = 'ticket.deleted';
    api.setQuery(event, {}, result => on({
      id: result.id,
    }));
    return () => api.removeQuery(event);
  }
}

export default new Module;
