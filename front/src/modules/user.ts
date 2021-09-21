import { watch, ref } from 'vue';
import api from './api';

export interface Entry {
  phone: string,
  name: string,
}

export interface ProfileEditable {
  name: string,
}

export class Module {
  public readonly state = ref<Entry | null>(null);

  constructor() {
    this.updateState(api.state.isLogged);
    watch(() => api.state.isLogged, isLogged => this.updateState(isLogged))
  }

  protected async updateState(isLogged: boolean): Promise<void> {
    this.state.value = isLogged ? await this.me() : null;
  }

  public async warmState(): Promise<void> {
    this.updateState(api.state.isLogged);
  }

  public async me(): Promise<Entry> {
    //await new Promise(resolve => setTimeout(resolve, 3000));
    return api.pushOne('user.me', {});
  }

  public async updateProfile(set: ProfileEditable): Promise<void> {
    await api.pushOne('user.updateProfile', { set });
  }
}

export default new Module;
