import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import { checkUserStatus } from './api/authApi'
import { useUserStore } from './store/user'

const app = createApp(App)
const pinia = createPinia()

app.use(router)
app.use(ElementPlus)
app.use(pinia)

app.mount('#app')

// 全局轮询：每30分钟检查一次当前用户状态
const THIRTY_MINUTES = 30 * 60 * 1000
setInterval(async () => {
  try {
    const status = await checkUserStatus()
    if (status === 'disabled') {
      // 账号被禁用：清空本地信息并跳转登录页
      try {
        localStorage.removeItem('user_key')
        localStorage.removeItem('user_role')
        localStorage.removeItem('user_nickname')
      } catch (e) {
        console.error('清理本地登录信息失败:', e)
      }
      // 如果有 Pinia 用户仓库，则同步登出
      try {
        const userStore = useUserStore()
        if (userStore && typeof userStore.logout === 'function') {
          userStore.logout()
        }
      } catch (e) {
        console.error('调用用户仓库 logout 失败:', e)
      }
      router.push('/login')
    }
  } catch (e) {
    console.error('轮询检查用户状态失败:', e)
  }
}, THIRTY_MINUTES)
