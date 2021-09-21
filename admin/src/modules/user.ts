import { watch, ref } from 'vue';
import api from './api';

export enum Status {
  unverified = 'unverified',
  active = 'active',
  blocked = 'blocked',
}

export enum Role {
  admin = 'admin',
  user = 'user',
}

export interface Entry {
  phone: string,
  name: string,
  status: Status,
  role: Role,
  created_mts: number,
}

export interface NewEntry {
  phone: string,
}

export class Module {
  public readonly state = ref<Entry | null>(null);

  constructor() {
    this.updateState(api.state.isLogged);
    watch(() => api.state.isLogged, isLogged => this.updateState(isLogged))
  }

  protected async updateState(isLogged: boolean): Promise<void> {
    try {
      this.state.value = isLogged ? await this.me() : null;
    } catch (error) {
      api.logout();
    }
  }

  public async warmState(): Promise<void> {
    this.updateState(api.state.isLogged);
  }

  public me(): Promise<Entry> {
    //await new Promise(resolve => setTimeout(resolve, 3000));
    return api.pushOne('user.me', {});
  }

  public findAll(): Promise<{id: number, entry: Entry}[]> {
    return api.pushOne('user.findAll', {});
  }

  public getById(id: number): Promise<Entry | null> {
    return api.pushOne('user.getById', { id });
  }

  public insertOne(entry: NewEntry): Promise<{ id: number }> {
    return api.pushOne('user.insertOne', { entry });
  }

  public updateById(id: number, entry: Partial<Entry>): Promise<{ changes: number }> {
    return api.pushOne('user.updateById', { id, entry });
  }
}

export default new Module;
