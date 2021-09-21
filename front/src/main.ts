import { createApp as createClientApp, createSSRApp } from 'vue'
import { createRouter, createWebHistory, createMemoryHistory } from 'vue-router';
import PrimeVue from 'primevue/config';
import Ripple from 'primevue/ripple';
import ToastService from 'primevue/toastservice';
import App from './App.vue'
import routes from './routes';

export function createApp(options: { ssr?: boolean } = {}) {
  const app = options.ssr ? createSSRApp(App) : createClientApp(App);
  const router = createRouter({
    history: options.ssr ? createMemoryHistory() : createWebHistory(),
    routes,
  });
  app.use(router);
  app.use(PrimeVue, { ripple: true });
  app.use(ToastService);
  app.directive('ripple', Ripple);

  return { app, router }
}
