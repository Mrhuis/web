<template>
  <AdminLayout>
    <div class="page-header">
      <div>
        <h1 class="page-title">用户管理</h1>
        <p class="page-subtitle">统一管理学生、教师与管理员账号</p>
      </div>
      <div class="toolbar">
        <el-input
          v-model="query.username"
          placeholder="按账号搜索"
          size="small"
          clearable
          style="width: 180px;"
        />
        <el-input
          v-model="query.nickname"
          placeholder="按昵称搜索"
          size="small"
          clearable
          style="width: 180px;"
        />
        <el-select
          v-model="query.role"
          placeholder="角色"
          size="small"
          clearable
          style="width: 140px;"
        >
          <el-option label="学生" value="student" />
          <el-option label="教师" value="teacher" />
          <el-option label="管理员" value="admin" />
        </el-select>
        <el-select
          v-model="query.status"
          placeholder="状态"
          size="small"
          clearable
          style="width: 140px;"
        >
          <el-option label="启用" value="enabled" />
          <el-option label="禁用" value="disabled" />
        </el-select>
        <el-button type="primary" size="small" @click="handleSearch">查询</el-button>
        <el-button size="small" @click="resetSearch">重置</el-button>
        <el-button type="success" size="small" @click="openCreateDialog">新增用户</el-button>
      </div>
    </div>

    <el-table :data="userList" style="width:100%;" v-loading="loading">
      <el-table-column prop="id" label="ID" width="80" />
      <!-- userKey 是业务唯一标识，例如 U1001，这里表头改成"用户标识"以避免和账号混淆 -->
      <el-table-column prop="userKey" label="用户标识" width="140" />
      <!-- username 是登录用的账号名，这里表头改成"登录账号" -->
      <el-table-column prop="username" label="登录账号" width="160" />
      <el-table-column prop="nickname" label="昵称" width="140" />
      <el-table-column prop="role" label="角色" width="140">
        <template #default="scope">
          <el-tag v-if="scope.row.role === 'student'" type="success">学生</el-tag>
          <el-tag v-else-if="scope.row.role === 'teacher'" type="warning">教师</el-tag>
          <el-tag v-else type="info">管理员</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="status" label="状态" width="100">
        <template #default="scope">
          <el-tag v-if="scope.row.status === 'enabled'" type="success">启用</el-tag>
          <el-tag v-else type="danger">禁用</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="活跃状态" width="140">
        <template #default="scope">
          <el-tag :type="getActivityStatusTag(scope.row.lastActiveTime).type">
            {{ getActivityStatusTag(scope.row.lastActiveTime).text }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="totalActiveDays" label="总活跃天数" width="140" />
      <el-table-column prop="continuousActiveDays" label="连续活跃天数" width="150" />
      <el-table-column label="最后活跃时间" width="190">
        <template #default="scope">
          {{ formatDateTime(scope.row.lastActiveTime) }}
        </template>
      </el-table-column>
      <el-table-column label="注册时间" width="180">
        <template #default="scope">
          {{ formatDateTime(scope.row.createdAt) }}
        </template>
      </el-table-column>
      <el-table-column label="操作" width="260" fixed="right">
        <template #default="scope">
          <el-button size="small" @click="openEditDialog(scope.row)">编辑</el-button>
          <el-button
            size="small"
            :type="scope.row.status === 'enabled' ? 'warning' : 'success'"
            @click="toggleStatus(scope.row)"
          >
            {{ scope.row.status === 'enabled' ? '禁用' : '启用' }}
          </el-button>
          <el-button
            size="small"
            type="danger"
            @click="handleDelete(scope.row)"
          >
            删除
          </el-button>
        </template>
      </el-table-column>
    </el-table>

    <div class="pagination-wrapper">
      <el-pagination
        background
        layout="total, sizes, prev, pager, next, jumper"
        :total="pagination.total"
        v-model:current-page="pagination.current"
        v-model:page-size="pagination.pageSize"
        :page-sizes="[10, 20, 50]"
        @current-change="loadData"
        @size-change="handleSizeChange"
      />
    </div>

    <!-- 新增 / 编辑 用户 -->
    <el-dialog
      v-model="dialog.visible"
      :title="dialog.isEdit ? '编辑用户' : '新增用户'"
      width="500px"
      :close-on-click-modal="false"
      :close-on-press-escape="false"
      modal-class="user-dialog-mask"
      append-to-body
      :z-index="3000"
    >
      <el-form
        :model="dialog.form"
        :rules="rules"
        ref="formRef"
        label-width="100px"
      >
        <!-- userKey 为业务侧唯一标识 -->
        <el-form-item label="用户标识" prop="userKey">
          <el-input v-model="dialog.form.userKey" placeholder="如 U1001" />
        </el-form-item>
        <!-- username 为登录账号 -->
        <el-form-item label="登录账号" prop="username">
          <el-input v-model="dialog.form.username" />
        </el-form-item>
        <el-form-item label="密码" prop="password" v-if="!dialog.isEdit">
          <el-input v-model="dialog.form.password" type="password" show-password />
        </el-form-item>
        <el-form-item label="角色" prop="role">
          <el-select v-model="dialog.form.role" placeholder="请选择角色">
            <el-option label="学生" value="student" />
            <el-option label="教师" value="teacher" />
            <el-option label="管理员" value="admin" />
          </el-select>
        </el-form-item>
        <el-form-item label="昵称" prop="nickname">
          <el-input v-model="dialog.form.nickname" />
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-select v-model="dialog.form.status">
            <el-option label="启用" value="enabled" />
            <el-option label="禁用" value="disabled" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="dialog.visible = false">取消</el-button>
          <el-button type="primary" @click="submitForm">
            保存
          </el-button>
        </span>
      </template>
    </el-dialog>
  </AdminLayout>
</template>

<script setup>
import { onMounted, reactive, ref } from 'vue';
import dayjs from 'dayjs';
import { ElMessage, ElMessageBox } from 'element-plus';
import AdminLayout from '../AdminLayout.vue';
import {
  getUserList,
  addUser,
  updateUser,
  deleteUser,
} from '@/api/admin/admin_user_manage_api';

const loading = ref(false);
const userList = ref([]);

const query = reactive({
  username: '',
  nickname: '',
  role: '',
  status: '',
});

const pagination = reactive({
  current: 1,
  pageSize: 10,
  total: 0,
});

const dialog = reactive({
  visible: false,
  isEdit: false,
  form: {
    id: null,
    userKey: '',
    username: '',
    password: '',
    role: '',
    nickname: '',
    status: 'enabled',
  },
});

const formRef = ref(null);

const rules = {
  userKey: [{ required: true, message: '请输入业务ID', trigger: 'blur' }],
  username: [{ required: true, message: '请输入账号', trigger: 'blur' }],
  role: [{ required: true, message: '请选择角色', trigger: 'change' }],
  status: [{ required: true, message: '请选择状态', trigger: 'change' }],
};

const formatDateTime = (value) => (value ? dayjs(value).format('YYYY-MM-DD HH:mm:ss') : '--');

const getActivityStatusTag = (lastActiveTime) => {
  if (!lastActiveTime) {
    return { text: '从未活跃', type: 'info' };
  }
  const last = dayjs(lastActiveTime);
  if (!last.isValid()) {
    return { text: '未知', type: 'info' };
  }
  const diffDays = dayjs().startOf('day').diff(last.startOf('day'), 'day');
  if (diffDays === 0) {
    return { text: '今日活跃', type: 'success' };
  }
  if (diffDays === 1) {
    return { text: '昨日活跃', type: 'warning' };
  }
  if (diffDays <= 7) {
    return { text: `${diffDays}天前活跃`, type: 'warning' };
  }
  return { text: '超过7天未活跃', type: 'danger' };
};

// 后端 BaseEntity 使用的是下划线命名：page_index / page_size
// 这里按后端约定传参，分页才会生效
const buildQueryParams = () => ({
  page_index: pagination.current,
  page_size: pagination.pageSize,
  ...query,
});

const loadData = async () => {
  loading.value = true;
  try {
    const { data } = await getUserList(buildQueryParams());
    if (data && data.records) {
      userList.value = data.records;
      pagination.total = data.total || 0;
    } else {
      userList.value = [];
      pagination.total = 0;
    }
  } catch (e) {
    console.error(e);
    ElMessage.error('加载用户列表失败');
  } finally {
    loading.value = false;
  }
};

const handleSearch = () => {
  pagination.current = 1;
  loadData();
};

const resetSearch = () => {
  query.username = '';
  query.nickname = '';
  query.role = '';
  query.status = '';
  pagination.current = 1;
  loadData();
};

const handleSizeChange = (size) => {
  pagination.pageSize = size;
  pagination.current = 1;
  loadData();
};

const openCreateDialog = () => {
  dialog.isEdit = false;
  dialog.visible = true;
  dialog.form = {
    id: null,
    userKey: '',
    username: '',
    password: '',
    role: '',
    nickname: '',
    status: 'enabled',
  };
};

const openEditDialog = (row) => {
  dialog.isEdit = true;
  dialog.visible = true;
  dialog.form = {
    id: row.id,
    userKey: row.userKey,
    username: row.username,
    password: '',
    role: row.role,
    nickname: row.nickname,
    status: row.status,
  };
};

const submitForm = () => {
  if (!formRef.value) return;
  formRef.value.validate(async (valid) => {
    if (!valid) return;
    try {
      if (dialog.isEdit) {
        const payload = { ...dialog.form };
        if (!payload.password) {
          // 后端如果支持空密码表示不修改，可以直接传；否则可以删除该字段
          delete payload.password;
        }
        await updateUser(payload);
        ElMessage.success('更新成功');
      } else {
        // 创建用户时，后端 AdminUserAddDto 中没有 id 字段
        // 这里避免传递 id，防止出现 “Unrecognized field 'id'” 的 JSON 解析错误
        const { id, ...createPayload } = dialog.form;
        await addUser(createPayload);
        ElMessage.success('创建成功');
      }
      dialog.visible = false;
      loadData();
    } catch (e) {
      console.error(e);
      ElMessage.error(dialog.isEdit ? '更新失败' : '创建失败');
    }
  });
};

const toggleStatus = async (row) => {
  try {
    const newStatus = row.status === 'enabled' ? 'disabled' : 'enabled';
    await updateUser({
      id: row.id,
      userKey: row.userKey,
      username: row.username,
      role: row.role,
      nickname: row.nickname,
      status: newStatus,
    });
    ElMessage.success('状态更新成功');
    loadData();
  } catch (e) {
    console.error(e);
    ElMessage.error('状态更新失败');
  }
};

const handleDelete = (row) => {
  ElMessageBox.confirm(
    `确认删除用户「${row.username}」吗？`,
    '提示',
    {
      type: 'warning',
    },
  )
    .then(async () => {
      try {
        await deleteUser(row.id);
        ElMessage.success('删除成功');
        loadData();
      } catch (e) {
        console.error(e);
        ElMessage.error('删除失败');
      }
    })
    .catch(() => {});
};

onMounted(() => {
  loadData();
});
</script>

<style scoped>
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 16px;
  gap: 16px;
  flex-wrap: wrap;
}

.page-title {
  margin: 0;
  font-size: 24px;
  font-weight: 600;
}

.page-subtitle {
  margin-top: 4px;
  color: #6b7280;
}

.toolbar {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.pagination-wrapper {
  margin-top: 16px;
  text-align: right;
}

/* 参考 KnowledgePointManagement.vue，确保弹窗与遮罩在最上层 */
::deep(.el-dialog) {
  z-index: 3000 !important;
}

::deep(.el-dialog__wrapper) {
  z-index: 3000 !important;
}

::deep(.el-overlay) {
  z-index: 2999 !important;
}
</style>

<!-- 弹窗全屏高亮的遮罩样式，需为全局样式，不能加 scoped -->
<style>
.user-dialog-mask {
  /* 整个屏幕微暗，突出中间弹窗 */
  background-color: rgba(0, 0, 0, 0.6) !important;
  backdrop-filter: blur(1px);
}
</style>


