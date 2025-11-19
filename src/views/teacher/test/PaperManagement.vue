<template>
  <div class="paper-management">
    <div class="toolbar">
      <el-button type="primary" @click="handleAddPaper">
        <el-icon><Plus /></el-icon>
        创建试卷
      </el-button>
      <el-input
        v-model="searchKeyword"
        placeholder="搜索试卷名称"
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
      :data="paperList"
      v-loading="loading"
      style="width: 100%; margin-top: 16px;"
      border
    >
      <el-table-column prop="id" label="ID" width="80" />
      <el-table-column prop="paperName" label="试卷名称" min-width="200" />
      <el-table-column prop="subject" label="科目" width="120" />
      <el-table-column prop="difficulty" label="难度" width="100">
        <template #default="scope">
          <el-tag :type="scope.row.difficulty === 1 ? 'success' : scope.row.difficulty === 2 ? 'warning' : 'danger'">
            {{ scope.row.difficulty === 1 ? '简单' : scope.row.difficulty === 2 ? '中等' : '困难' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="totalScore" label="总分" width="100" />
      <el-table-column prop="timeLimit" label="时长(分钟)" width="120" />
      <el-table-column prop="createTime" label="创建时间" width="180" />
      <el-table-column label="操作" width="280" fixed="right">
        <template #default="scope">
          <el-button 
            v-if="scope.row.isEnabled === 0"
            size="small" 
            type="primary" 
            @click="handleEdit(scope.row)"
          >
            编辑
          </el-button>
          <el-button 
            v-if="scope.row.isEnabled === 0"
            size="small" 
            type="danger" 
            @click="handleDelete(scope.row)"
          >
            删除
          </el-button>
          <el-button
            size="small"
            :type="scope.row.isEnabled === 1 ? 'info' : 'success'"
            @click="handleToggleEnabled(scope.row)"
          >
            {{ scope.row.isEnabled === 1 ? '禁用' : '启用' }}
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

    <!-- 创建/编辑试卷对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogTitle"
      width="600px"
      append-to-body
      @close="handleDialogClose"
    >
      <el-form
        :model="paperForm"
        :rules="paperRules"
        ref="paperFormRef"
        label-width="100px"
      >
        <el-form-item label="试卷名称" prop="paperName">
          <el-input v-model="paperForm.paperName" placeholder="请输入试卷名称" />
        </el-form-item>
        <el-form-item label="科目" prop="subject">
          <el-input v-model="paperForm.subject" placeholder="请输入科目，如：数据结构" />
        </el-form-item>
        <el-form-item label="难度等级" prop="difficulty">
          <el-select v-model="paperForm.difficulty" placeholder="请选择难度" style="width: 100%;">
            <el-option label="简单" :value="1" />
            <el-option label="中等" :value="2" />
            <el-option label="困难" :value="3" />
          </el-select>
        </el-form-item>
        <el-form-item label="总分" prop="totalScore">
          <el-input-number
            v-model="paperForm.totalScore"
            :min="0"
            :max="1000"
            :precision="1"
            style="width: 100%;"
          />
        </el-form-item>
        <el-form-item label="时长(分钟)" prop="timeLimit">
          <el-input-number
            v-model="paperForm.timeLimit"
            :min="1"
            :max="600"
            style="width: 100%;"
          />
        </el-form-item>
        <el-form-item v-if="isEdit" label="是否启用" prop="isEnabled">
          <el-switch
            v-model="paperForm.isEnabled"
            :active-value="1"
            :inactive-value="0"
          />
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
import { useUserStore } from '@/store/user';
import {
  getExamPaperList,
  addExamPaper,
  updateExamPaper,
  deleteExamPaper,
  getExamPaperDetail
} from '@/api/teacher/teacher_test_manage/teacher_test_manage_api';

const userStore = useUserStore();
const loading = ref(false);
const searchKeyword = ref('');
const paperList = ref([]);
const dialogVisible = ref(false);
const dialogTitle = ref('创建试卷');
const paperFormRef = ref(null);
const isEdit = ref(false);
const currentPaperId = ref(null);

const pagination = reactive({
  current: 1,
  size: 10,
  total: 0
});

const paperForm = reactive({
  paperName: '',
  subject: '数据结构',
  difficulty: 2,
  totalScore: 100.0,
  timeLimit: 60,
  isEnabled: 1
});

const paperRules = {
  paperName: [
    { required: true, message: '请输入试卷名称', trigger: 'blur' }
  ],
  subject: [
    { required: true, message: '请输入科目', trigger: 'blur' }
  ],
  difficulty: [
    { required: true, message: '请选择难度等级', trigger: 'change' }
  ],
  totalScore: [
    { required: true, message: '请输入总分', trigger: 'blur' }
  ],
  timeLimit: [
    { required: true, message: '请输入时长', trigger: 'blur' }
  ]
};

// 获取试卷列表
const fetchPaperList = async () => {
  loading.value = true;
  try {
    const response = await getExamPaperList({
      pageIndex: pagination.current,
      pageSize: pagination.size,
      paperName: searchKeyword.value || undefined
    });
    
    if (response.success) {
      paperList.value = response.data.records || [];
      pagination.total = response.data.total || 0;
    } else {
      ElMessage.error(response.message || '获取试卷列表失败');
    }
  } catch (error) {
    console.error('获取试卷列表失败:', error);
    ElMessage.error('获取试卷列表失败');
  } finally {
    loading.value = false;
  }
};

// 搜索
const handleSearch = () => {
  pagination.current = 1;
  fetchPaperList();
};

// 分页大小改变
const handleSizeChange = (size) => {
  pagination.size = size;
  pagination.current = 1;
  fetchPaperList();
};

// 当前页改变
const handleCurrentChange = (page) => {
  pagination.current = page;
  fetchPaperList();
};

// 创建试卷
const handleAddPaper = () => {
  isEdit.value = false;
  currentPaperId.value = null;
  dialogTitle.value = '创建试卷';
  resetForm();
  dialogVisible.value = true;
};

// 编辑试卷
const handleEdit = async (row) => {
  // 只有禁用状态才能编辑
  if (row.isEnabled === 1) {
    ElMessage.warning('只有禁用状态的试卷才能编辑');
    return;
  }
  
  isEdit.value = true;
  currentPaperId.value = row.id;
  dialogTitle.value = '编辑试卷';
  
  try {
    const response = await getExamPaperDetail(row.id);
    
    if (response.success && response.data) {
      Object.assign(paperForm, {
        paperName: response.data.paperName || '',
        subject: response.data.subject || '数据结构',
        difficulty: response.data.difficulty || 2,
        totalScore: response.data.totalScore || 100.0,
        timeLimit: response.data.timeLimit || 60,
        isEnabled: response.data.isEnabled !== undefined ? response.data.isEnabled : 1
      });
      dialogVisible.value = true;
    } else {
      ElMessage.error(response.message || '获取试卷详情失败');
    }
  } catch (error) {
    console.error('获取试卷详情失败:', error);
    ElMessage.error('获取试卷详情失败');
  }
};

// 切换启用状态
const handleToggleEnabled = async (row) => {
  try {
    const newStatus = row.isEnabled === 1 ? 0 : 1;
    const response = await updateExamPaper({
      id: row.id,
      paperName: row.paperName,
      subject: row.subject,
      difficulty: row.difficulty,
      totalScore: row.totalScore,
      timeLimit: row.timeLimit,
      isEnabled: newStatus
    });
    
    if (response.success) {
      ElMessage.success(newStatus === 1 ? '已启用' : '已禁用');
      fetchPaperList();
    } else {
      ElMessage.error(response.message || '操作失败');
    }
  } catch (error) {
    console.error('操作失败:', error);
    ElMessage.error('操作失败');
  }
};

// 删除试卷
const handleDelete = (row) => {
  // 只有禁用状态才能删除
  if (row.isEnabled === 1) {
    ElMessage.warning('只有禁用状态的试卷才能删除');
    return;
  }
  
  ElMessageBox.confirm(
    `确定要删除试卷"${row.paperName}"吗？`,
    '提示',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(async () => {
    try {
      const response = await deleteExamPaper(row.id);
      
      if (response.success) {
        ElMessage.success('删除成功');
        fetchPaperList();
      } else {
        ElMessage.error(response.message || '删除失败');
      }
    } catch (error) {
      console.error('删除试卷失败:', error);
      ElMessage.error('删除试卷失败');
    }
  }).catch(() => {});
};

// 提交表单
const handleSubmit = async () => {
  if (!paperFormRef.value) return;
  
  await paperFormRef.value.validate(async (valid) => {
    if (valid) {
      try {
        let data;
        if (isEdit.value) {
          // 编辑时包含所有字段，包括 isEnabled
          data = { id: currentPaperId.value, ...paperForm };
        } else {
          // 添加时排除 isEnabled 字段（后端会默认设置为启用）
          const { isEnabled, ...addData } = paperForm;
          data = { ...addData, createUserId: userStore.id };
        }
        
        const response = isEdit.value
          ? await updateExamPaper(data)
          : await addExamPaper(data);
        
        if (response.success) {
          ElMessage.success(isEdit.value ? '更新成功' : '创建成功');
          dialogVisible.value = false;
          fetchPaperList();
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

// 重置表单
const resetForm = () => {
  Object.assign(paperForm, {
    paperName: '',
    subject: '数据结构',
    difficulty: 2,
    totalScore: 100.0,
    timeLimit: 60,
    isEnabled: 1
  });
  if (paperFormRef.value) {
    paperFormRef.value.clearValidate();
  }
};

// 对话框关闭
const handleDialogClose = () => {
  resetForm();
};

onMounted(() => {
  fetchPaperList();
});
</script>

<style scoped>
.paper-management {
  width: 100%;
  max-width: 100%;
  overflow: hidden;
  box-sizing: border-box;
}

.toolbar {
  display: flex;
  align-items: center;
  margin-bottom: 16px;
}

/* 确保表格不会影响父级布局 */
.paper-management :deep(.el-table) {
  width: 100% !important;
  max-width: 100% !important;
  table-layout: fixed;
}

.paper-management :deep(.el-table__body-wrapper) {
  overflow-x: auto;
}
</style>

