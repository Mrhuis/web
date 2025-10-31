<template>
  <div class="register-container">
    <el-card class="register-card">
      <template #header>
        <div class="card-header">
          <span>注册 LRP-Hybrid 账号</span>
        </div>
      </template>
      <el-form>
        <el-form-item label="用户名">
          <el-input v-model="username" placeholder="请输入用户名"></el-input>
        </el-form-item>
        <el-form-item label="密码">
          <el-input v-model="password" type="password" placeholder="请输入密码" show-password></el-input>
        </el-form-item>
        <el-form-item label="确认密码">
          <el-input v-model="confirmPassword" type="password" placeholder="请再次输入密码" show-password></el-input>
        </el-form-item>
         <el-form-item label="角色">
          <el-radio-group v-model="role">
            <el-radio label="student">学生</el-radio>
            <el-radio label="teacher">教师</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleRegister" style="width: 100%;">注册</el-button>
        </el-form-item>
      </el-form>
      <div class="footer-links">
        <el-link type="primary" @click="goToLogin">已有账号？立即登录</el-link>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';

const router = useRouter();
const username = ref('');
const password = ref('');
const confirmPassword = ref('');
const role = ref('student');

const handleRegister = () => {
  // 注册逻辑暂时为空
  ElMessage.info('注册功能正在开发中...');
};

const goToLogin = () => {
  router.push('/login');
};
</script>

<style scoped>
.register-container {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  background-color: #f0f2f5;
}
.register-card {
  width: 450px;
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
