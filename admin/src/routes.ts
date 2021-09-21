export default [{
  path: '/',
  component: () => import('./pages/Dashboard.vue'),
}, {
  path: '/categories',
  component: () => import('./pages/Categories.vue'),
}, {
  path: '/products',
  component: () => import('./pages/Products.vue'),
}, {
  path: '/product/:id',
  component: () => import('./pages/Product.vue'),
  props: true,
}, {
  path: '/users',
  component: () => import('./pages/Users.vue'),
}, {
  path: '/user/:id',
  component: () => import('./pages/User.vue'),
  props: true,
}, {
  path: '/transactions',
  component: () => import('./pages/Transactions.vue'),
}, {
  path: '/tickets',
  component: () => import('./pages/Tickets.vue'),
}, {
  path: '/sessions',
  component: () => import('./pages/Sessions.vue'),
}, {
  path: "/:catchAll(.*)",
  component: () => import('./pages/NotFound.vue'),
}]
