import { defineStore } from 'pinia'
import router from '@/router'

export const useUserStore = defineStore('user', {
  state: () => ({
    id: localStorage.getItem('user_id') || null,
    userKey: localStorage.getItem('user_key') || null,
    nickname: localStorage.getItem('user_nickname') || '',
    role: localStorage.getItem('user_role') || ''
  }),

  getters: {
    isLoggedIn() {
      return this.userKey !== null && this.userKey !== undefined && this.userKey !== ''
    }
  },

  actions: {
    login(userData) {
      // 先设置localStorage
    localStorage.setItem('user_id', userData.id)
    localStorage.setItem('user_key', userData.userKey)
    localStorage.setItem('user_nickname', userData.nickname)
    localStorage.setItem('user_role', userData.role)
      
      // 再设置store值
      this.id = userData.id
      this.userKey = userData.userKey
      this.nickname = userData.nickname
      this.role = userData.role

    // 根据角色重定向
      if (this.role === 'teacher') {
      router.push('/teacher')
      } else if (this.role === 'student') {
      router.push('/student')
      } else if (this.role === 'admin') {
      router.push('/admin/dashboard')
    }
    },

    logout() {
      this.id = null
      this.userKey = null
      this.nickname = ''
      this.role = ''

    localStorage.removeItem('user_id')
      localStorage.removeItem('user_key')
    localStorage.removeItem('user_nickname')
    localStorage.removeItem('user_role')

    router.push('/login')
  }
  }
})