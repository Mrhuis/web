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
          v-model="itemKey"
          placeholder="习题标识"
          clearable
          class="filter-input"
        />
        <el-input
          v-model="contentKeyword"
          placeholder="题干关键字"
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
          新增习题
        </el-button>
      </div>
    </div>

    <el-table :data="itemList" border v-loading="loading">
      <el-table-column label="习题标识" width="180">
        <template #default="scope">
          {{ scope.row.itemKey || scope.row.item_key || '-' }}
        </template>
      </el-table-column>
      <el-table-column label="题干" min-width="260">
        <template #default="scope">
          <div class="text-ellipsis">{{ scope.row.content }}</div>
        </template>
      </el-table-column>
      <el-table-column label="答案" min-width="200">
        <template #default="scope">
          <div class="text-ellipsis">{{ scope.row.answer }}</div>
        </template>
      </el-table-column>
      <el-table-column label="上传者" width="160">
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

    <el-dialog v-model="showDialog" title="新增习题" width="700px" :close-on-click-modal="false" append-to-body>
      <el-form ref="formRef" :model="form" :rules="rules" label-width="110px">
        <el-form-item label="习题标识" prop="itemKey">
          <el-input v-model="form.itemKey" placeholder="请输入唯一标识" />
        </el-form-item>
        <el-form-item label="习题类型" prop="formKey">
          <el-select v-model="form.formKey" placeholder="请选择习题类型" style="width: 100%">
            <el-option
              v-for="item in itemTypeOptions"
              :key="item.formKey"
              :label="`${item.formName} (${item.formKey})`"
              :value="item.formKey"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="难度" prop="difficulty">
          <el-select v-model="form.difficulty" placeholder="请选择难度" style="width: 100%">
            <el-option label="1 - 简单" :value="1" />
            <el-option label="2 - 较易" :value="2" />
            <el-option label="3 - 中等" :value="3" />
            <el-option label="4 - 较难" :value="4" />
            <el-option label="5 - 困难" :value="5" />
          </el-select>
        </el-form-item>
        <el-form-item label="题干内容" prop="content">
          <RichTextEditor
            :value="form.content"
            @input="(value) => { if (typeof value === 'string') form.content = value }"
            @change="(value) => { if (typeof value === 'string') form.content = value }"
            field-name="题干"
            :height="'150px'"
            placeholder="请输入题干内容，支持粘贴图片..."
          />
        </el-form-item>
        <el-form-item label="参考答案" prop="answer">
          <RichTextEditor
            :value="form.answer"
            @input="(value) => { if (typeof value === 'string') form.answer = value }"
            @change="(value) => { if (typeof value === 'string') form.answer = value }"
            field-name="答案"
            :height="'120px'"
            placeholder="请输入参考答案，支持粘贴图片..."
          />
        </el-form-item>
        <el-form-item label="解析">
          <RichTextEditor
            :value="form.analysis"
            @input="(value) => { if (typeof value === 'string') form.analysis = value }"
            @change="(value) => { if (typeof value === 'string') form.analysis = value }"
            field-name="解析"
            :height="'120px'"
            placeholder="请输入详细解析，支持粘贴图片..."
          />
        </el-form-item>
        <el-form-item label="章节关联">
          <el-select
            v-model="form.chapterKey"
            multiple
            filterable
            clearable
            class="full-width"
            placeholder="可选填"
            @visible-change="onOptionVisible('chapter', $event)"
          >
            <el-option
              v-for="item in chapterOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="知识点关联">
          <el-select
            v-model="form.knowledgeKey"
            multiple
            filterable
            clearable
            class="full-width"
            placeholder="可选填"
            @visible-change="onOptionVisible('knowledge', $event)"
          >
            <el-option
              v-for="item in knowledgeOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="标签关联">
          <el-select
            v-model="form.tagId"
            multiple
            filterable
            clearable
            class="full-width"
            placeholder="可选填"
            @visible-change="onOptionVisible('tag', $event)"
          >
            <el-option
              v-for="item in tagOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="closeDialog">取 消</el-button>
        <el-button type="primary" @click="submitForm">确 定</el-button>
      </template>
    </el-dialog>

    <el-dialog
      v-model="showDetailDialog"
      title="习题详情"
      width="720px"
      :close-on-click-modal="false"
      append-to-body
    >
      <el-descriptions
        v-if="detailRecord"
        :column="2"
        border
        class="detail-descriptions"
      >
        <el-descriptions-item label="习题标识">
          {{ detailRecord.itemKey || detailRecord.item_key || '-' }}
        </el-descriptions-item>
        <el-descriptions-item label="状态">
          {{ getStatusText(detailRecord.status) }}
        </el-descriptions-item>
        <el-descriptions-item label="题干" :span="2">
          {{ detailRecord.content || '-' }}
        </el-descriptions-item>
        <el-descriptions-item label="答案" :span="2">
          {{ detailRecord.answer || '-' }}
        </el-descriptions-item>
        <el-descriptions-item label="解析" :span="2">
          {{ detailRecord.analysis || detailRecord.solution || '-' }}
        </el-descriptions-item>
        <el-descriptions-item label="章节关联" :span="2">
          <template v-if="getChapterNames(detailRecord)">
            <span>{{ getChapterNames(detailRecord) }}</span>
          </template>
          <span v-else>-</span>
        </el-descriptions-item>
        <el-descriptions-item label="知识点关联" :span="2">
          <template v-if="getKnowledgeNames(detailRecord)">
            <span>{{ getKnowledgeNames(detailRecord) }}</span>
          </template>
          <span v-else>-</span>
        </el-descriptions-item>
        <el-descriptions-item label="标签关联" :span="2">
          <template v-if="getTagNames(detailRecord)">
            <span>{{ getTagNames(detailRecord) }}</span>
          </template>
          <span v-else>-</span>
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
import RichTextEditor from './item_components/RichTextEditor.vue';
import {
  getTeacherItemList,
  createTeacherItem,
  deleteTeacherItem,
  getTeacherChapterList,
  getTeacherKnowledgeList,
  getTeacherTagList,
  getTeacherResourceFormList
} from '@/api/teacher/teacher_resource_manage_api';

const itemList = ref([]);
const loading = ref(false);
const searchValue = ref('');
const itemKey = ref('');
const contentKeyword = ref('');

const currentPage = ref(1);
const pageSize = ref(10);
const totalCount = ref(0);

const showDialog = ref(false);
const showDetailDialog = ref(false);
const formRef = ref(null);
const form = ref({
  itemKey: '',
  formKey: '',
  difficulty: 1,
  content: '',
  answer: '',
  analysis: '',
  chapterKey: [],
  knowledgeKey: [],
  tagId: []
});

const chapterOptions = ref([]);
const knowledgeOptions = ref([]);
const tagOptions = ref([]);
const itemTypeOptions = ref([]);

const optionLoading = ref({
  chapter: false,
  knowledge: false,
  tag: false
});

const detailRecord = ref(null);

const currentUserKey = computed(() => {
  return (
    (typeof window !== 'undefined' && window.localStorage && localStorage.getItem('user_key')) ||
    ''
  );
});

const rules = {
  itemKey: [{ required: true, message: '请输入习题标识', trigger: 'blur' }],
  formKey: [{ required: true, message: '请选择习题类型', trigger: 'change' }],
  content: [{ required: true, message: '请输入题干内容', trigger: 'blur' }],
  answer: [{ required: true, message: '请输入参考答案', trigger: 'blur' }]
};

const fetchItems = async () => {
  try {
    loading.value = true;
    const params = {
      page_index: currentPage.value,
      page_size: pageSize.value,
      search_value: searchValue.value,
      itemKey: itemKey.value,
      content: contentKeyword.value
    };
    const res = await getTeacherItemList(params);
    if (res.success) {
      const result = res.data || {};
      itemList.value = result.records || [];
      totalCount.value = result.total || 0;
    }
  } catch (error) {
    console.error(error);
    ElMessage.error('获取习题失败');
  } finally {
    loading.value = false;
  }
};

const loadOption = async (type) => {
  if (optionLoading.value[type]) return;
  optionLoading.value[type] = true;
  try {
    if (type === 'chapter') {
      const res = await getTeacherChapterList({ page_index: 1, page_size: 500 });
      if (res.success) {
        const records = res.data?.records || [];
        chapterOptions.value = records.map((item) => ({
          label: `${item.name || '-'} (${item.chapterKey || item.chapter_key || '-'})`,
          value: item.chapterKey || item.chapter_key || item.key
        }));
      }
    } else if (type === 'knowledge') {
      const res = await getTeacherKnowledgeList({ page_index: 1, page_size: 500 });
      if (res.success) {
        const records = res.data?.records || [];
        knowledgeOptions.value = records.map((item) => ({
          label: `${item.name || '-'} (${item.knowledgeKey || item.knowledge_key || item.key || '-'})`,
          value: item.knowledgeKey || item.knowledge_key || item.key
        }));
      }
    } else if (type === 'tag') {
      const res = await getTeacherTagList({ page_index: 1, page_size: 500 });
      if (res.success) {
        const records = res.data?.records || [];
        tagOptions.value = records.map((tag) => ({
          label: `${tag.tagContent || '-'} (${tag.id || '-'})`,
          value: tag.id
        }));
      }
    }
  } catch (error) {
    console.error(error);
  } finally {
    optionLoading.value[type] = false;
  }
};

const onOptionVisible = (type, visible) => {
  if (visible) {
    loadOption(type);
  }
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
  fetchItems();
};

const handleCurrentChange = (val) => {
  currentPage.value = val;
  fetchItems();
};

const resetFilters = () => {
  searchValue.value = '';
  itemKey.value = '';
  contentKeyword.value = '';
  fetchItems();
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
    itemKey: '',
    formKey: '',
    difficulty: 1,
    content: '',
    answer: '',
    analysis: '',
    chapterKey: [],
    knowledgeKey: [],
    tagId: []
  };
  formRef.value?.clearValidate();
};

const openDetailDialog = (row) => {
  detailRecord.value = { ...row };
  console.log('详情数据:', detailRecord.value);
  console.log('章节关联:', detailRecord.value.chapterKeyName || detailRecord.value.chapter_key_name);
  console.log('知识点关联:', detailRecord.value.knowledgeKeyName || detailRecord.value.knowledge_key_name);
  console.log('标签关联:', detailRecord.value.tagIdName || detailRecord.value.tag_id_name);
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
      
      // 准备提交数据，确保字段名正确
      const submitData = {
        itemKey: form.value.itemKey,
        formKey: form.value.formKey,
        difficulty: form.value.difficulty || 1,
        content: form.value.content,
        answer: form.value.answer,
        solution: form.value.analysis || '', // 前端用analysis，后端用solution
        chapterKey: form.value.chapterKey || [],
        knowledgeKey: form.value.knowledgeKey || [],
        tagId: (form.value.tagId || []).map(id => typeof id === 'string' ? parseInt(id) : id),
        uploadedBy
      };
      
      await createTeacherItem(submitData);
      ElMessage.success('创建成功');
      closeDialog();
      fetchItems();
    } catch (error) {
      console.error('创建习题时发生错误:', error);
      ElMessage.error('创建失败');
    }
  });
};

const handleDelete = async (row) => {
  try {
    await ElMessageBox.confirm('确定删除该习题吗？', '提示', { type: 'warning' });
    await deleteTeacherItem(row.id);
    ElMessage.success('删除成功');
    fetchItems();
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

// 获取章节名称字符串
const getChapterNames = (record) => {
  if (!record) return '';
  const chapterKeyName = record.chapterKeyName || record.chapter_key_name;
  if (chapterKeyName && typeof chapterKeyName === 'object' && !Array.isArray(chapterKeyName) && chapterKeyName !== null) {
    const values = Object.values(chapterKeyName);
    return values.length > 0 ? values.join('，') : '';
  }
  const chapterKey = record.chapterKey || record.chapter_key;
  if (chapterKey) {
    if (Array.isArray(chapterKey) && chapterKey.length > 0) {
      return chapterKey.join('，');
    }
    if (typeof chapterKey === 'string') {
      return chapterKey;
    }
  }
  return '';
};

// 获取知识点名称字符串
const getKnowledgeNames = (record) => {
  if (!record) return '';
  const knowledgeKeyName = record.knowledgeKeyName || record.knowledge_key_name;
  if (knowledgeKeyName && typeof knowledgeKeyName === 'object' && !Array.isArray(knowledgeKeyName) && knowledgeKeyName !== null) {
    const values = Object.values(knowledgeKeyName);
    return values.length > 0 ? values.join('，') : '';
  }
  const knowledgeKey = record.knowledgeKey || record.knowledge_key;
  if (knowledgeKey) {
    if (Array.isArray(knowledgeKey) && knowledgeKey.length > 0) {
      return knowledgeKey.join('，');
    }
    if (typeof knowledgeKey === 'string') {
      return knowledgeKey;
    }
  }
  return '';
};

// 获取标签名称字符串
const getTagNames = (record) => {
  if (!record) return '';
  const tagIdName = record.tagIdName || record.tag_id_name;
  if (tagIdName && typeof tagIdName === 'object' && !Array.isArray(tagIdName) && tagIdName !== null) {
    const values = Object.values(tagIdName);
    return values.length > 0 ? values.join('，') : '';
  }
  const tagId = record.tagId || record.tag_id;
  if (tagId) {
    if (Array.isArray(tagId) && tagId.length > 0) {
      return tagId.join('，');
    }
    if (typeof tagId === 'string' || typeof tagId === 'number') {
      return String(tagId);
    }
  }
  return '';
};

watch([searchValue, itemKey, contentKeyword], () => {
  currentPage.value = 1;
  fetchItems();
});

// 获取习题类型列表
const fetchItemTypes = async () => {
  try {
    const res = await getTeacherResourceFormList({ 
      page_index: 1, 
      page_size: 1000, 
      formType: "item" 
    });
    if (res.success) {
      const records = res.data?.records || [];
      itemTypeOptions.value = records;
    }
  } catch (error) {
    console.error('获取习题类型列表失败:', error);
  }
};

onMounted(() => {
  fetchItems();
  fetchItemTypes();
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

.text-ellipsis {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.full-width {
  width: 100%;
}
</style>

