export default [{
  path: '/',
  component: () => import('./pages/Main.vue'),
},{
  path: '/about',
  component: () => import('./pages/About.vue'),
},{
  path: '/welcome',
  component: () => import('./pages/Welcome.vue'),
}, {
  path: '/events/',
  component: () => import('./pages/Events.vue'),
}, {
  path: '/events/:slug',
  component: () => import('./pages/Event.vue'),
  props: true,
}, {
  path: '/order-fail',
  component: () => import('./pages/OrderFail.vue'),
}, {
  path: '/tickets',
  component: () => import('./pages/Tickets.vue'),
  meta: {private: true},
}, {
  path: '/profile',
  component: () => import('./pages/Profile.vue'),
  meta: {private: true},
}, {
  path: "/:catchAll(.*)",
  component: () => import('./pages/NotFound.vue'),
}]
