import 'primevue/resources/themes/saga-blue/theme.css';
import 'primevue/resources/primevue.min.css';
import 'primeicons/primeicons.css';
import 'primeflex/primeflex.css';
import { createApp } from './main';

const { app, router } = createApp();

router.isReady().then(() => {
  router.beforeEach(function(to, from, next) {
    window.scrollTo(0, 0);
    next();
  });

  app.mount('#app');
})
