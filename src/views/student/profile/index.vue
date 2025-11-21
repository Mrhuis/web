<template>
  <StudentLayout>
    <div class="profile-container">
      <div class="page-header">
        <div>
          <h1 class="page-title">个人信息管理</h1>
          <p class="page-subtitle">查看与更新您的学生账号资料</p>
        </div>
        <div class="header-actions">
          <el-button :loading="loading" :icon="RefreshRight" @click="fetchProfile">
            刷新
          </el-button>
        </div>
      </div>

      <div class="info-grid">
        <el-card class="info-card" shadow="hover" v-loading="loading">
          <template #header>
            <div class="card-header">
              <span>基础信息</span>
            </div>
          </template>
          <template v-if="profileDetail">
            <el-descriptions :column="1" border class="meta-descriptions">
              <el-descriptions-item label="用户ID">{{ profileDetail.id ?? '--' }}</el-descriptions-item>
              <el-descriptions-item label="用户标识">{{ profileForm.userKey || '--' }}</el-descriptions-item>
              <el-descriptions-item label="角色">
                <el-tag :type="roleTagMap[profileForm.role]?.type || 'info'">
                  {{ roleTagMap[profileForm.role]?.text || profileForm.role || '未知' }}
                </el-tag>
              </el-descriptions-item>
              <el-descriptions-item label="账户状态">
                <el-tag :type="statusTagMap[profileForm.status]?.type || 'info'">
                  {{ statusTagMap[profileForm.status]?.text || profileForm.status || '未知' }}
                </el-tag>
              </el-descriptions-item>
              <el-descriptions-item label="总活跃天数">{{ profileForm.totalActiveDays ?? 0 }}</el-descriptions-item>
              <el-descriptions-item label="连续活跃天数">{{ profileForm.continuousActiveDays ?? 0 }}</el-descriptions-item>
              <el-descriptions-item label="最后活跃时间">{{ formatDateTime(profileDetail.lastActiveTime) }}</el-descriptions-item>
              <el-descriptions-item label="注册时间">{{ formatDateTime(profileDetail.createdAt) }}</el-descriptions-item>
              <el-descriptions-item label="最近更新时间">{{ formatDateTime(profileDetail.updatedAt) }}</el-descriptions-item>
            </el-descriptions>
          </template>
          <el-empty v-else description="暂无数据" />
        </el-card>

        <el-card class="form-card" shadow="hover">
          <template #header>
            <div class="card-header">
              <span>账号信息</span>
              <small>更新后将同步到全局</small>
            </div>
          </template>
          <el-form
            ref="profileFormRef"
            :model="profileForm"
            :rules="profileRules"
            label-width="120px"
            class="profile-form"
            :disabled="loading"
          >
            <el-form-item label="账号" prop="username">
              <el-input v-model.trim="profileForm.username" placeholder="请输入账号" clearable />
            </el-form-item>
            <el-form-item label="显示昵称" prop="nickname">
              <el-input v-model.trim="profileForm.nickname" placeholder="用于展示的昵称" clearable />
            </el-form-item>
            <el-form-item label="登录密码" prop="password">
              <el-input
                v-model="profileForm.password"
                type="password"
                placeholder="不修改请留空"
                show-password
                clearable
              />
            </el-form-item>
            <el-form-item label="角色">
              <el-tag effect="plain">{{ roleTagMap[profileForm.role]?.text || profileForm.role || '--' }}</el-tag>
            </el-form-item>
            <el-form-item label="账户状态">
              <el-tag effect="plain" :type="statusTagMap[profileForm.status]?.type || 'info'">
                {{ statusTagMap[profileForm.status]?.text || profileForm.status || '--' }}
              </el-tag>
            </el-form-item>
            <el-form-item>
              <el-button @click="handleReset" :disabled="loading">重置</el-button>
              <el-button type="primary" :loading="saving" :disabled="loading" @click="handleSubmit">
                保存修改
              </el-button>
            </el-form-item>
          </el-form>
        </el-card>
      </div>
    </div>
  </StudentLayout>
</template>

<script setup>
import { onMounted, reactive, ref } from 'vue';
import dayjs from 'dayjs';
import { ElMessage } from 'element-plus';
import { RefreshRight } from '@element-plus/icons-vue';
import StudentLayout from '../StudentLayout.vue';
import { useUserStore } from '@/store/user';
import { getTeacherProfile, updateTeacherProfile } from '@/api/teacher/teacher_profile_api';

const userStore = useUserStore();
const loading = ref(false);
const saving = ref(false);
const profileFormRef = ref(null);
const profileDetail = ref(null);
const lastLoadedSnapshot = ref(null);

const profileForm = reactive({
  id: null,
  userKey: '',
  username: '',
  nickname: '',
  role: '',
  status: '',
  totalActiveDays: 0,
  continuousActiveDays: 0,
  password: ''
});

const roleTagMap = {
  teacher: { text: '教师', type: 'primary' },
  student: { text: '学生', type: 'success' },
  admin: { text: '管理员', type: 'warning' }
};

const statusTagMap = {
  enabled: { text: '启用', type: 'success' },
  disabled: { text: '禁用', type: 'danger' }
};

const profileRules = {
  username: [{ required: true, message: '请输入账号', trigger: 'blur' }],
  nickname: [{ required: true, message: '请输入昵称', trigger: 'blur' }],
  password: [
    { validator: validatePassword, trigger: 'blur' }
  ]
};

function validatePassword(rule, value, callback) {
  if (!value) {
    callback();
    return;
  }
  if (value.length < 6 || value.length > 32) {
    callback(new Error('密码长度需在6-32个字符之间'));
  } else {
    callback();
  }
}

const formatDateTime = (value) => (value ? dayjs(value).format('YYYY-MM-DD HH:mm:ss') : '--');

const captureSnapshot = (source) => ({
  id: source.id,
  userKey: source.userKey,
  username: source.username,
  nickname: source.nickname,
  role: source.role,
  status: source.status,
  totalActiveDays: source.totalActiveDays,
  continuousActiveDays: source.continuousActiveDays
});

const applySnapshot = (snapshot) => {
  Object.assign(profileForm, { ...snapshot, password: '' });
};

const fetchProfile = async () => {
  if (!userStore.userKey) {
    ElMessage.error('未找到当前用户标识，请重新登录');
    return;
  }

  loading.value = true;
  try {
    const response = await getTeacherProfile(userStore.userKey);
    if (response.success && response.data) {
      const detail = response.data || {};
      profileDetail.value = detail;
      applySnapshot({
        id: detail.id ?? null,
        userKey: detail.userKey || '',
        username: detail.username || '',
        nickname: detail.nickname || '',
        role: detail.role || '',
        status: detail.status || '',
        totalActiveDays: detail.totalActiveDays ?? 0,
        continuousActiveDays: detail.continuousActiveDays ?? 0
      });
      lastLoadedSnapshot.value = captureSnapshot(profileForm);
      if (profileFormRef.value) {
        profileFormRef.value.clearValidate();
      }
    } else {
      ElMessage.error(response.message || '获取个人信息失败');
    }
  } catch (error) {
    console.error('获取个人信息失败:', error);
    ElMessage.error('获取个人信息失败，请稍后重试');
  } finally {
    loading.value = false;
  }
};

const buildPayload = () => {
  const payload = {
    id: profileForm.id,
    userKey: profileForm.userKey,
    username: profileForm.username,
    nickname: profileForm.nickname,
    role: profileForm.role,
    status: profileForm.status,
    totalActiveDays: profileForm.totalActiveDays,
    continuousActiveDays: profileForm.continuousActiveDays
  };
  if (profileForm.password) {
    payload.password = profileForm.password;
  }
  return payload;
};

const handleSubmit = () => {
  if (!profileFormRef.value) return;
  profileFormRef.value.validate(async (valid) => {
    if (!valid) return;
    saving.value = true;
    try {
      const response = await updateTeacherProfile(buildPayload());
      if (response.success) {
        ElMessage.success('信息已更新');
        profileForm.password = '';
        lastLoadedSnapshot.value = captureSnapshot(profileForm);
        localStorage.setItem('user_nickname', profileForm.nickname || '');
        userStore.nickname = profileForm.nickname || '';
        await fetchProfile();
      } else {
        ElMessage.error(response.message || '更新失败');
      }
    } catch (error) {
      console.error('更新个人信息失败:', error);
      ElMessage.error('更新失败，请稍后重试');
    } finally {
      saving.value = false;
    }
  });
};

const handleReset = () => {
  if (!lastLoadedSnapshot.value) return;
  applySnapshot(lastLoadedSnapshot.value);
  if (profileFormRef.value) {
    profileFormRef.value.clearValidate();
  }
};

onMounted(() => {
  fetchProfile();
});
</script>

<style scoped>
.profile-container {
  width: 100%;
  padding: 8px 16px 32px;
  box-sizing: border-box;
}

.page-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 24px;
}

.page-title {
  font-size: 28px;
  font-weight: 600;
  color: #1f2937;
  margin: 0;
}

.page-subtitle {
  margin: 4px 0 0;
  color: #6b7280;
  font-size: 14px;
}

.header-actions {
  display: flex;
  gap: 12px;
}

.info-grid {
  display: grid;
  grid-template-columns: minmax(320px, 360px) 1fr;
  gap: 24px;
}

.info-card,
.form-card {
  min-height: 360px;
}

.card-header {
  display: flex;
  flex-direction: column;
  font-weight: 600;
  color: #111827;
}

.card-header small {
  font-weight: normal;
  color: #6b7280;
  margin-top: 4px;
}

.meta-descriptions {
  --el-descriptions-item-bordered-padding: 12px 16px;
}

.profile-form {
  max-width: 520px;
}

@media (max-width: 1200px) {
  .info-grid {
    grid-template-columns: 1fr;
  }

  .profile-container {
    padding: 8px 0 24px;
  }
}
</style>

