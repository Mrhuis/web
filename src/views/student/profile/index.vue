<template>
  <StudentLayout>
    <div class="profile-container">
      <div class="page-header">
        <div>
          <h1 class="page-title">个人信息管理</h1>
          <p class="page-subtitle">查看与更新您的学生账号资料</p>
        </div>
        <div class="header-actions">
          <el-button type="success" @click="handleJoinClass">
            加入班级
          </el-button>
          <el-button type="primary" @click="handleViewClasses">
            所属班级
          </el-button>
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

    <!-- 所属班级弹窗 -->
    <el-dialog
      v-model="classDialogVisible"
      title="所属班级"
      width="900px"
      append-to-body
    >
      <div v-loading="classLoading">
        <div v-if="studentClasses.length === 0" class="empty-state">
          <el-empty description="您还没有加入任何班级" />
        </div>
        <div v-else>
          <el-tabs v-model="activeClassTab" @tab-change="handleClassTabChange">
            <el-tab-pane
              v-for="classItem in studentClasses"
              :key="classItem.classKey"
              :label="classItem.className"
              :name="classItem.classKey"
            >
              <!-- 班级信息 -->
              <el-card shadow="never" style="margin-bottom: 16px;">
                <el-descriptions :column="2" border>
                  <el-descriptions-item label="班级标识">{{ classItem.classKey }}</el-descriptions-item>
                  <el-descriptions-item label="班级名称">{{ classItem.className }}</el-descriptions-item>
                  <el-descriptions-item label="邀请码">{{ classItem.inviteCode || '--' }}</el-descriptions-item>
                  <el-descriptions-item label="加入时间">{{ formatDateTime(classItem.enrolledAt) }}</el-descriptions-item>
                </el-descriptions>
              </el-card>

              <!-- 同班同学列表 -->
              <div>
                <h3 style="margin-bottom: 12px; font-size: 16px; font-weight: 600;">同班同学</h3>
                <div class="students-table-container">
                  <el-table
                    :data="classStudents[classItem.classKey] || []"
                    border
                    style="width: 100%"
                    v-loading="studentsLoading[classItem.classKey]"
                    height="300"
                  >
                    <el-table-column prop="userKey" label="学生标识" width="150" />
                    <el-table-column prop="username" label="账号" width="150" />
                    <el-table-column prop="nickname" label="昵称" min-width="150" />
                  </el-table>
                  <el-empty
                    v-if="!studentsLoading[classItem.classKey] && (!classStudents[classItem.classKey] || classStudents[classItem.classKey].length === 0)"
                    description="暂无同学信息"
                    style="margin-top: 20px;"
                  />
                </div>
              </div>
            </el-tab-pane>
          </el-tabs>
        </div>
      </div>
      <template #footer>
        <el-button @click="classDialogVisible = false">关闭</el-button>
      </template>
    </el-dialog>

    <!-- 加入班级弹窗 -->
    <el-dialog
      v-model="joinClassDialogVisible"
      title="加入班级"
      width="500px"
      append-to-body
      @close="handleJoinClassDialogClose"
    >
      <el-form
        :model="joinClassForm"
        :rules="joinClassRules"
        ref="joinClassFormRef"
        label-width="100px"
      >
        <el-form-item label="邀请码" prop="inviteCode">
          <el-input
            v-model="joinClassForm.inviteCode"
            placeholder="请输入班级邀请码"
            clearable
            maxlength="16"
            show-word-limit
          />
        </el-form-item>
        <el-alert
          type="info"
          :closable="false"
          style="margin-top: 8px;"
        >
          <template #default>
            <span>输入班级邀请码后，需要等待教师审核通过才能加入班级</span>
          </template>
        </el-alert>
      </el-form>
      <template #footer>
        <el-button @click="joinClassDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="joiningClass" @click="handleJoinClassSubmit">确定</el-button>
      </template>
    </el-dialog>
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
import { getStudentClasses, getClassInfoByKey, getClassStudents, joinClassByInviteCode } from '@/api/student/student_class_api';
import { getUserBasicInfo } from '@/api/admin/admin_user_manage_api';

const userStore = useUserStore();
const loading = ref(false);
const saving = ref(false);
const profileFormRef = ref(null);
const profileDetail = ref(null);
const lastLoadedSnapshot = ref(null);

// 班级相关
const classDialogVisible = ref(false);
const classLoading = ref(false);
const studentClasses = ref([]);
const activeClassTab = ref('');
const classStudents = ref({}); // { classKey: [students] }
const studentsLoading = ref({}); // { classKey: boolean }

// 加入班级相关
const joinClassDialogVisible = ref(false);
const joiningClass = ref(false);
const joinClassFormRef = ref(null);
const joinClassForm = reactive({
  inviteCode: ''
});
const joinClassRules = {
  inviteCode: [
    { required: true, message: '请输入邀请码', trigger: 'blur' },
    { min: 1, max: 16, message: '邀请码长度在1到16个字符之间', trigger: 'blur' }
  ]
};

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

// 查看所属班级
const handleViewClasses = async () => {
  if (!userStore.userKey) {
    ElMessage.error('未找到当前用户标识，请重新登录');
    return;
  }

  classDialogVisible.value = true;
  classLoading.value = true;
  studentClasses.value = [];
  classStudents.value = {};
  studentsLoading.value = {};

  try {
    // 获取学生所属的班级列表
    const enrollmentResponse = await getStudentClasses(userStore.userKey);
    
    if (enrollmentResponse.success && enrollmentResponse.data) {
      const enrollments = enrollmentResponse.data.records || [];
      
      // 获取每个班级的详细信息
      const classPromises = enrollments.map(async (enrollment) => {
        const classResponse = await getClassInfoByKey(enrollment.classKey);
        if (classResponse.success && classResponse.data && classResponse.data.records && classResponse.data.records.length > 0) {
          const classInfo = classResponse.data.records[0];
          return {
            classKey: enrollment.classKey,
            className: classInfo.name || enrollment.classKey,
            inviteCode: classInfo.inviteCode || '',
            enrolledAt: enrollment.enrolledAt
          };
        }
        return {
          classKey: enrollment.classKey,
          className: enrollment.classKey,
          inviteCode: '',
          enrolledAt: enrollment.enrolledAt
        };
      });

      const classes = await Promise.all(classPromises);
      studentClasses.value = classes;

      // 如果有班级，默认选中第一个并加载学生列表
      if (classes.length > 0) {
        activeClassTab.value = classes[0].classKey;
        await loadClassStudents(classes[0].classKey);
      }
    } else {
      ElMessage.warning('您还没有加入任何班级');
    }
  } catch (error) {
    console.error('获取班级信息失败:', error);
    ElMessage.error('获取班级信息失败');
  } finally {
    classLoading.value = false;
  }
};

// 加载班级学生列表
const loadClassStudents = async (classKey) => {
  if (classStudents.value[classKey]) {
    // 已经加载过，不再重复加载
    return;
  }

  studentsLoading.value[classKey] = true;
  try {
    // 获取班级学生关系列表
    const response = await getClassStudents(classKey);
    
    if (response.success && response.data) {
      const enrollments = response.data.records || [];
      
      // 获取每个学生的基础信息
      const studentPromises = enrollments.map(async (enrollment) => {
        try {
          const userInfoResponse = await getUserBasicInfo(enrollment.userKey);
          if (userInfoResponse.success && userInfoResponse.data) {
            return {
              userKey: enrollment.userKey,
              username: userInfoResponse.data.username || enrollment.userKey,
              nickname: userInfoResponse.data.nickname || enrollment.userKey
            };
          }
          return {
            userKey: enrollment.userKey,
            username: enrollment.userKey,
            nickname: enrollment.userKey
          };
        } catch (error) {
          console.error(`获取学生${enrollment.userKey}信息失败:`, error);
          return {
            userKey: enrollment.userKey,
            username: enrollment.userKey,
            nickname: enrollment.userKey
          };
        }
      });

      const students = await Promise.all(studentPromises);
      classStudents.value[classKey] = students;
    }
  } catch (error) {
    console.error('获取班级学生列表失败:', error);
    ElMessage.error('获取班级学生列表失败');
  } finally {
    studentsLoading.value[classKey] = false;
  }
};

// 班级标签页切换
const handleClassTabChange = (classKey) => {
  if (classKey) {
    loadClassStudents(classKey);
  }
};

// 打开加入班级弹窗
const handleJoinClass = () => {
  joinClassDialogVisible.value = true;
  joinClassForm.inviteCode = '';
  if (joinClassFormRef.value) {
    joinClassFormRef.value.clearValidate();
  }
};

// 关闭加入班级弹窗
const handleJoinClassDialogClose = () => {
  joinClassForm.inviteCode = '';
  if (joinClassFormRef.value) {
    joinClassFormRef.value.clearValidate();
  }
};

// 提交加入班级
const handleJoinClassSubmit = async () => {
  if (!joinClassFormRef.value) return;

  if (!userStore.userKey) {
    ElMessage.error('未找到当前用户标识，请重新登录');
    return;
  }

  await joinClassFormRef.value.validate(async (valid) => {
    if (valid) {
      joiningClass.value = true;
      try {
        const response = await joinClassByInviteCode(joinClassForm.inviteCode, userStore.userKey);
        
        if (response.success) {
          ElMessage.success(response.data || '申请加入班级成功，等待教师审核');
          joinClassDialogVisible.value = false;
          // 刷新班级列表
          if (classDialogVisible.value) {
            await handleViewClasses();
          }
        } else {
          ElMessage.error(response.message || '加入班级失败');
        }
      } catch (error) {
        console.error('加入班级失败:', error);
        // 错误消息已经在 request.js 的响应拦截器中显示过了（当 success === false 时）
        // 这里只需要处理网络错误或其他未在拦截器中处理的错误
        // 如果 error.response 存在，说明是 HTTP 错误，可能已经在拦截器中处理过
        // 如果 error.message 包含业务错误信息，说明已经在拦截器中显示过
        const errorMessage = error.message || '';
        const isBusinessError = errorMessage && (
          errorMessage.includes('已经加入') || 
          errorMessage.includes('邀请码无效') || 
          errorMessage.includes('不能为空')
        );
        
        // 如果是业务错误，已经在拦截器中显示过，不再重复显示
        // 只处理网络错误或其他未预期的错误
        if (!isBusinessError && !error.response) {
          ElMessage.error('网络错误，请检查网络连接后重试');
        }
      } finally {
        joiningClass.value = false;
      }
    }
  });
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

.empty-state {
  padding: 40px 0;
  text-align: center;
}

.students-table-container {
  max-height: 300px;
  overflow: hidden;
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

