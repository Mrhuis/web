<template>
  <div class="question-management">
    <div class="toolbar">
      <el-button type="primary" @click="handleAddQuestion">
        <el-icon><Plus /></el-icon>
        添加题目
      </el-button>
      <el-select
        v-model="selectedPaperId"
        placeholder="选择试卷"
        style="width: 200px; margin-left: 16px;"
        clearable
        @change="handlePaperChange"
      >
        <el-option
          v-for="paper in paperOptions"
          :key="paper.id"
          :label="paper.paperName"
          :value="paper.id"
        />
      </el-select>
      <el-input
        v-model="searchKeyword"
        placeholder="搜索题目标识"
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
      :data="questionList"
      v-loading="loading"
      style="width: 100%; margin-top: 16px;"
      border
    >
      <el-table-column prop="id" label="ID" width="80" />
      <el-table-column prop="paperTitle" label="所属试卷" min-width="200" />
      <el-table-column prop="itemKey" label="题目标识" width="120" />
      <el-table-column label="题目内容" min-width="300" show-overflow-tooltip>
        <template #default="scope">
          <div v-if="scope.row.item && scope.row.item.content" class="question-content-preview">
            {{ getContentPreview(scope.row.item.content) }}
          </div>
          <span v-else class="text-muted">-</span>
        </template>
      </el-table-column>
      <el-table-column prop="sortNum" label="排序" width="100" />
      <el-table-column prop="actualScore" label="分值" width="100" />
      <el-table-column label="操作" width="250" fixed="right">
        <template #default="scope">
          <el-button size="small" @click="handleView(scope.row)">查看</el-button>
          <el-button size="small" type="primary" @click="handleEdit(scope.row)">编辑</el-button>
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

    <!-- 查看题目详情对话框 -->
    <el-dialog
      v-model="viewDialogVisible"
      title="题目详情"
      width="800px"
      append-to-body
    >
      <el-descriptions :column="1" border>
        <el-descriptions-item label="所属试卷">
          {{ viewQuestion.paperTitle || '未知试卷' }}
        </el-descriptions-item>
        <el-descriptions-item label="题目标识">
          {{ viewQuestion.itemKey || '-' }}
        </el-descriptions-item>
        <el-descriptions-item label="排序">
          {{ viewQuestion.sortNum }}
        </el-descriptions-item>
        <el-descriptions-item label="分值">
          {{ viewQuestion.actualScore }}
        </el-descriptions-item>
      </el-descriptions>
      <div v-if="viewQuestion.content" class="question-content">
        <el-divider>题干</el-divider>
        <div class="rich-text" v-html="viewQuestion.content" />
      </div>
      <div v-if="viewQuestion.options" class="question-content">
        <el-divider>选项</el-divider>
        <div class="rich-text" v-html="viewQuestion.options" />
      </div>
      <div v-if="viewQuestion.answer" class="question-content">
        <el-divider>答案</el-divider>
        <div class="rich-text" v-html="viewQuestion.answer" />
      </div>
      <div v-if="viewQuestion.solution" class="question-content">
        <el-divider>解析</el-divider>
        <div class="rich-text" v-html="viewQuestion.solution" />
      </div>
      <template #footer>
        <el-button type="primary" @click="viewDialogVisible = false">关闭</el-button>
      </template>
    </el-dialog>

    <!-- 创建/编辑题目对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogTitle"
      width="700px"
      append-to-body
      @close="handleDialogClose"
    >
      <el-form
        :model="questionForm"
        :rules="questionRules"
        ref="questionFormRef"
        label-width="100px"
      >
        <el-form-item label="所属试卷" prop="paperId">
          <el-select
            v-model="questionForm.paperId"
            placeholder="请选择试卷"
            style="width: 100%;"
            filterable
          >
            <el-option
              v-for="paper in paperOptions"
              :key="paper.id"
              :label="paper.paperName"
              :value="paper.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="题目标识" prop="itemKey">
          <el-select
            v-model="questionForm.itemKey"
            placeholder="请选择题目"
            style="width: 100%;"
            filterable
            remote
            :remote-method="remoteSearchItems"
            :loading="itemLoading"
            clearable
            @focus="handleItemSelectFocus"
          >
            <el-option
              v-for="item in itemOptions"
              :key="item.itemKey"
              :label="`${item.itemKey || ''}${item.content ? ' - ' + (item.content.length > 50 ? item.content.substring(0, 50) + '...' : item.content) : ''}`"
              :value="item.itemKey"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="排序" prop="sortNum">
          <el-input-number
            v-model="questionForm.sortNum"
            :min="1"
            style="width: 100%;"
          />
        </el-form-item>
        <el-form-item label="分值" prop="actualScore">
          <el-input-number
            v-model="questionForm.actualScore"
            :min="0"
            :max="100"
            :precision="1"
            style="width: 100%;"
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
import {
  getExamPaperList,
  getExamPaperQuestionList,
  addExamPaperQuestion,
  updateExamPaperQuestion,
  deleteExamPaperQuestion,
  getExamPaperQuestionDetail,
  getItemList
} from '@/api/teacher/teacher_test_manage/teacher_test_manage_api';
import { processImagePaths } from '@/utils/imageUtils';

const loading = ref(false);
const searchKeyword = ref('');
const selectedPaperId = ref(null);
const questionList = ref([]);
const paperOptions = ref([]);
const itemOptions = ref([]);
const itemLoading = ref(false);
const itemSearchKeyword = ref('');
const dialogVisible = ref(false);
const dialogTitle = ref('添加题目');
const questionFormRef = ref(null);
const isEdit = ref(false);
const currentQuestionId = ref(null);
const viewDialogVisible = ref(false);
const viewQuestion = reactive({
  paperTitle: '',
  paperId: null,
  itemKey: '',
  sortNum: null,
  actualScore: null,
  formKey: '',
  difficulty: null,
  content: '',
  options: '',
  answer: '',
  solution: ''
});

// 将题目内容中的图片路径和Markdown图片语法转换为可直接展示的HTML
const formatRichText = (content) => {
  if (!content) return '';
  // 先处理图片路径（相对路径 -> 后端静态资源URL）
  let processed = processImagePaths(content);
  // 再把 Markdown 图片语法转换为 <img> 标签
  const mdImgRegex = /!\[([^\]]*)\]\(([^)]+)\)/g;
  processed = processed.replace(mdImgRegex, (_match, alt, src) => {
    const safeAlt = alt || '';
    return `<img src="${src}" alt="${safeAlt}" style="max-width:100%; height:auto;" />`;
  });
  // 简单处理换行
  processed = processed.replace(/\n/g, '<br/>');
  return processed;
};

// 获取题目内容预览（去除HTML标签，截断长文本）
const getContentPreview = (content) => {
  if (!content) return '';
  // 去除HTML标签
  let text = content.replace(/<[^>]*>/g, '');
  // 去除Markdown语法标记
  text = text.replace(/#{1,6}\s+/g, ''); // 标题
  text = text.replace(/\*\*([^*]+)\*\*/g, '$1'); // 粗体
  text = text.replace(/\*([^*]+)\*/g, '$1'); // 斜体
  text = text.replace(/`([^`]+)`/g, '$1'); // 行内代码
  text = text.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1'); // 链接
  text = text.replace(/!\[([^\]]*)\]\([^)]+\)/g, ''); // 图片
  // 截断长文本
  if (text.length > 100) {
    text = text.substring(0, 100) + '...';
  }
  return text.trim();
};

const pagination = reactive({
  current: 1,
  size: 10,
  total: 0
});

const questionForm = reactive({
  paperId: null,
  itemKey: null,
  sortNum: 1,
  actualScore: 10.0
});

const questionRules = {
  paperId: [
    { required: true, message: '请选择所属试卷', trigger: 'change' }
  ],
  itemKey: [
    { required: true, message: '请选择题目', trigger: 'change' }
  ],
  sortNum: [
    { required: true, message: '请输入排序', trigger: 'blur' }
  ],
  actualScore: [
    { required: true, message: '请输入分值', trigger: 'blur' }
  ]
};

// 获取试卷选项
const fetchPaperOptions = async () => {
  try {
    // 从localStorage获取user_key作为创建者标识
    const userKey = localStorage.getItem('user_key');
    
    const response = await getExamPaperList({
      pageIndex: 1,
      pageSize: 1000,
      creatorKey: userKey || '' // 只查询当前教师创建的试卷
    });
    
    if (response.success && response.data) {
      paperOptions.value = response.data.records || [];
    }
  } catch (error) {
    console.error('获取试卷列表失败:', error);
    ElMessage.error('获取试卷列表失败');
  }
};

// 获取题目选项
const fetchItemOptions = async (keyword = '') => {
  itemLoading.value = true;
  try {
    const params = {
      pageIndex: 1,
      pageSize: 100,
      status: 'ENABLED' // 只获取已启用的题目
    };
    
    // 如果有搜索关键词，使用content参数进行题目内容模糊搜索
    if (keyword) {
      params.content = keyword; // 题目内容模糊搜索
    }
    
    const response = await getItemList(params);
    
    if (response.success && response.data) {
      itemOptions.value = response.data.records || [];
    } else {
      ElMessage.error(response.message || '获取题目列表失败');
      itemOptions.value = [];
    }
  } catch (error) {
    console.error('获取题目列表失败:', error);
    ElMessage.error('获取题目列表失败');
    itemOptions.value = [];
  } finally {
    itemLoading.value = false;
  }
};

// 远程搜索题目
const remoteSearchItems = (query) => {
  itemSearchKeyword.value = query;
  if (query) {
    fetchItemOptions(query);
  } else {
    fetchItemOptions();
  }
};

// 题目选择框获得焦点时加载数据
const handleItemSelectFocus = () => {
  if (itemOptions.value.length === 0) {
    fetchItemOptions();
  }
};

// 获取题目列表
const fetchQuestionList = async () => {
  // 如果还没有选择试卷，则不展示任何题目
  if (!selectedPaperId.value) {
    questionList.value = [];
    pagination.total = 0;
    return;
  }

  loading.value = true;
  try {
    // 从localStorage获取user_key作为创建者标识
    const userKey = localStorage.getItem('user_key');
    
    const response = await getExamPaperQuestionList({
      pageIndex: pagination.current,
      pageSize: pagination.size,
      paperId: selectedPaperId.value, // 要求必须选择试卷
      itemKey: searchKeyword.value || undefined,
      creatorKey: userKey || '' // 只查询当前教师创建的试卷的题目
    });
    
    if (response.success) {
      questionList.value = (response.data.records || []).map(item => ({
        ...item,
        paperTitle: paperOptions.value.find(p => p.id === item.paperId)?.paperName || '未知试卷'
      }));
      pagination.total = response.data.total || 0;
    } else {
      ElMessage.error(response.message || '获取题目列表失败');
    }
  } catch (error) {
    console.error('获取题目列表失败:', error);
    ElMessage.error('获取题目列表失败');
  } finally {
    loading.value = false;
  }
};

// 试卷选择改变
const handlePaperChange = () => {
  pagination.current = 1;
  fetchQuestionList();
};

// 搜索
const handleSearch = () => {
  pagination.current = 1;
  fetchQuestionList();
};

// 分页大小改变
const handleSizeChange = (size) => {
  pagination.size = size;
  pagination.current = 1;
  fetchQuestionList();
};

// 当前页改变
const handleCurrentChange = (page) => {
  pagination.current = page;
  fetchQuestionList();
};

// 添加题目
const handleAddQuestion = () => {
  isEdit.value = false;
  currentQuestionId.value = null;
  dialogTitle.value = '添加题目';
  resetForm();
  // 如果题目列表为空，先加载
  if (itemOptions.value.length === 0) {
    fetchItemOptions();
  }
  dialogVisible.value = true;
};

// 查看题目
const handleView = async (row) => {
  try {
    const response = await getExamPaperQuestionDetail(row.id);

    if (response.success && response.data) {
      const data = response.data;
      const paperTitle =
        paperOptions.value.find((p) => p.id === data.paperId)?.paperName ||
        row.paperTitle ||
        '未知试卷';

      Object.assign(viewQuestion, {
        paperTitle,
        paperId: data.paperId,
        itemKey: data.itemKey,
        sortNum: data.sortNum,
        actualScore: data.actualScore,
        formKey: '',
        difficulty: null,
        content: '',
        options: '',
        answer: '',
        solution: ''
      });

      // 根据 itemKey 查询习题详情（题干、选项、答案等）
      if (data.itemKey) {
        try {
          const itemResp = await getItemList({
            pageIndex: 1,
            pageSize: 1,
            itemKey: data.itemKey
          });

          if (itemResp.success && itemResp.data && itemResp.data.records && itemResp.data.records.length > 0) {
            const item = itemResp.data.records[0];
            Object.assign(viewQuestion, {
              formKey: item.formKey || '',
              difficulty: item.difficulty ?? null,
              content: formatRichText(item.content || ''),
              options: formatRichText(item.options || ''),
              answer: formatRichText(item.answer || ''),
              solution: formatRichText(item.solution || '')
            });
          }
        } catch (e) {
          console.error('获取习题详情失败:', e);
        }
      }

      viewDialogVisible.value = true;
    } else {
      ElMessage.error(response.message || '获取题目详情失败');
    }
  } catch (error) {
    console.error('获取题目详情失败:', error);
    ElMessage.error('获取题目详情失败');
  }
};

// 编辑题目
const handleEdit = async (row) => {
  isEdit.value = true;
  currentQuestionId.value = row.id;
  dialogTitle.value = '编辑题目';
  
  try {
    const response = await getExamPaperQuestionDetail(row.id);
    
    if (response.success && response.data) {
      const itemKey = response.data.itemKey;
      
      Object.assign(questionForm, {
        paperId: response.data.paperId,
        itemKey: itemKey,
        sortNum: response.data.sortNum || 1,
        actualScore: response.data.actualScore || 10.0
      });
      
      // 如果题目列表中不包含当前题目，需要先加载题目列表
      if (itemKey && !itemOptions.value.find(item => item.itemKey === itemKey)) {
        await fetchItemOptions();
      }
      
      dialogVisible.value = true;
    } else {
      ElMessage.error(response.message || '获取题目详情失败');
    }
  } catch (error) {
    console.error('获取题目详情失败:', error);
    ElMessage.error('获取题目详情失败');
  }
};

// 删除题目
const handleDelete = (row) => {
  ElMessageBox.confirm(
    '确定要删除该题目吗？',
    '提示',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(async () => {
    try {
      const response = await deleteExamPaperQuestion(row.id);
      
      if (response.success) {
        ElMessage.success('删除成功');
        fetchQuestionList();
      } else {
        ElMessage.error(response.message || '删除失败');
      }
    } catch (error) {
      console.error('删除题目失败:', error);
      ElMessage.error('删除题目失败');
    }
  }).catch(() => {});
};

// 提交表单
const handleSubmit = async () => {
  if (!questionFormRef.value) return;
  
  await questionFormRef.value.validate(async (valid) => {
    if (valid) {
      try {
        const data = isEdit.value
          ? { id: currentQuestionId.value, ...questionForm }
          : questionForm;
        
        const response = isEdit.value
          ? await updateExamPaperQuestion(data)
          : await addExamPaperQuestion(data);
        
        if (response.success) {
          ElMessage.success(isEdit.value ? '更新成功' : '添加成功');
          dialogVisible.value = false;
          fetchQuestionList();
        } else {
          ElMessage.error(response.message || (isEdit.value ? '更新失败' : '添加失败'));
        }
      } catch (error) {
        console.error('操作失败:', error);
        ElMessage.error(isEdit.value ? '更新失败' : '添加失败');
      }
    }
  });
};

// 重置表单
const resetForm = () => {
  Object.assign(questionForm, {
    paperId: selectedPaperId.value || null,
    itemKey: null,
    sortNum: 1,
    actualScore: 10.0
  });
  if (questionFormRef.value) {
    questionFormRef.value.clearValidate();
  }
};

// 对话框关闭
const handleDialogClose = () => {
  resetForm();
};

onMounted(async () => {
  await fetchPaperOptions();
});
</script>

<style scoped>
.question-management {
  width: 100%;
}

.toolbar {
  display: flex;
  align-items: center;
  margin-bottom: 16px;
}

.question-content-preview {
  color: #333;
  line-height: 1.5;
  word-break: break-word;
}

.text-muted {
  color: #909399;
  font-size: 12px;
}
</style>

