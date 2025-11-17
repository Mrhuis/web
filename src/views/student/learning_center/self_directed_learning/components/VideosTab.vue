<template>
  <div class="videos-tab">
    <!-- 搜索栏 -->
    <div class="header-section">
      <div class="header-left">
        <el-input 
          v-model="searchKeyword" 
          placeholder="搜索视频" 
          clearable 
          style="width: 200px; margin-right: 16px;" 
          @clear="handleSearch"
          @keyup.enter="handleSearch"
        />
        <el-select 
          v-model="chapterSearch" 
          placeholder="章节筛选" 
          clearable 
          multiple
          filterable
          style="width: 200px; margin-right: 16px;"
          @change="handleSearch"
        >
          <el-option
            v-for="chapter in availableChapters"
            :key="chapter.chapterKey"
            :label="`${chapter.name} (${chapter.chapterKey})`"
            :value="chapter.chapterKey"
          />
        </el-select>
        <el-select 
          v-model="knowledgeSearch" 
          placeholder="知识点筛选" 
          clearable 
          multiple
          filterable
          style="width: 200px; margin-right: 16px;"
          @change="handleSearch"
        >
          <el-option
            v-for="knowledge in availableKnowledge"
            :key="knowledge.knowledge_key"
            :label="`${knowledge.name} (${knowledge.knowledge_key})`"
            :value="knowledge.knowledge_key"
          />
        </el-select>
        <el-select 
          v-model="tagSearch"
          placeholder="标签筛选"
          clearable 
          multiple
          filterable
          style="width: 200px; margin-right: 16px;"
          @change="handleSearch"
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
        <el-button @click="handleRefresh" :loading="loading">
          <el-icon><Refresh /></el-icon>
          刷新
        </el-button>
      </div>
    </div>

    <!-- 加载状态 -->
    <div v-if="loading && videos.length === 0" class="loading-container">
      <el-skeleton :rows="6" animated />
    </div>

    <!-- 空状态 -->
    <div v-else-if="videos.length === 0" class="empty-container">
      <el-empty description="暂无视频" />
    </div>

    <!-- 视频列表 -->
    <div v-else class="videos-grid">
      <el-row :gutter="20">
        <el-col 
          v-for="(video, index) in videos" 
          :key="index" 
          :xs="24" 
          :sm="12" 
          :md="12" 
          :lg="8" 
          :xl="8"
        >
          <VideoCard :item="video" @click="handleVideoClick" />
        </el-col>
      </el-row>
    </div>

    <!-- 分页 -->
    <div v-if="total > 0" class="pagination-container">
      <el-pagination
        v-model:current-page="currentPage"
        v-model:page-size="pageSize"
        :page-sizes="[12, 24, 48, 96]"
        :total="total"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="handleSizeChange"
        @current-change="handlePageChange"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { ElMessage } from 'element-plus';
import { Refresh } from '@element-plus/icons-vue';
import { getVideosList } from '@/api/student/learning_center/self_directed_learning/self_directed_learning_api.js';
import { 
  getChapterList, 
  getKnowledgeListForVideo, 
  getTagList
} from '@/api/admin/admin_resource_manage_api.js';
import VideoCard from './VideoCard.vue';

const emit = defineEmits(['video-click']);

// 数据
const loading = ref(false);
const videos = ref([]);
const currentPage = ref(1);
const pageSize = ref(12);
const total = ref(0);

// 搜索筛选
const searchKeyword = ref('');
const chapterSearch = ref([]);
const knowledgeSearch = ref([]);
const tagSearch = ref([]);

// 关联数据
const availableChapters = ref([]);
const availableKnowledge = ref([]);
const availableTags = ref([]);

// 获取视频列表
const fetchVideos = async () => {
  loading.value = true;
  try {
    const params = {
      page_index: currentPage.value,
      page_size: pageSize.value,
      fileName: searchKeyword.value || '',
      status: 'ENABLED' // 只获取启用的视频
    };

    // 添加章节筛选参数
    if (chapterSearch.value && chapterSearch.value.length > 0) {
      params.chapterKey = chapterSearch.value;
    }

    // 添加知识点筛选参数
    if (knowledgeSearch.value && knowledgeSearch.value.length > 0) {
      params.knowledgeKey = knowledgeSearch.value;
    }

    // 添加标签筛选参数
    if (tagSearch.value && tagSearch.value.length > 0) {
      params.tagId = tagSearch.value;
    }

    const response = await getVideosList(params);

    if (response.success) {
      const result = response.data;
      videos.value = result.records || [];
      total.value = result.total || 0;
    } else {
      ElMessage.error(response.message || '获取视频列表失败');
      videos.value = [];
      total.value = 0;
    }
  } catch (error) {
    console.error('获取视频列表失败:', error);
    ElMessage.error('获取视频列表失败，请稍后重试');
    videos.value = [];
    total.value = 0;
  } finally {
    loading.value = false;
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

// 搜索
const handleSearch = () => {
  currentPage.value = 1;
  fetchVideos();
};

// 刷新
const handleRefresh = () => {
  fetchVideos();
};

// 分页大小改变
const handleSizeChange = (size) => {
  pageSize.value = size;
  currentPage.value = 1;
  fetchVideos();
};

// 页码改变
const handlePageChange = (page) => {
  currentPage.value = page;
  fetchVideos();
};

// 视频点击
const handleVideoClick = (video) => {
  emit('video-click', video);
};

// 初始化
onMounted(() => {
  fetchRelatedData();
  fetchVideos();
});
</script>

<style scoped>
.videos-tab {
  width: 100%;
}

.header-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding: 16px;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.header-left {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
}

.header-right {
  display: flex;
  align-items: center;
}

.loading-container,
.empty-container {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 400px;
}

.videos-grid {
  width: 100%;
  margin-bottom: 20px;
}

.pagination-container {
  display: flex;
  justify-content: center;
  padding: 20px 0;
}
</style>
