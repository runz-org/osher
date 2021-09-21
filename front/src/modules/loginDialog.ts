import { watch, reactive } from 'vue';
import api from './api';

export class Module {
  public readonly state = reactive({
    isOpen: false,
  });

  constructor () {
    watch(() => api.state.isLogged, isLogged => {
      if (isLogged) {
        this.state.isOpen = false;
      }
    });
  }
}

export default new Module;
