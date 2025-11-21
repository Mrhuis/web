<template>
  <div class="register-container">
    <el-card class="register-card">
      <template #header>
        <div class="card-header">
          <span>注册 LRP-Hybrid 账号</span>
        </div>
      </template>
      <el-form :model="registerForm" :rules="rules" ref="formRef">
        <el-form-item label="账号" prop="username">
          <el-input v-model="registerForm.username" placeholder="请输入账号"></el-input>
        </el-form-item>
        <el-form-item label="昵称" prop="nickname">
          <el-input v-model="registerForm.nickname" placeholder="请输入昵称（可选）"></el-input>
        </el-form-item>
        <el-form-item label="密码" prop="password">
          <el-input v-model="registerForm.password" type="password" placeholder="请输入密码" show-password></el-input>
        </el-form-item>
        <el-form-item label="确认密码" prop="confirmPassword">
          <el-input v-model="registerForm.confirmPassword" type="password" placeholder="请再次输入密码" show-password></el-input>
        </el-form-item>
         <el-form-item label="角色" prop="role">
          <el-radio-group v-model="registerForm.role">
            <el-radio label="student">学生</el-radio>
            <el-radio label="teacher">教师</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleRegister" style="width: 100%;" :loading="isLoading">注册</el-button>
        </el-form-item>
      </el-form>
      <div class="footer-links">
        <el-link type="primary" @click="goToLogin">已有账号？立即登录</el-link>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import { addUser } from '@/api/admin/admin_user_manage_api';

const router = useRouter();
const formRef = ref(null);
const isLoading = ref(false);

const registerForm = reactive({
  username: '',
  nickname: '',
  password: '',
  confirmPassword: '',
  role: 'student'
});

// 生成userKey：角色前缀 + 时间戳后8位
const generateUserKey = (role) => {
  const prefix = role === 'student' ? 'S' : 'T';
  const timestamp = Date.now().toString();
  // 取时间戳后8位
  const suffix = timestamp.slice(-8);
  return `${prefix}${suffix}`;
};

// 验证确认密码
const validateConfirmPassword = (rule, value, callback) => {
  if (value !== registerForm.password) {
    callback(new Error('两次输入的密码不一致'));
  } else {
    callback();
  }
};

const rules = {
  username: [
    { required: true, message: '请输入账号', trigger: 'blur' },
    { min: 3, max: 20, message: '账号长度在3到20个字符', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, max: 32, message: '密码长度在6到32个字符', trigger: 'blur' }
  ],
  confirmPassword: [
    { required: true, message: '请再次输入密码', trigger: 'blur' },
    { validator: validateConfirmPassword, trigger: 'blur' }
  ],
  role: [
    { required: true, message: '请选择角色', trigger: 'change' }
  ]
};

const handleRegister = async () => {
  if (!formRef.value) return;
  
  formRef.value.validate(async (valid) => {
    if (!valid) return;
    
    isLoading.value = true;
    try {
      // 生成userKey
      const userKey = generateUserKey(registerForm.role);
      
      // 构建注册数据
      const registerData = {
        userKey: userKey,
        username: registerForm.username,
        password: registerForm.password,
        role: registerForm.role,
        nickname: registerForm.nickname || registerForm.username, // 如果没有输入昵称，使用账号作为昵称
        status: 'enabled'
      };
      
      const response = await addUser(registerData);
      
      if (response.success) {
        ElMessage.success('注册成功！请登录');
        router.push('/login');
      } else {
        ElMessage.error(response.message || '注册失败，请稍后重试');
      }
    } catch (error) {
      console.error('注册失败:', error);
      ElMessage.error(error.message || '注册失败，请稍后重试');
    } finally {
      isLoading.value = false;
    }
  });
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
