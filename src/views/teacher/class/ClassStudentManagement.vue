<template>
  <div class="class-student-management">
    <div class="toolbar">
      <el-button type="primary" @click="handleAddEnrollment">
        <el-icon><Plus /></el-icon>
        添加学生
      </el-button>
      <el-select
        v-model="selectedClassKey"
        placeholder="请选择班级"
        style="width: 300px; margin-left: 16px;"
        clearable
        filterable
        @change="handleClassChange"
        @focus="loadTeacherClasses"
        :loading="classLoading"
      >
        <el-option
          v-for="item in teacherClassOptions"
          :key="item.classKey"
          :label="`${item.name} (${item.classKey})`"
          :value="item.classKey"
        />
      </el-select>
      <el-input
        v-model="searchForm.userKey"
        placeholder="搜索学生标识"
        style="width: 200px; margin-left: 8px;"
        clearable
        @clear="handleSearch"
        @keyup.enter="handleSearch"
      >
        <template #prefix>
          <el-icon><Search /></el-icon>
        </template>
      </el-input>
      <el-select
        v-model="searchForm.status"
        placeholder="选择状态"
        style="width: 150px; margin-left: 8px;"
        clearable
        @change="handleSearch"
      >
        <el-option label="待审核" :value="0" />
        <el-option label="已加入" :value="1" />
      </el-select>
      <el-button type="default" @click="handleSearch" style="margin-left: 8px;">搜索</el-button>
      <el-button type="default" @click="handleReset" style="margin-left: 8px;">重置</el-button>
    </div>

    <!-- 提示信息 -->
    <el-alert
      v-if="!selectedClassKey"
      type="info"
      :closable="false"
      style="margin-top: 16px;"
    >
      <template #default>
        <span>请先选择一个班级，查看该班级的学生信息</span>
      </template>
    </el-alert>

    <el-table
      :data="enrollmentList"
      v-loading="loading"
      style="width: 100%; margin-top: 16px;"
      border
      v-if="selectedClassKey"
    >
      <el-table-column prop="id" label="ID" width="80" />
      <el-table-column prop="classKey" label="班级标识" width="150" />
      <el-table-column prop="userKey" label="学生标识" width="150" />
      <el-table-column prop="status" label="状态" width="120">
        <template #default="scope">
          <el-tag :type="scope.row.status === 1 ? 'success' : 'warning'">
            {{ scope.row.status === 1 ? '已加入' : scope.row.status === 0 ? '待审核' : scope.row.status }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="enrolledAt" label="加入时间" width="180">
        <template #default="scope">
          {{ formatDateTime(scope.row.enrolledAt) }}
        </template>
      </el-table-column>
      <el-table-column label="操作" width="380" fixed="right">
        <template #default="scope">
          <el-button 
            v-if="scope.row.status === 0"
            size="small" 
            type="success" 
            @click="handleApprove(scope.row)"
          >
            审核通过
          </el-button>
          <el-button 
            size="small" 
            type="info" 
            @click="handleViewDetail(scope.row)"
          >
            详情
          </el-button>
          <el-button
            v-if="scope.row.status === 1"
            size="small"
            type="info"
            @click="handleViewKnowledgeStats(scope.row)"
          >
            知识点正确率
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
      v-if="selectedClassKey"
      v-model:current-page="pagination.current"
      v-model:page-size="pagination.size"
      :total="pagination.total"
      :page-sizes="[10, 20, 50, 100]"
      layout="total, sizes, prev, pager, next, jumper"
      style="margin-top: 16px; justify-content: flex-end;"
      @size-change="handleSizeChange"
      @current-change="handleCurrentChange"
    />

    <!-- 创建/编辑班级学生关系对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogTitle"
      width="600px"
      append-to-body
      @close="handleDialogClose"
    >
      <el-form
        :model="enrollmentForm"
        :rules="enrollmentRules"
        ref="enrollmentFormRef"
        label-width="100px"
      >
        <el-form-item label="班级" prop="classKey">
          <el-select
            v-model="enrollmentForm.classKey"
            placeholder="请选择班级"
            filterable
            remote
            :remote-method="searchClasses"
            :loading="classLoading"
            style="width: 100%;"
            @focus="loadClassOptions"
          >
            <el-option
              v-for="item in classOptions"
              :key="item.classKey"
              :label="`${item.name} (${item.classKey})`"
              :value="item.classKey"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="学生" prop="userKey">
          <el-select
            v-model="enrollmentForm.userKey"
            placeholder="请搜索并选择学生"
            filterable
            remote
            :remote-method="searchStudents"
            :loading="studentLoading"
            style="width: 100%;"
            @focus="loadStudentOptions"
          >
            <el-option
              v-for="item in studentOptions"
              :key="item.userKey"
              :label="`${item.nickname || item.username} (${item.userKey})`"
              :value="item.userKey"
            />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit">确定</el-button>
      </template>
    </el-dialog>

    <!-- 学生详情弹窗 -->
    <el-dialog
      v-model="studentDetailDialogVisible"
      title="学生基本信息"
      width="600px"
      append-to-body
    >
      <div v-loading="studentDetailLoading">
        <el-descriptions
          v-if="studentDetail"
          :column="2"
          border
          class="student-detail-descriptions"
        >
        <el-descriptions-item label="学生标识" :span="2">
          {{ studentDetail.userKey || '-' }}
        </el-descriptions-item>
        <el-descriptions-item label="用户名">
          {{ studentDetail.username || studentDetail.account || '-' }}
        </el-descriptions-item>
        <el-descriptions-item label="昵称">
          {{ studentDetail.nickname || '-' }}
        </el-descriptions-item>
        <el-descriptions-item label="角色">
          {{ studentDetail.role || '-' }}
        </el-descriptions-item>
        <el-descriptions-item label="状态">
          <el-tag :type="studentDetail.status === 'enabled' ? 'success' : 'danger'">
            {{ studentDetail.status === 'enabled' ? '启用' : studentDetail.status === 'disabled' ? '禁用' : studentDetail.status || '-' }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="创建时间" :span="2">
          {{ formatDateTime(studentDetail.createTime || studentDetail.createdAt) }}
        </el-descriptions-item>
        </el-descriptions>
        <div v-else-if="!studentDetailLoading" style="text-align: center; padding: 20px; color: #909399;">
          未找到学生信息
        </div>
      </div>
      <template #footer>
        <el-button @click="studentDetailDialogVisible = false">关 闭</el-button>
      </template>
    </el-dialog>

    <!-- 学生知识点正确率弹窗 -->
    <el-dialog
      v-model="knowledgeStatsDialogVisible"
      :title="`学生 ${currentUserKeyForStats} 知识点正确率`"
      width="820px"
      class="knowledge-stats-dialog"
      append-to-body
      @opened="renderKnowledgeStatsChart"
    >
      <div class="knowledge-stats-chart" id="knowledgeStatsChart"></div>

      <div class="knowledge-stats-table-wrapper">
        <el-table
          :data="knowledgeStatsList"
          v-loading="knowledgeStatsLoading"
          border
          style="width: 100%;"
        >
          <el-table-column prop="knowledgeName" label="知识点名称" min-width="220" />
          <el-table-column prop="knowledgeKey" label="知识点标识" min-width="200" />
          <el-table-column prop="correctCount" label="答对次数" width="120" />
          <el-table-column prop="totalCount" label="作答次数" width="120" />
          <el-table-column label="正确率" width="120">
            <template #default="scope">
              <span>
                {{ scope.row.totalCount > 0 ? `${scope.row.accuracy?.toFixed ? scope.row.accuracy.toFixed(2) : scope.row.accuracy}%` : '-' }}
              </span>
            </template>
          </el-table-column>
        </el-table>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, nextTick } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Plus, Search } from '@element-plus/icons-vue';
import * as echarts from 'echarts';
import {
  getClassStudentEnrollmentList,
  addClassStudentEnrollment,
  updateClassStudentEnrollment,
  deleteClassStudentEnrollment,
  getClassList
} from '@/api/teacher/teacher_class_manage_api';
import { getUserList, getUserBasicInfo } from '@/api/admin/admin_user_manage_api';
import { getUserKnowledgeAccuracy } from '@/api/teacher/teacher_class_manage_api';

const loading = ref(false);
const enrollmentList = ref([]);
const dialogVisible = ref(false);
const dialogTitle = ref('添加学生');
const enrollmentFormRef = ref(null);

// 学生详情弹窗相关
const studentDetailDialogVisible = ref(false);
const studentDetail = ref(null);
const studentDetailLoading = ref(false);

// 班级和学生选择相关
const classOptions = ref([]);
const classLoading = ref(false);
const studentOptions = ref([]);
const studentLoading = ref(false);
const teacherClassOptions = ref([]); // 当前教师创建的班级列表
const selectedClassKey = ref(''); // 当前选中的班级

const pagination = reactive({
  current: 1,
  size: 10,
  total: 0
});

const searchForm = reactive({
  classKey: '',
  userKey: '',
  status: ''
});

const enrollmentForm = reactive({
  classKey: '',
  userKey: ''
});

// 学生知识点正确率弹窗相关
const knowledgeStatsDialogVisible = ref(false);
const knowledgeStatsLoading = ref(false);
const currentUserKeyForStats = ref('');
const knowledgeStatsList = ref([]);
let knowledgeStatsChartInstance = null;

const enrollmentRules = {
  classKey: [
    { required: true, message: '请输入班级标识', trigger: 'blur' }
  ],
  userKey: [
    { required: true, message: '请输入学生标识', trigger: 'blur' }
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

// 加载当前教师创建的班级列表（用于顶部选择器）
const loadTeacherClasses = async () => {
  if (teacherClassOptions.value.length > 0) return; // 已加载过，不再重复加载
  
  classLoading.value = true;
  try {
    // 从localStorage获取user_key作为创建者标识
    const userKey = localStorage.getItem('user_key');
    
    const response = await getClassList({
      pageIndex: 1,
      pageSize: 100,
      creatorKey: userKey || '' // 只查询当前教师创建的班级
    });
    
    if (response.success && response.data) {
      teacherClassOptions.value = response.data.records || [];
    }
  } catch (error) {
    console.error('加载教师班级列表失败:', error);
  } finally {
    classLoading.value = false;
  }
};

// 加载班级选项（用于对话框中的选择）
const loadClassOptions = async () => {
  if (classOptions.value.length > 0) return; // 已加载过，不再重复加载
  
  classLoading.value = true;
  try {
    // 从localStorage获取user_key作为创建者标识
    const userKey = localStorage.getItem('user_key');
    
    const response = await getClassList({
      pageIndex: 1,
      pageSize: 100,
      creatorKey: userKey || '' // 只查询当前教师创建的班级
    });
    
    if (response.success && response.data) {
      classOptions.value = response.data.records || [];
    }
  } catch (error) {
    console.error('加载班级列表失败:', error);
  } finally {
    classLoading.value = false;
  }
};

// 搜索班级
const searchClasses = async (query) => {
  if (!query) {
    loadClassOptions();
    return;
  }
  
  classLoading.value = true;
  try {
    // 从localStorage获取user_key作为创建者标识
    const userKey = localStorage.getItem('user_key');
    
    const response = await getClassList({
      pageIndex: 1,
      pageSize: 100,
      name: query,
      creatorKey: userKey || '' // 只查询当前教师创建的班级
    });
    
    if (response.success && response.data) {
      classOptions.value = response.data.records || [];
    }
  } catch (error) {
    console.error('搜索班级失败:', error);
  } finally {
    classLoading.value = false;
  }
};

// 加载学生选项
const loadStudentOptions = async () => {
  if (studentOptions.value.length > 0) return; // 已加载过，不再重复加载
  
  studentLoading.value = true;
  try {
    const response = await getUserList({
      pageIndex: 1,
      pageSize: 100,
      role: 'student',
      status: 'enabled'
    });
    
    if (response.success && response.data) {
      studentOptions.value = response.data.records || [];
    }
  } catch (error) {
    console.error('加载学生列表失败:', error);
  } finally {
    studentLoading.value = false;
  }
};

// 搜索学生
const searchStudents = async (query) => {
  studentLoading.value = true;
  try {
    const params = {
      pageIndex: 1,
      pageSize: 100,
      role: 'student',
      status: 'enabled'
    };
    
    // 如果有关键词，进行模糊查询
    if (query) {
      // 优先匹配 userKey（如果以 U 开头或包含下划线）
      if (query.startsWith('U') || query.includes('_')) {
        params.userKey = query;
      } else {
        // 否则使用 nickname 进行搜索（更常用）
        params.nickname = query;
      }
    }
    
    const response = await getUserList(params);
    
    if (response.success && response.data) {
      studentOptions.value = response.data.records || [];
    }
  } catch (error) {
    console.error('搜索学生失败:', error);
  } finally {
    studentLoading.value = false;
  }
};

// 获取班级学生关系列表
const fetchEnrollmentList = async () => {
  loading.value = true;
  try {
    const params = {
      pageIndex: pagination.current,
      pageSize: pagination.size
    };
    
    // 如果选择了班级，优先使用选择的班级
    if (selectedClassKey.value) {
      params.classKey = selectedClassKey.value;
    } else if (searchForm.classKey) {
      params.classKey = searchForm.classKey;
    }
    
    if (searchForm.userKey) {
      params.userKey = searchForm.userKey;
    }
    if (searchForm.status !== '' && searchForm.status !== null && searchForm.status !== undefined) {
      params.status = searchForm.status;
    }
    
    const response = await getClassStudentEnrollmentList(params);
    
    if (response.success) {
      enrollmentList.value = response.data.records || [];
      pagination.total = response.data.total || 0;
    } else {
      ElMessage.error(response.message || '获取班级学生关系列表失败');
    }
  } catch (error) {
    console.error('获取班级学生关系列表失败:', error);
    ElMessage.error('获取班级学生关系列表失败');
  } finally {
    loading.value = false;
  }
};

// 搜索
const handleSearch = () => {
  pagination.current = 1;
  fetchEnrollmentList();
};

// 班级选择改变
const handleClassChange = (classKey) => {
  selectedClassKey.value = classKey;
  // 清空其他搜索条件
  searchForm.classKey = '';
  searchForm.userKey = '';
  searchForm.status = '';
  pagination.current = 1;
  fetchEnrollmentList();
};

// 重置搜索
const handleReset = () => {
  selectedClassKey.value = '';
  Object.assign(searchForm, {
    classKey: '',
    userKey: '',
    status: ''
  });
  pagination.current = 1;
  fetchEnrollmentList();
};

// 分页大小改变
const handleSizeChange = (size) => {
  pagination.size = size;
  pagination.current = 1;
  fetchEnrollmentList();
};

// 当前页改变
const handleCurrentChange = (page) => {
  pagination.current = page;
  fetchEnrollmentList();
};

// 添加学生
const handleAddEnrollment = () => {
  dialogTitle.value = '添加学生';
  resetForm();
  // 清空选项，重新加载
  classOptions.value = [];
  studentOptions.value = [];
  dialogVisible.value = true;
};

// 查看学生详情
const handleViewDetail = async (row) => {
  if (!row?.userKey) {
    ElMessage.warning('未找到学生标识');
    return;
  }
  
  studentDetailDialogVisible.value = true;
  studentDetailLoading.value = true;
  studentDetail.value = null;
  
  try {
    const response = await getUserBasicInfo(row.userKey);
    if (response.success && response.data) {
      studentDetail.value = response.data;
    } else {
      ElMessage.error(response.message || '获取学生信息失败');
      // 如果获取详细信息失败，至少显示基本信息
      studentDetail.value = {
        userKey: row.userKey,
        username: '-',
        nickname: '-',
        role: '-',
        status: '-'
      };
    }
  } catch (error) {
    console.error('获取学生信息失败:', error);
    ElMessage.error('获取学生信息失败');
    // 如果获取失败，至少显示基本信息
    studentDetail.value = {
      userKey: row.userKey,
      username: '-',
      nickname: '-',
      role: '-',
      status: '-'
    };
  } finally {
    studentDetailLoading.value = false;
  }
};

// 审核通过
const handleApprove = (row) => {
  ElMessageBox.confirm(
    `确定要审核通过该学生加入班级吗？`,
    '提示',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'success'
    }
  ).then(async () => {
    try {
      const response = await updateClassStudentEnrollment({
        id: row.id,
        classKey: row.classKey,
        userKey: row.userKey,
        status: 1
      });
      
      if (response.success) {
        ElMessage.success('审核通过成功');
        fetchEnrollmentList();
      } else {
        ElMessage.error(response.message || '审核通过失败');
      }
    } catch (error) {
      console.error('审核通过失败:', error);
      ElMessage.error('审核通过失败');
    }
  }).catch(() => {});
};

// 删除班级学生关系
const handleDelete = (row) => {
  ElMessageBox.confirm(
    `确定要删除该班级学生关系吗？`,
    '提示',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(async () => {
    try {
      const response = await deleteClassStudentEnrollment(row.id);
      
      if (response.success) {
        ElMessage.success('删除成功');
        fetchEnrollmentList();
      } else {
        ElMessage.error(response.message || '删除失败');
      }
    } catch (error) {
      console.error('删除班级学生关系失败:', error);
      ElMessage.error('删除班级学生关系失败');
    }
  }).catch(() => {});
};

// 渲染学生知识点正确率图表（柱状图）
const renderKnowledgeStatsChart = () => {
  nextTick(() => {
    const el = document.getElementById('knowledgeStatsChart');
    if (!el) return;

    if (!knowledgeStatsChartInstance) {
      knowledgeStatsChartInstance = echarts.init(el);
    } else {
      knowledgeStatsChartInstance.resize();
    }

    const names = knowledgeStatsList.value.map((item) => item.knowledgeName || item.knowledgeKey);
    const accuracies = knowledgeStatsList.value.map((item) =>
      item.totalCount > 0 ? (item.accuracy ?? 0) : 0
    );

    const option = {
      title: {
        text: '知识点正确率概览',
        left: 'center'
      },
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
        formatter: (params) => {
          const p = params[0];
          const row = knowledgeStatsList.value[p.dataIndex];
          return [
            `${row.knowledgeName || row.knowledgeKey}`,
            `正确率：${row.totalCount > 0 ? (row.accuracy ?? 0).toFixed(2) : '0.00'}%`,
            `答对次数：${row.correctCount}`,
            `作答次数：${row.totalCount}`
          ].join('<br/>');
        }
      },
      grid: { left: 60, right: 30, bottom: 80, top: 60 },
      xAxis: {
        type: 'category',
        data: names,
        axisLabel: {
          interval: 0,
          rotate: 40,
          fontSize: 11,
          formatter: (value) => (value && value.length > 8 ? `${value.slice(0, 8)}...` : value)
        }
      },
      yAxis: {
        type: 'value',
        name: '正确率(%)',
        min: 0,
        max: 100
      },
      series: [
        {
          type: 'bar',
          data: accuracies,
          itemStyle: {
            color: '#409EFF'
          },
          barMaxWidth: 40
        }
      ]
    };

    knowledgeStatsChartInstance.setOption(option);
  });
};

// 查看学生知识点正确率
const handleViewKnowledgeStats = async (row) => {
  if (!row?.userKey) {
    ElMessage.warning('未找到学生标识');
    return;
  }
  currentUserKeyForStats.value = row.userKey;
  knowledgeStatsDialogVisible.value = true;
  knowledgeStatsLoading.value = true;
  try {
    const resp = await getUserKnowledgeAccuracy(row.userKey);
    if (resp.success) {
      knowledgeStatsList.value = resp.data || [];
      renderKnowledgeStatsChart();
    } else {
      ElMessage.error(resp.message || '获取知识点正确率失败');
    }
  } catch (error) {
    console.error('获取学生知识点正确率失败:', error);
    ElMessage.error('获取学生知识点正确率失败');
  } finally {
    knowledgeStatsLoading.value = false;
  }
};

// 重置表单
const resetForm = () => {
  Object.assign(enrollmentForm, {
    classKey: '',
    userKey: ''
  });
  if (enrollmentFormRef.value) {
    enrollmentFormRef.value.clearValidate();
  }
};

// 对话框关闭
const handleDialogClose = () => {
  resetForm();
};

// 提交表单
const handleSubmit = async () => {
  if (!enrollmentFormRef.value) return;
  
  await enrollmentFormRef.value.validate(async (valid) => {
    if (valid) {
      try {
        // 移除编辑功能，只保留添加功能
        const response = await addClassStudentEnrollment({
          ...enrollmentForm,
          status: 1
        });
        
        if (response.success) {
          ElMessage.success('添加成功');
          dialogVisible.value = false;
          fetchEnrollmentList();
        } else {
          ElMessage.error(response.message || '添加失败');
        }
      } catch (error) {
        console.error('操作失败:', error);
        ElMessage.error('添加失败');
      }
    }
  });
};

// 初始化
onMounted(() => {
  // 加载教师创建的班级列表
  loadTeacherClasses();
  // 初始不加载学生列表，等待用户选择班级
  // fetchEnrollmentList();
});
</script>

<style scoped>
.class-student-management {
  width: 100%;
}

.toolbar {
  display: flex;
  align-items: center;
  margin-bottom: 16px;
  flex-wrap: wrap;
  gap: 8px;
}

.knowledge-stats-chart {
  width: 100%;
  height: 320px;
}

/* 固定知识点正确率弹窗整体高度，让内部内容看起来更稳定 */
.knowledge-stats-dialog :deep(.el-dialog__body) {
  max-height: 600px;
  overflow-y: visible;
}

/* 弹窗内部表格区域使用滚动条 */
.knowledge-stats-table-wrapper {
  margin-top: 16px;
  max-height: 260px;
  overflow-y: auto;
}

/* 学生详情描述列表样式 */
.student-detail-descriptions {
  margin-bottom: 12px;
}
</style>

