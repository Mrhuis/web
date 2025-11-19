<template>
  <div class="panel">
    <div class="header-section">
      <div class="filters">
        <el-input
          v-model="searchValue"
          placeholder="关键字查询"
          clearable
          class="filter-input"
        />
        <el-input
          v-model="knowledgeKey"
          placeholder="知识点标识"
          clearable
          class="filter-input"
        />
        <el-input
          v-model="knowledgeName"
          placeholder="知识点名称"
          clearable
          class="filter-input"
        />
      </div>
      <div class="actions">
        <el-button @click="resetFilters">
          <el-icon><Refresh /></el-icon>
          重置
        </el-button>
        <el-button type="primary" @click="openDialog">
          新增知识点
        </el-button>
      </div>
    </div>

    <el-table :data="knowledgeList" style="width: 100%" border v-loading="loading">
      <el-table-column label="知识点标识" prop="knowledge_key" width="180">
        <template #default="scope">
          {{ getKnowledgeKey(scope.row) }}
        </template>
      </el-table-column>
      <el-table-column label="名称" prop="name" width="200" />
      <!-- 难度，与管理员端保持一致展示 -->
      <el-table-column label="难度" prop="difficulty" width="110">
        <template #default="scope">
          <el-tag :type="getDifficultyType(scope.row.difficulty)">
            {{ getDifficultyText(scope.row.difficulty) }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="描述" prop="description" min-width="260" show-overflow-tooltip />
      <!-- 前置知识点，与管理员端字段保持一致 -->
      <el-table-column label="前置知识点" min-width="240">
        <template #default="scope">
          <span v-if="formatPrerequisite(scope.row).length">
            {{ formatPrerequisite(scope.row).join('，') }}
          </span>
          <span v-else>-</span>
        </template>
      </el-table-column>
      <!-- 上传者 -->
      <el-table-column label="上传者" prop="uploaded_by" width="120" />
      <el-table-column label="状态" width="120">
        <template #default="scope">
          <el-tag :type="getStatusType(scope.row.status)">
            {{ getStatusText(scope.row.status) }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="创建时间" prop="created_at" width="180" />
      <el-table-column label="操作" width="220" fixed="right">
        <template #default="scope">
          <el-button
            type="primary"
            size="small"
            @click="openDetailDialog(scope.row)"
          >
            查看详情
          </el-button>
          <el-button
            type="danger"
            size="small"
            v-if="canDelete(scope.row)"
            @click="handleDelete(scope.row)"
          >
            删除
          </el-button>
        </template>
      </el-table-column>
    </el-table>

    <div class="pagination-container">
      <el-pagination
        :current-page="currentPage"
        :page-size="pageSize"
        :page-sizes="[5, 10, 20, 50]"
        :total="totalCount"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
      />
    </div>

    <el-dialog
      v-model="showDialog"
      title="新增知识点"
      width="520px"
      :close-on-click-modal="false"
      append-to-body
    >
      <el-form ref="formRef" :model="form" :rules="rules" label-width="100px">
        <el-form-item label="知识点标识" prop="key">
          <el-input v-model="form.key" placeholder="请输入唯一标识" />
        </el-form-item>
        <el-form-item label="名称" prop="name">
          <el-input v-model="form.name" placeholder="请输入名称" />
        </el-form-item>
        <el-form-item label="描述" prop="description">
          <el-input
            v-model="form.description"
            type="textarea"
            :rows="4"
            placeholder="请输入描述"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="closeDialog">取 消</el-button>
        <el-button type="primary" @click="submitForm">确 定</el-button>
      </template>
    </el-dialog>

    <el-dialog
      v-model="showDetailDialog"
      title="知识点详情"
      width="640px"
      :close-on-click-modal="false"
      append-to-body
    >
      <el-descriptions
        v-if="detailRecord"
        :column="2"
        border
        label-class-name="desc-label"
        class="detail-descriptions"
      >
        <el-descriptions-item label="知识点标识">
          {{ getKnowledgeKey(detailRecord) }}
        </el-descriptions-item>
        <el-descriptions-item label="名称">
          {{ detailRecord.name || '-' }}
        </el-descriptions-item>
        <el-descriptions-item label="插件版本">
          {{ detailRecord.plugin_key || detailRecord.pluginKey || '-' }}
        </el-descriptions-item>
        <el-descriptions-item label="难度">
          {{ detailRecord.difficulty ?? '-' }}
        </el-descriptions-item>
        <el-descriptions-item label="前置知识点" :span="2">
          <span v-if="parsedPrerequisite.length">
            {{ parsedPrerequisite.join('，') }}
          </span>
          <span v-else>-</span>
        </el-descriptions-item>
        <el-descriptions-item label="描述" :span="2">
          {{ detailRecord.description || '-' }}
        </el-descriptions-item>
        <el-descriptions-item label="状态">
          {{ getStatusText(detailRecord.status) }}
        </el-descriptions-item>
        <el-descriptions-item label="上传者">
          {{ detailRecord.uploaded_by || detailRecord.uploadedBy || '-' }}
        </el-descriptions-item>
        <el-descriptions-item label="创建时间">
          {{ detailRecord.created_at || detailRecord.createdAt || '-' }}
        </el-descriptions-item>
      </el-descriptions>
      <template #footer>
        <el-button @click="showDetailDialog = false">关 闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { computed, ref, onMounted, watch } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Refresh } from '@element-plus/icons-vue';
import { useUserStore } from '@/store/user';
import {
  getTeacherKnowledgeList,
  createTeacherKnowledge,
  deleteTeacherKnowledge
} from '@/api/teacher/teacher_resource_manage_api';

const knowledgeList = ref([]);
const loading = ref(false);
const searchValue = ref('');
const knowledgeKey = ref('');
const knowledgeName = ref('');

const currentPage = ref(1);
const pageSize = ref(10);
const totalCount = ref(0);

const showDialog = ref(false);
const formRef = ref(null);
const form = ref({
  key: '',
  name: '',
  description: ''
});
const showDetailDialog = ref(false);
const detailRecord = ref(null);

const rules = {
  key: [{ required: true, message: '请输入知识点标识', trigger: 'blur' }],
  name: [{ required: true, message: '请输入知识点名称', trigger: 'blur' }],
  description: [{ required: true, message: '请输入描述', trigger: 'blur' }]
};

const userStore = useUserStore();
const currentUserKey = computed(() => userStore.userKey || localStorage.getItem('user_key'));

const fetchKnowledge = async () => {
  try {
    loading.value = true;
    const params = {
      page_index: currentPage.value,
      page_size: pageSize.value,
      key: knowledgeKey.value,
      name: knowledgeName.value,
      search_value: searchValue.value
    };
    const res = await getTeacherKnowledgeList(params);
    if (res.success) {
      const result = res.data || {};
      knowledgeList.value = result.records || [];
      totalCount.value = result.total || 0;
    }
  } catch (error) {
    console.error(error);
    ElMessage.error('获取知识点失败');
  } finally {
    loading.value = false;
  }
};

const getKnowledgeKey = (row) => {
  return row.knowledgeKey || row.knowledge_key || row.key || '-';
};

const parsedPrerequisite = computed(() => {
  if (!detailRecord.value) return [];
  try {
    if (Array.isArray(detailRecord.value.prerequisite)) {
      return detailRecord.value.prerequisite;
    }
    if (typeof detailRecord.value.prerequisite === 'string' && detailRecord.value.prerequisite.trim()) {
      return JSON.parse(detailRecord.value.prerequisite);
    }
  } catch (error) {
    console.warn('Failed to parse prerequisite', error);
  }
  return [];
});

const formatPrerequisite = (row) => {
  try {
    if (Array.isArray(row.prerequisite)) {
      return row.prerequisite;
    }
    if (typeof row.prerequisite === 'string' && row.prerequisite.trim()) {
      return JSON.parse(row.prerequisite);
    }
  } catch (error) {
    console.warn('Failed to parse prerequisite in table row', error);
  }
  return [];
};

const getDifficultyType = (difficulty) => {
  const types = ['', 'success', 'info', 'warning', 'danger', 'danger'];
  return types[difficulty] || 'info';
};

const getDifficultyText = (difficulty) => {
  const texts = ['', '入门', '基础', '中等', '困难', '专家'];
  return texts[difficulty] || '未知';
};

const getStatusType = (status) => {
  if (status === 'ENABLED') return 'success';
  if (status === 'DISABLED') return 'info';
  if (status === 'REJECTED') return 'danger';
  return 'warning';
};

const getStatusText = (status) => {
  if (status === 'ENABLED') return '启用';
  if (status === 'DISABLED') return '禁用';
  if (status === 'REJECTED') return '已拒绝';
  return '待审核';
};

const handleSizeChange = (val) => {
  pageSize.value = val;
  currentPage.value = 1;
  fetchKnowledge();
};

const handleCurrentChange = (val) => {
  currentPage.value = val;
  fetchKnowledge();
};

const resetFilters = () => {
  searchValue.value = '';
  knowledgeKey.value = '';
  knowledgeName.value = '';
  fetchKnowledge();
};

const openDialog = () => {
  resetForm();
  showDialog.value = true;
};

const closeDialog = () => {
  showDialog.value = false;
};

const resetForm = () => {
  form.value = {
    key: '',
    name: '',
    description: ''
  };
  formRef.value?.clearValidate();
};

const submitForm = () => {
  formRef.value.validate(async (valid) => {
    if (!valid) return;
    try {
      const uploadedBy = currentUserKey.value || 
        (typeof window !== 'undefined' && window.localStorage 
          ? localStorage.getItem('user_key') || '' 
          : '');
      await createTeacherKnowledge({
        ...form.value,
        uploadedBy
      });
      ElMessage.success('创建成功');
      closeDialog();
      fetchKnowledge();
    } catch (error) {
      console.error(error);
      ElMessage.error('创建失败');
    }
  });
};

const openDetailDialog = (row) => {
  detailRecord.value = { ...row };
  showDetailDialog.value = true;
};

const canDelete = (row) => {
  const uploader = row.uploaded_by || row.uploadedBy;
  return uploader && currentUserKey.value && uploader === currentUserKey.value;
};

const handleDelete = async (row) => {
  try {
    await ElMessageBox.confirm('确定删除该知识点吗？', '提示', { type: 'warning' });
    await deleteTeacherKnowledge(row.id);
    ElMessage.success('删除成功');
    fetchKnowledge();
  } catch (error) {
    if (error !== 'cancel') {
      console.error(error);
      ElMessage.error('删除失败');
    }
  }
};

watch([searchValue, knowledgeKey, knowledgeName], () => {
  currentPage.value = 1;
  fetchKnowledge();
});

onMounted(() => {
  fetchKnowledge();
});
</script>

<style scoped>
.panel {
  width: 100%;
  min-width: 0;
}

.header-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  flex-wrap: wrap;
  gap: 12px;
}

.filters {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  align-items: center;
}

.filter-input {
  width: 200px;
}

.actions {
  display: flex;
  gap: 12px;
}

.pagination-container {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}

.detail-descriptions {
  margin-bottom: 12px;
}

.desc-label {
  width: 120px;
}
</style>

