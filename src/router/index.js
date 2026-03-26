import { createRouter, createWebHistory } from 'vue-router'
import Home from '@/views/Home.vue'
import Privacy from '@/views/Privacy.vue'

export default createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      name: 'Home',
      component: Home,
    },
    {
      path: '/privacy',
      component: Privacy,
    },
  ],
})
