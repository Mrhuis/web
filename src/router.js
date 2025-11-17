import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  { path: '/', redirect: '/login' },
  { path: '/login', component: () => import('./views/Login.vue') },
  { path: '/register', component: () => import('./views/Register.vue') },

  // Admin routes
  { path: '/admin', redirect: '/admin/dashboard' },
  { path: '/admin/dashboard', component: () => import('./views/admin/dashboard.vue') },
  { path: '/admin/monitor', component: () => import('./views/admin/monitor.vue') },
  { path: '/admin/resource-manage', component: () => import('./views/admin/resource-manage.vue') },
  { path: '/admin/sys-config', component: () => import('./views/admin/sys-config.vue') },
  { path: '/admin/user-mgr', component: () => import('./views/admin/user-mgr.vue') },

  // Student routes
  { path: '/student', redirect: '/student/learning-center' },
  { path: '/student/algorithm-visualization', component: () => import('./views/student/AlgorithmVisualization.vue') },
  { path: '/student/insight', component: () => import('./views/student/insight.vue') },
  { path: '/student/learning-center', component: () => import('./views/student/LearningCenter.vue') },
  { path: '/student/practice', component: () => import('./views/student/practice.vue') },
  { path: '/student/qa', component: () => import('./views/student/qa.vue') },

  // Teacher routes
  { path: '/teacher', redirect: '/teacher/test-manage' },
  { path: '/teacher/test-manage', component: () => import('./views/teacher/test/index.vue') },
  { path: '/teacher/resource-manage', component: () => import('./views/teacher/resource/index.vue') },
  { path: '/teacher/message-center', component: () => import('./views/teacher/message/index.vue') },
  { path: '/teacher/class-mgr', component: () => import('./views/teacher/class/index.vue') },
  { path: '/teacher/profile', component: () => import('./views/teacher/profile/index.vue') },
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
