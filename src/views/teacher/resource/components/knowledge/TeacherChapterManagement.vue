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
          v-model="chapterKey"
          placeholder="章节标识"
          clearable
          class="filter-input"
        />
        <el-input
          v-model="chapterName"
          placeholder="章节名称"
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
          新增章节
        </el-button>
      </div>
    </div>

    <el-table :data="chapterList" border v-loading="loading">
      <el-table-column label="章节标识" width="180">
        <template #default="scope">
          {{ getChapterKey(scope.row) }}
        </template>
      </el-table-column>
      <el-table-column prop="name" label="章节名称" width="200" />
      <!-- 层级，与管理员端保持一致展示 -->
      <el-table-column label="层级" width="100">
        <template #default="scope">
          <el-tag>{{ getLevelText(scope.row.level) }}</el-tag>
        </template>
      </el-table-column>
      <!-- 排序 -->
      <el-table-column label="排序" width="100">
        <template #default="scope">
          {{ scope.row.sortOrder ?? scope.row.sort_order ?? '-' }}
        </template>
      </el-table-column>
      <el-table-column label="父章节" width="200">
        <template #default="scope">
          {{ scope.row.parentChapterKey || '-' }}
        </template>
      </el-table-column>
      <el-table-column prop="description" label="描述" min-width="220" show-overflow-tooltip />
      <!-- 上传者 -->
      <el-table-column label="上传者" width="120">
        <template #default="scope">
          {{ scope.row.uploaded_by || scope.row.uploadedBy || '-' }}
        </template>
      </el-table-column>
      <el-table-column label="状态" width="120">
        <template #default="scope">
          <el-tag :type="getStatusType(scope.row.status)">
            {{ getStatusText(scope.row.status) }}
          </el-tag>
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
      title="新增章节"
      width="560px"
      :close-on-click-modal="false"
      append-to-body
    >
      <el-form ref="formRef" :model="form" :rules="rules" label-width="110px">
        <el-form-item label="章节标识" prop="key">
          <el-input v-model="form.key" placeholder="请输入唯一标识" />
        </el-form-item>
        <el-form-item label="章节名称" prop="name">
          <el-input v-model="form.name" placeholder="请输入章节名称" />
        </el-form-item>
        <el-form-item label="父章节">
          <el-select
            v-model="form.parentId"
            placeholder="可选择父章节"
            clearable
            filterable
            class="full-width"
            @visible-change="onParentVisible"
          >
            <el-option
              v-for="item in parentOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="描述">
          <el-input
            v-model="form.description"
            type="textarea"
            :rows="4"
            placeholder="请输入章节描述"
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
      title="章节详情"
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
        <el-descriptions-item label="章节标识">
          {{ getChapterKey(detailRecord) }}
        </el-descriptions-item>
        <el-descriptions-item label="层级">
          {{ getLevelText(detailRecord.level) }}
        </el-descriptions-item>
        <el-descriptions-item label="章节名称">
          {{ detailRecord.name || '-' }}
        </el-descriptions-item>
        <el-descriptions-item label="父章节">
          {{ detailRecord.parentChapterKey || '-' }}
        </el-descriptions-item>
        <el-descriptions-item label="排序">
          {{ detailRecord.sortOrder ?? detailRecord.sort_order ?? '-' }}
        </el-descriptions-item>
        <el-descriptions-item label="状态">
          {{ getStatusText(detailRecord.status) }}
        </el-descriptions-item>
        <el-descriptions-item label="描述" :span="2">
          {{ detailRecord.description || '-' }}
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
  getTeacherChapterList,
  createTeacherChapter,
  deleteTeacherChapter
} from '@/api/teacher/teacher_resource_manage_api';

const chapterList = ref([]);
const loading = ref(false);
const searchValue = ref('');
const chapterKey = ref('');
const chapterName = ref('');

const currentPage = ref(1);
const pageSize = ref(10);
const totalCount = ref(0);

const parentOptions = ref([]);
const parentLoading = ref(false);

const showDialog = ref(false);
const showDetailDialog = ref(false);
const formRef = ref(null);
const form = ref({
  key: '',
  name: '',
  description: '',
  parentId: null
});

const detailRecord = ref(null);

const currentUserKey = computed(() => {
  return (
    (typeof window !== 'undefined' && window.localStorage && localStorage.getItem('user_key')) ||
    ''
  );
});

const rules = {
  key: [{ required: true, message: '请输入章节标识', trigger: 'blur' }],
  name: [{ required: true, message: '请输入章节名称', trigger: 'blur' }]
};

const fetchChapters = async () => {
  try {
    loading.value = true;
    const params = {
      page_index: currentPage.value,
      page_size: pageSize.value,
      search_value: searchValue.value,
      key: chapterKey.value,
      name: chapterName.value,
      userKey: currentUserKey.value
    };
    const res = await getTeacherChapterList(params);
    if (res.success) {
      const result = res.data || {};
      chapterList.value = result.records || [];
      totalCount.value = result.total || 0;
    }
  } catch (error) {
    console.error(error);
    ElMessage.error('获取章节失败');
  } finally {
    loading.value = false;
  }
};

const fetchParentOptions = async () => {
  try {
    parentLoading.value = true;
    const res = await getTeacherChapterList({
      page_index: 1,
      page_size: 500,
      userKey: currentUserKey.value
    });
    if (res.success) {
      const records = res.data?.records || [];
      parentOptions.value = records.map((item) => ({
        label: `${item.name || '-'} (${getChapterKey(item)})`,
        value: item.id
      }));
    }
  } catch (error) {
    console.error(error);
  } finally {
    parentLoading.value = false;
  }
};

const getLevelText = (level) => {
  if (!level && level !== 0) return '-';
  return `${level}级`;
};

const getChapterKey = (row) => {
  return row.chapterKey || row.chapter_key || row.key || '-';
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
  fetchChapters();
};

const handleCurrentChange = (val) => {
  currentPage.value = val;
  fetchChapters();
};

const resetFilters = () => {
  searchValue.value = '';
  chapterKey.value = '';
  chapterName.value = '';
  fetchChapters();
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
    description: '',
    parentId: null
  };
  formRef.value?.clearValidate();
};

const openDetailDialog = (row) => {
  detailRecord.value = { ...row };
  showDetailDialog.value = true;
};

const onParentVisible = (visible) => {
  if (visible && parentOptions.value.length === 0 && !parentLoading.value) {
    fetchParentOptions();
  }
};

const submitForm = () => {
  formRef.value.validate(async (valid) => {
    if (!valid) return;
    try {
      const uploadedBy = currentUserKey.value || 
        (typeof window !== 'undefined' && window.localStorage 
          ? localStorage.getItem('user_key') || '' 
          : '');
      await createTeacherChapter({
        ...form.value,
        uploadedBy
      });
      ElMessage.success('创建成功');
      closeDialog();
      fetchChapters();
    } catch (error) {
      console.error(error);
      ElMessage.error('创建失败');
    }
  });
};

const handleDelete = async (row) => {
  try {
    await ElMessageBox.confirm('确定删除该章节吗？', '提示', { type: 'warning' });
    await deleteTeacherChapter(row.id);
    ElMessage.success('删除成功');
    fetchChapters();
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

watch([searchValue, chapterKey, chapterName], () => {
  currentPage.value = 1;
  fetchChapters();
});

onMounted(() => {
  fetchChapters();
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

.full-width {
  width: 100%;
}

.detail-descriptions {
  margin-bottom: 12px;
}
</style>

