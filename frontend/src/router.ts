import { createRouter, createWebHashHistory } from 'vue-router';
import Login from './views/Login.vue';
import Dashboard from './views/Dashboard.vue';
import Campaigns from './views/Campaigns.vue';
import Residents from './views/Residents.vue';
import ResidentDetail from './views/ResidentDetail.vue';

const routes = [
  { path: '/login', component: Login, meta: { public: true } },
  { path: '/', redirect: '/dashboard' },
  { path: '/dashboard', component: Dashboard },
  { path: '/campaigns', component: Campaigns },
  { path: '/residents', component: Residents },
  { path: '/residents/:id', component: ResidentDetail },
];

export const router = createRouter({
  history: createWebHashHistory(),
  routes,
});

router.beforeEach((to) => {
  const token = localStorage.getItem('token');
  if (!to.meta.public && !token) {
    return '/login';
  }
  if (to.path === '/login' && token) {
    return '/dashboard';
  }
  return true;
});
