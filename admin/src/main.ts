import { createApp as createClientApp } from 'vue'
import { createRouter, createWebHashHistory } from 'vue-router';
import PrimeVue from 'primevue/config';
import Ripple from 'primevue/ripple';
import ToastService from 'primevue/toastservice';
import ConfirmationService from 'primevue/confirmationservice';
import App from './App.vue'
import routes from './routes';

export function createApp() {
  const app = createClientApp(App);
  const router = createRouter({
    history: createWebHashHistory(),
    routes,
  });
  app.use(router);
  app.use(PrimeVue, { ripple: true });
  app.use(ToastService);
  app.use(ConfirmationService);
  app.directive('ripple', Ripple);

  return { app, router }
}
