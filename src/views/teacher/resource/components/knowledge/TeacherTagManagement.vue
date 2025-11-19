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
          v-model="tagKey"
          placeholder="标签标识"
          clearable
          class="filter-input"
        />
        <el-input
          v-model="tagName"
          placeholder="标签名称"
          clearable
          class="filter-input"
        />
      </div>
      <div class="actions">
        <el-button @click="resetFilters">
          <el-icon><Refresh /></el-icon>
          重置
        </el-button>
        <el-button type="primary" @click="openDialog">新增标签</el-button>
      </div>
    </div>

    <el-table :data="tagList" border v-loading="loading">
      <el-table-column label="名称" width="200">
        <template #default="scope">
          {{ scope.row.name || scope.row.tagContent || '-' }}
        </template>
      </el-table-column>
      <el-table-column label="描述" min-width="260" show-overflow-tooltip>
        <template #default="scope">
          {{ scope.row.description || scope.row.tagDesc || '-' }}
        </template>
      </el-table-column>
      <!-- 标签类型，如果后端有返回则展示，否则为 '-' -->
      <el-table-column label="标签类型" width="140">
        <template #default="scope">
          <el-tag v-if="scope.row.tagApplicableType" :type="getTagTypeColor(scope.row.tagApplicableType)">
            {{ getTagTypeText(scope.row.tagApplicableType) }}
          </el-tag>
          <span v-else>-</span>
        </template>
      </el-table-column>
      <!-- 状态 -->
      <el-table-column label="状态" width="120">
        <template #default="scope">
          <el-tag :type="getStatusType(scope.row.status)">
            {{ getStatusText(scope.row.status) }}
          </el-tag>
        </template>
      </el-table-column>
      <!-- 上传者 -->
      <el-table-column label="上传者" width="120">
        <template #default="scope">
          {{ scope.row.uploaded_by || scope.row.uploadedBy || '-' }}
        </template>
      </el-table-column>
      <el-table-column label="创建时间" width="180">
        <template #default="scope">
          {{ scope.row.created_at || scope.row.createdAt || '-' }}
        </template>
      </el-table-column>
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
            v-if="canDelete(scope.row)"
            type="danger"
            size="small"
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
      title="新增标签"
      width="520px"
      :close-on-click-modal="false"
      append-to-body
    >
      <el-form ref="formRef" :model="form" :rules="rules" label-width="100px">
        <el-form-item label="标签标识" prop="key">
          <el-input v-model="form.key" placeholder="请输入唯一标识" />
        </el-form-item>
        <el-form-item label="标签名称" prop="name">
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
      title="标签详情"
      width="640px"
      :close-on-click-modal="false"
      append-to-body
    >
      <el-descriptions
        v-if="detailRecord"
        :column="2"
        border
        class="detail-descriptions"
      >
        <el-descriptions-item label="状态">
          {{ getStatusText(detailRecord.status) }}
        </el-descriptions-item>
        <el-descriptions-item label="标签名称">
          {{ detailRecord.name || detailRecord.tagContent || '-' }}
        </el-descriptions-item>
        <el-descriptions-item label="标签类型">
          <span v-if="detailRecord.tagApplicableType">
            {{ getTagTypeText(detailRecord.tagApplicableType) }}
          </span>
          <span v-else>-</span>
        </el-descriptions-item>
        <el-descriptions-item label="描述" :span="2">
          {{ detailRecord.description || detailRecord.tagDesc || '-' }}
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
import { ref, onMounted, watch, computed } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Refresh } from '@element-plus/icons-vue';
import {
  getTeacherTagList,
  createTeacherTag,
  deleteTeacherTag
} from '@/api/teacher/teacher_resource_manage_api';

const tagList = ref([]);
const loading = ref(false);
const searchValue = ref('');
const tagKey = ref('');
const tagName = ref('');

const currentPage = ref(1);
const pageSize = ref(10);
const totalCount = ref(0);

const showDialog = ref(false);
const showDetailDialog = ref(false);
const formRef = ref(null);
const form = ref({
  key: '',
  name: '',
  description: ''
});

const detailRecord = ref(null);

const currentUserKey = computed(() => {
  return (
    (typeof window !== 'undefined' && window.localStorage && localStorage.getItem('user_key')) ||
    ''
  );
});

const rules = {
  key: [{ required: true, message: '请输入标签标识', trigger: 'blur' }],
  name: [{ required: true, message: '请输入标签名称', trigger: 'blur' }],
  description: [{ required: true, message: '请输入描述', trigger: 'blur' }]
};

const fetchTags = async () => {
  try {
    loading.value = true;
    const params = {
      page_index: currentPage.value,
      page_size: pageSize.value,
      search_value: searchValue.value,
      key: tagKey.value,
      name: tagName.value
    };
    const res = await getTeacherTagList(params);
    if (res.success) {
      const result = res.data || {};
      tagList.value = result.records || [];
      totalCount.value = result.total || 0;
    }
  } catch (error) {
    console.error(error);
    ElMessage.error('获取标签失败');
  } finally {
    loading.value = false;
  }
};

const getTagKey = (row) => {
  return row.key || row.tagKey || row.tag_key || '-';
};

const getTagTypeColor = (type) => {
  const colorMap = {
    common: 'primary',
    item: 'warning',
    media: 'info'
  };
  return colorMap[type] || 'default';
};

const getTagTypeText = (type) => {
  const textMap = {
    common: '通用',
    item: '习题',
    media: '媒体'
  };
  return textMap[type] || type || '-';
};

const getStatusType = (status) => {
  const colorMap = {
    PENDING: 'warning',
    ENABLED: 'success',
    DISABLED: 'info',
    REJECTED: 'danger'
  };
  return colorMap[status] || 'default';
};

const getStatusText = (status) => {
  const textMap = {
    PENDING: '待审核',
    ENABLED: '启用',
    DISABLED: '禁用',
    REJECTED: '已拒绝'
  };
  return textMap[status] || status || '-';
};

const handleSizeChange = (val) => {
  pageSize.value = val;
  currentPage.value = 1;
  fetchTags();
};

const handleCurrentChange = (val) => {
  currentPage.value = val;
  fetchTags();
};

const resetFilters = () => {
  searchValue.value = '';
  tagKey.value = '';
  tagName.value = '';
  fetchTags();
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

const openDetailDialog = (row) => {
  detailRecord.value = { ...row };
  showDetailDialog.value = true;
};

const submitForm = () => {
  formRef.value.validate(async (valid) => {
    if (!valid) return;
    try {
      const uploadedBy = currentUserKey.value || 
        (typeof window !== 'undefined' && window.localStorage 
          ? localStorage.getItem('user_key') || '' 
          : '');
      await createTeacherTag({
        ...form.value,
        uploadedBy
      });
      ElMessage.success('创建成功');
      closeDialog();
      fetchTags();
    } catch (error) {
      console.error(error);
      ElMessage.error('创建失败');
    }
  });
};

const handleDelete = async (row) => {
  try {
    await ElMessageBox.confirm('确定删除该标签吗？', '提示', { type: 'warning' });
    await deleteTeacherTag(row.id);
    ElMessage.success('删除成功');
    fetchTags();
  } catch (error) {
    if (error !== 'cancel') {
      console.error(error);
      ElMessage.error('删除失败');
    }
  }
};

const canDelete = (row) => {
  const uploader = row.uploaded_by || row.uploadedBy;
  return uploader && currentUserKey.value && uploader === currentUserKey.value;
};

watch([searchValue, tagKey, tagName], () => {
  currentPage.value = 1;
  fetchTags();
});

onMounted(() => {
  fetchTags();
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
</style>

