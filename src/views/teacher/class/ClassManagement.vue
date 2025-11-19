<template>
  <div class="class-management">
    <div class="toolbar">
      <el-button type="primary" @click="handleAddClass">
        <el-icon><Plus /></el-icon>
        创建班级
      </el-button>
      <el-input
        v-model="searchKeyword"
        placeholder="搜索班级名称或班级标识"
        style="width: 300px; margin-left: 16px;"
        clearable
        @clear="handleSearch"
        @keyup.enter="handleSearch"
      >
        <template #prefix>
          <el-icon><Search /></el-icon>
        </template>
      </el-input>
      <el-button type="default" @click="handleSearch" style="margin-left: 8px;">搜索</el-button>
    </div>

    <el-table
      :data="classList"
      v-loading="loading"
      style="width: 100%; margin-top: 16px;"
      border
    >
      <el-table-column prop="id" label="ID" width="80" />
      <el-table-column prop="classKey" label="班级标识" width="150" />
      <el-table-column prop="name" label="班级名称" min-width="200" />
      <el-table-column prop="inviteCode" label="邀请码" width="150" />
      <el-table-column prop="createdAt" label="创建时间" width="180">
        <template #default="scope">
          {{ formatDateTime(scope.row.createdAt) }}
        </template>
      </el-table-column>
      <el-table-column label="操作" width="200" fixed="right">
        <template #default="scope">
          <el-button 
            size="small" 
            type="primary" 
            @click="handleEdit(scope.row)"
          >
            编辑
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

    <el-pagination
      v-model:current-page="pagination.current"
      v-model:page-size="pagination.size"
      :total="pagination.total"
      :page-sizes="[10, 20, 50, 100]"
      layout="total, sizes, prev, pager, next, jumper"
      style="margin-top: 16px; justify-content: flex-end;"
      @size-change="handleSizeChange"
      @current-change="handleCurrentChange"
    />

    <!-- 创建/编辑班级对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogTitle"
      width="600px"
      append-to-body
      @close="handleDialogClose"
    >
      <el-form
        :model="classForm"
        :rules="classRules"
        ref="classFormRef"
        label-width="100px"
      >
        <el-form-item label="班级标识" prop="classKey">
          <el-input v-model="classForm.classKey" placeholder="请输入班级标识，如：C2024_01" />
        </el-form-item>
        <el-form-item label="班级名称" prop="name">
          <el-input v-model="classForm.name" placeholder="请输入班级名称，如：高一（3）班" />
        </el-form-item>
        <el-form-item label="邀请码" prop="inviteCode">
          <el-input v-model="classForm.inviteCode" placeholder="请输入邀请码" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Plus, Search } from '@element-plus/icons-vue';
import {
  getClassList,
  addClass,
  updateClass,
  deleteClass,
  getClassDetail
} from '@/api/teacher/teacher_class_manage_api';

const loading = ref(false);
const searchKeyword = ref('');
const classList = ref([]);
const dialogVisible = ref(false);
const dialogTitle = ref('创建班级');
const classFormRef = ref(null);
const isEdit = ref(false);
const currentClassId = ref(null);

const pagination = reactive({
  current: 1,
  size: 10,
  total: 0
});

const classForm = reactive({
  classKey: '',
  name: '',
  inviteCode: ''
});

const classRules = {
  classKey: [
    { required: true, message: '请输入班级标识', trigger: 'blur' }
  ],
  name: [
    { required: true, message: '请输入班级名称', trigger: 'blur' }
  ],
  inviteCode: [
    { required: true, message: '请输入邀请码', trigger: 'blur' }
  ]
};

// 格式化日期时间
const formatDateTime = (dateTime) => {
  if (!dateTime) return '-';
  // 如果已经是格式化的字符串，直接返回
  if (typeof dateTime === 'string' && dateTime.includes(' ')) {
    return dateTime;
  }
  const date = new Date(dateTime);
  // 检查日期是否有效
  if (isNaN(date.getTime())) {
    return dateTime; // 如果无法解析，返回原始值
  }
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
};

// 获取班级列表
const fetchClassList = async () => {
  loading.value = true;
  try {
    const params = {
      pageIndex: pagination.current,
      pageSize: pagination.size
    };
    
    // 如果有搜索关键词，添加到查询条件
    if (searchKeyword.value) {
      // 尝试匹配班级标识或班级名称
      if (searchKeyword.value.startsWith('C') || searchKeyword.value.includes('_')) {
        params.classKey = searchKeyword.value;
      } else {
        params.name = searchKeyword.value;
      }
    }
    
    const response = await getClassList(params);
    
    if (response.success) {
      classList.value = response.data.records || [];
      pagination.total = response.data.total || 0;
    } else {
      ElMessage.error(response.message || '获取班级列表失败');
    }
  } catch (error) {
    console.error('获取班级列表失败:', error);
    ElMessage.error('获取班级列表失败');
  } finally {
    loading.value = false;
  }
};

// 搜索
const handleSearch = () => {
  pagination.current = 1;
  fetchClassList();
};

// 分页大小改变
const handleSizeChange = (size) => {
  pagination.size = size;
  pagination.current = 1;
  fetchClassList();
};

// 当前页改变
const handleCurrentChange = (page) => {
  pagination.current = page;
  fetchClassList();
};

// 创建班级
const handleAddClass = () => {
  isEdit.value = false;
  currentClassId.value = null;
  dialogTitle.value = '创建班级';
  resetForm();
  dialogVisible.value = true;
};

// 编辑班级
const handleEdit = async (row) => {
  isEdit.value = true;
  currentClassId.value = row.id;
  dialogTitle.value = '编辑班级';
  
  try {
    const response = await getClassDetail(row.id);
    
    if (response.success && response.data) {
      Object.assign(classForm, {
        classKey: response.data.classKey || '',
        name: response.data.name || '',
        inviteCode: response.data.inviteCode || ''
      });
      dialogVisible.value = true;
    } else {
      ElMessage.error(response.message || '获取班级详情失败');
    }
  } catch (error) {
    console.error('获取班级详情失败:', error);
    ElMessage.error('获取班级详情失败');
  }
};

// 删除班级
const handleDelete = (row) => {
  ElMessageBox.confirm(
    `确定要删除班级"${row.name}"吗？`,
    '提示',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(async () => {
    try {
      const response = await deleteClass(row.id);
      
      if (response.success) {
        ElMessage.success('删除成功');
        fetchClassList();
      } else {
        ElMessage.error(response.message || '删除失败');
      }
    } catch (error) {
      console.error('删除班级失败:', error);
      ElMessage.error('删除班级失败');
    }
  }).catch(() => {});
};

// 重置表单
const resetForm = () => {
  Object.assign(classForm, {
    classKey: '',
    name: '',
    inviteCode: ''
  });
  if (classFormRef.value) {
    classFormRef.value.clearValidate();
  }
};

// 对话框关闭
const handleDialogClose = () => {
  resetForm();
};

// 提交表单
const handleSubmit = async () => {
  if (!classFormRef.value) return;
  
  await classFormRef.value.validate(async (valid) => {
    if (valid) {
      try {
        let response;
        if (isEdit.value) {
          response = await updateClass({
            id: currentClassId.value,
            ...classForm
          });
        } else {
          response = await addClass(classForm);
        }
        
        if (response.success) {
          ElMessage.success(isEdit.value ? '更新成功' : '创建成功');
          dialogVisible.value = false;
          fetchClassList();
        } else {
          ElMessage.error(response.message || (isEdit.value ? '更新失败' : '创建失败'));
        }
      } catch (error) {
        console.error('操作失败:', error);
        ElMessage.error(isEdit.value ? '更新失败' : '创建失败');
      }
    }
  });
};

// 初始化
onMounted(() => {
  fetchClassList();
});
</script>

<style scoped>
.class-management {
  width: 100%;
}

.toolbar {
  display: flex;
  align-items: center;
  margin-bottom: 16px;
}
</style>

