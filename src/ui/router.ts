import { createRouter, createWebHistory } from 'vue-router';
import Dashboard from './components/Dashboard.vue';
import PolicyBrowser from './components/PolicyBrowser.vue';
import QueryTester from './components/QueryTester.vue';
import PolicyForm from './components/PolicyForm.vue';

const routes = [
  { path: '/', redirect: '/dashboard' },
  { path: '/dashboard', component: Dashboard, meta: { title: 'Dashboard', icon: '📊' } },
  { path: '/policies', component: PolicyBrowser, meta: { title: 'Policy Browser', icon: '📚' } },
  { path: '/query', component: QueryTester, meta: { title: 'Query Tester', icon: '🔍' } },
  { path: '/add-policy', component: PolicyForm, meta: { title: 'Add Policy', icon: '➕' } },
];

export const router = createRouter({
  history: createWebHistory('/ui/'),
  routes,
});
