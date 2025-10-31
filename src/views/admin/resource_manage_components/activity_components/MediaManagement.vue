<template>
  <div class="media-management">
    <div class="header-section">
      <div class="header-left">
        <el-input 
          v-model="videoSearchKeyword" 
          placeholder="搜索视频" 
          clearable 
          style="width: 200px; margin-right: 16px;" 
        />
        <el-select v-model="videoStatusSearch" placeholder="状态" clearable style="width: 120px; margin-right: 16px;">
          <el-option label="待审核" value="PENDING"></el-option>
          <el-option label="启用" value="ENABLED"></el-option>
          <el-option label="禁用" value="DISABLED"></el-option>
          <el-option label="已拒绝" value="REJECTED"></el-option>
        </el-select>
        <el-select 
          v-model="videoChapterSearch" 
          placeholder="章节筛选" 
          clearable 
          multiple
          filterable
          style="width: 200px; margin-right: 16px;"
        >
          <el-option
            v-for="chapter in availableChapters"
            :key="chapter.chapterKey"
            :label="`${chapter.name} (${chapter.chapterKey})`"
            :value="chapter.chapterKey"
          />
        </el-select>
        <el-select 
          v-model="videoKnowledgeSearch" 
          placeholder="知识点筛选" 
          clearable 
          multiple
          filterable
          style="width: 200px; margin-right: 16px;"
        >
          <el-option
            v-for="knowledge in availableKnowledge"
            :key="knowledge.knowledge_key"
            :label="`${knowledge.name} (${knowledge.knowledge_key})`"
            :value="knowledge.knowledge_key"
          />
        </el-select>
        <el-select 
          v-model="videoTagSearch" 
          placeholder="标签筛选" 
          clearable 
          multiple
          filterable
          style="width: 200px; margin-right: 16px;"
        >
          <el-option
            v-for="tag in availableTags"
            :key="tag.id"
            :label="`${tag.tagContent} (${tag.id})`"
            :value="tag.id"
          />
        </el-select>
      </div>
      <div class="header-right">
        <el-button @click="refreshVideos" style="margin-right: 16px;">
          <el-icon><Refresh /></el-icon>
          刷新
        </el-button>
        <el-button type="primary" @click="openCreateVideoDialog">
          新增视频
        </el-button>
      </div>
    </div>

    <el-table :data="videoList" style="width: 100%" border>
      <!-- 基本字段 -->
      <el-table-column prop="media_key" label="视频标识" width="150"></el-table-column>
      <el-table-column prop="plugin_key" label="插件标识" width="120"></el-table-column>
      <el-table-column prop="formKey" label="资源类型" width="100">
        <template #default="scope">
          <el-tag type="info">{{ scope.row.form_key }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="file_name" label="文件名" width="200"></el-table-column>
      <el-table-column prop="duration" label="时长" width="100">
        <template #default="scope">
          {{ formatDuration(scope.row.duration) }}
        </template>
      </el-table-column>
      <el-table-column prop="url" label="链接" min-width="200" show-overflow-tooltip></el-table-column>
      <!-- <el-table-column prop="entry_point" label="入口点" width="120" show-overflow-tooltip></el-table-column> -->
      <el-table-column prop="uploaded_by" label="上传者" width="120"></el-table-column>
      <el-table-column prop="created_at" label="创建时间" width="180">
        <template #default="scope">
          {{ formatDateTime(scope.row.created_at) }}
        </template>
      </el-table-column>
      
      <!-- 关联信息字段 - 修改为支持自动换行 -->
      <el-table-column label="章节" min-width="200">
        <template #default="scope">
          <div v-if="scope.row.chapter_key_name" class="tag-container">
            <el-tag 
              v-for="(name, key) in scope.row.chapter_key_name" 
              :key="key" 
              size="small" 
              type="primary"
              class="tag-item"
            >
              {{ name }}
            </el-tag>
          </div>
        </template>
      </el-table-column>
      
      <el-table-column label="知识点" min-width="200">
        <template #default="scope">
          <div v-if="scope.row.knowledge_key_name" class="tag-container">
            <el-tag 
              v-for="(name, key) in scope.row.knowledge_key_name" 
              :key="key" 
              size="small" 
              type="success"
              class="tag-item"
            >
              {{ name }}
            </el-tag>
          </div>
        </template>
      </el-table-column>
      
      <el-table-column label="标签" min-width="200">
        <template #default="scope">
          <div v-if="scope.row.tag_id_name" class="tag-container">
            <el-tag 
              v-for="(name, id) in scope.row.tag_id_name" 
              :key="id" 
              size="small" 
              type="warning"
              class="tag-item"
            >
              {{ name }}
            </el-tag>
          </div>
        </template>
      </el-table-column>
      
      <el-table-column prop="status" label="状态" width="120">
        <template #default="scope">
          <el-tag :type="
            scope.row.status === 'ENABLED' ? 'success' :
            scope.row.status === 'PENDING' ? 'warning' :
            scope.row.status === 'DISABLED' ? 'info' : 'danger'
          ">
            {{
              scope.row.status === 'ENABLED' ? '启用' :
              scope.row.status === 'PENDING' ? '待审核' :
              scope.row.status === 'DISABLED' ? '禁用' : '已拒绝'
            }}
          </el-tag>
        </template>
      </el-table-column>
      
      <!-- 操作列保持不变 -->
      <el-table-column label="操作" width="200">
        <template #default="scope">
          <!-- 待审核状态：通过、拒绝 -->
          <template v-if="scope.row.status === 'PENDING'">
            <el-button type="success" size="small" @click="approveVideo(scope.row)" style="margin-right: 8px;">
              通过
            </el-button>
            <el-button type="danger" size="small" @click="rejectVideo(scope.row)">
              拒绝
            </el-button>
          </template>
          
          <!-- 启用状态：编辑、禁用、预览 -->
          <template v-else-if="scope.row.status === 'ENABLED'">
            <el-button type="primary" size="small" @click="editVideo(scope.row)" style="margin-right: 8px;">
              编辑
            </el-button>
            <el-button type="success" size="small" @click="previewVideo(scope.row)" style="margin-right: 8px;">
              预览
            </el-button>
            <el-button type="warning" size="small" @click="disableVideo(scope.row)">
              禁用
            </el-button>
          </template>
          
          <!-- 禁用状态：启用、删除 -->
          <template v-else-if="scope.row.status === 'DISABLED'">
            <el-button type="success" size="small" @click="enableVideo(scope.row)" style="margin-right: 8px;">
              启用
            </el-button>
            <el-button type="danger" size="small" @click="deleteVideo(scope.row)">
              删除
            </el-button>
          </template>
          
          <!-- 已拒绝状态：重审核、删除 -->
          <template v-else-if="scope.row.status === 'REJECTED'">
            <el-button type="primary" size="small" @click="resubmitVideo(scope.row)" style="margin-right: 8px;">
              重审核
            </el-button>
            <el-button type="danger" size="small" @click="deleteVideo(scope.row)">
              删除
            </el-button>
          </template>
        </template>
      </el-table-column>
    </el-table>
    
    <!-- 分页组件 -->
    <div class="pagination-container">
      <el-pagination
        :current-page="videoCurrentPage"
        :page-size="videoPageSize"
        :page-sizes="[5, 10, 20, 50, 100]"
        :total="videoTotalCount"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="handleVideoSizeChange"
        @current-change="handleVideoCurrentChange"
      />
    </div>

    <!-- 视频管理对话框 -->
    <el-dialog 
      v-model="showVideoDialog" 
      :title="isEditVideo ? '编辑视频' : '新增视频'" 
      width="600px" 
      @closed="onVideoDialogClosed"
      :z-index="3000"
      append-to-body
    >
      <el-form :model="videoForm" :rules="videoRules" ref="videoFormRef" label-width="100px">
        <el-form-item label="视频标识" prop="mediaKey">
          <el-input v-model="videoForm.mediaKey" placeholder="请输入视频标识"></el-input>
        </el-form-item>
        <el-form-item label="文件名" prop="fileName">
          <el-input v-model="videoForm.fileName" placeholder="请输入文件名"></el-input>
        </el-form-item>
        <el-form-item label="视频文件" prop="videoFile">
          <el-upload
            :auto-upload="false"
            :limit="1"
            :on-change="handleVideoFileChange"
            :file-list="videoFileList"
            accept="video/*"
          >
            <el-button type="primary">选择视频文件</el-button>
            <template #tip>
              <div class="el-upload__tip">
                只能上传视频文件，且不超过500MB（编辑时可选）
              </div>
            </template>
          </el-upload>
        </el-form-item>
        <el-form-item label="关联章节">
          <el-select 
            v-model="videoForm.chapterKey" 
            multiple 
            filterable 
            placeholder="选择关联章节（可选）" 
            style="width: 100%"
          >
            <el-option
              v-for="chapter in availableChapters"
              :key="chapter.chapterKey"
              :label="`${chapter.name} (${chapter.chapterKey})`"
              :value="chapter.chapterKey"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="关联知识点">
          <el-select 
            v-model="videoForm.knowledgeKey" 
            multiple 
            filterable 
            placeholder="选择关联知识点（可选）" 
            style="width: 100%"
          >
            <el-option
              v-for="knowledge in availableKnowledge"
              :key="knowledge.knowledge_key"
              :label="`${knowledge.name} (${knowledge.knowledge_key})`"
              :value="knowledge.knowledge_key"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="关联标签">
          <el-select 
            v-model="videoForm.tagId" 
            multiple 
            filterable 
            placeholder="选择关联标签（可选）" 
            style="width: 100%"
          >
            <el-option
              v-for="tag in availableTags"
              :key="tag.id"
              :label="`${tag.tagContent} (${tag.id})`"
              :value="tag.id"
            />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showVideoDialog = false">取 消</el-button>
        <el-button type="primary" @click="submitVideo">确 定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted, watch, computed } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Refresh } from '@element-plus/icons-vue';
import dayjs from 'dayjs';
import { 
  getVideoList, 
  createVideo, 
  updateVideo, 
  updateVideoStatus,
  deleteVideo as deleteVideoApi,
  getChapterList,
  getKnowledgeListForVideo,
  getTagList
} from '@/api/admin/admin_resource_manage_api';

// Props
const props = defineProps({
  selectedPluginForVideo: {
    type: String,
    default: ''
  }
});

// 视频管理相关
const videoList = ref([]);
const videoSearchKeyword = ref('');
const videoStatusSearch = ref('');
const videoChapterSearch = ref([]);
const videoKnowledgeSearch = ref([]);
const videoTagSearch = ref([]);
const showVideoDialog = ref(false);
const isEditVideo = ref(false);
const videoFormRef = ref(null);
const videoForm = ref({
  id: null,
  mediaKey: '',
  fileName: '',
  videoFile: null,
  url: '',
  uploadedBy: '',
  chapterKey: [],
  knowledgeKey: [],
  tagId: []
});

// 视频分页相关
const videoCurrentPage = ref(1);
const videoPageSize = ref(10);
const videoTotalCount = ref(0);

// 关联数据
const availableChapters = ref([]);
const availableKnowledge = ref([]);
const availableTags = ref([]);

// 视频文件上传相关
const videoFileList = ref([]);

// 视频表单验证规则
const videoRules = {
  mediaKey: [{ required: true, message: '请输入视频标识', trigger: 'blur' }],
  fileName: [{ required: true, message: '请输入文件名', trigger: 'blur' }]
};

// 获取视频列表
const fetchVideos = async () => {
  try {
    console.log('fetchVideos方法被调用，开始获取视频列表...');
    
    const params = {
      page_index: videoCurrentPage.value,
      page_size: videoPageSize.value,
      status: videoStatusSearch.value || '',
      file_name: videoSearchKeyword.value || ''
    };
    
    // 添加章节筛选参数
    if (videoChapterSearch.value && videoChapterSearch.value.length > 0) {
      params.chapter_key = videoChapterSearch.value;
    }
    
    // 添加知识点筛选参数
    if (videoKnowledgeSearch.value && videoKnowledgeSearch.value.length > 0) {
      params.knowledge_key = videoKnowledgeSearch.value;
    }
    
    // 添加标签筛选参数
    if (videoTagSearch.value && videoTagSearch.value.length > 0) {
      params.tag_id = videoTagSearch.value;
    }
    
    console.log('发送视频查询参数:', params);
    
    const response = await getVideoList(params);
    console.log('收到视频响应:', response);
    
    if (response.success) {
      const result = response.data;
      videoList.value = result.records || [];
      videoTotalCount.value = result.total || 0;
      
      console.log('设置视频列表:', videoList.value);
      console.log('设置视频总记录数:', videoTotalCount.value);
    } else {
      console.error('获取视频列表失败:', response.message);
      ElMessage.error(response.message || '获取视频列表失败');
    }
  } catch (error) {
    console.error('获取视频列表异常:', error);
    ElMessage.error('获取视频列表失败');
  }
};

// 获取关联数据
const fetchRelatedData = async () => {
  try {
    // 获取章节列表
    const chapterResponse = await getChapterList({ page_index: 1, page_size: 1000, status: 'ENABLED' });
    if (chapterResponse.success) {
      availableChapters.value = chapterResponse.data.records || [];
    }
    
    // 获取知识点列表
    const knowledgeResponse = await getKnowledgeListForVideo({ page_index: 1, page_size: 1000, status: 'ENABLED' });
    if (knowledgeResponse.success) {
      availableKnowledge.value = knowledgeResponse.data.records || [];
    }
    
    // 获取标签列表
    const tagResponse = await getTagList({ page_index: 1, page_size: 1000 });
    if (tagResponse.success) {
      availableTags.value = tagResponse.data.records || [];
    }
  } catch (error) {
    console.error('获取关联数据失败:', error);
  }
};

// 工具函数
const formatDuration = (seconds) => {
  if (!seconds) return '00:00';
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  
  if (hours > 0) {
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  } else {
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
};

const formatDateTime = (dateTime) => {
  if (!dateTime) return '-';
  return dayjs(dateTime).format('YYYY-MM-DD HH:mm:ss');
};

// 视频操作
const handleVideoFileChange = (file) => {
  videoForm.value.videoFile = file.raw;
  videoFileList.value = [file];
};

const onVideoDialogClosed = () => {
  resetVideoForm();
  videoFileList.value = [];
};

const editVideo = (row) => {
  isEditVideo.value = true;
  
  // 添加调试信息，查看从后端返回的数据结构
  console.log('编辑视频 - 原始数据:', JSON.stringify(row, null, 2));
  console.log('章节数据:', row.chapter_key_name, '类型:', typeof row.chapter_key_name);
  console.log('知识点数据:', row.knowledge_key_name, '类型:', typeof row.knowledge_key_name);
  console.log('标签数据:', row.tag_id_name, '类型:', typeof row.tag_id_name);
  
  // 处理关联数据的默认值
  let chapterKeys = [];
  let knowledgeKeys = [];
  let tagIds = [];
  
  // 处理章节关联数据 - 从HashMap中提取key
  if (row.chapter_key_name && typeof row.chapter_key_name === 'object') {
    chapterKeys = Object.keys(row.chapter_key_name);
  }
  
  // 处理知识点关联数据 - 从HashMap中提取key
  if (row.knowledge_key_name && typeof row.knowledge_key_name === 'object') {
    knowledgeKeys = Object.keys(row.knowledge_key_name);
  }
  
  // 处理标签关联数据 - 从HashMap中提取key
  if (row.tag_id_name && typeof row.tag_id_name === 'object') {
    tagIds = Object.keys(row.tag_id_name);
  }
  
  console.log('处理后的数据:');
  console.log('章节Keys:', chapterKeys);
  console.log('知识点Keys:', knowledgeKeys);
  console.log('标签IDs:', tagIds);
  
  videoForm.value = {
    id: row.id,
    mediaKey: row.media_key,
    fileName: row.file_name,
    videoFile: null,
    url: row.url || '',
    uploadedBy: row.uploaded_by,
    chapterKey: chapterKeys,
    knowledgeKey: knowledgeKeys,
    tagId: tagIds
  };
  
  console.log('最终videoForm:', JSON.stringify(videoForm.value, null, 2));
  showVideoDialog.value = true;
};

const deleteVideo = async (row) => {
  try {
    await ElMessageBox.confirm('确定要删除该视频吗？', '提示', { type: 'warning' });
    await deleteVideoApi(row.id);
    ElMessage.success('删除成功');
    fetchVideos();
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除失败:', error);
      ElMessage.error('删除失败');
    }
  }
};

// 通过视频（待审核 -> 启用）
const approveVideo = async (row) => {
  try {
    await ElMessageBox.confirm('确定要通过该视频吗？', '提示', { type: 'info' });
    const formData = new FormData();
    formData.append('id', row.id);
    formData.append('mediaKey', row.media_key);
    formData.append('fileName', row.file_name);
    formData.append('status', 'ENABLED');
    
    // 添加关联数据
    if (row.chapter_key && row.chapter_key.length > 0) {
      row.chapter_key.forEach(key => {
        formData.append('chapter_key', key);
      });
    }
    
    if (row.knowledge_key && row.knowledge_key.length > 0) {
      row.knowledge_key.forEach(key => {
        formData.append('knowledge_key', key);
      });
    }
    
    if (row.tag_id && row.tag_id.length > 0) {
      row.tag_id.forEach(id => {
        formData.append('tagId', id);
      });
    }
    
    await updateVideo(formData);
    ElMessage.success('通过成功');
    fetchVideos();
  } catch (error) {
    if (error !== 'cancel') {
      console.error('通过失败:', error);
      ElMessage.error('通过失败');
    }
  }
};

// 拒绝视频（待审核 -> 已拒绝）
const rejectVideo = async (row) => {
  try {
    await ElMessageBox.confirm('确定要拒绝该视频吗？', '提示', { type: 'warning' });
    const formData = new FormData();
    formData.append('id', row.id);
    formData.append('mediaKey', row.media_key);
    formData.append('fileName', row.file_name);
    formData.append('status', 'REJECTED');
    
    // 添加关联数据
    if (row.chapter_key && row.chapter_key.length > 0) {
      row.chapter_key.forEach(key => {
        formData.append('chapter_key', key);
      });
    }
    
    if (row.knowledge_key && row.knowledge_key.length > 0) {
      row.knowledge_key.forEach(key => {
        formData.append('knowledge_key', key);
      });
    }
    
    if (row.tag_id && row.tag_id.length > 0) {
      row.tag_id.forEach(id => {
        formData.append('tagId', id);
      });
    }
    
    await updateVideo(formData);
    ElMessage.success('拒绝成功');
    fetchVideos();
  } catch (error) {
    if (error !== 'cancel') {
      console.error('拒绝失败:', error);
      ElMessage.error('拒绝失败');
    }
  }
};

// 禁用视频（启用 -> 禁用）
const disableVideo = async (row) => {
  try {
    await ElMessageBox.confirm('确定要禁用该视频吗？', '提示', { type: 'warning' });
    await updateVideoStatus(row.id, 'DISABLED');
    ElMessage.success('禁用成功');
    fetchVideos();
  } catch (error) {
    if (error !== 'cancel') {
      console.error('禁用失败:', error);
      ElMessage.error('禁用失败');
    }
  }
};

// 启用视频（禁用 -> 启用）
const enableVideo = async (row) => {
  try {
    await ElMessageBox.confirm('确定要启用该视频吗？', '提示', { type: 'info' });
    await updateVideoStatus(row.id, 'ENABLED');
    ElMessage.success('启用成功');
    fetchVideos();
  } catch (error) {
    if (error !== 'cancel') {
      console.error('启用失败:', error);
      ElMessage.error('启用失败');
    }
  }
};

// 重审核视频（已拒绝 -> 待审核）
const resubmitVideo = async (row) => {
  try {
    await ElMessageBox.confirm('确定要重新提交审核该视频吗？', '提示', { type: 'info' });
    const formData = new FormData();
    formData.append('id', row.id);
    formData.append('mediaKey', row.media_key);
    formData.append('fileName', row.file_name);
    formData.append('status', 'PENDING');
    
    // 添加关联数据
    if (row.chapter_key && row.chapter_key.length > 0) {
      row.chapter_key.forEach(key => {
        formData.append('chapter_key', key);
      });
    }
    
    if (row.knowledge_key && row.knowledge_key.length > 0) {
      row.knowledge_key.forEach(key => {
        formData.append('knowledge_key', key);
      });
    }
    
    if (row.tag_id && row.tag_id.length > 0) {
      row.tag_id.forEach(id => {
        formData.append('tagId', id);
      });
    }
    
    await updateVideo(formData);
    ElMessage.success('重新提交审核成功');
    fetchVideos();
  } catch (error) {
    if (error !== 'cancel') {
      console.error('重新提交审核失败:', error);
      ElMessage.error('重新提交审核失败');
    }
  }
};

// 预览视频
const previewVideo = (row) => {
  if (row.url) {
    // 构建正确的访问URL
    let previewUrl = row.url;
    if (!row.url.startsWith('http')) {
      // 数据库中存储的是相对路径，如 ./media/xxx.mp4 或 /media/xxx.mp4
      // 通过Vite代理访问后端静态资源
      let cleanUrl = row.url;
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

const submitVideo = async () => {
  try {
    // 新增时验证视频文件，编辑时不验证
    if (!isEditVideo.value) {
      if (!videoForm.value.videoFile) {
        ElMessage.error('请选择视频文件');
        return;
      }
    }
    
    await videoFormRef.value.validate();
    
    const formData = new FormData();
    
    // 基础信息
    formData.append('mediaKey', videoForm.value.mediaKey);
    formData.append('fileName', videoForm.value.fileName);
    
    // 只有新增时或编辑时选择了新文件才添加视频文件
    if (videoForm.value.videoFile) {
      formData.append('videoFile', videoForm.value.videoFile);
    }
    
    // 关联数据
    if (videoForm.value.chapterKey && videoForm.value.chapterKey.length > 0) {
      videoForm.value.chapterKey.forEach(key => {
        formData.append('chapter_key', key);
      });
    }
    
    if (videoForm.value.knowledgeKey && videoForm.value.knowledgeKey.length > 0) {
      videoForm.value.knowledgeKey.forEach(key => {
        formData.append('knowledge_key', key);
      });
    }
    
    if (videoForm.value.tagId && videoForm.value.tagId.length > 0) {
      videoForm.value.tagId.forEach(id => {
        formData.append('tagId', id);
      });
    }
    
    if (isEditVideo.value) {
      // 更新操作 - 添加必需的id参数
      formData.append('id', videoForm.value.id);
      await updateVideo(formData);
      ElMessage.success('更新成功');
    } else {
      // 创建操作 - 添加uploadedBy参数
      formData.append('uploadedBy', videoForm.value.uploadedBy);
      await createVideo(formData);
      ElMessage.success('创建成功');
    }
    
    showVideoDialog.value = false;
    resetVideoForm();
    fetchVideos();
  } catch (error) {
    console.error('操作失败:', error);
    ElMessage.error('操作失败');
  }
};

const resetVideoForm = () => {
  videoForm.value = {
    id: null,
    mediaKey: '',
    fileName: '',
    videoFile: null,
    url: '',
    uploadedBy: '',
    chapterKey: [],
    knowledgeKey: [],
    tagId: []
  };
  isEditVideo.value = false;
};

// 打开新增视频弹窗
const openCreateVideoDialog = () => {
  isEditVideo.value = false;
  resetVideoForm();
  // 设置默认上传者为当前用户
  videoForm.value.uploadedBy = localStorage.getItem('user_key') || '';
  showVideoDialog.value = true;
};

// 刷新视频列表
const refreshVideos = () => {
  fetchVideos();
};

// 视频分页相关方法
const handleVideoSizeChange = (val) => {
  videoPageSize.value = val;
  videoCurrentPage.value = 1;
  fetchVideos();
};

const handleVideoCurrentChange = (val) => {
  videoCurrentPage.value = val;
  fetchVideos();
};

// 监听视频筛选条件变化
watch([videoSearchKeyword, videoStatusSearch, videoChapterSearch, videoKnowledgeSearch, videoTagSearch], () => {
  videoCurrentPage.value = 1;
  fetchVideos();
});

// 组件挂载时加载数据
onMounted(() => {
  console.log('MediaManagement组件已挂载，开始加载数据...');
  fetchVideos();
  fetchRelatedData();
});

// 暴露方法给父组件
defineExpose({
  fetchVideos,
  fetchRelatedData
});
</script>

<style scoped>
.media-management {
  width: 100%;
}

.header-section {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 20px;
  flex-wrap: wrap;
  gap: 16px;
}

.header-left {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 16px;
}

.header-right {
  display: flex;
  align-items: center;
}

.pagination-container {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}

/* 确保弹窗不被侧边栏遮挡 */
:deep(.el-dialog) {
  z-index: 3000 !important;
}

:deep(.el-dialog__wrapper) {
  z-index: 3000 !important;
}

:deep(.el-overlay) {
  z-index: 2999 !important;
}

/* 标签容器样式 - 支持自动换行 */
.tag-container {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  align-items: flex-start;
  min-height: 32px;
  padding: 4px 0;
}

.tag-item {
  margin: 0 !important;
  flex-shrink: 0;
  max-width: 100%;
  word-break: break-all;
}

/* 表格行高度自适应 */
:deep(.el-table__body tr) {
  height: auto !important;
}

:deep(.el-table__body td) {
  padding: 8px 0 !important;
  vertical-align: top;
}

/* 确保标签列有足够的最小高度 */
:deep(.el-table__body .el-table__cell) {
  min-height: 40px;
}
</style>

