<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import { useUserStore } from '@/store/user';
import { login as apiLogin } from '@/api/authApi';

const router = useRouter();
const userStore = useUserStore();
const username = ref('');
const password = ref('');
const isLoading = ref(false);

const handleLogin = async () => {
  if (!username.value || !password.value) {
    ElMessage.warning('请输入账号和密码');
    return;
  }
  isLoading.value = true;
  try {
    const userData = await apiLogin(username.value, password.value);
    
    // 添加日志：显示API返回的用户数据
    console.log('=== 登录API返回的用户数据 ===');
    console.log('userData:', userData);
    console.log('userData.userKey:', userData.userKey);
    console.log('userData.id:', userData.id);
    console.log('userData.nickname:', userData.nickname);
    console.log('userData.role:', userData.role);
    
    ElMessage.success('登录成功！');
    console.log('=== 准备调用store.login方法 ===');
    console.log('userStore:', userStore);
    console.log('userStore.login:', userStore.login);
    userStore.login(userData);
    console.log('=== store.login方法调用完成 ===');
    
    // 添加日志：显示存储到store后的用户数据
    console.log('=== 存储到store后的用户数据 ===');
    console.log('store.userKey:', userStore.userKey);
    console.log('store.id:', userStore.id);
    console.log('store.nickname:', userStore.nickname);
    console.log('store.role:', userStore.role);
    console.log('store.isLoggedIn:', userStore.isLoggedIn);
    
    // 添加日志：显示localStorage中的数据
    console.log('=== localStorage中的用户数据 ===');
    console.log('localStorage user_key:', localStorage.getItem('user_key'));
    console.log('localStorage user_id:', localStorage.getItem('user_id'));
    console.log('localStorage user_nickname:', localStorage.getItem('user_nickname'));
    console.log('localStorage user_role:', localStorage.getItem('user_role'));
    
  } catch (error) {
    ElMessage.error(error.message || '登录失败，请稍后重试');
  } finally {
    isLoading.value = false;
  }
};

const goToRegister = () => {
  router.push('/register');
};
</script>

<template>
  <div class="login-container">
    <el-card class="login-card">
      <template #header>
        <div class="card-header">
          <span>欢迎登录 LRP-Hybrid</span>
        </div>
      </template>
      <el-form @submit.prevent="handleLogin">
        <el-form-item label="账号">
          <el-input v-model="username" placeholder="请输入账号"></el-input>
        </el-form-item>
        <el-form-item label="密码">
          <el-input v-model="password" type="password" placeholder="请输入密码" show-password></el-input>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleLogin" style="width: 100%;" :loading="isLoading">
            登录
          </el-button>
        </el-form-item>
      </el-form>
      <div class="footer-links">
        <el-link type="primary" @click="goToRegister">没有账号？立即注册</el-link>
      </div>
    </el-card>
  </div>
</template>

<style scoped>
.login-container {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  background-color: #f0f2f5;
}
.login-card {
  width: 400px;
}
.card-header {
  text-align: center;
  font-size: 20px;
  font-weight: bold;
}
.footer-links {
  text-align: center;
  margin-top: 16px;
}
</style>
