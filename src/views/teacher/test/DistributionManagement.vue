<template>
  <div class="distribution-management">
    <div class="toolbar">
      <el-button type="primary" @click="handleAddDistribution">
        发布试卷
      </el-button>

      <el-form
        :model="filters"
        inline
        class="filter-form"
      >
        <el-form-item label="班级">
          <el-select
            v-model="filters.classKey"
            placeholder="选择班级"
            clearable
            filterable
            style="width: 180px"
          >
            <el-option
              v-for="item in classOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="试卷">
          <el-select
            v-model="filters.paperId"
            placeholder="输入名称搜索试卷"
            clearable
            filterable
            remote
            :remote-method="handlePaperSearch"
            :loading="paperLoading"
            style="width: 220px"
            @visible-change="(visible) => visible && fetchPaperOptions(paperSearchKeyword.value)"
          >
            <el-option
              v-for="item in paperOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-select
            v-model="filters.isRecycled"
            placeholder="全部"
            clearable
            style="width: 140px"
          >
            <el-option label="未回收" :value="0" />
            <el-option label="已回收" :value="1" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">查询</el-button>
          <el-button @click="handleResetFilters">重置</el-button>
        </el-form-item>
      </el-form>
    </div>

    <el-table
      :data="distributionList"
      v-loading="loading"
      border
      style="width: 100%; margin-top: 16px;"
    >
      <el-table-column prop="id" label="ID" width="80" />
      <el-table-column label="班级" min-width="180">
        <template #default="scope">
          {{ getClassLabel(scope.row.classKey) }}
        </template>
      </el-table-column>
      <el-table-column label="试卷" min-width="200">
        <template #default="scope">
          {{ getPaperLabel(scope.row.paperId) }}
        </template>
      </el-table-column>
      <el-table-column prop="distributeTime" label="下发时间" width="180">
        <template #default="scope">
          {{ formatDateTime(scope.row.distributeTime) }}
        </template>
      </el-table-column>
      <el-table-column prop="startTime" label="开始时间" width="180">
        <template #default="scope">
          {{ formatDateTime(scope.row.startTime) }}
        </template>
      </el-table-column>
      <el-table-column prop="deadline" label="截止时间" width="180">
        <template #default="scope">
          {{ formatDateTime(scope.row.deadline) }}
        </template>
      </el-table-column>
      <el-table-column prop="isRecycled" label="状态" width="120">
        <template #default="scope">
          <el-tag :type="scope.row.isRecycled === 1 ? 'warning' : 'success'">
            {{ scope.row.isRecycled === 1 ? '已回收' : '正常' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="remark" label="备注" min-width="200" show-overflow-tooltip />
      <el-table-column label="操作" width="200" fixed="right">
        <template #default="scope">
          <el-button size="small" type="warning" @click="handleToggleRecycle(scope.row)">
            {{ scope.row.isRecycled === 1 ? '取消回收' : '回收' }}
          </el-button>
          <el-button size="small" type="danger" @click="handleDelete(scope.row)">删除</el-button>
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

    <el-dialog
      v-model="dialogVisible"
      :title="dialogTitle"
      width="520px"
      append-to-body
      @close="handleDialogClose"
    >
      <el-form
        ref="distributionFormRef"
        :model="distributionForm"
        :rules="distributionRules"
        label-width="100px"
      >
        <el-form-item label="下发班级" prop="classKey">
          <el-select
            v-model="distributionForm.classKey"
            placeholder="选择班级"
            filterable
            style="width: 100%;"
          >
            <el-option
              v-for="item in classOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="下发试卷" prop="paperId">
          <el-select
            v-model="distributionForm.paperId"
            placeholder="输入名称搜索试卷"
            filterable
            remote
            :remote-method="handlePaperSearch"
            :loading="paperLoading"
            style="width: 100%;"
            @visible-change="(visible) => visible && fetchPaperOptions(paperSearchKeyword.value)"
          >
            <el-option
              v-for="item in paperOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="开始时间" prop="startTime">
          <el-date-picker
            v-model="distributionForm.startTime"
            type="datetime"
            placeholder="选择开始时间"
            format="YYYY-MM-DD HH:mm:ss"
            value-format="YYYY-MM-DD HH:mm:ss"
            style="width: 100%;"
          />
        </el-form-item>
        <el-form-item label="截止时间">
          <el-date-picker
            v-model="distributionForm.deadline"
            type="datetime"
            placeholder="可选"
            format="YYYY-MM-DD HH:mm:ss"
            value-format="YYYY-MM-DD HH:mm:ss"
            style="width: 100%;"
            clearable
          />
        </el-form-item>
        <el-form-item label="备注">
          <el-input
            v-model="distributionForm.remark"
            type="textarea"
            placeholder="请输入备注"
            :rows="3"
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
import { useUserStore } from '@/store/user';
import {
  getExamPaperDistributionList,
  addExamPaperDistribution,
  updateExamPaperDistribution,
  deleteExamPaperDistribution,
  getExamPaperDistributionDetail,
  recycleExamPaperDistribution,
  getExamPaperList
} from '@/api/teacher/teacher_test_manage/teacher_test_manage_api';
import { getClassList } from '@/api/teacher/teacher_class_manage_api';

const userStore = useUserStore();

const loading = ref(false);
const distributionList = ref([]);
const classOptions = ref([]);
const paperOptions = ref([]);
const paperLoading = ref(false);
const paperSearchKeyword = ref('');

const filters = reactive({
  classKey: '',
  paperId: null,
  isRecycled: null
});

const pagination = reactive({
  current: 1,
  size: 10,
  total: 0
});

const dialogVisible = ref(false);
const dialogTitle = ref('发布试卷');
const isEdit = ref(false);
const currentDistributionId = ref(null);
const distributionFormRef = ref(null);
const distributionForm = reactive({
  classKey: '',
  paperId: null,
  startTime: '',
  deadline: '',
  remark: ''
});

const distributionRules = {
  classKey: [{ required: true, message: '请选择班级', trigger: 'change' }],
  paperId: [{ required: true, message: '请选择试卷', trigger: 'change' }],
  startTime: [{ required: true, message: '请选择开始时间', trigger: 'change' }]
};

const normalizeDateTime = (value) => {
  if (!value) return '';
  if (typeof value === 'string') {
    return value.replace('T', ' ').split('.')[0];
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '';
  }
  const pad = (num) => (num < 10 ? `0${num}` : `${num}`);
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
};

const formatDateTime = (value) => {
  if (!value) return '-';
  if (typeof value === 'string') {
    return value.replace('T', ' ').split('.')[0];
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '-';
  }
  return date.toLocaleString();
};

const getClassLabel = (classKey) => {
  const option = classOptions.value.find((item) => item.value === classKey);
  return option ? option.label : (classKey || '-');
};

const getPaperLabel = (paperId) => {
  const option = paperOptions.value.find((item) => item.value === paperId);
  return option ? option.label : (paperId || '-');
};

const buildQueryParams = () => {
  const params = {
    pageIndex: pagination.current,
    pageSize: pagination.size
  };
  if (filters.classKey) {
    params.classKey = filters.classKey;
  }
  if (filters.paperId) {
    params.paperId = filters.paperId;
  }
  if (filters.isRecycled === 0 || filters.isRecycled === 1) {
    params.isRecycled = filters.isRecycled;
  }
  return params;
};

const fetchDistributionList = async () => {
  loading.value = true;
  try {
    // 从localStorage获取user_key作为创建者标识
    const userKey = localStorage.getItem('user_key');
    
    const params = buildQueryParams();
    params.creatorKey = userKey || ''; // 只查询当前教师创建的试卷的发布记录
    
    const response = await getExamPaperDistributionList(params);
    if (response.success) {
      distributionList.value = response.data.records || [];
      pagination.total = response.data.total || 0;
    }
  } catch (error) {
    console.error('获取发布列表失败:', error);
    ElMessage.error('获取发布列表失败');
  } finally {
    loading.value = false;
  }
};

const fetchClassOptions = async () => {
  try {
    const response = await getClassList({ pageIndex: 1, pageSize: 500 });
    if (response.success) {
      classOptions.value = (response.data.records || []).map((item) => ({
        label: item.name || item.classKey,
        value: item.classKey
      }));
    }
  } catch (error) {
    console.error('获取班级列表失败:', error);
  }
};

const mapPaperOption = (item) => {
  const name = item.paperName || `试卷${item.id}`;
  const subjectText = item.subject ? `（${item.subject}）` : '';
  return {
    label: `${name}${subjectText}`,
    value: item.id,
    raw: item
  };
};

const ensurePaperOptionExists = (paperId, label) => {
  if (!paperId) return;
  const exists = paperOptions.value.some((item) => item.value === paperId);
  if (!exists) {
    paperOptions.value.unshift({
      label: label || `试卷${paperId}`,
      value: paperId
    });
  }
};

const fetchPaperOptions = async (keyword = '') => {
  paperLoading.value = true;
  try {
    // 从localStorage获取user_key作为创建者标识
    const userKey = localStorage.getItem('user_key');
    
    const response = await getExamPaperList({
      pageIndex: 1,
      pageSize: 50,
      isEnabled: 1,
      paperName: keyword || undefined,
      creatorKey: userKey || '' // 只查询当前教师创建的试卷
    });
    if (response.success) {
      paperOptions.value = (response.data.records || []).map(mapPaperOption);
    }
  } catch (error) {
    console.error('获取试卷列表失败:', error);
  } finally {
    paperLoading.value = false;
  }
};

const handlePaperSearch = (query) => {
  paperSearchKeyword.value = query;
  fetchPaperOptions(query);
};

const handleSearch = () => {
  pagination.current = 1;
  fetchDistributionList();
};

const handleResetFilters = () => {
  filters.classKey = '';
  filters.paperId = null;
  filters.isRecycled = null;
  handleSearch();
};

const handleSizeChange = (size) => {
  pagination.size = size;
  pagination.current = 1;
  fetchDistributionList();
};

const handleCurrentChange = (page) => {
  pagination.current = page;
  fetchDistributionList();
};

const resetForm = () => {
  distributionForm.classKey = '';
  distributionForm.paperId = null;
  distributionForm.startTime = '';
  distributionForm.deadline = '';
  distributionForm.remark = '';
  distributionFormRef.value?.clearValidate();
};

const handleAddDistribution = () => {
  isEdit.value = false;
  currentDistributionId.value = null;
  dialogTitle.value = '发布试卷';
  resetForm();
  dialogVisible.value = true;
};

const handleEdit = async (row) => {
  isEdit.value = true;
  currentDistributionId.value = row.id;
  dialogTitle.value = '编辑发布';
  try {
    const response = await getExamPaperDistributionDetail(row.id);
    if (response.success && response.data) {
      distributionForm.classKey = response.data.classKey || '';
      distributionForm.paperId = response.data.paperId || null;
      distributionForm.startTime = normalizeDateTime(response.data.startTime);
      distributionForm.deadline = normalizeDateTime(response.data.deadline);
      distributionForm.remark = response.data.remark || '';
      ensurePaperOptionExists(distributionForm.paperId, response.data.paperName);
      dialogVisible.value = true;
    } else {
      ElMessage.error(response.message || '获取详情失败');
    }
  } catch (error) {
    console.error('获取发布详情失败:', error);
    ElMessage.error('获取发布详情失败');
  }
};

const handleToggleRecycle = (row) => {
  const targetStatus = row.isRecycled === 1 ? 0 : 1;
  const confirmText = targetStatus === 1 ? '确定回收该试卷吗？学生将无法作答。' : '确定取消回收，恢复学生作答权限吗？';
  ElMessageBox.confirm(confirmText, '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  })
    .then(async () => {
      try {
        const response = await recycleExamPaperDistribution({ id: row.id, isRecycled: targetStatus });
        if (response.success) {
          ElMessage.success(targetStatus === 1 ? '已回收' : '已取消回收');
          fetchDistributionList();
        } else {
          ElMessage.error(response.message || '操作失败');
        }
      } catch (error) {
        console.error('更新回收状态失败:', error);
        ElMessage.error('操作失败');
      }
    })
    .catch(() => {});
};

const handleDelete = (row) => {
  ElMessageBox.confirm(`确定要删除该发布记录吗？`, '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  })
    .then(async () => {
      try {
        const response = await deleteExamPaperDistribution(row.id);
        if (response.success) {
          ElMessage.success('删除成功');
          fetchDistributionList();
        } else {
          ElMessage.error(response.message || '删除失败');
        }
      } catch (error) {
        console.error('删除发布记录失败:', error);
        ElMessage.error('删除失败');
      }
    })
    .catch(() => {});
};

const handleSubmit = async () => {
  if (!distributionFormRef.value) return;
  await distributionFormRef.value.validate(async (valid) => {
    if (!valid) return;
    const payload = {
      classKey: distributionForm.classKey,
      paperId: distributionForm.paperId,
      startTime: distributionForm.startTime,
      deadline: distributionForm.deadline || null,
      remark: distributionForm.remark || ''
    };
    if (isEdit.value) {
      payload.id = currentDistributionId.value;
    } else {
      payload.distributorId = Number(userStore.id) || null;
    }
    try {
      const response = isEdit.value
        ? await updateExamPaperDistribution(payload)
        : await addExamPaperDistribution(payload);
      if (response.success) {
        ElMessage.success(isEdit.value ? '更新成功' : '发布成功');
        dialogVisible.value = false;
        fetchDistributionList();
      } else {
        ElMessage.error(response.message || (isEdit.value ? '更新失败' : '发布失败'));
      }
    } catch (error) {
      console.error('提交发布信息失败:', error);
      ElMessage.error(isEdit.value ? '更新失败' : '发布失败');
    }
  });
};

const handleDialogClose = () => {
  resetForm();
};

onMounted(async () => {
  await Promise.all([fetchClassOptions(), fetchPaperOptions()]);
  fetchDistributionList();
});
</script>

<style scoped>
.distribution-management {
  width: 100%;
}

.toolbar {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.filter-form {
  margin-top: 8px;
}
</style>

