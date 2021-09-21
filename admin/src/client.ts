import 'primevue/resources/themes/saga-green/theme.css';
import 'primevue/resources/primevue.min.css';
import 'primeicons/primeicons.css';
import 'primeflex/primeflex.css';
import './assets/layout/layout.scss';
import './assets/layout/flags/flags.css';

import { createApp } from './main';

const { app, router } = createApp();

router.isReady().then(() => {
  router.beforeEach(function(to, from, next) {
    window.scrollTo(0, 0);
    next();
  });

  app.mount('#app');
})
