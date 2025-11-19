<template>
  <div class="panel">
    <div class="header-section">
      <div class="filters">
        <el-input
          v-model="mediaKey"
          placeholder="媒体标识"
          clearable
          class="filter-input"
        />
        <el-input
          v-model="fileName"
          placeholder="文件名"
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
          上传视频
        </el-button>
      </div>
    </div>

    <el-table :data="mediaList" border v-loading="loading">
      <el-table-column label="媒体标识" width="200">
        <template #default="scope">
          {{ scope.row.mediaKey || scope.row.media_key || '-' }}
        </template>
      </el-table-column>
      <el-table-column prop="file_name" label="文件名" min-width="220" />
      <el-table-column prop="uploaded_by" label="上传者" width="160" />
      <el-table-column label="状态" width="120">
        <template #default="scope">
          <el-tag :type="getStatusType(scope.row.status)">
            {{ getStatusText(scope.row.status) }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="created_at" label="创建时间" width="180" />
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
      title="上传视频"
      width="560px"
      :close-on-click-modal="false"
      append-to-body
    >
      <el-form ref="formRef" :model="form" :rules="rules" label-width="100px">
        <el-form-item label="媒体标识" prop="mediaKey">
          <el-input v-model="form.mediaKey" placeholder="请输入唯一标识" />
        </el-form-item>
        <el-form-item label="文件名称" prop="fileName">
          <el-input v-model="form.fileName" placeholder="请输入文件名" />
        </el-form-item>
        <el-form-item label="视频文件" prop="videoFile">
          <el-upload
            class="upload-block"
            drag
            :auto-upload="false"
            :limit="1"
            accept="video/*"
            :on-change="handleFileChange"
            :on-remove="handleFileRemove"
            :file-list="fileList"
          >
            <el-icon class="el-icon--upload"><UploadFilled /></el-icon>
            <div class="el-upload__text">
              将文件拖到此处，或 <em>点击上传</em>
            </div>
            <template #tip>
              <div class="el-upload__tip">仅支持常见视频格式，大小请控制在合理范围内</div>
            </template>
          </el-upload>
        </el-form-item>
        <el-form-item label="关联章节">
          <el-select 
            v-model="form.chapterKey" 
            multiple 
            filterable 
            placeholder="选择关联章节（可选）" 
            style="width: 100%"
          >
            <el-option
              v-for="chapter in availableChapters"
              :key="chapter.chapterKey || chapter.chapter_key"
              :label="`${chapter.name || '-'} (${chapter.chapterKey || chapter.chapter_key || '-'})`"
              :value="chapter.chapterKey || chapter.chapter_key"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="关联知识点">
          <el-select 
            v-model="form.knowledgeKey" 
            multiple 
            filterable 
            placeholder="选择关联知识点（可选）" 
            style="width: 100%"
          >
            <el-option
              v-for="knowledge in availableKnowledge"
              :key="knowledge.knowledge_key || knowledge.knowledgeKey"
              :label="`${knowledge.name || '-'} (${knowledge.knowledge_key || knowledge.knowledgeKey || '-'})`"
              :value="knowledge.knowledge_key || knowledge.knowledgeKey"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="关联标签">
          <el-select 
            v-model="form.tagId" 
            multiple 
            filterable 
            placeholder="选择关联标签（可选）" 
            style="width: 100%"
          >
            <el-option
              v-for="tag in availableTags"
              :key="tag.id"
              :label="`${tag.tagContent || '-'} (${tag.id || '-'})`"
              :value="tag.id"
            />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="closeDialog">取 消</el-button>
        <el-button type="primary" @click="submitForm">上 传</el-button>
      </template>
    </el-dialog>

    <el-dialog
      v-model="showDetailDialog"
      title="视频详情"
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
        <el-descriptions-item label="媒体标识">
          {{ detailRecord.mediaKey || detailRecord.media_key || '-' }}
        </el-descriptions-item>
        <el-descriptions-item label="状态">
          {{ getStatusText(detailRecord.status) }}
        </el-descriptions-item>
        <el-descriptions-item label="文件名" :span="2">
          {{ detailRecord.file_name || detailRecord.fileName || '-' }}
        </el-descriptions-item>
        <el-descriptions-item label="上传者">
          {{ detailRecord.uploaded_by || detailRecord.uploadedBy || '-' }}
        </el-descriptions-item>
        <el-descriptions-item label="创建时间">
          {{ detailRecord.created_at || detailRecord.createdAt || '-' }}
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
      </el-descriptions>
      <template #footer>
        <el-button @click="showDetailDialog = false">关 闭</el-button>
        <el-button 
          v-if="detailRecord && (detailRecord.url || detailRecord.URL)"
          type="primary" 
          @click="previewVideo(detailRecord)"
        >
          预览视频
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted, watch, computed } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Refresh, UploadFilled } from '@element-plus/icons-vue';
import {
  getTeacherMediaList,
  createTeacherMedia,
  deleteTeacherMedia,
  getTeacherChapterList,
  getTeacherKnowledgeList,
  getTeacherTagList
} from '@/api/teacher/teacher_resource_manage_api';

const mediaList = ref([]);
const loading = ref(false);
const mediaKey = ref('');
const fileName = ref('');

const currentPage = ref(1);
const pageSize = ref(10);
const totalCount = ref(0);

const showDialog = ref(false);
const showDetailDialog = ref(false);
const formRef = ref(null);
const form = ref({
  mediaKey: '',
  fileName: '',
  videoFile: null,
  chapterKey: [],
  knowledgeKey: [],
  tagId: []
});
const fileList = ref([]);

const detailRecord = ref(null);

// 关联数据选项
const availableChapters = ref([]);
const availableKnowledge = ref([]);
const availableTags = ref([]);

const rules = {
  mediaKey: [{ required: true, message: '请输入媒体标识', trigger: 'blur' }],
  fileName: [{ required: true, message: '请输入文件名', trigger: 'blur' }],
  videoFile: [{ required: true, message: '请上传视频文件', trigger: 'change' }]
};

const currentUserKey = computed(() => {
  return (
    (typeof window !== 'undefined' && window.localStorage && localStorage.getItem('user_key')) ||
    ''
  );
});

const fetchMedia = async () => {
  try {
    loading.value = true;
    const params = {
      page_index: currentPage.value,
      page_size: pageSize.value,
      mediaKey: mediaKey.value,
      fileName: fileName.value
    };
    const res = await getTeacherMediaList(params);
    if (res.success) {
      const result = res.data || {};
      mediaList.value = result.records || [];
      totalCount.value = result.total || 0;
    }
  } catch (error) {
    console.error(error);
    ElMessage.error('获取视频列表失败');
  } finally {
    loading.value = false;
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
  fetchMedia();
};

const handleCurrentChange = (val) => {
  currentPage.value = val;
  fetchMedia();
};

const resetFilters = () => {
  mediaKey.value = '';
  fileName.value = '';
  fetchMedia();
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
    mediaKey: '',
    fileName: '',
    videoFile: null,
    chapterKey: [],
    knowledgeKey: [],
    tagId: []
  };
  fileList.value = [];
  formRef.value?.clearValidate();
};

const openDetailDialog = (row) => {
  detailRecord.value = { ...row };
  // 添加调试信息，查看从后端返回的数据结构
  console.log('查看视频详情 - 原始数据:', JSON.stringify(row, null, 2));
  console.log('章节数据:', row.chapter_key_name, '类型:', typeof row.chapter_key_name);
  console.log('知识点数据:', row.knowledge_key_name, '类型:', typeof row.knowledge_key_name);
  console.log('标签数据:', row.tag_id_name, '类型:', typeof row.tag_id_name);
  showDetailDialog.value = true;
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

const handleFileChange = (file) => {
  form.value.videoFile = file.raw;
  fileList.value = [file];
  formRef.value?.validateField('videoFile');
};

const handleFileRemove = () => {
  form.value.videoFile = null;
  fileList.value = [];
};

const submitForm = () => {
  formRef.value.validate(async (valid) => {
    if (!valid) return;
    try {
      const uploadedBy = (typeof window !== 'undefined' && window.localStorage)
        ? (localStorage.getItem('user_key') || '')
        : '';
      await createTeacherMedia({
        ...form.value,
        uploadedBy
      });
      ElMessage.success('上传成功');
      closeDialog();
      fetchMedia();
    } catch (error) {
      console.error(error);
      ElMessage.error('上传失败');
    }
  });
};

// 获取关联数据选项
const fetchRelatedData = async () => {
  try {
    // 获取章节列表
    const chapterRes = await getTeacherChapterList({ page_index: 1, page_size: 500 });
    if (chapterRes.success) {
      availableChapters.value = chapterRes.data?.records || [];
    }
    
    // 获取知识点列表
    const knowledgeRes = await getTeacherKnowledgeList({ page_index: 1, page_size: 500 });
    if (knowledgeRes.success) {
      availableKnowledge.value = knowledgeRes.data?.records || [];
    }
    
    // 获取标签列表
    const tagRes = await getTeacherTagList({ page_index: 1, page_size: 500 });
    if (tagRes.success) {
      availableTags.value = tagRes.data?.records || [];
    }
  } catch (error) {
    console.error('获取关联数据失败:', error);
  }
};

const handleDelete = async (row) => {
  try {
    await ElMessageBox.confirm('确定删除该视频吗？', '提示', { type: 'warning' });
    await deleteTeacherMedia(row.id);
    ElMessage.success('删除成功');
    fetchMedia();
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

// 预览视频
const previewVideo = (row) => {
  if (row.url || row.URL) {
    // 构建正确的访问URL
    let previewUrl = row.url || row.URL;
    if (!previewUrl.startsWith('http')) {
      // 数据库中存储的是相对路径，如 ./media/xxx.mp4 或 /media/xxx.mp4
      // 通过Vite代理访问后端静态资源
      let cleanUrl = previewUrl;
      // 移除开头的 ./ 如果存在
      if (cleanUrl.startsWith('./')) {
        cleanUrl = cleanUrl.substring(1);
      }
      // 确保以 / 开头
      if (!cleanUrl.startsWith('/')) {
        cleanUrl = '/' + cleanUrl;
      }
      previewUrl = cleanUrl; // 使用Vite代理，不需要完整的URL
    }
    window.open(previewUrl, '_blank');
  } else {
    ElMessage.warning('视频链接不存在');
  }
};

watch([mediaKey, fileName], () => {
  currentPage.value = 1;
  fetchMedia();
});

onMounted(() => {
  fetchMedia();
  fetchRelatedData();
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
  width: 220px;
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

.upload-block {
  width: 100%;
}

.detail-descriptions {
  margin-bottom: 12px;
}
</style>

